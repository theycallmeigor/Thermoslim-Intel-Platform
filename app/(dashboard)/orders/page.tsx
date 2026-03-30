export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { fmt$ } from '@/lib/dashboard/formatting';
import { statusColors, sourceColors, humanizeSource, humanizeStatus, getOrderType } from '@/lib/dashboard/colors';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? '';
  const isSearch = q.length >= 2;

  const orders = await prisma.order.findMany({
    where: isSearch
      ? {
          OR: [
            { sourceOrderId: { contains: q, mode: 'insensitive' } },
            { shopifyOrderId: { contains: q, mode: 'insensitive' } },
            { customer: { email: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {},
    select: {
      id: true,
      source: true,
      sourceOrderId: true,
      status: true,
      orderTotal: true,
      ccOrderType: true,
      tags: true,
      campaignName: true,
      createdAt: true,
      customer: { select: { email: true, fullName: true } },
    },
    take: 50,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle="Browse and search all orders" />

      <form method="GET" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by order ID, Shopify ID, or customer email..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          Search
        </button>
      </form>

      {orders.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-16 text-center">
          <p className="text-gray-500 text-sm">
            {isSearch ? `No orders found for "${q}"` : 'No orders yet'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {isSearch ? 'Results' : 'Recent Orders'}
            </h2>
            <span className="text-xs text-gray-500">
              {orders.length} order{orders.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Date</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Customer</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Source</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Type</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Status</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Total</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Campaign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {orders.map((order) => {
                  const orderType = getOrderType(order);
                  return (
                    <tr key={order.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                        {format(new Date(order.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-3.5">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-blue-400 hover:text-blue-300 font-medium font-mono text-xs transition-colors"
                        >
                          {order.sourceOrderId}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5 text-gray-300 text-xs">
                        {order.customer.fullName || order.customer.email}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge label={humanizeSource(order.source)} colorClass={sourceColors[order.source]} />
                      </td>
                      <td className="px-6 py-3.5">
                        {orderType !== 'one-time' && (
                          <Badge
                            label={orderType === 'rebill' ? 'Rebill' : 'Subscription'}
                            colorClass={orderType === 'rebill' ? 'bg-orange-500/10 text-orange-400' : 'bg-purple-500/10 text-purple-400'}
                          />
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge label={humanizeStatus(order.status)} colorClass={statusColors[order.status]} />
                      </td>
                      <td className="px-6 py-3.5 text-right text-gray-200 tabular-nums font-medium">
                        {fmt$(order.orderTotal)}
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 text-xs truncate max-w-[140px]">
                        {order.campaignName ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
