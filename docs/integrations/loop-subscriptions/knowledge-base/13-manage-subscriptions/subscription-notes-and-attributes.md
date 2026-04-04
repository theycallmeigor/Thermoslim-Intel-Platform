---
title: "Subscription notes and attributes"
source_url: "https://help.loopwork.co/en/articles/12713426-subscription-notes-and-attributes"
collection: "Manage subscriptions"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, manage-subscriptions]
---

# Subscription notes and attributes

Learn how to use subscription notes and attributes in Loop to capture custom details for personalization, gifting, and better order management.

Subscription notes and attributes allow brands to capture additional information about a subscriber's order. These fields are useful for custom requirements such as personalization, gifting, delivery instructions, or internal use cases like tagging or tracking. This data is stored at the subscription level and can be used to better manage fulfillment and customer experience.

## What are subscription notes and attributes?

**Subscription notes** are specific messages or instructions added by the customer at the time of purchase. These might include requests for special handling, shipping instructions, gift messages, or any other detail the customer wants the brand to consider while fulfilling the order. These notes can be collected during checkout and can also be added later from the customer portal.

**Attributes** are predefined fields used to capture structured information related to an order. These could include product variations like size or color, delivery preferences, shipping methods, or internal tags (like upsell ID, checkout link ID) used for inventory, fulfillment or internal debugging purposes. Attributes occur in Key-Value pairs.

Common use cases:
- **Customization requests**: Personalized product modifications like engraving, embroidery, or custom packaging
- **Shipping instructions**: Special delivery instructions, e.g., "Leave the package at the back door"
- **Fraud prevention**: Flag suspicious orders using criteria like mismatched shipping/payment details
- **Inventory Management**: Tracking product variants (size, color, SKU) for accurate fulfillment
- **Reporting & Analytics**: Track Total order volume, Revenue contribution per product, Average order value

## Using Loop admin

1. Navigate to Loop admin and search for the customer's "Subscription ID" in the Subscriptions tab
2. Go to order notes, click on the Edit button, add the note, and save
3. Go to additional details, click on the Edit button, "Add the attributes" and save

When the next order is processed, the added notes and attributes will also appear in the corresponding Shopify order details.

## Using customer portal

**Prerequisites:** To allow subscribers to add notes to their subscription, enable the relevant setting in the customer portal. Navigate to Loop > Customer portal > Preferences > Subscription actions and turn on the **Add/edit order notes** option.

1. Subscriber logs in to the customer portal and clicks on the Edit button in the order notes section
2. Add the order note and click on confirm

## Auto-update order notes feature

To maximize effectiveness, brands can leverage the Auto-update feature powered by Loop. Navigate to Loop > Settings > Auto-updates > Auto-update order notes.

| Setting | Description |
|---------|-------------|
| Clear order notes when the subscription is created | Useful when the note created on the checkout order is not relevant for recurring orders |
| Clear order notes when a recurring order is processed | Useful when order notes are only valid for 1 order |
| Clear specific order attributes when the subscription is created | Add specific attribute field names to remove from future recurring orders |

## Line item attributes

Line item attributes are custom data fields attached to individual lines within a subscription contract. For example, if a product was purchased through a Kaching bundle, it will carry a Kaching-related attribute. When a product is added as a one-time purchase to a subscription, it includes a one-time attribute.

**Auto-update subscription line item attributes**: Navigate to Loop > Settings > Auto-updates > Auto-update subscription line item attributes.

| Setting | Description |
|---------|-------------|
| Clear subscription line item attributes when the subscription is created | Removes checkout-specific attributes from future recurring orders |
| Clear subscription line item attributes when a recurring order is processed | Clears attributes after each successful order |
| Clear specific subscription line item attributes when the subscription is created | Remove specific named attributes only |

> **Note 1:** Loop-specific line item attribute keys cannot be updated or removed using these preferences.
> **Note 2:** Do not remove required attributes used by third-party apps such as Zapiet.

## External Links Found

- https://help.loopwork.co/en/articles/12657742-subscription-overview
- https://help.loopwork.co/en/articles/12729851-gift-subscriptions
- https://help.loopwork.co/en/articles/12732642-subscription-tags

## Images/Diagrams

- Screenshot: Loop admin Subscriptions tab with search by Subscription ID
- Screenshot: Order notes edit interface in Loop admin
- Screenshot: Additional details / attributes edit interface
- Screenshot: Customer portal order notes edit interface
