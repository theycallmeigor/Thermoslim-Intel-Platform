---
title: Loop Integration — Risks, Gaps & Pre-flight Checklist
source: Session analysis 2026-03-30
status: pre-implementation
---

# Loop Integration — Risks, Gaps & Pre-flight Checklist

> **When to use this doc:** Read before starting any Loop adapter implementation work. Every item here must be resolved or have an explicit decision before going live.

---

## Hard Blockers (nothing ships until these are resolved)

These three unknowns require either Loop's private API docs or a live test call with the client's token.

| # | Blocker | How to resolve |
|---|---------|---------------|
| 1 | **API base URL unknown** — V1 deprecated Feb 20, 2026. Research could not confirm v2/unstable endpoint. | Make a test call with client token; check Loop's changelog or contact Loop support |
| 2 | **Auth header name unconfirmed** — `X-Loop-Token` vs `Authorization: Bearer`. Wrong header = all requests 401. | Confirmed by first successful test call |
| 3 | **Webhook HMAC signature mechanism undocumented** — headers are known (`X-Loop-Webhook-Id`, topic, delivery-at, retry-count) but signing algorithm is not. Cannot validate webhook authenticity without this. | Contact Loop support; check their private developer docs |

---

## Schema Changes Required

All require Prisma migrations. Run against staging first.

| Change | Table | Priority |
|--------|-------|----------|
| Add `loopSubscriptionId String? @unique` | `Subscription` | Critical — dedup key, same pattern as `ccPurchaseId` |
| Add `source` field (or equivalent) | `Subscription` | High — can't distinguish Loop vs CC subscriptions |
| Add Loop order linkage field | `Order` | High — do NOT reuse `funnelReferenceId` (CC-specific) |
| Add `EXPIRED` to `SubscriptionEventType` enum | schema | Medium — Loop fires `subscription.expired` |
| Add `EXPIRED` to `SubscriptionStatus` enum | schema | Medium — current workaround maps to `COMPLETE` (wrong semantics) |

---

## Backfill Risks

| Risk | Detail | Mitigation |
|------|--------|-----------|
| **`originalOrderId` requires extra API call** | Webhook payload has no originating order. Need `GET /subscriptions/{id}/orders/history` per subscription to find first order — N+1 calls. | Batch with pagination; log failures to `IngestionError` |
| **Price is a dollar string, not cents** | Loop payloads send `"price": "5.39"`. Must use `Math.round(parseFloat(price) * 100)` — never float multiply. | Dedicated conversion util with unit tests |
| **Product mapping via SKU is fragile** | Loop line items expose `sku`. `ProductMap.sku` may not be populated for all products. | Try SKU → fallback to `shopifyProductId` → log warning on null, don't fail insert |
| **Unknown subscription volume** | Could be 10k+ subscriptions. Naive sequential backfill could take hours. | Implement pagination + resumable cursor state before running |
| **Rate limits unknown** | Not documented in research. Could hit limit mid-backfill. | Add exponential backoff; log rate limit hits; resume from cursor |

---

## Webhook-Specific Gaps

### Race condition: `order.processed` vs Shopify sync

Loop fires `order.processed` when a rebill succeeds. The Shopify adapter may sync the same order before or after this fires.

- **Loop arrives first:** No `orders` row exists yet to enrich. Need queued enrichment or retry.
- **Shopify arrives first:** Loop webhook must find existing row by `shopifyOrderId` and update it.

**Decision needed:** Choose reconciliation strategy (staging table + reconciliation job vs. immediate attempt + retry vs. Shopify adapter checks for pending Loop enrichments on insert). Document in `integration-spec.md`.

### Unhandled event types (explicit decision required for each)

| Loop Event | Current State | Options |
|------------|--------------|---------|
| `subscription.updated` | No `SubscriptionEventType` mapping | Add `UPDATED` enum / log to `metadata` JSON / intentionally ignore |
| `subscription.delayed` / `subscription.rescheduled` | No event type | Update `Subscription.nextBillDate` only (no event row needed) |
| `order.partiallyProcessed` | No mapping | Log as `DECLINED` for failed items / new event type / ignore |
| `paymentMethod.updated` / `paymentMethod.expiringSoon` / `paymentMethod.updateRequested` | No table | Log to `Subscription.metadata` / new `PaymentMethod` table / ignore for now |

---

## DailySnapshot Impact

| Risk | Detail |
|------|--------|
| **Snapshot builder may have CC-only assumptions** | `newSubscribers`, `cancelledSubscribers`, `activeSubscribers`, `activeMRR` currently built from CC `Subscription` rows only. Audit for any filter on `ccPurchaseId` or CC-specific fields before Loop goes live. |
| **No Loop/CC segmentation in snapshots** | `DailySnapshot` has no subscription source dimension. Once both sources exist, MRR/churn is blended. Decide if this is acceptable or if a source column is needed. |
| **Revenue is already correct** | Loop orders flow through Shopify (`source = SHOPIFY/MERGED`). Revenue deduplication rule unchanged — no action needed. |

---

## Pre-flight Checklist

Before starting implementation:

- [ ] Client has provided Loop API token
- [ ] Base URL confirmed via test call
- [ ] Auth header name confirmed via test call
- [ ] Webhook HMAC signing mechanism documented
- [ ] Client has registered webhook endpoint in Loop admin
- [ ] Client has provided webhook secret
- [ ] Schema migrations reviewed and approved
- [ ] Snapshot builder audited for CC-only assumptions
- [ ] Race condition strategy decided and documented in `integration-spec.md`
- [ ] Decisions made on all unhandled webhook event types
- [ ] Staging DB migration tested with no CC data regressions

---

## Related Files

- `data-model.md` — deduplication & enrichment mapping strategy
- `webhook-catalog.md` — full event type catalog with payload structures
- `subscription-lifecycle.md` — Loop status → ThermoSlim status mapping
- `api-reference.md` — known endpoints (base URL TBD)
- `integration-spec.md` — Phase 4 Gemini output (full field mappings, schema changes, operational feasibility)
