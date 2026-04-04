---
title: "Kaching bundles"
source_url: "https://help.loopwork.co/en/articles/12745875-kaching-bundles"
collection: "07-bundles"
scraped_at: "2026-03-30T17:43:20.516Z"
tags: ["07-bundles"]
---

Learn how to integrate Kaching Bundles with Loop to offer customizable, discounted bundles that increase AOV and enhance the subscription experience.

**Kaching bundles** lets you create customizable product bundles that not only boost average order value **(AOV)** but also improve conversion rates. With its simple bundle builder, you can design bundles that perfectly match your brand’s style while offering volume-based discounts to your customers. Backed by Shopify-native, user-friendly experience and responsive live support, Kaching bundles ensures a smooth setup and ongoing management.

### Key features

*   Select specific products or collections to include in bundles.
    
*   Set discounts as a percentage, fixed dollar amount, or a specific price.
    
*   Customize colors and styling to align with the store’s look and feel.
    
*   Track performance directly in the dashboard, with insights into additional revenue generated.
    
*   Run built-in A/B tests to optimize bundle performance.
    

In this article, we’ll walk you through the steps to integrate Kaching bundles with Loop subscriptions, ensuring that the **correct selling plan is always passed** for each variant selector or checkbox.

* * *

# Prerequisites

Before we understand the use cases, we need to make sure these things are in place.

*   The required bundles are created in the Kaching bundle app.
    
*   The master subscription toggle is enabled in a newly created bundle.
    
*   Only one Kaching widget is used across all products. If multiple widgets are configured, ensure the widget title name is the same across all.
    
*   All products must be mapped to Loop selling plans with the desired frequencies configured.
    

# Understanding popular use cases

Brands often have different requirements for how they want to sell products through Kaching bundles, whether that’s offering specific frequencies, applying discounts, including free gifts, or tailoring other incentives based on their business needs.

In the following section, we’ll explore various use cases and demonstrate how, with the help of Loop, you can implement these scenarios to enable seamless subscription purchases through bundles.

## Case 1: Same subscription frequency for all bundle variants

**Objective:** In this business case, the brand wants to sell products using Kaching bundles with specific rules. Each variant selection on the bundle page should correspond to the same subscription frequency. For instance:

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812984410/d5b9e70d8b36cf28df47da4e41ce/original?expires=1774894500&signature=37db3d6f65ce658d47de1b9ca48b665ef96592f8589f4a82493a8bd804abbcff&req=dSgmFMB2mYVeWfMW1HO4zZPESYZLVj97GMLesyGrAffSvkw1K7EHv1P3zIB8%0A2gMgviIae0Xvy%2Fv%2BGBs%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812984410/d5b9e70d8b36cf28df47da4e41ce/original?expires=1774894500&signature=37db3d6f65ce658d47de1b9ca48b665ef96592f8589f4a82493a8bd804abbcff&req=dSgmFMB2mYVeWfMW1HO4zZPESYZLVj97GMLesyGrAffSvkw1K7EHv1P3zIB8%0A2gMgviIae0Xvy%2Fv%2BGBs%3D%0A)

## Case 2: Different subscription frequencies for different variants + Free gift one time

**Objective:** In this business case, the brand wants to sell products using Kaching bundles with specific rules. For example, when a customer buys products in pairs (like 2 jars or 5 jars), they should receive a free gift one time.

Additionally, each variant selection on the bundle page should correspond to a different subscription frequency. For instance:

1 jar → every 1 month

2 jars → every 2 months

3 jars → every 3 months

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812984411/068b87b5f8ecf2729cb6496f7b0d/original?expires=1774894500&signature=893df94bd0e7274a6c98b5e3eb34e2a17ed2c26a290db6c2e041b4f7cef7ab18&req=dSgmFMB2mYVeWPMW1HO4zQ%2B0VwN2fViAeo1s%2FCzObtKB7nGfNrUuzygvRxyR%0AMvnUHsbyYXgEC%2BxHvUo%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812984411/068b87b5f8ecf2729cb6496f7b0d/original?expires=1774894500&signature=893df94bd0e7274a6c98b5e3eb34e2a17ed2c26a290db6c2e041b4f7cef7ab18&req=dSgmFMB2mYVeWPMW1HO4zQ%2B0VwN2fViAeo1s%2FCzObtKB7nGfNrUuzygvRxyR%0AMvnUHsbyYXgEC%2BxHvUo%3D%0A)

## Case 3: Different subscription frequencies for different variants + Free gift on a recurring subscription interval

**Objective:** In this business case, the brand wants to sell products using Kaching bundles with specific rules. For example, when a customer buys more products in pairs (like 2 bottles or 5 bottles), they should receive a free gift on each subscription order.

Additionally, each variant selection on the bundle page should correspond to a different subscription frequency. For instance:

Buy 1, get 1 free → every 1 month

Buy 2, get 3 free → every 2 months

Buy 3, get 6 free → every 3 months

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812984405/a1883615bf366b4b6d8d1d8f8191/original?expires=1774894500&signature=d5d1170328e19b58731ddeb89f48811407c52bc810b279b8c9796b6711ad87d6&req=dSgmFMB2mYVfXPMW1HO4zY2eXdDuA5%2FumM8o9zPs2fuorWBivZQYqmxo3NjU%0AIQ55d78fUJpCgrm8GCw%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812984405/a1883615bf366b4b6d8d1d8f8191/original?expires=1774894500&signature=d5d1170328e19b58731ddeb89f48811407c52bc810b279b8c9796b6711ad87d6&req=dSgmFMB2mYVfXPMW1HO4zY2eXdDuA5%2FumM8o9zPs2fuorWBivZQYqmxo3NjU%0AIQ55d78fUJpCgrm8GCw%3D%0A)

To ensure the correct selling plan is passed to the product variant selector, please reach out to the Loop team at [\[email protected\]](/cdn-cgi/l/email-protection#04777174746b767044686b6b74736b766f2a676b)

To include a gift using Kaching as either a one-time purchase or a subscription, please reach out to Kaching bundles support for assistance in setting up this use case.

# FAQs

#### Which quantity break app works well with Loop?

The quantity break app - Kaching Bundles works well with Loop Subscriptions.

#### How do I ensure that the Katching bundle setup is working fine with Loop selling plans?

To ensure the Katching bundle setup is working fine with the Loop selling plan,  
​  
1\. Create a Test Product - which doesn't contain the current bundle + widget code.  
2\. Add the Test product to the selling plan in Loop  
3\. Create a Bundle in Kaching Bundle  
4\. Map the test product in the Kaching bundle  
5\. Enable the subscriptions in the Kaching bundle  
​  
You'll always need to get in touch with the Katching team to ensure the widget can sync with the Selling plan from Loop.

#### How can I ensure that the free gift item offered via Kaching bundles (e.g., Buy 1 Get 1 Free) is applied only as a one-time item and not added repeatedly for free in subscription recurring orders?

To ensure the free gift is applied only once, make sure the gift item is not included in any selling plans on the Loop. If the free gift is part of any of the selling plans on loop, it will be added as a subscription item.  
The recommended approach is to create a duplicate SKU of the gift item and use this duplicate SKU in Kaching specifically for the free gift offer. This prevents the gift from being treated as a subscription item.

#### The one-time free gift offered via Kaching bundles is charging shipping at checkout. How can I prevent this? I have already set up free shipping for subscriptions.

This is expected Shopify behaviour.

Shopify treats one-time purchases and subscription items separately, so shipping charges may still apply to the one-time free gift even if subscriptions have free shipping.

For **Shopify Plus merchants**, this can be resolved by using the **Checkout Blocks** feature. Checkout Blocks allow you to create custom shipping rules at checkout, including setting **free shipping for mixed carts** (carts containing both one-time items and subscription items).

#### How can I setup Buy-On-Get-One bundle using Kaching and keep a recurring checkout text?

Follow these steps to create a Buy X, Get Y bundle using Kaching.

1.  Open Bundles
    
    1.  Go to Kaching → Bundles
        
    2.  Click Create Bundle Deal
        
    
2.  Choose Deal Type
    
    1.  Select Buy X, Get Y Free (BOGO)
        
    2.  Choose Specific Products
        
    
3.  Select the products you want to include in the bundle
    
    1.  Configure Quantity Breaks
        
    2.  Add a Bar and choose Quantity Break
        
    3.  Move this new bar to the top
        
    4.  Set quantity to Buy 1, Get 0 (this acts as the base option)
        
    
4.  Clean Up Default Bars
    
    1.  Delete the default bar that says Buy 1, Get 1
        
    2.  You should now keep only the 3 bars you need
        
    
5.  Edit Bundle Options
    
    1.  Update the remaining bars as follows:
        
        1.  Buy 2, Get 1
            
        2.  Buy 3, Get 2
            
        
    2.  For each bar:
        
        1.  Update the title
            
        2.  Set the correct quantity /discounts/pricing
            
        3.  Ensure the correct product is selected
            
        
    
6.  Remove Free Gift from the Buy X Get Y template
    
    1.  Disable or remove the Free Gift section (not needed for this setup)
        
    
7.  Under Visibility, select “Specific selected products.”
    
8.  Make sure at least two products are selected:
    
    1.  The product included in the bundle
        
    2.  One additional product (can be any)
        
    
9.  For each bar, select the correct product that should be sold.
    
10.  Preview
     
     1.  Clear cart
         
     2.  Preview the bundle on the product page and go till checkout
         
     3.  Check the recurring subtotal text
         
     4.  Once confirmed, it is coming as expected, turn the bundle on.
         
     

[Explore more FAQs](https://help.loopwork.co/en/collections/16646422-frequently-asked-questions-faqs)

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#4f3c3a3f3f203d3b0f2320203f38203d24612c20) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Subscription discounts

](https://help.loopwork.co/en/articles/12716873-subscription-discounts)[

Preset fixed bundle

](https://help.loopwork.co/en/articles/12729092-preset-fixed-bundle)[

Build your bundle

](https://help.loopwork.co/en/articles/12741075-build-your-bundle)[

Bundle discounts

](https://help.loopwork.co/en/articles/12741206-bundle-discounts)[

Bundle JavaScript events & window variables for custom experience

](https://help.loopwork.co/en/articles/12741415-bundle-javascript-events-window-variables-for-custom-experience)
