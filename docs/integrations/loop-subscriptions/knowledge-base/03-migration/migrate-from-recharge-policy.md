---
title: "Migrate from Recharge policy"
source_url: "https://help.loopwork.co/en/articles/12752667-migrate-from-recharge-policy"
collection: "03-migration"
scraped_at: "2026-03-30T17:43:22.163Z"
tags: ["03-migration"]
---

Learn how to migrate from Recharge Legacy to Loop using our white-glove service for a seamless, secure, and fully supported transition.

Migrating your subscription setup from Recharge Legacy to Loop is a smooth and fully supported process with our white glove migration service. In this article, you'll find everything you need to prepare for migration, including key pre-requisites, how to connect your payment provider to Shopify, the step-by-step Recharge migration process, and a complete walkthrough of our white glove support.

* * *

# Prerequisites

Before initiating your Recharge Legacy migration, we need to ensure the following steps are completed.

*   **Loop widget is live** on your storefront, and the customer account page points to the Loop customer portal [guide](https://intercom.help/loop-subscriptions/en/articles/12729262-loop-widget-set-up).
    
*   **Payment provider used in Recharge** is also connected as a secondary provider in your Shopify store [guide](https://intercom.help/loop-subscriptions/en/articles/12745428-connect-secondary-payment-method-on-shopify-loop).
    
*   **Share your payment provider API token** with the Loop team. This enables us to securely fetch tokenized payment methods.
    
*   **Share your Recharge API key** with full write access to all scopes.
    

These steps are mandatory for Loop to successfully migrate and bill your subscriptions using the same stored payment methods.

  
​

# Connect payment provider to Shopify

To allow Loop to bill imported subscriptions using your existing payment provider, it must be added to Shopify as a **secondary payment provider** (unless already set as primary).

**Identify which payment provider you are currently using on Recharge**

**Identify your current payment provider**

In your Shopify admin, navigate to **Apps > Recharge > Settings > Payment.**  
​

The payment provider listed here (e.g., Stripe, [Authorize.net](https://authorize.net/), Braintree, or PayPal).

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1814606998/12ef811785cac84bb7b0c9c9c5d3/original?expires=1774894500&signature=36bb1a7e17465502019380ba35a39bceab7586bce044aefe3db6f037a4d2c5f7&req=dSgmEs9%2Bm4hWUfMW1HO4zZgd6p1vR7tyfqT26HK%2F9j5d3w%2FGPXVjuzoAmOUO%0AqgNTj72jFz%2B9V9MpJGI%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1814606998/12ef811785cac84bb7b0c9c9c5d3/original?expires=1774894500&signature=36bb1a7e17465502019380ba35a39bceab7586bce044aefe3db6f037a4d2c5f7&req=dSgmEs9%2Bm4hWUfMW1HO4zZgd6p1vR7tyfqT26HK%2F9j5d3w%2FGPXVjuzoAmOUO%0AqgNTj72jFz%2B9V9MpJGI%3D%0A)

  
​

# Connect the same provider in Shopify

Based on the Payment processor listed in your Recharge app → you would need to connect the appropriate payment provider to Shopify as secondary by [following this guide](https://intercom.help/loop-subscriptions/en/articles/12745428-connect-secondary-payment-method-on-shopify-loop).  
​

If you're using Stripe or Authorize as your primary gateway in Shopify and the same is used in Recharge, you don’t need to add it again as secondary.

  
​

# Share API tokens from the payment provider

Based on the payment provider that you have connected on your Recharge, the steps will vary. Follow the guides mentioned below to fetch the API tokens and share it with the Loop team.

1.  **Stripe:** Share your **Live Secret API Key** ([guide](https://support.stripe.com/questions/locate-api-keys-in-the-dashboard))  
    ​
    
2.  **Authorize:** Share the **API Login ID and Transaction Key**([guide](https://support.authorize.net/knowledgebase/article/000001271/en-us))  
    ​
    
3.  **Braintree:** Share the **Merchant ID, Public Key, and Private Key** ([guide](https://support.saasant.com/support/solutions/articles/14000129792-how-to-obtain-braintree-keys))  
    ​
    
4.  **PayPal:** Ensure that recurring billing is enabled and Paypal exports are shared ([guide](https://intercom.help/loop-subscriptions/en/articles/12691686-import-from-paypal-express))
    

For Braintree and PayPal - Recharge requires you to connect Braintree to the app. This means that the Loop team is able to fetch the required information directly from the Braintree API keys shared.  
​

# Migrate from Recharge Legacy

Once the prerequisites are completed, reach out to us and we’ll handle the rest. Email us at [\[email protected\]](/cdn-cgi/l/email-protection#f1828481819e8385b19d9e9e81869e839adf929e) or [\[email protected\]](/cdn-cgi/l/email-protection#0b66626c796a7f626465784b6764647b7c647960256864)

To understand more about the options you have while migrating to loop, refer to [this article](https://intercom.help/loop-subscriptions/en/articles/12742349-loop-migration-process).

Here is a quick email template to kick-start things if you have not been in touch with a team member from Loop already 😉  
​

**Subject line** : {Brand Name} Migration from Recharge Legacy -> Loop  
​  
​**Email content**  
​  
​**Source platform** - Recharge Legacy  
​  
​**Recharge API key** - {insert Recharge api token}  
​  
​**Payment platform API key** - {insert payment platform api token}

Our Onboarding/migrations team will get in touch with you shortly and suggest a few days as per the availability.  
​

# White glove migration walkthrough

**This section details the overall steps taken by the Loop team on the scheduled migration date.**

1.  Loop team will take an export from the Recharge API through the shared API tokens.  
    ​
    
2.  Once the data has been exported from the APIs, Loop team will convert it into the standard [migration data format](https://docs.google.com/spreadsheets/d/1H1qxGM9AWgbKFlnb6y0nypw0sws0XgMDPvyEnPPxQcA/edit?usp=sharing) of Loop.  
    ​
    
3.  Once the data has been fetched from Recharge, the migration expert will begin the import at the scheduled time.  
    ​
    
4.  Post subscription migration completion, Loop team will proceed with actioning a bulk cancellation action on Recharge through their APIs ([reference](https://developer.rechargepayments.com/2021-11/subscriptions/subscriptions_cancel))  
    ​
    
5.  A detailed migration report ([reference](https://imgur.com/a/U2iXqXp)) will be shared with the merchant, along with a 1:1 mapping between the contracts in both platforms for easy review.  
    ​
    
6.  Merchant is then advised to do an overall review by spot checking a few contracts in between and ensuring data parity.  
    ​
    
7.  Loop team will wait to hear back on the data review and migration confirmation requested in (6) and any open points on the same.  
    ​
    

Step (4) ensures that no customer is doubly charged due to the subscription contract being active on both platforms.

  
If there are any **custom requirements** for the migration, like price update, variant swapping, bundle migration, prepaid subscriptions etc. The migration team would need to be **informed at least a week in advance** so that we can have this accommodated on our end.  
​

The migrated subscription count will be lower than the count reported in recharge. We group the contracts based on the charge ID property of Recharge to ensure that all products that are to be billed in the same charge are grouped the same in Loop. Reasoning → This is because each product that the customer is subscribed to is counted as an individual subscription by the Recharge system. Whereas a subscription can contain multiple products in Loop.

Recharge - 1 line item (variants/products) = 1 subscription. Loop - multiple line items (variants/products) in 1 subscription.

  
​

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#added8ddddc2dfd9edc1c2c2dddac2dfc683cec2) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Import from Stripe

](https://help.loopwork.co/en/articles/12700734-import-from-stripe)[

Loop migration process

](https://help.loopwork.co/en/articles/12742349-loop-migration-process)[

Payment migration

](https://help.loopwork.co/en/articles/12742688-payment-migration)[

Subscriptions migration

](https://help.loopwork.co/en/articles/12744856-subscriptions-migration)[

Migrate from Smartrr

](https://help.loopwork.co/en/articles/12745497-migrate-from-smartrr)
