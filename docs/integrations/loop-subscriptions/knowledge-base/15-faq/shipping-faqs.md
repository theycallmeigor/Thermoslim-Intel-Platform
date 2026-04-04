---
title: "Shipping FAQs"
source_url: "https://help.loopwork.co/en/articles/12878301-shipping-faqs"
collection: "15-faq"
scraped_at: "2026-03-30T17:43:23.886Z"
tags: ["15-faq"]
---



# General queries

#### How to give free shipping on a subscription where a free gift product is also added, making it a mixed cart?

There are two possible solutions to achieve this:

1.  If you have Shopify Plus, you can use Checkout blocks and create a discount for free shipping to apply a rule that checks the availability of selling plan on checkout.
    
2.  If you don't have Shopify plus, you can create a custom shipping profile on Shopify and then map the free product to this shipping plan.
    

#### Why is my subscription shipping profile not visible in Loop admin?

This usually happens when the shipping profile is linked to selling plans that no longer have any products mapped.In such cases, the profile becomes unusable and cannot be used again.  
​  
Loop only displays **Subscription-type shipping profiles**. When the mapped selling plans do not have any products, the profile automatically changes to a **Custom profile**, which is why it disappears from the Loop Admin..

#### The delivery/shipping rates are incorrect. I updated them already, but customers are still paying the old rates.

Kindly check Loop > Settings > Auto Updates and see if the Auto Update is turned off. If you enable it, the shipping price will be recalculated and updated.

This feature is designed to make sure the third-party app ratings do not impact the shipping prices for subscriptions.

#### How can I identify and fix subscriptions with missing shipping addresses?

To identify and fix subscriptions with missing shipping addresses, use both the Customer Portal banner and the Admin alert.

**In the Customer Portal:**

When a subscription contains at least one shippable product but has no shipping address, a “Shipping address required” banner is displayed.

Customers can:

1.  Go to their subscription in the Customer Portal.
    
2.  Click the Add address button where the shipping address is shown as N/A.
    
3.  Enter and save their shipping address.
    

You can customise the banner text by going to:

Customer Portal → Themes → Texts → Delivery address missing banner.

**In the Admin Portal:**

To find subscriptions that are missing shipping addresses:

1.  Go to the Admin Portal.
    
2.  Navigate to the Alerts section.
    
3.  Look for the alert titled “Subscriptions found with no shipping address” under the Subscriptions category.
    
4.  Click the alert to open the Subscriptions report filtered to show subscriptions where the delivery address is missing.
    

You can use this list to contact customers and ask them to update their shipping address before the next order is processed.

#### We are based in Canada, and our Mail service, Canada Post, is about to go on strike. This means we can't ship to certain locations. We've added some restrictions to Shopify for these locations. But I also need to add them into Loop so that we don't put through recurring orders to locations we can't ship to during the strike. What would be the best way to do that?

If you do not want to ship to a certain location, and you have already restricted those locations in Shopify. You need to add them to Loop so that you don't put through recurring orders to locations you can't ship:

1.  Exclude certain provinces from your Shopify shipping zones. Loop does fetch province and shipping zone data from Shopify, but here's an important point to note:
    

Once a subscription contract is created, it retains the customer's original shipping address - including provinces that may now be restricted. That’s why those existing subscriptions are still processing orders despite the updated Shopify settings.  
​

**What you can do:**

*   Pause subscriptions temporarily
    
*   Use bulk actions to pause those subscriptions temporarily. You can reactivate them once shipping resumes.
    

If you don't see a way to add a filter based on the customer's location in bulk actions. There is an easy way to generate a report of active subscriptions for specific locations:-

You’ll need to export the subscription report based on location and then run bulk actions on the relevant subscriptions. Here's how you can do that:

Go to Analytics > Reports > Subscriptions.

Export the report.

Use that exported list to run a bulk action - either to pause the subscriptions or skip the next order for those customers.  
​

**Note:** While we can include the delivery province in the data for visibility, we currently don’t support filtering by province directly within the platform.

As a workaround, we recommend exporting the report and applying filters in Excel based on the provinces.

#### What will happen to the shipping title when we update prices using recalculate shipping if there are two selling plans associated under the same susbcription id?

When shipping is recalculated, and multiple shipping profiles are involved, Shopify merges them under one generic shipping title, even though the rates may come from different profiles.

#### I'm getting an error every time I try to change the address of the customer within Loop. It has changed in Shopify with no issues. It's giving me a "Delivery Method Shipping Address Province Code is Invalid" error

For the error: "Delivery Method Shipping Address Province Code is Invalid" while updating the Customer address via Loop after you have updated it in Shopify already, we suggest you check:

1.  Are the billing address and Shipping Address both correct in Shopify?
    
2.  The subscription product is available and not 'Out of Stock, ' which sometimes can cause this issue.
    

#### How much time does it take for the Shopify address sync into Loop?

Currently, we do not sync the Shopify address with Loop directly, it is suggested that you ask the Customer to update the address in the Customer Portal.

#### Which Shipping apps integrations are available with Loop?

For shipping apps, any app that is compatible with Shopify is compatible with loop too

* * *

Related Articles

[

Auto-update shipping price in Loop

](https://help.loopwork.co/en/articles/12732064-auto-update-shipping-price-in-loop)[

Subscription shipping profiles

](https://help.loopwork.co/en/articles/12732320-subscription-shipping-profiles)[

Update shipping details

](https://help.loopwork.co/en/articles/12734541-update-shipping-details)[

Update shipping address and method

](https://help.loopwork.co/en/articles/12734556-update-shipping-address-and-method)[

Settings FAQs

](https://help.loopwork.co/en/articles/12858166-settings-faqs)
