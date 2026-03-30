// app/(dashboard)/performance/attribution/page.tsx
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { fmtK, fmt$, pctChange, parseRange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function AttributionPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate, prevStart, prevEnd } = parseRange(sp.from, sp.to);

  const [attributed, prevAttributed, utmSources, utmCampaigns, sourceIds, topReferers] = await Promise.all([
    // Total attributed orders this period
    prisma.attribution.count({
      where: { order: { createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETE' } },
    }),
    prisma.attribution.count({
      where: { order: { createdAt: { gte: prevStart, lte: prevEnd }, status: 'COMPLETE' } },
    }),
    // Revenue by UTM source
    prisma.attribution.groupBy({
      by: ['utmSource'],
      where: {
        utmSource: { not: null },
        order: { createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETE' },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    // Revenue by UTM campaign
    prisma.attribution.groupBy({
      by: ['utmCampaign'],
      where: {
        utmCampaign: { not: null },
        order: { createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETE' },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    // CC sourceId breakdown (ad network tracking)
    prisma.attribution.groupBy({
      by: ['sourceId'],
      where: {
        sourceId: { not: null },
        order: { createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETE' },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    }),
    // Top HTTP referrers
    prisma.attribution.groupBy({
      by: ['httpReferer'],
      where: {
        httpReferer: { not: null },
        order: { createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETE' },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    }),
  ]);

  const totalOrders = await prisma.order.count({
    where: { createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETE', source: { in: ['SHOPIFY', 'MERGED'] } },
  });
  const attributionCoverage = totalOrders > 0 ? ((attributed / totalOrders) * 100).toFixed(1) + '%' : '—';

  return (
    <div className="space-y-6">
      <PageHeader title="Attribution" subtitle="UTM source, campaign, and referrer breakdown for completed orders" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Attributed Orders"
          value={attributed.toLocaleString()}
          change={pctChange(attributed, prevAttributed) ?? undefined}
          positive={attributed >= prevAttributed}
        />
        <KpiCard
          label="Attribution Coverage"
          value={attributionCoverage}
          sub={`${attributed} of ${totalOrders} orders`}
        />
        <KpiCard label="UTM Sources" value={utmSources.length.toLocaleString()} />
        <KpiCard label="Campaigns Tracked" value={utmCampaigns.length.toLocaleString()} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* UTM Source breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">By UTM Source</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Source</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Orders</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {utmSources.length === 0 && (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500 text-sm">No UTM data in this period</td></tr>
              )}
              {utmSources.map(r => (
                <tr key={r.utmSource} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3 text-gray-300">{r.utmSource}</td>
                  <td className="px-6 py-3 text-right text-gray-300 tabular-nums">{r._count.id}</td>
                  <td className="px-6 py-3 text-right text-gray-500 tabular-nums">
                    {attributed > 0 ? ((r._count.id / attributed) * 100).toFixed(1) + '%' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* UTM Campaign breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">By UTM Campaign</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Campaign</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Orders</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {utmCampaigns.length === 0 && (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500 text-sm">No campaign data in this period</td></tr>
              )}
              {utmCampaigns.map(r => (
                <tr key={r.utmCampaign} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3 text-gray-300 truncate max-w-[200px]">{r.utmCampaign}</td>
                  <td className="px-6 py-3 text-right text-gray-300 tabular-nums">{r._count.id}</td>
                  <td className="px-6 py-3 text-right text-gray-500 tabular-nums">
                    {attributed > 0 ? ((r._count.id / attributed) * 100).toFixed(1) + '%' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CC sourceId + referrers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">CC Source IDs</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Source ID</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {sourceIds.length === 0 && (
                <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-500 text-sm">No source ID data</td></tr>
              )}
              {sourceIds.map(r => (
                <tr key={r.sourceId} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3 text-gray-300 font-mono text-xs">{r.sourceId}</td>
                  <td className="px-6 py-3 text-right text-gray-300 tabular-nums">{r._count.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Top Referrers</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Referrer</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {topReferers.length === 0 && (
                <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-500 text-sm">No referrer data</td></tr>
              )}
              {topReferers.map(r => (
                <tr key={r.httpReferer} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3 text-gray-300 truncate max-w-[240px] font-mono text-xs">{r.httpReferer}</td>
                  <td className="px-6 py-3 text-right text-gray-300 tabular-nums">{r._count.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
