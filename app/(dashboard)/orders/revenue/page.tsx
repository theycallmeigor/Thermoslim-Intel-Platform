// app/(dashboard)/orders/revenue/page.tsx
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Revenue Waterfall — ThermoSlim' };
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { addMonths, format, startOfDay, subDays } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, parseRange, toMonthlyMrr } from '@/lib/dashboard/formatting';
import { getTrialExpectedPrices } from '@/lib/dashboard/trial-prices';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';

export default async function RevenueWaterfallPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const { startDate, endDate } = parseRange(sp.from, sp.to);

  const dateFilter = { occurredAt: { gte: startDate, lte: endDate } };

  // MRR from active subscriptions
  const activeSubs = await prisma.subscription.findMany({
    where: { status: { in: ['ACTIVE', 'TRIAL'] } },
    select: { recurringPrice: true, frequency: true, productMapId: true },
  });
  const trialPrices = await getTrialExpectedPrices();
  const totalMrr = activeSubs.reduce((s, sub) => {
    const expected = sub.productMapId ? trialPrices.get(sub.productMapId) : undefined;
    return s + toMonthlyMrr(sub.recurringPrice, sub.frequency, expected);
  }, 0);

  const activeCount = activeSubs.length;

  // Forecast: avg daily new sales from last 30 days
  const last30Start = startOfDay(subDays(new Date(), 30));
  const last30Snaps = await prisma.dailySnapshot.findMany({
    where: { date: { gte: last30Start }, source: { in: ['SHOPIFY', 'MERGED'] } as any },
    select: { totalRevenue: true, date: true },
  });
  const dayRevMap = new Map<string, number>();
  for (const snap of last30Snaps) {
    const key = snap.date.toISOString().slice(0, 10);
    dayRevMap.set(key, (dayRevMap.get(key) ?? 0) + snap.totalRevenue);
  }
  const dailyRevValues = [...dayRevMap.values()];
  const avgDailyNewRevenue = dailyRevValues.length > 0
    ? Math.round(dailyRevValues.reduce((s, v) => s + v, 0) / dailyRevValues.length) : 0;

  // Churn rate from last 90 days
  const last90Start = startOfDay(subDays(new Date(), 90));
  const cancelCount = await prisma.subscriptionEvent.count({
    where: { eventType: 'CANCELLED', occurredAt: { gte: last90Start } },
  });
  const monthlyChurnRate = activeCount > 0 ? Math.min(cancelCount / 3 / activeCount, 1) : 0.05;

  // 6-month projection
  type ProjMonth = { label: string; recurring: number; newSales: number; churn: number; total: number };
  const projMonths: ProjMonth[] = [];
  let runMrr = totalMrr;
  for (let i = 1; i <= 6; i++) {
    const recurring = runMrr;
    const newSales = avgDailyNewRevenue * 30;
    const churn = Math.round(runMrr * monthlyChurnRate);
    projMonths.push({ label: format(addMonths(new Date(), i), 'MMM yyyy'), recurring, newSales, churn, total: recurring + newSales - churn });
    runMrr = Math.max(0, runMrr - churn);
  }

  // Aggregate by event type
  const byType = await prisma.revenueEvent.groupBy({
    by: ['eventType'],
    where: dateFilter,
    _count: { id: true },
    _sum: { amount: true },
  });

  const typeMap = Object.fromEntries(
    byType.map((r) => [r.eventType, { count: r._count.id, amount: r._sum.amount ?? 0 }])
  ) as Record<string, { count: number; amount: number }>;

  const saleAmt = typeMap['SALE']?.amount ?? 0;
  const rebillAmt = typeMap['REBILL']?.amount ?? 0;
  const refundAmt = typeMap['REFUND']?.amount ?? 0;
  const cbAmt = typeMap['CHARGEBACK']?.amount ?? 0;
  const voidAmt = typeMap['VOID']?.amount ?? 0;

  const grossRevenue = saleAmt + rebillAmt;
  const netRevenue = grossRevenue - refundAmt - cbAmt;

  // Monthly trend: group by month
  const allEvents = await prisma.revenueEvent.findMany({
    where: dateFilter,
    select: { eventType: true, amount: true, occurredAt: true },
    orderBy: { occurredAt: 'asc' },
  });

  type MonthBucket = {
    sales: number;
    rebills: number;
    refunds: number;
    chargebacks: number;
    net: number;
  };
  const monthMap = new Map<string, MonthBucket>();
  for (const e of allEvents) {
    const key = format(new Date(e.occurredAt), 'yyyy-MM');
    const bucket = monthMap.get(key) ?? { sales: 0, rebills: 0, refunds: 0, chargebacks: 0, net: 0 };
    if (e.eventType === 'SALE') bucket.sales += e.amount;
    else if (e.eventType === 'REBILL') bucket.rebills += e.amount;
    else if (e.eventType === 'REFUND') bucket.refunds += e.amount;
    else if (e.eventType === 'CHARGEBACK') bucket.chargebacks += e.amount;
    monthMap.set(key, bucket);
  }
  const monthRows = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, b]) => ({
      label: format(new Date(key + '-01'), 'MMM yyyy'),
      ...b,
      net: b.sales + b.rebills - b.refunds - b.chargebacks,
    }));

  // Recent refund/chargeback events
  const recentEvents = await prisma.revenueEvent.findMany({
    where: {
      ...dateFilter,
      eventType: { in: ['REFUND', 'CHARGEBACK'] },
    },
    select: {
      id: true,
      orderId: true,
      eventType: true,
      amount: true,
      refundReason: true,
      chargebackReasonCode: true,
      occurredAt: true,
    },
    orderBy: { occurredAt: 'desc' },
    take: 20,
  });

  // Waterfall bar widths — proportional to gross
  const barMax = grossRevenue || 1;
  const grossPct = 100;
  const refundPct = Math.round((refundAmt / barMax) * 100);
  const cbPct = Math.round((cbAmt / barMax) * 100);
  const netPct = Math.max(Math.round((netRevenue / barMax) * 100), 0);

  const EVENT_TYPES: Array<{ key: string; label: string }> = [
    { key: 'SALE', label: 'Sale' },
    { key: 'REBILL', label: 'Rebill' },
    { key: 'REFUND', label: 'Refund' },
    { key: 'CHARGEBACK', label: 'Chargeback' },
    { key: 'VOID', label: 'Void' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Revenue Waterfall" subtitle="Gross to net revenue breakdown" />

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-4">
        <KpiCard label="Gross Revenue" value={fmtK(grossRevenue)} sub="Sales + Rebills" />
        <KpiCard label="Refunds" value={fmtK(refundAmt)} sub={`${typeMap['REFUND']?.count ?? 0} events`} />
        <KpiCard label="Chargebacks" value={fmtK(cbAmt)} sub={`${typeMap['CHARGEBACK']?.count ?? 0} events`} />
        <KpiCard label="Net Revenue" value={fmtK(netRevenue)} sub="Gross − Refunds − Chargebacks" />
        <KpiCard label="Current MRR" value={fmtK(totalMrr)} sub="Active + Trial subs" />
      </div>

      {/* Waterfall Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">Revenue Flow</h3>
        <div className="space-y-3">
          {/* Gross Revenue */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-32 shrink-0">Gross Revenue</span>
            <div className="flex-1 h-7 bg-gray-800 rounded overflow-hidden">
              <div
                className="h-full bg-green-500/80 rounded flex items-center px-2"
                style={{ width: `${grossPct}%` }}
              >
                <span className="text-xs font-medium text-white truncate">{fmtK(grossRevenue)}</span>
              </div>
            </div>
          </div>
          {/* Refunds */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-32 shrink-0">− Refunds</span>
            <div className="flex-1 h-7 bg-gray-800 rounded overflow-hidden">
              <div
                className="h-full bg-red-500/70 rounded flex items-center px-2"
                style={{ width: `${refundPct}%` }}
              >
                {refundPct > 5 && (
                  <span className="text-xs font-medium text-white truncate">{fmtK(refundAmt)}</span>
                )}
              </div>
            </div>
            {refundPct <= 5 && (
              <span className="text-xs text-red-400 tabular-nums shrink-0">{fmtK(refundAmt)}</span>
            )}
          </div>
          {/* Chargebacks */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-32 shrink-0">− Chargebacks</span>
            <div className="flex-1 h-7 bg-gray-800 rounded overflow-hidden">
              <div
                className="h-full bg-red-700/80 rounded flex items-center px-2"
                style={{ width: `${cbPct}%` }}
              >
                {cbPct > 5 && (
                  <span className="text-xs font-medium text-white truncate">{fmtK(cbAmt)}</span>
                )}
              </div>
            </div>
            {cbPct <= 5 && (
              <span className="text-xs text-red-400 tabular-nums shrink-0">{fmtK(cbAmt)}</span>
            )}
          </div>
          {/* Net Revenue */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-32 shrink-0">= Net Revenue</span>
            <div className="flex-1 h-7 bg-gray-800 rounded overflow-hidden">
              <div
                className="h-full bg-blue-500/80 rounded flex items-center px-2"
                style={{ width: `${netPct}%` }}
              >
                <span className="text-xs font-medium text-white truncate">{fmtK(netRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue by Type Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Revenue by Type</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Type</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Count</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Amount</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">% of Gross</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {EVENT_TYPES.map(({ key, label }) => {
                const row = typeMap[key];
                const amt = row?.amount ?? 0;
                const cnt = row?.count ?? 0;
                const pct = grossRevenue > 0 ? ((amt / grossRevenue) * 100).toFixed(1) : '—';
                return (
                  <tr key={key} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <Badge
                        label={label}
                        colorClass={
                          key === 'SALE'
                            ? 'bg-green-500/10 text-green-400'
                            : key === 'REBILL'
                            ? 'bg-blue-500/10 text-blue-400'
                            : key === 'REFUND'
                            ? 'bg-red-500/10 text-red-400'
                            : key === 'CHARGEBACK'
                            ? 'bg-red-700/20 text-red-300'
                            : 'bg-gray-500/10 text-gray-400'
                        }
                      />
                    </td>
                    <td className="px-6 py-3.5 text-right text-gray-300 tabular-nums">{cnt.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums font-medium">
                      <span className={key === 'REFUND' || key === 'CHARGEBACK' || key === 'VOID' ? 'text-red-400' : 'text-gray-100'}>
                        {fmt$(amt)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">
                      {pct === '—' ? '—' : `${pct}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Revenue Trend */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Monthly Revenue Trend</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Month</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Sales</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Rebills</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Refunds</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Chargebacks</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {monthRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-600 text-sm">
                    No data in this date range
                  </td>
                </tr>
              )}
              {monthRows.map((row) => (
                <tr key={row.label} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 text-gray-300 font-medium">{row.label}</td>
                  <td className="px-6 py-3.5 text-right text-green-400 tabular-nums">{fmtK(row.sales)}</td>
                  <td className="px-6 py-3.5 text-right text-blue-400 tabular-nums">{fmtK(row.rebills)}</td>
                  <td className="px-6 py-3.5 text-right text-red-400 tabular-nums">{fmtK(row.refunds)}</td>
                  <td className="px-6 py-3.5 text-right text-red-300 tabular-nums">{fmtK(row.chargebacks)}</td>
                  <td className="px-6 py-3.5 text-right tabular-nums font-semibold">
                    <span className={row.net >= 0 ? 'text-white' : 'text-red-400'}>{fmtK(row.net)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Forecast */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">6-Month Revenue Forecast</h3>
          <p className="text-xs text-gray-600 mt-1">Based on current MRR ({fmtK(totalMrr)}), {activeCount} active subs, {(monthlyChurnRate * 100).toFixed(1)}% monthly churn</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Month</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Recurring</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">New Sales</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Churn</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Projected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {projMonths.map(row => (
                <tr key={row.label} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 text-gray-300 font-medium">{row.label}</td>
                  <td className="px-6 py-3.5 text-right text-blue-400 tabular-nums">{fmtK(row.recurring)}</td>
                  <td className="px-6 py-3.5 text-right text-green-400 tabular-nums">{fmtK(row.newSales)}</td>
                  <td className="px-6 py-3.5 text-right text-red-400 tabular-nums">−{fmtK(row.churn)}</td>
                  <td className="px-6 py-3.5 text-right tabular-nums font-semibold text-white">{fmtK(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Refund/Chargeback Events */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Refunds &amp; Chargebacks</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Date</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Type</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Amount</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Reason</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {recentEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-600 text-sm">
                    No refund or chargeback events in this date range
                  </td>
                </tr>
              )}
              {recentEvents.map((e) => (
                <tr key={e.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                    {format(new Date(e.occurredAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge
                      label={e.eventType}
                      colorClass={
                        e.eventType === 'REFUND'
                          ? 'bg-purple-500/10 text-purple-400'
                          : 'bg-red-500/10 text-red-400'
                      }
                    />
                  </td>
                  <td className="px-6 py-3.5 text-right text-red-400 tabular-nums font-medium">
                    {fmt$(e.amount)}
                  </td>
                  <td className="px-6 py-3.5 text-gray-500 text-xs truncate max-w-[220px]">
                    {e.refundReason ?? e.chargebackReasonCode ?? '—'}
                  </td>
                  <td className="px-6 py-3.5 text-xs">
                    {e.orderId ? (
                      <Link
                        href={`/orders/${e.orderId}`}
                        className="text-blue-400 hover:text-blue-300 font-mono"
                      >
                        {e.orderId.slice(0, 8)}…
                      </Link>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
