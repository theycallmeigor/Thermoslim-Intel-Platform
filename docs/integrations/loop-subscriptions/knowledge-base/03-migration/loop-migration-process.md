---
title: "Loop migration process"
source_url: "https://help.loopwork.co/en/articles/12742349-loop-migration-process"
collection: "03-migration"
scraped_at: "2026-03-30T17:43:22.172Z"
tags: ["03-migration"]
---

Learn how to seamlessly migrate subscriptions from other platforms to Loop using our guided, step-by-step migration process for a smooth transition.

**Migrating** your existing subscriptions from another platform to Loop can feel like a big task, but it doesn’t have to be. Whether you're moving from Recharge, Bold, Smartrr, Skio, Seal, WooCommerce, or another system, **Loop** offers a smooth, structured process to get you up and running quickly.

This guide walks you through everything you need to know to ensure a successful and stress-free migration experience.

Loop offers flexible and scalable pricing plans tailored to different business needs. To explore the detailed pricing structure, click [here](https://www.loopwork.co/pricing).

**Transform your subscription business with Loop subscriptions.**

[Book a demo](https://www.loopwork.co/book-a-demo)

* * *

# Prerequisites

Before beginning the migration, please ensure the following are in place.

*   A valid Shopify merchant account and storefront setup on Shopify.
    
*   Installed and completed configuring the [Loop Subscriptions app](https://apps.shopify.com/loop-subscriptions) and is live with the loop widget on storefront. If not - check our [getting started](https://intercom.help/loop-subscriptions/en/articles/12703816-getting-started-with-loop) section.
    
*   Access to a supported payment processor (e.g. Stripe, [Authorize.net](https://authorize.net/), etc.) to download the relevant data. (not required for Shopify native subscription apps)
    
*   The payment account needs to be active as the migrated subscriptions will continue to be processed by the payment processor.
    
*   You have access to your previous platform or app to download subscription data and migrate subscriptions.
    
*   Satisfy Shopify’s [eligibility criteria](https://eligib) for subscriptions.
    
*   White Glove Migration is available on Loop’s paid plans.
    

We recommend going live with Loop before migration so that new subscriptions are directly created on Loop.

Please **ensure that all the prerequisites are met** before going through the next steps. The exact steps will vary based on the type of platform that you are migrating from. We will be covering all these specifics in sub-articles linked below.

  
​

# Understanding your platform type

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812395996/4625584a4b489aa81ba99a7c4a33/original?expires=1774894500&signature=98c4016abed726689ce87e733d3c53e316688cec5124ef6d764bd3d4e954874d&req=dSgmFMp3mIhWX%2FMW1HO4zQPbd%2B0NVHHZ31FkkOgHtYAxNVHKZj6DnDFkXM%2Bd%0AoWzP%2FsIyw4QroGgilzc%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812395996/4625584a4b489aa81ba99a7c4a33/original?expires=1774894500&signature=98c4016abed726689ce87e733d3c53e316688cec5124ef6d764bd3d4e954874d&req=dSgmFMp3mIhWX%2FMW1HO4zQPbd%2B0NVHHZ31FkkOgHtYAxNVHKZj6DnDFkXM%2Bd%0AoWzP%2FsIyw4QroGgilzc%3D%0A)

1.  **Native Shopify platforms** → utilize Shopify checkout for the subscription purchase and management experience
    
2.  **Non-Native / Legacy Shopify** → utilize custom checkout for subscription purchases on the store
    
3.  **Non Shopify platforms** → subscription management is not done in Shopify based platform  
    ​
    
    **Note:** Based on the category of your previous subscription app/platform - we would be requiring to perform a payment token import if your platform falls under the categories marked with the red crossed lines
    

If you don't fall under any of the above categories - please refer to the custom platform section for more information and reach out to [\[email protected\]](/cdn-cgi/l/email-protection#93e0e6e3e3fce1e7d3fffcfce3e4fce1f8bdf0fc) or [book a time](https://www.loopwork.co/book-a-demo?utm_campaign=CTA1help&utm_medium=referral&utm_source=helpsub) for consulting with us.

  
​

# Loop migration format

Loop’s migration format is a standardized structure that ensures a smooth, accurate transition of your subscription and payment data. It works seamlessly across Shopify and non-Shopify platforms, making migrations simple and reliable. For more information related to the specific data points that are covered by the migration process, you can check out our standard format templates, which dive into more depth.

1.  [Subscription migration format](https://docs.google.com/spreadsheets/d/1eG69QE6eA1Z5NuS-ApUTAkdLgELJSBEjBulppzZjlkM/edit?gid=0#gid=0)
    
2.  [Payment migration format](https://docs.google.com/spreadsheets/d/1eh-7yHmezoUuopXjyPVrp07f2HdhA1XXtLillUfH_2s/edit?gid=1223315231#gid=1223315231)  
    ​
    

The following data points will not be transferred over as part of the migration activity.

*   Historical data (order history) is not migrated during subscription migrations. This applies to all migrations. This information will be available for future reference through historical exports from the source platform.
    
*   Analytic information (total subscription spent etc) is not migrated during subscription migrations. However, migrated subscriptions will retain their created\_at, cancelled\_at and paused\_at dates respectively.
    

  
​

# Loop migration workflow

The image below aims to help you understand how the Onboarding and Migration processes are structured.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812395995/ae417f25a95f50f1af0ba50be7b5/original?expires=1774894500&signature=b16bbe386e7e878d53c8ad489289edd5e8fea5065b3d2d046b556ef781938b19&req=dSgmFMp3mIhWXPMW1HO4zWO3dc7b7qG77MpMh6Nt3bTJvkwqOOIGEM%2FhfOWa%0A68BlXt8vVdjanMzGd6Q%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812395995/ae417f25a95f50f1af0ba50be7b5/original?expires=1774894500&signature=b16bbe386e7e878d53c8ad489289edd5e8fea5065b3d2d046b556ef781938b19&req=dSgmFMp3mIhWXPMW1HO4zWO3dc7b7qG77MpMh6Nt3bTJvkwqOOIGEM%2FhfOWa%0A68BlXt8vVdjanMzGd6Q%3D%0A)

The reason why we suggest going live with loop prior to migration is to ensure that new subscriptions are created in Loop and not on your old platform.

This will ensure that the data export that we have taken from your old platform stays up to date through the migration process (as no new subscriptions are created on your previous platform)  
​

# Disabling settings on old platform

The following settings will need to be disabled on your previous platform before commencing migration.

1.  Customer portal permissions/settings - Existing subscriptions are not modified in any way by the customer post data export
    
2.  Customer notifications - Customers are not notified in any way during the migration process
    
3.  Subscription widget - New subscriptions are not created from the storefront on the previous platform
    

These settings once disabled will help ensure a seamless transition from your previous platform to Loop.  
​

No customer will be notified during the migration. It��s a completely silent switch.

​

# 3 step migration process

The migration process is a 3-step process, with some steps optional and platform dependent.

1.  [Customer Migration](https://intercom.help/loop-subscriptions/en/articles/12703816-getting-started-with-loop): This is only required when moving from an external / non Shopify platform to Loop. As in this case the customer information is not present within Shopify and the merchant would need to import the same. A detailed guide for the same can be found in [Shopify docs](https://help.shopify.com/en/manual/customers/import-export-customers).
    
2.  [Import Payments](https://intercom.help/loop-subscriptions/en/articles/12742688-payment-migration): This is only required when moving from either an external / non Shopify platform (or) when moving from a legacy platform like Bold v1 / Recharge using legacy checkout.
    
3.  [Import Subscriptions](https://intercom.help/loop-subscriptions/en/articles/12744856-subscriptions-migration): This is the final step where subscription contracts are created in Loop using the migrated customer and payment data.
    

There are two main ways to navigate the migration process that are supported by the Loop team and is covered in detail in the article below.

1.  **White glove migration service**
    
2.  **Self serve migration service**
    

White glove migration service is offered without any extra charge on any of Loop's paid plans. For more information related to pricing, [click here](https://www.loopwork.co/pricing). Plans start from $99/monthly.

Steps 2 and 3 mentioned above will be directly taken up by the Loop team and executed end to end.

  
​

# White glove migration service

Reach out to us at [\[email protected\]](https://migra) to have your subscriptions migrated by our professional team of migration experts who ensure that our customers are ensured a white-gloved, stress-free experience.

Our migration team converts the platform-specific data into the standard format that is used at our end. You can refer to the below links for more information about the format and its specifics.

1.  [Migration data example](https://docs.google.com/spreadsheets/d/1D584-SsOgFn7A5eXrLpTVhopMNp0nTFsHOfbkrvyUrY/edit?usp=sharing)
    
2.  [Subscription migration data format](https://docs.google.com/spreadsheets/d/1eG69QE6eA1Z5NuS-ApUTAkdLgELJSBEjBulppzZjlkM/edit?gid=0#gid=0)
    
3.  [Payment migration data format](https://docs.google.com/spreadsheets/d/1eh-7yHmezoUuopXjyPVrp07f2HdhA1XXtLillUfH_2s/edit?gid=1223315231#gid=1223315231)
    

Block a time to consult with the migration team by [clicking here](https://www.loopwork.co/book-a-demo?utm_campaign=CTA1help&utm_medium=referral&utm_source=helpsub). We highly recommend this method for the smoothest experience. This is only offered on our [paid plans](https://www.loopwork.co/pricing).  
​

# Self serve migration service

The merchant can choose to manually migrate their subscriptions from other platforms to Loop using the inbuilt features of the loop app. This facilitates the migration process by allowing you to create the subscription contract manually on the platform.

Syncing of payment methods from Shopify is performed by the backend team on a request basis. (Required to use the create subscription functionality)

This method is only recommended when you have **less than 50 subscriptions** on your previous platform.

Based on the [type of platform](https://app.crisp.chat/#Understand-the-type-of-platform-you-are-currently-using--U5qDd) of your previous subscription platform - you would need to perform either both the steps or just one of the below-mentioned steps.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812395991/e10a965767dd818d2f9db63f8d6c/original?expires=1774894500&signature=9ec58ac99f45bdaf55f0818e9e75ea0e08863390ae2f05193051fcda7bef85dc&req=dSgmFMp3mIhWWPMW1HO4zbfbaL7p6E9rHHdf7nT4NrGOuCoF7F9XURjop%2BtG%0AC8X%2BkoHRbTBb32g9i0A%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812395991/e10a965767dd818d2f9db63f8d6c/original?expires=1774894500&signature=9ec58ac99f45bdaf55f0818e9e75ea0e08863390ae2f05193051fcda7bef85dc&req=dSgmFMp3mIhWWPMW1HO4zbfbaL7p6E9rHHdf7nT4NrGOuCoF7F9XURjop%2BtG%0AC8X%2BkoHRbTBb32g9i0A%3D%0A)

  
​

# Legacy / Non Shopify platform

1.  Connect your existing supported payment provider as a secondary provider to your Shopify by heading to **Loop > Settings > Migrate customers and payment methods > Connect Stripe** (example)
    
2.  If your current payment provider is not supported - you will need to migrate to a [supported payment provider](https://help.shopify.com/en/manual/products/purchase-options/subscriptions/setup#eligibility-requirements) to continue with the rest of the steps
    
3.  Import payment tokens from the supported PSP using the Loop app. [step-by-step guide](https://intercom.help/loop-subscriptions/en/articles/12742688-payment-migration)
    
4.  Create a subscription for that customer using the **Create Subscription Manually** feature found under **Loop > Subscriptions** ( [step-by-step guide](https://intercom.help/loop-subscriptions/en/articles/12729430-create-subscriptions-manually))
    

  
​

# Shopify native platform

1.  Request [\[email protected\]](/cdn-cgi/l/email-protection#a0d3d5d0d0cfd2d4e0cccfcfd0d7cfd2cb8ec3cf) for a sync payment methods operation to be performed for your store.
    
2.  Request [\[email protected\]](/cdn-cgi/l/email-protection#582b2d2828372a2c18343737282f372a33763b37) for the feature **Create subscription manually** to be activated if you are on the FREE plan and are following this guide.
    
3.  Create a subscription for that customer using the **Create Subscription Manually** feature found under **Loop > Subscriptions** ( [step-by-step guide](https://intercom.help/loop-subscriptions/en/articles/12729430-create-subscriptions-manually)).
    

*   [Custom platform migration](https://loopwork.getoutline.com/s/504e0dd2-178c-4e3e-82dc-00a39375d8dd/doc/custom-platform-tlUMvlwSEw)
    

Loop migration specialists will be able to help chart a migration from custom built platform (inhouse / external) to Shopify + Loop. Migration support for this is only offered on our [paid plans](https://www.loopwork.co/pricing). A detailed technical walkthrough of the migration from a custom platform to Loop can be found in the above document.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812395993/92db37f87cf889cc44a6049f70bf/original?expires=1774894500&signature=9ffcb92ac36e2e2109ca56b69cc6a57ca4982236a87cf422440ddacfb0e331c1&req=dSgmFMp3mIhWWvMW1HO4zbwc9HAWFF10q0rOeO14d7zhPgQXSctnZh8Hko6t%0Amx7X4HTS0qbuL42eZ%2FI%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812395993/92db37f87cf889cc44a6049f70bf/original?expires=1774894500&signature=9ffcb92ac36e2e2109ca56b69cc6a57ca4982236a87cf422440ddacfb0e331c1&req=dSgmFMp3mIhWWvMW1HO4zbwc9HAWFF10q0rOeO14d7zhPgQXSctnZh8Hko6t%0Amx7X4HTS0qbuL42eZ%2FI%3D%0A)

# FAQs

#### I would like to migrate to Loop from another Shopify subscription app. What are my next steps?

Please refer to the Migration article on [help.loopwork.co](https://help.loopwork.co/) and review the listed requirements. Once you have all the prerequisites in place, reach out to our support team with the necessary details, we’ll be happy to assist you with the migration.

#### How long does it usually take for the whole process?

This depends on the amount of subscriptions - but a good rule of thumb for estimating migration time is 1 hour per 800 contracts.

#### Is there any fee/extra costs for migrating my subscriptions?

We don't charge anything extra for the migration process. It is completely free and a white-gloved experience.

#### Is it possible to migrate one Shopify store to another if both are using Loop?

It is possible to migrate one Shopify store to another Shopify store even if both are using Loop; however, Shopify does not allow moving payment tokens across 2 Shopify stores. To consolidate all subscriptions into one store, the default path is to use placeholder tokens. This means customers will be prompted to update their cards when their next payment attempt happens, which is a standard way to notify customers to update cards. We can run quick actions campaigns with incentives & get customers to update their cards before the next rebill.  
​  
That said, there is an alternative. Shopify offers a PAN migration service (a paid option, around ＄16K) where they can transfer tokens between stores. If you’d like, I can reach out to the Shopify team to confirm the process and eligibility for your setup.

#### What should I know if I want to migrate my Loop from old Shopify store to new Shopify store?

Loop-to-Loop migrations (where you are moving from one Shopify store to another but willing to continue using Loop since you were using Loop on the old shopify store as well), can be a tricky thing to do.  
​  
Please remember:  
If you move to another Shopify store and move all your existing Loop Subscriptions to new store while using Loop subscription, you'll need to ask all new customers to update their payment methods for each subscriptions. It is because this kind of migration is done using Bogus payment methods.  
​  
However, there is a workaorund to do this migration on the original payment tokens, you can contact Shopify and explain everything about your migration and then they'll advise what can be done to migrate these tokens. Please also know that Shopify may also charge you to do this job.

[Explore more FAQs](https://help.loopwork.co/en/collections/16646422-frequently-asked-questions-faqs)

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#384b4d4848574a4c78545757484f574a53165b57) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Import from PayPal Express

](https://help.loopwork.co/en/articles/12691686-import-from-paypal-express)[

Payment migration

](https://help.loopwork.co/en/articles/12742688-payment-migration)[

Subscriptions migration

](https://help.loopwork.co/en/articles/12744856-subscriptions-migration)[

Migrate from Smartrr

](https://help.loopwork.co/en/articles/12745497-migrate-from-smartrr)[

Migrate from Recharge policy

](https://help.loopwork.co/en/articles/12752667-migrate-from-recharge-policy)
