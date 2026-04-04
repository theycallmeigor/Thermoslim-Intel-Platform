---
title: "Expired/Voided payment status orders on Shopify"
source_url: "https://help.loopwork.co/en/articles/12729525-expired-voided-payment-status-orders-on-shopify"
collection: "Manage subscriptions"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, manage-subscriptions]
---

# Expired/Voided payment status orders on Shopify

Learn how Loop manages Shopify's expired or voided payment orders, ensuring clear failure tracking and accurate subscription reporting for your store.

Shopify assigns an Expired payment status when a payment is not captured before the date set by the payment provider. Loop ensures expired or voided orders are marked clearly as failed, making subscription reporting more reliable.

## Shopify expired/voided payment status definitions

- **Expired**: Payment wasn't captured before the date that was set by the payment provider on an order that had the Authorized payment status. Some payment providers use the Expired status to indicate they were unable to process the payment.
- **Voided**: An unpaid order was manually cancelled.

Reference: [Shopify Help Article — Order Status](https://help.shopify.com/en/manual/fulfillment/managing-orders/order-status)

## How Loop handles these orders

Whenever Shopify flags an order with an Expired/Voided status, Loop performs the following actions:
- The billing attempt is marked as **failed** in Loop
- The order status is marked as **failed**
- The order is assigned a **failure reason** so brands can identify why it failed

This ensures that expired or voided orders do not remain stuck in a pending state and are permanently closed out as failed.

## Failure reasons on Loop

Loop introduces internal failure reasons to categorize expired or voided orders:

**Order stuck in pending**
- The order remained in Pending financial status beyond the duration configured in your Pending payments handling settings
- Since Shopify never moved the order from Pending to Paid, Loop assumes the order is bound to fail and marks it accordingly

**Order expired or voided**
- Shopify directly set the financial status to Expired or Voided
- Loop records this as a failed order under this reason

## Permanent failure status

Expired or voided orders are permanently marked as `FAILED_WITH_NO_RETRY` in Loop:
- Prevents unnecessary retries for an order that cannot be recovered
- Ensures retry logic only applies to orders where recovery is possible (e.g., failed credit card payments)
- Keeps subscription records clean by excluding expired/voided orders from future billing attempts

## How to handle these orders

**Do not fulfill** orders marked as Expired or Voided in Shopify. These orders cannot be recovered or charged, and fulfilling them would result in revenue loss since payment was never captured.

## External Links Found

- https://help.shopify.com/en/manual/fulfillment/managing-orders/order-status
- https://help.loopwork.co/en/articles/12711171-recovery-via-retries
- https://help.loopwork.co/en/articles/12712734-payment-errors
- https://help.loopwork.co/en/articles/12741921-payment-analytics-v1

## Images/Diagrams

- No images in this article
