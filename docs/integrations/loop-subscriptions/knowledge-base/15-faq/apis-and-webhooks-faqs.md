---
title: "APIs and webhooks FAQs"
source_url: "https://help.loopwork.co/en/articles/12858121-apis-and-webhooks-faqs"
collection: "15-faq"
scraped_at: "2026-03-30T17:43:24.716Z"
tags: ["15-faq"]
---



#### If we were to custom-code the customer portal, can we get the relevant API calls/links to make customer buttons that allow people to upgrade/swap from their portal (beyond what your default banner offers)

We use Upsells, Upgrade, and swap functionalities along with the basic custom portal features. Can our APIs trigger all these functions if they make a custom customer portal page?

Considering you use Upsells, Upgrade, and swap functionalities along with the basic customer portal features, your APIs can trigger all functions below if you make a custom customer portal page:

*   Upsell - Yes
    
*   Swap - Yes
    
*   Upgrades - Yes
    

#### How to fetch cancellation flow logs using the Admin API?

You can use the Cancellation Flow Log Admin API endpoint to fetch cancellation flow logs for a specific store. This endpoint has a separate rate limit of 1 request per 2 seconds and does not fall under the global rate limit pool. For complete documentation and implementation details, visit https://developer.loopwork.co/reference/fetch-cancellation-flow-logs

#### Are Order notes API endpoints available for developers?

Two APIs are available for updating order notes programmatically:

*   Update order note admin API (https://developer.loopwork.co/reference/update-order-note) for backend integrations and admin operations.
    
*   Update order note storefront API (https://developer.loopwork.co/reference/update-order-notes) for customer-facing implementations. These APIs enable you to manage order notes at the individual order level through your custom integrations.
    

#### Can I delete the generated tokens? What would happen if an API call is made using the deleted token?

You can easily delete a token by clicking on the "Remove" button. You will be asked to confirm before deleting the token. Once deleted, the token cannot be recovered. Any API calls made with this token will give "invalid token"

#### How can I change my token name and scopes? Will it affect the token and my API calls?

You can edit the token name and token scopes anytime by clicking on the "Edit" button. The token will remain unchanged.

#### Do we need to create a subscription API endpoint in the storefront?

We do not have to create a subscription endpoint on the storefront.

#### How does the 'pause subscription' endpoint work with intervalType: "CUSTOM"? Also, what will the payload look like?

The 'pause subscription' endpoint works with intervalType: "CUSTOM", and it helps your customer select a custom pause interval other than the already defined pause intervals.  
​  
In the intervalType payload - (custom and interval count) - we show the number of days for which the customer has paused the subscription.

#### Would you be able to confirm how much notice Loop typically gives for any API changes that might happen on your end, where our team would need to take action?

We don’t make changes that would disrupt any existing logic in your current API based setup - any updates we release with respect to APIs are improvements only. If we ever plan a change that could potentially impact your workflows, we’ll reach out in advance to inform you first.

#### Can a mandatory 12-month subscription be set up where, if a customer cancels early, the remaining subscription amount is automatically charged?

Yes, you can utilise Loop APIs to set up a mandatory subscription for 12-months where a customer will be charged even if they cancel in between.

#### How can I migrate a customer’s payment method from Stripe, Authorize.net, Braintree, or PayPal to Loop using the API?

To migrate a customer’s payment method from a supported payment gateway, follow these steps:

1.  Use the “Migrate customer payment method” API endpoint.
    
2.  Provide the required customer and payment details from your existing payment aggregator, such as Stripe, Authorize.net, Braintree, or PayPal.
    
3.  Send the API request to the migration endpoint.
    
4.  Review the response payload and store the returned paymentMethodShopifyId.
    

You can use the returned paymentMethodShopifyId to associate the migrated payment method with subscriptions created in Loop.

#### How can I create a subscription using paymentMethodShopifyId instead of the internal paymentMethodId via API?

To create a subscription using paymentMethodShopifyId, follow these steps:

1.  Call the Create Subscription API endpoint.
    
2.  In the request payload, pass the paymentMethodShopifyId instead of the internal paymentMethodId.
    
3.  Include the required customer and subscription details.
    
4.  Submit the request to create the subscription.
    

You can directly attach the Shopify payment method returned from the migration API when creating subscriptions via API.

* * *

Related Articles

[

API documentation

](https://help.loopwork.co/en/articles/12672675-api-documentation)[

Webhooks

](https://help.loopwork.co/en/articles/12672677-webhooks)[

Migrate from Smartrr

](https://help.loopwork.co/en/articles/12745497-migrate-from-smartrr)[

Migrate from Bold

](https://help.loopwork.co/en/articles/12752633-migrate-from-bold)[

Migrate from Recharge policy

](https://help.loopwork.co/en/articles/12752667-migrate-from-recharge-policy)
