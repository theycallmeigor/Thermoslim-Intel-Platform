// app/(dashboard)/subscriptions/cohorts/page.tsx
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Cohort Retention — ThermoSlim' };
export const dynamic = 'force-dynamic';

import { format, startOfMonth, addMonths, differenceInMonths } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { fmtK, fmt$ } from '@/lib/dashboard/formatting';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { RetentionCurvesChart, type CohortCurve } from './RetentionCurvesChart';

export default async function CohortsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  // If date range provided, only include cohorts that started within that range
  // Otherwise show all cohorts (default behavior)
  const startFilter = sp.from ? { gte: new Date(sp.from + 'T00:00:00Z') } : undefined;
  const endFilter = sp.to ? { lte: new Date(sp.to + 'T23:59:59Z') } : undefined;
  const dateWhere = startFilter || endFilter ? { startedAt: { ...startFilter, ...endFilter } } : {};

  const subs = await prisma.subscription.findMany({
    where: dateWhere,
    select: {
      id: true,
      startedAt: true,
      status: true,
      cancelledAt: true,
      recurringPrice: true,
      currentBillingCycle: true,
    },
  });

  // Group subs by cohort month (startedAt month)
  const now = new Date();
  const cohortMap = new Map<string, { total: number; retained: number[]; totalRevenue: number; totalLtv: number }>();
  const maxMonths = 6;

  for (const sub of subs) {
    const cohortKey = format(startOfMonth(new Date(sub.startedAt)), 'yyyy-MM');
    const monthsSinceStart = differenceInMonths(now, new Date(sub.startedAt));
    if (monthsSinceStart < 0) continue;

    const entry = cohortMap.get(cohortKey) ?? { total: 0, retained: new Array(maxMonths + 1).fill(0), totalRevenue: 0, totalLtv: 0 };
    entry.total += 1;
    // Cumulative LTV = recurring price × billing cycles completed
    const subLtv = sub.recurringPrice * sub.currentBillingCycle;
    entry.totalRevenue += subLtv;
    entry.totalLtv += subLtv;

    // Determine which months this sub was active
    const cancelMonth = sub.cancelledAt ? differenceInMonths(new Date(sub.cancelledAt), new Date(sub.startedAt)) : Infinity;
    for (let m = 0; m <= Math.min(maxMonths, monthsSinceStart); m++) {
      if (m < cancelMonth) entry.retained[m] += 1;
    }
    cohortMap.set(cohortKey, entry);
  }

  const cohorts = [...cohortMap.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 8)
    .reverse();

  const totalSubs = subs.length;
  const activeSubs = subs.filter(s => s.status === 'ACTIVE' || s.status === 'TRIAL').length;
  const avgRetention = cohorts.length > 0
    ? (cohorts.reduce((sum, [, c]) => {
        const lastMonth = Math.min(maxMonths, c.retained.length - 1);
        return sum + (c.total > 0 ? c.retained[lastMonth] / c.total : 0);
      }, 0) / cohorts.length * 100).toFixed(0) + '%'
    : '—';

  return (
    <div className="space-y-6">
      <PageHeader title="Cohort Retention" subtitle="Monthly subscription cohort retention rates" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Subscribers" value={totalSubs.toLocaleString()} />
        <KpiCard label="Active Now" value={activeSubs.toLocaleString()} />
        <KpiCard label="Avg Retention" value={avgRetention} sub="at latest month" />
        <KpiCard label="Cohorts Tracked" value={cohorts.length.toLocaleString()} />
      </div>

      {/* Retention curves chart */}
      {(() => {
        const curveData: CohortCurve[] = cohorts.map(([key, c]) => ({
          cohort: key,
          rates: c.retained.slice(0, maxMonths + 1).map(count => c.total > 0 ? Math.round((count / c.total) * 1000) / 10 : 0),
        }));
        return (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Retention Curves</h3>
            <RetentionCurvesChart cohorts={curveData} maxMonths={maxMonths} />
          </div>
        );
      })()}

      {/* Heatmap table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Retention by Cohort Month</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-500 uppercase font-medium">Cohort</th>
                <th className="px-4 py-3 text-right text-gray-500 uppercase font-medium">Size</th>
                <th className="px-4 py-3 text-right text-gray-500 uppercase font-medium">Avg LTV</th>
                <th className="px-4 py-3 text-right text-gray-500 uppercase font-medium">Revenue</th>
                {Array.from({ length: maxMonths + 1 }, (_, i) => (
                  <th key={i} className="px-4 py-3 text-center text-gray-500 uppercase font-medium">M{i}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {cohorts.map(([key, cohort]) => (
                <tr key={key}>
                  <td className="px-4 py-3 text-gray-300 font-medium whitespace-nowrap">{key}</td>
                  <td className="px-4 py-3 text-right text-gray-400 tabular-nums">{cohort.total}</td>
                  <td className="px-4 py-3 text-right text-gray-200 tabular-nums font-medium">{fmt$(cohort.total > 0 ? Math.round(cohort.totalLtv / cohort.total) : 0)}</td>
                  <td className="px-4 py-3 text-right text-gray-300 tabular-nums">{fmtK(cohort.totalRevenue)}</td>
                  {cohort.retained.slice(0, maxMonths + 1).map((count, i) => {
                    const rate = cohort.total > 0 ? count / cohort.total : 0;
                    const pct = (rate * 100).toFixed(0);
                    // Color intensity based on retention rate
                    const bg = rate >= 0.8 ? 'bg-green-500/20' : rate >= 0.6 ? 'bg-green-500/10' : rate >= 0.4 ? 'bg-yellow-500/10' : rate >= 0.2 ? 'bg-orange-500/10' : rate > 0 ? 'bg-red-500/10' : 'bg-gray-800/30';
                    const text = rate >= 0.6 ? 'text-green-400' : rate >= 0.4 ? 'text-yellow-400' : rate >= 0.2 ? 'text-orange-400' : rate > 0 ? 'text-red-400' : 'text-gray-600';
                    return (
                      <td key={i} className={`px-4 py-3 text-center tabular-nums font-medium ${bg} ${text}`}>
                        {count > 0 ? pct + '%' : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
