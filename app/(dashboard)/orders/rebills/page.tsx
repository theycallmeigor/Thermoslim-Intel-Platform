export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Upcoming Rebills — ThermoSlim' };

import { format, addDays, startOfDay, differenceInDays } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, parseRange } from '@/lib/dashboard/formatting';
import { subscriptionStatusColors, humanizeStatus } from '@/lib/dashboard/colors';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { RebillCalendar, type DayVolume } from './RebillCalendar';

const PAGE_SIZE = 50;

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getRebillData(
  rangeStart: Date,
  rangeEnd: Date,
  statusFilter: string,
  page: number,
) {
  const now = new Date();
  // Use TopBar date range if set, otherwise default to next 30 days
  const windowStart = rangeStart > now ? rangeStart : now;
  const windowEnd = rangeEnd;
  const in7Days = addDays(windowStart, 7);

  const statusWhere =
    statusFilter === 'all'
      ? { status: { in: ['ACTIVE', 'TRIAL', 'RECYCLE_BILLING'] as ('ACTIVE' | 'TRIAL' | 'RECYCLE_BILLING')[] } }
      : { status: statusFilter.toUpperCase() as any };

  const [kpi7, kpi30, totalCount, upcoming] = await Promise.all([
    // KPI: next 7 days (ACTIVE + TRIAL only)
    prisma.subscription.aggregate({
      where: {
        ...statusWhere,
        nextBillDate: { gte: windowStart, lte: in7Days },
      },
      _count: { id: true },
      _sum: { recurringPrice: true },
    }),

    // KPI: next 30 days (ACTIVE + TRIAL only)
    prisma.subscription.aggregate({
      where: {
        ...statusWhere,
        nextBillDate: { gte: windowStart, lte: windowEnd },
      },
      _count: { id: true },
      _sum: { recurringPrice: true },
    }),

    // Total count for pagination
    prisma.subscription.count({
      where: { ...statusWhere, nextBillDate: { not: null } },
    }),

    // Full table: sorted by nextBillDate, paginated
    prisma.subscription.findMany({
      where: {
        ...statusWhere,
        nextBillDate: { not: null },
      },
      orderBy: { nextBillDate: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        customer: { select: { email: true, firstName: true, lastName: true } },
        productMap: { select: { name: true, productLine: true, frequency: true } },
      },
    }),
  ]);

  return { kpi7, kpi30, totalCount, upcoming, windowStart, windowEnd };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RebillsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; page?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10));
  const validStatuses = ['ACTIVE', 'TRIAL', 'RECYCLE_BILLING'];
  const rawStatus = sp.status ?? 'all';
  const statusFilter =
    rawStatus === 'all' || validStatuses.includes(rawStatus.toUpperCase()) ? rawStatus : 'all';

  // Default to next 30 days if no date range selected
  const now = new Date();
  const rangeStart = sp.from ? new Date(sp.from + 'T00:00:00Z') : now;
  const rangeEnd = sp.to ? new Date(sp.to + 'T23:59:59Z') : addDays(now, 30);

  const { kpi7, kpi30, totalCount, upcoming, windowStart, windowEnd } = await getRebillData(
    rangeStart,
    rangeEnd,
    statusFilter,
    page,
  );

  const unlinkedCount = await prisma.subscription.count({
    where: {
      productMapId: null,
      status: { in: ['ACTIVE', 'TRIAL', 'RECYCLE_BILLING'] },
    },
  });

  // ── Daily volume chart data — project future rebills from frequency ────────
  const dayMap = new Map<string, DayVolume>();
  const rangeDays = Math.min(60, Math.max(1, differenceInDays(windowEnd, windowStart)));
  for (let d = 0; d <= rangeDays; d++) {
    const day = addDays(startOfDay(windowStart), d);
    const key = format(day, 'MMM d');
    dayMap.set(key, { date: key, count: 0, revenue: 0 });
  }

  // Query ALL active subs for chart projection (not just paginated list)
  const allActiveSubs = await prisma.subscription.findMany({
    where: {
      status: { in: ['ACTIVE', 'TRIAL', 'RECYCLE_BILLING'] },
      nextBillDate: { not: null },
    },
    select: { nextBillDate: true, recurringPrice: true, frequency: true },
  });

  // Parse frequency string to days (e.g., "30-days" → 30, "1-month" → 30, "3-month" → 90)
  function freqToDays(freq: string | null): number | null {
    if (!freq) return null;
    const lower = freq.toLowerCase();
    const dayMatch = lower.match(/^(\d+)-?days?$/);
    if (dayMatch) return parseInt(dayMatch[1], 10);
    const monthMatch = lower.match(/^(\d+)-?months?$/);
    if (monthMatch) return parseInt(monthMatch[1], 10) * 30;
    // Common patterns
    if (lower === 'monthly' || lower === '1-month') return 30;
    if (lower === 'bi-monthly' || lower === '2-month') return 60;
    if (lower === 'quarterly' || lower === '3-month') return 90;
    if (lower === '6-month') return 180;
    return null;
  }

  for (const sub of allActiveSubs) {
    if (!sub.nextBillDate) continue;
    const intervalDays = freqToDays(sub.frequency);
    let billDay = startOfDay(sub.nextBillDate);

    // Project forward: add each billing occurrence within the window
    // Start from the known nextBillDate and keep adding frequency intervals
    const maxProjections = 5; // safety cap
    let projections = 0;
    while (billDay <= windowEnd && projections < maxProjections) {
      if (billDay >= startOfDay(windowStart)) {
        const key = format(billDay, 'MMM d');
        const existing = dayMap.get(key);
        if (existing) {
          existing.count += 1;
          existing.revenue += sub.recurringPrice;
        }
      }
      // If we have a frequency, project the next occurrence; otherwise stop
      if (!intervalDays) break;
      billDay = addDays(billDay, intervalDays);
      projections++;
    }
  }

  const dailyVolume = Array.from(dayMap.values());

  // ── KPI values ──────────────────────────────────────────────────────────────
  const count7 = (kpi7._count as any)?.id ?? 0;
  const rev7 = (kpi7._sum as any)?.recurringPrice ?? 0;
  const count30 = (kpi30._count as any)?.id ?? 0;
  const rev30 = (kpi30._sum as any)?.recurringPrice ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upcoming Rebills"
        subtitle="Active subscriptions billing in the next 30 days"
      />

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
        {[
          { key: 'all', label: 'All' },
          { key: 'ACTIVE', label: 'Active' },
          { key: 'TRIAL', label: 'Trial' },
          { key: 'RECYCLE_BILLING', label: 'Recycle Billing' },
        ].map(tab => {
          const isActive = statusFilter === tab.key;
          return (
            <a
              key={tab.key}
              href={`?status=${tab.key}&page=1${sp.from ? `&from=${sp.from}` : ''}${sp.to ? `&to=${sp.to}` : ''}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isActive ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </a>
          );
        })}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Upcoming 7d" value={count7.toLocaleString()} />
        <KpiCard label="Revenue at Risk (7d)" value={fmtK(rev7)} />
        <KpiCard label="Upcoming 30d" value={count30.toLocaleString()} />
        <KpiCard label="Revenue at Risk (30d)" value={fmtK(rev30)} />
      </div>

      {/* Unlinked warning */}
      {unlinkedCount > 0 && (
        <div className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2">
          {unlinkedCount} subscription{unlinkedCount !== 1 ? 's' : ''} have no product mapping — run seed script to backfill
        </div>
      )}

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

                const productName =
                  sub.productMap?.name ?? sub.productMap?.productLine ?? sub.frequency ?? 'Unlinked';
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-800">
          <span className="text-xs text-gray-500">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalCount)}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?page=${page - 1}&status=${statusFilter}${sp.from ? `&from=${sp.from}` : ''}${sp.to ? `&to=${sp.to}` : ''}`}
                className="px-3 py-1 text-xs font-medium rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Previous
              </a>
            )}
            {page * PAGE_SIZE < totalCount && (
              <a
                href={`?page=${page + 1}&status=${statusFilter}${sp.from ? `&from=${sp.from}` : ''}${sp.to ? `&to=${sp.to}` : ''}`}
                className="px-3 py-1 text-xs font-medium rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Next
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
