# Autoresearch Anomaly Tuner — Design Spec

## Purpose

Autonomous experiment loop (inspired by [karpathy/autoresearch](https://github.com/karpathy/autoresearch)) that tunes the ThermoSlim anomaly detection system. An AI agent iteratively modifies detection parameters, evaluates against historical data with synthetic injections and user-labeled hints, and accepts or rejects changes — running hundreds of experiments overnight on Mac Studio.

## Success Criteria

- Detection score improves over the hand-picked baseline after an overnight run
- Agent discovers parameter combinations a human wouldn't think to try (e.g., weekday/weekend split baselines)
- Zero manual intervention required during a run
- Experiment log is reviewable: every trial shows config, score breakdown, accept/reject

## Architecture

```
scripts/autoresearch/
  runner.ts              # Orchestrator — calls Claude API, proposes configs, runs eval
  evaluate.ts            # Fixed scorer — runs a config against historical snapshots
  inject.ts              # Synthetic anomaly injection into snapshot copies
  detector.ts            # Shared detection logic (imported by evaluate + production)
  program.md             # Human-written research direction
  hints.json             # User-labeled ground truth events
  timeframes/
    15min/config.json    # Config for 15-minute engine
    1h/config.json       # Config for 1-hour engine (consumes 4× 15min outputs)
    4h/config.json       # Config for 4-hour engine
    6h/config.json       # Config for 6-hour engine
    1d/config.json       # Config for daily engine (current system)
    1w/config.json       # Config for weekly engine
  results/               # Per-experiment JSON logs (subdirs per timeframe)
```

### Multi-Timeframe Cascade

Detection runs at multiple granularities. Each level aggregates from the level below and inherits its anomaly signals as additional input features:

```
15min → 1h → 4h → 6h → 1d → 1w
```

- **15-minute engine**: Finest grain. Detects sudden drops/spikes in real-time metrics. Outputs: anomaly flags + aggregated metrics per 15-min window.
- **1-hour engine**: Receives 4× 15-min outputs. Can see patterns across the hour (e.g., a 15-min dip that recovered vs. sustained drop). Also receives the 15-min anomaly count as an input feature.
- **4-hour / 6-hour engines**: Same pattern — aggregate lower-level outputs, detect medium-term trends (gradual declines, shift patterns).
- **Daily engine**: Current system (DailySnapshot-based). Receives all intraday anomaly signals as context.
- **Weekly engine**: Detects week-over-week trends, seasonal patterns.

Each timeframe has its own `config.json` with the same parameter schema. The autoresearch loop tunes one timeframe at a time, starting from the finest grain and working up — because higher levels depend on lower-level outputs being stable first.

**Data access**: The detector at any level can query the full database (orders, subscriptions, product_map, snapshots) to pull supporting context. The config controls what it looks for; the DB access is unrestricted for reads.

### Boundary Rules

The agent (via Claude API) can ONLY modify `config.json` files. Everything else is read-only to the agent. This constraint keeps the evaluation honest — the agent cannot game the scorer.

## Intraday Data Source

Sub-daily timeframes (15min, 1h, 4h, 6h) query raw `Order.createdAt` timestamps directly rather than relying on DailySnapshot. The detector groups orders into time windows on the fly. This avoids needing a new pre-aggregation table — with ~25 orders/day the query cost is negligible.

The daily and weekly engines continue to use DailySnapshot.

## Components

### 1. Config (config.json per timeframe)

The parameter space the agent explores:

```json
{
  "lookbackDays": 14,
  "minHistory": 7,
  "warningThreshold": 2.0,
  "criticalThreshold": 3.0,
  "funnelDropWarning": 0.25,
  "funnelDropCritical": 0.50,
  "topCampaignsToCheck": 20,
  "metricsToCheck": ["totalOrders", "totalRevenue", "newSubscribers", "cancelledSubscribers"],
  "useMedianInsteadOfMean": false,
  "weekdayWeekendSplit": false,
  "excludeOutliersFromBaseline": false,
  "outlierMethod": "none"
}
```

**Parameter constraints** (enforced by runner, not the agent):
- `lookbackDays`: 3–60
- `minHistory`: 3–30, must be < lookbackDays
- `warningThreshold`: 1.0–4.0
- `criticalThreshold`: must be > warningThreshold, max 6.0
- `funnelDropWarning`: 0.05–0.80
- `funnelDropCritical`: must be > funnelDropWarning, max 0.95
- `topCampaignsToCheck`: 5–50
- `metricsToCheck`: subset of `["totalOrders", "totalRevenue", "newOrders", "recurringOrders", "newSubscribers", "cancelledSubscribers", "refunds", "avgOrderValue"]`
- `outlierMethod`: `"none"` | `"iqr"` (1.5×IQR) | `"trim5"` (drop top/bottom 5%)
- Boolean flags: true/false

Invalid configs are rejected before evaluation.

### 2. Hints (hints.json)

User-labeled events that seed ground truth:

```json
[
  {
    "date": "2026-03-21",
    "type": "real",
    "metric": "conversionRate",
    "dimension": "funnel",
    "dimensionValue": "checkout2",
    "description": "checkout2 funnel conversion dropped ~30%"
  },
  {
    "date": "2026-02-14",
    "type": "false_alarm",
    "description": "valentines day spike — normal seasonal behavior"
  }
]
```

- `type: "real"` — the detector SHOULD fire on this day/dimension
- `type: "false_alarm"` — the detector should NOT fire on this day
- Fields `metric`, `dimension`, `dimensionValue` are optional — if present, the scorer checks whether the detector fired on the right thing, not just the right day

### 3. Synthetic Injection (inject.ts)

Creates modified copies of real snapshot data with known anomalies injected. The detector runs against the modified data; the scorer knows what was injected and where.

**Injection types:**
1. **Zero-out** — Set a day's orders/revenue to 0 for a specific dimension
2. **Spike** — Multiply a metric by 3–5x for one day
3. **Gradual decline** — Reduce a metric by 5% per day over 3–5 days
4. **Channel shift** — Move 50% of one channel's volume to another
5. **Funnel break** — Drop a specific funnel's conversion by 40–60%

**Determinism:** Injections are generated once at the start of a run using a fixed random seed (derived from run start timestamp). The same injection set is reused for every experiment within that run, ensuring scores are comparable across configs. The seed is logged in the run metadata.

### 4. Evaluator (evaluate.ts)

Deterministic scorer. Given a config and a set of snapshots (with injections), returns a score 0–100.

**Shared detector logic:** The core detection algorithm is extracted into a shared module `scripts/autoresearch/detector.ts` that accepts a config object and an array of snapshot rows, and returns a list of detected anomalies. Both `evaluate.ts` and the production `scripts/detect-anomalies.ts` import from this module. This ensures the tuned config transfers exactly to production.

**Scoring formula:**

```
score = 0.40 * catchRate + 0.40 * quietRate + 0.20 * specificityRate
```

**Catch rate (0–100):** Percentage of injected anomalies + user-labeled "real" events that the detector flags. A detection counts if it fires on the correct day (±1 day tolerance for gradual declines). Hint matching: hints with `metric: "conversionRate"` match FUNNEL-type detections; hints with other metrics match METRIC-type detections on the same metric name.

**Quiet rate (0–100):** `100 - (false_positives / clean_days * 100)`. A false positive is an alert on a day with no injection and no "real" hint, excluding days labeled "false_alarm" (which are always false positives if flagged). Clean days = total days - injected days - hint days. If clean_days = 0, quiet rate = 100 (no opportunity for false positives).

**Specificity rate (0–100):** Of the correctly caught injections, what percentage identified the right dimension? Only scored for injections that target a specific dimension (channel shift, funnel break). Falls back to 100 if no dimension-targeted injections exist.

**Baseline establishment:** The runner's first action (experiment 0) is to evaluate the initial config.json to establish the baseline score. This is logged as experiment 0 and always "accepted."

### 5. Runner (runner.ts)

The main loop. Orchestrates the experiment cycle.

**Per-experiment flow:**
1. Read `program.md`, `config.json` (current best), last 5 experiment summaries
2. Build a prompt for Claude API:
   - System: "You are an anomaly detection researcher. Propose a new config.json to improve the score."
   - Include: current best config + score, last 5 experiments (config + score + accept/reject), parameter constraints, program.md instructions
3. Call Claude API (claude-sonnet-4-6 for speed/cost)
4. Parse response → extract new config.json
5. Validate constraints → reject if invalid
6. Run evaluate.ts with new config
7. Compare score to current best:
   - If better → accept, update config.json, log as accepted
   - If equal or worse → reject, log as rejected
8. Write `results/experiment-{N}.json`
9. Sleep 1 second (rate limiting), repeat

**Experiment log format:**
```json
{
  "id": 42,
  "timestamp": "2026-03-21T22:15:00Z",
  "config": { ... },
  "score": { "total": 78.5, "catch": 85, "quiet": 72, "specificity": 80 },
  "bestScore": 76.2,
  "accepted": true,
  "reasoning": "Agent's explanation of what it changed and why",
  "duration": 4200
}
```

**Stopping conditions:**
- `--max-experiments N` flag (default: 200 per timeframe)
- `--max-hours H` flag (default: 8 total)
- Whichever comes first

**Timeframe tuning order:**
The runner accepts a `--timeframe` flag (e.g., `--timeframe=1d`) to tune a single level, or `--cascade` to tune all levels bottom-up:
1. Tune 15min engine (N experiments)
2. Lock 15min config, tune 1h engine using 15min outputs as features
3. Lock 1h, tune 4h... and so on up to 1w

In cascade mode, each level gets `max-experiments / 6` iterations (evenly split across 6 levels). The daily level (`1d`) is the default if no flag is provided, matching the current system.

### 6. Program (program.md)

Human-written research directions. The agent reads this every iteration.

Initial content:
```markdown
# Research Direction

Optimize anomaly detection for the ThermoSlim e-commerce platform.

## Context
- 80 days of DailySnapshot data (Jan–Mar 2026)
- ~25 orders/day average, growing over time
- Weekend volumes are similar to weekdays (no significant weekend drop)
- Multiple channels: direct, cc_onetime, cc_new_sub, cc_recurring
- Key funnels: checkout2, and others

## Goals
1. Maximize catch rate — never miss a real anomaly
2. Minimize false alarms — especially on weekends and holidays
3. Explore whether splitting baselines by weekday/weekend helps
4. Try different lookback windows — shorter might catch sudden changes faster
5. Consider whether median is more robust than mean for small sample sizes

## Constraints
- Prefer fewer false alarms over catching every edge case
- A config that fires >3 alerts per day on average is too noisy
```

### 7. Applying Results

After a run completes, the winning configs are applied to the production detector. Since both `detect-anomalies.ts` and `evaluate.ts` import the shared `detector.ts` module, applying results means copying the winning `config.json` to a known path that the production cron reads.

`scripts/autoresearch/apply.ts`:
- Reads the best config(s) from `timeframes/*/config.json`
- Writes them to `scripts/autoresearch/production-config.json` (a single merged file with all timeframe configs)
- The production `detect-anomalies.ts` reads this file at startup instead of using hardcoded values
- Prints a summary of what changed vs. the previous production config

This is a deliberate manual step — you review the experiment log and run `apply.ts` when satisfied.

## Data Flow

```
program.md + config.json + last 5 results
        ↓
   Claude API (propose new config)
        ↓
   Validate constraints
        ↓
   inject.ts (add synthetic anomalies to snapshot copy)
        ↓
   evaluate.ts (run detector with new config, score results)
        ↓
   Compare to best → accept/reject
        ↓
   Log to results/experiment-{N}.json
        ↓
   Repeat
```

## Dependencies

- **Claude API key** — `ANTHROPIC_API_KEY` in `.env.local`
- **Database access** — reads DailySnapshot table (existing Prisma setup)
- **No GPU** — pure TypeScript, runs on Mac Studio via `npx tsx`

## Error Handling

- Claude API failures: retry 3x with exponential backoff, then skip experiment
- Invalid config from agent: log as rejected with reason, continue loop
- Database errors: abort run, log error
- Each experiment is independent — a crash mid-run loses nothing (results are written per-experiment)

## Testing Strategy

- evaluate.ts is tested by running it with known-good and known-bad configs and asserting score ordering
- inject.ts is tested by verifying injections appear in the modified snapshot data
- runner.ts is tested with a mock Claude API that returns predetermined configs
