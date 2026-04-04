# Design Spec: Performance & Operations (Tier 2/3)

This specification covers the requirements for **Campaign Comparison**, **Upsell Path Visualization**, and **Payment Health** dashboards.

---

## 1. Campaign Comparison Dashboard

**Goal:** Side-by-side performance analysis of different marketing funnels and traffic sources.

### UI Concept: "The Leaderboard"
- **Top Row:** A "Top 3" podium showing the best-performing campaigns by *Net Revenue* or *Subscription Take-rate*.
- **The Comparison Table:** A dense, multi-column table where each row is a campaign.
    - **Metrics:** Spend (if available), Orders, Revenue, AOV, **Initial Order to Sub %** (critical), and **Upsell Take Rate**.
    - **Sparklines:** Inline 7-day trend lines for Revenue and AOV within the table cells.
- **Interaction:** Selecting two or more rows triggers a "Compare View" overlay that overlays their trend lines (e.g., Conversion Rate over time) on a single chart.

---

## 2. Upsell Path Visualization

**Goal:** Understand where revenue is being added (or lost) in the post-purchase funnel.

### UI Concept: "The Sankey Funnel"
- **The Chart:** A Sankey diagram or a directed flow chart showing the path from the *Initial Offer* to *Upsell 1*, *Upsell 2*, etc.
    - **Width:** The thickness of the lines represents the volume of customers.
    - **Color:** Green for "Accepted", Red for "Declined".
- **Drop-off Analysis:** Identify "Leakage Points" where a high percentage of users are exiting the funnel without taking any upsells.
- **AOV Impact:** Show the cumulative AOV at each step of the path (e.g., Step 1: $49 -> Step 2: $74 -> Step 3: $82).

---

## 3. Decline & Payment Health

**Goal:** Monitor the "pipe" through which money flows. Essential for avoiding merchant account freezes.

### UI Concept: "The Signal Dashboard"
- **Decline Reason Tree:** A horizontal bar chart or tree map of decline reasons (e.g., *Insufficient Funds*, *Do Not Honor*, *CVV Failure*).
- **Salvage Tracking:** A KPI card showing the "Call Center Salvage Rate" — how many soft declines were turned into successful sales via manual follow-up.
- **Card Type Breakdown:** Comparison of Credit vs. Debit vs. Prepaid (Prepaid often has high churn/decline rates).
- **Risk Alerts:** Red "Critical" badges if the Chargeback rate exceeds 0.8% for any merchant account.

---

## 4. Ingestion & Sync Health (Operations)

**Goal:** Transparency for the dev/ops team on data freshiness.

### UI Concept: "The Heartbeat"
- **Status Badges:** Real-time indicators for Shopify Webhooks, CC API, and Clarity Sync.
- **Queue Monitor:** Visual bar showing the number of orders pending merge/deduplication.
- **Error Log:** A "Developer Console" view at the bottom of the page showing the last 50 ingestion errors with a "Retry" button.

---

## Implementation Strategy
- **Sankey:** Use `d3-sankey` or a simplified SVG-based flow component for the Upsell Path.
- **Leaderboard:** Use `@tanstack/react-table` with custom cell renderers for the sparklines.
- **Alerts:** Use a global toast/notification system for the Payment Health risk alerts.
