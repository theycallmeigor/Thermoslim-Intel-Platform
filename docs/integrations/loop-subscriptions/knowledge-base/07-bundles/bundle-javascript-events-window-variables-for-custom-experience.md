---
title: "Bundle JavaScript events & window variables for custom experience"
source_url: "https://help.loopwork.co/en/articles/12741415-bundle-javascript-events-window-variables-for-custom-experience"
collection: "07-bundles"
scraped_at: "2026-03-30T17:43:20.537Z"
tags: ["07-bundles"]
---

Learn how to use Loop’s custom JavaScript events and window variables to build dynamic, personalized subscription and bundle experiences on your store.

Loop has **31 unique JavaScript (JS)** custom events that are triggered by various actions within the customer portal and bundle builder screen. This new functionality allows store developers to curate customized experiences for users by leveraging these events.

Loop now allows access to critical product and bundle information through the `window.loopBundleProps` variable, enabling dynamic, customized shopping experiences. This includes details like bundle ID, name, image URL, product metafields, categories, filters, and purchase options, allowing for personalized redirection and more flexible BYOB customization.

* * *

# Popular use cases for custom events

These custom events can be utilized for a variety of purposes, such as:

*   **Sending contextual communications**: Trigger cart abandonment emails when a customer adds an item on their bundle builder page but doesn't actually add the bundle to the cart.
    
*   **Triggering surveys or forms:** Automatically display a Net Promoter Score (NPS) form when a customer adds a product from the upsell section.
    
*   **Tracking behavioural data:** Monitor how users interact with the portal by tracking actions like product additions, updates, or deletions.
    

# Setting up event listeners

To begin using these JS events, developers need to set up event listeners in their code. These listeners will detect when specific actions occur and trigger corresponding custom flows.

Here's a basic example of how you can set up an event listener:

window.addEventListener('loopAddAsOneTime', () => { // Insert code here to trigger the custom experience });

This sample code listens for the `loopAddAsOneTime` event. When this event is triggered, it will execute the function defined inside the event listener, where you can place code to initiate any custom behaviour.

  
​

# List of custom events

The JS events you can utilize are categorized into four groups based on the type of interaction they represent.

**Customer portal events**

1.  **Product-based events**  
    ​  
    → `loopAddAsOneTime`: Triggered when a product is added as a one-time purchase.
    
    →`loopAddAsSubscription`: Triggered when a product is added on a subscription basis.
    
    →`loopRemoveForOneTime`: Triggered when a one-time product is removed.
    
    →`loopRemoveFromSubscription`: Triggered when a subscription product is removed.
    
    →`loopProductSwap`: Triggered when a product swap is made.
    
    →`loopUpdateProductQuantity`: Triggered when the quantity of a product is updated.  
    ​
    
2.  **Subscription-based events**  
    ​  
    → `loopAddDiscount`: Triggered when a discount is applied to a subscription.
    
    →`loopRemoveDiscount`: Triggered when a discount is removed.
    
    →`loopChangeSubscriptionPlan`: Triggered when a subscription plan is changed.
    
    →`loopChangeDeliveryMethodRequested`: Triggered when a change in delivery method is requested.
    
    →`loopEditDeliveryDetails`: Triggered when delivery details are edited.
    
    →`loopUpdatePaymentMethodRequested`: Triggered when an update to the payment method is requested.
    
    →`loopCancelSubscription`: Triggered when a subscription is canceled.
    
    →`loopReactivateSubscription`: Triggered when a subscription is reactivated.
    
    →`loopPauseSubscription`: Triggered when a subscription is paused.
    
    →`loopResumeSubscription`: Triggered when a subscription is resumed.
    
3.  **Order-based events**  
    ​  
    →`loopOrderNow`: Triggered when an order is placed immediately.
    
    →`loopSkipNextScheduledOrder`: Triggered when the next scheduled order is skipped.
    
    →`loopSkipFutureScheduledOrder`: Triggered when future scheduled orders are skipped.
    
    →`loopRescheduleNextOrder`: Triggered when the next order is rescheduled.
    
    →`loopDelayNextOrder`: Triggered when the next order is delayed.
    
    →`loopUnskipOrder`: Triggered when a previously skipped order is reinstated.
    
4.  **Bundle-based events**  
    ​
    
    →`loopBundleAddAsOneTime`: Triggered when a bundle is added as a one-time purchase.
    
    →`loopBundleAddAsSubscription`: Triggered when a bundle is added on a subscription basis.
    
    →`loopBundleRemoveForOneTime`: Triggered when a one-time bundle is removed.
    
    →`loopBundleRemoveFromSubscription`: Triggered when a subscription bundle is removed.
    
    →`loopBundleVariantChange`: Triggered when a variant within a bundle is changed.
    
    →`loopPresetBundleUpdateQuantity`: Triggered when the quantity of a preset bundle is updated.
    

# Storefront events

1.  **Build your bundle events**  
    ​  
    → `loopItemAddToBundleSuccessEvent` : Triggered when an item is added to the bundle on the bundle builder page.
    
    → `loopByobAddToCartSuccessEvent` : Triggered when a build your bundle is successfully added to the cart through the Loop bundle page  
    ​
    
2.  **Preset bundle event**  
    ​  
    → `loopPresetAddToCartSuccessEvent` : Triggered when a preset bundle is successfully added to the cart from its product details page
    

By integrating these JS events into your development strategy, you can enhance user interactions and tailor the customer experience in Loop's customer portal to better meet the needs of your audience.  
​

# Use cases of window variables

The window.loopBundleProps window variable provides easy access to critical bundle and product information that can be used to trigger or personalize custom experiences within your store.

Some of the famous use cases:

*   Display critical product information available in product metafields as a short description.
    
*   Leverage bundle categories, filters, products, limits and other bundle information to power/trigger custom experiences.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812076009/4dc4c142ae816c7def8c9307e696/original?expires=1774894500&signature=ddce583317c95bee1bc362e7bb385f74d735f9a7ff27d2f733728af148007b9f&req=dSgmFMl5m4FfUPMW1HO4zSsTvZltqKHcVNiA4WN1a2PU2JR9CazrutwOOaZ6%0AkgI5%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812076009/4dc4c142ae816c7def8c9307e696/original?expires=1774894500&signature=ddce583317c95bee1bc362e7bb385f74d735f9a7ff27d2f733728af148007b9f&req=dSgmFMl5m4FfUPMW1HO4zSsTvZltqKHcVNiA4WN1a2PU2JR9CazrutwOOaZ6%0AkgI5%0A)
    

  
​

# Bundle information available in window variables

Bundle information available in the window variable (window.loopBundleProps)

*   Bundle ID
    
*   Bundle name
    
*   Bundle image URL
    
*   Description
    
*   Footer
    
*   Default locale
    
*   Purchase options
    
*   Default purchase option
    
*   Products
    
*   Product metafields
    
*   Categories
    
*   Filters
    
*   Bundle sizes
    
*   Bundle limits
    
*   Bundle discounts
    
*   Add to cart redirection
    

  
​

# Important considerations

We are fetching only first 50 productMetfields of following types for each product.

*   Single line text field
    
*   List of single line text field
    
*   Number (integer)
    
*   List of number (integer)
    
*   Number (decimal)
    
*   List of number (decimal)
    
*   Dimension
    
*   Weight
    
*   Boolean
    
*   Rating
    

  
​

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#a7d4d2d7d7c8d5d3e7cbc8c8d7d0c8d5cc89c4c8) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Flows

](https://help.loopwork.co/en/articles/12708285-flows)[

Preset fixed bundle

](https://help.loopwork.co/en/articles/12729092-preset-fixed-bundle)[

Build your bundle

](https://help.loopwork.co/en/articles/12741075-build-your-bundle)[

Rebuy

](https://help.loopwork.co/en/articles/12745271-rebuy)[

Kaching bundles

](https://help.loopwork.co/en/articles/12745875-kaching-bundles)
