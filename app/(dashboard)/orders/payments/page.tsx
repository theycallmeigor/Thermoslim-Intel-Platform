// app/(dashboard)/orders/payments/page.tsx
export const dynamic = 'force-dynamic';

import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, parseRange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { DeclineTrendChart, type DeclineDay } from './DeclineTrendChart';

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate } = parseRange(sp.from, sp.to);

  const where = { source: { in: ['SHOPIFY' as const, 'MERGED' as const] }, createdAt: { gte: startDate, lte: endDate } };

  const [totalOrders, declinedOrders, cardTypeBreakdown, paySourceBreakdown, topDeclineReasons, dailyOrders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.count({ where: { ...where, status: 'DECLINED' } }),
    prisma.order.groupBy({
      by: ['cardType'],
      where: { ...where, cardType: { not: null } },
      _count: { id: true },
      _sum: { totalPrice: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.order.groupBy({
      by: ['paySource'],
      where: { ...where, paySource: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.order.groupBy({
      by: ['declineReason'],
      where: { ...where, status: 'DECLINED', declineReason: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    // Daily totals for decline rate trend
    prisma.order.findMany({
      where,
      select: { createdAt: true, status: true },
    }),
  ]);

  const declineRate = totalOrders > 0 ? ((declinedOrders / totalOrders) * 100).toFixed(1) + '%' : '—';
  const approvalRate = totalOrders > 0 ? (((totalOrders - declinedOrders) / totalOrders) * 100).toFixed(1) + '%' : '—';

  // Build daily decline rate trend
  const dayTotals = new Map<string, { total: number; declined: number }>();
  for (const o of dailyOrders) {
    const dk = format(new Date(o.createdAt), 'MMM d');
    const entry = dayTotals.get(dk) ?? { total: 0, declined: 0 };
    entry.total += 1;
    if (o.status === 'DECLINED') entry.declined += 1;
    dayTotals.set(dk, entry);
  }
  const trendData: DeclineDay[] = [...dayTotals.entries()].map(([date, v]) => ({
    date,
    total: v.total,
    declined: v.declined,
    rate: v.total > 0 ? (v.declined / v.total) * 100 : 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Payment Health" subtitle="Decline rates, card types, and processor performance" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Transactions" value={totalOrders.toLocaleString()} />
        <KpiCard label="Declined" value={declinedOrders.toLocaleString()} />
        <KpiCard label="Decline Rate" value={declineRate} />
        <KpiCard label="Approval Rate" value={approvalRate} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Daily Decline Rate</h3>
        <DeclineTrendChart data={trendData} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Card Types */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Card Types</h3>
          <div className="space-y-2">
            {cardTypeBreakdown.map(c => (
              <div key={c.cardType ?? 'unknown'} className="flex justify-between text-xs">
                <span className="text-gray-300">{c.cardType ?? 'Unknown'}</span>
                <span className="text-gray-400 tabular-nums">{c._count.id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pay Sources */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment Methods</h3>
          <div className="space-y-2">
            {paySourceBreakdown.map(p => (
              <div key={p.paySource ?? 'unknown'} className="flex justify-between text-xs">
                <span className="text-gray-300">{p.paySource ?? 'Unknown'}</span>
                <span className="text-gray-400 tabular-nums">{p._count.id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Decline Reasons */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Top Decline Reasons</h3>
          <div className="space-y-2">
            {topDeclineReasons.map(r => (
              <div key={r.declineReason ?? 'unknown'} className="flex justify-between text-xs">
                <span className="text-gray-300 truncate max-w-[150px]">{r.declineReason ?? 'Unknown'}</span>
                <span className="text-red-400 tabular-nums">{r._count.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
