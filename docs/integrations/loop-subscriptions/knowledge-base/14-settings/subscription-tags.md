---
title: "Subscription tags"
source_url: "https://help.loopwork.co/en/articles/12732642-subscription-tags"
collection: "14-settings"
scraped_at: "2026-03-30T17:39:03Z"
tags: ["settings"]
---

[[3. [Order and shipping settings](https://help.loopwork.co/en/collections/16428990-order-and-shipping-settings)
[Order and shipping settings](https://help.loopwork.co/en/collections/16428990-order-and-shipping-settings)

# Subscription tags
Learn how to use Subscription and Order Tags in Loop to segment customers, automate workflows, and enable targeted marketing across your store.
Subscription and Order Tags are a powerful way to differentiate subscribers from one-time purchasers by automatically tagging customers and orders based on their subscription status. These tags can be used across Shopify and third-party apps to build meaningful customer segments and power targeted marketing campaigns.
Loop lets you apply tags like 'active', 'paused', or 'dunning' to customers, and add detailed order-level tags such as subscription ID, bundle name, or billing frequency. This makes it easier to track, filter, and personalise customer experiences at every touchpoint without any manual effort.

# Subscription tags overview
Subscription tags allow you to categorise customers based on their subscription lifecycle stage. You can enable tags by navigating to Loop > Settings > Subscription tags.
In Loop, you can configure three types of tags:
- Customer tags: Tags added to your customers based on their subscription status.
- Order tags: Tags added to recurring subscription orders placed via Loop.
- Dynamic order tags: Tags adding subscription details like bundle name or billing cycle to orders for better tracking.
Customer tags: Tags added to your customers based on their subscription status.
Order tags: Tags added to recurring subscription orders placed via Loop.
Dynamic order tags: Tags adding subscription details like bundle name or billing cycle to orders for better tracking.
​

# Loop tags explained
- Customer TagsSubscription tags allow you to categorise customers based on their subscription lifecycle stage. Tags are automatically added or removed as subscription statuses change, helping you keep customer data accurate and up to date.
Customer TagsSubscription tags allow you to categorise customers based on their subscription lifecycle stage. Tags are automatically added or removed as subscription statuses change, helping you keep customer data accurate and up to date.
Tag name
Description
Active subscriber tag
Customers with at least one active subscription.
Active subscriber tag with product info
Adds tags with product details for each subscribed product.
Dunning subscriber tag
Marks customers with subscriptions currently in dunning status.
Paused subscriber tag
Indicates customers with paused subscriptions.
Inactive subscriber tag
Tags customers with no active subscriptions (including paused or cancelled).
In Loop, you can manually update your existing customers by clicking the Update customer tags button. This operation applies the configured subscription tags retroactively to all current customers without removing old tags. Really useful in post-migration use cases.
- Order tags overviewOrder tags help label subscription orders for better order management. Use these tags to filter and organise subscription-related orders in Shopify and third-party apps easily.
Order tags overviewOrder tags help label subscription orders for better order management. Use these tags to filter and organise subscription-related orders in Shopify and third-party apps easily.
Tag name
Description
Subscription order tag
Adds a tag to all subscription orders.
Subscription first order tag
Tags the first order of each subscription.
Recurring order tag
Tags recurring orders after the first.
- Dynamic order tagsDynamic tags add detailed metadata to orders, helping with deeper insights and order handling. Loop supports the following dynamic tags:
Dynamic order tagsDynamic tags add detailed metadata to orders, helping with deeper insights and order handling. Loop supports the following dynamic tags:
Tag name
Description
Subscription ID tag
Add subscription ID in order tags.
Bundle order tag
Add bundle tag if order contains Loop bundle items.
Bundle name tag
Add bundle name tag if order contains Loop bundle items.
Billing cycle tag
Add billing cycle number of the subscription in order tags.
Billing frequency tag
Add billing frequency of the subscription in order tags.
Delivery frequency tag
Add delivery frequency of the subscription in order tags.
Custom tags
Add custom tags based on order attributes present.
Variables available are {{subscription_id}}, {{bundle_name}}, {{billing_count}}, {{billing_interval}}, {{delivery_interval}}

# Tag character limits
Please ensure tags do not exceed Shopify’s 40-character limit. If a tag value is too long, it will be truncated automatically to 40 characters.
​

# FAQs
#### What are order tags?
Tags are automatically assigned to orders to later identify them.​Loop Settings > Subscription Tags > Order Tag. Please enable this option so the system can automatically add the tag when a subscription order is placed.

#### How much time does it take for tags to sync from Loop to Shopify?
Subscription tags can be configured in Loop > Settings > Subscription tags.​Order Tags get updated immediately in Shopify.Dynamic tags and Customer tags are not fed to Shopify immediately; however, they get updated within the same day since an auto bulk action gets created to update them.

#### Can we apply order tags to subscriptions to differentiate them from one-time orders?
Yes, it’s possible to apply order tags to subscription orders to differentiate them from one-time purchases. Here’s how you can proceed further.​1. Add tags to subscription orders: You can apply tags to all subscription orders, just the first order, recurring orders, or use dynamic tags like subscription ID and delivery frequency. This makes it easy to filter and identify different types of orders.​2. How to set up order tags: Go to Loop > Settings > Subscription tags in your dashboard. From there, you can customise which tags are applied and when.

#### If a customer tag is assigned under the “Active subscriber tag with product info” field, will that customer tag also be deleted when the subscription for that product is cancelled?
Customer tags are assigned based on subscription status. If a customer does not have any active subscriptions, the corresponding active subscriber tag, including product information, will be removed from their account.
Please note that these are subscriber tags, meaning a customer can have multiple subscriptions. As long as at least one subscription is active, the tag associated with that active subscription will remain, even if other subscriptions are inactive.

#### How do I tag historical orders?
Unfortunately, you can not tag past subscription orders as of now.
[Explore more FAQs](https://help.loopwork.co/en/collections/16646422-frequently-asked-questions-faqs)

# Need help?
No worries - we're here for you!
If you have any questions or need assistance, feel free to email us at [Regards,
Loop Subscriptions Team 🙂
[Subscription overview](https://help.loopwork.co/en/articles/12657742-subscription-overview)
[Getting started with Loop](https://help.loopwork.co/en/articles/12703816-getting-started-with-loop)
[Checkout upgrades](https://help.loopwork.co/en/articles/12731490-checkout-upgrades)
[Klaviyo](https://help.loopwork.co/en/articles/12733266-klaviyo)
[Rebuy](https://help.loopwork.co/en/articles/12745271-rebuy)
