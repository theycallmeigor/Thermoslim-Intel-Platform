---
title: "Access subscriptions on Shopify customer accounts"
source_url: "https://help.loopwork.co/en/articles/12708391-access-subscriptions-on-shopify-customer-accounts"
collection: "Customer portal"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, customer-portal]
---

# Access subscriptions on Shopify customer accounts

Learn how to connect Loop's subscription portal with Shopify customer accounts, ensuring easy subscriber access across both new and legacy setups.

Managing subscriptions should be simple and accessible for your customers. With Loop, subscribers can directly access their subscription management page through their Shopify customer account. The setup process varies slightly depending on whether your store uses legacy or new Shopify customer accounts.

## Shopify (new) customer accounts

With Shopify's new customer accounts, customers get a frictionless login experience — no passwords needed. They sign in using a one-time code sent to their email.

**How Loop integrates:** A "Manage subscriptions" button is displayed on the orders page. When clicked, it automatically logs the customer in and redirects them to the subscription listing page on Loop's customer portal — no password or OTP required.

**Setup steps:**
1. Navigate to **Loop admin > Customer portal > Accessibility > Customer account page**
2. Select the required profile and click on the **Manage block** button
3. You'll be redirected to the Shopify customer account page customizer
4. Click on Loop's **Manage subscriptions block** to add it to the "Orders" page, then click **Save**

To update the button text: **Customer portal > Preferences > Manage subscriptions button text**

For multilingual support: **Loop > Settings > Multilingual texts > General > Accessibility texts > Shopify customer account**

## Shopify (legacy) customer accounts

If your store uses Shopify legacy customer accounts, manually add a button to allow customers to manage their subscriptions.

**Setup steps:**
1. Navigate to **Online Store > Themes > Edit code**
2. Search for the file: `customer-account.liquid`, `main-account.liquid`, or `account`
3. Place the following code wherever you want the button visible:

```html
<div>
  <a
    href="/a/loop_subscriptions/auth?customer_id={{customer.id}}&myshopify_domain={{shop.permanent_domain}}&locale={{ locale }}&rootUrl={{ routes.root_url }}"
    id="loop-subscriptions-customer-portal-link"
  >
    <button class="btn" style="padding: 10px 20px; margin:0 0 20px 0;">My Subscriptions</button>
  </a>
</div>
```

## FAQs

**How can I remove the "Manage subscription" block from the thank you page?**
Contact Shopify Support for assistance.

**How can I check if my store uses legacy or new customer accounts?**
Go to Shopify admin > Settings > Customer accounts.

**I just migrated to Loop. I can't find the customer portal link.**
Navigate to Loop > Customer Portal > Accessibility. You may need to enable it. Embed the link in your store wherever customers can access the portal.

**I'm getting a 404 error when amending my subscription from the customer portal.**
Double-check the login link was sent to the correct email address (associated with their Shopify account). If persisting, record a screen capture and send to Loop support.

**Is there a way to view all subscriptions created by Loop from Shopify?**
Yes — Orders section > Add filter > App: Loop Subscriptions

## External Links Found

- https://help.loopwork.co/en/articles/12707618-customer-portal
- https://help.loopwork.co/en/articles/12744856-subscriptions-migration
- https://help.loopwork.co/en/articles/12745428-connect-secondary-payment-method-on-shopify-loop
