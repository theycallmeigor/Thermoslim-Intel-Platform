---
title: "Gift instead of skip"
source_url: "https://help.loopwork.co/en/articles/12714027-gift-instead-of-skip"
collection: "Customer portal"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, customer-portal]
plan: "Loop Pro"
---

# Gift instead of skip

Learn how Loop's gift instead of skip feature turns skipped orders into thoughtful gifts, enhancing engagement and creating delightful subscriber experiences.

> **Plan requirement:** Gift instead of skip is available exclusively on the **Loop Pro plan**.

Gift instead of skip allows subscribers to gift their upcoming order instead of skipping it. Rather than bypassing a delivery, subscribers can choose to send their order as a thoughtful gift to a friend, family member, or colleague.

## Why use gift instead of skip?

- **For brands**: Prevents revenue loss from skipped orders, ensuring consistent recurring income
- **For subscribers**: Turns a skipped order into a meaningful gift
- **For relationships**: Strengthens emotional connection — subscribers associate the brand with generosity

## Setting up gift instead of skip

**Prerequisites:**
1. The customer must have at least one active subscription
2. The "Skip order" option must be enabled

**Steps:**
1. Navigate to **Loop admin > Customer portal > Preferences > Order actions > Skip order**
2. Enable "Allow customers to gift an order instead of skipping" and click Save

> Text related to this feature can be configured under: Loop admin > Customer Portal > Themes > Skip order flow texts

## Customer portal experience

When subscribers log in and choose to skip an order, they now see:

1. Subscriber logs in and clicks the "Skip order" button
2. A modal presents two options: "Skip order" or "Gift upcoming order"
3. On selecting "Gift upcoming order", a side drawer opens to enter recipient details (name, email, shipping information)
4. Fill in required recipient details and click "Gift this order" — the order is charged immediately and placed successfully
   - Note: Shipping price is calculated based on the recipient's address. If undeliverable, an error is displayed.
5. The subscriber's upcoming order schedule remains unchanged — only the next upcoming order was sent as a gift

## Admin portal experience

- The gifted order appears in the order schedule with a **"Gift" badge**
- Detailed activity logs capture the gift activity for full transparency
- After the gift order is processed, the newly added address and updated shipping price are reverted to the original — ensuring the original contract remains unchanged

## Reports

- **Processed orders report**: New "Gift instead of skip" column showing Boolean (True/False) for each order
- **Subscription activity logs report**: Filter for event type `order_gifted_instead_of_skip`

## Considerations

- Available only for **shipping or local delivery** subscriptions (not store pickups)
- **Not supported** for Zapiet stores
- **Does not apply** to subscriptions with anchor configurations

## External Links Found

- https://help.loopwork.co/en/articles/12714028-skip-upcoming-order
- https://help.loopwork.co/en/articles/12729851-gift-subscriptions
- https://help.loopwork.co/en/articles/14008787-gift-order
