import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

import { runDetection } from './autoresearch/detector';
import { DEFAULT_CONFIG } from './autoresearch/types';
import type { DetectorConfig, SnapshotRow } from './autoresearch/types';

function formatMoney(cents: number): string {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayKey = today.toISOString().split('T')[0];
    const config = loadConfig();

    const lookbackStart = new Date(today);
    lookbackStart.setUTCDate(lookbackStart.getUTCDate() - (config.lookbackDays + 1));

    // Fetch all snapshots within the window
    const snapshots: SnapshotRow[] = await db.dailySnapshot.findMany({
      where: { date: { gte: lookbackStart, lte: today } },
      select: {
        date: true,
        campaignId: true,
        campaignName: true,
        productLine: true,
        channel: true,
        funnelId: true,
        totalOrders: true,
        totalRevenue: true,
        newOrders: true,
        recurringOrders: true,
        newSubscribers: true,
        cancelledSubscribers: true,
        refunds: true,
        avgOrderValue: true,
      },
    });

    if (snapshots.length === 0) {
      console.log('No DailySnapshot data found in the lookback window. Exiting.');
      return;
    }

    // ── Run detection ────────────────────────────────────────────────────────
    const newAnomalies = runDetection(snapshots, todayKey, config);

    const layer1Count = newAnomalies.filter((a) => a.type === 'METRIC').length;
    const layer2Count = newAnomalies.filter((a) => a.type === 'FUNNEL').length;
    const layer3Count = newAnomalies.filter((a) => a.type === 'ATTRIBUTION').length;

    console.log('\n── Layer 1: Metric Anomalies ──────────────────────────────────────');
    console.log(`  Found ${layer1Count} metric anomalies.`);
    console.log('\n── Layer 2: Funnel Breakage ───────────────────────────────────────');
    console.log(`  Found ${layer2Count} funnel breakage anomalies.`);
    console.log('\n── Layer 3: Change Attribution ────────────────────────────────────');
    console.log(`  Found ${layer3Count} attribution anomalies.`);

    // ── Auto-resolve old anomalies ───────────────────────────────────────────
    console.log('\n── Auto-resolving recovered anomalies ─────────────────────────────');

    const unresolvedAnomalies = await db.anomaly.findMany({
      where: { type: 'METRIC', resolvedAt: null },
    });

    let resolvedCount = 0;
    for (const existing of unresolvedAnomalies) {
      const isReflagged = newAnomalies.some(
        (a) => a.type === 'METRIC' && a.metric === existing.metric && a.dimension === existing.dimension && a.dimensionValue === existing.dimensionValue,
      );
      if (!isReflagged) {
        await db.anomaly.update({
          where: { id: existing.id },
          data: { resolvedAt: now },
        });
        resolvedCount++;
      }
    }

    console.log(`  Resolved ${resolvedCount} previously flagged anomalies.`);

    // ── Write new anomalies to database ──────────────────────────────────────
    console.log('\n── Writing new anomalies to database ──────────────────────────────');

    if (newAnomalies.length > 0) {
      await db.anomaly.createMany({
        data: newAnomalies.map((a) => ({
          type: a.type,
          severity: a.severity,
          metric: a.metric,
          dimension: a.dimension,
          dimensionValue: a.dimensionValue,
          expected: a.expected,
          actual: a.actual,
          deviation: a.deviation,
          explanation: a.explanation,
          detectedAt: now,
        })),
      });
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    const warnings = newAnomalies.filter((a) => a.severity === 'WARNING').length;
    const criticals = newAnomalies.filter((a) => a.severity === 'CRITICAL').length;

    console.log('\n══════════════════════════════════════════════════════════════════════');
    console.log(`  ANOMALY DETECTION SUMMARY — ${todayKey}`);
    console.log('══════════════════════════════════════════════════════════════════════');
    console.log(`  New warnings:  ${warnings}`);
    console.log(`  New critical:  ${criticals}`);
    console.log(`  Resolved:      ${resolvedCount}`);
    console.log(`  Total written: ${newAnomalies.length}`);
    console.log('══════════════════════════════════════════════════════════════════════\n');

    if (newAnomalies.length > 0) {
      console.log('  Details:');
      for (const a of newAnomalies) {
        const icon = a.severity === 'CRITICAL' ? '[CRITICAL]' : '[WARNING] ';
        const typeTag = `[${a.type}]`.padEnd(14);
        console.log(`    ${icon} ${typeTag} ${a.explanation}`);
      }
      console.log('');
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error('Anomaly detection failed:', err);
  process.exit(1);
});
