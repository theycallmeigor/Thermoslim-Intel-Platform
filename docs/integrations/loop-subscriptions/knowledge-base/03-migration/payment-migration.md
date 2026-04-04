---
title: "Payment migration"
source_url: "https://help.loopwork.co/en/articles/12742688-payment-migration"
collection: "03-migration"
scraped_at: "2026-03-30T17:43:22.146Z"
tags: ["03-migration"]
---

Learn how to migrate customer payment tokens into Shopify to ensure seamless billing continuity during your transition to Loop.

Payment migration refers to the process of importing customer payment tokens from external providers (e.g., Stripe, PayPal Express, [Authorize.net](https://authorize.net/), Braintree) into Shopify. This ensures that your existing customers can continue being billed through your current provider, without needing to re-enter their payment details immediately.  
​

Shopify vaults the tokens, but billing will continue with your external provider unless the customer updates their payment method natively in Shopify.

* * *

​

# What is a payment import?

Payment import is the process of transferring customer payment tokens from an external platform into Shopify's system. Tokens from supported platforms like Stripe, PayPal Express, Authorize.net, or Braintree are imported, enabling you to continue billing through the existing provider. Shopify vaults the payment tokens, but the actual billing remains with the previous provider until customers update their payment method through Shopify, i.e. until it is vaulted in Shopify.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812473938/4a0d3423e7a700dabb4cd6cdee97/original?expires=1774894500&signature=0ab4aecbf41dda88b0d5045800a442afa43ef608051b43fb265dc5909ea04816&req=dSgmFM15nohcUfMW1HO4zYfJYofaJNb8ehe2beoMfv6APRz97iiYls6BJY6k%0AqJAVIsliGWh0DmtSsow%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812473938/4a0d3423e7a700dabb4cd6cdee97/original?expires=1774894500&signature=0ab4aecbf41dda88b0d5045800a442afa43ef608051b43fb265dc5909ea04816&req=dSgmFM15nohcUfMW1HO4zYfJYofaJNb8ehe2beoMfv6APRz97iiYls6BJY6k%0AqJAVIsliGWh0DmtSsow%3D%0A)

  
​

# Prerequisites

Before proceeding with a payment import, make sure you meet the following conditions.

**Subscription Supported Payment Providers**

*   Shopify Payments
    
*   Stripe
    
*   [Authorize.net](https://authorize.net/)
    
*   Braintree
    
*   PayPal Express
    
*   Adyen  
    ​
    

If you're migrating from another provider that is not in this list, you will first need to move to one of these supported platforms. Other providers are currently not supported for token import.

Adyen is only supported by Shopify for new subscription creation and not supported for payment token migration.

  
​**Learn more: [Shopify’s Eligibility Requirements for Subscriptions](https://help.shopify.com/en/manual/products/purchase-options/subscriptions/setup#eligibility-requirements)**

  
​

# Methods for importing payment tokens

There are two ways you can migrate payment tokens from your old platform: Manual import and Automated import. Depending on the amount of tokens that need to be moved over, an informed decision can be made by the merchant to either migrate manually or go for the automated method.

## Manual payment import

Loop Subscriptions provides a feature that allows you to manually import customer tokens into Shopify one by one. This is ideal if you have fewer than 50 payment records.

First, ensure that you have connected the payment provider as a secondary (skip this step if you have the provider set up in Shopify as primary). A step-by-step walkthrough on how to connect your previous payment provider is provided below

[connect secondary payment method on Shopify/Loop](https://intercom.help/loop-subscriptions/en/articles/12745428-connect-secondary-payment-method-on-shopify-loop).  
​

To manually import: Navigate to **Loop app > Settings > Migrate customers and payment methods.**

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812473950/932b00ca57178925433e4d560e96/original?expires=1774894500&signature=8d55e19e6dbe550860bc3f6c6467474a01e8d8a10e891194177234ec79b4dc1b&req=dSgmFM15nohaWfMW1HO4zd21ygGUTWhQlI4g9YRqqr2PrNLjQ0CrQGKw39eD%0ApvH5WpXjPzZPE9XXz%2Bw%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812473950/932b00ca57178925433e4d560e96/original?expires=1774894500&signature=8d55e19e6dbe550860bc3f6c6467474a01e8d8a10e891194177234ec79b4dc1b&req=dSgmFM15nohaWfMW1HO4zd21ygGUTWhQlI4g9YRqqr2PrNLjQ0CrQGKw39eD%0ApvH5WpXjPzZPE9XXz%2Bw%3D%0A)

Follow the steps to upload the payment tokens from the supported provider.

*   [Migrate from Stripe](https://intercom.help/loop-subscriptions/en/articles/12700734-import-from-stripe)
    
*   [Migrate from PayPal Express](https://intercom.help/loop-subscriptions/en/articles/12691686-import-from-paypal-express)
    
*   [Migrate from Authorize.net](https://intercom.help/loop-subscriptions/en/articles/12745155-import-from-authorize-net)
    

  
​

# White-glove migration support

If you prefer a more hands-off approach or have a larger number of records, we offer White-Glove Migration Support. Here's how it works:

*   API credentials (or token export files) from your current provider (e.g., [Stripe](https://docs.stripe.com/keys#create-api-secret-key), [PayPal Express](https://intercom.help/loop-subscriptions/en/articles/12691686-import-from-paypal-express), [Braintree](https://developer.paypal.com/braintree/articles/control-panel/important-gateway-credentials#api-credentials), [Authorize](https://support.authorize.net/knowledgebase/Knowledgearticle/?code=000001271)).
    
*   Ensure that your payment provider is already connected in Shopify, either as the primary or secondary provider. ([guide](https://intercom.help/loop-subscriptions/en/articles/12745428-connect-secondary-payment-method-on-shopify-loop))  
    ​
    

The provider must be connected to Shopify for us to import payment tokens into Shopify's vault. For more details on how to connect as a secondary provider, [follow this guide](https://intercom.help/loop-subscriptions/en/articles/12745428-connect-secondary-payment-method-on-shopify-loop). To set as primary, you can follow [this article](https://help.shopify.com/en/manual/payments/third-party-providers) from Shopify. For any assistance, reach out to [\[email protected\]](/cdn-cgi/l/email-protection#a1d2d4d1d1ced3d5e1cdceced1d6ced3ca8fc2ce).

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812473935/14b6c30d2ecdcb5d853f2111d1e2/original?expires=1774894500&signature=1d429b2c49ee02a4d67aa52400041e79f36e0033b29667d3da9deeef47ea4fe0&req=dSgmFM15nohcXPMW1HO4zeUwvyF%2Fuo3NgRYM57gAebIYQKr3%2FOv0VxaUe03m%0AhYLU%2BqOnHZWy%2Bhvf8%2BY%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812473935/14b6c30d2ecdcb5d853f2111d1e2/original?expires=1774894500&signature=1d429b2c49ee02a4d67aa52400041e79f36e0033b29667d3da9deeef47ea4fe0&req=dSgmFM15nohcXPMW1HO4zeUwvyF%2Fuo3NgRYM57gAebIYQKr3%2FOv0VxaUe03m%0AhYLU%2BqOnHZWy%2Bhvf8%2BY%3D%0A)

# FAQs

#### Shopify has blocked us from using Shopify Payments. What should be done now?

We suggest that you get in touch with Shopify directly if Shopify has blocked you from using a payment provider. However, our understanding is that if you use another payment provider and make it primary, your subscriptions should start syncing there using the stored payment tokens. This shall start happening when the future recurring payments hit the date. However, you should reach out to Shopify to get complete details around this topic.

## What are the right steps to move Credit Card (CC) tokens from Stripe to Loop?

The correct steps to move Credit Card (CC) tokens from Stripe to Loop would be:

*   Create test customers in Stripe and add a payment method to each.
    
*   In Loop Admin, go to Settings > Migrate Payment Methods. Enter the required details and click Save Customer.
    
*   In Loop Admin > Subscriptions > Create subscription manually, create the subscription and make the required changes.
    

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#fb888e8b8b94898fbb9794948b8c948990d59894) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Import from PayPal Express

](https://help.loopwork.co/en/articles/12691686-import-from-paypal-express)[

Import from Stripe

](https://help.loopwork.co/en/articles/12700734-import-from-stripe)[

Import from Authorize.net

](https://help.loopwork.co/en/articles/12745155-import-from-authorize-net)[

Connect secondary payment method on Shopify / Loop

](https://help.loopwork.co/en/articles/12745428-connect-secondary-payment-method-on-shopify-loop)[

Migrate from Recharge policy

](https://help.loopwork.co/en/articles/12752667-migrate-from-recharge-policy)
