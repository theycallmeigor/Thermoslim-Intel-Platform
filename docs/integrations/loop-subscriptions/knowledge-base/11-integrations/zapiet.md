---
title: "Zapiet"
source_url: "https://help.loopwork.co/en/articles/12742185-zapiet"
collection: "11-integrations"
scraped_at: "2026-03-30T17:43:16.629Z"
tags: ["11-integrations"]
---

Learn how to integrate Zapiet with Loop to offer flexible in-store pickup, local delivery scheduling, and seamless order management for subscribers.

**Zapiet** is a Shopify app that gives merchants full control over how and when customers receive their orders, whether that's in-store pickup, local delivery, or scheduled shipping.

*   Add a date-and-time picker to your store.
    
*   Set delivery zones, rates, and order limits.
    
*   Block out dates you don't ship.
    
*   Customers choose what works for them, all managed from one place.​
    

This article walks you through how Zapiet integrates with Loop, what it enables for your subscribers, and how to get it set up.  
​

**Learn more:** [Zapiet (Pickup + Delivery)](https://zapiet.com/shopify/store-pickup-delivery)  
​

Zapiet integration is available on both the Loop Starter and Pro plans.

* * *

# Integration details

## How does Zapiet work with Loop?

Merchants add Zapiet's delivery calendar on their Shopify store checkout, which displays all available delivery slots. Customers pick a date that works for them.

Once the integration is connected, Loop reads that first delivery date and auto-schedules all recurring orders based on the subscription's billing frequency.

**Example:** A customer purchases a weekly meal subscription on March 12th and picks March 25th as their first delivery date. Loop automatically schedules the next order for April 1st (March 25 + 1 week), and continues from there.  
​  
​

## Major use-cases & benefits

Zapiet is widely used by meal kit and fresh food brands where delivery scheduling is critical to their business. Here's why merchants connect Zapiet with Loop:

*   **Delivery on specific days only**: Meal brands don't ship every day. Zapiet ensures customers can only select days the merchant actually delivers, and Loop schedules all recurring orders around that.
    
*   **Respecting blackout dates**: Holidays, kitchen closures, or supply off-days can be blocked in Zapiet. Loop automatically skips those dates when the following actions are taken- charge now, pause/resume, and rescheduling.
    
*   **Flexible pickup and delivery options**: Merchants can offer customers a choice between home delivery and in-store pickup, with Loop scheduling recurring orders based on whichever option the customer chose.  
    ​
    

## How to connect Loop with Zapiet?

**Prerequisites:**

*   You have an active Zapiet - Pickup + Delivery account, installed on your Shopify store with the cart widget added to your live theme.
    
*   Required setup for delivery methods is completed in Zapiet.
    
*   In Loop, order schedule preferences is set to **Order schedule based on delivery**. You can check this by going to Loop app > Settings > Order schedule preferences > Order schedule based on delivery.
    

If the above prerequisites are met, follow these steps to complete the process:

1.  Navigate to **Loop admin > Tools & apps > Apps > Delivery management > Zapiet** and click Connect.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2155684742/ed06a8eeac8d92e192c2474bb1b6/image.png?expires=1774894500&signature=0386d487d205dba2e6f2d69f50f987a78c553413f055b0f353c6a8fceb6b7fa3&req=diEiE892mYZbW%2FMW1HO4zcjnzj8HrkFnKw53uIvFi9mCBtzPXSnFUVw5xoxR%0ALYhI%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2155684742/ed06a8eeac8d92e192c2474bb1b6/image.png?expires=1774894500&signature=0386d487d205dba2e6f2d69f50f987a78c553413f055b0f353c6a8fceb6b7fa3&req=diEiE892mYZbW%2FMW1HO4zcjnzj8HrkFnKw53uIvFi9mCBtzPXSnFUVw5xoxR%0ALYhI%0A)
    
2.  Under setup instructions, select the required configurations for the time picker and delivery rates management, then click **Connect.**  
    ​  
    Merchants can choose whether delivery and pickup rates will be managed via Zapiet or directly through Shopify.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2155689645/c696549c2fba6e023266955d2786/image.png?expires=1774894500&signature=89491f8dc146e752b384b297b496ed874e9e570c68b4256893d3d60524ccebf4&req=diEiE892lIdbXPMW1HO4zUR9ZiNGUk1oCsixBS61Dlrmj9NwRSewbPR%2BDfIN%0AdE4G%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2155689645/c696549c2fba6e023266955d2786/image.png?expires=1774894500&signature=89491f8dc146e752b384b297b496ed874e9e570c68b4256893d3d60524ccebf4&req=diEiE892lIdbXPMW1HO4zUR9ZiNGUk1oCsixBS61Dlrmj9NwRSewbPR%2BDfIN%0AdE4G%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2155691085/2b419d14897257adf070c7083c2e/image.png?expires=1774894500&signature=fac5e6d77919473854cf28d2a884156e2a3f5920ceb7084d844eead548e0c8a7&req=diEiE893nIFXXPMW1HO4zeLDa5wRH%2BxgIms%2FAjtShe7LSHLfVvHHs1kWr8O1%0AmxMP%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2155691085/2b419d14897257adf070c7083c2e/image.png?expires=1774894500&signature=fac5e6d77919473854cf28d2a884156e2a3f5920ceb7084d844eead548e0c8a7&req=diEiE893nIFXXPMW1HO4zeLDa5wRH%2BxgIms%2FAjtShe7LSHLfVvHHs1kWr8O1%0AmxMP%0A)
    
3.  Navigate to **Loop admin > Settings > Order schedule preferences** and enable Handle first delivery / Pickup date. Enter the field names for shipping date, local delivery, and pickup date, and select the correct date format.
    
      
    ​**Note:** These field names are received as order attributes via Zapiet. The default field names are pre-filled for standard Zapiet setups. If you're on a custom setup, make sure to enter the exact field names and date format in which the attributes are received.  
    ​  
    ​**Learn more:** [Order schedule based on delivery](https://help.loopwork.co/en/articles/13645961-order-schedule-preferences#h_b53273718f)  
    ​
    

## Understanding integration with an example

To understand how the integration works end to end, let's walk through an example.

###   
​Zapiet configuration

*   In this example, the merchant has enabled two checkout methods via Zapiet; local delivery and shipping.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156897099/5cdaa8bee846ce40808d2da3dc24/image.png?expires=1774894500&signature=d02c5da9f1c6dc2b3776124db01d3718f6da69a7634a61326b4f7f88b6ebdbd6&req=diEiEMF3moFWUPMW1HO4zRAi2UkDayaqD8KjTyIfVPOHDunlmb6%2FrH7j71qw%0Ab%2FMc%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156897099/5cdaa8bee846ce40808d2da3dc24/image.png?expires=1774894500&signature=d02c5da9f1c6dc2b3776124db01d3718f6da69a7634a61326b4f7f88b6ebdbd6&req=diEiEMF3moFWUPMW1HO4zRAi2UkDayaqD8KjTyIfVPOHDunlmb6%2FrH7j71qw%0Ab%2FMc%0A)
    
*   ​Under the shipping configuration, blackout dates and shipping days of the week are defined.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156898714/7ca57c6747c06bd41de3e0c84bd7/image.png?expires=1774894500&signature=9b1ea7c8069f68eeefcb204134de3ce2d01535777189616b28c9a7dabc0ebaad&req=diEiEMF3lYZeXfMW1HO4zaMYlahpCPWWpT8e%2Bz1y66yy0B7kmeRcfHN%2FdT9V%0AAlB8%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156898714/7ca57c6747c06bd41de3e0c84bd7/image.png?expires=1774894500&signature=9b1ea7c8069f68eeefcb204134de3ce2d01535777189616b28c9a7dabc0ebaad&req=diEiEMF3lYZeXfMW1HO4zaMYlahpCPWWpT8e%2Bz1y66yy0B7kmeRcfHN%2FdT9V%0AAlB8%0A)
    

### Checkout experience

*   The customer selects a product and clicks "Add subscription" to cart.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156914669/062fafeb2c2a297327abdc77e6d8/image.png?expires=1774894500&signature=6a4c13e3ccae1cae92ee11891e500d125194627b90fafa42ca6f0b9cc1aca644&req=diEiEMB%2FmYdZUPMW1HO4zZzPuNAyFH48nJ%2FQ752ROMSZVQ2eVpLeGJ2sF0RU%0Aw3k2%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156914669/062fafeb2c2a297327abdc77e6d8/image.png?expires=1774894500&signature=6a4c13e3ccae1cae92ee11891e500d125194627b90fafa42ca6f0b9cc1aca644&req=diEiEMB%2FmYdZUPMW1HO4zZzPuNAyFH48nJ%2FQ752ROMSZVQ2eVpLeGJ2sF0RU%0Aw3k2%0A)
    
*   In the cart, they select their preferred checkout method in this case, shipping and click Choose a date icon.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156915718/a24073a2aa4012f6fb097ebfb0a2/image.png?expires=1774894500&signature=cd6d367d7e922142bcfa5465edcd0742e7956c928ddf67ca75b932a310dd766f&req=diEiEMB%2FmIZeUfMW1HO4zXC4Yeel325czbNABbgx7aLk1vKuomaiYtonvv%2B2%0Arh13%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156915718/a24073a2aa4012f6fb097ebfb0a2/image.png?expires=1774894500&signature=cd6d367d7e922142bcfa5465edcd0742e7956c928ddf67ca75b932a310dd766f&req=diEiEMB%2FmIZeUfMW1HO4zXC4Yeel325czbNABbgx7aLk1vKuomaiYtonvv%2B2%0Arh13%0A)
    
*   Zapiet's calendar opens, showing only the **available dates** as per the configuration set in Zapiet. The customer selects a date and proceeds to checkout.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156915974/91a10ba426dc60788565766d65bb/image.png?expires=1774894500&signature=3b82c5a93da5b8cfc87613510bad356c1baf7c290a5cb23f41929ea94e1a33df&req=diEiEMB%2FmIhYXfMW1HO4zZ%2F%2Bch5E1ApW4%2Bj93oya2AzADpPJa1M4nX0RBJoK%0ADqGY%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156915974/91a10ba426dc60788565766d65bb/image.png?expires=1774894500&signature=3b82c5a93da5b8cfc87613510bad356c1baf7c290a5cb23f41929ea94e1a33df&req=diEiEMB%2FmIhYXfMW1HO4zZ%2F%2Bch5E1ApW4%2Bj93oya2AzADpPJa1M4nX0RBJoK%0ADqGY%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156928067/3d59be86b58d6e1bac8cc4529052/image.png?expires=1774894500&signature=2fb57159f7e480953420786d6980f62e21a4accd2ed6ca07fea9cbeb72f4192d&req=diEiEMB8lYFZXvMW1HO4zcmrM1kGyXojC%2BVfe1aTDed0aE6FelCERF7lOfce%0Acy02%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156928067/3d59be86b58d6e1bac8cc4529052/image.png?expires=1774894500&signature=2fb57159f7e480953420786d6980f62e21a4accd2ed6ca07fea9cbeb72f4192d&req=diEiEMB8lYFZXvMW1HO4zcmrM1kGyXojC%2BVfe1aTDed0aE6FelCERF7lOfce%0Acy02%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156962195/ad98022b07d5353e7f88e40370b7/image.png?expires=1774894500&signature=cfd771a7ada5aa30254c69f2cb6891750dcedcfced65a2bae0fffae27e6ecff2&req=diEiEMB4n4BWXPMW1HO4zevthHSbnB8%2FLXThHmMhJhRqihwafwB2r4znOwum%0AdKjZ%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156962195/ad98022b07d5353e7f88e40370b7/image.png?expires=1774894500&signature=cfd771a7ada5aa30254c69f2cb6891750dcedcfced65a2bae0fffae27e6ecff2&req=diEiEMB4n4BWXPMW1HO4zevthHSbnB8%2FLXThHmMhJhRqihwafwB2r4znOwum%0AdKjZ%0A)
    

###   
Loop admin and customer portal

*   Once checkout is successful, a subscription is created in Loop with the order start date matching the date the customer selected on Zapiet's calendar i.e March 26th in our example.  
    ​  
    Future order schedule is then created based on this date, respecting all blackout dates and shipping day configurations set in Zapiet.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156953714/1eaf67a728058e45e73f47335d83/image.png?expires=1774894500&signature=b22fac3aabbf609338accb167264c4540871ae2760115cadc7c59e4eb42c43e6&req=diEiEMB7noZeXfMW1HO4zaVFweFzPBVNZ2Vqcu2XgMhU%2BKc705UvpwlExlTl%0AS4tM%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156953714/1eaf67a728058e45e73f47335d83/image.png?expires=1774894500&signature=b22fac3aabbf609338accb167264c4540871ae2760115cadc7c59e4eb42c43e6&req=diEiEMB7noZeXfMW1HO4zaVFweFzPBVNZ2Vqcu2XgMhU%2BKc705UvpwlExlTl%0AS4tM%0A)
    
*   The reschedule calendar in both the Loop admin and customer portal stays in sync with the Zapiet configuration. Blackout and non-shipping dates are **automatically** disabled.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156954112/17ae0f3daf54f87985b6669b93cf/image.png?expires=1774894500&signature=5b43a6d892e6479096f8ecd5f4195d4f9fbd7a5977c24aa6e6b312638c4156c3&req=diEiEMB7mYBeW%2FMW1HO4zY4WBwLDvCsrFlhCx5N5ANAdpS%2F%2FJbJoiqXGzOYp%0A3kmF%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156954112/17ae0f3daf54f87985b6669b93cf/image.png?expires=1774894500&signature=5b43a6d892e6479096f8ecd5f4195d4f9fbd7a5977c24aa6e6b312638c4156c3&req=diEiEMB7mYBeW%2FMW1HO4zY4WBwLDvCsrFlhCx5N5ANAdpS%2F%2FJbJoiqXGzOYp%0A3kmF%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156954448/82e8ca6c9bcf843b2aa31fefc3b1/image.png?expires=1774894500&signature=2e40e79699df9e011bc3f363ad67a87c60a98b1766ae0e9201acb21e1e1b6680&req=diEiEMB7mYVbUfMW1HO4zf%2BRGhKJlsFU3fwGaNtuMYAppHTZ5kkRADaiW3eC%0AjKrh%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156954448/82e8ca6c9bcf843b2aa31fefc3b1/image.png?expires=1774894500&signature=2e40e79699df9e011bc3f363ad67a87c60a98b1766ae0e9201acb21e1e1b6680&req=diEiEMB7mYVbUfMW1HO4zf%2BRGhKJlsFU3fwGaNtuMYAppHTZ5kkRADaiW3eC%0AjKrh%0A)
    

## **Considerations**

1.  If any merchant has enabled anchor day on a particular selling plan, then the anchor day would be given priority over the Zapiet calendar.
    
2.  If the zapiet configurations are changed, the order schedule for existing subscriptions is not updated as per the new configurations. For eg. if a blackout date is added, this setting will not get updated for existing subscribers but the future order schedule for new subscriptions will get created as per the new configurations.
    
3.  If delivery and pickup rates are being managed via Zapiet, the **Change pickup** **location** and **Change delivery** **method** preferences will be disabled in Loop.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156971911/46e260e3a4d2a1de426ef6d8166e/image.png?expires=1774894500&signature=2f926c140ac2aa75d3cdd5f83181aa02f9d56c850686f1f6c23dbe8c7219f647&req=diEiEMB5nIheWPMW1HO4zWGwsx5O1ZcSqdHfwJeWO%2FLAoIq1s6c2CagSzjbn%0AtmaV%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2156971911/46e260e3a4d2a1de426ef6d8166e/image.png?expires=1774894500&signature=2f926c140ac2aa75d3cdd5f83181aa02f9d56c850686f1f6c23dbe8c7219f647&req=diEiEMB5nIheWPMW1HO4zWGwsx5O1ZcSqdHfwJeWO%2FLAoIq1s6c2CagSzjbn%0AtmaV%0A)
    

# FAQs

#### How can merchants let customers choose their own delivery dates while still billing every 6 months?

In Loop, set the subscription to renew every 6 months by going to Loop > Acquire > Selling Plan. Loop does not allow customers to pick custom delivery dates within the billing period, so deliveries follow the set renewal frequency. To offer scheduling flexibility, integrate Zapiet with Loop. Zapiet manages delivery dates chosen by customers at checkout, while Loop handles the 6-month billing cycle.

[Explore more FAQs](https://help.loopwork.co/en/collections/16646422-frequently-asked-questions-faqs)

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#a3d0d6d3d3ccd1d7e3cfccccd3d4ccd1c88dc0cc) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Gift instead of skip

](https://help.loopwork.co/en/articles/12714027-gift-instead-of-skip)[

Place upcoming order

](https://help.loopwork.co/en/articles/12714032-place-upcoming-order)[

Reschedule an upcoming order

](https://help.loopwork.co/en/articles/12714037-reschedule-an-upcoming-order)[

Settings FAQs

](https://help.loopwork.co/en/articles/12858166-settings-faqs)[

Order schedule preferences

](https://help.loopwork.co/en/articles/13645961-order-schedule-preferences)
