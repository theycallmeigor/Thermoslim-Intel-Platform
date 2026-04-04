import { NextRequest, NextResponse } from 'next/server';
import { CheckoutChampAdapter } from '@/adapters/checkoutchamp';

// Backfill numeric CC order IDs in 7-day batches.
// Call repeatedly with increasing offset: POST /api/sync/backfill-cc-ids?offset=0
// Each call processes one 7-day batch within Vercel's timeout.
export async function POST(req: NextRequest) {
  try {
    const offset = parseInt(req.nextUrl.searchParams.get('offset') ?? '0', 10);
    const batchDays = 7;

    const now = new Date();
    const endDate = new Date(now.getTime() - offset * 86400000);
    const startDate = new Date(endDate.getTime() - batchDays * 86400000);

    console.log(`[backfill-cc-ids] Syncing ${startDate.toISOString().slice(0, 10)} → ${endDate.toISOString().slice(0, 10)}`);

    const adapter = new CheckoutChampAdapter();
    await adapter.connect();
    const result = await adapter.sync({ fullSync: false, startDate, endDate });

    return NextResponse.json({
      success: true,
      batch: `${startDate.toISOString().slice(0, 10)} → ${endDate.toISOString().slice(0, 10)}`,
      processed: result.recordsProcessed,
      updated: result.recordsUpdated,
      errors: result.errors.length,
      nextOffset: offset + batchDays,
    });
  } catch (err) {
    console.error('[backfill-cc-ids] failed:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
