# Design Spec: Subscription Analytics (Tier 2)

This specification covers the architectural and UI requirements for the **MRR Waterfall** and **Cohort Retention Matrix** dashboards. These are the most critical tools for understanding the health of the ThermoSlim subscription business.

---

## 1. MRR Waterfall Dashboard

**Goal:** Answer "How did our Monthly Recurring Revenue (MRR) change from Month A to Month B?"

### Data Logic (Prisma / SQL)
The waterfall is calculated by comparing the state of all subscriptions at the start vs. the end of a period.

1.  **Starting MRR:** Sum of normalized monthly price for all `ACTIVE/TRIAL` subs at `startDate`.
2.  **New MRR (+):** MRR from subscriptions created within the period.
3.  **Reactivation MRR (+):** MRR from subs that were `CANCELLED/PAUSED` at `startDate` but moved to `ACTIVE` during the period.
4.  **Expansion MRR (+):** MRR increase from existing subs (e.g., frequency change 3-mo → 1-mo, or price increase).
5.  **Contraction MRR (-):** MRR decrease from existing subs (e.g., 1-mo → 3-mo frequency).
6.  **Churn MRR (-):** MRR lost from subs that moved to `CANCELLED` during the period.
7.  **Ending MRR:** Sum of all active MRR at `endDate`.

### Visual Layout
- **Primary Chart:** A "Waterfall" bar chart (Recharts `BarChart` with transparent "staged" bases).
    - X-Axis: The 5 change categories + Starting/Ending totals.
    - Y-Axis: Revenue in USD.
    - Color: Green for gains (+), Red for losses (-), Blue for totals.
- **KPI Row:**
    - Net MRR Growth (%)
    - MRR Churn Rate (%)
    - Expansion vs. Churn Ratio (Quick health check: >1.0 is "Net Negative Churn").

---

## 2. Cohort Retention Matrix

**Goal:** Answer "Of the customers who signed up in January, what percentage are still active 6 months later?"

### Data Logic (The "Triangle")
- **Rows (Signup Cohorts):** Group customers by their `startedAt` month.
- **Columns (Billing Cycles):** Represent the nth rebill (Cycle 0, 1, 2, 3...).
- **Cell Value:** 
    - `(Total Active in Cycle N) / (Total Original Signups in Cohort) * 100`
- **Normalization:** Must be sliceable by `ProductLine` and `Frequency`. A 6-month supply customer stays in Cycle 1 for 180 days, whereas a 1-month customer moves to Cycle 2 in 30 days.

### Visual Layout
- **The Matrix:** A heatmap grid.
    - Rows: `Month/Year (e.g., Jan 2026)`
    - Columns: `Cycle 1, Cycle 2, Cycle 3...`
    - Styling:
        - `90-100%`: Deep Emerald
        - `70-89%`: Light Green
        - `50-69%`: Yellow/Amber
        - `<50%`: Red/Pink
- **Interaction:**
    - Hovering over a cell shows raw numbers (e.g., "452 / 600 active").
    - Clicking a row (Cohort) opens a side-panel trend line for *that* cohort's survival curve.

---

## 3. Interaction Patterns

1.  **Global Filters:** Both dashboards must react to the Top Bar's Date Range, but also include "Segment Filters" (Campaign, Product, Frequency) in a sub-header.
2.  **Drill-down:** Clicking the "Churn" bar in the Waterfall or a "Red" cell in the Cohort Matrix should update the Order/Customer table at the bottom of the page to show the specific users affected.

## 4. Implementation Strategy (React)
- **Waterfall:** Use a custom `Cell` in Recharts to handle the "floating" bars.
- **Cohort:** Use a standard HTML table for the matrix to ensure high density and performance, styled with Tailwind's dynamic `bg-[color]` based on percentage values.
- **Normalization:** Frequency (1, 3, 6 months) must be normalized to a "Monthly Equivalent" MRR for accurate Waterfall reporting.
