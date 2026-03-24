import { NextResponse } from 'next/server';
import { initRegistry, getAdapter } from '@/core/ingestion/registry';

export async function POST() {
  try {
    await initRegistry();
    const adapter = getAdapter('shopify');
    if (!adapter) return NextResponse.json({ success: false, error: 'Shopify adapter not registered' }, { status: 500 });

    await adapter.connect();
    const result = await adapter.sync();
    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
