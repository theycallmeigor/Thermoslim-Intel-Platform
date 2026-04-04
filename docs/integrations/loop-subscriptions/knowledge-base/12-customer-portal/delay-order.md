---
title: "Delay order"
source_url: "https://help.loopwork.co/en/articles/12714039-delay-order"
collection: "Customer portal"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, customer-portal]
---

# Delay order

Learn how to use the Delay order feature in Loop to let subscribers postpone deliveries easily without interrupting their subscription cycle.

Delay order allows subscribers to push the upcoming order by a chosen number of days without skipping it entirely. This feature is useful when the subscriber still wants the product but may not need it immediately — e.g., if they're traveling, have extra stock, or need more time before their next delivery.

## Key difference: Delay vs. Reschedule

- **Delay**: Pushes the order by a set number of days (7, 15, 30, or custom)
- **Reschedule**: Allows selecting a specific calendar date

## Enabling the delay option

1. Navigate to **Loop > Customer portal > Preferences > Order actions > Delay order**
2. Enable this setting to allow customers to delay upcoming orders from the customer portal
3. By default, customers see three delay options: **7, 15, and 30 days**. To offer a custom delay option, enable the respective setting and define the number of days manually.

## Delaying from the customer portal

1. Customer logs in, opens the desired subscription, and clicks the "Delay" button in the action bar
2. The delay subscription drawer opens — customer selects the desired interval from the given choices
3. Click Confirm — the order is delayed and all subsequent orders are automatically adjusted based on the selected monthly frequency

> When a delay is applied, any previously skipped upcoming orders are not considered. Future order schedule is recalculated based on the new delayed billing date.

## Delaying from the admin portal

1. Navigate to **Loop > Subscriptions** and search for the customer with "Subscription ID"
2. Click the Reschedule button next to the upcoming order details
3. Select the new date from the calendar and choose required options:
   - "Reschedule subsequent subscription orders"
   - "Notify customer?"
4. Click Confirm — the order is delayed and all subsequent orders are rescheduled

## FAQs

**Will delaying a subscription order via the customer portal or admin portal delay the subsequent orders?**
Yes — subsequent orders are also shifted by the same amount, maintaining a consistent interval between orders.

To prevent customers from delaying orders: **Loop Admin portal > Customer portal > Preferences > Order actions > Delay order** (uncheck the checkbox).

## API endpoints and webhooks

**API endpoints:**
- [Reschedule subscription admin API](https://loop-admin.readme.io/reference/reschedule)
- [Reschedule order storefront API](https://loop-storefront.readme.io/reference/reschedule-order)
- [Delay order storefront API](https://loop-storefront.readme.io/reference/delay-order)

**Webhooks:**
- `subscription/rescheduled`
- `subscription/delayed`

## External Links Found

- https://help.loopwork.co/en/articles/12714028-skip-upcoming-order
- https://help.loopwork.co/en/articles/12714032-place-upcoming-order
- https://help.loopwork.co/en/articles/12714037-reschedule-an-upcoming-order
- https://help.loopwork.co/en/articles/14008787-gift-order
