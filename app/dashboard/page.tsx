export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { Suspense } from 'react';
import SyncButton from './SyncButton';
import { RevenueChart, type DailyRevenue } from './RevenueChart';
import { SubscriberDonut, type DonutSlice } from './SubscriberDonut';
import { DateFilter } from './DateFilter';
import { subDays, startOfDay, format, startOfYear } from 'date-fns';

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseRange(from?: string, to?: string): { startDate: Date; endDate: Date; prevStart: Date; prevEnd: Date } {
  const endDate = to ? new Date(to + 'T23:59:59Z') : new Date();
  const startDate = from ? new Date(from + 'T00:00:00Z') : startOfDay(subDays(endDate, 29));
  const rangeDays = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
  const prevEnd = new Date(startDate.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - rangeDays * 86400000);
  return { startDate, endDate, prevStart, prevEnd };
}

// ─── Data fetching ────────────────────────────────────────────────────────────

const ORDERS_PER_PAGE = 12;

async function getDashboardData(startDate: Date, endDate: Date, prevStart: Date, prevEnd: Date, ordersPage: number = 1) {
  const now = new Date();

  const [
    activeSubscriptions,
    prevActiveSubscriptions,
    mrrResult,
    prevMrrResult,
    revenueResult,
    prevRevenueResult,
    shopifyOrders,
    ccOrders,
    shopifyRevenue,
    ccRevenue,
    subsByFrequency,
    subsByProductLineRaw,
    topCampaigns,
    recentOrders,
    totalOrders,
    newSubsRaw,
    cancelledSubsRaw,
    shopifyOrdersForChart,
    mrrByProduct,
  ] = await Promise.all([
    prisma.subscription.count({ where: { status: { in: ['ACTIVE', 'TRIAL'] } } }),
    prisma.subscription.count({ where: { status: { in: ['ACTIVE', 'TRIAL'] }, startedAt: { lt: startDate } } }),

    prisma.subscription.aggregate({
      where: { status: { in: ['ACTIVE', 'TRIAL'] } },
      _sum: { recurringPrice: true },
    }),
    prisma.subscription.aggregate({
      where: { status: { in: ['ACTIVE', 'TRIAL'] }, startedAt: { lt: startDate } },
      _sum: { recurringPrice: true },
    }),

    // Revenue: Shopify + Merged (MERGED rows carry revenue for CC orders merged onto Shopify)
    prisma.order.aggregate({
      where: { source: { in: ['SHOPIFY', 'MERGED'] }, status: 'COMPLETE', createdAt: { gte: startDate, lte: endDate } },
      _sum: { totalPrice: true },
    }),
    prisma.order.aggregate({
      where: { source: { in: ['SHOPIFY', 'MERGED'] }, status: 'COMPLETE', createdAt: { gte: prevStart, lte: prevEnd } },
      _sum: { totalPrice: true },
    }),

    prisma.order.count({ where: { source: { in: ['SHOPIFY', 'MERGED'] } } }),
    prisma.order.count({ where: { source: 'CHECKOUTCHAMP' } }),

    // All-time Shopify + Merged revenue (single source of truth)
    prisma.order.aggregate({
      where: { source: { in: ['SHOPIFY', 'MERGED'] }, status: 'COMPLETE' },
      _sum: { totalPrice: true },
    }),
    // CC revenue shown separately for reference (informational only, not added to totals)
    prisma.order.aggregate({
      where: { source: 'CHECKOUTCHAMP', status: 'COMPLETE' },
      _sum: { totalPrice: true },
    }),

    prisma.subscription.groupBy({
      by: ['frequency'],
      where: { status: { in: ['ACTIVE', 'TRIAL'] } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),

    prisma.subscription.findMany({
      where: { status: { in: ['ACTIVE', 'TRIAL'] } },
      include: { productMap: { select: { productLine: true } } },
    }),

    // Campaign data comes from CC and Merged orders (campaign attribution lives on CHECKOUTCHAMP and MERGED rows)
    prisma.order.groupBy({
      by: ['campaignId', 'campaignName'],
      where: {
        campaignId: { not: null },
        status: 'COMPLETE',
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { totalPrice: true },
      _count: { id: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 8,
    }),

    prisma.order.findMany({
      take: ORDERS_PER_PAGE,
      skip: (ordersPage - 1) * ORDERS_PER_PAGE,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { email: true, firstName: true, lastName: true } } },
    }),

    prisma.order.count(),

    prisma.subscription.findMany({
      where: { startedAt: { gte: startDate, lte: endDate } },
      select: { startedAt: true },
    }),
    prisma.subscription.findMany({
      where: { status: 'CANCELLED', cancelledAt: { gte: startDate, lte: endDate } },
      select: { cancelledAt: true },
    }),

    // Daily chart: Shopify + Merged orders, classified by tags
    // Tags set by CheckoutChamp: "New Sale" | "New Sale, Subscription" | "Recurring, Subscription"
    // No tags (source=web): direct online store purchase
    prisma.order.findMany({
      where: { source: { in: ['SHOPIFY', 'MERGED'] }, status: 'COMPLETE', createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true, totalPrice: true, tags: true },
    }),

    // MRR breakdown: group active subscriptions by product
    prisma.subscription.findMany({
      where: { status: { in: ['ACTIVE', 'TRIAL'] } },
      include: {
        productMap: { select: { name: true, productLine: true, frequency: true } },
      },
    }),
  ]);

  // ─── Revenue chart (4 series via Shopify tags) ───────────────────────────
  const rangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000);
  type DayBucket = { direct: number; onetime: number; newSub: number; recurring: number };
  const revenueByDay = new Map<string, DayBucket>();
  for (let i = 0; i < Math.min(rangeDays, 90); i++) {
    const d = format(subDays(endDate, rangeDays - 1 - i), 'yyyy-MM-dd');
    revenueByDay.set(d, { direct: 0, onetime: 0, newSub: 0, recurring: 0 });
  }

  for (const order of shopifyOrdersForChart) {
    const day = format(order.createdAt, 'yyyy-MM-dd');
    const entry = revenueByDay.get(day);
    if (!entry) continue;

    const tags = order.tags ?? '';
    const hasRecurring = tags.includes('Recurring');
    const hasSubscription = tags.includes('Subscription');
    const hasNewSale = tags.includes('New Sale');

    if (hasRecurring && hasSubscription) {
      entry.recurring += order.totalPrice;
    } else if (hasNewSale && hasSubscription) {
      entry.newSub += order.totalPrice;
    } else if (hasNewSale) {
      entry.onetime += order.totalPrice;
    } else {
      // No CC tags = direct online store (source=web)
      entry.direct += order.totalPrice;
    }
  }

  const revenueChartData: DailyRevenue[] = Array.from(revenueByDay.entries()).map(
    ([date, v]) => ({ date, ...v }),
  );

  // ─── Subscriber trend ─────────────────────────────────────────────────────
  const newSubsByDay = new Map<string, number>();
  const cancelsByDay = new Map<string, number>();
  for (let i = 0; i < Math.min(rangeDays, 90); i++) {
    const d = format(subDays(endDate, rangeDays - 1 - i), 'yyyy-MM-dd');
    newSubsByDay.set(d, 0);
    cancelsByDay.set(d, 0);
  }
  for (const sub of newSubsRaw) {
    const d = format(sub.startedAt, 'yyyy-MM-dd');
    if (newSubsByDay.has(d)) newSubsByDay.set(d, (newSubsByDay.get(d) ?? 0) + 1);
  }
  for (const sub of cancelledSubsRaw) {
    if (!sub.cancelledAt) continue;
    const d = format(sub.cancelledAt, 'yyyy-MM-dd');
    if (cancelsByDay.has(d)) cancelsByDay.set(d, (cancelsByDay.get(d) ?? 0) + 1);
  }

  // ─── Donuts ───────────────────────────────────────────────────────────────
  const freqSlices: DonutSlice[] = subsByFrequency.map(r => ({
    name: r.frequency ?? 'Unknown',
    value: r._count.id,
  }));

  const productLineCount = new Map<string, number>();
  for (const sub of subsByProductLineRaw) {
    const line = sub.productMap?.productLine ?? 'Unmapped';
    productLineCount.set(line, (productLineCount.get(line) ?? 0) + 1);
  }
  const productLineSlices: DonutSlice[] = Array.from(productLineCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // ─── MRR breakdown by product ─────────────────────────────────────────────
  const mrrProductMap = new Map<string, { name: string; mrr: number; count: number }>();
  for (const sub of mrrByProduct) {
    const key = sub.productMap?.name ?? sub.ccPurchaseId ?? 'Unknown';
    const existing = mrrProductMap.get(key);
    if (existing) {
      existing.mrr += sub.recurringPrice;
      existing.count += 1;
    } else {
      mrrProductMap.set(key, {
        name: sub.productMap?.name ?? 'Unknown Product',
        mrr: sub.recurringPrice,
        count: 1,
      });
    }
  }
  const mrrBreakdown = Array.from(mrrProductMap.values())
    .sort((a, b) => b.mrr - a.mrr)
    .slice(0, 6);

  // ─── Pct changes ──────────────────────────────────────────────────────────
  function pctChange(curr: number, prev: number): string | null {
    if (prev === 0) return null;
    const pct = ((curr - prev) / prev) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  }

  const currRevenue = revenueResult._sum.totalPrice ?? 0;
  const prevRevenue = prevRevenueResult._sum.totalPrice ?? 0;
  const currMrr = mrrResult._sum.recurringPrice ?? 0;
  const prevMrr = prevMrrResult._sum.recurringPrice ?? 0;

  return {
    activeSubscriptions,
    subscriptionChange: pctChange(activeSubscriptions, prevActiveSubscriptions),
    activeMrr: currMrr,
    mrrChange: pctChange(currMrr, prevMrr),
    revenue: currRevenue,
    revenueChange: pctChange(currRevenue, prevRevenue),
    shopifyOrders,
    ccOrders,
    shopifyRevenue: shopifyRevenue._sum.totalPrice ?? 0,
    ccRevenue: ccRevenue._sum.totalPrice ?? 0,
    revenueChartData,
    freqSlices,
    productLineSlices,
    mrrBreakdown,
    topCampaigns,
    recentOrders,
    totalOrders,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt$(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function fmtK(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(2)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}k`;
  return fmt$(cents);
}

const statusColors: Record<string, string> = {
  COMPLETE: 'bg-green-500/10 text-green-400',
  PENDING: 'bg-yellow-500/10 text-yellow-400',
  PARTIAL: 'bg-blue-500/10 text-blue-400',
  REFUNDED: 'bg-purple-500/10 text-purple-400',
  DECLINED: 'bg-red-500/10 text-red-400',
};

const sourceColors: Record<string, string> = {
  SHOPIFY: 'bg-emerald-500/10 text-emerald-400',
  CHECKOUTCHAMP: 'bg-blue-500/10 text-blue-400',
  MERGED: 'bg-purple-500/10 text-purple-400',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { startDate, endDate, prevStart, prevEnd } = parseRange(sp.from, sp.to);
  const fromStr = format(startDate, 'yyyy-MM-dd');
  const toStr = format(endDate, 'yyyy-MM-dd');
  const ordersPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const data = await getDashboardData(startDate, endDate, prevStart, prevEnd, ordersPage);

  const shopifyConfigured = !!(
    process.env.SHOPIFY_API_KEY &&
    process.env.SHOPIFY_ACCESS_TOKEN &&
    process.env.SHOPIFY_STORE_URL
  );
  const ccConfigured = !!(
    process.env.CC_API_URL &&
    process.env.CC_API_KEY &&
    process.env.CC_API_USERNAME
  );

  const maxCampaignRev = data.topCampaigns.reduce(
    (max, c) => Math.max(max, c._sum.totalPrice ?? 0), 0,
  );
  const maxMrr = data.mrrBreakdown[0]?.mrr ?? 1;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ThermoSlim Intelligence</h1>
          <p className="text-gray-500 text-sm mt-1">Commerce data platform</p>
        </div>
        <SyncButton />
      </div>

      {/* Connection status */}
      <div className="flex flex-wrap gap-2 items-center">
        <ConnectionBadge label="Shopify" ok={shopifyConfigured} sub={process.env.SHOPIFY_STORE_URL} />
        <ConnectionBadge label="CheckoutChamp" ok={ccConfigured} />
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
          <span className="text-xs text-gray-500">Revenue source: <span className="text-gray-300">Shopify</span> · Subscriptions: <span className="text-gray-300">CheckoutChamp</span></span>
        </div>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 flex-shrink-0">Date range:</span>
        <Suspense>
          <DateFilter from={fromStr} to={toStr} />
        </Suspense>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Subscriptions"
          value={data.activeSubscriptions.toLocaleString()}
          change={data.subscriptionChange}
          positive={!data.subscriptionChange?.startsWith('-')}
        />
        <KpiCard
          label="Active MRR"
          value={fmtK(data.activeMrr)}
          change={data.mrrChange}
          positive={!data.mrrChange?.startsWith('-')}
        />
        <KpiCard
          label="Revenue (period)"
          value={fmtK(data.revenue)}
          change={data.revenueChange}
          positive={!data.revenueChange?.startsWith('-')}
          sub={`${fromStr} → ${toStr}`}
        />
        <KpiCard
          label="Shopify Orders"
          value={data.shopifyOrders.toLocaleString()}
          sub={`CC events: ${data.ccOrders.toLocaleString()}`}
        />
      </div>

      {/* Revenue chart + MRR breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Revenue (Shopify)</h2>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>All-time: <span className="text-gray-300">{fmt$(data.shopifyRevenue)}</span></span>
              <span className="text-gray-600">CC ref: {fmt$(data.ccRevenue)}</span>
            </div>
          </div>
          <RevenueChart data={data.revenueChartData} />
        </div>

        {/* MRR by product */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-1">MRR by Product</h2>
          <p className="text-xs text-gray-500 mb-4">Active subscriptions only · per purchase ID</p>
          {data.mrrBreakdown.length === 0 ? (
            <p className="text-gray-600 text-sm">No active subscriptions</p>
          ) : (
            <div className="space-y-3">
              {data.mrrBreakdown.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 truncate max-w-[55%]">{item.name}</span>
                    <div className="flex gap-2 text-gray-500 flex-shrink-0">
                      <span>{item.count} subs</span>
                      <span className="text-white font-medium tabular-nums">{fmt$(item.mrr)}</span>
                    </div>
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.round((item.mrr / maxMrr) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-800 flex justify-between text-xs">
                <span className="text-gray-500">Total MRR</span>
                <span className="text-white font-semibold">{fmt$(data.activeMrr)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subscriber donuts + top campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Subscribers by Frequency</h2>
          <SubscriberDonut data={data.freqSlices} label="active" />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Subscribers by Product</h2>
          <SubscriberDonut data={data.productLineSlices} label="active" />
        </div>

        {/* Top campaigns */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Top Campaigns</h2>
          {data.topCampaigns.length === 0 ? (
            <p className="text-gray-600 text-sm">No campaign data for this period</p>
          ) : (
            <div className="space-y-2.5">
              {data.topCampaigns.map((c, i) => {
                const rev = c._sum.totalPrice ?? 0;
                const pct = maxCampaignRev > 0 ? (rev / maxCampaignRev) * 100 : 0;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-300 truncate max-w-[55%]">
                        {c.campaignName ?? c.campaignId ?? 'Unknown'}
                      </span>
                      <div className="flex gap-2 text-gray-500 flex-shrink-0">
                        <span>{c._count.id} orders</span>
                        <span className="text-white font-medium tabular-nums">{fmt$(rev)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      {(() => {
        const totalPages = Math.max(1, Math.ceil(data.totalOrders / ORDERS_PER_PAGE));
        const pageStart = (ordersPage - 1) * ORDERS_PER_PAGE + 1;
        const pageEnd = Math.min(ordersPage * ORDERS_PER_PAGE, data.totalOrders);
        const buildPageUrl = (p: number) => {
          const params = new URLSearchParams();
          if (sp.from) params.set('from', sp.from);
          if (sp.to) params.set('to', sp.to);
          if (p > 1) params.set('page', String(p));
          const qs = params.toString();
          return `/dashboard${qs ? `?${qs}` : ''}`;
        };
        return (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-white text-sm">Recent Orders</h2>
              <span className="text-xs text-gray-500">
                {data.totalOrders > 0 ? `${pageStart}–${pageEnd} of ${data.totalOrders.toLocaleString()}` : '0'} orders
              </span>
            </div>

            {data.recentOrders.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-gray-500 text-sm">No orders synced yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Order</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Source</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Customer</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Status</th>
                      <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Total</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {data.recentOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-xs text-gray-400">
                          #{order.sourceOrderId.slice(-8)}
                          {(order as typeof order & { shopifyOrderId?: string }).shopifyOrderId && (
                            <span className="ml-1 text-amber-500 text-[10px]">↔</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${sourceColors[order.source] ?? 'bg-gray-500/10 text-gray-400'}`}>
                            {order.source === 'CHECKOUTCHAMP' ? 'CC' : order.source === 'MERGED' ? 'Merged' : order.source}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-gray-200">
                          {order.customer.firstName
                            ? `${order.customer.firstName} ${order.customer.lastName ?? ''}`.trim()
                            : order.customer.email}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColors[order.status] ?? 'bg-gray-500/10 text-gray-400'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right text-gray-200 tabular-nums">
                          {fmt$(order.totalPrice)}
                        </td>
                        <td className="px-6 py-3.5 text-gray-400 text-xs">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-800 flex items-center justify-between">
                <a
                  href={ordersPage > 1 ? buildPageUrl(ordersPage - 1) : undefined}
                  aria-disabled={ordersPage <= 1}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    ordersPage <= 1
                      ? 'text-gray-600 cursor-default pointer-events-none'
                      : 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  ← Prev
                </a>
                <span className="text-xs text-gray-500">
                  Page {ordersPage} of {totalPages}
                </span>
                <a
                  href={ordersPage < totalPages ? buildPageUrl(ordersPage + 1) : undefined}
                  aria-disabled={ordersPage >= totalPages}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    ordersPage >= totalPages
                      ? 'text-gray-600 cursor-default pointer-events-none'
                      : 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  Next →
                </a>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ConnectionBadge({ label, ok, sub }: { label: string; ok: boolean; sub?: string }) {
  return (
    <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ok ? 'bg-green-400' : 'bg-red-400'}`} />
      <span className="text-sm text-gray-300">{label} {ok ? 'connected' : 'not configured'}</span>
      {sub && <span className="text-xs text-gray-500 font-mono">{sub}</span>}
    </div>
  );
}

function KpiCard({
  label, value, change, positive, sub,
}: {
  label: string; value: string; change?: string | null; positive?: boolean; sub?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
        {change && (
          <span className={`text-xs font-medium mb-0.5 ${positive ? 'text-green-400' : 'text-red-400'}`}>
            {change}
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}
