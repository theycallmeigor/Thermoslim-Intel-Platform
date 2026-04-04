# Alerts Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect revenue drops and decline spikes automatically, surface them as Anomaly rows on the existing `/analytics` page.

**Architecture:** Checker functions pattern — each rule is a standalone async function returning `Anomaly[]`. A runner calls all checkers, deduplicates via 4-hour cooldown, writes to the existing `Anomaly` table. Triggered by Vercel cron (every 30 min) and post-ingestion hooks (decline-spike only).

**Tech Stack:** TypeScript, Prisma (existing schema), Next.js App Router (cron route), Vitest (tests)

**Spec:** `docs/superpowers/specs/2026-04-02-alerts-engine-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/modules/alerts/dedup.ts` | Check Anomaly table for recent duplicates within 4h cooldown |
| Create | `src/modules/alerts/checkers/revenue-drop.ts` | Query DailySnapshot, compare today vs 7-day rolling avg |
| Create | `src/modules/alerts/checkers/decline-spike.ts` | Query Order table, compare 2h decline rate vs 7-day baseline |
| Create | `src/modules/alerts/runner.ts` | Call all checkers, deduplicate, write Anomaly rows |
| Rewrite | `src/modules/alerts/index.ts` | Public API: `runAlertChecks()`, `runDeclineSpikeCheck()` |
| Create | `app/api/cron/alerts/route.ts` | Vercel cron endpoint, calls `runAlertChecks()` |
| Modify | `vercel.json` | Add cron schedule |
| Modify | `src/core/ingestion/post-hooks.ts:38-54` | Add decline-spike call after QA |
| Create | `src/modules/alerts/__tests__/dedup.test.ts` | Dedup unit tests |
| Create | `src/modules/alerts/__tests__/revenue-drop.test.ts` | Revenue drop checker tests |
| Create | `src/modules/alerts/__tests__/decline-spike.test.ts` | Decline spike checker tests |
| Create | `src/modules/alerts/__tests__/runner.test.ts` | Runner integration tests |

---

## Task 1: Deduplication Module

**Files:**
- Create: `src/modules/alerts/dedup.ts`
- Create: `src/modules/alerts/__tests__/dedup.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/modules/alerts/__tests__/dedup.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isDuplicate } from '../dedup';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    anomaly: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('isDuplicate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when a matching anomaly exists within cooldown', async () => {
    (prisma.anomaly.findFirst as any).mockResolvedValue({ id: 'existing-1' });
    const result = await isDuplicate({
      type: 'ALERT',
      metric: 'revenue',
      dimension: null,
      dimensionValue: null,
    });
    expect(result).toBe(true);
  });

  it('returns false when no matching anomaly exists', async () => {
    (prisma.anomaly.findFirst as any).mockResolvedValue(null);
    const result = await isDuplicate({
      type: 'ALERT',
      metric: 'revenue',
      dimension: null,
      dimensionValue: null,
    });
    expect(result).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/alerts/__tests__/dedup.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the dedup module**

```typescript
// src/modules/alerts/dedup.ts
import { prisma } from '@/lib/prisma';

const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

export interface DedupCheck {
  type: string;
  metric: string;
  dimension: string | null;
  dimensionValue: string | null;
}

/**
 * Check if a matching anomaly was already created within the cooldown window.
 * Prevents duplicate alerts for the same ongoing incident.
 */
export async function isDuplicate(check: DedupCheck): Promise<boolean> {
  const cutoff = new Date(Date.now() - COOLDOWN_MS);

  const existing = await prisma.anomaly.findFirst({
    where: {
      type: check.type,
      metric: check.metric,
      dimension: check.dimension,
      dimensionValue: check.dimensionValue,
      detectedAt: { gte: cutoff },
    },
    select: { id: true },
  });

  return existing !== null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/alerts/__tests__/dedup.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/alerts/dedup.ts src/modules/alerts/__tests__/dedup.test.ts
git commit -m "feat(alerts): add dedup module with 4h cooldown window"
```

---

## Task 2: Revenue Drop Checker

**Files:**
- Create: `src/modules/alerts/checkers/revenue-drop.ts`
- Create: `src/modules/alerts/__tests__/revenue-drop.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/modules/alerts/__tests__/revenue-drop.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRevenueDrop } from '../checkers/revenue-drop';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    dailySnapshot: {
      aggregate: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('checkRevenueDrop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns CRITICAL anomaly when revenue drops >50%', async () => {
    // 7-day avg = $10,000/day, today = $4,000 (60% drop)
    (prisma.dailySnapshot.aggregate as any)
      .mockResolvedValueOnce({ _sum: { totalRevenue: 400000 } })   // today: $4,000
      .mockResolvedValueOnce({ _sum: { totalRevenue: 7000000 } }); // 7 days: $70,000

    const anomalies = await checkRevenueDrop();
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].severity).toBe('CRITICAL');
    expect(anomalies[0].metric).toBe('totalRevenue');
  });

  it('returns WARNING anomaly when revenue drops 30-50%', async () => {
    // 7-day avg = $10,000/day, today = $6,500 (35% drop)
    (prisma.dailySnapshot.aggregate as any)
      .mockResolvedValueOnce({ _sum: { totalRevenue: 650000 } })
      .mockResolvedValueOnce({ _sum: { totalRevenue: 7000000 } });

    const anomalies = await checkRevenueDrop();
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].severity).toBe('WARNING');
  });

  it('returns empty array when revenue is normal', async () => {
    // 7-day avg = $10,000/day, today = $9,500 (5% drop — normal)
    (prisma.dailySnapshot.aggregate as any)
      .mockResolvedValueOnce({ _sum: { totalRevenue: 950000 } })
      .mockResolvedValueOnce({ _sum: { totalRevenue: 7000000 } });

    const anomalies = await checkRevenueDrop();
    expect(anomalies).toHaveLength(0);
  });

  it('returns WARNING when no snapshot data exists for today', async () => {
    (prisma.dailySnapshot.aggregate as any)
      .mockResolvedValueOnce({ _sum: { totalRevenue: null } })    // no today data
      .mockResolvedValueOnce({ _sum: { totalRevenue: 7000000 } });

    const anomalies = await checkRevenueDrop();
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].explanation).toContain('No snapshot data');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/alerts/__tests__/revenue-drop.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the revenue-drop checker**

```typescript
// src/modules/alerts/checkers/revenue-drop.ts
import { prisma } from '@/lib/prisma';

interface PendingAnomaly {
  type: string;
  severity: string;
  metric: string;
  dimension: string | null;
  dimensionValue: string | null;
  expected: number;
  actual: number;
  deviation: number;
  explanation: string;
}

/**
 * Compare today's revenue against 7-day rolling average.
 * Only counts SHOPIFY + MERGED sources (canonical revenue per CLAUDE.md).
 *
 * Thresholds:
 *   WARNING:  today < 70% of 7-day avg (30% drop)
 *   CRITICAL: today < 50% of 7-day avg (50% drop)
 */
export async function checkRevenueDrop(): Promise<PendingAnomaly[]> {
  const now = new Date();
  const todayStart = new Date(now.toISOString().split('T')[0] + 'T00:00:00Z');
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 86400000);

  // Today's revenue from DailySnapshot
  const todayAgg = await prisma.dailySnapshot.aggregate({
    where: {
      date: { gte: todayStart, lt: todayEnd },
      source: { in: ['SHOPIFY', 'MERGED'] },
    },
    _sum: { totalRevenue: true },
  });

  // 7-day historical revenue
  const histAgg = await prisma.dailySnapshot.aggregate({
    where: {
      date: { gte: sevenDaysAgo, lt: todayStart },
      source: { in: ['SHOPIFY', 'MERGED'] },
    },
    _sum: { totalRevenue: true },
  });

  const todayRevenue = todayAgg._sum.totalRevenue ?? 0;
  const histRevenue = histAgg._sum.totalRevenue ?? 0;

  // No historical data — can't compare
  if (histRevenue === 0) return [];

  const dailyAvg = histRevenue / 7;

  // No snapshot data for today — likely stale snapshot builder
  if (todayAgg._sum.totalRevenue === null) {
    return [{
      type: 'ALERT',
      severity: 'WARNING',
      metric: 'totalRevenue',
      dimension: null,
      dimensionValue: null,
      expected: dailyAvg,
      actual: 0,
      deviation: -1,
      explanation: `No snapshot data for today — snapshot builder may not be running. Expected ~$${(dailyAvg / 100).toFixed(0)}/day based on 7-day average.`,
    }];
  }

  const ratio = todayRevenue / dailyAvg;
  const dropPct = (1 - ratio) * 100;

  if (ratio >= 0.7) return []; // Normal — no alert

  const severity = ratio < 0.5 ? 'CRITICAL' : 'WARNING';

  return [{
    type: 'ALERT',
    severity,
    metric: 'totalRevenue',
    dimension: null,
    dimensionValue: null,
    expected: dailyAvg,
    actual: todayRevenue,
    deviation: -(dropPct / 100),
    explanation: `Revenue is down ${dropPct.toFixed(0)}% today. Current: $${(todayRevenue / 100).toFixed(0)}, 7-day avg: $${(dailyAvg / 100).toFixed(0)}/day.`,
  }];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/alerts/__tests__/revenue-drop.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/alerts/checkers/revenue-drop.ts src/modules/alerts/__tests__/revenue-drop.test.ts
git commit -m "feat(alerts): add revenue-drop checker with 30%/50% thresholds"
```

---

## Task 3: Decline Spike Checker

**Files:**
- Create: `src/modules/alerts/checkers/decline-spike.ts`
- Create: `src/modules/alerts/__tests__/decline-spike.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/modules/alerts/__tests__/decline-spike.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkDeclineSpike } from '../checkers/decline-spike';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      count: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('checkDeclineSpike', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns CRITICAL when decline rate is >3x baseline', async () => {
    // Recent 2h: 20 total, 12 declined (60%)
    // 7-day baseline: 500 total, 50 declined (10%)
    (prisma.order.count as any)
      .mockResolvedValueOnce(20)   // recent total
      .mockResolvedValueOnce(12)   // recent declined
      .mockResolvedValueOnce(500)  // baseline total
      .mockResolvedValueOnce(50);  // baseline declined

    const anomalies = await checkDeclineSpike();
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].severity).toBe('CRITICAL');
    expect(anomalies[0].metric).toBe('declineRate');
  });

  it('returns WARNING when decline rate is 2-3x baseline', async () => {
    // Recent 2h: 20 total, 8 declined (40%)
    // 7-day baseline: 500 total, 100 declined (20%)
    (prisma.order.count as any)
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(500)
      .mockResolvedValueOnce(100);

    const anomalies = await checkDeclineSpike();
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].severity).toBe('WARNING');
  });

  it('returns empty when decline rate is normal', async () => {
    // Recent 2h: 20 total, 2 declined (10%)
    // 7-day baseline: 500 total, 50 declined (10%)
    (prisma.order.count as any)
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(500)
      .mockResolvedValueOnce(50);

    const anomalies = await checkDeclineSpike();
    expect(anomalies).toHaveLength(0);
  });

  it('returns empty when sample size is too small (<5 orders)', async () => {
    (prisma.order.count as any)
      .mockResolvedValueOnce(3)    // only 3 orders — too few
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(500)
      .mockResolvedValueOnce(50);

    const anomalies = await checkDeclineSpike();
    expect(anomalies).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/alerts/__tests__/decline-spike.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the decline-spike checker**

```typescript
// src/modules/alerts/checkers/decline-spike.ts
import { prisma } from '@/lib/prisma';

interface PendingAnomaly {
  type: string;
  severity: string;
  metric: string;
  dimension: string | null;
  dimensionValue: string | null;
  expected: number;
  actual: number;
  deviation: number;
  explanation: string;
}

const MIN_SAMPLE = 5;
const RECENT_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours
const BASELINE_DAYS = 7;

/**
 * Compare recent 2-hour decline rate against 7-day baseline.
 * Only looks at CC/MERGED orders (Shopify doesn't have decline data).
 *
 * Thresholds:
 *   WARNING:  current rate > 2x baseline
 *   CRITICAL: current rate > 3x baseline
 *   Minimum:  at least 5 orders in 2h window
 */
export async function checkDeclineSpike(): Promise<PendingAnomaly[]> {
  const now = new Date();
  const recentCutoff = new Date(now.getTime() - RECENT_WINDOW_MS);
  const baselineCutoff = new Date(now.getTime() - BASELINE_DAYS * 86400000);

  const sourceFilter = { in: ['CHECKOUTCHAMP' as const, 'MERGED' as const] };
  const declinedStatuses = { in: ['DECLINED' as const, 'PARTIAL' as const] };

  // Recent 2h window
  const [recentTotal, recentDeclined] = await Promise.all([
    prisma.order.count({
      where: { source: sourceFilter, createdAt: { gte: recentCutoff } },
    }),
    prisma.order.count({
      where: {
        source: sourceFilter,
        createdAt: { gte: recentCutoff },
        status: declinedStatuses,
        paySource: { not: null }, // Exclude abandoned (no payment attempted)
      },
    }),
  ]);

  // Not enough data to judge
  if (recentTotal < MIN_SAMPLE) return [];

  // 7-day baseline
  const [baselineTotal, baselineDeclined] = await Promise.all([
    prisma.order.count({
      where: { source: sourceFilter, createdAt: { gte: baselineCutoff, lt: recentCutoff } },
    }),
    prisma.order.count({
      where: {
        source: sourceFilter,
        createdAt: { gte: baselineCutoff, lt: recentCutoff },
        status: declinedStatuses,
        paySource: { not: null },
      },
    }),
  ]);

  if (baselineTotal === 0) return []; // No baseline to compare against

  const currentRate = recentDeclined / recentTotal;
  const baselineRate = baselineDeclined / baselineTotal;

  if (baselineRate === 0) return []; // No declines in baseline — can't calculate ratio

  const ratio = currentRate / baselineRate;

  if (ratio < 2) return []; // Normal — no alert

  const severity = ratio >= 3 ? 'CRITICAL' : 'WARNING';
  const currentPct = (currentRate * 100).toFixed(0);
  const baselinePct = (baselineRate * 100).toFixed(0);

  return [{
    type: 'ALERT',
    severity,
    metric: 'declineRate',
    dimension: null,
    dimensionValue: null,
    expected: baselineRate,
    actual: currentRate,
    deviation: ratio,
    explanation: `Decline rate spiked to ${currentPct}% in the last 2 hours (${recentDeclined}/${recentTotal} orders). 7-day baseline: ${baselinePct}%. That's ${ratio.toFixed(1)}x the normal rate.`,
  }];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/alerts/__tests__/decline-spike.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/alerts/checkers/decline-spike.ts src/modules/alerts/__tests__/decline-spike.test.ts
git commit -m "feat(alerts): add decline-spike checker with 2x/3x thresholds"
```

---

## Task 4: Alert Runner

**Files:**
- Create: `src/modules/alerts/runner.ts`
- Rewrite: `src/modules/alerts/index.ts`
- Create: `src/modules/alerts/__tests__/runner.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/modules/alerts/__tests__/runner.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAlertChecks } from '../index';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    anomaly: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('../checkers/revenue-drop', () => ({
  checkRevenueDrop: vi.fn(),
}));

vi.mock('../checkers/decline-spike', () => ({
  checkDeclineSpike: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { checkRevenueDrop } from '../checkers/revenue-drop';
import { checkDeclineSpike } from '../checkers/decline-spike';

describe('runAlertChecks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.anomaly.findFirst as any).mockResolvedValue(null); // no dupes
    (prisma.anomaly.create as any).mockResolvedValue({ id: 'new-1' });
  });

  it('runs all checkers and writes new anomalies', async () => {
    (checkRevenueDrop as any).mockResolvedValue([{
      type: 'ALERT', severity: 'WARNING', metric: 'totalRevenue',
      dimension: null, dimensionValue: null,
      expected: 1000000, actual: 600000, deviation: -0.4,
      explanation: 'Revenue down 40%',
    }]);
    (checkDeclineSpike as any).mockResolvedValue([]);

    const result = await runAlertChecks();
    expect(result.alertsCreated).toBe(1);
    expect(prisma.anomaly.create).toHaveBeenCalledTimes(1);
  });

  it('skips duplicates within cooldown', async () => {
    (checkRevenueDrop as any).mockResolvedValue([{
      type: 'ALERT', severity: 'WARNING', metric: 'totalRevenue',
      dimension: null, dimensionValue: null,
      expected: 1000000, actual: 600000, deviation: -0.4,
      explanation: 'Revenue down 40%',
    }]);
    (checkDeclineSpike as any).mockResolvedValue([]);
    (prisma.anomaly.findFirst as any).mockResolvedValue({ id: 'existing' }); // dupe exists

    const result = await runAlertChecks();
    expect(result.alertsCreated).toBe(0);
    expect(result.duplicatesSkipped).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/alerts/__tests__/runner.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the runner**

```typescript
// src/modules/alerts/runner.ts
import { prisma } from '@/lib/prisma';
import { isDuplicate } from './dedup';
import { checkRevenueDrop } from './checkers/revenue-drop';
import { checkDeclineSpike } from './checkers/decline-spike';

export interface AlertRunResult {
  checkersRun: number;
  alertsFound: number;
  alertsCreated: number;
  duplicatesSkipped: number;
  errors: string[];
  durationMs: number;
}

/**
 * Run all alert checkers, deduplicate, and write new anomalies to DB.
 */
export async function runAllCheckers(): Promise<AlertRunResult> {
  const start = Date.now();
  const errors: string[] = [];
  let alertsFound = 0;
  let alertsCreated = 0;
  let duplicatesSkipped = 0;

  // Collect results from all checkers
  const checkerResults = await Promise.allSettled([
    checkRevenueDrop(),
    checkDeclineSpike(),
  ]);

  const allAlerts = [];
  for (const result of checkerResults) {
    if (result.status === 'fulfilled') {
      allAlerts.push(...result.value);
    } else {
      errors.push(result.reason?.message ?? 'Unknown checker error');
      console.error('[alerts] Checker failed:', result.reason);
    }
  }

  alertsFound = allAlerts.length;

  // Deduplicate and write
  for (const alert of allAlerts) {
    const dupe = await isDuplicate({
      type: alert.type,
      metric: alert.metric,
      dimension: alert.dimension,
      dimensionValue: alert.dimensionValue,
    });

    if (dupe) {
      duplicatesSkipped++;
      continue;
    }

    try {
      await prisma.anomaly.create({ data: alert });
      alertsCreated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown write error';
      errors.push(`Failed to write anomaly: ${msg}`);
      console.error('[alerts] Failed to write anomaly:', err);
    }
  }

  const durationMs = Date.now() - start;

  console.log(
    `[alerts] Run complete: ${checkerResults.length} checkers, ` +
    `${alertsFound} found, ${alertsCreated} created, ` +
    `${duplicatesSkipped} deduped, ${errors.length} errors (${durationMs}ms)`,
  );

  return { checkersRun: checkerResults.length, alertsFound, alertsCreated, duplicatesSkipped, errors, durationMs };
}

/**
 * Run only the decline-spike checker (for post-ingestion hooks).
 */
export async function runDeclineCheck(): Promise<AlertRunResult> {
  const start = Date.now();
  const errors: string[] = [];
  let alertsCreated = 0;
  let duplicatesSkipped = 0;

  try {
    const alerts = await checkDeclineSpike();

    for (const alert of alerts) {
      const dupe = await isDuplicate({
        type: alert.type,
        metric: alert.metric,
        dimension: alert.dimension,
        dimensionValue: alert.dimensionValue,
      });

      if (dupe) {
        duplicatesSkipped++;
        continue;
      }

      await prisma.anomaly.create({ data: alert });
      alertsCreated++;
    }

    return { checkersRun: 1, alertsFound: alerts.length, alertsCreated, duplicatesSkipped, errors, durationMs: Date.now() - start };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    errors.push(msg);
    console.error('[alerts] Decline check failed:', err);
    return { checkersRun: 1, alertsFound: 0, alertsCreated: 0, duplicatesSkipped: 0, errors, durationMs: Date.now() - start };
  }
}
```

- [ ] **Step 4: Rewrite the index.ts public API**

```typescript
// src/modules/alerts/index.ts
export { runAllCheckers as runAlertChecks, runDeclineCheck as runDeclineSpikeCheck } from './runner';
export type { AlertRunResult } from './runner';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/modules/alerts/__tests__/runner.test.ts`
Expected: PASS

- [ ] **Step 6: Run all alert tests together**

Run: `npx vitest run src/modules/alerts/__tests__/`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add src/modules/alerts/runner.ts src/modules/alerts/index.ts src/modules/alerts/__tests__/runner.test.ts
git commit -m "feat(alerts): add runner with dedup, public API"
```

---

## Task 5: Vercel Cron Route

**Files:**
- Create: `app/api/cron/alerts/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Create the cron route**

```typescript
// app/api/cron/alerts/route.ts
import { NextResponse } from 'next/server';
import { runAlertChecks } from '@/modules/alerts';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // seconds

export async function GET(request: Request) {
  // Verify cron secret in production (Vercel sets this header)
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runAlertChecks();
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cron/alerts] Failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Add cron schedule to vercel.json**

Update `vercel.json`:

```json
{
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/cron/alerts",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/alerts/route.ts vercel.json
git commit -m "feat(alerts): add Vercel cron route (every 30 min)"
```

---

## Task 6: Post-Ingestion Hook Integration

**Files:**
- Modify: `src/core/ingestion/post-hooks.ts`

- [ ] **Step 1: Add decline-spike call after QA in post-hooks.ts**

Add import at top of file:

```typescript
import { runDeclineSpikeCheck } from '../../modules/alerts';
```

Add to `notifyOrdersIngested()` function, after the existing QA scheduling block (after line 53), add:

```typescript
  // Run decline-spike check after CC orders arrive (fire-and-forget)
  if (source === 'webhook') {
    runDeclineSpikeCheck().catch((err) => {
      console.error('[post-hooks] Decline spike check failed:', err);
    });
  }
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/core/ingestion/post-hooks.ts
git commit -m "feat(alerts): integrate decline-spike check into post-ingestion hooks"
```

---

## Task 7: Smoke Test — Full Integration

- [ ] **Step 1: Run all tests**

Run: `npx vitest run src/modules/alerts/`
Expected: All pass

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Test cron route locally**

Run: `curl -s http://localhost:3000/api/cron/alerts | jq .`
Expected: JSON response with `checkersRun`, `alertsCreated`, etc.

- [ ] **Step 4: Check /analytics page for new anomalies**

Open `http://localhost:3000/analytics` — any new ALERT-type anomalies should appear in the "Active Anomalies" section.

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(alerts): smoke test fixes"
```
