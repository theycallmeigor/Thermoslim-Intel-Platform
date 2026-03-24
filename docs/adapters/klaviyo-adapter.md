# Klaviyo adapter

## Connection
- REST API: developers.klaviyo.com
- Auth: private API key (header: `Authorization: Klaviyo-API-Key {key}`)
- API version: latest revision header

## Sync operations

### Campaigns (scheduled: daily)
- Pull campaign list with send metrics
- Fields: name, subject, status, send_time, sends, opens, clicks, bounces, unsubscribes
- Calculate attributed revenue per campaign

### Flows (scheduled: daily)
- Pull flow list with aggregate performance
- Fields: name, status, trigger, steps count
- Per-flow: total sends, conversions, attributed revenue

### Events / metrics (scheduled: every 15 min)
- Pull recent events per profile
- Key metrics: Placed Order, Ordered Product, Opened Email, Clicked Email, Started Checkout, Viewed Product
- Map to email_events table with customer join via email

### Profiles (on-demand)
- Lookup profile by email when building customer engagement scores
- Fields: email, engagement tier, last open, last click, list memberships

## Join keys
- **Email** — Klaviyo profile email = CC emailAddress = Shopify customer email
- **Product mapping assist** — Klaviyo Placed Order events contain product name, SKU, price. When CC externalId mapping is ambiguous, Klaviyo's order event data (same customer, same timestamp) provides a third reference point for triangulation.

## Key reporting outputs
- Campaign performance: opens, clicks, attributed revenue
- Flow performance: welcome series, abandoned cart, winback conversion rates
- Customer engagement scoring: combines open/click recency with subscription status
- Attribution: which email touchpoint preceded an order (join email events to CC orders by email + timestamp window)
