export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { fmt$ } from '@/lib/dashboard/formatting';
import {
  statusColors,
  sourceColors,
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

function fmtDateTime(d: Date | string) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      source: true,
      sourceOrderId: true,
      ccSourceOrderId: true,
      shopifyOrderId: true,
      status: true,
      orderTotal: true,
      totalPrice: true,
      totalShipping: true,
      totalDiscount: true,
      salesTax: true,
      campaignName: true,
      campaignId: true,
      couponCode: true,
      ccOrderType: true,
      tags: true,
      paySource: true,
      cardType: true,
      cardLast4: true,
      declineReason: true,
      ipAddress: true,
      createdAt: true,
      customer: { select: { id: true, email: true, fullName: true } },
      items: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          quantity: true,
          recurringStatus: true,
          billingCycleNumber: true,
          txnType: true,
          productType: true,
        },
      },
      attribution: {
        select: {
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          utmContent: true,
          utmTerm: true,
          sourceId: true,
          pubId: true,
        },
      },
      revenueEvents: {
        select: { id: true, eventType: true, amount: true, occurredAt: true },
        orderBy: { occurredAt: 'desc' },
      },
    },
  });

  if (!order) notFound();

  const hasAttribution =
    order.attribution &&
    Object.values(order.attribution).some(v => v !== null && v !== undefined && v !== '');

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order ${order.sourceOrderId}`}
        subtitle={`${humanizeSource(order.source)} · ${fmtDateTime(order.createdAt)}`}
      >
        {order.shopifyOrderId && (
          <a
            href={`https://admin.shopify.com/store/tvbczb-ie/orders/${order.shopifyOrderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            View in Shopify
          </a>
        )}
        {(order.source === 'CHECKOUTCHAMP' || order.source === 'MERGED') && order.ccSourceOrderId && (
          <a
            href={`https://crm.checkoutchamp.com/customer/cs/orders/?orderId=${order.ccSourceOrderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            View in CC
          </a>
        )}
      </PageHeader>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Order Total" value={fmt$(order.orderTotal)} />
        <KpiCard label="Shipping" value={fmt$(order.totalShipping)} />
        <KpiCard label="Discount" value={fmt$(order.totalDiscount)} />
        <KpiCard label="Tax" value={fmt$(order.salesTax)} />
      </div>

      {/* Details */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Details</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-3 text-sm">
          {/* Left column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Source</span>
              <Badge
                label={humanizeSource(order.source)}
                colorClass={sourceColors[order.source] ?? 'bg-gray-500/10 text-gray-400'}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status</span>
              <Badge
                label={humanizeStatus(order.status)}
                colorClass={statusColors[order.status] ?? 'bg-gray-500/10 text-gray-400'}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Type</span>
              {order.ccOrderType ? (
                <Badge
                  label={order.ccOrderType}
                  colorClass="bg-gray-500/10 text-gray-300"
                />
              ) : (
                <span className="text-gray-600 text-xs">—</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Pay Source</span>
              <span className="text-gray-300 text-xs">{order.paySource ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Card</span>
              <span className="text-gray-300 text-xs font-mono">
                {order.cardType && order.cardLast4
                  ? `${order.cardType} •••• ${order.cardLast4}`
                  : order.cardType
                  ? order.cardType
                  : order.cardLast4
                  ? `•••• ${order.cardLast4}`
                  : '—'}
              </span>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Campaign</span>
              <span className="text-gray-300 text-xs truncate max-w-[260px] text-right">
                {order.campaignName ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Coupon</span>
              <span className="text-gray-300 text-xs font-mono">{order.couponCode ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Customer</span>
              {order.customer ? (
                <Link
                  href={`/operations/customers/${order.customer.id}`}
                  className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                >
                  {order.customer.fullName ?? order.customer.email}
                </Link>
              ) : (
                <span className="text-gray-600 text-xs">—</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">IP Address</span>
              <span className="text-gray-400 text-xs font-mono">{order.ipAddress ?? '—'}</span>
            </div>
            {order.declineReason && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Decline Reason</span>
                <span className="text-red-400 text-xs">{order.declineReason}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Line Items</h2>
        </div>
        {order.items.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-gray-600 text-sm">No line items found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Product</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">SKU</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Qty</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Price</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Type</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Billing Cycle</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {order.items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-3.5 text-gray-200">{item.name}</td>
                    <td className="px-6 py-3.5 text-gray-400 font-mono text-xs">{item.sku ?? '—'}</td>
                    <td className="px-6 py-3.5 text-right text-gray-300 tabular-nums">{item.quantity}</td>
                    <td className="px-6 py-3.5 text-right text-gray-200 tabular-nums">{fmt$(item.price)}</td>
                    <td className="px-6 py-3.5 text-gray-400 text-xs">{item.productType ?? item.txnType ?? '—'}</td>
                    <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">
                      {item.billingCycleNumber ?? '—'}
                    </td>
                    <td className="px-6 py-3.5 text-gray-400 text-xs">
                      {item.recurringStatus ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attribution */}
      {hasAttribution && order.attribution && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Attribution</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-3 text-sm">
            {[
              { label: 'UTM Source', value: order.attribution.utmSource },
              { label: 'UTM Medium', value: order.attribution.utmMedium },
              { label: 'UTM Campaign', value: order.attribution.utmCampaign },
              { label: 'UTM Content', value: order.attribution.utmContent },
              { label: 'UTM Term', value: order.attribution.utmTerm },
              { label: 'Source ID', value: order.attribution.sourceId },
              { label: 'Pub ID', value: order.attribution.pubId },
            ]
              .filter(row => row.value)
              .map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="text-gray-300 text-xs font-mono">{row.value}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Revenue Events */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Revenue Events</h2>
        </div>
        {order.revenueEvents.length === 0 ? (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {order.revenueEvents.map(evt => (
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
