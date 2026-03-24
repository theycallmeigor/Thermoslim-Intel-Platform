# Unified schema design

## Core entities

### orders
Unified order record from any source.
- `id` — internal UUID
- `source` — enum: SHOPIFY, CHECKOUTCHAMP
- `sourceOrderId` — original order ID from source (CC orderId or Shopify order ID)
- `sourceClientOrderId` — CC clientOrderId (unique string ID)
- `customerId` — FK to customers table
- `status` — enum: PARTIAL, COMPLETE, PENDING, DECLINED, REFUNDED
- `orderTotal` — integer (cents), excludes upsells
- `totalPrice` — integer (cents), includes upsells + shipping
- `totalShipping` — integer (cents)
- `totalDiscount` — integer (cents)
- `salesTax` — integer (cents)
- `currencyCode` — ISO currency code
- `campaignId` — CC campaign ID
- `campaignName` — CC campaign name
- `salesUrl` — landing page URL
- `hasUpsells` — boolean
- `couponCode` — string, nullable
- `ipAddress` — string
- `paySource` — enum: CREDITCARD, CHECK, APPLEPAY, GOOGLEPAY, etc.
- `responseType` — enum: SUCCESS, HARD_DECLINE, SOFT_DECLINE, PENDING
- `createdAt` — timestamp (UTC)
- `syncedAt` — timestamp of last sync

### order_items
Unpacked from CC product1-5 fields. Each CC product slot becomes a row.
- `id` — UUID
- `orderId` — FK to orders
- `productSlot` — integer (1-5, from CC productN position)
- `productMapId` — FK to product_map
- `ccCrmId` — CC product base ID (productN_crmId)
- `ccCampaignProductId` — CC campaign product ID
- `externalId` — Shopify product ID (productN_externalId)
- `name` — product name
- `sku` — SKU
- `price` — integer (cents), price paid this cycle
- `quantity` — integer
- `recurringStatus` — enum: TRIAL, ACTIVE, RECYCLE_BILLING, RECYCLE_FAILED, COMPLETE, CANCELLED
- `billingCycleNumber` — integer
- `recurringPrice` — integer (cents)
- `productCategoryId` — CC category ID
- `productCategoryName` — CC category name
- `replacedByOrderItemId` — FK to order_items (if replaced by upsell)

### customers
Deduplicated across sources. Join key: email + phone.
- `id` — UUID
- `email` — unique, primary join key across all sources
- `phone` — nullable
- `firstName`, `lastName`, `fullName`
- `billingAddress` — JSON (address1, address2, city, state, postalCode, country)
- `shippingAddress` — JSON
- `ccCustomerId` — CC customerId
- `shopifyCustomerId` — Shopify customer ID
- `klaviyoProfileId` — Klaviyo profile ID
- `contactOptIn` — boolean
- `firstOrderAt` — timestamp
- `lastOrderAt` — timestamp
- `totalOrders` — integer (denormalized, updated on sync)
- `totalRevenue` — integer cents (denormalized)
- `createdAt` — timestamp

### subscriptions
Derived from CC subscription data. One row per subscription lifecycle.
- `id` — UUID
- `customerId` — FK to customers
- `ccPurchaseId` — CC purchaseId (numeric)
- `ccClientPurchaseId` — CC clientPurchaseId (string)
- `originalOrderId` — FK to orders (first order in subscription)
- `productMapId` — FK to product_map
- `status` — enum: TRIAL, ACTIVE, RECYCLE_BILLING, RECYCLE_FAILED, COMPLETE, CANCELLED, PAUSED
- `currentBillingCycle` — integer
- `recurringPrice` — integer (cents)
- `frequency` — string (derived from product map: "1_MONTH", "3_MONTH", "6_MONTH")
- `campaignId` — CC campaign the subscription originated from
- `startedAt` — timestamp
- `cancelledAt` — timestamp, nullable
- `cancelReason` — string, nullable
- `lastBilledAt` — timestamp
- `nextBillDate` — timestamp, nullable

### subscription_events
Every state change on a subscription.
- `id` — UUID
- `subscriptionId` — FK to subscriptions
- `eventType` — enum: CREATED, BILLED, DECLINED, CANCELLED, PAUSED, RESUMED, REACTIVATED
- `fromStatus` — previous status
- `toStatus` — new status
- `billingCycleNumber` — at the time of event
- `amount` — integer cents (for billing events)
- `declineReason` — string (for decline events)
- `metadata` — JSON (extra context)
- `occurredAt` — timestamp

### revenue_events
Every revenue-impacting event.
- `id` — UUID
- `orderId` — FK to orders
- `customerId` — FK to customers
- `eventType` — enum: SALE, REFUND, CHARGEBACK, REBILL, VOID
- `amount` — integer cents (positive for revenue, negative for refunds/chargebacks)
- `source` — enum: SHOPIFY, CHECKOUTCHAMP
- `refundReason` — string, nullable
- `chargebackReasonCode` — string, nullable
- `transactionId` — gateway transaction ID
- `occurredAt` — timestamp

### product_map
Unified product mapping. Shopify is the master catalog.
- `id` — UUID
- `shopifyProductId` — Shopify product ID
- `shopifyVariantId` — Shopify variant ID, nullable
- `ccCrmId` — CC base product ID
- `ccCampaignProductIds` — JSON array of CC campaignProductIds that map to this product
- `externalId` — the shared ID (productN_externalId in CC = Shopify product ID)
- `name` — canonical product name
- `sku` — canonical SKU
- `productLine` — grouping (e.g., "Sculpt+", "ThermoSlim GLP-1")
- `category` — product category
- `frequency` — supply frequency (e.g., "1_MONTH", "3_MONTH", "6_MONTH")
- `priceTier` — pricing tier label
- `isSubscription` — boolean
- `metadata` — JSON (extra attributes)
- `createdAt` — timestamp
- `updatedAt` — timestamp

### funnel_events
Checkout and upsell funnel tracking from CC.
- `id` — UUID
- `orderId` — FK to orders, nullable (may not complete)
- `customerId` — FK to customers, nullable
- `campaignId` — CC campaign ID
- `step` — enum: LANDING, CHECKOUT_START, CHECKOUT_COMPLETE, UPSELL_1_VIEW, UPSELL_1_ACCEPT, UPSELL_1_DECLINE, UPSELL_2_VIEW, UPSELL_2_ACCEPT, UPSELL_2_DECLINE, THANK_YOU
- `pageUrl` — page URL
- `productMapId` — FK to product_map (what was offered)
- `accepted` — boolean, nullable
- `occurredAt` — timestamp

### upsell_paths
Tracks the upsell journey per order.
- `id` — UUID
- `orderId` — FK to orders
- `initialProductMapId` — what they started with
- `finalProductMapId` — what they ended up with
- `upsellsAccepted` — integer count
- `upsellsDeclined` — integer count
- `revenueAdded` — integer cents (upsell revenue)

### email_campaigns
Klaviyo campaign performance.
- `id` — UUID
- `klaviyoCampaignId` — Klaviyo campaign ID
- `name` — campaign name
- `subject` — email subject line
- `sentAt` — timestamp
- `sends` — integer
- `opens` — integer
- `clicks` — integer
- `bounces` — integer
- `unsubscribes` — integer
- `attributedRevenue` — integer cents (Klaviyo's attribution)
- `attributedOrders` — integer
- `syncedAt` — timestamp

### email_flows
Klaviyo flow performance.
- `id` — UUID
- `klaviyoFlowId` — Klaviyo flow ID
- `name` — flow name (e.g., "Welcome Series", "Winback", "Abandoned Cart")
- `status` — enum: LIVE, DRAFT, PAUSED
- `sends` — integer (total across all steps)
- `conversions` — integer
- `attributedRevenue` — integer cents
- `syncedAt` — timestamp

### email_events
Per-customer email activity, joined to customer record.
- `id` — UUID
- `customerId` — FK to customers
- `eventType` — enum: SENT, OPENED, CLICKED, BOUNCED, UNSUBSCRIBED
- `campaignId` — FK to email_campaigns, nullable
- `flowId` — FK to email_flows, nullable
- `occurredAt` — timestamp

### page_analytics
Aggregated from Clarity + GA4, joined by URL.
- `id` — UUID
- `pageUrl` — page URL
- `date` — date
- `sessions` — integer (GA4)
- `pageViews` — integer (GA4)
- `avgTimeOnPage` — float seconds (GA4)
- `bounceRate` — float (GA4)
- `avgScrollDepth` — float percent (Clarity)
- `rageClicks` — integer (Clarity)
- `deadClicks` — integer (Clarity)
- `excessiveScrollSessions` — integer (Clarity)
- `jsErrorCount` — integer (Clarity)
- `topReferrers` — JSON (GA4)
- `deviceBreakdown` — JSON (GA4/Clarity)

### attribution
Traffic and affiliate attribution from CC.
- `id` — UUID
- `orderId` — FK to orders
- `sourceId` — CC affiliate ID
- `pubId` — publisher ID
- `subAffId` — sub-affiliate ID
- `sourceValue1` through `sourceValue5` — tracking values
- `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm` — derived from salesUrl params
- `httpReferer` — referrer URL
- `userAgent` — browser/device info

### daily_snapshots
Pre-aggregated daily metrics for fast dashboard queries.
- `id` — UUID
- `date` — date
- `source` — enum: SHOPIFY, CHECKOUTCHAMP, COMBINED
- `campaignId` — nullable (for per-campaign snapshots)
- `productLine` — nullable (for per-product-line snapshots)
- `frequency` — nullable (for per-frequency snapshots)
- `totalOrders` — integer
- `totalRevenue` — integer cents
- `checkoutRevenue` — integer cents (first orders)
- `recurringRevenue` — integer cents (rebills)
- `refunds` — integer cents
- `chargebacks` — integer cents
- `newSubscribers` — integer
- `cancelledSubscribers` — integer
- `activeSubscribers` — integer (snapshot at end of day)
- `activeMRR` — integer cents
- `avgOrderValue` — integer cents
- `churnRate` — float (day-level for trend charts)
