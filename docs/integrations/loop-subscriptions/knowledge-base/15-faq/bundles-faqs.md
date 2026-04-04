---
title: "Bundles FAQs"
source_url: "https://help.loopwork.co/en/articles/12858139-bundles-faqs"
collection: "15-faq"
scraped_at: "2026-03-30T17:43:23.896Z"
tags: ["15-faq"]
---



#### Does Bundle have multi-currency support?

Multi-currency is not supported in bundles for now. The items are viewed in Store currency on the bundle page. However, on checkout, the subtotal is done using the market currency.

#### Is it possible to add a bundle to an ongoing bundle subscription?

Yes, it is possible to add, but the frequency of both bundles needs to be the same; else the bundle will get added as one time.

#### We deleted the subscription bundles from Loop. Why is it still visible on the website?

If you deleted the subscription bundles from Loop, but it is still visible on the website, you may need to check if the Bundle URL has been rendered anywhere on your website.  
​  
If so, you’ll need to remove it from there as well, since the widget will become unresponsive if the bundle status is changed to draft or if the bundle is deleted.

#### Why is a product getting a double discount for the bundle?

The extra or double discount on bundles could be due to the selling plan being mapped to a bundle. Bundles are recommended to have a separate selling plan if you intend to use discounts inside selling plan itself.

#### Why am I getting the error “Minimum product count allowed for the category should be less than or equal to the box size” when updating the BYOB Range Bundle limits?

You are seeing the error “Minimum product count allowed for the category should be less than or equal to the box size” because the category-level product limits in your BYOB Range Bundle are higher than the box size you have set.

In a Range Bundle, the box size defines how many total products a customer can add. Each category inside the bundle also has its own minimum and maximum product limits. The category limits must always be less than or equal to the overall box size.

If you reduce the Range Bundle minimum or box size from 10 to 6, but the category-level product limit is still set to 10, the system will show an error because a category cannot allow more products than the total box size.

To resolve this, follow these steps:

1.  Go to Bundles and open your BYOB Range Bundle.
    
2.  Update the box size or minimum limit to your desired value, for example, 6.
    
3.  Scroll to the category configuration section within the bundle.
    
4.  Edit the minimum and maximum product limits for each category.
    
5.  Ensure that both values are less than or equal to the new box size, for example, 6.
    
6.  Save the bundle.
    

You must keep the category-level limits aligned with the box size to prevent this validation error.

#### Why are products not visible in the bundle page?

If products are not appearing in the bundle, please review the following pre-checks to ensure everything is configured correctly:

*   **Selling Plan Linkage** - Make sure the products are properly linked to an active selling plan.
    
*   **Bundle Plan Configuration** - Check the bundle configuration and confirm that the selling plan associated with the bundle includes the relevant products too.
    
*   **Category-Level Mapping** - Ensure the products are added at the category level and are present within the bundle configuration settings.
    

#### I am trying to delete the bundle, but seeing the error Bundle added to active Subscription.

If you are trying to delete the bundle and you get a pop-up saying 'Bundle added to active subscription', it means that there is an active subscription linked to this bundle. It is not ideal to delete this bundle. You are advised to kindly get in touch with the support team and ask for help.  
​  
To find the associated subscriptions for that bundle, please go to Analytics > Reports > Subscriptions > Status = Active & Bundles = Build your bundle

#### How do I change the custom URL of my bundle page?

The custom URL of my bundle page can only be changed via a custom API implementation. Simply changing the link would not work; you will need to integrate Loop APIs into your store for this.

#### When I add a Shopify bundle product as a subscription in the cart, the loader runs for a moment by displaying that the product is getting added to the cart, but the cart becomes blank.

Shopify bundles cannot be sold as subscriptions, which might be a reason why the cart becomes blank when a Shopify bundle product is added to the cart after the loader runs for a while.

#### Why is there an error "Failed to update bundle" while adding 1 more product/meal in the bundle?

The error "Failed to update bundle" could be related to several issues.

1.  One possibility is that there may be a configuration issue with the bundle itself, especially if there are limits set on the number of items that can be added to the bundle. For instance, merchants can limit customers from adding a certain product to a bundle up to a specified quantity, and if that limit is reached, it could result in an error when trying to add more items.
    
2.  Additionally, there have been reports of errors occurring when trying to update bundles, particularly with larger meal plans, where the system might not be able to process the request due to configuration issues
    

If the problem persists, it may be helpful to check the bundle configuration or reach out for further assistance

#### If I sell preset bundles outside the Loop widget, how can I ensure child items are added correctly at checkout?

To ensure preset bundle child items are added correctly when the bundle is purchased outside the Loop widget, no additional setup is required from your end. Whenever the preset bundle parent product is purchased - whether as a one-time purchase or subscription and from any source - the checkout order is automatically edited to add the bundle child items at a 100% discount. This ensures the bundle structure remains consistent across all checkout sources.

#### How are preset bundle child products handled when the parent product is purchased from different sales channels?

To maintain consistency in preset bundle purchases across different sales channels, the system automatically edits the checkout order whenever the parent bundle product is purchased. The child products are added to the checkout at a 100% discount, regardless of whether the purchase happens via the Loop widget or any other source, and regardless of purchase type. This removes inconsistencies when bundles are purchased outside the widget.

#### Is it possible to create a subscription for one product that is a part of the bundle/ belongs to the bundle?

Currently, it is not possible to create a subscription for a single product that belongs to a bundle.

#### Can I use the upgrade on checkout for one-time bundles?

Upgrade on checkout for on-time bundles is not supported.

#### Why are bundle products hidden and cannot be added due to the footer of the page?

If bundle products are hidden and cannot be added due to the footer of the page, it might happen if the footer's position is fixed. You can fix this by writing custom CSS to make the footer's position adjustable.

#### Merchant has configured the bundle to redirect users to the collection page after clicking on 'Add to cart' - can we replicate this same behaviour for the customer when they edit the bundle from the customer portal?

This isn’t currently possible due to a product limitation. At the moment, we only support an “Add to cart redirection” option, and we do not have a dedicated feature for “Update to cart redirection.”  
If this becomes available in the future, we will be sure to let you know. Let me know if you’d like me to submit this as a feature request.

#### We recently made some styling updates to Bundle, but these changes are not reflecting on Storefront.

In almost all cases, if the styling changes done to bundles are not reflected on the storefront, it is a cache/cookie issue. Please try opening the store in an incognito browser, and if that doesn't work, then reach out to the support team.

#### Why do you not use the +/- quantity adjuster buttons in the cart page for the preset bundle?

We do not show +/- quantity adjuster on the cart page for preset bundles because each bundle is assigned its own unique transaction ID when it’s added to the cart, and this ID cannot be generated directly from the cart page.

#### In Build Your Own Bundle, I’ve configured the bundle, but I’m not able to see the frequency options like One-time or Subscription. What should I do?

If you can not see the frequency options in bundles, please follow these steps:

*   Go to Loop App → Bundles.
    
*   Select the BYOB bundle where the options are not visible.
    
*   Navigate to the Design tab → Styles.
    
*   Check the Bundle Size and Frequency Selector settings.
    
*   Ensure that the option “Display Bundle Frequency Selector” is enabled.
    
*   Enabling it, refresh your bundle view page.
    

The frequency options should now be visible.

#### How to add additional details like a meal's micronutrients to the product cards displayed in the BYOB bundle?

To add macro details or information to the product cards, you can retrieve the data from the metafields associated with each item in Shopify and utilise the Loop bundle props.

By using Loop bundle props, you can display important product details from the product metafields as a short description.

All the bundle information is accessible through the following window variable: window.loopBundleProps.

This needs to be done at your end.

#### How do I shift existing individual subscriptions (not subscribed through a bundle) to bundle subscriptions, with the same discount configurations as in the existing bundle?

To move the existing individual subscriptions to bundle subscriptions, do the following:

*   Go to the detail page on the admin for each subscription
    
*   Click "Add product" and then the required bundle
    
*   Select the items in the bundle builder same as those present in the subscription
    
*   Add bundle to subscription
    
*   Remove the individual products
    
*   Repeat for another subscription
    

#### If we delete a bundle from the Loop, would the parent product get affected?

The parent product doesn't get affected if we delete a bundle. Even for the existing subscribers who purchased bundles, the recurring cycle will go on, but the new ones won't be able to purchase bundles as subscriptions, because they will get deleted.

#### Why am I getting an error while adding Shopify bundles to the cart as susbcription?

Shopify bundles cannot be sold as susbcription and this is a limitation from the Shopify end.

#### How do I add auto select bundles items so customers don't have to select?

If you wish to provide auto-selected items in the Bundle to customers, please follow these steps:

1.  Identify the variant IDs in Shopify that need to be pre-selected.
    
    1.  Example: 46310329614593, 46767604793601, 46782304518401
        
    
2.  Take the existing Bundle URL: https://STOREURL.myshopify.com/a/loop\_subscriptions/bundle/afcb3560180844bb8709213788\[…\]edVariants=46123231019265,46090008494337,46089983426817
    
3.  Add the new variant IDs at the end of the existing ones, separated by commas (,): https://YourstoreURL.myshopify.com/a/loop\_subscriptions/bundle/afcb3560180844bb8709213788**\[…\]**9983426817,46310329614593,46767604793601,46782304518401
    
4.  Use this URL on your checkout page or link that has the items pre-selected.
    
5.  This will pre-select all the required products in the bundle.
    

#### How do I remove auto selected bundles items so customer can choose by themself?

To stop items from getting auto-selected in bundles for customers:

1.  Identify the variant IDs in Shopify that you want to remove from pre-selection.
    
    1.  Example: 46310329614593, 46767604793601
        
    
2.  Take the existing Bundle URL that already has pre-selected variants:
    
    https://YourstoreURL.myshopify.com/a/loop\_subscriptions/bundle/afcb3560180844bb8709213788\[…\]?selectedVariants=46123231019265,46090008494337,46089983426817,46310329614593,46767604793601
    
3.  In the URL, locate the selectedVariants parameter.
    
4.  Remove the variant IDs that you do not want to be pre-selected from the list and keep the remaining ones separated by commas (,):
    
    https://YourstoreURL.myshopify.com/a/loop\_subscriptions/bundle/afcb3560180844bb8709213788\[…\]?selectedVariants=46123231019265,46090008494337,46089983426817
    
5.  Use this updated URL on your checkout page or link.
    
6.  This will ensure that only the remaining variants are pre-selected, and the removed items will no longer be auto-selected in the bundle.
    

* * *

Related Articles

[

Bundles overview

](https://help.loopwork.co/en/articles/12729045-bundles-overview)[

Preset fixed bundle

](https://help.loopwork.co/en/articles/12729092-preset-fixed-bundle)[

Build your bundle

](https://help.loopwork.co/en/articles/12741075-build-your-bundle)[

Bundle JavaScript events & window variables for custom experience

](https://help.loopwork.co/en/articles/12741415-bundle-javascript-events-window-variables-for-custom-experience)[

Kaching bundles

](https://help.loopwork.co/en/articles/12745875-kaching-bundles)
