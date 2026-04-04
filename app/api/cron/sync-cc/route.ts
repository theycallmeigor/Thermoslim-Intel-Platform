import { NextRequest, NextResponse } from 'next/server';
import { initRegistry, getAdapter } from '@/core/ingestion/registry';

export const maxDuration = 120; // Allow up to 2 minutes for CC API pagination

export async function GET(req: NextRequest) {
  // Vercel cron sends this header — reject manual calls in production
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initRegistry();
    const adapter = getAdapter('checkoutchamp');
    if (!adapter) {
      return NextResponse.json({ error: 'CC adapter not registered' }, { status: 500 });
    }

    await adapter.connect();

    // Sync last 5 hours to overlap with 4-hour cron — ensures no gaps
    const startDate = new Date(Date.now() - 5 * 60 * 60 * 1000);
    const result = await adapter.sync({ fullSync: false, startDate });

    console.log(`[cron:sync-cc] done: ${result.recordsProcessed} processed, ${result.recordsCreated} created, ${result.recordsUpdated} updated, ${result.errors.length} errors`);

    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cron sync failed';
    console.error('[cron:sync-cc] error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
