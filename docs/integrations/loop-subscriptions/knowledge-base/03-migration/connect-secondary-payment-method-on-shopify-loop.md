---
title: "Connect secondary payment method on Shopify / Loop"
source_url: "https://help.loopwork.co/en/articles/12745428-connect-secondary-payment-method-on-shopify-loop"
collection: "03-migration"
scraped_at: "2026-03-30T17:43:22.457Z"
tags: ["03-migration"]
---

Learn how to connect a secondary payment gateway in Shopify via Loop to securely import and vault existing customer payment methods during migration.

This guide walks you through the process of connecting your legacy subscription provider’s payment gateway (e.g., Stripe, Authorize.net, PayPal Express) as a secondary payment method on your Shopify store using the Loop app.

This is essential for importing and vaulting existing customer payment methods when migrating subscriptions.

* * *

# Prerequisites for secondary connection

Before setting up the process, we need to make sure these things are in place.

*   Confirm that your payment provider is supported by Shopify for subscription billing.
    
*   Check supported payment providers [here](https://help.shopify.com/en/manual/products/purchase-options/subscriptions/shopify-subscriptions/considerations)
    
*   Ensure that you are using the same payment provider account as on your legacy platform (Stripe, PayPal Express, etc.)
    

# Step-by-step guide to connect secondary payment method

Follow these steps to complete the process.

1.  Open the Loop app on your store from your Shopify admin.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812825554/1f62e0a7a153ef6003077a44ecab/original?expires=1774894500&signature=e2ad4ecbb3e4b7b52069a5a209fb72fcb515a6ba6309fc6c6d4205f4356e8c48&req=dSgmFMF8mIRaXfMW1HO4zW%2BhOZCUTRmJTKPZ672dK7z7Mqk5KJWNioMTtP4p%0ABv%2BY%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812825554/1f62e0a7a153ef6003077a44ecab/original?expires=1774894500&signature=e2ad4ecbb3e4b7b52069a5a209fb72fcb515a6ba6309fc6c6d4205f4356e8c48&req=dSgmFMF8mIRaXfMW1HO4zW%2BhOZCUTRmJTKPZ672dK7z7Mqk5KJWNioMTtP4p%0ABv%2BY%0A)
    
2.  Navigate to **Settings > Migrate payment methods**  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812826175/7edeedd3a359cc6f57299f859bf9/original?expires=1774894500&signature=59c7ac10c2e8702785aa1628dab794dea029fd76c3755050433a4be50336cc2c&req=dSgmFMF8m4BYXPMW1HO4zXZM4jy8TagLrw2KLMjbpiZEJfpIcXuvHLTCwdyl%0Aq68C%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812826175/7edeedd3a359cc6f57299f859bf9/original?expires=1774894500&signature=59c7ac10c2e8702785aa1628dab794dea029fd76c3755050433a4be50336cc2c&req=dSgmFMF8m4BYXPMW1HO4zXZM4jy8TagLrw2KLMjbpiZEJfpIcXuvHLTCwdyl%0Aq68C%0A)
    
3.  Select the payment provider that you are trying to connect in the dropdown and then click on the **Connect** button.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812826756/889c349ec977acaca4caeb895785/original?expires=1774894500&signature=b6721872bb1f159771a4f95dadad107daf02ef11a82852c05d5a283ef515aa9d&req=dSgmFMF8m4ZaX%2FMW1HO4zbLssQKM2fLWJiUyydDXYIhbeHE%2BC7x1a%2BcaTWz4%0AgEKL%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812826756/889c349ec977acaca4caeb895785/original?expires=1774894500&signature=b6721872bb1f159771a4f95dadad107daf02ef11a82852c05d5a283ef515aa9d&req=dSgmFMF8m4ZaX%2FMW1HO4zbLssQKM2fLWJiUyydDXYIhbeHE%2BC7x1a%2BcaTWz4%0AgEKL%0A)
    

  
This will redirect you to the OAuth authentication page for the selected provider. Ensure that you correct the same account that was linked to your legacy / external platform subscription app.

# Verify connection

Follow these steps to complete the process.

1.  Navigate to **Shopify > Settings > Payments** and you will find the PSP connected right below your primary PSP as shown in the screenshot.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812827566/75e6d92c07aba5bdd19591bc1171/original?expires=1774894500&signature=e4eecc26698a9e90671a7f2d8d82ec4dc9009cf2cf2488a7883dd02151c83483&req=dSgmFMF8moRZX%2FMW1HO4zXvffBOeyVhbQF%2FPRL5G0QUeZXFTjhgyX0nJHyxY%0ABJy4%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812827566/75e6d92c07aba5bdd19591bc1171/original?expires=1774894500&signature=e4eecc26698a9e90671a7f2d8d82ec4dc9009cf2cf2488a7883dd02151c83483&req=dSgmFMF8moRZX%2FMW1HO4zXvffBOeyVhbQF%2FPRL5G0QUeZXFTjhgyX0nJHyxY%0ABJy4%0A)
    
2.  Alternatively, the **Settings > Migrate payment methods** page in the Loop app will also show the same information.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812828117/df01e94531f552e75711f6dc2881/original?expires=1774894500&signature=58a297f503b973b52469dd3cc4acba79eb1bdddbb423a61edd018f181eae231e&req=dSgmFMF8lYBeXvMW1HO4zf8eDfv4g0xlk3LVg%2B8QSd3w65N2rws1GF073T0H%0AYw2W%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812828117/df01e94531f552e75711f6dc2881/original?expires=1774894500&signature=58a297f503b973b52469dd3cc4acba79eb1bdddbb423a61edd018f181eae231e&req=dSgmFMF8lYBeXvMW1HO4zf8eDfv4g0xlk3LVg%2B8QSd3w65N2rws1GF073T0H%0AYw2W%0A)
    

# FAQs

#### Is it possible to move Auth.net from Primary to secondary payment method for existing subscriptions while keeping Shopify payments as primary?

If Auth.net was set as the primary provider in Shopify, this means that payment tokens are already with Shopify. So if you re-add Auth as secondary and make Shopify Payments primary, it won't affect.

#### If I wanted to switch payment processors from Shopify Payments to Authorize.net, would all of my subscribers remain?

While switching payment processors, there won't be any problems with your payments coming from credit cards. However, the wallet payments will not come through. This will work only after the provider migration is fully completed from Shopify Payments to Authorize.net. While the store is between the two payment processors, this functionality will not work.

For the wallet payments, you'll need to run the campaign to nudge customers to update their payments.

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#c3b0b6b3b3acb1b783afacacb3b4acb1a8eda0ac) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Import from Stripe

](https://help.loopwork.co/en/articles/12700734-import-from-stripe)[

Loop migration process

](https://help.loopwork.co/en/articles/12742349-loop-migration-process)[

Payment migration

](https://help.loopwork.co/en/articles/12742688-payment-migration)[

Import from Authorize.net

](https://help.loopwork.co/en/articles/12745155-import-from-authorize-net)[

Migrate from Recharge policy

](https://help.loopwork.co/en/articles/12752667-migrate-from-recharge-policy)
