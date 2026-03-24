# CheckoutChamp adapter

## Connection
- REST API: apidocs.checkoutchamp.com
- Export webhooks: configurable postback profiles
- Auth: API key + username in request headers/params

## API reference
- Recommended API flow: https://help.checkoutchamp.com/api-documentation/api-documentation/recommended-api-flow
- Performing API calls: https://help.checkoutchamp.com/api-documentation/api-documentation/performing-api-calls
- Full API docs: https://apidocs.checkoutchamp.com/
- Webhook field mapping: https://help.checkoutchamp.com/crm/admin-setup/export-webhook-profiles/postback-export-profiles

## Webhook field mapping (key fields)

### Order identification
- `orderId` — numeric order ID
- `clientOrderId` — unique string order ID
- `customerId` — CC customer ID
- `dateCreated`, `timeCreated` — order timestamp

### Customer
- `emailAddress` — **primary join key** across all systems
- `firstName`, `lastName`, `fullName`
- `phoneNumber`
- `address1`, `address2`, `city`, `state`, `postalCode`, `country`
- `shipAddress1`, `shipCity`, `shipState`, `shipPostalCode`, `shipCountry`

### Revenue
- `orderTotal` — order total without upsells
- `totalPrice` — orderTotal + upsells + totalShipping
- `totalShipping` — shipping cost paid by customer
- `totalDiscount` — discount applied
- `salesTax` — tax amount
- `currencyCode` — currency

### Product (repeated for product1 through product5)
- `productN_name` — product name
- `productN_sku` — SKU
- `productN_crmId` — CC base product ID
- `productN_externalId` — **Shopify product ID** (critical for mapping)
- `productN_campaignProductId` — CC campaign-specific product ID
- `productN_price` — price paid this cycle
- `productN_qty` — quantity
- `productN_recurringstatus` — Trial, Active, Recycle Billing, Recycle Failed, Complete, Cancelled
- `productN_billingCycleNumber` — current billing cycle number
- `productN_productCategoryId`, `productN_productCategoryName`

### Subscription
- `purchaseId` — numeric subscription ID
- `clientPurchaseId` — unique string subscription ID
- `originalOrderId` — first order in subscription
- `originalClientOrderId` — first order string ID
- `recurringPrice` — recurring price
- `basePrice` — base price of product

### Funnel / attribution
- `campaignId` — campaign numeric ID
- `campaignName` — campaign name
- `salesUrl` — landing page URL (**join key to GA4 + Clarity**)
- `sourceId` — affiliate ID
- `pubId` — publisher ID
- `subAffId` — sub-affiliate ID
- `sourceValue1` through `sourceValue5` — tracking values
- `httpReferer` — referrer URL
- `userAgent` — browser/device

### Upsell tracking
- `hasUpsells` — boolean (1/0)
- `replacedByOrderItemId` — the upsell item that replaced the original

### Transaction
- `transactionId` — gateway transaction ID
- `actualTransactionId` — unique transaction ID
- `clientTxnId` — unique transaction string ID
- `responseType` — SUCCESS, HARD_DECLINE, SOFT_DECLINE, PENDING, COD_PENDING
- `declineReason` — decline reason from processor
- `paySource` — CREDITCARD, CHECK, APPLEPAY, GOOGLEPAY, etc.
- `cardType` — Visa, MasterCard, etc.
- `gatewayTitle` — gateway name

### Refund / chargeback
- `dateRefunded` — refund date
- `refundReason` — stated reason
- `chargebackAmount`, `chargebackDate`, `chargebackNote`, `chargebackReasonCode`

### Fulfillment
- `fulfillmentStatus` — Hold, Pending, Pending Shipment, Shipped, Delivered, Cancelled, RMA Pending, Returned
- `trackingNumber` — tracking number
- `shipCarrier` — carrier (USPS, etc.)
- `shipMethod` — shipping method
- `rmaNumber` — RMA number

### Custom fields
- `custom1` through `custom5` — custom values
- `customFields` — comma-separated custom field values
- `orderCustomFields` — JSON-encoded order custom fields
- `customerCustomFields` — JSON-encoded customer custom fields

## Frequency / offer variant derivation

CC does not have a clean "frequency" field. Frequency is derived at ingestion from:
1. **product_map lookup**: campaignProductId → product_map entry → frequency field
2. **Product name pattern**: if name contains "1 Month", "3 Month", "6 Month" etc.
3. **SKU pattern**: if SKU contains frequency indicator (e.g., "SCULPT-3MO")
4. **Admin override**: manual mapping in product mapping admin screen
