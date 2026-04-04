---
title: "Migrate from Bold"
source_url: "https://help.loopwork.co/en/articles/12752633-migrate-from-bold"
collection: "03-migration"
scraped_at: "2026-03-30T17:43:23.000Z"
tags: ["03-migration"]
---

Learn how to migrate your subscriptions from Bold to Loop effortlessly with expert assistance and no disruption to your customers.

If you’re currently using **Bold** and want to move to **Loop**, our migration team can help you transfer all your subscriptions smoothly with zero disruption to your customers.

* * *

#   
Prerequisites

Before proceeding with a subscription import process, we need to make sure these things are in place.

*   Loop widget must be live on the storefront and account page should point to Loop customer portal ([guide](https://intercom.help/loop-subscriptions/en/articles/12703816-getting-started-with-loop)) ([read more](https://intercom.help/loop-subscriptions/en/articles/12742349-loop-migration-process))
    
*   Bold API token must be created with write access to all scopes and shared with loop team ([guide](https://support.boldcommerce.com/hc/en-us/articles/360061081951-Create-an-API-Access-Token-in-Account-Center))
    
*   Customer portal permissions must be set to disabled prior to the migration ([guide](https://support.boldcommerce.com/hc/en-us/articles/360050964652-Set-up-and-Manage-the-Customer-Portal#review-customer-portal-settings))
    
*   Notifications must be set to disabled prior to the migration ([guide](https://intercom.help/loop-subscriptions/en/articles/12742688-payment-migration))  
    ​
    

Since Bold is built on native subscription APIs of Shopify, there is no need for any payment migration in this case.

  
​**Please ensure that the API token created for the Loop team has write access to the subscription object, otherwise step (4) will fail.**

  
​

# Migrate from Bold

Once you have satisfied the prerequisites mentioned above, the loop team will be able to help you bring subscriptions over from your Bold app.

Please reach out to us at [\[email protected\]](/cdn-cgi/l/email-protection#097a7c7979667b7d49656666797e667b62276a66) with the required information and our team will help you get things over the line with our dedicated migration for a white glove migration experience on any of our paid plans.

**Learn more:** [Options you have while migrating to Loop](https://intercom.help/loop-subscriptions/en/articles/12742349-loop-migration-process)

Here is a quick email template to kick-start things if you have not been in touch with a team member from Loop already 😉

**Subject line** : {Brand Name} Migration from Bold -> Loop  
​  
​**Email content**  
​  
​**Source platform** - Bold  
​  
​**Bold API key** - {insert api token}

Our Onboarding/migrations team will get in touch with you shortly and suggest a few days as per the team's availability.  
​

# White glove migration walkthrough

This section details the overall sequence of steps taken by the Loop team on the scheduled migration date.

1.  Loop team will take an export from Bold APIs ([reference](https://developer.boldcommerce.com/api/subscriptions#tag/Subscriptions/operation/ListSubscriptions)) using the shared tokens from earlier.  
    ​
    
2.  Once the data has been exported from the APIs, Loop team will convert it into the standard migration data format of Loop.  
    ​
    
3.  Once the data has been fetched from Bold, the migration expert will begin the import at the scheduled time.  
    ​
    
4.  Post subscription migration completion, Loop team will go proceed with actioning a bulk cancellation action on Bold through their APIs ([reference](https://developer.boldcommerce.com/api/subscriptions#tag/Subscriptions/operation/CancelSubscription))  
    ​
    
5.  A detailed migration report ([reference](https://imgur.com/a/U2iXqXp)) will be shared with the merchant, along with a 1:1 mapping between the contracts in both platforms for easy review.  
    ​
    
6.  Merchant is then advised to do an overall review by spot checking a few contracts in between and ensuring data parity.  
    ​
    
7.  Loop team will wait to hear back on the data review and migration confirmation requested in (6) and any open points on the same.  
    ​
    

Point (4) ensures that no customer is doubly charged due to the subscription contract being active on both platforms.

  
If there are any custom requirements for the migration like price update, variant swapping etc., the migration team would need to be informed at least a week in advance so that we can have this accommodated on our end.  
​  
​

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#1b686e6b6b74696f5b7774746b6c746970357874) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Import from Stripe

](https://help.loopwork.co/en/articles/12700734-import-from-stripe)[

Loop migration process

](https://help.loopwork.co/en/articles/12742349-loop-migration-process)[

Subscriptions migration

](https://help.loopwork.co/en/articles/12744856-subscriptions-migration)[

Migrate from Smartrr

](https://help.loopwork.co/en/articles/12745497-migrate-from-smartrr)[

Migrate from Recharge policy

](https://help.loopwork.co/en/articles/12752667-migrate-from-recharge-policy)
