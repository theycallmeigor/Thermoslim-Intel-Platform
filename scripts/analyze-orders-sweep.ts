/**
 * Order Pattern Analyzer — Full Sweep
 *
 * Runs the order-level pattern analyzer across every date in the dataset
 * and produces a summary report comparing order-level findings with
 * the aggregate detector's anomaly flags.
 *
 * Usage:
 *   npx tsx scripts/analyze-orders-sweep.ts                     # sweep all dates
 *   npx tsx scripts/analyze-orders-sweep.ts --from=2026-02-01   # start from date
 *   npx tsx scripts/analyze-orders-sweep.ts --lookback=14       # baseline window
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

import { analyzeOrders } from './autoresearch/order-analyzer';
import { runDetection } from './autoresearch/detector';
import { DEFAULT_CONFIG } from './autoresearch/types';
import type { OrderRow } from './autoresearch/order-analyzer';
import type { DetectorConfig, SnapshotRow } from './autoresearch/types';

function parseArgs(): { fromDate: string | null; lookback: number } {
  const args = process.argv.slice(2);
  let fromDate: string | null = null;
  let lookback = 14;

  for (const arg of args) {
    if (arg.startsWith('--from=')) fromDate = arg.split('=')[1];
    if (arg.startsWith('--lookback=')) lookback = parseInt(arg.split('=')[1], 10);
  }
  return { fromDate, lookback };
}

function loadConfig(): DetectorConfig {
  const configPath = path.join(process.cwd(), 'scripts/autoresearch/production-config.json');
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return raw['1d'] ?? DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  try {
    const { fromDate, lookback } = parseArgs();
    const config = loadConfig();

    // Get all distinct dates from orders
    const allOrders: OrderRow[] = await db.order.findMany({
      select: {
        id: true, status: true, paySource: true, responseType: true,
        campaignId: true, campaignName: true, salesUrl: true,
        ccOrderType: true, orderTotal: true, createdAt: true,
        items: {
          select: {
            name: true, sku: true, price: true, quantity: true,
            productCategoryName: true, recurringStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get all snapshots for the aggregate detector
    const allSnapshots: SnapshotRow[] = await db.dailySnapshot.findMany({
      select: {
        date: true, campaignId: true, campaignName: true, productLine: true,
        channel: true, funnelId: true, totalOrders: true, totalRevenue: true,
        newOrders: true, recurringOrders: true, newSubscribers: true,
        cancelledSubscribers: true, refunds: true, avgOrderValue: true,
      },
    });

    // Group orders by date
    const ordersByDate = new Map<string, OrderRow[]>();
    for (const order of allOrders) {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (!ordersByDate.has(dateKey)) ordersByDate.set(dateKey, []);
      ordersByDate.get(dateKey)!.push(order);
    }

    const sortedDates = [...ordersByDate.keys()].sort();
    const startIdx = fromDate ? sortedDates.findIndex((d) => d >= fromDate) : 0;
    const testDates = sortedDates.slice(Math.max(startIdx, lookback)); // need lookback days of baseline

    console.log(`\nSweeping ${testDates.length} dates (${testDates[0]} — ${testDates[testDates.length - 1]})`);
    console.log(`Lookback: ${lookback} days | Aggregate config: ${config === DEFAULT_CONFIG ? 'DEFAULT' : 'production'}`);
    console.log('═'.repeat(90));

    let totalFindings = 0;
    let daysWithFindings = 0;
    let aggregateAlertDays = 0;
    let orderOnlyDays = 0; // days where order analyzer found something but aggregate didn't
    let bothDays = 0;      // days where both found something
    const categoryCount: Record<string, number> = {};

    const results: Array<{
      date: string;
      orderFindings: number;
      aggregateAlerts: number;
      topFinding: string;
    }> = [];

    for (const dateKey of testDates) {
      const flaggedOrders = ordersByDate.get(dateKey) ?? [];

      // Build baseline: all orders from lookback days before this date
      const baselineDate = new Date(dateKey + 'T00:00:00Z');
      const baselineStart = new Date(baselineDate);
      baselineStart.setUTCDate(baselineStart.getUTCDate() - lookback);
      const baselineStartKey = baselineStart.toISOString().split('T')[0];

      const baselineOrders: OrderRow[] = [];
      for (const [d, orders] of ordersByDate.entries()) {
        if (d >= baselineStartKey && d < dateKey) {
          baselineOrders.push(...orders);
        }
      }

      // Run order analyzer
      const orderResult = analyzeOrders(flaggedOrders, baselineOrders, dateKey, lookback);

      // Run aggregate detector
      const relevantSnapshots = allSnapshots.filter((s) => {
        const sd = s.date.toISOString().split('T')[0];
        return sd >= baselineStartKey && sd <= dateKey;
      });
      const aggregateAnomalies = runDetection(relevantSnapshots, dateKey, config);

      const hasOrderFindings = orderResult.findings.length > 0;
      const hasAggregateAlerts = aggregateAnomalies.length > 0;

      if (hasOrderFindings) {
        daysWithFindings++;
        totalFindings += orderResult.findings.length;
        for (const f of orderResult.findings) {
          categoryCount[f.category] = (categoryCount[f.category] ?? 0) + 1;
        }
      }
      if (hasAggregateAlerts) aggregateAlertDays++;
      if (hasOrderFindings && !hasAggregateAlerts) orderOnlyDays++;
      if (hasOrderFindings && hasAggregateAlerts) bothDays++;

      const topFinding = orderResult.findings[0]?.finding ?? '—';
      results.push({
        date: dateKey,
        orderFindings: orderResult.findings.length,
        aggregateAlerts: aggregateAnomalies.length,
        topFinding: topFinding.slice(0, 70),
      });
    }

    // ── Print results table ─────────────────────────────────────────────────
    console.log(`\n${'Date'.padEnd(12)} ${'Order'.padStart(6)} ${'Aggr'.padStart(6)}  Top Finding`);
    console.log('─'.repeat(90));

    for (const r of results) {
      if (r.orderFindings === 0 && r.aggregateAlerts === 0) continue; // skip clean days
      const orderStr = r.orderFindings > 0 ? String(r.orderFindings) : '.';
      const aggrStr = r.aggregateAlerts > 0 ? String(r.aggregateAlerts) : '.';
      const marker = r.orderFindings > 0 && r.aggregateAlerts === 0 ? ' ←NEW' : '';
      console.log(`${r.date}  ${orderStr.padStart(6)} ${aggrStr.padStart(6)}  ${r.topFinding}${marker}`);
    }

    // ── Print summary ───────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(90));
    console.log(`  SWEEP SUMMARY`);
    console.log('═'.repeat(90));
    console.log(`  Dates analyzed:           ${testDates.length}`);
    console.log(`  Days with order findings: ${daysWithFindings}`);
    console.log(`  Days with aggregate alerts:${aggregateAlertDays}`);
    console.log(`  Days with BOTH:           ${bothDays}`);
    console.log(`  Order-only detections:    ${orderOnlyDays} (←NEW insights aggregate missed)`);
    console.log(`  Total order findings:     ${totalFindings}`);
    console.log();
    console.log(`  Finding categories:`);
    const sortedCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
    for (const [cat, count] of sortedCategories) {
      console.log(`    ${cat.padEnd(20)} ${count}`);
    }
    console.log('═'.repeat(90) + '\n');

  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error('Sweep failed:', err);
  process.exit(1);
});
