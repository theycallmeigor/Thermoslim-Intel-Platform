---
title: "Import from Authorize.net"
source_url: "https://help.loopwork.co/en/articles/12745155-import-from-authorize-net"
collection: "03-migration"
scraped_at: "2026-03-30T17:43:22.152Z"
tags: ["03-migration"]
---

Learn how to migrate customer payment details from Authorize.net to Shopify and Loop for a secure, streamlined subscription migration process.

If you’re migrating to Loop from a platform using Authorize, this guide helps you securely import customer payment details into Shopify. By connecting Authorize and using Loop’s migration utility, you can map payment methods without needing customers to re-enter card info. Once done, you can create and manage subscriptions directly in the Loop app, ensuring a smooth, hassle-free transition.

* * *

# Prerequisites for customer migration from Authorize.net

Before setting up the process, we need to make sure these things are in place.

*   You must have an active Authorize.net account having customer payment methods that needs to be migrated.
    
*   You would need to export the customer and payment data from your Authorize.net account
    
*   You would need to set up and enable Authoize.net payment gateway (with the same account credentials you are transferring from) on your Shopify store.
    

# Import customer data in Shopify

Before proceeding to migrate customer payment methods from Authorize, you can import the customer's basic data like name, email, and addresses using Shopify's native import tool available on the customer's page in your Shopify account.

Follow these steps to complete the process.

1.  Navigate to **Shopify Admin > Customers > Import.**  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812723710/96f25d82c651e996e6d86a9571ff/original?expires=1774894500&signature=c24eb1705f801f0287de98fd7413ffdfefc0ece6958ce50622edc90a79972501&req=dSgmFM58noZeWfMW1HO4zU4fYN374dA0bnrceOkTprZe%2BFQtivXOUXbfF%2FOv%0Aw0Q4%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812723710/96f25d82c651e996e6d86a9571ff/original?expires=1774894500&signature=c24eb1705f801f0287de98fd7413ffdfefc0ece6958ce50622edc90a79972501&req=dSgmFM58noZeWfMW1HO4zU4fYN374dA0bnrceOkTprZe%2BFQtivXOUXbfF%2FOv%0Aw0Q4%0A)
    

**This step is optional** if:

*   Your customers already exist in Shopify, or
    
*   You plan to use Loop’s customer migration utility (which includes name and email).
    

  
​

# Loop customer migration utility

To streamline the migration process and easier to understand, we have made a customer migration utility inside the Loop app. Detailed instructions have been provided below to help you with the migration process.

## Accessing the customer migration utility

Follow these steps to complete the process.

1.  Navigate to **Loop Admin > Settings > Migrate Customers and Payment Methods.**  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812724579/d606d0459c063a41020f20b022ea/original?expires=1774894500&signature=eca1761b59a8d3c3666ce09e095d3efb06ff4fe1c15419e15b53161117b853d6&req=dSgmFM58mYRYUPMW1HO4zcgTy938Bf5S8t1yMboGbCQ2nzIK9afkmsniWGW%2F%0AlxtW%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812724579/d606d0459c063a41020f20b022ea/original?expires=1774894500&signature=eca1761b59a8d3c3666ce09e095d3efb06ff4fe1c15419e15b53161117b853d6&req=dSgmFM58mYRYUPMW1HO4zcgTy938Bf5S8t1yMboGbCQ2nzIK9afkmsniWGW%2F%0AlxtW%0A)
    
2.  Select Authorize.net from the payment provider dropdown.  
    ​
    
3.  Ensure Authorize.net is connected as a payment gateway on your Shopify store. This must be the same account that holds the customer data you're migrating.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812725848/474d4e52628794f832e9dba910fa/original?expires=1774894500&signature=09a2284f23013c823e8e0133e4fbf3486afcc22aa9a74d0f6f11db13621bc7d5&req=dSgmFM58mIlbUfMW1HO4zRW9UOqrZKc8GxssU3zVFdYnTv5MlMtuafDkmIcN%0ARidR%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812725848/474d4e52628794f832e9dba910fa/original?expires=1774894500&signature=09a2284f23013c823e8e0133e4fbf3486afcc22aa9a74d0f6f11db13621bc7d5&req=dSgmFM58mIlbUfMW1HO4zRW9UOqrZKc8GxssU3zVFdYnTv5MlMtuafDkmIcN%0ARidR%0A)
    

  
To access and run the migration utility, two steps need to be completed.

*   **Connect Shopify payments** as the main payment gateway on your store. You can follow the detailed instructions here: [https://help.shopify.com/en/manual/payments/shopify-payments](https://help.shopify.com/en/manual/payments/shopify-payments)
    
*   **Connect Authorize account** as a legacy payment gateway. You just need to click on the "Connect Authorize.net" button which will redirect you to the Authorize.net Legacy Gateway. Enter your account information. Make sure that this is the same account having the customers data which needs to be migrated  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812726685/c2a4044d0314f9b2612ae63f181e/original?expires=1774894500&signature=328e6c0a717b1bb13da5c3222aa1aaa3ffd479b28f57a90b50ea03654233f2e4&req=dSgmFM58m4dXXPMW1HO4zZQ89J9hdDNEGCEpSpIx33uvlm5aJwPiEHiNkcgK%0AbaQ5%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812726685/c2a4044d0314f9b2612ae63f181e/original?expires=1774894500&signature=328e6c0a717b1bb13da5c3222aa1aaa3ffd479b28f57a90b50ea03654233f2e4&req=dSgmFM58m4dXXPMW1HO4zZQ89J9hdDNEGCEpSpIx33uvlm5aJwPiEHiNkcgK%0AbaQ5%0A)
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812726901/0d92a08a4fe72a0ffc0031bd9379/original?expires=1774894500&signature=561f723c2b499d42b8a6ededa255d35e561ee814361fbabfe8ac405374b2acd4&req=dSgmFM58m4hfWPMW1HO4zWmBgqJ%2BGLzjubXUHd25pntX6Dj%2BMgNqU5dRB8B9%0AkB9R%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812726901/0d92a08a4fe72a0ffc0031bd9379/original?expires=1774894500&signature=561f723c2b499d42b8a6ededa255d35e561ee814361fbabfe8ac405374b2acd4&req=dSgmFM58m4hfWPMW1HO4zWmBgqJ%2BGLzjubXUHd25pntX6Dj%2BMgNqU5dRB8B9%0AkB9R%0A)
    

# Export customer data from Authorize.net

Once you have connected your Authorize.net account to Shopify, you'll need to export your customer and payment data from Authorize.net.

Follow these steps to complete the process.

1.  Login to your [Authorize.net](https://authorize.net/) account and click on the tab **TOOLS**.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812727692/964d44bf328b191db98ddc3e8dd7/original?expires=1774894500&signature=a86f14030c7206d57aa1a58b4083b1258e7b49ccf6e8ba6380c6f39a02eb10c2&req=dSgmFM58modWW%2FMW1HO4zVbblSr71ZJcqZNsWvl0QxpYOC5qkZwinUU9fQvv%0Ab%2FF4%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812727692/964d44bf328b191db98ddc3e8dd7/original?expires=1774894500&signature=a86f14030c7206d57aa1a58b4083b1258e7b49ccf6e8ba6380c6f39a02eb10c2&req=dSgmFM58modWW%2FMW1HO4zVbblSr71ZJcqZNsWvl0QxpYOC5qkZwinUU9fQvv%0Ab%2FF4%0A)
    
2.  In the left navigation, click on the option **Customer Information Manager** (CIM)  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812730301/5cea7938ed3059f22ba121a735fb/original?expires=1774894500&signature=ef481fb630df94674b81e6de38aad1d5ce25c285a28e79b5e09327cf4d987da4&req=dSgmFM59nYJfWPMW1HO4zdpqqqaLwolNnqvCqh1vSNwe1S%2BmP83VOXRz3Agm%0AbaS4%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812730301/5cea7938ed3059f22ba121a735fb/original?expires=1774894500&signature=ef481fb630df94674b81e6de38aad1d5ce25c285a28e79b5e09327cf4d987da4&req=dSgmFM59nYJfWPMW1HO4zdpqqqaLwolNnqvCqh1vSNwe1S%2BmP83VOXRz3Agm%0AbaS4%0A)
    
3.  Now, in the Customer Information Manager window, click on **Advanced Search**  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812732146/41d8eb2ea633754d22f48b280b5a/original?expires=1774894500&signature=a8e070b4dbb36d1b885ff0a984231aa13180d0a8e47f6980703079f9eaf09d56&req=dSgmFM59n4BbX%2FMW1HO4zWRG9hKPUHeSCvjPdf2EpzE5xzZPo7E6Kqfr5Rev%0AyU2G%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812732146/41d8eb2ea633754d22f48b280b5a/original?expires=1774894500&signature=a8e070b4dbb36d1b885ff0a984231aa13180d0a8e47f6980703079f9eaf09d56&req=dSgmFM59n4BbX%2FMW1HO4zWRG9hKPUHeSCvjPdf2EpzE5xzZPo7E6Kqfr5Rev%0AyU2G%0A)
    
4.  Choose the option **Search Customer and Payment Profiles** from the Profile Type dropdown.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812733482/50f2b2bcfa47781266908602c251/original?expires=1774894500&signature=28135d9e3702bbc399571059176c275c79d0089d964c6ab96fe019fe8477e359&req=dSgmFM59noVXW%2FMW1HO4zV79QC8dw7uF5knfAADdSeOx9wui7gaqX9H1NhaP%0A0vvm%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812733482/50f2b2bcfa47781266908602c251/original?expires=1774894500&signature=28135d9e3702bbc399571059176c275c79d0089d964c6ab96fe019fe8477e359&req=dSgmFM59noVXW%2FMW1HO4zV79QC8dw7uF5knfAADdSeOx9wui7gaqX9H1NhaP%0A0vvm%0A)
    
5.  In the Advanced Profile Search Results page, you can see the **Customer Profile ID** and the **Profile ID** which will be needed for the migration along with the Email. Click on the option **Download to File** and that's it.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812734071/15c39ece9f54c01dcc13e2f29f4c/original?expires=1774894500&signature=1796a49ae6de1219b487707d7b6d8fb0bd9d5a678081c7e447cb9204fbdea08a&req=dSgmFM59mYFYWPMW1HO4zV7MK4CGz8Z%2B6tUinPBEnDMhrWU4Yx7hMXTFZRQb%0At%2BwP%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812734071/15c39ece9f54c01dcc13e2f29f4c/original?expires=1774894500&signature=1796a49ae6de1219b487707d7b6d8fb0bd9d5a678081c7e447cb9204fbdea08a&req=dSgmFM59mYFYWPMW1HO4zV7MK4CGz8Z%2B6tUinPBEnDMhrWU4Yx7hMXTFZRQb%0At%2BwP%0A)
    

#   
Using the migration utility

Once the migration requirements are completed, the utility will be available to use. You would have to keep the exported authorize payment methods file in a separate tab in order to paste the Customer Profile ID and Payment Method ID in the migration utility section.

*   If you have imported the basic customer data before, then you can simply paste the customer email address, Customer Profile ID, and Payment Method ID in the respective fields and click on "Save Customer" button.
    
*   If the customer is existing with the added email address, then the authorize payment info will be added with all other customer data as before. If the customer was not present before, then a new customer will be auto-created in Shopify.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812735469/eaf70e55990c01c56ba4c4ba2fb9/original?expires=1774894500&signature=415be544a52257541117ce32d133add5fadfd8bb153548da865809a6bd137d57&req=dSgmFM59mIVZUPMW1HO4zZ9cSpqQKCIXUft4HOWdYWOT1p2I0tEkqJC8p%2BaL%0AJhJo%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812735469/eaf70e55990c01c56ba4c4ba2fb9/original?expires=1774894500&signature=415be544a52257541117ce32d133add5fadfd8bb153548da865809a6bd137d57&req=dSgmFM59mIVZUPMW1HO4zZ9cSpqQKCIXUft4HOWdYWOT1p2I0tEkqJC8p%2BaL%0AJhJo%0A)
    
*   This is great but I have more than 100 customers to migrate.
    

Don't worry if you have a long list of customers to be migrated. You can connect with our support team to assist you with the migration process. You just need to send us the exported Authorize.net customer data csv file or (name, transaction key) to [\[email protected\]](/cdn-cgi/l/email-protection#b7daded0c5d6c3ded8d9c4f7dbd8d8c7c0d8c5dc99d4d8)

​

# Migrating subscriptions

Once you have migrated all the customers and payment methods from Authorize.net, you will be able to re-create the subscription using their saved Authorize.net payment methods. You can use the "Create Subscription Manually" tool in the Loop admin portal to replicate their existing subscription including billing schedule, products subscribed, shipping address and prices. Once the subscription is created, your customers will receive a notification along with the customer portal link to manage their subscriptions.

**Learn more:** [Migrating Subscriptions](https://intercom.help/loop-subscriptions/en/articles/12744856-subscriptions-migration)

Don't forget to pause/cancel the existing subscriptions in the other subscription app after successful migration to avoid double billing issues for your customers.

#   
Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#681b1d1818071a1c28040707181f071a03460b07) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Import from PayPal Express

](https://help.loopwork.co/en/articles/12691686-import-from-paypal-express)[

Import from Stripe

](https://help.loopwork.co/en/articles/12700734-import-from-stripe)[

Payment migration

](https://help.loopwork.co/en/articles/12742688-payment-migration)[

Connect secondary payment method on Shopify / Loop

](https://help.loopwork.co/en/articles/12745428-connect-secondary-payment-method-on-shopify-loop)[

Migrate from Recharge policy

](https://help.loopwork.co/en/articles/12752667-migrate-from-recharge-policy)
