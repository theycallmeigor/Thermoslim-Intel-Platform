/**
 * CC QA Runner
 *
 * Usage:
 *   npx tsx scripts/cc-qa/run.ts                    # full scan, all history
 *   npx tsx scripts/cc-qa/run.ts --days=7           # last 7 days
 *   npx tsx scripts/cc-qa/run.ts --verbose           # show all hourly windows
 *   npx tsx scripts/cc-qa/run.ts --feed=/path.json  # add JSON source
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

import {
  buildHourlyWindows, detectStreaks, updateLearnings,
  exportFindings, saveLearnings, loadLearnings, saveFindings,
} from './engine';
import { createDatabaseSource } from './sources/database';
import { createJsonFeedSource } from './sources/json-feed';
import type { CCEvent, SourceAdapter } from './types';
import { DEFAULT_QA_CONFIG } from './types';

async function main() {
  const args = process.argv.slice(2);
  const daysArg = args.find((a) => a.startsWith('--days='));
  const feedArg = args.find((a) => a.startsWith('--feed='));
  const verbose = args.includes('--verbose');
  const days = daysArg ? parseInt(daysArg.split('=')[1]) : 0;

  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  const $ = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // ── Set up sources ──
  const sources: SourceAdapter[] = [createDatabaseSource(db)];
  if (feedArg) {
    const feedPath = feedArg.split('=')[1];
    sources.push(createJsonFeedSource(feedPath));
    console.log(`  Added JSON feed source: ${feedPath}`);
  }

  // ── Determine time range ──
  const to = new Date();
  let from: Date;
  if (days > 0) {
    from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  } else {
    // Pull all history
    from = new Date('2025-01-01');
  }

  console.log(`\n  CC QA Engine — Streak Detection + Learning`);
  console.log(`  Range: ${from.toISOString().slice(0, 10)} → ${to.toISOString().slice(0, 10)}`);
  console.log(`  Sources: ${sources.map((s) => s.name).join(', ')}`);

  // ── Pull events from all sources ──
  const allEvents: CCEvent[] = [];
  for (const source of sources) {
    const events = await source.pull(from, to);
    console.log(`  ${source.name}: ${events.length} events`);
    allEvents.push(...events);
  }
  allEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const totalAbandons = allEvents.filter((e) => e.isAbandon).length;
  const totalActive = allEvents.length - totalAbandons;
  console.log(`  Total: ${allEvents.length} CC events (${totalActive} active, ${totalAbandons} abandoned checkouts filtered)\n`);

  if (allEvents.length === 0) {
    console.log('  No events found. Exiting.');
    await db.$disconnect();
    return;
  }

  // ── Build hourly windows ──
  const windows = buildHourlyWindows(allEvents);
  console.log(`  Built ${windows.length} hourly windows`);

  if (verbose) {
    console.log('\n' + '─'.repeat(120));
    console.log('  HOURLY WINDOWS (verbose)');
    console.log('─'.repeat(120));
    for (const w of windows) {
      if (w.totalOrders === 0) continue;
      const bar = w.failRate > 0.5 ? '█'.repeat(Math.round(w.failRate * 20)) : '▓'.repeat(Math.round(w.failRate * 20));
      console.log(`  ${w.windowKey} | ${String(w.totalOrders).padStart(3)} orders | ✓${String(w.completeOrders).padStart(3)} ✗${String(w.partialOrders).padStart(3)} ⊘${String(w.declinedOrders).padStart(2)} 🚪${String(w.abandonedOrders).padStart(3)} | fail ${(w.failRate * 100).toFixed(0).padStart(3)}% abn ${(w.abandonRate * 100).toFixed(0).padStart(3)}% ${bar} | ${$(w.revenue)}`);
    }
  }

  // ── Load prior learnings ──
  const priorLearnings = loadLearnings();
  console.log(`  Prior learnings loaded: ${priorLearnings.length}`);

  // ── Detect streaks ──
  const streaks = detectStreaks(windows, DEFAULT_QA_CONFIG, priorLearnings);
  console.log(`  Streaks detected: ${streaks.length}`);

  // ── Print streaks ──
  console.log('\n' + '═'.repeat(120));
  console.log('  CC QA — FAILURE STREAKS (1-hour granularity)');
  console.log('═'.repeat(120));

  const criticalStreaks = streaks.filter((s) => s.severity === 'CRITICAL');
  const warningStreaks = streaks.filter((s) => s.severity === 'WARNING');
  const chronicStreaks = streaks.filter((s) => s.severity === 'CHRONIC');

  for (const streak of streaks) {
    const icon = streak.severity === 'CRITICAL' ? '🔴' : streak.severity === 'CHRONIC' ? '🟠' : '🟡';
    const fp = streak.fingerprint;

    console.log(`\n  ${icon} ${streak.severity} — ${streak.startWindow} → ${streak.endWindow} (${streak.durationHours}h)`);
    console.log(`    Orders: ${streak.totalOrders} | Failures: ${streak.totalFailures} | Fail rate: ${(streak.failRate * 100).toFixed(0)}% | Peak: ${(streak.peakFailRate * 100).toFixed(0)}% at ${streak.peakWindow}`);
    console.log(`    Root cause: ${fp.primaryDimension}=${fp.primaryValue} (${(fp.contribution * 100).toFixed(0)}% of failures, pattern: ${fp.failPattern})`);
    if (streak.priorOccurrences > 0) {
      console.log(`    Prior occurrences: ${streak.priorOccurrences} (${streak.priorOccurrences >= 5 ? 'CHRONIC — this keeps happening' : 'recurring'})`);
    }

    // Show hourly detail for this streak
    const streakWindows = windows.filter((w) => w.windowKey >= streak.startWindow && w.windowKey <= streak.endWindow);
    for (const w of streakWindows) {
      const bar = '█'.repeat(Math.round(w.failRate * 20));
      const payDetail = Object.entries(w.byPaySource)
        .filter(([, v]) => v.failed > 0)
        .map(([k, v]) => `${k}:${v.failed}/${v.total}`)
        .join(' ');
      console.log(`      ${w.windowKey} | ${w.totalOrders} orders | fail ${(w.failRate * 100).toFixed(0).padStart(3)}% ${bar.padEnd(10)} | ${payDetail}`);
    }
  }

  // ── Update learnings ──
  const updatedLearnings = updateLearnings(streaks, windows, priorLearnings);
  saveLearnings(updatedLearnings);
  console.log(`\n  Learnings updated: ${updatedLearnings.length} (${updatedLearnings.length - priorLearnings.length} new)`);

  // ── Export findings for training ──
  const findings = exportFindings(streaks, updatedLearnings);
  saveFindings(findings);
  console.log(`  Training findings exported: ${findings.length}`);

  // ── Print learnings summary ──
  const confirmedLearnings = updatedLearnings.filter((l) => l.type === 'pattern' && l.confirmations >= 2);
  if (confirmedLearnings.length > 0) {
    console.log('\n' + '═'.repeat(120));
    console.log('  LEARNED PATTERNS (confirmed 2+ times)');
    console.log('═'.repeat(120));
    for (const l of confirmedLearnings.sort((a, b) => b.confirmations - a.confirmations)) {
      const exportTag = l.exportToTraining ? ' → EXPORTED TO TRAINING' : '';
      console.log(`\n  ${l.pattern.dimension}=${l.pattern.value}`);
      console.log(`    Baseline fail rate: ${(l.pattern.baseline * 100).toFixed(1)}% | Confirmed: ${l.confirmations}x | Last: ${l.lastSeen.slice(0, 10)}${exportTag}`);
      if (l.pattern.hourlyProfile) {
        const profile = l.pattern.hourlyProfile;
        const peakHour = profile.indexOf(Math.max(...profile));
        const quietHour = profile.indexOf(Math.min(...profile.filter((v) => v > 0)));
        console.log(`    Peak failure hour: ${peakHour}:00 UTC (${(profile[peakHour] * 100).toFixed(0)}%) | Quietest: ${quietHour}:00 UTC (${(profile[quietHour] * 100).toFixed(0)}%)`);
      }
    }
  }

  // ── Summary ──
  console.log('\n' + '═'.repeat(120));
  console.log(`  SUMMARY`);
  console.log(`  Total events: ${allEvents.length} | Abandoned: ${totalAbandons} (${(totalAbandons / allEvents.length * 100).toFixed(0)}%) | Active: ${totalActive}`);
  console.log(`  Total streaks: ${streaks.length} | Critical: ${criticalStreaks.length} | Warning: ${warningStreaks.length} | Chronic: ${chronicStreaks.length}`);
  console.log(`  Total real payment failures in streaks: ${streaks.reduce((s, st) => s + st.totalFailures, 0)}`);
  console.log(`  Learned patterns: ${updatedLearnings.filter((l) => l.type === 'pattern').length} | Baselines: ${updatedLearnings.filter((l) => l.type === 'baseline').length}`);
  console.log(`  Findings for training: ${findings.length}`);
  console.log(`  Store: scripts/cc-qa/store/`);
  console.log('═'.repeat(120) + '\n');

  await db.$disconnect();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
