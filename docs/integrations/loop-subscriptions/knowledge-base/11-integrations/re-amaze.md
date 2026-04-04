---
title: "Re:amaze"
source_url: "https://help.loopwork.co/en/articles/12840381-re-amaze"
collection: "11-integrations"
scraped_at: "2026-03-30T17:43:18.896Z"
tags: ["11-integrations"]
---

Learn how to integrate Reamaze with Loop to streamline customer support, enabling seamless communication and subscription management directly from the Reamaze platform.

**Re:amaze** is a customer service and messaging platform that integrates seamlessly with Loop subscriptions, allowing support teams to view and manage customer subscriptions directly from the Reamaze interface.

**Learn more:** [Re:amaze](https://www.reamaze.com/)

### Key features

*   Combines email, live chat, social media, SMS, and more in one place for streamlined team collaboration.
    
*   Uses AI to suggest replies, summarize conversations, and create FAQ content for faster support.
    
*   Monitors customer activity and shopping data live, enabling personalized engagement.
    

This integration enhances overall support efficiency by allowing agents to resolve subscription-related inquiries without switching between tools.​

Re:amaze integration is available exclusively on the Loop Pro plan.

* * *

# Integration details

## How does the integration work?

With Loop + Reamaze, agents get a complete subscriber view inside the inbox and can guide customers to the right outcome faster.  
Agents can easily view subscription details on the ReAmaze ticketing UI and access Loop subscription detail page via a single click.  
​  
This allows customer experience team to take subscription actions directly without any friction.

## Major use-cases & benefits

This integration is designed for direct use by support agents, enabling them to easily view customer subscriptions and manage tickets more efficiently. With quick access to subscription details, agents can resolve subscription-related inquiries faster and improve overall response times.

## How to integrate Loop with Reamaze?

### **Prerequisites**

You should have an active Reamaze account. If not, please create from [here](https://www.reamaze.com/).

If the above prerequisites are met, follow these steps to complete the process.

1.  In Re:amaze, navigate to **Settings > Developer** > **"Account IDs and Secret"**  
    ​
    
2.  Copy your **Secret SSO Key** and **Brand ID.**  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1846430053/75dc306e4f4c781bf2ff6bc404fd/image.png?expires=1774894500&signature=4f0d0f3683f7af6e58fd56bfc0f24d23a684da72107594bfbab4460e9b141448&req=dSgjEM19nYFaWvMW1HO4zVGQ0%2BUhb%2FDhu%2FeYY%2BnzO9er1J%2FxzNQEIyD5cTNy%0A%2FpmG%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1846430053/75dc306e4f4c781bf2ff6bc404fd/image.png?expires=1774894500&signature=4f0d0f3683f7af6e58fd56bfc0f24d23a684da72107594bfbab4460e9b141448&req=dSgjEM19nYFaWvMW1HO4zVGQ0%2BUhb%2FDhu%2FeYY%2BnzO9er1J%2FxzNQEIyD5cTNy%0A%2FpmG%0A)
    
3.  Navigate to **Loop > Tools & apps > Apps > Re:amaze and click on connect button.**  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1846434126/e17530b6998928bd001ef1a8f428/image.png?expires=1774894500&signature=f0cd0c9d0de6155aa888a4bc4e41defe50e473dc0ac38884238d3167c2cb7b69&req=dSgjEM19mYBdX%2FMW1HO4zX29F8aKo3%2FefJGFL8Qg%2FSXTqU1QL71ta%2BYEmnl5%0AvUCM%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1846434126/e17530b6998928bd001ef1a8f428/image.png?expires=1774894500&signature=f0cd0c9d0de6155aa888a4bc4e41defe50e473dc0ac38884238d3167c2cb7b69&req=dSgjEM19mYBdX%2FMW1HO4zX29F8aKo3%2FefJGFL8Qg%2FSXTqU1QL71ta%2BYEmnl5%0AvUCM%0A)
    
4.  Under the **Set up Instructions** tab, enter the copied information and click on **Connect** to establish the integration.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1846448623/d031ac18bef4be1c601d2a35683a/image.png?expires=1774894500&signature=0273d70155347e3e6541bc705b12175041cef4006b824d153893368040a1efa6&req=dSgjEM16lYddWvMW1HO4zRb3L1z%2FsRfD9LVwIoPtSEEk7oRrNAkWIVxrfSHG%0AgnZX%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1846448623/d031ac18bef4be1c601d2a35683a/image.png?expires=1774894500&signature=0273d70155347e3e6541bc705b12175041cef4006b824d153893368040a1efa6&req=dSgjEM16lYddWvMW1HO4zRb3L1z%2FsRfD9LVwIoPtSEEk7oRrNAkWIVxrfSHG%0AgnZX%0A)
    
5.  Copy the **Custom Action URL** that appears after connection.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1846451109/ecb8cdb6722a7aa44683d638c5e2/image.png?expires=1774894500&signature=3de33ae57cd7dca09c94a6c7999c4ff7e61cfbb3e20abf0538c436e403a3abce&req=dSgjEM17nIBfUPMW1HO4zRy4Jg5iQPs6nR44tJahJTIw%2BtnVjeUPvF5%2Bl6%2Bw%0AUVP%2B%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1846451109/ecb8cdb6722a7aa44683d638c5e2/image.png?expires=1774894500&signature=3de33ae57cd7dca09c94a6c7999c4ff7e61cfbb3e20abf0538c436e403a3abce&req=dSgjEM17nIBfUPMW1HO4zRy4Jg5iQPs6nR44tJahJTIw%2BtnVjeUPvF5%2Bl6%2Bw%0AUVP%2B%0A)
    
6.  Return to Re:amaze and go to **Settings > Developer > Custom Module**  
    ​
    
7.  Paste the Custom Action URL and click **Update Account.**  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1846453448/308ea6bf660e5deab6db7a1d1d2e/image.png?expires=1774894500&signature=b1242a329b0b1ed614ae70812ac49cf268c7f6426d5812269ab3e53f94094c80&req=dSgjEM17noVbUfMW1HO4zc4MBuvtn5h1fbPq1PwR709pl9t7TKNI8OwaTv0y%0AqCJl%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1846453448/308ea6bf660e5deab6db7a1d1d2e/image.png?expires=1774894500&signature=b1242a329b0b1ed614ae70812ac49cf268c7f6426d5812269ab3e53f94094c80&req=dSgjEM17noVbUfMW1HO4zc4MBuvtn5h1fbPq1PwR709pl9t7TKNI8OwaTv0y%0AqCJl%0A)
    

## Ticketing portal experience

1.  Customer raises a Re:amaze ticket to inquire or request actions (pause, resume, cancel). The ticket appears on the Re:amaze dashboard.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1850183188/f3870d45a37f1cf08c1f903509cb/image.png?expires=1774894500&signature=46b9f524e7aa7e028751ed9b855bcdee59c47a7f0722f9ad03ddf4167ca502e7&req=dSgiFsh2noBXUfMW1HO4zagOZRnJ0OeqmXiEa%2FFUFyh2vP3OFc7K9K2jdZWC%0A8uHi%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1850183188/f3870d45a37f1cf08c1f903509cb/image.png?expires=1774894500&signature=46b9f524e7aa7e028751ed9b855bcdee59c47a7f0722f9ad03ddf4167ca502e7&req=dSgiFsh2noBXUfMW1HO4zagOZRnJ0OeqmXiEa%2FFUFyh2vP3OFc7K9K2jdZWC%0A8uHi%0A)
    
2.  Support opens the ticket, views all subscriptions linked to the customer in the right panel, and clicks the subscription ID to open it in Loop.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1850183387/92e08f7e7123cd71c4afa79a509c/image.png?expires=1774894500&signature=ffd93de2111e2da5fce297b80d2b5771f9c5b9e7e8c79ca2dcc213d4e1c8e64a&req=dSgiFsh2noJXXvMW1HO4zeYoC8gN54TWFKlRWgNvnGttvXUp90KOJpz2oR%2Fm%0AQc4F%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1850183387/92e08f7e7123cd71c4afa79a509c/image.png?expires=1774894500&signature=ffd93de2111e2da5fce297b80d2b5771f9c5b9e7e8c79ca2dcc213d4e1c8e64a&req=dSgiFsh2noJXXvMW1HO4zeYoC8gN54TWFKlRWgNvnGttvXUp90KOJpz2oR%2Fm%0AQc4F%0A)
    
3.  In Loop, the team performs the required action and then closes the ticket in Re:amaze.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1850183484/7d504bdaea84c307ce83f5a3d02e/image.png?expires=1774894500&signature=68408815122f104560ec4ab48a965e14fe24aeca64c17512b8dbaac4712b00f0&req=dSgiFsh2noVXXfMW1HO4zYs5dFaC%2F3zw49Y%2FXr75OB53Hgres1YBE75Ph68R%0AKMiZ%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1850183484/7d504bdaea84c307ce83f5a3d02e/image.png?expires=1774894500&signature=68408815122f104560ec4ab48a965e14fe24aeca64c17512b8dbaac4712b00f0&req=dSgiFsh2noVXXfMW1HO4zYs5dFaC%2F3zw49Y%2FXr75OB53Hgres1YBE75Ph68R%0AKMiZ%0A)
    
      
    ​
    

# **Need help?**

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#b8cbcdc8c8d7caccf8d4d7d7c8cfd7cad396dbd7) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Okendo loyalty

](https://help.loopwork.co/en/articles/12741322-okendo-loyalty)[

Smile.io

](https://help.loopwork.co/en/articles/12741347-smile-io)[

Gladly

](https://help.loopwork.co/en/articles/12741866-gladly)[

Gorgias

](https://help.loopwork.co/en/articles/12741869-gorgias)[

Zendesk

](https://help.loopwork.co/en/articles/12741923-zendesk)
