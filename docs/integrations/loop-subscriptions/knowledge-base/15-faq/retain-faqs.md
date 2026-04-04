---
title: "Retain FAQs"
source_url: "https://help.loopwork.co/en/articles/12858144-retain-faqs"
collection: "15-faq"
scraped_at: "2026-03-30T17:43:23.910Z"
tags: ["15-faq"]
---



# Flows

#### Is there a way to randomise flavours (variants) for monthly subscriptions?

We cannot really 'randomise' the variants each month, but you can swap the variants each month in a monthly subscription using our FLOWS feature.

#### How do I acquire customers with a trial product and automatically switch them to a BYOB bundle for recurring orders?

To acquire customers with a trial product and then switch them to a BYOB bundle for recurring orders, you must configure a Flow that adds the BYOB bundle after the required trigger.

To set this up:

1.  Go to Flows and create or edit a Flow
    
2.  Set your trigger
    
3.  Add an Add Bundle action
    
4.  Choose whether to add it as a one-time product or a subscription
    
5.  Select the required BYOB bundle
    
6.  Configure products, variants, and quantity
    
7.  Save and activate the Flow
    

When the Flow runs, the BYOB bundle will automatically be added to the subscription.

**When adding a BYOB bundle through Flows, discounts are applied based on the discount configuration inside the bundle.** Only the overall bundle product limit is considered during configuration. Category limits are not applied in this Flow action.

To ensure correct setup:

1.  Verify discount settings inside the bundle
    
2.  Stay within the defined bundle product limit
    
3.  Save and activate the Flow
    

#### How can I ensure that if a customer purchases more than 1 quantity initially, all future subscription orders include only 1 unit?

To ensure that all recurring subscription orders contain only 1 unit regardless of the initial checkout quantity, follow these steps:

1.  Go to Loop Admin Portal.
    
2.  Navigate to Retain > Flows.
    
3.  Click on Create New and select Create your own workflow.
    
4.  Under Trigger, choose “When a new subscription is created.”
    
5.  Under Condition, select “Product in subscription (any of)” and choose the product(s) where you want this rule applied.
    
6.  Under Action, select “Swap.”
    
7.  In the swap configuration:
    
    *   Select the same product as both the Old product and the New product.
        
    *   Set the Quantity to a Static value.
        
    *   Enter 1 as the quantity.
        
    
8.  Select the preferred pricing option in the swap configuration, based on how you want pricing handled for future orders.
    
9.  Save the flow.
    

You can use this workflow to automatically adjust the subscription so that from the second order onward, the quantity is fixed at 1.

#### How can I trigger a Flow based on the checkout order date of a subscription?

To trigger a Flow based on the checkout order date, follow these steps:

1.  Go to Flows and create or edit a Flow.
    
2.  Select the trigger “A new subscription is created.”
    
3.  Add the condition “Checkout order date range.”
    
4.  Choose the months for which the condition should apply (default is all months).
    
5.  Define the date range within the selected months.
    
6.  Save the condition to ensure the Flow only runs when a subscription checkout falls within the defined date range.
    

#### How to change a subscription’s status using flows?

To change a subscription’s status using flows, follow these steps:

1.  Go to Flows in the admin.
    
2.  Create a new flow or edit an existing one.
    
3.  Add the Change subscription status action.
    
4.  Choose the required status:
    
    1.  Pause subscription (definite or indefinite)
        
    2.  Cancel subscription (with pre-set or custom reason)
        
    3.  Expire subscription
        
    
5.  Configure whether the customer should be notified.
    
6.  Save and activate the flow.
    

#### How to automatically pause, cancel, or expire subscriptions based using Flows?

To automatically pause, cancel, or expire subscriptions based on conditions, you can utilise Flows feature and follow these steps:

1.  Create a flow with a relevant trigger (for example, payment failure).
    
2.  Add conditions such as:
    
    1.  Hard payment declines or fraud
        
    2.  Annual subscription type
        
    3.  Subscriptions with only shipping insurance products
        
    
3.  Add the Change subscription status action.
    
4.  Select Pause, Cancel, or Expire subscription.
    
5.  Configure pause duration or cancellation reason as needed.
    
6.  Set customer notification preference.
    
7.  Save and enable the flow.
    

#### How to control customer notifications when changing subscription status via flows?

To control customer notifications when changing subscription status via flows, follow these steps:

1.  Add the Change subscription status action to a flow.
    
2.  Select the desired subscription status.
    
3.  Enable or disable the Notify customer option.
    
4.  Save and activate the flow.
    

#### How can I set the next subscription order date based on the checkout order date using Flows?

To set the next subscription order date based on checkout date, follow these steps:

1.  Create or edit a Flow with the trigger “A new subscription is created.”
    
2.  Add the action “Set next order date.”
    
3.  Select the months for which the action should apply (default is all months).
    
4.  Define one or more continuous date ranges for each month.
    
5.  Assign a specific next order date for each date range.
    
6.  Save the Flow to automatically update the next order date when conditions match.
    

#### Can I configure multiple date ranges within the same month for setting the next order date using Flows?

Yes, multiple continuous date ranges can be configured. To do this:

1.  In the “Set next order date” action, select a month.
    
2.  Add multiple continuous date ranges (for example, 1–7, 8–14, 15–end of month).
    
3.  Set a different next order date for each range.
    
4.  Save the action so the correct next order date is applied based on checkout timing.
    

#### How can I use Flows to manage fixed monthly or quarterly shipping schedules?

Merchants can manage fixed shipping schedules by configuring date ranges and next order dates using flows as follows:

1.  Define checkout date ranges within a month.
    
2.  For early checkouts, leave the next order date unchanged.
    
3.  For mid-month checkouts, set the next order date to a specific date in the following month.
    
4.  For late-month checkouts, push the next order date to the following month or the month after.
    
5.  Save the Flow so subscription orders align with shipping cycles without creating closely spaced orders.
    

#### How do we make a subscription plan that charges the first shipping fee and makes all additional rebills free shipping? The customer should pay for shipping on the first order only.

To make a subscription plan that charges the first shipping fee and makes all additional rebills free shipping, you'll need to use the Flows feature in Loop as follows:

1.  ​**First method:  
    ​**During the initial checkout, the shipping charges configured in Shopify will apply as usual.  
    Then, using a Loop Flow, we can automatically apply free shipping on all subsequent recurring orders.
    
    1.  Go to Loop > Retain > Flows > Create a New Flow.
        
    2.  Choose the When condition: "When a new subscription is created."
        
    3.  Choose the If condition – now you can choose the selling plan for which you want to give free shipping.
        
    4.  In the Then condition, select Update shipping. (You can configure the amount if you want to charge something, or set it to $0 for free shipping.)  
        ​  
        This first flow will trigger free shipping for the second order. If you want to offer free shipping on all recurring orders, create another flow, but this time choose the When condition: "An order is successfully placed via Loop", and then follow the same steps. This will apply free shipping to all subscription orders you select.
        
    
2.  **Second method:  
    ​**During the initial checkout, the shipping charges configured in Shopify will apply as usual.  
    Then, using a Loop Flow, we can automatically apply free shipping on all subsequent recurring orders.
    
    Here’s how to set it up:
    
    1.  Go to Loop > Retain > Flows and click Create a New Flow.
        
    2.  Set the When condition to: “When a new subscription is created”.
        
    3.  For the if condition, select the selling plan for which you want to offer free shipping.
        
    4.  In the Then condition: Select Add discount
        
    5.  Choose FreeShipping as the discount type
        
    6.  Specify the number of orders for which you want to apply free shipping
        
    7.  Save the flow.
        
    

​**Note**: Please make sure auto-update shipping prices are turned off from Settings > Auto-update.

#### Can I make different gifts for each month of the subscription? Example: Customers of the 2nd month get X gift, customers of the third X gift

To make different gifts for each month of the subscription? Example: Customers of the 2nd month get X gift, customers of the third X gift. You'll need to make use of flows and create separate flows for each gift type.  
​  
Kindly refer to our article for Flows to find more details.

#### Is it possible to offer free shipping on orders over a certain amount or free shipping after customers have a certain number of subscription orders?

To offer free shipping on orders over a certain amount or free shipping after customers have a certain number of subscription orders, please make use of Loop flows:  
​  
Loop > Flows > Conditions that fit your criteria.

#### How to offer a Free Gift on the 2nd Order or a certain milestone (First Recurring Order)?

If you’d like to offer your customers a gift on their 2nd order, you can easily set this up using Loop’s Flows feature.  
​  
Follow the steps below:

1.  Navigate to Flows
    
    1.  Go to your Loop Dashboard.
        
    2.  Navigate to Retain → Flows.
        
    3.  Click Create New Flow → Create Your Own Workflow.
        
    
2.  Set the Trigger (When Condition)
    
    1.  Under When, choose the trigger:
        
    2.  “A new subscription is created.”
        
    3.  This ensures the flow starts when a customer’s subscription begins, so the reward can be applied to their 2nd (recurring) order.
        
    
3.  IF Conditions (Optional)  
    If you want the free gift to apply only under specific conditions, you can add an If Condition.  
    Examples:
    
    1.  If the subscription is for a specific product or selling plan.
        
    2.  If the order value is above a certain amount.
        
    3.  If the shipping country is specific.
        
    4.  If you don’t need any specific criteria, you can skip this step and move directly to the 'Then' condition.
        
    
4.  Define the Action (Then Condition)
    
    1.  Click on Then → choose Add Product One-Time.
        
    2.  Select the product you want to offer as the free gift.
        
    3.  Next, choose the action Add Product with Specific Discount Value.
        
    4.  Set the discount value to 100% — this makes the product free.
        
    
5.  Enable Reward Notifications (Optional but Recommended)
    
    1.  At the end of the flow setup, you’ll see the option Reward Notifications.
        
    2.  Enable this option if you want to notify customers when the free gift or discount has been applied to their order.
        
    3.  This helps improve customer engagement and transparency.
        
    

#### At the bottom of a flow, what does this order count in 'hide reward banner' mean exactly?

The order count in 'hide reward banner' on Flows indicates the number of orders placed after the flow is triggered, which determines when the banner will be hidden. In other words, it’s the order count after the flow has been triggered.

#### How can I implement a trial subscription model without using Loop Flows?

You can implement a trial subscription without flows with a slight limitation. In Loop > Acquire > Selling plans, create a selling plan that has 100% discount and configure the selling plan to change the discount after the initial order to 0%. This will make the first order free, making it a trial period.

#### Can we have the option to trigger the flow based on $ spent?

Yes, we do have the option to trigger the flow based on $ spent. Please use the Subscription value and the total specific subscription spent in your flows.

#### Can I set up a customer to start as a semi-annual subscriber and, at the end of that period, automatically migrate to the monthly plan?

You can set up a customer to start with a semi-annual subscription and then automatically switch to a monthly plan after the initial period. Here's how you can do it:

1.  Create Two Selling Plans:
    
    1.  One for the semi-annual plan.
        
    2.  Another for the monthly plan.
        
    
2.  Set Up a Loop Flow:
    
    1.  Use Loop Flows to trigger an automatic switch from the semi-annual plan to the monthly plan after the initial 6-month period.
        
    
3.  Configure the Flow:
    
    1.  Set the flow to activate when the subscription reaches the end of the 6-month term.
        
    

This will automatically update the customer’s subscription to the monthly plan.

How can I send a gift to a customer when they subscribe to their first subscription order? Adding free gifts to subscription orders is a common feature request for businesses using Loop Subscriptions. This article explains the behavior of Loop Flows regarding free gifts, its limitations for the initial checkout order, and alternative solutions to meet this need.

# Overview of Loop Flows and Subscription Order Behaviour

Loop Flows is a powerful tool for managing subscription orders. However, it is important to understand how it handles free gifts:

*   Free Gifts added via Loop Flows are applied starting from the second order (the first recurring order) of the subscription.
    
*   This behaviour is expected because subscriptions are activated only after the initial checkout is completed.
    

# Limitations of Loop Flows for Initial Checkout Orders

Loop Flows does not support adding free gifts to the initial checkout order. This limitation exists because the subscription setup process begins after the first order is placed. As a result, any free product added through Loop Flows will not appear in the initial checkout but will be included in subsequent recurring orders.

# Alternative Solutions for Adding Free Gifts to the First Order

If you need to include a free gift in the customer’s first checkout order, consider using a third-party app that supports this functionality. For example:

*   Shopify apps designed for adding gifts at checkout can be used to include a free product in the initial order.
    
*   These apps work alongside Loop Subscriptions to provide a seamless experience for customers.
    

# Recommendations for Implementation

To implement free gifts for the first order:

1.  Identify a third-party app compatible with your Shopify store that supports free gifts at checkout.
    
2.  Configure the app to add the desired free product to the initial checkout order.
    
3.  Test the setup to ensure the free gift is applied correctly without affecting the subscription flow. By combining Loop Flows with a third-party app, you can offer free gifts to customers both during the initial checkout and in subsequent subscription orders.
    

#### Why is the Shopify > Products section showing the one-time add-on product as a subscription item?

Shopify shows a one-time add-on product as a subscription product because when we add a one-time add-on to a subscription, we add it as a subscription item itself, and remove it once the order is processed.

#### How to create a Cancellation Reason visible only in the Admin Portal (not visible to customers)?

Here is how to create a cancellation reason visible only in the Admin Portal (not to customers)

1.  **Create a new cancellation reason** in Loop as you normally would.
    
2.  **Add a condition** for this reason using **“Customer Tag is present.”**
    
3.  Enter a **tag name that no customer has** (for example: `internal_only_reason` or any random tag).
    
4.  Because customers do not have this tag:
    
    *   **Customers will _not_ meet the condition**, so the reason will **not show up for them** in the customer portal.
        
    
5.  In the **admin portal**, conditions are ignored.
    
    *   This means the cancellation reason **will still appear for your internal team** when viewing or cancelling subscriptions from the Loop Admin.
        
    

#### Is it possible to fetch the subscription id on which the flow has been triggered, but the catch is flow is already deleted?

Yes, both the subscription logs in the subscription page and the subscription activity logs report will show the flow-triggered information for the deleted flow.

Only the Flow logs will have those logs removed since the flow is deleted.

* * *

# Streaks

#### Why is the streak limited to the first 5 orders only?

The Streak is limited to the first 5 orders only because the first 4–5 subscription cycles are crucial habit-building moments. After 5 orders, most customers who’ve consistently engaged are likely to have formed a routine, experienced product benefits, and become loyal users.  
Pushing the streak beyond this point may feel repetitive or transactional. Limiting it to 5 ensures the right balance between motivation and flexibility, without overburdening the most engaged subscribers.

#### Why am I not able to merge two subscriptions?

Please ensure that these two subscriptions are not enrolled in a Streak. To prevent loss of streak rewards, the system automatically restricts merging when:

*   The subscription is currently enrolled in a streak
    
*   The streak is still in progress
    

You will not see the merge subscription button on the subscription listing page for those subscriptions. Once the streak is completed, the subscription will automatically become eligible for merging again.

You can merge a subscription that was previously part of a streak once the streak is completed, using the following steps:

1.  Go to the subscription listing page
    
2.  Select the eligible subscriptions
    
3.  Click on the merge subscription button
    

The subscription becomes eligible for merging only after the streak is no longer in progress.

#### What happens if a streak is moved to "draft" or deleted?

**When a Streak is moved to Draft:**

All existing subscribers who are already enrolled in the streak will continue without any interruption. Their streak progress will remain intact, and they can proceed as usual.

**When a Streak is Deleted:**

The streak will immediately end for all existing subscribers. Customers will lose access to the streak, and their progress will stop.

**Recommendation**: If your goal is to phase out the streak for future use without impacting current customers or causing them to lose their progress, you can safely move the streak to the Draft status instead of deleting it.

#### How can we get data on the customers who have enrolled in streaks? We want to understand where they churn so we can improve on our streak offers.

For streak-related analytics, you can start by referring to the Streaks section, which shows key details such as how many users are enrolled and how many have succeeded or failed.

If you need a more detailed, user-level report, you can use Subscription Activity Logs. Apply a date filter (last 30–90 days, depending on your needs) and set the Entity filter to Loop Streaks. You can then export the data and filter by type to see different streak instances, such as enrolled, failed, and completed.

#### Why is my 'enrol existing subscription' section inside streaks coming out to be grey even though I have permissions to edit it?

When Subscriptions are already enrolled on the streak, always check bulk actions. Once subscriptions are enrolled, they cannot be re-enrolled or unenrolled. As a result, the checkbox and input fields are automatically disabled. This is expected behaviour and not related to any permission issue.

* * *

# Quick Actions

#### What is the basic difference between Quick Actions and Campaigns generated via Loop when it comes to prompting customers to visit the portal to update failed payments and offering incentives?

The key differences between Event (Quick) Actions and Campaigns in Loop are as follows:

*   **Event (Quick) Actions**: Notifications are automatically triggered by Loop when a specific event occurs, such as a payment failure. If Quick Actions are enabled and embedded within Loop notifications, they are sent automatically whenever an order fails due to a payment issue. This is a real-time, event-driven approach.
    
*   **Campaigns**: Campaigns are manual or scheduled outreach efforts. You can use a CSV of affected contracts and run campaigns through tools like Klaviyo to send emails to customers at a chosen time. This approach is typically used for past events, where the payment failure has already occurred, and you want to notify a group of customers in bulk.
    

In both Quick Actions and Campaigns, you can configure a discount to be applied when a customer updates their payment method. The purpose of this incentive is to encourage customers to update their payment details, reactivate their subscription, and ensure continued revenue for the merchant.

* * *

Related Articles

[

Streaks

](https://help.loopwork.co/en/articles/12703384-streaks)[

Flows

](https://help.loopwork.co/en/articles/12708285-flows)[

Gift subscriptions

](https://help.loopwork.co/en/articles/12729851-gift-subscriptions)[

Kaching bundles

](https://help.loopwork.co/en/articles/12745875-kaching-bundles)[

Settings FAQs

](https://help.loopwork.co/en/articles/12858166-settings-faqs)
