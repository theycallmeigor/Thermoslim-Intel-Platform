---
title: "Bundle discounts"
source_url: "https://help.loopwork.co/en/articles/12741206-bundle-discounts"
collection: "07-bundles"
scraped_at: "2026-03-30T17:43:20.545Z"
tags: ["07-bundles"]
---

Learn how to configure Box Discounts in Loop to offer flexible bundle pricing, manage stacking rules, and set one-time purchase discounts.

* * *

# What are box discounts

While setting up Box subscriptions, you will come across this section, which allows you to configure discounts for each box size that you have defined on the app. Note that the type selected is applicable for all box sizes. It is not possible to have different discount types for different box sizes.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812012788/7fa351f7fe56aaf6103c24aac981/original?expires=1774894500&signature=0fd888a41ee5437d94a65473dc70aa47684d1fa2b41a68c8599c9ad37324d862&req=dSgmFMl%2Fn4ZXUfMW1HO4zXgEO2axuCDUCGJbGx6v%2B0nPNaC5ga9BIzgKV%2BlW%0Aq0DdLrx1bXdSYlMTpGs%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812012788/7fa351f7fe56aaf6103c24aac981/original?expires=1774894500&signature=0fd888a41ee5437d94a65473dc70aa47684d1fa2b41a68c8599c9ad37324d862&req=dSgmFMl%2Fn4ZXUfMW1HO4zXgEO2axuCDUCGJbGx6v%2B0nPNaC5ga9BIzgKV%2BlW%0Aq0DdLrx1bXdSYlMTpGs%3D%0A)

  
​

# Does box discount stack?

Since the Build a Box page is built on top of a selling plan, any discount configured on the selling plan acts as the base over which Box specific discounts are applied as per the configurations on the Box page. So, **Yes - Box discounts are stacked on top of selling plan discounts**.

Discounts configured on the Box setup page leverages Shopify product discounts to offer the discount on the products. Hence, the user will be able to see the discount code being automatically applied on the checkout screen.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812012789/ea10ea29f0772421d615f0078f4b/original?expires=1774894500&signature=0b81b4417ac679b8f01c904d14afcab8867186b7ca84eb691a36b07922a2ff0b&req=dSgmFMl%2Fn4ZXUPMW1HO4zbNGCiWXA7YlHLqHOZ%2FfDYeqZgavhjt5cHkzUC7J%0AEA8mzUi%2Fz8hCXLBs%2B%2B8%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812012789/ea10ea29f0772421d615f0078f4b/original?expires=1774894500&signature=0b81b4417ac679b8f01c904d14afcab8867186b7ca84eb691a36b07922a2ff0b&req=dSgmFMl%2Fn4ZXUPMW1HO4zbNGCiWXA7YlHLqHOZ%2FfDYeqZgavhjt5cHkzUC7J%0AEA8mzUi%2Fz8hCXLBs%2B%2B8%3D%0A)

If there are more than 100 products in a Box setup. Loop will use order discounts instead of product discounts as Shopify limits product discounts to be applicable to a max of 100 products.

  
​**Learn more**: [Configuring selling plan discounts](https://intercom.help/loop-subscriptions/en/articles/12716873-subscription-discounts)

# Discount configuration example

In this case, we have configured the selling plan to provide a 10% discount for all subscription purchase option / cadence that is selected by the user.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812012791/92ebce25ef08a28fe8f3c81740cb/original?expires=1774894500&signature=29b5ad189fe5f910491d7840039a844ddf29bef11f88bff7c8f30175591584b7&req=dSgmFMl%2Fn4ZWWPMW1HO4zWGtAOOkp1uQKDdOkyyYXmuIMTwUVOYmqlrIlMuT%0ALdrwBRJZUHzvsPoCuA0%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812012791/92ebce25ef08a28fe8f3c81740cb/original?expires=1774894500&signature=29b5ad189fe5f910491d7840039a844ddf29bef11f88bff7c8f30175591584b7&req=dSgmFMl%2Fn4ZWWPMW1HO4zWGtAOOkp1uQKDdOkyyYXmuIMTwUVOYmqlrIlMuT%0ALdrwBRJZUHzvsPoCuA0%3D%0A)

When the user selects a cadence and adds products to their selling plan. Their discount structure would be as follows. The following table shows the total effective discount calculated as these discounts would stack on top of each other.

**Box Size**

**Selling Plan Discount**

**Box Discount**

**Total Discount**

3 items

10%

5%

14.5%

6 items

10%

10%

19%

9 items

10%

15%

23.5%

12 items

10%

20%

28%

Note that if you have configured different selling plan discounts for different frequencies. The effective total discount would differ based on the frequency/cadence option that the user chooses for a particular box size

# How to configure one time purchase discounts on box

You can configure the box discounts to be applicable for one time purchase as well by checking the option “Applicable for one time purchase”

Note that this option is only available if purchase option is selected as “One time + subscription”

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812012787/1fd5962568691cf9da81f8fbfa4e/original?expires=1774894500&signature=ad44ee6213e73a2ff9f6a095dfdb48d8691d9b86d3725f0dec3d587a5c75c8b1&req=dSgmFMl%2Fn4ZXXvMW1HO4zT4eEfcieXnxMvKjNUtTKDvzsHhJT%2F6deTLYUFzt%0ABzrDQmiz89slVBOTOb4%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812012787/1fd5962568691cf9da81f8fbfa4e/original?expires=1774894500&signature=ad44ee6213e73a2ff9f6a095dfdb48d8691d9b86d3725f0dec3d587a5c75c8b1&req=dSgmFMl%2Fn4ZXXvMW1HO4zT4eEfcieXnxMvKjNUtTKDvzsHhJT%2F6deTLYUFzt%0ABzrDQmiz89slVBOTOb4%3D%0A)

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812012792/b8b9ad011a7bd01ec6acaa0dee9b/original?expires=1774894500&signature=13a6e2fd557226528926d5cbe15be0f87065dc4db528d7e5aeaec0093caa6657&req=dSgmFMl%2Fn4ZWW%2FMW1HO4zXODh9Gk116Wr8SBThekoovtawMX6HFhk1JudHzC%0Ap3Dwvh%2FDxYYpnY%2BBPAQ%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812012792/b8b9ad011a7bd01ec6acaa0dee9b/original?expires=1774894500&signature=13a6e2fd557226528926d5cbe15be0f87065dc4db528d7e5aeaec0093caa6657&req=dSgmFMl%2Fn4ZWW%2FMW1HO4zXODh9Gk116Wr8SBThekoovtawMX6HFhk1JudHzC%0Ap3Dwvh%2FDxYYpnY%2BBPAQ%3D%0A)

Note that if the user selects the one time purchase option. Only the bundle discount that is configured on the box page is applied. The selling plan discount is not applicable because the user has purchased a one time box and not a subscription.

**Limitation:** There is no way to configure a specific one time discount for each box size that is configured on the app.

  
​

# API endpoints

*   Bundles storefront API
    

# Need help?

There is no need to worry. We are here to assist you. Please contact us at or feel free to reach out to us through the chat by clicking on the support beacon located at the bottom right [\[email protected\]](/cdn-cgi/l/email-protection#385b574a565d4a164b4d4848574a4c78545757484f574a53165b57)

Regards,

Loop Subscription Team 🙂

* * *

Related Articles

[

Subscription discounts

](https://help.loopwork.co/en/articles/12716873-subscription-discounts)[

Preset fixed bundle

](https://help.loopwork.co/en/articles/12729092-preset-fixed-bundle)[

Auto-update product price

](https://help.loopwork.co/en/articles/12732440-auto-update-product-price)[

Build your bundle

](https://help.loopwork.co/en/articles/12741075-build-your-bundle)[

Kaching bundles

](https://help.loopwork.co/en/articles/12745875-kaching-bundles)
