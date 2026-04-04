import { NextResponse } from 'next/server';
import { initRegistry, getAdapter } from '@/core/ingestion/registry';
import { rebuildSnapshots } from '@/core/sync/rebuild-snapshots';

export async function POST() {
  try {
    await initRegistry();
    const adapter = getAdapter('shopify');
    if (!adapter) return NextResponse.json({ success: false, error: 'Shopify adapter not registered' }, { status: 500 });

    await adapter.connect();
    const result = await adapter.sync();

    // Rebuild snapshots for the synced period (fire-and-forget, don't block response)
    const syncEnd = new Date();
    const syncStart = new Date(syncEnd.getTime() - 5 * 60 * 60 * 1000);
    rebuildSnapshots(syncStart, syncEnd).catch(err =>
      console.error('[sync] snapshot rebuild failed:', err instanceof Error ? err.message : err)
    );

    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
