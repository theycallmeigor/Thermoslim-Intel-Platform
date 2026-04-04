import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initRegistry, getAdapter } from '@/core/ingestion/registry';

export const maxDuration = 300; // 5 minutes — backfill can be slow

/**
 * Backfill thin CC orders that have $0 price.
 * These are webhook records that never got enriched from the CC API.
 *
 * The CC sync endpoint pulls by date range — this endpoint specifically
 * targets orders with missing data regardless of when they were created.
 */
export async function POST() {
  try {
    await initRegistry();
    const adapter = getAdapter('checkoutchamp');
    if (!adapter) {
      return NextResponse.json({ error: 'CC adapter not registered' }, { status: 500 });
    }
    await adapter.connect();

    // Find thin CC orders: $0 price from CC or MERGED source
    const thinOrders = await prisma.order.findMany({
      where: {
        source: { in: ['CHECKOUTCHAMP', 'MERGED'] },
        totalPrice: 0,
      },
      select: {
        id: true,
        sourceOrderId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (thinOrders.length === 0) {
      return NextResponse.json({ success: true, message: 'No thin orders to backfill', count: 0 });
    }

    console.log(`[backfill-cc] Found ${thinOrders.length} thin orders to backfill`);

    // Group by month to sync in date chunks
    const dateRanges = new Map<string, { start: Date; end: Date }>();
    for (const order of thinOrders) {
      const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const existing = dateRanges.get(key);
      if (!existing) {
        const monthStart = new Date(order.createdAt.getFullYear(), order.createdAt.getMonth(), 1);
        const monthEnd = new Date(order.createdAt.getFullYear(), order.createdAt.getMonth() + 1, 1);
        dateRanges.set(key, { start: monthStart, end: monthEnd });
      }
    }

    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    // Sync each month range — CC API returns all orders in range,
    // pipeline upserts handle dedup, and thin records get enriched
    for (const [month, range] of dateRanges) {
      console.log(`[backfill-cc] Syncing ${month}: ${range.start.toISOString()} → ${range.end.toISOString()}`);
      try {
        const result = await adapter.sync({
          fullSync: false,
          startDate: range.start,
          endDate: range.end,
        });
        totalProcessed += result.recordsProcessed;
        totalCreated += result.recordsCreated;
        totalUpdated += result.recordsUpdated;
        totalErrors += result.errors.length;
        console.log(`[backfill-cc] ${month}: ${result.recordsProcessed} processed, ${result.recordsUpdated} updated`);
      } catch (err) {
        console.error(`[backfill-cc] ${month} failed:`, err instanceof Error ? err.message : err);
        totalErrors++;
      }
    }

    return NextResponse.json({
      success: true,
      thinOrdersFound: thinOrders.length,
      monthsScanned: dateRanges.size,
      totalProcessed,
      totalCreated,
      totalUpdated,
      totalErrors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Backfill failed';
    console.error('[backfill-cc] error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
