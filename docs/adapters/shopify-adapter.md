# Shopify adapter

## Connection
- OAuth app or custom app access token
- Store URL: `{store}.myshopify.com`
- API version: latest stable

## Sync operations

### Products (scheduled: hourly)
- Pull all products and variants
- This is the product master catalog — all other sources map to Shopify product IDs
- Fields: id, title, variants (id, sku, price, barcode), product_type, tags, status
- Populate product_map table with Shopify-side data

### Orders (scheduled: every 15 min + webhooks)
- Pull orders with line items, fulfillments, refunds
- Webhooks: orders/create, orders/updated, refunds/create
- Map to unified orders + order_items tables

### Customers (scheduled: hourly)
- Pull customer records
- Join/deduplicate with CC customers via email

## Webhook events
- `orders/create` — new order
- `orders/updated` — status change, fulfillment update
- `refunds/create` — refund processed
- `products/update` — product catalog change (update product_map)
- `products/delete` — product removed

## Product mapping role
Shopify product ID is the canonical identifier. When ingesting CC data, the `productN_externalId` field contains the Shopify product ID, enabling automatic linking. The admin UI shows unmatched CC products for manual mapping.
