---
title: "Bundles overview"
source_url: "https://help.loopwork.co/en/articles/12729045-bundles-overview"
collection: "07-bundles"
scraped_at: "2026-03-30T17:43:20.527Z"
tags: ["07-bundles"]
---



Using **Loop bundles**, customers can easily select different products or variants and combine them into a single bundle or box, offered as a subscription or a one-time purchase. Post-purchase, they can manage everything from bundle contents to delivery frequency right from the customer portal. In this article, we’ll walk you through how to set up Loop bundles and guide you through all the configuration options available to get you up and running smoothly.

Check out our bundle experience available on our demo store [here](https://demo.loopwork.co/a/loop_subscriptions/bundle/aa65a60fb9a2495ebc28651378f8c69f).

* * *

# Types of bundles in Loop

You can set up two types of bundles using Loop, depending on how much flexibility you want to offer your customers.

1.  **Preset bundle**: With 'Preset fixed bundle' you can offer your customers a pre-selected set of items or variants. Once purchased, the contents of this bundle cannot be modified either during checkout or after purchase. It's an excellent option for those who trust in the curated selection provided and do not wish to make any changes.
    

Learn more about [Preset Fixed Bundles](https://intercom.help/loop-subscriptions/en/articles/12729092-preset-fixed-bundle).

1.  **Build your own bundle (BYOB)**: With ‘Build your own bundle’, you can empower your customers with the choice to build their own bundles from the list of products that you provide. This not only enhances customer engagement but also allows them to tailor their purchases to their specific needs. Plus, the ability to edit their bundles post-purchase through the customer portal adds a layer of flexibility, encouraging customer satisfaction and retention.
    

Learn more about [Build your own bundles](https://intercom.help/loop-subscriptions/en/articles/12741075-build-your-bundle).

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1809953505/c4278eb1bd5c499ed556730fc24d/original?expires=1774894500&signature=9074d50c47b652dc432b5c1897970cdea4aa97932f575360eff9c9ecbba4fd1c&req=dSgnH8B7noRfXPMW1HO4zRypAkXVc6JIPhB7pKRMlM%2B8dxGJGpua0Dx4o1%2BH%0AzXoZl%2BJ9GTmTEqWPZeI%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1809953505/c4278eb1bd5c499ed556730fc24d/original?expires=1774894500&signature=9074d50c47b652dc432b5c1897970cdea4aa97932f575360eff9c9ecbba4fd1c&req=dSgnH8B7noRfXPMW1HO4zRypAkXVc6JIPhB7pKRMlM%2B8dxGJGpua0Dx4o1%2BH%0AzXoZl%2BJ9GTmTEqWPZeI%3D%0A)

* * *

# Installing bundle snippets

Bundle snippet is a critical piece of code designed to club bundle product items on the cart under a single bundle title rather than as individual line items. This is also necessary to ensure that customers don't end up with invalid bundle content by removing/adding individual bundle items from the cart.

Follow the steps below to add bundle snippets in your store theme code.

1.  Navigate to **Loop > Bundles > Snippets**. Select the theme where you want to publish your bundle and click on the "Install bundle snippet" button.
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2171297416/954c5badc8c3e81045efd2fc3018/image.png?expires=1774894500&signature=212dab4ecb21ab2f521d316c88e0375e343b3a760077b8f158741eea6dc5fe32&req=diEgF8t3moVeX%2FMW1HO4zV7b8z%2FyBcql%2BUrIa9njYoO3YNUZ5G5SkbyhPP4q%0Ag2Jl%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2171297416/954c5badc8c3e81045efd2fc3018/image.png?expires=1774894500&signature=212dab4ecb21ab2f521d316c88e0375e343b3a760077b8f158741eea6dc5fe32&req=diEgF8t3moVeX%2FMW1HO4zV7b8z%2FyBcql%2BUrIa9njYoO3YNUZ5G5SkbyhPP4q%0Ag2Jl%0A)
    
      
    This will create a **loop\_bundle.js** file in your theme code.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1810247384/35c4d7c246a3bb7c86c72a43cd25/9097223e-01c7-4e4c-8b56-b733ba_uvokyf.png?expires=1774894500&signature=74fd4451cd52d5164a895063ca9b5c0850364505b536ad5d316ea1db48d842c1&req=dSgmFst6moJXXfMW1HO4ze5P7hxpB4dIvRlIti1ld3tDM8WTf8H7r1jPcVsk%0AygAj%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1810247384/35c4d7c246a3bb7c86c72a43cd25/9097223e-01c7-4e4c-8b56-b733ba_uvokyf.png?expires=1774894500&signature=74fd4451cd52d5164a895063ca9b5c0850364505b536ad5d316ea1db48d842c1&req=dSgmFst6moJXXfMW1HO4ze5P7hxpB4dIvRlIti1ld3tDM8WTf8H7r1jPcVsk%0AygAj%0A)
    
2.  Now next step is to add the bundle cart snippet. Click on "**Add bundle cart snippet**" to install. This will combine the bundle items into a single bundle product on your Cart page.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1810248533/283a65b214c609df177fc1e938b1/d6b5da05-e1e0-4761-a848-1cc740_107ij9a.png?expires=1774894500&signature=f83cf8df103bced9012cd6dc57987bb0fb194e355010c6cd2837dc434085c990&req=dSgmFst6lYRcWvMW1HO4zVxuyk%2B35EcmeBk9FzeuauPqzlwTP2d9IsJMQ69K%0AxJzP%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1810248533/283a65b214c609df177fc1e938b1/d6b5da05-e1e0-4761-a848-1cc740_107ij9a.png?expires=1774894500&signature=f83cf8df103bced9012cd6dc57987bb0fb194e355010c6cd2837dc434085c990&req=dSgmFst6lYRcWvMW1HO4zVxuyk%2B35EcmeBk9FzeuauPqzlwTP2d9IsJMQ69K%0AxJzP%0A)
    
      
    If your card snippet is not working, you can get in touch with our support team to further debug.  
    ​
    
    [![](https://downloads.intercomcdn.com/i/o/kmcpsev1/2171300970/be4cf23e555a289f07b5a9c6300e/image.png?expires=1774894500&signature=2c86614b660b7cc6ca196cddef3e5e43e92a6df599b790c4e52641fe3cce6423&req=diEgF8p%2BnYhYWfMW1HO4zRnroZ8y0tdSC1VWZhICKnvKiXzbEiYS5lUY1W2W%0Avnf3%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/2171300970/be4cf23e555a289f07b5a9c6300e/image.png?expires=1774894500&signature=2c86614b660b7cc6ca196cddef3e5e43e92a6df599b790c4e52641fe3cce6423&req=diEgF8p%2BnYhYWfMW1HO4zRnroZ8y0tdSC1VWZhICKnvKiXzbEiYS5lUY1W2W%0Avnf3%0A)
    

* * *

# Bundle preferences

Bundle preferences are grouped into sections based on the part of the bundle experience they control. These settings help brands decide how bundles should appear across the product page, cart, and checkout, and how much clarity customers should get while building or purchasing a bundle.

This section can be useful when a brand is deciding how they want the bundle journey to behave before going live.

1.  ## General preferences
    

These settings control how bundle information is shown across the storefront and checkout.

*   **Show bundle name on checkout:**
    
    *   Enable this setting to display the bundle name with each bundled product on the checkout page.
        
    *   This helps customers understand that the items were added as part of one bundle purchase, especially when child products appear as separate line items at checkout. It is useful for brands that want a clearer checkout experience and better visibility into bundled items.​
        
    
*   **Hide bundle selling plans:**
    
    *   Enable this setting to hide bundle-related selling plans from individual product pages.
        
    *   This is useful when the brand wants customers to access bundle purchase options only through the dedicated bundle flow. It helps keep the buying journey clean and avoids confusion between standalone products and bundle offers.
        
    

## 2\. Preset bundle

These settings apply to preset bundles and define how the bundle is represented during checkout.

*   **Configure preset bundle checkout experience:** This setting decides whether checkout should begin with the parent bundle product or with the individual child products inside the bundle.
    
    *   **Checkout with parent bundle product directly:** The customer checks out with the parent bundle product. Loop then edits the checkout order to add the child products in the required quantities at zero value.
        
        This option is useful when the brand wants the bundle to feel like one main product during the purchase flow and in their order details.
        
    *   **Checkout with bundle child products:** The customer checks out with the individual child products that make up the bundle.
        
        Loop bundle snippets can still group these items on the cart page, but during checkout, each product is shown separately. This is useful for brands that want more visibility into each bundled item.
        
    

## 3\. Build your bundle

These settings apply to the Build your bundle experience.

*   **Out of stock products handling:** Controls how unavailable products are shown on the bundle page.
    
*   **Show as disabled:** Out-of-stock products remain visible but cannot be selected.
    
*   **Show product description drawer:** Displays the full product description in a drawer when a customer clicks on the product image.
    
*   **Selected products drawer (Legacy experience):** These settings apply only to the legacy selected products drawer experience.
    
*   **Auto-open selected products drawer on first product addition:** Automatically opens the selected products drawer when the first product is added. If disabled, customers need to click **Show** to open it manually.
    
*   **Display one card per product variant on bundle drawer:** Controls how selected items are grouped inside the drawer. When enabled, each selected variant is shown as a separate card.
    

* * *

# Custom bundles using Loop APIs

Loop custom bundles allow brands to create flexible bundle purchase experiences on their storefront. Developers can use Loop bundle APIs to power both preset bundle purchases and Build your own bundle (BYOB) experiences.

*   [Custom widget preset bundles setup](https://developer.loopwork.co/docs/custom-preset-bundle-setup) : This guide explains how to pass child SKUs when adding a preset bundle to cart while building your own custom widget to sell subscriptions instead of using the Loop widget.
    
*   [Sell and edit BYOB using storefront bundle APIs](https://developer.loopwork.co/docs/sell-and-edit-byob-using-storefront-bundle-apis) - This guide explains how to implement a custom build your own bundle (BYOB) experience using Loop bundle APIs to sell and update subscription bundles from a custom storefront experience.
    

* * *

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#c8bbbdb8b8a7babc88a4a7a7b8bfa7baa3e6aba7) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Preset fixed bundle

](https://help.loopwork.co/en/articles/12729092-preset-fixed-bundle)[

Build your bundle

](https://help.loopwork.co/en/articles/12741075-build-your-bundle)[

Install bundle snippets manually

](https://help.loopwork.co/en/articles/12741237-install-bundle-snippets-manually)[

Bundle JavaScript events & window variables for custom experience

](https://help.loopwork.co/en/articles/12741415-bundle-javascript-events-window-variables-for-custom-experience)[

Bundles FAQs

](https://help.loopwork.co/en/articles/12858139-bundles-faqs)
