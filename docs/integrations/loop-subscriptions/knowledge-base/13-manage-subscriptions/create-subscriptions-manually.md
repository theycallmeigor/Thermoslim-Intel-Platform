---
title: "Create subscriptions manually"
source_url: "https://help.loopwork.co/en/articles/12729430-create-subscriptions-manually"
collection: "Manage subscriptions"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, manage-subscriptions]
---

# Create subscriptions manually

Learn how to manually create subscriptions in Loop for customers needing new products, frequencies, or addresses outside existing setups.

There are certain situations where creating a subscription manually becomes necessary. Using this feature in Loop, brands can create a new subscription by directly entering the customer's details along with the desired product and plan information.

This is particularly useful when a subscriber reaches out to the merchant's support team requesting a subscription for a new product. If the new product requires a different shipping frequency or a new address, a new subscription can be created manually.

## Prerequisites

- The subscriber must have previously purchased a subscription from the online store, and their data should be available in Loop
- The subscriber must have a valid payment method saved for subscriptions

## Creating a subscription manually

1. Navigate to Loop > Subscriptions > Click on **Create subscription manually** button
2. Under the customer details section, click on **Select customer** to choose the user. Select the products you wish to include. You can also add a new address and select an alternative payment method
3. Fill in the subscription details, including the billing date, frequency, minimum number of orders, and other relevant fields. You can also set a custom frequency
4. Add any applicable discount and shipping details, such as the delivery price and title
5. Check the box confirming that the customer agrees to the subscription agreement, then click **Create Subscription**
6. The new subscription will be created in Loop with all provided details populated

## API endpoints and webhooks

**API endpoints:**
- [Create subscription admin API](https://loop-admin.readme.io/reference/create-subscription)

**Webhooks:**
- [Webhook to subscribe](https://loop-admin.readme.io/reference/subscribe-webhook): `subscription/created`

## External Links Found

- https://loop-admin.readme.io/reference/create-subscription
- https://loop-admin.readme.io/reference/subscribe-webhook
- https://help.loopwork.co/en/collections/16646422-frequently-asked-questions-faqs

## Images/Diagrams

- Screenshot: Loop admin Subscriptions page with "Create subscription manually" button
- Screenshot: Customer details section with product selection UI
- Screenshot: Subscription details form (billing date, frequency, min orders)
- Screenshot: Discount and shipping details form
- Screenshot: Subscription agreement checkbox and Create Subscription button
- Screenshot: Newly created subscription in Loop admin
