// app/(dashboard)/performance/upsells/page.tsx
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, pctChange, parseRange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function UpsellsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate, prevStart, prevEnd } = parseRange(sp.from, sp.to);

  const [upsellOrders, prevUpsellOrders, upsellPaths, allOrders, prevAllOrders, aovByType] = await Promise.all([
    // Orders with upsells in period
    prisma.order.count({
      where: { hasUpsells: true, createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETE', source: { in: ['SHOPIFY', 'MERGED'] } },
    }),
    prisma.order.count({
      where: { hasUpsells: true, createdAt: { gte: prevStart, lte: prevEnd }, status: 'COMPLETE', source: { in: ['SHOPIFY', 'MERGED'] } },
    }),
    // UpsellPath records for revenue lifted
    prisma.upsellPath.findMany({
      where: { order: { createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETE' } },
      select: { upsellsAccepted: true, upsellsDeclined: true, revenueAdded: true },
    }),
    // Total orders for take rate denominator
    prisma.order.count({
      where: { createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETE', source: { in: ['SHOPIFY', 'MERGED'] } },
    }),
    prisma.order.count({
      where: { createdAt: { gte: prevStart, lte: prevEnd }, status: 'COMPLETE', source: { in: ['SHOPIFY', 'MERGED'] } },
    }),
    // AOV comparison: orders with upsell vs without
    prisma.order.groupBy({
      by: ['hasUpsells'],
      where: { createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETE', source: { in: ['SHOPIFY', 'MERGED'] } },
      _avg: { totalPrice: true },
      _count: { id: true },
      _sum: { totalPrice: true },
    }),
  ]);

  const totalRevenueAdded = upsellPaths.reduce((s, u) => s + u.revenueAdded, 0);
  const totalAccepted = upsellPaths.reduce((s, u) => s + u.upsellsAccepted, 0);
  const totalDeclined = upsellPaths.reduce((s, u) => s + u.upsellsDeclined, 0);
  const totalOffered = totalAccepted + totalDeclined;
  const acceptRate = totalOffered > 0 ? ((totalAccepted / totalOffered) * 100).toFixed(1) + '%' : '—';
  const takeRate = allOrders > 0 ? ((upsellOrders / allOrders) * 100).toFixed(1) + '%' : '—';

  const withUpsell = aovByType.find(r => r.hasUpsells === true);
  const withoutUpsell = aovByType.find(r => r.hasUpsells === false);
  const aovWith = Math.round(withUpsell?._avg?.totalPrice ?? 0);
  const aovWithout = Math.round(withoutUpsell?._avg?.totalPrice ?? 0);
  const aovLift = aovWithout > 0 ? (((aovWith - aovWithout) / aovWithout) * 100).toFixed(1) + '%' : '—';

  return (
    <div className="space-y-6">
      <PageHeader title="Upsell & AOV" subtitle="Upsell acceptance, revenue lift, and order value impact" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Upsell Revenue Added"
          value={fmtK(totalRevenueAdded)}
        />
        <KpiCard
          label="Upsell Take Rate"
          value={takeRate}
          sub={`${upsellOrders} of ${allOrders} orders`}
          change={pctChange(upsellOrders, prevUpsellOrders) ?? undefined}
          positive={upsellOrders >= prevUpsellOrders}
        />
        <KpiCard
          label="Accept Rate"
          value={acceptRate}
          sub={`${totalAccepted} accepted / ${totalOffered} offered`}
        />
        <KpiCard
          label="AOV Lift"
          value={aovLift}
          sub={`${fmt$(aovWith)} vs ${fmt$(aovWithout)} without`}
        />
      </div>

      {/* AOV comparison panel */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">AOV Comparison</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">With Upsell</div>
                <div className="text-2xl font-bold text-white mt-1">{fmt$(aovWith)}</div>
                <div className="text-xs text-gray-500 mt-0.5">{withUpsell?._count?.id ?? 0} orders</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Without Upsell</div>
                <div className="text-2xl font-bold text-gray-400 mt-1">{fmt$(aovWithout)}</div>
                <div className="text-xs text-gray-500 mt-0.5">{withoutUpsell?._count?.id ?? 0} orders</div>
              </div>
            </div>
            <div className="h-px bg-gray-800" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Lift</span>
              <span className="text-sm font-semibold text-green-400">{aovLift}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Funnel Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Offers shown</span>
              <span className="text-sm font-medium text-gray-200 tabular-nums">{totalOffered.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Accepted</span>
              <span className="text-sm font-medium text-green-400 tabular-nums">{totalAccepted.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Declined</span>
              <span className="text-sm font-medium text-red-400 tabular-nums">{totalDeclined.toLocaleString()}</span>
            </div>
            <div className="h-px bg-gray-800" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Accept rate</span>
              <span className="text-sm font-semibold text-white">{acceptRate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Revenue added</span>
              <span className="text-sm font-semibold text-white">{fmtK(totalRevenueAdded)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
