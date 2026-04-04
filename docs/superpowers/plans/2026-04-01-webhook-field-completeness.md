# Webhook Field Completeness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure all 4 CC webhook profiles capture the complete field set needed for dashboards, alerts, AI question-answering, and forecasting — plus add two missing profiles (Refund, Chargeback) and fix adapter gaps.

**Architecture:** Two parallel tracks: (1) code changes to the CC adapter, schema, and pipeline to handle new/corrected fields; (2) manual CC dashboard configuration checklist for all 6 profiles. Code changes are prerequisite to CC config — fields must be mapped before profiles are updated.

**Tech Stack:** Next.js 14, Prisma ORM, PostgreSQL, TypeScript strict mode, Vitest

---

## Why this matters for AI

The platform is being built toward an AI intelligence layer — natural language Q&A, churn prediction, MRR forecasting, anomaly explanation. That AI needs **sequences, not snapshots**. Every gap below is a signal the AI can't learn from:

- `subAffId` gap → can't answer "which sub-affiliate produces best LTV subscribers?"
- `gatewayTitle` gap → can't detect "chargebacks spiking on one processor"
- Missing Refund profile → revenue numbers are overstated; AI trains on wrong data
- Missing Chargeback profile → fraud patterns invisible
- `subAffId: null` hardcode → attribution chain incomplete, ad spend ROI uncalculable
- `totalShipping`/`totalDiscount` mismatch → webhook financial totals differ from API totals

---

## File Map

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `gatewayTitle` to Order; add `dateRefunded`, `chargebackAmount`, `chargebackDate` to RevenueEvent |
| `prisma/migrations/20260401000001_webhook_completeness/migration.sql` | Migration for schema changes |
| `src/adapters/checkoutchamp/index.ts` | Add `subAffId`, `gatewayTitle`, `originalClientOrderId`, `userAgent` (flat), webhook field name aliases to CCOrder; map all in `mapOrderToSchema`; add refund/chargeback handlers |
| `src/core/ingestion/pipeline.ts` | Add `gatewayTitle` to OrderData + orderPayload; add `dateRefunded`, `chargebackAmount`, `chargebackDate` to RevenueEvent upsert path |

---

## Task 1: Schema — add missing fields

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260401000001_webhook_completeness/migration.sql`

- [ ] **Step 1: Add `gatewayTitle` to Order model in schema**

In `prisma/schema.prisma`, after the `isDeclineSave` field (~line 135):

```prisma
  gatewayTitle        String?       // Payment processor name (Stripe, NMI, etc.)
```

- [ ] **Step 2: Add financial fields to RevenueEvent for refunds/chargebacks**

In `prisma/schema.prisma`, on the `RevenueEvent` model after `chargebackReasonCode`:

```prisma
  chargebackAmount    Int?          // Chargeback amount in cents
  chargebackDate      DateTime?     // Date chargeback was filed
  dateRefunded        DateTime?     // Date refund was issued
```

- [ ] **Step 3: Write migration SQL**

Create `prisma/migrations/20260401000001_webhook_completeness/migration.sql`:

```sql
-- AlterTable: Order
ALTER TABLE "Order" ADD COLUMN "gatewayTitle" TEXT;

-- AlterTable: RevenueEvent
ALTER TABLE "RevenueEvent" ADD COLUMN "chargebackAmount" INTEGER;
ALTER TABLE "RevenueEvent" ADD COLUMN "chargebackDate" TIMESTAMP(3);
ALTER TABLE "RevenueEvent" ADD COLUMN "dateRefunded" TIMESTAMP(3);
```

- [ ] **Step 4: Verify TypeScript still compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v node_modules
```

Expected: no errors (new schema fields won't be picked up by Prisma types until migration runs — that's fine, we'll cast where needed)

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260401000001_webhook_completeness/migration.sql
git commit -m "feat: add gatewayTitle to Order, chargeback/refund fields to RevenueEvent"
```

---

## Task 2: CCOrder interface — add missing fields

**Files:**
- Modify: `src/adapters/checkoutchamp/index.ts`

The `CCOrder` interface covers API responses. Webhooks send flat payloads with some different field names. Both gaps need fixing here.

- [ ] **Step 1: Add missing fields to CCOrder interface**

In `src/adapters/checkoutchamp/index.ts`, in the `CCOrder` interface, add after `affId`:

```typescript
  subAffId: string | null;           // Sub-affiliate ID
```

Add after `custom5`:

```typescript
  // Flat webhook field name aliases (webhook uses these, API uses different names)
  totalShipping: string | null;      // Webhook: totalShipping (API uses baseShipping)
  totalDiscount: string | null;      // Webhook: totalDiscount (API uses discountPrice)
  userAgent: string | null;          // Webhook: flat field (API uses browserDetails.userAgent)
```

Add after `originalOrderId`:

```typescript
  originalClientOrderId: string | null;  // String version of originalOrderId
```

Add to the payment section after `refundRemaining`:

```typescript
  gatewayTitle: string | null;       // Payment processor name
  // Refund fields (Profile 5 events)
  dateRefunded: string | null;
  refundReason: string | null;
  // Chargeback fields (Profile 6 events)
  chargebackAmount: string | null;
  chargebackDate: string | null;
  chargebackReasonCode: string | null;
  chargebackNote: string | null;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v node_modules
```

Expected: no errors (interface additions are non-breaking)

- [ ] **Step 3: Commit**

```bash
git add src/adapters/checkoutchamp/index.ts
git commit -m "feat: add subAffId, gatewayTitle, refund/chargeback fields to CCOrder interface"
```

---

## Task 3: Fix webhook field name aliases in handleWebhook

**Files:**
- Modify: `src/adapters/checkoutchamp/index.ts` — `handleWebhook` method (~line 263)

CC webhooks use different field names than the CC API for some financial fields. The current normalization handles `orderTotal` → `totalAmount`. Extend it for the others.

- [ ] **Step 1: Extend the webhook normalization block**

In `handleWebhook`, find the normalization block and extend it:

```typescript
const normalized: Record<string, unknown> = { ...raw };
if (raw.orderTotal && !raw.totalAmount) normalized.totalAmount = raw.orderTotal;
if (raw.clientOrderId && !normalized.orderId) normalized.orderId = raw.clientOrderId;
// Webhook uses totalShipping/totalDiscount; API uses baseShipping/discountPrice
if (raw.totalShipping && !raw.baseShipping) normalized.baseShipping = raw.totalShipping;
if (raw.totalDiscount && !raw.discountPrice) normalized.discountPrice = raw.totalDiscount;
// Webhook sends userAgent as flat field; API nests it in browserDetails
if (raw.userAgent && !normalized.browserDetails) {
  normalized.browserDetails = { userAgent: raw.userAgent };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v node_modules
```

- [ ] **Step 3: Commit**

```bash
git add src/adapters/checkoutchamp/index.ts
git commit -m "fix: normalize totalShipping, totalDiscount, userAgent webhook field name aliases"
```

---

## Task 4: Map new fields in mapOrderToSchema

**Files:**
- Modify: `src/adapters/checkoutchamp/index.ts` — `mapOrderToSchema` method

- [ ] **Step 1: Add `gatewayTitle` to order record**

In `mapOrderToSchema`, in the order data block, after `isDeclineSave`:

```typescript
        gatewayTitle: order.gatewayTitle || null,
```

- [ ] **Step 2: Fix `subAffId` hardcode in attribution block**

Find `subAffId: null` and replace with:

```typescript
          subAffId: order.subAffId || null,
```

- [ ] **Step 3: Map `originalClientOrderId` for subscription records**

In the subscription record builder, update `originalOrderId`:

```typescript
          originalOrderId: order.originalClientOrderId || order.originalOrderId || order.orderId,
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v node_modules
```

Expected: error on `gatewayTitle` in orderPayload (Prisma type not updated yet) — cast it:

```typescript
        gatewayTitle: order.gatewayTitle || null,
```

If Prisma hasn't regenerated, add `// eslint-disable-next-line @typescript-eslint/no-explicit-any` and cast `(orderPayload as any).gatewayTitle` in pipeline.ts (same pattern as ccCustom3-5).

- [ ] **Step 5: Commit**

```bash
git add src/adapters/checkoutchamp/index.ts
git commit -m "feat: map subAffId, gatewayTitle, originalClientOrderId in CC adapter"
```

---

## Task 5: Pipeline — propagate gatewayTitle through OrderData

**Files:**
- Modify: `src/core/ingestion/pipeline.ts`

- [ ] **Step 1: Add `gatewayTitle` to OrderData interface**

In `pipeline.ts`, in the `OrderData` interface, after `isDeclineSave`:

```typescript
  gatewayTitle?: string | null;
```

- [ ] **Step 2: Add to orderPayload**

In `upsertOrder`, in the `orderPayload` object, after `isDeclineSave`:

```typescript
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gatewayTitle: (data as any).gatewayTitle ?? null,
```

- [ ] **Step 3: Add to merge path reconstruction**

In the `waitingCCOrder` reconstruction block, after the ccCustom5 cast lines:

```typescript
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gatewayTitle: (waitingCCOrder as any).gatewayTitle as string | null ?? null,
```

- [ ] **Step 4: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit 2>&1 | grep -v node_modules
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/core/ingestion/pipeline.ts
git commit -m "feat: propagate gatewayTitle through ingestion pipeline OrderData"
```

---

## Task 6: Refund event handler

**Files:**
- Modify: `src/adapters/checkoutchamp/index.ts` — `handleWebhook` and `mapOrderToSchema`
- Modify: `src/core/ingestion/pipeline.ts` — `upsertRevenueEvent`

Refund webhooks (Profile 5) fire with `orderStatus: REFUNDED`. The adapter needs to detect these and emit a `REFUND` RevenueEvent in addition to updating the order record.

- [ ] **Step 1: Add refund detection to handleWebhook**

In `handleWebhook`, after the `isPartial` detection:

```typescript
const isRefund = raw.orderStatus === 'REFUNDED';
```

Refund events ARE complete orders that got refunded — don't skip API fetch for these. No change to the fetch logic needed.

- [ ] **Step 2: Add refund record type to mapOrderToSchema**

In `mapOrderToSchema`, after the subscription records loop:

```typescript
    // Refund event: emit a REFUND revenue record
    if (order.orderStatus === 'REFUNDED' && order.dateRefunded) {
      records.push({
        type: 'revenueEvent',
        data: {
          eventType: 'REFUND',
          amount: totalPrice,
          source: 'CHECKOUTCHAMP',
          customerEmail: order.emailAddress,
          sourceOrderId: order.orderId,
          refundReason: order.refundReason || null,
          dateRefunded: ccDateToIso(order.dateRefunded),
          transactionId: null,
        },
      });
    }

    // Chargeback event
    if (order.chargebackAmount) {
      records.push({
        type: 'revenueEvent',
        data: {
          eventType: 'CHARGEBACK',
          amount: toCents(order.chargebackAmount),
          source: 'CHECKOUTCHAMP',
          customerEmail: order.emailAddress,
          sourceOrderId: order.orderId,
          chargebackReasonCode: order.chargebackReasonCode || null,
          chargebackNote: order.chargebackNote || null,
          chargebackDate: order.chargebackDate ? ccDateToIso(order.chargebackDate) : null,
          transactionId: null,
        },
      });
    }
```

- [ ] **Step 3: Add `revenueEvent` type to NormalizedRecord in core types**

Check `src/core/types/index.ts` (or wherever NormalizedRecord is defined). If `revenueEvent` is not a valid `type`, add it.

```bash
grep -n "revenueEvent\|NormalizedRecord" src/core/types/index.ts
```

Add if missing:
```typescript
| { type: 'revenueEvent'; data: RevenueEventData }
```

- [ ] **Step 4: Add revenueEvent processing to pipeline runIngestion**

In `pipeline.ts`, in `runIngestion`, add after subscription processing:

```typescript
  const revenueEvents = records.filter(r => r.type === 'revenueEvent');
  for (const r of revenueEvents) {
    await upsertRevenueEvent(r.data as unknown as RevenueEventData);
  }
```

- [ ] **Step 5: Add `upsertRevenueEvent` function to pipeline**

```typescript
interface RevenueEventData {
  eventType: RevenueEventType;
  amount: number;
  source: 'SHOPIFY' | 'CHECKOUTCHAMP';
  customerEmail: string;
  sourceOrderId: string;
  refundReason?: string | null;
  dateRefunded?: string | null;
  chargebackReasonCode?: string | null;
  chargebackNote?: string | null;
  chargebackDate?: string | null;
  transactionId?: string | null;
}

async function upsertRevenueEvent(data: RevenueEventData): Promise<void> {
  const customer = await prisma.customer.findUnique({ where: { email: data.customerEmail } });
  if (!customer) return; // Customer must exist first

  const order = await prisma.order.findFirst({
    where: { sourceOrderId: data.sourceOrderId },
  });

  // Deduplicate: one refund/chargeback per order per event type
  const existing = await prisma.revenueEvent.findFirst({
    where: { orderId: order?.id ?? undefined, customerId: customer.id, eventType: data.eventType },
  });
  if (existing) return;

  await prisma.revenueEvent.create({
    data: {
      customerId: customer.id,
      orderId: order?.id ?? null,
      eventType: data.eventType,
      amount: data.amount,
      source: data.source,
      refundReason: data.refundReason,
      chargebackReasonCode: data.chargebackReasonCode,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chargebackAmount: data.eventType === 'CHARGEBACK' ? data.amount : undefined as any,
      chargebackDate: data.chargebackDate ? new Date(data.chargebackDate) : null,
      dateRefunded: data.dateRefunded ? new Date(data.dateRefunded) : null,
      transactionId: data.transactionId,
      occurredAt: data.dateRefunded
        ? new Date(data.dateRefunded)
        : data.chargebackDate
        ? new Date(data.chargebackDate)
        : new Date(),
    },
  });
}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v node_modules
```

Fix any type errors. The `chargebackAmount` and `dateRefunded` fields on RevenueEvent won't exist in Prisma types until migration runs — use `as any` cast for those fields only.

- [ ] **Step 7: Commit**

```bash
git add src/adapters/checkoutchamp/index.ts src/core/ingestion/pipeline.ts src/core/types/index.ts
git commit -m "feat: handle Refund and Chargeback webhook events, emit RevenueEvents"
```

---

## Task 7: Reactivate subscription lifecycle handler

**Files:**
- Modify: `src/adapters/checkoutchamp/field-map.ts`

The `REACTIVATED` SubscriptionEventType exists in the schema but `subscriptionStatusMap` doesn't map a CC status that triggers it. When CC sends a Reactivate lifecycle event, `orderStatus` or `product1_recurringstatus` will be `ACTIVE` — but we need the pipeline to know it's a reactivation, not a new subscription.

- [ ] **Step 1: Check what CC sends for Reactivate events**

Reactivate events fire when a cancelled subscription resumes. CC will send `orderStatus: COMPLETE` or `ACTIVE` with a `product1_recurringstatus: Active`. The pipeline detects status change `CANCELLED → ACTIVE` and emits `REACTIVATED` via `deriveSubscriptionEventType`. Check that function:

```bash
grep -n "deriveSubscriptionEventType\|REACTIVATED" src/core/ingestion/pipeline.ts
```

- [ ] **Step 2: Verify REACTIVATED derivation logic is correct**

The `deriveSubscriptionEventType` function should emit `REACTIVATED` when `fromStatus === 'CANCELLED'` and `toStatus === 'ACTIVE'`. If it doesn't, add that case:

```typescript
if (from === 'CANCELLED' && to === 'ACTIVE') return 'REACTIVATED';
```

- [ ] **Step 3: Add REACTIVATED SubscriptionStatus if missing**

`SubscriptionStatus` enum has no `REACTIVATED` value (it goes back to `ACTIVE`). This is correct — a reactivated subscription has status `ACTIVE`. The event type `REACTIVATED` is captured in `SubscriptionEvent`, not the status itself. No schema change needed.

- [ ] **Step 4: Commit**

```bash
git add src/core/ingestion/pipeline.ts
git commit -m "fix: verify REACTIVATED subscription event derivation for Reactivate webhook"
```

---

## Task 8: CC Dashboard configuration (manual)

This is the manual checklist for updating all profiles in the CC dashboard. Do this **after** deploying the code changes above.

**Postback URL for all profiles:**
```
https://thermoslim-platform-igor-5076s-projects.vercel.app/api/webhooks/checkoutchamp/ts-webhook-be8b18ec5ad97fe512d98255
```

### Profile 1: TS — Partial *(Partial)*

Add any missing from this complete list:

| Name | Value |
|---|---|
| orderId | [orderId] |
| clientOrderId | [clientOrderId] |
| customerId | [customerId] |
| emailAddress | [emailAddress] |
| firstName | [firstName] |
| lastName | [lastName] |
| phoneNumber | [phoneNumber] |
| dateCreated | [dateCreated] |
| orderStatus | [orderStatus] |
| campaignId | [campaignId] |
| campaignName | [campaignName] |
| salesUrl | [salesUrl] |
| UTMSource | [UTMSource] |
| utmMedium | [UTMMedium] |
| utmCampaign | [UTMCampaign] |
| UTMTerm | [UTMTerm] |
| UTMContent | [UTMContent] |
| httpReferer | [httpReferer] |
| sourceId | [sourceId] |
| pubId | [pubId] |
| ipAddress | [ipAddress] |
| couponCode | [couponCode] |
| custom1 | [custom1] |
| product1_name | [product1_name] |
| product1_price | [product1_price] |
| product1_qty | [product1_qty] |
| product1_externalId | [product1_externalId] |

### Profile 2: TS — Sales *(Sale, Upsell)*

Add any missing:

| Name | Value |
|---|---|
| orderId | [orderId] |
| clientOrderId | [clientOrderId] |
| customerId | [customerId] |
| emailAddress | [emailAddress] |
| firstName | [firstName] |
| lastName | [lastName] |
| phoneNumber | [phoneNumber] |
| dateCreated | [dateCreated] |
| orderStatus | [orderStatus] |
| externalOrderId | [externalOrderId] |
| campaignId | [campaignId] |
| campaignName | [campaignName] |
| salesUrl | [salesUrl] |
| UTMSource | [UTMSource] |
| utmMedium | [UTMMedium] |
| utmCampaign | [UTMCampaign] |
| UTMTerm | [UTMTerm] |
| UTMContent | [UTMContent] |
| httpReferer | [httpReferer] |
| sourceId | [sourceId] |
| pubId | [pubId] |
| subAffId | [subAffId] |
| sourceValue1 | [sourceValue1] |
| sourceValue2 | [sourceValue2] |
| sourceValue3 | [sourceValue3] |
| ipAddress | [ipAddress] |
| couponCode | [couponCode] |
| custom1 | [custom1] |
| custom2 | [custom2] |
| responseType | [responseType] |
| declineReason | [declineReason] |
| paySource | [paySource] |
| cardType | [cardType] |
| cardLast4 | [cardLast4] |
| avsResponse | [avsResponse] |
| cvvResponse | [cvvResponse] |
| gatewayTitle | [gatewayTitle] |
| isDeclineSave | [isDeclineSave] |
| orderTotal | [orderTotal] |
| totalPrice | [totalPrice] |
| totalShipping | [totalShipping] |
| totalDiscount | [totalDiscount] |
| salesTax | [salesTax] |
| hasUpsell | [hasUpsell] |
| funnelReferenceId | [funnelReferenceId] |
| nextBillDate | [nextBillDate] |
| product1_name | [product1_name] |
| product1_price | [product1_price] |
| product1_qty | [product1_qty] |
| product1_sku | [product1_sku] |
| product1_externalId | [product1_externalId] |
| product1_crmId | [product1_crmId] |
| product1_campaignProductId | [product1_campaignProductId] |
| product1_recurringstatus | [product1_recurringstatus] |
| product2_name | [product2_name] |
| product2_price | [product2_price] |
| product2_qty | [product2_qty] |
| product2_sku | [product2_sku] |
| product2_externalId | [product2_externalId] |
| product2_crmId | [product2_crmId] |
| product2_campaignProductId | [product2_campaignProductId] |
| product2_recurringstatus | [product2_recurringstatus] |

### Profile 3: TS — Subscription Billing *(Rebill, Prebill, Rebill Declined)*

Add any missing:

| Name | Value |
|---|---|
| orderId | [orderId] |
| clientOrderId | [clientOrderId] |
| customerId | [customerId] |
| emailAddress | [emailAddress] |
| firstName | [firstName] |
| lastName | [lastName] |
| dateCreated | [dateCreated] |
| orderStatus | [orderStatus] |
| campaignId | [campaignId] |
| campaignName | [campaignName] |
| purchaseId | [purchaseId] |
| clientPurchaseId | [clientPurchaseId] |
| recurringPrice | [recurringPrice] |
| responseType | [responseType] |
| declineReason | [declineReason] |
| paySource | [paySource] |
| cardType | [cardType] |
| gatewayTitle | [gatewayTitle] |
| orderTotal | [orderTotal] |
| product1_name | [product1_name] |
| product1_price | [product1_price] |
| product1_qty | [product1_qty] |
| product1_externalId | [product1_externalId] |
| product1_recurringstatus | [product1_recurringstatus] |
| product1_billingCycleNumber | [product1_billingCycleNumber] |
| product1_nextBillDate | [product1_nextBillDate] |
| product2_name | [product2_name] |
| product2_price | [product2_price] |
| product2_externalId | [product2_externalId] |
| product2_recurringstatus | [product2_recurringstatus] |
| product2_billingCycleNumber | [product2_billingCycleNumber] |
| product2_nextBillDate | [product2_nextBillDate] |

### Profile 4: TS — Subscription Lifecycle *(Subscription, Cancelled, Paused)*

Add any missing + **add Reactivate routing**:

| Name | Value |
|---|---|
| orderId | [orderId] |
| clientOrderId | [clientOrderId] |
| customerId | [customerId] |
| emailAddress | [emailAddress] |
| firstName | [firstName] |
| lastName | [lastName] |
| dateCreated | [dateCreated] |
| orderStatus | [orderStatus] |
| campaignId | [campaignId] |
| campaignName | [campaignName] |
| purchaseId | [purchaseId] |
| clientPurchaseId | [clientPurchaseId] |
| originalOrderId | [originalOrderId] |
| originalClientOrderId | [originalClientOrderId] |
| recurringPrice | [recurringPrice] |
| sourceId | [sourceId] |
| pubId | [pubId] |
| product1_name | [product1_name] |
| product1_price | [product1_price] |
| product1_externalId | [product1_externalId] |
| product1_recurringstatus | [product1_recurringstatus] |
| product1_billingCycleNumber | [product1_billingCycleNumber] |
| product2_name | [product2_name] |
| product2_externalId | [product2_externalId] |
| product2_recurringstatus | [product2_recurringstatus] |
| product2_billingCycleNumber | [product2_billingCycleNumber] |

**Add routing:** Profile Routing → `+` → Profile: TS — Subscription Lifecycle → Type: **Reactivate**

### Profile 5: TS — Refund *(NEW — create this profile)*

- [ ] Create new Postback profile named `TS — Refund`
- [ ] Set Postback URL
- [ ] Add routing: Type = **Refund**
- [ ] Add fields:

| Name | Value |
|---|---|
| orderId | [orderId] |
| clientOrderId | [clientOrderId] |
| customerId | [customerId] |
| emailAddress | [emailAddress] |
| dateCreated | [dateCreated] |
| orderStatus | [orderStatus] |
| campaignId | [campaignId] |
| orderTotal | [orderTotal] |
| dateRefunded | [dateRefunded] |
| refundReason | [refundReason] |
| product1_name | [product1_name] |
| product1_price | [product1_price] |
| product1_externalId | [product1_externalId] |

### Profile 6: TS — Chargeback *(NEW — create if Chargeback routing option exists)*

- [ ] Check if **Chargeback** appears as a routing Customer Type option in CC
- [ ] If yes: create profile `TS — Chargeback`, set routing, add fields:

| Name | Value |
|---|---|
| orderId | [orderId] |
| clientOrderId | [clientOrderId] |
| customerId | [customerId] |
| emailAddress | [emailAddress] |
| dateCreated | [dateCreated] |
| campaignId | [campaignId] |
| chargebackAmount | [chargebackAmount] |
| chargebackDate | [chargebackDate] |
| chargebackReasonCode | [chargebackReasonCode] |
| chargebackNote | [chargebackNote] |
| cardType | [cardType] |
| product1_name | [product1_name] |
| product1_externalId | [product1_externalId] |

- [ ] If **Chargeback** is not a routing option: note it here and handle chargebacks via the Refund profile (they often fire together)

---

## Future: custom field enrichment (park for later)

When the Shopify → CC redirect is instrumented, `custom2` through `custom5` can carry behavioral context that comes back in every webhook:

- `custom2` → GA4 client ID (session bridge for true funnel attribution)
- `custom3` → Clarity session ID (behavioral data join)
- `custom4` → time on page / scroll depth before checkout
- `custom5` → visit count (first visit vs repeat visitor)

This unlocks AI features like: "did customers with higher page engagement subscribe at higher rates?" Not for now — park until redirect instrumentation is built.
