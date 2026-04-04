---
title: "Sendlane"
source_url: "https://help.loopwork.co/en/articles/12741759-sendlane"
collection: "11-integrations"
scraped_at: "2026-03-30T17:43:17.964Z"
tags: ["11-integrations"]
---

Learn how to integrate Sendlane with Loop to automate personalized email and SMS campaigns using subscription data for engagement and retention.

**Sendlane** offers a unified email and SMS marketing platform tailored for eCommerce businesses. With features like multi-channel automation, data-driven marketing, and hyper-targeted messaging, Sendlane empowers brands to create optimized customer experiences. By integrating Loop subscriptions with Sendlane, you can set up automations to send Emails/SMS messages to your subscribers to manage their subscriptions and run reactivation campaigns based on the subscription.

### Key features

*   **Pool data from subscription events** generated in Loop and trigger transactional email and SMS flows based on events like subscription purchased, upcoming order, payment failed, order skipped, etc.
    
*   **Create personalized emails and SMS messages** using pre-designed templates with drag & drop design tools
    
*   **Measure opens, clicks**, revenue generated, breakdown of generated revenue based on custom attributes, and provides trend reports, cohort analysis, and subscriber growth.
    

In this article, you'll learn how to integrate Sendlane with Loop subscriptions. Once you've connected your Sendlane account, you'll be able to send Loop subscription events on Sendlane and trigger custom Email/SMS flows and campaigns.  
​

Sendlane integration is available on both the Loop Starter and Pro plans.

* * *

# How to integrate Sendlane with Loop?

**Prerequisites:**

Before starting the integration process, we need to make sure these things are in place.

*   You have an active Sendlane account. If not, please create from [here](https://www.sendlane.com/)
    
*   Merchants should be on Loop’s Starter plan or above.
    

If the above prerequisites are met, follow these steps to complete the process.

1.  Navigate to **Loop > Tools & apps > Apps > Sendlane** and click on **Connect**.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812175402/1d94875b358a0a00db5783f82dce/image_ns3adx.png?expires=1774894500&signature=9b03973d602089a4b45863b6535ad9f2d967d6e78e584218584caf9db3eeb6cf&req=dSgmFMh5mIVfW%2FMW1HO4zRAaJLwUekIUibJYY4yZOlwNlcNhz6rX3UfXwiZD%0Am5zw%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812175402/1d94875b358a0a00db5783f82dce/image_ns3adx.png?expires=1774894500&signature=9b03973d602089a4b45863b6535ad9f2d967d6e78e584218584caf9db3eeb6cf&req=dSgmFMh5mIVfW%2FMW1HO4zRAaJLwUekIUibJYY4yZOlwNlcNhz6rX3UfXwiZD%0Am5zw%0A)
    
2.  Under the **Set up instructions** tab, we need to enter the API V2 key and Token.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812175729/50f401f590794cd279b84009c470/image_gj5idk.png?expires=1774894500&signature=e14c1ff9b59863ed3f16cfb5e1aa42d1920bb1bee391b43afeb59853443c3a40&req=dSgmFMh5mIZdUPMW1HO4zYdOJ%2BlCt%2FWhNKxVnDKIW3D0rOR5vGbIi5MzlHx9%0AUljZ%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812175729/50f401f590794cd279b84009c470/image_gj5idk.png?expires=1774894500&signature=e14c1ff9b59863ed3f16cfb5e1aa42d1920bb1bee391b43afeb59853443c3a40&req=dSgmFMh5mIZdUPMW1HO4zYdOJ%2BlCt%2FWhNKxVnDKIW3D0rOR5vGbIi5MzlHx9%0AUljZ%0A)
    
3.  To retrieve the required keys, open your Sendlane app and navigate to your Sendlane account and obtain the **API V2 token** and **Custom Integration token**.  
    ​  
    ​**Steps to generate API V2 token**  
    ​
    
    *   In the Sendlane side menu, click on the **Account** option and then click on **API**
        
    *   In the Sendlane API V2 section, click on **+API Token** CTA
        
    *   Enter the token name eg. Loop subscriptions and click on the **Create** button.
        
    *   In the next window, you will be shown the API token value. Click on the **Copy API Token button** and **paste it in the API V2 token field** given below.
        
    
      
    ​**Steps to generate custom integration token**
    
    *   In the Sendlane side menu, click on the **Integrations** option and then click on **Connect** CTA in the Custom integration card.
        
    *   Click on the **Configure** CTA to continue the process.
        
    *   In the Integrations window, click on **“+ Setup Integration”** CTA and click on **Continue** button to create the custom integration.
        
    *   Next, you would need to click on the Gear icon to open a side drawer and **copy the token value** shown at the top.
        
    *   Paste the copied token in the Custom Integration Token field given below.
        
    
      
    Check out the images shown below, we've highlighted example API key and Integration token.
    
    **Screenshots steps to generate API V2 key:**  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812178342/33c2f94cab06b5e38a60c62c519d/9bc85221-72c4-49ca-8f09-a2014c_q7qr13.png?expires=1774894500&signature=29c867befdc5ccd0914a5f0126f81b24d2c0a4bd31c60479afbfe723e9ac1b0e&req=dSgmFMh5lYJbW%2FMW1HO4zaousnZJHypv5Y6IzIb8BTED6hnutvnQ4V4jXYDL%0A1fq0%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812178342/33c2f94cab06b5e38a60c62c519d/9bc85221-72c4-49ca-8f09-a2014c_q7qr13.png?expires=1774894500&signature=29c867befdc5ccd0914a5f0126f81b24d2c0a4bd31c60479afbfe723e9ac1b0e&req=dSgmFMh5lYJbW%2FMW1HO4zaousnZJHypv5Y6IzIb8BTED6hnutvnQ4V4jXYDL%0A1fq0%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812178521/88e3ad2f0303c179787b564c5cc4/676b6faa-055b-484d-a56f-497522_hgeq8l.png?expires=1774894500&signature=e14d2b3fba95427dadef338fc0d7c69d5f0fb7abb30baebe0128374468e31073&req=dSgmFMh5lYRdWPMW1HO4zRuzdnAxpU4RrRQJNKxSJx3BjG2UBZMUY7U6ciSk%0AEtB%2F%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812178521/88e3ad2f0303c179787b564c5cc4/676b6faa-055b-484d-a56f-497522_hgeq8l.png?expires=1774894500&signature=e14d2b3fba95427dadef338fc0d7c69d5f0fb7abb30baebe0128374468e31073&req=dSgmFMh5lYRdWPMW1HO4zRuzdnAxpU4RrRQJNKxSJx3BjG2UBZMUY7U6ciSk%0AEtB%2F%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812178791/179b8123f19e18cecaa2d74c7d86/b10a82cc-1562-4c5a-8365-58b01f_6ieszu.png?expires=1774894500&signature=018ee87f698b434f5b517baf0e6c6536bf3d516c472be66ec1cf3731a141f0ab&req=dSgmFMh5lYZWWPMW1HO4zX9%2BLbS%2BFp5afVzAOzK5mxr65w3o57iPEbr0bEUC%0ARf1E%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812178791/179b8123f19e18cecaa2d74c7d86/b10a82cc-1562-4c5a-8365-58b01f_6ieszu.png?expires=1774894500&signature=018ee87f698b434f5b517baf0e6c6536bf3d516c472be66ec1cf3731a141f0ab&req=dSgmFMh5lYZWWPMW1HO4zX9%2BLbS%2BFp5afVzAOzK5mxr65w3o57iPEbr0bEUC%0ARf1E%0A)
    
      
    ​**Screenshots steps to generate custom integration token:**  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812179176/7fd1ec98d7a711c6ae6053b3ce46/2eea158e-b3a3-4d79-9ddb-b79f93_87pejs.png?expires=1774894500&signature=ee1403fc80a6f34ff8184cdc9da4f18b9c973fc38b3ff4c5f1b7bad016b1de63&req=dSgmFMh5lIBYX%2FMW1HO4zfTUKgPH8z6ps5yddXlskYmYR%2BkDw0Bu4cIdByKU%0AhSBS%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812179176/7fd1ec98d7a711c6ae6053b3ce46/2eea158e-b3a3-4d79-9ddb-b79f93_87pejs.png?expires=1774894500&signature=ee1403fc80a6f34ff8184cdc9da4f18b9c973fc38b3ff4c5f1b7bad016b1de63&req=dSgmFMh5lIBYX%2FMW1HO4zfTUKgPH8z6ps5yddXlskYmYR%2BkDw0Bu4cIdByKU%0AhSBS%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812179491/537604f1b73f1762a27118fa1654/6acaab4c-7204-49e7-a87f-6bce80_1ltr86g.png?expires=1774894500&signature=cc0a3f8ce2770b3f1fa0daa97eb982ae09750c67b0ce261bb09ff9be8db70477&req=dSgmFMh5lIVWWPMW1HO4zVcrI82uCv5EPfui3jYXv0N7BHYEPZn6AxNksqSY%0AUcWX%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812179491/537604f1b73f1762a27118fa1654/6acaab4c-7204-49e7-a87f-6bce80_1ltr86g.png?expires=1774894500&signature=cc0a3f8ce2770b3f1fa0daa97eb982ae09750c67b0ce261bb09ff9be8db70477&req=dSgmFMh5lIVWWPMW1HO4zVcrI82uCv5EPfui3jYXv0N7BHYEPZn6AxNksqSY%0AUcWX%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812179738/e783d9db7a3f6e2a2959e0add8fa/a61f2e1e-3445-4f09-a445-f8035c_pzc9n6.png?expires=1774894500&signature=e035514d6ebccc4beb27e0ec3ea8e02ae3324b603db889e7f50d425e51cdb64a&req=dSgmFMh5lIZcUfMW1HO4zZWbxKGKwJgk1rXgq1hUa%2FImmOha27h2dacaf8tz%0AeLYr%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812179738/e783d9db7a3f6e2a2959e0add8fa/a61f2e1e-3445-4f09-a445-f8035c_pzc9n6.png?expires=1774894500&signature=e035514d6ebccc4beb27e0ec3ea8e02ae3324b603db889e7f50d425e51cdb64a&req=dSgmFMh5lIZcUfMW1HO4zZWbxKGKwJgk1rXgq1hUa%2FImmOha27h2dacaf8tz%0AeLYr%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812180058/edfbfab02b64f6a557f4b7006495/4933e1e9-0ca4-463f-b347-53ab87_1ywtpni.png?expires=1774894500&signature=764ef4380c35658a316782ea380555c3280da7dfec9419c922b8317f2cac365f&req=dSgmFMh2nYFaUfMW1HO4zUdZcR91hvzj5FWrekbl3SZxrAW7RBwPZXkkCfq%2F%0A4H5f%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812180058/edfbfab02b64f6a557f4b7006495/4933e1e9-0ca4-463f-b347-53ab87_1ywtpni.png?expires=1774894500&signature=764ef4380c35658a316782ea380555c3280da7dfec9419c922b8317f2cac365f&req=dSgmFMh2nYFaUfMW1HO4zUdZcR91hvzj5FWrekbl3SZxrAW7RBwPZXkkCfq%2F%0A4H5f%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812180291/a5219e195112aa581bf74fd97924/file-LNWmJD1VmX.png?expires=1774894500&signature=000615da98b46d20a0507124626e82c68bd138286cf71f46b83b33e559ed2ea4&req=dSgmFMh2nYNWWPMW1HO4zRgCoQQXWDlfSaE%2FFxeAkyjPY8OR4Jvgj79IJTcM%0Ap7rY%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812180291/a5219e195112aa581bf74fd97924/file-LNWmJD1VmX.png?expires=1774894500&signature=000615da98b46d20a0507124626e82c68bd138286cf71f46b83b33e559ed2ea4&req=dSgmFMh2nYNWWPMW1HO4zRgCoQQXWDlfSaE%2FFxeAkyjPY8OR4Jvgj79IJTcM%0Ap7rY%0A)
    
4.  Paste the required **API V2 Key** and **Customer Integration token** value and click on **Connect.**  
    ​
    
5.  Click on **"Trigger sample events"** to trigger all the Loop subscription events with sample data to help you get started without needing to create a subscription.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812141490/ed9d33a060ea6f3cb7d7a79a07ff/original?expires=1774894500&signature=b3c3764332c3880e9b4a702ac1b24cdae735d8d30cc3eddcbb9a8f24add7683c&req=dSgmFMh6nIVWWfMW1HO4zerg831nPT20Eb3QoFyx8e7uQyfUIl20%2F1O5t2fc%0AVp6G%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812141490/ed9d33a060ea6f3cb7d7a79a07ff/original?expires=1774894500&signature=b3c3764332c3880e9b4a702ac1b24cdae735d8d30cc3eddcbb9a8f24add7683c&req=dSgmFMh6nIVWWfMW1HO4zerg831nPT20Eb3QoFyx8e7uQyfUIl20%2F1O5t2fc%0AVp6G%0A)
    

# Loop data synced with Sendlane

Loop Subscription events which are synced with Sendlane and can be used to trigger Sendlane automations are as shown in below table.

**Event type**

**Description**

loop\_subscription\_created

New subscription is created

loop\_subscription\_paused

Subscription is paused

loop\_subscription\_resumed

Subscription is resumed

loop\_subscription\_cancelled

Subscription is cancelled

loop\_subscription\_reactivated

Subscription is reactivated

loop\_subscription\_expired

Subscription is expired

loop\_order\_upcoming

Upcoming recurring order reminder event

loop\_order\_skipped

Order skipped

loop\_order\_out\_of event reminder

Upcoming recurring order reminder

loop\_order\_skipped

Order skipped

loop\_order\_out\_of\_stock

Order delayed/skipped out of stock

loop\_order\_processed

Order processed successfully

loop\_order\_partially\_processed

Order partially processed

loop\_payment\_attempt\_failed\_with\_retries\_left

Payment failed with retries left

loop\_payment\_attempt\_failed\_last\_retry\_left

Payment failed with only 1 retry left

loop\_payment\_attempt\_failed

Payment failed with no retries left

loop\_payment\_method\_expiring\_soon

Payment method expiring

loop\_flow\_completed

Loop flow executed successfully

loop\_customer\_activation

Customer created & subscription but has not created the customer account yet

# Integration statistics

Once you have connected the Sendlane account successfully, you can see the integration statistics having details of Loop events synced in a particular time period and if there has been any error occurred.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812189073/d38e5a129d3c468261f147898ce8/original?expires=1774894500&signature=2ad9bc4f4eb32716adfe2e66312352e7aacda1780b229de08bff7d2677d22bc3&req=dSgmFMh2lIFYWvMW1HO4zeveVG4ieZFb00%2BN%2B16x%2Fw1x5xQ1ogduH8fmXLtr%0AFoWmq33n2KLDFRVHAJo%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812189073/d38e5a129d3c468261f147898ce8/original?expires=1774894500&signature=2ad9bc4f4eb32716adfe2e66312352e7aacda1780b229de08bff7d2677d22bc3&req=dSgmFMh2lIFYWvMW1HO4zeveVG4ieZFb00%2BN%2B16x%2Fw1x5xQ1ogduH8fmXLtr%0AFoWmq33n2KLDFRVHAJo%3D%0A)

  
​

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#e4979194948b9690a4888b8b94938b968fca878b) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Klaviyo

](https://help.loopwork.co/en/articles/12733266-klaviyo)[

Attentive

](https://help.loopwork.co/en/articles/12741439-attentive)[

Omnisend

](https://help.loopwork.co/en/articles/12741473-omnisend)[

Postscript

](https://help.loopwork.co/en/articles/12741562-postscript)[

Bloomreach

](https://help.loopwork.co/en/articles/12741808-bloomreach)
