---
title: "Pause/Resume subscription"
source_url: "https://help.loopwork.co/en/articles/12709691-pause-resume-subscription"
collection: "Customer portal"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, customer-portal]
---

# Pause/Resume subscription

Learn how to enable and manage pause and resume options in Loop, giving subscribers flexibility while maintaining consistent engagement and retention.

## Enabling the pause setting

**Prerequisite:** The customer must have an active subscription on Loop.

1. Navigate to **Loop > Customer portal > Preferences** and scroll down to the pause subscription section
2. Enable "Allow customers to pause/resume subscription from customer portal" and click Save
   - Note: Disabling this option prevents customers from pausing/resuming from the customer portal, but does not affect the pause/resume option in the admin portal (which remains enabled by default)
3. Enable "Pause subscription intervals" to configure options such as defining pause intervals and setting how pause duration is calculated

## Pause subscription intervals options

- **Setting intervals**: Control pause duration by allowing customers to choose from up to three predefined durations (days, weeks, months, or years)
- **Custom duration**: Allow customers to choose a date from when they want their subscriptions to be resumed, within the defined number of days
- **Pause duration calculated from:**

| Option | Behavior | Example |
|--------|----------|---------|
| When subscription is paused | Pause starts from the day it is paused | Paused on May 29 for 1 month → next order June 29 |
| When subscription was going to be charged | Pause calculated from the next order date | Paused on May 29 for 1 month, next order was June 26 → next order July 26 |

> If anchor-level settings are defined in the selling plan, pause/resume dates are also calculated based on those settings.
> If "Pause subscription intervals" is disabled, the customer can pause indefinitely until they choose to resume.

## What happens when a subscription is paused?

No recurring charges will be applied until the subscription returns to an active state.

- **Pause without auto-resume**: Subscription remains paused indefinitely. Upcoming orders are cleared from Loop (including skipped orders). They repopulate once the contract is resumed.
- **Pause with auto-resume**: Subscription remains paused for the specified duration, then automatically resumes. The subsequent billing date is displayed to both the merchant and customer.

## Charge on resume setting

When a customer resumes their paused subscription, control how billing is handled:

- **Charge immediately**: Subscription charges right away upon resuming. For anchor-based subscriptions, orders are preponed to the nearest anchor date.
- **Charge only if the next order date has passed**: Only processes a charge if the scheduled next order date is already in the past. Prevents immediate billing if the subscription is still within its normal cycle.
- **Charge immediately regardless of the next order date**: Billing happens instantly when the subscription resumes, no matter when the next order was scheduled.

## Pause from the customer portal

1. Navigate to the Customer Portal > Locate the desired subscription > Click "view details"
2. Scroll to the bottom and locate the Pause subscription button and click it
3. Select the desired pause duration interval (next order date updates automatically)
4. Click Confirm — the subscription is paused. Customer can resume anytime by clicking "Resume subscription"

## Pause from the admin portal

1. Navigate to **Loop > Subscriptions** and click on the subscription ID
2. Click the Pause button in the top right corner, select the desired pause duration, and click Confirm
   - To pause indefinitely: select "No, this subscription will not be auto-resumed"
   - Admins can choose whether or not to notify the customer about the change
3. The subscription is paused. Admin can resume at any time by clicking the Resume button

## FAQs

**How can I resume a subscription that is in paused state?**
- If no auto-resume: Manually resume from Customer Portal ("Resume subscription" button) or from Admin Portal (Loop > subscriptions > click subscription > Resume)
- If auto-resume is enabled: Subscription automatically reactivates on the configured date

## External Links Found

- https://help.loopwork.co/en/articles/12714028-skip-upcoming-order
- https://help.loopwork.co/en/articles/12714037-reschedule-an-upcoming-order
- https://help.loopwork.co/en/articles/12742185-zapiet
- https://help.loopwork.co/en/articles/12769114-run-campaigns-via-loop
