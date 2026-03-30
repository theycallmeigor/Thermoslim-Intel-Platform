// app/(dashboard)/operations/qa/page.tsx
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { fmt$, parseRange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function OrderQAPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate } = parseRange(sp.from, sp.to);

  const [
    totalOrders,
    // Orders missing product map link on any item
    unmappedItemOrders,
    // COMPLETE orders with $0 totalPrice (revenue anomaly)
    zeroPriceOrders,
    // CC orders that were NOT merged (potential duplicates)
    rawCcOrders,
    // Orders with AVS mismatch
    avsMismatch,
    // Orders with CVV mismatch
    cvvMismatch,
    // Recent ingestion errors
    recentErrors,
  ] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'COMPLETE',
        items: { some: { productMapId: null } },
      },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'COMPLETE',
        source: { in: ['SHOPIFY', 'MERGED'] },
        totalPrice: 0,
      },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        source: 'CHECKOUTCHAMP',
        status: 'COMPLETE',
      },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        avsResponse: 'N',
      },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        cvvResponse: 'N',
      },
    }),
    prisma.ingestionError.findMany({
      where: { occurredAt: { gte: startDate, lte: endDate } },
      orderBy: { occurredAt: 'desc' },
      take: 20,
      select: { id: true, source: true, errorType: true, message: true, occurredAt: true, resolved: true },
    }),
  ]);

  // Fetch sample zero-price orders for review
  const zeroPriceSamples = zeroPriceOrders > 0
    ? await prisma.order.findMany({
        where: { createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETE', source: { in: ['SHOPIFY', 'MERGED'] }, totalPrice: 0 },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, sourceOrderId: true, source: true, createdAt: true, totalPrice: true },
      })
    : [];

  const issueCount = unmappedItemOrders + zeroPriceOrders + rawCcOrders;
  const issueRate = totalOrders > 0 ? ((issueCount / totalOrders) * 100).toFixed(1) + '%' : '0%';

  return (
    <div className="space-y-6">
      <PageHeader title="Order QA" subtitle="Flags anomalies, mapping gaps, and ingestion issues" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Orders" value={totalOrders.toLocaleString()} sub={`in period`} />
        <KpiCard
          label="Issues Detected"
          value={issueCount.toLocaleString()}
          sub={`${issueRate} issue rate`}
        />
        <KpiCard label="AVS Mismatches" value={avsMismatch.toLocaleString()} />
        <KpiCard label="CVV Mismatches" value={cvvMismatch.toLocaleString()} />
      </div>

      {/* Issue summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`bg-gray-900 border rounded-xl p-5 ${unmappedItemOrders > 0 ? 'border-yellow-600/40' : 'border-gray-800'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unmapped Items</p>
              <p className="text-3xl font-bold text-white mt-1">{unmappedItemOrders}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${unmappedItemOrders > 0 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'}`}>
              {unmappedItemOrders > 0 ? 'Action needed' : 'Clean'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">COMPLETE orders with items missing a ProductMap link. Affects product-line analytics.</p>
        </div>

        <div className={`bg-gray-900 border rounded-xl p-5 ${zeroPriceOrders > 0 ? 'border-red-600/40' : 'border-gray-800'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Zero-Price Orders</p>
              <p className="text-3xl font-bold text-white mt-1">{zeroPriceOrders}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${zeroPriceOrders > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
              {zeroPriceOrders > 0 ? 'Revenue risk' : 'Clean'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">COMPLETE SHOPIFY/MERGED orders with $0 totalPrice. May suppress revenue figures.</p>
        </div>

        <div className={`bg-gray-900 border rounded-xl p-5 ${rawCcOrders > 0 ? 'border-orange-600/40' : 'border-gray-800'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Raw CC Orders</p>
              <p className="text-3xl font-bold text-white mt-1">{rawCcOrders}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${rawCcOrders > 0 ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
              {rawCcOrders > 0 ? 'Merge pending' : 'Clean'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">COMPLETE orders still in CHECKOUTCHAMP source. These should be merged with their Shopify counterpart.</p>
        </div>
      </div>

      {/* Zero-price order samples */}
      {zeroPriceSamples.length > 0 && (
        <div className="bg-gray-900 border border-red-600/30 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider">Zero-Price Orders — Sample</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Order ID</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Source</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Source Order ID</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Total</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {zeroPriceSamples.map(o => (
                <tr key={o.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3">
                    <Link href={`/orders/${o.id}`} className="text-blue-400 hover:text-blue-300 font-mono text-xs">
                      {o.id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs">{o.source}</td>
                  <td className="px-6 py-3 text-gray-400 font-mono text-xs">{o.sourceOrderId}</td>
                  <td className="px-6 py-3 text-right text-red-400 tabular-nums">{fmt$(o.totalPrice)}</td>
                  <td className="px-6 py-3 text-right text-gray-500 text-xs">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent ingestion errors */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Recent Ingestion Errors
            {recentErrors.length > 0 && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">{recentErrors.length}</span>
            )}
          </h3>
        </div>
        {recentErrors.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500 text-sm">No ingestion errors in this period</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Source</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Type</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Message</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Status</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {recentErrors.map(e => (
                <tr key={e.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3 text-gray-400 text-xs">{e.source}</td>
                  <td className="px-6 py-3 text-gray-300 text-xs font-mono">{e.errorType}</td>
                  <td className="px-6 py-3 text-gray-500 text-xs truncate max-w-[320px]">{e.message}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${e.resolved ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {e.resolved ? 'Resolved' : 'Open'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-gray-500 text-xs">
                    {new Date(e.occurredAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
