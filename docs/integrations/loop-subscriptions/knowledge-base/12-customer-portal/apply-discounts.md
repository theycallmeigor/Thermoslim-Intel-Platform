---
title: "Apply discounts"
source_url: "https://help.loopwork.co/en/articles/12709682-apply-discounts"
collection: "Customer portal"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, customer-portal, discounts]
---

# Apply discounts

Learn how to apply and manage subscription discounts in Loop, from customer portal usage to admin controls.

Offering a discount can attract new subscribers, especially if the product is new or unfamiliar to the customer. When a discount code is applied from the customer portal, it applies to all instances or just the subsequent delivery, depending on how the discount code has been configured in Shopify admin.

## Apply discounts from the customer portal

**Prerequisites:**
1. The customer must have an active subscription
2. The "Apply Discounts" setting must be enabled at: **Customer Portal > Preferences > Subscription actions**

> **Note:** When stamped.io or smile.io integrations are enabled on Loop, customers can apply discounts created in those loyalty apps to a subscription via Loop's customer portal.

**Steps:**
1. Open the required subscription on Loop's customer portal
2. Scroll down to the "Discount" section
3. Enter the discount code and click Apply

> **Important:** Discount codes applied on a contract use the properties configured in Shopify for that particular discount at that exact moment. Changes to the discount later will not be considered, even though the code remains the same. Shopify also doesn't check for combinability settings when customers apply a discount on an existing subscription via Loop.

## Apply discounts from the Loop admin portal

For cases where a customer contacts support and asks to apply a discount on their behalf:

**Prerequisite:** The customer must have an active subscription on Loop.

**Steps:**
1. Search for the subscription with "Subscription ID" in **Loop admin > Subscriptions**
2. Open the subscription and click on the "Add Discount" icon at the top
3. Enter the discount code and click "Add"

## Allow customers to apply multiple discounts

Enable multiple discounts from: **Customer Portal > Preferences > Subscription actions > Apply Discounts > Allow multiple discounts**

## Limiting the number of discounts

Set a maximum number of discounts a customer can apply to a subscription at any time. Once the limit is reached, customers see an error asking them to remove an existing code before applying a new one.

> This limit applies only to customer portal input and storefront APIs. Discounts applied via the admin portal, flow, bulk action, quick action, cancellation offers, and admin portal APIs will continue to apply without considering this limit.

Configure the error message at: **Customer portal > Texts > Discount section > Maximum number of discounts reached**

## FAQs

**If I expire a discount code in Shopify, will it stop working for existing contracts?**
No — it will continue to work on existing subscription contracts. To stop it, you'll need to remove it from existing contracts manually or via bulk actions.

**Will the recurring subtotal shown at Shopify checkout include Loop discounts?**
- Shopify discount codes (manual/automatic): NOT included in recurring subscription calculations
- Loop discounts that are part of the Selling Plan (recurring discounts): ARE included
- Loop Flow or one-time conditional discounts: NOT included (apply to specific orders only)

**Does Shopify's automatic discount code work on the Loop customer portal?**
No — automatic discount codes only work on the cart or checkout storefront. To use a discount on the Customer Portal, it needs to be entered manually.

## External Links Found

- https://help.loopwork.co/en/articles/12716873-subscription-discounts
- https://help.loopwork.co/en/articles/12734518-change-payment-method
- https://help.loopwork.co/en/articles/12741345-loyaltylion
