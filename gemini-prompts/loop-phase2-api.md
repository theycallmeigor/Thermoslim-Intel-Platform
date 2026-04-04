# Phase 2: Loop Subscriptions API & Data Model Research

## Your Role

You are the research and knowledge enrichment engine for the ThermoSlim Commerce Intelligence Platform. You research, document, and organize — you do not write code. Your task is to produce a complete API reference, webhook catalog, data model map, and subscription lifecycle diagram for Loop Subscriptions.

## Context

Phase 1 crawled 161 help articles from Loop's help center. You now have the raw documentation. This phase extracts and organizes the technical details needed for building a Loop adapter in ThermoSlim. Your output feeds Phase 4 (integration spec).

**Parallelism note:** This phase can run in parallel with Phase 3 (analytics audit). There are no cross-dependencies — both depend only on Phase 1 output.

## Input

Read these files before starting:

**From Phase 1 crawl (critical — read first):**
- `docs/integrations/loop-subscriptions/knowledge-base/02-developer-hub/` — all files (API docs, webhooks)
- `docs/integrations/loop-subscriptions/knowledge-base/_INDEX.md` — full article index

**Also read for context:**
- `docs/integrations/loop-subscriptions/knowledge-base/06-acquire/` — selling plans, subscription models
- `docs/integrations/loop-subscriptions/knowledge-base/09-retain/` — cancellation flows, payment recovery
- `docs/integrations/loop-subscriptions/knowledge-base/13-manage-subscriptions/` — subscription management
- `docs/integrations/loop-subscriptions/knowledge-base/14-settings/` — configuration options

## Instructions

### Step 1: Extract API Details from Crawled Docs

Read all Developer Hub articles. Extract every API endpoint, authentication detail, and example payload mentioned.

### Step 2: Web Search for Additional API Documentation

Search for:
- `Loop Subscriptions API documentation`
- `Loop Subscriptions REST API reference`
- `loopwork.co API endpoints`
- `Loop Subscriptions Shopify subscription contract API`
- `Loop Subscriptions webhook events list`
- `Loop Subscriptions developer docs`
- `site:loopwork.co API`
- `Loop Subscriptions GraphQL` (check if they expose GraphQL)

Follow any external documentation links found in the Developer Hub articles.

### Step 3: Produce api-reference.md

Save to `docs/integrations/loop-subscriptions/api-reference.md`:

```markdown
---
title: Loop Subscriptions API Reference
source: Phase 2 research
created: 2026-03-30
---

# Loop Subscriptions API Reference

## Authentication
{How to authenticate — API key, OAuth, Shopify app token, etc.}
{Where to get credentials}
{Header format}

## Base URL
{API base URL}

## Admin API Endpoints

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /... | List subscriptions |
| GET | /... | Get subscription by ID |
| PUT | /... | Update subscription |
| ... | ... | ... |

{For each endpoint: request params, request body shape, response shape, example}

### Customers
{Same format}

### Orders / Billing Attempts
{Same format}

### Selling Plans
{Same format}

## Storefront API Endpoints
{If Loop exposes storefront-facing APIs}

## Rate Limits
{Documented rate limits, retry strategies}

## Pagination
{How pagination works — cursor, page number, etc.}

## Error Handling
{Error response format, common error codes}
```

### Step 4: Produce webhook-catalog.md

Save to `docs/integrations/loop-subscriptions/webhook-catalog.md`:

```markdown
---
title: Loop Subscriptions Webhook Catalog
source: Phase 2 research
created: 2026-03-30
---

# Loop Subscriptions Webhook Catalog

## Webhook Configuration
{How to set up webhooks in Loop — admin UI, API, etc.}
{Delivery method — HTTP POST, headers, signature verification}

## Event Types

### Subscription Events
| Event | Trigger | Description |
|-------|---------|-------------|
| subscription.created | New subscription starts | ... |
| subscription.updated | Subscription modified | ... |
| subscription.cancelled | Customer/merchant cancels | ... |
| subscription.paused | Subscription paused | ... |
| subscription.resumed | Subscription resumed | ... |
| ... | ... | ... |

### Billing Events
| Event | Trigger | Description |
|-------|---------|-------------|
| billing_attempt.success | Payment succeeds | ... |
| billing_attempt.failed | Payment fails | ... |
| ... | ... | ... |

### Order Events
| Event | Trigger | Description |
|-------|---------|-------------|
| ... | ... | ... |

## Payload Structures

### subscription.created
```json
{example payload or documented fields}
```

{Repeat for each event type}

## ThermoSlim Mapping Preview

| Loop Event | → ThermoSlim SubscriptionEventType | Notes |
|------------|-------------------------------------|-------|
| subscription.created | CREATED | |
| billing_attempt.success | BILLED | |
| billing_attempt.failed | DECLINED | |
| subscription.cancelled | CANCELLED | |
| subscription.paused | PAUSED | |
| subscription.resumed | RESUMED | |
| ... | ... | |

**ThermoSlim SubscriptionEventType values:** Read current values from `prisma/schema.prisma` (enum `SubscriptionEventType`)
```

### Step 5: Produce data-model.md

Save to `docs/integrations/loop-subscriptions/data-model.md`:

```markdown
---
title: Loop Subscriptions Data Model
source: Phase 2 research
created: 2026-03-30
---

# Loop Subscriptions Data Model

## Core Objects

### Subscription (Contract)
{Fields, types, descriptions}
{Relationship to Shopify SubscriptionContract}

### Selling Plan
{Fields, types, descriptions}
{Relationship to Shopify SellingPlanGroup}

### Billing Policy
{Interval, anchor date, min/max cycles}

### Delivery Policy
{Interval, anchor date, delivery method}

### Billing Attempt
{Payment processing, success/failure, retry logic}

### Customer
{How Loop identifies customers — Shopify customer ID}

### Order
{How Loop creates Shopify orders for subscription renewals}

## Object Relationships

```
SellingPlan ──1:M──> Subscription
Subscription ──1:M──> BillingAttempt
Subscription ──1:M──> Order (renewals)
Subscription ──M:1──> Customer
Subscription ──M:M──> Product (via line items)
```

## Key IDs and Cross-References

| Loop ID | Shopify Equivalent | Description |
|---------|-------------------|-------------|
| Loop subscription ID | Shopify SubscriptionContract ID | ... |
| Loop selling plan ID | Shopify SellingPlan ID | ... |
| ... | ... | ... |

## Shopify Native Integration

{How Loop leverages Shopify's subscription APIs vs. what it manages independently}
{Does Loop use Shopify's SubscriptionContract API or its own storage?}
{How does this affect data we receive via webhooks vs. Shopify's own webhooks?}
```

### Step 6: Produce subscription-lifecycle.md

Save to `docs/integrations/loop-subscriptions/subscription-lifecycle.md`:

```markdown
---
title: Loop Subscriptions Lifecycle
source: Phase 2 research
created: 2026-03-30
---

# Loop Subscription Lifecycle

## Status States

| Status | Description | Entry Conditions |
|--------|-------------|-----------------|
| ACTIVE | ... | ... |
| PAUSED | ... | ... |
| CANCELLED | ... | ... |
| EXPIRED | ... | ... |
| FAILED | ... | ... |
| ... | ... | ... |

## State Machine

```
                    ┌─────────┐
          ┌────────>│  ACTIVE  │<────────┐
          │         └────┬────┘         │
          │              │              │
     [resume]      [pause]  [fail]  [reactivate]
          │              │       │      │
          │         ┌────▼────┐  │  ┌───┴─────┐
          └─────────│  PAUSED │  └─>│ FAILED  │
                    └─────────┘     └────┬────┘
                         │               │
                    [cancel]         [cancel]
                         │               │
                    ┌────▼───────────────▼┐
                    │     CANCELLED       │
                    └─────────────────────┘
```

{Refine this diagram based on actual Loop documentation}

## Transition Triggers

| From | To | Trigger | Who Can Trigger |
|------|----|---------|-----------------|
| — | ACTIVE | New subscription created | Customer (checkout) |
| ACTIVE | PAUSED | Customer pauses | Customer, Merchant, Auto |
| ACTIVE | CANCELLED | Customer cancels | Customer, Merchant |
| ACTIVE | FAILED | Payment fails all retries | System |
| PAUSED | ACTIVE | Customer resumes | Customer, Merchant |
| FAILED | ACTIVE | Payment recovered | Customer, System |
| ... | ... | ... | ... |

## Payment Recovery Flow

{How Loop handles failed payments — retry schedule, dunning, backup payment methods}

## Cancellation Flow

{Cancellation reasons, offers, win-back — from the Retain docs}

## ThermoSlim Status Mapping

| Loop Status | → ThermoSlim SubscriptionStatus | Notes |
|-------------|----------------------------------|-------|
| ACTIVE | ACTIVE | Direct map |
| PAUSED | PAUSED | Direct map |
| CANCELLED | CANCELLED | Direct map |
| FAILED | RECYCLE_BILLING or RECYCLE_FAILED | Depends on retry state |
| EXPIRED | COMPLETE | Completed all cycles |
| ... | ... | ... |

**ThermoSlim SubscriptionStatus values:** Read current values from `prisma/schema.prisma` (enum `SubscriptionStatus`)
```

### Step 7: Obsidian Sync

Copy these files to `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/adapters/loop/`:

1. `api-reference.md`
2. `webhook-catalog.md`
3. `subscription-lifecycle.md`

Add YAML frontmatter to each Obsidian copy:
```yaml
---
tags: [adapter/loop, domain/subscriptions, reference]
created: 2026-03-30
status: draft
related:
  - "[[Loop Subscriptions Adapter]]"
  - "[[Unified Schema]]"
  - "[[Ingestion Pipeline]]"
---
```

Convert plain markdown links to `[[wikilinks]]` where they reference other vault files.

## Output Checklist

Before finishing, verify:

- [ ] `api-reference.md` exists with endpoint details (even if some are "NOT DOCUMENTED")
- [ ] `webhook-catalog.md` exists with event types and payload structures
- [ ] `data-model.md` exists with object relationships and ID cross-references
- [ ] `subscription-lifecycle.md` exists with state machine and status mapping
- [ ] Each file has YAML frontmatter
- [ ] ThermoSlim mapping preview tables are included in webhook-catalog.md and subscription-lifecycle.md
- [ ] Obsidian copies exist at the specified path with vault frontmatter
- [ ] Any information gaps are explicitly marked as "NOT FOUND — requires direct API exploration"

## Quality Checks

- Distinguish between "confirmed from documentation" and "inferred from context" — mark inferences
- If Loop uses Shopify's native subscription APIs, note which data comes from Loop vs. Shopify
- Preserve exact field names and JSON keys from API examples — these are needed for adapter field mapping
- Note API version numbers where visible
