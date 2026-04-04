---
title: "Import from PayPal Express"
source_url: "https://help.loopwork.co/en/articles/12691686-import-from-paypal-express"
collection: "03-migration"
scraped_at: "2026-03-30T17:43:22.157Z"
tags: ["03-migration"]
---

Learn how to migrate customer payment details from PayPal Express to Shopify and Loop for a seamless, secure subscription transition.

If you’re migrating to Loop from a platform using PayPal Express, this guide helps you securely import customer payment details into Shopify. By connecting PayPal Express and using Loop’s migration utility, you can map payment methods without needing customers to re-enter card info. Once done, you can create and manage subscriptions directly in the Loop app, ensuring a smooth, hassle-free transition.

* * *

# Prerequisites for customer migration from PayPal express

#### Before setting up the process, we need to make sure these things are in place.

*   You must have an active PayPal Express account having customer payment methods which needs to be migrated.
    
*   You would need to export the customer and payment data from your PayPal account
    
*   You would need to setup and enable PayPal Express checkout (with same account credentials you are transferring from) on your Shopify store.
    

**Learn more:** [Shopify eligibility](https://help.shopify.com/en/manual/products/subscriptions/setup?shpxid=0b3889f0-B2A6-4D8D-6D24-FAA89EF7C3DD#eligibility-requirements)

# Import customer data in Shopify

Before proceeding to migrate customer payment methods from PayPal Express, you can import the customer's basic data like name, email, and addresses using Shopify's native import tool available on the customer's page in your Shopify account.

Navigate to **Shopify Admin > Customers > Import.**  
​

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1803273167/766a11e2420bec61f581f0d153e2/screenshot-2025-06-20-at-45549_1c50tc3.png?expires=1774894500&signature=43677f928d33d385c1e07cc51aeb70766a08e7c617dd8b296024a74bd152c56f&req=dSgnFct5noBZXvMW1HO4zd5oCSlc%2BFVs4L4gL%2FQOXFRkNOC%2FvNjOWeXfMPG0%0AsvVsupdLpMWlnvIAp3M%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1803273167/766a11e2420bec61f581f0d153e2/screenshot-2025-06-20-at-45549_1c50tc3.png?expires=1774894500&signature=43677f928d33d385c1e07cc51aeb70766a08e7c617dd8b296024a74bd152c56f&req=dSgnFct5noBZXvMW1HO4zd5oCSlc%2BFVs4L4gL%2FQOXFRkNOC%2FvNjOWeXfMPG0%0AsvVsupdLpMWlnvIAp3M%3D%0A)

#### **This step is optional if:**

*   Your customers already exist in Shopify, or
    
*   You plan to use Loop’s customer migration utility (which includes name and email).  
    ​
    

# Loop customer migration utility

To streamline the migration process and easier to understand, we have made a customer migration utility inside the Loop app. Detailed instructions have been provided below to help you with the migration process.

Accessing the customer migration utility

**Follow these steps to complete the process.**

1.  Navigate to **Loop Admin > Settings > Migrate Customers and Payment Methods**
    
2.  Select Paypal Express from the payment provider dropdown.
    
3.  Ensure PayPal Express is connected as a payment gateway on your Shopify store. This must be the same account that holds the customer data you're migrating.
    

To streamline the migration process and easier to understand, we have made a customer migration utility inside the Loop app. Detailed instructions have been provided below to help you with the migration process.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1803286136/19d3e1828279c84f23fd466b644f/screenshot-2025-06-20-at-50358_wid0ei.png?expires=1774894500&signature=d75ffe9d094681c0dc4eff231df2270bb550aaff15e469f6a9ce2e0fe4630fc0&req=dSgnFct2m4BcX%2FMW1HO4zSmtW8ayvap%2BuVyIwA2B6N70%2BlsX1ySw3Ipuemel%0AXq%2FvUyDaxo0t3I4FEPI%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1803286136/19d3e1828279c84f23fd466b644f/screenshot-2025-06-20-at-50358_wid0ei.png?expires=1774894500&signature=d75ffe9d094681c0dc4eff231df2270bb550aaff15e469f6a9ce2e0fe4630fc0&req=dSgnFct2m4BcX%2FMW1HO4zSmtW8ayvap%2BuVyIwA2B6N70%2BlsX1ySw3Ipuemel%0AXq%2FvUyDaxo0t3I4FEPI%3D%0A)

Enabling PayPal Express on your Shopify store

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1803286931/9b4c2f11b6ea4c585f2adf30610e/a3367f1a-2fae-42fb-a63d-e6434b_211oic.png?expires=1774894500&signature=781191a9df4315ffca1e39c99dfb527c02447427dd7c9f5b869f3b2acf78ba28&req=dSgnFct2m4hcWPMW1HO4zRgeh%2FRo9eEHwqEY88xLAVwd0LtStMs1erMx1c%2By%0AhlIq4Y3g2jr5LOV4PgI%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1803286931/9b4c2f11b6ea4c585f2adf30610e/a3367f1a-2fae-42fb-a63d-e6434b_211oic.png?expires=1774894500&signature=781191a9df4315ffca1e39c99dfb527c02447427dd7c9f5b869f3b2acf78ba28&req=dSgnFct2m4hcWPMW1HO4zRgeh%2FRo9eEHwqEY88xLAVwd0LtStMs1erMx1c%2By%0AhlIq4Y3g2jr5LOV4PgI%3D%0A)

**To enable PayPal Express for subscriptions, follow these steps to complete the process.**

1.  Configure PayPal Express payment gateway for your store.
    
2.  Create at least one selling plan.
    

Once you have done these steps, Shopify will automatically submit your store for approval to PayPal and send you an email with more info about the same. After this, you just need to wait for a day or two and you will either be notified of the approval or request to share more info about your store.

  
​

# Export customer data from PayPal Express

Once you have connected your PayPal Express account to Shopify, you'll need to export your customer and payments data from PayPal Express.

Follow these steps to complete the process.

1.  Login to your PayPal account and go to All reports under the **Activity** tab.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1803290442/c5384a0246ce8182e4ebb40673cd/7f31c50a-79fa-46ad-ab57-820c0e_1gkpxr7.png?expires=1774894500&signature=86fe7d78323f3ef89aa9eb55c036eb65f139a42464c7733c8676f19c4c82dae2&req=dSgnFct3nYVbW%2FMW1HO4zR9u69X3X0fvDisyVgVx1lzxMqcwLp7WXRhoUK2r%0AFeFI%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1803290442/c5384a0246ce8182e4ebb40673cd/7f31c50a-79fa-46ad-ab57-820c0e_1gkpxr7.png?expires=1774894500&signature=86fe7d78323f3ef89aa9eb55c036eb65f139a42464c7733c8676f19c4c82dae2&req=dSgnFct3nYVbW%2FMW1HO4zR9u69X3X0fvDisyVgVx1lzxMqcwLp7WXRhoUK2r%0AFeFI%0A)
    
2.  In the Reports window, click on the **Activity download** option.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1803291131/4e664d9202b569c77ec901f32eca/1dbdd2cf-4cea-43f0-8e42-e91823_1imkxgy.png?expires=1774894500&signature=49aa6c4efacb6e0cdeff08592d66a155fb884e2ad3f75892d5d8f7fcedf41bd5&req=dSgnFct3nIBcWPMW1HO4zWdn2cSN4KoQKOUjEybLT5fPzd1lxUk1OODeXmBO%0AAAiz%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1803291131/4e664d9202b569c77ec901f32eca/1dbdd2cf-4cea-43f0-8e42-e91823_1imkxgy.png?expires=1774894500&signature=49aa6c4efacb6e0cdeff08592d66a155fb884e2ad3f75892d5d8f7fcedf41bd5&req=dSgnFct3nIBcWPMW1HO4zWdn2cSN4KoQKOUjEybLT5fPzd1lxUk1OODeXmBO%0AAAiz%0A)
    
3.  Select **Transaction type, Date range and choose CSV date** format. Click on the **Create Report** button.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1803292577/26922638c2d56b08c4f39de01331/afa02647-9992-41b3-a873-7e5486_1qdtpwl.png?expires=1774894500&signature=04a67531b07c9fc8ded44849520f262bb82483108b81742a4c4045b9ac5bdb2e&req=dSgnFct3n4RYXvMW1HO4zcVlQPHowGKiSC7xnIWb4sBfgQJ8GdnCIhuTVgVs%0A7quW%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1803292577/26922638c2d56b08c4f39de01331/afa02647-9992-41b3-a873-7e5486_1qdtpwl.png?expires=1774894500&signature=04a67531b07c9fc8ded44849520f262bb82483108b81742a4c4045b9ac5bdb2e&req=dSgnFct3n4RYXvMW1HO4zcVlQPHowGKiSC7xnIWb4sBfgQJ8GdnCIhuTVgVs%0A7quW%0A)
    
4.  Once the report is available, click the Download button to save the CSV file on your system.  
    ​
    

# Using the migration utility

You would have to keep the exported PayPal transactions file in a separate tab in order to paste the PayPal billing agreement ID

If the customer is existing with the added email address, then the PayPal express payment info will be added with all other customer data as before. If the customer was not present before, then a new customer will be auto-created in Shopify.

*   This is great, but I have more than 100 customers to migrate.
    

Don't worry if you have a long list of customers to be migrated. You can connect with our support team to assist you with the migration process. You just need to send us the exported PayPal Express transactions data CSV file to [\[email protected\]](/cdn-cgi/l/email-protection#d6bbbfb1a4b7a2bfb9b8a596bab9b9a6a1b9a4bdf8b5b9) with the required fields (first name, last name, email, PayPal billing agreement ID) and we will automatically import and update the customers with PayPal Express payment info.

#   
Migrating subscriptions

Once you have migrated all the customers and payment methods from PayPal Express, you will be able to re-create the subscription using their saved PayPal payment methods. You can use the "Create subscription manually" tool in Loop admin portal to replicate their existing subscription, including billing schedule, products subscribed, shipping address and prices. Once the subscription is created, your customers will receive a notification along with the customer portal link to manage their subscriptions.

**Learn more:** [Subscription migration in Loop](https://intercom.help/loop-subscriptions/en/articles/12744856-subscriptions-migration)

Don't forget to cancel the existing subscriptions in the other subscription app after successful migration to avoid double billing issues for your customers.

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#04777174746b767044686b6b74736b766f2a676b) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Import from Stripe

](https://help.loopwork.co/en/articles/12700734-import-from-stripe)[

Payment migration

](https://help.loopwork.co/en/articles/12742688-payment-migration)[

Import from Authorize.net

](https://help.loopwork.co/en/articles/12745155-import-from-authorize-net)[

Connect secondary payment method on Shopify / Loop

](https://help.loopwork.co/en/articles/12745428-connect-secondary-payment-method-on-shopify-loop)[

Migrate from Recharge policy

](https://help.loopwork.co/en/articles/12752667-migrate-from-recharge-policy)
