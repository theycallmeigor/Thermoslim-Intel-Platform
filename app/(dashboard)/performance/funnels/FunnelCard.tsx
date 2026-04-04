'use client';

import { useState } from 'react';
import { fmt$, fmtK } from '@/lib/dashboard/formatting';

export type FunnelPageData = {
  pageType: string;
  slug: string;
  orders: number;
  revenue: number;
  products: { name: string; campaignProductId: string | null; count: number; rate: number; prices: number[]; frequency: string | null; isSubscription: boolean }[];
};

export type FunnelData = {
  name: string;
  ccReferenceId: string | null;
  totalOrders: number;
  totalRevenue: number;
  aov: number;
  pages: FunnelPageData[];
};

export function FunnelCard({ funnel }: { funnel: FunnelData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/40 transition-colors"
      >
        <div className="text-left">
          <h3 className="text-sm font-semibold text-white">{funnel.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{funnel.ccReferenceId ?? 'Derived from URLs'}</p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="text-right">
            <div className="text-gray-500 text-xs">Orders</div>
            <div className="text-gray-200 tabular-nums">{funnel.totalOrders}</div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 text-xs">Revenue</div>
            <div className="text-gray-200 tabular-nums">{fmtK(funnel.totalRevenue)}</div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 text-xs">AOV</div>
            <div className="text-gray-200 tabular-nums">{fmt$(funnel.aov)}</div>
          </div>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-800 px-6 py-4 space-y-4">
          {funnel.pages.map((page, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 bg-gray-800 rounded px-2 py-0.5 uppercase">
                    {page.pageType}
                  </span>
                  <span className="text-xs text-gray-600 font-mono">{page.slug}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-400">{page.orders} orders</span>
                  <span className="text-gray-300">{fmtK(page.revenue)}</span>
                </div>
              </div>
              {page.products.length > 0 && (
                <div className="ml-4 space-y-1.5">
                  {page.products.map((prod, j) => (
                    <div key={j} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{prod.name}</span>
                        {prod.campaignProductId && (
                          <span className="text-[10px] font-mono text-gray-600">#{prod.campaignProductId}</span>
                        )}
                        {prod.isSubscription && (
                          <span className="text-[10px] font-medium text-blue-400 bg-blue-500/10 rounded px-1.5 py-0.5">
                            SUB
                          </span>
                        )}
                        {prod.frequency && (
                          <span className="text-[10px] font-medium text-purple-400 bg-purple-500/10 rounded px-1.5 py-0.5">
                            {prod.frequency}
                          </span>
                        )}
                        {prod.prices.length > 0 && (
                          <span className="text-gray-600">
                            {prod.prices.map(p => fmt$(p)).join(' / ')}
                          </span>
                        )}
                      </div>
                      <span className="tabular-nums">
                        <span className="text-gray-300">{prod.count}</span>
                        <span className="text-gray-600 ml-1">({(prod.rate * 100).toFixed(1)}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
