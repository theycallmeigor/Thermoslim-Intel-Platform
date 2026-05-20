/**
 * One-time backfill script: populate UpsellPath table from existing OrderItem data.
 *
 * For each COMPLETE order from source SHOPIFY or MERGED:
 *   - Skips orders that already have a UpsellPath row.
 *   - Counts UPSALE items → upsellsAccepted
 *   - Sums UPSALE item prices → revenueAdded (cents)
 *   - First OFFER item's productMapId → initialProductMapId
 *   - Last item's productMapId (OFFER or UPSALE, by productSlot) → finalProductMapId
 *   - upsellsDeclined = 0 (can't derive from order data alone)
 *
 * Creates a row for ALL qualifying orders — including those with zero upsells —
 * so we know definitively which orders had no upsell activity.
 *
 * Usage:
 *   npx tsx scripts/populate-upsell-paths.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = ['.env.local', '.env.production', '.env']
  .map(f => path.resolve(__dirname, '..', f))
  .find(p => fs.existsSync(p));

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  console.warn('Warning: no .env file found — relying on existing environment variables');
}

import { prisma } from '../src/lib/prisma';

const BATCH_SIZE = 500;
const LOG_EVERY = 100;

async function main() {
  console.log('\n=== Populate UpsellPath from OrderItem data ===\n');

  // Count total qualifying orders upfront so we can report progress
  const totalOrders = await prisma.order.count({
    where: {
      source: { in: ['SHOPIFY', 'MERGED'] },
      status: 'COMPLETE',
    },
  });

  console.log(`Total qualifying orders (SHOPIFY/MERGED, COMPLETE): ${totalOrders}\n`);

  let processed = 0;
  let created = 0;
  let skipped = 0;
  let errors = 0;
  let cursor: string | undefined = undefined;

  while (true) {
    const orders = await prisma.order.findMany({
      where: {
        source: { in: ['SHOPIFY', 'MERGED'] },
        status: 'COMPLETE',
      },
      select: {
        id: true,
        upsellPath: { select: { id: true } },
        items: {
          select: {
            productSlot: true,
            productMapId: true,
            productType: true,
            price: true,
            quantity: true,
          },
          orderBy: { productSlot: 'asc' },
        },
      },
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    });

    if (orders.length === 0) break;

    for (const order of orders) {
      processed++;

      try {
        // Skip if UpsellPath already exists for this order
        if (order.upsellPath) {
          skipped++;
          if (processed % LOG_EVERY === 0) {
            console.log(`  [${processed}/${totalOrders}] processed (${created} created, ${skipped} skipped, ${errors} errors)`);
          }
          continue;
        }

        const items = order.items;

        // Items with a known productType only — filter for classification
        const offerItems = items.filter(i => i.productType === 'OFFER');
        const upsaleItems = items.filter(i => i.productType === 'UPSALE');

        // upsellsAccepted = count of UPSALE items
        const upsellsAccepted = upsaleItems.length;

        // revenueAdded = sum of UPSALE item (price × quantity), in cents
        const revenueAdded = upsaleItems.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0,
        );

        // initialProductMapId = first OFFER item's productMapId (may be null)
        const initialProductMapId = offerItems.length > 0
          ? (offerItems[0].productMapId ?? null)
          : null;

        // finalProductMapId = last item's productMapId regardless of type
        // items are already sorted by productSlot asc; take the last one
        const lastItem = items.length > 0 ? items[items.length - 1] : null;
        const finalProductMapId = lastItem?.productMapId ?? null;

        await prisma.upsellPath.upsert({
          where: { orderId: order.id },
          create: {
            orderId: order.id,
            initialProductMapId,
            finalProductMapId,
            upsellsAccepted,
            upsellsDeclined: 0,
            revenueAdded,
          },
          update: {
            initialProductMapId,
            finalProductMapId,
            upsellsAccepted,
            revenueAdded,
          },
        });

        created++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`  ERROR processing order ${order.id}: ${message}`);
        errors++;
      }

      if (processed % LOG_EVERY === 0) {
        console.log(`  [${processed}/${totalOrders}] processed (${created} created, ${skipped} skipped, ${errors} errors)`);
      }
    }

    cursor = orders[orders.length - 1].id;

    if (orders.length < BATCH_SIZE) break;
  }

  console.log('\n=== Summary ===');
  console.log(`  Total orders scanned:  ${processed}`);
  console.log(`  UpsellPath created:    ${created}`);
  console.log(`  Already existed:       ${skipped}`);
  console.log(`  Errors:                ${errors}`);
  console.log('');
}

main()
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
