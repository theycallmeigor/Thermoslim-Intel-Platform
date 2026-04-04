// app/(dashboard)/performance/products/page.tsx
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Products — ThermoSlim' };
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, parseRange, toMonthlyMrr } from '@/lib/dashboard/formatting';
import { getTrialExpectedPrices } from '@/lib/dashboard/trial-prices';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProductChart, type ProductBar } from './ProductChart';

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate } = parseRange(sp.from, sp.to);

  // Revenue data from DailySnapshot
  const snapshots = await prisma.dailySnapshot.findMany({
    where: { date: { gte: startDate, lte: endDate }, productLine: { not: '' } },
    select: { productLine: true, totalOrders: true, totalRevenue: true, newOrders: true, recurringOrders: true, newSubscribers: true },
  });

  // Active subscriptions per product
  const activeSubs = await prisma.subscription.findMany({
    where: { status: { in: ['ACTIVE', 'TRIAL'] } },
    select: { recurringPrice: true, frequency: true, productMapId: true,
      productMap: { select: { productLine: true } } },
  });
  const trialPrices = await getTrialExpectedPrices();

  // Aggregate subs by productLine
  const subsByProduct = new Map<string, { count: number; mrr: number; trials: number }>();
  for (const sub of activeSubs) {
    const pl = sub.productMap?.productLine ?? 'Unlinked';
    const entry = subsByProduct.get(pl) ?? { count: 0, mrr: 0, trials: 0 };
    entry.count++;
    const expected = sub.productMapId ? trialPrices.get(sub.productMapId) : undefined;
    entry.mrr += toMonthlyMrr(sub.recurringPrice, sub.frequency, expected);
    if (sub.recurringPrice === 0) entry.trials++;
    subsByProduct.set(pl, entry);
  }

  // Aggregate snapshots by product line
  const prodMap = new Map<string, { orders: number; revenue: number; newOrders: number; recurringOrders: number; newSubs: number }>();
  for (const s of snapshots) {
    if (!s.productLine) continue;
    const entry = prodMap.get(s.productLine) ?? { orders: 0, revenue: 0, newOrders: 0, recurringOrders: 0, newSubs: 0 };
    entry.orders += s.totalOrders;
    entry.revenue += s.totalRevenue;
    entry.newOrders += s.newOrders;
    entry.recurringOrders += s.recurringOrders;
    entry.newSubs += s.newSubscribers;
    prodMap.set(s.productLine, entry);
  }

  // Combine into product rows
  const allProductLines = new Set([...prodMap.keys(), ...subsByProduct.keys()]);
  const products = [...allProductLines]
    .map(name => {
      const snap = prodMap.get(name) ?? { orders: 0, revenue: 0, newOrders: 0, recurringOrders: 0, newSubs: 0 };
      const subs = subsByProduct.get(name) ?? { count: 0, mrr: 0, trials: 0 };
      return {
        name,
        ...snap,
        activeSubs: subs.count,
        mrr: subs.mrr,
        trials: subs.trials,
        aov: snap.orders > 0 ? Math.round(snap.revenue / snap.orders) : 0,
      };
    })
    .filter(p => p.name !== 'Unlinked')
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);
  const totalOrders = products.reduce((s, p) => s + p.orders, 0);
  const totalMrr = products.reduce((s, p) => s + p.mrr, 0);
  const totalActiveSubs = activeSubs.length;
  const topProduct = products[0]?.name ?? '—';

  const chartData: ProductBar[] = products.slice(0, 8).map(p => ({ name: p.name, revenue: p.revenue, orders: p.orders }));

  return (
    <div className="space-y-6">
      <PageHeader title="Product Performance" subtitle="Revenue, subscriptions, and MRR by product line" />

      <div className="grid grid-cols-5 gap-4">
        <KpiCard label="Total Revenue" value={fmtK(totalRevenue)} />
        <KpiCard label="Total Orders" value={totalOrders.toLocaleString()} />
        <KpiCard label="Active Subs" value={totalActiveSubs.toLocaleString()} />
        <KpiCard label="Total MRR" value={fmtK(totalMrr)} />
        <KpiCard label="Top Product" value={topProduct} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Revenue by Product Line</h3>
        <ProductChart data={chartData} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">All Products</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Product Line</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Orders</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">New</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Recurring</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Revenue</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">AOV</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Active Subs</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">MRR</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">% Rev</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {products.map(p => (
                <tr key={p.name} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 text-gray-300 font-medium">{p.name}</td>
                  <td className="px-4 py-3.5 text-right text-gray-300 tabular-nums">{p.orders}</td>
                  <td className="px-4 py-3.5 text-right text-gray-400 tabular-nums">{p.newOrders}</td>
                  <td className="px-4 py-3.5 text-right text-gray-400 tabular-nums">{p.recurringOrders}</td>
                  <td className="px-4 py-3.5 text-right text-gray-200 tabular-nums font-medium">{fmtK(p.revenue)}</td>
                  <td className="px-4 py-3.5 text-right text-gray-400 tabular-nums">{fmt$(p.aov)}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    <span className="text-blue-400">{p.activeSubs}</span>
                    {p.trials > 0 && <span className="text-yellow-500 text-xs ml-1">({p.trials} trial)</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right text-blue-400 tabular-nums font-medium">{fmtK(p.mrr)}</td>
                  <td className="px-4 py-3.5 text-right text-gray-500 tabular-nums">{totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) + '%' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
