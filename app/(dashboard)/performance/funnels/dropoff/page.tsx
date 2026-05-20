export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Funnel Drop-off & Conversions — ThermoSlim' };

import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, parseRange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { FUNNEL_CONFIGS } from '@/config/funnel-config';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepData {
  name: string;
  type: string;
  reached: number;
  accepted: number;
  declined: number;
  conversionRate: number;   // accepted / reached
  dropoffFromPrev: number | null; // (prev.reached - this.reached) / prev.reached
  products: { name: string; count: number; takeRate: number }[];
}

interface UpsellDistBucket {
  count: number;       // number of upsells accepted (0, 1, 2, …)
  orders: number;      // orders in this bucket
  avgRevenueAdded: number;
}

interface ProductTakeRow {
  name: string;
  frequency: string | null;
  timesOffered: number;
  timesAccepted: number;
  takeRate: number;
  revenue: number;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FunnelDropoffPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; funnel?: string }>;
}) {
  const sp = await searchParams;
  const { startDate, endDate } = parseRange(sp.from, sp.to);

  // Default to first funnel config
  const selectedReferenceId = sp.funnel ?? FUNNEL_CONFIGS[0]?.referenceId ?? '';
  const selectedConfig = FUNNEL_CONFIGS.find(f => f.referenceId === selectedReferenceId) ?? FUNNEL_CONFIGS[0];

  // ── 1. KPIs from UpsellPath ────────────────────────────────────────────────
  const upsellPaths = await prisma.upsellPath.findMany({
    where: { order: { createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETE' } },
    select: { upsellsAccepted: true, revenueAdded: true, orderId: true },
  });

  const totalOrders = upsellPaths.length;
  const ordersWithUpsell = upsellPaths.filter(u => u.upsellsAccepted > 0).length;
  const conversionRate = totalOrders > 0 ? ordersWithUpsell / totalOrders : 0;
  const avgUpsellsAccepted = totalOrders > 0
    ? upsellPaths.reduce((s, u) => s + u.upsellsAccepted, 0) / totalOrders
    : 0;
  const avgRevenueAdded = totalOrders > 0
    ? Math.round(upsellPaths.reduce((s, u) => s + u.revenueAdded, 0) / totalOrders)
    : 0;

  // ── 2. FunnelEvent data for selected funnel ────────────────────────────────
  const funnelEvents = await prisma.funnelEvent.findMany({
    where: {
      occurredAt: { gte: startDate, lte: endDate },
      campaignId: { not: null },
    },
    select: {
      orderId: true,
      customerId: true,
      step: true,
      accepted: true,
      productMapId: true,
      productMap: { select: { name: true, frequency: true } },
    },
  });

  // Build step data from funnel config pages
  const steps: StepData[] = [];

  if (selectedConfig) {
    // Map step name → events
    const eventsByStep = new Map<string, typeof funnelEvents>();
    for (const ev of funnelEvents) {
      if (!eventsByStep.has(ev.step)) eventsByStep.set(ev.step, []);
      eventsByStep.get(ev.step)!.push(ev);
    }

    // Checkout step: unique orders that entered funnel
    // Use UpsellPath count as proxy for orders entering funnel
    const checkoutPage = selectedConfig.pages[0];
    const checkoutEvents = eventsByStep.get(checkoutPage?.name ?? 'Checkout') ?? [];
    // Fallback: use totalOrders from upsellPaths if no FunnelEvent data
    const checkoutReached = checkoutEvents.length > 0
      ? new Set(checkoutEvents.map(e => e.orderId ?? e.customerId)).size
      : totalOrders;

    let prevReached = checkoutReached;

    for (const pageConfig of selectedConfig.pages) {
      if (pageConfig.type === 'thankyou') continue;

      const events = eventsByStep.get(pageConfig.name) ?? [];
      const uniqueOrders = new Set(events.map(e => e.orderId ?? e.customerId));
      const reached = pageConfig.type === 'checkout' ? checkoutReached : uniqueOrders.size;
      const acceptedEvents = events.filter(e => e.accepted === true);
      const declinedEvents = events.filter(e => e.accepted === false);
      const accepted = new Set(acceptedEvents.map(e => e.orderId ?? e.customerId)).size;
      const declined = new Set(declinedEvents.map(e => e.orderId ?? e.customerId)).size;

      // Products accepted at this step
      const productCounts = new Map<string, { name: string; count: number }>();
      for (const ev of acceptedEvents) {
        if (!ev.productMapId) continue;
        const key = ev.productMapId;
        const name = ev.productMap?.frequency
          ? `${ev.productMap.name ?? key} (${ev.productMap.frequency})`
          : (ev.productMap?.name ?? key);
        const existing = productCounts.get(key) ?? { name, count: 0 };
        existing.count++;
        productCounts.set(key, existing);
      }

      const stepReached = pageConfig.type === 'checkout' ? checkoutReached : reached;
      const dropoffFromPrev = prevReached > 0 && pageConfig.type !== 'checkout'
        ? (prevReached - stepReached) / prevReached
        : null;

      steps.push({
        name: pageConfig.name,
        type: pageConfig.type,
        reached: stepReached,
        accepted,
        declined,
        conversionRate: stepReached > 0 ? accepted / stepReached : 0,
        dropoffFromPrev,
        products: [...productCounts.values()]
          .map(p => ({ name: p.name, count: p.count, takeRate: stepReached > 0 ? p.count / stepReached : 0 }))
          .sort((a, b) => b.count - a.count),
      });

      if (pageConfig.type !== 'checkout') prevReached = stepReached;
    }
  }

  // ── 3. Upsell acceptance distribution ─────────────────────────────────────
  const distMap = new Map<number, { orders: number; totalRevenue: number }>();
  for (const u of upsellPaths) {
    const key = Math.min(u.upsellsAccepted, 5); // bucket 5+
    const existing = distMap.get(key) ?? { orders: 0, totalRevenue: 0 };
    existing.orders++;
    existing.totalRevenue += u.revenueAdded;
    distMap.set(key, existing);
  }
  const upsellDist: UpsellDistBucket[] = Array.from({ length: 6 }, (_, i) => {
    const bucket = distMap.get(i) ?? { orders: 0, totalRevenue: 0 };
    return {
      count: i,
      orders: bucket.orders,
      avgRevenueAdded: bucket.orders > 0 ? Math.round(bucket.totalRevenue / bucket.orders) : 0,
    };
  });
  const maxDistOrders = Math.max(...upsellDist.map(d => d.orders), 1);

  // ── 4. Product take rate table (from FunnelEvents) ────────────────────────
  const productStats = new Map<string, { name: string; frequency: string | null; offered: number; accepted: number; revenue: number }>();
  for (const ev of funnelEvents) {
    if (!ev.productMapId) continue;
    const key = ev.productMapId;
    const existing = productStats.get(key) ?? {
      name: ev.productMap?.name ?? key,
      frequency: ev.productMap?.frequency ?? null,
      offered: 0,
      accepted: 0,
      revenue: 0,
    };
    existing.offered++;
    if (ev.accepted === true) existing.accepted++;
    productStats.set(key, existing);
  }
  const productTakeRates: ProductTakeRow[] = [...productStats.values()]
    .map(p => ({
      name: p.name,
      frequency: p.frequency,
      timesOffered: p.offered,
      timesAccepted: p.accepted,
      takeRate: p.offered > 0 ? p.accepted / p.offered : 0,
      revenue: 0, // FunnelEvent doesn't store price; mark as n/a
    }))
    .sort((a, b) => b.timesOffered - a.timesOffered);

  // ── Determine if FunnelEvent data exists ──────────────────────────────────
  const hasFunnelEventData = funnelEvents.length > 0;
  const maxStepReached = Math.max(...steps.map(s => s.reached), 1);

  return (
    <div className="space-y-6">
      <PageHeader title="Funnel Drop-off & Conversions" subtitle="Per-step conversion rates, drop-off analysis, and upsell distribution" />

      {/* ── Funnel Selector ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {FUNNEL_CONFIGS.map(fc => (
          <a
            key={fc.referenceId}
            href={`?funnel=${fc.referenceId}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              fc.referenceId === selectedConfig?.referenceId
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }`}
          >
            {fc.name}
          </a>
        ))}
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Orders" value={totalOrders.toLocaleString()} sub="Entered funnel (via UpsellPath)" />
        <KpiCard
          label="Conversion Rate"
          value={`${(conversionRate * 100).toFixed(1)}%`}
          sub={`${ordersWithUpsell} accepted at least 1 upsell`}
        />
        <KpiCard
          label="Avg Upsells Accepted"
          value={avgUpsellsAccepted.toFixed(2)}
          sub="Per order with UpsellPath"
        />
        <KpiCard
          label="Avg Revenue Added"
          value={fmt$(avgRevenueAdded)}
          sub="From upsells, per order"
        />
      </div>

      {/* ── Drop-off Funnel Visualization ───────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
          Drop-off Funnel — {selectedConfig?.name}
        </h3>

        {!hasFunnelEventData ? (
          <div className="py-10 text-center">
            <p className="text-gray-500 text-sm">No FunnelEvent records found for this date range.</p>
            <p className="text-gray-600 text-xs mt-1">Step-level data requires FunnelEvent ingestion to be active.</p>
          </div>
        ) : steps.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-500 text-sm">No steps matched for the selected funnel config.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {steps.map((step, idx) => {
              const reachedWidth = `${Math.round((step.reached / maxStepReached) * 100)}%`;
              const acceptedWidth = step.reached > 0
                ? `${Math.round((step.accepted / maxStepReached) * 100)}%`
                : '0%';

              return (
                <div key={step.name} className="space-y-2">
                  {/* Step header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                        step.type === 'checkout' ? 'bg-blue-900/60 text-blue-300' :
                        step.type === 'oto' ? 'bg-green-900/60 text-green-300' :
                        'bg-orange-900/60 text-orange-300'
                      }`}>
                        {step.type}
                      </span>
                      <span className="text-sm font-medium text-gray-200">{step.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 tabular-nums">
                      {step.dropoffFromPrev !== null && (
                        <span className={step.dropoffFromPrev > 0.4 ? 'text-red-400' : 'text-gray-500'}>
                          ↓ {(step.dropoffFromPrev * 100).toFixed(1)}% drop-off
                        </span>
                      )}
                      <span className="text-gray-400 font-medium">
                        {(step.conversionRate * 100).toFixed(1)}% conversion
                      </span>
                    </div>
                  </div>

                  {/* Bars */}
                  <div className="space-y-1">
                    {/* Reached bar */}
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-right text-[11px] text-gray-600">Reached</span>
                      <div className="flex-1 bg-gray-800 rounded h-5 overflow-hidden">
                        <div
                          className="h-full bg-gray-600 rounded transition-all"
                          style={{ width: reachedWidth }}
                        />
                      </div>
                      <span className="w-16 text-[11px] text-gray-400 tabular-nums">{step.reached.toLocaleString()}</span>
                    </div>
                    {/* Accepted bar */}
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-right text-[11px] text-gray-600">Accepted</span>
                      <div className="flex-1 bg-gray-800 rounded h-5 overflow-hidden">
                        <div
                          className="h-full bg-green-600 rounded transition-all"
                          style={{ width: acceptedWidth }}
                        />
                      </div>
                      <span className="w-16 text-[11px] text-green-400 tabular-nums">{step.accepted.toLocaleString()}</span>
                    </div>
                    {/* Declined bar */}
                    {step.declined > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-right text-[11px] text-gray-600">Declined</span>
                        <div className="flex-1 bg-gray-800 rounded h-5 overflow-hidden">
                          <div
                            className="h-full bg-red-900/70 rounded transition-all"
                            style={{ width: `${Math.round((step.declined / maxStepReached) * 100)}%` }}
                          />
                        </div>
                        <span className="w-16 text-[11px] text-red-400 tabular-nums">{step.declined.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Products at this step */}
                  {step.products.length > 0 && (
                    <div className="ml-[4.5rem] flex flex-wrap gap-2 mt-1">
                      {step.products.map(p => (
                        <span key={p.name} className="text-[11px] bg-gray-800/60 border border-gray-700/50 text-gray-400 rounded px-2 py-0.5">
                          {p.name}
                          <span className="text-gray-600 mx-1">·</span>
                          <span className="text-green-400">{p.count}</span>
                          <span className="text-gray-600 mx-0.5">({(p.takeRate * 100).toFixed(1)}%)</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Separator */}
                  {idx < steps.length - 1 && (
                    <div className="flex justify-center pt-1">
                      <div className="w-px h-4 bg-gray-700" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Upsell Acceptance Distribution ──────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
          Upsell Acceptance Distribution
        </h3>
        <div className="space-y-3">
          {upsellDist.map(bucket => {
            const barWidth = maxDistOrders > 0 ? `${Math.round((bucket.orders / maxDistOrders) * 100)}%` : '0%';
            return (
              <div key={bucket.count} className="flex items-center gap-3">
                <span className="w-20 text-right text-xs text-gray-500 shrink-0">
                  {bucket.count === 5 ? '5+ upsells' : `${bucket.count} upsell${bucket.count !== 1 ? 's' : ''}`}
                </span>
                <div className="flex-1 bg-gray-800 rounded h-6 overflow-hidden">
                  <div
                    className={`h-full rounded transition-all ${bucket.count === 0 ? 'bg-gray-700' : 'bg-blue-700'}`}
                    style={{ width: barWidth }}
                  />
                </div>
                <span className="w-16 text-xs text-gray-300 tabular-nums shrink-0">
                  {bucket.orders.toLocaleString()} orders
                </span>
                <span className="w-20 text-xs text-gray-500 tabular-nums shrink-0">
                  avg {fmt$(bucket.avgRevenueAdded)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Product Take Rate Table ──────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Product Take Rates
        </h3>

        {productTakeRates.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">
            No product-level data. FunnelEvent records with productMapId required.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider pb-2 pr-4">Product</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider pb-2 pr-4">Frequency</th>
                  <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider pb-2 pr-4">Offered</th>
                  <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider pb-2 pr-4">Accepted</th>
                  <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider pb-2">Take Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {productTakeRates.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-2.5 pr-4 text-gray-200">{row.name}</td>
                    <td className="py-2.5 pr-4 text-gray-500">{row.frequency ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-right text-gray-400 tabular-nums">{row.timesOffered.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-right text-green-400 tabular-nums">{row.timesAccepted.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-medium tabular-nums">
                      <span className={
                        row.takeRate >= 0.3 ? 'text-green-400' :
                        row.takeRate >= 0.15 ? 'text-yellow-400' :
                        'text-red-400'
                      }>
                        {(row.takeRate * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
