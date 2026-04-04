---
title: "Recover failed payments quick action"
source_url: "https://help.loopwork.co/en/articles/13429876-recover-failed-payments-quick-action"
collection: "Retain"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, retain]
---

# Recover failed payments quick action

Incentivizes subscribers to update their payment method in one click from email/SMS to recover failed renewals.

### Strategy

*   **High retry count/Generic failure:** Lower incentives.
*   **Low retry count/Hard decline:** Higher discounts or exclusive offers.

### Using Segments

Segments allow multiple rules within one quick action based on:
*   **Subscription:** Value, total orders, spent.
*   **Customer:** History and tags.
*   **Payment:** Failure message/code, available retry count.

### Default Segments

1.  Retry count ≤ 1.
2.  Retry count between 2 and (max - 1).
3.  Retry count = max retry count.

### Customer Experience

Subscribers click a link in a notification, which opens an "Update card" drawer in their portal.

## External Links Found

- [Recovery via retries](https://help.loopwork.co/en/articles/12711171-recovery-via-retries)
- [Quick actions](https://help.loopwork.co/en/articles/12713090-quick-actions)
- [Payment analytics V1](https://help.loopwork.co/en/articles/12741921-payment-analytics-v1)

## Images/Diagrams

- **Recover failed payments configuration:** Admin screenshot.
- **Default segments:** Visuals of Segment 1, 2, and 3.
- **Update card drawer:** Customer experience screenshot.
