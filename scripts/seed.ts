// Product map seed + enrichment script
// Enriches existing ProductMap entries with productLine, category, frequency, isSubscription
// Also backfills Subscription.productMapId and OrderItem.productMapId where missing
// Usage: npx tsx scripts/seed.ts

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocal = path.resolve(process.cwd(), '.env.local');
const envFile = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envLocal)) {
  dotenv.config({ path: envLocal });
} else {
  dotenv.config({ path: envFile });
}
process.env.DIRECT_URL = process.env.DATABASE_URL!;

// ─── SKU-based metadata rules ─────────────────────────────────────────────────
// Series codes map to product lines
const SERIES_TO_LINE: Record<string, { productLine: string; category: string }> = {
  'WM373001': { productLine: 'Body Sculpting Device', category: 'Device' },
  'WM408001': { productLine: 'Sculpt+ Conductive Gel',  category: 'Consumable' },
  'PQ030001': { productLine: 'Sculpt+ Cellulite Scrub', category: 'Consumable' },
  'PQ022001': { productLine: 'Maintenance Cream',       category: 'Consumable' },
  'PQ064001': { productLine: 'GLP-1 Support+',          category: 'Supplement' },
  'PQ070001': { productLine: 'Smooth Skin+',            category: 'Consumable' },
  'PQ017001': { productLine: 'Replacement Filter',      category: 'Accessory' },
};

// Qty suffix → frequency label
const SUFFIX_TO_FREQUENCY: Record<string, string> = {
  '1PCS': '1-month',
  '2PCS': '2-month',
  '3PCS': '3-month',
  '6PCS': '6-month',
};

// CC CRM product IDs → canonical productLine (for CC-only items not in Shopify catalog)
const CC_CRM_TO_LINE: Record<string, { productLine: string; category: string; frequency?: string }> = {
  '273': { productLine: 'Body Sculpting Device', category: 'Device' },        // Starter Bundle
  '191': { productLine: 'Body Sculpting Device', category: 'Device' },        // Device only
  '239': { productLine: 'Sculpt+ Conductive Gel',  category: 'Consumable' },  // Gel upsell
  '28':  { productLine: 'Sculpt+ Conductive Gel',  category: 'Consumable' },
  '241': { productLine: 'Maintenance Cream',       category: 'Consumable' },  // Cream upsell
  '243': { productLine: 'Maintenance Cream',       category: 'Consumable' },  // Cream downsell
  '261': { productLine: 'Body Sculpting Device', category: 'Device' },        // Bundle variant
  '193': { productLine: 'Sculpt+ Conductive Gel',  category: 'Consumable', frequency: '1-month' },
  '293': { productLine: 'Sculpt+ Conductive Gel',  category: 'Consumable', frequency: '3-month' },
  '297': { productLine: 'Sculpt+ Conductive Gel',  category: 'Consumable', frequency: '6-month' },
  '255': { productLine: 'Sculpt+ Conductive Gel',  category: 'Consumable', frequency: '3-month' },
  '307': { productLine: 'Maintenance Cream',       category: 'Consumable', frequency: '1-month' },
  '309': { productLine: 'Maintenance Cream',       category: 'Consumable', frequency: '3-month' },
  '313': { productLine: 'Maintenance Cream',       category: 'Consumable', frequency: '1-month' },
};

function deriveFromSku(sku: string | null): {
  productLine: string | null;
  category: string | null;
  frequency: string | null;
  isSubscription: boolean;
} {
  if (!sku) return { productLine: null, category: null, frequency: null, isSubscription: false };

  // Find which series code is in this SKU
  let productLine: string | null = null;
  let category: string | null = null;
  for (const [series, meta] of Object.entries(SERIES_TO_LINE)) {
    if (sku.includes(series)) {
      productLine = meta.productLine;
      category = meta.category;
      break;
    }
  }

  // Detect if it's a bundle (multiple series codes in SKU)
  const seriesCount = Object.keys(SERIES_TO_LINE).filter(s => sku.includes(s)).length;
  if (seriesCount > 1) {
    productLine = 'Bundle';
    category = 'Bundle';
  }

  // Derive frequency from qty suffix
  let frequency: string | null = null;
  for (const [suffix, freq] of Object.entries(SUFFIX_TO_FREQUENCY)) {
    if (sku.endsWith(suffix)) {
      frequency = freq;
      break;
    }
  }
  if (!frequency && !sku.includes('-')) {
    frequency = '1-month'; // base variant with no suffix = single unit
  }

  // Devices are not subscriptions by default (they're one-time purchases)
  // Consumables and supplements can be subscriptions
  const isSubscription = category !== 'Device' && category !== 'Bundle' && category !== 'Accessory';

  return { productLine, category, frequency, isSubscription };
}

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  console.log('─── Step 1: Enrich existing ProductMap entries ───────────────────────');

  const allMaps = await db.productMap.findMany();
  console.log(`Found ${allMaps.length} existing ProductMap entries`);

  let updated = 0;
  for (const pm of allMaps) {
    const fromSku = deriveFromSku(pm.sku);

    // Check if CC CRM ID has a known mapping
    const fromCc = pm.ccCrmId ? CC_CRM_TO_LINE[pm.ccCrmId] : null;

    const productLine = fromSku.productLine ?? fromCc?.productLine ?? pm.productLine;
    const category    = fromSku.category    ?? fromCc?.category    ?? pm.category;
    const frequency   = fromSku.frequency   ?? fromCc?.frequency   ?? pm.frequency;
    const isSubscription = fromSku.isSubscription;

    // Detect "Bundle" from name if not already caught by SKU
    const isBundleName = /bundle|starter|value|ultimate|all.in.one/i.test(pm.name);
    const finalLine = isBundleName && !productLine ? 'Bundle' : productLine;
    const finalCat  = isBundleName && !category    ? 'Bundle' : category;

    // Skip test/draft entries
    if (/igor test|do not delete|draft/i.test(pm.name)) continue;

    if (finalLine || frequency !== pm.frequency || isSubscription !== pm.isSubscription) {
      await db.productMap.update({
        where: { id: pm.id },
        data: {
          productLine: finalLine ?? pm.productLine,
          category:    finalCat  ?? pm.category,
          frequency:   frequency ?? pm.frequency,
          isSubscription,
        },
      });
      updated++;
    }
  }
  console.log(`Updated ${updated} ProductMap entries with metadata`);

  // ─── Step 2: Backfill Subscription.productMapId ──────────────────────────────
  console.log('\n─── Step 2: Backfill Subscription.productMapId ──────────────────────');

  const unlinkedSubs = await db.subscription.findMany({
    where: { productMapId: null },
    select: {
      id: true,
      originalOrderId: true,
      ccPurchaseId: true,
    },
    take: 5000,
  });
  console.log(`Subscriptions without productMapId: ${unlinkedSubs.length}`);

  let subsLinked = 0;
  for (const sub of unlinkedSubs) {
    let pm = null;

    // Subscriptions link to products via the order's items — find ccCrmId on the order item
    // that has the matching ccPurchaseId
    if (sub.originalOrderId) {
      const items = await db.orderItem.findMany({
        where: { orderId: sub.originalOrderId },
        select: { ccCrmId: true, externalId: true, productMapId: true },
      });

      for (const item of items) {
        // If the item already has a productMapId, use it
        if (item.productMapId) {
          pm = await db.productMap.findUnique({ where: { id: item.productMapId } });
          if (pm) break;
        }
        // Otherwise try ccCrmId
        if (item.ccCrmId) {
          pm = await db.productMap.findFirst({ where: { ccCrmId: item.ccCrmId } });
          if (pm) break;
        }
        // Try externalId → shopifyProductId
        if (!pm && item.externalId) {
          pm = await db.productMap.findFirst({
            where: { OR: [{ shopifyProductId: item.externalId }, { externalId: item.externalId }] },
          });
          if (pm) break;
        }
      }
    }

    if (pm) {
      await db.subscription.update({ where: { id: sub.id }, data: { productMapId: pm.id } });
      subsLinked++;
    }
  }
  console.log(`Linked ${subsLinked} subscriptions to ProductMap entries`);

  // ─── Step 2a: Register unknown CC product IDs by name-matching ──────────────
  console.log('\n─── Step 2a: Register unknown CC product IDs by name ────────────────');
  // Find all unique ccCrmId values in OrderItems that have no ProductMap entry yet
  const allItems = await db.orderItem.findMany({
    where: { ccCrmId: { not: null } },
    select: { ccCrmId: true, name: true },
  });
  const unknownCcIds = new Map<string, string>(); // ccCrmId → name
  for (const item of allItems) {
    if (!item.ccCrmId || !item.name) continue;
    if (!unknownCcIds.has(item.ccCrmId)) unknownCcIds.set(item.ccCrmId, item.name);
  }

  // Check which ones still have no ProductMap
  const allMapsForCheck = await db.productMap.findMany({ select: { id: true, ccCrmId: true, productLine: true, name: true } });
  const existingCcIds = new Set(allMapsForCheck.filter(m => m.ccCrmId).map(m => m.ccCrmId!));

  let nameMatched = 0;
  for (const [ccCrmId, itemName] of unknownCcIds) {
    if (existingCcIds.has(ccCrmId)) continue;

    // Find best ProductMap match by productLine keyword in item name
    const fromCC = CC_CRM_TO_LINE[ccCrmId];
    const targetLine = fromCC?.productLine;

    let match = null;
    if (targetLine) {
      match = allMapsForCheck.find(m => m.productLine === targetLine);
    }

    // Fallback: match by name keywords
    if (!match) {
      const lower = itemName.toLowerCase();
      if (lower.includes('device') || lower.includes('sculpting device')) {
        match = allMapsForCheck.find(m => m.productLine === 'Body Sculpting Device');
      } else if (lower.includes('gel')) {
        match = allMapsForCheck.find(m => m.productLine === 'Sculpt+ Conductive Gel');
      } else if (lower.includes('cream')) {
        match = allMapsForCheck.find(m => m.productLine === 'Maintenance Cream');
      } else if (lower.includes('bundle')) {
        match = allMapsForCheck.find(m => m.productLine === 'Bundle');
      } else if (lower.includes('glp') || lower.includes('support')) {
        match = allMapsForCheck.find(m => m.productLine === 'GLP-1 Support+');
      }
    }

    if (match && !match.ccCrmId) {
      await db.productMap.update({ where: { id: match.id }, data: { ccCrmId } });
      existingCcIds.add(ccCrmId);
      match.ccCrmId = ccCrmId; // update local cache
      nameMatched++;
    }
  }
  console.log(`Matched ${nameMatched} new CC product IDs by name`);

  // ─── Step 2b: Set ccCrmId on ProductMap entries from already-linked OrderItems ──
  console.log('\n─── Step 2b: Bridge ccCrmId onto ProductMap entries ─────────────────');
  // Find OrderItems that have BOTH ccCrmId AND productMapId (already linked)
  const linkedItemsWithCcId = await db.orderItem.findMany({
    where: {
      ccCrmId: { not: null },
      productMapId: { not: null },
    },
    select: { ccCrmId: true, productMapId: true },
    take: 2000,
  });

  // Build ccCrmId → productMapId map (take the most common mapping)
  const ccCrmToMap = new Map<string, Map<string, number>>();
  for (const item of linkedItemsWithCcId) {
    if (!item.ccCrmId || !item.productMapId) continue;
    if (!ccCrmToMap.has(item.ccCrmId)) ccCrmToMap.set(item.ccCrmId, new Map());
    const pmMap = ccCrmToMap.get(item.ccCrmId)!;
    pmMap.set(item.productMapId, (pmMap.get(item.productMapId) ?? 0) + 1);
  }

  let ccBridged = 0;
  for (const [ccCrmId, pmCounts] of ccCrmToMap) {
    // Pick the most frequent productMapId for this ccCrmId
    const bestPmId = [...pmCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    // Update ProductMap to record this ccCrmId if not already set
    const existing = await db.productMap.findUnique({ where: { id: bestPmId }, select: { ccCrmId: true } });
    if (existing && !existing.ccCrmId) {
      await db.productMap.update({ where: { id: bestPmId }, data: { ccCrmId } });
      ccBridged++;
    }
  }
  console.log(`Set ccCrmId on ${ccBridged} ProductMap entries`);

  // ─── Step 3: Backfill OrderItem.productMapId ─────────────────────────────────
  console.log('\n─── Step 3: Backfill OrderItem.productMapId ─────────────────────────');

  const unlinkedItems = await db.orderItem.findMany({
    where: { productMapId: null },
    select: { id: true, ccCrmId: true, externalId: true, name: true },
    take: 5000,
  });
  console.log(`OrderItems without productMapId: ${unlinkedItems.length}`);

  // Build lookup maps for fast matching
  const allMapsNow = await db.productMap.findMany({
    select: { id: true, ccCrmId: true, shopifyProductId: true, externalId: true, productLine: true },
  });
  const ccCrmLookup = new Map(allMapsNow.filter(m => m.ccCrmId).map(m => [m.ccCrmId!, m.id]));
  const shopifyLookup = new Map(allMapsNow.filter(m => m.shopifyProductId).map(m => [m.shopifyProductId!, m.id]));
  const extLookup = new Map(allMapsNow.filter(m => m.externalId).map(m => [m.externalId!, m.id]));
  // ProductLine → first entry (fallback for CC items with known productLine)
  const lineFirstEntry = new Map<string, string>();
  for (const m of allMapsNow) {
    if (m.productLine && !lineFirstEntry.has(m.productLine)) lineFirstEntry.set(m.productLine, m.id);
  }

  let itemsLinked = 0;
  for (const item of unlinkedItems) {
    let pmId: string | null = null;

    // 1. Direct ccCrmId match on ProductMap
    if (item.ccCrmId) pmId = ccCrmLookup.get(item.ccCrmId) ?? null;
    // 2. Shopify/external ID match
    if (!pmId && item.externalId) pmId = shopifyLookup.get(item.externalId) ?? extLookup.get(item.externalId) ?? null;
    // 3. Fallback: derive productLine from CC_CRM_TO_LINE and find any ProductMap entry with that line
    if (!pmId && item.ccCrmId) {
      const fromCC = CC_CRM_TO_LINE[item.ccCrmId];
      if (fromCC) pmId = lineFirstEntry.get(fromCC.productLine) ?? null;
    }
    // 4. Fallback: name-based keyword match
    if (!pmId && item.name) {
      const lower = item.name.toLowerCase();
      if (lower.includes('sculpting device') || lower.includes('sculpting bundle')) {
        pmId = lineFirstEntry.get('Body Sculpting Device') ?? null;
      } else if (lower.includes('gel')) {
        pmId = lineFirstEntry.get('Sculpt+ Conductive Gel') ?? null;
      } else if (lower.includes('maintenance cream') || lower.includes('cream')) {
        pmId = lineFirstEntry.get('Maintenance Cream') ?? null;
      } else if (lower.includes('glp') || lower.includes('support+')) {
        pmId = lineFirstEntry.get('GLP-1 Support+') ?? null;
      } else if (lower.includes('smooth skin')) {
        pmId = lineFirstEntry.get('Smooth Skin+') ?? null;
      }
    }

    if (pmId) {
      await db.orderItem.update({ where: { id: item.id }, data: { productMapId: pmId } });
      itemsLinked++;
    }
  }
  console.log(`Linked ${itemsLinked} order items to ProductMap entries`);

  // ─── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n─── Summary ─────────────────────────────────────────────────────────');
  const lines = await db.productMap.groupBy({
    by: ['productLine'],
    _count: true,
    where: { productLine: { not: null } },
    orderBy: { _count: { productLine: 'desc' } },
  });
  console.log('ProductLine distribution:');
  for (const l of lines) {
    console.log(`  ${l.productLine}: ${l._count} entries`);
  }

  const subLinkRate = await db.subscription.count({ where: { productMapId: { not: null } } });
  const subTotal = await db.subscription.count();
  console.log(`\nSubscriptions linked: ${subLinkRate}/${subTotal} (${Math.round(subLinkRate/subTotal*100)}%)`);

  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
