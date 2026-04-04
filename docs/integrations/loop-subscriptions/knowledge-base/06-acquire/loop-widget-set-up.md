---
title: "Loop widget set up"
source_url: "https://help.loopwork.co/en/articles/12729262-loop-widget-set-up"
collection: "Acquire"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, acquire]
---

# Loop widget set up

Guide for installing the Loop subscription widget on Shopify themes.

### App-Block Based (Shopify 2.0)

Requires no coding.
1.  Navigate to **Loop > Acquire > Widget > Create new widget**.
2.  Use the **"Add app block"** button to open the Shopify editor.
3.  Place the Loop widget block in your product template.

### Manual Installation (Shopify 1.0 or Custom)

1.  Download Loop snippets and assets.
2.  Update the `<head>` section of `theme.liquid`.
3.  Insert the `{% render 'loop-subscriptions', ... %}` tag into the relevant product templates.

### Verification

Once installed, select "Subscribe" on a product page and check the checkout page for the subscription-related line properties.

## External Links Found

- [support@loopwork.co](mailto:support@loopwork.co)

## Images/Diagrams

- **Storefront View:** Radio button widget example.
- **Widget Builder:** Tabs for Styles, Preferences, and Texts.
- **Theme Mapping Status:** Screenshot showing theme sync.
- **App Block Placement:** Shopify Theme Editor block placement visual.
