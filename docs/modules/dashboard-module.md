# Dashboard module

## Location
`src/modules/dashboard/`

## Responsibilities
- Query unified store for metrics
- Compute period-over-period comparisons
- Build data for frontend chart components
- Cache results in Redis with TTL

## Key files
- `metrics/revenue.ts` — revenue calculations (total, checkout vs recurring, by source)
- `metrics/subscribers.ts` — subscriber counts, additions, reductions, net change
- `metrics/mrr.ts` — MRR calculation, MRR movement (new, expansion, contraction, churn)
- `metrics/churn.ts` — churn rate, subscribers lost, orders before cancellation
- `metrics/funnel.ts` — conversion rates by campaign, upsell take rates
- `snapshots.ts` — daily snapshot generation and querying
- `cache.ts` — Redis caching layer for dashboard queries
