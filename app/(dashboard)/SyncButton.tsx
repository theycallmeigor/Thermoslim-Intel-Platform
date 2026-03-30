'use client';

import { useState } from 'react';

interface SyncResult {
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  duration: number;
  errors: Array<{ message: string }>;
}

type SyncSource = 'shopify' | 'checkoutchamp';

export default function SyncButton() {
  const [syncing, setSyncing] = useState<SyncSource | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSync(source: SyncSource) {
    setSyncing(source);
    setStatus(null);
    try {
      const res = await fetch(`/api/sync/${source}`, { method: 'POST' });
      const data = await res.json() as { success: boolean; result?: SyncResult; error?: string };

      if (data.success && data.result) {
        const r = data.result;
        setStatus({
          ok: true,
          message: `${source === 'shopify' ? 'Shopify' : 'CC'} synced — ${r.recordsCreated} new, ${r.recordsUpdated} updated in ${(r.duration / 1000).toFixed(1)}s${r.errors.length > 0 ? ` (${r.errors.length} errors)` : ''}`,
        });
        window.location.reload();
      } else {
        setStatus({ ok: false, message: data.error ?? 'Sync failed' });
      }
    } catch {
      setStatus({ ok: false, message: 'Network error' });
    } finally {
      setSyncing(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-2">
        <SyncBtn
          label="Shopify"
          loading={syncing === 'shopify'}
          disabled={syncing !== null}
          onClick={() => handleSync('shopify')}
        />
        <SyncBtn
          label="CheckoutChamp"
          loading={syncing === 'checkoutchamp'}
          disabled={syncing !== null}
          onClick={() => handleSync('checkoutchamp')}
        />
      </div>
      {status && (
        <p className={`text-xs max-w-sm text-right ${status.ok ? 'text-green-400' : 'text-red-400'}`}>
          {status.message}
        </p>
      )}
    </div>
  );
}

function SyncBtn({ label, loading, disabled, onClick }: {
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Syncing...
        </>
      ) : `Sync ${label}`}
    </button>
  );
}
