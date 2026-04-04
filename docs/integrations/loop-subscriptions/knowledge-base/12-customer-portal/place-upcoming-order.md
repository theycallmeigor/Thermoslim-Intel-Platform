---
title: "Place upcoming order"
source_url: "https://help.loopwork.co/en/articles/12714032-place-upcoming-order"
collection: "Customer portal"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, customer-portal]
---

# Place upcoming order

Learn how to use the Order now feature in Loop to let customers place immediate subscription orders for faster, more flexible deliveries.

The "Order now" or "Place order" action allows both subscribers and admins to place an upcoming subscription order immediately — ideal for situations where the customer runs out of a product earlier than expected or needs a faster delivery. Once triggered, the order is billed instantly, and the subscription cycle is adjusted accordingly based on the configured delivery frequency.

## Scheduling behavior

### Case 1: Anchor base setting disabled

**Option A (Prepone subsequent orders enabled):**
- Current order placed immediately (e.g., July 14)
- Future orders rescheduled maintaining the same delivery interval (1 week)
- Next order: July 21, July 28, etc.

**Option B (Prepone subsequent orders disabled):**
- Current order placed immediately (e.g., July 14)
- The next scheduled order (originally July 21) is shifted to July 28, followed by August 4, August 11, etc.
- Maintains the defined frequency but the cycle shifts

### Case 2: Anchor base setting enabled

**Option A (Prepone enabled):**
- Current order placed immediately
- Future orders rescheduled maintaining the same delivery interval + anchor day logic

**Option B (Prepone disabled):**
- Current order placed immediately
- Next scheduled order is shifted by one interval, maintaining the delivery every anchor day

## Prerequisites

- The subscriber must have an active subscription on Loop
- The "Place Order" option must be enabled at: **Customer Portal > Preferences > Order actions > Place order**

## Placing from the customer portal

1. Customer logs in and clicks the **Order now** button
2. The order will be placed, and the upcoming schedule will be updated based on the frequency defined in the selling plan

**Warning message:** Subscribers will see a warning message if they click "Order Now" within 24 hours of a previous order. This is only a warning — it does not prevent the subscriber from placing an order.
- Configure warning text at: **Loop admin > Customer portal > Themes > Customize > Texts > Order now text > Order now popup warning text**
- Style the warning box at: **Loop admin > Customer portal > Themes > Customize > Styles > Popups and sidebar**

## Placing from the admin portal

1. Navigate to Loop admin and search for the customer's "Subscription ID" in the Subscriptions tab
2. Open the subscription, scroll down to the order schedule tab, and click the **Place order** button

## External Links Found

- https://help.loopwork.co/en/articles/12709685-change-billing-delivery-schedule
- https://help.loopwork.co/en/articles/12714028-skip-upcoming-order
- https://help.loopwork.co/en/articles/12714037-reschedule-an-upcoming-order
- https://help.loopwork.co/en/articles/12714039-delay-order
- https://help.loopwork.co/en/articles/13645961-order-schedule-preferences
