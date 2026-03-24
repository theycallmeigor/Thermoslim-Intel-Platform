/**
 * Multi-Timeframe Cascade Runner
 *
 * Runs autoresearch experiments across ALL timeframe levels:
 *   15min → 1h → 4h → 6h → 1d → 1w
 *
 * Each level gets N experiments. Bottom-up: tune finest grain first,
 * lock it, then tune the next level up using lower-level outputs as context.
 *
 * Usage:
 *   npx tsx scripts/autoresearch/cascade-runner.ts --experiments=10
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

import Anthropic from '@anthropic-ai/sdk';
import { validateConfig } from './validate';
import { scoreConfig } from './evaluate';
import { generateInjections } from './inject';
import { buildSubdailySnapshots, loadOrdersForSubdaily } from './subdaily';
import type { DetectorConfig, ExperimentLog, ScoreBreakdown, SnapshotRow, Timeframe, Hint } from './types';
import { DEFAULT_CONFIG, TIMEFRAME_ORDER } from './types';

// ── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(): { totalExperiments: number } {
  const args = process.argv.slice(2);
  let totalExperiments = 10;
  for (const arg of args) {
    if (arg.startsWith('--experiments=')) totalExperiments = parseInt(arg.split('=')[1], 10);
  }
  return { totalExperiments };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function loadHints(): Hint[] {
  const p = path.resolve(process.cwd(), 'scripts/autoresearch/hints.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function loadProgram(): string {
  const p = path.resolve(process.cwd(), 'scripts/autoresearch/program.md');
  return fs.readFileSync(p, 'utf-8');
}

function loadProductionConfig(): Record<string, DetectorConfig> {
  const p = path.resolve(process.cwd(), 'scripts/autoresearch/production-config.json');
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
  return {};
}

function loadConfig(tf: Timeframe): DetectorConfig {
  // First check timeframe-specific config, then fall back to production config
  const tfPath = path.resolve(process.cwd(), `scripts/autoresearch/timeframes/${tf}/config.json`);
  if (fs.existsSync(tfPath)) return JSON.parse(fs.readFileSync(tfPath, 'utf-8'));
  const prod = loadProductionConfig();
  if (prod[tf]) return prod[tf];
  return { ...DEFAULT_CONFIG };
}

function saveConfig(tf: Timeframe, config: DetectorConfig): void {
  // Save to timeframe-specific config
  const dir = path.resolve(process.cwd(), `scripts/autoresearch/timeframes/${tf}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(config, null, 2) + '\n');
}

function applyToProduction(): void {
  const prodPath = path.resolve(process.cwd(), 'scripts/autoresearch/production-config.json');
  const prod = loadProductionConfig();
  for (const tf of TIMEFRAME_ORDER) {
    const tfPath = path.resolve(process.cwd(), `scripts/autoresearch/timeframes/${tf}/config.json`);
    if (fs.existsSync(tfPath)) {
      prod[tf] = JSON.parse(fs.readFileSync(tfPath, 'utf-8'));
    }
  }
  fs.writeFileSync(prodPath, JSON.stringify(prod, null, 2) + '\n');
  console.log('\n  ⟳ Production config updated with winning configs from all timeframes');
}

function saveExperiment(tf: Timeframe, log: ExperimentLog): void {
  const dir = path.resolve(process.cwd(), `scripts/autoresearch/results/${tf}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `experiment-${log.id}.json`), JSON.stringify(log, null, 2));
}

function parseConfigFromResponse(text: string): DetectorConfig | null {
  const match = text.match(/```json\s*\n([\s\S]*?)\n\s*```/);
  if (!match) return null;
  try { return JSON.parse(match[1]); } catch { return null; }
}

function configDiff(a: DetectorConfig, b: DetectorConfig): string[] {
  const diffs: string[] = [];
  for (const key of Object.keys(a) as (keyof DetectorConfig)[]) {
    const va = JSON.stringify(a[key]);
    const vb = JSON.stringify(b[key]);
    if (va !== vb) diffs.push(`${key}: ${va} → ${vb}`);
  }
  return diffs;
}

// ── Claude API ───────────────────────────────────────────────────────────────

const SYSTEM_MSG = `You are an anomaly detection researcher optimizing detection parameters for an e-commerce platform. You will be given the current best config, its score, and recent experiment history. Propose a new config.json that might improve the score. Respond with:
1. Your reasoning (2-3 sentences)
2. The new config in a \`\`\`json code block

Parameter constraints:
- lookbackDays: 3-60
- minHistory: 3-30, must be < lookbackDays
- warningThreshold: 1.0-4.0
- criticalThreshold: > warningThreshold, max 6.0
- funnelDropWarning: 0.05-0.80
- funnelDropCritical: > funnelDropWarning, max 0.95
- topCampaignsToCheck: 5-50
- metricsToCheck: subset of [totalOrders, totalRevenue, newOrders, recurringOrders, newSubscribers, cancelledSubscribers, refunds, avgOrderValue]
- outlierMethod: none | iqr | trim5
- Boolean flags: useMedianInsteadOfMean, weekdayWeekendSplit, excludeOutliersFromBaseline`;

async function callClaude(
  client: Anthropic,
  tf: Timeframe,
  bestConfig: DetectorConfig,
  bestScore: ScoreBreakdown,
  recentExps: ExperimentLog[],
  program: string,
): Promise<{ config: DetectorConfig; reasoning: string }> {
  const parts: string[] = [];
  parts.push(`## Timeframe: ${tf}\n`);
  parts.push(`## Research Program\n${program}\n---\n`);
  parts.push(`## Current Best Config\n\`\`\`json\n${JSON.stringify(bestConfig, null, 2)}\n\`\`\`\n`);
  parts.push(`## Current Best Score`);
  parts.push(`- **Total**: ${bestScore.total.toFixed(2)}`);
  parts.push(`- Catch: ${bestScore.catch.toFixed(2)} (${bestScore.details.injectionsCaught}/${bestScore.details.injectionsTotal} injections)`);
  parts.push(`- Quiet: ${bestScore.quiet.toFixed(2)} (${bestScore.details.falsePositives} FP on ${bestScore.details.cleanDays} clean days)`);
  parts.push(`- Specificity: ${bestScore.specificity.toFixed(2)}\n`);

  if (recentExps.length > 0) {
    parts.push('## Recent Experiments\n');
    for (const exp of recentExps.slice(-5)) {
      const s = exp.accepted ? 'ACCEPTED' : 'REJECTED';
      parts.push(`Exp ${exp.id} [${s}] score=${exp.score.total.toFixed(2)}: ${exp.reasoning.slice(0, 150)}`);
      const diff = configDiff(bestConfig, exp.config);
      if (diff.length > 0) parts.push(`  Changes: ${diff.join(', ')}`);
      parts.push('');
    }
  }

  parts.push(`\nPropose a new config for the ${tf} timeframe. Be creative.`);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: SYSTEM_MSG,
        messages: [{ role: 'user', content: parts.join('\n') }],
      });
      const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('\n');
      const config = parseConfigFromResponse(text);
      if (!config) throw new Error('Failed to parse config from response');
      const reasoning = text.split('```json')[0].trim().slice(0, 500);
      return { config, reasoning };
    } catch (err) {
      if (attempt < 2) {
        const delay = 2000 * Math.pow(2, attempt);
        console.log(`    API retry in ${delay / 1000}s: ${(err as Error).message}`);
        await sleep(delay);
      } else throw err;
    }
  }
  throw new Error('Exhausted retries');
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { totalExperiments } = parseArgs();

  console.log('\n' + '═'.repeat(70));
  console.log('  MULTI-TIMEFRAME CASCADE RUNNER');
  console.log('═'.repeat(70));
  console.log(`  Experiments per timeframe: ${totalExperiments}`);
  console.log(`  Total experiments: ${totalExperiments * 6}`);
  console.log(`  Timeframe order: ${TIMEFRAME_ORDER.join(' → ')} (sequential — exhaust each before moving on)`);
  console.log('═'.repeat(70));

  // ── Load data ──────────────────────────────────────────────────────────
  console.log('\nLoading data...');

  // Load daily snapshots for 1d and 1w
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

  // Load orders for sub-daily timeframes
  const orders = await loadOrdersForSubdaily();
  console.log(`  Orders for sub-daily: ${orders.length}`);

  // Build sub-daily snapshots
  const subdailyData: Record<string, SnapshotRow[]> = {};
  for (const tf of ['15min', '1h', '4h', '6h'] as Timeframe[]) {
    subdailyData[tf] = buildSubdailySnapshots(orders, tf);
    console.log(`  ${tf} snapshots: ${subdailyData[tf].length} rows`);
  }

  const hints = loadHints();
  const program = loadProgram();
  const client = new Anthropic();

  // ── Run cascade ────────────────────────────────────────────────────────
  const overallResults: Array<{
    timeframe: Timeframe;
    baseline: number;
    best: number;
    experiments: number;
    accepted: number;
  }> = [];

  let globalExpId = 0;

  for (const tf of TIMEFRAME_ORDER) {
    const isDaily = tf === '1d' || tf === '1w';
    const snapshots = isDaily ? dailySnapshots : subdailyData[tf];

    if (!snapshots || snapshots.length === 0) {
      console.log(`\n── Skipping ${tf}: no data ──`);
      overallResults.push({ timeframe: tf, baseline: 0, best: 0, experiments: 0, accepted: 0 });
      continue;
    }

    // Each timeframe gets the full experiment budget — exhaust before moving on
    const numExps = totalExperiments;

    console.log('\n' + '─'.repeat(70));
    console.log(`  TIMEFRAME: ${tf} — ${numExps} experiments (${snapshots.length} data rows)`);
    console.log('─'.repeat(70));

    // Generate injections for this level
    // Injections always work at date granularity (YYYY-MM-DD) even for sub-daily
    const allDates = [...new Set(snapshots.map((s) => {
      const d = s.date instanceof Date ? s.date : new Date(s.date);
      return d.toISOString().slice(0, 10);
    }))].sort();
    const channels = [...new Set(snapshots.map((s) => s.channel).filter((c): c is string => !!c))];
    const funnels = [...new Set(snapshots.map((s) => s.funnelId).filter((f): f is string => !!f))];

    // Randomize seed each run so we test against different anomaly scenarios
    const seed = Date.now() % 10000 + TIMEFRAME_ORDER.indexOf(tf);
    const injections = generateInjections(allDates, channels, funnels, seed);
    console.log(`  Injections: ${injections.length} (seed=${seed})`);

    // Baseline
    let bestConfig = loadConfig(tf);
    const baselineScore = scoreConfig(snapshots, bestConfig, injections, hints);
    let bestScore = baselineScore;

    const baselineLog: ExperimentLog = {
      id: globalExpId++,
      timestamp: new Date().toISOString(),
      timeframe: tf,
      config: bestConfig,
      score: baselineScore,
      bestScore: baselineScore.total,
      accepted: true,
      reasoning: `Baseline for ${tf}`,
      durationMs: 0,
    };
    saveExperiment(tf, baselineLog);

    console.log(`  Baseline: ${baselineScore.total.toFixed(2)} (catch=${baselineScore.catch.toFixed(1)} quiet=${baselineScore.quiet.toFixed(1)} spec=${baselineScore.specificity.toFixed(1)})`);

    // Experiments
    const experiments: ExperimentLog[] = [baselineLog];
    let accepted = 0;

    for (let i = 1; i <= numExps; i++) {
      globalExpId++;
      console.log(`\n  [${tf}] Experiment ${i}/${numExps} (global #${globalExpId})...`);

      try {
        const { config: proposed, reasoning } = await callClaude(
          client, tf, bestConfig, bestScore, experiments, program,
        );

        const validation = validateConfig(proposed);
        if (!validation.valid) {
          console.log(`    INVALID: ${validation.errors.join('; ')}`);
          experiments.push({
            id: globalExpId, timestamp: new Date().toISOString(), timeframe: tf,
            config: proposed, score: { total: 0, catch: 0, quiet: 0, specificity: 0, details: { injectionsCaught: 0, injectionsTotal: 0, hintsCaught: 0, hintsTotal: 0, falsePositives: 0, cleanDays: 0, specificityHits: 0, specificityTotal: 0 } },
            bestScore: bestScore.total, accepted: false,
            reasoning: `INVALID: ${validation.errors.join('; ')}`, durationMs: 0,
          });
          continue;
        }

        const evalStart = Date.now();
        const score = scoreConfig(snapshots, proposed, injections, hints);
        const evalMs = Date.now() - evalStart;

        const isAccepted = score.total > bestScore.total;
        if (isAccepted) {
          bestConfig = proposed;
          bestScore = score;
          accepted++;
        }

        const icon = isAccepted ? '✓ ACCEPTED' : '✗ REJECTED';
        console.log(`    ${icon} — score ${score.total.toFixed(2)} (best=${bestScore.total.toFixed(2)})`);
        console.log(`    catch=${score.catch.toFixed(1)} quiet=${score.quiet.toFixed(1)} spec=${score.specificity.toFixed(1)} (${evalMs}ms)`);
        console.log(`    ${reasoning.slice(0, 120)}`);

        // Show key config changes
        const diff = configDiff(loadConfig(tf), proposed);
        if (diff.length > 0) console.log(`    Changes: ${diff.slice(0, 3).join(', ')}`);

        const log: ExperimentLog = {
          id: globalExpId, timestamp: new Date().toISOString(), timeframe: tf,
          config: proposed, score, bestScore: bestScore.total,
          accepted: isAccepted, reasoning, durationMs: evalMs,
        };
        saveExperiment(tf, log);
        experiments.push(log);

      } catch (err) {
        console.error(`    ERROR: ${(err as Error).message}`);
      }

      await sleep(2000);
    }

    // Save best config for this timeframe
    saveConfig(tf, bestConfig);
    console.log(`\n  ${tf} DONE — baseline ${baselineScore.total.toFixed(2)} → best ${bestScore.total.toFixed(2)} (${accepted}/${numExps} accepted)`);

    overallResults.push({
      timeframe: tf, baseline: baselineScore.total,
      best: bestScore.total, experiments: numExps, accepted,
    });
  }

  // ── Final summary ──────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(70));
  console.log('  CASCADE COMPLETE');
  console.log('═'.repeat(70));
  console.log(`  ${'Timeframe'.padEnd(10)} ${'Baseline'.padStart(10)} ${'Best'.padStart(10)} ${'Δ'.padStart(8)} ${'Accepted'.padStart(10)}`);
  for (const r of overallResults) {
    const delta = r.best - r.baseline;
    const deltaStr = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
    console.log(`  ${r.timeframe.padEnd(10)} ${r.baseline.toFixed(2).padStart(10)} ${r.best.toFixed(2).padStart(10)} ${deltaStr.padStart(8)} ${`${r.accepted}/${r.experiments}`.padStart(10)}`);
  }
  console.log('═'.repeat(70) + '\n');

  // Auto-apply winning configs to production
  applyToProduction();
}

main().catch((err) => {
  console.error('Cascade failed:', err);
  process.exit(1);
});
