// app/(dashboard)/subscriptions/frequency/page.tsx
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Frequency Analysis — ThermoSlim' };
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, toMonthlyMrr, parseRange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { FrequencyDonut, type FreqSlice } from './FrequencyDonut';

export default async function FrequencyPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate } = parseRange(sp.from, sp.to);

  // Active subs, or subs that were active during the selected period (started before endDate, not cancelled before startDate)
  const subs = await prisma.subscription.findMany({
    where: {
      startedAt: { lte: endDate },
      OR: [
        { status: { in: ['ACTIVE', 'TRIAL'] } },
        { cancelledAt: { gte: startDate } },
      ],
    },
    select: {
      id: true,
      recurringPrice: true,
      frequency: true,
      currentBillingCycle: true,
      productMap: { select: { name: true, productLine: true } },
    },
  });

  // Group by frequency
  const freqMap = new Map<string, { count: number; totalPrice: number; totalMrr: number; avgCycle: number; cycleSum: number }>();
  for (const sub of subs) {
    const freq = sub.frequency ?? 'unknown';
    const entry = freqMap.get(freq) ?? { count: 0, totalPrice: 0, totalMrr: 0, avgCycle: 0, cycleSum: 0 };
    entry.count += 1;
    entry.totalPrice += sub.recurringPrice;
    entry.totalMrr += toMonthlyMrr(sub.recurringPrice, sub.frequency);
    entry.cycleSum += sub.currentBillingCycle;
    freqMap.set(freq, entry);
  }

  const frequencies = [...freqMap.entries()]
    .map(([freq, v]) => ({
      frequency: freq,
      label: freq === 'unknown' ? 'Unknown' : freq.replace('-', ' '),
      count: v.count,
      totalPrice: v.totalPrice,
      mrr: v.totalMrr,
      avgCycle: v.count > 0 ? (v.cycleSum / v.count).toFixed(1) : '0',
      avgPrice: v.count > 0 ? Math.round(v.totalPrice / v.count) : 0,
    }))
    .sort((a, b) => b.mrr - a.mrr);

  const totalMrr = frequencies.reduce((s, f) => s + f.mrr, 0);
  const totalSubs = subs.length;
  const topFreq = frequencies[0]?.label ?? '—';

  const donutData: FreqSlice[] = frequencies.map(f => ({
    name: f.label,
    value: f.count,
    mrr: f.mrr,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Frequency Analysis" subtitle="Subscription frequency distribution and MRR impact" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total MRR" value={fmtK(totalMrr)} />
        <KpiCard label="Active Subs" value={totalSubs.toLocaleString()} />
        <KpiCard label="Frequency Types" value={frequencies.length.toLocaleString()} />
        <KpiCard label="Top Frequency" value={topFreq} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Subscriber Distribution</h3>
          <FrequencyDonut data={donutData} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Frequency</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Subs</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">MRR</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Avg Price</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Avg Cycle</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">% MRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {frequencies.map(f => (
                  <tr key={f.frequency} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-3.5 text-gray-300 font-medium">{f.label}</td>
                    <td className="px-6 py-3.5 text-right text-gray-300 tabular-nums">{f.count}</td>
                    <td className="px-6 py-3.5 text-right text-gray-200 tabular-nums font-medium">{fmtK(f.mrr)}</td>
                    <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{fmt$(f.avgPrice)}</td>
                    <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{f.avgCycle}</td>
                    <td className="px-6 py-3.5 text-right text-gray-500 tabular-nums">{totalMrr > 0 ? ((f.mrr / totalMrr) * 100).toFixed(1) + '%' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
