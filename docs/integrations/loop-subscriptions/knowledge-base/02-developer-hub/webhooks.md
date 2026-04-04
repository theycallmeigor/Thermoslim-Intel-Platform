---
title: "Webhooks"
source_url: "https://help.loopwork.co/en/articles/12672677-webhooks"
collection: "Developer Hub"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, developer-hub]
---

# Webhooks

Webhooks allow users to track real-time subscription events and automate workflows.

### Technical Requirements

*   **Response:** Must return a 200-range status code to confirm receipt.
*   **Timeout:** 5-second timeout period.
*   **Retries:** Failed requests are retried over 48 hours before being deleted.
*   **Security:** Requires a secure HTTPS connection.

### Webhook Attributes & Headers

*   **Attributes:** `id`, `address`, `topic`, `version`.
*   **Headers:** `X-Loop-Webhook-Id`, `X-Loop-Webhook-Api-Version`, `X-Loop-Webhook-Topic`, `X-Loop-Webhook-Created-At`, `X-Loop-Webhook-Delivery-At`, `X-Loop-Webhook-Retry-Count`.

### Supported Topics

*   **Subscription:** created, paused, updated, cancelled, resumed, reactivated, delayed, rescheduled, expired.
*   **Order:** upcoming, processed, partiallyProcessed, outOfStock, skipped, unskipped, paymentFailed.
*   **Payment Method:** updateRequested, updated, expiringSoon.
*   **Flows:** completed.

### Code Snippet (Example Subscription Payload)

```json
{ 
  "payload": { 
    "id": 8888999, 
    "status": "ACTIVE", 
    "customer": { "email": "customer@example.com", "firstName": "John", "lastName": "Smith" },
    "lineItems": [ { "sku": "SHO12345", "price": "5.39", "quantity": 1 } ],
    "nextOrderDate": "2025-04-18T12:00:00.000Z"
  }, 
  "metaData": { "myshopifyDomain": "customshop.myshopify.com" }
}
```

## External Links Found

- [List Webhook Topics (Readme.io)](https://loop-admin.readme.io/reference/list-webhook)
- [Explore more FAQs](https://help.loopwork.co/en/collections/16646422-frequently-asked-questions-faqs)
- [Loop Subscriptions Website](https://www.loopwork.co/)
- [support@loopwork.co](mailto:support@loopwork.co)

## Images/Diagrams

- **Subscription Interface Screenshot:** An image showing the UI for subscribing to a webhook by specifying an address and topic.
- **Unsubscribe Interface Screenshot:** An image showing how to remove a webhook subscription using its ID.
- **Social Media Icons:** Links to YouTube, LinkedIn, and Twitter (X).
