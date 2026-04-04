/**
 * One-time backfill script: populate FunnelEvent table from existing Order data.
 *
 * Logic:
 *   - Targets orders with source IN (SHOPIFY, MERGED) and status = COMPLETE
 *   - For each order, matches to a FunnelConfig by funnelReferenceId or salesUrl slug
 *   - For each page in the matched funnel config:
 *       - Checks if order has items whose ccCrmId matches that page's productCrmIds
 *       - accepted=true  → order has an item matching this page
 *       - accepted=false → order has no match for this page, but HAS a match for a
 *                          later page (meaning the customer saw this page and declined)
 *   - Skips if a FunnelEvent already exists for this orderId + step combo
 *
 * Usage:
 *   npx tsx scripts/populate-funnel-events.ts            # dry-run (default — safe)
 *   npx tsx scripts/populate-funnel-events.ts --execute   # live writes
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
import { FUNNEL_CONFIGS } from '../src/config/funnel-config';

const DRY_RUN = !process.argv.includes('--execute');
const BATCH_SIZE = 500;
const LOG_EVERY = 100;

/** Extract the last path segment from a URL slug, e.g. "https://…/checkout-bsd-quiz" → "checkout-bsd-quiz" */
function extractSlug(salesUrl: string | null): string {
  if (!salesUrl) return '';
  return salesUrl.replace(/\/$/, '').split('/').pop() ?? '';
}

async function main() {
  console.log('\n=== Populate FunnelEvent from Orders ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE'}\n`);

  const totalOrders = await prisma.order.count({
    where: {
      source: { in: ['SHOPIFY', 'MERGED'] },
      status: 'COMPLETE',
    },
  });

  console.log(`Total qualifying orders (SHOPIFY/MERGED, COMPLETE): ${totalOrders}`);
  console.log(`Funnel configs loaded: ${FUNNEL_CONFIGS.length} (${FUNNEL_CONFIGS.map(f => f.name).join(', ')})\n`);

  let processed = 0;
  let eventsCreated = 0;
  let eventsSkipped = 0;
  let ordersNoFunnel = 0;
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
        customerId: true,
        funnelReferenceId: true,
        salesUrl: true,
        createdAt: true,
        funnelEvents: { select: { step: true } },
        items: {
          select: {
            ccCrmId: true,
            productMapId: true,
            productType: true,
          },
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
        // Match order to a funnel config
        const slug = extractSlug(order.salesUrl);
        let funnelConfig = FUNNEL_CONFIGS.find(
          f => order.funnelReferenceId && f.referenceId === order.funnelReferenceId,
        );
        if (!funnelConfig && slug) {
          funnelConfig = FUNNEL_CONFIGS.find(f => f.checkoutSlugs.includes(slug));
        }

        if (!funnelConfig) {
          ordersNoFunnel++;
          continue;
        }

        // Build a set of ccCrmIds present on this order
        const orderCrmIds = new Set(
          order.items.map(i => i.ccCrmId).filter((id): id is string => !!id),
        );

        // Build a map: ccCrmId → productMapId (for accepted events)
        const crmIdToProductMapId = new Map<string, string | null>();
        for (const item of order.items) {
          if (item.ccCrmId && !crmIdToProductMapId.has(item.ccCrmId)) {
            crmIdToProductMapId.set(item.ccCrmId, item.productMapId ?? null);
          }
        }

        // Existing steps already recorded for this order
        const existingSteps = new Set(order.funnelEvents.map(e => e.step));

        // Determine which pages in the funnel this order has items for
        const pagesWithMatch = funnelConfig.pages.map(page => ({
          page,
          matched: page.productCrmIds.some(id => orderCrmIds.has(id)),
        }));

        // Find the index of the last page that has a match — defines how far through
        // the funnel this customer went (i.e., reached all pages up to this point)
        const lastMatchedIndex = pagesWithMatch.reduce(
          (max, { matched }, idx) => (matched ? idx : max),
          -1,
        );

        if (lastMatchedIndex === -1) {
          // No funnel items at all — skip (probably a direct Shopify order not in CC funnel)
          ordersNoFunnel++;
          continue;
        }

        // Create FunnelEvents for all pages up to and including the last matched page
        for (let i = 0; i <= lastMatchedIndex; i++) {
          const { page, matched } = pagesWithMatch[i];
          const step = page.name;

          if (existingSteps.has(step)) {
            eventsSkipped++;
            continue;
          }

          // Find the productMapId for this page (first matching item)
          let productMapId: string | null = null;
          if (matched) {
            for (const crmId of page.productCrmIds) {
              if (orderCrmIds.has(crmId)) {
                productMapId = crmIdToProductMapId.get(crmId) ?? null;
                break;
              }
            }
          }

          if (DRY_RUN) {
            console.log(
              `  [DRY RUN] order=${order.id} step="${step}" accepted=${matched} productMapId=${productMapId ?? 'null'}`,
            );
            eventsCreated++;
            continue;
          }

          await prisma.funnelEvent.create({
            data: {
              orderId: order.id,
              customerId: order.customerId,
              step,
              accepted: matched,
              productMapId,
              occurredAt: order.createdAt,
            },
          });

          eventsCreated++;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`  ERROR processing order ${order.id}: ${message}`);
        errors++;
      }

      if (processed % LOG_EVERY === 0) {
        console.log(
          `  [${processed}/${totalOrders}] processed (events created: ${eventsCreated}, skipped: ${eventsSkipped}, no-funnel: ${ordersNoFunnel}, errors: ${errors})`,
        );
      }
    }

    cursor = orders[orders.length - 1].id;
    if (orders.length < BATCH_SIZE) break;
  }

  console.log('\n=== Summary ===');
  console.log(`  Orders scanned:          ${processed}`);
  console.log(`  FunnelEvents created:    ${eventsCreated}`);
  console.log(`  Steps already existed:   ${eventsSkipped}`);
  console.log(`  Orders with no funnel:   ${ordersNoFunnel}`);
  console.log(`  Errors:                  ${errors}`);
  if (DRY_RUN) {
    console.log(`\n  (Dry run — no changes were made. Re-run with --execute to apply.)`);
  }
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
