/**
 * One-time backfill script: populate RevenueEvent table from existing Order data.
 *
 * Rules:
 *   - Targets orders with source IN (SHOPIFY, MERGED) and status IN (COMPLETE, REFUNDED)
 *   - Skips orders that already have at least one RevenueEvent
 *   - COMPLETE orders get a SALE event (or REBILL if ccOrderType === 'REBILL')
 *   - REFUNDED orders get a SALE/REBILL event AND a REFUND event
 *   - amount = order.totalPrice (cents), occurredAt = order.createdAt
 *
 * Usage:
 *   npx tsx scripts/populate-revenue-events.ts           # dry-run (default — safe)
 *   npx tsx scripts/populate-revenue-events.ts --execute  # live writes
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

const envPath = ['.env.local', '.env.production', '.env']
  .map(f => path.resolve(__dirname, '..', f))
  .find(p => fs.existsSync(p));
dotenv.config({ path: envPath });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

import { prisma } from '../src/lib/prisma';

const DRY_RUN = !process.argv.includes('--execute');

async function main() {
  console.log(`\n=== Populate RevenueEvent from Orders ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE'}\n`);

  const orders = await prisma.order.findMany({
    where: {
      source: { in: ['SHOPIFY', 'MERGED'] },
      status: { in: ['COMPLETE', 'REFUNDED'] },
    },
    select: {
      id: true,
      sourceOrderId: true,
      source: true,
      status: true,
      totalPrice: true,
      ccOrderType: true,
      createdAt: true,
      customerId: true,
      revenueEvents: { select: { id: true }, take: 1 },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${orders.length} eligible orders (SHOPIFY/MERGED, COMPLETE/REFUNDED)\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];

    if (i > 0 && i % 100 === 0) {
      console.log(`  Progress: ${i}/${orders.length} orders processed (created: ${created}, skipped: ${skipped}, errors: ${errors})`);
    }

    // Skip if this order already has revenue events
    if (order.revenueEvents.length > 0) {
      skipped++;
      continue;
    }

    const saleEventType = order.ccOrderType === 'REBILL' ? 'REBILL' : 'SALE';

    try {
      if (DRY_RUN) {
        if (order.status === 'REFUNDED') {
          console.log(`  [DRY RUN] ${order.sourceOrderId} → ${saleEventType} + REFUND (${order.totalPrice} cents)`);
        }
        // For COMPLETE orders, only log every 500 to avoid noise
        created += order.status === 'REFUNDED' ? 2 : 1;
        continue;
      }

      if (order.status === 'COMPLETE') {
        await prisma.revenueEvent.create({
          data: {
            orderId: order.id,
            customerId: order.customerId,
            source: order.source,
            eventType: saleEventType as 'SALE' | 'REBILL',
            amount: order.totalPrice,
            occurredAt: order.createdAt,
          },
        });
        created++;
      } else if (order.status === 'REFUNDED') {
        // Create both a sale event and a refund event
        await prisma.$transaction([
          prisma.revenueEvent.create({
            data: {
              orderId: order.id,
              customerId: order.customerId,
              source: order.source,
              eventType: saleEventType as 'SALE' | 'REBILL',
              amount: order.totalPrice,
              occurredAt: order.createdAt,
            },
          }),
          prisma.revenueEvent.create({
            data: {
              orderId: order.id,
              customerId: order.customerId,
              source: order.source,
              eventType: 'REFUND' as 'REFUND',
              amount: order.totalPrice,
              refundReason: 'Backfilled from REFUNDED order status',
              occurredAt: order.createdAt,
            },
          }),
        ]);
        created += 2;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR processing order ${order.sourceOrderId} (${order.id}): ${message}`);
      errors++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Orders scanned:         ${orders.length}`);
  console.log(`  Events created:         ${created}`);
  console.log(`  Orders skipped:         ${skipped} (already had events)`);
  console.log(`  Errors:                 ${errors}`);
  if (DRY_RUN) {
    console.log(`\n  (Dry run — no changes were made. Re-run with --execute to apply.)`);
  }
  console.log('');
}

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
