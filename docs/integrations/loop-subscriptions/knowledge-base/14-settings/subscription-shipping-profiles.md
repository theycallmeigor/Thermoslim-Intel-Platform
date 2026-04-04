---
title: "Subscription shipping profiles"
source_url: "https://help.loopwork.co/en/articles/12732320-subscription-shipping-profiles"
collection: "14-settings"
scraped_at: "2026-03-30T17:39:03Z"
tags: ["settings"]
---

[[3. [Order and shipping settings](https://help.loopwork.co/en/collections/16428990-order-and-shipping-settings)
[Order and shipping settings](https://help.loopwork.co/en/collections/16428990-order-and-shipping-settings)

# Subscription shipping profiles
Learn how to create and manage subscription-specific shipping profiles in Loop to set flexible, tailored shipping rates for recurring orders.
In the subscription ecosystem, it’s a common use case for brands to offer free or discounted shipping on recurring orders as an incentive for their subscribers. To achieve this, it's crucial to have the right configurations in place for setting up subscription-specific shipping profiles.
This guide will walk you through the necessary steps to configure these profiles, explain what shipping profiles are, cover the types available, and outline the limitations of configuring shipping profile rates.

# What is a shipping profile?
In Shopify, a shipping profile helps determine the shipping rates applied to your orders based on the products, locations, and zones that are part of that profile. Shipping profiles define how shipping rates are calculated depending on factors such as:
- Products: Different products can be grouped and assigned to specific shipping profiles. (What is being shipped)
- Locations: You can define where products can be shipped to and create different rates based on location. (From where the product is being shipped)
- Zones: Shipping zones are geographic regions that you can define for rate calculation. (Where the product is being shipped)
- Rates: Shopify allows configuring various types of rates for your products. (Rates  that will be applied for that product in the order)
Products: Different products can be grouped and assigned to specific shipping profiles. (What is being shipped)
Locations: You can define where products can be shipped to and create different rates based on location. (From where the product is being shipped)
Zones: Shipping zones are geographic regions that you can define for rate calculation. (Where the product is being shipped)
Rates: Shopify allows configuring various types of rates for your products. (Rates that will be applied for that product in the order)

- Flat rate: A fixed shipping cost regardless of the order’s weight or price.
- Carrier rates: Shipping costs based on rates provided by a specific carrier, like UPS or FedEx.
- Weight-based rates: Shipping costs based on the total weight of the order.
- Price-based rates: Shipping costs determined by the total price of the order.
Flat rate: A fixed shipping cost regardless of the order’s weight or price.
Carrier rates: Shipping costs based on rates provided by a specific carrier, like UPS or FedEx.
Weight-based rates: Shipping costs based on the total weight of the order.
Price-based rates: Shipping costs determined by the total price of the order.

Brands can configure three types of shipping profiles based on the desired use cases: General, custom and subscription shipping profile.
- General shipping profile: This is the default profile applied to all products in your store unless a custom/subscription shipping profile is defined. It’s typically used when you don’t need specific shipping rules for particular products.
- Custom shipping profile: This is a profile that you create to define unique shipping rules for specific products, locations, or zones which are being sold as one-time purchase option. If a product is part of this profile then during checkout the rates will be picked from here.
- Subscription shipping profile: This is a profile created to define shipping rules for products sold as subscriptions. In Loop, you can map one or more selling plan groups to a profile and configure distinct shipping rules for each group.
General shipping profile: This is the default profile applied to all products in your store unless a custom/subscription shipping profile is defined. It’s typically used when you don’t need specific shipping rules for particular products.
Custom shipping profile: This is a profile that you create to define unique shipping rules for specific products, locations, or zones which are being sold as one-time purchase option. If a product is part of this profile then during checkout the rates will be picked from here.
Subscription shipping profile: This is a profile created to define shipping rules for products sold as subscriptions. In Loop, you can map one or more selling plan groups to a profile and configure distinct shipping rules for each group.

When all three shipping profiles are present, then rates for any line are added based on the following priority order in the shipping profiles:
​Subscription shipping profile > Custom shipping profile > General shipping profile
What this means is:
- If a product is part of a subscription shipping profile, those shipping rates are always used first.
- If no subscription profile applies, Loop checks the custom shipping profile.
- If neither applies, the general shipping profile rates are used.
If a product is part of a subscription shipping profile, those shipping rates are always used first.
If no subscription profile applies, Loop checks the custom shipping profile.
If neither applies, the general shipping profile rates are used.
For example, if a product is assigned to a custom shipping profile, its shipping rates will be taken from that profile instead of the general profile.

Subscription-specific shipping profile is a custom profile only. These profiles allow you to map a selling plan group, and all the products within that group will use the rates specified in this shipping profile.
Here is the step-by-step guide on how to configure the subscription specific shipping profile:
1. https://downloads.intercomcdn.com/i/o/kmcpsev1/1920860427/0829a53ac3006cf03806598475ce/image.png?expires=1774894500&signature=1535f93b11de1e3bc775d0e4fe114bee90590977602cec06d389b2921bb0b488&req=dSklFsF4nYVdXvMW1HO4zZELkF2RbotJ0PA4iOU0qPiSM4Re4PU8iD9Fuj6e%0A3Huw%0ANavigate to the Loop admin > settings > subscription specific shipping rates and click on "Create now".​ 
2. https://downloads.intercomcdn.com/i/o/kmcpsev1/1920867221/8ad26760ddb178305731a518dee2/image.png?expires=1774894500&signature=f272b7b71b8794b743edf215a587dab9fb82f256120d31074adf3f9ffb0b726c&req=dSklFsF4moNdWPMW1HO4zXhLm%2FdF9c3nDlpQToUIi7Z0ASTpFy5siwq94pwp%0AWhef%0A​The process for setting up a shipping profile is similar to Shopify. You name the profile and select the selling plan groups to which the shipping rules should apply. If a selling plan group is already mapped to another profile, or if no products are mapped to a selling plan group, it will appear greyed out and cannot be selected for this profile.​ 
3. https://downloads.intercomcdn.com/i/o/kmcpsev1/1920916643/24366b155622658f301da45ea519/image.png?expires=1774894500&signature=db85cd4769c26f118c3a66cb139477df72184a42ca283f8cc2b4b9153c38c530&req=dSklFsB%2Fm4dbWvMW1HO4zbPeKTZGVruC%2B1jCEPkBk6dqbGkWw3xI0FfrF0Ly%0AogBL%0Ahttps://downloads.intercomcdn.com/i/o/kmcpsev1/1920902279/b5ed4d68ec0c6d79d623c6c13cb2/image.png?expires=1774894500&signature=e252994a8107593657d61590ad07b303937c43b6cb9effd9f9a66440e8301ce4&req=dSklFsB%2Bn4NYUPMW1HO4zQo7pccUhmo9tt%2B6CmNbO6sdVE5yaC4p7ub51gC1%0Aa24z%0AChoose the location and define the zones for which this shipping profile will be applicable.​​Note: If customer will try to purchase using address outside the defined zone for any product under the selling plan group mapped in this profile, then "Shipping not available" error message will appear on the checkout.   
Navigate to the Loop admin > settings > subscription specific shipping rates and click on "Create now".​
​The process for setting up a shipping profile is similar to Shopify. You name the profile and select the selling plan groups to which the shipping rules should apply. If a selling plan group is already mapped to another profile, or if no products are mapped to a selling plan group, it will appear greyed out and cannot be selected for this profile.​
Choose the location and define the zones for which this shipping profile will be applicable.​
​
Note: If customer will try to purchase using address outside the defined zone for any product under the selling plan group mapped in this profile, then "Shipping not available" error message will appear on the checkout.
As a next step, you have option to add all four types of rates for this shipping profile based on the requirements. If you are using any application where you are managing the shipping rules then they will also appear in the carrier rates or app rates type option.
​
Subscription specific shipping profile rates will override Shopify’s general and custom shipping profile rates.

# How to access the subscription shipping profile in Shopify?
Subscription specific shipping profile is a custom shipping profile which is created on the Shopify only. To access this profile in Shopify admin, you may follow the following steps:
1. Open the shipping profile in the loop admin and copy the profile id as shown in the snapshot.
Open the shipping profile in the loop admin and copy the profile id as shown in the snapshot.
2. Now navigate to Shopify admin and open any shipping profile over there. Paste this copied id and replace the id of this shipping profile.
3. The shipping profile will be visible in the Shopify admin.

# FAQs
#### Why is my subscription shipping profile not visible in Loop admin?
This usually happens when the shipping profile is linked to selling plans that no longer have any products mapped.In such cases, the profile becomes unusable and cannot be used again.​Loop only displays Subscription-type shipping profiles. When the mapped selling plans do not have any products, the profile automatically changes to a Custom profile, which is why it disappears from the Loop Admin.

#### How to ensure different shipping prices for one-time purchases and subscription purchases of a product?
Create a subscription-based shipping profile by going to Loop Admin portal > Settings > Subscription shipping rates, and create the profiles the same way as in Shopify. Please be aware that:
If the customer purchases the product one-time, the shipping profile is picked from Shopify.
If the customer purchases the product as a subscription, the shipping profile is picked from the Loop shipping profiles. In the case of a mixed cart (one-time and subscription products), both shipping prices will apply (from both Shopify and Loop profiles). To know more, please connect with the support POC.
[Explore more FAQs](https://help.loopwork.co/en/collections/16646422-frequently-asked-questions-faqs)
​

# Need help?
No worries - we're here for you!
If you have any questions or need assistance, feel free to email us at [Regards,
Loop Subscriptions Team 🙂
[Subscription overview](https://help.loopwork.co/en/articles/12657742-subscription-overview)
[Subscription discounts](https://help.loopwork.co/en/articles/12716873-subscription-discounts)
[Auto-update shipping price in Loop](https://help.loopwork.co/en/articles/12732064-auto-update-shipping-price-in-loop)
[Onward shipping protection](https://help.loopwork.co/en/articles/12745817-onward-shipping-protection)
[Shipping FAQs](https://help.loopwork.co/en/articles/12878301-shipping-faqs)
