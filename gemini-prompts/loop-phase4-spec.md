# Phase 4: Loop Subscriptions Integration Spec

## Your Role

You are the research and knowledge enrichment engine for the ThermoSlim Commerce Intelligence Platform. You research, document, and organize — you do not write code. Your task is to produce the definitive integration specification that maps Loop Subscriptions data to ThermoSlim's existing architecture.

## Context

Phases 1-3 have produced:
- Phase 1: Complete knowledge base of Loop's 161 help articles
- Phase 2: API reference, webhook catalog, data model, subscription lifecycle
- Phase 3: Complete analytics audit with every metric documented

This phase synthesizes everything into an actionable integration spec. Claude Code will use this spec to implement the Loop adapter.

## Input

### Phase 1-3 Outputs (read all)

```
docs/integrations/loop-subscriptions/
├── knowledge-base/_INDEX.md
├── api-reference.md
├── webhook-catalog.md
├── data-model.md
├── subscription-lifecycle.md
└── analytics-audit.md
```

### ThermoSlim Architecture (from Obsidian — read all)

**Master entry point:**
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/_INDEX.md`

**Architecture docs (read every file):**
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/architecture/System Overview.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/architecture/Adapter Pattern.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/architecture/Unified Schema.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/architecture/Ingestion Pipeline.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/architecture/Order Merge Strategy.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/architecture/Product Mapping.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/architecture/Snapshot Engine.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/architecture/File Interaction Map.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/architecture/Change Impact Guide.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/architecture/Cross-Cutting Connections.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/architecture/Scaling Roadmap.md`

**Architectural Decision Records (read all):**
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/decisions/ADR-001 Adapter Pattern.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/decisions/ADR-002 Shopify as Product Master.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/decisions/ADR-003 Email-Based Customer Dedup.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/decisions/ADR-004 Order Merge at Ingestion.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/decisions/ADR-005 Hybrid Sync Strategy.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/decisions/ADR-006 Daily Snapshots.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/decisions/ADR-007 Money as Cents.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/decisions/ADR-008 Scaling Assessment Before New Sources.md`

**Existing adapter docs:**
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/adapters/Shopify Adapter.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/adapters/CheckoutChamp Adapter.md`

**Module docs:**
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/modules/Dashboard Module.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/modules/Order QA Module.md`

**Lessons (important for avoiding known pitfalls):**
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/lessons/Gotchas.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/lessons/Pain Points.md`
- `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/lessons/Future Risk Areas.md`

**Canonical project rules (MUST READ — contains revenue definition and coding conventions):**
- `/Users/igordviniatin/Documents/thermoslim-platform/CLAUDE.md`

**Database schema (read for current enum values and table structure):**
- `/Users/igordviniatin/Documents/thermoslim-platform/prisma/schema.prisma`

## Instructions

### Step 1: Read Everything

Read ALL Phase 1-3 outputs and ALL ThermoSlim architecture docs listed above. Do not skip any file — the integration spec must be informed by the full context.

### Step 2: Produce integration-spec.md

Save to `docs/integrations/loop-subscriptions/integration-spec.md`:

```markdown
---
title: Loop Subscriptions Integration Spec for ThermoSlim
source: Phase 4 synthesis
created: 2026-03-30
depends_on:
  - api-reference.md
  - webhook-catalog.md
  - data-model.md
  - subscription-lifecycle.md
  - analytics-audit.md
---

# Loop Subscriptions Integration Spec

## Executive Summary

{2-3 paragraphs: what Loop is, why we're integrating it, key architectural considerations, expected outcome}

---

## 1. Adapter Design

### Adapter Interface Implementation

The Loop adapter implements `IAdapter` from `src/core/types/adapter.ts`:

| Method | Loop Implementation |
|--------|-------------------|
| `connect()` | {How to authenticate with Loop API} |
| `sync()` | {What data to pull on scheduled sync — subscriptions, billing attempts, etc.} |
| `mapToSchema()` | {How Loop data maps to NormalizedRecord types} |
| `handleWebhook()` | {Which webhook events to listen for} |
| `disconnect()` | {Cleanup} |

> **Note:** `handleWebhook` is optional in `IAdapter`. For Loop, it SHOULD be implemented since webhooks are the primary real-time data path.

> **Valid NormalizedRecord types:** `order`, `customer`, `subscription`, `product`, `event`. Map all Loop data to these types only — do not invent new types.

### Sync Strategy

{Reference ADR-005 Hybrid Sync Strategy}
{Webhook events for real-time + scheduled sync for safety net}
{What's the recommended sync interval?}
{What data does Loop make available via API pull vs. webhook only?}

---

## 2. Webhook → NormalizedRecord Mapping

### Subscription Events

| Loop Webhook Event | NormalizedRecord Type | Key Fields Mapped |
|-------------------|----------------------|-------------------|
| subscription.created | subscription | {list fields} |
| subscription.updated | subscription | {list fields} |
| subscription.cancelled | subscription + event | {list fields} |
| subscription.paused | subscription + event | {list fields} |
| ... | ... | ... |

### Billing Events

| Loop Webhook Event | NormalizedRecord Type | Key Fields Mapped |
|-------------------|----------------------|-------------------|
| billing_attempt.success | order + event | {list fields} |
| billing_attempt.failed | event | {list fields} |
| ... | ... | ... |

### Field-by-Field Mapping

For each NormalizedRecord type, provide the complete field mapping:

#### Subscription Record
| Loop Field | → ThermoSlim Field | Type | Notes |
|-----------|-------------------|------|-------|
| id | loopSubscriptionId (NEW) | string | Loop's internal ID |
| shopify_subscription_contract_id | shopifyContractId (NEW) | string | Shopify native ID |
| status | status | SubscriptionStatus | Via status mapping table |
| customer.email | customer.email | string | Join key (ADR-003) |
| ... | ... | ... | ... |

#### Order Record (from billing success)
| Loop Field | → ThermoSlim Field | Type | Notes |
|-----------|-------------------|------|-------|
| ... | ... | ... | ... |

---

## 3. Status Mapping

### Subscription Status

| Loop Status | → ThermoSlim SubscriptionStatus | Confidence | Notes |
|-------------|----------------------------------|-----------|-------|
| ACTIVE | ACTIVE | High | Direct map |
| PAUSED | PAUSED | High | Direct map |
| CANCELLED | CANCELLED | High | Direct map |
| {each Loop status} | ... | ... | ... |

### Gap Analysis
{Any Loop statuses that don't map to existing ThermoSlim enums}
{Recommended: add new enum values or map to closest existing?}

### Event Type Mapping

| Loop Event | → ThermoSlim SubscriptionEventType | Confidence | Notes |
|------------|-------------------------------------|-----------|-------|
| subscription.created | CREATED | High | |
| billing_attempt.success | BILLED | High | |
| billing_attempt.failed | DECLINED | High | |
| subscription.cancelled | CANCELLED | High | |
| subscription.paused | PAUSED | High | |
| subscription.resumed | RESUMED | High | |
| {each Loop event} | ... | ... | ... |

### Gap Analysis
{Any Loop events that don't map to existing ThermoSlim event types}

---

## 4. Product Linking Strategy

### How Loop References Products

{Loop uses Shopify product IDs natively — explain the chain}

### Mapping to ProductMap

| Loop Field | → ProductMap Field | Notes |
|-----------|-------------------|-------|
| product.shopify_product_id | shopifyProductId | Direct match — Shopify is product master (ADR-002) |
| product.shopify_variant_id | shopifyVariantId | Direct match |
| selling_plan.interval | frequency | Derive: "1_MONTH", "3_MONTH", etc. |
| ... | ... | ... |

### Frequency Derivation

{How to convert Loop's selling plan interval (e.g., "30 days", "1 month", "3 months") to ThermoSlim's frequency format ("1_MONTH", "3_MONTH", "6_MONTH")}

### New Products

{What happens if Loop references a product not yet in ProductMap? Strategy: auto-create from Shopify sync, or queue for manual mapping?}

---

## 5. Deduplication Strategy

### The Core Challenge

Loop subscription orders ARE Shopify orders. The existing Shopify adapter already ingests these orders. Without dedup, every Loop renewal would be counted twice.

### Recommended Strategy

{Reference ADR-004 Order Merge at Ingestion}

Option A: Loop as enrichment source (recommended?)
- Shopify adapter continues to be the order source of truth
- Loop adapter only creates/updates Subscription records and SubscriptionEvents
- Loop billing_attempt.success enriches the existing Shopify order with subscription metadata
- No new Order records from Loop — only subscription lifecycle data

Option B: Loop as order source for subscription orders
- Loop adapter creates orders for renewals, Shopify adapter skips subscription orders
- Requires detecting "this is a subscription order" in the Shopify adapter to avoid it

Option C: Merge strategy (like CC)
- Both create orders, merge at ingestion (like CheckoutChamp)
- More complex but proven pattern

{Recommend one option with rationale}

### Revenue Impact

{How does each option affect the revenue definition: Order.totalPrice where source IN ('SHOPIFY', 'MERGED') and status = 'COMPLETE'?}
{Will Loop orders need to be excluded like CHECKOUTCHAMP orders are?}

---

## 6. Schema Changes

### New Fields on Existing Tables

#### Subscription table
| Field | Type | Description |
|-------|------|-------------|
| loopSubscriptionId | String? | Loop's internal subscription ID |
| shopifyContractId | String? | Shopify SubscriptionContract ID |
| loopSellingPlanId | String? | Loop selling plan ID |
| {any others} | ... | ... |

#### Order table
| Field | Type | Description |
|-------|------|-------------|
| {if any new fields needed} | ... | ... |

### New Tables (if any)

{Only if Loop data doesn't fit existing schema}

### New Enum Values (if any)

#### SubscriptionStatus
| New Value | Reason |
|-----------|--------|
| {if any} | {mapped from Loop status that doesn't exist} |

#### SubscriptionEventType
| New Value | Reason |
|-----------|--------|
| {if any} | {mapped from Loop event that doesn't exist} |

### Migration Plan

{Prisma migration steps needed}
{Any backfill required for existing subscriptions?}

---

## 7. Analytics Feasibility

### Metric Replication Assessment

For each metric from the analytics audit:

| Loop Metric | Can Compute Now? | Data Source | Missing Data | Effort |
|------------|-----------------|-------------|-------------|--------|
| Active Subscribers | Yes | Subscription table | — | Low |
| MRR | Yes | Subscription.recurringPrice | — | Low |
| Cohort Retention | Partial | SubscriptionEvent | Need cohort grouping | Medium |
| Payment Recovery Rate | Yes | SubscriptionEvent (BILLED/DECLINED) | — | Low |
| Cancellation Reasons | No | Not captured | Need new field | Medium |
| ... | ... | ... | ... | ... |

### Already Covered by DailySnapshot

{Which Loop analytics metrics are already computed by the Snapshot Engine?}

### Needs New Snapshot Fields

{Which metrics would need new columns in DailySnapshot?}

### Needs New Tables

{Any metrics that need dedicated storage beyond DailySnapshot?}

---

## 8. Risks and Gotchas

{Reference lessons/Gotchas.md and lessons/Future Risk Areas.md}

### Known Risks

1. **Double-counting** — {dedup risk and mitigation}
2. **Webhook reliability** — {what happens if Loop webhooks are delayed or missed?}
3. **Shopify overlap** — {Loop events that also fire Shopify webhooks — need to handle both}
4. **Schema evolution** — {Loop is actively developing — how to handle API/webhook changes}
5. ...

### Open Questions

{Things that need to be resolved before implementation — ideally with a suggestion for each}

---

## 9. Operational Feasibility

{Reference ADR-008 Scaling Assessment Before New Sources}

### API Rate Limits

| Operation | Rate Limit | Our Expected Volume | Feasible? |
|-----------|-----------|-------------------|-----------|
| List subscriptions | {from api-reference.md} | {estimate based on store size} | ... |
| Webhook delivery | {from webhook-catalog.md} | {estimate based on subscription volume} | ... |
| ... | ... | ... | ... |

### Sync Volume Assessment

{Given ThermoSlim's current sync patterns (15min orders, hourly products), can Loop's API support this?}
{What's the recommended sync interval for Loop?}
{Are there bulk/batch endpoints to reduce API calls?}

### Infrastructure Impact

{Additional Redis queue load from Loop webhooks}
{Database write volume from subscription events}
{Any concerns from the Scaling Roadmap doc?}
```

### Step 3: Produce Obsidian Decision Record

Save to `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/adapters/loop/integration-decision.md`:

```markdown
---
title: Loop Subscriptions Integration Decision
tags: [adapter/loop, decision, domain/subscriptions]
created: 2026-03-30
status: draft
related:
  - "[[Loop Subscriptions Adapter]]"
  - "[[ADR-001 Adapter Pattern]]"
  - "[[ADR-002 Shopify as Product Master]]"
  - "[[ADR-004 Order Merge at Ingestion]]"
---

# Loop Subscriptions Integration Decision

## Why Loop?
{Why integrate Loop Subscriptions into ThermoSlim}

## Key Architectural Choices
{Summary of the major decisions from the integration spec}

## Risks Identified
{Top 3-5 risks}

## Dependencies
{What must exist before Loop adapter can be built — reference ADR-008 Scaling Assessment}
```

### Step 4: Produce Obsidian Adapter Summary

Save to `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/adapters/Loop Subscriptions Adapter.md`:

```markdown
---
title: Loop Subscriptions Adapter
tags: [adapter/loop, thermoslim, domain/subscriptions]
created: 2026-03-30
status: planned
related:
  - "[[Shopify Adapter]]"
  - "[[CheckoutChamp Adapter]]"
  - "[[Adapter Pattern]]"
  - "[[Unified Schema]]"
---

# Loop Subscriptions Adapter

{High-level summary: what Loop is, what data it provides, how it fits into ThermoSlim}

## Data Provided
- Subscription lifecycle (create, pause, cancel, resume, reactivate)
- Billing attempts (success, failure, recovery)
- Selling plans and pricing
- Customer subscription portal activity

## Key Documents
- [[loop/api-reference|API Reference]]
- [[loop/webhook-catalog|Webhook Catalog]]
- [[loop/subscription-lifecycle|Subscription Lifecycle]]
- [[loop/analytics-audit|Analytics Audit]]
- [[loop/integration-decision|Integration Decision]]
- [[loop/_INDEX|Knowledge Base Index]]

## Status
- [x] Research complete (Phase 1-4)
- [ ] Implementation spec approved
- [ ] Adapter built
- [ ] Webhooks configured
- [ ] Testing complete
- [ ] Production
```

## Output Checklist

Before finishing, verify:

- [ ] `integration-spec.md` exists with all 8 sections filled
- [ ] Every section references the relevant ThermoSlim architecture doc or ADR
- [ ] Status mapping tables are complete (no placeholder rows)
- [ ] Deduplication strategy has a clear recommendation
- [ ] Schema changes section is specific (field names, types, descriptions)
- [ ] Analytics feasibility covers every metric from the Phase 3 audit
- [ ] Risks section references lessons learned from existing adapters
- [ ] Obsidian decision record exists at specified path
- [ ] Obsidian adapter summary exists at specified path
- [ ] All Obsidian files have YAML frontmatter with tags, created, status, related

## Quality Checks

- Cross-reference: every Loop webhook event should appear in both the webhook mapping AND the event type mapping
- Cross-reference: every Loop status should appear in both the status mapping AND the lifecycle transitions
- Ensure the dedup recommendation doesn't break the revenue definition (CLAUDE.md single source of truth rule)
- Ensure product linking leverages ADR-002 (Shopify as Product Master) — Loop products should map through Shopify IDs
- Flag any recommendations that would require changes to existing adapters (Shopify, CC)
- Mark confidence levels: High (documented), Medium (inferred), Low (speculative)
