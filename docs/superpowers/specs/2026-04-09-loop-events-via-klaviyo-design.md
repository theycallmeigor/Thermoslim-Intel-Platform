# Design Spec: Loop Subscription Events via Klaviyo

**Date:** 2026-04-09
**Status:** Approved (rev 2 — post-review fixes)
**Approach:** Hybrid — Events API for lifecycle + profiles for enrichment

## Problem

Loop Subscriptions pushes ~25 event types to Klaviyo (cancellations, pauses, billing failures, etc.), but ThermoSlim only reads Klaviyo **profile properties** (aggregate snapshots like `$loop_active_subscriber`). This means:

- MRR Waterfall is missing pause/resume movements
- Churn page has no Loop-sourced pause events or cancel reasons
- Cohorts treats paused subscriptions as active (inflates retention)
- Forecast churn rate excludes pauses
- SubscriptionEvent table has no `source` field — can't distinguish Loop vs CC events
- `cancelReason` is never populated from Loop

## Solution Overview

1. **New `syncLoopEvents()` function** — queries Klaviyo Events API for `loop_*` metrics, maps to SubscriptionEvent rows
2. **Simplify `syncSubscriberProfiles()`** — remove status-change inference, keep only field enrichment
3. **Schema additions** — `klaviyoEventId` + `source` on SubscriptionEvent, `SyncCursor` model, `LOOP` added to `Source` enum
4. **Page fixes** — MRR, Churn, Cohorts, Forecast, Dashboard to consume Loop events properly

## Schema Changes

### Add `LOOP` to `Source` enum

```prisma
enum Source {
  SHOPIFY
  CHECKOUTCHAMP
  MERGED
  LOOP          // NEW — Loop subscription lifecycle events via Klaviyo
}
```

**Rationale:** Using `SHOPIFY` for Loop events is semantically misleading. `LOOP` makes queries explicit: `source = 'LOOP'` means Loop subscription events, `source = 'SHOPIFY'` means Shopify order-derived data. Dashboard source filters will show Loop as a distinct option.

### Add to `SubscriptionEvent`

```prisma
model SubscriptionEvent {
  // ... existing fields ...
  klaviyoEventId   String?   @unique   // Dedup key for Klaviyo-sourced events
  source           Source?              // LOOP, CHECKOUTCHAMP, or SHOPIFY
}
```

### Add `SyncCursor` model

```prisma
model SyncCursor {
  id        String   @id @default(uuid())
  key       String   @unique          // e.g. "klaviyo-loop-events"
  cursor    String                    // ISO 8601 datetime of last processed event
  updatedAt DateTime @updatedAt
}
```

### Migration notes

- `klaviyoEventId` is nullable (existing events don't have one)
- `source` is nullable (backfill existing events separately if needed)
- `LOOP` added to Source enum — additive, no data loss
- All changes are additive — no breaking changes

## Event Sync Service: `syncLoopEvents()`

### Location

Add to `src/services/sync-klaviyo.ts`. If the file exceeds 400 lines after adding, extract to `src/services/sync-loop-events.ts` and import into the main sync.

### Flow

**Step 0 — Resolve Loop metric IDs (cached)**

The Klaviyo Events API can only filter by `metric_id`, not metric name. We must first discover which metric IDs correspond to `loop_*` event types.

1. Call `GET /api/metrics` to fetch all metrics in the account
2. Filter to metrics whose `name` starts with `loop_`
3. Build a map: `{ metricId → metricName }` (e.g., `{ "abc123" → "loop_subscription_cancelled" }`)
4. Cache this map in memory for the duration of the sync run (metrics are stable, rarely change)

**Step 1 — Read cursor**

Read cursor from `SyncCursor` table (key: `"klaviyo-loop-events"`). The cursor stores an ISO 8601 datetime of the last successfully processed event.

**Step 2 — Fetch events per metric**

For each `loop_*` metric ID from Step 0:
```
GET /api/events?filter=equals(metric_id,'{metricId}'),greater-or-equal(datetime,{cursorDatetime})&sort=datetime
```
Paginate through all results. This avoids fetching unrelated events (email opens, clicks, etc.) and stays within rate limits.

Collect all events across metrics, then sort by `datetime` ascending for consistent cursor advancement.

**Step 3 — Process events**

For each event (sorted by datetime):
   a. Extract customer email from event profile
   b. Look up customer → find their SHOPIFY-source subscription(s)
   c. Map metric name → `SubscriptionEventType` (see mapping table)
   d. Skip if `klaviyoEventId` already exists (dedup via unique constraint)
   e. Create `SubscriptionEvent` with `source: 'LOOP'`, real `occurredAt`
   f. Update parent `Subscription` fields if status-changing event

**Step 4 — Save cursor atomically**

Use `prisma.$transaction()` to write events and update cursor in a single transaction. The cursor advances to the datetime of the last successfully processed event. If the transaction fails, neither events nor cursor are written — safe to retry.

**Dedup safety:** The `klaviyoEventId` unique constraint means events with the same Klaviyo event ID that fall in the datetime overlap window are safely skipped on re-fetch.

### Event Mapping

| Klaviyo Metric | SubscriptionEventType | Subscription Update |
|---|---|---|
| `loop_subscription_started` | CREATED | status → ACTIVE |
| `loop_order_processed` | BILLED | lastBilledAt, currentBillingCycle++ |
| `loop_billing_attempt_failed` | DECLINED | declineReason from payload |
| `loop_billing_attempt_failed_and_will_be_retried` | DECLINED | declineReason, metadata.willRetry=true |
| `loop_billing_attempt_failed_and_last_retry_left` | DECLINED | declineReason, metadata.lastRetry=true |
| `loop_subscription_cancelled` | CANCELLED | status → CANCELLED, cancelledAt, cancelReason |
| `loop_subscription_paused` | PAUSED | status → PAUSED |
| `loop_subscription_resumed` | RESUMED | status → ACTIVE |
| `loop_subscription_reactivated` | REACTIVATED | status → ACTIVE |
| `loop_subscription_expired` | EXPIRED | status → CANCELLED, cancelledAt, cancelReason → "Subscription expired" |
| `loop_order_skipped` | SKIPPED | (no status change) |

### Mapped but non-status events (update Subscription fields, no status change)

| Klaviyo Metric | Action | Subscription Update |
|---|---|---|
| `loop_subscription_rescheduled` | Update next bill date | nextBillDate from payload |
| `loop_subscription_delayed` | Update next bill date | nextBillDate from payload |

These events are stored as SubscriptionEvent rows (eventType closest match, full payload in `metadata`) AND update `Subscription.nextBillDate`. This is important because after simplifying the profile sync, events become the authoritative source for schedule changes.

### Unmapped events (store in metadata for future use)

- `loop_upcoming_order` — could power "upcoming renewals" dashboard
- `loop_payment_method_expiring` — could power payment alerts
- `loop_subscription_lines_changed` — could track product swaps
- `loop_order_unskipped` — reversal of skip

These are stored as SubscriptionEvent rows with full payload in `metadata` JSON. They don't update Subscription fields.

### Subscription Matching

When a Loop event arrives for a customer email:
1. Find customer by email. **If customer not found** → create a minimal Customer row from event profile data (email, klaviyoProfileId from event's profile relationship). This handles the edge case where a new subscriber's event arrives before profile sync has run.
2. Find SHOPIFY-source subscription(s) for that customer
3. If single subscription → direct match
4. If multiple subscriptions → match by product from event payload (Loop events include line item data — variant name, SKU)
5. If no subscription match → write `IngestionError` row (`source: 'LOOP'`, `errorType: 'UNMATCHED_LOOP_EVENT'`, payload with klaviyoEventId, email, metric name). This makes gaps visible in the Operations Health page rather than silently dropping critical events like cancellations.

### Error Handling

- Wrap each event processing in try/catch — one bad event doesn't stop the sync
- Log errors with event ID and customer email for debugging
- On API failure → cursor stays at last committed position (atomic transaction ensures this)
- Unmatched events → `IngestionError` row (not just a log line)

## Profile Sync Simplification

### Remove from `syncSubscriberProfiles()`

- Lines 234-287: status inference from `$loop_active_subscriber` boolean
- All `SubscriptionEvent.create()` calls within profile sync
- The `cancelledAt = new Date()` approximation

### Keep in `syncSubscriberProfiles()`

- Customer upsert (email, klaviyoProfileId, name, phone)
- `nextBillDate` ← `$loop_next_billing_date`
- `currentBillingCycle` ← `$loop_processed_order_count`

### Rationale

Events API provides real timestamps and reasons. Profile sync was approximating these with "noticed at sync time" timestamps and boolean inference. The Events API is authoritative.

## Integration into Existing Cron

`syncKlaviyo()` currently runs: campaigns → flows → profiles (sequential).

New order: campaigns + flows (parallel) → profiles → **loop events** (sequential after profiles, since profiles create/update customer records that events reference).

```typescript
export async function syncKlaviyo() {
  const [campaigns, flows] = await Promise.all([
    syncCampaigns(),
    syncFlows(),
  ]);
  const profiles = await syncSubscriberProfiles();
  const loopEvents = await syncLoopEvents();  // NEW
  return { campaigns, flows, profiles, loopEvents };
}
```

## Page Fixes

### MRR Waterfall (`mrr/page.tsx`)

**Current:** Queries SubscriptionEvent for CREATED, CANCELLED, REACTIVATED, RESUMED.
**Change:** Include PAUSED in downside movements. When source filter is active, filter events by `source` field.

### Churn (`churn/page.tsx`)

**Current:** 7 Prisma queries for cancellations and pauses.
**Change:**
- Trend chart: include PAUSED/RESUMED event counts (from SubscriptionEvent, not just Subscription.status)
- Cancel reasons: read from `SubscriptionEvent.metadata` where `cancelReason` is available
- Already has milestone chart using `billingCycleNumber` — works as-is once events have cycle data

### Cohorts (`cohorts/page.tsx`)

**Current:** Groups subscriptions by start month, counts active vs cancelled for retention.
**Change:** Count PAUSED subscriptions as churned for retention calculation. Use SubscriptionEvent `occurredAt` for exact churn timing instead of relying solely on `cancelledAt`.

### Forecast (`forecast/page.tsx`)

**Current:** Calculates churn rate from 90-day CANCELLED events only.
**Change:** Include PAUSED events in churn rate calculation (paused subscriptions are revenue-negative).

### Dashboard Home (`dashboard/page.tsx`)

**Current:** SubscriberActivityChart consumes all event types.
**Change:** No functional change needed — the chart will automatically show Loop events once they're in SubscriptionEvent table. Consider adding source badge to distinguish Loop vs CC in the subscriber movement table if present.

### No Changes Needed

- **Frequency** — queries Subscription table directly, already source-filtered
- **Customer Detail** — shows current snapshot, enriched by profile sync

## Backfill Strategy

First run (no cursor exists):
- Fetch Loop events from last **90 days** (configurable via env var `LOOP_EVENTS_BACKFILL_DAYS`, default 90)
- Use `p-limit(5)` for batched DB writes
- Log progress every 100 events
- `klaviyoEventId` unique constraint makes re-runs safe (duplicates skipped)

Subsequent runs:
- Cursor-based — only fetches events after last cursor position
- Typical volume: 10-50 events per hour for ~100 active subscriptions

## Out of Scope (YAGNI)

- Direct Loop API adapter (blocked on credentials)
- Loop webhooks for real-time sync (cron is sufficient)
- DailySnapshot pause rate aggregation (future enhancement)
- Alert rules for subscription events (alerts engine not shipped)
- New dashboard pages
- `source` backfill for existing SubscriptionEvent rows

## Testing

- Unit tests for event mapping function (metric name → SubscriptionEventType)
- Unit tests for subscription matching logic (single vs multi-sub customers)
- Integration test: mock Klaviyo Events API response → verify SubscriptionEvent rows created
- Manual verification: run sync → check MRR Waterfall shows Loop events

## Files Modified

| File | Change Type | Description |
|---|---|---|
| `prisma/schema.prisma` | Schema | Add klaviyoEventId, source to SubscriptionEvent; add SyncCursor model |
| `prisma/migrations/...` | Migration | New migration for schema changes |
| `src/services/sync-klaviyo.ts` | Modify | Add syncLoopEvents(), simplify syncSubscriberProfiles() |
| `app/(dashboard)/subscriptions/mrr/page.tsx` | Modify | Add PAUSED to movements, source filter on events |
| `app/(dashboard)/subscriptions/churn/page.tsx` | Modify | Use SubscriptionEvent for trends, show cancel reasons |
| `app/(dashboard)/subscriptions/cohorts/page.tsx` | Modify | Count paused as churned, use event timestamps |
| `app/(dashboard)/analytics/forecast/page.tsx` | Modify | Include paused in churn rate |
| `src/services/__tests__/sync-loop-events.test.ts` | New | Tests for event mapping and matching |
| `app/(dashboard)/subscriptions/mrr/error.tsx` | New | Error boundary (Guard 4) |
| `app/(dashboard)/subscriptions/churn/error.tsx` | New | Error boundary (Guard 4) |
| `app/(dashboard)/subscriptions/cohorts/error.tsx` | New | Error boundary (Guard 4) |
| `app/(dashboard)/analytics/forecast/error.tsx` | New | Error boundary (Guard 4) |

**Note on Guard 1:** Existing subscription pages query Prisma inline. This spec does not refactor them to services — that's separate tech debt. New query patterns added by this spec follow the same inline pattern for consistency within each file.
