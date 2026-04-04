---
title: "Postscript"
source_url: "https://help.loopwork.co/en/articles/12741562-postscript"
collection: "11-integrations"
scraped_at: "2026-03-30T17:43:19.214Z"
tags: ["11-integrations"]
---

Learn how to integrate Postscript with Loop to automate SMS notifications, target subscribers effectively, and enhance engagement through personalized subscription updates.

Postscript is a premier SMS marketing platform tailored for Shopify merchants. It offers tools for relationship-building, customer engagement, and achieving impressive ROI. Deeply integrated with Shopify, it's trusted by over 10,000 brands to transform conversations into conversions.

By integrating Loop Subscriptions with Post Script, you can set up transactional journeys to send SMS messages to your subscribers, and you can send one-click password-less links to allow subscribers to modify their subscriptions.

### Key features

*   **Set up automation flows** to notify customers about subscription events like Subscription started, Upcoming Order, Order Skipped, Payment Failed, Subscription Paused, Subscription Resumed, Subscription Cancelled etc.
    
*   **Target subscribers** by creating segments based on active subscriptions, products subscribed, cancelled subscriptions, and completed orders.
    

In this article, you'll learn how to integrate Postscript with Loop Subscriptions. Once you've connected your Postscript account, you'll be able to send Loop Subscription events on Postscript and trigger custom SMS flows and campaigns.  
​

Postscript integration is available exclusively on the Loop Pro plan.

* * *

# Loop data synced with Postscript

Loop Subscription events which are synced with Postscript and can be used to trigger Postscript Automations are:

**Event type**

**Description**

subscription\_created

New subscription is created

subscription\_paused

Subscription is paused

subscription\_resumed

Subscription is resumed

subscription\_cancelled

Subscription is cancelled

subscription\_reactivated

Subscription is reactivated

subscription\_expired

Subscription is expired

order\_upcoming

Upcoming recurring order reminder

order\_skipped

Order skipped

order\_out\_of\_stock

Order delayed/skipped out of stock

order\_processed

Order processed successfully

order\_partially\_processed

Order partially processed

payment\_attempt\_failed\_with\_retries\_left

Payment failed with retries left

payment\_attempt\_failed\_last\_retry\_left

Payment failed with only 1 retry left

payment\_attempt\_failed

Payment failed with no retries left

payment\_method\_expiring\_soon

Payment method expiring

flow\_completed

Loop flow executed successfully

customer\_activation

Customer created subscription but have not created the customer account yet

**Customer Properties:** Loop updates the subscription-related properties for Postscript subscribers which can be used for segmentation and filtering. For example, subscribers having at least one active Loop subscription.

# Setting up Postscript integration

To connect with Postscript, please navigate to your [Postscript account](https://app.postscript.io/) and obtain the **Private API Key** by following below steps:

*   In the Postscript side menu, click on your Shop name and then select API.
    
*   Click on the **Create Security Key Pair** button and generate a new API key by confirming the action.
    
*   **Add a label** to the newly generated API key for future reference, eg - ‘Loop Integration’.
    
*   Click on the Show button in the **Private Key** column to reveal the key value. You will need to copy and paste it in the Postscript API Key section below.
    

Check out the image shown below, we've highlighted an example API Key.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812137542/2c6d33e8afd0586e032167602755/original?expires=1774894500&signature=f4fb610803fb326dbc20603353ac5eddc39bcb3a3fb250ab3f2e43bb2ba6029a&req=dSgmFMh9moRbW%2FMW1HO4zSDyNSFKpKPuQXSeekqYgRQdd79CLZ8YQ3bQFyba%0A91183IPEjKNjsqMVrOU%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812137542/2c6d33e8afd0586e032167602755/original?expires=1774894500&signature=f4fb610803fb326dbc20603353ac5eddc39bcb3a3fb250ab3f2e43bb2ba6029a&req=dSgmFMh9moRbW%2FMW1HO4zSDyNSFKpKPuQXSeekqYgRQdd79CLZ8YQ3bQFyba%0A91183IPEjKNjsqMVrOU%3D%0A)

Copy and paste the above key in the **Postscript API key** field in the **Set up Instructions** tab inside the Postscript Integration page on Loop and click on "**Connect**" button.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812137543/6439a66cbc9bce92056d200394d3/original?expires=1774894500&signature=d4fafcbd1678c5f273dd4eb1af28d5b0648abac5ce5a72e0d676ceba1d93502a&req=dSgmFMh9moRbWvMW1HO4zdKIr8RGwZuzhEGqKBncPekXm%2B1yw3%2Ft7UPdBSNH%0Aa%2FwG4vZqMYZv7f%2BUHM4%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812137543/6439a66cbc9bce92056d200394d3/original?expires=1774894500&signature=d4fafcbd1678c5f273dd4eb1af28d5b0648abac5ce5a72e0d676ceba1d93502a&req=dSgmFMh9moRbWvMW1HO4zdKIr8RGwZuzhEGqKBncPekXm%2B1yw3%2Ft7UPdBSNH%0Aa%2FwG4vZqMYZv7f%2BUHM4%3D%0A)

  
​

# Integration statistics

Once you have connected the Postscript account successfully, you can see the integration statistics having details of Loop events synced in a particular time period and if there has been any error occurred.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812137544/0045cc07b7a96383d01f16cb425d/original?expires=1774894500&signature=85384d50eefa635f17c0d249c3fa0e92445cf1272249b52edd29484fb2420f07&req=dSgmFMh9moRbXfMW1HO4zRAUPYKNDs4Z%2FDsAVwmg7BVQlxn5r%2FLA2CyJj0Yf%0ARgwHBS7qJ%2FYQDDoKNsk%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812137544/0045cc07b7a96383d01f16cb425d/original?expires=1774894500&signature=85384d50eefa635f17c0d249c3fa0e92445cf1272249b52edd29484fb2420f07&req=dSgmFMh9moRbXfMW1HO4zRAUPYKNDs4Z%2FDsAVwmg7BVQlxn5r%2FLA2CyJj0Yf%0ARgwHBS7qJ%2FYQDDoKNsk%3D%0A)

  
​

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#3645434646594442765a5959464159445d185559) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Customer email notifications

](https://help.loopwork.co/en/articles/12730180-customer-email-notifications)[

Attentive

](https://help.loopwork.co/en/articles/12741439-attentive)[

Omnisend

](https://help.loopwork.co/en/articles/12741473-omnisend)[

Sendlane

](https://help.loopwork.co/en/articles/12741759-sendlane)[

Bloomreach

](https://help.loopwork.co/en/articles/12741808-bloomreach)
