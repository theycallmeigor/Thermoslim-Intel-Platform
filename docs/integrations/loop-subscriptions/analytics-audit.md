---
title: Loop Subscriptions Analytics Audit
source: Phase 3 research
created: 2026-03-30
---

# Loop Subscriptions Analytics Audit

## Overview

Loop Subscriptions provides **6 analytics dashboard pages** accessible via `Loop Admin > Analytics`. The philosophy is subscriber-centric rather than subscription-centric — focusing on the actual customers and their lifecycle rather than just subscription counts. All dashboards support flexible date range selection. Data freshness is not explicitly documented (calculation not documented), but UI-facing data appears near real-time based on FAQ guidance showing same-day filters. Reports (tab 6) are downloadable CSV exports for offline analysis.

---

## 1. Subscriber Analytics

### Summary
The primary subscriber growth and health dashboard. Tracks the full customer lifecycle: who's joining, how they were acquired, what products drive acquisition, their revenue contribution vs. non-subscribers, and where churn is occurring. The core shift from older Loop analytics is the move from subscription-count tracking to true **subscriber-count** tracking.

### Metrics

| Metric Name | Definition | Chart Type | Dimensions/Filters | Time Ranges |
|-------------|-----------|------------|-------------------|-------------|
| Active Subscribers | Count of currently active subscribers | Number card | Date range | Dynamic date picker |
| New Subscribers | How many non-subscribed customers converted to subscribers | Line chart / number | Date | Over time |
| Churned Subscribers | Subscribers who cancelled all subscriptions | Number card + trend | Date | Dynamic |
| Net Subscriber Growth | Net change in subscriber base (new - churned) | Line chart | Date | Dynamic |
| Subscriber Trend Over Time | Visualizes: New \| Resumed \| Reactivated \| Paused \| Canceled \| Expired | Stacked line/area chart | Status type, Date | Dynamic |
| Subscriber Activity Summary | Aggregated view of subscriber status changes | Summary table | Status type | Dynamic |
| Subscriber Summary Report | Exportable summary of subscriber state changes | Table | Status | Dynamic |
| Acquisition Overview | How many non-subscribed customers converted; acquisition rate over time | Line chart | Date | Over time |
| Subscriber Acquisition by Product | Which products are driving subscriber acquisition | Bar chart / table | Product | Dynamic |
| Acquisition by Selling Plan & Frequency | Which plans and delivery intervals drive subscriber growth; subscriber counts, MRR, and acquisition rates | Table / bar chart | Selling plan, delivery interval | Dynamic |
| Subscriber vs Non-subscriber Revenue | Revenue comparison between subscribed customers and one-time purchasers | Comparative bar / line | Customer type | Dynamic |
| Subscription vs Non-subscription Revenue | Revenue split between subscription orders and non-subscription orders | Comparative chart | Order type | Dynamic |
| Recurring vs Checkout Subscription Revenue | Breaks down subscription revenue into recurring renewal orders vs. checkout-originated subscriptions | Stacked bar / comparative | Revenue type | Dynamic |
| Subscribed Products Activity | Tracks product-level additions, upsells, quantity increases, and reductions within subscriptions | Table / bar chart | Product, activity type | Dynamic |
| 0-Day Churn Rate | % of new subscribers who cancel on the same day they subscribe | Number card + trend | Date | Dynamic |
| Upcoming Order Churn Contribution | % of churn triggered by upcoming order notifications | Number card | Date | Dynamic |
| Churn Overview | Overall churn rate, subscriber losses, 0-day churn, upcoming order churn risk | Card + chart | Date | Dynamic |
| Subscriber vs Non-subscriber LTV | Compares Lifetime Value of subscribers vs. non-subscribers segmented by order# at which they subscribed (Order #1, #2, #3, #3+) | Comparative bar chart | Customer segment | Dynamic |
| Customer Distribution | Breakdown of customers by when they subscribed (Order #1, #2, #3, #3+) | Pie / bar chart | Customer segment | Dynamic |
| LTV Breakdown | Per-segment LTV detail: customer count, total revenue, orders per customer | Table | Customer segment | Dynamic |
| LTV Trend | How LTV changes over time per segment | Line chart | Customer segment, Date | Dynamic |
| MRR (Monthly Recurring Revenue) | MRR tracked at plan/frequency level — confirmed available in Overview & Acquisition tabs | Number card + trend | Selling plan, delivery interval | Dynamic |

### Layout Description
- **Top section:** Key number cards (Active Subscribers, New Subscribers, Churned, Net Growth, MRR)
- **Middle section:** Charts — subscriber trend, acquisition funnel views
- **Bottom section:** Product-level tables, LTV breakdowns, churn detail tables
- Tabs: **Overview**, **Acquisition**, **Revenue**, **Churn**, **LTV**

### Filters Available
- Date range picker (custom)
- Selling plan filter
- Delivery interval/frequency filter
- Product filter (for acquisition/churn views)

### Drill-Down Capabilities
- Clicking **"View details"** on Churn Overview drills down into product-level, order-level, and selling plan-level churn
- Acquisition tables drill into selling plan and delivery interval sub-views

---

## 2. Cohort Analytics

### Summary
Shows long-term subscriber and subscription behavior grouped by acquisition month (cohort). Tracks 10+ metrics across up to 36 months. Supports both **monthly** and **order-milestone** views. Also supports product-level cohort filtering to understand which acquisition products drive the best long-term retention.

### Metrics

| Metric Name | Definition | Chart Type | Dimensions/Filters | Time Ranges |
|-------------|-----------|------------|-------------------|-------------|
| Subscriber Retention | % of subscribers from a given cohort who remain active over time | Cohort grid (% cells) | Acquisition month, selling plan, delivery interval | Up to 36 months |
| Subscriber Orders Placed | Total orders placed by subscribers, indexed to acquisition month; available as raw count or placement rate | Cohort grid (count or %) | Acquisition month, selling plan, delivery interval | Up to 36 months |
| Average Cumulative Orders per Subscriber | Average total orders placed per subscriber in each cohort, accumulating month by month | Cohort grid (number) | Acquisition month | Up to 36 months |
| Subscriber Revenue Realized | Revenue generated each month from subscriber cohorts; available as absolute $ or % of total potential | Cohort grid ($ or %) | Selling plan, delivery interval | Up to 36 months |
| Average Subscriber LTV | Average cumulative revenue per subscriber since acquisition | Cohort grid (currency) | Acquisition month, selling plan | Up to 36 months |
| Subscription Retention | Retention of active *subscriptions* (not subscribers) month-over-month, grouped by initial activation date; available in count and % | Cohort grid (count or %) | Selling plan, delivery interval | Up to 36 months |
| Subscription Orders Placed | Total orders placed per subscription over time; count and rate views | Cohort grid (count or rate) | Selling plan, delivery interval | Up to 36 months |
| Average Cumulative Orders per Subscription | Average total orders per subscription over time, by start month | Cohort grid (number) | Selling plan | Up to 36 months |
| Subscription Revenue Realized | Total revenue generated by subscriptions over time, by month or order milestone; absolute and % views | Cohort grid ($ or %) | Selling plan, delivery interval | Up to 36 months |
| Average Subscription LTV | Average cumulative revenue per subscription cohort over time | Cohort grid (currency) | Selling plan | Up to 36 months |

### Cohort Configuration
- **Cohort definition:** Subscribers or subscriptions grouped by the **month they were acquired / activated**
- **What is measured:** Retention rate, revenue, order count, LTV — selectable via metric dropdown
- **Cohort grid structure:** Rows = acquisition month cohorts; Columns = months elapsed (Month 0, Month 1, Month 2 … Month 36) OR order number milestone (Order 1, Order 2, etc.)
- **View modes:** Monthly view or Order-level view — switchable from the dashboard
- **Count vs. % toggle:** Most metrics support switching between absolute counts and percentage views

### Layout Description
- **Top:** Metric selector dropdown (choose which of the 10+ metrics to display)
- **Center:** Cohort grid heatmap — color-coded cells where darker cells indicate higher values
- **Filters bar:** Time range, selling plan, delivery interval, product filter
- **View toggle:** Month vs. Order milestone

### Filters Available
- Time range (up to 36 months lookback)
- Acquisition month filter
- Selling plan filter
- Delivery interval filter
- Product filter (for product-level cohort analysis)

### Drill-Down Capabilities
- Metric overview tab shows summary before drilling into the full cohort grid
- Product-level tab enables filtering cohort data by the specific product acquired at subscription start

---

## 3. Payment Analytics V1

### Summary
Legacy payment dashboard focused on overall payment success, recovery performance, and failure trends. Provides a 30-day snapshot and 12-month trend. Covers backup card recovery, payment source distribution, country-level performance, and upcoming payment risk monitoring. **Note: V1 is the older version; V2 adds more granular 3-stage segmentation (see section 4).**

### Metrics

| Metric Name | Definition | Chart Type | Dimensions/Filters | Time Ranges |
|-------------|-----------|------------|-------------------|-------------|
| Payments Snapshot — Total Attempted | Total subscription order value attempted in last 30 days | Number card | Fixed 30-day window | Last 30 days |
| Payments Snapshot — Success | Total subscription order value successfully realized | Number card | Fixed 30-day window | Last 30 days |
| Payments Snapshot — Recovered | Amount recovered via Loop's retry engine after initial failure | Number card | Fixed 30-day window | Last 30 days |
| Payments Snapshot — Lost | Amount lost from payments where last retry failed | Number card | Fixed 30-day window | Last 30 days |
| Success vs Failed Revenue (12 months) | Month-on-month trend of realized vs. failed payments | Line chart | Monthly | Last 12 months |
| Overall Success Rate | Total payments realized over selected time period (% and value) | Number card | Date range | Dynamic |
| First Attempt Success | % of subscription payments successful on the first attempt | Number card (%) | Date range | Dynamic |
| Retry Attempt Success | Payments recovered by retry engine after initial failure | Number card | Date range | Dynamic |
| Backup Attempt Rate | % of failed orders where a backup card was attempted | Number card (%) | Date range | Dynamic |
| Backup Recovered | Orders + revenue successfully recovered via backup payments | Number + currency card | Date range | Dynamic |
| Payment Source Distribution | Payment realization breakdown by payment provider; non-dunning and dunning splits | Table / bar chart | Payment provider | Dynamic |
| Country-wise Payment Distribution | Realization breakdown by country; non-dunning and dunning splits | Table / bar chart | Country | Dynamic |
| Payments Over Time | Trend of realized vs. failed payments grouped by time period | Line chart | Date interval | Dynamic |
| Recovery Performance | Overview of recovery outcomes: Recovered \| Still in recovery \| Customer skipped/cancelled \| Lost | Donut / number cards | Recovery method | Dynamic |
| Recovery Contribution Split | Breakdown of payment recovery by method (card update vs. retry) | Pie / bar chart | Recovery method | Dynamic |
| Recovery Contribution Trend | Trend of recovered payments over time by method (card update vs. retry) | Line chart | Date, method | Dynamic |
| Failure Reason Wise Recovery Contribution | Recovery performance broken down by leading failure reasons, split by method | Table | Failure reason, method | Dynamic |
| Recovery by Retries | Recovery effectiveness based on retry number within each order cycle | Bar chart / table | Retry number | Dynamic |
| Recovery by Failure Reason | Recovery rate for each failure reason + distribution across retry attempts | Table | Failure reason | Dynamic |
| Failures Summary | Top payment sources and failure reasons contributing to highest failures | Summary table | Provider, failure reason | Dynamic |
| Payment Failure Reasons | Distribution of payment failures by reason over time | Bar chart | Failure reason, time | Dynamic |
| Total Failures | Total payment failure count/value by reason and time period | Number + bar | Failure reason | Dynamic |
| Upcoming Payments list | Risk-rated list of upcoming subscription payments | Table | Payment date, risk level, retries left, payment method status, last status | Next 7/30/60/90 days |

### Recovery Metrics
- **Recovery Performance** breaks down all recovery outcomes into: Recovered, Still in recovery, Customer skipped/cancelled, Lost
- **Recovery Contribution Split** distinguishes card updates vs. automated retries
- **Recovery by Retries** identifies which retry number (1st, 2nd, 3rd...) most commonly results in payment recovery

### Layout Description
- **Tab: Overview** — Snapshot cards + 12-month trend chart
- **Tab: Recovery** — Recovery performance, contribution split, failure reason analysis
- **Tab: Failures** — Failure summary, failure reason breakdown, failure trend
- **Tab: Upcoming** — Filterable risk table of future payment attempts

### Filters Available
- Date range picker (custom)
- Payment date (7/30/60/90 days for upcoming payments)
- Risk level (Low/Medium/High)
- Last payment status (Failed/Success)
- Retries left
- Payment method status (Expired/Expiring soon/Valid)

---

## 4. Payment Analytics V2

### Summary
Upgraded successor to V1. The key architectural change is segmenting payment performance into **3 distinct stages**: (1) First attempt, (2) First recovery cycle, (3) Subsequent recovery cycles. This allows merchants to precisely diagnose where payments fail and where recovery efforts are working. Same tabs as V1 (Overview, Recovery, Failures, Upcoming) but with stage-level granularity throughout. Snapshot window changed from 30 to **90 days**.

### Metrics

| Metric Name | Definition | Chart Type | Dimensions/Filters | Time Ranges | New in V2? |
|-------------|-----------|------------|-------------------|-------------|-----------|
| Payments Snapshot — Total Attempted | Total value of all subscription payment attempts in last 90 days | Number card | Fixed 90-day window | Last 90 days | Changed window (30→90 days) |
| Payments Snapshot — Success (%) | % of payment attempts successfully realized | Number card (%) | Fixed 90-day | Last 90 days | New calculation format |
| Payments Snapshot — Recovered | Total value recovered through Loop's retry engine | Number card (currency) | Fixed 90-day | Last 90 days | Carried from V1 |
| Payments Snapshot — Under Recovery | Total value of payments still in retry process (not yet lost) | Number card (currency) | Fixed 90-day | Last 90 days | **New in V2** |
| Payments Snapshot — Lost | Permanent revenue loss (exhausted retries, cancelled/paused/expired subs) | Number card (currency) | Fixed 90-day | Last 90 days | Carried from V1 |
| Success vs Failed Revenue (12 months) | Trend of successful, under-recovery, and failed payments (three-way split) | Line chart | Monthly | Last 12 months | Enhanced from V1's 2-way split |
| First Attempt — Success Rate | % of payments that succeed on first attempt; excludes dunning subscriptions | Number card (%) | Date, payment source, country | Dynamic | **New stage framing** |
| First Attempt — Backup Attempt Rate | % of first-attempt failures where backup card was tried | Number card (%) | Date | Dynamic | Carried, new context |
| First Attempt — Backup Recovered | Orders/revenue recovered via backup on first attempt | Number card | Date | Dynamic | Carried, new context |
| First Recovery Cycle — Recovery Rate | % recovered in first retry cycle; formula: [recovered / (attempted - under recovery)] | Number card (%) | Date | Dynamic | **New in V2** |
| First Recovery Cycle — Lost | Revenue lost that couldn't be recovered in first cycle (incl. skipped, cancelled, expired) | Number card (currency) | Date | Dynamic | **New in V2** |
| Subsequent Recovery Cycle — Recovery Rate | % recovered in subsequent (dunning) cycles; same formula | Number card (%) | Date | Dynamic | **New in V2** |
| Subsequent Recovery Cycle — Lost | Revenue permanently lost after all extended retry attempts | Number card (currency) | Date | Dynamic | **New in V2** |
| Payment Source Distribution | Attempted, Realized, Under Recovery, Realization Rate, First attempt / First cycle / Subsequent cycle rates per payment method | Table | Payment method | Dynamic | Enhanced with stage rates |
| Country-wise Payment Distribution | Same as source distribution but by geography | Table | Country | Dynamic | Enhanced with stage rates |
| Payments Over Time | Trend showing successful vs. under-recovery vs. failed, split by stage | Multi-line chart | Date, stage | Dynamic | Enhanced 3-stage view |
| Recovery Contribution Split | % of recoveries via card updates vs. retries per selected cycle | Pie / bar | Cycle, recovery method | Dynamic | Carried, cycle-selectable |
| Recovery Contribution Trend | Recovery rate trend split by retries vs. card updates | Line chart | Date, method | Dynamic | Carried from V1 |
| Failure Reason Wise Recovery | Attempts, Recovered, Under Recovery, Rate, via Retry, via Card Update per failure reason | Table | Failure reason | Dynamic | Enhanced detail |
| Recovery by Retries | Recovery effectiveness per retry number; Retry 1–15 breakdown | Table | Retry number | Dynamic | Extended to 15 retries |
| Recovery by Failure Reason | Recovery rate per reason + retry distribution | Table | Failure reason | Dynamic | Carried from V1 |
| Failures Summary | Top failure sources and reasons | Summary table | Provider, reason | Dynamic | Carried from V1 |
| Payment Failure Reasons | Failure distribution by reason over time | Bar chart | Failure reason | Dynamic | Carried from V1 |
| Upcoming Payments | Risk-rated list with same filters as V1 | Table | 7/30/60/90 days, risk, retries, status | Next 7–90 days | Carried from V1 |

### Differences from V1
| Aspect | V1 | V2 |
|--------|----|----|
| Snapshot window | Last 30 days | Last 90 days |
| Payment stage segmentation | Single overall view | 3-stage: First attempt / First recovery cycle / Subsequent recovery cycles |
| "Under Recovery" metric | Not present | **Added** — shows revenue still in retry |
| Success metric format | Total value | % of attempted |
| 12-month trend | 2-way (success vs. failed) | 3-way (success / under recovery / failed) |
| Source/Country distribution | Overall rates | Per-stage rates included |
| Recovery by retries depth | General retry levels | Up to Retry 15 explicitly |

---

## 5. Cancellation Analytics

### Summary
Dedicated churn analytics dashboard separating **subscriber churn** (losing a customer entirely) from **subscription cancellations** (one subscription cancelled while customer may remain). Provides reason-level, product-level, order-milestone-level, frequency-level, and selling-plan-level churn views. Also includes save rate metrics from cancellation flows.

### Metrics

| Metric Name | Definition | Chart Type | Dimensions/Filters | Time Ranges |
|-------------|-----------|------------|-------------------|-------------|
| Subscriber Churn Rate | % of subscribers who cancelled all their subscriptions in a given period | Number card (%) | Date | Dynamic |
| Subscribers Lost | Count of subscribers fully churned | Number card | Date | Dynamic |
| 0-Day Churn Contribution | % of churned subscribers who cancelled same day as acquisition | Number card (%) | Date | Dynamic |
| Upcoming Order Churn Contribution | % of cancellations triggered by upcoming order notifications | Number card (%) | Date | Dynamic |
| Subscription Cancellation Rate | % of individual subscriptions cancelled relative to active base | Number card (%) | Date | Dynamic |
| Subscriptions Cancelled | Raw count of subscriptions cancelled | Number card | Date | Dynamic |
| Orders Before Cancellation | Average number of orders a subscriber placed before cancelling | Number card | Date | Dynamic |
| MRR Lost via Cancellations | Monthly Recurring Revenue lost to cancellations | Currency card | Date | Dynamic |
| Churn Trends | Daily/weekly/monthly trend of subscriber and subscription churn | Line chart | Granularity (day/week/month), Date | Dynamic |
| Product-level Churn Rate | Churn rate per product (% and trend) | Bar chart + table | Product, Date | Dynamic |
| Top 10 Products by Churned MRR | Which products contribute most to lost MRR | Bar chart | Product | Dynamic |
| Product-wise Churn Trend | How product-level churn changes over time | Line chart | Product, Date | Dynamic |
| Cancellation Reason-wise Churn (per product) | Cancellation reasons for top-churned products | Bar chart | Product, reason | Dynamic |
| Save Rate (per product) | % of cancellation flow attempts that resulted in a save, per product | Number (%) | Product | Dynamic |
| Product Variant-wise Cancellation Data | Cancellation data broken down to variant level | Table | Product, variant | Dynamic |
| Order-wise Cancellations | Churn broken down by how many orders were completed before cancellation | Bar chart / line | Order number milestone | Dynamic |
| Churn Rate by Order Milestone | Churn rate at each order number (1st order, 2nd, 3rd, etc.) | Bar chart | Order number | Dynamic |
| Churned MRR by Order Milestone | Revenue lost at each order lifecycle stage | Currency card / chart | Order number | Dynamic |
| Cancellation Reason Trend (by order cohort) | How cancellation reasons shift across order cohorts over time | Stacked chart | Reason, order milestone | Dynamic |
| Reason-wise Cancellations | Top cancellation reasons by volume | Bar / donut chart | Reason | Dynamic |
| Reason-wise Cancellation Trend | How each cancellation reason trends over time (daily/weekly/monthly/quarterly/yearly) | Line chart | Reason, time granularity | Dynamic |
| Cancellation Attempts by Reason | Count of cancellation flow attempts per reason | Table | Reason | Dynamic |
| Churned MRR by Reason | Revenue lost per cancellation reason | Currency table | Reason | Dynamic |
| Save Rate by Reason | % of cancellations saved per reason | % table | Reason | Dynamic |
| Saved MRR by Reason | Revenue saved per reason | Currency table | Reason | Dynamic |
| Selling Plan-wise Cancellations | Cancellation rate broken down by selling plan | Table / bar | Selling plan | Dynamic |
| Frequency-wise Cancellations | Cancellation rate broken down by delivery frequency (30/60/90-day etc.) | Table / bar | Delivery interval | Dynamic |
| Offer-wise Saves | Which save offers (discounts, gifts, etc.) are most effective | Table | Offer type | Dynamic |

### Cancellation Reasons
Categories are **merchant-configurable** via Loop's cancellation flow builder. Common system defaults documented include:
- Inventory surplus ("I have too much product")
- Pricing concerns ("Too expensive")
- Product dissatisfaction
- Payment failures
- Switching brands
- No longer needed
*Merchants can add, rename, or re-order reasons in their cancellation flow settings.*

### Cancellation Timing
- **Order-wise view** explicitly tracks churn by order milestone — identifies if subscribers drop off after order 1, 2, 3, etc.
- **Trend views** support daily, weekly, monthly, quarterly, or yearly granularity
- **0-day churn** specifically captures same-day cancellations (acquisition quality signal)
- **Upcoming order churn** tracks cancellations triggered by upcoming order notification emails

### Win-Back Metrics
- **Save Rate** (overall and per reason/product): % of cancellation flow attempts that result in retention
- **Saved MRR**: Revenue preserved through cancellation flow saves
- **Offer-wise Saves**: Breakdown of which specific save offers (discount, pause, gift, etc.) perform best
- **Save Rate by Retry**: How save performance differs per cancellation attempt

### Layout Description
- **Tab: Overview** — Churn KPI cards + churn trends chart
- **Tab: Products** — Product-level churn + variant detail
- **Tab: Orders** — Order milestone churn analysis
- **Tab: Reasons** — Reason distribution + trend
- **Tab: Frequency & Plan** — Churn by delivery frequency and selling plan
- **Tab: Saves** — Save rate, saved MRR, offer-wise save performance

---

## 6. Reports

### Summary
Downloadable CSV reports for offline analysis and back-office operations. Accessible via `Loop Admin > Analytics > Reports`. Users select a report type, apply column filters, then export. Supports filtering by multiple column values before export.

### Report Types

| Report Name | Contents | Format | Filters |
|-------------|----------|--------|---------|
| Subscriptions Report | Full subscription list with status, product, order count, payment attempt dates, selling plan, etc. | CSV | Status, product, orders completed to date, last payment attempted at, and many more |
| Subscription Activity Logs | Log of all subscription events (entity = Loop Flows, API changes, customer actions, etc.) | CSV | Entity type (Loop Flows, API, etc.), action type |
| Transaction Logs Report | Payment attempt records including payment source, attempt counts, success/failure | CSV | Payment source, status |
| Inventory Forecast | Upcoming order products with SKUs for inventory planning | CSV | Date range, product |
| Segment Mail | Customer email segments grouped by subscription metrics | CSV | Order count, segment criteria |

*Note: The Reports article does not list all available report types explicitly — the above are confirmed from documentation and FAQ examples. Additional report types may exist. A complete list requires direct UI exploration (NOT FOUND).*

### Filters Available
- Reports are filtered interactively using column-name search within the UI
- Common confirmed filters: `status`, `product`, `orders completed to date`, `last payment attempted at`

---

## Cross-Dashboard Summary

### All Unique Metrics (Master List)

| # | Metric | Dashboard | Type | Definition |
|---|--------|-----------|------|------------|
| 1 | Active Subscribers | Subscriber Analytics | Count | Currently active unique subscriber count |
| 2 | New Subscribers | Subscriber Analytics | Count | Non-subscribed customers who converted to subscribers |
| 3 | Churned Subscribers | Subscriber Analytics, Cancellation | Count | Subscribers who cancelled all subscriptions |
| 4 | Net Subscriber Growth | Subscriber Analytics | Count | New minus churned subscribers |
| 5 | MRR (Monthly Recurring Revenue) | Subscriber Analytics, Cancellation | Currency | Monthly recurring revenue from active subscriptions |
| 6 | MRR Lost via Cancellations | Cancellation Analytics | Currency | MRR lost to cancellations |
| 7 | 0-Day Churn Rate | Subscriber Analytics, Cancellation | % | Subscribers who cancel same day as acquisition |
| 8 | Upcoming Order Churn Contribution | Subscriber Analytics, Cancellation | % | Churn attributable to upcoming order notifications |
| 9 | Subscriber vs Non-subscriber LTV | Subscriber Analytics | Currency | LTV comparison by customer type and order-at-subscription stage |
| 10 | Customer Distribution | Subscriber Analytics | Count/% | Customer breakdown by when they subscribed |
| 11 | LTV Trend | Subscriber Analytics | Currency/trend | How LTV changes over time per segment |
| 12 | Subscriber Acquisition by Product | Subscriber Analytics | Count | Products driving subscriber acquisition |
| 13 | Subscribed Products Activity | Subscriber Analytics | Count | Product additions, upsells, removals within subscriptions |
| 14 | Subscriber Retention (Cohort) | Cohort Analytics | % | % of cohort subscribers still active per period |
| 15 | Subscriber Orders Placed (Cohort) | Cohort Analytics | Count/% | Orders placed by cohort over time |
| 16 | Avg Cumulative Orders per Subscriber | Cohort Analytics | Number | Average total orders per subscriber per cohort |
| 17 | Subscriber Revenue Realized | Cohort Analytics | Currency/% | Revenue from subscriber cohorts over time |
| 18 | Average Subscriber LTV | Cohort Analytics | Currency | Average cumulative revenue per subscriber since acquisition |
| 19 | Subscription Retention (Cohort) | Cohort Analytics | Count/% | Retention of active subscriptions by activation month cohort |
| 20 | Subscription Orders Placed (Cohort) | Cohort Analytics | Count/% | Orders per subscription over time |
| 21 | Avg Cumulative Orders per Subscription | Cohort Analytics | Number | Average total orders per subscription by start month |
| 22 | Subscription Revenue Realized | Cohort Analytics | Currency/% | Revenue from subscription cohorts over time |
| 23 | Average Subscription LTV | Cohort Analytics | Currency | Average cumulative revenue per subscription cohort |
| 24 | Total Attempted (Payment) | Payment V1, V2 | Currency | Total subscription order value attempted |
| 25 | Payment Success / Realized | Payment V1, V2 | Currency/% | Payments successfully processed |
| 26 | Recovered | Payment V1, V2 | Currency | Revenue saved through retry engine |
| 27 | Lost (Payment) | Payment V1, V2 | Currency | Revenue permanently lost after retry exhaustion |
| 28 | Under Recovery | Payment V2 only | Currency | Payments still in active retry process |
| 29 | First Attempt Success Rate | Payment V1, V2 | % | % of payments successful on first attempt |
| 30 | Backup Attempt Rate | Payment V1, V2 | % | % of failures where backup card was attempted |
| 31 | Backup Recovered | Payment V1, V2 | Count/currency | Orders recovered via backup payment method |
| 32 | First Recovery Cycle — Recovery Rate | Payment V2 | % | Recovery rate within first retry cycle; [recovered / (attempted - under recovery)] |
| 33 | First Recovery Cycle — Lost | Payment V2 | Currency | Revenue lost after first cycle exhausted |
| 34 | Subsequent Cycle — Recovery Rate | Payment V2 | % | Recovery rate in subsequent dunning cycles |
| 35 | Subsequent Cycle — Lost | Payment V2 | Currency | Revenue lost after all cycles exhausted |
| 36 | Payment Source Distribution | Payment V1, V2 | Table | Realization rates by payment method |
| 37 | Country-wise Payment Distribution | Payment V1, V2 | Table | Realization rates by country |
| 38 | Recovery Contribution Split | Payment V1, V2 | % | Card updates vs. retries contribution to recovery |
| 39 | Recovery by Retries | Payment V1, V2 | Table | Recovery rate by retry number (up to 15 in V2) |
| 40 | Failure Reason Wise Recovery | Payment V1, V2 | Table | Recovery performance per failure reason |
| 41 | Upcoming Payments Risk List | Payment V1, V2 | Table | Risk-rated upcoming subscription payments |
| 42 | Subscriber Churn Rate | Cancellation Analytics | % | Overall subscriber churn rate |
| 43 | Subscription Cancellation Rate | Cancellation Analytics | % | Individual subscription cancellation rate |
| 44 | Orders Before Cancellation | Cancellation Analytics | Number | Average orders completed before churn |
| 45 | Product-wise Churn Rate | Cancellation Analytics | % | Churn rate per product |
| 46 | Top 10 Products by Churned MRR | Cancellation Analytics | Currency | Products with highest MRR loss |
| 47 | Order-wise Cancellations | Cancellation Analytics | Count/% | Churn broken down by order milestone |
| 48 | Reason-wise Cancellations | Cancellation Analytics | Count | Cancellations by configured reason |
| 49 | Save Rate | Cancellation Analytics | % | % of cancellation attempts retained |
| 50 | Saved MRR | Cancellation Analytics | Currency | Revenue saved through cancellation flow |
| 51 | Offer-wise Saves | Cancellation Analytics | Count/% | Which save offers perform best |

**Total: 51 unique metrics documented across 6 dashboard pages.**

### Chart Types Used

| Chart Type | Where Used | Example |
|-----------|-----------|---------|
| Number card | All dashboards | Active Subscribers, MRR, Recovery Snapshot |
| Line chart | Subscriber, Cohort, Payment, Cancellation | Subscriber trend, LTV trend, Payments over time |
| Cohort grid (heatmap) | Cohort Analytics | Retention %, Revenue Realized by cohort |
| Stacked bar / area chart | Subscriber, Cancellation | Subscriber activity breakdown, Reason-wise cancellation trend |
| Bar chart | Subscriber, Cancellation, Payment | Acquisition by product, Top churned products, Failure reasons |
| Pie / donut chart | Payment (Recovery contribution split), Cancellation | Recovery split, Reason distribution |
| Table | All dashboards | Product breakdowns, source distribution, upcoming payments |
| Comparative chart | Subscriber Analytics | Subscriber vs. Non-subscriber revenue |

### Common Filters
Filters appearing across multiple dashboards:
- **Date range picker** — all dashboards
- **Selling plan filter** — Subscriber, Cohort, Cancellation
- **Delivery interval / frequency filter** — Subscriber, Cohort, Cancellation
- **Product filter** — Subscriber, Cohort, Cancellation
- **Time granularity toggle** (day/week/month/quarter/year) — Cancellation, Payment

### Data Freshness
Calculation not documented explicitly in Loop's help articles. Based on FAQ examples showing same-day date queries returning data, analytics appear to update within hours or on-demand basis. Real-time vs. batched processing distinction is not confirmed.

### ThermoSlim DailySnapshot Overlap
The following Loop metrics overlap directly with ThermoSlim's existing `DailySnapshot` fields:
- **Active Subscribers** → maps to `subscriberCount` on DailySnapshot
- **MRR** → maps to `mrr` on DailySnapshot
- **New Subscribers** → derivable from subscriber count delta
- **Revenue (Subscriber)** → maps to `revenue` / `subscriptionRevenue` on DailySnapshot
- **Order count** → maps to `orderCount` on DailySnapshot
