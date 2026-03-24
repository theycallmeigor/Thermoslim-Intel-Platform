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
import type { DetectorConfig, ExperimentLog, ScoreBreakdown, SnapshotRow, Timeframe, Hint } from './types';
import { DEFAULT_CONFIG, TIMEFRAME_ORDER } from './types';

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
function parseArgs(): { timeframe: Timeframe; maxExperiments: number; maxHours: number } {
  const args = process.argv.slice(2);
  let timeframe: Timeframe = '1d';
  let maxExperiments = 200;
  let maxHours = 8;

  for (const arg of args) {
    if (arg.startsWith('--timeframe=')) {
      const val = arg.split('=')[1] as Timeframe;
      if (TIMEFRAME_ORDER.includes(val)) timeframe = val;
      else { console.error(`Unknown timeframe: ${val}`); process.exit(1); }
    } else if (arg.startsWith('--max-experiments=')) {
      maxExperiments = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--max-hours=')) {
      maxHours = parseFloat(arg.split('=')[1]);
    }
  }
  return { timeframe, maxExperiments, maxHours };
}

// ---------------------------------------------------------------------------
// Load snapshots from DB
// ---------------------------------------------------------------------------
async function loadSnapshots(): Promise<SnapshotRow[]> {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();
  try {
    const rows = await db.dailySnapshot.findMany({
      orderBy: { date: 'asc' },
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
    return rows as SnapshotRow[];
  } finally {
    await db.$disconnect();
  }
}

// ---------------------------------------------------------------------------
// Load hints
// ---------------------------------------------------------------------------
function loadHints(): Hint[] {
  const hintsPath = path.resolve(process.cwd(), 'scripts/autoresearch/hints.json');
  return JSON.parse(fs.readFileSync(hintsPath, 'utf-8')) as Hint[];
}

// ---------------------------------------------------------------------------
// Load initial config for timeframe
// ---------------------------------------------------------------------------
function loadInitialConfig(timeframe: Timeframe): DetectorConfig {
  const cfgPath = path.resolve(process.cwd(), `scripts/autoresearch/timeframes/${timeframe}/config.json`);
  if (fs.existsSync(cfgPath)) {
    return JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) as DetectorConfig;
  }
  return { ...DEFAULT_CONFIG };
}

// ---------------------------------------------------------------------------
// Load program.md
// ---------------------------------------------------------------------------
function loadProgram(): string {
  const programPath = path.resolve(process.cwd(), 'scripts/autoresearch/program.md');
  return fs.readFileSync(programPath, 'utf-8');
}

// ---------------------------------------------------------------------------
// Parse JSON config from Claude response
// ---------------------------------------------------------------------------
function parseConfigFromResponse(text: string): DetectorConfig | null {
  const match = text.match(/```json\s*\n([\s\S]*?)\n\s*```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as DetectorConfig;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Build prompt
// ---------------------------------------------------------------------------
const SYSTEM_MESSAGE = `You are an anomaly detection researcher optimizing detection parameters for an e-commerce platform. You will be given the current best config, its score, and recent experiment history. Propose a new config.json that might improve the score. Respond with:
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

function buildUserMessage(
  bestConfig: DetectorConfig,
  bestScore: ScoreBreakdown,
  recentExperiments: ExperimentLog[],
  program: string,
): string {
  const parts: string[] = [];

  parts.push('## Research Program\n');
  parts.push(program);
  parts.push('\n---\n');

  parts.push('## Current Best Config\n');
  parts.push('```json\n' + JSON.stringify(bestConfig, null, 2) + '\n```\n');

  parts.push('## Current Best Score\n');
  parts.push(`- **Total**: ${bestScore.total.toFixed(2)}`);
  parts.push(`- Catch rate: ${bestScore.catch.toFixed(2)} (${bestScore.details.injectionsCaught}/${bestScore.details.injectionsTotal} injections, ${bestScore.details.hintsCaught}/${bestScore.details.hintsTotal} hints)`);
  parts.push(`- Quiet rate: ${bestScore.quiet.toFixed(2)} (${bestScore.details.falsePositives} false positives on ${bestScore.details.cleanDays} clean days)`);
  parts.push(`- Specificity: ${bestScore.specificity.toFixed(2)} (${bestScore.details.specificityHits}/${bestScore.details.specificityTotal})\n`);

  if (recentExperiments.length > 0) {
    parts.push('## Recent Experiments (last 5)\n');
    for (const exp of recentExperiments) {
      const status = exp.accepted ? 'ACCEPTED' : 'REJECTED';
      parts.push(`### Experiment ${exp.id} [${status}] — score ${exp.score.total.toFixed(2)} (best was ${exp.bestScore.toFixed(2)})`);
      parts.push(`Reasoning: ${exp.reasoning}`);
      parts.push('Config diff from best:');
      const diff = configDiff(bestConfig, exp.config);
      if (diff.length === 0) parts.push('  (no diff — this was the best)');
      else for (const d of diff) parts.push(`  ${d}`);
      parts.push('');
    }
  }

  parts.push('Propose a new config to try. Be creative — explore different regions of the parameter space.');

  return parts.join('\n');
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

// ---------------------------------------------------------------------------
// Claude API call with retry
// ---------------------------------------------------------------------------
async function callClaude(
  client: Anthropic,
  bestConfig: DetectorConfig,
  bestScore: ScoreBreakdown,
  recentExperiments: ExperimentLog[],
  program: string,
): Promise<{ config: DetectorConfig; reasoning: string }> {
  const userMessage = buildUserMessage(bestConfig, bestScore, recentExperiments, program);

  const maxRetries = 3;
  const baseDelay = 2000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: SYSTEM_MESSAGE,
        messages: [{ role: 'user', content: userMessage }],
      });

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      const config = parseConfigFromResponse(text);
      if (!config) {
        throw new Error('Failed to parse JSON config from Claude response');
      }

      // Extract reasoning (everything before the code fence)
      const reasoning = text.split('```json')[0].trim().slice(0, 500);

      return { config, reasoning };
    } catch (err) {
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`  API attempt ${attempt + 1} failed, retrying in ${delay}ms...`, (err as Error).message);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error('Exhausted retries');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function saveExperiment(resultsDir: string, log: ExperimentLog): void {
  const filePath = path.join(resultsDir, `experiment-${log.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(log, null, 2));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const { timeframe, maxExperiments, maxHours } = parseArgs();
  const deadlineMs = Date.now() + maxHours * 60 * 60 * 1000;

  console.log(`\n=== Autoresearch Runner ===`);
  console.log(`Timeframe: ${timeframe}`);
  console.log(`Max experiments: ${maxExperiments}`);
  console.log(`Max hours: ${maxHours}`);
  console.log(`Deadline: ${new Date(deadlineMs).toISOString()}\n`);

  // 1. Load data
  console.log('Loading snapshots from DB...');
  const snapshots = await loadSnapshots();
  console.log(`Loaded ${snapshots.length} snapshot rows`);

  if (snapshots.length === 0) {
    console.error('No snapshots found. Aborting.');
    process.exit(1);
  }

  const hints = loadHints();
  console.log(`Loaded ${hints.length} hints`);

  const program = loadProgram();

  // 2. Generate fixed injection set
  const seed = Date.now();
  const allDates = [...new Set(snapshots.map(s => {
    const d = s.date instanceof Date ? s.date : new Date(s.date);
    return d.toISOString().slice(0, 10);
  }))].sort();
  const channels = [...new Set(snapshots.map(s => s.channel).filter((c): c is string => c !== null))];
  const funnels = [...new Set(snapshots.map(s => s.funnelId).filter((f): f is string => f !== null))];

  const injections = generateInjections(allDates, channels, funnels, seed);
  console.log(`Generated ${injections.length} synthetic injections (seed=${seed})`);

  // 3. Setup results directory
  const resultsDir = path.resolve(process.cwd(), 'scripts/autoresearch/results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

  // 4. Load initial config and run baseline (experiment 0)
  let bestConfig = loadInitialConfig(timeframe);
  console.log('\nRunning baseline (experiment 0)...');
  const baselineStart = Date.now();
  const baselineScore = scoreConfig(snapshots, bestConfig, injections, hints);
  const baselineDuration = Date.now() - baselineStart;
  let bestScore = baselineScore;

  const baselineLog: ExperimentLog = {
    id: 0,
    timestamp: new Date().toISOString(),
    timeframe,
    config: bestConfig,
    score: baselineScore,
    bestScore: baselineScore.total,
    accepted: true,
    reasoning: 'Baseline — initial config',
    durationMs: baselineDuration,
  };
  saveExperiment(resultsDir, baselineLog);
  console.log(`Baseline score: ${baselineScore.total.toFixed(2)} (catch=${baselineScore.catch.toFixed(2)}, quiet=${baselineScore.quiet.toFixed(2)}, spec=${baselineScore.specificity.toFixed(2)})`);

  // 5. Initialize Claude client
  const client = new Anthropic();

  // 6. Main loop
  const experiments: ExperimentLog[] = [baselineLog];
  let accepted = 0;
  let rejected = 0;
  let errors = 0;

  for (let i = 1; i <= maxExperiments; i++) {
    if (Date.now() >= deadlineMs) {
      console.log(`\nTime limit reached after ${i - 1} experiments.`);
      break;
    }

    console.log(`\n--- Experiment ${i} ---`);
    const recentExperiments = experiments.slice(-5);

    try {
      // a. Call Claude for a new config proposal
      const { config: proposedConfig, reasoning } = await callClaude(
        client, bestConfig, bestScore, recentExperiments, program,
      );

      // b. Validate
      const validation = validateConfig(proposedConfig);
      if (!validation.valid) {
        console.log(`  INVALID config: ${validation.errors.join('; ')}`);
        const invalidLog: ExperimentLog = {
          id: i,
          timestamp: new Date().toISOString(),
          timeframe,
          config: proposedConfig,
          score: { total: 0, catch: 0, quiet: 0, specificity: 0, details: { injectionsCaught: 0, injectionsTotal: 0, hintsCaught: 0, hintsTotal: 0, falsePositives: 0, cleanDays: 0, specificityHits: 0, specificityTotal: 0 } },
          bestScore: bestScore.total,
          accepted: false,
          reasoning: `INVALID: ${validation.errors.join('; ')}`,
          durationMs: 0,
        };
        saveExperiment(resultsDir, invalidLog);
        experiments.push(invalidLog);
        rejected++;
        errors++;
        await sleep(2000);
        continue;
      }

      // c. Score the proposed config
      const evalStart = Date.now();
      const score = scoreConfig(snapshots, proposedConfig, injections, hints);
      const evalDuration = Date.now() - evalStart;

      // d. Accept or reject
      const isAccepted = score.total > bestScore.total;
      if (isAccepted) {
        bestConfig = proposedConfig;
        bestScore = score;
        accepted++;
        console.log(`  ACCEPTED — score ${score.total.toFixed(2)} > ${(score.total - (score.total - bestScore.total)).toFixed(2)}`);
      } else {
        rejected++;
        console.log(`  REJECTED — score ${score.total.toFixed(2)} <= best ${bestScore.total.toFixed(2)}`);
      }

      console.log(`  Catch=${score.catch.toFixed(2)} Quiet=${score.quiet.toFixed(2)} Spec=${score.specificity.toFixed(2)}`);
      console.log(`  Reasoning: ${reasoning.slice(0, 120)}`);

      const log: ExperimentLog = {
        id: i,
        timestamp: new Date().toISOString(),
        timeframe,
        config: proposedConfig,
        score,
        bestScore: bestScore.total,
        accepted: isAccepted,
        reasoning,
        durationMs: evalDuration,
      };
      saveExperiment(resultsDir, log);
      experiments.push(log);

    } catch (err) {
      console.error(`  ERROR: ${(err as Error).message}`);
      errors++;
    }

    // Sleep between experiments
    await sleep(2000);
  }

  // 7. Print summary
  console.log('\n=== Summary ===');
  console.log(`Total experiments: ${experiments.length - 1}`);
  console.log(`Accepted: ${accepted}`);
  console.log(`Rejected: ${rejected}`);
  console.log(`Errors: ${errors}`);
  console.log(`Best score: ${bestScore.total.toFixed(2)}`);
  console.log(`  Catch: ${bestScore.catch.toFixed(2)}`);
  console.log(`  Quiet: ${bestScore.quiet.toFixed(2)}`);
  console.log(`  Specificity: ${bestScore.specificity.toFixed(2)}`);
  console.log('\nBest config:');
  console.log(JSON.stringify(bestConfig, null, 2));

  // Save best config back to timeframe directory
  const bestConfigPath = path.resolve(process.cwd(), `scripts/autoresearch/timeframes/${timeframe}/config.json`);
  const bestDir = path.dirname(bestConfigPath);
  if (!fs.existsSync(bestDir)) fs.mkdirSync(bestDir, { recursive: true });
  fs.writeFileSync(bestConfigPath, JSON.stringify(bestConfig, null, 2) + '\n');
  console.log(`\nBest config saved to ${bestConfigPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
