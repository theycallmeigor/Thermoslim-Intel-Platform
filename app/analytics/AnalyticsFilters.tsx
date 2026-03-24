'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const PRESETS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'YTD', days: -1 },
  { label: 'All', days: 0 },
];

function toYMD(d: Date) { return d.toISOString().slice(0, 10); }

interface Props {
  from: string;
  to: string;
  campaigns: { id: string; name: string }[];
  products: string[];
  channels: string[];
  funnels: string[];
  activeCampaign: string | null;
  activeProduct: string | null;
  activeChannel: string | null;
  activeFunnel: string | null;
}

export function AnalyticsFilters({
  from, to, campaigns, products, channels, funnels,
  activeCampaign, activeProduct, activeChannel, activeFunnel,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);

  function navigate(overrides: Record<string, string | null>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null || v === '') p.delete(k);
      else p.set(k, v);
    }
    router.push(`${pathname}?${p.toString()}`);
  }

  function applyPreset(days: number) {
    const t = toYMD(new Date());
    const f = days === 0 ? '2000-01-01' : days === -1
      ? toYMD(new Date(new Date().getFullYear(), 0, 1))
      : toYMD(new Date(Date.now() - days * 86400000));
    navigate({ from: f, to: t });
  }

  return (
    <div className="space-y-3">
      {/* Row 1: Date presets + custom range */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => applyPreset(p.days)}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer">
            {p.label}
          </button>
        ))}
        <div className="flex items-center gap-1.5 ml-1">
          <input type="date" value={localFrom} onChange={e => setLocalFrom(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500" />
          <span className="text-gray-600 text-xs">→</span>
          <input type="date" value={localTo} onChange={e => setLocalTo(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500" />
          <button onClick={() => navigate({ from: localFrom, to: localTo })}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer">
            Apply
          </button>
        </div>
      </div>

      {/* Row 2: Dimension filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={activeCampaign ?? ''} onChange={e => navigate({ campaign: e.target.value || null })}
          className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500">
          <option value="">All Campaigns</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.name || c.id}</option>)}
        </select>

        <select value={activeProduct ?? ''} onChange={e => navigate({ product: e.target.value || null })}
          className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500">
          <option value="">All Products</option>
          {products.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select value={activeChannel ?? ''} onChange={e => navigate({ channel: e.target.value || null })}
          className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500">
          <option value="">All Channels</option>
          {channels.map(c => <option key={c} value={c}>{c.replace('cc_', 'CC ').replace('_', ' ')}</option>)}
        </select>

        <select value={activeFunnel ?? ''} onChange={e => navigate({ funnel: e.target.value || null })}
          className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500">
          <option value="">All Funnels</option>
          {funnels.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {(activeCampaign || activeProduct || activeChannel || activeFunnel) && (
          <button onClick={() => navigate({ campaign: null, product: null, channel: null, funnel: null })}
            className="px-2 py-1 rounded-md text-xs text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors cursor-pointer">
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
