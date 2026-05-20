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
        ccCrmId: true, shopifyProductId: true, externalId: true,
        frequency: true, isSubscription: true,
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

  // Group ProductMap entries by Shopify external ID (the master product)
  type ProductGroup = {
    shopifyProductId: string | null;
    externalId: string | null;
    productLine: string | null;
    category: string | null;
    isSubscription: boolean;
    entries: typeof allMaps;
    totalOrders: number;
  };

  const groupMap = new Map<string, ProductGroup>();

  for (const pm of allMaps) {
    // Group key: shopifyProductId or externalId, fallback to productLine
    const groupKey = pm.shopifyProductId ?? pm.externalId ?? pm.productLine ?? pm.name;

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        shopifyProductId: pm.shopifyProductId,
        externalId: pm.externalId,
        productLine: pm.productLine,
        category: pm.category,
        isSubscription: pm.isSubscription,
        entries: [],
        totalOrders: 0,
      });
    }

    const group = groupMap.get(groupKey)!;
    group.entries.push(pm);
    group.totalOrders += pm._count.orderItems;
    // Keep the most descriptive values
    if (pm.productLine) group.productLine = pm.productLine;
    if (pm.category) group.category = pm.category;
    if (pm.isSubscription) group.isSubscription = true;
  }

  const productGroups = [...groupMap.values()].sort((a, b) => b.totalOrders - a.totalOrders);

  return (
    <div className="space-y-6">
      <PageHeader title="Product Mapping" subtitle="Audit product mapping coverage — grouped by Shopify product" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Shopify Products" value={productGroups.length.toLocaleString()} />
        <KpiCard label="Linked Items" value={`${linkRate}%`} />
        <KpiCard label="Unlinked Items" value={unlinkedItems.toLocaleString()} />
        <KpiCard label="Unlinked Subs" value={unlinkedSubs.toLocaleString()} />
      </div>

      {/* Product Groups Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Products ({productGroups.length} Shopify products, {allMaps.length} total mappings)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Product Line</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Category</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Shopify ID</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">CC CRM IDs</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Variants</th>
                <th className="px-4 py-3 text-center text-xs text-gray-500 uppercase tracking-wider font-medium">Sub?</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {productGroups.map((group, i) => {
                const ccIds = group.entries
                  .map(e => e.ccCrmId)
                  .filter(Boolean)
                  .filter((v, i, a) => a.indexOf(v) === i);
                const frequencies = group.entries
                  .map(e => e.frequency)
                  .filter(Boolean)
                  .filter((v, i, a) => a.indexOf(v) === i) as string[];

                return (
                  <tr key={i} className="hover:bg-gray-800/40 transition-colors align-top">
                    <td className="px-6 py-3.5">
                      <div className="text-gray-200 font-medium">{group.productLine ?? '—'}</div>
                      <div className="text-gray-600 text-xs mt-0.5">{group.entries.length} mapping{group.entries.length !== 1 ? 's' : ''}</div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400">{group.category ?? '—'}</td>
                    <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">
                      {group.shopifyProductId ? group.shopifyProductId.slice(0, 15) + '…' : group.externalId ? group.externalId.slice(0, 15) + '…' : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {ccIds.length > 0 ? ccIds.map(id => (
                          <span key={id} className="text-[10px] font-mono text-gray-400 bg-gray-800 rounded px-1.5 py-0.5">
                            {id}
                          </span>
                        )) : <span className="text-gray-600 text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {frequencies.map(f => (
                          <span key={f} className="text-[10px] font-medium text-purple-400 bg-purple-500/10 rounded px-1.5 py-0.5">
                            {f}
                          </span>
                        ))}
                        {frequencies.length === 0 && <span className="text-gray-600 text-xs">one-time</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {group.isSubscription ? (
                        <span className="text-blue-400 text-xs font-medium">SUB</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-300 tabular-nums">{group.totalOrders}</td>
                  </tr>
                );
              })}
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
