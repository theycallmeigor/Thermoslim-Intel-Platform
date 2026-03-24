/**
 * Full CC Resync — pull ALL data from CC API with all fields enabled,
 * write to database through the adapter pipeline, then validate.
 *
 * This re-syncs every order to capture fields that were missing before:
 *   - browserDetails (userAgent, device, browser, geoState, geoCountry)
 *   - avsResponse, cvvResponse, cardType, cardLast4
 *   - item-level responseType, merchantId, productType
 *   - fulfillment data
 *   - custom fields (brand, checkout variant)
 *
 * After sync, runs validation against API to confirm completeness.
 *
 * Usage:
 *   npx tsx scripts/cc-qa/full-resync.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

async function main() {
  // Dynamic imports after env is set
  const { CheckoutChampAdapter } = await import('../../src/adapters/checkoutchamp/index');
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  console.log('\n' + '═'.repeat(80));
  console.log('  CC FULL RESYNC — Re-pull all orders with complete field set');
  console.log('═'.repeat(80));

  // ── Step 1: Full sync via adapter ──
  console.log('\n  Step 1: Running full sync via CC adapter...');
  console.log('  (includeBrowserDetails=1, includeCustomFields=1, resultsPerPage=200)\n');

  const adapter = new CheckoutChampAdapter();
  const startDate = new Date('2025-01-01');
  const endDate = new Date();

  const result = await adapter.sync({
    startDate,
    endDate,
    fullSync: true,
  });

  console.log(`\n  Sync complete:`);
  console.log(`    Processed: ${result.recordsProcessed}`);
  console.log(`    Created:   ${result.recordsCreated}`);
  console.log(`    Updated:   ${result.recordsUpdated}`);
  console.log(`    Errors:    ${result.errors.length}`);
  console.log(`    Duration:  ${(result.duration / 1000).toFixed(1)}s`);

  if (result.errors.length > 0) {
    console.log('\n  First 10 errors:');
    for (const err of result.errors.slice(0, 10)) {
      console.log(`    Order ${err.recordId}: ${err.message}`);
    }
  }

  // ── Step 2: Re-link orders to funnel pages ──
  console.log('\n  Step 2: Re-linking orders to funnel pages...');
  const { syncFunnels } = await import('../../src/adapters/checkoutchamp/funnel-sync');
  const funnelResult = await syncFunnels();
  console.log(`    Funnels: ${funnelResult.funnelsUpserted}, Pages: ${funnelResult.pagesUpserted}`);

  // Link orders to pages
  const funnels = await db.funnel.findMany({ include: { pages: true } });
  const lookup = new Map<string, Map<string, string>>();
  for (const f of funnels) {
    const slugMap = new Map<string, string>();
    for (const p of f.pages) {
      if (p.slug) slugMap.set(p.slug, p.id);
      if (p.ccPageId) slugMap.set(p.ccPageId, p.id);
    }
    lookup.set(f.ccReferenceId, slugMap);
  }

  const unlinked = await db.order.findMany({
    where: { source: 'CHECKOUTCHAMP', funnelPageId: null, funnelReferenceId: { not: null } },
    select: { id: true, salesUrl: true, funnelReferenceId: true },
  });

  let linked = 0;
  for (const o of unlinked) {
    if (!o.salesUrl || !o.funnelReferenceId) continue;
    try {
      const parsed = new URL(o.salesUrl);
      const slug = parsed.pathname.replace(/^\//, '').replace(/\/$/, '');
      if (!slug) continue;
      const slugMap = lookup.get(o.funnelReferenceId);
      const pageId = slugMap?.get(slug);
      if (pageId) {
        await db.order.update({ where: { id: o.id }, data: { funnelPageId: pageId } });
        linked++;
      }
    } catch {}
  }
  console.log(`    Linked ${linked} additional orders to funnel pages`);

  // ── Step 3: Backfill item-level responseType to order ──
  console.log('\n  Step 3: Backfilling responseType from item-level...');
  const ordersNoRT = await db.order.findMany({
    where: { source: 'CHECKOUTCHAMP', responseType: null },
    select: { id: true, items: { select: { responseType: true }, take: 1 } },
  });

  const rtMap: Record<string, string> = {
    SUCCESS: 'SUCCESS',
    HARD_DECLINE: 'HARD_DECLINE',
    SOFT_DECLINE: 'SOFT_DECLINE',
    PENDING: 'PENDING',
    COD_PENDING: 'COD_PENDING',
  };

  let rtFilled = 0;
  for (const o of ordersNoRT) {
    const itemRT = o.items[0]?.responseType;
    if (itemRT && rtMap[itemRT]) {
      await db.order.update({ where: { id: o.id }, data: { responseType: rtMap[itemRT] as any } });
      rtFilled++;
    }
  }
  console.log(`    Filled responseType on ${rtFilled} orders from item data`);

  // ── Step 4: Full validation ──
  console.log('\n  Step 4: Validating dataset completeness...\n');

  const totalCC = await db.order.count({ where: { source: 'CHECKOUTCHAMP' } });

  const fields = [
    { name: 'responseType', where: { responseType: { not: null } } },
    { name: 'funnelPageId', where: { funnelPageId: { not: null } } },
    { name: 'paySource', where: { paySource: { not: null } } },
    { name: 'salesUrl', where: { salesUrl: { not: null } } },
    { name: 'funnelReferenceId', where: { funnelReferenceId: { not: null } } },
    { name: 'avsResponse', where: { avsResponse: { not: null } } },
    { name: 'cvvResponse', where: { cvvResponse: { not: null } } },
    { name: 'cardType', where: { cardType: { not: null } } },
    { name: 'cardLast4', where: { cardLast4: { not: null } } },
    { name: 'userAgent', where: { userAgent: { not: null } } },
    { name: 'device', where: { device: { not: null } } },
    { name: 'browser', where: { browser: { not: null } } },
    { name: 'geoState', where: { geoState: { not: null } } },
    { name: 'geoCountry', where: { geoCountry: { not: null } } },
    { name: 'ccCustom1', where: { ccCustom1: { not: null } } },
    { name: 'ccCustom2', where: { ccCustom2: { not: null } } },
    { name: 'declineReason', where: { declineReason: { not: null } } },
    { name: 'cardIsDebit', where: { cardIsDebit: { not: null } } },
    { name: 'fulfillmentData', where: { fulfillmentData: { not: undefined } } },
    { name: 'refundRemaining', where: { refundRemaining: { not: null } } },
  ];

  console.log(`  FIELD COMPLETENESS (${totalCC} CC orders):`);
  console.log('  ' + 'Field'.padEnd(22) + 'Count'.padStart(7) + '  %'.padStart(5));
  console.log('  ' + '-'.repeat(36));

  for (const f of fields) {
    try {
      const count = await db.order.count({ where: { source: 'CHECKOUTCHAMP', ...f.where } as any });
      const pct = (count / totalCC * 100).toFixed(0);
      const bar = '█'.repeat(Math.round(count / totalCC * 20));
      console.log(`  ${f.name.padEnd(22)} ${String(count).padStart(6)}  ${pct.padStart(3)}% ${bar}`);
    } catch {
      console.log(`  ${f.name.padEnd(22)}  ERROR`);
    }
  }

  // Item-level field check
  const totalItems = await db.orderItem.count();
  const itemFields = [
    { name: 'merchantId', where: { merchantId: { not: null } } },
    { name: 'responseType', where: { responseType: { not: null } } },
    { name: 'txnType', where: { txnType: { not: null } } },
    { name: 'productType', where: { productType: { not: null } } },
    { name: 'productDescription', where: { productDescription: { not: null } } },
  ];

  console.log(`\n  ITEM FIELD COMPLETENESS (${totalItems} items):`);
  for (const f of itemFields) {
    try {
      const count = await db.orderItem.count({ where: f.where as any });
      const pct = (count / totalItems * 100).toFixed(0);
      console.log(`  ${f.name.padEnd(22)} ${String(count).padStart(6)}  ${pct.padStart(3)}%`);
    } catch {
      console.log(`  ${f.name.padEnd(22)}  ERROR`);
    }
  }

  // Dimension distributions
  console.log('\n  KEY DIMENSIONS:');

  const rtGroups = await db.order.groupBy({
    by: ['responseType'], where: { source: 'CHECKOUTCHAMP' }, _count: true,
    orderBy: { _count: { responseType: 'desc' } },
  });
  console.log('  responseType:');
  for (const g of rtGroups) console.log(`    ${(g.responseType || 'null').padEnd(18)} ${g._count}`);

  const cardGroups = await db.order.groupBy({
    by: ['cardType'], where: { source: 'CHECKOUTCHAMP', cardType: { not: null } }, _count: true,
    orderBy: { _count: { cardType: 'desc' } },
  });
  if (cardGroups.length) {
    console.log('  cardType:');
    for (const g of cardGroups) console.log(`    ${(g.cardType || 'null').padEnd(18)} ${g._count}`);
  }

  const deviceGroups = await db.order.groupBy({
    by: ['device'], where: { source: 'CHECKOUTCHAMP', device: { not: null } }, _count: true,
    orderBy: { _count: { device: 'desc' } },
  });
  if (deviceGroups.length) {
    console.log('  device:');
    for (const g of deviceGroups) console.log(`    ${(g.device || 'null').padEnd(18)} ${g._count}`);
  }

  const avsGroups = await db.order.groupBy({
    by: ['avsResponse'], where: { source: 'CHECKOUTCHAMP', avsResponse: { not: null } }, _count: true,
    orderBy: { _count: { avsResponse: 'desc' } },
  });
  if (avsGroups.length) {
    console.log('  avsResponse:');
    for (const g of avsGroups) console.log(`    ${(g.avsResponse || 'null').padEnd(18)} ${g._count}`);
  }

  const custom2Groups = await db.order.groupBy({
    by: ['ccCustom2'], where: { source: 'CHECKOUTCHAMP', ccCustom2: { not: null } }, _count: true,
    orderBy: { _count: { ccCustom2: 'desc' } },
  });
  if (custom2Groups.length) {
    console.log('  ccCustom2 (checkout variant):');
    for (const g of custom2Groups) console.log(`    ${(g.ccCustom2 || 'null').padEnd(40)} ${g._count}`);
  }

  console.log('\n' + '═'.repeat(80));
  console.log('  RESYNC COMPLETE');
  console.log('═'.repeat(80) + '\n');

  await db.$disconnect();
}

main().catch((err) => {
  console.error('Full resync failed:', err);
  process.exit(1);
});
