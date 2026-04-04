---
title: "Payment errors"
source_url: "https://help.loopwork.co/en/articles/12712734-payment-errors"
collection: "Retain"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, retain]
---

# Payment errors

Troubleshooting guide for common payment failure codes returned by Shopify.

### Common Payment Errors

*   **`card_declined`:** Rejected by the bank/issuer.
*   **`insufficient_funds`:** Not enough balance.
*   **`card_expired`:** Card is past its expiration date.
*   **`agreement_cancelled`:** Billing agreement revoked by customer.
*   **`card_not_supported`:** Card type not accepted.
*   **`paypal_error`:** Technical issue with PayPal.
*   **`gateway_issue`:** Technical problem with the payment gateway.
*   **`shoppay_not_enabled`:** Shop Pay wallet is not active.
*   **`inventory_allocations_not_found`:** Product unavailable or address issue.

### Troubleshooting

*   **Declines:** Verify status, use alternate method, or contact issuer.
*   **Insufficient Funds:** Use retry settings.
*   **Expired Card:** Send payment update email via quick action.
*   **Agreement Cancelled:** Send quick action URL to reactivate.

Loop does not process payments; it scheduled orders on Shopify, which then returns the error messages from the gateway.

## External Links Found

- [Recovery via retries](https://help.loopwork.co/en/articles/12711171-recovery-via-retries)
- [Change payment method](https://help.loopwork.co/en/articles/12729474-change-payment-method)

## Images/Diagrams

- **Error messages table:** Categories, default texts, and descriptions.
- **Troubleshooting sections:** Detailed breakdown per error type.
