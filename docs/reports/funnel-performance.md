# Funnel performance module

## Overview

Combines GA4 (traffic), Clarity (behavior), and CC (conversion) data to show end-to-end funnel performance.

## Data flow per funnel step

```
Step                  | GA4 data              | Clarity data                | CC data
─────────────────────┼───────────────────────┼─────────────────────────────┼──────────────────
Landing page visit    | sessions, source      | scroll depth, time on page  | salesUrl
Checkout start        | —                     | rage clicks on form         | orderId (partial)
Checkout complete     | —                     | —                           | orderId (complete)
Upsell 1 view         | —                     | scroll, dead clicks         | funnel step
Upsell 1 accept/decline| —                   | rage clicks on selector     | hasUpsells, product
Upsell 2 view         | —                     | scroll, dead clicks         | funnel step
Thank you page        | conversion event      | —                           | orderStatus=Complete
```

## Key reports

### Campaign comparison table
- Columns: campaign name, sessions (GA4), checkout starts, checkout completes (CC), upsell take rate, subscription rate, friction score (Clarity)
- Sortable by any column
- Sparkline for trend

### Funnel drop-off waterfall
- Visual: waterfall chart showing volume at each step with drop-off amounts
- Per-step: hover shows Clarity friction signals for that page

### Frequency selection analysis
- For upsell pages that offer multiple frequencies
- Distribution: what % chose 1-month, 3-month, 6-month
- Cross-reference with Clarity: rage clicks on frequency selector correlating with selection patterns
- Trend over time: is the 3-month take rate improving?

### Landing page UX health
- Per landing page: Clarity rage clicks, dead clicks, scroll depth, JS errors
- Correlated with GA4 bounce rate and CC conversion
- Alert threshold: "rage clicks exceeded 15% of sessions this week"
