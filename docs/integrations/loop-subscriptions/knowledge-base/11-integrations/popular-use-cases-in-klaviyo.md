---
title: "Popular use cases in Klaviyo"
source_url: "https://help.loopwork.co/en/articles/12733587-popular-use-cases-in-klaviyo"
collection: "11-integrations"
scraped_at: "2026-03-30T17:43:18.453Z"
tags: ["11-integrations"]
---

Explore practical Klaviyo and Loop integration use cases to create automated workflows, personalized emails, and enhance subscriber engagement effortlessly.

This article covers **popular use cases** that showcase how the integration can be applied effectively. The examples outlined here provide practical ways to make the most of Klaviyo and help guide you in setting up relevant workflows for your brand.

**Learn more:** [Klaviyo integration with Loop](https://intercom.help/loop-subscriptions/en/articles/12733266-klaviyo)

* * *

# Implementation of major use-cases

## Using lists and segments

**Lists:** Unlike dynamic segments, lists are static. They include anyone who has subscribed to join the list and will only grow as people subscribe.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811084424/5af5c4299d150dec81376242848e/original?expires=1774894500&signature=98f4704719d565212b50383200fee29b28090e9a7e33cb40c501d84e9d9232d9&req=dSgmF8l2mYVdXfMW1HO4zb5oGODhdqy39IrPSwXWGCpbpHFPvqu8xnP%2BRsgM%0ATg8niug%2BQEFzpi2p8fc%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811084424/5af5c4299d150dec81376242848e/original?expires=1774894500&signature=98f4704719d565212b50383200fee29b28090e9a7e33cb40c501d84e9d9232d9&req=dSgmF8l2mYVdXfMW1HO4zb5oGODhdqy39IrPSwXWGCpbpHFPvqu8xnP%2BRsgM%0ATg8niug%2BQEFzpi2p8fc%3D%0A)

**Segments:** Unlike traditional subscriber lists, are defined by a set of conditions. For example, a segment could include customers who are active subscribers or opened a specific email. Segments are dynamic and will grow or shrink based on customer behavior, providing a more targeted approach to marketing.

In this business case, the brand aims to create a segment of users who have cancelled their subscriptions. Based on this segment, they plan to run a reactivation campaign, sending targeted emails with special offers to encourage these users to reactivate their subscriptions.

1.  Brands will create a segment using the "**Loop subscription cancelled**" event.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811049848/f241f373786ca53d51bb11858800/image_wzmdh0.png?expires=1774894500&signature=d7ba21dfb20ad6152c115947873cfe10456a62580dd09c3e038678bc7017a1fa&req=dSgmF8l6lIlbUfMW1HO4zWdLWPqrGdlXu%2FIBxFkDCpIoMz1nMCfnqf12nOMv%0AU0ML%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811049848/f241f373786ca53d51bb11858800/image_wzmdh0.png?expires=1774894500&signature=d7ba21dfb20ad6152c115947873cfe10456a62580dd09c3e038678bc7017a1fa&req=dSgmF8l6lIlbUfMW1HO4zWdLWPqrGdlXu%2FIBxFkDCpIoMz1nMCfnqf12nOMv%0AU0ML%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811050101/adcff11380f36489bca48e1c8ce0/image_asc789.png?expires=1774894500&signature=44f26c606afae9e6b436c70e6f362fd33eb2e025c1872490fa751a2ab52e3b48&req=dSgmF8l7nYBfWPMW1HO4zY3tGZurp5XS3WtnXhFbKoPMzaRGzWwxCvJbx%2FTE%0A%2Fxf3%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811050101/adcff11380f36489bca48e1c8ce0/image_asc789.png?expires=1774894500&signature=44f26c606afae9e6b436c70e6f362fd33eb2e025c1872490fa751a2ab52e3b48&req=dSgmF8l7nYBfWPMW1HO4zY3tGZurp5XS3WtnXhFbKoPMzaRGzWwxCvJbx%2FTE%0A%2Fxf3%0A)
    
2.  You can add additional conditions, to filter the segment based on specific use case requirements.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811039547/0ee7c6df863e498fbd5c010a00e9/original?expires=1774894500&signature=787cc878600d5a29591f06f9e26a62864cc60b3dec93ddebb2de239cb8415bdf&req=dSgmF8l9lIRbXvMW1HO4zcgwBPXQzw%2BMPthvtzj%2FWy9NiLFWm4KAYQfRuKcK%0AQ%2F8g%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811039547/0ee7c6df863e498fbd5c010a00e9/original?expires=1774894500&signature=787cc878600d5a29591f06f9e26a62864cc60b3dec93ddebb2de239cb8415bdf&req=dSgmF8l9lIRbXvMW1HO4zcgwBPXQzw%2BMPthvtzj%2FWy9NiLFWm4KAYQfRuKcK%0AQ%2F8g%0A)
    

## Using quick actions in Klaviyo

Quick action URLs are powerful magic links that enable customers to take specific subscription-related actions seamlessly, without needing to navigate through the customer portal. These links can be leveraged in marketing integrations like Klaviyo to enhance customer engagement and improve subscription retention. This section will walk you through how to use quick action URLs within Klaviyo.

Event action URLs are triggered automatically when a specific event occurs, enabling seamless automation of subscription-related actions. Here is how you can use it in Klaviyo.

In this business case, the brand wants to include an “Add other product” CTA in the Loop subscription started notification sent using Klaviyo, allowing subscribers to add the product to their upcoming subscription order. To achieve this, the **Add product quick action** can be utilized.

1.  Navigate to **Loop admin > Retain > Quick actions > Select the required template or click on Create a quick action button.**  
    Brands can directly copy the Klaviyo-supported quick action key from the Loop admin and use it while building flows in Klaviyo.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1865301561/126d9368386c0c3cb155d1ffb7a4/image.png?expires=1774894500&signature=fe842e8b48ac612b32c599a90ca91e18bce217b2122adecbd856a92213575a10&req=dSghE8p%2BnIRZWPMW1HO4zWX4KuWqf8WnfH%2BBYlScesp40IrQJbNTUW3txaQX%0Aqavx%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1865301561/126d9368386c0c3cb155d1ffb7a4/image.png?expires=1774894500&signature=fe842e8b48ac612b32c599a90ca91e18bce217b2122adecbd856a92213575a10&req=dSghE8p%2BnIRZWPMW1HO4zWX4KuWqf8WnfH%2BBYlScesp40IrQJbNTUW3txaQX%0Aqavx%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1865315096/7cc19500bec160702378d2b469ed/image.png?expires=1774894500&signature=fe7e0d77b4794916b344cef43f3baeb05b313b1d7cb38815b72126c51af7ede3&req=dSghE8p%2FmIFWX%2FMW1HO4ze77c%2FpDDFye%2Fnx84ps3WiX90nSdtbw4GsGN9GyW%0AXvhX%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1865315096/7cc19500bec160702378d2b469ed/image.png?expires=1774894500&signature=fe7e0d77b4794916b344cef43f3baeb05b313b1d7cb38815b72126c51af7ede3&req=dSghE8p%2FmIFWX%2FMW1HO4ze77c%2FpDDFye%2Fnx84ps3WiX90nSdtbw4GsGN9GyW%0AXvhX%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2179463748/55bd3d2bb8ce9fcd652041fe722a/image.png?expires=1774894500&signature=cb85f26502a0e2a08cda820dc2d8d5a6ed4660c69fba9dc7afb6d995571e6e69&req=diEgH814noZbUfMW1HO4zbK3BifqMRhCMzrl8%2FPBWp05slT4JyWqoTcI106l%0AK6DG%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2179463748/55bd3d2bb8ce9fcd652041fe722a/image.png?expires=1774894500&signature=cb85f26502a0e2a08cda820dc2d8d5a6ed4660c69fba9dc7afb6d995571e6e69&req=diEgH814noZbUfMW1HO4zbK3BifqMRhCMzrl8%2FPBWp05slT4JyWqoTcI106l%0AK6DG%0A)
    
      
    ​**Note:** The Klaviyo action key field will only be visible when the Loop store is connected with Klaviyo.  
    ​
    
2.  Once the required quick action is created open Klaviyo and navigate to your email flow or campaign where you want to include the event quick action URLs.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811053311/c716d39e719531e6b7988e828c59/image_d966is.png?expires=1774894500&signature=8ce5fd5c93ca5e3c5166fc417826da433eb17608a0fbcffd84171b2b9fe02a72&req=dSgmF8l7noJeWPMW1HO4zQ7L%2FxKiEwZGVcaKyh19%2F9GzZRcoNdZlhfQHfuCA%0Arwdp%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811053311/c716d39e719531e6b7988e828c59/image_d966is.png?expires=1774894500&signature=8ce5fd5c93ca5e3c5166fc417826da433eb17608a0fbcffd84171b2b9fe02a72&req=dSgmF8l7noJeWPMW1HO4zQ7L%2FxKiEwZGVcaKyh19%2F9GzZRcoNdZlhfQHfuCA%0Arwdp%0A)
    
3.  Edit the email template and insert the newly created quick action URL key in the button as per the requirement.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811053619/267006da9158b40616a2783b3090/image_iyjqww.png?expires=1774894500&signature=cd65cf97c40f564f361658a01884341345310eaf8c2840017a3add762ee50226&req=dSgmF8l7nodeUPMW1HO4zUkAYJMeXnXSbS7D1gioFOray86%2FeAcbfVcnJFKc%0AadUZ%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811053619/267006da9158b40616a2783b3090/image_iyjqww.png?expires=1774894500&signature=cd65cf97c40f564f361658a01884341345310eaf8c2840017a3add762ee50226&req=dSgmF8l7nodeUPMW1HO4zUkAYJMeXnXSbS7D1gioFOray86%2FeAcbfVcnJFKc%0AadUZ%0A)
    
4.  Save and activate your email flow. Before going live, test it with a sample subscription to ensure it functions as expected.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811039561/dbd6249a5f309b2c4433359037e7/original?expires=1774894500&signature=d4d0c1304293f8fab761c6d8ab3193b64ee59311d8733ac14e32c08b27625b4e&req=dSgmF8l9lIRZWPMW1HO4zZX9sn2Tv8TVkDOTw6IjixmSGhE5sTrsPYQdY%2FFg%0A1rB7%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811039561/dbd6249a5f309b2c4433359037e7/original?expires=1774894500&signature=d4d0c1304293f8fab761c6d8ab3193b64ee59311d8733ac14e32c08b27625b4e&req=dSgmF8l9lIRZWPMW1HO4zZX9sn2Tv8TVkDOTw6IjixmSGhE5sTrsPYQdY%2FFg%0A1rB7%0A)
    

##   
Using campaigns in Klaviyo

​Campaign action URLs can be used in email or sms campaigns on any marketing platform of your choice. Here is how you can use it in Klaviyo.

In this business case, the brand wants to run a campaign targeting inactive subscription users to encourage them to reactivate their subscriptions, offering a free gift as an incentive upon completion of the action.

1.  Navigate to **Loop admin > Campaigns > Select the required template or click on Create a campaign button.**  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1865320198/c3066795982d12d96a859fa7c29d/image.png?expires=1774894500&signature=73fa59d6ca2719a78bb634ffa2774a718401997d47cc2c857ca19201b6ada978&req=dSghE8p8nYBWUfMW1HO4zfE6XdRykZmVKEZ%2Fuo8LQ0ZU243QqPNGe4ZtK6wx%0Ap%2FnU%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1865320198/c3066795982d12d96a859fa7c29d/image.png?expires=1774894500&signature=73fa59d6ca2719a78bb634ffa2774a718401997d47cc2c857ca19201b6ada978&req=dSghE8p8nYBWUfMW1HO4zfE6XdRykZmVKEZ%2Fuo8LQ0ZU243QqPNGe4ZtK6wx%0Ap%2FnU%0A)
    
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1865324490/6ae6e2f8410db18e94238460b778/image.png?expires=1774894500&signature=761fe17de40b5708483caddf9c9f04953a81ee9061cd7a5aafc77bdda6765cf6&req=dSghE8p8mYVWWfMW1HO4zQ%2FnQfcPyS1gcfPQErWXkHotmcOfESmdjgt7c6gy%0AnS01%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1865324490/6ae6e2f8410db18e94238460b778/image.png?expires=1774894500&signature=761fe17de40b5708483caddf9c9f04953a81ee9061cd7a5aafc77bdda6765cf6&req=dSghE8p8mYVWWfMW1HO4zQ%2FnQfcPyS1gcfPQErWXkHotmcOfESmdjgt7c6gy%0AnS01%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1865329509/6962a41a9bd177ef37fe38bf0b91/image.png?expires=1774894500&signature=11f10cd4d44938f4ea6d5fa2b30929b2ade1f185041fcafba28993b1e107dfaa&req=dSghE8p8lIRfUPMW1HO4zQVnyM2EeULZaQ0poM3L6UAyEDEUZZG6c2wSVyX5%0AmvEg%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1865329509/6962a41a9bd177ef37fe38bf0b91/image.png?expires=1774894500&signature=11f10cd4d44938f4ea6d5fa2b30929b2ade1f185041fcafba28993b1e107dfaa&req=dSghE8p8lIRfUPMW1HO4zQVnyM2EeULZaQ0poM3L6UAyEDEUZZG6c2wSVyX5%0AmvEg%0A)
    
2.  Once the campaign action list is synced successfully in Klaviyo, click on the **"view list on klaviyo"** link.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1865332769/ebfc569e20b271a1fd601deea00c/image.png?expires=1774894500&signature=9838062217811a9bd0138e1e86abb4ad028299ae24bdcbe6e24013fdaf674c3d&req=dSghE8p9n4ZZUPMW1HO4zbMgqkRuZQ1SY7edtNEoPfo2FedhUR%2Fu802UK3MU%0APhz%2F%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1865332769/ebfc569e20b271a1fd601deea00c/image.png?expires=1774894500&signature=9838062217811a9bd0138e1e86abb4ad028299ae24bdcbe6e24013fdaf674c3d&req=dSghE8p9n4ZZUPMW1HO4zbMgqkRuZQ1SY7edtNEoPfo2FedhUR%2Fu802UK3MU%0APhz%2F%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1865333653/0f9b68ce7fa4623908ac9a5ab50e/image.png?expires=1774894500&signature=0d227f4eb3db663f17c12ae710ac9f772846c815f9ab881fb26d8e03d7694bf4&req=dSghE8p9nodaWvMW1HO4zYYxQ4cmJWH1sjgAA99BwPpX6akbq3N33PI%2Ft6Rz%0AS%2FiP%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1865333653/0f9b68ce7fa4623908ac9a5ab50e/image.png?expires=1774894500&signature=0d227f4eb3db663f17c12ae710ac9f772846c815f9ab881fb26d8e03d7694bf4&req=dSghE8p9nodaWvMW1HO4zYYxQ4cmJWH1sjgAA99BwPpX6akbq3N33PI%2Ft6Rz%0AS%2FiP%0A)
    
3.  In Klaviyo, you can head to the targeted customer profiles & verify the campaign action key is now present.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1865335189/3b679c0a743667ea92f0ec28757f/image.png?expires=1774894500&signature=47f51e2bca56ef5f9bea79a58f9569c81589fb842a8e65d04776f5bf72df3346&req=dSghE8p9mIBXUPMW1HO4zUYMwgeaRmclf%2BGXvvJA6%2FWhdPRUZrBvccrpnKBA%0AaIk8%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1865335189/3b679c0a743667ea92f0ec28757f/image.png?expires=1774894500&signature=47f51e2bca56ef5f9bea79a58f9569c81589fb842a8e65d04776f5bf72df3346&req=dSghE8p9mIBXUPMW1HO4zUYMwgeaRmclf%2BGXvvJA6%2FWhdPRUZrBvccrpnKBA%0AaIk8%0A)
    
4.  Now create the campaign in Klaviyo & send it to the newly created list "**Reactivation campaign**"  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811059615/bacf43d030c31b49e54b516d0e6b/image_mgx53v.png?expires=1774894500&signature=008fb72df6425b0d76e3570aeac6af335bd6e37ebf271117e4fc836b9dee9209&req=dSgmF8l7lIdeXPMW1HO4zcExZX9rL3BgMGi4uvbPNPkHP8GQOzjQYzWOjaMu%0Az00V%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811059615/bacf43d030c31b49e54b516d0e6b/image_mgx53v.png?expires=1774894500&signature=008fb72df6425b0d76e3570aeac6af335bd6e37ebf271117e4fc836b9dee9209&req=dSgmF8l7lIdeXPMW1HO4zcExZX9rL3BgMGi4uvbPNPkHP8GQOzjQYzWOjaMu%0Az00V%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811059995/7eda7be73329c380030cf98e734f/image_rwpu0z.png?expires=1774894500&signature=a7b79eab1e6f6df72f3c7e9dd3e0dd063c1a7936f8f003f42ed6ac2a4d3e6e86&req=dSgmF8l7lIhWXPMW1HO4zXOPkfhnahJa8JBs%2FcGLFnplmmPaz4ENekkTTmzO%0AAXce%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811059995/7eda7be73329c380030cf98e734f/image_rwpu0z.png?expires=1774894500&signature=a7b79eab1e6f6df72f3c7e9dd3e0dd063c1a7936f8f003f42ed6ac2a4d3e6e86&req=dSgmF8l7lIhWXPMW1HO4zXOPkfhnahJa8JBs%2FcGLFnplmmPaz4ENekkTTmzO%0AAXce%0A)
    
5.  Edit the email template & add the CTA as the campaign action key. Before going live, test it with a sample subscription to ensure it functions as expected.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811039549/4b34c9175f32f44d56c970a20363/original?expires=1774894500&signature=20c5195b9b0bd2300da3eec87f49b6afe4bb62d607cbb1c87ceb5f6a7de26ea8&req=dSgmF8l9lIRbUPMW1HO4zff33U2k1rRg%2FzK1r5rnn78CmIcJ5RrKZESiMlL%2F%0Aj7XD%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811039549/4b34c9175f32f44d56c970a20363/original?expires=1774894500&signature=20c5195b9b0bd2300da3eec87f49b6afe4bb62d607cbb1c87ceb5f6a7de26ea8&req=dSgmF8l9lIRbUPMW1HO4zff33U2k1rRg%2FzK1r5rnn78CmIcJ5RrKZESiMlL%2F%0Aj7XD%0A)
    

## Creating an upcoming order notification template

In this business case, brands want to show unique products with their quantities as line items in the upcoming order email. Additionally, they want to display the subtotal, shipping charges, discounts, and the final price. The image below illustrates the desired format.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811084419/8f12a22b3ee85fea6f3062fe02d8/original?expires=1774894500&signature=0f9da8d288de5d897811e416762384f92c0d62765f9b50ac9ecc3d140eab77f3&req=dSgmF8l2mYVeUPMW1HO4zQnIwiBrfAbdD18r1nUggR6I%2BbNd3t9HhpbhSe2B%0AkEVs%2F8mFTeXarnNLJjo%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811084419/8f12a22b3ee85fea6f3062fe02d8/original?expires=1774894500&signature=0f9da8d288de5d897811e416762384f92c0d62765f9b50ac9ecc3d140eab77f3&req=dSgmF8l2mYVeUPMW1HO4zQnIwiBrfAbdD18r1nUggR6I%2BbNd3t9HhpbhSe2B%0AkEVs%2F8mFTeXarnNLJjo%3D%0A)

Follow these steps to complete the process:

1.  Navigate to **Klaviyo** and open the upcoming order email template.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811063624/7f6755070aca9e3e363644d51b57/image_1yid46a.png?expires=1774894500&signature=dae29a98bb32f5aa824c7e21c85f4fa2d71c954679c2e27a430e83214e35c85b&req=dSgmF8l4noddXfMW1HO4zVeJBUQXOhQD0DvBTnRMRxAYi7CDb0Fd0Va7wT3A%0AWNLm%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811063624/7f6755070aca9e3e363644d51b57/image_1yid46a.png?expires=1774894500&signature=dae29a98bb32f5aa824c7e21c85f4fa2d71c954679c2e27a430e83214e35c85b&req=dSgmF8l4noddXfMW1HO4zVeJBUQXOhQD0DvBTnRMRxAYi7CDb0Fd0Va7wT3A%0AWNLm%0A)
    
2.  Open the editor, drag and drop the **HTML code block** in the template.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811063897/20739f944acfb6b590b191d1aa27/image_kga74f.png?expires=1774894500&signature=0bc3cf32dce267c3ecbe146b93a03c67dcd3e770f6f9b6e2479cf0abbc03eb9b&req=dSgmF8l4nolWXvMW1HO4zTc08KyP%2BiogI%2BaNT0w%2BtKAFbe7%2FmSdTiSk3exGq%0Am3Vx%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811063897/20739f944acfb6b590b191d1aa27/image_kga74f.png?expires=1774894500&signature=0bc3cf32dce267c3ecbe146b93a03c67dcd3e770f6f9b6e2479cf0abbc03eb9b&req=dSgmF8l4nolWXvMW1HO4zTc08KyP%2BiogI%2BaNT0w%2BtKAFbe7%2FmSdTiSk3exGq%0Am3Vx%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811064113/217140e05ecf0f71c9bf602ddd85/image_13qjked.png?expires=1774894500&signature=f3c4757bd965b5e306cac269e5a80297938f7d6999b79f0a77a2418c67b49a45&req=dSgmF8l4mYBeWvMW1HO4zYE3HXgbmVK6Bkb%2FlCQcHvKFxbH3VMse%2B25BhKJi%0Az9ht%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811064113/217140e05ecf0f71c9bf602ddd85/image_13qjked.png?expires=1774894500&signature=f3c4757bd965b5e306cac269e5a80297938f7d6999b79f0a77a2418c67b49a45&req=dSgmF8l4mYBeWvMW1HO4zYE3HXgbmVK6Bkb%2FlCQcHvKFxbH3VMse%2B25BhKJi%0Az9ht%0A)
    
3.  Add the below given HTML code in the left side editor  
    ​
    
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-family: sans-serif;">  
        
      <tbody>  
        {% for item in event.line\_items %}  
        <tr>  
          <td style="padding: 4px;width:40%;">  
            {% if item.image %}  
              <img src="{{ item.image }}" alt="{{ item.name }}" width="60%" style="display: block; border-radius: 4px;" />  
            {% else %}  
              No Image  
            {% endif %}  
          </td>  
          <td style="padding-right: 11em !important;width:100%; vertical-align: middle;">{{ item.name|default:"" }}</td>  
          <td style="padding-right:2.375em; vertical-align: middle;">X{{ item.quantity|default:"1" }}</td>  
          <td style="padding: 8px; padding-right: 1.375em; vertical-align: middle;">${{ item.discounted\_price|floatformat:2|default:"0.00" }}</td>  
        </tr>  
        {% endfor %}  
      </tbody>  
    </table>
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811065663/5b4bdfeb4e3fd4a1029a447e0a73/image_yfw8xl.png?expires=1774894500&signature=c87d749f4ff000edbe5c8b03e529741f996ea62945d3c50606611d6c168ca3f9&req=dSgmF8l4mIdZWvMW1HO4zRolBxf4nxQkZ6Sd3ciejiuPLE%2BWSWB9Ru4nR7Fg%0A0rcK%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811065663/5b4bdfeb4e3fd4a1029a447e0a73/image_yfw8xl.png?expires=1774894500&signature=c87d749f4ff000edbe5c8b03e529741f996ea62945d3c50606611d6c168ca3f9&req=dSgmF8l4mIdZWvMW1HO4zRolBxf4nxQkZ6Sd3ciejiuPLE%2BWSWB9Ru4nR7Fg%0A0rcK%0A)
    
4.  To add subtotal, shipping charges, discounts, and the final price, add 4 different **table type blocks** in a row as shown below.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811066228/8fb10c446ef2e4584af597183d64/image_rsld2u.png?expires=1774894500&signature=ceec1e01eefa6e8de2c99e24fe2c27198340d47713c8a02a2e755f69cc6eb241&req=dSgmF8l4m4NdUfMW1HO4zR9OVP9TM2GvJOrJVala0D6y89JkPfG6MAQpgiI3%0Axujr%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811066228/8fb10c446ef2e4584af597183d64/image_rsld2u.png?expires=1774894500&signature=ceec1e01eefa6e8de2c99e24fe2c27198340d47713c8a02a2e755f69cc6eb241&req=dSgmF8l4m4NdUfMW1HO4zR9OVP9TM2GvJOrJVala0D6y89JkPfG6MAQpgiI3%0Axujr%0A)
    
5.  Against each configured text, add the following text.  
    ​  
    ​**Subtotal**: {{ event|lookup:'$total\_line\_item\_base\_price'|floatformat:2|default:'' }}
    
    **Shipping**: {{ event|lookup:'$shipping\_price'|floatformat:2|default:'0' }}
    
    **Discount**: {{ event|lookup:'$total\_amount\_saved'|floatformat:2|default:'' }}
    
    **Total**: {{ event|lookup:'$total\_line\_item\_discounted\_price'|floatformat:2|default:'' }}  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811067611/758191c47261539bb5e6a3c6728b/image_y65osy.png?expires=1774894500&signature=4eecbf1efcbb7c6a85c0c6c649de05369561c9d75169aad45218e89e34aa0450&req=dSgmF8l4modeWPMW1HO4zbKn2RyvS3DhGQcgi6TyS6iV%2FxZyGGyZfMDMdBpL%0AryuW%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811067611/758191c47261539bb5e6a3c6728b/image_y65osy.png?expires=1774894500&signature=4eecbf1efcbb7c6a85c0c6c649de05369561c9d75169aad45218e89e34aa0450&req=dSgmF8l4modeWPMW1HO4zbKn2RyvS3DhGQcgi6TyS6iV%2FxZyGGyZfMDMdBpL%0AryuW%0A)
    
6.  Preview the newly created template and save.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811039567/c54938bb4b3cecff35f38691faad/original?expires=1774894500&signature=8c73924023ae1ab672d8a9afdf9c8221e6874e22d6ac428f62c938a1c83dea37&req=dSgmF8l9lIRZXvMW1HO4zRqUwpgMPbRZUHBGNNCgbHmHIicueldIi9vnNmOJ%0AipIl%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811039567/c54938bb4b3cecff35f38691faad/original?expires=1774894500&signature=8c73924023ae1ab672d8a9afdf9c8221e6874e22d6ac428f62c938a1c83dea37&req=dSgmF8l9lIRZXvMW1HO4zRqUwpgMPbRZUHBGNNCgbHmHIicueldIi9vnNmOJ%0AipIl%0A)
    

## Adding customer portal login button to email template

In this business case, the merchant wants to add a customer portal CTA in the welcome email template. The goal is for subscribers to be redirected to Loop's customer portal when they click the action button, where they can view all subscription-related details.

1.  Navigate to **Klaviyo** and open the create flow screen.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811071570/57c63e9e462e70d72acbf7f033eb/image_1tiqzp.png?expires=1774894500&signature=60cd552eb62b89402563199566e661680bcb8a18981e8f5b1e5f20b4ade3a28c&req=dSgmF8l5nIRYWfMW1HO4zYGKVl1KMRkAlCpekX%2BvoGZXCg7Q%2BgrsQ3shQuBl%0A2Inr%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811071570/57c63e9e462e70d72acbf7f033eb/image_1tiqzp.png?expires=1774894500&signature=60cd552eb62b89402563199566e661680bcb8a18981e8f5b1e5f20b4ade3a28c&req=dSgmF8l5nIRYWfMW1HO4zYGKVl1KMRkAlCpekX%2BvoGZXCg7Q%2BgrsQ3shQuBl%0A2Inr%0A)
    
2.  Define the trigger for the flow **"Loop subscription started"** and create a conditional split based on the country. (Let's say Italy in our case)  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811071803/228079b184eae89f97d5f73d10ab/image_soqgxt.png?expires=1774894500&signature=4a5d7144ec7795c1baa2a0d686e3b2b9443a13eef4089371211e08ccc1477ac1&req=dSgmF8l5nIlfWvMW1HO4zfvTmIrd6wloGUR4fC3W%2FmN67bVr%2BiurVZA1NeEr%0A9rqV%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811071803/228079b184eae89f97d5f73d10ab/image_soqgxt.png?expires=1774894500&signature=4a5d7144ec7795c1baa2a0d686e3b2b9443a13eef4089371211e08ccc1477ac1&req=dSgmF8l5nIlfWvMW1HO4zfvTmIrd6wloGUR4fC3W%2FmN67bVr%2BiurVZA1NeEr%0A9rqV%0A)
    
3.  In the email template, select the desired template or design the template to match the brand’s tone, and add a button block as shown.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811072069/76a9da483600e9471680522aa22b/image_11hmnvl.png?expires=1774894500&signature=838eb5b2ea5691ad8ccb0a7baadbde2bc708c50f7d6c65cba39c7a8000ea3df7&req=dSgmF8l5n4FZUPMW1HO4zSL9v6hed6nRJEzVz5MKY8k%2Fk%2BbzVhwRsT3d5doR%0AtJaf%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811072069/76a9da483600e9471680522aa22b/image_11hmnvl.png?expires=1774894500&signature=838eb5b2ea5691ad8ccb0a7baadbde2bc708c50f7d6c65cba39c7a8000ea3df7&req=dSgmF8l5n4FZUPMW1HO4zSL9v6hed6nRJEzVz5MKY8k%2Fk%2BbzVhwRsT3d5doR%0AtJaf%0A)
    
4.  Click on the **"Preview and test"** button.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811072364/9728bcab8643a887a1028c2455e1/image_1p83on2.png?expires=1774894500&signature=e856907f048974fc2db0be8c8dac64286fa347a5821a01f3d415be29cf72c914&req=dSgmF8l5n4JZXfMW1HO4zVg%2BoALmHfBPxCg3LYFPhtIJexKR0yERknPrE9kj%0AoYOq%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811072364/9728bcab8643a887a1028c2455e1/image_1p83on2.png?expires=1774894500&signature=e856907f048974fc2db0be8c8dac64286fa347a5821a01f3d415be29cf72c914&req=dSgmF8l5n4JZXfMW1HO4zVg%2BoALmHfBPxCg3LYFPhtIJexKR0yERknPrE9kj%0AoYOq%0A)
    
5.  Copy the **"loop\_customer\_portal\_subscription\_link"** event by clicking on it.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811072629/e40c671a3d48e708bd799708c68b/image_19zwnkq.png?expires=1774894500&signature=e0000b5bd811e3ca24d6e034ed0119636d33535feb9a7f6451a5737dd1075895&req=dSgmF8l5n4ddUPMW1HO4zZm%2Br7cty1Y4CHkHnNsxn2baiMdZOkXpyNsZsiL%2F%0Al0JI%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811072629/e40c671a3d48e708bd799708c68b/image_19zwnkq.png?expires=1774894500&signature=e0000b5bd811e3ca24d6e034ed0119636d33535feb9a7f6451a5737dd1075895&req=dSgmF8l5n4ddUPMW1HO4zZm%2Br7cty1Y4CHkHnNsxn2baiMdZOkXpyNsZsiL%2F%0Al0JI%0A)
    
6.  In the email template editor, paste the copied event ID into the button link address and **Save** the template.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811039628/c75955ac917d3117b4aa89fdebd9/original?expires=1774894500&signature=c1af6aaeda5fd884e380540f398fa6a17085b64081f656fb10ef13bef594059f&req=dSgmF8l9lIddUfMW1HO4zfYqJzrJwWSaTJpg8MUO%2FqnXx6HCy7aJi5PgriOT%0A4i%2Fy%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811039628/c75955ac917d3117b4aa89fdebd9/original?expires=1774894500&signature=c1af6aaeda5fd884e380540f398fa6a17085b64081f656fb10ef13bef594059f&req=dSgmF8l9lIddUfMW1HO4zfYqJzrJwWSaTJpg8MUO%2FqnXx6HCy7aJi5PgriOT%0A4i%2Fy%0A)
    

## Customer portal login multilingual support

In this business case, the merchant is using Klaviyo to direct customers to their customer portal. However, customers are always redirected to the English version of the portal, regardless of their language preference. The merchant needs a solution to dynamically redirect customers to the correct language version of the portal (example- English or Italian) based on the language preference.

Assuming merchants want to send the customer portal login link using the trigger **"Loop send customer portal login link",** a flow needs to be created based on a split condition. The flow will be triggered when the specified condition is met.

1.  Navigate to **Klaviyo** and open the create flow screen.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811075114/2877fdf645ad10f5f1cd4f5f86c6/image_omxr8x.png?expires=1774894500&signature=cf1a50e21008ea6d3524e70dc655d3e4e4c29e581d92748deaad3138f1c920c7&req=dSgmF8l5mIBeXfMW1HO4zXF3F%2BONsx6btWnJ3sOj3NWd9obnb4GRv0XyT%2FFC%0A6u1C%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811075114/2877fdf645ad10f5f1cd4f5f86c6/image_omxr8x.png?expires=1774894500&signature=cf1a50e21008ea6d3524e70dc655d3e4e4c29e581d92748deaad3138f1c920c7&req=dSgmF8l5mIBeXfMW1HO4zXF3F%2BONsx6btWnJ3sOj3NWd9obnb4GRv0XyT%2FFC%0A6u1C%0A)
    
2.  Define the trigger for the flow **"Loop send customer portal login link"** and create a conditional split based on the country. (Let's say Italy in our case)  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811075443/dca452c6bf2cb8a3a98028b9f058/image-11_k558h0.png?expires=1774894500&signature=adc538dce6f297c73f2d6b73828f54c578a50162d4b760caca84ccb033e66085&req=dSgmF8l5mIVbWvMW1HO4zeTjlp%2BMFYGLH8sWg9qDl3ZuSNEpqg9gE8XNaxhx%0AMm0K%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811075443/dca452c6bf2cb8a3a98028b9f058/image-11_k558h0.png?expires=1774894500&signature=adc538dce6f297c73f2d6b73828f54c578a50162d4b760caca84ccb033e66085&req=dSgmF8l5mIVbWvMW1HO4zeTjlp%2BMFYGLH8sWg9qDl3ZuSNEpqg9gE8XNaxhx%0AMm0K%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811075724/07df8ee00c778541c0f2968f9777/image-12_1pdk451.png?expires=1774894500&signature=81d0837ebf715c694dfbd9d68c87d7667149e344a29aca7594c974492b6d3dd9&req=dSgmF8l5mIZdXfMW1HO4zfzVnhK4GyyZ8FZy2c3KfZ%2FBP3vxwAGxgKatjngr%0A14m5%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1811075724/07df8ee00c778541c0f2968f9777/image-12_1pdk451.png?expires=1774894500&signature=81d0837ebf715c694dfbd9d68c87d7667149e344a29aca7594c974492b6d3dd9&req=dSgmF8l5mIZdXfMW1HO4zfzVnhK4GyyZ8FZy2c3KfZ%2FBP3vxwAGxgKatjngr%0A14m5%0A)
    
3.  For subscribers based in Italy, the merchant needs to add the following link as the button CTA to allow customers to log in.
    
    https://samplewebsite.com/it/a/loop\_subscriptions/customer/+{{ person|lookup:"$loop\_external\_customer\_id"|default:'' }}+?sessionToken={{ person|lookup:"loop\_session\_token"|default:'' }}
    
4.  For subscribers outside of Italy, where the email is in English, the merchant can add the following link as the button CTA.
    
    https://samplewebsite.com/a/loop\_subscriptions/customer/+{{ person|lookup:"$loop\_external\_customer\_id"|default:'' }}+?sessionToken={{ person|lookup:"loop\_session\_token"|default:'' }}"
    

You would have noticed that the only difference is /it/ in both the link which stand for Italy. If the brand wants to send it in any other localised language merchant can add that locale instead of /it/

# FAQs

#### I'm using $is\_prepaid in Klaviyo to separate prepaid and non-prepaid plans, but I only see the value 0. Is this expected?

You can use the $is\_prepaid trigger in Klaviyo. This property accepts only two values: true (for prepaid plans like 3-month) and false (for standard monthly plans).  
While creating flows, simply filter using this trigger.

#### Can I send multilingual emails to my customers?

Yes, you can send multilingual emails to customers via Klaviyo integration.

#### Does it matter whether the “Notify Customer” toggles under Loop > Retain > Payment Recovery are turned on or off if we’re not sending emails through Loop and are using Klaviyo instead? Will the events still be created in Klaviyo?

If the payment recovery emails are being handled through Klaviyo, the “Notify Customer” toggles in Loop do not affect Klaviyo event creation. As long as the relevant events are enabled and configured in Klaviyo, they will continue to be generated regardless of whether these toggles are turned on or off in Loop.

[Explore more FAQs](https://help.loopwork.co/en/collections/16646422-frequently-asked-questions-faqs)

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#f3808683839c8187b39f9c9c83849c8198dd909c) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Quick actions

](https://help.loopwork.co/en/articles/12713090-quick-actions)[

Customer email notifications

](https://help.loopwork.co/en/articles/12730180-customer-email-notifications)[

Klaviyo

](https://help.loopwork.co/en/articles/12733266-klaviyo)[

Popular use cases in Omnisend

](https://help.loopwork.co/en/articles/12741544-popular-use-cases-in-omnisend)[

Run campaigns via Loop

](https://help.loopwork.co/en/articles/12769114-run-campaigns-via-loop)
