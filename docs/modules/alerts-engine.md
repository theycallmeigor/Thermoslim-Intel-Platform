# Alerts engine module

## Location
`src/modules/alerts/`

## Alert types

### Threshold alerts
- "Revenue drops below $X in any 1-hour window"
- "Checkout conversion rate below X% for campaign Y"
- Configurable per-metric thresholds

### Anomaly alerts
- "Today's conversion rate is >2 standard deviations below 7-day average"
- Rolling average + standard deviation calculation
- Auto-adjusts to seasonality

### Trend alerts
- "3 consecutive days of declining AOV"
- "MRR growth rate turned negative this week"

### Operational alerts
- "No orders received in 30 minutes" (checkout may be broken)
- "Rage clicks on checkout exceeded 100 sessions today" (from Clarity)
- "JS errors detected on upsell page" (from Clarity)

### Reconciliation alerts
- "Shopify order count diverges from CC by >5%"
- "Revenue mismatch between sources exceeds $X"

### Engagement alerts
- "15 subscribers showing disengagement pattern" (from Klaviyo engagement + CC subscription status)
- "Winback flow conversion rate dropped 50% this week"

## Notification channels
- In-app notification center
- Email digest (configurable frequency)
- Slack webhook integration
- SMS for critical alerts (via Twilio)

## Evaluation
- Alert rules evaluated after each sync completion
- BullMQ job processes rule queue
- Deduplication: same alert not re-fired within cooldown window
