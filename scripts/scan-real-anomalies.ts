/**
 * Real Data Anomaly Scanner
 *
 * Runs the detector across EVERY date in the dataset using production configs.
 * No synthetic injections — just real data, real flags.
 *
 * For each timeframe, walks through all dates and shows what gets flagged.
 *
 * Usage:
 *   npx tsx scripts/scan-real-anomalies.ts
 *   npx tsx scripts/scan-real-anomalies.ts --timeframe=1d
 *   npx tsx scripts/scan-real-anomalies.ts --timeframe=15min --verbose
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

import { runDetection } from './autoresearch/detector';
import { DEFAULT_CONFIG, TIMEFRAME_ORDER } from './autoresearch/types';
import type { DetectorConfig, SnapshotRow, Timeframe, DetectedAnomaly } from './autoresearch/types';
import { buildSubdailySnapshots, loadOrdersForSubdaily } from './autoresearch/subdaily';

// ── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let timeframe: Timeframe | 'all' = 'all';
  let verbose = false;
  for (const arg of args) {
    if (arg.startsWith('--timeframe=')) timeframe = arg.split('=')[1] as Timeframe;
    if (arg === '--verbose') verbose = true;
  }
  return { timeframe, verbose };
}

// ── Config ──────────────────────────────────────────────────────────────────

function loadProductionConfig(): Record<string, DetectorConfig> {
  const p = path.resolve(process.cwd(), 'scripts/autoresearch/production-config.json');
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
  return {};
}

// ── Scan ─────────────────────────────────────────────────────────────────────

interface DayScan {
  date: string;
  warnings: number;
  criticals: number;
  anomalies: DetectedAnomaly[];
}

function scanTimeframe(
  snapshots: SnapshotRow[],
  config: DetectorConfig,
  verbose: boolean,
  isSubdaily: boolean,
): DayScan[] {
  // Get all unique period keys
  const allDates = [...new Set(snapshots.map((s) => {
    const d = s.date instanceof Date ? s.date : new Date(s.date);
    return isSubdaily ? d.toISOString() : d.toISOString().slice(0, 10);
  }))].sort();

  // Need enough history before we can detect
  const startIdx = Math.max(config.minHistory, config.lookbackDays);
  const results: DayScan[] = [];

  // Track chronic patterns across dates
  const priorAnomalies = new Map<string, DetectedAnomaly[]>();

  for (let i = startIdx; i < allDates.length; i++) {
    const todayKey = allDates[i];

    // Build lookback window
    const windowStart = allDates[Math.max(0, i - config.lookbackDays - 1)];
    const windowSnapshots = snapshots.filter((s) => {
      const dk = isSubdaily
        ? s.date.toISOString()
        : s.date.toISOString().split('T')[0];
      return dk >= windowStart && dk <= todayKey;
    });

    const anomalies = runDetection(windowSnapshots, todayKey, config, {
      isSubdaily,
      priorAnomalies,
    });

    // Track for chronic suppression
    for (const a of anomalies) {
      const key = `${a.type}|${a.metric}|${a.dimension ?? ''}|${a.dimensionValue ?? ''}`;
      if (!priorAnomalies.has(key)) priorAnomalies.set(key, []);
      priorAnomalies.get(key)!.push(a);
    }

    if (anomalies.length > 0) {
      const warnings = anomalies.filter((a) => a.severity === 'WARNING').length;
      const criticals = anomalies.filter((a) => a.severity === 'CRITICAL').length;
      results.push({ date: todayKey, warnings, criticals, anomalies });

      if (verbose) {
        const icon = criticals > 0 ? '🔴' : '🟡';
        console.log(`    ${icon} ${todayKey}: ${criticals} critical, ${warnings} warning`);
        // Show top 3 most severe
        const sorted = [...anomalies].sort((a, b) => {
          const sev = (b.severity === 'CRITICAL' ? 1 : 0) - (a.severity === 'CRITICAL' ? 1 : 0);
          if (sev !== 0) return sev;
          return Math.abs(b.deviation) - Math.abs(a.deviation);
        });
        for (const a of sorted.slice(0, 3)) {
          const tag = a.type === 'ATTRIBUTION' ? 'ATTRIB' : a.type;
          console.log(`      [${a.severity}] [${tag}] ${a.explanation.slice(0, 120)}`);
        }
        if (sorted.length > 3) console.log(`      ... +${sorted.length - 3} more`);
      }
    }
  }

  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { timeframe, verbose } = parseArgs();
  const prodConfig = loadProductionConfig();
  const timeframes: Timeframe[] = timeframe === 'all' ? [...TIMEFRAME_ORDER] : [timeframe as Timeframe];

  console.log('\n' + '═'.repeat(70));
  console.log('  REAL DATA ANOMALY SCANNER');
  console.log('═'.repeat(70));
  console.log(`  Timeframes: ${timeframes.join(', ')}`);
  console.log(`  Mode: ${verbose ? 'verbose (show each anomaly)' : 'summary'}`);
  console.log('═'.repeat(70));

  // Load data
  console.log('\nLoading data...');
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();
  const dailySnapshots: SnapshotRow[] = await db.dailySnapshot.findMany({
    orderBy: { date: 'asc' },
    select: {
      date: true, campaignId: true, campaignName: true, productLine: true,
      channel: true, funnelId: true, totalOrders: true, totalRevenue: true,
      newOrders: true, recurringOrders: true, newSubscribers: true,
      cancelledSubscribers: true, refunds: true, avgOrderValue: true,
    },
  }) as SnapshotRow[];
  await db.$disconnect();
  console.log(`  Daily snapshots: ${dailySnapshots.length} rows`);

  let orders: Awaited<ReturnType<typeof loadOrdersForSubdaily>> | null = null;
  const subdailyData: Record<string, SnapshotRow[]> = {};
  const needSubdaily = timeframes.some((tf) => ['15min', '1h', '4h', '6h'].includes(tf));
  if (needSubdaily) {
    orders = await loadOrdersForSubdaily();
    console.log(`  Orders for sub-daily: ${orders.length}`);
    for (const tf of ['15min', '1h', '4h', '6h'] as Timeframe[]) {
      if (timeframes.includes(tf)) {
        subdailyData[tf] = buildSubdailySnapshots(orders, tf);
        console.log(`  ${tf} snapshots: ${subdailyData[tf].length} rows`);
      }
    }
  }

  // ── Scan each timeframe ──────────────────────────────────────────────────

  const summary: Array<{
    timeframe: Timeframe;
    totalDates: number;
    flaggedDates: number;
    totalWarnings: number;
    totalCriticals: number;
    topAnomalies: DayScan[];
  }> = [];

  for (const tf of timeframes) {
    const isDaily = tf === '1d' || tf === '1w';
    const snapshots = isDaily ? dailySnapshots : subdailyData[tf];
    const config = prodConfig[tf] ?? DEFAULT_CONFIG;

    if (!snapshots || snapshots.length === 0) {
      console.log(`\n── Skipping ${tf}: no data ──`);
      continue;
    }

    const allDates = [...new Set(snapshots.map((s) => {
      const d = s.date instanceof Date ? s.date : new Date(s.date);
      return d.toISOString().slice(0, 10);
    }))];

    const isSubdaily = ['15min', '1h', '4h', '6h'].includes(tf);

    console.log('\n' + '─'.repeat(70));
    console.log(`  SCANNING: ${tf} (${allDates.length} unique dates, config: warning=${config.warningThreshold} critical=${config.criticalThreshold}${isSubdaily ? ', sub-daily window comparison' : ''})`);
    console.log('─'.repeat(70));

    const results = scanTimeframe(snapshots, config, verbose, isSubdaily);

    const totalWarnings = results.reduce((s, r) => s + r.warnings, 0);
    const totalCriticals = results.reduce((s, r) => s + r.criticals, 0);

    // Sort by severity (most critical first)
    const sortedResults = [...results].sort((a, b) => b.criticals - a.criticals || b.warnings - a.warnings);

    summary.push({
      timeframe: tf,
      totalDates: allDates.length,
      flaggedDates: results.length,
      totalWarnings,
      totalCriticals,
      topAnomalies: sortedResults.slice(0, 10),
    });

    console.log(`\n  ${tf} RESULT: ${results.length}/${allDates.length} dates flagged (${totalCriticals} criticals, ${totalWarnings} warnings)`);

    if (!verbose) {
      // Show top 5 worst days
      console.log(`  Top flagged days:`);
      for (const day of sortedResults.slice(0, 5)) {
        const icon = day.criticals > 0 ? 'CRIT' : 'WARN';
        console.log(`    [${icon}] ${day.date}: ${day.criticals} critical, ${day.warnings} warning`);
        // Show the worst anomaly for this day
        const worst = day.anomalies
          .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))[0];
        if (worst) {
          console.log(`          ${worst.explanation.slice(0, 120)}`);
        }
      }
    }
  }

  // ── Final summary ──────────────────────────────────────────────────────────

  console.log('\n' + '═'.repeat(70));
  console.log('  SCAN COMPLETE');
  console.log('═'.repeat(70));
  console.log(`  ${'Timeframe'.padEnd(10)} ${'Dates'.padStart(8)} ${'Flagged'.padStart(8)} ${'Rate'.padStart(8)} ${'Criticals'.padStart(10)} ${'Warnings'.padStart(10)}`);
  for (const s of summary) {
    const rate = ((s.flaggedDates / s.totalDates) * 100).toFixed(0) + '%';
    console.log(`  ${s.timeframe.padEnd(10)} ${s.totalDates.toString().padStart(8)} ${s.flaggedDates.toString().padStart(8)} ${rate.padStart(8)} ${s.totalCriticals.toString().padStart(10)} ${s.totalWarnings.toString().padStart(10)}`);
  }
  console.log('═'.repeat(70) + '\n');
}

main().catch((err) => {
  console.error('Scan failed:', err);
  process.exit(1);
});
