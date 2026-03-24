# Autoresearch Anomaly Tuner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an autonomous experiment loop that tunes anomaly detection parameters across multiple timeframes using the Claude API.

**Architecture:** Shared detector module (`detector.ts`) used by both evaluation and production. Runner calls Claude API to propose config changes, evaluator scores against historical data with synthetic injections, accept/reject loop iterates. Multi-timeframe cascade (15min→1h→4h→6h→1d→1w) with each level consuming lower-level outputs.

**Tech Stack:** TypeScript, Prisma/PostgreSQL, @anthropic-ai/sdk, Vitest, tsx

**Spec:** `docs/superpowers/specs/2026-03-21-autoresearch-anomaly-tuner-design.md`

---

## File Structure

```
scripts/autoresearch/
  detector.ts              # Shared detection logic — core algorithm as importable function
  evaluate.ts              # Scorer — runs detector against injected data, returns score 0-100
  inject.ts                # Synthetic anomaly injection into in-memory snapshot copies
  runner.ts                # Main loop — Claude API → propose config → evaluate → accept/reject
  apply.ts                 # Copies winning configs to production-config.json
  types.ts                 # Shared types (Config, Injection, Score, ExperimentLog)
  validate.ts              # Config constraint validation
  program.md               # Human research directions
  hints.json               # User-labeled ground truth
  production-config.json   # Active production config (read by detect-anomalies.ts)
  timeframes/
    15min/config.json
    1h/config.json
    4h/config.json
    6h/config.json
    1d/config.json
    1w/config.json
  results/                 # Experiment logs (created at runtime)
scripts/detect-anomalies.ts  # MODIFY — import from detector.ts, read config from file
tests/autoresearch/
  detector.test.ts
  evaluate.test.ts
  inject.test.ts
  validate.test.ts
```

---

### Task 1: Setup — Install SDK, Create Types, Add Config

**Files:**
- Modify: `package.json` (add @anthropic-ai/sdk)
- Create: `scripts/autoresearch/types.ts`
- Create: `scripts/autoresearch/timeframes/1d/config.json`
- Create: `scripts/autoresearch/hints.json`
- Create: `scripts/autoresearch/program.md`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Anthropic SDK**

```bash
npm install @anthropic-ai/sdk
```

- [ ] **Step 2: Add ANTHROPIC_API_KEY to .env.example**

Add this line to `.env.example`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Step 3: Create vitest.config.ts** (if not exists)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 4: Create types.ts**

```typescript
// scripts/autoresearch/types.ts

export interface DetectorConfig {
  lookbackDays: number;
  minHistory: number;
  warningThreshold: number;
  criticalThreshold: number;
  funnelDropWarning: number;
  funnelDropCritical: number;
  topCampaignsToCheck: number;
  metricsToCheck: string[];
  useMedianInsteadOfMean: boolean;
  weekdayWeekendSplit: boolean;
  excludeOutliersFromBaseline: boolean;
  outlierMethod: 'none' | 'iqr' | 'trim5';
}

export interface TimeframeConfig {
  '15min': DetectorConfig;
  '1h': DetectorConfig;
  '4h': DetectorConfig;
  '6h': DetectorConfig;
  '1d': DetectorConfig;
  '1w': DetectorConfig;
}

export type Timeframe = keyof TimeframeConfig;

export const TIMEFRAME_ORDER: Timeframe[] = ['15min', '1h', '4h', '6h', '1d', '1w'];

export interface SnapshotRow {
  date: Date;
  campaignId: string | null;
  campaignName: string | null;
  productLine: string | null;
  channel: string | null;
  funnelId: string | null;
  totalOrders: number;
  totalRevenue: number;
  newOrders: number;
  recurringOrders: number;
  newSubscribers: number;
  cancelledSubscribers: number;
  refunds: number;
  avgOrderValue: number;
}

export interface DetectedAnomaly {
  type: 'METRIC' | 'FUNNEL' | 'ATTRIBUTION';
  severity: 'WARNING' | 'CRITICAL';
  metric: string;
  dimension: string | null;
  dimensionValue: string | null;
  expected: number;
  actual: number;
  deviation: number;
  explanation: string;
  date: string; // YYYY-MM-DD
}

export interface Injection {
  id: string;
  type: 'zero_out' | 'spike' | 'gradual_decline' | 'channel_shift' | 'funnel_break';
  date: string;        // target date
  metric: string;
  dimension: string | null;
  dimensionValue: string | null;
  multiplier?: number; // for spike
  days?: number;       // for gradual_decline
}

export interface Hint {
  date: string;
  type: 'real' | 'false_alarm';
  metric?: string;
  dimension?: string;
  dimensionValue?: string;
  description: string;
}

export interface ScoreBreakdown {
  total: number;
  catch: number;
  quiet: number;
  specificity: number;
  details: {
    injectionsCaught: number;
    injectionsTotal: number;
    hintsCaught: number;
    hintsTotal: number;
    falsePositives: number;
    cleanDays: number;
    specificityHits: number;
    specificityTotal: number;
  };
}

export interface ExperimentLog {
  id: number;
  timestamp: string;
  timeframe: Timeframe;
  config: DetectorConfig;
  score: ScoreBreakdown;
  bestScore: number;
  accepted: boolean;
  reasoning: string;
  durationMs: number;
}

export const DEFAULT_CONFIG: DetectorConfig = {
  lookbackDays: 14,
  minHistory: 7,
  warningThreshold: 2.0,
  criticalThreshold: 3.0,
  funnelDropWarning: 0.25,
  funnelDropCritical: 0.50,
  topCampaignsToCheck: 20,
  metricsToCheck: ['totalOrders', 'totalRevenue', 'newSubscribers', 'cancelledSubscribers'],
  useMedianInsteadOfMean: false,
  weekdayWeekendSplit: false,
  excludeOutliersFromBaseline: false,
  outlierMethod: 'none',
};
```

- [ ] **Step 5: Create initial config.json for each timeframe**

Write `scripts/autoresearch/timeframes/1d/config.json` with the DEFAULT_CONFIG values. Copy the same to `15min/`, `1h/`, `4h/`, `6h/`, `1w/` directories.

- [ ] **Step 6: Create hints.json with the known checkout2 anomaly**

```json
[
  {
    "date": "2026-03-21",
    "type": "real",
    "metric": "conversionRate",
    "dimension": "funnel",
    "dimensionValue": "checkout2",
    "description": "checkout2 funnel conversion dropped ~30%"
  }
]
```

- [ ] **Step 7: Create program.md**

Write the research direction file as specified in the design doc.

- [ ] **Step 8: Commit**

```bash
git add scripts/autoresearch/ vitest.config.ts .env.example package.json package-lock.json
git commit -m "feat(autoresearch): scaffold types, configs, and research direction"
```

---

### Task 2: Config Validator

**Files:**
- Create: `scripts/autoresearch/validate.ts`
- Create: `tests/autoresearch/validate.test.ts`

- [ ] **Step 1: Write failing tests for validation**

```typescript
// tests/autoresearch/validate.test.ts
import { describe, it, expect } from 'vitest';
import { validateConfig } from '../../scripts/autoresearch/validate';
import { DEFAULT_CONFIG } from '../../scripts/autoresearch/types';

describe('validateConfig', () => {
  it('accepts the default config', () => {
    expect(validateConfig(DEFAULT_CONFIG)).toEqual({ valid: true, errors: [] });
  });

  it('rejects lookbackDays below 3', () => {
    const result = validateConfig({ ...DEFAULT_CONFIG, lookbackDays: 2 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('lookbackDays must be 3–60');
  });

  it('rejects minHistory >= lookbackDays', () => {
    const result = validateConfig({ ...DEFAULT_CONFIG, minHistory: 14, lookbackDays: 14 });
    expect(result.valid).toBe(false);
  });

  it('rejects criticalThreshold <= warningThreshold', () => {
    const result = validateConfig({ ...DEFAULT_CONFIG, warningThreshold: 3.0, criticalThreshold: 2.5 });
    expect(result.valid).toBe(false);
  });

  it('rejects funnelDropCritical <= funnelDropWarning', () => {
    const result = validateConfig({ ...DEFAULT_CONFIG, funnelDropWarning: 0.5, funnelDropCritical: 0.4 });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid outlierMethod', () => {
    const result = validateConfig({ ...DEFAULT_CONFIG, outlierMethod: 'bad' as any });
    expect(result.valid).toBe(false);
  });

  it('rejects empty metricsToCheck', () => {
    const result = validateConfig({ ...DEFAULT_CONFIG, metricsToCheck: [] });
    expect(result.valid).toBe(false);
  });

  it('rejects unknown metric names', () => {
    const result = validateConfig({ ...DEFAULT_CONFIG, metricsToCheck: ['nonexistent'] });
    expect(result.valid).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/autoresearch/validate.test.ts
```

Expected: FAIL — `validate` module not found.

- [ ] **Step 3: Implement validate.ts**

```typescript
// scripts/autoresearch/validate.ts
import type { DetectorConfig } from './types';

const VALID_METRICS = [
  'totalOrders', 'totalRevenue', 'newOrders', 'recurringOrders',
  'newSubscribers', 'cancelledSubscribers', 'refunds', 'avgOrderValue',
];

const VALID_OUTLIER_METHODS = ['none', 'iqr', 'trim5'];

export function validateConfig(config: DetectorConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.lookbackDays < 3 || config.lookbackDays > 60)
    errors.push('lookbackDays must be 3–60');
  if (config.minHistory < 3 || config.minHistory > 30)
    errors.push('minHistory must be 3–30');
  if (config.minHistory >= config.lookbackDays)
    errors.push('minHistory must be < lookbackDays');
  if (config.warningThreshold < 1.0 || config.warningThreshold > 4.0)
    errors.push('warningThreshold must be 1.0–4.0');
  if (config.criticalThreshold <= config.warningThreshold)
    errors.push('criticalThreshold must be > warningThreshold');
  if (config.criticalThreshold > 6.0)
    errors.push('criticalThreshold must be <= 6.0');
  if (config.funnelDropWarning < 0.05 || config.funnelDropWarning > 0.80)
    errors.push('funnelDropWarning must be 0.05–0.80');
  if (config.funnelDropCritical <= config.funnelDropWarning)
    errors.push('funnelDropCritical must be > funnelDropWarning');
  if (config.funnelDropCritical > 0.95)
    errors.push('funnelDropCritical must be <= 0.95');
  if (config.topCampaignsToCheck < 5 || config.topCampaignsToCheck > 50)
    errors.push('topCampaignsToCheck must be 5–50');
  if (!Array.isArray(config.metricsToCheck) || config.metricsToCheck.length === 0)
    errors.push('metricsToCheck must be a non-empty array');
  else {
    for (const m of config.metricsToCheck) {
      if (!VALID_METRICS.includes(m)) errors.push(`Unknown metric: ${m}`);
    }
  }
  if (!VALID_OUTLIER_METHODS.includes(config.outlierMethod))
    errors.push(`outlierMethod must be one of: ${VALID_OUTLIER_METHODS.join(', ')}`);

  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/autoresearch/validate.test.ts
```

Expected: All 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/autoresearch/validate.ts tests/autoresearch/validate.test.ts
git commit -m "feat(autoresearch): config validator with constraint enforcement"
```

---

### Task 3: Shared Detector Module

Extract the core detection algorithm from `scripts/detect-anomalies.ts` into `scripts/autoresearch/detector.ts` as a pure function that accepts config + snapshot rows and returns detected anomalies.

**Files:**
- Create: `scripts/autoresearch/detector.ts`
- Create: `tests/autoresearch/detector.test.ts`
- Modify: `scripts/detect-anomalies.ts` (import from detector.ts)

- [ ] **Step 1: Write failing tests for the detector**

```typescript
// tests/autoresearch/detector.test.ts
import { describe, it, expect } from 'vitest';
import { runDetection } from '../../scripts/autoresearch/detector';
import { DEFAULT_CONFIG } from '../../scripts/autoresearch/types';
import type { SnapshotRow } from '../../scripts/autoresearch/types';

function makeDay(dateStr: string, overrides: Partial<SnapshotRow> = {}): SnapshotRow {
  return {
    date: new Date(dateStr + 'T00:00:00Z'),
    campaignId: null, campaignName: null, productLine: null,
    channel: null, funnelId: null,
    totalOrders: 10, totalRevenue: 50000, newOrders: 8, recurringOrders: 2,
    newSubscribers: 2, cancelledSubscribers: 0, refunds: 0, avgOrderValue: 5000,
    ...overrides,
  };
}

function generate14Days(baseDate: string): SnapshotRow[] {
  const rows: SnapshotRow[] = [];
  const base = new Date(baseDate + 'T00:00:00Z');
  for (let i = 14; i >= 1; i--) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - i);
    rows.push(makeDay(d.toISOString().slice(0, 10)));
  }
  return rows;
}

describe('runDetection', () => {
  it('returns no anomalies for stable data', () => {
    const today = '2026-03-21';
    const data = [...generate14Days(today), makeDay(today)];
    const result = runDetection(data, today, DEFAULT_CONFIG);
    expect(result.filter(a => a.type === 'METRIC')).toHaveLength(0);
  });

  it('detects a spike as a WARNING or CRITICAL', () => {
    const today = '2026-03-21';
    const data = [...generate14Days(today), makeDay(today, { totalOrders: 100 })];
    const result = runDetection(data, today, DEFAULT_CONFIG);
    const orderAnomalies = result.filter(a => a.metric === 'totalOrders' && a.dimension === null);
    expect(orderAnomalies.length).toBeGreaterThan(0);
    expect(['WARNING', 'CRITICAL']).toContain(orderAnomalies[0].severity);
  });

  it('detects a zero-out as anomalous', () => {
    const today = '2026-03-21';
    const data = [...generate14Days(today), makeDay(today, { totalOrders: 0, totalRevenue: 0 })];
    const result = runDetection(data, today, DEFAULT_CONFIG);
    expect(result.filter(a => a.metric === 'totalOrders').length).toBeGreaterThan(0);
  });

  it('respects configurable warningThreshold', () => {
    const today = '2026-03-21';
    // 25 orders is 2.5x baseline of 10 — should be ~4σ with low variance
    const data = [...generate14Days(today), makeDay(today, { totalOrders: 25 })];

    const looseConfig = { ...DEFAULT_CONFIG, warningThreshold: 3.5 };
    const tightConfig = { ...DEFAULT_CONFIG, warningThreshold: 1.5 };

    const loose = runDetection(data, today, looseConfig);
    const tight = runDetection(data, today, tightConfig);

    // Tight threshold should catch more or equal anomalies
    expect(tight.length).toBeGreaterThanOrEqual(loose.length);
  });

  it('detects funnel breakage', () => {
    const today = '2026-03-21';
    // 14 days: funnelA has 5 orders out of 10 total (50% conversion)
    const history = generate14Days(today).flatMap(row => [
      row,
      makeDay(row.date.toISOString().slice(0, 10), { funnelId: 'funnelA', totalOrders: 5 }),
    ]);
    // Today: funnelA drops to 1 out of 10 (10% — a 80% drop)
    const todayRows = [
      makeDay(today),
      makeDay(today, { funnelId: 'funnelA', totalOrders: 1 }),
    ];
    const result = runDetection([...history, ...todayRows], today, DEFAULT_CONFIG);
    const funnelAnomalies = result.filter(a => a.type === 'FUNNEL');
    expect(funnelAnomalies.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/autoresearch/detector.test.ts
```

- [ ] **Step 3: Implement detector.ts**

Extract the detection logic from `scripts/detect-anomalies.ts` into a pure function:

```typescript
// scripts/autoresearch/detector.ts
import type { DetectorConfig, SnapshotRow, DetectedAnomaly } from './types';

// ── Stats helpers ──

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function filterOutliers(values: number[], method: 'none' | 'iqr' | 'trim5'): number[] {
  if (method === 'none' || values.length < 5) return values;
  if (method === 'trim5') {
    const n = Math.max(1, Math.round(values.length * 0.05));
    const sorted = [...values].sort((a, b) => a - b);
    return sorted.slice(n, sorted.length - n);
  }
  // IQR
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  return values.filter(v => v >= q1 - 1.5 * iqr && v <= q3 + 1.5 * iqr);
}

// ── Core detection ──

type MetricName = string;
type FilterFn = (s: SnapshotRow) => boolean;

function buildDailyAggregates(
  snapshots: SnapshotRow[],
  filter: FilterFn,
  metrics: MetricName[],
): Map<string, Record<string, number>> {
  const dailyMap = new Map<string, Record<string, number>>();
  for (const s of snapshots) {
    if (!filter(s)) continue;
    const dk = s.date.toISOString().split('T')[0];
    let entry = dailyMap.get(dk);
    if (!entry) {
      entry = Object.fromEntries(metrics.map(m => [m, 0]));
      dailyMap.set(dk, entry);
    }
    for (const m of metrics) {
      entry[m] += (s as any)[m] ?? 0;
    }
  }
  return dailyMap;
}

function detectMetricAnomalies(
  dailyMap: Map<string, Record<string, number>>,
  todayKey: string,
  config: DetectorConfig,
  dimension: string | null,
  dimensionValue: string | null,
): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];
  const todayData = dailyMap.get(todayKey);
  if (!todayData) return anomalies;

  const historicalDays: Record<string, number[]> = {};
  for (const m of config.metricsToCheck) historicalDays[m] = [];

  for (const [dateKey, values] of dailyMap.entries()) {
    if (dateKey === todayKey) continue;
    // If weekday/weekend split, only use same type
    if (config.weekdayWeekendSplit) {
      const todayDow = new Date(todayKey + 'T12:00:00Z').getUTCDay();
      const histDow = new Date(dateKey + 'T12:00:00Z').getUTCDay();
      const todayIsWE = todayDow === 0 || todayDow === 6;
      const histIsWE = histDow === 0 || histDow === 6;
      if (todayIsWE !== histIsWE) continue;
    }
    for (const m of config.metricsToCheck) {
      historicalDays[m].push(values[m] ?? 0);
    }
  }

  for (const metric of config.metricsToCheck) {
    let history = historicalDays[metric];
    if (history.length < config.minHistory) continue;

    history = filterOutliers(history, config.outlierMethod);
    if (history.length < 3) continue;

    const avg = config.useMedianInsteadOfMean ? median(history) : mean(history);
    const sd = stddev(history);
    if (sd === 0) continue;

    const actual = todayData[metric] ?? 0;
    const zScore = (actual - avg) / sd;
    const absZ = Math.abs(zScore);

    if (absZ > config.warningThreshold) {
      const severity = absZ > config.criticalThreshold ? 'CRITICAL' : 'WARNING';
      const direction = zScore > 0 ? 'above' : 'below';
      anomalies.push({
        type: 'METRIC',
        severity,
        metric,
        dimension,
        dimensionValue,
        expected: avg,
        actual,
        deviation: zScore,
        explanation: `${metric} is ${absZ.toFixed(1)}sigma ${direction} the rolling average. Today: ${actual}, expected ~${avg.toFixed(1)}.${dimension ? ` Dimension: ${dimension}=${dimensionValue}.` : ''}`,
        date: todayKey,
      });
    }
  }

  return anomalies;
}

/**
 * Pure detection function. Takes snapshot rows + config, returns anomalies.
 * No DB access, no side effects.
 */
export function runDetection(
  snapshots: SnapshotRow[],
  todayKey: string,
  config: DetectorConfig,
): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];

  // ── Layer 1: Metric anomalies ──

  // 1a. Overall
  const overallDaily = buildDailyAggregates(snapshots, () => true, config.metricsToCheck);
  anomalies.push(...detectMetricAnomalies(overallDaily, todayKey, config, null, null));

  // 1b. Per campaign
  const campaignVolume = new Map<string, { name: string | null; volume: number }>();
  for (const s of snapshots) {
    if (!s.campaignId) continue;
    const e = campaignVolume.get(s.campaignId) ?? { name: s.campaignName, volume: 0 };
    e.volume += s.totalOrders;
    campaignVolume.set(s.campaignId, e);
  }
  const topCampaigns = [...campaignVolume.entries()]
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, config.topCampaignsToCheck);
  for (const [cid, { name }] of topCampaigns) {
    const daily = buildDailyAggregates(snapshots, s => s.campaignId === cid, config.metricsToCheck);
    anomalies.push(...detectMetricAnomalies(daily, todayKey, config, 'campaign', name ?? cid));
  }

  // 1c. Per channel
  const channelSet = new Set(snapshots.map(s => s.channel).filter(Boolean) as string[]);
  for (const ch of channelSet) {
    const daily = buildDailyAggregates(snapshots, s => s.channel === ch, config.metricsToCheck);
    anomalies.push(...detectMetricAnomalies(daily, todayKey, config, 'channel', ch));
  }

  // 1d. Per product line
  const plSet = new Set(snapshots.map(s => s.productLine).filter(Boolean) as string[]);
  for (const pl of plSet) {
    const daily = buildDailyAggregates(snapshots, s => s.productLine === pl, config.metricsToCheck);
    anomalies.push(...detectMetricAnomalies(daily, todayKey, config, 'productLine', pl));
  }

  // 1e. Per funnel
  const funnelSet = new Set(snapshots.map(s => s.funnelId).filter(Boolean) as string[]);
  for (const fid of funnelSet) {
    const daily = buildDailyAggregates(snapshots, s => s.funnelId === fid, config.metricsToCheck);
    anomalies.push(...detectMetricAnomalies(daily, todayKey, config, 'funnel', fid));
  }

  // ── Layer 2: Funnel breakage ──
  for (const fid of funnelSet) {
    const funnelDaily = buildDailyAggregates(snapshots, s => s.funnelId === fid, ['totalOrders']);
    const conversionRates: number[] = [];
    let todayRate: number | null = null;

    for (const [dateKey, funnelValues] of funnelDaily.entries()) {
      const overallValues = overallDaily.get(dateKey);
      if (!overallValues || overallValues.totalOrders === 0) continue;
      const rate = funnelValues.totalOrders / overallValues.totalOrders;
      if (dateKey === todayKey) todayRate = rate;
      else conversionRates.push(rate);
    }

    if (todayRate === null || conversionRates.length < config.minHistory) continue;
    const baseline = mean(conversionRates);
    if (baseline === 0) continue;
    const dropPct = (baseline - todayRate) / baseline;

    if (dropPct > config.funnelDropWarning) {
      const severity = dropPct > config.funnelDropCritical ? 'CRITICAL' : 'WARNING';
      anomalies.push({
        type: 'FUNNEL',
        severity,
        metric: 'conversionRate',
        dimension: 'funnel',
        dimensionValue: fid,
        expected: baseline,
        actual: todayRate,
        deviation: -dropPct,
        explanation: `Funnel ${fid} conversion dropped ${(dropPct * 100).toFixed(1)}% vs baseline. Today: ${(todayRate * 100).toFixed(2)}%, expected: ~${(baseline * 100).toFixed(2)}%.`,
        date: todayKey,
      });
    }
  }

  // ── Layer 3: Change attribution ──
  const overallAnomalous = anomalies.filter(
    a => a.type === 'METRIC' && a.dimension === null && (a.metric === 'totalRevenue' || a.metric === 'totalOrders'),
  );

  for (const anomaly of overallAnomalous) {
    const metric = anomaly.metric;
    const totalDeviation = anomaly.actual - anomaly.expected;

    const dimensionTypes: { name: string; extractor: (s: SnapshotRow) => string | null }[] = [
      { name: 'campaign', extractor: s => s.campaignName ?? s.campaignId },
      { name: 'channel', extractor: s => s.channel },
      { name: 'productLine', extractor: s => s.productLine },
      { name: 'funnel', extractor: s => s.funnelId },
    ];

    for (const dimType of dimensionTypes) {
      const dimValues = new Map<string, Map<string, number>>();
      for (const s of snapshots) {
        const dimVal = dimType.extractor(s);
        if (!dimVal) continue;
        if (!dimValues.has(dimVal)) dimValues.set(dimVal, new Map());
        const dateMap = dimValues.get(dimVal)!;
        const dk = s.date.toISOString().split('T')[0];
        dateMap.set(dk, (dateMap.get(dk) ?? 0) + ((s as any)[metric] ?? 0));
      }

      const contributions: { dimValue: string; contribution: number }[] = [];
      for (const [dimVal, dateMap] of dimValues.entries()) {
        const todayVal = dateMap.get(todayKey) ?? 0;
        const histVals: number[] = [];
        for (const [dk, val] of dateMap.entries()) {
          if (dk !== todayKey) histVals.push(val);
        }
        if (histVals.length === 0) continue;
        contributions.push({ dimValue: dimVal, contribution: todayVal - mean(histVals) });
      }

      contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
      if (contributions.length === 0 || totalDeviation === 0) continue;

      const top = contributions[0];
      const topPct = Math.abs(top.contribution / totalDeviation) * 100;
      const direction = totalDeviation > 0 ? 'increased' : 'dropped';

      anomalies.push({
        type: 'ATTRIBUTION',
        severity: anomaly.severity,
        metric,
        dimension: dimType.name,
        dimensionValue: top.dimValue,
        expected: anomaly.expected,
        actual: anomaly.actual,
        deviation: anomaly.deviation,
        explanation: `${metric} ${direction}. Top contributor by ${dimType.name}: ${top.dimValue} (${topPct.toFixed(0)}% of deviation).`,
        date: todayKey,
      });
    }
  }

  return anomalies;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/autoresearch/detector.test.ts
```

Expected: All 5 tests pass.

- [ ] **Step 5: Refactor detect-anomalies.ts to use shared detector**

Modify `scripts/detect-anomalies.ts`:
- Import `runDetection` from `./autoresearch/detector`
- Import `DEFAULT_CONFIG` from `./autoresearch/types`
- Read `scripts/autoresearch/production-config.json` if it exists, falling back to DEFAULT_CONFIG
- Replace the inline detection logic with a call to `runDetection(snapshots, todayKey, config)`
- Keep the DB read/write logic (fetching snapshots, writing Anomaly records, auto-resolving) in detect-anomalies.ts

The file should shrink from ~460 lines to ~100 lines.

- [ ] **Step 6: Verify detect-anomalies.ts still works**

```bash
npx tsx scripts/detect-anomalies.ts
```

Expected: Same output as before (1 funnel warning on checkout2).

- [ ] **Step 7: Commit**

```bash
git add scripts/autoresearch/detector.ts tests/autoresearch/detector.test.ts scripts/detect-anomalies.ts
git commit -m "feat(autoresearch): extract shared detector module from detect-anomalies.ts"
```

---

### Task 4: Synthetic Injection Engine

**Files:**
- Create: `scripts/autoresearch/inject.ts`
- Create: `tests/autoresearch/inject.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/autoresearch/inject.test.ts
import { describe, it, expect } from 'vitest';
import { generateInjections, applyInjections } from '../../scripts/autoresearch/inject';
import type { SnapshotRow, Injection } from '../../scripts/autoresearch/types';

function makeRow(date: string, overrides: Partial<SnapshotRow> = {}): SnapshotRow {
  return {
    date: new Date(date + 'T00:00:00Z'),
    campaignId: null, campaignName: null, productLine: null,
    channel: 'direct', funnelId: null,
    totalOrders: 10, totalRevenue: 50000, newOrders: 8, recurringOrders: 2,
    newSubscribers: 2, cancelledSubscribers: 0, refunds: 0, avgOrderValue: 5000,
    ...overrides,
  };
}

describe('generateInjections', () => {
  it('generates deterministic injections with same seed', () => {
    const dates = ['2026-02-01', '2026-02-15', '2026-03-01'];
    const channels = ['direct', 'cc_onetime'];
    const funnels = ['checkout2'];
    const a = generateInjections(dates, channels, funnels, 42);
    const b = generateInjections(dates, channels, funnels, 42);
    expect(a).toEqual(b);
  });

  it('generates 8-12 injections', () => {
    const dates = Array.from({ length: 30 }, (_, i) => `2026-02-${String(i + 1).padStart(2, '0')}`);
    const result = generateInjections(dates, ['direct'], ['checkout2'], 123);
    expect(result.length).toBeGreaterThanOrEqual(8);
    expect(result.length).toBeLessThanOrEqual(12);
  });
});

describe('applyInjections', () => {
  it('zero_out sets metric to 0', () => {
    const rows = [makeRow('2026-02-10')];
    const injections: Injection[] = [{
      id: 'test-1', type: 'zero_out', date: '2026-02-10',
      metric: 'totalOrders', dimension: null, dimensionValue: null,
    }];
    const result = applyInjections(rows, injections);
    expect(result[0].totalOrders).toBe(0);
  });

  it('spike multiplies metric', () => {
    const rows = [makeRow('2026-02-10')];
    const injections: Injection[] = [{
      id: 'test-2', type: 'spike', date: '2026-02-10',
      metric: 'totalRevenue', dimension: null, dimensionValue: null, multiplier: 5,
    }];
    const result = applyInjections(rows, injections);
    expect(result[0].totalRevenue).toBe(250000);
  });

  it('does not mutate original rows', () => {
    const rows = [makeRow('2026-02-10')];
    const injections: Injection[] = [{
      id: 'test-3', type: 'zero_out', date: '2026-02-10',
      metric: 'totalOrders', dimension: null, dimensionValue: null,
    }];
    applyInjections(rows, injections);
    expect(rows[0].totalOrders).toBe(10); // original unchanged
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/autoresearch/inject.test.ts
```

- [ ] **Step 3: Implement inject.ts**

```typescript
// scripts/autoresearch/inject.ts
import type { SnapshotRow, Injection } from './types';

// Seeded PRNG (LCG) for deterministic injection generation
class SeededRandom {
  private state: number;
  constructor(seed: number) { this.state = seed % 2147483647; if (this.state <= 0) this.state += 2147483646; }
  next(): number { this.state = (this.state * 16807) % 2147483647; return (this.state - 1) / 2147483646; }
  int(min: number, max: number): number { return Math.floor(this.next() * (max - min + 1)) + min; }
  pick<T>(arr: T[]): T { return arr[this.int(0, arr.length - 1)]; }
}

const INJECTION_TYPES: Injection['type'][] = ['zero_out', 'spike', 'gradual_decline', 'channel_shift', 'funnel_break'];

export function generateInjections(
  availableDates: string[],
  channels: string[],
  funnels: string[],
  seed: number,
): Injection[] {
  const rng = new SeededRandom(seed);
  const count = rng.int(8, 12);
  const injections: Injection[] = [];
  const usedDates = new Set<string>();

  for (let i = 0; i < count && i < availableDates.length; i++) {
    // Pick a unique date
    let date: string;
    let tries = 0;
    do { date = rng.pick(availableDates); tries++; } while (usedDates.has(date) && tries < 50);
    if (usedDates.has(date)) continue;
    usedDates.add(date);

    const type = rng.pick(INJECTION_TYPES);
    const metrics = ['totalOrders', 'totalRevenue'];
    const metric = rng.pick(metrics);

    let dimension: string | null = null;
    let dimensionValue: string | null = null;

    if (type === 'channel_shift' && channels.length >= 2) {
      dimension = 'channel';
      dimensionValue = rng.pick(channels);
    } else if (type === 'funnel_break' && funnels.length > 0) {
      dimension = 'funnel';
      dimensionValue = rng.pick(funnels);
    }

    injections.push({
      id: `inj-${i}`,
      type,
      date,
      metric,
      dimension,
      dimensionValue,
      multiplier: type === 'spike' ? rng.int(3, 5) : undefined,
      days: type === 'gradual_decline' ? rng.int(3, 5) : undefined,
    });
  }

  return injections;
}

export function applyInjections(rows: SnapshotRow[], injections: Injection[]): SnapshotRow[] {
  // Deep copy all rows
  const result = rows.map(r => ({ ...r, date: new Date(r.date) }));

  for (const inj of injections) {
    const targetDate = inj.date;

    switch (inj.type) {
      case 'zero_out': {
        for (const row of result) {
          if (row.date.toISOString().slice(0, 10) !== targetDate) continue;
          if (inj.dimension && (row as any)[inj.dimension === 'channel' ? 'channel' : 'funnelId'] !== inj.dimensionValue) continue;
          (row as any)[inj.metric] = 0;
        }
        break;
      }
      case 'spike': {
        for (const row of result) {
          if (row.date.toISOString().slice(0, 10) !== targetDate) continue;
          if (inj.dimension && (row as any)[inj.dimension === 'channel' ? 'channel' : 'funnelId'] !== inj.dimensionValue) continue;
          (row as any)[inj.metric] = Math.round((row as any)[inj.metric] * (inj.multiplier ?? 4));
        }
        break;
      }
      case 'gradual_decline': {
        const days = inj.days ?? 3;
        const baseDate = new Date(targetDate + 'T00:00:00Z');
        for (let d = 0; d < days; d++) {
          const checkDate = new Date(baseDate);
          checkDate.setUTCDate(checkDate.getUTCDate() - d);
          const dk = checkDate.toISOString().slice(0, 10);
          const factor = 1 - 0.05 * (days - d); // 5% per day, worst on target
          for (const row of result) {
            if (row.date.toISOString().slice(0, 10) !== dk) continue;
            (row as any)[inj.metric] = Math.round((row as any)[inj.metric] * factor);
          }
        }
        break;
      }
      case 'channel_shift': {
        // Move 50% of target channel volume to a random other channel
        for (const row of result) {
          if (row.date.toISOString().slice(0, 10) !== targetDate) continue;
          if (row.channel === inj.dimensionValue) {
            const half = Math.round((row as any)[inj.metric] * 0.5);
            (row as any)[inj.metric] -= half;
          }
        }
        break;
      }
      case 'funnel_break': {
        // Drop funnel's orders by 50%
        for (const row of result) {
          if (row.date.toISOString().slice(0, 10) !== targetDate) continue;
          if (row.funnelId === inj.dimensionValue) {
            (row as any)[inj.metric] = Math.round((row as any)[inj.metric] * 0.3);
          }
        }
        break;
      }
    }
  }

  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/autoresearch/inject.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add scripts/autoresearch/inject.ts tests/autoresearch/inject.test.ts
git commit -m "feat(autoresearch): synthetic injection engine with deterministic seeding"
```

---

### Task 5: Evaluator (Scorer)

**Files:**
- Create: `scripts/autoresearch/evaluate.ts`
- Create: `tests/autoresearch/evaluate.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/autoresearch/evaluate.test.ts
import { describe, it, expect } from 'vitest';
import { scoreConfig } from '../../scripts/autoresearch/evaluate';
import { DEFAULT_CONFIG } from '../../scripts/autoresearch/types';
import type { SnapshotRow, Injection, Hint } from '../../scripts/autoresearch/types';

function makeRows(days: number): SnapshotRow[] {
  const rows: SnapshotRow[] = [];
  const base = new Date('2026-03-21T00:00:00Z');
  for (let i = days; i >= 0; i--) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - i);
    rows.push({
      date: d,
      campaignId: null, campaignName: null, productLine: null,
      channel: 'direct', funnelId: null,
      totalOrders: 10, totalRevenue: 50000, newOrders: 8, recurringOrders: 2,
      newSubscribers: 2, cancelledSubscribers: 0, refunds: 0, avgOrderValue: 5000,
    });
  }
  return rows;
}

describe('scoreConfig', () => {
  it('returns high quiet rate for stable data with no injections', () => {
    const rows = makeRows(30);
    const result = scoreConfig(rows, DEFAULT_CONFIG, [], []);
    expect(result.quiet).toBeGreaterThanOrEqual(90);
  });

  it('returns high catch rate when injection is detected', () => {
    const rows = makeRows(30);
    // Inject zero-out on day 25 (well within the evaluation window)
    const targetDate = rows[25].date.toISOString().slice(0, 10);
    const injections: Injection[] = [{
      id: 'i1', type: 'zero_out', date: targetDate,
      metric: 'totalOrders', dimension: null, dimensionValue: null,
    }];
    // scoreConfig applies injections internally — pass unmodified rows
    const result = scoreConfig(rows, DEFAULT_CONFIG, injections, []);
    expect(result.catch).toBeGreaterThan(0);
  });

  it('penalizes false alarms on false_alarm hint days', () => {
    const rows = makeRows(30);
    // Make a day anomalous in the raw data and label it false_alarm
    rows[20].totalOrders = 100;
    const hints: Hint[] = [{
      date: rows[20].date.toISOString().slice(0, 10),
      type: 'false_alarm',
      description: 'expected spike',
    }];
    const looseConfig = { ...DEFAULT_CONFIG, warningThreshold: 1.2 };
    const result = scoreConfig(rows, looseConfig, [], hints);
    expect(result.quiet).toBeLessThan(100);
  });

  it('tight threshold catches more injections than loose', () => {
    const rows = makeRows(30);
    const targetDate = rows[25].date.toISOString().slice(0, 10);
    const injections: Injection[] = [{
      id: 'i1', type: 'zero_out', date: targetDate,
      metric: 'totalOrders', dimension: null, dimensionValue: null,
    }];
    const tight = scoreConfig(rows, { ...DEFAULT_CONFIG, warningThreshold: 1.5 }, injections, []);
    const loose = scoreConfig(rows, { ...DEFAULT_CONFIG, warningThreshold: 3.8 }, injections, []);
    expect(tight.catch).toBeGreaterThanOrEqual(loose.catch);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/autoresearch/evaluate.test.ts
```

- [ ] **Step 3: Implement evaluate.ts**

The evaluator runs detection across ALL days in the dataset (not just one "today"). For each day, it treats that day as "today" and the preceding N days as history. This lets it measure catch rate across all injection days and quiet rate across all clean days.

```typescript
// scripts/autoresearch/evaluate.ts
import { runDetection } from './detector';
import { applyInjections } from './inject';
import type { DetectorConfig, SnapshotRow, Injection, Hint, ScoreBreakdown, DetectedAnomaly } from './types';

export function scoreConfig(
  rawSnapshots: SnapshotRow[],
  config: DetectorConfig,
  injections: Injection[],
  hints: Hint[],
): ScoreBreakdown {
  // 1. Apply injections to a copy of the snapshot data
  const snapshots = applyInjections(rawSnapshots, injections);

  // 2. Get all unique dates sorted
  const allDates = [...new Set(snapshots.map(s => s.date.toISOString().slice(0, 10)))].sort();

  // Build sets for scoring
  const injectionDates = new Set(injections.map(inj => inj.date));
  const realHintDates = new Set(hints.filter(h => h.type === 'real').map(h => h.date));
  const falseAlarmDates = new Set(hints.filter(h => h.type === 'false_alarm').map(h => h.date));
  const shouldFireDates = new Set([...injectionDates, ...realHintDates]);
  const cleanDates = allDates.filter(d => !shouldFireDates.has(d) && !falseAlarmDates.has(d));

  let injectionsCaught = 0;
  let hintsCaught = 0;
  let falsePositives = 0;
  let specificityHits = 0;
  let specificityTotal = 0;

  // 3. Run detection for each testable date (need at least minHistory days before it)
  for (let i = config.lookbackDays; i < allDates.length; i++) {
    const todayKey = allDates[i];
    // Get snapshots within the lookback window + today
    const windowStart = allDates[Math.max(0, i - config.lookbackDays)];
    const windowSnapshots = snapshots.filter(s => {
      const dk = s.date.toISOString().slice(0, 10);
      return dk >= windowStart && dk <= todayKey;
    });

    const detected = runDetection(windowSnapshots, todayKey, config);

    if (injectionDates.has(todayKey)) {
      // Check if any detection fired on this day
      const dayDetections = detected.filter(a => a.date === todayKey);
      if (dayDetections.length > 0) {
        injectionsCaught++;
        // Check specificity — did it identify the right dimension?
        const dayInjections = injections.filter(inj => inj.date === todayKey && inj.dimension);
        for (const inj of dayInjections) {
          specificityTotal++;
          const matched = dayDetections.some(d =>
            d.dimension === inj.dimension && d.dimensionValue === inj.dimensionValue
          );
          if (matched) specificityHits++;
        }
      }
    } else if (realHintDates.has(todayKey)) {
      const dayDetections = detected.filter(a => a.date === todayKey);
      if (dayDetections.length > 0) hintsCaught++;
    } else if (falseAlarmDates.has(todayKey)) {
      // Detection on a false_alarm date = always a false positive
      if (detected.filter(a => a.date === todayKey).length > 0) falsePositives++;
    } else {
      // Clean day — any detection is a false positive
      if (detected.filter(a => a.date === todayKey).length > 0) falsePositives++;
    }
  }

  // 4. Compute scores
  const injectionsTotal = injectionDates.size;
  const hintsTotal = realHintDates.size;
  const catchTotal = injectionsTotal + hintsTotal;
  const catchRate = catchTotal > 0 ? ((injectionsCaught + hintsCaught) / catchTotal) * 100 : 100;

  const cleanDayCount = cleanDates.length + falseAlarmDates.size;
  const quietRate = cleanDayCount > 0 ? Math.max(0, 100 - (falsePositives / cleanDayCount) * 100) : 100;

  const specificityRate = specificityTotal > 0 ? (specificityHits / specificityTotal) * 100 : 100;

  const total = 0.40 * catchRate + 0.40 * quietRate + 0.20 * specificityRate;

  return {
    total,
    catch: catchRate,
    quiet: quietRate,
    specificity: specificityRate,
    details: {
      injectionsCaught, injectionsTotal, hintsCaught, hintsTotal,
      falsePositives, cleanDays: cleanDayCount, specificityHits, specificityTotal,
    },
  };
}
```

Note: `scoreConfig` no longer takes a `todayKey` — it iterates over all testable dates internally.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/autoresearch/evaluate.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add scripts/autoresearch/evaluate.ts tests/autoresearch/evaluate.test.ts
git commit -m "feat(autoresearch): evaluator/scorer with catch+quiet+specificity metrics"
```

---

### Task 6: Runner (Main Loop)

**Files:**
- Create: `scripts/autoresearch/runner.ts`

- [ ] **Step 1: Implement runner.ts**

The runner is the orchestrator. It:

1. Reads `.env.local` for `ANTHROPIC_API_KEY`
2. Parses CLI flags: `--timeframe=1d`, `--cascade`, `--max-experiments=200`, `--max-hours=8`
3. Loads snapshots from DB once (or orders for sub-daily timeframes)
4. Runs experiment 0 to establish baseline score
5. Main loop:
   - Reads `program.md`, current best config, last 5 experiment summaries
   - Builds prompt for Claude API (system + user message with config constraints + history)
   - Calls `@anthropic-ai/sdk` with `claude-sonnet-4-6`
   - Parses JSON config from response
   - Validates via `validateConfig()`
   - Runs `scoreConfig()` with the proposed config
   - Accept if score > best, reject otherwise
   - Logs to `results/experiment-{N}.json`
   - Sleeps 2 seconds between experiments
6. Prints summary at end

Key implementation details:
- Use `Anthropic` class from `@anthropic-ai/sdk`
- System prompt tells the agent it's an anomaly detection researcher, includes parameter constraints
- User message includes: current best config + score, last 5 experiments, program.md content
- Ask agent to respond with JSON config block + reasoning
- Parse config from markdown code fence in response
- Retry Claude API calls 3x with exponential backoff on failure
- For `--cascade` mode: iterate through TIMEFRAME_ORDER, tune each level with lower-level anomaly counts as extra features

```typescript
// scripts/autoresearch/runner.ts — key structure

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { validateConfig } from './validate';
import { scoreConfig } from './evaluate';
import { generateInjections } from './inject';
import type { DetectorConfig, ExperimentLog, ScoreBreakdown, Timeframe } from './types';
import { DEFAULT_CONFIG, TIMEFRAME_ORDER } from './types';

// ... env setup, arg parsing ...

async function runExperimentLoop(
  timeframe: Timeframe,
  snapshots: SnapshotRow[],
  maxExperiments: number,
  client: Anthropic,
) {
  const configPath = path.join(__dirname, 'timeframes', timeframe, 'config.json');
  let bestConfig: DetectorConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const programMd = fs.readFileSync(path.join(__dirname, 'program.md'), 'utf-8');
  const hints = JSON.parse(fs.readFileSync(path.join(__dirname, 'hints.json'), 'utf-8'));

  // Generate fixed injection set for this run
  const dates = [...new Set(snapshots.map(s => s.date.toISOString().slice(0, 10)))];
  const channels = [...new Set(snapshots.map(s => s.channel).filter(Boolean))] as string[];
  const funnels = [...new Set(snapshots.map(s => s.funnelId).filter(Boolean))] as string[];
  const seed = Date.now();
  const injections = generateInjections(dates.slice(7, -1), channels, funnels, seed);

  // Experiment 0: baseline
  let bestScore = scoreConfig(snapshots, bestConfig, injections, hints);
  console.log(`Baseline score: ${bestScore.total.toFixed(1)}`);
  logExperiment(0, timeframe, bestConfig, bestScore, bestScore.total, true, 'Baseline', 0);

  const recentExperiments: ExperimentLog[] = [];

  for (let i = 1; i <= maxExperiments; i++) {
    const start = Date.now();
    try {
      // Call Claude API
      const proposed = await proposeConfig(client, bestConfig, bestScore, recentExperiments, programMd);

      // Validate
      const validation = validateConfig(proposed.config);
      if (!validation.valid) {
        logExperiment(i, timeframe, proposed.config, null as any, bestScore.total, false,
          `Invalid: ${validation.errors.join(', ')}`, Date.now() - start);
        continue;
      }

      // Score
      const score = scoreConfig(snapshots, proposed.config, injections, hints);
      const accepted = score.total > bestScore.total;

      if (accepted) {
        bestConfig = proposed.config;
        bestScore = score;
        fs.writeFileSync(configPath, JSON.stringify(bestConfig, null, 2));
      }

      const log = logExperiment(i, timeframe, proposed.config, score, bestScore.total,
        accepted, proposed.reasoning, Date.now() - start);
      recentExperiments.push(log);
      if (recentExperiments.length > 5) recentExperiments.shift();

      const icon = accepted ? 'ACCEPT' : 'reject';
      console.log(`  #${i} [${icon}] score=${score.total.toFixed(1)} (catch=${score.catch.toFixed(0)} quiet=${score.quiet.toFixed(0)} spec=${score.specificity.toFixed(0)}) best=${bestScore.total.toFixed(1)}`);
    } catch (err) {
      console.log(`  #${i} [ERROR] ${(err as Error).message}`);
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  return { bestConfig, bestScore };
}
```

- [ ] **Step 2: Test manually with 3 experiments**

```bash
npx tsx scripts/autoresearch/runner.ts --timeframe=1d --max-experiments=3
```

Expected: Prints baseline score, then 3 experiments with accept/reject.

- [ ] **Step 3: Commit**

```bash
git add scripts/autoresearch/runner.ts
git commit -m "feat(autoresearch): runner loop with Claude API integration"
```

---

### Task 7: Apply Script + Production Integration

**Files:**
- Create: `scripts/autoresearch/apply.ts`
- Modify: `scripts/detect-anomalies.ts` (read production-config.json)

- [ ] **Step 1: Create apply.ts**

```typescript
// scripts/autoresearch/apply.ts
import * as fs from 'fs';
import * as path from 'path';
import { TIMEFRAME_ORDER, DEFAULT_CONFIG } from './types';
import type { DetectorConfig, Timeframe } from './types';

const baseDir = __dirname;
const prodConfigPath = path.join(baseDir, 'production-config.json');

function main() {
  const allConfigs: Record<string, DetectorConfig> = {};

  for (const tf of TIMEFRAME_ORDER) {
    const cfgPath = path.join(baseDir, 'timeframes', tf, 'config.json');
    if (fs.existsSync(cfgPath)) {
      allConfigs[tf] = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    } else {
      allConfigs[tf] = { ...DEFAULT_CONFIG };
    }
  }

  // Load previous production config for diff
  let previous: Record<string, DetectorConfig> | null = null;
  if (fs.existsSync(prodConfigPath)) {
    previous = JSON.parse(fs.readFileSync(prodConfigPath, 'utf-8'));
  }

  fs.writeFileSync(prodConfigPath, JSON.stringify(allConfigs, null, 2));
  console.log(`Written to ${prodConfigPath}`);

  // Print diff
  if (previous) {
    console.log('\nChanges from previous production config:');
    for (const tf of TIMEFRAME_ORDER) {
      const prev = previous[tf] ?? DEFAULT_CONFIG;
      const curr = allConfigs[tf];
      const changes: string[] = [];
      for (const key of Object.keys(curr) as (keyof DetectorConfig)[]) {
        const p = JSON.stringify(prev[key]);
        const c = JSON.stringify(curr[key]);
        if (p !== c) changes.push(`  ${key}: ${p} -> ${c}`);
      }
      if (changes.length > 0) {
        console.log(`\n[${tf}]`);
        changes.forEach(c => console.log(c));
      }
    }
  }
}

main();
```

- [ ] **Step 2: Update detect-anomalies.ts to read production config**

At the top of `scripts/detect-anomalies.ts`, add:
```typescript
import { DEFAULT_CONFIG } from './autoresearch/types';
import type { DetectorConfig } from './autoresearch/types';

function loadConfig(): DetectorConfig {
  const configPath = path.join(__dirname, 'autoresearch', 'production-config.json');
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return raw['1d'] ?? DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}
```

- [ ] **Step 3: Verify production detector still works**

```bash
npx tsx scripts/detect-anomalies.ts
```

- [ ] **Step 4: Commit**

```bash
git add scripts/autoresearch/apply.ts scripts/detect-anomalies.ts
git commit -m "feat(autoresearch): apply script and production config integration"
```

---

### Task 8: End-to-End Smoke Test

- [ ] **Step 1: Run all unit tests**

```bash
npx vitest run tests/autoresearch/
```

Expected: All tests pass (validate, detector, inject, evaluate).

- [ ] **Step 2: Run a short autoresearch session**

```bash
npx tsx scripts/autoresearch/runner.ts --timeframe=1d --max-experiments=5
```

Expected: Baseline + 5 experiments. At least 1 should be accepted.

- [ ] **Step 3: Apply and verify**

```bash
npx tsx scripts/autoresearch/apply.ts
npx tsx scripts/detect-anomalies.ts
```

Expected: Production detector uses new config, produces similar or improved results.

- [ ] **Step 4: Final commit**

```bash
git add -A scripts/autoresearch/ tests/autoresearch/
git commit -m "feat(autoresearch): complete anomaly tuner with multi-timeframe support"
```

---

## Execution Notes

- **Task order is strict** — each task depends on the previous.
- **Task 3 is the biggest** — extracting detector.ts and ensuring detect-anomalies.ts still works requires careful refactoring.
- **Task 6 (runner)** skips TDD because it's an integration script that requires live API calls. Manual testing with `--max-experiments=3` suffices.
- **Sub-daily timeframes** (15min, 1h, 4h, 6h) are supported by the architecture but the initial implementation focuses on `1d`. Sub-daily support adds order-level querying in the runner, which is a follow-up enhancement once the daily loop proves out.
- **The `--cascade` flag** is documented but can be implemented as a fast follow after the single-timeframe loop works.
