---
title: "Customer portal FAQs"
source_url: "https://help.loopwork.co/en/articles/12858156-customer-portal-faqs"
collection: "15-faq"
scraped_at: "2026-03-30T17:43:23.938Z"
tags: ["15-faq"]
---



#### How to upload or update the banner image in Customer Portal (or update a custom section)?

To upload or update the banner image in your Customer Portal > Upsell section:

1.  Go to your Shopify admin > Content > Files > Upload a file from the 'Upload file' section.
    
2.  Copy the links of these files.
    
3.  Navigate to Loop > Customer Portal > Theme > Layout > Click the Upsell section you have created.
    
4.  In the update custom section pop-up, open 'Code View' and replace the image for mobile and desktop in the code. (Please paste this HTML code if you don't already have it)
    
5.  Save and click 'View' to open the Customer Portal.  
    ​
    

<!-- Loop Responsive Banner Start -->  
<div>  
  <!-- Desktop Banner Image -->  
  <img  
    src="pc\_image\_link\_here"  
    alt="Loop Desktop Banner"  
    style="width: 100%;"  
    class="loop-desktop-banner"  
  >  
  <!-- Mobile Banner Image -->  
  <img  
    src="mobile\_image\_link\_here"  
    alt="Loop Mobile Banner"  
    style="width: 100%;"  
    class="loop-mobile-banner"  
  >  
</div>  
<style>  
  /\* Hide desktop banner on screens 768px or less \*/  
  @media only screen and (max-width: 768px) {  
    .loop-desktop-banner {  
      display: none;  
    }  
  }  
  /\* Hide mobile banner on screens wider than 768px \*/  
  @media only screen and (min-width: 768px) {  
    .loop-mobile-banner {  
      display: none;  
    }  
  }  
</style>  
<!-- Loop Responsive Banner End -->​

#### How to correctly insert a video into the benefits on cancellation flow?

Here's the ideal way of adding the video to the benefits page:

1.  Upload the video in Shopify > Files and copy its URL.
    
2.  In Loop > Cancellation flows > Benefits page > Click on code editor in body content > Add the URL code like
    
    <meta charset="UTF-8">&nbsp;  
    <meta name="viewport" content="width=device-width, initial-scale=1.0">  
    <title>Subscription Benefits</title>  
    <style>  
    body {  
    font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;  
    }  
      
    .content {  
    max-width: 600px; margin: 0 auto; text-align: left;  
    }  
      
    video {  
    max-width: 100%; height: auto; border-radius: 10px; display: block; margin: 0 0 20px 0;  
    }  
      
    </style>  
    <div class="content"><span class="fr-video fr-deletable fr-fvc fr-dvi fr-draggable" contenteditable="false"><video id="subscriptionVideo" autoplay="" loop="" playsinline="" style="width: 249px; height: 441px;" class="fr-fvc fr-dvb fr-draggable"><source src="https://cdn.shopify.com/videos/" type="video/webm">&nbsp;Your browser does not support the video tag.</video></span>  
      
    <h2 id="isPasted">  
    <br>  
    </h2>  
    </div>  
    <script>  
      
    // Attempt to play after user interaction  
    document.addEventListener('DOMContentLoaded', function()  
    {  
    const video = document.getElementById('subscriptionVideo');  
      
    const tryPlay = () =>  
    {  
    video.play().catch(err =>  
    {  
    // Autoplay with sound may fail — fallback or message  
    console.warn('Autoplay with sound failed:', err);  
    });  
    document.removeEventListener('click', tryPlay);  
    };  
      
    // Wait for user click to allow autoplay with sound  
    document.addEventListener('click', tryPlay);  
    });  
      
    </script>
    

#### How do I add an autoplay video to the Benefits Page / Cancellation Flow page using a code?

To embed a fully responsive video on the Benefits page with autoplay enabled (not muted), along with play/pause controls.

1.  Paste the following code into the appropriate section of the Benefits page/Cancellation Flow.
    
    <style>  
      .responsive-video {  
        width: 100%;  
        max-width: 100%;  
        height: auto;  
        display: block;  
        border-radius: 8px; /\* optional \*/  
      }  
      
      .video-wrapper {  
        position: relative;  
        width: 100%;  
        max-width: 100%;  
      }  
    </style>  
      
    <div class="video-wrapper">  
      <video  
        class="responsive-video"  
        src=VIDEO\_URL\_HERE\_IN\_DOUBLE\_QUOTES  
        autoplay  
        controls  
        playsinline  
      ></video>  
    </div>
    
2.  Replace the Video Source: Update the line:
    
    src=VIDEO\_URL\_HERE\_IN\_DOUBLE\_QUOTES
    

#### How to display a responsive banner on the Flows/Customer Portal page using separate images for mobile and desktop users via code?

To display a responsive banner on the Flows/Customer Portal page using separate images for mobile and desktop users via code:  
​

1.  Make sure you have:
    
    *   Mobile Banner Image URL
        
    *   Desktop Banner Image URL
        
    *   Upload them to Shopify Files if required and copy the final URLs.
        
    
2.  Add the HTML Code: Insert the following code snippet into the appropriate section of the Flows or Customer Portal page.  
    ​
    
    <picture class="flow-image-container">  
    <!-- Mobile Image -->  
    <source   
    media="(max-width: 768px)"   
    srcset=MOBILE\_IMAGE\_URL\_HERE\_IN\_DOUBLE\_QUOTES  
    \>  
      
    <!-- Default / Desktop Image -->  
    <img   
    src=DESKTOP\_IMAGE\_URL\_HERE\_IN\_DOUBLE\_QUOTES   
    style="width:100%; height:auto;"  
    \>  
    </picture>
    
3.  Replace the Image URLs (Update the following values):
    
    1.  Replace `MOBILE_IMAGE_URL_HERE_IN_DOUBLE_QUOTES` with the mobile banner URL.
        
    2.  Replace `DESKTOP_IMAGE_URL_HERE_IN_DOUBLE_QUOTES` with the desktop banner URL.
        
    
4.  Save the Changes.
    

#### Can we change the thumbnail image that appears for the bundle and save it in the portal?

To change the thumbnail image of the bundle in the customer portal, two methods can be used:  
​  
First, you can replace the 'bundle image' directly from the Bundle section in the Loop Admin.  
The second option is to hide the hero image of the bundle using CSS (display: none) and then add your own banner within the description using HTML and CSS.  
​  
Additionally, you can update the bundle’s hero image and insert the current image in the description. By hiding the default bundle image using CSS (display: none) and replacing the hero image, the image added in the description will appear on the bundle page, while the updated hero image will be visible in the customer portal.

#### Is it possible to show Shopify product metafields in the customer portal?

To show Shopify product metafields in the Loop Customer Portal drawer, please follow these steps:

This is mainly done by:

1.  **Creating a JSON product template in Shopify**
    
    1.  Create Product JSON Template \[/templates/product.json.liquid\]
        
        1.  Shopify Admin → Online Store → Themes
            
        2.  Click ⋯ → Edit code
            
        3.  Under Templates, click Add a new template
            
        4.  Select:
            
            1.  Template type: product
                
            2.  File extension: liquid
                
            3.  File name: product.json
                
            4.  Click Create template
                
            
        
    2.  Paste the entire code below into product.json.liquid:
        
        1.  {%- layout none -%}  
            {%- assign hover\_img = product.images\[1\] -%}  
              
            {  
              "title": {{ product.title | json }},  
              "description\_raw": {{ product.description | strip\_html | json }},  
              
              "hover\_image": {% if hover\_img != blank %}  
                {{ hover\_img | image\_url: width: 800 | json }}  
              {% else %}  
                ""  
              {% endif %},  
              
              "nutrition\_fact": {{ product.metafields.custom.nutrition\_fact.value | default: "" | json }},  
              "characteristics": {{ product.metafields.custom.characteristics.value | default: "" | json }},  
              "ingredients": {{ product.metafields.custom.ingredients.value | default: "" | json }},  
              "main\_color": {{ product.metafields.custom.main\_color.value | default: "" | json }},  
              "secondary\_color": {{ product.metafields.custom.secondary\_color.value | default: "" | json }}  
            }
            
        
    3.  Metafield Mapping (IMPORTANT)
        
        1.  You MUST update these lines if metafield keys differ:
            
            product.metafields.custom.nutrition\_fact.value
            
        2.  Replace ONLY the key name
            
            nutrition\_fact
            
            characteristics
            
            ingredients
            
            main\_color
            
            secondary\_color
            
        3.  Correct format:
            
            product.metafields.custom.<YOUR\_METAFIELD\_KEY>. value
            
        4.  ⚠️ Namespace (custom) should remain unchanged unless your store uses a different namespace.
            
        
    4.  Verify Shopify JSON Output
        
        Open any product: /products/{product-handle}?view=json
        
    5.  Confirm:
        
        1.  Valid JSON
            
            Keys match what Loop JS will consume
            
            No HTML output
            
        
    
2.  **Fetching that JSON from the Loop Customer Portal**
    
    1.  Open Loop Custom JS
        
        1.  Go to Loop Admin
            
        2.  Navigate to Customer Portal
            
        3.  Open Custom JS section
            
        
    2.  Paste the Script
        
        1.  Paste the entire script below into Loop Customer Portal → Custom JS:
            
        2.   /\* Loop Drawer Metafields Injector (NO jQuery)  
               - Polls forever  
               - Waits for Loop drawer  
               - Fetches /products/{handle}?view=json  
               - Injects metafields under product title  
            \*/  
              
            (function () {  
              function escapeHtml(v) {  
                return v  
                  ? String(v)  
                      .replaceAll("&", "&amp;")  
                      .replaceAll("<", "&lt;")  
                      .replaceAll(">", "&gt;")  
                      .replaceAll('"', "&quot;")  
                      .replaceAll("'", "&#039;")  
                  : "";  
              }  
              
              function render(d) {  
                if (!d) return "";  
               var nutrition = (d.nutrition\_fact || "").trim();  
                var characteristics = (d.characteristics || "").trim();  
                var ingredients = (d.ingredients || "").trim();  
                var mainColor = (d.main\_color || "").trim();  
                var secondaryColor = (d.secondary\_color || "").trim();  
              
                var html = "";  
              
                if (characteristics)  
                  html += \`<div class="loop-text-p2 mt-2"><strong>Characteristics:</strong> ${escapeHtml(characteristics)}</div>\`;  
              
                if (ingredients)  
                  html += \`<div class="loop-text-p2 mt-2"><strong>Ingredients:</strong> ${escapeHtml(ingredients)}</div>\`;  
              
                if (mainColor || secondaryColor)  
                  html += \`<div class="loop-text-p2 mt-2"><strong>Colors:</strong> ${escapeHtml(mainColor)}${mainColor && secondaryColor ? " / " : ""}${escapeHtml(secondaryColor)}</div>\`;  
              
                if (nutrition) {  
                  var isUrl = /^https?:\\/\\//i.test(nutrition);  
                  html += \`<div class="loop-text-p2 mt-2"><strong>Nutrition facts:</strong> ${  
                    isUrl ? \`<br><img src="${escapeHtml(nutrition)}" style="max-width:300px;" />\` : escapeHtml(nutrition)  
                  }</div>\`;  
                }  
              
                return html;  
              }  
              
              function findTitle(drawer) {  
                var titles = drawer.querySelectorAll(".loop-drawer-body .loop-h2");  
                for (var i = 0; i < titles.length; i++) {  
                  var t = titles\[i\].textContent.trim().toLowerCase();  
                  if (t && t !== "edit product") return titles\[i\];  
                }  
                return null;  
              }  
              
              function inject(drawer, data) {  
                var title = findTitle(drawer);  
             if (!title) return false;  
              
                drawer.querySelectorAll(".drawer-metafields-block").forEach(n => n.remove());  
              
                var html = render(data);  
                if (!html) return false;  
              
                var block = document.createElement("div");  
                block.className = "drawer-metafields-block";  
                block.innerHTML = html;  
              
                title.insertAdjacentElement("afterend", block);  
                return true;  
              }  
              
              var cache = {};  
              var inflight = {};  
              
              function fetchJson(handle, cb) {  
                if (cache\[handle\]) return cb(cache\[handle\]);  
                if (inflight\[handle\]) return inflight\[handle\].push(cb);  
              
                inflight\[handle\] = \[cb\];  
              
                fetch(\`/products/${handle}?view=json\`, { credentials: "same-origin" })  
                  .then(r => r.json())  
                  .then(j => {  
                    cache\[handle\] = j;  
                    inflight\[handle\].forEach(fn => fn(j));  
                    delete inflight\[handle\];  
                  })  
                  .catch(() => {  
                    inflight\[handle\].forEach(fn => fn(null));  
                    delete inflight\[handle\];  
                  });  
              }  
              
              setInterval(() => {  
                var drawer = document.querySelector(".loop-drawer-content\[data-product-handle\]");  
                if (!drawer || drawer.dataset.mfDone) return;  
              
                var handle = drawer.getAttribute("data-product-handle");  
                if (!handle) return;  
                fetchJson(handle, data => {  
                  if (data && inject(drawer, data)) drawer.dataset.mfDone = "true";  
                });  
              }, 250);  
            })();
            
        3.  Update Metafield Keys in JS (MANDATORY)
            
            The JS expects JSON keys:
            
            d.nutrition\_fact
            
            d.characteristics
            
            d.ingredients
            
            d.main\_color
            
            d.secondary\_color
            
        4.  If Shopify JSON uses different keys → UPDATE JS
            
            Ex: var nutrition = (d.nutrition\_information ||
            
            ""). trim();
            
        5.  ⚠️ JS keys must exactly match JSON keys from product.json.liquid
            
        6.  Final testing checklist
            
            1.  Open Loop Customer Portal
                
            2.  Open product drawer
                
            3.  Metafields appear below the product title
                
            4.  No duplicates on reopen
                
            5.  Works after navigation
                
            6.  No console errors
                
            
        
    

**High-level flow is:**

Shopify Product -> product.json. liquid (JSON response)

Loop Custom JS fetches /products/{handle}?view=json -> Metafields injected under product title in drawer

#### How can I add the customer metadata fields in the customer portal?

The merchant can find our customer fields in which they can send their customer metafields by going to Loop > open any customer portal > inspect > console > No info > Type "loopProps" > find customer fields like tag, name, email, etc.

#### Can I make different customer portals for mobile and desktop?

While Loop provides the customisation to add custom CSS and JS to the customer portal from Loop > Grow > Customer Portal > Themes > Customise, the overall layout remains the same. You are free to use the Loop Storefront API to implement a custom solution for the customer portal independently.

#### What is the recommended size for the Banner in the Customer Portal?

The recommended banner size is: Desktop: 3912 × 964 px and Mobile: 2000 × 960 px.

#### If a customer wants to change the interval of the subscription, where do we change?

To allow a customer to change the subscription interval, please go to Loop > Customer portal > Preferences > Subscription actions - Enable: Edit billing/ delivery schedule

#### Can we embed a QR code in an email that takes customers straight to their Loop Customer Portal?

We can generate a unique link for each customer that takes them to their customer portal. However, to use QR codes, you may need to use a third-party app.

#### Are “custom” delivery intervals (custom delivery frequency) possible for customers in the portal?

The customer will only see the delivery frequency options that are mapped to the product’s selling plan. If a specific frequency isn’t included in that selling plan, it will not appear as an option in the customer portal, and thus the customer won't be able to choose a custom delivery apart from what is given in the selling plan.

#### Why isn’t my customer in Singapore seeing prices in SGD on the portal for items shown during actions such as swap, upsell, or upgrade?

If a customer is in Singapore, not being able to see prices in local currency and rather in a different currency on the Customer portal, the reason might be that the primary market is set to another country, thus the portal displays all item prices in another currency and applies the appropriate exchange rates.  
​  
The customer portal uses the store’s primary market currency in which the store operates for all customers, and applies currency conversion where required.

#### How do I see the customer's view?

To see the customer's view of a subscription, go to Loop> subscriptions> click on the subscription number> click on the "Access Customer Portal" button on the right side.

#### How to put in a 'subscription' button on my website for customers to manage their subscription in their account?

If you are looking to put a 'subscription' button on your website for customers to manage their subscription in their account, you might be looking for the 'Manage Subscription' button on the customer portal.  
​  
It is very easy to achieve for a Shopify New Customer account, and can be amended via:- Loop > Customer Portal > Accessibility > Customer account page > Enable: Manage Subscription Block.

#### How do I prevent customers from creating subscriptions below the minimum order value?

To ensure customers cannot create subscriptions below your required minimum order value, set the minimum value in the customer portal. You do this by going to Customer portal > Preferences > Edit/Remove products > Minimum order value. Once configured, if a subscriber tries to create a subscription whose total order value is below that minimum, they will see an error message and will not be able to proceed.

#### Why can’t my subscriber see bundle-selling plans on child products or BYOB items during subscription creation?

When the 'Hide bundle selling plans on individual product pages' option is enabled in bundle preferences, subscribers will no longer see bundle selling plans for child items of preset bundles or for BYOB products in the subscription creation flow. Those plans are also omitted from the subscription frequency dropdown. If no other selling plans are available for a product, the frequency dropdown will be empty, and the Next button will be disabled.

#### Why are bundle-selling plans not visible on BYOB or preset bundle products in the customer portal?

If bundle selling plans are not visible on BYOB products or child items of preset bundles, it is because the setting to hide bundle selling plans is enabled.

To configure this behaviour:

1.  Go to Bundle Preferences
    
2.  Enable Hide bundle selling plans on individual product pages
    
3.  Save the changes
    

When this setting is enabled:

*   Bundle selling plans will not appear on individual product pages
    
*   Bundle selling plans will not appear in the subscription frequency dropdown
    
*   If no other selling plans are available, the dropdown will be empty
    
*   The Next button will be greyed out.
    

This ensures bundle-selling plans are restricted to bundle-level selection only.

#### How to remove products from subscription via the customer Portal?

To remove a few products from a subscription using the customer Portal,

1.  Go to Loop > Subscriptions, and open the subscription ID.
    
2.  On the right-hand side, click "Send subscription login link to customer.
    
3.  This will allow the customer to access their customer portal.
    

You can also access it on their behalf by clicking "Access customer portal" on the right side of the subscription page.  
Once in the portal:

1.  Click on the product name and then select "Edit".
    
2.  You’ll see an option to "Remove" the product.
    
3.  When removing, you’ll be prompted to choose between removing it from:  
    Just the next upcoming order (one-time removal), or  
    The entire subscription.
    
4.  Choose based on what the customer wants—or the customer can make the selection themselves.
    
5.  After removing the product(s), click "Order now" to place the order with the remaining items.(If they want to place with few items)
    
      
    Note: If you choose to remove a product one-time, it will only be excluded from the next order and will be included again in future recurring orders.
    

#### How to stop a fraudulent customer from purchasing/reactivating a subscription from the Customer Portal?

You can block or stop a customer from purchasing/reactivating a subscription from Loop by hiding the purchase button using Custom JS from their customer portal. There would be some third-party app or Fraud Control App that you can utilise for this case.  
​  
The steps you can follow are:

1.  Mark the subscription as expired from the backend so the customer cannot take any action on this subscription.
    
2.  Using a custom JS script, you can hide the "create subscription" option from the portal, so the customer cannot create a new one as well.
    

#### What could be the reason if the subscription frequency does not show while creating a subscription at the customer portal?

If the subscription frequency does not show while creating a subscription at the customer portal, please verify if the selling plan linked to the product is marked available at the customer portal from the selling plan settings.

#### I am trying to update the address on "Edit Shipping Address", but after I click on "Save", nothing changes

It seems that there may be a couple of reasons why the address is not updating after you click "Save on 'Edit Shipping Address".

1.  **Connection Issues**: The shipping address updates in the customer portal may not reflect in Shopify due to a disconnect between the customer address and subscription address. When a subscription is created, a copy of the address is added to the contract, and subsequent changes to the subscription address do not affect the address in Shopify \[1\].
    
2.  **User Interface Behaviour**: If you are clicking outside the edit address box after making changes, it may close the box without saving the updates. It's important to ensure that you explicitly click "Save" after making your changes to apply them \[2\].  
    If you are still experiencing issues, it might be helpful to check if there are any error messages or if the address is being updated in the Loop app, as that could provide more insight into the problem.
    

#### How do I make a smooth Upgrade experience for a customer via email?

Here is an example of what you can do to make the Upgrade easier for a customer.

When an eligible customer logs into the Loop customer portal, they see a promotional banner or card labelled “Upgrade your subscription.”

The banner displays:

*   The new product/plan details.
    
*   The upgrade benefits (e.g., larger quantity, better pricing, free shipping, etc.).
    
*   A one-click CTA like “Upgrade Now.”
    
*   The customer clicks “Upgrade Now”, triggering an instant modification of their active subscription:
    
*   The current plan has been replaced by the upgraded plan.
    
*   Billing and shipping cadences adjust automatically.
    
*   Any attached discounts apply to the first order or ongoing as configured.
    

#### How were a lot of Customers able to cancel the subscription from the customer portal without entering a cancel reason, even when the reason is marked as mandatory on the Loop app?

One reason why customers can directly cancel their subscription without adding a reason could be their location in US (especially California,Colorado). This behaviour is caused by the setting under Retain > Cancellation Flows > Preferences > ‘Enable ARL compliant cancellation flow for U.S. customers’.  
If this setting is enabled, they can cancel their subscriptions directly from the customer portal. Because US customers (especially California,Colorado) are not required to complete the cancellation survey, they are taken straight to the offer screen.

#### Why are customers encountering the error message: "Address is outside of serviceable area" while updating the address of customer in a subscription?

This error usually comes from Shopify directly at times during their address validation check. Loop allows you to override the delivery address validation in cases like this, where the error appears while updating the address.

To enable this:

*   Go to Settings > General > Address and Shipping Settings > Address Validation Override and enable it.
    
*   Ensure that the relevant users have the necessary permission by going to Users and Permissions > Subscriptions > Address Validation.
    
*   Please note that this only works on the admin portal, so you can change the address from the admin portal on behalf of the customer
    

#### I have recently made a product 'unlisted' on shopify and my customers are unable to find that item during swap actions from the customer portal.

Yes, unlisted products will not be visible on customer portal touchpoints such as Swap recommendations.

However, you can still perform product actions (add, swap, or remove) for unlisted products from the Loop admin portal, or you can also use them in Bulk Actions and Flows.

To make the product available on the portal, you’ll need to relist the item on Shopify again.

#### How can customers switch their payment provider? For example, from Stripe to PayPal?

We provide an option to change payment method, but not 'payment provider', from our customer portal to customers.

Customers can switch to the PayPal method if it is already added, but they can't add PayPal as a payment method from our customer portal.

The same can be achieved by sending a Shopify payment update link to the customer.

*   Go to Customers in your Shopify admin
    
*   Click on the customer who needs to update their payment
    
*   Scroll to the Payment methods section
    
*   Click the pencil icon
    
*   For the card they want to update, click the ... menu and select "Send link to update card"
    
*   Review the details and click Send email
    

#### Customer Portal is not opening today from the Admin portal and is leaving an error 'page can't be found'

One reason could be the change in 'App proxy url'. Kindly ensure that the URL is correct and ends with:

/a/loop\_subscriptions

#### What accessibility features are available in the app-block-based product page widget?

The app-block-based product page widget supports keyboard navigation and screen readers.

We have `aria-label` so that screen readers can read out loud what all purchase options are available & `tab-index` so that customers can navigate using the keyboard by pressing `Tab` and arrow keys without needing to touch the mouse

Customers can use the Tab key and arrow keys to move through purchase options in the widget. Screen readers can read out loud the available purchase options using the provided aria-labels, enabling accessible navigation and selection.

#### How can we restrict customers from choosing cheaper alternatives to the purchased products?

To prevent customers from swapping to lower-priced products, we recommend using the Product Swap feature in Loop. This allows you to control which products are available for swapping.

1.  Configure swap settings
    
2.  Navigate to Loop > Retain > Product Swaps > Preferences
    
3.  Enable product swaps for the Customer Portal.
    
4.  In the swap options, include only products that are equal to or higher in price
    
5.  Add all lower-priced products to the Excluded products list"
    

#### To what extent can I customise the Loop customer portal?

"Our Loop portal is fully customizable, and nearly every function can be modified either via the built-in Custom JS section,/built in CSS settings or using the APIs if you want to implement your own methods/functions.

*   Custom JS: Best for enhancing the portal visually or functionally without building a new system, like UI tweaks, hiding/showing buttons, rearranging sections, or triggering front-end interactions.
    
*   APIs: Best for fully custom pages or advanced functionality, such as product swaps, editing addresses, scheduling orders, or integrating Loop data into your own dashboard
    

* * *

Related Articles

[

Upgrades

](https://help.loopwork.co/en/articles/12703349-upgrades)[

Bundles overview

](https://help.loopwork.co/en/articles/12729045-bundles-overview)[

Bundle JavaScript events & window variables for custom experience

](https://help.loopwork.co/en/articles/12741415-bundle-javascript-events-window-variables-for-custom-experience)[

Run campaigns via Loop

](https://help.loopwork.co/en/articles/12769114-run-campaigns-via-loop)[

Bundles FAQs

](https://help.loopwork.co/en/articles/12858139-bundles-faqs)
