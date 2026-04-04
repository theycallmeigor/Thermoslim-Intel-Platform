---
title: "Auto-update shipping price in Loop"
source_url: "https://help.loopwork.co/en/articles/12732064-auto-update-shipping-price-in-loop"
collection: "14-settings"
scraped_at: "2026-03-30T17:39:03Z"
tags: ["settings"]
---

[[3. [Order and shipping settings](https://help.loopwork.co/en/collections/16428990-order-and-shipping-settings)
[Order and shipping settings](https://help.loopwork.co/en/collections/16428990-order-and-shipping-settings)

# Auto-update shipping price in Loop
Learn how shipping rates work for subscription orders in Loop and how to configure them through your Shopify shipping settings.
Shipping rates as the name suggests cover the costs associated with packaging and delivering the physical goods to the address provided by the customer while checking out. This is charged in addition to the product costs and can be set up by going to your Shopify store's Settings > Shipping and delivery
To set up shipping rates in Shopify, refer to [this article](https://help.shopify.com/en/manual/shipping/setting-up-and-managing-your-shipping).

# How do shipping rates work for subscription orders?
Shopify's "Shipping and delivery" settings don’t allow creating subscription-specific delivery profiles. So, when a customer adds one-time purchases and subscriptions in a single order, they are treated in the same way, where delivery costs are calculated as per the delivery profiles based on cart value, weight, shipping region, etc. If you have already configured shipping rates in Shopify that align with your subscription needs, no additional changes are required in Loop Subscriptions. To ensure everything functions as expected, place a test order and review the shipping charges applied to both the initial and recurring orders.
Compared to a one-time purchase order, where Shopify or the delivery carrier auto-calculates the shipping rate at checkout, the shipping rate for a subscription is set only at the time of creation and is not recalculated at each time the customer is billed.
With Loop Subscriptions, you get a range of shipping settings you can configure to meet your business needs, ensuring the correct shipping rate is charged for every subscription order.
To [set up your shipping profiles](https://intercom.help/loop-subscriptions/en/articles/12732320-subscription-specific-shipping-profiles) in Loop, go to Settings > Subscription shipping rates. To configure shipping rates for subscriptions:
1. Navigate to Loop Admin > Settings > Subscription Shipping Rates.
2. Set region-specific rates based on your shipping policy:For regions with free shipping, set the shipping rate to $0.For regions with a shipping fee, specify the appropriate amount (e.g., $5 AUD for overseas subscribers).
3. For regions with free shipping, set the shipping rate to $0.
5. Save your changes. These rates will automatically apply to every recurring order for subscribers in the specified regions until you update them.
Navigate to Loop Admin > Settings > Subscription Shipping Rates.
Set region-specific rates based on your shipping policy:
- For regions with free shipping, set the shipping rate to $0.
- For regions with a shipping fee, specify the appropriate amount (e.g., $5 AUD for overseas subscribers).
For regions with free shipping, set the shipping rate to $0.
For regions with a shipping fee, specify the appropriate amount (e.g., $5 AUD for overseas subscribers).
Save your changes. These rates will automatically apply to every recurring order for subscribers in the specified regions until you update them.
To confirm that your shipping rates are correctly applied:
1. Place a test subscription order.
2. Check the shipping charges on the initial order.
3. Verify that the same charges are applied to recurring orders.
Place a test subscription order.
Check the shipping charges on the initial order.
Verify that the same charges are applied to recurring orders.
If discrepancies are found, revisit the Subscription Shipping Rates settings in Loop Admin and make the necessary adjustments.

# How to access auto-update price settings?
These shipping configurations can be found by going to Loop > Settings > Auto-updates > Auto-update shipping prices. This will help you to configure when to automatically update the shipping prices in your subscriptions as per the shipping rates set up for your shop.
​

- Update shipping cost for subscriptions after they get created:This is useful when the customer places an order that includes both one-time purchases and subscription products. Customers may get free shipping for the original order, but might be charged for subsequent billings if the subscription product value is not enough to get free shipping.
Update shipping cost for subscriptions after they get created:This is useful when the customer places an order that includes both one-time purchases and subscription products. Customers may get free shipping for the original order, but might be charged for subsequent billings if the subscription product value is not enough to get free shipping.
- Update shipping cost when product or shipping changes are made in the subscription:When this setting is enabled, the shipping cost will be automatically updated whenever any product or shipping changes are made in the subscription, either via the Loop admin or the customer portal.
Update shipping cost when product or shipping changes are made in the subscription:When this setting is enabled, the shipping cost will be automatically updated whenever any product or shipping changes are made in the subscription, either via the Loop admin or the customer portal.
- Update shipping cost when products are changed in a subscription:The shipping cost will be automatically updated in case of any product changes done in the subscription either via the admin or the customer portal.
Update shipping cost when products are changed in a subscription:The shipping cost will be automatically updated in case of any product changes done in the subscription either via the admin or the customer portal.
- https://downloads.intercomcdn.com/i/o/kmcpsev1/1810618232/d97461383bca87891ce12a72e974/original?expires=1774893600&signature=2d1e479f58f1d206bec94fbabbbf2a27e73d4172d4e0e39f8906f5c4b798745e&req=dSgmFs9%2FlYNcW%2FMW1HO4zSeefzvcd0dF0eXQKPDyqWLjnosrKZy0LirnPSsO%0AvMQB%0AManually trigger a recalculation of shipping prices for all subscriptions:In case you have not enabled the above settings or you enabled them recently, then you can use this functionality to manually trigger the recalculation of shipping prices for all subscriptions active on your shop.​
Manually trigger a recalculation of shipping prices for all subscriptions:In case you have not enabled the above settings or you enabled them recently, then you can use this functionality to manually trigger the recalculation of shipping prices for all subscriptions active on your shop.​
As the shipping rate is auto-calculated for any subscription changes, the shipping price edit button is removed from the Subscription detail page and a badge "Auto-update On" is shown to highlight that the auto-update setting is on for the shipping cost.
​

No worries - we're here for you!
If you have any questions or need assistance, feel free to email us at [Regards,
Loop Subscriptions Team 🙂
[Subscription discounts](https://help.loopwork.co/en/articles/12716873-subscription-discounts)
[Subscription shipping profiles](https://help.loopwork.co/en/articles/12732320-subscription-shipping-profiles)
[Auto-update product price](https://help.loopwork.co/en/articles/12732440-auto-update-product-price)
[Onward shipping protection](https://help.loopwork.co/en/articles/12745817-onward-shipping-protection)
[OpenBorder](https://help.loopwork.co/en/articles/12745933-openborder)
