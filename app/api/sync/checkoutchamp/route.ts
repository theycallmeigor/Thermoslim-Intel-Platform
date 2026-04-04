import { NextRequest, NextResponse } from 'next/server';
import { initRegistry, getAdapter } from '@/core/ingestion/registry';
import { rebuildSnapshots } from '@/core/sync/rebuild-snapshots';
import { linkUnlinkedSubscriptions } from '@/core/sync/link-subscriptions';

export async function POST(req: NextRequest) {
  try {
    await initRegistry();
    const adapter = getAdapter('checkoutchamp');
    if (!adapter) return NextResponse.json({ success: false, error: 'CheckoutChamp adapter not registered' }, { status: 500 });

    const body = await req.json().catch(() => ({})) as { fullSync?: boolean; startDate?: string; endDate?: string };
    await adapter.connect();
    const result = await adapter.sync({
      fullSync: body.fullSync ?? false,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });

    // Rebuild snapshots for the synced period (fire-and-forget, don't block response)
    const syncEnd = new Date();
    const syncStart = body?.startDate ? new Date(body.startDate) : new Date(syncEnd.getTime() - 5 * 60 * 60 * 1000);
    rebuildSnapshots(syncStart, syncEnd).catch(err =>
      console.error('[sync] snapshot rebuild failed:', err instanceof Error ? err.message : err)
    );

    linkUnlinkedSubscriptions().catch(err =>
      console.error('[sync/cc] subscription linking failed:', err instanceof Error ? err.message : err)
    );

    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
