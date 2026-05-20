export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'All Orders — ThermoSlim' };

import { prisma } from '@/lib/prisma';
import { statusColors, sourceColors, humanizeSource, humanizeStatus, getOrderType } from '@/lib/dashboard/colors';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrderTable } from './OrderTable';

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
      customerId: true,
      sourceOrderId: true,
      shopifyOrderId: true,
      ccSourceOrderId: true,
      status: true,
      orderTotal: true,
      totalPrice: true,
      totalShipping: true,
      totalDiscount: true,
      salesTax: true,
      ccOrderType: true,
      tags: true,
      campaignName: true,
      paySource: true,
      createdAt: true,
      customer: { select: { email: true, fullName: true } },
      items: { select: { name: true, sku: true, price: true, quantity: true, productType: true } },
    },
    take: 50,
    orderBy: { createdAt: 'desc' },
  });

  // Check which customers have Loop (SHOPIFY-source) subscriptions
  const shopifyCustomerIds = [...new Set(
    orders.filter(o => o.source === 'SHOPIFY').map(o => o.customerId)
  )];
  const loopSubCustomerIds = new Set(
    shopifyCustomerIds.length > 0
      ? (await prisma.subscription.findMany({
          where: { customerId: { in: shopifyCustomerIds }, source: 'SHOPIFY' },
          select: { customerId: true },
          distinct: ['customerId'],
        })).map(s => s.customerId)
      : []
  );

  // Serialize for client component
  const serializedOrders = orders.map(order => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
    orderType: (order.source === 'SHOPIFY' && loopSubCustomerIds.has(order.customerId))
      ? 'subscription' as const
      : getOrderType(order),
    sourceLabel: humanizeSource(order.source),
    sourceColor: sourceColors[order.source] ?? 'bg-gray-500/10 text-gray-400',
    statusLabel: humanizeStatus(order.status),
    statusColor: statusColors[order.status] ?? 'bg-gray-500/10 text-gray-400',
  }));

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
            <OrderTable orders={serializedOrders} />
          </div>
        </div>
      )}
    </div>
  );
}
