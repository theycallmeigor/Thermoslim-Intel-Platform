# Architecture overview

## System design

The platform is organized into four layers:

### Layer 1: Data source connectors
Each platform gets its own adapter module implementing a standard interface. The adapter handles authentication, API calls, webhooks, and maps raw data into the unified schema.

**Confirmed sources:**
- **Shopify** — Product master catalog, orders, customers, traffic (REST + GraphQL + webhooks)
- **CheckoutChamp** — Transactions, subscriptions, funnels, attribution (REST API + export webhooks, dual-mode)
- **Klaviyo** — Email campaigns, flows, engagement, attributed revenue (REST API + webhooks)
- **Google Analytics 4** — Traffic sources, landing pages, pre-checkout funnel (GA4 Data API)
- **Microsoft Clarity** — Behavioral analytics: heatmaps, rage clicks, dead clicks, scroll depth (Data Export API, server-side only)

**Future sources:** Payment gateway, 3PL/fulfillment, customer support (Gorgias), ad platforms (Meta, Google, TikTok), reviews, post-purchase surveys, inventory

### Layer 2: Ingestion and normalization
Located in `src/core/ingestion/`. Receives data from adapters, validates, normalizes to unified schema, and writes to the data store.

Key responsibilities:
- CC product1-5 field unpacking into normalized order_items
- Email-based customer join across all sources (CC emailAddress = Shopify customer email = Klaviyo profile email)
- URL-based page join (CC salesUrl = GA4 page path = Clarity page URL)
- Product mapping enrichment (Shopify product ID ↔ CC campaignProductId)
- Webhook deduplication and ordering
- Rate limit handling with exponential backoff

### Layer 3: Unified data store
PostgreSQL with Prisma ORM. See `docs/architecture/unified-schema.md` for full entity design.

Core entities: orders, order_items, customers, subscriptions, subscription_events, revenue_events, product_map, funnel_events, email_campaigns, email_flows, email_events, daily_snapshots

Supporting stores: Redis for caching dashboard queries, rate limit state, and BullMQ job queues.

### Layer 4: Business logic modules
Each module reads from the unified store and produces reports, alerts, or QA results.

- **Dashboard module** — Unified stats, KPIs, subscription metrics, funnel performance
- **Alerts engine** — Anomaly detection, threshold rules, notifications
- **Order QA** — Cross-platform reconciliation, validation rules
- **Email + lifecycle** — Attribution, engagement scoring, churn prediction
- **Funnel performance** — GA4 + Clarity + CC combined funnel view

## Data flow

```
Shopify API/Webhooks ──┐
CC API/Webhooks ───────┤
Klaviyo API ───────────┼──▶ Ingestion Engine ──▶ Unified Store ──▶ Modules ──▶ Web UI
GA4 Data API ──────────┤         │                     │
Clarity Export API ────┘    Product Map           Daily Snapshots
                           (Shopify master)       (pre-aggregated)
```

## Breakdown dimensions

Every metric in the system is sliceable by:
- **Funnel/campaign** — CC campaignId, campaignName, salesUrl
- **Product** — productN_name, productN_sku, mapped to Shopify product line
- **Frequency/offer variant** — derived from campaignProductId + recurringPrice + product mapping
- **Upsell path** — hasUpsells, replacedByOrderItemId
- **Source** — Shopify vs CheckoutChamp origin
- **Time** — today, 7d, 30d, custom range with period-over-period comparison
