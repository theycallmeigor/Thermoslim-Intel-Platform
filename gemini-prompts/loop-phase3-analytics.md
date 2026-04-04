# Phase 3: Loop Subscriptions Analytics Audit

## Your Role

You are the research and knowledge enrichment engine for the ThermoSlim Commerce Intelligence Platform. You research, document, and organize — you do not write code. Your task is to produce a complete audit of every metric, chart, and dashboard that Loop Subscriptions shows to merchants.

## Context

Phase 1 crawled 161 help articles from Loop's help center. The analytics section contains 6 articles describing Loop's analytics dashboards. This phase documents every metric in detail so ThermoSlim can later replicate or improve upon these analytics. Your output feeds Phase 4 (integration spec).

**Parallelism note:** This phase can run in parallel with Phase 2 (API research). There are no cross-dependencies — both depend only on Phase 1 output.

## Input

Read these files before starting:

**From Phase 1 crawl (critical — read first):**
- `docs/integrations/loop-subscriptions/knowledge-base/04-analytics/` — all 6 analytics articles
- `docs/integrations/loop-subscriptions/knowledge-base/_INDEX.md` — full article index

**Also read for additional analytics context:**
- `docs/integrations/loop-subscriptions/knowledge-base/09-retain/` — retention metrics
- `docs/integrations/loop-subscriptions/knowledge-base/05-campaigns/` — campaign performance metrics
- `docs/integrations/loop-subscriptions/knowledge-base/13-manage-subscriptions/` — read all files, especially any related to activity logging

## Instructions

### Step 1: Deep-Read Analytics Articles

Read all 6 analytics articles thoroughly. These are the primary source:

1. **Subscriber Analytics** — subscriber growth, behavior, churn, revenue
2. **Cohort Analytics** — long-term retention, churn by cohort
3. **Payment Analytics V1** — payment success, recovery, failures
4. **Payment Analytics V2** — updated payment analytics
5. **Cancellation Analytics** — churn reasons, trends, timing
6. **Reports** — exportable reports

### Step 2: Re-Fetch for Full Detail

Re-fetch each analytics article URL directly for maximum detail:
- https://help.loopwork.co/en/articles/12741639-subscriber-analytics
- https://help.loopwork.co/en/articles/12741718-cohort-analytics
- https://help.loopwork.co/en/articles/12741921-payment-analytics-v1
- https://help.loopwork.co/en/articles/12742113-cancellation-analytics
- https://help.loopwork.co/en/articles/12742177-reports
- https://help.loopwork.co/en/articles/13653525-payment-analytics-v2

Pay special attention to:
- Screenshots or descriptions of dashboard layouts
- Exact metric names as displayed in the UI
- Filter options and dimension breakdowns
- Chart types and visualization choices
- Time range selectors

### Step 3: Web Search for Additional Analytics Details

Search for:
- `Loop Subscriptions analytics dashboard`
- `Loop Subscriptions cohort analysis`
- `Loop Subscriptions MRR tracking`
- `Loop Subscriptions churn analytics`
- `Loop Subscriptions payment recovery analytics`
- `Loop Subscriptions vs Recharge analytics` (comparison articles often reveal features)

### Step 4: Produce analytics-audit.md

Save to `docs/integrations/loop-subscriptions/analytics-audit.md`:

```markdown
---
title: Loop Subscriptions Analytics Audit
source: Phase 3 research
created: 2026-03-30
---

# Loop Subscriptions Analytics Audit

## Overview

{Summary of Loop's analytics offering — how many dashboard pages, general philosophy}

---

## 1. Subscriber Analytics

### Summary
{What this page shows, who it's for}

### Metrics

| Metric Name | Definition | Chart Type | Dimensions/Filters | Time Ranges |
|-------------|-----------|------------|--------------------:|-------------|
| Active Subscribers | ... | Number card | ... | ... |
| New Subscribers | ... | Line chart | ... | ... |
| Churned Subscribers | ... | ... | ... | ... |
| Net Subscriber Growth | ... | ... | ... | ... |
| Subscriber Revenue | ... | ... | ... | ... |
| MRR | ... | ... | ... | ... |
| ... | ... | ... | ... | ... |

### Layout Description
{How the page is organized — cards at top, charts below, tables at bottom, etc.}

### Filters Available
{Date range picker, product filter, plan filter, etc.}

### Drill-Down Capabilities
{Can you click into a metric to see details? What detail views exist?}

---

## 2. Cohort Analytics

### Summary
{What this page shows — cohort retention grids, etc.}

### Metrics

| Metric Name | Definition | Chart Type | Dimensions/Filters | Time Ranges |
|-------------|-----------|------------|--------------------:|-------------|
| ... | ... | Cohort grid | ... | ... |

### Cohort Configuration
{What defines a cohort — subscription start month? First order date?}
{What is measured — retention rate? Revenue? Order count?}
{Cohort grid structure — rows = cohorts, columns = periods}

### Layout Description
{Page organization}

---

## 3. Payment Analytics V1

### Summary
{What this page shows}

### Metrics
{Same table format}

### Recovery Metrics
{Specifically: retry success rate, recovery rate, dunning performance}

---

## 4. Payment Analytics V2

### Summary
{What changed from V1? What's new?}

### Metrics
{Same table format — note which are new vs carried from V1}

### Differences from V1
{Explicit comparison}

---

## 5. Cancellation Analytics

### Summary
{What this page shows}

### Metrics
{Same table format}

### Cancellation Reasons
{What reason categories exist? Are they configurable?}

### Cancellation Timing
{When do subscribers cancel — by billing cycle, by day of week, by tenure?}

### Win-Back Metrics
{Any metrics on reactivation or save rates from cancellation flows?}

---

## 6. Reports

### Summary
{What exportable reports are available}

### Report Types
| Report Name | Contents | Format | Filters |
|-------------|----------|--------|---------|
| ... | ... | CSV/Excel | ... |

---

## Cross-Dashboard Summary

### All Unique Metrics (Master List)

| # | Metric | Dashboard | Type | Definition |
|---|--------|-----------|------|-----------|
| 1 | Active Subscribers | Subscriber Analytics | Count | ... |
| 2 | MRR | Subscriber Analytics | Currency | ... |
| ... | ... | ... | ... | ... |

{Complete deduplicated list of every metric across all dashboards}

### Chart Types Used
| Chart Type | Where Used | Example |
|-----------|-----------|---------|
| Line chart | Subscriber growth over time | ... |
| Cohort grid | Retention by signup month | ... |
| Bar chart | ... | ... |
| Number card | ... | ... |
| ... | ... | ... |

### Common Filters
{Filters that appear across multiple dashboards}

### Data Freshness
{How often analytics update — real-time, daily, etc.}
```

### Step 5: Obsidian Sync

Copy `analytics-audit.md` to `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/adapters/loop/analytics-audit.md`

Add YAML frontmatter:
```yaml
---
tags: [adapter/loop, domain/analytics, reference]
created: 2026-03-30
status: draft
related:
  - "[[Loop Subscriptions Adapter]]"
  - "[[Dashboard Module]]"
  - "[[Snapshot Engine]]"
---
```

## Output Checklist

Before finishing, verify:

- [ ] `analytics-audit.md` exists at the project path
- [ ] All 6 analytics pages are documented (Subscriber, Cohort, Payment V1, Payment V2, Cancellation, Reports)
- [ ] Every metric has: name, definition, chart type, dimensions
- [ ] Cross-Dashboard Summary section has deduplicated master metric list
- [ ] Layout descriptions are included for each page
- [ ] Obsidian copy exists with correct frontmatter
- [ ] Report final count: "{X} unique metrics documented across {Y} dashboard pages"

## Quality Checks

- Use exact metric names as displayed in Loop's UI — don't paraphrase
- Distinguish between metrics you confirmed from documentation vs. inferred from screenshots/descriptions
- If a metric's calculation formula isn't documented, note "calculation not documented" rather than guessing
- Note any metrics that seem to overlap with ThermoSlim's existing DailySnapshot fields (revenue, order count, subscriber count)
