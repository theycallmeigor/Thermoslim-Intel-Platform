---
title: "Adding Loop widget to non-product pages"
source_url: "https://help.loopwork.co/en/articles/12729227-adding-loop-widget-to-non-product-pages"
collection: "Acquire"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, acquire]
---

# Adding Loop widget to non-product pages

Allows embedding the Loop widget on collection pages, landing pages, or featured product sections.

### Prerequisites

*   The theme must have Loop's code files.
*   The page must have an **"Add to Cart"** form.

### Installation Steps

1.  Add the script to `theme.liquid` before the `</head>` tag:
    ```html
    <script type="text/javascript" id="loop-subscription-script" src="{{ 'loop-widget.js' | asset_url }}"></script>
    </head>
    <style class="loop-style"> {% render 'loop-widget.css.liquid' %} </style>
    ```
2.  Render the snippet in the relevant file (e.g., `product-form.liquid`):
    ```liquid
    {% render 'loop-subscriptions', type: 'product-widget', product: product %}
    ```

## External Links Found

- [loop_subscriptions.liquid](https://cdn.loopwork.co/internal/assets/loop-subscriptions.liquid)
- [loop_loader.liquid](https://cdn.loopwork.co/internal/assets/loop_loader.liquid)
- [loop_widget.js](https://cdn.loopwork.co/internal/assets/loop-widget.js)

## Images/Diagrams

- **Button Class Identification:** Screenshot showing how to inspect the button class.
- **Code Placement:** Visual guide for where to insert the render tag.
- **File Search:** Screenshot of theme file structure.
