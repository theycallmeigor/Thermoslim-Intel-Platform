/**
 * Cleanup script: remove SHOPIFY rows that duplicate an existing MERGED row.
 *
 * When a Shopify webhook re-fires after a CC merge, the pipeline used to create
 * a new (SHOPIFY, sourceOrderId) row because the original was now (MERGED, sourceOrderId).
 * This script finds and deletes those orphan SHOPIFY duplicates.
 *
 * Usage:
 *   npx tsx scripts/cleanup-shopify-duplicates-of-merged.ts --dry-run
 *   npx tsx scripts/cleanup-shopify-duplicates-of-merged.ts
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

const envProd = path.resolve(__dirname, '../.env.production');
if (fs.existsSync(envProd)) dotenv.config({ path: envProd });
const envLocal = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!;

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  console.log(`\n=== Cleanup: SHOPIFY duplicates of MERGED orders ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  try {
    // Find all MERGED orders
    const mergedOrders = await prisma.order.findMany({
      where: { source: 'MERGED' },
      select: { sourceOrderId: true },
    });

    console.log(`Found ${mergedOrders.length} MERGED orders\n`);

    let deleted = 0;
    let errors = 0;

    for (const merged of mergedOrders) {
      // Check if a duplicate SHOPIFY row exists with the same sourceOrderId
      const duplicate = await prisma.order.findUnique({
        where: {
          source_sourceOrderId: { source: 'SHOPIFY', sourceOrderId: merged.sourceOrderId },
        },
        select: { id: true, sourceOrderId: true, createdAt: true },
      });

      if (!duplicate) continue;

      console.log(`  DELETE: duplicate SHOPIFY row for order ${duplicate.sourceOrderId} (created ${duplicate.createdAt.toISOString()})`);

      if (DRY_RUN) {
        deleted++;
        continue;
      }

      try {
        await prisma.$transaction(async (tx) => {
          await tx.attribution.deleteMany({ where: { orderId: duplicate.id } });
          await tx.orderItem.deleteMany({ where: { orderId: duplicate.id } });
          await tx.revenueEvent.deleteMany({ where: { orderId: duplicate.id } });
          await tx.funnelEvent.deleteMany({ where: { orderId: duplicate.id } });
          await tx.upsellPath.deleteMany({ where: { orderId: duplicate.id } });
          await tx.order.delete({ where: { id: duplicate.id } });
        });
        deleted++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`  ERROR deleting ${duplicate.sourceOrderId}: ${message}`);
        errors++;
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`  Deleted: ${deleted}`);
    console.log(`  Errors:  ${errors}`);
    if (DRY_RUN) console.log(`\n  (Dry run — no changes were made)`);
    console.log('');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
