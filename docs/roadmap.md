# Phased roadmap

## Phase 1: Foundation + dashboard (weeks 1-6)
- [ ] Set up project scaffolding (Next.js + Postgres + Redis)
- [ ] Build Shopify adapter (OAuth, orders sync, product catalog sync, webhooks)
- [ ] Build CheckoutChamp adapter (API pull + webhook receiver, product1-5 unpacking)
- [ ] Product mapping admin screen: import Shopify products, import CC campaignProductIds, link via externalId, add metadata
- [ ] Design unified schema and run Prisma migrations
- [ ] Build sync engine (scheduled + webhook-driven)
- [ ] Historical backfill: cross-reference Shopify orders with CC data
- [ ] Klaviyo adapter (campaigns, flows, events)
- [ ] GA4 adapter (traffic, landing pages)
- [ ] Clarity adapter (sessions, pages, behavioral signals — server-side)
- [ ] Dashboard UI: revenue, orders, AOV, conversion — combined view
- [ ] Source comparison view (Shopify vs CC)
- [ ] Subscription dashboard (Loop-inspired)
- [ ] Breakdown views: by funnel/campaign, by product, by frequency
- [ ] Date range selector and trend charts
- [ ] Basic auth and user management

## Phase 2: Alerts engine (weeks 7-10)
- [ ] Define alert rule schema (threshold, anomaly, trend)
- [ ] Build evaluation engine (runs on sync completion)
- [ ] Anomaly detection: rolling averages + standard deviation
- [ ] Clarity friction alerts (rage clicks, JS errors on checkout)
- [ ] In-app notification center
- [ ] Email notifications
- [ ] Slack webhook integration
- [ ] Alert configuration UI

## Phase 3: Order QA (weeks 11-14)
- [ ] Cross-platform order matching logic
- [ ] Revenue reconciliation checks
- [ ] QA dashboard with pass/fail summary
- [ ] Flagged order review queue
- [ ] Auto-resolution rules

## Phase 4: Extensibility (ongoing)
- [ ] Adapter template for new sources
- [ ] Payment gateway adapter
- [ ] 3PL/fulfillment adapter
- [ ] Ad platform adapters (Meta, Google, TikTok)
- [ ] Cohort analysis and LTV prediction
- [ ] AI-powered daily performance summaries
