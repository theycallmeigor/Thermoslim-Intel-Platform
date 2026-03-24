# CheckoutChamp Webhook Profiles Setup Plan

> **For agentic workers:** This is an **operational configuration plan** — steps are performed in the CheckoutChamp admin UI, not in code. Use `superpowers:executing-plans` to track progress.

**Goal:** Configure all CheckoutChamp export webhook profiles so every order event (Sale, Upsell, Recurring, Refund, Cancelled, Reactivate) flows in real-time into the ThermoSlim platform receiver.

**Architecture:** One postback profile with six routing rules. All events go to the same receiver URL; the `event` field in the payload tells the app how to handle each one. Field mappings are configured once on the profile and apply to every event type.

**Tech Stack:** CheckoutChamp Admin UI → `Admin → Export` · ThermoSlim receiver at `/api/webhooks/checkoutchamp/ts-webhook-be8b18ec5ad97fe512d98255`

---

## Pre-flight Reference

**Receiver URL** (paste this exactly into CC):
```
https://[YOUR-PRODUCTION-DOMAIN]/api/webhooks/checkoutchamp/ts-webhook-be8b18ec5ad97fe512d98255
```
> Replace `[YOUR-PRODUCTION-DOMAIN]` with the live deployment domain (e.g. `app.thermoslim.com`). This URL is the secret — CC must be the only system that knows it.
>
> There are two receiver routes in the codebase. Use this one (secret-in-URL path), NOT `/api/webhooks/checkoutchamp?secret=...`. The path-secret route (`ts-webhook-be8b18ec5ad97fe512d98255/route.ts`) validates that `CC_WEBHOOK_SECRET` env var equals the path segment. Ensure `.env` has: `CC_WEBHOOK_SECRET=ts-webhook-be8b18ec5ad97fe512d98255`

**Local testing alternative** (while in development):
Use [ngrok](https://ngrok.com) or [localtunnel](https://localtunnel.me) to expose `localhost:3000` publicly, then use that temporary URL. Switch to the production URL before going live.

```bash
# Start ngrok tunnel (if testing locally)
npx ngrok http 3000
# Copy the https:// URL it gives you → use as [YOUR-PRODUCTION-DOMAIN]
```

> **Known adapter limitation:** CC postback payloads send product data as flat fields (`product1_name`, `product1_sku`, etc.). The current adapter reads the nested `items` object format from the API sync path. **Product line items will be empty on webhook-sourced orders** until the adapter is updated to handle flat product fields. Order, customer, subscription, and attribution data all work correctly. This is tracked as a separate code fix.

---

## Task 1: Verify the Receiver Is Live

Before creating any profile, confirm the endpoint responds correctly.

- [ ] **Step 1: Send a test POST to the receiver**

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST \
  "https://[YOUR-PRODUCTION-DOMAIN]/api/webhooks/checkoutchamp/ts-webhook-be8b18ec5ad97fe512d98255" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"PREFLIGHT-001","emailAddress":"preflight@test.com","totalAmount":"0.00","campaignId":"1","dateCreated":"2026-03-23 00:00:00"}'
```

Expected: `200`

- [ ] **Step 2: Confirm return codes**

| Code | Meaning | Fix |
|------|---------|-----|
| `200` | Route is reachable and auth passed | ✅ Continue |
| `401` | `CC_WEBHOOK_SECRET` env var isn't `ts-webhook-be8b18ec5ad97fe512d98255` | Check `.env.local` |
| `404` | App isn't deployed / Next.js not running | Fix deployment first |
| `500` | Route reached but adapter threw | Check server logs for error |

- [ ] **Step 3: Verify the test order was ingested**

```sql
SELECT source_order_id, status, order_total, customer_email
FROM orders
WHERE source = 'CHECKOUTCHAMP' AND source_order_id = 'PREFLIGHT-001';
```

Expected: one row. This confirms end-to-end — route → adapter → DB — works before you configure any CC profiles.

> Note: the DB check will fail because `emailAddress=preflight@test.com` creates a new customer row. That's fine for a pre-flight test. Delete it after: `DELETE FROM orders WHERE source_order_id = 'PREFLIGHT-001';`

- [ ] **Step 4: Commit nothing** — this is verification only.

---

## Task 2: Create the Export Profile

Navigate in CC: **Admin → Export** (top navigation bar).

- [ ] **Step 1: Open Export**

Log into CheckoutChamp → top nav → **Admin** → **Export**.

- [ ] **Step 2: Create new profile**

Click the green **"+"** button.

Fill in:

| Field | Value |
|-------|-------|
| **Name** | `ThermoSlim Platform — All Events` |
| **Export Type** | `Postback` |
| **Postback URL** | `https://[YOUR-PRODUCTION-DOMAIN]/api/webhooks/checkoutchamp/ts-webhook-be8b18ec5ad97fe512d98255` |

Click **Create**.

- [ ] **Step 3: Confirm the profile appears in the list**

You should see `ThermoSlim Platform — All Events` in the export profiles list.

---

## Task 3: Configure Field Mappings

Click **Edit** on the profile you just created.

Add each mapping below. For each row: click **"+"** in the Field Mappings section → enter CC Field Name → enter Key Name → Save.

> The "CC Field Name" is what CC sends. The "Key Name" is what arrives at our receiver. Keep them identical to match the adapter's expected field names.

### 3A — Order Identity

- [ ] Add mappings for order identity fields:

| CC Field Name | Key Name | Purpose |
|---------------|----------|---------|
| `orderId` | `orderId` | Idempotency key — **required** |
| `clientOrderId` | `clientOrderId` | CC string order ID |
| `externalOrderId` | `externalOrderId` | Shopify order ID |
| `orderType` | `orderType` | NEW_SALE, REBILL, CHARGEBACK |
| `orderStatus` | `orderStatus` | COMPLETE, PARTIAL, DECLINED, REFUNDED |
| `responseType` | `responseType` | SUCCESS, HARD_DECLINE, SOFT_DECLINE |
| `declineReason` | `declineReason` | Processor decline text |
| `dateCreated` | `dateCreated` | Order timestamp |
| `dateUpdated` | `dateUpdated` | Last update timestamp |

### 3B — Revenue

- [ ] Add mappings for revenue fields:

| CC Field Name | Key Name | Purpose |
|---------------|----------|---------|
| `totalAmount` | `totalAmount` | Order total |
| `price` | `price` | Total including upsells + shipping |
| `baseShipping` | `baseShipping` | Shipping amount |
| `discountPrice` | `discountPrice` | Discount applied |
| `salesTax` | `salesTax` | Tax amount |
| `currencyCode` | `currencyCode` | USD / etc. |
| `couponCode` | `couponCode` | Coupon used at checkout |
| `ipAddress` | `ipAddress` | Customer IP at checkout |
| `hasUpsell` | `hasUpsell` | Whether upsells were added |

### 3C — Customer

- [ ] Add mappings for customer fields:

| CC Field Name | Key Name | Purpose |
|---------------|----------|---------|
| `customerId` | `customerId` | CC customer ID |
| `emailAddress` | `emailAddress` | **Primary join key across all systems** |
| `firstName` | `firstName` | Customer first name |
| `lastName` | `lastName` | Customer last name |
| `name` | `name` | Full name |
| `phoneNumber` | `phoneNumber` | Phone |
| `address1` | `address1` | Billing address |
| `city` | `city` | City |
| `state` | `state` | State |
| `postalCode` | `postalCode` | ZIP |
| `address2` | `address2` | Billing address line 2 |
| `country` | `country` | Country |
| `shipFirstName` | `shipFirstName` | Shipping first name |
| `shipLastName` | `shipLastName` | Shipping last name |
| `shipAddress1` | `shipAddress1` | Shipping street |
| `shipAddress2` | `shipAddress2` | Shipping address line 2 |
| `shipCity` | `shipCity` | Shipping city |
| `shipState` | `shipState` | Shipping state |
| `shipPostalCode` | `shipPostalCode` | Shipping ZIP |
| `shipCountry` | `shipCountry` | Shipping country |

### 3D — Attribution (Critical)

- [ ] Add mappings for attribution fields:

| CC Field Name | Key Name | Purpose |
|---------------|----------|---------|
| `campaignId` | `campaignId` | Which CC campaign |
| `campaignName` | `campaignName` | Campaign name |
| `salesUrl` | `salesUrl` | Landing page URL — join key to GA4 + Clarity |
| `funnelReferenceId` | `funnelReferenceId` | Funnel ID |
| `sourceId` | `sourceId` | Affiliate ID |
| `affId` | `affId` | Affiliate ID (alt field) |
| `sourceValue1` | `sourceValue1` | Tracking param 1 |
| `sourceValue2` | `sourceValue2` | Tracking param 2 |
| `sourceValue3` | `sourceValue3` | Tracking param 3 |
| `sourceValue4` | `sourceValue4` | Tracking param 4 |
| `sourceValue5` | `sourceValue5` | Tracking param 5 |
| `UTMSource` | `UTMSource` | UTM source |
| `UTMMedium` | `UTMMedium` | UTM medium |
| `UTMCampaign` | `UTMCampaign` | UTM campaign |
| `UTMTerm` | `UTMTerm` | UTM term |
| `UTMContent` | `UTMContent` | UTM content |
| `custom1` | `custom1` | **Shopify cart ID** — attribution bridge |
| `custom2` | `custom2` | Custom value 2 |
| `custom3` | `custom3` | Custom value 3 |
| `custom4` | `custom4` | Custom value 4 |
| `custom5` | `custom5` | Custom value 5 |

### 3E — Payment Verification

- [ ] Add mappings for payment fields:

| CC Field Name | Key Name | Purpose |
|---------------|----------|---------|
| `cardType` | `cardType` | VISA, MASTERCARD, etc. |
| `cardLast4` | `cardLast4` | Last 4 digits |
| `paySource` | `paySource` | CREDITCARD, APPLEPAY, etc. |
| `avsResponse` | `avsResponse` | AVS check result |
| `cvvResponse` | `cvvResponse` | CVV check result |
| `cardIsDebit` | `cardIsDebit` | Debit card flag |
| `cardIsPrepaid` | `cardIsPrepaid` | Prepaid card flag |
| `isDeclineSave` | `isDeclineSave` | Decline save flag |
| `refundRemaining` | `refundRemaining` | Refundable amount |

### 3F — Subscription

- [ ] Add mappings for subscription fields:

| CC Field Name | Key Name | Purpose |
|---------------|----------|---------|
| `purchaseId` | `purchaseId` | Subscription numeric ID |
| `clientPurchaseId` | `clientPurchaseId` | Subscription string ID |
| `originalOrderId` | `originalOrderId` | First order in subscription |

### 3G — Products (Slots 1–5) — Map for future use

> **Current limitation:** CC postbacks send product data as flat fields (`product1_name`, `product1_sku`, etc.), but the adapter currently reads products from the `items` object format returned by the API sync. **Product line items will not be populated from webhooks yet.** Map these fields anyway so the data is available when the adapter is updated to handle flat fields.

- [ ] Add product slot 1 mappings:

| CC Field Name | Key Name |
|---------------|----------|
| `product1_name` | `product1_name` |
| `product1_sku` | `product1_sku` |
| `product1_externalId` | `product1_externalId` |
| `product1_crmId` | `product1_crmId` |
| `product1_campaignProductId` | `product1_campaignProductId` |
| `product1_price` | `product1_price` |
| `product1_qty` | `product1_qty` |
| `product1_recurringstatus` | `product1_recurringstatus` |
| `product1_billingCycleNumber` | `product1_billingCycleNumber` |

- [ ] Repeat for product slots 2, 3, 4, 5 (same fields, increment the number)

- [ ] **Step 3: Click Update to save all mappings**

---

## Task 4: Add Profile Routing Rules

Still on the same profile edit screen — scroll to **Profile Routing** section.

Add one routing rule per event type below. For each: click **"+"** in Profile Routing → configure → click **Create**.

- [ ] **Rule 1 — Sale** (new purchases)

| Field | Value |
|-------|-------|
| Profile | `ThermoSlim Platform — All Events` |
| Customer Type | `Sale` |
| Campaign | `All` |
| Product | `All` |

- [ ] **Rule 2 — Upsell** (upsell accepted)

| Field | Value |
|-------|-------|
| Profile | `ThermoSlim Platform — All Events` |
| Customer Type | `Upsell` |
| Campaign | `All` |
| Product | `All` |

- [ ] **Rule 3 — Recurring** (subscription rebill)

| Field | Value |
|-------|-------|
| Profile | `ThermoSlim Platform — All Events` |
| Customer Type | `Recurring` |
| Campaign | `All` |
| Product | `All` |

- [ ] **Rule 4 — Refund**

| Field | Value |
|-------|-------|
| Profile | `ThermoSlim Platform — All Events` |
| Customer Type | `Refund` |
| Campaign | `All` |
| Product | `All` |

- [ ] **Rule 5 — Cancelled** (subscription cancelled)

| Field | Value |
|-------|-------|
| Profile | `ThermoSlim Platform — All Events` |
| Customer Type | `Cancelled` |
| Campaign | `All` |
| Product | `All` |

- [ ] **Rule 6 — Reactivate** (cancelled subscription reactivated)

| Field | Value |
|-------|-------|
| Profile | `ThermoSlim Platform — All Events` |
| Customer Type | `Reactivate` |
| Campaign | `All` |
| Product | `All` |

- [ ] **Final step: Click Update on the main profile**

All 6 routing rules are now active.

---

## Task 5: Test Each Event Type

Use a test campaign/gateway in CC to place test orders. Check platform logs after each.

### 5A — Test a Sale event

- [ ] **Step 1: Place a test order in CC**

Use a test campaign and Stripe test card `4242 4242 4242 4242`.

- [ ] **Step 2: Confirm webhook arrives at receiver**

The route only logs on failure:
```
[cc webhook] processing error: ...   ← something went wrong
```
No log line ≠ success — it could mean the request never arrived. The only reliable signal is the database check below.

- [ ] **Step 3: Verify in the database**

```sql
SELECT source_order_id, status, order_total, cc_custom1
FROM orders
WHERE source = 'CHECKOUTCHAMP'
ORDER BY created_at DESC
LIMIT 5;
```

Expect: your test order row with correct `order_total` and `cc_custom1` populated (if you passed `custom1` in the checkout URL).

### 5B — Test a Cancelled event

- [ ] Cancel the test subscription in CC admin
- [ ] Confirm a second webhook fires and the subscription row updates in the DB:

```sql
SELECT status, cc_purchase_id
FROM subscriptions
ORDER BY updated_at DESC
LIMIT 5;
```

Expect: status = `CANCELLED`.

### 5C — Spot-check field coverage

- [ ] Confirm these specific fields arrived and are non-null in the order row:
  - `email_address` (customer join key)
  - `campaign_id`
  - `sales_url`
  - `cc_custom1` (if you passed Shopify cart ID at redirect time)

> **Note:** `product1_name` will be null — this is expected. Product data from webhooks requires a separate adapter update (flat field parser). Product detail is available via the API sync path in the meantime.

---

## Task 6: Custom Field Definition in Campaign Settings

`custom1` only returns populated data if the CC campaign has a custom field defined.

- [ ] **Step 1: Navigate to Campaign Settings**

In CC: **Campaigns → [Your Campaign] → Settings → Custom Fields**

- [ ] **Step 2: Add the custom field**

| Field | Value |
|-------|-------|
| Field Name | `shopifyCartId` |
| Type | Text |

Click **Save**.

- [ ] **Step 3: Confirm the redirect script passes it**

In your Shopify checkout redirect script, verify you're passing `customData.shopifyCartId = window.cartId` in the CC redirect URL. Without this, `custom1` will always be empty in the webhook payload.

- [ ] **Step 4: Place another test order and confirm `cc_custom1` is populated in the DB**

---

## Troubleshooting Reference

| Symptom | Check |
|---------|-------|
| No webhook fires | Profile routing `Customer Type` matches the event type? Is campaign set to "All"? |
| `custom1` is empty | Custom field `shopifyCartId` defined in Campaign Settings? Redirect script passing it? |
| Webhook fires but receiver returns error | Check server logs — likely a field type error in the adapter |
| Duplicate rows in DB | Idempotency is handled by the pipeline upsert on `source + sourceOrderId` — safe to ignore retries |
| 401 from receiver | Confirm the URL path matches `ts-webhook-be8b18ec5ad97fe512d98255` exactly AND `.env` has `CC_WEBHOOK_SECRET=ts-webhook-be8b18ec5ad97fe512d98255` |
| Product fields empty (`product1_name` null) | Expected — current adapter reads `items` object (API format), not flat webhook fields. This is a known gap, not a config error. |

---

## Profile Summary (What You'll Have When Done)

| Profile | Event Rules | URL |
|---------|-------------|-----|
| ThermoSlim Platform — All Events | Sale, Upsell, Recurring, Refund, Cancelled, Reactivate | `/api/webhooks/checkoutchamp/ts-webhook-be8b18ec5ad97fe512d98255` |

Total: **1 profile · 6 routing rules · ~55 field mappings**
