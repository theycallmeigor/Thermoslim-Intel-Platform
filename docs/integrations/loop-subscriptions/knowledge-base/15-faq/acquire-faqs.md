---
title: "Acquire FAQs"
source_url: "https://help.loopwork.co/en/articles/12858059-acquire-faqs"
collection: "15-faq"
scraped_at: "2026-03-30T17:43:24.675Z"
tags: ["15-faq"]
---



# Selling plan

#### How can I change the texts (Subscribe and Save) and description/details displayed on the widget at the product page (PDP) storefront?  

The texts and details displayed on the widget can be updated by navigating to Loop Admin portal > Acquire > Selling plans > (open the specific selling plan). For widget purchase option titles, update the 'Name' field. For the description on the widget, navigate to Advanced options > Selling plan description (HTML enabled).

#### How do I locate my selling plan ID?

To locate a 'selling-plan-ID', please open a selling plan and locate the number starting with # under the given delivery frequency, which is your unique selling plan ID based on your delivery frequency.

To find the 'selling-plan-group-ID', please look for the number given in the URL of a selling plan after /selling-plans/.

#### How was a Subscription created even when a selling plan was not available on the storefront?

There could be a chance that the subscription was created by the 'Shop sales channel'. Please verify: Loop admin > Subscriptions > Specific subscription detail page > Open order# and check on the top if it shows 'Shop'. This feature was enabled automatically by Shopify, resulting in subscription creation via the Shop channel.  
​

Recommended action for brands: Turn OFF the Subscriptions setting if they do not wish to sell subscriptions via Shop by visiting Shopify Admin > Sales Channels > Shop > Settings > Subscriptions  
​  
​**Impact:** When the Subscriptions setting is OFF, buyers will still see the subscription product on the Shop but will be redirected to the brand’s online store to complete the subscription purchase.

#### What is the process for Replo and Selling Plan mapping?

Following is the process for the Replo and Selling Plan mapping:  
​  
Once a product is mapped to a selling plan in Loop, and that product is used in Replo, where Replo’s widget is already embedded, the selling plan will automatically attach to the Purchase Option Selector.  
No additional configuration is needed in Replo beyond ensuring the product is correctly mapped to a selling pla,n and the widget is placed  
​  
To sum up:

1.  Replo fetches all selling plans mapped on a product.
    
2.  Replo's widget will show all Loop selling plans if the product is mapped to different selling plans.
    
3.  Selling plans hidden onthe storefront will also be fetched by Replo. That setting won't work with the Replo widget
    
4.  Replo widget placement and customisation are handled within Replo.
    

#### Why was a subscription created even though no selling plan was visible on the storefront?

This may have occurred due to the Shop sales channel. Shopify automatically enabled a feature that allows subscriptions to be created through the Shop app, even if they aren’t available directly on your storefront. To verify if this is the case:  
Go to Loop Admin > Subscriptions > \[specific subscription\] > Order#. At the top of the order page, check if the source is listed as ‘Shop’.

#### Why does it sometimes show "Sync in progress" for collections in the selling plan?

Syncing collection/products in selling plan usually doesn’t take long. Have you tried refreshing the page and giving it another try? If that does not work, perhaps you can remove the product and add it again.  
​  
If not, please let the support team know and someone should be able to take a look into it.

#### How do I pass the selling plan to the variant picker in 'Quick order list', as adding the subscription to the cart is not updating the prices in the variant picker from 'quick order list'.

Here are the steps to pass the selling plan to 'Quick Order List variant picker':

*   Whenever ‘One-Time’ is selected in our widget, the selling plan value inside the form becomes null. When ‘Subscribe & Save’ is selected, the form contains a selling plan value.
    
*   If the top form has a selling plan value, then for all products listed below, display the price coming from the product JSON data under the selling allocation group.
    
*   If the selling plan value in the top query selector is null, then show the base price in the variant selector below.
    
*   Also, whenever a selling plan price is being shown, the selling plan must be passed in the add.js call for ‘Add to Cart’. Everything should map to a single selling plan because multiple selling plan values cannot be passed in a single add.js call.
    

#### How to set up a new selling plan that should have a swap, in which only the customer's first replacement is free, and not for future orders?

You can set this up in Loop by using the Flows feature to automate a free first replacement.

*   Enable product swapping in your Customer Portal settings
    
*   This lets customers swap products without cancelling their subscription.
    
*   Create a new Flow in Loop > Retain > Flows
    
*   Set the trigger to "A new subscription is created" so the automation starts when a customer signs up.
    
*   Add an action to swap the original product with the replacement
    
*   This ensures the first replacement is processed automatically.
    
*   Apply a 100% discount to the swapped product  
    This makes the first replacement free, while future swaps will be charged as usual.  
    ​  
    To make sure the 100% discount only applies to the first replacement and not future swaps, you’ll want to set up a tiered discount in your selling plan:
    

*   Enable "Change discount after specific number of orders"
    
*   Go to your Selling Plan settings and look for the option to change the discount after a certain number of orders. This lets you set different discounts for each swap.
    
*   Set 100% discount for the first order
    
*   Apply a 100% discount to the first replacement order, making it free for the customer.
    
*   Set discount to None (or your standard rate) for all future orders
    
*   For the second swap and beyond, set the discount to 0% or your usual price so customers are charged as normal.  
    ​  
    This setup ensures only the first swap is free, and all future swaps are billed at the regular rate.
    

#### Is it possible to adjust the delivery intervals for an existing subscriber? For example, if a customer is on a 3-month prepaid plan with monthly deliveries, can the delivery interval be modified to a custom frequency, such as every 26 days?

Yes, you can set the delivery interval to 26 days within the selling plan settings.  
To do this, navigate to Loop > Acquire > Selling Plans, select the plan you want to modify, change the frequency dropdown to Days, and then set the interval to 26.  
If you need any assistance while updating this, feel free to let me know.

#### How can I send 2× the quantity of the same item linked to a selling plan?

There are 3 ways to send 2× the quantity of the same item linked to a selling plan.

1.  Use kaching bundles - without having to use variants
    
2.  However, if you want to use variants, you can do the following using Preset Bundles.
    
    1.  Create a parent product with two child items.
        
    2.  Set quantity 1 for Child Item A
        
    3.  Set quantity 2 for Child Item B
        
    
3.  If you don't want to use preset bundles, kaching bundles, or variants, we suggest that you set the 2× quantity directly in the selling plan by modifying the selling plan code
    

#### How can I set up a discount for the first month’s subscription, but no discount for future months?

Set up a discount for the first month’s subscription, but no discount for future months, and use the “Change discount after specific number of orders” option under the Selling Plan settings.  
​  
For example, if you want the discount to apply only to the first order, set the rule to change the discount after 1 order and choose “None” as the new discount.  
​  
This ensures that after the initial order, the product renews at its regular price with no discount applied to subsequent months.

#### What will happen to the subscription if I delete the selling plan after subscriptions are created with it?

Once a subscription contract is created, it will continue to operate at its configured frequency even if the frequency or the selling plan is deleted.

#### How do I archive the selling plan? I don't want to lose the current customers on the plan, though.

To archive selling plan without losing customers:

1.  Go to Loop > Acquire > Selling Plans.
    
2.  Click on the selling plan you want to hide.
    
3.  Navigate to Availability.
    
4.  Choose where you want to hide the selling plan by selecting the appropriate options: Checkout, Customer Portal, Admin Portal, Storefront product pages.
    

#### How can I view and select selling plans for subscription products in the Admin Portal?

To view and select selling plans for subscription products in the Admin Portal, follow these steps:

1.  Open the subscription in the Admin Portal.
    
2.  On each subscription line item, view the Selling Plan Group Name displayed directly alongside the product details.
    
3.  To add a new product, click Add Product.
    
4.  To modify an existing product, click Edit on the line item.
    
5.  Select the appropriate selling plan from the list of available selling plans.
    
6.  Save your changes.
    

When you select a selling plan, the discount type and pricing automatically recalculate based on the selected plan. This ensures the subscription has the correct billing configuration and pricing.

To pass selling plan group details using the Add Line or Swap Line API, include the following fields in your API payload:

*   sellingPlanGroupId
    
*   sellingPlanName
    
*   sellingPlanGroupName
    
*   sellingPlanGroupMerchantCode
    

This allows you to correctly assign the intended selling plan group when adding or swapping subscription line items through the API.

* * *

# Widgets

#### How can I display multilingual translation on widget texts?

The multilingual translation feature inside the widget is a part of the "Pro plan" offered by Loop. You can go to Loop > Settings > Multilingual texts to access this feature.

#### We recently published an updated version of our website theme and noticed  
that the Loop subscription widget is not active. Can you assist us with adding the  
plugin to the live theme?

If the Loop widget is not available on your new and recently switched theme, there is a high chance that your subscription widget isn’t mapped to any theme at the moment, and the Loop Subscription Widget App Block hasn’t been added in your new theme’s customisation. That’s why the subscription options aren’t appearing on your storefront.  
​  
Whenever you switch themes, you’ll need to follow a few quick steps to enable the subscription widget on the new theme.

#### Please provide the widget render code?

This is the widget render code -

{% render 'loop-subscriptions', type: 'product-widget', product: product %}

#### My product page (PDP) shows 2 widgets and I want to remove one? How can I remove it?

In case your product page (PDP) shows more than 1 widget, it might be due to your page having an app installed from another provider. You'll therefore need to go to Shopify > Theme and then remove the widget from there. To find out which widget is installed on your product page, you can open the website in Chrome, right click > Inspect > and then click the small logo near 'Element' (it has an arrow in the top left direction and is called 'select the element in the page to inspect it').  
​  
You can also use CMD+SHIFT+C on a mac laptop or CTRL+SHIFT+C on windows to enable it. Once enabled, please mouse hover on the widget, and the name of the widget brand should appear in most cases.

#### Why can't I see the Loop option in my Shopify > Theme > Customise section?

One of the reasons why you can not add the Loop widget in Shopify > Online Store > Theme > Customise section is that your theme might not be eligible for V2 widget. In this case, you can either use a theme compatible for v2 widget (examnple 'Default' theme) or you can use v1 widget on your current theme.  
​  
Please get in touch with support team for help related to v1 widget.

#### I have accidentally deleted Custom CSS in the Loop widget from the app. Can I retrieve it somehow?

It is not possible to retrieve Custom CSS in the Loop widget from the app if you delete it, even accidentally. It is store in the theme and Loop can not control it in anyway.

#### Why am I not able to add bulk templates to widget? If I add the templates and don't use the Map widget, would I still be able to add 10 more templates?

You can add up to 10 templates at a time. Once added, please map those templates before proceeding to add more.  
Note: The maximum number of templates you can add in a single batch is 10.

#### How can we add the Loop subscription widget to the quick view modal? It seems app blocks are not allowed on modal templates.

To add the Loop subscription widget in the quick view modal, just render the same PDP of the particular product in your modal template, and it should then fetch automatically. Also, if the theme is not eligible for the widget, then we'll end up adding the widget manually since it might not be supported. We call it the v1 widget.

#### What is the logic to pass selling a pan to a widget?

The Logic to pass seling plan to widget is: Whenever ‘One-Time’ is selected in our widget, the selling plan value inside the form becomes null. When ‘Subscribe & Save’ is selected, the form contains a selling plan value. If the top form has a selling plan value, then for all products listed below, display the price coming from the product JSON data under the selling allocation group. If the selling plan value in the top query selector is null, then show the base price in the variant selector below.  
​  
Also, whenever a selling plan price is being shown, the selling plan must be passed in the add.js call for ‘Add to Cart’. Everything should map to a single selling plan because multiple selling plan values cannot be passed in a single add.js call.  
​

#### How do I show an indicator or text if people hover over the widget?

To show an indicator text on the widget, here are a few things you can do:

1.  Amend the details on the selling plan. (Applies to selling plan)
    
2.  Change the text 'Purchase Options' from the widget itself. (Applies to all products)
    
3.  If you need to do it for a few products is to:
    
    1.  Create a new widget template in Loop and link the relevant products
        
    2.  Create a new widget and attach those products by implementing option 2.
        
    

#### How to change the Save {{discount\_value}} to %?

To change the Save {{discount\_value}}, go to Loop> Acquire> Widget> Text> Discount badge text and make changes.

#### How do I edit the subscription details tool tip? I want to edit the part that appears when u hover over subscription details.

You can update the subscription details tool tip by navigating to:  
Loop > Acquire > Widget > Select your widget > Texts > Subscription details description (HTML enabled).  
From there, you can modify the content as needed.

#### Can I show a widget with custom quantity options using the quantity selector?

Loop does not directly control the quantity selector as it is independent of the widget, but you can try writing a custom js script to create a custom solution, OR use preset bundles.

#### How to change the colour of the Loop widget?

To change the colour of the widget, please head to the Aquire > Widget > Styles. In the Styles tab, you can change the background colour, border colour, and other style elements to match your preferences, and also add custom CSS for advanced options

#### Why did my widget disappear automatically, even when the selling plan was mapped?

Please check if recently made changes (like selecting an option) after A/B testing based on external app. There is a chance that a new selling plan may have been selected by default which might not have the products mapped, thus making the widget disappear.

* * *

#   
Discounts

#### Is there an easy way to implement stacking discounts based on the number of subscriptions, ie, increase the overall discount % with each new subscription?

Unfortunately, there is NO way to implement stacking discounts based on the number of subscriptions, i.e. increase the overall discount % with each new subscription?

#### A merchant sees a lifetime subscription discount (e.g., 10% after 9 paid orders) showing as if it will apply after fewer orders than expected. Why?

This behavior is normal and only informational. When a milestone-based discount is configured, the system calculates the remaining orders needed before the discount applies based on orders already placed.  
​  
​**Example**:  
Discount: 10% after 9 paid orders.  
Subscription has 1 order already completed.  
​  
The system preview shows the discount applying after 8 more orders.  
​  
This does not mean the discount is applied early. It simply reflects how many additional orders are required before the milestone is reached. As soon as the configured number of paid orders is completed (in this case, the 9th order), the discount will apply automatically.  
​  
Key points for merchant communication:  
​  
Orders already completed reduce the remaining count shown in the plan preview.  
​  
The “after X orders” indicator is informational — the discount will only apply once the milestone is reached.  
​  
Merchants can be reassured that the discount is tracking correctly and no manual adjustment is needed.

#### Is there a way to disable the discount for customers to be applied on the Loop subscriptions?

To stop the Shopify discount from getting applied on Loop Subscriptions, please head to the Customer Portal > Preferences > Disable "Allow customers to apply discount codes as configured in Shopify

* * *

Related Articles

[

Preset fixed bundle

](https://help.loopwork.co/en/articles/12729092-preset-fixed-bundle)[

Loop widget set up

](https://help.loopwork.co/en/articles/12729262-loop-widget-set-up)[

Integration FAQs

](https://help.loopwork.co/en/articles/12858151-integration-faqs)[

Customer portal FAQs

](https://help.loopwork.co/en/articles/12858156-customer-portal-faqs)[

Manage subscription FAQs

](https://help.loopwork.co/en/articles/12858164-manage-subscription-faqs)
