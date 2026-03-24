# Ingestion layer

## Overview

The ingestion layer sits between data source adapters and the unified store. It handles validation, normalization, deduplication, and event routing.

Located in `src/core/ingestion/`.

## Data flow

```
Adapter.sync() or Webhook ──▶ Validator ──▶ Normalizer ──▶ Writer ──▶ Post-hooks
                                  │              │            │           │
                              Reject bad     Map to       Write to    Trigger:
                              records +      unified      Postgres    - snapshot recalc
                              log errors     schema                   - alert evaluation
                                                                      - cache invalidation
```

## Sync modes

### Scheduled pull (API adapters)
- BullMQ jobs running on configurable intervals
- Shopify: every 15 minutes (orders), hourly (products, customers)
- CheckoutChamp: every 15 minutes (orders, transactions)
- Klaviyo: hourly (campaigns, flows), every 15 minutes (events)
- GA4: hourly (traffic data), daily (full reports)
- Clarity: hourly (session/page data — server-side only, no CORS)

### Webhook push (real-time)
- CC export webhooks: order created, refunded, chargebacked, fulfilled
- Shopify webhooks: order created, order updated, product updated, refund created
- Klaviyo webhooks: profile updated, metric events

### Historical backfill
- One-time sync for initial setup
- Cross-reference Shopify orders with CC data to build subscription history
- Paginated API pulls with rate limit handling

## CC product1-5 unpacking

CheckoutChamp sends products as flat fields (product1_name, product1_sku, product2_name, etc.). The ingestion layer unpacks these into normalized order_items rows:

```typescript
function unpackCCProducts(webhook: CCWebhookPayload): OrderItem[] {
  const items: OrderItem[] = [];
  for (let i = 1; i <= 5; i++) {
    const name = webhook[`product${i}_name`];
    if (!name) continue; // no more products
    items.push({
      productSlot: i,
      name,
      sku: webhook[`product${i}_sku`],
      ccCrmId: webhook[`product${i}_crmId`],
      externalId: webhook[`product${i}_externalId`],
      ccCampaignProductId: webhook[`product${i}_campaignProductId`],
      price: parseCents(webhook[`product${i}_price`]),
      quantity: parseInt(webhook[`product${i}_qty`]) || 1,
      recurringStatus: webhook[`product${i}_recurringstatus`] || null,
      billingCycleNumber: parseInt(webhook[`product${i}_billingCycleNumber`]) || null,
      productCategoryId: webhook[`product${i}_productCategoryId`],
      productCategoryName: webhook[`product${i}_productCategoryName`],
    });
  }
  return items;
}
```

## Product map enrichment

After unpacking, each order_item is enriched via the product_map table:

1. Look up by `externalId` (Shopify product ID) — primary match
2. Fallback: look up by `ccCampaignProductId`
3. Fallback: look up by `ccCrmId` + `sku`
4. If no match found: flag for manual mapping in admin UI
5. If match found: attach productLine, frequency, category from product_map

## Deduplication

- CC webhooks: deduplicate by `orderId` + `eventType` + `timestamp`
- Shopify webhooks: deduplicate by webhook ID header (`X-Shopify-Hmac-SHA256`)
- Idempotent writes: upsert on source + sourceOrderId compound key

## Error handling

- Bad records are logged to `ingestion_errors` table with full payload
- Adapter failures trigger retry with exponential backoff (BullMQ)
- After 3 retries: move to dead letter queue, alert ops team
- Partial webhook payloads: ingest what we can, flag incomplete fields
