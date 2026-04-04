---
title: "Manage subscription FAQs"
source_url: "https://help.loopwork.co/en/articles/12858164-manage-subscription-faqs"
collection: "15-faq"
scraped_at: "2026-03-30T17:43:24.273Z"
tags: ["15-faq"]
---



# Subscription management

#### It looks like Loop is in the process of updating the subscription prices after we made some changes in prices. How long does this usually take?

The 'update in progress' status for subscription prices depends on the number of products and active subscriptions being updated, so the time may vary. Unfortunately, there's no specific ETA we can provide in this case.

#### I want to set a subscription where people get 10% discount on 1 product, 15% discount on 2 products, and 20% discount on 3 products, etc. How do I achieve this?​

Recurring discounts (e.g., 10% on 1 product, 15% on 2 products, 20% on 3 products, etc.) on subscriptions can be achieved using two methods:

*   Bundles: Use Loop’s bundle feature, which allows you to set quantity-based discounts and offers more flexibility if you're selling multiple products or letting customers create their own packs. Refer to the bundle article on help.loopwork.co.
    
*   Product variant + selling plan approach: Create different product variants such as \[Pack of 1, Pack of 2, Pack of 3\], and link each variant with its own selling plan. Set individual discounts and frequencies based on quantity.
    

#### Why am I unable to create a subscription from the customer portal below a certain order value?

If you are unable to create a subscription below a certain order value, it is because a minimum subscription order value has been configured and is now enforced in the create subscription flow.

To configure the minimum order value:

1.  Go to Customer Portal
    
2.  Navigate to Preferences
    
3.  Open Edit/Remove Products
    
4.  Set the Minimum Order Value
    
5.  Save the changes
    

If a subscriber attempts to create a subscription below this value, they will see the same minimum order value error message that appears when editing or removing products.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118693555/6edaa19a68c2a07ed6334bf94eb0/image.png?expires=1774894500&signature=db301c131448eb524d0ac49552a0eed65e0fcfc513ef16381cf1b54d4e8adfcc&req=diEmHs93noRaXPMW1HO4zWCIjiEey8NL9S9IC8gegG8mu0M7fZW58IWKQ8GJ%0ANQZi%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118693555/6edaa19a68c2a07ed6334bf94eb0/image.png?expires=1774894500&signature=db301c131448eb524d0ac49552a0eed65e0fcfc513ef16381cf1b54d4e8adfcc&req=diEmHs93noRaXPMW1HO4zWCIjiEey8NL9S9IC8gegG8mu0M7fZW58IWKQ8GJ%0ANQZi%0A)

#### We have two product variants: Purchase cylinder for 99.90 and exchange cylinder for 59.90. When a customer buys a cylinder for the first time, they have to choose the cylinder to purchase. If they have already purchased the cylinder once and want to change to a subscription, then they can choose to exchange the cylinder. How can I achieve this use case?

You can set this up with a selling plan plus an optional Flow in Loop:

1.  Configure the selling plan, so only the first order is 99.90
    
    1.  In your selling plan, use “Change discount after a specific number of orders.”
        
    2.  This lets you apply one pricing/discount for the first order and another for all future orders.
        
    3.  Set the first order to charge 99.90 (your purchase-cylinder price).
        
    4.  You do this by configuring the initial discount so the customer effectively pays 99.90 on order #1.
        
    5.  Set all subsequent orders to charge 59.90 (exchange-cylinder price).
        
    6.  Configure the discount change after the first order so orders #2, #3, etc. are at 59.90.
        
    7.  This way, a first-time subscription automatically bills 99.90 once, then 59.90 going forward.
        
    8.  More details: Acquire FAQs on changing the discount after a specific number of orders
        
    
2.  (Optional but recommended) Auto-swap from purchase to exchange variant after the first order
    
    1.  Enable product swapping in your Customer Portal settings.
        
    2.  This allows Loop Flows to programmatically switch the product/variant on an active subscription.
        
    3.  Create a Flow with trigger: “A new subscription is created.”
        
    4.  This Flow will run as soon as a new subscription is made on the purchase-cylinder variant.
        
    5.  Add an action to swap the product from the purchase cylinders variant to the exchange cylinders variant after the first order.
        
    6.  The subscription will then continue on the exchange-cylinder variant, while the pricing is already set to 59.90 from step 1.
        
    7.  Keep in mind: the first order cannot be modified by Flows after checkout, so you must handle the 99.90 first payment via the selling plan pricing, not the Flow.
        
    

#### Can I process subscription orders only on Tuesdays without using Zapiet or upgrading to the Pro plan?

To process subscription orders only on Tuesdays without using Zapiet or upgrading to the Pro plan, you can use the anchor day configuration as a workaround.

Follow these steps:

1.  Go to your selling plan in the Loop admin portal.
    
2.  Set the Anchor Day to Tuesday.
    
3.  Ensure the first order is placed on a Tuesday.
    
4.  Save the configuration.
    

Once the first order is created on the anchor day, all recurring orders will follow the same weekday pattern based on the defined billing frequency.

Note:

*   This works only if the initial order is created on the configured anchor day.
    
*   This does not restrict checkout to Tuesdays. It ensures recurring billing aligns with Tuesday after the first order is correctly scheduled.
    

#### If an order has a $0 subscription (has a free item) that repeats on each cycle, are there any platform or transaction fees applied to those $0 recurring orders?

If an order has a $0 subscription (has a free item) that repeats on each cycle, there will be $0 fees applied to those $0 recurring orders.

#### Is there a way to create a cutoff window for subscription cancellations? (For example, a customer can cancel up to 7 days before it renews. Once it hits the 7-day period before the subscription, they can't cancel.)

We don’t support a built‑in time-based cutoff window for cancellations (like “no cancellations within 7 days of renewal”) in Loop Subscriptions right now. Our current controls are based on billing cycles/conditions rather than days before the next charge.

Here are the main workarounds:

1.  Use Minimum Billing Cycles Before Cancellation or cancellation flows
    
2.  You can require subscribers to complete a certain number of billing cycles before they’re allowed to cancel.
    
3.  You can also design cancellation flows to reduce early cancellations (e.g., incentives, pausing, plan changes), but they won’t enforce a strict “7‑day cutoff” by date.
    
4.  Add custom JavaScript in the customer portal to manage the cancel button
    
5.  A developer can add logic to check the time until the next renewal and then hide/disable the cancel button once you’re within 7 days. This is a custom implementation and would need development resources to maintain
    

#### If the customer pauses their subscription after changing the delivery weeks, will it still generate a new order?

If the customer changes their delivery weeks and then pauses the subscription, it will not generate a new order while the subscription is paused.

1.  Pause without auto-resume
    
    1.  All upcoming orders (including any that were just rescheduled or skipped) are cleared.
        
    2.  No new orders are created until the subscription is manually resumed.
        
    
2.  Pause with auto-resume
    
    1.  The next order will only be scheduled after the pause period ends and the subscription automatically resumes.
        
    

#### Would I be able to make a link that lets people add to their subscription directly from a button in the email, so that they don't pay shipping twice by having to create another subscription?

The “Order now” button does not, by itself, allow a customer to trigger an order for only one product in a subscription (if multiple items are included).  
​  
To order just a specific product, the customer needs to:  
Click the “Edit” button next to the product they do not want in the upcoming delivery.  
Select “Remove”, then choose “Remove one-time” — this ensures the product is removed only for the next order, not permanently.  
Now, when the customer clicks “Order now”, only the remaining (desired) product(s) will be processed for the upcoming delivery.

#### How can we merge two customer accounts or subscriptions in Loop?

To merge customer accounts or 2 subscriptions in Loop, both must have the same email address.  
You can update one of the emails in Shopify so that both subscriptions are linked to the same customer profile. Once that’s done, we’ll be able to proceed with merging them.  
​  
Since the goal is to merge them, are you referring to merging the subscriptions into one email ID, or just combining the products under a single subscription?  
If both subscriptions are to be under the same email ID, then the simplest way would be to:  
Manually create a new subscription for the customer using the desired email.  
Expire the subscription that’s currently associated with the incorrect or undesired email.  
​  
This way, the customer will end up with both subscriptions under the correct email ID, and everything stays clean and consistent.  
If this issue continues, please get in touch with the support team.

#### How to offer 20% discount on the first three months of a subscription?

To offer 20% discount on the first three months of a subscription, please follow the steps:  
Loop > Subscriptions > Open #subscription > Add Discount > Discount Type >  
Percentage > Enter the desired percentage > Specify number of orders.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118682572/a05f166643b250279535cff5f8ac/image.png?expires=1774894500&signature=791291f3973f25139540b3f8152b11278792029abfb6703729ebe69251045150&req=diEmHs92n4RYW%2FMW1HO4zf3xiogVR4SdnmkPRKGY%2Bi6HkrkHAd80EiALIGIf%0A20KL%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118682572/a05f166643b250279535cff5f8ac/image.png?expires=1774894500&signature=791291f3973f25139540b3f8152b11278792029abfb6703729ebe69251045150&req=diEmHs92n4RYW%2FMW1HO4zf3xiogVR4SdnmkPRKGY%2Bi6HkrkHAd80EiALIGIf%0A20KL%0A)

#### We're trying to merge 2 subscriptions. But we don't see the options anymore, even in the customer's portal.

In case you are not able to merge 2 subscriptions or the option to merge them is not visible anymore, there could be a chance is happened due to extra spaces in the zip code, which is why the merge subscription button may not be showing.

#### Subscription created but showing as "Contract not found" on Loop?

If your subscription is showing as "Contract not found" on Loop, it’s likely due to a short delay in receiving the webhook response from Shopify - especially if the subscription was created recently (within the last hour).  
​  
Please allow a little time for it to sync. If the subscription still doesn’t appear after some time, feel free to reach out to our support team, and we’ll be happy to assist further.

#### How does Loop handle a scenario where a customer cancels their subscription after a successful renewal? Would the subscription remain active until the end of the current billing cycle?

In the case where a customer cancels their subscription after a successful renewal, the subscription will not remain active until the end of the current billing cycle. Access to functionality can be removed immediately after the cancellation via customer tags. However, keeping access until the next billing cycle (e.g., until September 17th) is not possible within Loop’s standard handling.

#### Does Loop send a webhook when a subscription becomes fully inactive after cancellation, and how can we manage the customer’s access to extra functionality?

Loop does not automatically send a webhook when the subscription becomes fully inactive after cancellation. To manage customer access to extra functionality, we recommend creating a Shopify flow that triggers when the subscription is cancelled and expired. This flow should remove the customer tag that grants access to the extra functionality, effectively revoking access once the subscription is no longer active.

#### How to set up a free subscription for a customer for the next 6-months?

To set up a free subscription for a customer:

1.  Go to the Loop Admin Portal
    
2.  Navigate to Subscriptions
    
3.  Select the relevant subscription
    
4.  Click on Add Discount (100%)
    
5.  In the "No. of Orders" field, specify the number of orders the customer will receive over the next 6 months
    

This way, the customer will receive free orders for the next 6 months.

#### How to pause subscriptions in case the product is out of stock?

To pause subscriptions in case the item/products are out of stock, please go to: Loop > Tools & Apps > Investory and adjust the settings accordingly.  
​  
We also suggest that: first, filter out subscriptions that contain only that product and pause those. This way, customers who have the product bundled with other items won’t have their full subscription interrupted.  
​  
For subscriptions that include multiple products, you could instead temporarily remove this specific product from the subscriptions. Once it’s available again, you can re-add it to those subscriptions.

#### How do I update the colour of the only subscription price?

To update the colour of the subscription prices on the website, you can simply copy and paste the code and change the hex colour code.​

Snippets to be added on the loop admin​ is:

div\[data-loop-widget-selling-plan-group\] .loop-widget-purchase-option-price {color: hexcode / color code ;}

#### How to search by customer email?

To search for the customer using email, go to Loop > Subscriptions > enter the email in the search bar, and press enter.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118663853/e07de64177aed783e14f8cad8bf6/image.png?expires=1774894500&signature=2889ec6dc85e68b02fddb81d554d09636f98cf36a509528d3b189d05a58a8dd6&req=diEmHs94nolaWvMW1HO4zW8cnzX4RjLdI2G%2B562tE1QI9VCIgIyo%2B9wY5qVT%0A0rjy%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118663853/e07de64177aed783e14f8cad8bf6/image.png?expires=1774894500&signature=2889ec6dc85e68b02fddb81d554d09636f98cf36a509528d3b189d05a58a8dd6&req=diEmHs94nolaWvMW1HO4zW8cnzX4RjLdI2G%2B562tE1QI9VCIgIyo%2B9wY5qVT%0A0rjy%0A)

#### Is there a way to edit the currency from SGD to USD for a specific customer?

We can't change the currency of an existing subscription, but there is a workaround where you'll need to cancel the current subscription and create a new one manually.  
​  
​**How to Change Currency for an Active Subscription Customer  
​**You can now select the currency when creating a manual subscription from the admin panel - perfect for cases where a customer needs to be moved to a different currency.  
​  
​**How it works:  
​**The currency dropdown shows only the currencies enabled for the store.  
The product selector pop-up displays prices in the store’s default currency.  
Once a currency is selected, product prices are shown in the chosen currency.  
​  
​**Use Case:  
​**If a customer already has an active subscription in one currency and wants to switch, you can:  
Cancel the current subscription.  
Create a manual subscription for the same customer using the desired currency.

#### How are customer addresses handled? Does Loop retain them for every subscription order?

Loop retains the same address that the customer entered during checkout while processing a subscription order. If the customer wishes to update it, they’ll need to make the change through the Customer Portal.

If you update the address for a subscription using the customer or admin portal, it will get updated when the next recurring order is placed in Shopify.

#### Can B2B orders be sold as subscriptions on Loop?

Currently, B2B orders cannot be sold as subscriptions. This is a restriction from Shopify’s end and not something Loop can override.

#### Is there any way to restrict the cancellation of subscription until after the customer has received their order (eg, T+5 days)? i.e. if the customer places a subscription order and tries to immediately cancel the subscription, it would not be allowed.

To restrict the cancellation of subscription until the customer gets the product delivered, you can hide or disable the customer's cancellation button from the portal by writing custom JS in the customer portal.

#### How to create a test subscription on live stores?

To create a test subscription on the Live store, there is no recommended way except applying a 100% discount and using a valid payment method. Consider it from Shopify's point of view. What if people add bogus payments on live store and show unreliable numbers somewhere, thus, Shopify does not allow this to happen.  
​  
You can, however, use a test payment method and still create test subscriptions as a workaround,d but this method would not be an ideal method to check if your ideal payment methods are working fine.

#### How does someone add one-off products to their subscription box?

You can set up one-off products in a subscriber’s box either from the Loop admin or (if enabled) via the customer portal. To get started, could you share:

*   Where do you want this to happen?
    
*   Admin only (you/your team add one-offs)
    
*   Customer portal (shoppers add one-offs themselves to upcoming orders)
    
*   How do you want it to behave?
    
*   Only for the next shipment (true “one-off” add-on)
    
*   Or available as a recurring line item if they choose?
    

#### Why am I seeing the 'Manage Subscription' button on the Thank-you page?  

In case you are seeing the 'Manage Subscription' button on the thank-you or payment page, we suggest that you troubleshoot this by following these steps:

1.  Click on Manage Subscription button and check if it actually belongs to Loop Subscriptions. In this case, Loop support should be able to help you.
    
2.  If it does not belong to Loop Subscriptions, then please reach out to Shopify support to get the script removed, which might be causing it.
    

#### How do I allow customers to add a product as a 'add on' product for a subscription?

To allow customers to add a product as an add-on to a subscription, you'll need to make use of the Upsell or Flow feature.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118667602/3cb03c1b7c561a58774f04ff9977/image.png?expires=1774894500&signature=4c8ffcf424aab73810002fb1ab0b14edaa23956ccdbde0e79efccb00d50a9326&req=diEmHs94modfW%2FMW1HO4zboNGS1V3ONBUp%2FgsFh%2BFGZBeWVpryJa3XgebrMQ%0Aaihm%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118667602/3cb03c1b7c561a58774f04ff9977/image.png?expires=1774894500&signature=4c8ffcf424aab73810002fb1ab0b14edaa23956ccdbde0e79efccb00d50a9326&req=diEmHs94modfW%2FMW1HO4zboNGS1V3ONBUp%2FgsFh%2BFGZBeWVpryJa3XgebrMQ%0Aaihm%0A)

#### Is it cancelled and paused same in subscription page?

Subscription active and subscription paused states are different. When a subscription is cancelled, we reactivate it - when it is paused, we resume it.

#### How do I put a link on my page that allows a customer to edit their subscription?

To insert a link on the page that allows a customer to edit their subscription, please enable the subscription login page from Loop and copy that link and use it anywhere on your site.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118669588/e80371025521af0dbc84c0201bd0/image.png?expires=1774894500&signature=e6ce8494b8ebcddbdcf22135c38627592d0ef1c7d9a4d585f82f677922568ffb&req=diEmHs94lIRXUfMW1HO4zVHsRnIHFLyhaoEE4HRgtjspaqHZ%2F2ux7esabzPX%0AaJtd%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118669588/e80371025521af0dbc84c0201bd0/image.png?expires=1774894500&signature=e6ce8494b8ebcddbdcf22135c38627592d0ef1c7d9a4d585f82f677922568ffb&req=diEmHs94lIRXUfMW1HO4zVHsRnIHFLyhaoEE4HRgtjspaqHZ%2F2ux7esabzPX%0AaJtd%0A)

#### When setting how often a product's delivery frequency (e.g., every 30 days, every 2 weeks, every month), should I add additional days to accommodate shipping time so that the customer receives the product on or around the intended date?

Adding additional days to accommodate for shipping days in the subscription frequency is not required.

#### If one of the products is suspended by Shopify, will it affect the existing subscriptions?

Existing subscriptions for that product will continue to run normally, meaning subscribers will still be billed and receive their orders as usual. However, new customers won’t be able to subscribe to this product while it remains suspended.

* * *

# Alert centre

#### What is the alert 'Subscription found having Inactive products'?

The alert 'Subscription found having inactive products' in the alert centre within the Loop portal means that there are Subscriptions where the products have either been removed from Shopify, or they have been set as Inactive.

This alert, when opened, gives you an option to swap the products depending on the condition you may wish to use.

We can also remove the product from the subscriptions using the Alert Centre. If a subscription has only one product, we have the option to mark the subscription expired.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118659382/bb4e8665557a6c55c8b3c3693da8/image.png?expires=1774894500&signature=8a56635e92b6b2aa5d6653431ab6bc0002745113eb7946b0e42e9f096b9bcdc4&req=diEmHs97lIJXW%2FMW1HO4zcR1jN9aWiY4RMYH6iKudcfizwZDAVdOar5Coz4w%0AsVZ5%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118659382/bb4e8665557a6c55c8b3c3693da8/image.png?expires=1774894500&signature=8a56635e92b6b2aa5d6653431ab6bc0002745113eb7946b0e42e9f096b9bcdc4&req=diEmHs97lIJXW%2FMW1HO4zcR1jN9aWiY4RMYH6iKudcfizwZDAVdOar5Coz4w%0AsVZ5%0A)

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118662222/c80a27c8fa4684381dfc7d1bbb9b/image.png?expires=1774894500&signature=3f388b1dd59bc68f876d771d27a35f444f155a31919122f63ed93dbd74d04885&req=diEmHs94n4NdW%2FMW1HO4zWSEsOrkZ6fCLZTz5slpxZTTMSztz4%2B00fzO6ErI%0A7wLB%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118662222/c80a27c8fa4684381dfc7d1bbb9b/image.png?expires=1774894500&signature=3f388b1dd59bc68f876d771d27a35f444f155a31919122f63ed93dbd74d04885&req=diEmHs94n4NdW%2FMW1HO4zWSEsOrkZ6fCLZTz5slpxZTTMSztz4%2B00fzO6ErI%0A7wLB%0A)

* * *

# Bulk Action

#### How can we run a bulk action to update all subscriptions with product "Digestive Bitters" (Product ID 7496633614401), where the previous default variant ID was 41946595393601, so that they are now reassigned to the new 30-count variant ID: 42264854691905?

To update all subscriptions with a new product where an old product ID existed, please set up a bulk action:

1.  Go to Tools & Apps > Bulk Actions > Create New Action.
    
2.  Use the exported file containing old products (by making sure it matches the sample format provided)
    
3.  Choose the action type as ‘Swap’, select the old product and the new product (as shown in the images).
    
4.  Decide whether you want to keep the same prices and discounts or update them.
    
5.  Then, use the steps below to execute the bulk action:
    
6.  Run the bulk action, and all the affected subscriptions will be updated accordingly.
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118656051/d89ec70ff3b7d76a4194e023cf1c/image.png?expires=1774894500&signature=f4c78976b91cc91afce3d64459604cf85391ff54a01ea637d12d54e126bfae64&req=diEmHs97m4FaWPMW1HO4zbff0%2BnEy2nVKfo9pSVypYUZo9g%2Fz%2F6%2F4bskwQQP%0AAGx8%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118656051/d89ec70ff3b7d76a4194e023cf1c/image.png?expires=1774894500&signature=f4c78976b91cc91afce3d64459604cf85391ff54a01ea637d12d54e126bfae64&req=diEmHs97m4FaWPMW1HO4zbff0%2BnEy2nVKfo9pSVypYUZo9g%2Fz%2F6%2F4bskwQQP%0AAGx8%0A)
    

#### Why is the bulk operation stuck at 6% for a long time? Why is it taking so long to run?

Bulk Action can generally take some time to run as it communicates with the Loop and Shopify back and forth while ensuring data is safely amended. Additionally, Shopify has its limitations about how many calls can be made with its system, thus making the action time longer than expected.  
In case you are experiencing an unusually long duration, please get it touch with the support team.

#### How can we remove all existing discounts and apply 25% on all subscriptions?

To remove all existing discounts and apply 25% on all subscriptions, kindly make use of Bulk actions in Loop.

You'll need to run 2 separate bulk actions here, one to remove the discount and another to add the discount.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118649721/dc8f9a1aa9b9aded30e89377e4fe/image.png?expires=1774894500&signature=deb54be62df91532b5992c594d2e7610eba2e300f524d9c78e31a5f8da84853d&req=diEmHs96lIZdWPMW1HO4zTr4fNdeitaeyEiCZnXXmg2eu06pGKC1u1d5TrIS%0ABuEn%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118649721/dc8f9a1aa9b9aded30e89377e4fe/image.png?expires=1774894500&signature=deb54be62df91532b5992c594d2e7610eba2e300f524d9c78e31a5f8da84853d&req=diEmHs96lIZdWPMW1HO4zTr4fNdeitaeyEiCZnXXmg2eu06pGKC1u1d5TrIS%0ABuEn%0A)

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118652267/a3cbbc752539347b2948832c7bca/image.png?expires=1774894500&signature=0d0dbbece3264b80a0c98d78fe3beb87c1cafa352f8dc9b069fc47a1e41b3af7&req=diEmHs97n4NZXvMW1HO4zT7ZxmE7kPJnNyQUp4Jq9PddXv9Awg7%2B%2BDgyuHDb%0AAWgK%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118652267/a3cbbc752539347b2948832c7bca/image.png?expires=1774894500&signature=0d0dbbece3264b80a0c98d78fe3beb87c1cafa352f8dc9b069fc47a1e41b3af7&req=diEmHs97n4NZXvMW1HO4zT7ZxmE7kPJnNyQUp4Jq9PddXv9Awg7%2B%2BDgyuHDb%0AAWgK%0A)

#### How do I apply a discount code for all my active subscriptions, a one-time 20% off?

You can use Bulk Action to apply a discount code to all of your subscriptions.  
​  
You can provide a one-time 20% discount on all active subscriptions by going to Tools & Apps > Bulk Actions > Select All Subscriptions > Add Action as (Add Discount). Then, select 20% in your discount, set the number of orders to 1 (if you want to apply it for one time) and click Save.

#### Is it possible to add a Shopify discount code in bulk to all active subscribers?

Yes, applying a discount code in bulk is possible via the Loop Bulk Actions screen.

1.  Go to Loop → Tools & Apps → Bulk Actions and click Create New Action.
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118644194/356772a9cb9d0827c18eef796cae/image.png?expires=1774894500&signature=42df730ab6a05f70013cbd0b28d7974e3214451f7948a33f15406b4f708cf443&req=diEmHs96mYBWXfMW1HO4zVOkg7AKg%2F2plnx%2BwjUqwcTfGCco6iFi3leqX1wB%0AAQUC%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118644194/356772a9cb9d0827c18eef796cae/image.png?expires=1774894500&signature=42df730ab6a05f70013cbd0b28d7974e3214451f7948a33f15406b4f708cf443&req=diEmHs96mYBWXfMW1HO4zVOkg7AKg%2F2plnx%2BwjUqwcTfGCco6iFi3leqX1wB%0AAQUC%0A)
    
2.  Under Select Entity, choose Subscription.
    
3.  For the Condition, select All Subscriptions so the action applies to everyone currently active.
    
4.  In the Decide section, choose Add Discount.
    
5.  Select the preferred Discount Type, and enter the value.
    
6.  Under “Number of orders to apply,” select 1 if you want the discount to apply only to their next renewal order.
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118647078/1c6327d13a9b395c189872bd8870/image.png?expires=1774894500&signature=d353c68ed18d5469294378377df803d6c8ed57c3ce60ff936925d4cea4a9d28e&req=diEmHs96moFYUfMW1HO4zWF8hPwW8J2xEWvLz8VGpsqsTqr%2Fkwjr%2B39N2WtY%0A%2FmPJ%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118647078/1c6327d13a9b395c189872bd8870/image.png?expires=1774894500&signature=d353c68ed18d5469294378377df803d6c8ed57c3ce60ff936925d4cea4a9d28e&req=diEmHs96moFYUfMW1HO4zWF8hPwW8J2xEWvLz8VGpsqsTqr%2Fkwjr%2B39N2WtY%0A%2FmPJ%0A)
    
7.  **(Optional)** If you prefer to use a Shopify discount code, you can select that option as well - but using the Loop discount is usually easier unless you specifically need it tied to a Shopify code.
    

#### Can my customer switch a regular subscription to a prepaid subscription from the Customer Portal?

Converting a regular subscription to a prepaid subscription is not possible at the moment. A subscription is a contract between Shopify and the customer. If a customer wants to convert an existing subscription to a prepaid subscription, they’ll need to create a new prepaid subscription by purchasing the same product directly from your website, selecting the prepaid option on the product page during checkout.

#### What is Custom Order Schedule, and how does it work?

Custom order schedule allows merchants to override individual future order dates without changing the subscription’s contract frequency. When a subscription is created, a fixed delivery cadence is set on the contract, and Loop generates 10 future orders based on that cadence. With the custom order schedule enabled, only the order dates can be changed while the underlying frequency remains unchanged.

#### How can merchants and customers reschedule future subscription orders, and what are the rules and limitations for rescheduling future orders?

To reschedule future orders, merchants can use the Admin portal or APIs, and customers can use the customer portal. In the customer portal, clicking Reschedule opens a View scheduled order list where each future order has its own reschedule option. This allows rescheduling of any individual upcoming order instead of only the next order.

Future orders can only be rescheduled to a date between the previous scheduled order and the next scheduled order. Orders cannot be moved before the previous order or beyond the next scheduled order. These rules ensure order sequencing remains intact while allowing flexibility.

#### How does Custom Order Schedule interact with refill jobs, anchor dates, billing, and dunning?

Initial future orders are created based on anchor dates and aligned with billing or Zapiet configurations. When an order is placed, the refill job creates new future orders based on the contract cadence calculated from the last order date. If an order is manually rescheduled, the calendar allows any date between adjacent orders, regardless of billing or Zapiet settings. When the custom order schedule is enabled, automated shifting of future orders during dunning is disabled to prevent conflicts with manually set order dates.

* * *

Related Articles

[

Apply discounts

](https://help.loopwork.co/en/articles/12709682-apply-discounts)[

Cancel subscription

](https://help.loopwork.co/en/articles/12709699-cancel-subscription)[

Subscription discounts

](https://help.loopwork.co/en/articles/12716873-subscription-discounts)[

Acquire FAQs

](https://help.loopwork.co/en/articles/12858059-acquire-faqs)[

Retain FAQs

](https://help.loopwork.co/en/articles/12858144-retain-faqs)
