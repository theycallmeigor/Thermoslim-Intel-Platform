---
title: "Sky pilot"
source_url: "https://help.loopwork.co/en/articles/12745031-sky-pilot"
collection: "11-integrations"
scraped_at: "2026-03-30T17:43:17.945Z"
tags: ["11-integrations"]
---

Learn how to integrate Sky Pilot with Loop to securely deliver digital products like videos, music, or eBooks through seamless subscription fulfillment.

[Sky pilot](https://apps.shopify.com/sky-pilot) is designed with the aim to provide the safest and easiest way to help Shopify stores like you in delivering their digital products to their customers without limits. Some of their key features include:

### Key features

*   Instant downloads. Give customers immediate access to content purchased.
    
*   Entirely customizable delivery for an entirely on-brand experience.
    
*   Direct on-brand hosting and delivery in your store to keep customers longer.
    
*   Enterprise-grade security with limited downloads, abuse alerts, and more.
    
*   Seamless delivery and storage of digital files and products.
    

Sky Pilot can help you sell and deliver music, videos, books, or any digital files instantly and without limits.  
​

Sky pilot integration is available on both the Loop Starter and Pro plans.

  
This guide will walk you through Loop integration with Sky Pilot, covering details of the setup process and its benefits.

* * *

# Why integrate with Sky Pilot?

Sky Pilot has built a seamless integration that works with the Loop Subscriptions app to:

*   Send regular digital content to your active subscribers
    
*   Avoid the hassle of manually tracking and sending content only to active subscribers
    
*   Automatically stop sending digital content as soon as they cancel their subscriptions
    

# How to setup Sky Pilot to work with Loop subscriptions?

To setup Sky Pilot to work with Loop, you need to ensure the below prerequisites before going through with the integration on the app:

*   Sky Pilot is installed, and you have an active account
    
*   Merchants should be on Loop’s Starter plan or above
    

Follow the below steps if you have satisfied the prerequisites:

1.  [Create a selling plan](https://intercom.help/loop-subscriptions/en/articles/12674241-selling-plans) on Loop admin and [map relevant products](https://intercom.help/loop-subscriptions/en/articles/12716791-mapping-products-to-selling-plan) available for subscription  
    ​
    
2.  Open  
    •**Active subscriber tag**: if you wish to send the digital content for the concerned selling plan to all active subscribers  
    •**Active subscriber tag with product info:** if you wish to send the digital content for the concerned selling plan only to active subscribers with specific products. This is useful if you want to send different content to different customers based on the subscription product purchased.  
    ​
    
3.  **Copy the tag** generated in Step 2. In case you activated option 'b' - put in the exact product name in place of {{PRODUCT\_NAME}}  
    ​
    
4.  Open the Sky Pilot app and go to **Settings > Subscriptions**.  
    ​
    
5.  Locate the selling plan created in Step 1 on Loop and **click on Add** button.  
    ​
    
6.  **Paste and save the tag** that you copied in Step 3.  
    ​
    
7.  On Sky Pilot, find your subscription product by clicking on the "Products" icon on the left-hand side. **Attach a digital file or a video** which subscribers will receive upon purchase.
    

Hurray! You can now go to your storefront and check your newly setup product. You can also test the whole purchase journey to verify the setup.

  
​

# FAQs

#### What if I want to distribute the hyper-personalised digital content to specific subscribers, not those covered with the generic tag of a product they subscribed to?

You can leverage the powerful Loop flows to generate special customer tags based on multiple conditions and use those custom tags to enable hyper-personalised digital content distribution.  
​

Let's say you sell online Yoga courses on monthly charges, and you want to send Begineer videos to subscribers in 1st month while sending Intermediate videos to subscribers in 2nd month.

Tagging new subscribers of Yoga Trial Subscription with Meditation specialisation as Meditation\_Begineer to send them Begineer stage videos only

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812647899/5788824f8bcad4b17362fd221cb8/original?expires=1774894500&signature=6a4d69b65ba5718f67a16aea015ae688650ac1348c780f39ff95cb35b0644322&req=dSgmFM96molWUPMW1HO4zeHWASRQB4PkIslz1Xqdl5kknam6r%2FFLCh8WStsQ%0AbRxq%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812647899/5788824f8bcad4b17362fd221cb8/original?expires=1774894500&signature=6a4d69b65ba5718f67a16aea015ae688650ac1348c780f39ff95cb35b0644322&req=dSgmFM96molWUPMW1HO4zeHWASRQB4PkIslz1Xqdl5kknam6r%2FFLCh8WStsQ%0AbRxq%0A)

Similarly, follow the below configuration to tag 2nd-month subscribers of Yoga Trial Subscription with Meditation specialisation to send them Intermediate stage videos only

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812647887/596c832e5f9f4a4837972050010e/original?expires=1774894500&signature=684de85ea98db1b31c54163205847f89ff6f6db2db55211e448f7a433c2809a3&req=dSgmFM96molXXvMW1HO4zdGsoEZXDFxii8lrcCddaU1Dr2NNkqYMzXC6RvkU%0A3A%2Fu%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812647887/596c832e5f9f4a4837972050010e/original?expires=1774894500&signature=684de85ea98db1b31c54163205847f89ff6f6db2db55211e448f7a433c2809a3&req=dSgmFM96molXXvMW1HO4zdGsoEZXDFxii8lrcCddaU1Dr2NNkqYMzXC6RvkU%0A3A%2Fu%0A)

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812647886/83db9d02f686f0f9a59cd75bd672/original?expires=1774894500&signature=8cf72409e1a5cda26dc6b28ee237035d8d47dcbe64b25d7e089a1a7faf12b6da&req=dSgmFM96molXX%2FMW1HO4zW0foLJTzoMhTjVITVeTN3wsRCy6zGUXQxljWkvo%0A4hvk%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812647886/83db9d02f686f0f9a59cd75bd672/original?expires=1774894500&signature=8cf72409e1a5cda26dc6b28ee237035d8d47dcbe64b25d7e089a1a7faf12b6da&req=dSgmFM96molXX%2FMW1HO4zW0foLJTzoMhTjVITVeTN3wsRCy6zGUXQxljWkvo%0A4hvk%0A)

[Explore more FAQs](https://help.loopwork.co/en/collections/16646422-frequently-asked-questions-faqs)

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#e4979194948b9690a4888b8b94938b968fca878b) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Getting started with Loop

](https://help.loopwork.co/en/articles/12703816-getting-started-with-loop)[

Subscription discounts

](https://help.loopwork.co/en/articles/12716873-subscription-discounts)[

Standard subscription

](https://help.loopwork.co/en/articles/12731191-standard-subscription)[

Memberships

](https://help.loopwork.co/en/articles/12731298-memberships)[

Subscription tags

](https://help.loopwork.co/en/articles/12732642-subscription-tags)
