# Product mapping

## Overview

Shopify is the product master catalog. All other sources map to Shopify product IDs. The product_map table holds the canonical mapping enriched with business metadata.

## Mapping chain

```
Shopify product ID (canonical)
  ↕ CC productN_externalId (auto-linked)
  ↕ CC productN_campaignProductId (per-campaign offer variant)
  ↕ CC productN_crmId (base product ID in CC)
  ↕ Klaviyo Ordered Product event (product name + SKU)
```

## Auto-linking

CC webhooks include `productN_externalId` which is the Shopify product ID. This enables automatic mapping for most products. The ingestion layer:

1. Receives CC order with productN_externalId
2. Looks up product_map by externalId → finds Shopify product
3. Attaches product_map metadata (productLine, frequency, category) to the order_item

## Manual mapping (admin UI)

For products where auto-linking fails (externalId is null or doesn't match):
- Admin screen shows all unmapped CC products
- User can search Shopify products and link manually
- Klaviyo triangulation: show Klaviyo Ordered Product events for the same customer/timestamp to help identify the correct Shopify product

## Metadata enrichment

Each product_map entry includes:
- **productLine** — grouping (e.g., "Sculpt+", "ThermoSlim GLP-1"). Multiple SKUs can share a product line.
- **frequency** — supply duration: "1_MONTH", "3_MONTH", "6_MONTH". Derived from product name, SKU, or manual entry.
- **category** — product category
- **priceTier** — pricing tier label
- **isSubscription** — whether this is a subscription product

## Product families

Individual SKUs like "Sculpt+ Gel 1-Month", "Sculpt+ Gel 3-Month", "Sculpt+ Gel 6-Month" are three product_map entries but share the same `productLine` = "Sculpt+". Reports can aggregate at both levels.
