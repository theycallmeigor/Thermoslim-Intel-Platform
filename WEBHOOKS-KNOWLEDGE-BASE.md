# CheckoutChamp Webhooks — Setup Guide & Knowledge Base

**Source:** CC Expert AI project — compiled from live deployments, CC official docs, and integration research
**Date:** 2026-03-23
**Purpose:** Step-by-step guide for configuring CC webhooks + complete reference for agents building on top of CheckoutChamp

---

## Overview: Two Webhook Directions

| Direction | CC Name | What it does |
|-----------|---------|--------------|
| **Outbound** | Export Webhooks / Postback Profiles | CC fires to YOUR URL when order events happen |
| **Inbound** | Import Lead API / Plugin Webhooks | You (or a 3rd party) POST data into CC |

The main pattern for building apps on CC is **outbound export webhooks** — CC sends you the order data after it fires.

---

## Part 1 — Setting Up an Export Webhook (Step by Step)

This is the primary flow: CC fires order data to your endpoint.

### Step 1: Open the Export Section

1. Log into CheckoutChamp
2. In the top nav: **Admin → Export**
3. You'll see a list of existing export profiles (if any)

### Step 2: Create a New Export Profile

1. Click the green **"+"** button
2. Fill in:
   - **Name:** Something descriptive, e.g., `Order Notify — My App`
   - **Export Type:** Select **Postback**
   - **Postback URL:** Your receiver endpoint, e.g., `https://your-app.com/api/webhooks/cc`
3. Click **Create**

> **What "Postback" means:** CC will POST order data as form-encoded or JSON to your URL every time a matching event fires. Your endpoint must be publicly reachable (not localhost).

### Step 3: Configure Field Mappings

After creating, click **Edit** on the profile.

Field mappings tell CC **which data fields to include** in the postback payload.

Add mappings for the fields you need. Key ones:

| CC Field Name | What it is | Recommended key name |
|---------------|-----------|----------------------|
| `orderId` | Unique CC order ID | `orderId` |
| `orderTotal` | Order value | `orderTotal` |
| `campaignId` | Which CC campaign | `campaignId` |
| `custom1` | Your attribution value (e.g., Shopify cart ID) | `custom1` |
| `couponCode` | Coupon used | `couponCode` |
| `cardType` | Payment method | `cardType` |
| `clientOrderId` | Your own order ID if passed | `clientOrderId` |
| `clientPurchaseId` | Subscription ID (for LTV tracking) | `clientPurchaseId` |
| `emailAddress` | Customer email | `emailAddress` |
| `firstName` / `lastName` | Customer name | `firstName`, `lastName` |

Add only what you need. Click **Update** to save.

### Step 4: Set Up Profile Routing

Profile Routing controls **which events trigger** this postback.

1. In the **Profile Routing** section, click the **"+"** button
2. Configure:
   - **Profile:** Select the profile you just created
   - **Customer Type:** Choose the event type (see table below)
   - **Campaign:** Select a specific campaign, or leave as "All"
   - **Product:** Select a specific product, or leave as "All"
3. Click **Create**

**Customer Type / Event options:**

| Event | When it fires |
|-------|--------------|
| **Sale** | New purchase completes — the main conversion event |
| **Reactivate** | Cancelled subscription reactivates |
| **Cancelled** | Subscription is cancelled |
| **Refund** | Order refunded |
| **Recurring** | Recurring subscription charge fires |
| **Upsell** | Upsell accepted after main purchase |

> For most use cases (order attribution, analytics), set to **Sale**.
> For membership integrations (Circle.so, Kajabi), you need **Sale + Reactivate** for add-member, and a separate profile with **Cancelled** for remove-member.

### Step 5: Click Update to Save

After adding profile routing, click **Update** on the main profile. The webhook is now live.

### Step 6: Test It

Before going live:
1. Place a test order in CC (use a test campaign/gateway)
2. Check your receiver endpoint logs — the postback should arrive within seconds
3. Verify `custom1` and other mapped fields are present in the payload
4. If nothing arrives: check the Postback URL is publicly accessible and the routing event matches

---

## Part 2 — Custom Fields (The Attribution Bridge)

Custom fields are how you pass data from Shopify (or any source) into CC so it comes back in the webhook.

### How to Define a Custom Field in CC

1. Go to **Campaign Settings** for your campaign
2. Find the **Custom Fields** section
3. Add a new field: e.g., name it `shopifyCartId`
4. Save

### How to Pass It at Redirect Time

When redirecting a customer from Shopify to CC, append the value to the URL:

```javascript
// In your checkout redirect script (Shopify side)
function redirectToCCCheckout() {
  const cartId = window.cartId; // Shopify's native cart ID

  const checkoutUrl = buildCheckoutURL({
    campaignId: CAMPAIGN_ID,
    products: [ccProductId],
    coupon: activeCoupon,
    customData: {
      shopifyCartId: cartId     // ← This becomes custom1 in CC
    }
  });

  // IMPORTANT: Log redirect event BEFORE sending customer away
  fetch('/api/log-redirect', {
    method: 'POST',
    body: JSON.stringify({
      shopify_cart_id: cartId,
      cc_product_id: ccProductId,
      timestamp: new Date().toISOString()
    })
  });

  window.location.href = checkoutUrl;
}
```

### What CC Returns in the Webhook

```json
{
  "event": "order_created",
  "orderId": "C3E67A9BD0",
  "customerId": 46611,
  "campaignId": 13,
  "orderTotal": "89.99",
  "couponCode": "20OFF",
  "cardType": "VISA",
  "custom1": "gid://shopify/Cart/abc123",
  "customFields": {
    "shopifyCartId": "gid://shopify/Cart/abc123"
  }
}
```

> `custom1` and `customFields.shopifyCartId` contain the same value. Use whichever your payload returns — check your field mappings.

---

## Part 3 — Building the Webhook Receiver

### Minimal Node.js Handler

```javascript
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // CC may POST form-encoded

app.post('/api/webhooks/cc', async (req, res) => {
  const order = req.body;

  // RULE #1: Always respond 200 immediately
  // CC will retry on timeout — process async after responding
  res.json({ success: true });

  try {
    const shopifyCartId = order.customFields?.shopifyCartId
      || order.custom1
      || null;

    // RULE #2: Idempotency — use orderId as dedup key
    const exists = await db.query(
      'SELECT 1 FROM cc_orders WHERE order_id = ?', [order.orderId]
    );
    if (exists.length > 0) return; // Already processed

    await db.insert('cc_orders', {
      order_id: order.orderId,
      shopify_cart_id: shopifyCartId,
      order_value: parseFloat(order.orderTotal),
      campaign_id: order.campaignId,
      coupon_code: order.couponCode || '',
      card_type: order.cardType || '',
      event_type: order.event || 'order_created',
      timestamp: new Date()
    });

  } catch (err) {
    console.error('Webhook processing error:', err);
    // Don't throw — 200 already sent
  }
});

app.listen(3000);
```

### Two Rules You Cannot Skip

**Rule 1 — Respond 200 first, process after.**
CC (and most webhook senders) retry if your endpoint times out. If your DB insert takes 500ms and CC times out at 200ms, you get duplicate deliveries. Send `200` first, then do the work.

**Rule 2 — Use orderId as an idempotency key.**
CC can send duplicate events for the same order (retries, test mode). Always check if you've already processed that `orderId` before inserting.

---

## Part 4 — Full Attribution Flow (Shopify → CC → Webhook)

```
1. Customer is on Shopify cart page
   └─ window.cartId = "abc123"
   └─ qty_selected = "3-pack"
   └─ coupon = "20OFF"

2. Customer clicks "Checkout"
   └─ Your script logs the cart event to ClickHouse
   └─ Builds CC redirect URL with ?customData={"shopifyCartId":"abc123"}
   └─ Redirects customer to CC

3. Customer completes order in CC
   └─ CC stores custom1 = "abc123" on the order

4. CC fires webhook to your receiver
   └─ Payload includes: orderId, orderTotal, custom1 = "abc123"

5. Your receiver joins the data
   └─ Shopify cart "abc123" → CC order "CC123456"
   └─ Full funnel record: qty selected, conversion, AOV

6. Query in ClickHouse
   └─ SELECT qty_selected, conversion_rate FROM ...
   └─ "3-pack converts at 22%, 5-pack at 9%"
```

### The Attribution Query (ClickHouse)

```sql
SELECT
  s.qty_selected,
  COUNT(DISTINCT s.cart_id) as carts,
  COUNT(DISTINCT o.order_id) as orders,
  round(100.0 * COUNT(DISTINCT o.order_id) / COUNT(DISTINCT s.cart_id), 2) as conversion_rate,
  avg(o.order_value) as aov

FROM shopify_cart_events s
LEFT JOIN cc_orders o ON s.cart_id = o.shopify_cart_id
WHERE s.timestamp >= now() - interval 30 day
GROUP BY s.qty_selected
ORDER BY conversion_rate DESC;
```

---

## Part 5 — ClickHouse Schema

```sql
-- Shopify side: what customer selected before redirect
CREATE TABLE shopify_cart_events (
  cart_id String,
  store_id String,
  customer_id String,
  product_id String,
  qty_selected UInt8,
  coupon_code String,
  cart_total Float64,
  redirected_to_cc UInt8,
  timestamp DateTime
) ENGINE = MergeTree ORDER BY (timestamp, cart_id);

-- CC side: confirmed orders from webhooks
CREATE TABLE cc_orders (
  order_id String,
  shopify_cart_id String,     -- custom1 from webhook
  campaign_id String,
  order_value Decimal(10,2),
  coupon_code String,
  card_type String,
  event_type String,
  timestamp DateTime
) ENGINE = MergeTree ORDER BY (timestamp, shopify_cart_id);
```

---

## Part 6 — Third-Party Integrations via Export Webhooks

### Circle.so (Community Membership)

You need **two separate export profiles** — one to add members, one to cancel.

**Profile 1 — Add Member:**
1. `Admin → Export → +`
2. Name: `Circle.so — Add Member`
3. Type: Postback
4. URL: `https://app.circle.so/api/v1/community_members/invite` (get from Circle docs)
5. Field mappings:
   - `token` → your Circle API token
   - `email` → customer email
   - `community_id` → your Circle community ID
   - `name` → customer name
6. Profile routing: **Sale** + **Reactivate**

**Profile 2 — Cancel Member:**
1. Same setup, different URL and routing
2. Profile routing: **Cancelled**
3. Use Circle's remove/cancel endpoint

> **Warning:** Test with non-live accounts before routing real customers. Membership access issues are hard to reverse.

### Kajabi (Course/Membership Platform)

1. First, set up a webhook in Kajabi: get the **Postback URL** from Kajabi's settings
2. In CC: `Admin → Export → +`
3. Name: `Kajabi — Membership`
4. Type: Postback
5. Postback URL: paste the URL from Kajabi
6. Add field mappings per Kajabi's required fields
7. Profile routing: **Sale** + **Reactivate**

### Affiliate Networks (Everflow, etc.)

Affiliate postbacks use a slightly different path in CC — they go through **Affiliate Pixels**, not Export Profiles.

1. Set up your affiliate in CC: `CRM → Affiliates → Edit`
2. Copy the **Tracking String** from the affiliate profile
3. In your affiliate network (e.g., Everflow), create the offer and copy the **Postback URL**
4. Back in CC: `CRM → Affiliates → Edit → Pixels tab → +`
5. Pixel type: **Postback**
6. Paste the postback URL from the affiliate network
7. Click **Create Pixel**

---

## Part 7 — Inbound: Import Lead API

When you need to create a lead/order in CC programmatically (e.g., before redirecting the customer):

```
POST https://api.checkoutchamp.com/leads/import/

loginId=YOUR_API_USER
password=YOUR_PASSWORD
firstName=John
lastName=Doe
emailAddress=john@example.com
address1=123 Main St
city=Los Angeles
state=CA
country=US
postalCode=90001
phoneNumber=5551234567
campaignId=13
shopifyCartId=gid://shopify/Cart/abc123
```

**Auth:** `loginId` + `password` over HTTPS. No OAuth. Simple.

**Response:**
```json
{
  "result": "SUCCESS",
  "message": {
    "orderId": "C3E67A9BD0",
    "customerId": 46611,
    "orderStatus": "PARTIAL"
  }
}
```

**When to use this vs URL params:**
- URL params (`?customData=...`) — simpler, works for most cases
- Import Lead API — use when you need to set `custom1` server-side, or when the URL param doesn't persist through CC's checkout flow (fallback)

---

## Part 8 — Troubleshooting

| Problem | Check |
|---------|-------|
| Webhook not firing at all | Profile routing event matches the order type (Sale vs Reactivate vs Cancelled)? |
| Webhook fires but `custom1` is empty | Was `customData` included in the redirect URL? Was the custom field defined in Campaign Settings? |
| Getting duplicate events | Are you using `orderId` as idempotency key in your DB? |
| Webhook fires but receiver returns error | CC may retry — make sure you return 200 even when processing fails |
| 3rd party integration (Circle, Kajabi) not adding members | Field mapping names must exactly match the 3rd party API's required field names |
| Test order not triggering webhook | Confirm profile routing Campaign/Product selection includes the test campaign |

---

## Quick Checklists

### For Order Attribution (Shopify → CC → Your App)
- [ ] Define custom field (e.g., `shopifyCartId`) in CC Campaign Settings
- [ ] Pass `window.cartId` in redirect URL as `customData.shopifyCartId`
- [ ] `Admin → Export → +` → Postback → enter your receiver URL
- [ ] Add field mappings: `orderId`, `orderTotal`, `custom1`, `couponCode`
- [ ] Set profile routing: Customer Type = **Sale**, Campaign = your campaign
- [ ] Click **Update**
- [ ] Build receiver: respond 200 first, check `orderId` idempotency, then store
- [ ] Place a test order → confirm webhook arrives with `custom1` populated
- [ ] Store in ClickHouse → join cart events to cc_orders on `shopifyCartId`

### For Membership Integration (Circle.so / Kajabi)
- [ ] Get 3rd party postback/API URL
- [ ] Create export profile for **add** (routing: Sale + Reactivate)
- [ ] Create export profile for **cancel** (routing: Cancelled)
- [ ] Map required fields per 3rd party API docs
- [ ] Test with non-production account first
- [ ] Go live only after confirmed end-to-end test

### For Affiliate Tracking (Everflow etc.)
- [ ] Set up affiliate in CC: `CRM → Affiliates`
- [ ] Copy tracking string from affiliate profile
- [ ] Get postback URL from affiliate network
- [ ] `CRM → Affiliates → Edit → Pixels → +` → Postback → paste URL
- [ ] Test with advertiser test tracking link

---

## Reference: Key Webhook Payload Fields

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | String | Unique CC order ID — use as idempotency key |
| `customerId` | Int | CC customer ID |
| `campaignId` | Int | Which campaign generated the order |
| `orderTotal` | String | Order value (parse to float) |
| `orderStatus` | String | COMPLETE, PARTIAL, CANCELLED, etc. |
| `custom1`–`custom4` | String | Your attribution values passed at redirect time |
| `clientOrderId` | String | Your own order ID (if you passed it) |
| `clientPurchaseId` | String | Subscription ID — critical for LTV tracking |
| `couponCode` | String | Coupon used at checkout |
| `cardType` | String | VISA, MASTERCARD, AMEX, DISCOVER, etc. |
| `emailAddress` | String | Customer email |
| `event` | String | `order_created`, `order_updated`, etc. |

---

*Compiled from CC Expert AI knowledge base — patterns extracted from live CheckoutChamp deployments.*
