// app/(dashboard)/orders/refunds/page.tsx
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Refunds & Chargebacks — ThermoSlim' };
export const dynamic = 'force-dynamic';

import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, parseRange, pctChange } from '@/lib/dashboard/formatting';
import { humanizeSource, sourceColors } from '@/lib/dashboard/colors';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { RefundTrendChart, type RefundDay } from './RefundTrendChart';

export default async function RefundsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate, prevStart, prevEnd } = parseRange(sp.from, sp.to);

  const [refunds, prevRefunds, chargebacks, prevChargebacks, events, totalRevenue] = await Promise.all([
    prisma.revenueEvent.aggregate({
      where: { eventType: 'REFUND', occurredAt: { gte: startDate, lte: endDate } },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.revenueEvent.aggregate({
      where: { eventType: 'REFUND', occurredAt: { gte: prevStart, lte: prevEnd } },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.revenueEvent.aggregate({
      where: { eventType: 'CHARGEBACK', occurredAt: { gte: startDate, lte: endDate } },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.revenueEvent.aggregate({
      where: { eventType: 'CHARGEBACK', occurredAt: { gte: prevStart, lte: prevEnd } },
      _count: { id: true },
      _sum: { amount: true },
    }),
    // All refund+chargeback events for trend chart
    prisma.revenueEvent.findMany({
      where: {
        eventType: { in: ['REFUND', 'CHARGEBACK'] },
        occurredAt: { gte: startDate, lte: endDate },
      },
      select: { eventType: true, occurredAt: true, amount: true },
      orderBy: { occurredAt: 'asc' },
    }),
    // Total revenue for refund rate calculation
    prisma.revenueEvent.aggregate({
      where: { eventType: { in: ['SALE', 'REBILL'] }, occurredAt: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),
  ]);

  // Build trend data
  const dayMap = new Map<string, { refunds: number; chargebacks: number }>();
  for (const e of events) {
    const dk = format(new Date(e.occurredAt), 'MMM d');
    const entry = dayMap.get(dk) ?? { refunds: 0, chargebacks: 0 };
    if (e.eventType === 'REFUND') entry.refunds += 1;
    else entry.chargebacks += 1;
    dayMap.set(dk, entry);
  }
  const trendData: RefundDay[] = [...dayMap.entries()].map(([date, v]) => ({ date, ...v }));

  const refundAmt = refunds._sum.amount ?? 0;
  const cbAmt = chargebacks._sum.amount ?? 0;
  const totalRev = totalRevenue._sum.amount ?? 0;
  const refundRate = totalRev > 0 ? ((refundAmt / totalRev) * 100).toFixed(1) + '%' : '—';
  const cbRate = totalRev > 0 ? ((cbAmt / totalRev) * 100).toFixed(2) + '%' : '—';

  // Recent events table
  const recentEvents = await prisma.revenueEvent.findMany({
    where: {
      eventType: { in: ['REFUND', 'CHARGEBACK'] },
      occurredAt: { gte: startDate, lte: endDate },
    },
    select: {
      id: true,
      eventType: true,
      amount: true,
      source: true,
      refundReason: true,
      chargebackReasonCode: true,
      occurredAt: true,
      customer: { select: { email: true } },
    },
    orderBy: { occurredAt: 'desc' },
    take: 40,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Refunds & Chargebacks" subtitle="Money leaving the business" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Refunds" value={fmtK(refundAmt)} change={pctChange(refundAmt, prevRefunds._sum.amount ?? 0)} positive={false} sub={`${refunds._count.id} events`} />
        <KpiCard label="Chargebacks" value={fmtK(cbAmt)} change={pctChange(cbAmt, prevChargebacks._sum.amount ?? 0)} positive={false} sub={`${chargebacks._count.id} events`} />
        <KpiCard label="Refund Rate" value={refundRate} sub="refunds / gross revenue" />
        <KpiCard label="Chargeback Rate" value={cbRate} sub="chargebacks / gross revenue" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Refund & Chargeback Trend</h3>
        <RefundTrendChart data={trendData} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Events</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Date</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Type</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Customer</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Amount</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Source</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {recentEvents.map(e => (
                <tr key={e.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 text-gray-400 text-xs whitespace-nowrap">{format(new Date(e.occurredAt), 'MMM d, yyyy')}</td>
                  <td className="px-6 py-3.5">
                    <Badge label={e.eventType} colorClass={e.eventType === 'REFUND' ? 'bg-purple-500/10 text-purple-400' : 'bg-red-500/10 text-red-400'} />
                  </td>
                  <td className="px-6 py-3.5 text-gray-300 font-mono text-xs">{e.customer.email}</td>
                  <td className="px-6 py-3.5 text-right text-red-400 tabular-nums font-medium">{fmt$(e.amount)}</td>
                  <td className="px-6 py-3.5"><Badge label={humanizeSource(e.source)} colorClass={sourceColors[e.source]} /></td>
                  <td className="px-6 py-3.5 text-gray-500 text-xs truncate max-w-[200px]">{e.refundReason ?? e.chargebackReasonCode ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
