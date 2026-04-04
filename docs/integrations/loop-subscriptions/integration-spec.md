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

Loop Subscriptions is a Shopify-native subscription management platform. ThermoSlim customers who subscribe via Loop are checked out through Shopify, and all renewal orders are created as native Shopify orders (Loop calls Shopify's SubscriptionContract API internally). This means ThermoSlim's existing Shopify adapter already captures every Loop-generated order as a `source=SHOPIFY` record — the revenue side of Loop is already flowing into the platform.

What is missing is the **subscription lifecycle layer**: who is subscribed, what their status is, why they churned, how billing attempts are performing, and how retention flows are affecting LTV. This is what the Loop adapter must provide. The integration scope is therefore narrower than CheckoutChamp's — Loop produces `Subscription` and `SubscriptionEvent` records, not `Order` records. This design is safe with respect to the canonical revenue definition (`Order.totalPrice` where `source IN ('SHOPIFY', 'MERGED')`) and requires no changes to the Shopify adapter.

The expected outcome is: (1) accurate subscription lifecycle state in the `Subscription` table, (2) full SubscriptionEvent history for billing, churn, pause/resume analytics, (3) the data foundation needed to replicate Loop's analytics dashboards natively inside ThermoSlim.

---

## 1. Adapter Design

### Adapter Interface Implementation

The Loop adapter implements `IAdapter` from `src/core/types/adapter.ts`. It is a **subscription-only adapter** — it does not write Order records.

| Method | Loop Implementation |
|--------|-------------------|
| `connect()` | Validate API token by calling a lightweight Loop admin endpoint (e.g., `GET /selling-plans`). Token generated in Loop Admin under `Settings > Manage API tokens`. |
| `sync()` | Pull `GET /subscriptions` (paginated), upsert Subscription records, create SubscriptionEvents for any status changes since last sync. Also pull `GET /orders` to audit billing attempt history for backfill. |
| `mapToSchema()` | Loop subscription object → `NormalizedRecord` of type `subscription`. Loop order event → `NormalizedRecord` of type `event`. |
| `handleWebhook()` | Handle all `subscription.*` and `order.*` webhook events → update Subscription status + create SubscriptionEvent. Handle `paymentMethod.*` events → update Subscription metadata. |
| `disconnect()` | No persistent connection; no cleanup needed. |

> **Note:** `handleWebhook` should be implemented and is the primary real-time data path. Webhooks fire immediately on subscription state changes; API pull is the safety net.

> **NormalizedRecord types produced by this adapter:** `subscription` and `event` only. Loop never produces `order`, `customer`, or `product` records — those come from the Shopify adapter.

### Sync Strategy

Per ADR-005 (Hybrid Sync Strategy): webhooks for real-time + scheduled pull as safety net.

- **Webhooks** (primary): All `subscription.*` events provide real-time status changes. `order.processed` and `order.paymentFailed` provide billing outcome events. Register via Loop Admin UI or `POST /webhooks`.
- **Scheduled pull** (safety net): `GET /subscriptions` hourly — slower cadence than orders (15min) because subscription state changes less frequently. This ensures any missed webhook events are caught within an hour.
- **Backfill pull**: On first sync, pull `GET /subscriptions/{id}/orders/history` per subscription to populate historical SubscriptionEvent records.

**Available via API pull vs. webhook only:**
- API pull: Full subscription list with current state, selling plan details, billing history per subscription
- Webhook only (real-time): Payment method events (`paymentMethod.*`), out-of-stock alerts (`subscription.inventoryAction`)
- Either path: Subscription status changes (prefer webhook, pull as backup)

**Loop API v1 was deprecated February 20, 2026.** The adapter must use v2 or `unstable` endpoints. The exact base URL requires direct API exploration before implementation (`NOT FOUND` in documentation — see Section 8, Open Questions).

---

## 2. Webhook → NormalizedRecord Mapping

### Subscription Events

| Loop Webhook Event | NormalizedRecord Type | Key Fields Mapped |
|-------------------|----------------------|-------------------|
| `subscription.created` | `subscription` | id, status=ACTIVE, customerId (via email), productMapId (via shopifyProductId), recurringPrice, frequency, startedAt, nextBillDate, loopSubscriptionId, shopifyContractId |
| `subscription.updated` | `subscription` (update only) | nextBillDate, recurringPrice, lineItems (product changes), loopSellingPlanId — no SubscriptionEvent created |
| `subscription.paused` | `subscription` + `event` | status=PAUSED, eventType=PAUSED |
| `subscription.resumed` | `subscription` + `event` | status=ACTIVE, eventType=RESUMED |
| `subscription.cancelled` | `subscription` + `event` | status=CANCELLED, cancelledAt, cancelReason (from payload), eventType=CANCELLED |
| `subscription.reactivated` | `subscription` + `event` | status=ACTIVE, eventType=REACTIVATED |
| `subscription.delayed` | `subscription` (update only) | nextBillDate updated — no SubscriptionEvent (log in metadata) |
| `subscription.rescheduled` | `subscription` (update only) | nextBillDate updated — no SubscriptionEvent (log in metadata) |
| `subscription.expired` | `subscription` + `event` | status=COMPLETE, eventType=EXPIRED (new — see Section 6) |
| `subscription.inventoryAction` | `subscription` (metadata update) | Store in Subscription.metadata — no status change |

### Billing Events

| Loop Webhook Event | NormalizedRecord Type | Key Fields Mapped |
|-------------------|----------------------|-------------------|
| `order.processed` | `event` | eventType=BILLED, amount (cents), billingCycleNumber, occurredAt. Do NOT create Order record — Shopify adapter handles the order. |
| `order.paymentFailed` | `event` | eventType=DECLINED, declineReason (from payload), occurredAt. Update status=RECYCLE_BILLING if not already. |
| `order.partiallyProcessed` | `event` | eventType=DECLINED (partial), metadata with partial success details |
| `order.upcoming` | No record — discard or log | Pre-billing notification only, no state change |
| `order.skipped` | `event` | eventType=SKIPPED (new — see Section 6), occurredAt |
| `order.unskipped` | `subscription` (update only) | Restore nextBillDate — no new SubscriptionEvent |
| `order.outOfStock` | `event` | eventType=DECLINED, declineReason="out_of_stock" |

### Payment Method Events

| Loop Webhook Event | NormalizedRecord Type | Key Fields Mapped |
|-------------------|----------------------|-------------------|
| `paymentMethod.updated` | `subscription` (metadata update) | Store update timestamp in Subscription.metadata. If subscription was RECYCLE_BILLING, the recovery path may follow shortly (watch for order.processed). |
| `paymentMethod.updateRequested` | No record | Informational only |
| `paymentMethod.expiringSoon` | No record | Could trigger alert in future (not in scope) |

### Field-by-Field Mapping

#### Subscription Record

| Loop Field | → ThermoSlim Field | Type | Notes |
|-----------|-------------------|------|-------|
| `payload.id` | `loopSubscriptionId` (NEW) | String? | Loop's internal subscription ID |
| `payload.shopify_subscription_contract_id` | `shopifyContractId` (NEW) | String? | Shopify SubscriptionContract ID — primary cross-reference |
| `payload.status` | `status` | SubscriptionStatus | Via status mapping table (Section 3) |
| `payload.customer.email` | Customer lookup | String | ADR-003 join key — look up Customer by email |
| `payload.customer.shopifyCustomerId` | `customer.shopifyCustomerId` | String? | Cross-link to Shopify customer record |
| `payload.lineItems[0].price` | `recurringPrice` | Int | Loop sends as decimal string → multiply × 100 for cents (ADR-007) |
| `payload.lineItems[0].sku` / product lookup | `productMapId` | String? | Resolve via `ProductMap.shopifyVariantId` or `shopifyProductId` |
| `payload.nextOrderDate` | `nextBillDate` | DateTime | UTC |
| `payload.createdAt` | `startedAt` | DateTime | UTC |
| `selling_plan.interval` + `intervalCount` | `frequency` | String? | Derived: see Section 4 |
| — | `currentBillingCycle` | Int | Increment on each BILLED event; initialize to 1 |
| `payload.cancelReason` | `cancelReason` | String? | From cancellation flow payload |
| `payload.cancelledAt` | `cancelledAt` | DateTime? | UTC |

#### SubscriptionEvent Record (from billing events)

| Loop Field | → ThermoSlim Field | Type | Notes |
|-----------|-------------------|------|-------|
| subscription lookup | `subscriptionId` | String | FK to Subscription |
| derived from event type | `eventType` | SubscriptionEventType | Via event mapping table (Section 3) |
| previous subscription status | `fromStatus` | SubscriptionStatus? | Read current Subscription.status before update |
| new status after event | `toStatus` | SubscriptionStatus | Derived from event |
| `payload.billingCycleNumber` or derived | `billingCycleNumber` | Int? | Increment counter |
| `payload.amount` → × 100 | `amount` | Int? | Cents (ADR-007) |
| `payload.errorMessage` | `declineReason` | String? | For DECLINED events |
| webhook headers / timestamp | `occurredAt` | DateTime | Use `X-Loop-Webhook-Created-At` header |

---

## 3. Status Mapping

### Subscription Status

| Loop Status | → ThermoSlim SubscriptionStatus | Confidence | Notes |
|-------------|----------------------------------|-----------|-------|
| `ACTIVE` | `ACTIVE` | High | Direct map |
| `PAUSED` | `PAUSED` | High | Direct map — `PAUSED` already exists in enum |
| `CANCELLED` | `CANCELLED` | High | Direct map |
| `FAILED` (in Retain loop) | `RECYCLE_BILLING` | High | Dunning active, retries ongoing |
| `FAILED` (Retain exhausted → system cancels) | `CANCELLED` | High | Loop fires `subscription.cancelled` when dunning exhausts — maps to CANCELLED, not RECYCLE_FAILED |
| `EXPIRED` | `COMPLETE` | High | Fixed-cycle contract completed all billing periods |
| Trial subscription (inferred from selling plan attributes) | `TRIAL` | Medium | Not a native Loop status field — must be inferred from selling plan `trialDays` > 0. Requires API exploration to confirm field name. |

> **Note on RECYCLE_FAILED:** The existing `RECYCLE_FAILED` status means Retain retries fully exhausted. In Loop's model, exhausted dunning leads to `subscription.cancelled` firing (the subscription enters CANCELLED, not a distinct FAILED state). `RECYCLE_FAILED` can be treated as a transient state between `RECYCLE_BILLING` and `CANCELLED` if we want to capture that moment, but Loop does not have a separate status for it.

### Gap Analysis

No new `SubscriptionStatus` enum values are needed. All Loop statuses map cleanly to existing values. `RECYCLE_FAILED` may be unused by Loop (Loop transitions directly to CANCELLED), which is acceptable.

### Event Type Mapping

| Loop Webhook Event | → ThermoSlim SubscriptionEventType | Confidence | Notes |
|------------|-------------------------------------|-----------|-------|
| `subscription.created` | `CREATED` | High | Direct map |
| `order.processed` | `BILLED` | High | Successful billing = subscription billed |
| `order.paymentFailed` | `DECLINED` | High | Failed billing attempt |
| `order.partiallyProcessed` | `DECLINED` | Medium | Treat as decline; metadata captures partial detail |
| `order.outOfStock` | `DECLINED` | Medium | Order failed, mapped to DECLINED with declineReason="out_of_stock" |
| `subscription.cancelled` | `CANCELLED` | High | Direct map |
| `subscription.paused` | `PAUSED` | High | Direct map |
| `subscription.resumed` | `RESUMED` | High | Direct map |
| `subscription.reactivated` | `REACTIVATED` | High | Direct map |
| `subscription.expired` | `EXPIRED` | High | **New enum value required** — see Section 6 |
| `order.skipped` | `SKIPPED` | High | **New enum value required** — see Section 6 |
| `subscription.updated` | *(no event)* | High | Update Subscription fields only; no SubscriptionEvent |
| `subscription.delayed` | *(no event)* | High | Update `nextBillDate` only |
| `subscription.rescheduled` | *(no event)* | High | Update `nextBillDate` only |
| `subscription.inventoryAction` | *(no event)* | Medium | Store in metadata; surface as alert in future |
| `order.upcoming` | *(discard)* | High | Pre-billing notification, no state change |
| `order.unskipped` | *(no event)* | High | Restore nextBillDate only |
| `paymentMethod.*` | *(no event)* | High | Metadata update only |

### Gap Analysis

Two new `SubscriptionEventType` values are recommended:

1. **`EXPIRED`** — for `subscription.expired` (fixed-cycle contract end). Without this, there's no event record for subscriptions that reach their natural end. CANCELLED is semantically wrong for a completed subscription.
2. **`SKIPPED`** — for `order.skipped`. Tracking skips is valuable for identifying churn risk patterns (Loop's analytics show "Upcoming Order Churn Contribution" is partially driven by customers who skip then cancel).

These two additions are low risk and add significant analytics value.

---

## 4. Product Linking Strategy

### How Loop References Products

Loop is entirely Shopify-native. Every product in Loop is a Shopify product. Loop's selling plans are Shopify SellingPlanGroups. Subscription line items carry Shopify product IDs and variant IDs natively. This is dramatically simpler than CheckoutChamp's `externalId` linking — there is no intermediate mapping step.

### Mapping to ProductMap

| Loop Field | → ProductMap Field | Notes |
|-----------|-------------------|-------|
| `lineItems[].shopifyProductId` | `shopifyProductId` | Direct match — ADR-002, Shopify is product master |
| `lineItems[].shopifyVariantId` | `shopifyVariantId` | Direct match |
| `selling_plan.billingPolicy.interval` + `intervalCount` | `frequency` | Derived — see below |
| `lineItems[].sku` | `sku` | Fallback lookup if product ID not found |

### Frequency Derivation

Convert Loop's selling plan billing policy interval to ThermoSlim's frequency string format:

| Loop `interval` | Loop `intervalCount` | → ThermoSlim `frequency` |
|----------------|---------------------|--------------------------|
| `MONTH` | 1 | `"1_MONTH"` |
| `MONTH` | 2 | `"2_MONTH"` |
| `MONTH` | 3 | `"3_MONTH"` |
| `MONTH` | 6 | `"6_MONTH"` |
| `MONTH` | 12 | `"12_MONTH"` |
| `DAY` | 30 | `"1_MONTH"` (treat as equivalent) |
| `DAY` | 90 | `"3_MONTH"` |
| `WEEK` | 4 | `"1_MONTH"` |
| Other | Any | `"{intervalCount}_{interval}"` — store as-is, normalize later |

### New Products

If a Loop subscription references a Shopify product not yet in `ProductMap`, it means the Shopify adapter's product sync hasn't run yet (or the product was recently added). Strategy:

1. Attempt lookup by `shopifyProductId` in ProductMap
2. If not found, attempt lookup by `shopifyVariantId`
3. If still not found, store the subscription with `productMapId = null` and queue a Shopify product pull
4. On next Shopify product sync (hourly), the ProductMap row will be created and can be backfilled

> **Do not block subscription ingestion on product map resolution.** A subscription with `productMapId = null` is better than a missed subscription record. This matches the existing pattern for CC unmapped items.

---

## 5. Deduplication Strategy

### The Core Challenge

Loop subscription orders ARE Shopify orders. Loop calls Shopify's SubscriptionContract API to trigger renewals, which creates Shopify orders tagged with Loop metadata. The existing Shopify adapter ingests these as `source=SHOPIFY` records. Without careful design, every Loop renewal could be counted twice.

### Recommended Strategy: **Option A — Loop as Enrichment Source**

**Loop adapter never creates Order records.** It only creates and updates:
- `Subscription` records (lifecycle state)
- `SubscriptionEvent` records (billing outcomes, status changes)

When `order.processed` fires (successful Loop billing):
1. Create a `SubscriptionEvent` with `eventType=BILLED`
2. Optionally look up the Shopify order by `shopifyOrderId` (available in Loop's order payload) and store the cross-reference in `SubscriptionEvent.metadata`
3. **Do not create an Order record** — Shopify adapter already has it or will have it within 15 minutes

When `order.paymentFailed` fires:
1. Create a `SubscriptionEvent` with `eventType=DECLINED`
2. Update `Subscription.status` to `RECYCLE_BILLING`
3. No Order record needed — failed payments don't create Shopify orders

**Why Option A over B or C:**

| | Option A (Enrichment) | Option B (Loop as order source) | Option C (Merge like CC) |
|-|----------------------|--------------------------------|--------------------------|
| Revenue accuracy | ✅ Unchanged — Shopify wins | ⚠️ Requires detecting subscription orders in Shopify adapter | ⚠️ Adds complexity without benefit |
| Implementation risk | ✅ Low — no Order writes | ❌ Must modify Shopify adapter | ❌ 7+ files to change like CC merge |
| Revenue definition compliance | ✅ `source IN ('SHOPIFY','MERGED')` still correct | ⚠️ Would need LOOP added to revenue definition | ⚠️ MERGED would still work, but complex |
| Consistency with architecture | ✅ Single responsibility principle | ❌ Adapter boundary violation | ⚠️ Only justified if needed for enrichment |

### Revenue Impact

The canonical revenue definition (`Order.totalPrice where source IN ('SHOPIFY', 'MERGED') and status = 'COMPLETE'`) is **unaffected** by Option A. Loop renewal orders are already captured as SHOPIFY source. The Loop adapter adds zero revenue and zero orders — it adds subscription context only.

**No changes to the Source enum are required for Loop.**

### Deduplication of Subscription Records

Dedup key for Subscription: `loopSubscriptionId` (unique). On webhook receipt:
1. Look up existing Subscription by `loopSubscriptionId`
2. If found: upsert (update status, nextBillDate, etc.)
3. If not found: create new Subscription record

For SubscriptionEvents: use `subscriptionId + eventType + occurredAt` as idempotency check. Duplicate webhooks (Loop retries for 48 hours) must not create duplicate events. Implement Redis-based idempotency key: `SET loop:webhook:{X-Loop-Webhook-Id} 1 EX 300 NX` (see ADR-008 — webhook deduplication is a current gap in the platform, now is the time to implement it for Loop from day one).

---

## 6. Schema Changes

### New Fields on Existing Tables

#### Subscription table — add 3 new fields

| Field | Type | Description |
|-------|------|-------------|
| `loopSubscriptionId` | `String? @unique` | Loop's internal subscription ID — primary dedup key for Loop webhooks |
| `shopifyContractId` | `String? @unique` | Shopify SubscriptionContract ID — cross-reference to Shopify's subscription layer |
| `loopSellingPlanId` | `String?` | Loop's selling plan ID — links to the plan configuration driving billing interval and discount |

#### Order table — no changes required

Loop does not write Order records. No new fields needed.

#### SubscriptionEvent table — no changes to columns required

The existing schema (eventType, fromStatus, toStatus, amount, declineReason, metadata, occurredAt) handles all Loop events. Metadata JSON field is the escape valve for event-specific detail (e.g., partial processing details, Loop flow names).

### New Tables

None required. All Loop data fits existing schema.

### New Enum Values

#### SubscriptionEventType — add 2 values

| New Value | Reason |
|-----------|--------|
| `EXPIRED` | For `subscription.expired` — a subscription that completed all its contracted billing cycles. Semantically distinct from CANCELLED (which is user-initiated). Without this, lifecycle completion has no event record. |
| `SKIPPED` | For `order.skipped` — customer or merchant skips an upcoming order. Valuable for churn risk analytics (Loop's "Upcoming Order Churn Contribution" metric requires tracking skips). |

#### SubscriptionStatus — no new values required

All Loop statuses map to existing enum values (see Section 3).

#### Source enum — no new values required

Loop is not a new order source. Loop orders are SHOPIFY orders.

### Migration Plan

```
1. Add fields to Subscription model in schema.prisma:
   loopSubscriptionId   String?   @unique
   shopifyContractId    String?   @unique
   loopSellingPlanId    String?

2. Add EXPIRED and SKIPPED to SubscriptionEventType enum

3. Run: npx prisma migrate dev --name add-loop-subscription-fields

4. No backfill required for existing Subscription records — they are CC-sourced
   and will have null loopSubscriptionId (which is correct)

5. Add index: @@index([loopSubscriptionId]) on Subscription
```

> **Note on existing Subscriptions:** All current Subscription records in the database are sourced from CheckoutChamp (ccPurchaseId is set). Loop subscriptions will have ccPurchaseId=null and loopSubscriptionId set. These are cleanly distinguishable.

---

## 7. Analytics Feasibility

### Metric Replication Assessment

#### Tier 1: Can Compute Now with Existing DailySnapshot Fields

| Loop Metric | DailySnapshot Field | Notes |
|------------|--------------------|----|
| Active Subscribers | `activeSubscribers` | Already aggregated |
| New Subscribers | `newSubscribers` | Already aggregated |
| Churned Subscribers | `cancelledSubscribers` | Already aggregated |
| MRR (Monthly Recurring Revenue) | `activeMRR` | Already aggregated |
| Churn Rate | `churnRate` | Already computed |
| Total Revenue | `totalRevenue` | Already aggregated |
| Subscription Revenue | `recurringRevenue` | Already aggregated |
| New Orders / Recurring Orders | `newOrders`, `recurringOrders` | Already aggregated |

**These metrics are already in DailySnapshot and will populate correctly once Loop Subscription records exist.**

#### Tier 2: Computable from Raw Tables (Medium Effort)

| Loop Metric | Data Source | What's Needed |
|------------|-------------|---------------|
| Net Subscriber Growth | Subscription table | Simple delta query (new - cancelled per day) |
| Subscriber vs Non-subscriber Revenue | Order + Subscription join | Join Order.customerId → Customer → Subscription |
| Subscription Cancellation Rate | Subscription + SubscriptionEvent | Count CANCELLED events / active subscriptions |
| MRR Lost via Cancellations | SubscriptionEvent | Sum Subscription.recurringPrice for CANCELLED events |
| Orders Before Cancellation | SubscriptionEvent | Count BILLED events per subscription before CANCELLED |
| Payment Success Rate | SubscriptionEvent | BILLED / (BILLED + DECLINED) per period |
| First Attempt Success Rate | SubscriptionEvent | BILLED events where billingCycleNumber is 1st attempt in cycle |
| Recovery Rate (basic) | SubscriptionEvent | BILLED events that follow DECLINED events on same subscription |
| Cancellation Reasons | Subscription.cancelReason | Field exists; query by reason value |
| Save Rate | Subscription (not cancelled after flow) | Infer from: cancellation flow attempted but subscription still ACTIVE |
| Subscriber Acquisition by Product | Subscription.productMapId | Join to ProductMap for product-level grouping |
| Subscription Retention | SubscriptionEvent (CREATED, CANCELLED) | Survival analysis by cohort |

#### Tier 3: Needs New DailySnapshot Fields

| Loop Metric | Missing Data | Recommended New Snapshot Field |
|------------|-------------|-------------------------------|
| MRR Lost via Cancellations (daily aggregate) | Only have cancellation count, not MRR lost | `churnedMRR Int @default(0)` |
| 0-Day Churn Rate | Need to track same-day cancellations | `zeroDayChurns Int @default(0)` |
| Upcoming Order Churn Contribution | Need to track pre-billing cancellations | `upcomingOrderChurns Int @default(0)` |
| Recovered Revenue (dunning success) | No recovery tracking in snapshot | `recoveredRevenue Int @default(0)` |
| Payment Attempted (total) | Only track successes | `billingAttempts Int @default(0)` |

**Recommendation:** Add these 5 fields to DailySnapshot in the same migration as Loop schema changes.

#### Tier 4: Needs New Infrastructure (High Effort — Deferred)

| Loop Metric | Gap | Required Infrastructure |
|------------|-----|------------------------|
| Cohort Retention Grid (36 months) | No cohort tracking | New background job grouping subscriptions by acquisition month; complex retention grid computation |
| Average Subscriber LTV by Cohort | No cohort grouping | Same as above |
| Payment V2 — "Under Recovery" tracking | Mid-recovery state not tracked | New field: `Subscription.recyclingAmount Int?` to track in-flight dunning value |
| Offer-wise Save Performance | Save offers not captured | New model: `CancellationFlowEvent` to record offer presented, accepted/rejected |
| Acquisition by Selling Plan (detailed) | Selling plan not in DailySnapshot | Add `loopSellingPlanId` dimension to DailySnapshot |
| Country-wise Payment Distribution | No country data on subscriptions | Loop payload must include billing country — store on Subscription |

**These are Phase 2 of the analytics build — not required for the initial adapter.**

### Already Covered by DailySnapshot Summary

8 of 51 Loop metrics are **already computed** in DailySnapshot and will populate automatically once Subscription records exist. 14 are computable with medium effort from raw tables. The cohort analytics (10 metrics) and detailed payment staging (V2 metrics) require dedicated infrastructure and are deferred.

---

## 8. Risks and Gotchas

Referenced from `lessons/Gotchas.md` and `lessons/Future Risk Areas.md`.

### Known Risks

**1. Double-counting revenue (CRITICAL)**
Loop renewal orders are Shopify orders. If any code in the Loop adapter writes to the `Order` table with `source=LOOP`, revenue will be double-counted — once from Shopify adapter (source=SHOPIFY) and once from Loop. Mitigation: Loop adapter must **never write Order records**. Enforce this in code with a comment and test. Revenue definition: `source IN ('SHOPIFY', 'MERGED')` — a LOOP source would also need to be added here to count, making the violation visible. But prevention is better.

**2. Shopify webhook / Loop webhook duplication**
When a Loop subscription renews: Loop fires `order.processed` AND Shopify fires `orders/create`. Both relate to the same renewal. The Loop adapter handles `order.processed` by creating a SubscriptionEvent; the Shopify adapter handles `orders/create` by creating an Order. These are complementary, not conflicting — as long as the Loop adapter never creates Order records (Risk #1).

**3. API version deprecation**
Loop V1 APIs were deprecated February 20, 2026. The adapter must use V2 or `unstable`. Pin the API version string in `src/core/config.ts` as `LOOP_API_VERSION`. Set a quarterly calendar reminder to check Loop's changelog. (Mirrors the Shopify API versioning risk in Future Risk Areas.)

**4. Base URL and auth header not documented**
`api-reference.md` explicitly marks the base URL and exact auth header name as `NOT FOUND — requires direct API exploration`. These are blockers for implementation. See Open Questions below.

**5. HMAC signature verification not documented**
Loop webhook headers include `X-Loop-Webhook-Id` and delivery metadata, but the signature verification mechanism (HMAC secret) is not documented. The Shopify adapter uses HMAC verification; Loop's equivalent must be confirmed. Without verification, the webhook endpoint accepts unauthenticated POST requests — a security risk.

**6. Webhook ordering race conditions (existing risk)**
Per `Future Risk Areas.md` — webhooks don't guarantee delivery order. For Loop, this could manifest as: `subscription.cancelled` arrives before `order.paymentFailed` (the payment failure that caused the cancellation). Mitigation: process events idempotently and re-derive status from the latest known state. The Subscription.status should always reflect the most recent event seen, regardless of order.

**7. Product map gaps for new Loop products**
Unlike CC (which needed manual `externalId` setup), Loop products automatically carry Shopify IDs. However, if a new product is added to Loop before Shopify's hourly product sync has run in ThermoSlim, the ProductMap row won't exist yet. Mitigation: queue a Shopify product pull on productMap miss; don't block subscription ingestion. (This is the same gap that exists for CC — tracked in Future Risk Areas as "Product Map Gaps Compound Silently".)

**8. cancelReason is unstructured**
Loop's cancellation reasons are merchant-configurable strings. The `Subscription.cancelReason` field is `String?` which accepts these. However, structured reason analytics (Cancellation Analytics dashboard — reason-wise churn, save rate by reason) require consistent reason categories. Mitigation: store the raw Loop reason string in `cancelReason`; normalize to a known category set in a post-processing step or via a lookup table.

**9. Trial subscription detection**
TRIAL is not a native Loop status. Trial subscriptions in Loop are ACTIVE subscriptions where the selling plan has `trialDays > 0`. The adapter must inspect the selling plan attributes on creation to set `status=TRIAL`. Requires API exploration to confirm the exact field. If not detectable, TRIAL state is lost — subscriptions will enter as ACTIVE. This is Medium risk (analytically suboptimal, not revenue-impacting).

### Open Questions (Must Resolve Before Implementation)

| Question | Suggested Path |
|----------|---------------|
| What is the exact Loop API base URL (v2)? | Request from Loop support or Shopify App Store developer docs |
| What is the exact auth header name (`X-Loop-Token` or `Authorization: Bearer`)? | Test with a known token against `/selling-plans` |
| Does Loop use HMAC for webhook signature verification? If so, what secret and algorithm? | Loop developer docs or support |
| What fields does Loop include in the `order.processed` payload? Specifically: does it include the Shopify order ID for cross-referencing? | Test via webhook inspector or Loop sandbox |
| Can Loop selling plans be fetched with trial day attributes to detect TRIAL subscriptions? | `GET /selling-plans` response inspection |
| Does `GET /subscriptions` support cursor-based pagination? What are the page size limits? | API exploration |
| What is Loop's actual rate limit? | Loop support / API docs |

---

## 9. Operational Feasibility

Per ADR-008 (Scaling Assessment Before New Sources), Loop's volume profile is **order-scale, not event-stream scale**. Unlike Klaviyo (50K events/day) or GA4 (100K events/day), Loop produces subscription lifecycle events at the same volume as orders — ~100-500 events per day. This is well within current architecture limits.

### API Rate Limits

| Operation | Rate Limit | Our Expected Volume | Feasible? |
|-----------|-----------|-------------------|-----------|
| `GET /subscriptions` (hourly pull) | NOT DOCUMENTED | ~1K-10K subscriptions total, paginated | Yes — one paginated batch per hour |
| `GET /subscriptions/{id}/orders/history` (backfill) | NOT DOCUMENTED | One-time: ~1K subscriptions × 1 API call each | Yes — run once, batch over a day |
| Webhook delivery (inbound) | Loop retries for 48h | ~100-500 events/day | Trivially low |
| `POST /webhooks` (registration) | N/A | Once at setup | N/A |

**Rate limit risk: LOW.** Loop's API volume will be 10-100x lower than Shopify's current pull rate.

### Sync Volume Assessment

| Metric | Current (Shopify+CC) | With Loop Added |
|--------|---------------------|-----------------|
| Order records/day | 100-500 | No change (Loop doesn't write orders) |
| Subscription records | ~1K existing (CC) | +1K-10K Loop subscriptions |
| SubscriptionEvent records/day | Low | +100-500 events/day |
| API calls/hour | ~15min Shopify + 15min CC | +1 hourly Loop pull |

Loop adds **negligible load** to the current architecture. The queue splitting work in ADR-008 Scaling Roadmap (Phase 2) is still recommended but is **not a prerequisite for Loop**. Loop can ship before that work is done, unlike Klaviyo/GA4.

**Recommended sync interval:** 1 hour for scheduled pull (not 15 minutes — subscription state doesn't need sub-hourly freshness; order state does).

### Infrastructure Impact

- **BullMQ:** Add Loop sync job to the existing orders queue (or the future `subscriptions` queue if queue splitting is done first). Job runtime estimated at 1-5 minutes for full subscription pull.
- **Database writes:** ~100-500 SubscriptionEvent inserts/day + hourly Subscription upserts. Trivial.
- **Redis:** Add Loop webhook idempotency keys (`SET loop:webhook:{id} 1 EX 300 NX`). Minimal memory impact.
- **Webhook endpoint:** New route at `app/api/webhooks/loop/route.ts`. Same pattern as Shopify webhook route. Must configure Vercel to allow unauthenticated POST (same issue as CC — see Gotchas: "Vercel Deployment Protection Blocks Webhooks").

### ADR-008 Prerequisites

| ADR-008 Change | Required Before Loop? | Rationale |
|----------------|----------------------|-----------|
| BullMQ queue splitting | No | Loop volume is order-scale — existing queue handles it |
| Pre-aggregation layer | No | Loop doesn't stress the dashboard |
| Batch event ingestion | No | 500 events/day is trivially small |
| Redis customer cache | No | Loop doesn't do bulk customer lookups |
| `NormalizedEvent` type | Recommended | Loop produces SubscriptionEvents — structurally similar; align now |
| Webhook deduplication (Redis) | **Yes** | Implement from day one for Loop. Prevents duplicate events from 48h retry window. |
| Observability (Sentry/Pino) | **Yes** | First new adapter since CC — good time to establish this |
