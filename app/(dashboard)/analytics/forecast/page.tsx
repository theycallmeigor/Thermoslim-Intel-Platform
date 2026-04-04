// app/(dashboard)/analytics/forecast/page.tsx
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Revenue Forecast — ThermoSlim' };
export const dynamic = 'force-dynamic';

import { addMonths, format, startOfDay, subDays } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, toMonthlyMrr } from '@/lib/dashboard/formatting';
import { getTrialExpectedPrices } from '@/lib/dashboard/trial-prices';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function RevenueForecastPage() {
  // ── 1. Active subscriptions → MRR ────────────────────────────────────────
  const activeSubs = await prisma.subscription.findMany({
    where: { status: { in: ['ACTIVE', 'TRIAL'] } },
    select: { recurringPrice: true, frequency: true, productMapId: true },
  });
  const trialPrices = await getTrialExpectedPrices();
  const totalMrr = activeSubs.reduce((s, sub) => {
    const expected = sub.productMapId ? trialPrices.get(sub.productMapId) : undefined;
    return s + toMonthlyMrr(sub.recurringPrice, sub.frequency, expected);
  }, 0);

  const activeCount = activeSubs.length;

  // ── 2. Average subscription price (non-trial, non-zero) ──────────────────
  const pricedSubs = activeSubs.filter((s) => s.recurringPrice > 0);
  const avgSubPrice =
    pricedSubs.length > 0
      ? Math.round(pricedSubs.reduce((s, sub) => s + sub.recurringPrice, 0) / pricedSubs.length)
      : 0;

  // ── 3. Average daily new-order revenue from last 30 days (DailySnapshot) ─
  const last30Start = startOfDay(subDays(new Date(), 30));
  const last30Snapshots = await prisma.dailySnapshot.findMany({
    where: {
      date: { gte: last30Start },
      source: { in: ['SHOPIFY', 'MERGED'] },
    },
    select: { totalRevenue: true, date: true },
  });

  // Aggregate per calendar day (multiple rows per day possible from different dimensions)
  const dayMap = new Map<string, number>();
  for (const snap of last30Snapshots) {
    const key = snap.date.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + snap.totalRevenue);
  }
  const dailyRevValues = [...dayMap.values()];
  const avgDailyNewRevenue =
    dailyRevValues.length > 0
      ? Math.round(dailyRevValues.reduce((s, v) => s + v, 0) / dailyRevValues.length)
      : 0;
  const estimatedMonthlyNewRevenue = avgDailyNewRevenue * 30;

  // ── 4. Historical churn rate from SubscriptionEvent ──────────────────────
  //    Count CANCEL events in last 90 days vs average active subscribers
  const last90Start = startOfDay(subDays(new Date(), 90));
  const cancelCount = await prisma.subscriptionEvent.count({
    where: {
      eventType: 'CANCELLED',
      occurredAt: { gte: last90Start },
    },
  });
  // 3 months of data → monthly average cancel rate vs current active
  const monthlyChurnRate =
    activeCount > 0 ? Math.min(cancelCount / 3 / activeCount, 1) : 0.05;
  const churnRatePct = (monthlyChurnRate * 100).toFixed(1);
  const usedDefaultChurn = cancelCount === 0;

  // ── 5. Last 6 months actual revenue (from DailySnapshot) ─────────────────
  const hist6Start = startOfDay(subDays(new Date(), 180));
  const hist6Snaps = await prisma.dailySnapshot.findMany({
    where: {
      date: { gte: hist6Start },
      source: { in: ['SHOPIFY', 'MERGED'] },
    },
    select: { date: true, totalRevenue: true },
  });

  const histMonthMap = new Map<string, number>();
  for (const snap of hist6Snaps) {
    const key = snap.date.toISOString().slice(0, 7); // yyyy-MM
    histMonthMap.set(key, (histMonthMap.get(key) ?? 0) + snap.totalRevenue);
  }
  const histMonths = [...histMonthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, revenue]) => ({
      label: format(new Date(key + '-02'), 'MMM yyyy'),
      revenue,
      type: 'actual' as const,
    }));

  // ── 6. Next 6 months projections ─────────────────────────────────────────
  const projMonths: Array<{
    label: string;
    recurringRevenue: number;
    newSalesRevenue: number;
    churnImpact: number;
    projectedTotal: number;
    type: 'projected';
  }> = [];

  let runningActiveSubs = activeCount;
  let runningMrr = totalMrr;

  for (let i = 1; i <= 6; i++) {
    const monthDate = addMonths(new Date(), i);
    const label = format(monthDate, 'MMM yyyy');

    const recurringRevenue = runningMrr;
    const newSalesRevenue = estimatedMonthlyNewRevenue;
    const churnImpact = Math.round(runningMrr * monthlyChurnRate);
    const projectedTotal = recurringRevenue + newSalesRevenue - churnImpact;

    projMonths.push({
      label,
      recurringRevenue,
      newSalesRevenue,
      churnImpact,
      projectedTotal,
      type: 'projected',
    });

    // Apply churn for next iteration
    const subsLost = Math.round(runningActiveSubs * monthlyChurnRate);
    runningActiveSubs = Math.max(0, runningActiveSubs - subsLost);
    runningMrr = Math.max(0, runningMrr - churnImpact);
  }

  // ── KPI: projected revenue numbers ───────────────────────────────────────
  const proj30 = totalMrr + estimatedMonthlyNewRevenue - Math.round(totalMrr * monthlyChurnRate);
  const proj90 = projMonths.slice(0, 3).reduce((s, m) => s + m.projectedTotal, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Revenue Forecast" subtitle="MRR-based projection with historical trends" />

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Current MRR" value={fmtK(totalMrr)} sub="Active + Trial subs" />
        <KpiCard label="Projected 30-day" value={fmtK(proj30)} sub="MRR + new sales − churn" />
        <KpiCard label="Projected 90-day" value={fmtK(proj90)} sub="3-month cumulative" />
        <KpiCard label="Active Subscribers" value={activeCount.toLocaleString()} sub="ACTIVE + TRIAL" />
      </div>

      {/* Monthly Projection Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Monthly Revenue Projection — Next 6 Months
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Month</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Recurring Rev</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Est. New Sales</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Est. Churn</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Projected Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {projMonths.map((row) => (
                <tr key={row.label} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 text-gray-300 font-medium">{row.label}</td>
                  <td className="px-6 py-3.5 text-right text-blue-400 tabular-nums">{fmtK(row.recurringRevenue)}</td>
                  <td className="px-6 py-3.5 text-right text-green-400 tabular-nums">{fmtK(row.newSalesRevenue)}</td>
                  <td className="px-6 py-3.5 text-right text-red-400 tabular-nums">−{fmtK(row.churnImpact)}</td>
                  <td className="px-6 py-3.5 text-right tabular-nums font-semibold text-white">{fmtK(row.projectedTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical vs Projected Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Historical vs Projected Revenue
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Month</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Revenue</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {histMonths.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-6 text-center text-gray-600 text-sm">
                    No historical snapshot data in last 6 months
                  </td>
                </tr>
              )}
              {histMonths.map((row) => (
                <tr key={row.label} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 text-gray-300">{row.label}</td>
                  <td className="px-6 py-3.5 text-right tabular-nums font-medium text-gray-100">{fmtK(row.revenue)}</td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-medium">
                      Actual
                    </span>
                  </td>
                </tr>
              ))}
              {projMonths.map((row) => (
                <tr key={row.label} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 text-gray-400">{row.label}</td>
                  <td className="px-6 py-3.5 text-right tabular-nums font-medium text-gray-300">{fmtK(row.projectedTotal)}</td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                      Projected
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assumptions Panel */}
      <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl px-6 py-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Model Assumptions</h3>
        <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Churn rate (monthly)</span>
            <span className="tabular-nums text-gray-400">
              {churnRatePct}%{usedDefaultChurn ? ' (default — no cancel events found)' : ' (from last 90d)'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Avg daily new sales</span>
            <span className="tabular-nums text-gray-400">{fmtK(avgDailyNewRevenue)}/day</span>
          </div>
          <div className="flex justify-between">
            <span>Active subscribers</span>
            <span className="tabular-nums text-gray-400">{activeCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Avg subscription price</span>
            <span className="tabular-nums text-gray-400">{fmt$(avgSubPrice)}/cycle</span>
          </div>
          <div className="flex justify-between">
            <span>New sales basis</span>
            <span className="text-gray-400">30-day DailySnapshot average</span>
          </div>
          <div className="flex justify-between">
            <span>Projection model</span>
            <span className="text-gray-400">Linear MRR, constant new sales, no recovery</span>
          </div>
        </div>
      </div>
    </div>
  );
}
