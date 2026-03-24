# Order QA module

## Location
`src/modules/order-qa/`

## QA rules

### Cross-platform matching
- Every CC order should have a corresponding Shopify order (and vice versa)
- Match key: CC orderId/clientOrderId ↔ Shopify order ID (or via customer email + timestamp)

### Revenue reconciliation
- Order totals should agree within tolerance ($0.01 for rounding)
- Flag orders where CC totalPrice != Shopify order total

### Fulfillment sync
- If Shopify says shipped, CC should reflect it
- Flag orders with mismatched fulfillment status

### Customer data consistency
- Email, address, phone should match across platforms
- Flag significant discrepancies

### Duplicate detection
- Same customer + same products + timestamp within 5 minutes = likely duplicate
- Flag for manual review

## Output
- QA dashboard with pass/fail rates per rule
- Flagged order queue with filters (by rule, by severity, by date)
- Auto-resolution for known patterns (e.g., 5-minute timing lag tolerance)
