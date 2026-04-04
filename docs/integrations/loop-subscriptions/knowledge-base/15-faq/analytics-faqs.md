---
title: "Analytics FAQs"
source_url: "https://help.loopwork.co/en/articles/12858129-analytics-faqs"
collection: "15-faq"
scraped_at: "2026-03-30T17:43:24.385Z"
tags: ["15-faq"]
---



# Analytics

#### What is the Cancellation log report?

This report gives a complete picture of how a subscription got cancelled:

Full cancellation flow journey for each subscription cancelled by the customer (benefit page viewed, reason chosen, treatment opted, offer viewed).

For subscriptions churning due to payment issues, you can view details like Payment in recovery status, Last payment attempted date, Payment failure reason, and Previous failed orders count.

We also show details on 0-day cancellation, Upcoming order cancellation, and cancellation source.

#### How do I see my Subscription Order Value?

Subscription Order Value can be called AOV - Average Order Value. You can find AOV in Analytics > Subscribers > Subscriber vs Non-Subscription Revenue > "Subscription Revenue %"

This number will also include shipping, discounts, and one-time add-ons.

#### Why do the numbers of new subscriptions differ between the Subscribers Report and the Subscription Summary Report in Loop for the same date?

The Subscriptions report's column - 'New subscription' reflects the total number of subscriptions created, while the Subscribers report's column - 'New subscriber' counts unique new subscribers. If existing subscribers create additional subscriptions, they will be included in the 'New subscriptions' count but not counted again as new subscribers, which can result in differences between reports.

#### How can I use Attempt contribution % in Payment analytics?

Attempt contribution % can be used to approximate subscriber distribution by geography. Brands can review this percentage in the Overview tab to compare payment activity across countries.

Payment analytics shows a country-wise payment distribution table that includes the attempt contribution %. This helps brands understand how payment attempts — and by extension subscribers — are distributed across different countries.

Recovered with Loop represents the total number of payments recovered using Loop, including recoveries through card updates and retry attempts. This single metric is shown consistently across Payment analytics.

Recovery data is shown in the Recovery tab as a contribution split between card-based recoveries and retry-based recoveries, along with the overall Recovered with Loop value to provide context on total recoveries.

#### How can I track subscriber acquisition rates by order number?

To track subscriber acquisition rates by order number, follow these steps:

1.  Go to **Analytics** in your Loop dashboard.
    
2.  Open the **Subscriber Acquisition** view.
    
3.  View the table where each row represents an **order number** (Order #1, Order #2, Order #3, etc.).
    
4.  For each order number, review:
    
    1.  **Acquired subscribers** – customers who started a subscription on that order.
        
    2.  **Non-subscribed customers** – total customers who placed that order without subscribing.
        
    3.  **Acquisition rate**, calculated as: _(Acquired subscribers ÷ Non-subscribed customers) × 100_
        
    

This view lets you compare both volume and conversion rate across different order numbers in one place.

#### Where can I see which order number drives the highest subscription conversions?

You can identify the highest-performing order number by:

1.  Opening the order–number–wise acquisition table in Analytics.
    
2.  Comparing acquisition rates across Order #1, Order #2, Order #3, and beyond.
    
3.  Evaluating both:
    
4.  The acquisition rate
    
5.  The customer volume at each order number
    

This helps determine whether subscriptions perform best at first purchase or during repeat orders.

#### Why is there a difference in non-subscribed customers in the acquisition tab and the non-subscription orders placed in the Revenue tab?

1.  **Acquisition Tab:** The data shown in the Acquisition tab follows a funnel-based view.
    
    1.  The Total non-subscribed customers represent customers who placed one-time (non-subscription) orders.
        
    2.  The Acquired subscribers count includes customers who were initially non-subscribers but later converted into subscribers.
        
    3.  When you subtract the acquired subscribers from the total non-subscribed customers, the remaining number represents the non-subscription orders placed, and this count matches the data shown under the Revenue tab.
        
    
2.  **Revenue Tab**: Additionally, under the Revenue tab, the non-subscription orders count also includes one-time orders placed by existing subscribers, not just orders from non-subscribed customers.
    

This is why the numbers may appear different at first glance, but they are consistent once the data logic is taken into account.

#### Why does the “Total subscription orders” metric increase by only 1, even when multiple subscriptions are created in a single checkout?

The “Total subscription orders” metric increases by only 1 because a single checkout order is counted as one subscription order, even if that checkout creates multiple subscriptions. This ensures the metric reflects the number of checkout orders rather than the number of subscriptions created from that order.

#### How do I track acquisition rate trends for a specific order number over time?

To track acquisition rate trends over time:

1.  Select an order number (for example, Order #1).
    
2.  Choose a time granularity (such as Daily).
    
3.  View the trend chart showing how the acquisition rate changes over time.
    

This allows you to monitor lifts or drops after changes to checkout, subscription widgets, offers, pricing, or campaigns.

#### How do I view the treatment-wise save rate for my store?

Please go to Loop> Analytics> Cancellations> Scroll down to reason-specific treatment saves. You can select the reason from the dropdown and adjust the charts frequency to day, week or month to view the data.

#### How can we see the specific renewal rate on any given day?

To see the specific renewal rate on any given day:

*   Go to Loop> Analytics
    
*   Click on the date field and select Custom.
    
*   Choose the desired date.
    
*   Scroll down to the subscriptions activity section and refer to the addition tab.
    

#### What information is available in the Subscriber Summary Report?

The Subscriber Summary Report shows subscriber counts across different lifecycle states. It includes Resumed Subscribers, Reactivated Subscribers, Paused Subscribers, Churned Subscribers, and Expired Subscribers, allowing brands to understand subscriber movement and retention trends.

#### Why do upcoming sales and recurring revenue not match?

The subscription revenue is actually the sum of recurring and checkout revenue

The Active MRR is the normalised monthly revenue (Total expected annual revenue/12).

To view the upcoming revenue, you can go to the orders dashboard in the Analytics tab and see the total upcoming orders. You can even select a custom date to view the upcoming order revenue for that particular period.

#### Is a Paused subscription counted in the Active Subscription in the retention cohort on the Analytics section?

Yes, a paused subscriber is an active subscriber, so a paused subscription is counted in the Analytics section > Cohorts.

#### What's the difference between the values "-" and "success" on Analytics?

In Analytics, when the value of Last payment status is -, it means that there has been no payment attempted by Loop yet on this subscription. This generally means that the second order has not yet been placed on the subscription.  
And "success" means that the last payment attempt was a success.

#### What is LTV in Analytics > Cohorts?

In Analytics, LTV for all cohorts is basically the total order value of all subscription orders.

Explaining LTV in general:

1.  The filter applied at the top of the LTV dashboard is for 'acquisition date'
    
    1.  **Acquisition Date** -> Customer Acquisition date at your Store - who haven't placed any orders in the past, not even one-time.
        
    2.  **Non Subscribers** -> New Customers, who place/acquire during that time period and place only one-time customers.
        
        *   **#1 Subscribers** -> New Customer who places/acquires during that time period, and the first order itself is a Subscription Order.
            
        *   **#2 Subscribers** -> Customers who place 1 order before and acquire as subscribers at the 2nd order during that time.
            
        *   **#3 Subscribers** -> Customers who place 2 orders before and acquire as subscribers at the 3rd order during that time.
            
        
    3.  Order #1 customers' LTV means how much the average customer who subscribed on their 1st order itself tends to spend in their lifetime.
        
    

#### How to read the graphs in Analytics > Payment Failures section?

In Analytics > Payment failure section, both graph means:

**Pie chart:  
​**It shows failure wise distribution of only those orders whose last attempt in the given duration is a failure.  
​**Bar graph:**  
It shows all failures in the given duration.

#### How can I export the subscriber data? I am willing to move to another subscription app.

You can export your data by going to: Loop > Analytics > Reports > Subscription; however, we suggest that you let us know what went wrong. We at Loop take feedback very seriously and try to work on all requested customisations possible.

#### Where can I view monthly subscription revenue?

To visit your subscription revenue details, go to Loop Admin > Analytics > Subscriptions, and there you'll find the option to view subscription revenue. You can apply the date filter according to your requirement.

#### How does Loop define/calculate the subscription cancellation rate? churn rate?

The subscriber churn rate is defined as the percentage of subscribers who cancelled their subscription over a period of time. You can find it in Loop > Analytics > Cancellation.  
​  
For the calculation of the Churn Rate for your store, you can use this formula:  
Churn Rate = cancellation in the specific month / (Total active before start of month + created in the month) \* 100

#### Is there a way to exclude the cancelled subscriptions from the analytics view? It's impacting the analytics reporting that we wish to see.

To exclude the cancelled subscriptions from Loop > Analytics > Subscriptions, you can click the 'Churned' button on the legend of the chart. That way, your remaining charts shall zoom out for better visibility.

#### How can we get a forecast of the next month's orders by product? (similar to the subscriber by product but for next month). We just had a bunch of orders come through from subscribers.

To know the next month's inventory forecast of orders by the products, please navigate to Analytics > Products > Inventory Forecast, and you can apply the date filter as needed.

#### What are the common retention strategies any merchant can follow?

Common retention strategies are mentioned below:

*   Payments:
    
    *   Set up payment retries
        
    *   Set up backup payments
        
    *   Use quick actions in payment failure emails
        
    
*   Churn:
    
    *   Set up the benefits page
        
    *   Set up reasons and treatments
        
    *   Create a cancellation offer
        
    *   Create a subscription journey
        
    

#### Where can I find the monthly sku velocity for Loop subscription orders?

To find the monthly sku velocity for Loop subscription orders.  
​  
Go to analytics->Products->Scroll down-select Acquisition date- Scroll down to Product-wise Acquisition. It will give you a product-wise snapshot of the selected period's activity.

#### Is there a way to check how many subscribers are visiting the customer portal?

Currently, checking how many subscribers are visiting the customer portal is not something we can show natively on the Loop app page. In case you require this information explicitly, we are happy to look into it. Kindly drop us an email with your requirement (subscription number, if any, and we'll look into it.

#### How are cancellations and payment sources shown in analytics?

In Analytics > Cancellation > Overview, the channel-wise cancellations pie chart includes clearer hover text and displays Cancelled Subscriptions and Cancelled MRR. In Payment Analytics > Overview, the Payment Source Distribution table shows an Attempt Contribution column, indicating the contribution of each payment source based on payment attempts.

#### How to check scheduled vs actual attempted orders?

The scheduled vs actual attempted orders mean 'realised orders', which is shown in the revenue realised under Loop > Analytics.

#### How are acquired subscribers and acquired MRR calculated on the analytics dashboard?

The calculation logic behind acquired subscribers and acquired MRR is as follows:

1.  **Acquired subscribers:** This is the count of customers who  
    became subscribers in that time period. (Buying their first  
    subscription on the store - no previous subscription orders on  
    Loop)
    
2.  **Acquired MRR**: This is the MRR based on the subscription they  
    were acquired on. One-time products from these orders are not  
    included while calculating this.
    

#### Is there any way to view a breakdown for acquired MRR based on (e.g. daily level, user-level, or subscription plan-level)?

As of now, a breakdown for acquired MRR based on (e.g., daily, user-level, or  
subscription plan-level) is not available in our dashboards.

#### Are there any filters, transformations, or exclusions applied in the  
dashboard that could affect the MRR or subscriber count?

There are no exclusions applied in the dashboard that could affect the MRR or subscriber count.

#### How is the monthly revenue derived for subscriptions with different billing intervals (e.g., 3 months, 1 month)?

The possible cases driving the monthly revenue for subscriptions based on interval types are:

*   Year based: Subscription price x (1/(12' Interval count))
    
*   Month-based: Subscription price x (1/ Interval count)
    
*   Week based: Subscription price x ((30/7) / Interval count)
    
*   Day-wise: Subscription price x (30/ Interval count)
    

#### Why don’t my latest subscriptions show up in Analytics immediately?

Analytics data in Loop may take up to 24 hours to fully sync and display in the dashboard. This delay happens because subscription and order data need to be processed and updated across all reports for accuracy.  
​  
If you don’t see your recent subscriptions after 24 hours, please reach out to the Loop Support Team for assistance.

#### What number and percentage % of new subscriptions each day are coming from existing customers and New customers?

To know the number and percentage % of new subscriptions each day that are coming from:

1.  For existing subscribers, you can check the acquisition tab in the subscriber analytics section
    
2.  New subscriptions can be seen on the home dashboard as well as in subscription analytics.
    

The only caveat is that certain new subscribers might create more than one subscription with a single checkout order (on different frequencies, etc)

#### How is AOV calculated in Loop, and how is it different from Shopify?

The difference is due to the way we calculate vs Shopify calculate AOV.  
​For any time period

*   **Loop AOV**: Sum of Order Total / Orders
    
*   **Shopify AOV**: (gross sales - discounts) / orders
    

Shopify does not include Shipping and Taxes in the AOV calculation

#### How can I see churn for a specific product during a date range?

To see churn for a product during retention, please see the following:  
​  
Product variant-wise cancellation data under Analytics > Products > Churn and retention.  
​  
If you want to export a report, you can download the same by following these steps: Analytics > Report > Product variant-wise cancellation

#### Could you please let me know what the subscription spent and remaining orders mean?

The 'subscription spent field' is the total amount spent on a specific subscription to date.  
The 'remaining orders' show the total number of orders a customer can have in that subscription

#### At what interval/duration or time does all Analytics data sync?

Regarding the synchronisation period onthe Analytics dashboard, there are multiple metrics available inside Analytics, and some of them are 'near real-time,' and some are periodic (on a daily basis).

1.  If you open any metric and go to Date Range and open the dropdown, you'll notice 2 things.
    
    1.  Few lists will have 'today' in the drop-down list.
        
    2.  If, 'today' is appearing in the date range, it's near real time; if today is not appearing in the list, its periodic 1-day basis.
        
    
2.  Near real-time means sometimes there can be a delay of minutes; it is a data sync.
    

The data refresh rate is primarily dependent on the Cache logic. So let's say if you are looking at the 'real-time Analytics' for the first time, it'll be most accurate, but if you want to see the data again, the recommendation is to wait for 30-60 minutes.  
​  
Usually, merchants look at the save rate this frequently, so this logic saves us from making the processes frequent and thus avoids the load on databases.

#### What is the definition of the following terms in analytics: \[Active subscribers, New subscribers, Activated subscribers, Deactivated subscribers\]?

*   **Active subscribers** - The # of subscribers with an ACTIVE subscription.
    
*   ​**New subscribers -** People who create a new subscription
    
*   **Activated subscribers -** Activated subscribers refer to customers who have an active subscription status.
    
*   **Deactivated subscribers -** Churned + subscribers who pause or cancel their subscription.
    

#### Does the subscription churn metric include cancellations?

Subscription churn metric in analytics takes checkout orders in consideration.

#### How can I check my upcoming subscription revenue?

The upcoming subscription revenue is shown on the home page under the upcoming sales, and it accommodates the 30 days by default.

#### How to find out the data of subscription cancellations that were initiated from the portal specifically?

Currently, cancellation logs do not include cancellations made through the Admin portal. Merchants have to run two separate reports to get the complete data on cancellations. Therefore, it may not be possible to directly track the number of subscription cancellations specifically from the portal without additional reporting capabilities being implemented

#### I would like to find out how many discount codes starting with "CC-" were added in a specific time frame, and what the discount value of these codes in total is.

To find out the total discounted amount based on the discount codes applied, you need to navigate to Loop > Analytics > Reports > 'Processed orders' > Add Filter > Discounts Added > filter with Prefix = CC

#### How do I find customers who have active subscriptions in Loop?

To find customers/subscribers with active subscriptions, please head over to Loop > Analytics > Reports > Subscribers, and apply the Active Subscriptions filter accordingly.

#### Why isn’t Google Shopping showing subscription pricing, and how do we fix it?

Google Shopping only pulls one-time product prices from Shopify, not subscription prices. To display subscription pricing, you'll need a feed app like Simprosys or DataFeedWatch.

* * *

# Reports

#### Does Loop offer an analytics-only mode that works on top of Shopify's native subscriptions?

At the moment, Loop does not support an analytics-only mode that works on top of Shopify’s native subscriptions. To access Loop’s analytics and reporting features, the subscriptions need to be managed through Loop using our selling plans and flows.

#### How to identify the subscriptions on which the streak program failed to complete?

Head to the Analytics > Reports > Subscription Activity Logs > Apply filter as - Entity > Loop streaks and another filter as Type: Streak\_Failed

#### How can I view the report for subscriptions with inactive product variants?

The inactive product variants report allows you to view all subscription lines that are linked to inactive product variants. This helps identify impacted subscriptions before taking corrective actions.

To view subscription lines with inactive product variants, you can open the **inactive products alert** and click **View report**. This action redirects them to the Subscribed products report with filters automatically applied to show only inactive product variants.

By viewing the filtered Subscribed products report, you can review all impacted subscription lines in advance. This enables informed decisions before running bulk actions such as swap or remove on inactive product variants.

#### Is there a way to get an export of all customers who have completed a specific quick action?

To get an export of all customers who have completed a specific quick action, please go to Loop > Analytics > Reports > Subscription activity logs > Apply filter: Entity = Loop quick actions & add type = action performed.

#### What is “Total subscription spent” in the Subscriptions report? How can I view the total subscription spent in the Subscriptions report?

Total subscription spent shows the cumulative amount a subscriber has spent on a subscription. This helps merchants understand long-term subscriber value directly from the Subscriptions report.

Total subscription spent can be used to analyse subscribers based on spend patterns, segment high-value subscribers, and define retention or cancellation-prevention thresholds based on historical subscription value.

To view total subscription spent, merchants can open the Subscriptions report, where a new column labelled Total subscription spent is available alongside existing subscription data.

#### How is the 'Attempted rate' calculated in the analytics dashboard?

The 'Attempted Rate' is calculated in the Analytics dashboard by (No of attempted orders / Total scheduled orders) \* 100

Attempted orders can be found by Scheduled Orders - all cancelled, paused, skipped, delayed, etc.

#### How can we find out the subscriptions in which one-time items were added via channel type - "Loop flows"?

For existing subscriptions, we have reports that can help you identify products that are being added as one-time items in subscriptions.

*   Navigate to Analytics > Reports > Subscribed Products, then apply the filter “Is product one-time added: True.”
    

You can also apply a filter for the subscribed products to find a specific sku.

However, for Flows specifically, please go to report: Subscription Activity Logs, and apply filters:

*   Source = System
    
*   Entity = Loop Flows
    
*   Type = product\_added\_onetime
    
*   Dates - if needed
    

#### How can we see analytics for when people cancel at each frequency? (e.g. the average days at which order 1 cancels, the average days in which people cancel before order 2)

To get a report for the average days at which orders get cancelled, there is no out-of-the-box report, but here is a workaround:

1.  Go to Analytics > Reports > Subscriptions.
    
2.  Apply the filter Status = Cancelled → this will give you all cancelled subscriptions.
    
3.  Use the filter Orders completed till date → this will tell you the order number at which the subscription was cancelled. For example, set it to 1 to get all cancellations after the first order, 2 for cancellations after the second order, and so on.
    
4.  Use the filters Order created at and Order cancelled at: Order created at → when the customer started that orderOrder cancelled at → when the customer actually cancelled
    
5.  Calculate Days Stayed for each order using the formula:{Days Stayed} = {Order cancelled at} - {Order created at}\]
    
6.  After calculating Days Stayed for all cancelled orders at that order number, take the average → this gives you the average days at which subscribers cancel that order.
    
7.  Repeat this process for each order number by using the filter order completed till date (1, 2, 3, …) to get a full picture of cancellations across all orders.
    

#### How can I see the 0-day cancellation % per product?

To check 0 day cancellation percentage per product, you can go to Loop> Analytics> Cancellation and refer to 0-day cancellation. However, to see the same data per product, you can go to Loop> Analytics> Reports> Cancellation logs and set the "O day cancellation" filter as True and refer to the Product column.

#### How can I view a report that gives me an idea of the subscriptions that may fail due to payment method expiring?

The "Upcoming order" report would be the most suitable one in this case. You can view the upcoming orders for up to 90 days, and it has a filter of "payment method status" which enables you to exclude the subscription whose payment methods are "Expiring soon".

You can view this report by going to Loop> Analytics> Upcoming Orders.

#### In the "Subscribed products" report, I currently only see the subscriptions and the date for the immediate next order. I'm looking for a way to also view all upcoming order dates for these subscriptions, along with the quantities scheduled for each of those future orders. How to include the number of products reserved for subscriptions?

To find the number of products reserved for subscriptions, please follow the steps below:

1.  Go to Loop > Analytics > Reports
    
2.  Open the Upcoming Orders report
    
3.  Set a custom date range based on your preference
    
4.  Ensure that "Products" is selected in the columns
    
5.  Export the report as an Excel file
    

Once exported, you’ll be able to view and analyse the number of products reserved for upcoming subscription orders

#### We are using customer tags within the flows. Can you tell me which reports I can access and filter by tags?

To access tags-based subscription reports and filter Subscriptions with tags, please go to Analytics > reports > subscribers > now you can add columns of "customer tags" in this report.

#### Is there a way to see that, when and how much credit merchants added from their end to which customer accounts?

To check when and how much credit the merchant added from their end to customer accounts, please go to:-

*   Loop > Analytics > Reports > Select Prepaid Credit Transactions > filter by Event Type = Manual adjustment
    
*   Then go to Subscription Activity report and filter by Type = prepaidCreditsAdjusted
    

#### How can I pull all active subscription customers into one email list to email them all the same email/notification?

You can follow these steps to view the active subscriptions:

1.  Navigate to Loop > Analytics > Reports.
    
2.  Click on the Subscriptions tab.
    
3.  Apply the Active filter to view only the active subscriptions.
    
4.  Once filtered, you can refer to the Email ID column for the subscriber details.
    

#### How can we filter active subscriptions that are based on the old default variant ID: 41946595393601 (which no longer exists)?

To filter your subscription data for the old variant ID, please follow these steps:

1.  Export your subscription data:
    
2.  Go to Loop App → Analytics → Reports → Subscriptions.
    
3.  Filter by ‘Subscribed products’ = \[Old Product Name\] and export the list.
    

#### How can I check inactive products and get a report directly from Loop?

You can easily extract the list of inactive products from the Loop App using the steps below:

1.  Go to Alert Centre → View Details → Inactive Products — here you’ll see a full list of all inactive products.
    
2.  To get a detailed report for these products, go to Loop App → Analytics → Reports → Subscriptions.
    
3.  Use the ‘Subscribed Products’ filter to select each inactive product and export the data as needed.
    

#### Is there a way for us to be able to determine how many active subscribers are subscribed to a particular bundle?

To view Products assigned to a bundle, you need to go to Loop> Analytics> Reports> Subscribed Products> Apply filter of Plan Name> Select the bundle name and click filter.

#### Is there any way to track the subscriptions that are coming from Meta or Google Ads?

We show the subscriptions coming from Meta or Google ads in the Custom attributes section of the reports:

*   Head to Analytics > Reports > Subscriptions > Select column: Custom Attributes and look out for the source.
    

There, you can get an idea if the customer has purchased the subscription from facebook add or google

#### How to check the payment processor for a particular subscription?

To check the payment processor for a particular subscription, please go to loop admin portal > Analytics> Reports> Transaction Summary

#### How can I find subscriptions changed their status by Loop Dunning (Paused, Cancelled)?

You can find subscriptions changed their status by Loop Dunning by navigating to:

*   Loop App → Analytics → Reports → Subscription Activity Logs.
    
*   From there: Select the required time range.
    
*   Apply the appropriate filters based on the action you’re looking for:
    
    *   Type → Choose the relevant action (e.g., Subscription Paused, Subscription Cancelled, etc.)
        
    *   Entity → Select the source of the action Loop\_Dunning.
        
    
*   The report will display all matching subscription activity.
    
*   Click Export to download the data if needed.
    

#### How to run a report to filter our subscribers by the country of the USA?

To find a subscription by location, please go to Loop > Analytics > Reports > Subscriptions > Columns > Delivery country

#### How can I find all subscriptions that had a failed order due to the following error: inventory\_allocations\_not\_found?

To find subscriptions that have a failed order with a specific error, please go to Analytics > Reports > Subscriptions > and apply the filter: Payment Failure reason

#### How to create a report that includes the orders created via API?

To create a report where the API was involved in creating orders, here’s what you can do:

1.  Go to the Loop Admin Portal
    
2.  Navigate to Analytics > Reports
    
3.  Open Subscription Activity Logs
    
4.  Apply a filter for Source and select API
    
5.  Apply another filter for Type and select Order Created
    

#### How do I find out customer IDs who took an action between a time period, for example, the people who delayed the orders between a time period?

To find customers with their customer IDs that took an action like 'Delay an order' between a time period, you can go to 'Subscription Activity Logs' under Analytics > Reports and then apply the filter called 'Type' for the action type. Once you have the filter done, please export this report and then compare it using the vlookup formula in Excel with a Subscription report.  
It shall give you the desired data.

#### How do I see the customers who accepted the offer on a campaign?

You can find customers who accepted the offer in the campaign by going to Loop > Analytics > Reports > Subscription Activity Logs. Please apply the relevant filters and review the attributes in the Data column. Also, make sure to adjust the Created At date to show results from a specific date onwards.

#### How to export a report of cancelled and paused subscriptions?

To export all the customers that have cancelled/paused their subscription, please do the following:  
Loop Admin > Analytics >Reports > Subscription. (Add filter Status = Pause and Cancelled). Then export the report.

#### What is the easy way to calculate the actual retention, because some people had to drop off because of the payment processing or the delay in their order?

The easy way to calculate the actual retention is:

1.  Go to **Loop Analytics > Reports > Subscribed Products > Filter by the specific selling plan**
    
2.  Export the report (This will give you a list of all subscriptions under that plan, including statuses.)
    
3.  Export the subscription list (if you need payment details or other info). This gives additional fields like payment status, etc.
    
4.  Combine the reports
    
5.  Use VLOOKUP (or XLOOKUP) in Excel/Sheets to match subscriptions with their payment/status details.
    

#### How do I find out the impacted subscriptions where a selling plan has been deleted and a flow was involved?

To identify the impacted subscriptions where a selling plan was deleted and a flow was involved, you will need to export two separate reports and compare them.

Steps to export the reports:

1.  Navigate to Analytics → Subscribed Products, then apply the filter Plan name → Deleted plan. This will fetch the subscription IDs associated with the deleted plan.
    
2.  Go to Analytics → Subscription Activity Logs and apply the filter Type → Flow triggered. This will fetch the subscription IDs where flows were applied.
    

Once both reports are exported, you can use a VLOOKUP (or similar matching function) to compare the data and filter out the impacted subscriptions.

#### Is there any way to get the information on how many subscriptions were added/sold via the different sources (Upsell Profile, Quick Actions)?

We at Loop have started upselling performance data from March 10, 2025, so the reports won’t include anything before that date.  
However, there’s a workaround for Upsell > Added. Here’s how you can view it:

1.  Go to Analytics > Reports > Subscription Activity Logs
    
2.  Apply a Date filter
    
3.  Apply a Type filter and select Product Added
    
4.  Apply a Source filter and select Customer Portal
    
5.  This will give you the view you’re looking for
    

#### How to extract the data of each product that was sold, along with the quantity?  
(We are trying to understand how much of each product we need to prepare without manually looking at all orders in Shopify)

To access the report, which shows you the products that were sold in the subscription, please go to Analytics > Reports > "Subscriber Distribution by Product". There, you will be able to see how many subscribers have subscribed to each specific product and the quantity subscribed for each.

#### How to find the report for the total payment attempted and payment realised?

To fetch the report for the total payment attempted in the last x days, head to the Analytics > Reports > Transactions logs > apply filter as "status" - Success + failed  
​  
Similarly, to check how much payment was realised out of the total payment attempts, just remove the filter "status" = failed and select "success" only, and it will show all the transactions that were successfully realised for the subscriptions.

#### How can we see the subscriptions that were auto-resumed on a particular day from the report?

To see the subscriptions that were auto-resumed on a particular day, you can utilise the "Subscription activity logs" report. This report will allow you to track the reactivated subscriptions within the specified date period you are interested in. You may need to filter the logs to identify the specific date you are looking for.

#### Where do I find the next order date for a specific subscription, along with the amount associated with that upcoming order?

To view the amount and date of upcoming orders, please navigate to Reports > Analytics > Upcoming Orders. You can apply the filter "Next order to be placed at" and select a preferred upcoming order date. For subscription amounts, please refer to the columns labelled "Product Price" and "Discounted Price."

#### How do I understand the forecast- revenue report?

The forecast revenue report located at Analytics > Orders is simply a calculation of queued up charges and is only built based on the upcoming orders that are to be processed in the time frame. This doesn't account for the cancellation rates, but only dunning vs non-dunning.

#### How to fetch a report where I can see the % of churn for the subscribers, per month, on a time period of 12 months?

To create a report showing the percentage of churn for subscribers per month over 12 months, you can use the Cohort analytics feature.

Here’s how you can do it:

1.  **Access Cohort Analytics:** Navigate to the Cohort Analytics dashboard in your analytics section.
    
2.  **Set Time Range:** Use the time range filter to set the period to the last 12 months.
    
3.  **Select Metrics**: Look for metrics related to churn and retention. You can track cohort retention and churn across the specified time frame.
    
4.  **Analyse Data**: You can analyse customer behaviour at both monthly and order-level precision, which will help you understand how subscribers behave over time and identify churn patterns.
    

This will allow you to see the percentage of subscribers who remain active each month and help you evaluate churn trends effectively

#### How can we find the subscriptions that were auto-resumed on a particular day from the Subscription Activity Log?

We can find the subscriptions that were auto-resumed on a particular day from the Subscription Activity Log:  
​  
​**Steps**: Loop Admin > Reports > Subscription Activity log > Filter through date and add filter (Type=Subscription Resumed)

#### Do the Loop analytics reports only include revenue from 'paid' orders, or if it also include revenue from 'partially\_paid', 'pending', 'refunded', and 'partially\_refunded' orders?

Loop only includes revenue from 'paid' orders, and refunds or post-order adjustments are not included in the revenue calculation.

#### Is there a way to generate which discount codes were active for each subscription before the changes made on a date?

Please go to Analytics > Reports > Processed orders > and apply the relevant filters along with the date. The columns 'Discounts Added' & 'Subscription ID' should be available while looking for the historical discount codes that have now been deleted.

#### Why does the 'Total Revenue' from subscription orders in the Loop report differ greatly from the Shopify data?

Loop report displays total subscription revenue rather than contract-based revenue, and the Shopify and Loop data are actually quite similar when looking at the product-level data. Additionally, one-time revenue is not considered in Subscription revenue in Loop.

#### How can I get product-wise subscriber cancellation reports that clicked a reason?

To get product-wise subscriber cancellation reports, please go to Analytics → Reports → Subscribers. Apply a filter for the specific product you want to review, then set the Subscriber Status filter to Inactive.

This will show all subscribers who no longer have an active subscription and who were previously associated with that product.

To find the reason for churn by Product, you can go to the Cancellation log and apply the filter:

*   Cancellation reason
    
*   Cancellation action
    

The same report has a column for Products as well.

#### Why does the recurring revenue show a major drop (red indicator) in today's performance?

The metric compares today’s recurring revenue at the current time against the same time yesterday. This does not mean your overall recurring revenue has decreased - it's just that today’s orders, at the same time, which were placed yesterday, simply haven’t been placed today yet. Since this falls under today’s live Performance analytics, the numbers will update and improve as orders come in throughout the day.

* * *

Related Articles

[

Mystery rewards

](https://help.loopwork.co/en/articles/12709937-mystery-rewards)[

Subscriber analytics

](https://help.loopwork.co/en/articles/12741639-subscriber-analytics)[

Cohort analytics

](https://help.loopwork.co/en/articles/12741718-cohort-analytics)[

Cancellation analytics

](https://help.loopwork.co/en/articles/12742113-cancellation-analytics)[

Reports

](https://help.loopwork.co/en/articles/12742177-reports)
