import { NextResponse } from 'next/server';
import { CheckoutChampAdapter } from '@/adapters/checkoutchamp';

export async function POST() {
  try {
    const adapter = new CheckoutChampAdapter();
    await adapter.connect();
    const result = await adapter.syncCampaignProducts();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[sync/cc-products] failed:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
