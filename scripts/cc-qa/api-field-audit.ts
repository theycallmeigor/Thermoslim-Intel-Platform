/**
 * CC API Field Audit — dump every field from order/query to see what's available
 * and compare against what we're capturing in the database.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

const STORE_DIR = path.resolve(__dirname, 'store');

async function main() {
  const { config } = await import('../../src/core/config');
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  const baseUrl = config.checkoutChamp.apiUrl.replace(/\/$/, '');
  const authParams = {
    loginId: config.checkoutChamp.apiUsername,
    password: config.checkoutChamp.apiKey,
  };

  console.log('\n  CC API FIELD AUDIT\n');

  // Fetch recent orders — get a few COMPLETE, DECLINED, and PARTIAL
  // Use all optional flags to get maximum data from CC API
  const qs = new URLSearchParams({
    ...authParams,
    startDate: '03/01/2026',
    endDate: '03/22/2026',
    page: '1',
    resultsPerPage: '50',
    includeCustomFields: '1',
    includeBrowserDetails: '1',
    includeClicks: '1',
  });

  const res = await fetch(`${baseUrl}/order/query/?${qs}`);
  const json = await res.json();
  if (json.result !== 'SUCCESS' || typeof json.message === 'string') {
    console.log('  No data:', json.message);
    return;
  }

  const orders = json.message.data;
  console.log(`  Fetched ${orders.length} orders from page 1\n`);

  // ═══════════════════════════════════════════════════════════
  //  1. DUMP ALL ORDER-LEVEL FIELDS
  // ═══════════════════════════════════════════════════════════
  console.log('  ═══ ORDER-LEVEL FIELDS ═══');

  // Collect all unique keys across all orders
  const allOrderKeys = new Set<string>();
  const fieldPopulation: Record<string, { populated: number; total: number; sampleValues: Set<string> }> = {};

  for (const order of orders) {
    for (const [key, value] of Object.entries(order)) {
      allOrderKeys.add(key);
      if (!fieldPopulation[key]) {
        fieldPopulation[key] = { populated: 0, total: 0, sampleValues: new Set() };
      }
      fieldPopulation[key].total++;
      if (value !== null && value !== undefined && value !== '' && value !== '0' && value !== 0) {
        fieldPopulation[key].populated++;
        if (fieldPopulation[key].sampleValues.size < 5) {
          const sv = typeof value === 'object' ? JSON.stringify(value).slice(0, 80) : String(value).slice(0, 80);
          fieldPopulation[key].sampleValues.add(sv);
        }
      }
    }
  }

  // Sort by population rate
  const sortedFields = Object.entries(fieldPopulation)
    .sort((a, b) => b[1].populated - a[1].populated);

  console.log(`\n  ${sortedFields.length} unique order-level fields found:\n`);
  console.log('  ' + 'Field'.padEnd(30) + 'Pop%'.padStart(6) + '  Sample Values');
  console.log('  ' + '-'.repeat(100));

  for (const [key, stats] of sortedFields) {
    const pct = ((stats.populated / stats.total) * 100).toFixed(0);
    const samples = [...stats.sampleValues].join(' | ');
    console.log(`  ${key.padEnd(30)} ${pct.padStart(4)}%  ${samples}`);
  }

  // ═══════════════════════════════════════════════════════════
  //  2. DUMP ALL ITEM-LEVEL FIELDS
  // ═══════════════════════════════════════════════════════════
  console.log('\n\n  ═══ ITEM-LEVEL FIELDS ═══');

  const allItemKeys = new Set<string>();
  const itemFieldPop: Record<string, { populated: number; total: number; sampleValues: Set<string> }> = {};

  for (const order of orders) {
    if (!order.items || typeof order.items !== 'object') continue;
    for (const item of Object.values(order.items) as any[]) {
      for (const [key, value] of Object.entries(item)) {
        allItemKeys.add(key);
        if (!itemFieldPop[key]) {
          itemFieldPop[key] = { populated: 0, total: 0, sampleValues: new Set() };
        }
        itemFieldPop[key].total++;
        if (value !== null && value !== undefined && value !== '' && value !== '0' && value !== 0) {
          itemFieldPop[key].populated++;
          if (itemFieldPop[key].sampleValues.size < 5) {
            itemFieldPop[key].sampleValues.add(String(value).slice(0, 80));
          }
        }
      }
    }
  }

  const sortedItemFields = Object.entries(itemFieldPop)
    .sort((a, b) => b[1].populated - a[1].populated);

  console.log(`\n  ${sortedItemFields.length} unique item-level fields found:\n`);
  console.log('  ' + 'Field'.padEnd(30) + 'Pop%'.padStart(6) + '  Sample Values');
  console.log('  ' + '-'.repeat(100));

  for (const [key, stats] of sortedItemFields) {
    const pct = ((stats.populated / stats.total) * 100).toFixed(0);
    const samples = [...stats.sampleValues].join(' | ');
    console.log(`  ${key.padEnd(30)} ${pct.padStart(4)}%  ${samples}`);
  }

  // ═══════════════════════════════════════════════════════════
  //  3. COMPARE: API FIELDS vs DB SCHEMA
  // ═══════════════════════════════════════════════════════════
  console.log('\n\n  ═══ GAP ANALYSIS: API vs DATABASE ═══');

  // Fields we currently capture in the adapter (from CCOrder interface)
  const capturedOrderFields = new Set([
    'orderId', 'actualOrderId', 'externalOrderId', 'clientOrderId',
    'orderType', 'orderStatus', 'dateCreated', 'dateUpdated',
    'totalAmount', 'price', 'baseShipping', 'discountPrice', 'salesTax',
    'surcharge', 'shipUpcharge', 'currencyCode', 'currencySymbol',
    'campaignId', 'campaignName', 'salesUrl', 'paySource', 'couponCode',
    'ipAddress', 'hasUpsell', 'funnelReferenceId',
    'customerId', 'emailAddress', 'firstName', 'lastName', 'name', 'phoneNumber',
    'address1', 'address2', 'city', 'state', 'country', 'postalCode',
    'shipFirstName', 'shipLastName', 'shipAddress1', 'shipAddress2',
    'shipCity', 'shipState', 'shipCountry', 'shipPostalCode',
    'sourceId', 'sourceTitle', 'affId',
    'sourceValue1', 'sourceValue2', 'sourceValue3', 'sourceValue4', 'sourceValue5',
    'UTMSource', 'UTMMedium', 'UTMCampaign', 'UTMTerm', 'UTMContent',
    'custom1', 'custom2', 'custom3', 'custom4', 'custom5',
    'items', 'responseType', 'declineReason',
  ]);

  const capturedItemFields = new Set([
    'productId', 'transactionItemId', 'name', 'variantDetailId', 'variantName',
    'externalProductId', 'qty', 'shipping', 'price', 'purchaseId',
    'purchaseStatus', 'nextBillDate', 'cancelAfterDate', 'txnType',
    'productType', 'orderItemId', 'productSku', 'replacedByOrderItemId',
    'responseType', 'salesTax', 'actualProductId', 'currentProductId',
    'currentPrice', 'currentQty', 'pauseScheduled', 'cancellationScheduled',
  ]);

  const missingOrderFields = [...allOrderKeys].filter((k) => !capturedOrderFields.has(k));
  const missingItemFields = [...allItemKeys].filter((k) => !capturedItemFields.has(k));

  console.log(`\n  ORDER fields in API but NOT in adapter (${missingOrderFields.length}):`);
  for (const key of missingOrderFields) {
    const stats = fieldPopulation[key];
    const pct = ((stats.populated / stats.total) * 100).toFixed(0);
    const samples = [...stats.sampleValues].slice(0, 3).join(' | ');
    console.log(`    ${key.padEnd(30)} ${pct.padStart(4)}%  ${samples}`);
  }

  console.log(`\n  ITEM fields in API but NOT in adapter (${missingItemFields.length}):`);
  for (const key of missingItemFields) {
    const stats = itemFieldPop[key];
    const pct = ((stats.populated / stats.total) * 100).toFixed(0);
    const samples = [...stats.sampleValues].slice(0, 3).join(' | ');
    console.log(`    ${key.padEnd(30)} ${pct.padStart(4)}%  ${samples}`);
  }

  // ═══════════════════════════════════════════════════════════
  //  4. SAMPLE DECLINED/PARTIAL ORDERS (detailed)
  // ═══════════════════════════════════════════════════════════
  console.log('\n\n  ═══ SAMPLE DECLINED/PARTIAL ORDERS ═══');

  const problemOrders = orders.filter((o: any) =>
    o.orderStatus === 'DECLINED' || o.orderStatus === 'PARTIAL'
  );
  console.log(`  Found ${problemOrders.length} declined/partial orders in this page\n`);

  for (const o of problemOrders.slice(0, 5)) {
    console.log(`  Order ${o.orderId} — status: ${o.orderStatus}`);
    console.log(`    paySource: ${o.paySource}`);
    console.log(`    responseType (order): ${JSON.stringify(o.responseType)}`);
    console.log(`    declineReason (order): ${JSON.stringify(o.declineReason)}`);
    console.log(`    totalAmount: ${o.totalAmount}`);
    console.log(`    salesUrl: ${o.salesUrl}`);
    if (o.items && typeof o.items === 'object') {
      for (const [k, item] of Object.entries(o.items)) {
        const i = item as any;
        console.log(`    Item: ${i.name} | responseType: ${i.responseType} | txnType: ${i.txnType} | price: ${i.price}`);
      }
    }
    // Show ALL non-null, non-empty, non-zero fields we don't normally capture
    const extra: string[] = [];
    for (const key of missingOrderFields) {
      const val = o[key];
      if (val !== null && val !== undefined && val !== '' && val !== '0' && val !== 0 && val !== false) {
        extra.push(`${key}=${typeof val === 'object' ? JSON.stringify(val).slice(0, 60) : String(val).slice(0, 60)}`);
      }
    }
    if (extra.length > 0) {
      console.log(`    EXTRA FIELDS: ${extra.join(' | ')}`);
    }
    console.log('');
  }

  // ═══════════════════════════════════════════════════════════
  //  5. DB VALIDATION — check data quality
  // ═══════════════════════════════════════════════════════════
  console.log('\n  ═══ DATABASE VALIDATION ═══');

  const totalCC = await db.order.count({ where: { source: 'CHECKOUTCHAMP' } });
  const withResponseType = await db.order.count({ where: { source: 'CHECKOUTCHAMP', responseType: { not: null } } });
  const withFunnelPage = await db.order.count({ where: { source: 'CHECKOUTCHAMP', funnelPageId: { not: null } } });
  const withDeclineReason = await db.order.count({ where: { source: 'CHECKOUTCHAMP', declineReason: { not: null } } });
  const withSalesUrl = await db.order.count({ where: { source: 'CHECKOUTCHAMP', salesUrl: { not: null } } });
  const withPaySource = await db.order.count({ where: { source: 'CHECKOUTCHAMP', paySource: { not: null } } });
  const withFunnelRef = await db.order.count({ where: { source: 'CHECKOUTCHAMP', funnelReferenceId: { not: null } } });
  const withAttribution = await db.attribution.count();
  const totalItems = await db.orderItem.count();
  const totalFunnels = await db.funnel.count();
  const totalPages = await db.funnelPage.count();

  console.log(`\n  FIELD COMPLETENESS (${totalCC} CC orders):`);
  console.log(`    responseType:      ${withResponseType}/${totalCC} (${(withResponseType/totalCC*100).toFixed(0)}%)`);
  console.log(`    funnelPageId:      ${withFunnelPage}/${totalCC} (${(withFunnelPage/totalCC*100).toFixed(0)}%)`);
  console.log(`    declineReason:     ${withDeclineReason}/${totalCC} (${(withDeclineReason/totalCC*100).toFixed(0)}%)`);
  console.log(`    salesUrl:          ${withSalesUrl}/${totalCC} (${(withSalesUrl/totalCC*100).toFixed(0)}%)`);
  console.log(`    paySource:         ${withPaySource}/${totalCC} (${(withPaySource/totalCC*100).toFixed(0)}%)`);
  console.log(`    funnelReferenceId: ${withFunnelRef}/${totalCC} (${(withFunnelRef/totalCC*100).toFixed(0)}%)`);
  console.log(`    attribution:       ${withAttribution}/${totalCC} (${(withAttribution/totalCC*100).toFixed(0)}%)`);
  console.log(`    orderItems:        ${totalItems} items across all orders`);
  console.log(`    funnels:           ${totalFunnels} funnels, ${totalPages} pages`);

  // Check for API vs DB order count mismatch
  // Fetch total from API
  const totalQs = new URLSearchParams({
    ...authParams,
    startDate: '01/01/2025',
    endDate: '03/22/2026',
    page: '1',
  });
  const totalRes = await fetch(`${baseUrl}/order/query/?${totalQs}`);
  const totalJson = await totalRes.json();
  let apiTotal = 0;
  if (totalJson.result === 'SUCCESS' && typeof totalJson.message !== 'string') {
    apiTotal = totalJson.message.totalResults;
  }
  console.log(`\n  ORDER COUNT VALIDATION:`);
  console.log(`    CC API total:    ${apiTotal}`);
  console.log(`    Database total:  ${totalCC}`);
  console.log(`    Delta:           ${apiTotal - totalCC} ${apiTotal > totalCC ? '(DB MISSING)' : apiTotal < totalCC ? '(DB HAS MORE)' : '(MATCH)'}`);

  // Save full audit
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(STORE_DIR, 'api-field-audit.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      orderFields: sortedFields.map(([k, v]) => ({
        field: k,
        populatedPct: Math.round((v.populated / v.total) * 100),
        samples: [...v.sampleValues].slice(0, 3),
      })),
      itemFields: sortedItemFields.map(([k, v]) => ({
        field: k,
        populatedPct: Math.round((v.populated / v.total) * 100),
        samples: [...v.sampleValues].slice(0, 3),
      })),
      missingOrderFields,
      missingItemFields,
      dbValidation: {
        totalCC,
        apiTotal,
        withResponseType,
        withFunnelPage,
        withPaySource,
        withAttribution,
      },
    }, null, 2) + '\n',
  );
  console.log(`\n  Saved: scripts/cc-qa/store/api-field-audit.json\n`);

  await db.$disconnect();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
