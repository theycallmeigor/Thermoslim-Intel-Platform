// app/(dashboard)/performance/upsells/page.tsx
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Upsell & AOV — ThermoSlim' };
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, pctChange, parseRange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function UpsellsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate, prevStart, prevEnd } = parseRange(sp.from, sp.to);

  const baseOrderWhere = { createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETE' as any, source: { in: ['SHOPIFY', 'MERGED'] } as any };

  const [upsellPaths, prevUpsellPathCount, allOrders, aovWithUpsell, aovWithoutUpsell] = await Promise.all([
    // All UpsellPath records in this period — source of truth for all upsell KPIs
    prisma.upsellPath.findMany({
      where: { order: { createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETE' } },
      select: { upsellsAccepted: true, upsellsDeclined: true, revenueAdded: true },
    }),
    // Previous period UpsellPath count for take rate trend
    prisma.upsellPath.count({
      where: { order: { createdAt: { gte: prevStart, lte: prevEnd }, status: 'COMPLETE' } },
    }),
    // Total qualifying orders for context
    prisma.order.count({
      where: baseOrderWhere,
    }),
    // AOV for orders that have a UpsellPath row
    prisma.order.aggregate({
      where: { ...baseOrderWhere, upsellPath: { isNot: null } },
      _avg: { totalPrice: true },
      _count: { id: true },
    }),
    // AOV for orders with no UpsellPath row
    prisma.order.aggregate({
      where: { ...baseOrderWhere, upsellPath: { is: null } },
      _avg: { totalPrice: true },
      _count: { id: true },
    }),
  ]);

  const totalRevenueAdded = upsellPaths.reduce((s, u) => s + u.revenueAdded, 0);
  const totalAccepted = upsellPaths.reduce((s, u) => s + u.upsellsAccepted, 0);
  const totalDeclined = upsellPaths.reduce((s, u) => s + u.upsellsDeclined, 0);
  // totalOffered = accepted + declined; note: declined is currently 0 in all rows
  const totalOffered = totalAccepted + totalDeclined;
  const acceptRate = totalOffered > 0 ? ((totalAccepted / totalOffered) * 100).toFixed(1) + '%' : '—';
  // Take rate: UpsellPath rows where at least one upsell was accepted / total UpsellPath rows
  const totalUpsellPaths = upsellPaths.length;
  const upsellsAcceptedCount = upsellPaths.filter(u => u.upsellsAccepted > 0).length;
  const takeRate = totalUpsellPaths > 0 ? ((upsellsAcceptedCount / totalUpsellPaths) * 100).toFixed(1) + '%' : '—';

  const aovWith = Math.round(aovWithUpsell._avg?.totalPrice ?? 0);
  const aovWithout = Math.round(aovWithoutUpsell._avg?.totalPrice ?? 0);
  const aovWithCount = aovWithUpsell._count.id;
  const aovWithoutCount = aovWithoutUpsell._count.id;
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
          sub={`${upsellsAcceptedCount} of ${totalUpsellPaths} upsell orders`}
          change={pctChange(upsellsAcceptedCount, prevUpsellPathCount) ?? undefined}
          positive={upsellsAcceptedCount >= prevUpsellPathCount}
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
                <div className="text-xs text-gray-500 mt-0.5">{aovWithCount} orders</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Without Upsell</div>
                <div className="text-2xl font-bold text-gray-400 mt-1">{fmt$(aovWithout)}</div>
                <div className="text-xs text-gray-500 mt-0.5">{aovWithoutCount} orders</div>
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
