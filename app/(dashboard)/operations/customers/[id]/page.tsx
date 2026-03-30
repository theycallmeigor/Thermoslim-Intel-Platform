export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { fmt$ } from '@/lib/dashboard/formatting';
import {
  statusColors,
  sourceColors,
  subscriptionStatusColors,
  humanizeSource,
  humanizeStatus,
} from '@/lib/dashboard/colors';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

const revenueEventColors: Record<string, string> = {
  SALE: 'bg-green-500/10 text-green-400',
  REFUND: 'bg-purple-500/10 text-purple-400',
  CHARGEBACK: 'bg-red-500/10 text-red-400',
  REBILL: 'bg-blue-500/10 text-blue-400',
  VOID: 'bg-gray-500/10 text-gray-400',
};

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      createdAt: true,
      ccCustomerId: true,
      shopifyCustomerId: true,
      orders: {
        select: {
          id: true,
          source: true,
          sourceOrderId: true,
          shopifyOrderId: true,
          status: true,
          orderTotal: true,
          ccOrderType: true,
          tags: true,
          createdAt: true,
          campaignName: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      subscriptions: {
        select: {
          id: true,
          status: true,
          recurringPrice: true,
          frequency: true,
          currentBillingCycle: true,
          startedAt: true,
          nextBillDate: true,
          cancelledAt: true,
          productMap: { select: { name: true } },
        },
        orderBy: { startedAt: 'desc' },
      },
      revenueEvents: {
        select: {
          id: true,
          eventType: true,
          amount: true,
          source: true,
          occurredAt: true,
        },
        orderBy: { occurredAt: 'desc' },
        take: 30,
      },
    },
  });

  if (!customer) notFound();

  const activeSubCount = customer.subscriptions.filter(
    s => s.status === 'ACTIVE' || s.status === 'TRIAL',
  ).length;
  const totalRevenue = customer.revenueEvents
    .filter(e => e.eventType === 'SALE' || e.eventType === 'REBILL')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalOrders = customer.orders.length;

  const displayName = customer.fullName ?? customer.email;

  return (
    <div className="space-y-6">
      <PageHeader
        title={displayName}
        subtitle={customer.email !== displayName ? customer.email : undefined}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Revenue" value={fmt$(totalRevenue)} />
        <KpiCard label="Total Orders" value={totalOrders.toLocaleString()} />
        <KpiCard label="Active Subscriptions" value={activeSubCount.toLocaleString()} />
        <KpiCard
          label="Customer Since"
          value={fmtDate(customer.createdAt)}
        />
      </div>

      {/* Orders */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Orders</h2>
        </div>
        {customer.orders.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-gray-600 text-sm">No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Date</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Source</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Type</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Status</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Total</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Campaign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {customer.orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                      {fmtDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        #{order.sourceOrderId.slice(-8)}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                        label={humanizeSource(order.source)}
                        colorClass={sourceColors[order.source] ?? 'bg-gray-500/10 text-gray-400'}
                      />
                    </td>
                    <td className="px-6 py-3.5 text-gray-400 text-xs">
                      {order.ccOrderType ?? '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                        label={humanizeStatus(order.status)}
                        colorClass={statusColors[order.status] ?? 'bg-gray-500/10 text-gray-400'}
                      />
                    </td>
                    <td className="px-6 py-3.5 text-right text-gray-200 tabular-nums">
                      {fmt$(order.orderTotal)}
                    </td>
                    <td className="px-6 py-3.5 text-gray-400 text-xs truncate max-w-[200px]">
                      {order.campaignName ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subscriptions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Subscriptions</h2>
        </div>
        {customer.subscriptions.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-gray-600 text-sm">No subscriptions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Product</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Status</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Price</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Frequency</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Cycle</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Next Bill</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {customer.subscriptions.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-3.5 text-gray-200">
                      {sub.productMap?.name ?? '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                        label={humanizeStatus(sub.status)}
                        colorClass={subscriptionStatusColors[sub.status] ?? 'bg-gray-500/10 text-gray-400'}
                      />
                    </td>
                    <td className="px-6 py-3.5 text-right text-gray-200 tabular-nums">
                      {fmt$(sub.recurringPrice)}
                    </td>
                    <td className="px-6 py-3.5 text-gray-400 text-xs">
                      {sub.frequency ?? '—'}
                    </td>
                    <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">
                      {sub.currentBillingCycle}
                    </td>
                    <td className="px-6 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                      {sub.nextBillDate ? fmtDate(sub.nextBillDate) : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                      {fmtDate(sub.startedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revenue Events */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Revenue Events</h2>
        </div>
        {customer.revenueEvents.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-gray-600 text-sm">No revenue events found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Date</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Type</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Amount</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {customer.revenueEvents.map(evt => (
                  <tr key={evt.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                      {fmtDate(evt.occurredAt)}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                        label={evt.eventType}
                        colorClass={revenueEventColors[evt.eventType] ?? 'bg-gray-500/10 text-gray-400'}
                      />
                    </td>
                    <td className="px-6 py-3.5 text-right text-gray-200 tabular-nums">
                      {fmt$(evt.amount)}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                        label={humanizeSource(evt.source)}
                        colorClass={sourceColors[evt.source] ?? 'bg-gray-500/10 text-gray-400'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
