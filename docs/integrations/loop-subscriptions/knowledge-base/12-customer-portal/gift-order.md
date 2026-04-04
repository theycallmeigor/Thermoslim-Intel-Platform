---
title: "Gift order"
source_url: "https://help.loopwork.co/en/articles/14008787-gift-order"
collection: "Customer portal"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, customer-portal]
plan: "Loop Pro"
---

# Gift order

Learn how subscribers can gift an upcoming subscription order to someone else, creating a delightful experience for the recipient.

> **Plan requirement:** Gift order is available exclusively on the **Loop Pro plan**.

Gift order is a feature that lets subscribers gift their upcoming order using a dedicated action in the customer portal — sending their order to a friend, family member, or colleague for a thoughtful surprise.

## Why use gift order?

- **Encourage sharing**: Allow subscribers to easily gift their upcoming order
- **Increase brand reach**: Introduce new customers to your brand through gifted orders
- **Boost product discovery**: Gift recipients experience your products, increasing likelihood of future purchases
- **Strengthen subscriber engagement**: Flexible options like gifting enhance the overall subscription experience

## Setting up gift order

**Prerequisite:** The customer must have at least one active subscription.

1. Navigate to **Loop admin > Customer portal > Preferences > Order actions > Gift order**
2. Enable the option and click Save

> Text related to this feature can be configured under: **Loop admin > Customer Portal > Themes > Gift order flow texts**

## Customer portal experience

1. Subscriber logs in and clicks the "Gift" button
2. A modal presents two options: "Gift upcoming order" or "Close"
3. On selecting "Gift upcoming order", a side drawer opens to enter recipient details (name, email, shipping information)
4. Fill in required recipient details and click "Gift this order" — the order is charged immediately and placed successfully
   - Note: Shipping price is calculated based on the recipient's address. If undeliverable, an error is displayed.
5. The subscriber's upcoming order schedule remains unchanged — only the next upcoming order will be sent as a gift

## Admin portal experience

- The gifted order appears in the order schedule with a **"Gift" badge**
- Detailed activity logs capture the gift activity for full transparency
- After the gift order is processed, the newly added address and updated shipping price are reverted to the original address and shipping price in the subscription contract — ensuring the original contract remains unchanged

## Reports

The Subscription activity logs report now includes a filter for the event type `order_gifted_customer_portal`, providing detailed insights into gifting activities.

## Considerations

- Available only for **shipping or local delivery** subscriptions (not store pickups)
- **Not supported** for Zapiet stores
- **Does not apply** to subscriptions with anchor configurations

## External Links Found

- https://help.loopwork.co/en/articles/12714027-gift-instead-of-skip
- https://help.loopwork.co/en/articles/12729851-gift-subscriptions
- https://help.loopwork.co/en/articles/13830420-order-now-campaign
