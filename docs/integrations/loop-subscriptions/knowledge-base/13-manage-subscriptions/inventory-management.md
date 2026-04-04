---
title: "Inventory management"
source_url: "https://help.loopwork.co/en/articles/12729824-inventory-management"
collection: "Manage subscriptions"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, manage-subscriptions]
---

# Inventory management

Learn how to manage subscription inventory in Loop to prevent stock issues, reduce churn, and ensure a reliable subscriber experience.

## What is inventory management?

Inventory management helps you identify and handle out-of-stock situations by tracking product availability directly from Shopify. Loop uses this real-time inventory data to power rules and conditions that automatically determine how out-of-stock products should be handled in active subscriptions.

## How inventory impacts subscriber retention

For subscription-first brands, out-of-stock events are much more damaging than for regular storefronts. Subscribers have committed to receiving products on a recurring basis. If a subscribed product becomes unavailable without proper handling, it can damage the relationship, signal unreliability, and lead to churn.

## Where to find inventory settings

Navigate to **Loop admin > Tools & apps > Inventory**

**Prerequisites:**
- Enable "Track quantity" in Shopify product-level configuration
- Disable "Continue selling when out of stock"
- Check "This is a physical product"

Reference: [Shopify inventory](https://help.shopify.com/en/manual/products/inventory)

## Inventory settings explained

### Tracking location settings

| Option | Description |
|--------|-------------|
| **All locations** | Inventory across all locations will be tracked for order processing |
| **Specific locations** | Aggregate inventory from selected locations will be considered |
| **Smart inventory** | Inventory considered only from locations that can service the customer's address. Digital products use "All locations" |

### Settings when at least one item is available (partial order)

| Option | Description |
|--------|-------------|
| **Allow complete subscription order** | Entire order billed and placed even if some products are out of stock |
| **Allow partial billing** | Only available items shipped; out-of-stock items skipped. Not supported for prepaid subscriptions |
| **Delay the complete subscription order** | Entire order shifted to defined date, billed only when all items in stock |
| **Skip the subscription order** | Entire order skipped; next order billed per subscription schedule |

**Partial billing options:**
- **Eligibility**: Configured by "Based on order amount" or "Based on order weight" — sets a minimum threshold
- **Partial billing for bundle products**: If enabled, bundles are also eligible; customers may receive fewer products with the same discount
- **Recalculate shipping charge**: Automatically recalculates shipping when an order is partially billed (useful if the reduced order value drops below free shipping threshold)

### Settings when no items are available

| Option | Description |
|--------|-------------|
| **Allow complete subscription order** | Order placed even if all items are out of stock (inventory may go negative) |
| **Delay the complete subscription order** | Order shifted to a defined date, billed only when all items are in stock |
| **Skip the subscription order** | Order skipped; next order billed per subscription schedule |

## FAQs

**Can I manage inventory differently for subscription and one-time orders?**
Not natively. A workaround is to create two separate product listings — one for subscriptions (disable inventory tracking) and one for one-time purchases (enable inventory tracking). Each will have its own product page.

**Where are inventory settings now?**
Moved to Tools & Apps > Inventory. Options: Process full order / Ship only available items / Delay order / Skip order entirely.

**Why are out-of-stock items still being billed?**
For bundles, go to bundle preference > Out of Stock Products > Show as disabled. For general out-of-stock, use Loop > Tools & Apps > Inventory Management. Enable partial billing notifications under Settings > Notifications.

**Why didn't shipping price update correctly when an item went out of stock?**
Enable the **Recalculate Shipping Charge** option under Tools & Apps > Inventory to automatically recalculate shipping before processing any partial order.

## External Links Found

- https://help.shopify.com/en/manual/products/inventory
- https://help.loopwork.co/en/collections/16646422-frequently-asked-questions-faqs

## Images/Diagrams

- Screenshot: Shopify product settings showing "Track quantity" and "Continue selling when out of stock" checkboxes
- Screenshot: Loop admin Tools & Apps > Inventory settings page
