---
title: "Migration FAQs"
source_url: "https://help.loopwork.co/en/articles/12858126-migration-faqs"
collection: "15-faq"
scraped_at: "2026-03-30T17:43:24.249Z"
tags: ["15-faq"]
---



# Migration overview

#### Can I migrate my subscriptions myself?

Yes, we have a built-in migration utility in the app, which allows you to migrate yourself. ([reference](https://intercom.help/loop-subscriptions/en/articles/12742349-loop-migration-process))

#### Do my customers need to do anything during the migration process?

1.  **If you are moving from another app to Loop on your existing store**, there is nothing that your customers need to do on their end. They won’t even notice the switch 🙂. Subscription login is seamless through the app's [magic link](https://intercom.help/loop-subscriptions/en/articles/12707618-customer-portal) functionality. When migrating from non-Shopify platforms like WooCommerce, your customers might need to activate their Shopify account from their email (optional - for when you want customers to log in to their Shopify account to manage their **orders**).
    
2.  **If you are moving your existing Shopify store to another one and wish to continue using Loop** in the same way you were using it on the old store, you'll be required to ask all your customers to update their payment information. This is a non-avoidable situation.
    

#### Should I set up integrations before or after migration?

Please ensure that you have all your marketing/notification integrations **disconnected** on your old platform to avoid any notifications being triggered from these third-party providers.

#### Is it necessary that I use one of the supported payment providers?

Yes, as a native subscription app, we only support the payment providers that are supported by Shopify for subscriptions. Check [Shopify’s list](https://help.shopify.com/en/manual/products/purchase-options/subscriptions/setup#eligibility-requirements) of eligible payment providers for more details.

#### Which platforms are supported for subscription migration?

Almost all subscription platforms/apps, including but not limited to Recharge, Smartrr, Bold, Skio, and Seal, are supported. We also support migrating from any non-Shopify platform, like WooCommerce, BigCommerce, or Salesforce, as long as they can provide us with the required data.

#### What are the details about merging 2 Loop stores into one?

Two Loop accounts cannot be directly merged. However, you can migrate subscription data from one account (Store 2) into another (Store 1) if compatible conditions are met.

1.  The second store (Store 2) is treated as a custom subscription app platform, and its data is migrated into the primary store (Store 1). This process depends on the payment service provider (PSP) used.
    
2.  Migration is supported when the PSP is Stripe or Auth. For other PSPs, feasibility must be confirmed with the Migration Team.
    
3.  All credit card information from Store 2 is automatically transferred to Store 1 via Shopify.
    
4.  No, order history, analytics, and similar data will not carry over during the migration.
    
5.  You must provide the new variant IDs for products in Store 2. These IDs are required for precise product mapping in the migration process.
    
6.  You also need to confirm the payment service provider currently used in your store and share new variant IDs so the Migration Team can go ahead.
    

#### Why is my store migration delayed? I booked a migration and would like to get an earlier date and expedite it.

Since migration involves handling highly sensitive data, we follow a strict Standard Operating Procedure (SOP) to ensure every step is completed with accuracy and security.  
​  
​**Before we proceed, it would be helpful:**

1.  If you could share an export of the data, and
    
2.  ensure that our team has collaborative access to your store.  
    ​_This will allow us to immediately plan and begin our pre-checks._
    

Additionally, please note that we might reach out to clarify any questions that come up if we identify any data anomalies during the validation process.  
​  
​**To give you a clear picture of what the process involves:**

1.  Migration requires careful handling due to the sensitivity of the data.
    
2.  Even when everything seems ready, our team double-checks each step to ensure accuracy and prevent errors.
    
3.  The process cannot be completed within a single day because of its complexity and verification requirements.
    
4.  Typically, migration takes around 3 to 7 working days to complete.
    
5.  This duration allows us to perform both manual reviews and technical validations for data accuracy.
    
6.  The final import to Loop is executed only after all checks pass successfully through our Migration Engine.
    
7.  These steps are essential to maintain data integrity and deliver an error-free migration experience.
    

We truly understand the urgency and appreciate your patience as we follow this process to ensure a secure and seamless experience.  
​  
Data format here: [https://help.loopwork.co/en/articles/12742349-loop-migration-process](https://help.loopwork.co/en/articles/12742349-loop-migration-process) \[data format\]

#### Why are we not seeing billing addresses after migration?

We don't migrate billing addresses as part of the migration because we focus only on subscription addresses at the subscription contract level. The payment token should have a billing address already.

#### Do you migrate historical Analytics data in Loop post migration from one app to Loop? Is it feasible to backfill historical data into Loop Analytics?

Loop can only process and report on orders that are created through Loop itself. During migration, we import subscription-level state, not historical order activity. At present, we do not migrate:

*   Historical orders
    
*   Detailed pre-migration lifecycle events (skips, resumes, address/payment changes, discount history)
    
*   Historical revenue/LTV or revenue-based cohorts
    

We have not migrated historical data for any merchant so far and will be looking for ways to make it possible in future.

#### Is it possible to migrate my Shopify store using Loop to another Shopify store?

Yes, it is possible to migrate your current Shopify store using Loop to another Shopify store using Loop, you'll need to ask all your customers to update the payment information. Here is how it works:

1.  We'll initiate migration from the old store to the new store on the date your migration is scheduled.
    
2.  The migration will happen on bogus payment tokens - something we'll take care of.
    
3.  Once migrated, you'll start getting new subscribers on your new store; however, regarding the old customers, since Shopify does not allow movement of payment tokens, you'll be required to ask all your customers to update their payment details.
    

Step 3 is definitely a concern for you as well as us. The success rate for this particular scenario is approximately 30%, meaning only 30 of your 100 customers will update their payment details.

#### Managing Delivery Frequencies in Subscription Selling Plans after Migration

When migrating subscriptions to the Loop platform, customers may notice changes in delivery frequency options for their subscription-selling plans. This article explains why this occurs and how to manage delivery frequencies going forward.

**Why Do Delivery Frequencies Disappear After Migration?**

If your subscriptions were migrated into Loop, legacy delivery frequencies tied to those subscriptions are not automatically recreated as options within your selling plans. These legacy intervals do not appear in the current selling plans because they were not newly created post‑migration. Importantly, these changes occur by design and are not the result of manual deletions. To restore these options, you need to manually add the desired frequencies via **Acquire > Selling Plans**.

**How to Restore Legacy Delivery Frequencies:**

1.  Navigate to **Acquire > Selling Plans** in your Loop dashboard.
    
2.  Identify and manually add the specific delivery frequencies that customers expect to use.
    

Can I Add New Delivery Frequencies Now?

Yes. You can add new delivery frequencies to your selling plans, even during ongoing subscription migration processes. Any new frequencies you create will automatically be available to customers creating new subscriptions moving forward. This ensures you can maintain flexibility and address customer needs without waiting for the migration process to complete.

Steps to Add New Delivery Frequencies:

1.  Go to **Acquire > Selling Plans** in the Loop dashboard.
    
2.  Click on the option to add a new delivery frequency.
    
3.  Choose the desired frequency (e.g., weekly, bi-weekly, monthly, etc.) and save your changes.
    

Key Takeaways:

*   Legacy delivery frequencies tied to subscription migrations are not automatically carried over into new selling plans. They must be manually recreated if required.
    
*   New delivery frequencies can be added at any time, including during migration processes, for immediate availability to new subscribers.
    
*   Always review your selling plans after migration to ensure all necessary delivery options are active.
    

* * *

Related Articles

[

Import from PayPal Express

](https://help.loopwork.co/en/articles/12691686-import-from-paypal-express)[

Getting started with Loop

](https://help.loopwork.co/en/articles/12703816-getting-started-with-loop)[

Loop migration process

](https://help.loopwork.co/en/articles/12742349-loop-migration-process)[

Subscriptions migration

](https://help.loopwork.co/en/articles/12744856-subscriptions-migration)[

General FAQs

](https://help.loopwork.co/en/articles/12858117-general-faqs)
