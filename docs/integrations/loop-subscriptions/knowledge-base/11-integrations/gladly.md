---
title: "Gladly"
source_url: "https://help.loopwork.co/en/articles/12741866-gladly"
collection: "11-integrations"
scraped_at: "2026-03-30T17:43:17.953Z"
tags: ["11-integrations"]
---

Learn how to integrate Gladly with Loop to sync subscription data, enabling agents to access customer details and manage subscriptions directly within Gladly.

**Gladly** is a modern, conversation-centric customer service platform that Loop integrates with to put subscription context right where your team works. With Loop + Gladly, agents get a complete subscriber view inside the inbox and can guide customers to the right outcome faster.

**Learn more:** [Gladly](https://www.gladly.ai/)

### Key features

*   Brings subscription context into Gladly, including active subscriptions, products, status, next order date, last charge, discounts, and shipping details.
    
*   Streams Loop subscription events (creation, upcoming charge, payment failure, skip, pause, cancel, reactivate) to the customer timeline so agents always see the latest activity.
    
*   Powers self-service by embedding Loop quick actions in Gladly answers, deflecting routine tickets while preserving a seamless experience.  
    ​
    

Gladly integration is available exclusively on the Loop Pro plan.

* * *

# Integration details

## How does Gladly work with Loop?

Gladly's Loop subscriptions integration brings subscription management capabilities directly into the Gladly platform. By connecting Loop subscriptions with Gladly, you enable your customer experience team help resolve tickets more efficiently.

## Major use-cases & benefits

This integration is designed for direct use by support agents, enabling them to easily view customer subscriptions and manage tickets more efficiently. With quick access to subscription details, agents can resolve subscription-related inquiries faster and improve overall response times.

### Example use case

### Subscription-based routing and prioritization

Automatically route high-value subscribers to VIP support and flag at-risk customers for proactive retention.

**How it works**

*   Gladly's rules engine uses Loop subscription data as routing criteria.
    
*   Customers with active, high-value subscriptions are directed to dedicated VIP inboxes.
    
*   Recently canceled subscribers can be flagged and routed to retention specialists.
    
*   First-time subscribers can be routed to onboarding teams for a welcoming experience.
    

**Business impact**  
Reduce churn by proactively supporting at-risk subscribers, strengthen loyalty with white-glove service for VIP Customers, and optimize support resources through intelligent routing.  
​

## How does the integration work

When you connect the Loop subscriptions app to Gladly, Gladly automatically retrieves key subscription details from Loop subscriptions and makes them available across the Gladly experience. This gives both Agents the context they need to deliver more personalized, efficient service.

### **Data available in Sidekick**

**Subscription details**

*   Subscription ID and status (active, paused, canceled)
    
*   Type (Pay as you go, Prepaid, gift)
    
*   Billing and delivery frequency
    
*   Completed order count
    
*   Min payments
    
*   Max payments
    
*   Cancelled at
    

**Next order date**

*   Total line item price
    
*   Shipping price
    

**Payment details**

*   Payment instrument
    
*   Card ending 4 digits
    
*   Expires at
    
*   Last payment status
    

**Product details**

*   Product variant name (along variant)
    
*   Price
    
*   Is one time added
    
*   Is one time removed
    

### How this data is used

This subscription data can be leveraged in several ways throughout Gladly that helps in multiple ways as listed below:

*   **Faster resolution:** Equip CX team with complete subscriber insights in one unified view.
    
*   **Routing rules:** Automatically route conversations based on subscription status or customer value.
    
*   **Analytics:** Uncover patterns and trends from subscription-related interactions to drive smarter decisions.
    

## How to connect Loop with Gladly

### Prerequisites

Review the following information before you install the Loop app.

*   Review the [App platform](https://help.gladly.com/developer-tutorials/docs/app-platform-overview) overview and key concepts to familiarize yourself with this tool before the installation.
    
*   You will need access to a technical resource who can install and [run appcfg CLI](https://help.gladly.com/developer-tutorials/docs/about-appcf) and has access to Gladly instances.
    
*   You need to have Administrator permission in order to complete the installation process.
    

Additional resources  
For more details on configuration and credential structure, refer to the [app-platform-examples repository](https://github.com/gladly/app-platform-examples). You can always clone it and adapt it to your needs.

### Install the Loop subscription app

Follow the steps below to install and configure the Loop subscription app.

1.  Open Loop subscription admin portal. Navigate to **Tools & Apps -> Apps -> Gladly.**  
    ​
    
2.  Switch to "Setup up instruction" tab. Click on the **connect** button. You will be getting Loop api token. This is the only time this secret API token will be visible. Save it use in later steps in the installation process.  
    ​
    
3.  Install the App Platform CLI Tool  
    To begin, install the App Platform CLI (appcfg), which allows you to manage and configure all your App Platform apps.  
    Follow the setup instructions here: [Install appcfg](https://help.gladly.com/developer-tutorials/docs/install-appcfg)  
    ​
    
4.  Obtain Your Gladly API Credentials  
    ​  
    You'll need the following to authenticate with your Gladly instance:  
    ​  
    Gladly host: us-1.gladly.com (host of your gladly instance, if host is [https://us-1.gladly.com/](https://us-1.gladly.com/) then )  
    Gladly user: The email of a Gladly user with Administrator or API User permissions  
    Gladly API token: A personal API token for the user above  
    ​  
    Once you have these, set them as environment variables for convenience:  
    ​  
    ​`javascript   export GLADLY_APP_CFG_HOST="us-1.gladly.com"   export GLADLY_APP_CFG_USER="[[email protected]](/cdn-cgi/l/email-protection#364f59434418535b575f5a7655595b4657584f1855595b)"   export GLADLY_APP_CFG_TOKEN="your-api-token-here"`  
    ​
    
5.  Configure the app with your Loop credentials, use apiToken as you have received from step 1  
    ​  
    ​`javascript   appcfg apps config create '[www.loopwork.co/loop_subscriptions/v1.0.0](http://www.loopwork.co/loop_subscriptions/v1.0.0)' \   --name "Loop subscriptions <name of store>" \   --config '{"host":"[https://api.loopsubscriptions.com](https://api.loopsubscriptions.com)"}' \   --secrets '{"apiToken":<apiToken>}' \   --activate   ​`
    
6.  Verify the configuration  
    ​  
    ​`javascript   appcfg apps config list --identifier "gladly.com/Loop Subscriptions/v1.0.0"`  
    ​
    
7.  Verify your installation: After activation, go to **Settings → App** Actions in Gladly to test an available action.  
    ​
    
8.  To be able to view Loop subscription app on the ticketing UI, please contact Gladly support to enable it. ​
    

In case you don't have a technical resource to perform the above steps, please reach out to Gladly support or Loop Support.

  
​

# **Need help?**

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#86f5f3f6f6e9f4f2c6eae9e9f6f1e9f4eda8e5e9) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Getting started with Loop

](https://help.loopwork.co/en/articles/12703816-getting-started-with-loop)[

Sendlane

](https://help.loopwork.co/en/articles/12741759-sendlane)[

Gorgias

](https://help.loopwork.co/en/articles/12741869-gorgias)[

Zendesk

](https://help.loopwork.co/en/articles/12741923-zendesk)[

Re:amaze

](https://help.loopwork.co/en/articles/12840381-re-amaze)
