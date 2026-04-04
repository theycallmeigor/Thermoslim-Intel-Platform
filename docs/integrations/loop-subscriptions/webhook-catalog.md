---
title: Loop Subscriptions Webhook Catalog
source: Phase 2 research
created: 2026-03-30
---

# Loop Subscriptions Webhook Catalog

## Webhook Configuration

- **Setup Method:** Webhooks can be set up via the Loop Admin UI or API requests utilizing the `/webhooks` endpoints.
- **Delivery Method:** Uses HTTP POST to the respective developer endpoints.
- **Timeout and Retries:** A webhook expects a 200 HTTP response within a 5-second window. Any failures automatically trigger retries across a rolling window extending 48 hours before dropping.
- **Security:** Demands secure HTTPS connections across all destination webhooks.
- **Verification Signature:** The webhook transmits the `X-Loop-Webhook-Id`, `X-Loop-Webhook-Api-Version`, `X-Loop-Webhook-Topic`, `X-Loop-Webhook-Created-At`, `X-Loop-Webhook-Delivery-At`, and `X-Loop-Webhook-Retry-Count` headers to ensure accurate delivery verification, deduplication, and timing integrity. (*Signature decoding and HMAC token references NOT FOUND — requires direct API exploration if manual signature validation is enforced.*)

## Event Types

### Subscription Events
| Event | Trigger | Description |
|-------|---------|-------------|
| `subscription.created` | New subscription is established | Activates post-checkout for new subscriptions |
| `subscription.paused` | Subscription paused | Status paused by merchant/customer action |
| `subscription.updated` | Subscription modified | Internal lines or metadata changed |
| `subscription.cancelled`| Subscription cancelled | Cancels future billings permanently |
| `subscription.resumed` | Subscription resumed | Returns a paused sub to active billing |
| `subscription.reactivated` | Reactivated | Pulls a cancelled subscription back online |
| `subscription.delayed` | Order pushed back | Modifies the immediate upcoming delivery date |
| `subscription.rescheduled`| Rescheduled billing | Shifts global billing anchor intervals |
| `subscription.expired` | Contract ended | Expire trigger due to end of billing loops |
| `subscription.inventoryAction` | Inventory alerts | Out-of-stock triggering subscription failure events |

### Order & Billing Events
| Event | Trigger | Description |
|-------|---------|-------------|
| `order.upcoming` | Pre-billing notification | Upcoming charge sequence initiation |
| `order.processed` | Payment succeeds | Triggers when the charge successfully passes |
| `order.paymentFailed` | Payment fails | Billing authorization rejected, triggering dunning |
| `order.partiallyProcessed` | Split-billing pass | Some products passed validation, others failed |
| `order.outOfStock` | Stock exception | Shopify rejected order processing via low stock |
| `order.skipped` | Order skipped | Skips a single upcoming sequence |
| `order.unskipped` | Reinstated order | Counter to the skip order webhook |

### Payment Method Events
| Event | Trigger | Description |
|-------|---------|-------------|
| `paymentMethod.updateRequested` | Email sent | Customer triggered an email to change wallet |
| `paymentMethod.updated` | Wallet updated | The secure vault accepted the new payment type |
| `paymentMethod.expiringSoon` | Card expiry | Detects upcoming month expirations natively |

## Payload Structures

### `subscription.created` (Example Subscription Entity payload structure)
```json
{ 
  "payload": { 
    "id": 8888999, 
    "status": "ACTIVE", 
    "customer": { "email": "customer@example.com", "firstName": "John", "lastName": "Smith" },
    "lineItems": [ { "sku": "SHO12345", "price": "5.39", "quantity": 1 } ],
    "nextOrderDate": "2025-04-18T12:00:00.000Z"
  }, 
  "metaData": { "myshopifyDomain": "customshop.myshopify.com" }
}
```

### `flow/completed` (Example Automation Flow Payload)
```json
{
  "payload": {
    "id": 9876543,
    "name": "Loyalty Program Order - Free Hydrating Face Moisturizer",
    "subscription": { "id": 8765432, "status": "ACTIVE" }
  },
  "metaData": { "myshopifyDomain": "premiumcare.myshopify.com" }
}
```
*Note: Deep payload structures for Payment Failed or Order Skips NOT FOUND — requires direct API exploration into standard readouts.*

## ThermoSlim Mapping Preview

| Loop Event | → ThermoSlim SubscriptionEventType | Notes |
|------------|-------------------------------------|-------|
| `subscription.created` | `CREATED` | Found in webhook docs |
| `order.processed` | `BILLED` | Mapped inferred from successful payment parsing |
| `order.paymentFailed` | `DECLINED` | Dunning initiation |
| `subscription.cancelled`| `CANCELLED` | Found in webhook docs |
| `subscription.paused` | `PAUSED` | Found in webhook docs |
| `subscription.resumed` | `RESUMED` | Found in webhook docs |
| `subscription.reactivated` | `REACTIVATED` | Separated structurally from Standard Resume |
| `subscription.updated` | *Unhandled natively by Event Type* | Metadata logs, or mapping to explicit line-item data updates over system log enums. |
| `subscription.delayed` / `subscription.rescheduled` | *Unhandled natively by Event Type* | Handled via properties on the root Subscription `nextBillDate` shifting |
