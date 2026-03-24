import { NextRequest, NextResponse } from 'next/server';
import { initRegistry, getAdapter } from '@/core/ingestion/registry';

export async function POST(req: NextRequest) {
  try {
    await initRegistry();
    const adapter = getAdapter('checkoutchamp');
    if (!adapter) return NextResponse.json({ success: false, error: 'CheckoutChamp adapter not registered' }, { status: 500 });

    const body = await req.json().catch(() => ({})) as { fullSync?: boolean; startDate?: string };
    await adapter.connect();
    const result = await adapter.sync({
      fullSync: body.fullSync ?? false,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
    });
    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
