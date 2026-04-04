---
title: "Recovery via backup payment method"
source_url: "https://help.loopwork.co/en/articles/12712565-recovery-via-backup-payment-method"
collection: "Retain"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, retain]
---

# Recovery via backup payment method

Ensures subscription revenue flows when a primary card fails by retrying the charge on a secondary card.

### Configuration

Navigate to **Loop Admin > Retain > Payment Recovery > Retry Settings > Backup payment method**.

*   **Master Switch:** Enable the feature.
*   **Auto-configure:** Automatically assigns a backup if multiple cards are saved.

### How it Works

*   If the primary method fails and a backup exists, Loop **immediately retries on the backup card** for the first attempt.
*   If successful, future charges revert to the primary method.
*   If both fail, Loop follows the standard dunning logic on the primary card.

### Management

*   **Admin Portal:** Add backup cards, switch backup to primary, or delete cards.
*   **Customer Portal:** Subscribers can manage cards under **Payment Details > Manage**.

## External Links Found

- [Recovery via retries](https://help.loopwork.co/en/articles/12711171-recovery-via-retries)
- [Payment errors](https://help.loopwork.co/en/articles/12712734-payment-errors)
- [Update payment methods](https://help.loopwork.co/en/articles/12729474-update-payment-methods)

## Images/Diagrams

- **Backup payment method settings:** Admin interface.
- **Behavior scenarios table:** Comparison of enabled vs. disabled states.
- **Customer Portal interface:** Screenshot of card management.
