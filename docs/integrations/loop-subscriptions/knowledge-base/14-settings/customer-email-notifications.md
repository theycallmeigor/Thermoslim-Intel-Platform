---
title: "Customer email notifications"
source_url: "https://help.loopwork.co/en/articles/12730180-customer-email-notifications"
collection: "14-settings"
scraped_at: "2026-03-30T17:35:00Z"
tags: ["email", "notifications", "customer emails"]
---

# Customer email notifications

Learn how to manage and customize automated email notifications in Loop to keep subscribers informed, engaged, and in control of their subscriptions.

Loop allows brands to automate and customize email notifications sent to subscribers throughout their subscription journey. These notifications are triggered automatically based on key subscription events, such as upcoming charges, successful payments, cancellations, and more.
By keeping subscribers informed at every step, these emails help build trust, improve transparency, and empower subscribers to take timely actions, like updating payment methods, managing upcoming orders, or making changes to their plan, ensuring a smooth and seamless subscription experience.

## How to access the customer email settings?

Customer email notifications can be accessed by navigating to **Settings > Notification**. Each email can be enabled or disabled individually based on your business requirements.

## Types of customer email notifications

The following Customer email notifications are available in Loop and are triggered based on specific subscription events, as outlined below.

| Notification | Action |
| --- | --- |
| New subscription | Sent to the customer when they start a new subscription |
| Customer portal link email | Sent to the customer when they request to generate a new customer portal link |
| Subscription rescheduled | Sent to the customer when their subscription is rescheduled |
| Subscription delayed | Sent to the customer when their subscription is delayed |
| Subscription paused | Sent to the customer when their subscription is paused |
| Subscription resumed | Sent to the customer when a subscription is resumed back |
| Subscription marked for cancellation | Sent to the customer when their prepaid subscription is marked for cancellation |
| Subscription cancelled | Sent to the customer when their subscription is cancelled |
| Subscription reactivated | Sent to the customer when their subscription is reactivated |
| Subscription expired | Sent to the customer when their subscription has expired |
| Upcoming order | Sent to the customer to remind them about the upcoming subscription order |
| Order skipped | Sent to the customer when their upcoming order is skipped |
| Order unskipped | Sent to the customer when their order is unskipped |
| Order partially billed | Sent to the customer when a subscription order is partially billed due to a few items being out of stock |
| Product out of stock | Sent to the customer when a subscription order is delayed or skipped due to items being out of stock |
| Payment failed with retries left | Sent to the customer when their payment fails and will be automatically reattempted |
| Last payment retry left | Sent to the customer when their payment fails and only one retry is remaining |
| Payment failed | Sent to the customer when their payment fails after the final retry or retry is not enabled |
| Card expiring | Sent to the customer when their card is about to expire. Emails will be sent out at 30, 15, and 3 days before card expiry date. |
| Customer activation mail | Sent to the customer when they start a new subscription and have not created the Shopify customer account. |

Loop gives you full control to customize your customer email alerts using HTML. Simply click on any blue hyperlink on the Notifications page to open the template in an HTML editor. You can personalize the content using email variables, allowing you to tailor each email to your subscriber’s experience.

**Loop variables that can be used in the email templates:**

*   `{{customer_first_name}}`
*   `{{customer_last_name}}`
*   `{{store_url}}`
*   `{{store_name}}`
*   `{{store_address}}`
*   `{{store_support_email}}`
*   `{{subscription_shopify_id}}`
*   `{{subscription_currency}}`
*   `{{subscription_total_line_item_price}}`
*   `{{subscription_total_line_item_discounted_price}}`
*   `{{subscription_total_product_discount}}`
*   `{{subscription_shipping_price}}`
*   `{{subscription_total_price}}`
*   `{{subscription_next_billing_date}}`
*   `{{subscription_next_delivery_date}}`
*   `{{subscription_billing_interval}}`
*   `{{subscription_billing_attempt_success_count}}`
*   `{{subscription_has_bundle}}`
*   `{{subscription_line_items}}` (The given variables `{{name}}`, `{{quantity}}`, `{{currency}}`, `{{line_item_price}}` are used under the `{{subscription_line_items}}` variable)
*   `{{customer_portal_subscription_link}}`
*   `{{customer_portal_link}}`
*   `{{session_token}}`

Quick actions and Integrations related variables are available in their respective sections and can be used as needed within the email templates.

You can also preview how your template looks to the customer by going to the preview button next to the body button.

You can also send a test mail to check its appearance before it reaches your customers, ensuring everything looks as expected.

You can add an email address in the BCC section to retain a copy of each outgoing email. This can be useful for reference if a subscriber doesn’t receive an email or accidentally deletes it; you can then verify the content by checking the email sent to the BCC address.

## Branding the email template

Loop offers a powerful editor that allows you to fully customize the design and appearance of your email templates, helping you create visually appealing and brand-aligned emails. To access the configuration screen, navigate to **Settings > Notifications > Branding**.

This section is divided into four parts, each explained in detail below.

1.  **Logo:** Add your brand’s logo to personalize the email header.
2.  **Header:** Customize the email header with HTML for tailored messaging.
3.  **Footer:** Modify the footer using HTML to include brand links or legal info.
4.  **Styles:** Control font size, colors, logo height, and header position to match your brand’s identity.

Once the branding configuration is complete, open the specific email template and ensure that the branding variables are correctly placed within the HTML structure to avoid any formatting issues in the final email.

## Notification preferences

You can configure notification preferences for the following two notifications, such as setting the upcoming order notification to be sent 3 days before the billing date.

### FAQs

**Will the card expiry notification email be sent only if the customer has an upcoming renewal order, or will it be sent regardless? Also, can we configure it to send only one notification instead of all three (30, 15, and 3 days before expiry)?**

The card expiry notification is sent if the customer has an active subscription, it is not tied to the upcoming order date. Currently, there's no option to limit the notification to just one email; all three will be sent. However, merchants can use third-party apps like Klaviyo to create a custom flow and trigger a single notification based on the expiry event sent from Loop.

**Is there a way to test Loop notification variables and see what sample data is populated in those variables within the emails?**

Currently, there’s a limitation in place - the only way to 'test Loop notification variables and see what sample data is populated in those variables within the emails' is by placing a test order, which triggers the notification and allows you to see how the variables are populated in a real scenario.

**Is it possible to send out notifications in different languages to customers?**

The notification system in Loop supports sending messages in only one language. If you need to send multilingual notifications to customers based on their language preference, you'll need to integrate with Klaviyo, which allows you to create and manage notifications in multiple languages.

**How many days prior to the order is the upcoming order email sent?**

To decide how many days before the upcoming order email will be sent, please configure it via: **Loop > Settings > Notifications > Preferences**.

**A customer reports that they are not receiving email notifications for their upcoming subscription orders. What could be causing this, and how can we resolve it?**

To investigate the missing email notifications for upcoming subscription orders, please go to Loop > Subscriptions, open the customer’s subscription, and scroll down to the Activity Logs. Look for any log entries from 3 days before the upcoming order date (3 days is the default window when upcoming order/payment notification emails are sent).

*   If you see the log entry, it means the email was successfully sent.
*   If there is no log entry, then the notification may not be enabled.
*   To ensure these emails are being triggered, go to **Loop > Settings > Notifications** and verify that the Upcoming Order email checkbox is enabled. This will send the emails using Loop’s native email system.
*   If you are using a third-party email provider such as Klaviyo or Omnisend, please make sure the corresponding flows/campaigns are active and correctly set up there.
*   For better tracking, you can also enable Admin Emails under **Loop > Settings > Notifications – Admin Emails**. This will send you a copy of each notification sent to customers.
