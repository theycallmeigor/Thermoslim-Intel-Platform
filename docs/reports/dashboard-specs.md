# Dashboard module specifications

## Overview dashboard (home page)

### Top KPI strip (4 cards)
1. Active subscribers — count, % change vs previous period
2. Active subscriptions — count, % change
3. Active MRR — dollar amount, % change
4. Total revenue (today/period) — combined Shopify + CC

### Revenue section
- Combined revenue trend (line chart, daily)
- Breakdown: checkout revenue vs recurring revenue (stacked area)
- Source split: Shopify vs CC (side-by-side bars)
- AOV trend line

### Subscription health section
- New subscribers vs cancelled (bar chart, daily)
- Net subscriber change trend
- Active subscribers by frequency (donut: 1mo, 3mo, 6mo)
- Active subscribers by product line (donut)

### Funnel performance section
- Top campaigns by revenue (horizontal bars)
- Conversion rate by campaign (table with sparklines)
- Combined funnel: GA4 traffic → CC checkout → CC upsell → subscription (funnel visualization)

### Email performance section (Klaviyo)
- Top performing campaigns this period (table)
- Flow performance: welcome, winback, abandoned cart (card per flow)
- Email-attributed revenue vs total revenue (% contribution)

### Quick alerts section
- Recent triggered alerts (last 24h)
- Active anomalies
- Link to full alert center

## Subscription detail dashboard

Full Loop-inspired layout (see loop-layout-reference.md) with all metrics powered by CC data, sliceable by funnel, product, and frequency.

## Funnel detail dashboard

Per-campaign deep dive:
- GA4 traffic metrics for the landing page
- Clarity friction signals for the funnel pages
- CC checkout conversion and upsell rates
- Frequency selection distribution on upsell pages
- End-to-end conversion: visit → subscriber
