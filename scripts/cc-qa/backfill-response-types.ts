/**
 * Backfill responseType from CC API item-level data.
 * CC puts responseType on each item (CCItem.responseType), not the order.
 * We use the first item's responseType as the order-level value.
 *
 * Usage:
 *   npx tsx scripts/cc-qa/backfill-response-types.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

async function main() {
  const { config } = await import('../../src/core/config');
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  const baseUrl = config.checkoutChamp.apiUrl.replace(/\/$/, '');
  const authParams = {
    loginId: config.checkoutChamp.apiUsername,
    password: config.checkoutChamp.apiKey,
  };
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const responseTypeMap: Record<string, string> = {
    SUCCESS: 'SUCCESS',
    HARD_DECLINE: 'HARD_DECLINE',
    SOFT_DECLINE: 'SOFT_DECLINE',
    PENDING: 'PENDING',
    COD_PENDING: 'COD_PENDING',
  };

  console.log('\n  Backfill responseType from CC API item-level data\n');

  // Get date range
  const oldest = await db.order.findFirst({
    where: { source: 'CHECKOUTCHAMP' },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });
  const newest = await db.order.findFirst({
    where: { source: 'CHECKOUTCHAMP' },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  if (!oldest || !newest) { console.log('  No CC orders'); return; }

  const from = oldest.createdAt;
  const to = new Date(newest.createdAt.getTime() + 86400000);
  console.log(`  Range: ${formatDate(from)} to ${formatDate(to)}`);

  // Fetch all orders from API in 30-day chunks
  let totalFetched = 0;
  let updated = 0;
  let declinesFilled = 0;
  let skipped = 0;

  // Sample first to see what fields exist
  let sampleShown = false;

  let chunkStart = new Date(from);
  while (chunkStart < to) {
    const chunkEnd = new Date(Math.min(
      chunkStart.getTime() + 30 * 86400000,
      to.getTime(),
    ));

    let page = 1;
    let totalResults = Infinity;

    while ((page - 1) * 25 < totalResults) {
      const qs = new URLSearchParams({
        ...authParams,
        startDate: formatDate(chunkStart),
        endDate: formatDate(chunkEnd),
        page: String(page),
      });

      try {
        const res = await fetch(`${baseUrl}/order/query/?${qs}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (json.result !== 'SUCCESS') {
          if (typeof json.message === 'string' && json.message.toLowerCase().includes('no orders')) break;
          throw new Error(`API: ${JSON.stringify(json.message)}`);
        }
        if (typeof json.message === 'string') break;

        totalResults = json.message.totalResults;
        const data = json.message.data;
        if (!data || !data.length) break;

        for (const order of data) {
          totalFetched++;

          // Show sample of first order's structure
          if (!sampleShown) {
            console.log('\n  Sample order fields:');
            console.log(`    order.responseType: ${JSON.stringify(order.responseType)}`);
            console.log(`    order.declineReason: ${JSON.stringify(order.declineReason)}`);
            if (order.items && typeof order.items === 'object') {
              const firstItem = Object.values(order.items)[0] as any;
              if (firstItem) {
                console.log(`    item.responseType: ${JSON.stringify(firstItem.responseType)}`);
                console.log(`    item.txnType: ${JSON.stringify(firstItem.txnType)}`);
              }
            }
            sampleShown = true;
            console.log('');
          }

          // Extract responseType: try order level first, then first item
          let rt = order.responseType || '';
          let declineReason = order.declineReason || '';

          if (!rt && order.items && typeof order.items === 'object') {
            const items = Object.values(order.items) as any[];
            for (const item of items) {
              if (item.responseType) {
                rt = item.responseType;
                break;
              }
            }
          }

          const mappedRt = responseTypeMap[rt];
          if (!mappedRt && !declineReason) {
            skipped++;
            continue;
          }

          // Find in DB and update
          try {
            const dbOrder = await db.order.findFirst({
              where: { source: 'CHECKOUTCHAMP', sourceOrderId: String(order.orderId) },
              select: { id: true, responseType: true, declineReason: true },
            });
            if (!dbOrder) { skipped++; continue; }

            const updateData: Record<string, unknown> = {};
            if (mappedRt && !dbOrder.responseType) {
              updateData.responseType = mappedRt;
            }
            if (declineReason && !dbOrder.declineReason) {
              updateData.declineReason = declineReason;
              declinesFilled++;
            }

            if (Object.keys(updateData).length > 0) {
              await db.order.update({ where: { id: dbOrder.id }, data: updateData });
              updated++;
            }
          } catch {
            // skip individual errors
          }
        }

        page++;
      } catch (err: any) {
        console.log(`  Error ${formatDate(chunkStart)} p${page}: ${err.message}`);
        break;
      }
    }

    console.log(`  ${formatDate(chunkStart)} → ${formatDate(chunkEnd)}: fetched ${totalFetched} total, updated ${updated}`);
    chunkStart = new Date(chunkEnd.getTime() + 86400000);
  }

  // Show final counts
  console.log('\n  ─── RESULTS ───');
  console.log(`  Fetched from API: ${totalFetched}`);
  console.log(`  Updated responseType: ${updated}`);
  console.log(`  Decline reasons filled: ${declinesFilled}`);
  console.log(`  Skipped (no data): ${skipped}`);

  // Show what we got
  const rtGroups = await db.order.groupBy({
    by: ['responseType'],
    where: { source: 'CHECKOUTCHAMP' },
    _count: true,
    orderBy: { _count: { responseType: 'desc' } },
  });
  console.log('\n  responseType distribution after backfill:');
  for (const g of rtGroups) {
    console.log(`    ${(g.responseType || 'null').padEnd(20)} ${g._count}`);
  }

  const withDecline = await db.order.count({
    where: { source: 'CHECKOUTCHAMP', declineReason: { not: null } },
  });
  console.log(`\n  Orders with declineReason: ${withDecline}`);

  if (withDecline > 0) {
    const declineOrders = await db.order.findMany({
      where: { source: 'CHECKOUTCHAMP', declineReason: { not: null } },
      select: { declineReason: true },
    });
    const reasons: Record<string, number> = {};
    for (const o of declineOrders) {
      const r = o.declineReason || 'unknown';
      reasons[r] = (reasons[r] || 0) + 1;
    }
    console.log('  Top decline reasons:');
    for (const [r, c] of Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
      console.log(`    ${r.padEnd(45)} ${c}`);
    }
  }

  await db.$disconnect();
  console.log('\n  Done.\n');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
