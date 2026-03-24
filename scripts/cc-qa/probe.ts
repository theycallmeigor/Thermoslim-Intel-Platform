/**
 * Quick probe — check live data state and what's available
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  // Most recent CC orders
  const recent = await db.order.findMany({
    where: { source: 'CHECKOUTCHAMP' },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true, createdAt: true, status: true, paySource: true, orderTotal: true,
      campaignName: true, funnelReferenceId: true, responseType: true,
    },
  });

  console.log('\n  LATEST 20 CC ORDERS:');
  for (const o of recent) {
    const age = ((Date.now() - o.createdAt.getTime()) / 3600000).toFixed(1);
    const ps = (o.paySource || 'unknown').padEnd(12);
    const st = (o.status || '?').padEnd(10);
    const rt = (o.responseType || '-').padEnd(15);
    const rev = `$${((o.orderTotal || 0) / 100).toFixed(2)}`.padStart(9);
    console.log(`  ${o.createdAt.toISOString().slice(0, 19)} | ${st} | ${ps} | ${rt} | ${rev} | ${age}h ago`);
  }

  // Count by day for last 14 days
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 3600000);
  const weekOrders = await db.order.findMany({
    where: { source: 'CHECKOUTCHAMP', createdAt: { gte: twoWeeksAgo } },
    select: { createdAt: true, status: true, paySource: true },
  });

  const byDay: Record<string, { total: number; complete: number; declined: number; abandon: number; partial: number }> = {};
  for (const o of weekOrders) {
    const day = o.createdAt.toISOString().slice(0, 10);
    if (byDay[day] === undefined) byDay[day] = { total: 0, complete: 0, declined: 0, abandon: 0, partial: 0 };
    byDay[day].total++;
    if (o.status === 'COMPLETE') byDay[day].complete++;
    else if (o.status === 'DECLINED') byDay[day].declined++;
    else if (o.status === 'PARTIAL') {
      if (o.paySource === null || o.paySource === undefined || o.paySource === 'unknown') {
        byDay[day].abandon++;
      } else {
        byDay[day].partial++;
      }
    }
  }

  console.log('\n  LAST 14 DAYS:');
  console.log('  Date       | Orders | Complete | Declined | Partial | Abandoned');
  console.log('  ' + '-'.repeat(70));
  for (const [day, c] of Object.entries(byDay).sort()) {
    console.log(`  ${day} | ${String(c.total).padStart(6)} | ${String(c.complete).padStart(8)} | ${String(c.declined).padStart(8)} | ${String(c.partial).padStart(7)} | ${String(c.abandon).padStart(9)}`);
  }

  // Totals
  const totalCC = await db.order.count({ where: { source: 'CHECKOUTCHAMP' } });
  const totalShopify = await db.order.count({ where: { source: 'SHOPIFY' } });
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCC = await db.order.count({
    where: { source: 'CHECKOUTCHAMP', createdAt: { gte: new Date(todayStr) } },
  });

  console.log(`\n  TOTALS: CC=${totalCC} | Shopify=${totalShopify} | CC today=${todayCC}`);

  // Table counts — what data do we have?
  console.log('\n  TABLE DATA AVAILABLE:');
  const tables = [
    { name: 'order', model: db.order },
    { name: 'orderItem', model: db.orderItem },
    { name: 'customer', model: db.customer },
  ];

  for (const t of tables) {
    try {
      const count = await t.model.count();
      console.log(`  ${t.name.padEnd(20)}: ${count}`);
    } catch (e: any) {
      console.log(`  ${t.name.padEnd(20)}: ERROR`);
    }
  }

  // Check for tables that might exist
  const maybeModels = ['funnelEvent', 'revenueEvent', 'attribution', 'upsellPath', 'subscription'];
  for (const name of maybeModels) {
    try {
      const count = await (db as any)[name].count();
      console.log(`  ${name.padEnd(20)}: ${count}`);
    } catch (e: any) {
      console.log(`  ${name.padEnd(20)}: NOT FOUND`);
    }
  }

  // Check unique values in key dimensions
  console.log('\n  DIMENSION CARDINALITY (CC orders):');

  const paySourceGroups = await db.order.groupBy({
    by: ['paySource'],
    where: { source: 'CHECKOUTCHAMP' },
    _count: true,
    orderBy: { _count: { paySource: 'desc' } },
  });
  console.log('  paySource:');
  for (const g of paySourceGroups) {
    console.log(`    ${(g.paySource || 'null').padEnd(15)} ${g._count}`);
  }

  const statusGroups = await db.order.groupBy({
    by: ['status'],
    where: { source: 'CHECKOUTCHAMP' },
    _count: true,
  });
  console.log('  status:');
  for (const g of statusGroups) {
    console.log(`    ${(g.status || 'null').padEnd(15)} ${g._count}`);
  }

  const responseGroups = await db.order.groupBy({
    by: ['responseType'],
    where: { source: 'CHECKOUTCHAMP' },
    _count: true,
    orderBy: { _count: { responseType: 'desc' } },
  });
  console.log('  responseType:');
  for (const g of responseGroups) {
    console.log(`    ${(g.responseType || 'null').padEnd(20)} ${g._count}`);
  }

  const campaignGroups = await db.order.groupBy({
    by: ['campaignName'],
    where: { source: 'CHECKOUTCHAMP' },
    _count: true,
    orderBy: { _count: { campaignName: 'desc' } },
    take: 10,
  });
  console.log('  campaignName (top 10):');
  for (const g of campaignGroups) {
    console.log(`    ${(g.campaignName || 'null').padEnd(30)} ${g._count}`);
  }

  const funnelGroups = await db.order.groupBy({
    by: ['funnelReferenceId'],
    where: { source: 'CHECKOUTCHAMP' },
    _count: true,
    orderBy: { _count: { funnelReferenceId: 'desc' } },
    take: 10,
  });
  console.log('  funnelReferenceId (top 10):');
  for (const g of funnelGroups) {
    console.log(`    ${(g.funnelReferenceId || 'null').padEnd(40)} ${g._count}`);
  }

  // Check what fields are populated
  console.log('\n  FIELD POPULATION (CC orders):');
  const sampleFields = await db.order.findFirst({
    where: { source: 'CHECKOUTCHAMP', status: 'DECLINED' },
    select: {
      id: true, status: true, paySource: true, responseType: true,
      ipAddress: true, ccOrderType: true, hasUpsells: true, couponCode: true,
      campaignName: true, campaignId: true, funnelReferenceId: true,
      orderTotal: true, createdAt: true,
    },
  });
  if (sampleFields) {
    console.log('  Sample DECLINED order fields:');
    for (const [k, v] of Object.entries(sampleFields)) {
      const populated = v !== null && v !== undefined && v !== '';
      console.log(`    ${k.padEnd(25)} ${populated ? '✓' : '✗'} ${v === null ? 'null' : typeof v === 'object' ? v.toISOString?.() || JSON.stringify(v) : String(v).slice(0, 50)}`);
    }
  }

  await db.$disconnect();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
