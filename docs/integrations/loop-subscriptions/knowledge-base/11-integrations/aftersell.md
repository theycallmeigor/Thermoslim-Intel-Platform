---
title: "Aftersell"
source_url: "https://help.loopwork.co/en/articles/12745712-aftersell"
collection: "11-integrations"
scraped_at: "2026-03-30T17:43:18.884Z"
tags: ["11-integrations"]
---

Learn how to integrate Aftersell with Loop to enable targeted post-purchase and in-cart subscription upsells, boosting AOV and customer retention.

**Aftersell by Rokt** is a post-purchase upsell solution that helps brands increase revenue by offering targeted upsell, cross-sell, and subscription options after checkout. Integrated seamlessly with Shopify, Aftersell enables merchants to present relevant offers on the thank-you page or via follow-up emails, boosting average order value (AOV) while enhancing the customer experience.  
​  
​**Learn more:** [Aftersell](https://www.aftersell.com/)

### Key features

*   **Post-purchase upsells:** Offer targeted upsells and cross-sells after checkout to increase AOV.
    
*   **Shopify integration:** Seamlessly integrates with Shopify to display relevant product recommendations.
    
*   **Customizable offers:** Tailor upsell and cross-sell offers based on customer behavior and preferences.
    
*   **Analytics & reporting:** Optimize your offers with detailed performance metrics and insights.  
    ​
    

Aftersell integration is available on the Loop Starter and Pro plans.

* * *

# Integration details

## How does Aftersell work with Loop?

Aftersell integrates seamlessly with Loop to enhance subscription-based offerings and optimize the customer experience. The integration allows you to increase subscription opt-ins by offering subscription products as post-purchase upsells to your customers.

## Major use-cases & benefits

**Use case**

**Description**

**Benefit**

**Post-purchase upsell**

Make additional offers after customers complete their purchase.

Increases AOV, provides relevant offers, and maintains a seamless shopping experience.

**Cart drawer**

Aftersell (UpCart) presents upsell offers in the cart, encouraging customers to add more items before checkout.

Boosts conversion, increases revenue, and offers a personalized experience.

**Checkout upsell**

Aftersell shows upsell offers during checkout, allowing customers to add products before completing their purchase.

Maximizes AOV, encourages higher-value purchases, and integrates seamlessly into checkout.

**Product page upsell**

Allows you to create compelling upsell offers directly on your product pages.

Display complementary products on product pages to increase AOV, enhance customer experience, and drive strategic revenue growth with easy Shopify integration.

## How does the integration work?

Aftersell works hand-in-hand with Shopify to pull in the subscription-selling plans you’ve set up through Loop. Since Shopify is the source of truth, Aftersell simply fetches those details so the right subscription options show up for your customers.

The benefit? Everything stays in sync automatically. You don’t have to juggle subscription data in different tools, and your customers always see the latest options without extra effort on your part. It’s designed to feel seamless for you as a merchant, while the behind-the-scenes syncing runs asynchronously to keep things fast and reliable.

## How to connect Loop with Aftersell?

Integrating Loop subscriptions with Aftersell is a straightforward process that enables your store to display personalized subscription offers.

**Prerequisites:**

*   You should have an active Aftersell account and Loop installed on your store.
    
*   You should have an active UpCart by Aftersell account installed on your store for implementing the upsell functionality using the cart drawer.
    
*   Selling plans must be fully configured in the Loop subscription app before creating the upsell offers in Aftersell for the integration to work properly.
    

If the above prerequisites are met, follow these steps to complete the process:

1.  Create a new funnel offer using Aftersell.  
    ​
    
2.  The connection works through Shopify's native selling plans, so once your selling plans are properly set up in your subscription app, you'll be able to offer both one-time and subscription options for your physical product as a post-purchase upsell.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812896263/3f5a081d7b50570c696512770b13/original?expires=1774894500&signature=c847e885efc44ae0590ff392aa4b330e424a9e1160a14940bac976ecbc0cdf24&req=dSgmFMF3m4NZWvMW1HO4zQm2GlJqwO8fPnP8VpxS1JosgH2largRZLdKL9aZ%0AVT%2Bw%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812896263/3f5a081d7b50570c696512770b13/original?expires=1774894500&signature=c847e885efc44ae0590ff392aa4b330e424a9e1160a14940bac976ecbc0cdf24&req=dSgmFMF3m4NZWvMW1HO4zQm2GlJqwO8fPnP8VpxS1JosgH2largRZLdKL9aZ%0AVT%2Bw%0A)
    

##   
Limitations

1.  **Selling plan availability:** As Aftersell pulls selling plans straight from Shopify, it doesn’t apply Loop’s availability rules. This means selling plans set to be hidden in at different touch points such as storefront may still appear on smart carts and other Aftersell features.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812897704/88f7963b8183ef50af462770e329/image_sy9sp7.png?expires=1774894500&signature=08c270f4b8c06625b94f858607bc3146badc2d5f2f11b1b3b188f20ceb0c6738&req=dSgmFMF3moZfXfMW1HO4zeb%2BRKy%2BByu%2FDl5fKOrvJUCY0mi9h%2B5QrJUHJ88t%0A9h4A%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812897704/88f7963b8183ef50af462770e329/image_sy9sp7.png?expires=1774894500&signature=08c270f4b8c06625b94f858607bc3146badc2d5f2f11b1b3b188f20ceb0c6738&req=dSgmFMF3moZfXfMW1HO4zeb%2BRKy%2BByu%2FDl5fKOrvJUCY0mi9h%2B5QrJUHJ88t%0A9h4A%0A)
    
2.  Checkout upsell is only available to Shopify Plus merchants.
    

# Implementation of major use-cases

In this section, we will explore how to implement different business use cases by leveraging Loop with Aftersell. The first step is to create an [Upsell funnel](https://intercom.help/aftersell/en/articles/11174477-post-purchase-overview) in the Aftersell app and then add offers to a funnel.

## Post purchase upsell

In this business case, the brand wants customers to be presented with the option to add a product to their order if the trigger condition in the upsell funnel is met. This will help increase the AOV of the order.

1.  Brands will create the required new upsell funnel in Aftersell to display a post-purchase product on the storefront.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812900523/dcb0518c6407c1c646d5d643777b/image_jd0cji.png?expires=1774894500&signature=7e92272bf71bb7c49de0fab8013784ad946e5578ef8d53380565bf7b90001271&req=dSgmFMB%2BnYRdWvMW1HO4zXvYGo89PekmuDBSlrFZF%2FiEPx%2FavFotEOl1e%2FqM%0AfdZY%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812900523/dcb0518c6407c1c646d5d643777b/image_jd0cji.png?expires=1774894500&signature=7e92272bf71bb7c49de0fab8013784ad946e5578ef8d53380565bf7b90001271&req=dSgmFMB%2BnYRdWvMW1HO4zXvYGo89PekmuDBSlrFZF%2FiEPx%2FavFotEOl1e%2FqM%0AfdZY%0A)
    
2.  You can define multiple triggers based on use case requirements.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812901056/7e4ceddc6556c5ecef7acac23b73/image_1x088g2.png?expires=1774894500&signature=821c5868f13e4fdddb6c26e06d1917e4f0600fec5614d8552ebc0572c0a87d59&req=dSgmFMB%2BnIFaX%2FMW1HO4zQYq%2Fu8XG%2FrpBGw2nvX7E2NSISKsj9b1IN3TwBBX%0AhFco%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812901056/7e4ceddc6556c5ecef7acac23b73/image_1x088g2.png?expires=1774894500&signature=821c5868f13e4fdddb6c26e06d1917e4f0600fec5614d8552ebc0572c0a87d59&req=dSgmFMB%2BnIFaX%2FMW1HO4zQYq%2Fu8XG%2FrpBGw2nvX7E2NSISKsj9b1IN3TwBBX%0AhFco%0A)
    
3.  In the next section, you can define multiple condition-based upsell offers.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812901525/05f17adc1d87b00e334616d6b6a5/image_1v0r575.png?expires=1774894500&signature=3dd3172143220cfc728a0a704d839be55f94b7d8e44fa9f05c6fd4808ce278b6&req=dSgmFMB%2BnIRdXPMW1HO4zRLZHPV0mWebnG2GyHv%2Blm3UnB3reIcxOwEsKZBq%0ALtmi%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812901525/05f17adc1d87b00e334616d6b6a5/image_1v0r575.png?expires=1774894500&signature=3dd3172143220cfc728a0a704d839be55f94b7d8e44fa9f05c6fd4808ce278b6&req=dSgmFMB%2BnIRdXPMW1HO4zRLZHPV0mWebnG2GyHv%2Blm3UnB3reIcxOwEsKZBq%0ALtmi%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812902034/1e5900f0d47dd2b6681d20f7096e/image_16rd65b.png?expires=1774894500&signature=40fadf6ed9d38e14c00625dd130311e80e1b24dc5aebb697e44b46178f91134d&req=dSgmFMB%2Bn4FcXfMW1HO4zVcjYi3siPOuzXChyIZ445bADY3TdLxij1hOkiXO%0AzG57%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812902034/1e5900f0d47dd2b6681d20f7096e/image_16rd65b.png?expires=1774894500&signature=40fadf6ed9d38e14c00625dd130311e80e1b24dc5aebb697e44b46178f91134d&req=dSgmFMB%2Bn4FcXfMW1HO4zVcjYi3siPOuzXChyIZ445bADY3TdLxij1hOkiXO%0AzG57%0A)
    
4.  The user adds the required product from the product page and clicks the **checkout** button.  
    ​
    
5.  After the user purchases the product and based on the funnel condition, they will be shown upsell products that can be added to the order, leading to an increase in AOV.  
    ​
    

If the purchased product has already been bought as a subscription, the product shown in the upsell offer will not be available as both a one-time and subscription option, and can only be purchased as a one-time product.

## Cart drawer upsell (UpCart)

In this business case, the brand wants to offer customers the option to upgrade to a subscription when a one-time product is added to the cart, boosting subscription conversions and encouraging recurring orders.  
​  
​**Learn more:** [UpCart](https://www.aftersell.com/cart)

1.  Brands will install the UpCart app on the store and enable the cart widget on the live theme as shown below.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812904425/014688e86abb3fcca3de126eba84/image_bhnvw8.png?expires=1774894500&signature=ca97ee704a24079e8f68bcb157275ad6ce1576b196ff6da3d5f1bc561dc490d1&req=dSgmFMB%2BmYVdXPMW1HO4zSeYKtyQwFGLtUIIu7f%2FSq9dQ0gyz3j42AqnM0s7%0AwEBy%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812904425/014688e86abb3fcca3de126eba84/image_bhnvw8.png?expires=1774894500&signature=ca97ee704a24079e8f68bcb157275ad6ce1576b196ff6da3d5f1bc561dc490d1&req=dSgmFMB%2BmYVdXPMW1HO4zSeYKtyQwFGLtUIIu7f%2FSq9dQ0gyz3j42AqnM0s7%0AwEBy%0A)
    
2.  Enable the **"Subscription upgrade"** option and click on **Save**.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812885548/c88fabee0a2d6693dd29087af703/original?expires=1774894500&signature=a8b60a4660d3b6e7cfef7adbfb3349a9011439e96f4aec06c71661c7beedb6b2&req=dSgmFMF2mIRbUfMW1HO4zTCngnP%2BfWAPrtG1v4XYzPJp%2F7uk1dI%2BktTxgBGw%0AT4f5%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812885548/c88fabee0a2d6693dd29087af703/original?expires=1774894500&signature=a8b60a4660d3b6e7cfef7adbfb3349a9011439e96f4aec06c71661c7beedb6b2&req=dSgmFMF2mIRbUfMW1HO4zTCngnP%2BfWAPrtG1v4XYzPJp%2F7uk1dI%2BktTxgBGw%0AT4f5%0A)
    

## Checkout upsell

In this business case, the brand wants customers to be presented with the option to add a product to their order during the checkout process if the trigger condition is met. This will help increase the overall AOV of the order by encouraging customers to make last-minute additions before finalizing their purchase.

1.  Brands will create the required checkout upsell offer from the checkout editor based on use case requirement conditions.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812907994/ff5572862854c716ee6ab89b2dd9/image_gdsf2.png?expires=1774894500&signature=ad7bbab78baf0bfb5c74cf935c5ff3ec48b0a4d14ac1a1e9f0eec6bcbf35b43d&req=dSgmFMB%2BmohWXfMW1HO4zRiw128L58k36s1Zs%2FGRMO4h3%2FYKUY3EJ5CIsIb%2F%0ABh2s%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812907994/ff5572862854c716ee6ab89b2dd9/image_gdsf2.png?expires=1774894500&signature=ad7bbab78baf0bfb5c74cf935c5ff3ec48b0a4d14ac1a1e9f0eec6bcbf35b43d&req=dSgmFMB%2BmohWXfMW1HO4zRiw128L58k36s1Zs%2FGRMO4h3%2FYKUY3EJ5CIsIb%2F%0ABh2s%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812908372/2305cb768096e470e1cbeba39f6a/image_1bbsdu.png?expires=1774894500&signature=6b31d6c17d47ef95e90b12f5cdc3614a035a55dfd51f4ad0ca0df23caab4c848&req=dSgmFMB%2BlYJYW%2FMW1HO4zYuXlAKppBQnifN66zlREw7bNtfAbVCR1EH99f8s%0AmxEE%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812908372/2305cb768096e470e1cbeba39f6a/image_1bbsdu.png?expires=1774894500&signature=6b31d6c17d47ef95e90b12f5cdc3614a035a55dfd51f4ad0ca0df23caab4c848&req=dSgmFMB%2BlYJYW%2FMW1HO4zYuXlAKppBQnifN66zlREw7bNtfAbVCR1EH99f8s%0AmxEE%0A)
    
      
    Note: The [Checkout extensibility](https://intercom.help/aftersell/en/collections/7075873-checkout-editing) update by Shopify is only available to Shopify Plus merchants.
    
2.  In the upsell product edit option, select the subscription option so that the subscriber can purchase the upsell product as a subscription as well.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812885558/91f917d5eb588960c7a66b602696/original?expires=1774894500&signature=3a12721aca53289bf8a2869c01cea2708cb7205994baeb31848c1033bc68ccc7&req=dSgmFMF2mIRaUfMW1HO4zURr17dSITC717B5IQfsjGYEcreth3kaalfGyePd%0A8rBh%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812885558/91f917d5eb588960c7a66b602696/original?expires=1774894500&signature=3a12721aca53289bf8a2869c01cea2708cb7205994baeb31848c1033bc68ccc7&req=dSgmFMF2mIRaUfMW1HO4zURr17dSITC717B5IQfsjGYEcreth3kaalfGyePd%0A8rBh%0A)
    

## Product page upsell

In this business case, the brand wants to offer customers the option to add complementary or upgraded products directly from the product page. If the trigger condition is met, the customer will be presented with relevant upsell products, encouraging them to add more items to their cart before proceeding to checkout. This strategy helps increase the AOV by targeting customers with upsell opportunities at the point of interest, maximizing revenue while enhancing the shopping experience.

1.  Brands can create the required product page upsell offer from the editor based on use case requirement.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812910968/29947c84a5f7eb8edf4417b17679/image_9hmsm0.png?expires=1774894500&signature=b5d7cef34e0c60c76495fb54f605f38dcc19191733b70610197999e2777f394e&req=dSgmFMB%2FnYhZUfMW1HO4zaH%2BkJOEVdajp7bviAcKI6KD%2FeS5Ahyov6M2fJZL%0ALDg%2F%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812910968/29947c84a5f7eb8edf4417b17679/image_9hmsm0.png?expires=1774894500&signature=b5d7cef34e0c60c76495fb54f605f38dcc19191733b70610197999e2777f394e&req=dSgmFMB%2FnYhZUfMW1HO4zaH%2BkJOEVdajp7bviAcKI6KD%2FeS5Ahyov6M2fJZL%0ALDg%2F%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812911363/c650d93f860be249c4b3161e3f3f/image_i791wo.png?expires=1774894500&signature=09f42b89fb65e8ec8f214cb1fdb491046fd8096c62019e8196bcbeba3ea26468&req=dSgmFMB%2FnIJZWvMW1HO4zX2EVFJu7aynUOyo%2BKjVpV8rGFCgfmKVnHMLBq1B%0AJo%2FE%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812911363/c650d93f860be249c4b3161e3f3f/image_i791wo.png?expires=1774894500&signature=09f42b89fb65e8ec8f214cb1fdb491046fd8096c62019e8196bcbeba3ea26468&req=dSgmFMB%2FnIJZWvMW1HO4zX2EVFJu7aynUOyo%2BKjVpV8rGFCgfmKVnHMLBq1B%0AJo%2FE%0A)
    
2.  When the user lands on the product page, the upsell product will be displayed as a recommendation, allowing them to add the product to their order directly from the page.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812885572/b3e32b4908673a62d32c827cd672/original?expires=1774894500&signature=0aad3de7498cbeef44f56a9c02318513cfa9d30fd9e2cc8e128403113fcf31b7&req=dSgmFMF2mIRYW%2FMW1HO4zWgda87kK4rcEVsafFKgMmaldNahS7EAYiOf6LjY%0Ak9j5%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812885572/b3e32b4908673a62d32c827cd672/original?expires=1774894500&signature=0aad3de7498cbeef44f56a9c02318513cfa9d30fd9e2cc8e128403113fcf31b7&req=dSgmFMF2mIRYW%2FMW1HO4zWgda87kK4rcEVsafFKgMmaldNahS7EAYiOf6LjY%0Ak9j5%0A)
    

The feature integrates seamlessly into your product pages through the app block, which can be added via the Shopify theme editor.

# FAQs

#### Is it possible to have the post-purchase upsell products added to the subscription recurring orders?

To have the post-purchase upsell products added to the subscription recurring orders is something that is handled by the Aftersell team.  
The Aftersell team will create a post-purchase funnel where they configure it to pass our Loop selling plan ID along with the upsell products they add.  
This ensures that the upsell items are added as a subscription, and the subscription continues smoothly from our end as well.

[Explore more FAQs](https://help.loopwork.co/en/collections/16646422-frequently-asked-questions-faqs)

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#71020401011e0305311d1e1e01061e031a5f121e) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Upsell and cross-sell

](https://help.loopwork.co/en/articles/12703297-upsell-and-cross-sell)[

Checkout upgrades

](https://help.loopwork.co/en/articles/12731490-checkout-upgrades)[

Rebuy

](https://help.loopwork.co/en/articles/12745271-rebuy)[

Zipify OCU

](https://help.loopwork.co/en/articles/12745593-zipify-ocu)[

Onward shipping protection

](https://help.loopwork.co/en/articles/12745817-onward-shipping-protection)
