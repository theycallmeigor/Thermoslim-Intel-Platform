# Marketing Automation Alerts Implementation Plan
**Created:** 2026-03-30
**Priority:** High — next build after Loop adapter
**No schema changes needed** — writes to existing `Anomaly` table

---

## Architecture

- 4 alert rules following the adapter registry pattern
- Rules evaluated hourly via BullMQ + after every sync completion
- Results stored in existing `Anomaly` model (type, severity, expected, actual, deviation, explanation)
- 24h cooldown deduplication — same alert won't fire twice in a day

## Files to Create

| File | Purpose |
|------|---------|
| `src/modules/alerts/types.ts` | `IAlertRule` and `AlertResult` interfaces |
| `src/modules/alerts/registry.ts` | Rule registration (same pattern as ingestion registry) |
| `src/modules/alerts/runner.ts` | Iterate rules, deduplicate, write Anomaly rows |
| `src/modules/alerts/rules/churn-spike.ts` | Rule 1 |
| `src/modules/alerts/rules/campaign-roi-kill.ts` | Rule 2 |
| `src/modules/alerts/rules/upsell-drop.ts` | Rule 3 |
| `src/modules/alerts/rules/rebill-decline-spike.ts` | Rule 4 |

## Files to Modify

| File | Change |
|------|--------|
| `src/modules/alerts/index.ts` | Replace stub with exports |
| `src/core/sync/worker.ts` | Add `alerts:evaluate` job + hourly scheduler |
| `src/core/ingestion/post-hooks.ts` | Trigger alert evaluation after sync |

---

## Rule 1: Churn Prevention Alert
**Type:** `CHURN_SPIKE`
**Trigger:** Daily churn rate exceeds 5% threshold OR deviates >2 stddev from 7-day average
**Data source:** `DailySnapshot` (churnRate, cancelledSubscribers, activeSubscribers) — aggregate rows only (all dimension fields null)
**Enrichment:** Top 3 cancel reasons from `Subscription` table for the explanation text

**Marketing action:** Feed into Klaviyo retention flow. "Churn spiked to X% yesterday, top reason: too expensive. 60% cancel after cycle 1."

---

## Rule 2: Campaign ROI Kill Switch
**Type:** `CAMPAIGN_ROI_KILL`
**Trigger:** Campaign's daily revenue drops >50% from its own 7-day baseline OR orders drop to zero
**Data source:** `DailySnapshot` filtered by `campaignId` (aggregate by campaign, no product/frequency dimensions)
**Dimension:** `campaignId` / `campaignName`

**Marketing action:** Daily digest: "Campaign X dropped 60% — pause or optimize. Campaign Y still performing at 2x baseline."

---

## Rule 3: Upsell Funnel Optimization Alert
**Type:** `UPSELL_DROP`
**Trigger:** Yesterday's upsell accept rate drops >20% relative to 14-day baseline
**Data source:** `UpsellPath` joined through `Order` (source IN SHOPIFY/MERGED, status COMPLETE)
**Formula:** accept rate = accepted / (accepted + declined)

**Marketing action:** "Upsell accept rate dropped from 15% to 11%. Review offer copy, pricing, or product selection."

---

## Rule 4: Rebill Failure → Recovery Trigger
**Type:** `REBILL_DECLINE_SPIKE`
**Trigger:** Yesterday's decline count >2x the 7-day daily average OR decline rate exceeds 15%
**Data source:** `SubscriptionEvent` (eventType DECLINED vs BILLED counts), `Order` for decline reasons
**Enrichment:** Top 3 decline reasons from `Order.declineReason`

**Marketing action:** Auto-trigger Klaviyo "update your payment" flow. Pre-dunning email 3 days before rebill for at-risk cards.

---

## Execution Notes

- DailySnapshot rows exist at multiple granularities. Aggregate rows have all dimension fields as `null`. Rules must filter correctly to avoid double-counting.
- Revenue is in cents (integers). Use `fmt$` / `fmtK` for display.
- The existing `Anomaly.acknowledged` field supports a future "dismiss" UI in Ingestion Health.
- No Slack/email notification yet — alerts surface on the Ingestion Health page under "Active Anomalies". Notification channels are a future add once Slack webhook URL is provided.
