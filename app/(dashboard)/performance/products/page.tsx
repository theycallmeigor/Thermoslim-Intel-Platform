// app/(dashboard)/performance/products/page.tsx
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Products — ThermoSlim' };
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, fmtDollars, parseRange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProductChart, type ProductBar } from './ProductChart';

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate } = parseRange(sp.from, sp.to);

  const snapshots = await prisma.dailySnapshot.findMany({
    where: { date: { gte: startDate, lte: endDate }, productLine: { not: '' } },
    select: { productLine: true, totalOrders: true, totalRevenue: true, newOrders: true, recurringOrders: true, newSubscribers: true },
  });

  // Aggregate by product line
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

  const products = [...prodMap.entries()]
    .map(([name, v]) => ({ name, ...v, aov: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0 }))
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);
  const totalOrders = products.reduce((s, p) => s + p.orders, 0);
  const topProduct = products[0]?.name ?? '—';

  const chartData: ProductBar[] = products.slice(0, 8).map(p => ({ name: p.name, revenue: p.revenue, orders: p.orders }));

  return (
    <div className="space-y-6">
      <PageHeader title="Product Performance" subtitle="Revenue and orders by product line" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Revenue" value={fmtK(totalRevenue)} />
        <KpiCard label="Total Orders" value={totalOrders.toLocaleString()} />
        <KpiCard label="Product Lines" value={products.length.toLocaleString()} />
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
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Orders</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">New</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Recurring</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Revenue</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">AOV</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {products.map(p => (
                <tr key={p.name} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 text-gray-300 font-medium">{p.name}</td>
                  <td className="px-6 py-3.5 text-right text-gray-300 tabular-nums">{p.orders}</td>
                  <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{p.newOrders}</td>
                  <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{p.recurringOrders}</td>
                  <td className="px-6 py-3.5 text-right text-gray-200 tabular-nums font-medium">{fmtK(p.revenue)}</td>
                  <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{fmt$(p.aov)}</td>
                  <td className="px-6 py-3.5 text-right text-gray-500 tabular-nums">{totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) + '%' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
