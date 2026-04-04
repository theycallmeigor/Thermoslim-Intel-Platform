---
title: "Loop webhooks explained: A guide for developers"
source_url: "https://help.loopwork.co/en/articles/12672678-loop-webhooks-explained-a-guide-for-developers"
collection: "Developer Hub"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, developer-hub]
---

# Loop webhooks explained: A guide for developers

This guide provides a deep dive into the structure and delivery of webhook payloads.

### Payload Structure

*   **Event Type:** Unique identifier (e.g., `subscription.updated`).
*   **Payload Data:** Main data (user details, transactions).
*   **Metadata:** Contextual info (timestamps, request IDs).

### Triggers by Entity

*   **Subscription:** Covers standard lifecycle events plus `subscription/inventoryAction` (triggered by low inventory).
*   **Order:** Covers processing, stock issues, and payment failures.
*   **Payment Method:** Covers updates and expiration warnings.
*   **Flow:** Covers the `flow/completed` event for automated workflows.
*   **Subscription Checkout:** Covers `subscriptionCheckout/success` and `subscriptionCheckout/failed`.

### Code Snippet (Example Flow Payload)

```json
{
  "payload": {
    "id": 9876543,
    "name": "Loyalty Program Order - Free Hydrating Face Moisturizer",
    "subscription": { "id": 8765432, "status": "ACTIVE" }
  },
  "metaData": { "myshopifyDomain": "premiumcare.myshopify.com" }
}
```

## External Links Found

- [Admin API - Subscribe Webhook Endpoint](https://help.loopwork.co/en/articles/12672678-loop-webhooks-explained-a-guide-for-developers) (Reference to API docs)
- [Explore more FAQs](https://help.loopwork.co/en/collections/16646422-frequently-asked-questions-faqs)
- [support@loopwork.co](mailto:support@loopwork.co)

## Images/Diagrams

- **Support Beacon:** Chat icon for developer assistance.
- **Loop Subscriptions Logo:** Branding at the top and bottom of the page.
