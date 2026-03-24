# Loop Subscriptions — Layout reference

**Note: Loop is a design/layout reference only, not a data source.** All subscription reports are built from CheckoutChamp + Shopify data. These patterns serve as the template for the dashboard UI.

## Layout patterns to replicate

1. **Top KPI strip**: 4 cards in a row — metric name, big number, % change badge (green up / red down)
2. **Date range controls**: period selector + comparison toggle, always below KPI strip
3. **Section pattern**: section heading → KPI cards → chart below or beside
4. **Card + chart pairing**: left side = 2-3 stacked KPI values, right side = time-series chart
5. **3-column activity cards**: total | additions | reductions — each with sub-metrics
6. **Donut charts**: distribution views (by plan, by frequency, by channel)
7. **Horizontal bar charts**: rankings/comparisons (top products, cancellation by reason)
8. **Sortable tables**: detailed breakdowns (subscribers by plan, order leakage)
9. **Period-over-period**: every metric shows % change vs previous period
10. **"View details" links**: each section links to drill-down

## Color coding for subscriber status
- Active = dark blue/navy
- Reactivated = green
- Resumed = bright green
- New = blue
- Expired = pink/light red
- Paused = orange
- Churned = red

## Report sections (from Loop screenshots)

### Home dashboard
- Top KPIs: active subscribers, active subscriptions, active MRR, upcoming sales
- Today's performance: new subs, new subscriptions, checkout revenue, recurring revenue
- Subscribers activity: additions, reductions, net change + trend chart
- Purchase activity: total sub revenue, checkout vs recurring + trend chart
- Payments performance: first attempt success, recovery rate + weekly chart
- Cancellation flow: attempts, save rate, saved MRR

### Subscribers analytics
- Trend chart with color-coded status breakdown
- Activity cards: active, additions (new/resumed/reactivated), reductions (paused/cancelled/expired)
- Distribution: by delivery interval (donut), by selling plan (donut)
- Detailed table: selling plan × frequency × active subs × MRR × contribution %
- Churn overview: rate, subscribers lost, 0-day contribution, upcoming order churn

### Orders analytics
- Order-wise retention curve (bar chart by order number)
- Orders over time: total, subscription, checkout, recurring
- Subscription order funnel: scheduled → attempted → success/failed
- Order leakage table: per order number, success/fail/skip/pause/cancel breakdown

### Cancellation analytics
- Subscriber churn metrics: rate, lost, 0-day contribution
- Subscription churn metrics: cancellation rate, orders before cancellation, MRR lost
- Churn trends: dual axis (bars + line)
- Top products by churned MRR
- Cancellation by: reason (donut), channel (donut), frequency (bars), selling plan (bars)
