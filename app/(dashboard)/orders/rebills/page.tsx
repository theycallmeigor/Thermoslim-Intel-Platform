export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Upcoming Rebills — ThermoSlim' };

import { format, addDays, startOfDay, differenceInDays } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { fmt$, fmtK } from '@/lib/dashboard/formatting';
import { subscriptionStatusColors, humanizeStatus } from '@/lib/dashboard/colors';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { RebillCalendar, type DayVolume } from './RebillCalendar';

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getRebillData() {
  const now = new Date();
  const in7Days = addDays(now, 7);
  const in30Days = addDays(now, 30);

  const [kpi7, kpi30, upcoming] = await Promise.all([
    // KPI: next 7 days (ACTIVE + TRIAL only)
    prisma.subscription.aggregate({
      where: {
        status: { in: ['ACTIVE', 'TRIAL'] },
        nextBillDate: { gte: now, lte: in7Days },
      },
      _count: { id: true },
      _sum: { recurringPrice: true },
    }),

    // KPI: next 30 days (ACTIVE + TRIAL only)
    prisma.subscription.aggregate({
      where: {
        status: { in: ['ACTIVE', 'TRIAL'] },
        nextBillDate: { gte: now, lte: in30Days },
      },
      _count: { id: true },
      _sum: { recurringPrice: true },
    }),

    // Full table: ACTIVE + TRIAL + RECYCLE_BILLING, sorted by nextBillDate
    prisma.subscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'TRIAL', 'RECYCLE_BILLING'] },
        nextBillDate: { not: null },
      },
      orderBy: { nextBillDate: 'asc' },
      take: 50,
      include: {
        customer: { select: { email: true, firstName: true, lastName: true } },
        productMap: { select: { name: true, productLine: true, frequency: true } },
      },
    }),
  ]);

  return { kpi7, kpi30, upcoming, now, in30Days };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RebillsPage() {
  const { kpi7, kpi30, upcoming, now, in30Days } = await getRebillData();

  // ── Daily volume chart data (next 30 days) ──────────────────────────────────
  const dayMap = new Map<string, DayVolume>();
  for (let d = 0; d <= 30; d++) {
    const day = addDays(startOfDay(now), d);
    const key = format(day, 'MMM d');
    dayMap.set(key, { date: key, count: 0, revenue: 0 });
  }

  for (const sub of upcoming) {
    if (!sub.nextBillDate) continue;
    const billDay = startOfDay(sub.nextBillDate);
    if (billDay < startOfDay(now) || billDay > in30Days) continue;
    const key = format(billDay, 'MMM d');
    const existing = dayMap.get(key);
    if (existing) {
      existing.count += 1;
      existing.revenue += sub.recurringPrice;
    }
  }

  const dailyVolume = Array.from(dayMap.values());

  // ── KPI values ──────────────────────────────────────────────────────────────
  const count7 = kpi7._count.id ?? 0;
  const rev7 = kpi7._sum.recurringPrice ?? 0;
  const count30 = kpi30._count.id ?? 0;
  const rev30 = kpi30._sum.recurringPrice ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upcoming Rebills"
        subtitle="Active subscriptions billing in the next 30 days"
      />

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Upcoming 7d" value={count7.toLocaleString()} />
        <KpiCard label="Revenue at Risk (7d)" value={fmtK(rev7)} />
        <KpiCard label="Upcoming 30d" value={count30.toLocaleString()} />
        <KpiCard label="Revenue at Risk (30d)" value={fmtK(rev30)} />
      </div>

      {/* Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Daily Rebill Volume (Next 30 Days)
        </h3>
        <RebillCalendar data={dailyVolume} />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Upcoming Rebills
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase">
              <th className="text-left px-6 py-3 font-medium">Next Bill</th>
              <th className="text-left px-6 py-3 font-medium">Customer</th>
              <th className="text-left px-6 py-3 font-medium">Product</th>
              <th className="text-left px-6 py-3 font-medium">Cycle</th>
              <th className="text-left px-6 py-3 font-medium">Amount</th>
              <th className="text-left px-6 py-3 font-medium">Frequency</th>
              <th className="text-left px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-600 text-sm">
                  No upcoming rebills found.
                </td>
              </tr>
            ) : (
              upcoming.map((sub) => {
                const billDate = sub.nextBillDate!;
                const daysUntil = differenceInDays(startOfDay(billDate), startOfDay(now));
                const isOverdue = daysUntil < 0;
                const isImminent = !isOverdue && daysUntil <= 3;

                let dateClass = 'text-gray-300';
                if (isOverdue) dateClass = 'text-red-400 font-medium';
                else if (isImminent) dateClass = 'text-yellow-400 font-medium';

                const email = sub.customer.email;
                const truncatedEmail =
                  email.length > 32 ? email.slice(0, 29) + '…' : email;

                const productName = sub.productMap?.name ?? 'Unknown';
                const statusColor =
                  subscriptionStatusColors[sub.status] ?? 'bg-gray-500/10 text-gray-400';

                return (
                  <tr
                    key={sub.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className={`px-6 py-3 whitespace-nowrap ${dateClass}`}>
                      {format(billDate, 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-3 text-gray-300 font-mono text-xs">
                      {truncatedEmail}
                    </td>
                    <td className="px-6 py-3 text-gray-300">{productName}</td>
                    <td className="px-6 py-3 text-gray-400 tabular-nums">
                      {sub.currentBillingCycle}
                    </td>
                    <td className="px-6 py-3 text-gray-300 tabular-nums">
                      {fmt$(sub.recurringPrice)}
                    </td>
                    <td className="px-6 py-3 text-gray-400">
                      {sub.frequency ?? '—'}
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        label={humanizeStatus(sub.status)}
                        colorClass={statusColor}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
