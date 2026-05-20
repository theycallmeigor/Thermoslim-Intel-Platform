# Loop Subscriptions via Shopify GraphQL — Design Spec

**Date:** 2026-04-07
**Status:** Approved
**Author:** Igor + Claude

## Problem

ThermoSlim's churn, cohort, and frequency dashboard pages are empty because Loop Subscriptions data isn't synced. The original plan required Loop's API + webhooks, but 11 open questions (API URL, auth, HMAC, etc.) block that approach. Loop is a Shopify-native app — every Loop subscription creates a Shopify `SubscriptionContract`, and every renewal creates a native Shopify order. Shopify's Admin GraphQL API already holds the subscription lifecycle data we need.

## Solution

Add a dedicated sync service that queries Shopify's `subscriptionContracts` GraphQL endpoint. Backfill all historical contracts, then sync incrementally every hour. Loop subs flow into the existing Subscription table alongside CC subs. Dashboard pages query both populations together — no page changes required.

## Scope

### In Scope
- Shopify GraphQL `subscriptionContracts` query
- Backfill + incremental sync
- Subscription status, billing cycle, frequency, product link, next bill date
- SubscriptionEvent emission on status transitions
- Dedicated cron route

### Out of Scope (Deferred)
- Loop API / webhooks
- Cancellation reasons, save rates, payment recovery analytics
- Real-time webhook-triggered contract sync
- Any changes to order/revenue flow

## Data Model Changes

### New fields on Subscription

```prisma
model Subscription {
  // ... existing fields ...
  loopSubscriptionId   String?  @unique  // Reserved for future Loop API
  shopifyContractId    String?  @unique  // Shopify SubscriptionContract GID — primary dedup key
  sellingPlanName      String?           // Shopify selling plan name (e.g. "Delivery every 30 days")
}
```

### New SubscriptionEventType values

```prisma
enum SubscriptionEventType {
  // ... existing values ...
  EXPIRED    // natural end — prepaid/gift
  SKIPPED    // order skipped
}
```

### Population Rules
- **Loop subscription:** `shopifyContractId != null AND ccPurchaseId == null`
- **CC subscription:** `ccPurchaseId != null`
- **No overlap.** CC and Loop are separate subscription populations (confirmed by Igor). No cross-system dedup needed.
- **No new Source enum value.** Loop doesn't write orders — the differentiation lives on the Subscription record.

## Shopify GraphQL Prerequisites

### Required App Scope
The Shopify custom app must have the `read_own_subscription_contracts` scope. Verify before implementation:
```bash
# Test with curl — if 403, the scope is missing
curl -X POST "https://{store}.myshopify.com/admin/api/2024-10/graphql.json" \
  -H "X-Shopify-Access-Token: {token}" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ subscriptionContracts(first: 1) { edges { node { id } } } }"}'
```

### GraphQL Endpoint
```
POST https://{store}.myshopify.com/admin/api/2024-10/graphql.json
```
Same access token as REST. Different from the REST base URL already in the adapter — the service constructs this separately.

### Rate Limiting
Shopify GraphQL uses cost-based throttling (not 429 + Retry-After like REST). Each response includes:
```json
{ "extensions": { "cost": { "throttleStatus": { "currentlyAvailable": 990, "maximumAvailable": 1000 } } } }
```
If `currentlyAvailable` drops below 100, sleep until restored. The `subscriptionContracts` query costs ~10-15 points per page of 50.

## GraphQL Query

```graphql
query GetSubscriptionContracts($first: Int!, $after: String, $query: String) {
  subscriptionContracts(first: $first, after: $after, query: $query) {
    edges {
      node {
        id
        status
        createdAt
        updatedAt
        nextBillingDate
        lastPaymentStatus
        customer {
          id
          email
        }
        lines(first: 5) {
          edges {
            node {
              productId
              variantId
              title
              quantity
              currentPrice { amount currencyCode }
              sellingPlanName
            }
          }
        }
        billingPolicy {
          interval
          intervalCount
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

## Sync Behavior

### Backfill (first run)
- Detects no `shopifyContractId` records exist in Subscription table
- Pulls ALL subscription contracts regardless of status (ACTIVE, PAUSED, CANCELLED, EXPIRED)
- Emits `CREATED` SubscriptionEvent with original `createdAt` timestamp (not sync time)
- Populates historical cohort data from day one

### Incremental (subsequent runs)
- Queries with `updated_at:>='${lastSyncTimestamp}'` filter
- `lastSyncTimestamp` = most recent `updatedAt` from existing Loop subscriptions (queried from DB before sync)
- Catches new subscriptions + status changes
- Same upsert logic — idempotent by `shopifyContractId`

### Schedule
- Hourly via dedicated cron route
- Subscription analytics don't need sub-hourly freshness

### Edge Cases — Skip Contracts
- **No lines:** Skip contracts where `lines.edges.length === 0` (draft or errored contracts)
- **No customer email:** Skip contracts where `customer.email` is null/empty (Customer table requires email as @unique)
- **Log skipped contracts** with reason for debugging

## Field Mapping

### Subscription

| GraphQL Field | Subscription Field | Notes |
|---|---|---|
| `node.id` | `shopifyContractId` | GID string, primary dedup key |
| `node.status` | `status` | Mapped via status table below |
| `node.createdAt` | `startedAt` | ISO 8601 → DateTime |
| `node.nextBillingDate` | `nextBillDate` | UTC, display converts to store TZ |
| `node.lastPaymentStatus` | (derived) | `FAILED` → set status to `RECYCLE_BILLING` if currently `ACTIVE` |
| `customer.email` | → Customer lookup | Upsert customer by email if not found |
| `lines[0].currentPrice.amount` | `recurringPrice` | `Math.round(parseFloat(amount) * 100)` — never parseInt |
| `lines[0].productId` | `productMapId` | Lookup via `ProductMap.shopifyProductId` |
| `lines[0].sellingPlanName` | `sellingPlanName` | Human-readable selling plan name |
| `billingPolicy.interval` + `intervalCount` | `frequency` | **CRITICAL:** Format as `"1-month"`, `"3-month"`, `"6-month"` to match CC convention and `toMonthlyMrr()` |
| (derived) | `currentBillingCycle` | Calculate: `monthsSince(createdAt) / intervalCount`, floored. See section below |
| (derived) | `cancelledAt` | Set to sync timestamp on ACTIVE→CANCELLED transition. See section below |
| (null) | `ccPurchaseId` | Always null for Loop subs |
| (null) | `ccClientPurchaseId` | Always null for Loop subs |

### Frequency Format — MUST Match CC Convention

The existing `toMonthlyMrr()` function expects `"1-month"`, `"3-month"`, `"6-month"`. Shopify GraphQL returns `interval: "MONTH"` and `intervalCount: 1`. Normalize:

```typescript
// CORRECT: matches CC format, toMonthlyMrr() works
const frequency = `${intervalCount}-${interval.toLowerCase()}`; // "1-month", "2-week"

// WRONG: toMonthlyMrr() won't match, defaults to dividing by 1
const frequency = `${intervalCount}_${interval}`; // "1_MONTH" — breaks MRR
```

**Note:** `toMonthlyMrr()` currently only handles `1-month`, `3-month`, `6-month`. If Loop has `WEEK` or `DAY` intervals, those will fall through to `?? 1` default. Acceptable for now — flag post-backfill if any non-month frequencies exist.

### Billing Cycle Calculation

Shopify's `SubscriptionContract` doesn't expose a billing cycle count directly. Derive it:

```typescript
const monthsSinceStart = differenceInMonths(new Date(), new Date(createdAt));
const currentBillingCycle = Math.max(1, Math.floor(monthsSinceStart / intervalCount) + 1);
```

This is approximate but sufficient for cohort LTV (`recurringPrice * currentBillingCycle`) and the churn milestone chart. Exact billing history requires Loop's API (deferred).

### cancelledAt Population

Shopify's `SubscriptionContract` doesn't have a `cancelledAt` field. Derive it:
- On status transition `ACTIVE` → `CANCELLED`: set `cancelledAt = new Date()` (sync timestamp)
- On backfill: if contract status is `CANCELLED`, set `cancelledAt = updatedAt` from the GraphQL response (best available approximation)
- The churn page queries `cancelledAt IS NOT NULL` — without this, Loop cancellations are invisible

### Status Mapping

| Shopify Contract Status | ThermoSlim SubscriptionStatus |
|---|---|
| `ACTIVE` | `ACTIVE` |
| `PAUSED` | `PAUSED` |
| `CANCELLED` | `CANCELLED` |
| `EXPIRED` | `COMPLETE` |

### SubscriptionEvent Emission

On each sync, compare current status against stored status:
- New contract → `CREATED` event (with original `createdAt`)
- `ACTIVE` → `CANCELLED` → `CANCELLED` event (set `cancelledAt`)
- `ACTIVE` → `PAUSED` → `PAUSED` event
- `PAUSED` → `ACTIVE` → `RESUMED` event
- `CANCELLED` → `ACTIVE` → `REACTIVATED` event (clear `cancelledAt`)

## Prepaid Subscription Risk

Vault gotcha #4: prepaid subscriptions pay upfront (e.g. 3-month at $149.97). If `currentPrice.amount` is the full prepaid amount and frequency is `"1-month"`, MRR inflates 3x.

**Mitigation for now:** After backfill, run a validation query to flag outlier `recurringPrice` values (>$100/month is suspicious for ThermoSlim's price range). Manual review, not automated correction. Full fix requires Loop API's selling plan attributes (deferred).

## Architecture: Service File, Not Adapter Method

The sync logic lives in a **dedicated service file**, not inside the Shopify adapter. This avoids:
- Guard 7 violation (adapters shouldn't do direct Prisma upserts)
- Growing the Shopify adapter into a god file (409 → 600+ lines)

The service imports the Shopify adapter's credentials and GraphQL helper, but owns the upsert/event logic.

**Decision rationale:** The existing Shopify adapter already violates Guard 7 by importing `runIngestion`. Adding more direct Prisma calls deepens the violation in a different direction. The service pattern keeps sync logic testable and the adapter focused on API communication.

## Files Changed

| File | Change | Lines |
|---|---|---|
| `prisma/schema.prisma` | 3 new fields + 2 enum values | ~10 |
| `src/services/sync-shopify-subscriptions.ts` | Sync logic: GraphQL fetch, upsert, events | ~150 |
| `app/api/cron/sync-shopify-subs/route.ts` | Cron route, CRON_SECRET auth | ~30 |
| `src/adapters/shopify/index.ts` | Export GraphQL helper + credentials for service to use | ~20 |

**4 files. The 4th file (minor adapter export) prevents a Guard 7 deepening and keeps the adapter under 430 lines.**

## Guards Checklist

- [x] Guard 1: No inline Prisma in pages — sync logic in service, not pages
- [x] Guard 2: No god files — adapter stays at ~430 lines, service is ~150 lines
- [x] Guard 3: Service uses adapter credentials, not direct API calls from script
- [x] Guard 5: Batch operations — use `prisma.$transaction()` for bulk upserts
- [x] Guard 7: Adapter exports GraphQL helper; service owns upsert logic
- [x] Guard 8: Auth on API route — CRON_SECRET check in first 5 lines
- [x] Price gotcha: `Math.round(parseFloat())`, never `parseInt`
- [x] Customer gotcha: Upsert by email, don't assume exists
- [x] Frequency gotcha: `"1-month"` format, not `"1_MONTH"`

## Future: Loop API Layer

When ready to add cancellation reasons, save rates, and payment recovery:
1. Build `src/adapters/loop/` per vault plan
2. `loopSubscriptionId` field is already on the schema for Loop's internal ID
3. Loop adapter enriches existing Subscription records (doesn't create new ones)
4. Replaces derived `cancelledAt` with actual cancellation timestamp
5. Replaces derived `currentBillingCycle` with actual billing attempt count
6. Requires answering the 11 open questions with Nico
