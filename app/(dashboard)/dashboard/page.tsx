export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Dashboard — ThermoSlim' };

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { RevenueChart, type DailyRevenue } from './RevenueChart';
import { SubscriberDonut, type DonutSlice } from './SubscriberDonut';
import { SubscriberActivityChart, type SubActivityDay } from './SubscriberActivityChart';
import { subDays, format } from 'date-fns';
import { fmt$, fmtK, pctChange, parseRange, toMonthlyMrr } from '@/lib/dashboard/formatting';
import { getTrialExpectedPrices } from '@/lib/dashboard/trial-prices';
import { statusColors, getSourceLabel, getOrderType } from '@/lib/dashboard/colors';
import { calculateMrr } from '@/lib/dashboard/mrr';
import { KpiCard } from '@/components/ui/KpiCard';

// ─── Data fetching ────────────────────────────────────────────────────────────

const ORDERS_PER_PAGE = 12;

// Stable KPIs: don't depend on date range — cached for 15 minutes.
// These 8 queries account for the bulk of cold-load time on the dashboard.
const getStableKpis = unstable_cache(
  async () => {
    const [
      activeSubscriptions,
      shopifyOrders,
      ccOrders,
      shopifyRevenue,
      ccRevenue,
      activeSubsWithProduct,
      totalOrders,
    ] = await Promise.all([
      prisma.subscription.count({ where: { status: { in: ['ACTIVE', 'TRIAL'] } } }),
      prisma.order.count({ where: { source: { in: ['SHOPIFY', 'MERGED'] } } }),
      prisma.order.count({ where: { source: 'CHECKOUTCHAMP' } }),
      prisma.order.aggregate({
        where: { source: { in: ['SHOPIFY', 'MERGED'] }, status: 'COMPLETE' },
        _sum: { totalPrice: true },
      }),
      prisma.order.aggregate({
        where: { source: 'CHECKOUTCHAMP', status: 'COMPLETE' },
        _sum: { totalPrice: true },
      }),
      prisma.subscription.findMany({
        where: { status: { in: ['ACTIVE', 'TRIAL'] } },
        select: { recurringPrice: true, frequency: true, productMapId: true, startedAt: true,
          productMap: { select: { productLine: true, frequency: true } } },
      }),
      prisma.order.count({ where: { source: { in: ['SHOPIFY', 'MERGED'] } } }),
    ]);
    return { activeSubscriptions, shopifyOrders, ccOrders, shopifyRevenue, ccRevenue, activeSubsWithProduct, totalOrders };
  },
  ['dashboard-stable-kpis'],
  { revalidate: 15 * 60 }, // 15-minute cache — refreshed by background sync
);

async function getDashboardData(startDate: Date, endDate: Date, prevStart: Date, prevEnd: Date, ordersPage: number = 1) {
  // Run stable KPIs (cached) and date-range queries (live) in parallel
  const [stable, revenueResult, prevRevenueResult, topCampaigns, recentOrders, newSubsRaw, cancelledSubsRaw, shopifyOrdersForChart, subEvents] =
    await Promise.all([
      getStableKpis(),

      // Revenue: Shopify + Merged (MERGED rows carry revenue for CC orders merged onto Shopify)
      prisma.order.aggregate({
        where: { source: { in: ['SHOPIFY', 'MERGED'] }, status: 'COMPLETE', createdAt: { gte: startDate, lte: endDate } },
        _sum: { totalPrice: true },
      }),
      prisma.order.aggregate({
        where: { source: { in: ['SHOPIFY', 'MERGED'] }, status: 'COMPLETE', createdAt: { gte: prevStart, lte: prevEnd } },
        _sum: { totalPrice: true },
      }),

      // Top funnels — group by ccCustom1 (funnel name), include direct Shopify orders
      prisma.order.groupBy({
        by: ['ccCustom1'],
        where: {
          source: { in: ['SHOPIFY', 'MERGED'] },
          status: 'COMPLETE',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { totalPrice: true },
        _count: { id: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 8,
      }),

      prisma.order.findMany({
        where: { source: { in: ['SHOPIFY', 'MERGED'] } },
        take: ORDERS_PER_PAGE,
        skip: (ordersPage - 1) * ORDERS_PER_PAGE,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { email: true, firstName: true, lastName: true } } },
      }),

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

      // Subscription events for activity chart
      prisma.subscriptionEvent.findMany({
        where: { occurredAt: { gte: startDate, lte: endDate } },
        select: { eventType: true, occurredAt: true },
        orderBy: { occurredAt: 'asc' },
      }),
    ]);

  const { activeSubscriptions, shopifyOrders, ccOrders, shopifyRevenue, ccRevenue, activeSubsWithProduct, totalOrders } = stable;
  const prevActiveSubscriptions = activeSubscriptions; // stable — period comparison uses live revenue delta instead

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
  // Build frequency donut from product map data
  const freqCount = new Map<string, number>();
  for (const sub of activeSubsWithProduct) {
    const freq = sub.productMap?.frequency ?? 'Unknown';
    freqCount.set(freq, (freqCount.get(freq) ?? 0) + 1);
  }
  const freqLabels: Record<string, string> = {
    '1-month': 'Monthly',
    '3-month': 'Every 3 Mo',
    '6-month': 'Every 6 Mo',
    'Unknown': 'Unknown',
  };
  const freqSlices: DonutSlice[] = [...freqCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: freqLabels[name] ?? name, value }));

  const productLineCount = new Map<string, number>();
  for (const sub of activeSubsWithProduct) {
    const line = sub.productMap?.productLine ?? 'Unmapped';
    productLineCount.set(line, (productLineCount.get(line) ?? 0) + 1);
  }
  const productLineSlices: DonutSlice[] = Array.from(productLineCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // ─── MRR breakdown by product (centralized calculation) ──────────────────
  const { totalMrr: currMrr, byProductLine } = await calculateMrr();
  const mrrBreakdown = Array.from(byProductLine.entries())
    .map(([name, v]) => ({ name, mrr: v.mrr, count: v.count }))
    .sort((a, b) => b.mrr - a.mrr)
    .slice(0, 6);

  // ─── Pct changes ──────────────────────────────────────────────────────────
  const currRevenue = revenueResult._sum.totalPrice ?? 0;
  const prevRevenue = prevRevenueResult._sum.totalPrice ?? 0;
  // prevMrr: subs active before the period start (for period-over-period comparison)
  const trialPrices = await getTrialExpectedPrices();
  const prevMrr = activeSubsWithProduct
    .filter(s => s.startedAt < startDate)
    .reduce((sum, s) => {
      const expected = s.productMapId ? trialPrices.get(s.productMapId) : undefined;
      return sum + toMonthlyMrr(s.recurringPrice, s.frequency, expected);
    }, 0);

  // ─── Subscriber activity chart ───────────────────────────────────────────
  const additionTypes = new Set(['CREATED', 'REACTIVATED', 'RESUMED']);
  const reductionTypes = new Set(['CANCELLED', 'PAUSED', 'DECLINED']);

  // Build daily buckets
  const subActivityByDay = new Map<string, SubActivityDay>();
  for (let i = 0; i < Math.min(rangeDays, 90); i++) {
    const d = format(subDays(endDate, rangeDays - 1 - i), 'yyyy-MM-dd');
    subActivityByDay.set(d, {
      date: format(subDays(endDate, rangeDays - 1 - i), 'MMM d'),
      active: 0, new: 0, reactivated: 0, resumed: 0,
      cancelled: 0, paused: 0, declined: 0,
    });
  }

  for (const evt of subEvents) {
    const day = format(evt.occurredAt, 'yyyy-MM-dd');
    const bucket = subActivityByDay.get(day);
    if (!bucket) continue;
    if (evt.eventType === 'CREATED') bucket.new += 1;
    else if (evt.eventType === 'REACTIVATED') bucket.reactivated += 1;
    else if (evt.eventType === 'RESUMED') bucket.resumed += 1;
    else if (evt.eventType === 'CANCELLED') bucket.cancelled -= 1;
    else if (evt.eventType === 'PAUSED') bucket.paused -= 1;
    else if (evt.eventType === 'DECLINED') bucket.declined -= 1;
  }

  // Compute running active count — start from (current active - net changes in period)
  const netInPeriod = [...subActivityByDay.values()].reduce((sum, d) =>
    sum + d.new + d.reactivated + d.resumed + d.cancelled + d.paused + d.declined, 0);
  let runningActive = activeSubscriptions - netInPeriod;
  for (const day of subActivityByDay.values()) {
    runningActive += day.new + day.reactivated + day.resumed + day.cancelled + day.paused + day.declined;
    day.active = runningActive;
  }

  const subActivityData = [...subActivityByDay.values()];

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
    subActivityData,
    recentOrders,
    totalOrders,
    cancelledCount: cancelledSubsRaw.length,
    churnRate: activeSubscriptions > 0
      ? ((cancelledSubsRaw.length / activeSubscriptions) * 100).toFixed(1) + '%'
      : '—',
  };
}

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

  const maxCampaignRev = data.topCampaigns.reduce(
    (max, c) => Math.max(max, c._sum.totalPrice ?? 0), 0,
  );
  const maxMrr = data.mrrBreakdown[0]?.mrr ?? 1;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

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
          label="Churn Rate"
          value={data.churnRate}
          sub={`${data.cancelledCount} cancelled / ${data.activeSubscriptions} active`}
        />
      </div>

      {/* Revenue chart + MRR breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Revenue</h2>
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

      {/* Subscriber activity */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Subscriber Activity</h2>
        <SubscriberActivityChart data={data.subActivityData} />
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
          <h2 className="text-sm font-semibold text-white mb-4">Top Funnels</h2>
          {data.topCampaigns.length === 0 ? (
            <p className="text-gray-600 text-sm">No funnel data for this period</p>
          ) : (
            <div className="space-y-2.5">
              {data.topCampaigns.map((c, i) => {
                const rev = c._sum.totalPrice ?? 0;
                const pct = maxCampaignRev > 0 ? (rev / maxCampaignRev) * 100 : 0;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-300 truncate max-w-[55%]">
                        {c.ccCustom1 ?? 'Direct'}
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
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Type</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Customer</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Status</th>
                      <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Total</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {data.recentOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-xs">
                          <Link href={`/orders/${order.id}`} className="text-blue-400 hover:text-blue-300 transition-colors">
                            #{order.sourceOrderId.slice(-8)}
                          </Link>
                        </td>
                        <td className="px-6 py-3.5">
                          {(() => {
                            const src = getSourceLabel(order);
                            return (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${src.label === 'CC' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                {src.label}
                                {src.linked && <span className="text-emerald-400 text-[10px]" title="Linked to Shopify">↔S</span>}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-3.5">
                          {(() => {
                            const subType = getOrderType(order);
                            if (subType === 'rebill') return (
                              <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400">Rebill</span>
                            );
                            if (subType === 'subscription') return (
                              <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/10 text-cyan-400">Sub</span>
                            );
                            return <span className="text-xs text-gray-600">One-time</span>;
                          })()}
                        </td>
                        <td className="px-6 py-3.5 text-gray-200">
                          {order.customer.firstName
                            ? `${order.customer.firstName} ${order.customer.lastName ?? ''}`.trim()
                            : order.customer.email}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColors[order.status] ?? 'bg-gray-500/10 text-gray-400'}`}>
                            {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
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

