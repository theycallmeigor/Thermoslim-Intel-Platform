# Subscription reporting stack

Reports are organized in layers. Each layer depends on the ones below it.

## Layer 1: Foundation data
Orders, customers, products, transactions.
- **CC fields**: orderId, clientOrderId, customerId, emailAddress, productN_*, orderTotal, dateCreated
- **Shopify fields**: order ID, customer ID, line items, product IDs

## Layer 2: Subscription lifecycle
Track the state of each subscription over time.
- **CC fields**: purchaseId, clientPurchaseId, recurringStatus, billingCycleNumber, orderStatus
- **Derived metrics**: active subscriber count, new vs returning, subscription additions/reductions, status breakdown (Active, Trial, Cancelled, Paused, etc.)

## Layer 3: Subscription revenue
Built on lifecycle data.
- **CC fields**: recurringPrice, orderTotal, totalPrice, productN_price, salesTax, totalDiscount
- **Derived metrics**: MRR (sum of recurringPrice for active subs), checkout revenue vs recurring revenue, ARPU (MRR / active subscribers), revenue by product line and frequency

## Layer 4: Churn and cancellation
When recurringStatus changes to Cancelled or Complete.
- **CC fields**: recurringStatus transitions, billingCycleNumber at cancellation, refundReason
- **Derived metrics**: churn rate (subscribers lost / total active), orders before cancellation, MRR lost via cancellations, cancellation by reason, by product, by frequency, by funnel

## Layer 5: Predictive and cohort
Advanced analysis built from all layers.
- Cohort retention curves (group by signup month, track survival to cycle 2, 3, 4...)
- LTV prediction (ARPU x average lifetime)
- MRR forecasting (current growth rate minus churn rate)
- Payback period analysis (when does CAC pay back from subscription revenue)

## Breakdown dimensions (all metrics sliceable by)
- By funnel/campaign: campaignId, campaignName, salesUrl
- By product: productN_name, productN_sku, mapped to product line via product_map
- By frequency/offer variant: derived from campaignProductId + recurringPrice + product mapping (1-month, 3-month, 6-month)
- By upsell path: hasUpsells, replacedByOrderItemId — initial vs final product
- By traffic source: GA4 source/medium, CC sourceId, httpReferer
- By email engagement: Klaviyo engagement tier, last open recency
