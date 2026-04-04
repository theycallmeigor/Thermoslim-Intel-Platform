---
title: "Auto-update product price"
source_url: "https://help.loopwork.co/en/articles/12732440-auto-update-product-price"
collection: "14-settings"
scraped_at: "2026-03-30T17:39:03Z"
tags: ["settings"]
---

[[3. [Order and shipping settings](https://help.loopwork.co/en/collections/16428990-order-and-shipping-settings)
[Order and shipping settings](https://help.loopwork.co/en/collections/16428990-order-and-shipping-settings)

# Auto-update product price
Learn how to enable automatic price updates in Loop to keep subscription product pricing accurate and consistent with your Shopify catalog.
In this article, we will guide you through configuring your settings to ensure your product prices update automatically whenever changes are made to your catalog. This eliminates the need for manual updates to each product and ensures your customers consistently see accurate pricing information. Let's begin!

# Where to find this setting?
You can find these settings in Loop > Settings > Auto-updates > Auto-update product prices
This feature is available in the Growth plan and above only.
​

# What do the options mean?
This section walks you through each trigger and explains the behaviour of each setting and toggle.
How does the discount behaviour setting affect my subscribers?
Based on the setting that you choose the discount behaviour varies and here is an example illustrating both in simple terms
1. Apply existing subscription discounts as currently configured on the product
2. Recalculate discounts as per the selling plan associated with the product. If no applicable selling plan is found, then the existing subscription discounts will be applied.
Apply existing subscription discounts as currently configured on the product
Recalculate discounts as per the selling plan associated with the product. If no applicable selling plan is found, then the existing subscription discounts will be applied.
In the first option, any price updates triggered by changes in product price will be recalculated for the customer based on the discount % that was offered on the selling plan at the time of purchase. This means that customers who have already subscribed to your product will continue to receive the same discount percentage/amount even if the discount configured in the selling plan is different.
Let’s take an example where a merchant sells a monthly subscription box of beauty products for $30, and they offer a 10% discount to subscribers. If you enable auto-updating of product prices, and later decide to increase the price of your subscription box to $35 and change the discount to 15%, subscribers will continue to receive the 10% discount, which brings their price down to $31.50 (ie - 10% discount) regardless of the current discount % that is being offered to subscribers.
In the second option, any price updates that occur due to changes in your product catalog will also apply the latest discount as configured on your selling plan. This means that customers who have already subscribed to your product will receive the same updated discount % as set in the selling plan when the price of the product changes.
Let’s take the same example as above, but in this case lets assume the discount offered on selling plan has changed to 15%. The subscriber will recieve the updated 15% discount on their product when it’s price is updated in Shopify.
This setting ensures customers’ prices are always tracked with the current subscription discount and price as set in Shopify.​
In the case the product is not available on subscription / has been removed from the selling plan entirely. The discount would remain the same as the last known discount for the product.

# Auto update product price
Clicking the “Auto Update Product Prices” button will update the product/variant prices for all the existing subscriptions as per the current prices set in your shop catalog.
Checking this option will give you two frequency settings to choose from :
1. Daily - To update the product prices automatically at 1-3AM of your store time.
2. Automatically whenever the product price is updated.
Daily - To update the product prices automatically at 1-3AM of your store time.
Automatically whenever the product price is updated.

# Discount behaviour setting
Discount behaviour can be selected depending on 2 cases as per the choice.
1. Apply the discount as set for the product.
2. Recalculate the discount according to the selling plan associated with the product.
Apply the discount as set for the product.
Recalculate the discount according to the selling plan associated with the product.
(If no selling plan is mapped to the product, the existing subscription discount is applied)

# Subscription setting
This option allows you to limit the feature to only the subscriptions where upcoming order reminder has not been sent or all the subscriptions.

Clicking the button will update the product/variant prices for all the existing subscriptions as per the current prices set in your shop catalogue. This action is not supported for existing prepaid subscriptions.

# FAQS
#### How do we ensure that the price changes on the existing products do not impact the existing customer subscriptions?
To avoid increasing the prices for the existing customer subscriptions and still update the prices on existing products, kindly ensure that the 'Auto-updates' setting is turned off before making the change.
[Explore more FAQs](https://help.loopwork.co/en/collections/16646422-frequently-asked-questions-faqs)

# Need help?
No worries - we're here for you!
If you have any questions or need assistance, feel free to email us at [Regards,
Loop Subscriptions Team 🙂
[Edit subscription products](https://help.loopwork.co/en/articles/12713304-edit-subscription-products)
[Mapping products to selling plan](https://help.loopwork.co/en/articles/12716791-mapping-products-to-selling-plan)
[Subscription discounts](https://help.loopwork.co/en/articles/12716873-subscription-discounts)
[Managing Shopify checkout translations](https://help.loopwork.co/en/articles/12731381-managing-shopify-checkout-translations)
[Auto-update shipping price in Loop](https://help.loopwork.co/en/articles/12732064-auto-update-shipping-price-in-loop)
