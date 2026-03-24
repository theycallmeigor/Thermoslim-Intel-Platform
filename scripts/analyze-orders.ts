/**
 * Order-Level Pattern Analyzer — CLI
 *
 * Usage:
 *   npx tsx scripts/analyze-orders.ts                      # analyze today
 *   npx tsx scripts/analyze-orders.ts --date=2026-03-15    # analyze specific date
 *   npx tsx scripts/analyze-orders.ts --lookback=14        # custom baseline window (default: 14)
 *   npx tsx scripts/analyze-orders.ts --all-flagged        # analyze all dates with active anomalies
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

import { analyzeOrders } from './autoresearch/order-analyzer';
import type { OrderRow } from './autoresearch/order-analyzer';

function parseArgs(): { dates: string[]; lookback: number; allFlagged: boolean } {
  const args = process.argv.slice(2);
  let dates: string[] = [];
  let lookback = 14;
  let allFlagged = false;

  for (const arg of args) {
    if (arg.startsWith('--date=')) dates.push(arg.split('=')[1]);
    if (arg.startsWith('--lookback=')) lookback = parseInt(arg.split('=')[1], 10);
    if (arg === '--all-flagged') allFlagged = true;
  }

  if (dates.length === 0 && !allFlagged) {
    const now = new Date();
    dates = [new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().split('T')[0]];
  }

  return { dates, lookback, allFlagged };
}

async function fetchOrders(db: any, startDate: Date, endDate: Date): Promise<OrderRow[]> {
  const orders = await db.order.findMany({
    where: {
      createdAt: { gte: startDate, lt: endDate },
    },
    select: {
      id: true,
      status: true,
      paySource: true,
      responseType: true,
      campaignId: true,
      campaignName: true,
      salesUrl: true,
      ccOrderType: true,
      orderTotal: true,
      createdAt: true,
      items: {
        select: {
          name: true,
          sku: true,
          price: true,
          quantity: true,
          productCategoryName: true,
          recurringStatus: true,
        },
      },
    },
  });

  return orders;
}

function printResult(result: ReturnType<typeof analyzeOrders>): void {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  ORDER PATTERN ANALYSIS — ${result.date}`);
  console.log(`${'═'.repeat(70)}`);
  console.log(`  Flagged day orders:  ${result.flaggedOrderCount}`);
  console.log(`  Baseline orders:     ${result.baselineOrderCount} (over ${result.baselineDays} days, avg ${(result.baselineOrderCount / Math.max(result.baselineDays, 1)).toFixed(1)}/day)`);
  console.log(`${'─'.repeat(70)}`);

  if (result.findings.length === 0) {
    console.log('  No significant patterns detected.');
    console.log(`${'═'.repeat(70)}\n`);
    return;
  }

  for (const f of result.findings) {
    const icon = f.severity === 'CRITICAL' ? '[CRITICAL]' : f.severity === 'WARNING' ? '[WARNING] ' : '[INFO]    ';
    console.log(`\n  ${icon} ${f.category}`);
    console.log(`  ${f.finding}`);
    console.log(`  Deviation score: ${(f.deviationScore * 100).toFixed(0)}%`);

    // Show distribution comparison
    const bKeys = Object.keys(f.baselineDistribution);
    const fKeys = Object.keys(f.flaggedDistribution);
    const allKeys = [...new Set([...bKeys, ...fKeys])];
    if (allKeys.length <= 10) {
      console.log(`  ${'Category'.padEnd(20)} ${'Baseline'.padStart(10)} ${'Flagged'.padStart(10)} ${'Δ'.padStart(8)}`);
      for (const key of allKeys) {
        const b = f.baselineDistribution[key] ?? 0;
        const fl = f.flaggedDistribution[key] ?? 0;
        const delta = fl - b;
        const deltaStr = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
        console.log(`  ${key.padEnd(20)} ${(b.toFixed(1) + '%').padStart(10)} ${(fl.toFixed(1) + '%').padStart(10)} ${(deltaStr + 'pp').padStart(8)}`);
      }
    }
  }

  console.log(`\n${'═'.repeat(70)}\n`);
}

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  try {
    let { dates, lookback, allFlagged } = parseArgs();

    // If --all-flagged, get dates from unresolved anomalies
    if (allFlagged) {
      const anomalies = await db.anomaly.findMany({
        where: { resolvedAt: null, acknowledged: false },
        select: { detectedAt: true },
      });
      dates = [...new Set(anomalies.map((a: any) =>
        a.detectedAt.toISOString().split('T')[0]
      ))];
      if (dates.length === 0) {
        console.log('No active (unresolved, unacknowledged) anomalies found.');
        return;
      }
      console.log(`Found ${dates.length} flagged date(s): ${dates.join(', ')}`);
    }

    for (const dateStr of dates) {
      const flaggedDate = new Date(dateStr + 'T00:00:00Z');
      const flaggedEnd = new Date(flaggedDate);
      flaggedEnd.setUTCDate(flaggedEnd.getUTCDate() + 1);

      const baselineStart = new Date(flaggedDate);
      baselineStart.setUTCDate(baselineStart.getUTCDate() - lookback);

      // Fetch orders for flagged day
      const flaggedOrders = await fetchOrders(db, flaggedDate, flaggedEnd);

      // Fetch baseline orders (lookback days before flagged day)
      const baselineOrders = await fetchOrders(db, baselineStart, flaggedDate);

      const result = analyzeOrders(flaggedOrders, baselineOrders, dateStr, lookback);
      printResult(result);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error('Order analysis failed:', err);
  process.exit(1);
});
