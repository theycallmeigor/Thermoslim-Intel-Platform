---
title: "Import from Stripe"
source_url: "https://help.loopwork.co/en/articles/12700734-import-from-stripe"
collection: "03-migration"
scraped_at: "2026-03-30T17:43:22.564Z"
tags: ["03-migration"]
---

Learn how to migrate customer payment details from Stripe to Shopify and Loop for a seamless, secure subscription transition.

If you’re migrating to Loop from a platform using Stripe, this guide helps you securely import customer payment details into Shopify. By connecting Stripe and using Loop’s migration utility, you can map payment methods without needing customers to re-enter card info. Once done, you can create and manage subscriptions directly in the Loop app, ensuring a smooth, hassle-free transition.

* * *

# Prerequisites for customer migration from Stripe

*   You must have an active Stripe account having customer payment methods that need to be migrated.
    
*   You would need to export the customer data from your Stripe account.
    
*   You would need to enable at least one of the payments supported for subscriptions.
    
*   You would need to connect your Stripe account as a secondary payment gateway in Shopify.
    

  
​

# Import customer data in Shopify

Before proceeding to migrate customer payment methods from Stripe, you can import the customer's basic data like name, email, and addresses using Shopify's native import tool available on the customer's page in your Shopify account.

To do this: Navigate to **Shopify Admin > Customers > Import.**

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705733/4b03f46b14f19b5044169abe9892/original?expires=1774894500&signature=5e9d4c6633362c5cf2582f754bea52b24cfa2d738fb154bd44fa17c85e5699b3&req=dSgmFM5%2BmIZcWvMW1HO4zZNNHGDYeU7g5UztoB8kpfA5K3YvMvtklBY37D9E%0A15jfJB7nilQKO3lzy20%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705733/4b03f46b14f19b5044169abe9892/original?expires=1774894500&signature=5e9d4c6633362c5cf2582f754bea52b24cfa2d738fb154bd44fa17c85e5699b3&req=dSgmFM5%2BmIZcWvMW1HO4zZNNHGDYeU7g5UztoB8kpfA5K3YvMvtklBY37D9E%0A15jfJB7nilQKO3lzy20%3D%0A)

**This step is optional** if:

*   Your customers already exist in Shopify, or
    
*   You plan to use Loop’s customer migration utility (which includes name and email).
    

  
​

# Loop customer migration utility

Loop provides an in-app migration utility to help you map Stripe payment methods to Shopify customers.

Accessing the customer migration utility  
​

**Loop Admin > Settings > Migrate Customers and Payment Methods**

Select Stripe from the dropdown.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705757/3517761d7bc1151da6a73a3196a1/original?expires=1774894500&signature=91f1ee384f968d4e0719867e8c60bd9e525dba275cb98c43d9bd8033596cfcaa&req=dSgmFM5%2BmIZaXvMW1HO4zW3ZcpPZpSX%2BaJr6ncM97%2BZtMsz9SuDPMMHgr35y%0AvMvFCyN1fkuRBY9ASik%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705757/3517761d7bc1151da6a73a3196a1/original?expires=1774894500&signature=91f1ee384f968d4e0719867e8c60bd9e525dba275cb98c43d9bd8033596cfcaa&req=dSgmFM5%2BmIZaXvMW1HO4zW3ZcpPZpSX%2BaJr6ncM97%2BZtMsz9SuDPMMHgr35y%0AvMvFCyN1fkuRBY9ASik%3D%0A)

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705731/77d7fc3d3cc7c0b0b314e0007fe1/original?expires=1774894500&signature=237fd2ea88c5e7de1e520e68d4bf699f5fb8e18ba4e3f7aff757b07e3260c13b&req=dSgmFM5%2BmIZcWPMW1HO4zSUFpUZl3LQW5USEGS6Xiw21r7GcjQdK9%2FV8Vdke%0A%2FtsgKqfVhYjY2wkQHuQ%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705731/77d7fc3d3cc7c0b0b314e0007fe1/original?expires=1774894500&signature=237fd2ea88c5e7de1e520e68d4bf699f5fb8e18ba4e3f7aff757b07e3260c13b&req=dSgmFM5%2BmIZcWPMW1HO4zSUFpUZl3LQW5USEGS6Xiw21r7GcjQdK9%2FV8Vdke%0A%2FtsgKqfVhYjY2wkQHuQ%3D%0A)

To access and run the migration utility, two steps need to be completed.

*   **Connect Shopify payments** as the main payment gateway on your store. You can follow the detailed instructions here: [https://help.shopify.com/en/manual/payments/shopify-payments](https://help.shopify.com/en/manual/payments/shopify-payments)
    
*   **Connect Stripe account** as a legacy payment gateway. You just need to click on the "Connect stripe" button which will redirect you to the Shopify payments page where you need to "Install" Stripe and then "Activate" using Stripe credentials.. Enter your registered Stripe email and choose the business account you want to connect with your Shopify store. Make sure that this is the same account having the customers data which needs to be migrated  
    ​
    

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705735/0f06eab41629cf2043663d03f6ba/original?expires=1774894500&signature=7161748e5cb7236751c6c330bc11ce03b08f8d1786a2e62d1b0233d264a74062&req=dSgmFM5%2BmIZcXPMW1HO4zep1u1xRXNuQXLNeuEAAG8hoN%2FP70DdaBBlu%2Fxhk%0ACrUCrCod55696WS18j8%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705735/0f06eab41629cf2043663d03f6ba/original?expires=1774894500&signature=7161748e5cb7236751c6c330bc11ce03b08f8d1786a2e62d1b0233d264a74062&req=dSgmFM5%2BmIZcXPMW1HO4zep1u1xRXNuQXLNeuEAAG8hoN%2FP70DdaBBlu%2Fxhk%0ACrUCrCod55696WS18j8%3D%0A)

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705747/6cbd1517b5e6963866a8f0e347c2/original?expires=1774894500&signature=01a10923fc18e0d10469a917b13bce1fa4b62c24d7d54eb7620dddc1ea752a8c&req=dSgmFM5%2BmIZbXvMW1HO4zVsJCgg2MxM9nvAeldCTeBwJtmGZZlqa%2F3l2Bzfw%0APDrkhbQrJbdS6giyTlM%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705747/6cbd1517b5e6963866a8f0e347c2/original?expires=1774894500&signature=01a10923fc18e0d10469a917b13bce1fa4b62c24d7d54eb7620dddc1ea752a8c&req=dSgmFM5%2BmIZbXvMW1HO4zVsJCgg2MxM9nvAeldCTeBwJtmGZZlqa%2F3l2Bzfw%0APDrkhbQrJbdS6giyTlM%3D%0A)

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705772/657f6f68cb2e72e715f84adc2c88/original?expires=1774894500&signature=38646c1f561e0cc267b9e31ad0d8aef6536b1756ea4d2b0131374c1d53da2f08&req=dSgmFM5%2BmIZYW%2FMW1HO4zZyWO3vZ78Pml75Xfa1VpSyoOSPe9r66kxVkrSeP%0AR1TitkkLQiJ1Ixwjxws%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705772/657f6f68cb2e72e715f84adc2c88/original?expires=1774894500&signature=38646c1f561e0cc267b9e31ad0d8aef6536b1756ea4d2b0131374c1d53da2f08&req=dSgmFM5%2BmIZYW%2FMW1HO4zZyWO3vZ78Pml75Xfa1VpSyoOSPe9r66kxVkrSeP%0AR1TitkkLQiJ1Ixwjxws%3D%0A)

You will then be redirected to your store **Settings > Payments** page, where the Stripe connected account will start showing.

You might have to refresh the page if the Stripe payment card is not visible after the redirection.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705736/3dbe20780bcdc36c44bfe4686938/original?expires=1774894500&signature=806fd26145055ab641be22bb110cb473310434150b8d3d389ffce250266c5358&req=dSgmFM5%2BmIZcX%2FMW1HO4zaNCDM256ppp10zGkgulEG54Yuq5i%2Bdmts8zVCBS%0AI%2BIvm15pPDrV2fheJq8%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705736/3dbe20780bcdc36c44bfe4686938/original?expires=1774894500&signature=806fd26145055ab641be22bb110cb473310434150b8d3d389ffce250266c5358&req=dSgmFM5%2BmIZcX%2FMW1HO4zaNCDM256ppp10zGkgulEG54Yuq5i%2Bdmts8zVCBS%0AI%2BIvm15pPDrV2fheJq8%3D%0A)

Once you complete the above 2 steps, you can click on the refresh button to reflect the latest status on card.  
​

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705752/9cd59485f948db5591408bb4953a/original?expires=1774894500&signature=ba94b03b4ba3d2137a90d8fa8460294e9e9174a77f18eb2b0a5159346bf99234&req=dSgmFM5%2BmIZaW%2FMW1HO4zcI4N8EF1f4Ls1nAs6LrtEsrKoqaY6TXSN68c2l0%0AE0BDDdV1l8hqkRKX0rc%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705752/9cd59485f948db5591408bb4953a/original?expires=1774894500&signature=ba94b03b4ba3d2137a90d8fa8460294e9e9174a77f18eb2b0a5159346bf99234&req=dSgmFM5%2BmIZaW%2FMW1HO4zcI4N8EF1f4Ls1nAs6LrtEsrKoqaY6TXSN68c2l0%0AE0BDDdV1l8hqkRKX0rc%3D%0A)

  
​

# Export customer data from Stripe

Once you have imported your customer data and connected your Stripe account to Shopify, you'll need to export your customer data from Stripe. Ensure that the exported data contains customer email, Stripe ID and Stripe Card ID. If any of these fields are missing, then that customer payment method cannot be migrated.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705726/f052ac31ee425462a53b02ff7030/original?expires=1774894500&signature=f16523d0942288ec7849bdfc3b51cdb4d5dbb60cf0b333b55e791c5f77053a9b&req=dSgmFM5%2BmIZdX%2FMW1HO4zT7V2wJbCG900uDi5DqaCsGf%2BMYI5Dpcn2EcLBCm%0Ay8htfZFOOoluX8sbGdU%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705726/f052ac31ee425462a53b02ff7030/original?expires=1774894500&signature=f16523d0942288ec7849bdfc3b51cdb4d5dbb60cf0b333b55e791c5f77053a9b&req=dSgmFM5%2BmIZdX%2FMW1HO4zT7V2wJbCG900uDi5DqaCsGf%2BMYI5Dpcn2EcLBCm%0Ay8htfZFOOoluX8sbGdU%3D%0A)

Card ID must be set as default in Stripe.

If blank, go to the Stripe dashboard → Customers, and set a default payment method.

​

# Using the migration utility

Once the migration requirements are completed, the utility will be available to use. You would have to keep the exported stripe payment methods file in a separate tab in order to paste the Stripe ID and Stripe Card ID in the migration utility section.

If you have imported the basic customer data before, then you can simply paste the customer email address, Stripe ID, and Stripe Card ID in the respective fields and click on **"Save Customer"** button.

If the customer is existing with the added email address, then the stripe payment info will be added with all other customer data as before. If the customer was not present before, then a new customer will be auto-created in Shopify.

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705758/b943753f3569c96e4068442ededb/original?expires=1774894500&signature=bc9f307f15ed157a7895f94fa65c4442194c5ba980b21379849877a0247d7424&req=dSgmFM5%2BmIZaUfMW1HO4zRXQ2W83kHbgfY01rJAv%2B4VF1k5OX%2BlYDYHLFvcE%0ApcK7gc7rnuK0pKUaw0g%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812705758/b943753f3569c96e4068442ededb/original?expires=1774894500&signature=bc9f307f15ed157a7895f94fa65c4442194c5ba980b21379849877a0247d7424&req=dSgmFM5%2BmIZaUfMW1HO4zRXQ2W83kHbgfY01rJAv%2B4VF1k5OX%2BlYDYHLFvcE%0ApcK7gc7rnuK0pKUaw0g%3D%0A)

**This is great but I have more than 100 customers to migrate.**  
​

Don't worry if you have a long list of customers to be migrated. You can connect with our support team to assist you with the migration process. You just need to send us the exported stripe customer data csv file or stripe API token to [\[email protected\]](/cdn-cgi/l/email-protection#3954505e4b584d5056574a79555656494e564b52175a56) with the required fields (first name, last name, email, Stripe ID, Stripe Card ID) and we will automatically import and update the customers with Stripe payment info.

​

# Migrating subscriptions

Once you have migrated all the customers and payment methods from Stripe, you will be able to re-create the subscription using their saved Stripe payment methods. You can use the "Create subscription manually" tool in Loop admin portal to replicate their existing subscription, including billing schedule, products subscribed, shipping address and prices. Once the subscription is created, your customers will receive a notification along with the customer portal link to manage their subscriptions.

**Learn more:** [Migrating subscriptions](https://intercom.help/loop-subscriptions/en/articles/12744856-subscriptions-migration)

Don't forget to cancel the existing subscriptions in the other subscription app after successful migration to avoid double billing issues for your customers.

# FAQs

#### Is it possible to migrate Stripe billing tokens with other tool subscriptions?

Shopify allows 6 payment gateways on recurring payments / subscriptions - Shopify Payments, Stripe, Authorize, Adyen, Braintree, and Paypal Express.  
​  
So if you have billing tokens on Stripe, there are 2 approaches to migrate them -  
1\. Use Stripe as the Primary Payment gateway on Shopify. With this approach - all the billing tokens (newly acquire subscribers as well as existing) will remain on Stripe  
2\. Use Shopify Payments as Primary and Stripe and Backup Payment method on Shopify store - All new billing tokens will be stored on Shopify and existing subscriptions will keep on getting processed via Stripe

[Explore more FAQs](https://help.loopwork.co/en/collections/16646422-frequently-asked-questions-faqs)

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#c4b7b1b4b4abb6b084a8ababb4b3abb6afeaa7ab) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Import from PayPal Express

](https://help.loopwork.co/en/articles/12691686-import-from-paypal-express)[

Payment migration

](https://help.loopwork.co/en/articles/12742688-payment-migration)[

Import from Authorize.net

](https://help.loopwork.co/en/articles/12745155-import-from-authorize-net)[

Connect secondary payment method on Shopify / Loop

](https://help.loopwork.co/en/articles/12745428-connect-secondary-payment-method-on-shopify-loop)[

Migrate from Recharge policy

](https://help.loopwork.co/en/articles/12752667-migrate-from-recharge-policy)
