---
title: "Bloomreach"
source_url: "https://help.loopwork.co/en/articles/12741808-bloomreach"
collection: "11-integrations"
scraped_at: "2026-03-30T17:43:18.858Z"
tags: ["11-integrations"]
---

Learn how to integrate Bloomreach with Loop to deliver AI-powered, personalized marketing experiences and optimize subscriber engagement across all channels.

Bloomreach is a leading digital experience platform that combines content management, commerce, and marketing automation to drive personalized customer journeys. It enables businesses to optimize their digital presence through data-driven insights, AI-powered personalization, and seamless customer interactions across all touch points.

### Key features

*   **AI-Driven personalization** - Provides tailored experiences to customers using machine learning and data analytics.
    
*   **Commerce experience cloud -** Integrates content and commerce to streamline the customer journey.
    
*   **Omnichannel marketing -** Offers tools to deliver consistent messaging across email, social media, and more.
    
*   **Advanced analytics -** Gives deep insights into customer behavior and campaign performance, optimizing engagement strategies.  
    ​
    

Bloomreach integration is available exclusively on the Loop Pro plan.

* * *

# How to integrate Bloomreach with Loop?

## Generating API token, project token and API base url within Bloomreach app

1.  Head over to your Bloomreach account and open the Project Settings.  
    ​
    
    [![Project settings](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812202483/fb485ccf3aad5e34c6ea52868533/image_1di6x0y.png?expires=1774894500&signature=2776180ae1d4756d535a771962e75a30affc454b4ad6c06d5df417072dd1e8dc&req=dSgmFMt%2Bn4VXWvMW1HO4zUnO4TfmbAMdfguqQhfDe%2BmTaY2%2FsOxTBEVn6mxr%0A0Ibv%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812202483/fb485ccf3aad5e34c6ea52868533/image_1di6x0y.png?expires=1774894500&signature=2776180ae1d4756d535a771962e75a30affc454b4ad6c06d5df417072dd1e8dc&req=dSgmFMt%2Bn4VXWvMW1HO4zUnO4TfmbAMdfguqQhfDe%2BmTaY2%2FsOxTBEVn6mxr%0A0Ibv%0A)
    
2.  Under Access management > open the API tab and click on create new API group.  
    ​
    
    [![Create API group](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812202644/876594a8343ac9f1a81500f6a4d1/image_1lue3dl.png?expires=1774894500&signature=b485e308e1020dc3b1858307fb2959adb6c309e24f2cf4a606f054dfc4438e0a&req=dSgmFMt%2Bn4dbXfMW1HO4zTVoTbZhVes7J9wBJmBAt4R1RVTpdTy9rM%2B0K8j%2B%0AgYHK%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812202644/876594a8343ac9f1a81500f6a4d1/image_1lue3dl.png?expires=1774894500&signature=b485e308e1020dc3b1858307fb2959adb6c309e24f2cf4a606f054dfc4438e0a&req=dSgmFMt%2Bn4dbXfMW1HO4zTVoTbZhVes7J9wBJmBAt4R1RVTpdTy9rM%2B0K8j%2B%0AgYHK%0A)
    
3.  Select the access type as 'Public' and enter the group name. (For reference - '**Loop subscriptions**')  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812203165/2ad446dc3ac554495021b473d6b4/image_xcojpa.png?expires=1774894500&signature=935ed9d517c551097dc8a30c8bf131616ef4818d5e3a4de0b8526c612ba05c85&req=dSgmFMt%2BnoBZXPMW1HO4zWhyY7p6IgH7Bfw%2BAh4wvfq46cZSgfJEWLyE8F%2BK%0Aga2p%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812203165/2ad446dc3ac554495021b473d6b4/image_xcojpa.png?expires=1774894500&signature=935ed9d517c551097dc8a30c8bf131616ef4818d5e3a4de0b8526c612ba05c85&req=dSgmFMt%2BnoBZXPMW1HO4zWhyY7p6IgH7Bfw%2BAh4wvfq46cZSgfJEWLyE8F%2BK%0Aga2p%0A)
    
4.  Under Group Permissions, enable all permissions for Customer Properties and Events.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812203516/2ec24134310b1854b64ec4526d4b/image_xm6x9t.png?expires=1774894500&signature=260bc842c106990777179ddd83673e70289470a87a326fff28a6ee97e5cc7ce3&req=dSgmFMt%2BnoReX%2FMW1HO4zdSP8AJxC2yE0A8TWtY8mIgDrovZZYajP9iaGJB4%0AswJt%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812203516/2ec24134310b1854b64ec4526d4b/image_xm6x9t.png?expires=1774894500&signature=260bc842c106990777179ddd83673e70289470a87a326fff28a6ee97e5cc7ce3&req=dSgmFMt%2BnoReX%2FMW1HO4zdSP8AJxC2yE0A8TWtY8mIgDrovZZYajP9iaGJB4%0AswJt%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812203726/717314bc6cf7fd3e5061f5fadfc4/image_6px5i3.png?expires=1774894500&signature=666324db2aa7e09348b0a17d148e03a307fe572aa7818ba86b305c95a69fda05&req=dSgmFMt%2BnoZdX%2FMW1HO4zYwy3EKlFqBg%2B%2BIJfDriLWoVu0fWnfdL6pnO1cDi%0AsomH%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812203726/717314bc6cf7fd3e5061f5fadfc4/image_6px5i3.png?expires=1774894500&signature=666324db2aa7e09348b0a17d148e03a307fe572aa7818ba86b305c95a69fda05&req=dSgmFMt%2BnoZdX%2FMW1HO4zYwy3EKlFqBg%2B%2BIJfDriLWoVu0fWnfdL6pnO1cDi%0AsomH%0A)
    
5.  Copy the API token, Project token and API Base URL  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812202056/b2113a133e169d442500a9931451/original?expires=1774894500&signature=278670eca990ff697e70f1fa979cee82b361b682039d9d089df0f4ba69697475&req=dSgmFMt%2Bn4FaX%2FMW1HO4zT8AzU7yHyZI1fTvPOde%2FWKsbCqCNs2K6RctRbZp%0AT0Tr%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812202056/b2113a133e169d442500a9931451/original?expires=1774894500&signature=278670eca990ff697e70f1fa979cee82b361b682039d9d089df0f4ba69697475&req=dSgmFMt%2Bn4FaX%2FMW1HO4zT8AzU7yHyZI1fTvPOde%2FWKsbCqCNs2K6RctRbZp%0AT0Tr%0A)
    

## Connecting bloomreach app with Loop

1.  Navigate to **Loop > Integrations > Bloomreach** and select **Connect**.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812205362/3cad2ef79d7cc731c11d8c8d3fdf/image_193ccyk.png?expires=1774894500&signature=a00d1cf761465998181726490e9a8e2a1ea7aaf14734a6030cff6ce1f46d24c6&req=dSgmFMt%2BmIJZW%2FMW1HO4zWm%2BRLECjdtY8OAb5RStQbBTlWPuYid0fWy3LBoB%0AW%2FRU%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812205362/3cad2ef79d7cc731c11d8c8d3fdf/image_193ccyk.png?expires=1774894500&signature=a00d1cf761465998181726490e9a8e2a1ea7aaf14734a6030cff6ce1f46d24c6&req=dSgmFMt%2BmIJZW%2FMW1HO4zWm%2BRLECjdtY8OAb5RStQbBTlWPuYid0fWy3LBoB%0AW%2FRU%0A)
    
2.  Under the **Set-Up Instructions** tab, paste the **API token**, **Project token** and **API Base URL** and click on connect.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812205789/2ed122d5ea8c7c78f94517298626/image_157iujw.png?expires=1774894500&signature=5841483eda70e24ecfcfa69c000d4d5805d261957ccf66288272be3334cab62d&req=dSgmFMt%2BmIZXUPMW1HO4zUtdJhqdVDtdUELu7o2IB1mKlvf%2BHEEMtOaSb90W%0A%2B78m%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812205789/2ed122d5ea8c7c78f94517298626/image_157iujw.png?expires=1774894500&signature=5841483eda70e24ecfcfa69c000d4d5805d261957ccf66288272be3334cab62d&req=dSgmFMt%2BmIZXUPMW1HO4zUtdJhqdVDtdUELu7o2IB1mKlvf%2BHEEMtOaSb90W%0A%2B78m%0A)
    
3.  **Optional step** - Click on '**Trigger Sample events**' to see all the events.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812194134/74c54075e9ee941b4a63cc5d08ae/original?expires=1774894500&signature=f10cf0be6d32849108d24f6d9858ce9bd0f1415d01798d4bc92ea7946da11b69&req=dSgmFMh3mYBcXfMW1HO4zVqtdoY9WUzbNbQMxr9K2QTaj1L%2BL2MPVJW3nyd5%0AK7su%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812194134/74c54075e9ee941b4a63cc5d08ae/original?expires=1774894500&signature=f10cf0be6d32849108d24f6d9858ce9bd0f1415d01798d4bc92ea7946da11b69&req=dSgmFMh3mYBcXfMW1HO4zVqtdoY9WUzbNbQMxr9K2QTaj1L%2BL2MPVJW3nyd5%0AK7su%0A)
    

# Loop's data synced with Bloomreach

**Events Triggered:** Loop Subscription events which are synced with Bloomreach and can be used to trigger Bloomreach email flows.

**Trigger**

**Explanation**

loop\_subscription\_created

A new subscription has been created.

loop\_subscription\_paused

The subscription is temporarily paused.

loop\_subscription\_resumed

The paused subscription is resumed.

loop\_subscription\_cancelled

The subscription is cancelled.

loop\_subscription\_delayed

The subscription is delayed.

loop\_subscription\_reactivated

A cancelled subscription is reactivated.

loop\_subscription\_expired

The subscription has reached its end date and is not renewed.

loop\_subscription\_rescheduled

The subscription has been rescheduled.

loop\_subscription\_marked\_for\_cancellation

A prepaid subscription is marked for cancellation.

loop\_order\_upcoming

An upcoming order is scheduled under the subscription.

loop\_order\_skipped

An order under the subscription is skipped.

loop\_order\_unskipped

An order under the subscription is unskipped.

loop\_order\_processed

An order under the subscription is processed.

loop\_order\_partially\_processed

An order under the subscription is partially processed.

loop\_payment\_attempt\_failed\_retry

A payment attempt failed but will be retried.

loop\_payment\_attempt\_failed\_last\_retry

The final attempt is left for a payment failed.

loop\_payment\_attempt\_failed

A payment attempt for the subscription failed.

loop\_customer\_activation

A customer account associated with the subscription is activated.

loop\_flow\_completed

A specific flow in the Loop is completed.

loop\_send\_customer\_login\_link

A customer has requested for customer portal login link

gift\_subscription\_created

Sent to the gifter when they purchase a gift

gift\_subscription\_thanks\_message

Sent to the gifter with thanks message written by the recipient

gift\_subscription\_received

Sent to the recipient when they receive a gift from someone

gift\_subscription\_upcoming\_order

Sent to the recipient when their recurring gift order is about to be placed

gift\_subscription\_completed

Sent to the recipient after a certain time when all the orders as part of gift are delivered

**Custom Properties:** Loop updates the subscription-related properties dynamically for Bloomreach profiles which can be used for customer segmentation and filtering.

**Trigger**

**Explanation**

$loop\_active\_subscriber

Indicates if the customer is currently an active subscriber.

$loop\_active\_subscription\_count

Shows the total count of active subscriptions the customer has.

$loop\_cancelled\_subscription\_count

Number of subscriptions the customer has cancelled.

$loop\_customer\_id

Unique identifier for the customer in Loop.

$loop\_expired\_subscription\_count

Counts the customer's subscriptions that have expired.

$loop\_external\_customer\_id

An external identifier used for the customer, if applicable.

$loop\_next\_billing\_date

The date when the customer will be billed next for their subscription.

$loop\_next\_billing\_date\_display

A formatted version of the next billing date for display purposes.

$loop\_paused\_subscription\_count

The number of subscriptions the customer has currently paused.

$loop\_subscribed\_variant\_shopify\_ids

Shopify IDs of the variants the customer is subscribed to.

loop\_customer\_portal\_link

A direct link to the customer portal.

loop\_session\_token

A session token for the customer's current subscription session.

$loop\_subscription\_revenue

Total revenue generated from the customer's subscriptions.

$loop\_processed\_order\_count

Number of subscription orders that have been successfully processed for the customer.

$loop\_subscribed\_line\_item\_names

List of product names the customer is subscribed to.

# Integration statistics

Once the Bloomreach account is successfully connected, you can view integration statistics, including details of Loop events synced during a specific period and any errors that may have occurred.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812209007/917b0feba59ba3d760cf3a939cb1/original?expires=1774894500&signature=bf236a9bc4d3b02e4af3dd948899c98ddfb0d5eac127ee22d9e593b36de51b96&req=dSgmFMt%2BlIFfXvMW1HO4zVwB%2BjF2ib%2FwSY3gIhSxtbuQJUB5fs8FZExRxvrf%0Aqbd0CnXU3ttGj%2B9x8Lg%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812209007/917b0feba59ba3d760cf3a939cb1/original?expires=1774894500&signature=bf236a9bc4d3b02e4af3dd948899c98ddfb0d5eac127ee22d9e593b36de51b96&req=dSgmFMt%2BlIFfXvMW1HO4zVwB%2BjF2ib%2FwSY3gIhSxtbuQJUB5fs8FZExRxvrf%0Aqbd0CnXU3ttGj%2B9x8Lg%3D%0A)

  
​

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#e4979194948b9690a4888b8b94938b968fca878b) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Gift subscription set up guide

](https://help.loopwork.co/en/articles/12730623-gift-subscription-set-up-guide)[

Gift subscription notifications

](https://help.loopwork.co/en/articles/12731494-gift-subscription-notifications)[

Klaviyo

](https://help.loopwork.co/en/articles/12733266-klaviyo)[

Omnisend

](https://help.loopwork.co/en/articles/12741473-omnisend)[

Sendlane

](https://help.loopwork.co/en/articles/12741759-sendlane)
