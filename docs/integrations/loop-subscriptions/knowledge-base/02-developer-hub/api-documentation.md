---
title: "API documentation"
source_url: "https://help.loopwork.co/en/articles/12672675-api-documentation"
collection: "Developer Hub"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, developer-hub]
---

# API documentation

The Loop API is a REST API with resource-oriented URLs, accepting JSON-encoded request bodies and returning JSON-encoded responses. It uses standard HTTP response codes, authentication, and methods.

### Key Categories

*   **Storefront APIs:** Tailored for customer-specific actions. Authenticates using a session token unique to each customer (expires after 24 hours).
*   **Admin APIs:** Designed for broad administrative control to manage all subscriptions.

**Important Note:** As of February 20, 2026, V1 APIs have been officially deprecated.

### FAQs Included

*   **Reactivating subscriptions:** The `checkoutReactivate` API allows reactivating cancelled subscriptions with new lines.
*   **Interval Types:** Explains the difference between "DAY" and "CUSTOM" interval types.
*   **Platform Constraints:** Subscriptions cannot be set up outside of Shopify as Loop is designed specifically for Shopify.
*   **Error Handling:** Addresses the "Loop integration failed" error related to incorrect tokens.
*   **Payment Identifiers:** How to retrieve the `lastCharged` key to identify the most recent payment method.

## External Links Found

- [Storefront API Documentation](https://help.loopwork.co/en/articles/12672675-api-documentation) (Internal reference link)
- [Admin API Documentation](https://help.loopwork.co/en/articles/12672675-api-documentation) (Internal reference link)
- [support@loopwork.co](mailto:support@loopwork.co)

## Images/Diagrams

- **Support Beacon:** A chat icon located at the bottom right of the screen for live assistance.
- **Loop Subscriptions Logo:** Branding at the top of the page.
