export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'MRR Waterfall — ThermoSlim' };

import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, parseRange, toMonthlyMrr } from '@/lib/dashboard/formatting';
import { calculateMrr } from '@/lib/dashboard/mrr';
import type { Source } from '@prisma/client';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { SourceFilter } from '@/components/ui/SourceFilter';
import { WaterfallChart, type WaterfallMonth } from './WaterfallChart';

// ─── Event type badge colors ──────────────────────────────────────────────────

const eventTypeColors: Record<string, string> = {
  CREATED: 'bg-green-500/10 text-green-400',
  BILLED: 'bg-blue-500/10 text-blue-400',
  DECLINED: 'bg-red-500/10 text-red-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
  PAUSED: 'bg-yellow-500/10 text-yellow-400',
  RESUMED: 'bg-cyan-500/10 text-cyan-400',
  REACTIVATED: 'bg-emerald-500/10 text-emerald-400',
};

function humanizeEventType(t: string): string {
  return t.charAt(0) + t.slice(1).toLowerCase();
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getMrrData(startDate: Date, endDate: Date, sourceWhere: Record<string, unknown>) {
  const [activeSubs, periodEvents, recentEvents] = await Promise.all([
    // All ACTIVE + TRIAL subscriptions for current MRR
    prisma.subscription.findMany({
      where: { status: { in: ['ACTIVE', 'TRIAL'] }, ...sourceWhere },
      select: { id: true, recurringPrice: true, frequency: true },
    }),

    // All events in the selected date range for the waterfall
    prisma.subscriptionEvent.findMany({
      where: {
        occurredAt: { gte: startDate, lte: endDate },
        eventType: { in: ['CREATED', 'CANCELLED', 'REACTIVATED', 'RESUMED'] },
        subscription: sourceWhere,
      },
      select: {
        id: true,
        eventType: true,
        amount: true,
        occurredAt: true,
        subscription: {
          select: {
            recurringPrice: true,
            frequency: true,
          },
        },
      },
      orderBy: { occurredAt: 'asc' },
    }),

    // Recent events for the movement table (last 50, all types)
    prisma.subscriptionEvent.findMany({
      where: {
        occurredAt: { gte: startDate, lte: endDate },
        subscription: sourceWhere,
      },
      select: {
        id: true,
        eventType: true,
        fromStatus: true,
        toStatus: true,
        amount: true,
        billingCycleNumber: true,
        occurredAt: true,
        subscription: {
          select: {
            recurringPrice: true,
            frequency: true,
            customer: { select: { email: true, firstName: true } },
            productMap: { select: { name: true } },
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
      take: 50,
    }),
  ]);

  return { activeSubs, periodEvents, recentEvents };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MrrWaterfallPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; source?: string }>;
}) {
  const sp = await searchParams;
  const { startDate, endDate } = parseRange(sp.from, sp.to);
  const sourceWhere = sp.source ? { source: sp.source as Source } : {};
  const { activeSubs, periodEvents, recentEvents } = await getMrrData(startDate, endDate, sourceWhere);

  // ── KPI: Current MRR (from shared calculator — includes trial prices) ──────
  const { totalMrr: currentMrr, activeCount } = await calculateMrr(sourceWhere);

  // ── KPI: Period new / churned MRR ──────────────────────────────────────────
  let newMrrPeriod = 0;
  let churnedMrrPeriod = 0;

  for (const ev of periodEvents) {
    const mrrContrib = toMonthlyMrr(
      ev.amount ?? ev.subscription.recurringPrice,
      ev.subscription.frequency,
    );
    if (ev.eventType === 'CREATED') {
      newMrrPeriod += mrrContrib;
    } else if (ev.eventType === 'CANCELLED') {
      churnedMrrPeriod += mrrContrib;
    }
  }

  // ── Waterfall: group events by month ───────────────────────────────────────
  const monthMap = new Map<
    string,
    { newMrr: number; reactivation: number; churn: number }
  >();

  for (const ev of periodEvents) {
    const monthKey = format(ev.occurredAt, 'MMM yyyy');
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { newMrr: 0, reactivation: 0, churn: 0 });
    }
    const bucket = monthMap.get(monthKey)!;
    const mrrContrib = toMonthlyMrr(
      ev.amount ?? ev.subscription.recurringPrice,
      ev.subscription.frequency,
    );

    if (ev.eventType === 'CREATED') {
      bucket.newMrr += mrrContrib;
    } else if (ev.eventType === 'CANCELLED') {
      bucket.churn -= mrrContrib; // store as negative
    } else if (ev.eventType === 'REACTIVATED' || ev.eventType === 'RESUMED') {
      bucket.reactivation += mrrContrib;
    }
  }

  const waterfallData: WaterfallMonth[] = Array.from(monthMap.entries()).map(
    ([month, { newMrr, reactivation, churn }]) => ({
      month,
      newMrr,
      reactivation,
      churn,
      net: newMrr + reactivation + churn,
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="MRR Waterfall"
        subtitle="Monthly recurring revenue movement"
      >
        <SourceFilter />
      </PageHeader>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Current MRR" value={fmtK(currentMrr)} />
        <KpiCard label="Active Subscribers" value={activeCount.toLocaleString()} />
        <KpiCard label="New MRR (period)" value={fmtK(newMrrPeriod)} positive />
        <KpiCard label="Churned MRR (period)" value={fmtK(churnedMrrPeriod)} />
      </div>

      {/* Waterfall chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          MRR Movement by Month
        </h3>
        <WaterfallChart data={waterfallData} />
      </div>

      {/* Subscriber movement table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Subscriber Movement
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase">
              <th className="text-left px-6 py-3 font-medium">Date</th>
              <th className="text-left px-6 py-3 font-medium">Customer</th>
              <th className="text-left px-6 py-3 font-medium">Event</th>
              <th className="text-left px-6 py-3 font-medium">From → To</th>
              <th className="text-left px-6 py-3 font-medium">Amount</th>
              <th className="text-left px-6 py-3 font-medium">Cycle</th>
              <th className="text-left px-6 py-3 font-medium">Product</th>
            </tr>
          </thead>
          <tbody>
            {recentEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-600 text-sm">
                  No events found for selected period.
                </td>
              </tr>
            ) : (
              recentEvents.map((ev) => {
                const email = ev.subscription.customer.email;
                const truncatedEmail =
                  email.length > 32 ? email.slice(0, 29) + '…' : email;

                const amountCents =
                  ev.amount ?? ev.subscription.recurringPrice;
                const eventColor =
                  eventTypeColors[ev.eventType] ?? 'bg-gray-500/10 text-gray-400';
                const productName = ev.subscription.productMap?.name ?? '—';

                const fromStatus = ev.fromStatus ?? '—';
                const toStatus = ev.toStatus;

                return (
                  <tr
                    key={ev.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-3 text-gray-400 whitespace-nowrap tabular-nums">
                      {format(ev.occurredAt, 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-3 text-gray-300 font-mono text-xs">
                      {truncatedEmail}
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        label={humanizeEventType(ev.eventType)}
                        colorClass={eventColor}
                      />
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                      <span className="text-gray-400">{fromStatus}</span>
                      <span className="mx-1 text-gray-600">→</span>
                      <span className="text-gray-300">{toStatus}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-300 tabular-nums">
                      {fmt$(amountCents)}
                    </td>
                    <td className="px-6 py-3 text-gray-400 tabular-nums">
                      {ev.billingCycleNumber ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-gray-400">{productName}</td>
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
