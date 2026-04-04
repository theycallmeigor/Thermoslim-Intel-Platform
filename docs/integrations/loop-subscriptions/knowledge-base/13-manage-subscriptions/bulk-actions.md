---
title: "Bulk actions"
source_url: "https://help.loopwork.co/en/articles/12729740-bulk-actions"
collection: "Manage subscriptions"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, manage-subscriptions]
---

# Bulk actions

Learn how to use Loop's bulk actions to efficiently update, swap, or tag multiple subscriptions at once—saving time and effort.

## What is the bulk actions feature?

Loop allows you to take the following bulk actions on specific or all subscriptions/subscribers:

**For Subscriptions** — actions based on subscription, product & order:

| Subscription based | Product based | Order based |
|-------------------|---------------|-------------|
| Add discount | Swap product(s) | Charge order |
| Remove discount | Remove product(s) from subscription | Skip order |
| Change subscription status | Remove product(s) one time | Reschedule order |
| Remove anchor | Add product(s) as subscription | Delay order |
| Add/Update anchor | Add product(s) one time | Recalculate shipping |
| Change subscription plan | | |

**For Subscribers**: Add or Remove customer tags.

> No notification is triggered to the subscribers except for 'Change subscription status', where you can opt to notify your customers.

## Why bulk actions?

Use cases:
- Swap a discontinued product with a relevant product from your current catalog
- Reward loyal subscribers by swapping to an upgraded product
- Surprise subscribers by adding a gift as a one-time option
- Remove an out-of-stock product one-time from subscriptions
- Update subscribers' tags in bulk
- Remove a discontinued discount code

## How to run bulk actions

1. Go to Loop > Subscriptions > Bulk actions > Create new action
2. Choose the entity — 'Subscription' or 'Customer' you want to take action on
3. Select all or specific subscriptions/customers to be impacted:
   - **All subscriptions**: The action will be taken on all subscriptions
   - **Specific subscriptions**: Choose from a list of multiple conditions to target specific subscriptions
4. Decide the actions you want to run for the selected cohort. Note: Multiple swapping works only if the discount setting is the same for all swaps
5. Optionally add an email to get notified after completion. Save configurations
6. On bulk actions page, click **Run action** to initiate

> We recommend running bulk actions during the least storefront activity hour to avoid conflicting updates.

## How to track and manage bulk actions

Filter actions on the bulk actions page by:
- **Date range**: Select a specific time period
- **Action created by**: Filter actions created via admin or system
- **Actions taken**: Narrow down by type of changes made
- **Status**: View whether actions are created, in progress, canceled, completed, etc.

## FAQs

**How can I cancel or pause multiple subscriptions at once?**
Perform a bulk action on the required subscriptions and update their status. Navigate to Tools & Apps > Bulk actions > Create Bulk Action.

**How can I delay all my orders by 7 days?**
Use Bulk Actions via: Loop > Tools & Apps > Bulk Actions.

**Is it possible to replace old products with new ones for all subscriptions?**
Yes, use the Bulk Action menu in Loop > Tools & Apps > Bulk Actions.

**How to run a bulk action without notifying a customer?**
Check off the 'Notify Custom Button' in the bulk action screen while creating a bulk action.

**How to expire selected subscriptions?**
Navigate to: Bulk action > Change subscription status

## External Links Found

- https://help.loopwork.co/en/collections/16646422-frequently-asked-questions-faqs

## Images/Diagrams

- Screenshot: Subscribe/Customer entity selection screen for bulk action
- Screenshot: Subscription selection screen (All vs. Specific)
- Screenshot: Action configuration screen
- Screenshot: Email notification and save configuration screen
- Screenshot: Bulk actions page with "Run action" button
