---
title: "Delete customer data from Loop"
source_url: "https://help.loopwork.co/en/articles/12729572-delete-customer-data-from-loop"
collection: "Manage subscriptions"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, manage-subscriptions]
---

# Delete customer data from Loop

Learn how to securely delete customer data in Loop to maintain privacy, comply with regulations, and uphold customer trust.

## Why is it important?

- Ensures compliance with data protection regulations like GDPR and other privacy regulations
- Builds trust by giving customers control over their personal information
- Reduces the risk of storing unnecessary or outdated customer data
- Protects the brand from potential data misuse or privacy-related issues
- Helps maintain a clean and organized customer database

## How to delete customer data?

**Understand Shopify's limitations**: Customer profiles cannot be fully deleted if they have ever had a subscription, even if those subscriptions are canceled or expired. This behavior is expected by Shopify to maintain accurate order and chargeback history.

Steps to delete customer data:

1. Navigate to **Shopify admin > Customer > Open the desired profile > More actions > Erase personal data**
2. A dialogue box will appear displaying the data that will be erased. Shopify takes 10 days to complete (with the option to cancel the request). Reference: [Shopify's processing of customer data requests](https://help.shopify.com/en/manual/privacy-and-security/privacy/processing-customer-data-requests)
3. Shopify will send the webhook to Loop once the data is deleted on their end, ensuring real-time processing

## Data deletion process on Loop side

Loop supports auto-deletion of customer PII data when Shopify sends the request to erase customer data. As part of customer redaction, the following data is obfuscated:

**Customer data:**
```
first name: Anonymous
last name: Customer
phone: ""
email: [anonymized]
contact_email: [anonymized]
```

**Address data (including subscriptions and orders):**
```
first name: Anonymous
last name: Customer
phone: ""
address1: ""
address2: ""
zip: ""
```

**Customer payment methods** → Will be deleted from Loop DB

When a customer is redacted, a "Deleted" badge will show on the subscription details page to inform the merchant about customer PII data removal from Loop.

## External Links Found

- https://help.shopify.com/en/manual/privacy-and-security/privacy/processing-customer-data-requests

## Images/Diagrams

- Screenshot: Shopify admin Customer profile > More actions > Erase personal data
- Screenshot: Data erasure confirmation dialogue box
- Screenshot: Loop subscription details page showing "Deleted" badge after customer redaction
