# Loop Subscriptions Research System — Design Spec

**Date:** 2026-03-30
**Status:** Approved
**Executor:** Gemini CLI (multi-phase)
**Goal:** Produce a complete knowledge base of Loop Subscriptions for integration into ThermoSlim, including help doc scraping, API/data model research, analytics audit, and integration spec.

---

## Approach

**Multi-phase pipeline with persistent knowledge base.** Four Gemini CLI sessions, each with a standalone prompt file. Each phase builds on prior phase outputs. All outputs are saved to both project docs (implementation context) and Obsidian vault (long-term retrieval).

---

## Storage Structure

### Project Side

```
docs/integrations/loop-subscriptions/
├── knowledge-base/
│   ├── 01-getting-started/
│   ├── 02-developer-hub/
│   ├── 03-migration/
│   ├── 04-analytics/
│   ├── 05-campaigns/
│   ├── 06-acquire/
│   ├── 07-bundles/
│   ├── 08-grow/
│   ├── 09-retain/
│   ├── 10-experiments/
│   ├── 11-integrations/
│   ├── 12-customer-portal/
│   ├── 13-manage-subscriptions/
│   ├── 14-settings/
│   ├── 15-faq/
│   ├── _INDEX.md
│   └── _CRAWL_LOG.md
├── api-reference.md
├── webhook-catalog.md
├── data-model.md
├── subscription-lifecycle.md
├── analytics-audit.md
└── integration-spec.md
```

### Obsidian Side

```
CROMaxLabs/thermoslim-platform/adapters/
├── Loop Subscriptions Adapter.md        # High-level summary with wikilinks
└── loop/
    ├── api-reference.md
    ├── webhook-catalog.md
    ├── subscription-lifecycle.md
    ├── analytics-audit.md
    └── integration-decision.md
```

Obsidian files include YAML frontmatter (`tags`, `created`, `status`, `related`) and `[[wikilinks]]` for internal references.

---

## Phase 1: Help Doc Crawl

**Prompt file:** `gemini-prompts/loop-phase1-crawl.md`
**Input:** Loop help center at `https://help.loopwork.co/en/`
**Output:** 161 articles as individual markdown files + `_INDEX.md` + `_CRAWL_LOG.md`

### Instructions for Gemini

1. Fetch the help center homepage to get all 15 collection URLs
2. For each collection, fetch the collection page to get all article URLs within it
3. Fetch each article and extract: title, content body (stripped of navigation chrome), any code snippets, any external links (especially API docs)
4. Save each article as `{article-slug}.md` (slug from URL) in the corresponding numbered category folder
5. Each article file starts with YAML frontmatter: `title`, `source_url`, `collection`, `scraped_at`
6. Build `_INDEX.md` listing every article: `| Category | Title | Filename | One-line summary |`
7. Log any failed fetches to `_CRAWL_LOG.md` with URL and error

### Priority Order (fetch these first)

1. `02-developer-hub/` — API docs, webhooks (3 articles) — **critical for integration**
2. `04-analytics/` — analytics metrics (6 articles) — **critical for analytics audit**
3. `09-retain/` — cancellation flows, payment recovery (18 articles) — **subscription lifecycle**
4. `06-acquire/` — selling plans, subscription models (19 articles) — **data model understanding**
5. `13-manage-subscriptions/` — subscription management (10 articles)
6. `12-customer-portal/` — customer actions (19 articles)
7. Everything else

### Obsidian Sync

After crawl completes, copy `_INDEX.md` to `CROMaxLabs/thermoslim-platform/adapters/loop/_INDEX.md` with wikilink formatting.

### Article Counts by Collection

| # | Collection | Expected Articles |
|---|-----------|-------------------|
| 01 | Getting Started | 3 |
| 02 | Developer Hub | 3 |
| 03 | Migration | 11 |
| 04 | Analytics | 6 |
| 05 | Campaigns | 4 |
| 06 | Acquire | 19 |
| 07 | Bundles | 8 |
| 08 | Grow | 2 |
| 09 | Retain | 18 |
| 10 | Experiments | 1 |
| 11 | Integrations | 40 |
| 12 | Customer Portal | 19 |
| 13 | Manage Subscriptions | 10 |
| 14 | Settings | 12 |
| 15 | FAQ | 15 |
| **Total** | | **161** |

---

## Phase 2: API & Data Model Research

**Prompt file:** `gemini-prompts/loop-phase2-api.md`
**Input:** Phase 1 crawled docs (especially `02-developer-hub/`), web search
**Output:** `api-reference.md`, `webhook-catalog.md`, `data-model.md`, `subscription-lifecycle.md`

### Instructions for Gemini

1. Read all files from `docs/integrations/loop-subscriptions/knowledge-base/02-developer-hub/`
2. Follow any external API documentation links found in those articles
3. Web-search for: `Loop Subscriptions API documentation`, `Loop Subscriptions webhook events`, `loopwork API reference`, `Loop Subscriptions Shopify subscription contract`
4. Produce these deliverables:

#### api-reference.md
- All REST endpoints (Admin API + Storefront API)
- Authentication method (API key, OAuth, Shopify token?)
- Request/response shapes for key endpoints (list subscriptions, get subscription, update subscription, create billing attempt)
- Rate limits if documented
- Pagination approach

#### webhook-catalog.md
- Every webhook event type Loop can fire
- Payload structure for each event (JSON shapes)
- When each event fires (trigger conditions)
- Mapping table: `Loop event → closest ThermoSlim SubscriptionEventType`

#### data-model.md
- Loop's core objects: Subscription (contract), SellingPlan, BillingPolicy, DeliveryPolicy, Customer, Order
- Relationships between objects
- How Loop maps to Shopify's native subscription APIs (SubscriptionContract, SellingPlanGroup)
- Key IDs and how they cross-reference (Loop subscription ID ↔ Shopify contract ID ↔ Shopify order ID)

#### subscription-lifecycle.md
- State machine: all possible subscription statuses and transitions
- What triggers each transition (customer action, payment event, merchant action, automated flow)
- ASCII diagram of the lifecycle
- Mapping table: `Loop status → ThermoSlim SubscriptionStatus`

### Obsidian Sync

Copy `api-reference.md`, `webhook-catalog.md`, `subscription-lifecycle.md` to `CROMaxLabs/thermoslim-platform/adapters/loop/` with YAML frontmatter:
```yaml
---
tags: [adapter/loop, domain/subscriptions, reference]
created: 2026-03-30
status: draft
related:
  - "[[Loop Subscriptions Adapter]]"
  - "[[Unified Schema]]"
---
```

---

## Phase 3: Analytics Audit

**Prompt file:** `gemini-prompts/loop-phase3-analytics.md`
**Input:** Phase 1 crawled docs (especially `04-analytics/`), Loop help center analytics pages
**Output:** `analytics-audit.md`

### Instructions for Gemini

1. Read all files from `docs/integrations/loop-subscriptions/knowledge-base/04-analytics/`
2. Re-fetch each of the 6 analytics articles for full detail (images, chart descriptions)
3. For each analytics dashboard page, document:

#### Per Dashboard Page
- **Page name** (e.g., "Subscriber Analytics", "Cohort Analytics")
- **Metrics shown** — list every metric with:
  - Metric name as displayed
  - Definition / how it's calculated (if stated or inferable)
  - Chart type (line, bar, table, cohort grid, number card, etc.)
  - Available filters and dimensions
  - Time range options
- **Layout description** — how metrics are arranged on the page
- **Key interactions** — drill-downs, exports, filter combinations

#### Analytics Pages to Audit

1. **Subscriber Analytics** — subscriber growth, behavior, churn, revenue
2. **Cohort Analytics** — long-term retention, churn by cohort, subscriber behavior
3. **Payment Analytics V1** — payment success, recovery performance, failure trends
4. **Payment Analytics V2** — updated version of payment analytics
5. **Cancellation Analytics** — churn reasons, trends, timing
6. **Reports** — exportable reports, metrics covered

### Obsidian Sync

Copy `analytics-audit.md` to `CROMaxLabs/thermoslim-platform/adapters/loop/analytics-audit.md` with frontmatter:
```yaml
---
tags: [adapter/loop, domain/analytics, reference]
created: 2026-03-30
status: draft
related:
  - "[[Loop Subscriptions Adapter]]"
  - "[[Dashboard Module]]"
---
```

---

## Phase 4: Integration Spec

**Prompt file:** `gemini-prompts/loop-phase4-spec.md`
**Input:** All Phase 1-3 outputs + ThermoSlim architecture knowledge base
**Output:** `integration-spec.md` + Obsidian decision record

### ThermoSlim Architecture Input (from Obsidian)

Read these files from `CROMaxLabs/thermoslim-platform/` before writing the spec:

**Architecture (read all):**
- `_INDEX.md` — master entry point
- `architecture/System Overview.md`
- `architecture/Adapter Pattern.md`
- `architecture/Unified Schema.md`
- `architecture/Ingestion Pipeline.md`
- `architecture/Order Merge Strategy.md`
- `architecture/Product Mapping.md`
- `architecture/Snapshot Engine.md`
- `architecture/File Interaction Map.md`
- `architecture/Change Impact Guide.md`
- `architecture/Cross-Cutting Connections.md`
- `architecture/Scaling Roadmap.md`

**Decisions (read all):**
- `decisions/ADR-001 Adapter Pattern.md`
- `decisions/ADR-002 Shopify as Product Master.md`
- `decisions/ADR-003 Email-Based Customer Dedup.md`
- `decisions/ADR-004 Order Merge at Ingestion.md`
- `decisions/ADR-005 Hybrid Sync Strategy.md`
- `decisions/ADR-006 Daily Snapshots.md`
- `decisions/ADR-007 Money as Cents.md`
- `decisions/ADR-008 Scaling Assessment Before New Sources.md`

**Existing adapters:**
- `adapters/Shopify Adapter.md`
- `adapters/CheckoutChamp Adapter.md`

**Modules:**
- `modules/Dashboard Module.md`
- `modules/Order QA Module.md`

**Lessons:**
- `lessons/Gotchas.md`
- `lessons/Pain Points.md`
- `lessons/Future Risk Areas.md`

### Instructions for Gemini

1. Read ALL Phase 1-3 outputs from `docs/integrations/loop-subscriptions/`
2. Read ALL ThermoSlim architecture docs listed above
3. Produce `integration-spec.md` covering:

#### Webhook → NormalizedRecord Mapping
- For each Loop webhook event: which `NormalizedRecord` type it produces (`order`, `subscription`, `customer`, `event`)
- Field-by-field mapping from Loop payload → ThermoSlim schema fields
- Which fields are new (not in current schema) and need additions

#### Status Mapping
- `Loop subscription status → ThermoSlim SubscriptionStatus` (complete mapping table)
- `Loop webhook event → ThermoSlim SubscriptionEventType` (complete mapping table)
- Gap analysis: any Loop states/events that don't map to existing enums

#### Product Linking Strategy
- Loop uses Shopify product IDs natively — how this maps to existing `ProductMap.shopifyProductId`
- Selling plan ↔ product mapping considerations
- Frequency derivation from Loop selling plan intervals

#### Deduplication Strategy
- Loop subscription orders are Shopify orders — how to avoid double-counting with existing Shopify adapter
- Should Loop orders create new Order records or enrich existing Shopify orders?
- Recommended merge strategy (reference ADR-004 pattern)

#### Schema Changes
- New fields needed on existing tables
- New tables needed (if any)
- New enum values needed

#### Analytics Feasibility
- For each metric from the Phase 3 analytics audit: can we compute it from existing data model? What additional data is needed?
- Which metrics are already covered by DailySnapshot?
- Which metrics need new snapshot fields or new tables?

### Obsidian Sync

1. Copy `integration-spec.md` to project docs
2. Write `CROMaxLabs/thermoslim-platform/adapters/loop/integration-decision.md` — a decision record summarizing: why Loop, key architectural choices, risks identified
3. Write `CROMaxLabs/thermoslim-platform/adapters/Loop Subscriptions Adapter.md` — high-level adapter summary with wikilinks to all loop/ subdocs

---

## Gemini Prompt Conventions

All 4 prompt files follow this structure:

```markdown
# Phase N: [Title]

## Your Role
You are the research and knowledge enrichment engine for the ThermoSlim Commerce Intelligence Platform. You research, document, and organize — you do not write code.

## Context
[What this phase does, what prior phases produced]

## Input
[Exact file paths to read before starting]

## Instructions
[Step-by-step numbered list]

## Output Checklist
[Expected deliverables with exact file paths — self-validate before finishing]

## Obsidian Sync
[Which files to copy to Obsidian, with frontmatter template]

## Quality Checks
- [ ] All expected files created
- [ ] _INDEX.md updated
- [ ] Obsidian copies include YAML frontmatter and wikilinks
- [ ] No placeholder content — every section has real data or explicit "NOT FOUND" marker
```

---

## Execution Order

```
Phase 1 (crawl) → Phase 2 (API research) → Phase 3 (analytics) → Phase 4 (integration spec)
         ↓                    ↓                      ↓                        ↓
   161 MD files      4 reference docs         analytics-audit.md      integration-spec.md
   + _INDEX.md       + status mappings        + metric catalog        + schema changes
   + _CRAWL_LOG      + lifecycle diagram       + dashboard layouts     + dedup strategy
```

Phases 2 and 3 can run in parallel (both depend only on Phase 1). Phase 4 depends on all three.

---

## Success Criteria

1. All 161 help articles scraped and categorized (±5 tolerance for articles added/removed)
2. Complete API endpoint and webhook event catalog
3. Every Loop analytics metric documented with definition and chart type
4. Integration spec maps every Loop data point to ThermoSlim schema
5. All outputs saved to both project docs and Obsidian with correct formatting
6. No code written — research and documentation only
7. Integration spec includes operational feasibility assessment (rate limits, sync volume)

## Post-Review Fixes (2026-03-30)

Applied after spec review:
- Phase 1: Added JS-rendering fallback for Intercom help center + collection drift handling
- Phase 2: Replaced hardcoded enum values with `prisma/schema.prisma` read instructions
- Phase 2 & 3: Added parallelism notes to context sections
- Phase 3: Replaced hardcoded `activity-logs.md` filename with directory glob
- Phase 4: Added CLAUDE.md and prisma/schema.prisma to input file list
- Phase 4: Added handleWebhook optionality note and valid NormalizedRecord types
- Phase 4: Added Section 9 (Operational Feasibility) for ADR-008 compliance
