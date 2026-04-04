# Alerts Engine — Design Spec

**Date:** 2026-04-02
**Status:** Approved
**Priority:** Highest — killer feature for May rate conversation

---

## Goal

Detect revenue drops and decline spikes automatically, surface them on the `/analytics` page. No external notifications (Slack/email) in MVP — dashboard-only alerts.

## Architecture: Checker Functions (Approach B)

Each alert rule is a standalone async function that queries the database and returns `Anomaly[]`. A runner calls all checkers, deduplicates results, and writes to the existing `Anomaly` table.

Chosen because:
- Simplest to build for 2 rules
- Easiest to evolve into a reactive event-stream pipeline (Approach C) later — checker functions become event handlers, only the trigger mechanism changes
- No premature abstraction

## File Structure

```
src/modules/alerts/
├── checkers/
│   ├── revenue-drop.ts        # Compares today's revenue vs 7-day rolling avg from DailySnapshot
│   └── decline-spike.ts       # Compares recent hourly decline rate vs 7-day baseline from Order table
├── runner.ts                  # Calls all checkers, deduplicates, writes Anomaly rows
├── dedup.ts                   # Prevents duplicate alerts within cooldown window (4h)
└── index.ts                   # Public API: runAlertChecks(), runDeclineSpikeCheck()

app/api/cron/alerts/route.ts   # Vercel cron endpoint (every 30 min) — runs ALL checkers
```

Post-ingestion hook integration in existing `src/core/ingestion/post-hooks.ts` — calls decline-spike checker only (not revenue-drop, which is inherently time-based).

## Alert Rules

### 1. Revenue Drop

- **Data source:** `DailySnapshot` table
- **Logic:** Compare today's `totalRevenue` (sum across all snapshots for today's date, where source IN ('SHOPIFY', 'MERGED')) against 7-day rolling average
- **Thresholds:**
  - WARNING: today < 70% of 7-day avg (30% drop)
  - CRITICAL: today < 50% of 7-day avg (50% drop)
- **Trigger:** Vercel cron only (every 30 min)
- **Known issue to handle:** DailySnapshot may be stale (currently 2 days behind). If no snapshot exists for today, the checker should flag that as a WARNING ("No snapshot data for today — snapshot builder may not be running").

### 2. Decline Spike

- **Data source:** `Order` table (source = CHECKOUTCHAMP or MERGED)
- **Logic:**
  1. Count orders in last 2 hours: total vs DECLINED/PARTIAL-with-paySource
  2. Calculate current decline rate
  3. Compare against baseline decline rate from last 7 days (same calculation over 7-day window)
- **Thresholds:**
  - WARNING: current rate > 2x baseline
  - CRITICAL: current rate > 3x baseline
  - Minimum sample: at least 5 orders in 2-hour window (don't alert on 1 decline out of 2 orders)
- **Trigger:** Both cron (every 30 min) AND post-ingestion hook (after CC orders arrive)

## Deduplication

Before writing an Anomaly row, query for existing Anomaly with same `type` + `metric` + `dimension` + `dimensionValue` created within the last 4 hours. If found, skip.

This fixes the previous bug where `avgOrderValue = 0` fired 20+ duplicate anomalies.

## Cron Setup

- Route: `GET /api/cron/alerts`
- Schedule: every 30 minutes
- Vercel cron config in `vercel.json`
- The cron doubles as a "zero-order" detector — if DailySnapshot shows no data, that's itself an alert

## Post-Ingestion Hook Integration

In `post-hooks.ts`, after QA analysis completes:
- Call `runDeclineSpikeCheck()` (not the full runner — revenue-drop doesn't need real-time)
- Fire-and-forget, same pattern as existing QA hook
- Only runs when source is CC (Shopify orders don't have decline data)

## Existing Infrastructure Reused

- **Anomaly model** — no schema changes needed. Fields map perfectly: type, severity, metric, dimension, expected, actual, deviation, explanation
- **`/analytics` page** — already renders Anomaly rows with acknowledge button
- **`/api/analytics/anomalies/[id]/acknowledge`** — already works
- **`config.ts`** — notifications config exists for future Slack/email expansion

## What's NOT in Scope

- External notifications (Slack, email, SMS)
- Alert rule configuration UI
- New Prisma models or migrations
- Funnel conversion alerts
- Chargeback alerts
- Zero-order gap detection (implicit via revenue-drop catching stale snapshots)

## Evolution Path to Reactive Pipeline (Approach C)

When volume or latency requirements justify it:
1. Keep checker functions as-is
2. Add Redis-backed sliding window state per checker
3. Replace cron trigger with event subscription (order ingested → checker fires)
4. Runner becomes an event router instead of a sequential caller
5. Checker function signatures don't change — `() => Promise<Anomaly[]>` works for both

## Dependencies

- DailySnapshot must be up to date for revenue-drop to work. **Fixing the snapshot builder staleness (currently 2 days behind) is a prerequisite.**
- Decline-spike works against live Order data — no dependency on snapshots.

## Success Criteria

- Revenue drop detected and visible on `/analytics` within 30 minutes of occurrence
- Decline spike detected and visible within minutes of order burst
- No duplicate alerts for the same incident
- Zero false positives from "no data yet today" edge cases
