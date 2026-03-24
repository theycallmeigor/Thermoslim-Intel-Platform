/**
 * CC QA Simulator — finds optimal config + processing path
 *
 * Tests combinations of:
 *   - Config params (thresholds, min orders, streak length)
 *   - Processing strategies (chronological, rolling window, batch sizes)
 *   - Learning rates (EMA alpha)
 *   - Enrichment layer ordering
 *
 * Scores each combo on:
 *   - Signal quality: real failures captured vs noise generated
 *   - Learning speed: how fast patterns stabilize
 *   - Training yield: useful findings per processing cycle
 *   - Efficiency: compute cost (windows processed per finding)
 *
 * Usage:
 *   npx tsx scripts/cc-qa/simulate.ts
 *   npx tsx scripts/cc-qa/simulate.ts --top=10     # show top 10 configs
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

import {
  buildHourlyWindows, detectStreaks, updateLearnings, exportFindings,
} from './engine';
import type { CCEvent, HourlyWindow, FailureStreak, QALearning, QAConfig, TrainingFinding } from './types';

const STORE_DIR = path.resolve(__dirname, 'store');

// ═══════════════════════════════════════════════════════════
//  CONFIG SPACE — all combinations to test
// ═══════════════════════════════════════════════════════════

interface SimConfig extends QAConfig {
  /** EMA alpha for baseline updates */
  emaAlpha: number;
  /** Processing strategy */
  strategy: 'full-backlog' | 'rolling-week' | 'rolling-month' | 'incremental-day';
  /** Min confirmations before export */
  exportAfter: number;
}

// Parameter grid — total combos = product of all array lengths
const PARAM_GRID = {
  minOrdersPerHour: [1, 2, 3],
  streakStartThreshold: [0.15, 0.25, 0.40, 0.50],
  streakEndThreshold: [0.10, 0.15, 0.20],
  minStreakHours: [1, 2, 3],
  emaAlpha: [0.1, 0.3, 0.5],
  strategy: ['full-backlog', 'rolling-week', 'rolling-month', 'incremental-day'] as const,
  exportAfter: [1, 3, 5],
};

function generateConfigs(): SimConfig[] {
  const configs: SimConfig[] = [];

  for (const minOrd of PARAM_GRID.minOrdersPerHour) {
    for (const startT of PARAM_GRID.streakStartThreshold) {
      for (const endT of PARAM_GRID.streakEndThreshold) {
        // End threshold must be less than start threshold
        if (endT >= startT) continue;

        for (const minH of PARAM_GRID.minStreakHours) {
          for (const alpha of PARAM_GRID.emaAlpha) {
            for (const strat of PARAM_GRID.strategy) {
              for (const exportN of PARAM_GRID.exportAfter) {
                configs.push({
                  minOrdersPerHour: minOrd,
                  streakStartThreshold: startT,
                  streakEndThreshold: endT,
                  minStreakHours: minH,
                  baselineHours: 168,
                  chronicThreshold: 5,
                  sources: ['database'],
                  emaAlpha: alpha,
                  strategy: strat,
                  exportAfter: exportN,
                });
              }
            }
          }
        }
      }
    }
  }

  return configs;
}

// ═══════════════════════════════════════════════════════════
//  SCORING — evaluate each config's output quality
// ═══════════════════════════════════════════════════════════

interface SimResult {
  config: SimConfig;
  /** Total streaks detected */
  totalStreaks: number;
  /** Streaks with 2+ orders (not single-order noise) */
  substantialStreaks: number;
  /** Total failures captured in streaks */
  capturedFailures: number;
  /** Total real failures in dataset */
  totalRealFailures: number;
  /** Coverage: what % of real failures appear in detected streaks */
  coverage: number;
  /** Precision: streaks with 2+ failures / total streaks */
  precision: number;
  /** Unique root causes identified */
  uniqueRootCauses: number;
  /** Findings exported for training */
  trainFindings: number;
  /** Learned patterns (confirmed) */
  confirmedPatterns: number;
  /** Learning speed: avg confirmations per pattern */
  avgConfirmations: number;
  /** Efficiency: findings per 1000 windows processed */
  findingsPerKWindows: number;
  /** Processing rounds needed */
  processingRounds: number;
  /** Windows processed total */
  windowsProcessed: number;
  /** COMPOSITE SCORE (0-100) */
  score: number;
}

function computeScore(r: SimResult): number {
  // Weighted composite:
  //   Coverage (30%) — catch real failures
  //   Precision (25%) — don't cry wolf
  //   Root cause diversity (15%) — find different problems, not the same one
  //   Training yield (15%) — produce useful training data
  //   Efficiency (15%) — don't waste compute

  const coverageScore = Math.min(r.coverage * 100, 100);
  const precisionScore = r.precision * 100;

  // Root cause diversity: more unique causes is better, up to a point
  const diversityScore = Math.min(r.uniqueRootCauses * 25, 100);

  // Training yield: normalize to 0-100 (20 findings = 100%)
  const yieldScore = Math.min((r.trainFindings / 20) * 100, 100);

  // Efficiency: findings per 1000 windows, normalize (5 = 100%)
  const effScore = Math.min((r.findingsPerKWindows / 5) * 100, 100);

  return (
    coverageScore * 0.30 +
    precisionScore * 0.25 +
    diversityScore * 0.15 +
    yieldScore * 0.15 +
    effScore * 0.15
  );
}

// ═══════════════════════════════════════════════════════════
//  PROCESSING STRATEGIES
// ═══════════════════════════════════════════════════════════

function runStrategy(
  config: SimConfig,
  allWindows: HourlyWindow[],
  totalRealFailures: number,
): SimResult {
  let learnings: QALearning[] = [];
  let allStreaks: FailureStreak[] = [];
  let windowsProcessed = 0;
  let rounds = 0;

  switch (config.strategy) {
    case 'full-backlog': {
      // Single pass over all data
      const streaks = detectStreaks(allWindows, config, learnings);
      learnings = updateLearningsWithAlpha(streaks, allWindows, learnings, config.emaAlpha, config.exportAfter);
      allStreaks = streaks;
      windowsProcessed = allWindows.length;
      rounds = 1;
      break;
    }

    case 'rolling-week': {
      // Process in 7-day rolling windows, each overlapping by 1 day
      const windowDays = 7;
      const stepDays = 6;
      const msPerDay = 24 * 60 * 60 * 1000;

      if (allWindows.length === 0) break;
      const startDate = allWindows[0].windowStart.getTime();
      const endDate = allWindows[allWindows.length - 1].windowStart.getTime();

      for (let cursor = startDate; cursor < endDate; cursor += stepDays * msPerDay) {
        const windowEnd = cursor + windowDays * msPerDay;
        const chunk = allWindows.filter((w) =>
          w.windowStart.getTime() >= cursor && w.windowStart.getTime() < windowEnd,
        );
        if (chunk.length === 0) continue;

        const streaks = detectStreaks(chunk, config, learnings);
        learnings = updateLearningsWithAlpha(streaks, chunk, learnings, config.emaAlpha, config.exportAfter);
        allStreaks.push(...streaks);
        windowsProcessed += chunk.length;
        rounds++;
      }
      // Deduplicate streaks that span overlapping windows
      allStreaks = deduplicateStreaks(allStreaks);
      break;
    }

    case 'rolling-month': {
      // Process in 30-day rolling windows
      const windowDays = 30;
      const stepDays = 25;
      const msPerDay = 24 * 60 * 60 * 1000;

      if (allWindows.length === 0) break;
      const startDate = allWindows[0].windowStart.getTime();
      const endDate = allWindows[allWindows.length - 1].windowStart.getTime();

      for (let cursor = startDate; cursor < endDate; cursor += stepDays * msPerDay) {
        const windowEnd = cursor + windowDays * msPerDay;
        const chunk = allWindows.filter((w) =>
          w.windowStart.getTime() >= cursor && w.windowStart.getTime() < windowEnd,
        );
        if (chunk.length === 0) continue;

        const streaks = detectStreaks(chunk, config, learnings);
        learnings = updateLearningsWithAlpha(streaks, chunk, learnings, config.emaAlpha, config.exportAfter);
        allStreaks.push(...streaks);
        windowsProcessed += chunk.length;
        rounds++;
      }
      allStreaks = deduplicateStreaks(allStreaks);
      break;
    }

    case 'incremental-day': {
      // Process day by day, accumulating learnings
      const msPerDay = 24 * 60 * 60 * 1000;

      if (allWindows.length === 0) break;
      const startDate = allWindows[0].windowStart.getTime();
      const endDate = allWindows[allWindows.length - 1].windowStart.getTime();

      for (let cursor = startDate; cursor <= endDate; cursor += msPerDay) {
        const dayEnd = cursor + msPerDay;
        const dayWindows = allWindows.filter((w) =>
          w.windowStart.getTime() >= cursor && w.windowStart.getTime() < dayEnd,
        );
        if (dayWindows.length === 0) continue;

        const streaks = detectStreaks(dayWindows, config, learnings);
        learnings = updateLearningsWithAlpha(streaks, dayWindows, learnings, config.emaAlpha, config.exportAfter);
        allStreaks.push(...streaks);
        windowsProcessed += dayWindows.length;
        rounds++;
      }
      allStreaks = deduplicateStreaks(allStreaks);
      break;
    }
  }

  // Compute findings
  const findings = exportFindings(allStreaks, learnings);

  // Score
  const capturedFailures = allStreaks.reduce((s, st) => s + st.totalFailures, 0);
  const substantialStreaks = allStreaks.filter((s) => s.totalFailures >= 2).length;
  const uniqueRootCauses = new Set(
    allStreaks.map((s) => `${s.fingerprint.primaryDimension}:${s.fingerprint.primaryValue}`),
  ).size;
  const confirmedPatterns = learnings.filter((l) => l.type === 'pattern' && l.confirmations >= 2).length;
  const avgConfirmations = confirmedPatterns > 0
    ? learnings.filter((l) => l.type === 'pattern' && l.confirmations >= 2)
        .reduce((s, l) => s + l.confirmations, 0) / confirmedPatterns
    : 0;

  const result: SimResult = {
    config,
    totalStreaks: allStreaks.length,
    substantialStreaks,
    capturedFailures,
    totalRealFailures,
    coverage: totalRealFailures > 0 ? capturedFailures / totalRealFailures : 0,
    precision: allStreaks.length > 0 ? substantialStreaks / allStreaks.length : 0,
    uniqueRootCauses,
    trainFindings: findings.length,
    confirmedPatterns,
    avgConfirmations,
    findingsPerKWindows: windowsProcessed > 0 ? (findings.length / windowsProcessed) * 1000 : 0,
    processingRounds: rounds,
    windowsProcessed,
    score: 0,
  };

  result.score = computeScore(result);
  return result;
}

/** updateLearnings variant with configurable alpha and export threshold */
function updateLearningsWithAlpha(
  streaks: FailureStreak[],
  windows: HourlyWindow[],
  existing: QALearning[],
  alpha: number,
  exportAfter: number,
): QALearning[] {
  const learnings = [...existing];
  const now = new Date().toISOString();

  for (const streak of streaks) {
    const fp = streak.fingerprint;
    const matchIdx = learnings.findIndex((l) =>
      l.pattern.dimension === fp.primaryDimension &&
      l.pattern.value === fp.primaryValue &&
      l.pattern.metric === 'failRate',
    );

    if (matchIdx >= 0) {
      const l = learnings[matchIdx];
      l.confirmations++;
      l.lastSeen = now;
      l.pattern.baseline = l.pattern.baseline * (1 - alpha) + streak.failRate * alpha;
      if (l.confirmations >= exportAfter) l.exportToTraining = true;
    } else {
      learnings.push({
        id: `learn-${fp.primaryDimension}-${fp.primaryValue.slice(0, 8)}-${Date.now()}`,
        discoveredAt: now,
        type: 'pattern',
        description: `${fp.primaryDimension}=${fp.primaryValue}: ${(streak.failRate * 100).toFixed(0)}% fail rate over ${streak.durationHours}h`,
        pattern: {
          dimension: fp.primaryDimension,
          value: fp.primaryValue,
          metric: 'failRate',
          baseline: streak.failRate,
          alertThreshold: streak.failRate * 0.8,
        },
        confirmations: 1,
        lastSeen: now,
        exportToTraining: false,
      });
    }
  }

  return learnings;
}

/** Deduplicate streaks with same start window */
function deduplicateStreaks(streaks: FailureStreak[]): FailureStreak[] {
  const seen = new Map<string, FailureStreak>();
  for (const s of streaks) {
    const key = `${s.startWindow}-${s.endWindow}`;
    if (!seen.has(key) || s.totalFailures > seen.get(key)!.totalFailures) {
      seen.set(key, s);
    }
  }
  return [...seen.values()];
}

// ═══════════════════════════════════════════════════════════
//  MAIN — run all simulations
// ═══════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const topN = parseInt(args.find((a) => a.startsWith('--top='))?.split('=')[1] || '20');

  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  // Pull all CC events
  const to = new Date();
  const from = new Date('2025-01-01');

  const baseOrders = await db.order.findMany({
    where: {
      source: 'CHECKOUTCHAMP',
      createdAt: { gte: from, lte: to },
    },
    select: {
      id: true,
      createdAt: true,
      orderTotal: true,
      status: true,
      paySource: true,
      funnelReferenceId: true,
      campaignName: true,
      campaignId: true,
      items: { select: { name: true }, take: 1 },
    },
    orderBy: { createdAt: 'asc' },
  });

  const events: CCEvent[] = baseOrders.map((o: any) => {
    const paySource = o.paySource || null;
    const status = o.status || 'PARTIAL';
    const isAbandon = (!paySource || paySource === 'unknown') && status === 'PARTIAL';
    return {
      timestamp: o.createdAt,
      orderId: o.id,
      status,
      paySource,
      funnelId: o.funnelReferenceId || null,
      campaignName: o.campaignName || o.campaignId || null,
      orderTotal: o.orderTotal || 0,
      product: o.items[0]?.name || null,
      isAbandon,
    };
  });

  await db.$disconnect();

  const activeEvents = events.filter((e) => !e.isAbandon);
  const totalRealFailures = activeEvents.filter((e) =>
    e.status === 'PARTIAL' || e.status === 'DECLINED',
  ).length;

  // Build windows once (all strategies use the same base windows)
  const allWindows = buildHourlyWindows(events);

  console.log('\n' + '═'.repeat(130));
  console.log('  CC QA SIMULATOR — Finding Optimal Config + Processing Path');
  console.log('═'.repeat(130));
  console.log(`  Events: ${events.length} total | ${activeEvents.length} active | ${events.length - activeEvents.length} abandoned`);
  console.log(`  Real failures: ${totalRealFailures} | Windows: ${allWindows.length}`);

  // Generate all config combinations
  const configs = generateConfigs();
  console.log(`  Config combinations: ${configs.length}`);
  console.log(`  Running simulations...\n`);

  const startTime = Date.now();
  const results: SimResult[] = [];

  for (let i = 0; i < configs.length; i++) {
    const result = runStrategy(configs[i], allWindows, totalRealFailures);
    results.push(result);

    // Progress
    if ((i + 1) % 500 === 0 || i === configs.length - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stdout.write(`  [${i + 1}/${configs.length}] ${elapsed}s elapsed\r`);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  Completed ${configs.length} simulations in ${totalTime}s\n`);

  // Sort by score
  results.sort((a, b) => b.score - a.score);

  // ── Top configs ──
  console.log('═'.repeat(130));
  console.log(`  TOP ${topN} CONFIGURATIONS`);
  console.log('═'.repeat(130));
  console.log(
    '  ' +
    'Rank'.padEnd(5) +
    'Score'.padEnd(7) +
    'Strategy'.padEnd(18) +
    'MinOrd'.padEnd(7) +
    'Start%'.padEnd(7) +
    'End%'.padEnd(6) +
    'MinH'.padEnd(5) +
    'Alpha'.padEnd(6) +
    'ExpN'.padEnd(5) +
    'Streaks'.padEnd(8) +
    'Subst'.padEnd(6) +
    'Fails'.padEnd(7) +
    'Cover'.padEnd(7) +
    'Prec'.padEnd(6) +
    'Roots'.padEnd(6) +
    'Train'.padEnd(6) +
    'F/kW'.padEnd(6) +
    'Rounds'.padEnd(7),
  );
  console.log('  ' + '─'.repeat(128));

  for (let i = 0; i < Math.min(topN, results.length); i++) {
    const r = results[i];
    const c = r.config;
    console.log(
      '  ' +
      `#${i + 1}`.padEnd(5) +
      r.score.toFixed(1).padEnd(7) +
      c.strategy.padEnd(18) +
      String(c.minOrdersPerHour).padEnd(7) +
      `${(c.streakStartThreshold * 100).toFixed(0)}%`.padEnd(7) +
      `${(c.streakEndThreshold * 100).toFixed(0)}%`.padEnd(6) +
      String(c.minStreakHours).padEnd(5) +
      c.emaAlpha.toFixed(1).padEnd(6) +
      String(c.exportAfter).padEnd(5) +
      String(r.totalStreaks).padEnd(8) +
      String(r.substantialStreaks).padEnd(6) +
      String(r.capturedFailures).padEnd(7) +
      `${(r.coverage * 100).toFixed(0)}%`.padEnd(7) +
      `${(r.precision * 100).toFixed(0)}%`.padEnd(6) +
      String(r.uniqueRootCauses).padEnd(6) +
      String(r.trainFindings).padEnd(6) +
      r.findingsPerKWindows.toFixed(1).padEnd(6) +
      String(r.processingRounds).padEnd(7),
    );
  }

  // ── Analysis: best by each dimension ──
  console.log('\n' + '═'.repeat(130));
  console.log('  BEST BY DIMENSION');
  console.log('═'.repeat(130));

  const bestCoverage = [...results].sort((a, b) => b.coverage - a.coverage)[0];
  const bestPrecision = [...results].filter((r) => r.totalStreaks > 0).sort((a, b) => b.precision - a.precision)[0];
  const bestEfficiency = [...results].filter((r) => r.trainFindings > 0).sort((a, b) => b.findingsPerKWindows - a.findingsPerKWindows)[0];
  const bestTraining = [...results].sort((a, b) => b.trainFindings - a.trainFindings)[0];

  const formatBest = (label: string, r: SimResult) => {
    const c = r.config;
    console.log(`\n  ${label}: score=${r.score.toFixed(1)}`);
    console.log(`    ${c.strategy} | minOrd=${c.minOrdersPerHour} startT=${(c.streakStartThreshold*100).toFixed(0)}% endT=${(c.streakEndThreshold*100).toFixed(0)}% minH=${c.minStreakHours} alpha=${c.emaAlpha} export=${c.exportAfter}`);
    console.log(`    Streaks=${r.totalStreaks} Substantial=${r.substantialStreaks} Fails=${r.capturedFailures}/${r.totalRealFailures} Coverage=${(r.coverage*100).toFixed(0)}% Precision=${(r.precision*100).toFixed(0)}% Training=${r.trainFindings} F/kW=${r.findingsPerKWindows.toFixed(1)}`);
  };

  formatBest('BEST COVERAGE (catch every real failure)', bestCoverage);
  formatBest('BEST PRECISION (no false alarms)', bestPrecision);
  formatBest('BEST EFFICIENCY (findings per compute)', bestEfficiency);
  formatBest('BEST TRAINING YIELD (most training data)', bestTraining);

  // ── Strategy comparison ──
  console.log('\n' + '═'.repeat(130));
  console.log('  STRATEGY COMPARISON (avg scores)');
  console.log('═'.repeat(130));

  for (const strat of PARAM_GRID.strategy) {
    const stratResults = results.filter((r) => r.config.strategy === strat);
    const avgScore = stratResults.reduce((s, r) => s + r.score, 0) / stratResults.length;
    const maxScore = Math.max(...stratResults.map((r) => r.score));
    const avgCoverage = stratResults.reduce((s, r) => s + r.coverage, 0) / stratResults.length;
    const avgPrecision = stratResults.reduce((s, r) => s + r.precision, 0) / stratResults.length;
    const avgEfficiency = stratResults.reduce((s, r) => s + r.findingsPerKWindows, 0) / stratResults.length;
    console.log(
      `  ${strat.padEnd(18)} | avg=${avgScore.toFixed(1)} max=${maxScore.toFixed(1)} | coverage=${(avgCoverage*100).toFixed(0)}% precision=${(avgPrecision*100).toFixed(0)}% efficiency=${avgEfficiency.toFixed(1)} F/kW`,
    );
  }

  // ── Parameter sensitivity ──
  console.log('\n' + '═'.repeat(130));
  console.log('  PARAMETER SENSITIVITY (which params matter most)');
  console.log('═'.repeat(130));

  const paramSensitivity = (param: string, values: number[]) => {
    const byValue: Record<string, number[]> = {};
    for (const r of results) {
      const val = String((r.config as any)[param]);
      if (!byValue[val]) byValue[val] = [];
      byValue[val].push(r.score);
    }
    const avgs = Object.entries(byValue).map(([v, scores]) => ({
      value: v,
      avg: scores.reduce((s, x) => s + x, 0) / scores.length,
      max: Math.max(...scores),
    }));
    avgs.sort((a, b) => b.avg - a.avg);

    const spread = Math.max(...avgs.map((a) => a.avg)) - Math.min(...avgs.map((a) => a.avg));
    console.log(`\n  ${param} (spread: ${spread.toFixed(1)} pts):`);
    for (const a of avgs) {
      const bar = '█'.repeat(Math.round(a.avg / 2));
      console.log(`    ${String(a.value).padEnd(8)} avg=${a.avg.toFixed(1)} max=${a.max.toFixed(1)} ${bar}`);
    }
  };

  paramSensitivity('minOrdersPerHour', PARAM_GRID.minOrdersPerHour);
  paramSensitivity('streakStartThreshold', PARAM_GRID.streakStartThreshold.map((v) => v * 100));
  paramSensitivity('minStreakHours', PARAM_GRID.minStreakHours);
  paramSensitivity('emaAlpha', PARAM_GRID.emaAlpha);
  paramSensitivity('exportAfter', PARAM_GRID.exportAfter);

  // ── Winner recommendation ──
  const winner = results[0];
  const wc = winner.config;

  console.log('\n' + '═'.repeat(130));
  console.log('  RECOMMENDED OPTIMAL CONFIG');
  console.log('═'.repeat(130));
  console.log(`  Score: ${winner.score.toFixed(1)}/100`);
  console.log(`  Strategy: ${wc.strategy}`);
  console.log(`  minOrdersPerHour: ${wc.minOrdersPerHour}`);
  console.log(`  streakStartThreshold: ${(wc.streakStartThreshold * 100).toFixed(0)}%`);
  console.log(`  streakEndThreshold: ${(wc.streakEndThreshold * 100).toFixed(0)}%`);
  console.log(`  minStreakHours: ${wc.minStreakHours}`);
  console.log(`  emaAlpha: ${wc.emaAlpha}`);
  console.log(`  exportAfter: ${wc.exportAfter} confirmations`);
  console.log(`\n  Results with this config:`);
  console.log(`    Streaks: ${winner.totalStreaks} (${winner.substantialStreaks} substantial)`);
  console.log(`    Failures captured: ${winner.capturedFailures}/${winner.totalRealFailures} (${(winner.coverage * 100).toFixed(0)}% coverage)`);
  console.log(`    Precision: ${(winner.precision * 100).toFixed(0)}%`);
  console.log(`    Root causes: ${winner.uniqueRootCauses}`);
  console.log(`    Training findings: ${winner.trainFindings}`);
  console.log(`    Efficiency: ${winner.findingsPerKWindows.toFixed(1)} findings/kWindows`);
  console.log(`    Processing: ${winner.processingRounds} rounds, ${winner.windowsProcessed} windows`);

  // Save simulation results
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
  const simReport = {
    runAt: new Date().toISOString(),
    totalConfigs: configs.length,
    totalTime: `${totalTime}s`,
    dataset: {
      events: events.length,
      active: activeEvents.length,
      abandoned: events.length - activeEvents.length,
      realFailures: totalRealFailures,
      windows: allWindows.length,
    },
    winner: {
      score: winner.score,
      config: wc,
      results: {
        streaks: winner.totalStreaks,
        substantialStreaks: winner.substantialStreaks,
        capturedFailures: winner.capturedFailures,
        coverage: winner.coverage,
        precision: winner.precision,
        uniqueRootCauses: winner.uniqueRootCauses,
        trainFindings: winner.trainFindings,
        efficiency: winner.findingsPerKWindows,
        rounds: winner.processingRounds,
      },
    },
    top10: results.slice(0, 10).map((r) => ({
      score: r.score,
      strategy: r.config.strategy,
      minOrd: r.config.minOrdersPerHour,
      startT: r.config.streakStartThreshold,
      endT: r.config.streakEndThreshold,
      minH: r.config.minStreakHours,
      alpha: r.config.emaAlpha,
      exportN: r.config.exportAfter,
      streaks: r.totalStreaks,
      coverage: r.coverage,
      precision: r.precision,
      findings: r.trainFindings,
    })),
    strategyAvgScores: Object.fromEntries(
      PARAM_GRID.strategy.map((strat) => {
        const sr = results.filter((r) => r.config.strategy === strat);
        return [strat, sr.reduce((s, r) => s + r.score, 0) / sr.length];
      }),
    ),
  };

  fs.writeFileSync(
    path.join(STORE_DIR, 'simulation-report.json'),
    JSON.stringify(simReport, null, 2) + '\n',
  );
  console.log(`\n  Report saved: scripts/cc-qa/store/simulation-report.json`);
  console.log('═'.repeat(130) + '\n');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
