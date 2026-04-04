// app/(dashboard)/subscriptions/frequency/page.tsx
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Frequency Analysis — ThermoSlim' };
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, toMonthlyMrr } from '@/lib/dashboard/formatting';
import { getTrialExpectedPrices } from '@/lib/dashboard/trial-prices';
import { calculateMrr } from '@/lib/dashboard/mrr';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { FrequencyDonut, type FreqSlice } from './FrequencyDonut';

export default async function FrequencyPage() {
  // Only active subs — single source of truth
  const subs = await prisma.subscription.findMany({
    where: { status: { in: ['ACTIVE', 'TRIAL'] } },
    select: {
      id: true,
      recurringPrice: true,
      frequency: true,
      productMapId: true,
      currentBillingCycle: true,
      status: true,
      nextBillDate: true,
      productMap: { select: { name: true, productLine: true, frequency: true, isSubscription: true, ccCrmId: true } },
    },
  });

  const trialPrices = await getTrialExpectedPrices();
  const { totalMrr, activeCount: totalSubs, trialCount } = await calculateMrr();

  // ── KPIs ──────────────────────────────────────────────────────────────
  const avgCycle = totalSubs > 0
    ? (subs.reduce((s, sub) => s + sub.currentBillingCycle, 0) / totalSubs).toFixed(1)
    : '0';

  // ── Group by frequency ────────────────────────────────────────────────
  type FreqEntry = { count: number; mrr: number; avgPrice: number; totalPrice: number; avgCycle: number; cycleSum: number; trials: number };
  const freqMap = new Map<string, FreqEntry>();

  for (const sub of subs) {
    const freq = sub.frequency ?? 'unknown';
    const expected = sub.productMapId ? trialPrices.get(sub.productMapId) : undefined;
    const effectivePrice = sub.recurringPrice === 0 && expected ? expected : sub.recurringPrice;
    const entry = freqMap.get(freq) ?? { count: 0, mrr: 0, avgPrice: 0, totalPrice: 0, avgCycle: 0, cycleSum: 0, trials: 0 };
    entry.count++;
    entry.mrr += toMonthlyMrr(sub.recurringPrice, freq, expected);
    entry.totalPrice += effectivePrice;
    entry.cycleSum += sub.currentBillingCycle;
    if (sub.recurringPrice === 0) entry.trials++;
    freqMap.set(freq, entry);
  }

  const frequencies = [...freqMap.entries()]
    .map(([freq, v]) => ({
      frequency: freq,
      label: freq === 'unknown' ? 'Unknown' : freq.replace('-', ' '),
      count: v.count,
      mrr: v.mrr,
      avgPrice: v.count > 0 ? Math.round(v.totalPrice / v.count) : 0,
      avgCycle: v.count > 0 ? (v.cycleSum / v.count).toFixed(1) : '0',
      trials: v.trials,
      pctMrr: totalMrr > 0 ? ((v.mrr / totalMrr) * 100).toFixed(1) : '0',
    }))
    .sort((a, b) => b.mrr - a.mrr);

  const topFreq = frequencies[0]?.label ?? '—';

  const donutData: FreqSlice[] = frequencies.map(f => ({
    name: f.label,
    value: f.count,
    mrr: f.mrr,
  }));

  // ── Product × Frequency matrix ────────────────────────────────────────
  const matrixMap = new Map<string, Map<string, { count: number; mrr: number; trials: number; prices: Set<number> }>>();
  const allFrequencies = new Set<string>();

  for (const sub of subs) {
    const product = sub.productMap?.productLine ?? 'Unlinked';
    const freq = sub.frequency ?? 'unknown';
    allFrequencies.add(freq);

    if (!matrixMap.has(product)) matrixMap.set(product, new Map());
    const freqRow = matrixMap.get(product)!;
    const expected = sub.productMapId ? trialPrices.get(sub.productMapId) : undefined;
    const effectivePrice = sub.recurringPrice === 0 && expected ? expected : sub.recurringPrice;
    const cell = freqRow.get(freq) ?? { count: 0, mrr: 0, trials: 0, prices: new Set() };
    cell.count++;
    cell.mrr += toMonthlyMrr(sub.recurringPrice, freq, expected);
    if (sub.recurringPrice === 0) cell.trials++;
    cell.prices.add(effectivePrice);
    freqRow.set(freq, cell);
  }

  const freqColumns = [...allFrequencies].sort();
  const matrixRows = [...matrixMap.entries()]
    .map(([product, freqRow]) => {
      const totalCount = [...freqRow.values()].reduce((s, c) => s + c.count, 0);
      const totalMrrRow = [...freqRow.values()].reduce((s, c) => s + c.mrr, 0);
      const totalTrials = [...freqRow.values()].reduce((s, c) => s + c.trials, 0);
      return { product, freqRow, totalCount, totalMrr: totalMrrRow, totalTrials };
    })
    .sort((a, b) => b.totalMrr - a.totalMrr);

  // ── Product detail table ──────────────────────────────────────────────
  type ProductDetail = {
    productLine: string;
    count: number;
    mrr: number;
    trials: number;
    avgCycle: number;
    frequencies: Map<string, number>;
    prices: Set<number>;
  };
  const productDetails = new Map<string, ProductDetail>();

  for (const sub of subs) {
    const pl = sub.productMap?.productLine ?? 'Unlinked';
    const expected = sub.productMapId ? trialPrices.get(sub.productMapId) : undefined;
    const effectivePrice = sub.recurringPrice === 0 && expected ? expected : sub.recurringPrice;

    const detail = productDetails.get(pl) ?? {
      productLine: pl, count: 0, mrr: 0, trials: 0, avgCycle: 0,
      frequencies: new Map(), prices: new Set(),
    };
    detail.count++;
    detail.mrr += toMonthlyMrr(sub.recurringPrice, sub.frequency, expected);
    if (sub.recurringPrice === 0) detail.trials++;
    detail.avgCycle += sub.currentBillingCycle;
    detail.prices.add(effectivePrice);
    const freq = sub.frequency ?? 'unknown';
    detail.frequencies.set(freq, (detail.frequencies.get(freq) ?? 0) + 1);
    productDetails.set(pl, detail);
  }

  const productRows = [...productDetails.values()]
    .map(d => ({ ...d, avgCycle: d.count > 0 ? (d.avgCycle / d.count).toFixed(1) : '0' }))
    .sort((a, b) => b.mrr - a.mrr);

  return (
    <div className="space-y-6">
      <PageHeader title="Frequency Analysis" subtitle="Subscription frequency distribution, MRR impact, and product breakdown" />

      <div className="grid grid-cols-5 gap-4">
        <KpiCard label="Total MRR" value={fmtK(totalMrr)} />
        <KpiCard label="Active Subs" value={totalSubs.toLocaleString()} />
        <KpiCard label="Trials ($0)" value={trialCount.toLocaleString()} />
        <KpiCard label="Avg Billing Cycle" value={avgCycle} />
        <KpiCard label="Top Frequency" value={topFreq} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Subscriber Distribution</h3>
          <FrequencyDonut data={donutData} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">By Frequency</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Frequency</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Subs</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Trials</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">MRR</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Avg Price</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Avg Cycle</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">% MRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {frequencies.map(f => (
                  <tr key={f.frequency} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-3.5 text-gray-300 font-medium">{f.label}</td>
                    <td className="px-4 py-3.5 text-right text-gray-300 tabular-nums">{f.count}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      {f.trials > 0 ? <span className="text-yellow-400">{f.trials}</span> : <span className="text-gray-700">0</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-200 tabular-nums font-medium">{fmtK(f.mrr)}</td>
                    <td className="px-4 py-3.5 text-right text-gray-400 tabular-nums">{fmt$(f.avgPrice)}</td>
                    <td className="px-4 py-3.5 text-right text-gray-400 tabular-nums">{f.avgCycle}</td>
                    <td className="px-4 py-3.5 text-right text-gray-500 tabular-nums">{f.pctMrr}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Product Subscription Detail */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Product Subscription Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Product</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Active Subs</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Trials</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">MRR</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Avg Cycle</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Frequencies</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Price Points</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">% MRR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {productRows.map(p => (
                <tr key={p.productLine} className="hover:bg-gray-800/40 transition-colors align-top">
                  <td className="px-6 py-3.5 text-gray-200 font-medium">{p.productLine}</td>
                  <td className="px-4 py-3.5 text-right text-gray-300 tabular-nums">{p.count}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {p.trials > 0 ? <span className="text-yellow-400">{p.trials}</span> : <span className="text-gray-700">0</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right text-blue-400 tabular-nums font-medium">{fmtK(p.mrr)}</td>
                  <td className="px-4 py-3.5 text-right text-gray-400 tabular-nums">{p.avgCycle}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {[...p.frequencies.entries()].sort((a, b) => b[1] - a[1]).map(([freq, count]) => (
                        <span key={freq} className="text-[10px] font-medium text-purple-400 bg-purple-500/10 rounded px-1.5 py-0.5">
                          {freq.replace('-', ' ')} ({count})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {[...p.prices].filter(pr => pr > 0).sort((a, b) => a - b).map(price => (
                        <span key={price} className="text-[10px] font-mono text-gray-400 bg-gray-800 rounded px-1.5 py-0.5">
                          {fmt$(price)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right text-gray-500 tabular-nums">
                    {totalMrr > 0 ? ((p.mrr / totalMrr) * 100).toFixed(1) + '%' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product × Frequency Matrix */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Product × Frequency Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Product</th>
                {freqColumns.map(f => (
                  <th key={f} className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">
                    {f === 'unknown' ? 'Unknown' : f.replace('-', ' ')}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {matrixRows.map(row => (
                <tr key={row.product} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 text-gray-300 font-medium">{row.product}</td>
                  {freqColumns.map(f => {
                    const cell = row.freqRow.get(f);
                    return (
                      <td key={f} className="px-4 py-3.5 text-right tabular-nums">
                        {cell ? (
                          <div>
                            <span className="text-gray-300">{cell.count}</span>
                            {cell.trials > 0 && <span className="text-yellow-500 text-[10px] ml-0.5">+{cell.trials}t</span>}
                            <span className="text-gray-600 text-xs ml-1">({fmtK(cell.mrr)})</span>
                          </div>
                        ) : (
                          <span className="text-gray-700">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-6 py-3.5 text-right tabular-nums">
                    <span className="text-gray-200 font-medium">{row.totalCount}</span>
                    <span className="text-gray-500 text-xs ml-1">({fmtK(row.totalMrr)})</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
