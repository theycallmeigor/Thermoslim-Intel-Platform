'use client';

import { useState } from 'react';
import Link from 'next/link';
import { fmt$ } from '@/lib/dashboard/formatting';

type OrderData = {
  id: string;
  source: string;
  sourceOrderId: string;
  shopifyOrderId: string | null;
  ccSourceOrderId: string | null;
  status: string;
  orderTotal: number;
  totalPrice: number;
  totalShipping: number;
  totalDiscount: number;
  salesTax: number;
  ccOrderType: string | null;
  campaignName: string | null;
  paySource: string | null;
  createdAt: string;
  customer: { email: string; fullName: string | null } | null;
  items: { name: string; sku: string | null; price: number; quantity: number; productType: string | null }[];
};

export function OrderQuickView({ order, onClose }: { order: OrderData; onClose: () => void }) {
  const shopifyId = order.shopifyOrderId ?? order.sourceOrderId;
  const ccId = order.ccSourceOrderId;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-lg bg-gray-950 border-l border-gray-800 h-full overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-950 border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-sm font-bold text-white">Order {order.sourceOrderId}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{order.source} · {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-2">
            {shopifyId && (
              <a
                href={`https://admin.shopify.com/store/tvbczb-ie/orders/${shopifyId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                Shopify
              </a>
            )}
            {ccId && (
              <a
                href={`https://crm.checkoutchamp.com/customer/cs/orders/?orderId=${ccId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 text-[10px] font-medium rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
              >
                CC
              </a>
            )}
            <Link
              href={`/orders/${order.id}`}
              className="px-2.5 py-1 text-[10px] font-medium rounded bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Full View
            </Link>
            <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-[10px] text-gray-500 uppercase font-medium">Total</div>
              <div className="text-lg font-bold text-white tabular-nums">{fmt$(order.orderTotal)}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-[10px] text-gray-500 uppercase font-medium">Shipping</div>
              <div className="text-lg font-bold text-white tabular-nums">{fmt$(order.totalShipping)}</div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-gray-900 rounded-lg p-4 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Customer</span>
              <span className="text-gray-300">{order.customer?.fullName ?? order.customer?.email ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="text-gray-300">{order.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className="text-gray-300">{order.ccOrderType ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Campaign</span>
              <span className="text-gray-300 truncate max-w-[180px]">{order.campaignName ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pay Source</span>
              <span className="text-gray-300">{order.paySource ?? '—'}</span>
            </div>
            {shopifyId && (
              <div className="flex justify-between">
                <span className="text-gray-500">Shopify ID</span>
                <span className="text-gray-400 font-mono">{shopifyId}</span>
              </div>
            )}
            {ccId && (
              <div className="flex justify-between">
                <span className="text-gray-500">CC ID</span>
                <span className="text-gray-400 font-mono">{ccId}</span>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="text-xs font-semibold text-gray-400 uppercase">Line Items ({order.items.length})</h3>
            </div>
            <div className="divide-y divide-gray-800/60">
              {order.items.map((item, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center justify-between text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-300 truncate">{item.name}</div>
                    {item.sku && <div className="text-gray-600 font-mono text-[10px] mt-0.5">{item.sku}</div>}
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    {item.productType && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.productType === 'UPSALE' ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-800 text-gray-500'}`}>
                        {item.productType}
                      </span>
                    )}
                    <span className="text-gray-200 tabular-nums font-medium">{fmt$(item.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderRow({ order, children }: { order: OrderData; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className="hover:bg-gray-800/40 transition-colors cursor-pointer"
        onClick={() => setOpen(true)}
      >
        {children}
      </tr>
      {open && <OrderQuickView order={order} onClose={() => setOpen(false)} />}
    </>
  );
}
