---
title: "Google analytics (GA4)"
source_url: "https://help.loopwork.co/en/articles/12742043-google-analytics-ga4"
collection: "11-integrations"
scraped_at: "2026-03-30T17:43:19.248Z"
tags: ["11-integrations"]
---

Learn how to integrate Google Analytics 4 with Loop to track recurring subscription transactions and gain unified revenue insights in GA4.

Loop’s Google Analytics 4 integration allows you to track the recurring order transactions of subscriptions along with your non-subscription transactions and thus providing a complete picture of your store revenues in your main GA4 account.

### Key features

*   Server-side integration avoiding the need to add Google tag manager or any tracking scripts separately for the Loop app.
    
*   For every event sent on GA4, we add the Shopify customer id as the user id which helps in linking different subscription order events to a common customer.
    
*   We only send transaction data for recurring orders and not the origin order generated from Shopify checkout preventing duplication of the same order.
    

If you are just getting started, then we recommend reading this [Google help doc](https://support.google.com/analytics/answer/10089681?hl=en) to help you understand how GA4 works and how to get migrated from Universal Analytics to GA4.  
​

GA4 integration is available on both the Loop Starter and Pro plans

* * *

# Types of events

*   Recurring order successful transactions
    
*   Payment failed events
    
*   Subscription life-cycle events
    

## Recurring order successful transactions

Whenever a recurring order billing is attempted, we send out GA4 events having the products, price, quantity, tax, shipping information related to the order.

*   loop\_order\_processed
    
*   loop\_order\_partially\_processed
    

## Payment failed events

Whenever a recurring charge attempted from Loop fails, we send out GA4 events having the subscription\_id, value, failure\_reason information related to the order.

*   loop\_payment\_attempt\_failed\_with\_retries\_left
    
*   loop\_payment\_attempt\_failed\_last\_retry\_left
    
*   loop\_payment\_attempt\_failed
    

## Subscription life-cycle events

Along with the transaction events, we also send important subscription events which can help you in analyzing your store subscriptions performance.

*   loop\_subscription\_created
    
*   loop\_subscription\_paused
    
*   loop\_subscription\_resumed
    
*   loop\_subscription\_cancelled
    
*   loop\_subscription\_reactivated
    
*   loop\_subscription\_expired
    
*   loop\_order\_skipped
    
*   loop\_order\_out\_of\_stock
    

# Connecting GA4 account to Loop

To connect your Google Analytics 4 account, you would need to obtain “**api\_secret**” and “**measurement\_id**”.

*   ### api\_secret:
    
    *   API secret key generated in GA4 account required to enable additional events to be sent into a specific data steam from an external server.
        
    
    *   To create a new API secret, navigate to **Admin > Data Streams > choose your stream > Measurement Protocol > Create**
        
    

*   ### measurement\_id:
    
    *   Measurement ID associated with a specific data stream in GA4.
        
    
    *   It can be found under **Admin > Data Streams > choose your stream > Measurement ID**  
        ​
        
    

## Steps to look up API secret and measurement ID

1.  Click on the admin icon (at the bottom) and select relevant account and GA4 property to connect over to Loop. Then click on the **"Data Streams"** option.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812273073/47dd95920d48f923ff6f1f15d4f3/2537397c-bc5b-475f-9302-68856f_1wcdym.png?expires=1774894500&signature=a7088f5e473cc3b46473ffda8c3d9762d27ec2ae1b84f31efcafcbed5dc52592&req=dSgmFMt5noFYWvMW1HO4zeRsCfj4y2iJ9GT98EumdpFpfRDG7znbrPnjWlZM%0Akohs%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812273073/47dd95920d48f923ff6f1f15d4f3/2537397c-bc5b-475f-9302-68856f_1wcdym.png?expires=1774894500&signature=a7088f5e473cc3b46473ffda8c3d9762d27ec2ae1b84f31efcafcbed5dc52592&req=dSgmFMt5noFYWvMW1HO4zeRsCfj4y2iJ9GT98EumdpFpfRDG7znbrPnjWlZM%0Akohs%0A)
    
2.  Choose one of the data streams in which you would want to receive the Loop events. If no stream added yet, click "**Add stream**" to add one and choose the "**Web**" option.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812273245/c232e0679fcc1262e308c09b161f/da00725c-dcd5-458e-b73c-3d6f06_1u2ivz2.png?expires=1774894500&signature=e3d098e5aee0cb1728e6000a35e44c876d4abc2f8cd8170d86110c2c92e3de60&req=dSgmFMt5noNbXPMW1HO4zUQHLLej%2BMW3m2%2BHTFlXfGOjumSVhmnZ%2BEPTmHHA%0AkPBR%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812273245/c232e0679fcc1262e308c09b161f/da00725c-dcd5-458e-b73c-3d6f06_1u2ivz2.png?expires=1774894500&signature=e3d098e5aee0cb1728e6000a35e44c876d4abc2f8cd8170d86110c2c92e3de60&req=dSgmFMt5noNbXPMW1HO4zUQHLLej%2BMW3m2%2BHTFlXfGOjumSVhmnZ%2BEPTmHHA%0AkPBR%0A)
    
3.  When you click on a data stream, you would be able to see Stream details bar on top of the drawer. The left most option will be showing the **Measurement ID** of the stream as highlighted in the screenshot below. Copy and paste this value in the Measurement ID field of Loop Set up instructions page.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812273585/c7bf40e65202a9f8b3b0a883750a/fb59b1f9-94e5-4552-b53a-8e271c_7hopke.png?expires=1774894500&signature=115072da85d6e12cd0701636eed0db0a7d6aeab29bb7de44153bd3f3c2ee3710&req=dSgmFMt5noRXXPMW1HO4zXQ1%2Fbpui0CLRfgsZsDzD6lbw9D%2FiDM%2BnSTqQ9q3%0AATT5%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812273585/c7bf40e65202a9f8b3b0a883750a/fb59b1f9-94e5-4552-b53a-8e271c_7hopke.png?expires=1774894500&signature=115072da85d6e12cd0701636eed0db0a7d6aeab29bb7de44153bd3f3c2ee3710&req=dSgmFMt5noRXXPMW1HO4zXQ1%2Fbpui0CLRfgsZsDzD6lbw9D%2FiDM%2BnSTqQ9q3%0AATT5%0A)
    
4.  Click on the "**Measurement Protocol API**" secrets option as highlighted in the screenshot below.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812273805/c63a667a20718fe5d8ba48d0d94c/92003766-444b-4c0f-9f80-a7945f_xqd605.png?expires=1774894500&signature=1c1460de3b64fc0c9450f7aa4fc104860e2fcdaa3658c5d39b484a0aaef52dfd&req=dSgmFMt5nolfXPMW1HO4zYMMN1V2yfAaln%2F6XTTWKz5qYrqK7Y8GnvHLCOon%0Ajjaa%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812273805/c63a667a20718fe5d8ba48d0d94c/92003766-444b-4c0f-9f80-a7945f_xqd605.png?expires=1774894500&signature=1c1460de3b64fc0c9450f7aa4fc104860e2fcdaa3658c5d39b484a0aaef52dfd&req=dSgmFMt5nolfXPMW1HO4zYMMN1V2yfAaln%2F6XTTWKz5qYrqK7Y8GnvHLCOon%0Ajjaa%0A)
    
5.  If you have not generated any API secrets yet, it is highly likely that Google would want you to acknowledge the terms before creating an API secret. In that case, click on the "**Review terms**" button and acknowledge the terms.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812274037/5c03a9e46df3e6c101949f49cc2d/4c600516-ca95-47d5-8e76-402083_3cj7dx.png?expires=1774894500&signature=e3cae19b53a810e7da101f84a8a8929d4726cd943cf1a87000303e5fe648bafc&req=dSgmFMt5mYFcXvMW1HO4zZrwo9NzisCpKqXgDoIQOIeAdQgyaYtKFw3aTQqf%0AIFDy%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812274037/5c03a9e46df3e6c101949f49cc2d/4c600516-ca95-47d5-8e76-402083_3cj7dx.png?expires=1774894500&signature=e3cae19b53a810e7da101f84a8a8929d4726cd943cf1a87000303e5fe648bafc&req=dSgmFMt5mYFcXvMW1HO4zZrwo9NzisCpKqXgDoIQOIeAdQgyaYtKFw3aTQqf%0AIFDy%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812274149/fa6707f404b6e64018a81daf1e31/be1b6848-fd55-40ad-aae9-a00392_y9tyag.png?expires=1774894500&signature=0ac9d316b6856f4595c25a5e26c36c2918de600b8aaa86c20f811ca52ba020dd&req=dSgmFMt5mYBbUPMW1HO4zT3rU1YvLyEx6w2y2tYt1u2KGOXCfzSqWNjyHIoH%0AclD4%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812274149/fa6707f404b6e64018a81daf1e31/be1b6848-fd55-40ad-aae9-a00392_y9tyag.png?expires=1774894500&signature=0ac9d316b6856f4595c25a5e26c36c2918de600b8aaa86c20f811ca52ba020dd&req=dSgmFMt5mYBbUPMW1HO4zT3rU1YvLyEx6w2y2tYt1u2KGOXCfzSqWNjyHIoH%0AclD4%0A)
    
6.  Once you acknowledged the terms, you would be able to see "**Create**" button. Click it to create a new API Secret.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812274337/3b742a019971a25bcfc7a348ca25/c6ec6a39-512c-420a-a8eb-03bad8_cm7ge5.png?expires=1774894500&signature=971fb092aecd5a103587b85a7630dd5bda026d8bca697cc9998795cf0ab0f217&req=dSgmFMt5mYJcXvMW1HO4zdh%2B%2BxlOhoykTB2KP0ywecD0XlfHGBJ0AuTwq50U%0A54X%2B%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812274337/3b742a019971a25bcfc7a348ca25/c6ec6a39-512c-420a-a8eb-03bad8_cm7ge5.png?expires=1774894500&signature=971fb092aecd5a103587b85a7630dd5bda026d8bca697cc9998795cf0ab0f217&req=dSgmFMt5mYJcXvMW1HO4zdh%2B%2BxlOhoykTB2KP0ywecD0XlfHGBJ0AuTwq50U%0A54X%2B%0A)
    
7.  Choose a name for the API secret, preferably "**Loop subscriptions**" for future reference.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812274540/babd3923aa8bedcb67ec4b60238a/file-vh2jVW28Xd.png?expires=1774894500&signature=8ea8c98e700be617253aeba8b966a06859a867b90de3860e2493f0c229a2115b&req=dSgmFMt5mYRbWfMW1HO4zWZ6bZvnFmsZcLU3OU2JZqUMEFcGwFmlchNAuXuD%0AQBNW%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812274540/babd3923aa8bedcb67ec4b60238a/file-vh2jVW28Xd.png?expires=1774894500&signature=8ea8c98e700be617253aeba8b966a06859a867b90de3860e2493f0c229a2115b&req=dSgmFMt5mYRbWfMW1HO4zWZ6bZvnFmsZcLU3OU2JZqUMEFcGwFmlchNAuXuD%0AQBNW%0A)
    
8.  Once, you click on "**Create**" button, you would be able to see the newly generated API secret. Copy and paste this value in the API Secret field of Loop Set up instructions page.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812274813/d3b52b9c43ac7d1fe14c1feeecc0/file-gkImfxR6f3.png?expires=1774894500&signature=b1af9deb57a350fc78d4765ed9840b7d93b644a09e424f86598e1b33f0141acf&req=dSgmFMt5mYleWvMW1HO4zeSpSjPVfRX3dYUL4BrSh5WzSfXhjRP%2FNRi5lAYM%0A2sbv%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812274813/d3b52b9c43ac7d1fe14c1feeecc0/file-gkImfxR6f3.png?expires=1774894500&signature=b1af9deb57a350fc78d4765ed9840b7d93b644a09e424f86598e1b33f0141acf&req=dSgmFMt5mYleWvMW1HO4zeSpSjPVfRX3dYUL4BrSh5WzSfXhjRP%2FNRi5lAYM%0A2sbv%0A)
    

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812278969/01357b53f2be96e6fc1025f1fc3e/original?expires=1774894500&signature=29d5ed17b926700f4580555401d77df567cb1c4703055ed844687c6aeba602b5&req=dSgmFMt5lYhZUPMW1HO4zVOfLHEP2k0C9c1rIYTcjjZT2tdPZ4U4%2BEzo7gb3%0AhllzGdR59%2BhIItk19%2Fo%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812278969/01357b53f2be96e6fc1025f1fc3e/original?expires=1774894500&signature=29d5ed17b926700f4580555401d77df567cb1c4703055ed844687c6aeba602b5&req=dSgmFMt5lYhZUPMW1HO4zVOfLHEP2k0C9c1rIYTcjjZT2tdPZ4U4%2BEzo7gb3%0AhllzGdR59%2BhIItk19%2Fo%3D%0A)

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#b4c7c1c4c4dbc6c0f4d8dbdbc4c3dbc6df9ad7db) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Subscription overview

](https://help.loopwork.co/en/articles/12657742-subscription-overview)[

Standard subscription

](https://help.loopwork.co/en/articles/12731191-standard-subscription)[

Omnisend

](https://help.loopwork.co/en/articles/12741473-omnisend)[

Sendlane

](https://help.loopwork.co/en/articles/12741759-sendlane)[

Gladly

](https://help.loopwork.co/en/articles/12741866-gladly)
