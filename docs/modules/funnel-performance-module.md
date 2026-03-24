# Funnel performance module

## Location
`src/modules/funnel/`

## Data sources used
- GA4: traffic, sessions, source/medium per landing page
- Clarity: behavioral signals per page (rage clicks, dead clicks, scroll depth)
- CC: checkout conversion, upsell acceptance, order completion

## Key computations
- End-to-end conversion rate: GA4 sessions → CC completed orders
- Per-step drop-off: traffic → checkout start → checkout complete → upsell accept → subscription
- Friction score per page: weighted combination of Clarity signals (rage clicks high weight, dead clicks medium)
- Frequency selection distribution: what % of upsell page visitors chose each frequency option
- Campaign comparison: side-by-side metrics across all active campaigns/funnels
