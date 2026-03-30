// app/(dashboard)/subscriptions/churn/page.tsx
export const dynamic = 'force-dynamic';

import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { parseRange, pctChange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { ChurnTrendChart, type ChurnDay } from './ChurnTrendChart';
import { CancelReasonsChart, type ReasonCount } from './CancelReasonsChart';

export default async function ChurnPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate, prevStart, prevEnd } = parseRange(sp.from, sp.to);

  const [cancelled, prevCancelled, paused, activeSubs, cancelledEvents, cancelReasons] = await Promise.all([
    // Cancelled in period
    prisma.subscription.count({
      where: { status: 'CANCELLED', cancelledAt: { gte: startDate, lte: endDate } },
    }),
    // Cancelled in previous period
    prisma.subscription.count({
      where: { status: 'CANCELLED', cancelledAt: { gte: prevStart, lte: prevEnd } },
    }),
    // Paused in period (from events)
    prisma.subscriptionEvent.count({
      where: { eventType: 'PAUSED', occurredAt: { gte: startDate, lte: endDate } },
    }),
    // Active subs (for churn rate denominator)
    prisma.subscription.count({
      where: { status: { in: ['ACTIVE', 'TRIAL'] } },
    }),
    // Daily cancel + pause events for trend chart
    prisma.subscriptionEvent.findMany({
      where: {
        eventType: { in: ['CANCELLED', 'PAUSED'] },
        occurredAt: { gte: startDate, lte: endDate },
      },
      select: { eventType: true, occurredAt: true },
      orderBy: { occurredAt: 'asc' },
    }),
    // Cancel reasons
    prisma.subscription.groupBy({
      by: ['cancelReason'],
      where: { cancelledAt: { gte: startDate, lte: endDate }, cancelReason: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ]);

  // Build trend data
  const dayMap = new Map<string, { cancelled: number; paused: number }>();
  for (const e of cancelledEvents) {
    const dk = format(new Date(e.occurredAt), 'MMM d');
    const entry = dayMap.get(dk) ?? { cancelled: 0, paused: 0 };
    if (e.eventType === 'CANCELLED') entry.cancelled += 1;
    else entry.paused += 1;
    dayMap.set(dk, entry);
  }
  const trendData: ChurnDay[] = [...dayMap.entries()].map(([date, v]) => ({ date, ...v }));

  // Build cancel reasons data
  const reasonData: ReasonCount[] = cancelReasons.map(r => ({
    reason: (r.cancelReason ?? 'Unknown').slice(0, 30),
    count: r._count.id,
  }));

  // Churn rate = cancelled in period / active subs at start
  const churnRate = activeSubs > 0 ? ((cancelled / activeSubs) * 100).toFixed(1) + '%' : '—';
  const cancelChange = pctChange(cancelled, prevCancelled);

  return (
    <div className="space-y-6">
      <PageHeader title="Churn Analytics" subtitle="Subscription cancellations and pauses" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Cancelled (Period)" value={cancelled.toLocaleString()} change={cancelChange} positive={cancelChange ? cancelChange.startsWith('-') : undefined} />
        <KpiCard label="Paused (Period)" value={paused.toLocaleString()} />
        <KpiCard label="Churn Rate" value={churnRate} sub="cancelled / active subs" />
        <KpiCard label="Active Subscribers" value={activeSubs.toLocaleString()} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Cancellation & Pause Trend</h3>
          <ChurnTrendChart data={trendData} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Top Cancel Reasons</h3>
          <CancelReasonsChart data={reasonData} />
        </div>
      </div>

      {/* Recent cancellations table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Cancellations</h3>
        </div>
        {/* Fetch inline for table to keep the Promise.all clean */}
        <RecentCancellationsTable startDate={startDate} endDate={endDate} />
      </div>
    </div>
  );
}

async function RecentCancellationsTable({ startDate, endDate }: { startDate: Date; endDate: Date }) {
  const cancellations = await prisma.subscription.findMany({
    where: { status: 'CANCELLED', cancelledAt: { gte: startDate, lte: endDate } },
    select: {
      id: true,
      cancelledAt: true,
      cancelReason: true,
      recurringPrice: true,
      frequency: true,
      currentBillingCycle: true,
      customer: { select: { email: true } },
      productMap: { select: { name: true } },
    },
    orderBy: { cancelledAt: 'desc' },
    take: 30,
  });

  const { fmt$ } = await import('@/lib/dashboard/formatting');

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Date</th>
            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Customer</th>
            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Product</th>
            <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Price</th>
            <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Cycle</th>
            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Reason</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {cancellations.map(s => (
            <tr key={s.id} className="hover:bg-gray-800/40 transition-colors">
              <td className="px-6 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                {s.cancelledAt ? format(new Date(s.cancelledAt), 'MMM d, yyyy') : '—'}
              </td>
              <td className="px-6 py-3.5 text-gray-300 font-mono text-xs">{s.customer.email}</td>
              <td className="px-6 py-3.5 text-gray-300 text-xs">{s.productMap?.name ?? '—'}</td>
              <td className="px-6 py-3.5 text-right text-gray-200 tabular-nums">{fmt$(s.recurringPrice)}</td>
              <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{s.currentBillingCycle}</td>
              <td className="px-6 py-3.5 text-gray-500 text-xs truncate max-w-[200px]">{s.cancelReason ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
