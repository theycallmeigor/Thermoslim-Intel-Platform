---
title: "Omnisend"
source_url: "https://help.loopwork.co/en/articles/12741473-omnisend"
collection: "11-integrations"
scraped_at: "2026-03-30T17:43:16.670Z"
tags: ["11-integrations"]
---

Learn how to integrate omnisend with Loop to automate personalized, multichannel subscription communications and boost engagement, retention, and revenue.

**Omnisend** is a powerful third-party app that Loop directly integrates with, allowing you to take your customer notifications to the next level. This articles details the Omnisend integration’s with Loop and how you can leverage the same for your subscriptions.  
​  
​**Learn more:** [Omnisend](https://www.omnisend.com/)

### Key features

*   **Personalization**: Omnisend allows you to create personalized messages for your customers based on their shopping behavior and preferences, which can help increase engagement and conversions.
    
*   **Automation**: With Omnisend, you can automate your email and SMS campaigns, saving you time and ensuring that your customers receive timely and relevant messages.
    
*   **Multichannel communication**: Omnisend allows you to reach your customers through multiple channels, including email, SMS, and social media, which can help increase the chances of them seeing and responding to your messages.
    
*   **Win-back campaigns**: Omnisend’s win-back campaigns can help you win back customers who have canceled their subscriptions or stopped purchasing from your store.
    
*   **Payment updates**: With Omnisend, you can automatically send messages to customers who need to update their payment information, which can help reduce failed transactions and increase customer satisfaction.  
    ​
    

Omnisend integration is available on the Loop Starter and Pro plans.

* * *

# Integration details

## How does Omnisend work with Loop?

Omnisend integrates with Loop subscriptions to automate targeted email campaigns for subscription-based businesses. By syncing customer data and subscription events between Omnisend and Loop, merchants can create personalized email campaigns, automate communications, and boost engagement with subscribers. We will cover the integration process and key use cases to optimize your email marketing strategy.

## Major use-cases & benefits

**Use case**

**Description**

**Benefit**

**Creating Lists/Segments**

Use Omnisend to segment subscribers based on their subscription behavior and preferences.

Allows for targeted campaigns, improving engagement and conversion.

**Flows automation**

Use Omnisend flows to automate subscriber engagement based on subscription events.

Automates personalized communication, improving retention and boosting sales.

## How to connect Loop with Omnisend?

**Prerequisites:**

You should have an active Omnisend account. If not, please create from [here](https://www.omnisend.com/)

If the above prerequisites are met, follow these steps to complete the process.

1.  Navigate to Omnisend account > Store settings > API > Click on the "**Create API Key**" button.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812084163/86f8d917d44105beb3a5f820505e/image_3sguzm.png?expires=1774894500&signature=a8863b1be1d6a647b2589b5cce90ef243a9d954725196b039b3f1536b76f5562&req=dSgmFMl2mYBZWvMW1HO4zcSDoU7TxpXkGuOlOj9lCIDbV1fuEV%2FOOLbNNHOm%0AYDsV%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812084163/86f8d917d44105beb3a5f820505e/image_3sguzm.png?expires=1774894500&signature=a8863b1be1d6a647b2589b5cce90ef243a9d954725196b039b3f1536b76f5562&req=dSgmFMl2mYBZWvMW1HO4zcSDoU7TxpXkGuOlOj9lCIDbV1fuEV%2FOOLbNNHOm%0AYDsV%0A)
    
2.  Enter any name for reference, for example, ‘**Loop Integration’**. Opt-in permission for **‘Contacts’** and **‘Events’** and click on Save.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812084487/885b779ca0a66255b449f4f25b9d/image_fjg6cd.png?expires=1774894500&signature=c42a0e4981ff0e26fb8fb3dbfa2398d9e456d6f2fca01e8400b89cf0cb510c4f&req=dSgmFMl2mYVXXvMW1HO4zf6MeU%2FvjYCYED06r6lBPoeSn6A56wG2fWR9t82o%0AO%2BWr%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812084487/885b779ca0a66255b449f4f25b9d/image_fjg6cd.png?expires=1774894500&signature=c42a0e4981ff0e26fb8fb3dbfa2398d9e456d6f2fca01e8400b89cf0cb510c4f&req=dSgmFMl2mYVXXvMW1HO4zf6MeU%2FvjYCYED06r6lBPoeSn6A56wG2fWR9t82o%0AO%2BWr%0A)
    
3.  Copy the generated API key and head back to the Loop app.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812084935/2bbdcc16bbc5495f42181e167c97/image_zdfbc9.png?expires=1774894500&signature=33936d0ff8d208d8d0f30a1c4179411cf9fcab9f4b4b625c06ada3a658fd2f0a&req=dSgmFMl2mYhcXPMW1HO4zcfmJuYbY4JV%2F3BqPxscaduiuO7dZ4Mf51ASasae%0AFIfM%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812084935/2bbdcc16bbc5495f42181e167c97/image_zdfbc9.png?expires=1774894500&signature=33936d0ff8d208d8d0f30a1c4179411cf9fcab9f4b4b625c06ada3a658fd2f0a&req=dSgmFMl2mYhcXPMW1HO4zcfmJuYbY4JV%2F3BqPxscaduiuO7dZ4Mf51ASasae%0AFIfM%0A)
    
4.  Navigate to **Loop admin > Tools & apps > Apps > Omnisend** and click on **Connect**.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812085239/7a66f4e0123a7d5e40036f534f37/image_1luqccl.png?expires=1774894500&signature=3246e1ae4a074eae92374ffd086684b4cbecb4660ec7e3e9aa72efe757a8b1d5&req=dSgmFMl2mINcUPMW1HO4zXPh4W%2Fx3aijR8M4A6Zufr%2F0KXnETE7%2B2sl%2BkevV%0Auf2V%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812085239/7a66f4e0123a7d5e40036f534f37/image_1luqccl.png?expires=1774894500&signature=3246e1ae4a074eae92374ffd086684b4cbecb4660ec7e3e9aa72efe757a8b1d5&req=dSgmFMl2mINcUPMW1HO4zXPh4W%2Fx3aijR8M4A6Zufr%2F0KXnETE7%2B2sl%2BkevV%0Auf2V%0A)
    
5.  Under the **Set up Instructions** tab, paste the generated API key and click **Connect**  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812085491/413793586865ad6fbe93ef556daf/image_iokws4.png?expires=1774894500&signature=52c33a6f1ec86fd7881500254932862b33958e3827efdc9ed8c32d47a91ce36e&req=dSgmFMl2mIVWWPMW1HO4zQ6b3K%2FwShxAISIcNo3def%2BwoA6W6o34pAjtVyDK%0AmgEu%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812085491/413793586865ad6fbe93ef556daf/image_iokws4.png?expires=1774894500&signature=52c33a6f1ec86fd7881500254932862b33958e3827efdc9ed8c32d47a91ce36e&req=dSgmFMl2mIVWWPMW1HO4zQ6b3K%2FwShxAISIcNo3def%2BwoA6W6o34pAjtVyDK%0AmgEu%0A)
    
6.  After the successful connection, the integration status will now be showing as "**Connected**".  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812085859/0db2ce12f19bc3a2e06bacff24cc/image_1sa9oa8.png?expires=1774894500&signature=1d21bbda9b494197c9a6a877b1d5ec863db55b0676e00be252a70193f951ca44&req=dSgmFMl2mIlaUPMW1HO4zXZvbrd32ygWHwWm5P8KlqF9PF9GK9Wg%2B%2B4DTWCn%0AzO1I%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812085859/0db2ce12f19bc3a2e06bacff24cc/image_1sa9oa8.png?expires=1774894500&signature=1d21bbda9b494197c9a6a877b1d5ec863db55b0676e00be252a70193f951ca44&req=dSgmFMl2mIlaUPMW1HO4zXZvbrd32ygWHwWm5P8KlqF9PF9GK9Wg%2B%2B4DTWCn%0AzO1I%0A)
    
7.  In Loop's integration section for Omnisend, we offer a streamlined approach to get started with sample events. You can click **Trigger sample events** to test the events triggered, examine the payload sent, and create flows, segments, and more.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812075044/f83906b39df9e2f1094b63d55241/original?expires=1774894500&signature=2618a9c51279989bcd231d40ca2e4daaa789069aa9359ab523dbdd5bab428934&req=dSgmFMl5mIFbXfMW1HO4zX3oShtdNIs3SSXObQVOEf08ybPhBGA50sAR2BPW%0Ab7y6%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812075044/f83906b39df9e2f1094b63d55241/original?expires=1774894500&signature=2618a9c51279989bcd231d40ca2e4daaa789069aa9359ab523dbdd5bab428934&req=dSgmFMl5mIFbXfMW1HO4zX3oShtdNIs3SSXObQVOEf08ybPhBGA50sAR2BPW%0Ab7y6%0A)
    

Sample events triggered in Omnisend can be viewed under the "**Custom events**" tab

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812092095/72b349cc5d929b37a45ac1d655bd/original?expires=1774894500&signature=9c63de3756927c08a5eb9eb4695e9f42975118a1b78f8e5eb2f215ef2536413f&req=dSgmFMl3n4FWXPMW1HO4zfLpimcUrj8IfSOqIUDM%2FJn9glP0%2B2QLxvR%2BntyS%0A9RYH%2BPPTDXgDxX1nRxs%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812092095/72b349cc5d929b37a45ac1d655bd/original?expires=1774894500&signature=9c63de3756927c08a5eb9eb4695e9f42975118a1b78f8e5eb2f215ef2536413f&req=dSgmFMl3n4FWXPMW1HO4zfLpimcUrj8IfSOqIUDM%2FJn9glP0%2B2QLxvR%2BntyS%0A9RYH%2BPPTDXgDxX1nRxs%3D%0A)

## Loop's data synced with Omnisend

**Events triggered:** Loop subscription events, which are synced with Omnisend and can be used to trigger Omnisend email flows.

**Trigger**

**Explanation**

Loop order processed

An order under the subscription is processed.

Loop order upcoming

An upcoming order is scheduled under the subscription.

Loop payment failed

A payment attempt for the subscription failed.

Loop customer activation

A customer account associated with the subscription is activated.

Loop subscription created

A new subscription has been started.

Loop subscription paused

The subscription is temporarily paused.

Loop subscription resumed

The paused subscription is resumed.

Loop subscription expired

The subscription has reached its end date and is not renewed.

Loop payment attempt failed and will be retried

A payment attempt failed but will be retried.

Loop payment attempt failed with last retry

The final attempt is left for a payment that failed.

Loop order skipped

An order under the subscription is skipped.

Loop subscription cancelled

The subscription is cancelled.

Loop subscription reactivated

A cancelled subscription is reactivated.

Loop order items out of stock

Product in the order is out of stock.

Loop payment method expiring soon

The payment method saved is about to expire.

Loop order partially processed

An order under the subscription is partially processed.

Loop flow completed

A specific flow in the Loop is completed.

Loop send customer login link

A customer has requested for customer portal login link.

Loop order unskipped

An order under the subscription is unskipped.

Loop subscription rescheduled

The subscription has been rescheduled.

Loop subscription delayed

The subscription is delayed.

Loop subscription marked for cancellation

A prepaid subscription is marked for cancellation.

Loop gift subscription created

A new gift subscription has been started.

Loop gift subscription received

A new gift subscription has been received.

Loop gift subscription completed

A new gift subscription has been completed.

Loop gift subscription thanks sent to gifter

Loop gift subscription thanks has been sent to gifter.

Loop gift subscription upcoming order

An upcoming order is scheduled under the gift subscription.

**Custom properties:** Loop updates the subscription-related properties dynamically for Omnisend profiles, which can be used for customer segmentation and filtering.

To view custom properties, you can navigate to Omnisend account > Audience > Contacts > Open any user profile

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812092101/b669b942a0e861fed270e69184f4/original?expires=1774894500&signature=493e8ac031c4e4a6f89f37ac798d9a85bbfd0b6f9ab71554d24b8e4ee20ecb54&req=dSgmFMl3n4BfWPMW1HO4zWSI0XYQ%2BnSFViOIOCOE%2BOKWx8FRfRjGKdIZfkij%0ASaAPtWoqD1kJ0ULzCDQ%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812092101/b669b942a0e861fed270e69184f4/original?expires=1774894500&signature=493e8ac031c4e4a6f89f37ac798d9a85bbfd0b6f9ab71554d24b8e4ee20ecb54&req=dSgmFMl3n4BfWPMW1HO4zWSI0XYQ%2BnSFViOIOCOE%2BOKWx8FRfRjGKdIZfkij%0ASaAPtWoqD1kJ0ULzCDQ%3D%0A)

## Integration statistics

Once the Omnisend account is successfully connected, you can view integration statistics, including details of Loop events synced during a specific period and any errors that may have occurred.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812092094/086104bed1e2b44e3af289423058/original?expires=1774894500&signature=98c7228ceaa8d039ec2c6299b1d09270d3fda5f80b99c74fe7c919f50a485eb7&req=dSgmFMl3n4FWXfMW1HO4zX7YKv5hecf%2FACwdsDZnCOrw72smCN2PgmHFx5wI%0AKAibXQuJZTFYqi885Ok%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812092094/086104bed1e2b44e3af289423058/original?expires=1774894500&signature=98c7228ceaa8d039ec2c6299b1d09270d3fda5f80b99c74fe7c919f50a485eb7&req=dSgmFMl3n4FWXfMW1HO4zX7YKv5hecf%2FACwdsDZnCOrw72smCN2PgmHFx5wI%0AKAibXQuJZTFYqi885Ok%3D%0A)

Each Loop event sent to Omnisend is listed here. You can view the sample payload for any specific event by clicking the "View" button.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812092092/3be4116e0bf239f8a1dd22233de6/original?expires=1774894500&signature=5088d0aed6b426a8e179c97251fe955f5ec4cdf3939f907fa3e4bec48790eeb8&req=dSgmFMl3n4FWW%2FMW1HO4zf%2BrsG%2BpGW6nxRAk%2B%2BVfjtCgAmCk4Ad5y8RuytS0%0AFsKruOuKX63axMw4tsk%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812092092/3be4116e0bf239f8a1dd22233de6/original?expires=1774894500&signature=5088d0aed6b426a8e179c97251fe955f5ec4cdf3939f907fa3e4bec48790eeb8&req=dSgmFMl3n4FWW%2FMW1HO4zf%2BrsG%2BpGW6nxRAk%2B%2BVfjtCgAmCk4Ad5y8RuytS0%0AFsKruOuKX63axMw4tsk%3D%0A)

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812092103/78e32e886d4777e0ba96e0d71645/original?expires=1774894500&signature=7edb5537cb265e35645a25ba0a35b8ac0775e5b5a844ea6cbc64331d8a648462&req=dSgmFMl3n4BfWvMW1HO4zVXht1ZdqSsWI%2Fz68SVkY45oYkXzglHdetscbtnJ%0ADvhO82Pd6VPWCxCOXvI%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812092103/78e32e886d4777e0ba96e0d71645/original?expires=1774894500&signature=7edb5537cb265e35645a25ba0a35b8ac0775e5b5a844ea6cbc64331d8a648462&req=dSgmFMl3n4BfWvMW1HO4zVXht1ZdqSsWI%2Fz68SVkY45oYkXzglHdetscbtnJ%0ADvhO82Pd6VPWCxCOXvI%3D%0A)

  
​

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#61121411110e1315210d0e0e11160e130a4f020e) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Flows

](https://help.loopwork.co/en/articles/12708285-flows)[

Klaviyo

](https://help.loopwork.co/en/articles/12733266-klaviyo)[

Attentive

](https://help.loopwork.co/en/articles/12741439-attentive)[

Popular use cases in Omnisend

](https://help.loopwork.co/en/articles/12741544-popular-use-cases-in-omnisend)[

Sendlane

](https://help.loopwork.co/en/articles/12741759-sendlane)
