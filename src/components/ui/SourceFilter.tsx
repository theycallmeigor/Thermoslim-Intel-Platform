'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const OPTIONS = [
  { value: '', label: 'All' },
  { value: 'SHOPIFY', label: 'Shopify' },
  { value: 'LOOP', label: 'Loop' },
  { value: 'CHECKOUTCHAMP', label: 'CC' },
] as const;

export function SourceFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const current = params.get('source') ?? '';

  function navigate(source: string) {
    const p = new URLSearchParams(params.toString());
    if (!source) p.delete('source');
    else p.set('source', source);
    router.push(`${pathname}?${p.toString()}`);
  }

  return (
    <div className="flex items-center gap-1">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => navigate(value)}
          className={`px-2 py-1 text-xs rounded-md border transition-colors ${
            current === value
              ? 'bg-gray-700 border-gray-500 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
