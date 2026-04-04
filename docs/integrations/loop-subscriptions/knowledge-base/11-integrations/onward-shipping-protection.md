---
title: "Onward shipping protection"
source_url: "https://help.loopwork.co/en/articles/12745817-onward-shipping-protection"
collection: "11-integrations"
scraped_at: "2026-03-30T17:43:18.318Z"
tags: ["11-integrations"]
---

Learn how to integrate Onward shipping protection with Loop to safeguard subscription orders, streamline claim handling, and enhance customer trust.

**Onward shipping protection** safeguards orders from damage, loss, or theft during transit, giving both customers and brands peace of mind. It ensures a smooth replacement or refund process if something goes wrong after dispatch. This setup ensures that any claims for lost, stolen, or damaged items are handled quickly, allowing customers to feel confident in their ongoing subscription experience.

### Key features

*   Covers lost, damaged, or stolen packages during shipping.
    
*   Enables quick claim filing and resolution for customers.
    
*   Enhances customer trust and reduces support burden for brands.
    

In this article, we’ll explore how Loop’s configuration works with Onward shipping protection to proactively protect every subscription order, minimize operational headaches, and enhance the overall customer experience.

* * *

#   
What is shipping protection?

**Shipping protection** is an added layer of security for your customers’ orders, ensuring that they are covered against unexpected issues during transit, such as loss, theft, or damage. For subscription orders, where timely and consistent delivery is crucial for customer satisfaction, shipping protection helps maintain trust and reduces friction in post-purchase support.

# Setting up storefront experience

The use case here is that as soon as products are added to the cart drawer, Onward shipping protection is automatically added to the cart. If the customer does not want this protection, they can simply remove it from the cart before proceeding to final checkout.

**Prerequisites:**

Before starting the setup process, we need to make sure these things are in place.

*   Shipping product with required variants should be created on your Shopify store.
    
*   Define the variants of this product; each variant is equivalent to a price amount that will be calculated based on cart value and applied as protection fees.  
    ​
    

Merchant needs to contact the Onward shipping protection POC to work on the price calculation factor.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1816549569/f24096ff853c37d38346a96e29fb/original?expires=1774894500&signature=df7a4b0874da921791884702681aa7cfdef8d6598b20dc7654d4a86c6d9b9123&req=dSgmEMx6lIRZUPMW1HO4zYOIJcIczw%2B1wwKt%2BnBNHHN9fVepa37%2FasaO%2Ftfw%0AFCVEY0CkZ40dn2JKeBA%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1816549569/f24096ff853c37d38346a96e29fb/original?expires=1774894500&signature=df7a4b0874da921791884702681aa7cfdef8d6598b20dc7654d4a86c6d9b9123&req=dSgmEMx6lIRZUPMW1HO4zYOIJcIczw%2B1wwKt%2BnBNHHN9fVepa37%2FasaO%2Ftfw%0AFCVEY0CkZ40dn2JKeBA%3D%0A)

  
If the above prerequisites are met, follow these steps to complete the process.

1.  Navigate to **Loop admin > Acquire > Selling plans** and map the shipping protection product to the desired selling plans that include the products you want to offer shipping protection for.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812954554/20110b13056636c978b38ae4a2ef/image_1wmqa4i.png?expires=1774894500&signature=0d5b8d8bc8ccb1bb675a4c7a6a6b7b05a405cb5f21180244a738df4ea5d58ee4&req=dSgmFMB7mYRaXfMW1HO4zV5pcgwqpfqte5S66jN63UQUehDBUpOdvNzPrRqo%0AoSqa%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812954554/20110b13056636c978b38ae4a2ef/image_1wmqa4i.png?expires=1774894500&signature=0d5b8d8bc8ccb1bb675a4c7a6a6b7b05a405cb5f21180244a738df4ea5d58ee4&req=dSgmFMB7mYRaXfMW1HO4zV5pcgwqpfqte5S66jN63UQUehDBUpOdvNzPrRqo%0AoSqa%0A)
    
2.  Next merchant needs to coordinate with the Onward shipping point of contact (POC) to enable the shipping protection option on the cart drawer.  
    ​
    
3.  Once the configuration is completed in both Loop and Onward shipping, adding products to the cart on the storefront will **automatically** include the shipping protection in the cart drawer. The variant price will be applied based on the cart value defined during the prerequisites setup.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812954045/40dab1283b86a6cc1fda1288e085/original?expires=1774894500&signature=ef763985a55bb0ac7dc82bc05cf208c41f26df2a974200e0f55bd388b49e3993&req=dSgmFMB7mYFbXPMW1HO4zQgWQ3AYQf9PpkercbnlThFdk0d%2FPfe1DOVtYRaT%0Aebep%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812954045/40dab1283b86a6cc1fda1288e085/original?expires=1774894500&signature=ef763985a55bb0ac7dc82bc05cf208c41f26df2a974200e0f55bd388b49e3993&req=dSgmFMB7mYFbXPMW1HO4zQgWQ3AYQf9PpkercbnlThFdk0d%2FPfe1DOVtYRaT%0Aebep%0A)
    

# Setting up upsell banner experience

The use case here is to display Onward shipping protection in the Upsell banner for **both General and Personalized Upsell profiles.** The intent is to allow subscribers to add shipping protection to **upcoming recurring orders** if it was not selected during the initial product checkout from the storefront.

Before starting the setup process, we need to make sure these things are in place.

*   Upsell configuration is enabled on the Loop store.
    
*   Enable the **"Show only those items which have no variants already added in subscription"** setting by navigating to **Loop admin > Grow > Upsells > Upsell preferences > Already added items visibility section.**
    

If the above prerequisites are met, follow these steps to complete the process.

1.  Map only one variant of the Onward shipping protection product created in your Shopify store. This single variant will be displayed to subscribers in the Upsell banner. The variant shown will be determined based on your store’s average order value (AOV).  
    ​  
    Note: To calculate your store’s AOV, the merchant needs to coordinate with the Onward shipping point of contact (POC).
    
2.  For the variant selected based on the store’s AOV, set the discount amount to $0. Since in this case the shipping protection will have a fixed value based on the store's AOV when added via the Upsell banner, ensure the discount-related settings are configured accordingly.  
    ​
    
    **• General upsell profile  
    ​**
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812962099/7477a1f738b14f5c0b0b216e3177/image_h60ahc.png?expires=1774894500&signature=90d61c259643350998a19c652ef4b02ccd9a76c221b13e9e24a0682425b882a3&req=dSgmFMB4n4FWUPMW1HO4zc5vsW%2B0hMk6Rt9GE%2BQyPLU9w60nPt6nlgQQJRgY%0AHnnu%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812962099/7477a1f738b14f5c0b0b216e3177/image_h60ahc.png?expires=1774894500&signature=90d61c259643350998a19c652ef4b02ccd9a76c221b13e9e24a0682425b882a3&req=dSgmFMB4n4FWUPMW1HO4zc5vsW%2B0hMk6Rt9GE%2BQyPLU9w60nPt6nlgQQJRgY%0AHnnu%0A)
    
      
    ​**• Personalized upsell profiles**  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812964823/71a7eba6955628556dcd0047526b/image_26y30d.png?expires=1774894500&signature=00337228b6d8f6c23acf85d3bd9808a3e4b406779320031955e596444351b314&req=dSgmFMB4mYldWvMW1HO4zXu0HFQuTaSv%2FKaSV2latzZ%2BAUSvpaa%2BzA1xqtPT%0AV%2Fo0%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812964823/71a7eba6955628556dcd0047526b/image_26y30d.png?expires=1774894500&signature=00337228b6d8f6c23acf85d3bd9808a3e4b406779320031955e596444351b314&req=dSgmFMB4mYldWvMW1HO4zXu0HFQuTaSv%2FKaSV2latzZ%2BAUSvpaa%2BzA1xqtPT%0AV%2Fo0%0A)
    
3.  Once the configuration is complete, the selected shipping protection variant will be visible in the Upsell banner.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812948102/a9462c0b684835c60859b5ccb28b/original?expires=1774894500&signature=0dbd1ee4feb6798381309a79a84173703d65d40badf3e4b8416e645a74ff5a85&req=dSgmFMB6lYBfW%2FMW1HO4zYG%2FHJ1llbpB7dK9ea0x8%2FCL2kESMN1iscGHB4cx%0ATXP7%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812948102/a9462c0b684835c60859b5ccb28b/original?expires=1774894500&signature=0dbd1ee4feb6798381309a79a84173703d65d40badf3e4b8416e645a74ff5a85&req=dSgmFMB6lYBfW%2FMW1HO4zYG%2FHJ1llbpB7dK9ea0x8%2FCL2kESMN1iscGHB4cx%0ATXP7%0A)
    
      
    ​
    

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#deadabaeaeb1acaa9eb2b1b1aea9b1acb5f0bdb1) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Auto-update shipping price in Loop

](https://help.loopwork.co/en/articles/12732064-auto-update-shipping-price-in-loop)[

Subscription shipping profiles

](https://help.loopwork.co/en/articles/12732320-subscription-shipping-profiles)[

Zipify OCU

](https://help.loopwork.co/en/articles/12745593-zipify-ocu)[

Aftersell

](https://help.loopwork.co/en/articles/12745712-aftersell)[

Kaching bundles

](https://help.loopwork.co/en/articles/12745875-kaching-bundles)
