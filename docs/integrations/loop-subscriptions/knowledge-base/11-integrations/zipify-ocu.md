---
title: "Zipify OCU"
source_url: "https://help.loopwork.co/en/articles/12745593-zipify-ocu"
collection: "11-integrations"
scraped_at: "2026-03-30T17:43:19.376Z"
tags: ["11-integrations"]
---

Learn how to integrate Zipify One Click Upsell (OCU) with Loop to add pre- and post-purchase subscription offers and boost average order value.

**Zipify One Click Upsell (OCU)** is a powerful eCommerce tool designed to help merchants increase their average order value (AOV) by offering AI-driven upsells and cross-sells throughout the customer journey. With a simple interface, users can create upsell funnels from the product page to the thank you page, ensuring maximum revenue from every sale.  
​  
​**Learn more:** [Zipify OCU](https://zipify.com/apps/ocu/)

### Key features

*   **Pre & post-purchase upsells**: Capture upsell revenue at every stage, from product page pop-ups to post-checkout offers.
    
*   **Shop app integration**: Offer multiple upsells for free on the Shop app.
    
*   **Unlimited upsells**: No extra charges for displaying upsell offers, regardless of volume.
    
*   **Unlimited A/B tests**: Optimize every upsell with detailed analytics and testing capabilities.  
    ​
    

Zipify OCU integration is available on the Loop Starter and Pro plans.

* * *

# Integration details

## How does Zipify OCU work with Loop?

Zipify OCU integrates seamlessly with Loop to enhance subscription-based offerings and optimize the customer experience. This Integration allows you to offer a subscription product, both as a **Pre-purchase offer** and a **one-click Post-purchase offer**. Subscription services are a huge part of daily life and recently, subscriptions have become one of the fastest-growing categories in eCommerce.

## Major use-cases & benefits

**Use case**

**Description**

**Benefit**

**Pre-purchase upsell**

Offer your customers proven-profitable upsells while they shop.

By leveraging Zipify OCU, brands can display targeted upsell offers before customers complete their purchase, increasing the likelihood of conversions. This can include offering related products, upgraded versions, or complementary items that enhance the customer’s initial purchase.

**Post-purchase upsell**

Make additional offers after customers complete their purchase.

After a customer completes a purchase, Zipify OCU can display relevant subscription or product upgrade offers without disrupting the checkout flow.

**Slide cart drawer \[OCU\]**

Instead of presenting one-time purchase options, Zipify OCU cart displays "Subscribe & Save" offers directly in the shopping cart.

Increases subscription conversions while providing an incentive for customers to commit to a recurring order.

## How does the integration work?

Zipify OCU works hand-in-hand with Shopify to pull in the subscription-selling plans you’ve set up through Loop. Since Shopify is the source of truth, Zipify OCU simply fetches those details so the right subscription options show up for your customers.

The benefit? Everything stays in sync automatically. You don’t have to juggle subscription data in different tools, and your customers always see the latest options without extra effort on your part. It’s designed to feel seamless for you as a merchant, while the behind-the-scenes syncing runs asynchronously to keep things fast and reliable.

## How to connect Loop with Zipify OCU?

Integrating Loop subscriptions with Zipify OCU is a straightforward process that enables your store to display personalized subscription offers.

**Prerequisites:**

*   You should have an active OneClickUpsell - Zipify account and Loop installed on your store.
    
*   The product added in the upsell should be mapped to the selling plan within Loop.
    
*   OCU upsell and cart toggle button should be enabled on your store theme.
    

If the above prerequisites are met, follow these steps to complete the process:

1.  Create a Pre-purchase or Post-purchase offer using Zipify OCU  
    ​
    
2.  In the upsell editor, enable "Allow subscription options" to upsell products on subscriptions.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762673/025365bac9d716c264bbb2415952/original?expires=1774894500&signature=44d1b57a8facb463c7bd4d1b31d9633642c50beea04e02a636cd7d1bb6e484c3&req=dSgmFM54n4dYWvMW1HO4zVnL6fYCEF9xg%2BI715zfZGgt1L0jbFYoTw9he01C%0AehhN%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762673/025365bac9d716c264bbb2415952/original?expires=1774894500&signature=44d1b57a8facb463c7bd4d1b31d9633642c50beea04e02a636cd7d1bb6e484c3&req=dSgmFM54n4dYWvMW1HO4zVnL6fYCEF9xg%2BI715zfZGgt1L0jbFYoTw9he01C%0AehhN%0A)
    
      
    ​
    

If your product is set to "**Subscription only**", the option to disable the subscription will not be available.

## Limitations

**Selling plan availability:** As Aftersell pulls selling plans straight from Shopify, it doesn’t apply Loop’s availability rules. This means selling plans set to be hidden in at different touchpoints such as storefront may still appear on smart carts and other Aftersell features.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812875559/8ff4c10f4a1dfe11077e6100c824/original?expires=1774894500&signature=dfcb42b9862dd1fca4fb55fd8184ecc128ccff4aedbcd1b7327d2e45497dcfd5&req=dSgmFMF5mIRaUPMW1HO4zV4kyQjwFSsNsQZ8a1cjwyqDuZu5VvpBqEVi4VvD%0AZnUTbakh5P6NTU0FSPs%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812875559/8ff4c10f4a1dfe11077e6100c824/original?expires=1774894500&signature=dfcb42b9862dd1fca4fb55fd8184ecc128ccff4aedbcd1b7327d2e45497dcfd5&req=dSgmFMF5mIRaUPMW1HO4zV4kyQjwFSsNsQZ8a1cjwyqDuZu5VvpBqEVi4VvD%0AZnUTbakh5P6NTU0FSPs%3D%0A)

# Implementation of major use-cases

In this section, we will explore how to implement different business use cases by leveraging Loop with Zipify OCU. The first step is to create an [Upsell funnel](https://help.zipify.com/en/collections/2565560-upsell-funnels) in the Zipify OCU app and then add offers to a funnel.

## Adding a pre-purchase subscription offer

**Add to order (single product):** In this business case, the brand wants customers to be presented with the option to add a single product to their order if the trigger in the upsell funnel is met. This will help increase the AOV of the order.

1.  Brands will create the required upsell funnel in Zipify to display a pre-purchase product on the storefront.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812784419/8c2a054f170cde87a8a3a1716d0a/image_ajyz4j.png?expires=1774894500&signature=57f1bb4f6788d864ae500a4e660e65fab98cdb971930a6fa9003096719bad30f&req=dSgmFM52mYVeUPMW1HO4zZ7r1yP%2FSV6ZU93%2Frjo1BT2BpRP0Ttc2%2FOn9urCn%0A4QGO%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812784419/8c2a054f170cde87a8a3a1716d0a/image_ajyz4j.png?expires=1774894500&signature=57f1bb4f6788d864ae500a4e660e65fab98cdb971930a6fa9003096719bad30f&req=dSgmFM52mYVeUPMW1HO4zZ7r1yP%2FSV6ZU93%2Frjo1BT2BpRP0Ttc2%2FOn9urCn%0A4QGO%0A)
    
2.  The user adds the required product from the product page and clicks the **checkout** button.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812786392/fff035c3ac6aa6c0e903f2178079/image_1oagc08.png?expires=1774894500&signature=d1b982019f9003d468558967d2bb73c685f928ec7169e29e65f7ae547b0dadd3&req=dSgmFM52m4JWW%2FMW1HO4zY8chUkfzXRBVLxPOqyoAIXYed7hm8fVJeMthBZ5%0A%2FU%2Fz%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812786392/fff035c3ac6aa6c0e903f2178079/image_1oagc08.png?expires=1774894500&signature=d1b982019f9003d468558967d2bb73c685f928ec7169e29e65f7ae547b0dadd3&req=dSgmFM52m4JWW%2FMW1HO4zY8chUkfzXRBVLxPOqyoAIXYed7hm8fVJeMthBZ5%0A%2FU%2Fz%0A)
    
3.  This will trigger the funnel condition, and an option to add a product will be shown to the user before they complete the checkout.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762699/4372c322e3bd2f32711ff87c69a9/original?expires=1774894500&signature=92af0587d8d85e4f7e9ea65f8fa3ea620de156e1dd8e7e2db5e818628e8b446d&req=dSgmFM54n4dWUPMW1HO4zZO%2Bvv5aYfGDq0p5dL7ohcE60V7pcxMq8ycPyKdt%0AigeP%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762699/4372c322e3bd2f32711ff87c69a9/original?expires=1774894500&signature=92af0587d8d85e4f7e9ea65f8fa3ea620de156e1dd8e7e2db5e818628e8b446d&req=dSgmFM54n4dWUPMW1HO4zZO%2Bvv5aYfGDq0p5dL7ohcE60V7pcxMq8ycPyKdt%0AigeP%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762721/3e768863e2f0a74ba1f60f8988e8/original?expires=1774894500&signature=44a2de6924089ade1963e9ec09903d6fadbd40084134b62b7b6f8e7f4cf84d01&req=dSgmFM54n4ZdWPMW1HO4zeaZHEeM%2BOl75p5jkorkdeFgYGuUAWzUzRy4HhUU%0Aay08%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762721/3e768863e2f0a74ba1f60f8988e8/original?expires=1774894500&signature=44a2de6924089ade1963e9ec09903d6fadbd40084134b62b7b6f8e7f4cf84d01&req=dSgmFM54n4ZdWPMW1HO4zeaZHEeM%2BOl75p5jkorkdeFgYGuUAWzUzRy4HhUU%0Aay08%0A)
    

**Upgrade order:** In this business case, the brand wants to offer users an upgrade option, such as adding 3 coffee packs instead of 1, allowing them to save more with effective discounts.

1.  Brands will create the required upsell funnel in Zipify to display a pre-purchase product on the storefront.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812790484/010ea92cc92439856337117b2f9a/image_162r4ac.png?expires=1774894500&signature=0c9e2da8418a5f34f93c5bb950eeef8e64f3e9d098932388cd018eb82faf6e7a&req=dSgmFM53nYVXXfMW1HO4za3Kju%2B1tQsuQS3X8CbO6VrFq8vOVlJw0NTAGB2o%0AfiRX%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812790484/010ea92cc92439856337117b2f9a/image_162r4ac.png?expires=1774894500&signature=0c9e2da8418a5f34f93c5bb950eeef8e64f3e9d098932388cd018eb82faf6e7a&req=dSgmFM53nYVXXfMW1HO4za3Kju%2B1tQsuQS3X8CbO6VrFq8vOVlJw0NTAGB2o%0AfiRX%0A)
    
2.  The user adds the Coffee (1 pack) product from the product page and clicks the **checkout** button.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812790931/c471b31803ba136dab1bf9f0a2ed/image_1e7nmn3.png?expires=1774894500&signature=7f8b02d7eb0fe24eb066cd2a3f05a4427f8159ef27973b3c75581f10cf735843&req=dSgmFM53nYhcWPMW1HO4zfgmugrQkfJhwakLVjwkL5fjcmviuRU2cckmVBa2%0AF%2Byl%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812790931/c471b31803ba136dab1bf9f0a2ed/image_1e7nmn3.png?expires=1774894500&signature=7f8b02d7eb0fe24eb066cd2a3f05a4427f8159ef27973b3c75581f10cf735843&req=dSgmFM53nYhcWPMW1HO4zfgmugrQkfJhwakLVjwkL5fjcmviuRU2cckmVBa2%0AF%2Byl%0A)
    
3.  Once the funnel condition is met, the upgrade option will appear. After the offer is accepted, the concerned product will be added to the checkout.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762735/2fbe2a3cf942fef58f8bf26e4b09/original?expires=1774894500&signature=6dff5fedc33a68b60a076275ed2a70dee5b2a70cc4b40464d2b938f0beb5b82b&req=dSgmFM54n4ZcXPMW1HO4zYuOHroLMvw6WhZDp1TLo1Ry0wW0Jw9Lu2%2B8mvLP%0ARUQZ%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762735/2fbe2a3cf942fef58f8bf26e4b09/original?expires=1774894500&signature=6dff5fedc33a68b60a076275ed2a70dee5b2a70cc4b40464d2b938f0beb5b82b&req=dSgmFM54n4ZcXPMW1HO4zYuOHroLMvw6WhZDp1TLo1Ry0wW0Jw9Lu2%2B8mvLP%0ARUQZ%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762698/a80d5d2e8c17c6d4fd33144f9bb7/original?expires=1774894500&signature=bf3a95aa6330e8bf26ca05807de8b796d981a7b2a2727b1947d64a15398458f4&req=dSgmFM54n4dWUfMW1HO4zY%2F3u1zHTFYFo0qoXz8N7h8ALuEyu6dPy%2BYe10pr%0Aradd%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762698/a80d5d2e8c17c6d4fd33144f9bb7/original?expires=1774894500&signature=bf3a95aa6330e8bf26ca05807de8b796d981a7b2a2727b1947d64a15398458f4&req=dSgmFM54n4dWUfMW1HO4zY%2F3u1zHTFYFo0qoXz8N7h8ALuEyu6dPy%2BYe10pr%0Aradd%0A)
    

**Add/Upgrade order - Same product as added to cart:** In this business case, the brand aims to upsell the same product that has already been added to the cart, without the need to create a separate funnel for each product in the store. This approach increases the total order value while simplifying the upsell process, allowing the merchant to drive more sales for the same product efficiently.

1.  Brands will create the required upsell funnel with the given conditions below in Zipify to display a pre-purchase add/upgrade product on the storefront.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812837083/6d43248916913fbfce7d34e09ec7/image_wxej9j.png?expires=1774894500&signature=4473604229ed4299546c2d298ebc2e7a257134f7875c308030368c4429929ad4&req=dSgmFMF9moFXWvMW1HO4zQF4gL6921ddScCq1gJYPgNp1Lmh9UDykcdySwAv%0A%2BhWS%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812837083/6d43248916913fbfce7d34e09ec7/image_wxej9j.png?expires=1774894500&signature=4473604229ed4299546c2d298ebc2e7a257134f7875c308030368c4429929ad4&req=dSgmFMF9moFXWvMW1HO4zQF4gL6921ddScCq1gJYPgNp1Lmh9UDykcdySwAv%0A%2BhWS%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812837288/25fc12291ddd192afb253827270b/image_yb2kdc.png?expires=1774894500&signature=55c2d1e7ab8e4d32cb1e34edcfd74f3747408c35723339561cc1bead8caf0292&req=dSgmFMF9moNXUfMW1HO4zXj2IEqSzxvbBxfyFxpnIegebMW4%2FkeMnq43AOaZ%0AmBTe%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812837288/25fc12291ddd192afb253827270b/image_yb2kdc.png?expires=1774894500&signature=55c2d1e7ab8e4d32cb1e34edcfd74f3747408c35723339561cc1bead8caf0292&req=dSgmFMF9moNXUfMW1HO4zXj2IEqSzxvbBxfyFxpnIegebMW4%2FkeMnq43AOaZ%0AmBTe%0A)
    
2.  The user adds the Cream (Small box variant) product from the product page and clicks the **checkout** button.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812837741/e7796857147f6fbde531e3e3e6af/image_xuevt8.png?expires=1774894500&signature=dcf09d1cf7d9ba5f95404181ada280b8ce42ebf599e504be99dda0871c1f9b0e&req=dSgmFMF9moZbWPMW1HO4zTbmotT6VqukiJBHGB65XzeGy0E%2BAYM%2BnzdEtzMO%0AJRiJ%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812837741/e7796857147f6fbde531e3e3e6af/image_xuevt8.png?expires=1774894500&signature=dcf09d1cf7d9ba5f95404181ada280b8ce42ebf599e504be99dda0871c1f9b0e&req=dSgmFMF9moZbWPMW1HO4zTbmotT6VqukiJBHGB65XzeGy0E%2BAYM%2BnzdEtzMO%0AJRiJ%0A)
    
3.  Once the funnel condition is met, the upgrade option will appear, showing Cream (Medium box variant). After the offer is accepted, the concerned product will be added to the checkout.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762663/5b6bff83f9ae75c3fe5b27d4421b/original?expires=1774894500&signature=8d54a08d8821915d35afec37ac38c681b5d85f0982adfdfb1ce7fa0701d2b129&req=dSgmFM54n4dZWvMW1HO4zRptpEFu0l08ZZ0RE6br7U4DWCqkwsdmxEWgAexl%0AZfcH%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762663/5b6bff83f9ae75c3fe5b27d4421b/original?expires=1774894500&signature=8d54a08d8821915d35afec37ac38c681b5d85f0982adfdfb1ce7fa0701d2b129&req=dSgmFM54n4dZWvMW1HO4zRptpEFu0l08ZZ0RE6br7U4DWCqkwsdmxEWgAexl%0AZfcH%0A)
    

## Adding a post-purchase subscription offer

**Add to order (different product):** In this business case, the brand wants customers to be presented with the option to add a product to their order after purchase, if the trigger in the upsell funnel is met. This will help increase the AOV of the order.

1.  Brands will create the required upsell funnel in Zipify to display a post-purchase product on the storefront.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812841417/f879f641745a7002003ca8b6d96c/image_ka75ni.png?expires=1774894500&signature=e7ce6993b7d59e80b4705742bd179ec73a1b32e3a7c68449462864e454c01e7f&req=dSgmFMF6nIVeXvMW1HO4zVHRInazzakNCYMVa1dIXo%2BVkoCV4QUGV2SmfPNY%0A71FO%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812841417/f879f641745a7002003ca8b6d96c/image_ka75ni.png?expires=1774894500&signature=e7ce6993b7d59e80b4705742bd179ec73a1b32e3a7c68449462864e454c01e7f&req=dSgmFMF6nIVeXvMW1HO4zVHRInazzakNCYMVa1dIXo%2BVkoCV4QUGV2SmfPNY%0A71FO%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812841668/d0d84da9ac88c8ce0cb3ee916191/image_1imvxue.png?expires=1774894500&signature=05423f3aab6a32e5864bb5ca46584d33aede8cb7e52c875f6ae0fedbf632fa11&req=dSgmFMF6nIdZUfMW1HO4zboPgfha9VhIQ7JhzrdcfU%2BFjxVXMxRSgJTZUfss%0ACncJ%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812841668/d0d84da9ac88c8ce0cb3ee916191/image_1imvxue.png?expires=1774894500&signature=05423f3aab6a32e5864bb5ca46584d33aede8cb7e52c875f6ae0fedbf632fa11&req=dSgmFMF6nIdZUfMW1HO4zboPgfha9VhIQ7JhzrdcfU%2BFjxVXMxRSgJTZUfss%0ACncJ%0A)
    
2.  After purchasing a one-time product, once the funnel condition is met, the new product will be offered for both subscription and one-time purchase.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762719/b5e03d08a5a508dd3e22faaf8964/original?expires=1774894500&signature=9320deb6c13c4f6a06f7d3aa81a66609bfc66f55067184e25d53cd9467cd529a&req=dSgmFM54n4ZeUPMW1HO4zWNgSoVke%2F4uO0uePWhQrwqFD2edghyEgMS34k1M%0Angmm%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762719/b5e03d08a5a508dd3e22faaf8964/original?expires=1774894500&signature=9320deb6c13c4f6a06f7d3aa81a66609bfc66f55067184e25d53cd9467cd529a&req=dSgmFM54n4ZeUPMW1HO4zWNgSoVke%2F4uO0uePWhQrwqFD2edghyEgMS34k1M%0Angmm%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762687/e2602cca9e940d36eed5f313868e/original?expires=1774894500&signature=66d5ce20fc3bb05036567c3f36b0688810ce0239ef20ede04974236b1eafe4bb&req=dSgmFM54n4dXXvMW1HO4zVBPoMc79ngPRGG%2FFl0b1GqZWZf0DF6KalcE9E%2F2%0AhlJ5%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762687/e2602cca9e940d36eed5f313868e/original?expires=1774894500&signature=66d5ce20fc3bb05036567c3f36b0688810ce0239ef20ede04974236b1eafe4bb&req=dSgmFM54n4dXXvMW1HO4zVBPoMc79ngPRGG%2FFl0b1GqZWZf0DF6KalcE9E%2F2%0AhlJ5%0A)
    

If the original checkout order already includes a subscription product, the subscription option won’t show on the post-purchase page.

**Add to order (same product):** In this business case, the brand wants customers to be presented with the option to add the same product as a subscription to their order after purchase, if the trigger in the upsell funnel is met. This will help increase the LTV of the order.

1.  Brands will create the required upsell funnel in Zipify to display a post-purchase product on the storefront.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812858223/a4bd6e48e496808f4671c63a5eca/image_4i6bnx.png?expires=1774894500&signature=66b332f21f785ca5eeb98f732f748b018bd8a7d3e842060745fb4ddc0b63dea4&req=dSgmFMF7lYNdWvMW1HO4zTJK8%2Bnqp1%2B%2FvuCDIpfvTPld2%2BnOuB1JhUdNbxj2%0Atwte%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812858223/a4bd6e48e496808f4671c63a5eca/image_4i6bnx.png?expires=1774894500&signature=66b332f21f785ca5eeb98f732f748b018bd8a7d3e842060745fb4ddc0b63dea4&req=dSgmFMF7lYNdWvMW1HO4zTJK8%2Bnqp1%2B%2FvuCDIpfvTPld2%2BnOuB1JhUdNbxj2%0Atwte%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812858503/75adf184a6acc08a8af4012e084a/image_1id6lt3.png?expires=1774894500&signature=204af9a21b2db7bb3b62e749939c944f315208bb4cbb7c6c0eb4f3789c384934&req=dSgmFMF7lYRfWvMW1HO4zUPU7m0G8t2odIM9l%2F2QqnhpkDpRgxvGobG3D5qW%0AjJ0L%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812858503/75adf184a6acc08a8af4012e084a/image_1id6lt3.png?expires=1774894500&signature=204af9a21b2db7bb3b62e749939c944f315208bb4cbb7c6c0eb4f3789c384934&req=dSgmFMF7lYRfWvMW1HO4zUPU7m0G8t2odIM9l%2F2QqnhpkDpRgxvGobG3D5qW%0AjJ0L%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812858919/79fc7bb1e2f69b47a5b730277473/image_kz2ly9.png?expires=1774894500&signature=224b8bd2a8c20c69a2d4ca862bda092d7e470d8e6219c2740c0b4280f9824f9c&req=dSgmFMF7lYheUPMW1HO4zSLwLEot3pxu3WswsNbBCE%2FvuayAEdEOs%2BxGvN1d%0AAxYb%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812858919/79fc7bb1e2f69b47a5b730277473/image_kz2ly9.png?expires=1774894500&signature=224b8bd2a8c20c69a2d4ca862bda092d7e470d8e6219c2740c0b4280f9824f9c&req=dSgmFMF7lYheUPMW1HO4zSLwLEot3pxu3WswsNbBCE%2FvuayAEdEOs%2BxGvN1d%0AAxYb%0A)
    
    ​
    
2.  After purchasing a one-time product, once the funnel condition is met, the same new product will be offered for subscription purchase.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762729/c6dd57cc83db1d8124ae0114c658/original?expires=1774894500&signature=f3466d94d8bb74656c9bd47fbc6fef9b1655c495a08e635cb4ce578019a20aa9&req=dSgmFM54n4ZdUPMW1HO4zf76V53Xru149m2ZQQd5jKvR4EiibnEQ1%2FWYUNE3%0AAi9O%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762729/c6dd57cc83db1d8124ae0114c658/original?expires=1774894500&signature=f3466d94d8bb74656c9bd47fbc6fef9b1655c495a08e635cb4ce578019a20aa9&req=dSgmFM54n4ZdUPMW1HO4zf76V53Xru149m2ZQQd5jKvR4EiibnEQ1%2FWYUNE3%0AAi9O%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762745/7d4054bfbe0b82148eb786ca2c20/original?expires=1774894500&signature=fb11cc064ca09c354aedc3eeb63d78be9905bb15ba605c81ae1695051697af3a&req=dSgmFM54n4ZbXPMW1HO4zTzF2QD1TC%2FK4nZ2dlWQxeKzy1q2FVFuPSc4%2BRii%0AfaVx%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762745/7d4054bfbe0b82148eb786ca2c20/original?expires=1774894500&signature=fb11cc064ca09c354aedc3eeb63d78be9905bb15ba605c81ae1695051697af3a&req=dSgmFM54n4ZbXPMW1HO4zTzF2QD1TC%2FK4nZ2dlWQxeKzy1q2FVFuPSc4%2BRii%0AfaVx%0A)
    

## Slide cart drawer

**Subscription upgrade:** In this business case, the brand wants to offer customers the option to upgrade to a subscription when a one-time product is added to the cart, boosting subscription conversions and encouraging recurring orders.

1.  Brands can configure the slide cart drawer in the Zipify OCU app by navigating to **Shopify > One Click Upsell > Slide Cart Drawer** to display a subscription upgrade option in the cart.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812847237/f6f80330166090ce67f79cfc126e/image_2ohwa3.png?expires=1774894500&signature=6beb667c3cefc1853176204dd10c0c275e388b181b710a501180db972df2f855&req=dSgmFMF6moNcXvMW1HO4zRb73Kriut8OaJpFxKD5FPspXdtM4Xx06u1NIGx6%0ArpE8%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812847237/f6f80330166090ce67f79cfc126e/image_2ohwa3.png?expires=1774894500&signature=6beb667c3cefc1853176204dd10c0c275e388b181b710a501180db972df2f855&req=dSgmFMF6moNcXvMW1HO4zRb73Kriut8OaJpFxKD5FPspXdtM4Xx06u1NIGx6%0ArpE8%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812847612/c81920b2276a918a3ee4c7331f51/image_xghqy5.png?expires=1774894500&signature=86ba9f4492badc92d73d5ee60b392fd382ca559caa6a730135c1ced0174668c9&req=dSgmFMF6modeW%2FMW1HO4zXDYNNPXi%2Buzb6rA8Nj34swu6%2BotcBfhdZ6u6GbH%0A42vE%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812847612/c81920b2276a918a3ee4c7331f51/image_xghqy5.png?expires=1774894500&signature=86ba9f4492badc92d73d5ee60b392fd382ca559caa6a730135c1ced0174668c9&req=dSgmFMF6modeW%2FMW1HO4zXDYNNPXi%2Buzb6rA8Nj34swu6%2BotcBfhdZ6u6GbH%0A42vE%0A)
    
2.  Once a one-time product is added to the cart, the “**Upgrade to subscription**” button appears below the product. Clicking it automatically fetches the selling plan mapped to the product, displaying available frequencies in the dropdown.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762658/f75a09c3df7572c76d10c40e9d68/original?expires=1774894500&signature=e344247765832b8a45b47818f74fb7f214056721f20757230cf616a5378b47d7&req=dSgmFM54n4daUfMW1HO4zeCbCeF8%2BIeGfpTwEwhNtdpi%2BAWPF5xSBHlhx%2Fzg%0A3JXJ%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762658/f75a09c3df7572c76d10c40e9d68/original?expires=1774894500&signature=e344247765832b8a45b47818f74fb7f214056721f20757230cf616a5378b47d7&req=dSgmFM54n4daUfMW1HO4zeCbCeF8%2BIeGfpTwEwhNtdpi%2BAWPF5xSBHlhx%2Fzg%0A3JXJ%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762704/3c4a1c3833d6855ceb5d9f1d8249/original?expires=1774894500&signature=e8397961d7a828da278e064b430a38125f4ea0b90cf4099bb91b358ab3ed8ff7&req=dSgmFM54n4ZfXfMW1HO4zcsqtXujirod0UGb95xTe4oTDPzqJhK5g90MYTVz%0AeHRU%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762704/3c4a1c3833d6855ceb5d9f1d8249/original?expires=1774894500&signature=e8397961d7a828da278e064b430a38125f4ea0b90cf4099bb91b358ab3ed8ff7&req=dSgmFM54n4ZfXfMW1HO4zcsqtXujirod0UGb95xTe4oTDPzqJhK5g90MYTVz%0AeHRU%0A)
    

**Upsell offer:** Here, the brand provides customers the option to add an additional product as an upsell in the cart, increasing the order’s AOV.

1.  Brands will create the required upsell funnel in Zipify to display a product as an upsell in the smart cart.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812849261/5174985db92757fac9dee4a2bea8/image_1mo4a9f.png?expires=1774894500&signature=dcdd4ccdd5ea2d913dc1ece4bc8f99f5d0725394585e44cc5e6d7527075f3294&req=dSgmFMF6lINZWPMW1HO4zbDsJIZGCOUbwYFCYkqQEmLT4sZqH1qcylFgCB1C%0AGJ%2Bz%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812849261/5174985db92757fac9dee4a2bea8/image_1mo4a9f.png?expires=1774894500&signature=dcdd4ccdd5ea2d913dc1ece4bc8f99f5d0725394585e44cc5e6d7527075f3294&req=dSgmFMF6lINZWPMW1HO4zbDsJIZGCOUbwYFCYkqQEmLT4sZqH1qcylFgCB1C%0AGJ%2Bz%0A)
    
2.  Enable the upsell option in the smart cart and click on "**Save**".  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812849529/1b640a5ad41aeaa88f483029cdad/image_6jsil6.png?expires=1774894500&signature=5f1f6cd753e9da29e7b1ef656b70facdd93201b5de080080baa2a62b574699ba&req=dSgmFMF6lIRdUPMW1HO4zVuLOYGsrdTsfLVhPvlnOziAIBcxn%2BWWSdZHCE%2B5%0AGV8i%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812849529/1b640a5ad41aeaa88f483029cdad/image_6jsil6.png?expires=1774894500&signature=5f1f6cd753e9da29e7b1ef656b70facdd93201b5de080080baa2a62b574699ba&req=dSgmFMF6lIRdUPMW1HO4zVuLOYGsrdTsfLVhPvlnOziAIBcxn%2BWWSdZHCE%2B5%0AGV8i%0A)
    
3.  Once the funnel condition is met, the upsell option will appear, in the cart.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762675/23c8fdd328fbb62853b06dc4e6ea/original?expires=1774894500&signature=2bb25a0764f7d2449d550082f43b75d61a3bf6576bab9319a75b6a9d60ea5ce3&req=dSgmFM54n4dYXPMW1HO4zZwdZQn5p%2BTGPMRQLN%2BMXhuBGWYe5SOa4KdqIqav%0Ae6sG%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812762675/23c8fdd328fbb62853b06dc4e6ea/original?expires=1774894500&signature=2bb25a0764f7d2449d550082f43b75d61a3bf6576bab9319a75b6a9d60ea5ce3&req=dSgmFM54n4dYXPMW1HO4zZwdZQn5p%2BTGPMRQLN%2BMXhuBGWYe5SOa4KdqIqav%0Ae6sG%0A)
    

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#d9aaaca9a9b6abad99b5b6b6a9aeb6abb2f7bab6) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Upsell and cross-sell

](https://help.loopwork.co/en/articles/12703297-upsell-and-cross-sell)[

Checkout upgrades

](https://help.loopwork.co/en/articles/12731490-checkout-upgrades)[

Zipify landing page builder

](https://help.loopwork.co/en/articles/12742282-zipify-landing-page-builder)[

Rebuy

](https://help.loopwork.co/en/articles/12745271-rebuy)[

Aftersell

](https://help.loopwork.co/en/articles/12745712-aftersell)
