---
title: "Cancel subscription"
source_url: "https://help.loopwork.co/en/articles/12709699-cancel-subscription"
collection: "Customer portal"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, customer-portal]
---

# Cancel subscription

Learn how to manage and streamline subscription cancellations in Loop, empowering customers with easy, transparent, and self-service cancellation options.

Cancellations can be managed from both the customer portal and the admin portal — no emails or support tickets required.

## Common reasons for cancellation

- They no longer need the product
- They're going on a break or vacation
- They want to switch to a different brand or product
- They feel the pricing doesn't match the value
- They received too much product or couldn't keep up with deliveries
- They had a poor product or delivery experience

Loop allows you to collect cancellation reasons from customers directly in the portal, so you can understand their intent and take meaningful action. Set up custom cancellation flows offering alternate options before a customer cancels — including tailored reason flows, special cancellation offers, or a benefits page.

## Bulk cancellation using Loop's Bulk Tools

1. Log in to your Loop Admin Panel
2. Navigate to **Bulk Tools and Apps > Bulk Action > Create Bulk Action**
3. Set the scope to **All Subscriptions**
4. Choose the action: **set subscription status to Cancel**
5. Optionally provide a cancellation reason and decide whether to notify customers
6. Save and execute the bulk action

> Prerequisites: Bulk Actions require a specific module availability within your Loop plan. Confirm plan details if this option isn't visible.

## Enabling the cancellation option

1. Navigate to **Loop > Retain > Cancellation flows > Configuration > Cancellation button behavior** and enable the first option
2. Click Save to apply the changes

## Cancelling from the customer portal

1. Customer navigates to the store using login details or via email link
2. Find the active subscription to cancel and click the "view details" icon
3. Scroll to the bottom and click the **Cancel subscription** button
4. After clicking, you'll be guided through the configured cancellation flow (if set up), which may include a benefits page, reason selection, or special cancellation offers

## Cancelling from the Loop admin portal

1. Navigate to **Loop > Subscriptions**, then open the subscription you want to cancel
2. Click **Cancel** at the top right of the screen
3. A pop-up appears — add a cancellation remark, choose to notify the customer, then click Confirm

> If cancellation reasons have been configured, they will be displayed in the pop-up. Admin can choose the appropriate option and the corresponding flow will be triggered.

## What to expect after cancellation?

- All upcoming subscription orders will be cancelled and the customer will no longer receive subscription-related benefits
- If any order was already processed before the cancellation, it will still be delivered on the scheduled date
- The subscription can be reactivated anytime from both the customer and admin portals

## API endpoints and webhooks

**API endpoints:**
- [Cancel subscription storefront API](https://loop-storefront.readme.io/reference/cancel)
- [Cancel subscription admin API](https://loop-admin.readme.io/reference/cancel-subscription)

**Webhooks:**
- `subscription/cancelled`

## External Links Found

- https://help.loopwork.co/en/articles/12709700-reactivate-subscription
- https://help.loopwork.co/en/articles/12710173-cancellation-flows-overview
- https://help.loopwork.co/en/articles/12710494-cancellation-reasons
- https://help.loopwork.co/en/articles/12710658-cancellation-offers
