import { NextRequest, NextResponse } from 'next/server';
import { syncShopifySubscriptions } from '@/services/sync-shopify-subscriptions';

export const maxDuration = 300; // Backfill may take several minutes

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncShopifySubscriptions();
    console.log(`[cron:sync-shopify-subs] done: synced=${result.synced} skipped=${result.skipped} errors=${result.errors}`);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    console.error('[cron:sync-shopify-subs] error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
