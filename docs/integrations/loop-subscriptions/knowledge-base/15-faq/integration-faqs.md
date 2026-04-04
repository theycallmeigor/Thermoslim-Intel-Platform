---
title: "Integration FAQs"
source_url: "https://help.loopwork.co/en/articles/12858151-integration-faqs"
collection: "15-faq"
scraped_at: "2026-03-30T17:43:23.918Z"
tags: ["15-faq"]
---



#### How can I a/b test price discounts on subscriptions?

You can use the Intelligems app - a third-party tool - to run A/B testing on the discounts offered for your subscriptions

#### How do Replo and Loop work together?

Replo and Loop work together in the following way:

1.  Replo uses its own widget to display selling plans.
    
2.  When a product is mapped to a selling plan in Loop and used in Replo, the selling plan automatically attaches to Replo’s Purchase Option Selector - no extra setup needed.
    
3.  Replo fetches all selling plans linked to the product, including:
    
    1.  Multiple selling plans (all visible)
        
    2.  Hidden plans (these may still appear in Replo)
        
    
4.  Widget placement and styling are fully managed within Replo.
    

Testing and Validating Subscription Setups with Loop Subscriptions and Replo

When integrating Loop Subscriptions with Replo, it is crucial to test and validate your subscription setup to ensure correct functionality. Below is a step-by-step guide to help you verify the integration:

Here are some steps to Test Your Subscription Setup

1.  **Set Up a Test Environment**: In Shopify, create a 100% discount code to place a test order without incurring charges.
    
2.  **Place a Test Order**: Use your subscription flow to go through the checkout process. Select products, configure the settings within Replo (e.g., subscription quantity, delivery frequency, and price), and proceed to checkout.
    
3.  **Verify Your Test Order**: After placing the test order, confirm the following:
    
    *   **Quantity**: Check that the subscription quantity reflects the settings configured in Replo.
        
    *   **Pricing**: Verify that the pricing corresponds to the subscription plan set in Loop.
        
    *   **Delivery Frequency**: Ensure the delivery frequency matches the chosen plan.
        
    *   **Order Accuracy**: Confirm that all details are accurately reflected in the resulting order in Shopify and Loop Subscriptions.
        
    
4.  **Troubleshoot Issues (If Necessary)**: In case of discrepancies, revisit your Replo widget configuration and ensure proper linkages with Loop's selling plan ID.
    

Best Practices

*   Always validate integrations with a variety of test cases, such as different subscription quantities or delivery frequencies.
    
*   Use Shopify’s test mode or discount codes to simulate customer experiences without affecting live orders.
    
*   Document your results for future reference to streamline troubleshooting and future changes.
    

#### How can I offer a free one-time gift in a bundle without linking it to my subscription-selling plans using Kaching bundles?

To offer a free one-time gift in a bundle without linking it to your subscription-selling plans using Kaching bundles, follow these steps:

1.  Duplicate the free gift product in Shopify.
    
2.  Open the duplicated product and ensure it is not linked to any subscription selling plans.
    
3.  Save the product as a one-time purchase only product.
    
4.  In your bundle app, configure the “Buy 3 pack” bundle to include the duplicated product as the free gift.
    
5.  If needed, contact your bundle app support team to ensure the duplicated product is set as a one-time item within the selected bundle.
    

You can provide the free gift as a one-time product by keeping it separate from all subscription-selling plans.

#### Do we integrate with the eComposer builder app?

As of 16 Feb 2026, eComposer does not support the Shopify app block widget. The only way to display Loop on pages created with eComposer is by using the embed code from our app.

#### How do I control whether the loyalty widget is shown in the customer portal, and how does it behave?

To control whether the loyalty widget is shown in the customer portal, you must use the new widget visibility preference available inside each supported Loyalty app configuration.

To configure this:

1.  Go to the Loyalty app configuration in Loop
    
2.  Locate the widget visibility preference
    
3.  Turn the preference On or Off
    
4.  Save the changes
    

If the preference is turned ON:

*   The widget will be visible only when the subscriber has points or a coupon balance greater than zero.
    
*   If points balance = 0 and coupon balance = 0, the widget will be hidden.
    

If the preference is turned OFF:

*   The widget will be visible regardless of the subscriber’s points or coupon balance.
    

This allows you to conditionally display or always display the loyalty widget based on your use case.

At the moment, all loyalty apps might support it. You can configure the widget visibility preference individually within each supported app’s configuration section.

#### How do the loyalty points work with subscriptions via the Loop app?

Loop subscriptions integrates with third-party loyalty applications to enable businesses to reward customers with loyalty points on subscription orders. This integration fosters long-term customer engagement and loyalty by allowing subscribers to earn points with every purchase and redeem them for discounts and other rewards.  
​  
Some of the loyalty applications supported by Loop include:

1.  **Bubblehouse**: Offers customizable loyalty programs, referral programs, and rewards for subscribers. You can learn more about Bubblehouse integration here.
    
2.  **Influence.io**: Provides a platform for loyalty, rewards, and referrals, enabling businesses to create personalised loyalty programs. Find more information on the Influence.io integration here.
    
3.  **Yotpo**: Build customised rewards & referrals programs to engage existing customers and reach new ones.
    
4.  **Influence**: Turn one-time buyers into returning customers with your own loyalty program.
    
5.  **Rivo**: Loyalty and referral platform for Shopify brands to boost repeat sales.
    
6.  **Smile.io**: Specialises in reviews and loyalty, enabling businesses to reward loyalty points to subscribers and redeem them for discounts. See the support article on Smile.io integration here.
    

These and other compatible apps can be found in the Loop > Tools and Apps > Apps.

## What are the validation procedures for Subscription Widget Integration on the Replo page?

To ensure the subscription widget functions correctly on your Replo page, follow these validation steps:

1.  **Set Up a Test Environment**: Create a 100% discount code in Shopify to simulate test orders.
    
2.  **Test the Widget**: Add products to the cart using the subscription widget, configure subscription settings, and proceed to checkout.
    
3.  **Verify Order Details**: Confirm that the subscription quantity, pricing, and delivery frequency match the configurations in Loop and Replo.
    
4.  **Troubleshoot**: If issues arise, check the widget configuration and ensure it is correctly linked to Loop's selling plan ID.
    

By validating the integration, you can ensure a seamless experience for your customers and avoid potential issues.

#### How do I add my subscription widget to my Replo page?

Here’s a quick note on how Replo and Loop work together and how you can add a Subscription widget to your Replo page:  
​  
Replo has its own widget for displaying selling plans.  
Once a product is mapped to a selling plan in Loop and used in Replo (with the widget embedded), the selling plan will automatically attach to Replo’s Purchase Option Selector — no extra setup is required in Replo.  
Replo fetches all selling plans mapped to the product, including:  
Multiple selling plans (all of them will be shown),  
Even those marked as hidden on the storefront — so hiding in Loop won’t prevent them from appearing in the Replo widget.  
The placement and styling of the widget are entirely controlled within Replo.

#### Can I offer Smile.io loyalty points in a Loop winback campaign to reactivate churned customers?

To offer Smile.io loyalty points in a Loop winback campaign, note that winback campaigns do not natively support triggering third-party actions, such as automatically adding loyalty points.

You cannot directly configure a winback campaign to issue Smile.io points when a customer reactivates their subscription. There is no built-in option to integrate loyalty point issuance within the winback flow.

If you still want to offer loyalty points, you would need to:

1.  Identify reactivated customers using reports or webhooks.
    
2.  Use Smile.io’s own admin tools or APIs to manually or programmatically credit points.
    
3.  Ensure your internal process correctly aligns the number of points with the customer’s previous subscription value.
    

This setup requires additional operational effort and custom workflow management.

#### What is the recommended way to incentivise churned customers in a winback campaign?

To incentivise churned customers in a winback campaign, you can configure a discount or free gift directly within the winback campaign settings.

Follow these steps:

1.  Go to Loop Admin → Winback Campaigns.
    
2.  Create or edit a winback campaign.
    
3.  Configure a discount or promotional incentive.
    
4.  Define eligibility criteria for churned or expired customers.
    
5.  Save and activate the campaign.
    

Using discounts or free gifts allows you to:

*   Offer an immediate and clear monetary incentive.
    
*   Control margins more effectively.
    
*   Personalise incentives based on subscription value.
    
*   Avoid manual intervention or external automation.
    

If your goal is fast and measurable reactivation, configuring discounts or gifts within the winback campaign is the most straightforward and scalable approach.

#### Is there an alternative to Lovable that Loop can suggest?

Lovable is a Shopify integration that helps you build the store. It is important that Shopify is asked about an alternative as Loop is not in the position to provide an answer to it.

* * *

Related Articles

[

Rise.ai

](https://help.loopwork.co/en/articles/12741244-rise-ai)[

Influence.io

](https://help.loopwork.co/en/articles/12741342-influence-io)[

Smile.io

](https://help.loopwork.co/en/articles/12741347-smile-io)[

Loyalty and credits

](https://help.loopwork.co/en/articles/12801988-loyalty-and-credits)[

Acquire FAQs

](https://help.loopwork.co/en/articles/12858059-acquire-faqs)
