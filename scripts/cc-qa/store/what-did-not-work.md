# CC QA Engine — What Did NOT Work

A record of every approach that failed, produced junk data, or was misleading.
Keep this file updated as new dead ends are discovered.

---

## 1. Counting abandoned checkouts as payment failures

**What we did**: Treated all PARTIAL orders as failures, including those with `paySource=unknown/null`.

**Why it was wrong**: `paySource=unknown` means the customer never submitted payment — it's an abandoned checkout, not a payment failure. This inflated the "fail rate" from ~3% (real) to ~31% (fake).

**Impact**:
- 28 fake streaks detected (all driven by paySource=unknown)
- `paySource=unknown` confirmed 100x as "chronic pattern" — completely false
- Baseline fail rate of 31% — should have been 3%
- 31 polluted training findings exported
- All learnings and baselines contaminated

**Fix**: Added `isAbandon` flag — `paySource=unknown/null + PARTIAL = abandon`. Excluded from `failRate`, tracked separately as `abandonRate`.

**Lesson**: Always validate what your "failure" classification actually means in the domain. Database status codes don't tell the whole story.

---

## 2. hasUpsells=true as a "protective factor"

**What we did**: The researcher flagged `hasUpsells=true → 0% failure rate` as a HIGH significance correlation (0.0x baseline lift).

**Why it was wrong**: Upsells are POST-PURCHASE — shown after the initial transaction succeeds. `hasUpsells=true` doesn't prevent failure, it proves the order already succeeded. Classic survivorship bias.

**Impact**: Would have been exported to training as a "protective pattern", teaching the anomaly detector that upsells prevent failures.

**Fix**: Filtered out `hasUpsells=true` from correlation analysis as a known survivorship-bias dimension.

**Lesson**: Post-purchase signals can't be used to predict purchase outcomes. Check the temporal ordering of your features.

---

## 3. ccOrderType=RECURRING as a "protective factor"

**What we did**: Researcher flagged `ccOrderType=RECURRING → 0% failure rate` as HIGH significance.

**Why it was wrong**: Same survivorship bias. Recurring charges only fire for customers who already have a valid payment method on file. They're not "protected" — they're a pre-selected population.

**Impact**: Would have trained the anomaly detector to think recurring orders are safer (they are, but for the wrong reason).

**Fix**: Filtered out alongside hasUpsells.

**Lesson**: Selection bias in your training dimensions will produce technically-correct but causally-wrong correlations.

---

## 4. EMA alpha=0.3 on sparse data

**What we did**: Used exponential moving average with alpha=0.3 to update learned baselines.

**Why it was wrong**: With only 25 real failures over 6 months, each data point shifted the baseline by 30%. When the researcher re-ran the engine across enrichment layers (3 rounds), the baseline compounded: each round re-processed the same streaks and moved the baseline further. PREPAID baseline drifted to 58.4% instead of staying near 100% (its true burst rate).

**Impact**: Baselines became unreliable — too much drift from too little data.

**Fix**: Lowered to alpha=0.1. Each observation shifts baseline by only 10%, so re-runs barely move it.

**Lesson**: High alpha EMA + low data volume + re-processing loops = compounding drift. Use lower alpha for sparse data.

---

## 5. exportAfter=3 confirmations for low-volume stores

**What we did**: Required 3 confirmations before exporting a pattern to training.

**Why it was wrong**: At ~2 declines/month, waiting for 3 confirmations means 6+ weeks before the training system learns anything. By then the pattern may have changed.

**Impact**: PREPAID pattern (clearly real after first observation) waited unnecessarily.

**Fix**: Changed to exportAfter=1 for immediate export. Low-volume stores can't afford to wait.

**Lesson**: Confirmation thresholds should scale with data volume. High-volume store → wait for 5+. Low-volume → export early, correct later.

---

## 6. streakStartThreshold=25% with minOrdersPerHour=2

**What we did**: Original config required ≥2 orders/hour AND ≥25% fail rate to start a streak.

**Why it was wrong**: Most hours in this low-volume store have 1 order. Combined with 25% threshold, effectively requires 1 of 4 orders to fail in the same hour — extremely rare.

**Impact**: With minOrd=2 + startT=25%, score dropped from 71.4 to ~15.5 (26pt loss). With minH=3, score dropped to 0 — zero streaks detected.

**Fix**: minOrd=1, startT=15%, minH=1. Simulator showed `minStreakHours` has 53.9pt sensitivity — the single most impactful parameter.

**Lesson**: One-size-fits-all thresholds don't work. Low-volume stores need aggressive detection settings.

---

## 7. Rolling window strategies vs full-backlog (for this dataset)

**What we did**: Simulator tested rolling-week (30 rounds), rolling-month (8 rounds), incremental-day (127 rounds) against full-backlog (1 round).

**Why they were equivalent**: All strategies produced identical detection results (17 streaks, 96% coverage). The extra rounds from rolling/incremental added no new information.

**Why full-backlog won**: Same output, 1 round vs 127. Rolling strategies add value when patterns change over time (concept drift), but this dataset is too small and uniform for that to matter.

**Impact**: No harm, but wasted compute if used in production at this scale.

**Lesson**: Don't add complexity (rolling windows) until you have data that benefits from it. Full-backlog is the optimal strategy for stores under ~5000 active orders.

---

## 8. Attribution/UTM fields had zero signal

**What we did**: Enrichment Layer 2 (utmSource, utmMedium, utmCampaign, userAgent, httpReferer, pubId, subAffId) produced zero correlations with failures.

**Why**: Payment declines are random relative to traffic source. A declined credit card has nothing to do with whether the customer came from Google or Facebook.

**Impact**: Wasted an enrichment round + database queries for 1275 orders × 7 fields.

**Lesson**: Attribution dimensions are useful for conversion analysis, not payment failure analysis. Don't include them in failure-focused enrichment.

---

## 9. Order item fields had zero signal

**What we did**: Enrichment Layer 3 (itemPrice, itemQuantity, recurringStatus, billingCycle, productCategory, sku) produced zero correlations.

**Why**: Product characteristics don't predict card declines. A $99.95 product isn't more likely to decline than a $44.95 one (in this dataset).

**Impact**: Same wasted round as attribution.

**Lesson**: Item-level enrichment is useful for refund/chargeback analysis, not payment failure analysis.

---

## 10. streakStartThreshold doesn't matter much (1.2pt spread)

**What we did**: Tested 15%, 25%, 40%, 50% start thresholds.

**Why they were nearly equal**: With failures at 100% rate (single declined orders), any threshold below 100% catches them. The 1.2pt difference was only from the two 25%-rate streaks at the margin.

**Lesson**: When failures are binary (0% or 100% at hourly granularity), the start threshold barely matters. It will matter more at higher volume when fail rates are continuous (e.g., 15%, 22%, 31%).

---

## Summary of Parameter Sensitivity

| Parameter | Score Spread | Verdict |
|---|---|---|
| `minStreakHours` | **53.9 pts** | CRITICAL — must be 1 for low-volume |
| `minOrdersPerHour` | **26.2 pts** | CRITICAL — must be 1 for low-volume |
| `streakStartThreshold` | 1.2 pts | Doesn't matter much at current volume |
| `exportAfter` | 1.0 pts | Minor — export=1 slightly better |
| `emaAlpha` | 0.0 pts | Doesn't matter for detection, but 0.1 better for baseline stability |
| `strategy` | 0.0 pts | All equivalent — use full-backlog for simplicity |
