---
title: "Memberships"
source_url: "https://help.loopwork.co/en/articles/12731298-memberships"
collection: "Acquire"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, acquire]
---

# Memberships

Allows customers to subscribe to a loyalty club for exclusive benefits like special pricing.

### Implementation Steps

1.  **Digital Membership Product:** Create in Shopify.
2.  **Selling Plan:** Create in Loop and map the product.
3.  **Customer Tags:** Configure in Loop (e.g., "MRE") to update after the billed period is over.
4.  **Liquid Code:** Use in your Shopify theme to check for tags and display member-only content.

### Liquid Example Snippet

```liquid
{% assign is_member = false %}
{% assign membership_tag = 'MRE' %}
{% if customer %}
  {% if customer.tags contains membership_tag %}
    {% assign is_member = true %}
  {% endif %}
{% endif %}
```

## External Links Found

- [Shopify customer object liquid](https://shopify.dev/docs/api/liquid/objects/customer)
- [support@loopwork.co](mailto:support@loopwork.co)
- [API documentation](https://help.loopwork.co/en/articles/12672675-api-documentation)

## Images/Diagrams

- **VIP/Membership Club:** Conceptual image representation.
