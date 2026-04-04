---
title: "Settings FAQs"
source_url: "https://help.loopwork.co/en/articles/12858166-settings-faqs"
collection: "15-faq"
scraped_at: "2026-03-30T17:43:24.687Z"
tags: ["15-faq"]
---



# General

#### What happens to subscriptions if the billing hour is not set up on my store?

If the billing hour is disabled and has not been set up, your orders shall be billed on an 'as and when' basis. Billing hours primarily help when some merchants have a huge list of orders, and they want to process all orders at the same time in a day, ideally by midnight.

#### What and where is the Loop Admin page?

Loop Admin is your main Loop Page, which you open from Shopify > Apps. In general, it's called the Loop Admin page.

The URL for the page is generally: https://storename.app.loopwork.co/dashboard

#### What timezone does the store runs or is the billing hour set on?

Your store, including the billing hour, is based on your local timezone. Loop Subscriptions only recognises fully completed Shopify orders. Draft orders do not create subscriptions or trigger notifications within Loop. This distinction ensures that only finalised transactions are processed for subscription management.

#### Is it possible to define and restrict a Loop admin to be able to only skip or delay an order for a few times?

No, it is not possible to restrict a Loop admin to only skip, delay or cancel an order a limited number of times.

#### Why does my Shopify billing seem to reset to $60 whenever it exceeds that amount?

The $60 amount you are seeing could be Shopify’s billing threshold, not a limit or charge set by Loop. Shopify uses a billing threshold system for app and usage charges. When your accumulated app charges reach a specific threshold - such as $60 - Shopify automatically generates an invoice and charges your payment method. After the charge is processed, the running balance resets and starts accumulating again until it reaches the threshold once more. New or lower history stores typically start with a smaller billing threshold, such as $60. As successful payments are made over time, Shopify may automatically increase this threshold to higher amounts, such as $200 or $400. There is no manual option to adjust this billing threshold. Over time, as invoices are paid successfully, Shopify may increase your billing limit automatically. It is best that you discuss it with Shopify itself regarding it being a concern. For merchants looking to offer promotions, such as a free first month, Loop’s Dynamic Discounts feature can be utilised. By creating a selling plan with a 100% discount on the first billing cycle and enabling the option to adjust the discount after a set number of payments, merchants can seamlessly manage promotional offers while ensuring future renewals are billed at the regular price.

#### Are unlisted products part of "Alert Centre" flags?

No, unlisted products are not part of "Alert Centre" alerts. Products in an "unpublished" state (accessible only via direct link and not marked as active, draft, or archived) do not trigger alerts in Loop’s Alert Centre. This is because such products are still considered active within the system. They are not deleted, removed, or moved to draft, and therefore, Loop does not classify them as inactive. This ensures that unpublished products remain functional for subscription purposes without generating unnecessary alerts.

#### How can I verify the 1% transaction fee charged by Loop and compare it with my Shopify billing?

To verify the 1% transaction fee charged by Loop and compare it with your Shopify billing, follow these steps:

**Step 1 - Export the Loop charges from Shopify billing**

1.  Go to Shopify Admin.
    
2.  Navigate to Settings > Billing.
    
3.  Export the billing report for the required date range, for example, January 1 to January 31.
    
4.  Open the exported file in a spreadsheet tool.
    
5.  Apply a filter on the App Name column and select “Loop Subscriptions.”
    
6.  Sum the total billed amount for that period.
    

**Step 2 - Calculate 1% of Checkout Orders from Loop**

1.  Go to Loop Admin.
    
2.  Navigate to Analytics > Reports > Checkout Orders.
    
3.  Select the same date range used in Shopify billing.
    
4.  Export the report and open it in a spreadsheet tool.
    
5.  Sum the values under the Total Price column.
    
6.  Multiply the total by 1% to calculate the transaction fee for checkout orders.
    

**Step 3 - Calculate 1% of Processed Orders from Loop**

1.  Go to Loop Admin.
    
2.  Navigate to Analytics > Reports > Processed Orders.
    
3.  Select the same date range.
    
4.  Export the report and open it in a spreadsheet tool.
    
5.  Sum the values under the Current Total Price column.
    
6.  Multiply the total by 1% to calculate the transaction fee for processed orders.
    

**Step 4 - Compare the totals**

1.  Add the 1% amount calculated for Checkout Orders and Processed Orders.
    
2.  Compare this combined value with the total amount charged under “Loop Subscriptions” in your Shopify billing report.
    

You can use this method to validate whether the transaction fees match your Shopify billing for the selected period.

#### How can I change the billing address or card information for Loop payouts?

Please change the billing address/card information for Loop payouts from Loop > Settings > Billing.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118720783/eac75e61306816a0d89d81fd52ba/image.png?expires=1774894500&signature=6561da0cbd67f2db2d8823942d6ba9efc13ca217fbb5f9af3614e7fa7f0d3760&req=diEmHs58nYZXWvMW1HO4zQxgO1vTrZ0d1Oly8RoJY4yW79%2BgrqoFsUBEjdOb%0AdTfk%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118720783/eac75e61306816a0d89d81fd52ba/image.png?expires=1774894500&signature=6561da0cbd67f2db2d8823942d6ba9efc13ca217fbb5f9af3614e7fa7f0d3760&req=diEmHs58nYZXWvMW1HO4zQxgO1vTrZ0d1Oly8RoJY4yW79%2BgrqoFsUBEjdOb%0AdTfk%0A)

#### If we change the store time zone from PST to EST, will Loop automatically update the billing hour for Order Processing?

Order processing-related billing hour settings are not updated automatically and need to be updated manually. Once the time zone is changed in Shopify, you’ll need to update the settings in:

*   Loop App > Settings > General > Billing Preferences.
    

From there, adjust the timing accordingly and update the billing settings. This change will apply to all subscriptions.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118722546/d68bdfc83d3fdb7174069404a36b/image.png?expires=1774894500&signature=1acd4e352f17de0ee8beabb4f1318c94c4460ad32c037f72f4f4994a2a1a4496&req=diEmHs58n4RbX%2FMW1HO4zVSdk6uMoT6CCCivBu6y5bKogIvvHVyNbhu%2BTzQH%0AzYjV%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118722546/d68bdfc83d3fdb7174069404a36b/image.png?expires=1774894500&signature=1acd4e352f17de0ee8beabb4f1318c94c4460ad32c037f72f4f4994a2a1a4496&req=diEmHs58n4RbX%2FMW1HO4zVSdk6uMoT6CCCivBu6y5bKogIvvHVyNbhu%2BTzQH%0AzYjV%0A)

#### Our Subscriptions did not run on the expected time, and most of them are now scheduled for another time. How do I go about them? There also seems to be some outstanding orders that are not charged yet, but some of the orders have been charged.

To run subscriptions at the same time and ensure they don't run on different hours, you can check the global billing hour. In that area, you can click on the **"Update billing hour"** button, which will create a bulk action to update all the subscriptions to process at the same time.  
​  
If there are some outstanding orders that are pending to be charged yet, please use Loop > Tools & Apps > Bulk Actions > Decide Action > Charge Order.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118724562/50598b7af4bde0c5d8dcc92a25bb/image.png?expires=1774894500&signature=23f59adf7ba47828474dbd09c5be9eaa21b6d3f3dc8013de4b5921914aabf846&req=diEmHs58mYRZW%2FMW1HO4zXWDvhaceNHbCZ4JGQnnlUyK%2ByZ47lasUfCROWWW%0A7W5q%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118724562/50598b7af4bde0c5d8dcc92a25bb/image.png?expires=1774894500&signature=23f59adf7ba47828474dbd09c5be9eaa21b6d3f3dc8013de4b5921914aabf846&req=diEmHs58mYRZW%2FMW1HO4zXWDvhaceNHbCZ4JGQnnlUyK%2ByZ47lasUfCROWWW%0A7W5q%0A)

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118727306/a954c810f76357fb85bb923d930b/image.png?expires=1774894500&signature=2725d23bcdeb28c059fad5681b8de0f239785a3e2a588b538326eb5d4e947677&req=diEmHs58moJfX%2FMW1HO4zabS0rxDcP6I8SiU5Bq1jwxA%2BHXJqONTjbDrY1YO%0Aytvx%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118727306/a954c810f76357fb85bb923d930b/image.png?expires=1774894500&signature=2725d23bcdeb28c059fad5681b8de0f239785a3e2a588b538326eb5d4e947677&req=diEmHs58moJfX%2FMW1HO4zabS0rxDcP6I8SiU5Bq1jwxA%2BHXJqONTjbDrY1YO%0Aytvx%0A)

#### How to configure charge offset by location, down to the province level?

To configure charge offset by location, down to the province level, do this:

1.  Navigate to Loop > settings > Order schedule preferences.
    
2.  Select the order schedule based on delivery and set the default charge offset. (Please note this charge offset will be applied by default to all the subscriptions.)
    
3.  Select the setting > available only for selected locations, select the charge offset and select the different locations. (Please note: you can add multiple conditions for different locations.)
    
4.  Click on save to save the charge offset configurations.
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118729249/74474a2971db01e36efc4dc99e59/image.png?expires=1774894500&signature=db01ec657b2478d8f6e326ee29259688fcd39a112d921a7703929a1a45994a28&req=diEmHs58lINbUPMW1HO4zTzzB5dAZO10eu9C6jtpP1vvaxfEtjjBuGvTRQut%0A6Vz5%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118729249/74474a2971db01e36efc4dc99e59/image.png?expires=1774894500&signature=db01ec657b2478d8f6e326ee29259688fcd39a112d921a7703929a1a45994a28&req=diEmHs58lINbUPMW1HO4zTzzB5dAZO10eu9C6jtpP1vvaxfEtjjBuGvTRQut%0A6Vz5%0A)
    

#### What is "x-request code"?

X-Request-Id is the unique id for a particular request. For example, if we hit Shopify's api to perform billing, a unique id is returned to us, which can help track both Shopify and us about what happened with that request. Whether it was a success or a failure. And if failure, what went wrong? This helps Shopify and Loop both in debugging.

#### Will I be double-charged if I got billed last week for the Starter Plan and now opt for the Pro plan, or vice versa?

If you get charged for one Loop's pricing plan, and then try to upgrade to another Loop's pricing plan, Shopify auto-adjusts the credits by comparing the remaining & used time, thus you do not get charged twice for both plans.

#### How do I find the date I'll get charged for my Loop Pricing plan (Starter, Pro, Custom/Enterprise)?

Unfortunately, we don’t control the Loop admin's billing charge dates. From Loop’s side, we simply trigger the API to Shopify for monthly billing, and all charges are handled entirely by Shopify. You can review the billing dates and invoices directly in your Shopify billing Invoice section. We are unable to provide a specific upcoming charge date since the payment processing is fully managed on Shopify’s end for Loop.

#### Do loop charge any additional fees if I am in a trial period of the plan?

Only the fixed plan charge is waived off under the trial period, but you will still be charged a transaction fee for every order placed via Loop.

#### If I cancel the Loop pricing plan in mid-month, will I be charged for the whole month?

If you cancel the Loop pricing plan in the middle of the month, you’ll still be charged for the entire month since Loop doesn’t offer prorated refunds for partial usage. The billing covers the full renewal period, even if access to subscription features is removed right away.

#### Why are customers being charged on the 1st of the month, even if they signed up between the 25th and the last day of the previous month?

Please review your Cut-off and Anchor day settings.

The cut-off window comes into play specifically when a subscription plan uses anchor days to schedule renewals.

The cut-off window is evaluated at the time the order is placed. If the order is placed outside the cut-off window (i.e., sufficiently early before the next anchor day), the order is scheduled for the immediate upcoming anchor day. If the order is placed within the cut-off window (i.e., too close to the next anchor day), the system skips that anchor day and schedules the order for the next cycle’s anchor day.

**Example Scenario:**

**Anchor Day:** 10th of every month

**Cut-Off Window:** 5 days

**Order Placed On** - Days Before Anchor

**Outcome**:

1st–4th≥ 6 days, ships on 10th (current month)

5th–10th ≤ 5 days \[Skips 10th, ships on 10th (next month)\]

So if you change it to "On anchor", the order would skip the immediate anchor day.

#### How does charge immediately work when resuming or reactivating an anchor-based subscription?

To charge immediately when resuming or reactivating an anchor-based subscription, follow these steps:

1.  Enable the “Charge immediately on resume/reactivate” preference for anchor-based subscriptions.
    
2.  Once enabled, when a customer resumes or reactivates their subscription, an order is placed immediately instead of waiting for the next anchor date.
    

This helps ensure revenue is collected right away after the subscription becomes active again.

By default, when an anchor-based subscription is resumed or reactivated, orders are scheduled for the nearest upcoming anchor date.

If the “charge immediately” preference is not enabled, this default scheduling behaviour continues to apply.

#### How can I control whether customers are charged immediately upon resume or reactivation?

Merchants can control this by managing the charge immediately preference for anchor-based subscriptions.

*   If the preference is disabled, orders follow the nearest anchor date.
    
*   If the preference is enabled, an order is placed immediately upon resume or reactivation.
    

This setting allows merchants to choose between immediate billing or anchor-date-based billing.

#### How can I use Unlisted products in subscriptions?

To use Unlisted products in subscriptions, brands can select Unlisted products from all product selectors available in the Admin portal. This allows brands to add, swap, or remove Unlisted products on subscriptions directly from the Admin portal.

Unlisted products can also be selected while performing subscription actions through Bulk actions and Flows, enabling brands to add, swap, or remove these products at scale.

Unlisted products remain restricted from customer-facing touchpoints and will not appear in areas such as swap recommendations or other customer product discovery surfaces.

* * *

# Shipping

#### How to change the delivery method from shipping to pickup?

To change the delivery method from Subscription shipping to pick up via Loop,  
​  
First step will be to enable in settings > general > multiple delivery methods  
2nd step will be to change the delivery method from admin (subscription page > change delivery method).

#### How can we change the delivery method from pickup to shipping?

To change a subscription delivery from Shipping to Pickup via Loop, follow the steps below:

**Enable Local Pickup in Shopify**

1.  Go to Shopify Admin > Settings > Shipping and Delivery
    
2.  Scroll to the Local Pickup section
    
3.  Click Manage next to the location where you want to offer pickup
    
4.  Check “This location offers local pickup.”
    
5.  Add any pickup instructions as needed
    
6.  Click Save
    
7.  Make sure the product is stocked at the location offering pickup.
    

**Update Delivery Method in Loop**

1.  Once pickup is enabled in Shopify:
    
2.  Go to Loop > Subscriptions
    
3.  Click on the subscription you want to change
    
4.  Click on the Delivery section
    
5.  Click Edit
    
6.  You’ll now be able to switch from "Deliver to Address" to "Pickup."
    
7.  Additionally, if a merchant wants to allow subscribers to change their delivery method from their customer portal, they can do it via: customer portal > preferences > change delivery method.
    

#### How to offer free shipping? Or how to offer free shipping when the cart total is above the X amount in the US country only?

To offer free subscription shipping only within the US, you can set this up easily in Loop. Here's how:

1.  Go to Loop > Settings > Subscription Shipping Rates
    
2.  Click on Create Now
    
3.  Select the selling plans for which you want to offer free shipping
    
4.  Choose the relevant Shipping Origins
    
5.  Select the Shipping Zones
    
6.  Add the zones where you’ll be shipping your subscription products and define the applicable rates
    
7.  You can select all US states or choose specific ones based on your needs
    
8.  Set the Subscription Delivery Price to $0.00
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118817506/8d9820217ed7dd1b6a4e81385b94/image.png?expires=1774894500&signature=66008824f68b99e5ebf1b14ec920017d81a1f583ac39e5c9c9eddd0537bcd612&req=diEmHsF%2FmoRfX%2FMW1HO4zR0MGWPIjOR9i6tmCWKdJVl2JOESpKryxBMyWrxk%0AVXvI%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118817506/8d9820217ed7dd1b6a4e81385b94/image.png?expires=1774894500&signature=66008824f68b99e5ebf1b14ec920017d81a1f583ac39e5c9c9eddd0537bcd612&req=diEmHsF%2FmoRfX%2FMW1HO4zR0MGWPIjOR9i6tmCWKdJVl2JOESpKryxBMyWrxk%0AVXvI%0A)
    

You can also set conditional rules for free shipping, such as minimum order value or weight thresholds.  
Once done, click Save, and the free shipping will be applied accordingly.

#### Does Loop allow international shipping on subscriptions?

Yes, we do support International shipping on orders, and we suggest you try an app like Openborder with which we have an integration.

#### Why was shipping applied to my order despite creating a free shipping in Loop Shipping profiles?

In case your subscription has free shipping and the shipping charges are getting applied, please check if the order has a one-time item added. If yes, you'll need to add that one-time product in a new selling plan (make it unavailable on the storefront & customer portal) and create free shipping for it in Loop shipping profiles.

#### How do I change the delivery method for a subscription?

In case you are not able to change the delivery method for a subscription, please check that you've enabled the preference from Loop > Settings > General > Multiple delivery frequencies

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118818846/39ad92de2bf08e6b0581a598f043/image.png?expires=1774894500&signature=4d7bb1d1ab029a87ebecc37d711864b93a804f79d0f3fc1a7e3ec03d6c7c60c3&req=diEmHsF%2FlYlbX%2FMW1HO4zZUseTeGOguJvqQSVNBSay2fJ85EpPylxfBCpyEE%0ACjeM%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118818846/39ad92de2bf08e6b0581a598f043/image.png?expires=1774894500&signature=4d7bb1d1ab029a87ebecc37d711864b93a804f79d0f3fc1a7e3ec03d6c7c60c3&req=diEmHsF%2FlYlbX%2FMW1HO4zZUseTeGOguJvqQSVNBSay2fJ85EpPylxfBCpyEE%0ACjeM%0A)

* * *

# User and permissions

#### Our team member is not able to access Loop or is seeing difficulties accessing Loop. How to resolve it?

If your team member is not able to access Loop or is facing difficulties accessing Loop, kindly do the following:

1.  Clear Cache, or try another browser
    
2.  Please ensure that you first open the Shopify admin and then only Loop. It is due to the fact that Shopify generates tokens when you access an app, and an existing Loop link might have an expired token.
    

* * *

# Notifications

#### How to prevent Loop from sending order confirmation emails for subscription renewals?

To prevent Loop from sending order confirmation emails for subscription renewals, please navigate to Loop > Settings > Notifications and configure your portal as per your requirements.  
​  
If you wish to utilise Shopify to do this, we suggest you to kindy look for this requirement at help.shopify.com

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118820829/33d093d57476b33a94b8f0433ce7/image.png?expires=1774894500&signature=83254635245edd559267304c276d81559c1d2147257d6f361d6787a56e1c2c17&req=diEmHsF8nYldUPMW1HO4zYwicR1HNcBZsYVuGyx%2B6bZd5FRT97z2z8QbPxkg%0AV4%2B8%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2118820829/33d093d57476b33a94b8f0433ce7/image.png?expires=1774894500&signature=83254635245edd559267304c276d81559c1d2147257d6f361d6787a56e1c2c17&req=diEmHsF8nYldUPMW1HO4zYwicR1HNcBZsYVuGyx%2B6bZd5FRT97z2z8QbPxkg%0AV4%2B8%0A)

* * *

# Order Schedule Preferences

#### What happens if an order falls on a non-billing day?

If an order falls on a non-billing day, it will be shifted to the next available billing day.

* * *

Related Articles

[

Anchor day billing

](https://help.loopwork.co/en/articles/12716835-anchor-day-billing)[

Auto-update shipping price in Loop

](https://help.loopwork.co/en/articles/12732064-auto-update-shipping-price-in-loop)[

Zapiet

](https://help.loopwork.co/en/articles/12742185-zapiet)[

Manage subscription FAQs

](https://help.loopwork.co/en/articles/12858164-manage-subscription-faqs)[

Order schedule preferences

](https://help.loopwork.co/en/articles/13645961-order-schedule-preferences)
