'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface Props {
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
  campaigns, products, channels, funnels,
  activeCampaign, activeProduct, activeChannel, activeFunnel,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function navigate(overrides: Record<string, string | null>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null || v === '') p.delete(k);
      else p.set(k, v);
    }
    router.push(`${pathname}?${p.toString()}`);
  }

  const selectClass = 'bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={activeCampaign ?? ''} onChange={e => navigate({ campaign: e.target.value || null })} className={selectClass}>
        <option value="">All Campaigns</option>
        {campaigns.map(c => <option key={c.id} value={c.id}>{c.name || c.id}</option>)}
      </select>

      <select value={activeProduct ?? ''} onChange={e => navigate({ product: e.target.value || null })} className={selectClass}>
        <option value="">All Products</option>
        {products.map(p => <option key={p} value={p}>{p}</option>)}
      </select>

      <select value={activeChannel ?? ''} onChange={e => navigate({ channel: e.target.value || null })} className={selectClass}>
        <option value="">All Channels</option>
        {channels.map(c => <option key={c} value={c}>{c.replace('cc_', 'CC ').replace('_', ' ')}</option>)}
      </select>

      <select value={activeFunnel ?? ''} onChange={e => navigate({ funnel: e.target.value || null })} className={selectClass}>
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
  );
}
