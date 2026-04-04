export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Product Mapping — ThermoSlim' };

import { prisma } from '@/lib/prisma';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function ProductMappingPage() {
  const [allMaps, totalItems, unlinkedItems, unlinkedSubs, gapRows] = await Promise.all([
    prisma.productMap.findMany({
      select: {
        id: true, name: true, productLine: true, category: true,
        ccCrmId: true, shopifyProductId: true, frequency: true, isSubscription: true,
        _count: { select: { orderItems: true } },
      },
      orderBy: { orderItems: { _count: 'desc' } },
    }),
    prisma.orderItem.count(),
    prisma.orderItem.count({ where: { productMapId: null } }),
    prisma.subscription.count({ where: { productMapId: null } }),
    prisma.orderItem.groupBy({
      by: ['ccCrmId', 'name'],
      where: { productMapId: null },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 50,
    }),
  ]);

  const linkedItems = totalItems - unlinkedItems;
  const linkRate = totalItems > 0 ? Math.round((linkedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Product Mapping" subtitle="Audit product mapping coverage and identify gaps" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="ProductMap Entries" value={allMaps.length.toLocaleString()} />
        <KpiCard label="Linked Items" value={`${linkRate}%`} />
        <KpiCard label="Unlinked Items" value={unlinkedItems.toLocaleString()} />
        <KpiCard label="Unlinked Subs" value={unlinkedSubs.toLocaleString()} />
      </div>

      {/* Product Map Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">All Product Maps</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Name</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Product Line</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Category</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">CC CRM ID</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Shopify ID</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Frequency</th>
                <th className="px-4 py-3 text-center text-xs text-gray-500 uppercase tracking-wider font-medium">Sub?</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Linked Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {allMaps.map(pm => (
                <tr key={pm.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 text-gray-200 max-w-[250px] truncate">{pm.name}</td>
                  <td className="px-4 py-3.5 text-gray-300">{pm.productLine ?? '—'}</td>
                  <td className="px-4 py-3.5 text-gray-400">{pm.category ?? '—'}</td>
                  <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{pm.ccCrmId ?? '—'}</td>
                  <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{pm.shopifyProductId ? pm.shopifyProductId.slice(0, 12) + '…' : '—'}</td>
                  <td className="px-4 py-3.5 text-gray-400">{pm.frequency ?? '—'}</td>
                  <td className="px-4 py-3.5 text-center">{pm.isSubscription ? '✓' : '—'}</td>
                  <td className="px-4 py-3.5 text-right text-gray-300 tabular-nums">{pm._count.orderItems}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gaps Table */}
      {gapRows.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider">Unmapped Products</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">CC CRM ID</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Product Name</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Unlinked Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {gapRows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-3.5 text-gray-400 font-mono text-xs">{row.ccCrmId ?? '—'}</td>
                    <td className="px-6 py-3.5 text-gray-300">{row.name ?? 'Unknown'}</td>
                    <td className="px-6 py-3.5 text-right text-yellow-400 tabular-nums font-medium">{row._count.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
