/**
 * CheckoutChamp Drop Analysis
 * Isolates CC orders and identifies CC-specific failure patterns:
 * - Payment gateway failures (PARTIAL/DECLINED)
 * - Campaign-level drops
 * - Funnel conversion issues
 * - CC vs Shopify performance divergence
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

  const orders = await db.order.findMany({
    select: {
      createdAt: true,
      orderTotal: true,
      source: true,
      ccOrderType: true,
      campaignId: true,
      campaignName: true,
      status: true,
      paySource: true,
      responseType: true,
      funnelReferenceId: true,
      items: {
        select: {
          name: true,
          recurringPrice: true,
          billingCycleNumber: true,
          recurringStatus: true,
          productCategoryName: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const ccOrders = orders.filter((o) => o.source === 'CHECKOUTCHAMP');
  const shopifyOrders = orders.filter((o) => o.source === 'SHOPIFY');

  console.log(`\nTotal orders: ${orders.length} | CC: ${ccOrders.length} | Shopify: ${shopifyOrders.length}`);
  console.log(`Date range: ${orders[0]?.createdAt.toISOString().slice(0, 10)} → ${orders[orders.length - 1]?.createdAt.toISOString().slice(0, 10)}`);

  // ── Group CC orders by date ──
  type Order = (typeof orders)[0];
  const byDate = new Map<string, Order[]>();
  const shopifyByDate = new Map<string, Order[]>();

  for (const o of ccOrders) {
    const dk = o.createdAt.toISOString().slice(0, 10);
    const arr = byDate.get(dk) ?? [];
    arr.push(o);
    byDate.set(dk, arr);
  }
  for (const o of shopifyOrders) {
    const dk = o.createdAt.toISOString().slice(0, 10);
    const arr = shopifyByDate.get(dk) ?? [];
    arr.push(o);
    shopifyByDate.set(dk, arr);
  }

  const $ = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const pct = (n: number, d: number) => d > 0 ? `${((n / d) * 100).toFixed(0)}%` : 'N/A';

  // ── Build daily CC stats ──
  const allDates = [...new Set([...byDate.keys(), ...shopifyByDate.keys()])].sort();

  interface DayStat {
    date: string;
    ccOrders: number;
    ccRevenue: number;
    ccComplete: number;
    ccPartial: number;
    ccDeclined: number;
    ccRefunded: number;
    ccAOV: number;
    shopifyOrders: number;
    shopifyRevenue: number;
    campaigns: Record<string, { orders: number; revenue: number; partial: number; declined: number; refunded: number }>;
    funnels: Record<string, { orders: number; revenue: number; partial: number; declined: number }>;
    payMethods: Record<string, { orders: number; partial: number; declined: number }>;
    products: Record<string, number>;
  }

  const stats: DayStat[] = [];

  for (const dk of allDates) {
    const ccDay = byDate.get(dk) ?? [];
    const shopDay = shopifyByDate.get(dk) ?? [];

    const ccComplete = ccDay.filter((o) => o.status === 'COMPLETE').length;
    const ccPartial = ccDay.filter((o) => o.status === 'PARTIAL').length;
    const ccDeclined = ccDay.filter((o) => o.status === 'DECLINED').length;
    const ccRefunded = ccDay.filter((o) => o.status === 'REFUNDED').length;
    const ccRevenue = ccDay.reduce((s, o) => s + (o.orderTotal || 0), 0);
    const shopRevenue = shopDay.reduce((s, o) => s + (o.orderTotal || 0), 0);

    // Campaign breakdown
    const campaigns: DayStat['campaigns'] = {};
    for (const o of ccDay) {
      const c = o.campaignName || o.campaignId || 'unknown';
      if (!campaigns[c]) campaigns[c] = { orders: 0, revenue: 0, partial: 0, declined: 0, refunded: 0 };
      campaigns[c].orders++;
      campaigns[c].revenue += o.orderTotal || 0;
      if (o.status === 'PARTIAL') campaigns[c].partial++;
      if (o.status === 'DECLINED') campaigns[c].declined++;
      if (o.status === 'REFUNDED') campaigns[c].refunded++;
    }

    // Funnel breakdown
    const funnels: DayStat['funnels'] = {};
    for (const o of ccDay) {
      const f = o.funnelReferenceId || 'no-funnel';
      if (!funnels[f]) funnels[f] = { orders: 0, revenue: 0, partial: 0, declined: 0 };
      funnels[f].orders++;
      funnels[f].revenue += o.orderTotal || 0;
      if (o.status === 'PARTIAL') funnels[f].partial++;
      if (o.status === 'DECLINED') funnels[f].declined++;
    }

    // Payment method breakdown
    const payMethods: DayStat['payMethods'] = {};
    for (const o of ccDay) {
      const pm = o.paySource || 'unknown';
      if (!payMethods[pm]) payMethods[pm] = { orders: 0, partial: 0, declined: 0 };
      payMethods[pm].orders++;
      if (o.status === 'PARTIAL') payMethods[pm].partial++;
      if (o.status === 'DECLINED') payMethods[pm].declined++;
    }

    // Products
    const products: Record<string, number> = {};
    for (const o of ccDay) {
      const p = o.items[0]?.name || 'unknown';
      products[p] = (products[p] || 0) + 1;
    }

    stats.push({
      date: dk,
      ccOrders: ccDay.length,
      ccRevenue,
      ccComplete,
      ccPartial,
      ccDeclined,
      ccRefunded,
      ccAOV: ccDay.length > 0 ? ccRevenue / ccDay.length : 0,
      shopifyOrders: shopDay.length,
      shopifyRevenue: shopRevenue,
      campaigns,
      funnels,
      payMethods,
      products,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  1. CC COMPLETION RATE PROBLEMS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(130));
  console.log('  1. CC COMPLETION RATE DROPS (days where CC had >25% failure rate, min 3 orders)');
  console.log('═'.repeat(130));

  for (const s of stats) {
    if (s.ccOrders < 3) continue;
    const failRate = (s.ccPartial + s.ccDeclined) / s.ccOrders;
    if (failRate < 0.25) continue;

    const shopFailRate = s.shopifyOrders > 2
      ? ((byDate.get(s.date) ?? []).filter((o) => o.status === 'PARTIAL' || o.status === 'DECLINED').length / s.shopifyOrders)
      : null;

    console.log(`\n  ${s.date} — CC orders: ${s.ccOrders} | Complete: ${s.ccComplete} | PARTIAL: ${s.ccPartial} | DECLINED: ${s.ccDeclined} | Fail rate: ${pct(s.ccPartial + s.ccDeclined, s.ccOrders)}`);
    if (shopFailRate !== null) {
      console.log(`    Shopify same day: ${s.shopifyOrders} orders, fail rate: ${pct(s.shopifyOrders - (shopifyByDate.get(s.date) ?? []).filter((o) => o.status === 'COMPLETE' || o.status === 'REFUNDED').length, s.shopifyOrders)} ← compare`);
    }

    // Which campaigns had failures
    const badCamps = Object.entries(s.campaigns)
      .filter(([, v]) => v.partial + v.declined > 0)
      .sort((a, b) => (b[1].partial + b[1].declined) - (a[1].partial + a[1].declined));
    if (badCamps.length > 0) {
      console.log(`    Failing campaigns:`);
      for (const [camp, v] of badCamps.slice(0, 5)) {
        console.log(`      ${camp}: ${v.orders} orders, ${v.partial} partial, ${v.declined} declined (${pct(v.partial + v.declined, v.orders)} fail)`);
      }
    }

    // Which funnels had failures
    const badFunnels = Object.entries(s.funnels)
      .filter(([, v]) => v.partial + v.declined > 0)
      .sort((a, b) => (b[1].partial + b[1].declined) - (a[1].partial + a[1].declined));
    if (badFunnels.length > 0) {
      console.log(`    Failing funnels:`);
      for (const [funnel, v] of badFunnels.slice(0, 5)) {
        console.log(`      ${funnel}: ${v.orders} orders, ${v.partial} partial, ${v.declined} declined`);
      }
    }

    // Which payment methods had failures
    const badPay = Object.entries(s.payMethods)
      .filter(([, v]) => v.partial + v.declined > 0)
      .sort((a, b) => (b[1].partial + b[1].declined) - (a[1].partial + a[1].declined));
    if (badPay.length > 0) {
      console.log(`    Failing payment methods:`);
      for (const [pm, v] of badPay.slice(0, 5)) {
        console.log(`      ${pm}: ${v.orders} total, ${v.partial} partial, ${v.declined} declined (${pct(v.partial + v.declined, v.orders)} fail)`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  2. CC REVENUE DROPS (day-over-day)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n' + '═'.repeat(130));
  console.log('  2. CC REVENUE/ORDER DAY-OVER-DAY DROPS (>40% drop, min 5 orders yesterday)');
  console.log('═'.repeat(130));

  for (let i = 1; i < stats.length; i++) {
    const today = stats[i];
    const yesterday = stats[i - 1];

    if (yesterday.ccOrders < 5) continue;

    const orderDrop = (yesterday.ccOrders - today.ccOrders) / yesterday.ccOrders;
    const revDrop = yesterday.ccRevenue > 0 ? (yesterday.ccRevenue - today.ccRevenue) / yesterday.ccRevenue : 0;

    if (orderDrop < 0.4 && revDrop < 0.5) continue;

    // Check if Shopify also dropped (external factor) or only CC (CC-specific)
    const shopDropped = yesterday.shopifyOrders >= 3 && today.shopifyOrders < yesterday.shopifyOrders * 0.5;
    const ccOnly = !shopDropped && yesterday.shopifyOrders >= 3;

    const tag = ccOnly ? '⚠️  CC-ONLY DROP' : (shopDropped ? '📉 Both channels down' : '📉 Drop');

    console.log(`\n  ${tag} — ${today.date}`);
    console.log(`    CC: ${today.ccOrders} orders (${$(today.ccRevenue)}) ← yesterday: ${yesterday.ccOrders} (${$(yesterday.ccRevenue)})`);
    if (orderDrop > 0) console.log(`    Order drop: -${(orderDrop * 100).toFixed(0)}%`);
    if (revDrop > 0) console.log(`    Revenue drop: -${(revDrop * 100).toFixed(0)}%`);
    console.log(`    Shopify same day: ${today.shopifyOrders} orders (${$(today.shopifyRevenue)}) | yesterday: ${yesterday.shopifyOrders} (${$(yesterday.shopifyRevenue)})`);

    // Which campaigns disappeared
    const yesterdayCamps = Object.keys(yesterday.campaigns);
    const todayCamps = new Set(Object.keys(today.campaigns));
    const goneCamps = yesterdayCamps.filter((c) => !todayCamps.has(c) && yesterday.campaigns[c].orders >= 2);
    if (goneCamps.length > 0) {
      console.log(`    Campaigns that disappeared: ${goneCamps.map((c) => `${c} (had ${yesterday.campaigns[c].orders} orders)`).join(', ')}`);
    }

    // Which campaigns dropped significantly
    for (const [camp, yData] of Object.entries(yesterday.campaigns)) {
      if (yData.orders < 3) continue;
      const tData = today.campaigns[camp];
      if (!tData || tData.orders < yData.orders * 0.4) {
        const todayCount = tData?.orders ?? 0;
        console.log(`    Campaign drop: ${camp}: ${yData.orders} → ${todayCount} orders`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  3. CAMPAIGN-LEVEL FAILURE ANALYSIS (aggregate)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n' + '═'.repeat(130));
  console.log('  3. CAMPAIGN FAILURE RATES (aggregate across all days)');
  console.log('═'.repeat(130));

  const campTotals: Record<string, { orders: number; revenue: number; partial: number; declined: number; refunded: number; days: Set<string> }> = {};
  for (const s of stats) {
    for (const [camp, v] of Object.entries(s.campaigns)) {
      if (!campTotals[camp]) campTotals[camp] = { orders: 0, revenue: 0, partial: 0, declined: 0, refunded: 0, days: new Set() };
      campTotals[camp].orders += v.orders;
      campTotals[camp].revenue += v.revenue;
      campTotals[camp].partial += v.partial;
      campTotals[camp].declined += v.declined;
      campTotals[camp].refunded += v.refunded;
      campTotals[camp].days.add(s.date);
    }
  }

  const sortedCamps = Object.entries(campTotals)
    .filter(([, v]) => v.orders >= 5)
    .sort((a, b) => b[1].orders - a[1].orders);

  console.log(`\n  ${'Campaign'.padEnd(55)} Orders  Revenue     Partial  Declined  Refunded  Fail%   Days`);
  console.log('  ' + '─'.repeat(125));
  for (const [camp, v] of sortedCamps) {
    const failPct = (v.partial + v.declined) / v.orders;
    const marker = failPct > 0.3 ? ' 🔴' : failPct > 0.15 ? ' 🟡' : '';
    console.log(`  ${camp.slice(0, 55).padEnd(55)} ${String(v.orders).padStart(5)}  ${$(v.revenue).padStart(10)}  ${String(v.partial).padStart(7)}  ${String(v.declined).padStart(8)}  ${String(v.refunded).padStart(8)}  ${pct(v.partial + v.declined, v.orders).padStart(5)}${marker}  ${v.days.size}`);
  }

  // ═══════════════════════════════════════════════════════════════
  //  4. FUNNEL-LEVEL FAILURE ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n' + '═'.repeat(130));
  console.log('  4. FUNNEL FAILURE RATES (aggregate)');
  console.log('═'.repeat(130));

  const funnelTotals: Record<string, { orders: number; revenue: number; partial: number; declined: number; days: Set<string> }> = {};
  for (const s of stats) {
    for (const [funnel, v] of Object.entries(s.funnels)) {
      if (!funnelTotals[funnel]) funnelTotals[funnel] = { orders: 0, revenue: 0, partial: 0, declined: 0, days: new Set() };
      funnelTotals[funnel].orders += v.orders;
      funnelTotals[funnel].revenue += v.revenue;
      funnelTotals[funnel].partial += v.partial;
      funnelTotals[funnel].declined += v.declined;
      funnelTotals[funnel].days.add(s.date);
    }
  }

  const sortedFunnels = Object.entries(funnelTotals)
    .filter(([, v]) => v.orders >= 3)
    .sort((a, b) => b[1].orders - a[1].orders);

  console.log(`\n  ${'Funnel ID'.padEnd(42)} Orders  Revenue     Partial  Declined  Fail%   Days`);
  console.log('  ' + '─'.repeat(105));
  for (const [funnel, v] of sortedFunnels) {
    const failPct = (v.partial + v.declined) / v.orders;
    const marker = failPct > 0.3 ? ' 🔴' : failPct > 0.15 ? ' 🟡' : '';
    console.log(`  ${funnel.slice(0, 42).padEnd(42)} ${String(v.orders).padStart(5)}  ${$(v.revenue).padStart(10)}  ${String(v.partial).padStart(7)}  ${String(v.declined).padStart(8)}  ${pct(v.partial + v.declined, v.orders).padStart(5)}${marker}  ${v.days.size}`);
  }

  // ═══════════════════════════════════════════════════════════════
  //  5. PAYMENT METHOD FAILURE ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n' + '═'.repeat(130));
  console.log('  5. PAYMENT METHOD FAILURE RATES (aggregate)');
  console.log('═'.repeat(130));

  const payTotals: Record<string, { orders: number; partial: number; declined: number }> = {};
  for (const s of stats) {
    for (const [pm, v] of Object.entries(s.payMethods)) {
      if (!payTotals[pm]) payTotals[pm] = { orders: 0, partial: 0, declined: 0 };
      payTotals[pm].orders += v.orders;
      payTotals[pm].partial += v.partial;
      payTotals[pm].declined += v.declined;
    }
  }

  console.log(`\n  ${'Pay Method'.padEnd(30)} Orders  Partial  Declined  Fail%`);
  console.log('  ' + '─'.repeat(75));
  for (const [pm, v] of Object.entries(payTotals).sort((a, b) => b[1].orders - a[1].orders)) {
    const failPct = (v.partial + v.declined) / v.orders;
    const marker = failPct > 0.3 ? ' 🔴' : failPct > 0.15 ? ' 🟡' : '';
    console.log(`  ${pm.padEnd(30)} ${String(v.orders).padStart(5)}  ${String(v.partial).padStart(7)}  ${String(v.declined).padStart(8)}  ${pct(v.partial + v.declined, v.orders).padStart(5)}${marker}`);
  }

  // ═══════════════════════════════════════════════════════════════
  //  6. CC vs SHOPIFY DIVERGENCE (days where CC dropped but Shopify didn't)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n' + '═'.repeat(130));
  console.log('  6. CC vs SHOPIFY DIVERGENCE (CC underperforming Shopify)');
  console.log('═'.repeat(130));

  // Build rolling averages for CC share
  for (let i = 14; i < stats.length; i++) {
    const today = stats[i];
    if (today.ccOrders + today.shopifyOrders < 10) continue;

    const history = stats.slice(Math.max(0, i - 14), i);
    const avgCCShare = history.reduce((s, d) => {
      const total = d.ccOrders + d.shopifyOrders;
      return s + (total > 0 ? d.ccOrders / total : 0.5);
    }, 0) / history.length;

    const todayTotal = today.ccOrders + today.shopifyOrders;
    const todayCCShare = today.ccOrders / todayTotal;

    // CC share dropped significantly
    if (avgCCShare > 0.3 && todayCCShare < avgCCShare * 0.6) {
      console.log(`\n  ${today.date} — CC share crashed: ${pct(today.ccOrders, todayTotal)} vs avg ${(avgCCShare * 100).toFixed(0)}%`);
      console.log(`    CC: ${today.ccOrders} orders | Shopify: ${today.shopifyOrders} orders`);

      // CC completion rate vs Shopify
      const ccFailRate = today.ccOrders > 0 ? (today.ccPartial + today.ccDeclined) / today.ccOrders : 0;
      const shopComplete = (shopifyByDate.get(today.date) ?? []).filter((o) => o.status === 'COMPLETE' || o.status === 'REFUNDED').length;
      const shopFailRate = today.shopifyOrders > 0 ? (today.shopifyOrders - shopComplete) / today.shopifyOrders : 0;
      console.log(`    CC fail rate: ${(ccFailRate * 100).toFixed(0)}% | Shopify fail rate: ${(shopFailRate * 100).toFixed(0)}%`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  7. CC PARTIAL STREAKS (consecutive days with high partial rates)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n' + '═'.repeat(130));
  console.log('  7. CC PARTIAL/DECLINED STREAKS (consecutive days with >20% failure, min 3 CC orders/day)');
  console.log('═'.repeat(130));

  let streakStart: string | null = null;
  let streakDays = 0;
  let streakPartials = 0;
  let streakDeclines = 0;
  let streakOrders = 0;

  for (const s of stats) {
    if (s.ccOrders < 3) {
      if (streakDays >= 3) {
        console.log(`\n  STREAK: ${streakStart} → ${stats[stats.indexOf(s) - 1]?.date} (${streakDays} days)`);
        console.log(`    Total CC orders: ${streakOrders} | Partials: ${streakPartials} | Declines: ${streakDeclines} | Fail rate: ${pct(streakPartials + streakDeclines, streakOrders)}`);
      }
      streakStart = null;
      streakDays = 0;
      streakPartials = 0;
      streakDeclines = 0;
      streakOrders = 0;
      continue;
    }

    const failRate = (s.ccPartial + s.ccDeclined) / s.ccOrders;
    if (failRate > 0.2) {
      if (!streakStart) streakStart = s.date;
      streakDays++;
      streakPartials += s.ccPartial;
      streakDeclines += s.ccDeclined;
      streakOrders += s.ccOrders;
    } else {
      if (streakDays >= 3) {
        console.log(`\n  STREAK: ${streakStart} → ${stats[stats.indexOf(s) - 1]?.date} (${streakDays} days)`);
        console.log(`    Total CC orders: ${streakOrders} | Partials: ${streakPartials} | Declines: ${streakDeclines} | Fail rate: ${pct(streakPartials + streakDeclines, streakOrders)}`);
      }
      streakStart = null;
      streakDays = 0;
      streakPartials = 0;
      streakDeclines = 0;
      streakOrders = 0;
    }
  }
  if (streakDays >= 3) {
    console.log(`\n  STREAK: ${streakStart} → ${stats[stats.length - 1]?.date} (${streakDays} days)`);
    console.log(`    Total CC orders: ${streakOrders} | Partials: ${streakPartials} | Declines: ${streakDeclines} | Fail rate: ${pct(streakPartials + streakDeclines, streakOrders)}`);
  }

  // ═══════════════════════════════════════════════════════════════
  //  8. ZERO-REVENUE CC ORDERS (payment completely failed)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n' + '═'.repeat(130));
  console.log('  8. ZERO-REVENUE CC ORDERS (orders where payment fully failed)');
  console.log('═'.repeat(130));

  let zeroRevCount = 0;
  for (const s of stats) {
    const zeroRevOrders = (byDate.get(s.date) ?? []).filter((o) => (o.orderTotal || 0) === 0 && o.source === 'CHECKOUTCHAMP');
    if (zeroRevOrders.length === 0) continue;
    zeroRevCount += zeroRevOrders.length;
    console.log(`\n  ${s.date}: ${zeroRevOrders.length} zero-revenue orders`);
    for (const o of zeroRevOrders) {
      console.log(`    Status: ${o.status} | Campaign: ${o.campaignName || o.campaignId || 'unknown'} | Pay: ${o.paySource || 'unknown'} | Product: ${o.items[0]?.name || 'unknown'}`);
    }
  }
  console.log(`\n  Total zero-revenue CC orders: ${zeroRevCount} out of ${ccOrders.length} (${pct(zeroRevCount, ccOrders.length)})`);

  console.log('\n' + '═'.repeat(130));
  console.log('  END OF CC DROP ANALYSIS');
  console.log('═'.repeat(130) + '\n');

  await db.$disconnect();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
