# Subscription Dashboard Presentation Fixes
**Created:** 2026-03-30
**Priority:** Medium
**Context:** Align our subscription dashboards with how Loop presents the same analytics

---

## Background

Loop Subscriptions (our subscription platform) has well-documented analytics dashboards. After comparing their visual approach to ours, we identified 3 pages with meaningful presentation gaps. All fixes use data already in the database — no new adapter or schema work needed.

---

## Tasks

### 1. Churn Analytics — Add Order-Milestone Cancellation Chart
**File:** `app/(dashboard)/subscriptions/churn/page.tsx`
**Status:** TODO

Loop's most actionable churn visual is a bar chart showing *when in the subscription lifecycle* customers cancel — after cycle 1, cycle 2, cycle 3, etc. We don't have this at all.

**What to build:**
- Query `Subscription` groupBy `currentBillingCycle` where `status = CANCELLED` and `cancelledAt` in period
- Render as `BarChart` (Recharts) with billing cycle on X-axis, count on Y-axis
- Add to the existing churn page as a third panel below the trend + reasons charts
- Label it: "Cancellations by Billing Cycle"

**Data source:** `prisma.subscription.groupBy({ by: ['currentBillingCycle'], where: { status: 'CANCELLED', cancelledAt: { gte, lte } }, _count: { id: true } })`

**New component needed:** `app/(dashboard)/subscriptions/churn/CancelByMilestoneChart.tsx`

---

### 2. Churn Analytics — Switch Trend from Raw Counts to Churn Rate %
**File:** `app/(dashboard)/subscriptions/churn/ChurnTrendChart.tsx` + `page.tsx`
**Status:** TODO

Currently our trend chart shows raw daily cancelled/paused counts. Loop shows churn **rate** (%) over time, which is comparable across periods regardless of subscriber base size.

**What to change:**
- In `page.tsx`: fetch `activeSubs` count at each point in time, or approximate using the period's active sub count as denominator
- Pass `churnRate` field in `ChurnDay` type (cancelled / activeSubs * 100)
- Update `ChurnTrendChart` to show rate on Y-axis with `%` tick formatter
- Keep raw count as tooltip detail

**Simpler approximation acceptable:** divide each day's cancel count by total active subs at period start — same denominator Loop uses.

---

### 3. Cohort Retention — Add Retention Curves Line Chart
**File:** `app/(dashboard)/subscriptions/cohorts/page.tsx`
**Status:** TODO

We have the retention heatmap table (good). Loop also shows retention **curves** — each cohort plotted as a separate line over months, so you can visually compare cohort shapes without reading numbers.

**What to build:**
- Use the same cohort data already computed in `page.tsx`
- Transform into Recharts `LineChart` format: X = month (M0–M6), one `Line` per cohort
- Place above or below the existing heatmap table
- Each line labeled with cohort month (e.g. "Jan 2026")
- Y-axis: 0–100%, X-axis: M0–M6

**New component needed:** `app/(dashboard)/subscriptions/cohorts/RetentionCurvesChart.tsx`

---

### 4. Cohort Retention — Add LTV and Revenue Columns to Heatmap
**File:** `app/(dashboard)/subscriptions/cohorts/page.tsx`
**Status:** TODO

Loop's cohort table has additional columns beyond retention %: avg subscriber LTV, revenue realized, avg orders placed. Ours only has retention %.

**What to add:**
- Fetch `recurringPrice` on each subscription in the cohort query
- Compute per-cohort: `avgLtv` (avg cumulative revenue per sub = recurringPrice × currentBillingCycle), `totalRevenue` (sum of all billing revenue for cohort)
- Add 2 columns to the heatmap table: **Avg LTV** and **Total Revenue**
- Format with `fmt$` / `fmtK`

**Schema fields needed:** `Subscription.recurringPrice`, `Subscription.currentBillingCycle` (already selected in other pages, just add to cohort query)

---

## Out of Scope (requires Loop adapter first)
- Recovery funnel analytics (first attempt → recovery cycle → subsequent cycles) — needs Loop billing attempt data
- 0-day churn tracking — needs Loop subscription start + first billing outcome
- Save metrics (cancel flow offer accepted/declined rate) — needs Loop retention flow data
- Retention curves beyond 6 months — data will exist once Loop backfill runs

---

## Notes
- All 4 tasks are independent — can be done in any order
- Tasks 1 and 3 require new client chart components; tasks 2 and 4 are modifications to existing files
- No schema changes, no new Prisma models, no migration needed
