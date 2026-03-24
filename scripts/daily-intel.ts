/**
 * Daily Sales Intelligence
 * Pulls fresh order data from DB and cross-references with anomaly detection
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

  // Get all orders with full detail
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

  console.log(`\nTotal orders: ${orders.length}`);
  console.log(`Date range: ${orders[0]?.createdAt.toISOString().slice(0, 10)} → ${orders[orders.length - 1]?.createdAt.toISOString().slice(0, 10)}`);

  // Group by date
  const byDate = new Map<string, typeof orders>();
  for (const o of orders) {
    const dk = o.createdAt.toISOString().slice(0, 10);
    const arr = byDate.get(dk) ?? [];
    arr.push(o);
    byDate.set(dk, arr);
  }

  // Compute rolling averages for anomaly detection
  const dates = [...byDate.keys()].sort();
  const dailyStats: Array<{
    date: string;
    orders: number;
    revenue: number;
    newOrders: number;
    rebills: number;
    avgOrderValue: number;
    topProducts: Array<[string, number]>;
    topCampaigns: Array<[string, number]>;
    statusMix: Record<string, number>;
    channelMix: Record<string, number>;
    subscriptions: number;
  }> = [];

  for (const dk of dates) {
    const dayOrders = byDate.get(dk)!;
    const count = dayOrders.length;
    const revenue = dayOrders.reduce((s, o) => s + (o.orderTotal || 0), 0);
    const newOrders = dayOrders.filter((o) => o.ccOrderType !== 'REBILL').length;
    const rebills = dayOrders.filter((o) => o.ccOrderType === 'REBILL').length;
    const avgOV = count > 0 ? revenue / count : 0;

    // Product line breakdown (derived from item names)
    const plCounts: Record<string, number> = {};
    for (const o of dayOrders) {
      const pl = o.items[0]?.name || o.items[0]?.productCategoryName || 'unknown';
      plCounts[pl] = (plCounts[pl] || 0) + 1;
    }
    const topProducts = Object.entries(plCounts).sort((a, b) => b[1] - a[1]);

    // Campaign breakdown
    const campCounts: Record<string, number> = {};
    for (const o of dayOrders) {
      const c = o.campaignName || o.source || 'unknown';
      campCounts[c] = (campCounts[c] || 0) + 1;
    }
    const topCampaigns = Object.entries(campCounts).sort((a, b) => b[1] - a[1]);

    // Status mix
    const statusMix: Record<string, number> = {};
    for (const o of dayOrders) {
      const s = o.status || 'unknown';
      statusMix[s] = (statusMix[s] || 0) + 1;
    }

    // Channel (source) mix
    const channelMix: Record<string, number> = {};
    for (const o of dayOrders) {
      const ch = o.source || 'unknown';
      channelMix[ch] = (channelMix[ch] || 0) + 1;
    }

    // New subscriptions
    const subs = dayOrders.filter((o) =>
      o.items.some((i) => i.recurringStatus && i.recurringStatus !== 'CANCELLED' && (i.billingCycleNumber ?? 0) <= 1),
    ).length;

    dailyStats.push({
      date: dk, orders: count, revenue, newOrders, rebills,
      avgOrderValue: avgOV, topProducts, topCampaigns, statusMix, channelMix,
      subscriptions: subs,
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // DROP-FOCUSED ANOMALY DETECTION
  // ══════════════════════════════════════════════════════════════════

  console.log('\n' + '═'.repeat(130));
  console.log('  DAILY SALES INTELLIGENCE — DROP ANOMALIES');
  console.log('═'.repeat(130));

  const dropDays: Array<{
    date: string;
    stat: (typeof dailyStats)[0];
    prevStat?: (typeof dailyStats)[0];
    flags: string[];
    severity: 'CRITICAL' | 'WARNING';
  }> = [];

  for (let i = 7; i < dailyStats.length; i++) {
    const today = dailyStats[i];
    const yesterday = dailyStats[i - 1];
    const history = dailyStats.slice(Math.max(0, i - 14), i);

    const avgOrders = history.reduce((s, d) => s + d.orders, 0) / history.length;
    const avgRevenue = history.reduce((s, d) => s + d.revenue, 0) / history.length;
    const avgAOV = history.reduce((s, d) => s + d.avgOrderValue, 0) / history.length;
    const sdOrders = Math.sqrt(history.reduce((s, d) => s + (d.orders - avgOrders) ** 2, 0) / history.length);
    const sdRevenue = Math.sqrt(history.reduce((s, d) => s + (d.revenue - avgRevenue) ** 2, 0) / history.length);

    // Completion rate (historical)
    const avgCompletionRate = history.reduce((s, d) => {
      const complete = d.statusMix['COMPLETE'] || 0;
      return s + (d.orders > 0 ? complete / d.orders : 1);
    }, 0) / history.length;

    const flags: string[] = [];
    let severity: 'CRITICAL' | 'WARNING' = 'WARNING';

    // ── 1. Z-score drops (lower threshold for drops: 1.8σ instead of 2.5σ) ──
    if (sdOrders > 0 && today.orders < avgOrders) {
      const zOrders = (today.orders - avgOrders) / sdOrders;
      if (zOrders < -1.8) {
        const pctDrop = ((avgOrders - today.orders) / avgOrders * 100).toFixed(0);
        flags.push(`📉 Orders DROP: ${today.orders} vs avg ${avgOrders.toFixed(0)} (${zOrders.toFixed(1)}σ, -${pctDrop}%)`);
        if (zOrders < -3) severity = 'CRITICAL';
      }
    }

    if (sdRevenue > 0 && today.revenue < avgRevenue) {
      const zRev = (today.revenue - avgRevenue) / sdRevenue;
      if (zRev < -1.8) {
        const pctDrop = ((avgRevenue - today.revenue) / avgRevenue * 100).toFixed(0);
        flags.push(`📉 Revenue DROP: $${(today.revenue / 100).toFixed(2)} vs avg $${(avgRevenue / 100).toFixed(2)} (${zRev.toFixed(1)}σ, -${pctDrop}%)`);
        if (zRev < -3) severity = 'CRITICAL';
      }
    }

    // ── 2. Day-over-day crash (>40% drop from yesterday, min 5 orders yesterday) ──
    if (yesterday.orders >= 5 && today.orders < yesterday.orders) {
      const dodDrop = (yesterday.orders - today.orders) / yesterday.orders;
      if (dodDrop > 0.4) {
        flags.push(`⚡ Day-over-day orders crash: ${today.orders} vs yesterday ${yesterday.orders} (-${(dodDrop * 100).toFixed(0)}%)`);
        if (dodDrop > 0.7) severity = 'CRITICAL';
      }
    }

    if (yesterday.revenue > 100 && today.revenue < yesterday.revenue) {
      const dodRevDrop = (yesterday.revenue - today.revenue) / yesterday.revenue;
      if (dodRevDrop > 0.5) {
        flags.push(`⚡ Day-over-day revenue crash: $${(today.revenue / 100).toFixed(2)} vs yesterday $${(yesterday.revenue / 100).toFixed(2)} (-${(dodRevDrop * 100).toFixed(0)}%)`);
        if (dodRevDrop > 0.75) severity = 'CRITICAL';
      }
    }

    // ── 3. Channel disappearance (channel active in history goes to 0) ──
    const histChannels: Record<string, number[]> = {};
    for (const h of history) {
      for (const [ch, cnt] of Object.entries(h.channelMix)) {
        if (!histChannels[ch]) histChannels[ch] = [];
        histChannels[ch].push(cnt);
      }
    }
    for (const [ch, counts] of Object.entries(histChannels)) {
      const avgChOrders = counts.reduce((s, v) => s + v, 0) / history.length;
      const todayCh = today.channelMix[ch] || 0;
      if (avgChOrders >= 3 && todayCh === 0) {
        flags.push(`🚫 Channel GONE: ${ch} had avg ${avgChOrders.toFixed(1)} orders/day, today: 0`);
        severity = 'CRITICAL';
      } else if (avgChOrders >= 5 && todayCh > 0 && todayCh < avgChOrders * 0.3) {
        flags.push(`📉 Channel drop: ${ch} at ${todayCh} orders vs avg ${avgChOrders.toFixed(1)} (-${((1 - todayCh / avgChOrders) * 100).toFixed(0)}%)`);
      }
    }

    // ── 4. Completion rate drop (PARTIAL/DECLINED spike = payment/checkout issues) ──
    const todayComplete = today.statusMix['COMPLETE'] || 0;
    const todayCompletionRate = today.orders > 0 ? todayComplete / today.orders : 1;
    const todayPartial = today.statusMix['PARTIAL'] || 0;
    const todayDeclined = today.statusMix['DECLINED'] || 0;
    const todayRefunded = today.statusMix['REFUNDED'] || 0;
    const failedPct = today.orders > 0 ? (todayPartial + todayDeclined) / today.orders : 0;

    if (today.orders >= 3 && avgCompletionRate > 0) {
      const crDrop = (avgCompletionRate - todayCompletionRate) / avgCompletionRate;
      if (crDrop > 0.2) {
        flags.push(`⚠️  Completion rate DROP: ${(todayCompletionRate * 100).toFixed(0)}% vs avg ${(avgCompletionRate * 100).toFixed(0)}% | Partial: ${todayPartial}, Declined: ${todayDeclined}`);
        if (crDrop > 0.4) severity = 'CRITICAL';
      }
    }

    // ── 5. Refund spike ──
    const avgRefunds = history.reduce((s, d) => s + (d.statusMix['REFUNDED'] || 0), 0) / history.length;
    if (todayRefunded >= 2 && avgRefunds > 0 && todayRefunded > avgRefunds * 3) {
      flags.push(`💸 Refund spike: ${todayRefunded} refunds vs avg ${avgRefunds.toFixed(1)}`);
    } else if (todayRefunded >= 3 && avgRefunds === 0) {
      flags.push(`💸 Refund spike: ${todayRefunded} refunds (none in prior 14 days)`);
    }

    // Refund rate (when volume is high enough)
    if (today.orders >= 10 && todayRefunded > 0) {
      const refundRate = todayRefunded / today.orders;
      const avgRefundRate = history.reduce((s, d) => {
        const ref = d.statusMix['REFUNDED'] || 0;
        return s + (d.orders > 0 ? ref / d.orders : 0);
      }, 0) / history.length;
      if (refundRate > avgRefundRate * 2.5 && refundRate > 0.05) {
        flags.push(`💸 Refund rate elevated: ${(refundRate * 100).toFixed(0)}% vs avg ${(avgRefundRate * 100).toFixed(0)}%`);
      }
    }

    // ── 6. AOV crash (lower threshold for drops) ──
    if (avgAOV > 0 && today.orders >= 3) {
      const aovDrop = (avgAOV - today.avgOrderValue) / avgAOV;
      if (aovDrop > 0.3) {
        flags.push(`📉 AOV DROP: $${(today.avgOrderValue / 100).toFixed(2)} vs avg $${(avgAOV / 100).toFixed(2)} (-${(aovDrop * 100).toFixed(0)}%)`);
      }
    }

    // ── 7. Product disappearance (top product from history vanishes) ──
    const checkedProducts = new Set<string>();
    for (const h of history) {
      for (const [pl, hCount] of h.topProducts.slice(0, 2)) {
        if (checkedProducts.has(pl)) continue;
        checkedProducts.add(pl);
        const hShare = hCount / h.orders;
        if (hShare > 0.25 && hCount >= 3) {
          const todayPl = today.topProducts.find(([p]) => p === pl)?.[1] ?? 0;
          if (todayPl === 0 && today.orders >= 5) {
            const presenceDays = history.filter((d) =>
              d.topProducts.some(([p, c]) => p === pl && c >= 2),
            ).length;
            if (presenceDays >= 5) {
              flags.push(`🚫 Product GONE: ${pl} (present ${presenceDays} of last ${history.length} days, today: 0)`);
            }
          }
        }
      }
    }

    // ── 8. Zero revenue day (orders exist but no revenue = payment failure) ──
    if (today.orders >= 2 && today.revenue === 0) {
      flags.push(`🔴 ZERO REVENUE: ${today.orders} orders but $0 collected — all payments failed/partial`);
      severity = 'CRITICAL';
    }

    if (flags.length > 0) {
      dropDays.push({ date: today.date, stat: today, prevStat: yesterday, flags, severity });
    }
  }

  // Helper: cents to dollars display
  const $ = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // Print drop anomaly days
  for (const day of dropDays) {
    const s = day.stat;
    const icon = day.severity === 'CRITICAL' ? '🔴 CRITICAL' : '🟡 WARNING';
    console.log(`\n${icon} — ${day.date}`);
    console.log(`  Orders: ${s.orders} | Revenue: ${$(s.revenue)} | New: ${s.newOrders} | Rebills: ${s.rebills} | Subs: ${s.subscriptions} | AOV: ${$(s.avgOrderValue)}`);
    console.log(`  Products: ${s.topProducts.slice(0, 3).map(([p, c]) => `${p}(${c})`).join(', ')}`);
    console.log(`  Channels: ${Object.entries(s.channelMix).map(([k, v]) => `${k}:${v}`).join(', ')}`);
    console.log(`  Status: ${Object.entries(s.statusMix).map(([k, v]) => `${k}:${v}`).join(', ')}`);
    if (day.prevStat) {
      console.log(`  Yesterday: Orders ${day.prevStat.orders} | Revenue ${$(day.prevStat.revenue)} | ${Object.entries(day.prevStat.channelMix).map(([k, v]) => `${k}:${v}`).join(', ')}`);
    }
    for (const f of day.flags) {
      console.log(`  → ${f}`);
    }
  }

  console.log('\n' + '═'.repeat(130));
  console.log(`  DROP SUMMARY: ${dropDays.length} drop days out of ${dates.length} total`);
  console.log(`  Critical: ${dropDays.filter((d) => d.severity === 'CRITICAL').length}`);
  console.log(`  Warning: ${dropDays.filter((d) => d.severity === 'WARNING').length}`);
  console.log('═'.repeat(130) + '\n');

  await db.$disconnect();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
