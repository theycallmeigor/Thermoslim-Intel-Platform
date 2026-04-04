# Notes for Nico — ThermoSlim Roadmap Status
**Updated:** 2026-03-30

## What's Done

### UI Design Process
UI was prototyped in **Google Stitch** before implementation. Stitch-generated mockups (HTML + screenshots) for 5 key screens:
- Dashboard Home
- Customer 360 Page
- Order Detail Page
- Upcoming Rebills (2 variants)

Exports at `docs/design/stitch-export/stitch/`. These informed the final coded pages — design → code pipeline, not freehand.

### Dashboard Pages
All 17 sidebar pages are built and working:
- **Overview:** Dashboard, Analytics
- **Subscriptions:** MRR Waterfall, Churn Analytics (with billing cycle milestone chart + churn rate % trend), Cohort Retention (with retention curves + LTV/revenue columns), Frequency Analysis
- **Orders:** All Orders, Upcoming Rebills, Refunds & Chargebacks, Payment Health
- **Performance:** Campaigns, Products, Upsell & AOV, Attribution
- **Operations:** Customer Lookup, Order QA, Ingestion Health

Plus: loading skeletons, browser tab titles on every page, churn rate KPI on main dashboard.

## Data Accuracy — What's Real vs What's Incomplete

**Important:** All 17 pages are built and functional, but some show incomplete data because they depend on integrations that aren't connected yet. Revenue on the main dashboard IS accurate.

### Accurate Now ✅
| Page | Notes |
|------|-------|
| Dashboard (revenue, MRR, subscriber activity) | Revenue uses correct source filter. MRR from CC subs only. |
| Analytics | Works if nightly snapshot builder is running |
| All Orders / Order Detail | Shopify + CC orders present |
| Customer Lookup / Customer Detail | Works |

### Partially Accurate — Showing CC-Only Data ⚠️
These pages work but only show CheckoutChamp subscription data. Loop handles the majority of subscriptions, so these are likely showing **20-50% of reality**.

| Page | What's Missing | Unblocked By |
|------|---------------|-------------|
| MRR Waterfall | Loop subscriptions (majority of MRR) | Loop adapter |
| Churn Analytics | Loop cancellations, reasons, milestone data | Loop adapter |
| Cohort Retention | Loop subscription cohorts, LTV | Loop adapter |
| Frequency Analysis | Loop subscription frequencies | Loop adapter |
| Upcoming Rebills | Loop rebills (only CC rebills shown) | Loop adapter |
| Payment Health | Loop billing declines | Loop adapter |
| Products | Orders with unmapped items show no product line | ProductMap coverage |
| Campaigns | Only CC campaigns, Shopify orders uncategorized | CC webhooks |

### Empty or Near-Empty ❌
These pages are built but the underlying data tables have little or no data yet.

| Page | Why It's Empty | Unblocked By |
|------|---------------|-------------|
| Attribution | `Attribution` records only from CC. Shopify orders have no UTM data. | GA4 adapter + CC webhooks |
| Upsell & AOV | `UpsellPath` records only from CC upsell funnels. Stale if CC webhooks aren't flowing. | CC webhook profiles |
| Refunds & Chargebacks | `RevenueEvent` refund/chargeback records sparse without real-time CC events. | CC webhook profiles |
| Ingestion Health (anomalies) | `Anomaly` table is empty — not because everything is fine, but because alert rules aren't built yet. | Alert rules implementation |

### The Merge Script Problem
~1,338 CC orders exist as raw `source=CHECKOUTCHAMP` duplicates. Revenue is correct (they're excluded from the revenue query), but:
- Order counts are inflated on some views
- Per-customer analytics may show duplicate orders
- Order QA page flags these as "Raw CC Orders"

**Fix:** Run `merge-existing-duplicates.ts` on production. 5 minutes, idempotent, safe to re-run.

### Summary by Blocker

| Blocker | Pages Affected | Estimated Data Gap |
|---------|---------------|-------------------|
| **Loop adapter** | 6 subscription pages | 50-80% of subscription data missing |
| **Merge script** | All order pages, Dashboard | ~1,338 duplicate orders |
| **CC webhook profiles** | Attribution, Upsells, Refunds | Real-time CC data not flowing |
| **Klaviyo API key** | No page yet (models ready) | 100% of email data missing |
| **GA4 service account** | No page yet (model ready) | 100% of traffic/page data missing |
| **Alert rules** | Ingestion Health | Anomaly detection not running |

---

## What's Next

### 1. Run Merge Duplicates Script on Production — URGENT
`scripts/merge-existing-duplicates.ts` needs to run against prod DB. Merges CC↔Shopify duplicate orders that were ingested before the merge logic was in place. Data quality fix — affects revenue accuracy.

### 2. Loop Subscriptions Adapter — HIGH PRIORITY
Adapter to pull subscription lifecycle data from Loop (who's subscribed, billing outcomes, churn reasons, payment recovery). All research is done (170 help articles crawled, API/webhook catalog, analytics audit, integration spec).

**Blocked on answers from Loop / internal:**
- Loop API v2 base URL
- Auth header name (`X-Loop-Token` vs `Authorization: Bearer`)
- Webhook HMAC signature verification mechanism
- Whether `order.processed` payload includes the Shopify order ID
- Trial subscription detection from selling plan attributes

Once those are answered, build is estimated at: schema migration + adapter scaffold + webhook handler + backfill.

### 3. CC Webhook Profiles — HIGH PRIORITY (ops task)
Configure 6 event types (Sale, Upsell, Recurring, Refund, Cancelled, Reactivate) in CheckoutChamp admin under Admin → Export. Receiver URL is already built. Plan doc: `docs/superpowers/plans/2026-03-23-cc-webhook-profiles-setup.md`

### 4. Anomaly Tuner — MEDIUM
Claude API-powered experiment loop that auto-tunes anomaly detection thresholds across multiple timeframes (15min → 1h → 4h → 1d → 1w). Plan doc: `docs/superpowers/plans/2026-03-21-autoresearch-anomaly-tuner.md`

### 5. Not Yet Planned (future)
- **Klaviyo adapter** — EmailCampaign/EmailFlow/EmailEvent models exist in schema, no adapter yet
- **GA4 / Clarity adapters** — PageAnalytics model exists, no adapter
- **Alert rules tuning** — alert module exists but rules are untuned
- **Funnel analytics page** — Funnel/FunnelPage/FunnelEvent models exist, no UI
- **Mobile responsive sidebar** — needs hamburger menu for small screens
