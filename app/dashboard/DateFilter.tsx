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

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

function ytdStart() {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1);
}

export function DateFilter({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);

  function apply(f: string, t: string) {
    const p = new URLSearchParams(params.toString());
    p.set('from', f);
    p.set('to', t);
    router.push(`${pathname}?${p.toString()}`);
  }

  function applyPreset(days: number) {
    const to = toYMD(new Date());
    if (days === 0) {
      apply('2000-01-01', to);
      return;
    }
    if (days === -1) {
      apply(toYMD(ytdStart()), to);
      return;
    }
    const from = toYMD(new Date(Date.now() - days * 86400000));
    apply(from, to);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Quick presets */}
      {PRESETS.map(p => (
        <button
          key={p.label}
          onClick={() => applyPreset(p.days)}
          className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer"
        >
          {p.label}
        </button>
      ))}

      {/* Custom range */}
      <div className="flex items-center gap-1.5 ml-1">
        <input
          type="date"
          value={localFrom}
          onChange={e => setLocalFrom(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
        />
        <span className="text-gray-600 text-xs">→</span>
        <input
          type="date"
          value={localTo}
          onChange={e => setLocalTo(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={() => apply(localFrom, localTo)}
          className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
