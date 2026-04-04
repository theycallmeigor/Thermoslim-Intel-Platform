---
title: "Install bundle snippets manually"
source_url: "https://help.loopwork.co/en/articles/12741237-install-bundle-snippets-manually"
collection: "07-bundles"
scraped_at: "2026-03-30T17:43:20.914Z"
tags: ["07-bundles"]
---

Learn how to manually install Loop bundle snippets on your Shopify theme to ensure proper bundle display and functionality.

* * *

# Manual bundle snippet installation

This step-by-step tutorial will ensure that you have installed the bundle cart snippets manually on the store. If this snippet is not installed, the cart will show the bundle purchase items as individual items and will not be grouped automatically.

**Step 1**: [Download the bundle snippet](https://cdn.loopwork.co/internal/assets/loop_bundle.js) and upload a new file in your theme called **loop\_bundle.js**

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812021458/6974b3f84313824161caa614f319/original?expires=1774894500&signature=ef87af469dc12e81708877540aa01c8d9225f556aa0585cb0f0cd82fd4727f44&req=dSgmFMl8nIVaUfMW1HO4zWq3pS5a4K9yfb%2FgFfW7PE0p1RwaCOm%2F56SGLCS4%0ADBW0gX9hsrhugpc7etU%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812021458/6974b3f84313824161caa614f319/original?expires=1774894500&signature=ef87af469dc12e81708877540aa01c8d9225f556aa0585cb0f0cd82fd4727f44&req=dSgmFMl8nIVaUfMW1HO4zWq3pS5a4K9yfb%2FgFfW7PE0p1RwaCOm%2F56SGLCS4%0ADBW0gX9hsrhugpc7etU%3D%0A)

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812021449/2273aacf63a62f465265625a39b1/original?expires=1774894500&signature=0fef694da5e3888cab1c62fd30ad8befa6c50f4c57cda0d9a298cef36d9437e4&req=dSgmFMl8nIVbUPMW1HO4zaITxxMJLZ1L7Xv53E6mtETeq2UCb%2Fb0ar93wd7s%0Ato3rMoFJ9gK9KW4H5Bk%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812021449/2273aacf63a62f465265625a39b1/original?expires=1774894500&signature=0fef694da5e3888cab1c62fd30ad8befa6c50f4c57cda0d9a298cef36d9437e4&req=dSgmFMl8nIVbUPMW1HO4zaITxxMJLZ1L7Xv53E6mtETeq2UCb%2Fb0ar93wd7s%0Ato3rMoFJ9gK9KW4H5Bk%3D%0A)

**Step 2**: Add the following code at the bottom of the cart page. Note that your cart page might be named differently.

<code><script defer="defer">  
window.Loop = {};  
window.Loop.bundleCartAllItems = {{ cart.items | json }};  
</script>  
<script src="{{ 'loop\_bundle.js' | asset\_url }}"></script>

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812021461/d642b9a4a93924cbf749e5547350/original?expires=1774894500&signature=008025f40a3051ea456688f94bceb707e8d4a8f80586ff39bd0f6393ca9e7bd6&req=dSgmFMl8nIVZWPMW1HO4zbLwm7zcgwuk%2BfHdU7SJElyK%2BcxwrZVs31ZKiOtV%0Aoi5ZhPyH29v8LIignLc%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812021461/d642b9a4a93924cbf749e5547350/original?expires=1774894500&signature=008025f40a3051ea456688f94bceb707e8d4a8f80586ff39bd0f6393ca9e7bd6&req=dSgmFMl8nIVZWPMW1HO4zbLwm7zcgwuk%2BfHdU7SJElyK%2BcxwrZVs31ZKiOtV%0Aoi5ZhPyH29v8LIignLc%3D%0A)

**Step 3**: Add the following code inside the items loop on the cart page

\` {% comment %} LOOP SUBSCRIPTIONS (https://apps.shopify.com/loop-subscriptions) DO NOT modify this source code because It is automatically generated from LOOP SUBSCRIPTIONS BUNDLE DESIGN If you need to make change, please contact the Loop support team   
LOOP BUNDLE CODE STARTS   
{% endcomment %}   
{% assign isBundleItem = false %}   
{%- for property in item.properties -%}   
{% if property.first == 'bundleId' %}   
{% assign isBundleItem = true %}   
{% break %}   
{% endif %}   
{%- endfor -%}   
{% if isBundleItem == true %}   
{% continue %}   
{% endif %}   
{% comment %}   
LOOP BUNDLE CODE ENDS   
{% endcomment %}

[![](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812021463/27983b36ed3e3ba1748983d4eb91/original?expires=1774894500&signature=a1b20f75664411c556fd28c5a282075c827a558a41694c60926c3bc3f42e590c&req=dSgmFMl8nIVZWvMW1HO4zXLkCHjmFsVgGgFtdazxRvSTKbaBeAOzIm6oNhpU%0AoXiDSoegBfEyORNBeJ8%3D%0A)](https://downloads.intercomcdn.com/i/o/kmcpsev1/1812021463/27983b36ed3e3ba1748983d4eb91/original?expires=1774894500&signature=a1b20f75664411c556fd28c5a282075c827a558a41694c60926c3bc3f42e590c&req=dSgmFMl8nIVZWvMW1HO4zXLkCHjmFsVgGgFtdazxRvSTKbaBeAOzIm6oNhpU%0AoXiDSoegBfEyORNBeJ8%3D%0A)

**Step 4**: Inside the **renderBundle** function of **loop\_bundle.js** Change the cart-items-body class to the cart page tbody class name if required.

**Step 5**: Fix CSS if needed. To fix CSS go into **loop\_bundle.js** asset and change the HTML inside the **getBundleCartItemsTemplate** function.

  
​

# API endpoints

*   [Bundles storefront API](https://loop-storefront.readme.io/reference/bundle-apis-overview)
    

  
​

# Need help?

No worries - we're here for you!

If you have any questions or need assistance, feel free to email us at [\[email protected\]](/cdn-cgi/l/email-protection#5724222727382523173b3838272038253c793438) or chat with us using the support beacon at the bottom right of your screen.

Regards,

Loop Subscriptions Team 🙂

* * *

Related Articles

[

Bundles overview

](https://help.loopwork.co/en/articles/12729045-bundles-overview)[

Preset fixed bundle

](https://help.loopwork.co/en/articles/12729092-preset-fixed-bundle)[

Build your bundle

](https://help.loopwork.co/en/articles/12741075-build-your-bundle)[

Edit bundle from the cart

](https://help.loopwork.co/en/articles/12741248-edit-bundle-from-the-cart)[

Kaching bundles

](https://help.loopwork.co/en/articles/12745875-kaching-bundles)
