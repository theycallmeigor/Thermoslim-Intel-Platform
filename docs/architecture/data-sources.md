# Data sources

## Confirmed sources (Phase 1)

### Shopify
- **Role**: Product master catalog + orders + customers + traffic
- **API**: REST Admin API + GraphQL Admin API + webhooks
- **Auth**: OAuth (Shopify app) or custom app access token
- **Key data**: products, variants, orders, customers, inventory levels
- **Product mapping role**: Shopify product ID is the canonical product identifier. CC`s productN_externalId maps to this.

### CheckoutChamp
- **Role**: Transaction engine + subscriptions + funnels + attribution
- **API**: REST API (apidocs.checkoutchamp.com) + export webhook profiles
- **Auth**: API key + username
- **Dual mode**: pull via API (scheduled sync) + push via webhooks (real-time)
- **Key fields**: See `docs/adapters/checkoutchamp-adapter.md` for full field mapping
- **Subscription data**: recurringStatus, billingCycleNumber, recurringPrice, clientPurchaseId per product
- **Attribution**: sourceId, pubId, subAffId, sourceValue1-5, campaignId/Name

### Klaviyo
- **Role**: Email/SMS campaigns, flows, engagement, attributed revenue
- **API**: REST API (developers.klaviyo.com)
- **Auth**: private API key
- **Key data**: campaign metrics, flow performance, profile events, engagement scores
- **Join key**: email address (Klaviyo profile email = CC emailAddress = Shopify customer email)
- **Product mapping assist**: Klaviyo tracks Placed Order and Ordered Product events with product data — useful for triangulation when CC externalId mapping is unclear

### Google Analytics 4
- **Role**: Traffic sources, landing page performance, pre-checkout conversion funnel
- **API**: GA4 Data API
- **Auth**: service account (JSON credentials)
- **Key data**: sessions, pageviews, traffic source, landing page, conversion events
- **Join key**: page URL (GA4 page path = CC salesUrl)

### Microsoft Clarity
- **Role**: Behavioral analytics — heatmaps, rage clicks, dead clicks, scroll depth, UX friction
- **API**: Data Export API (server-side only, no CORS)
- **Auth**: Bearer token (long-lived JWT, project ID in token sub claim)
- **Project ID**: 2702654487149580
- **Key endpoints**: Sessions, Pages, Clicks, ScrollDepth, CustomTags, JavaScriptErrors, NetworkRequests
- **Join key**: page URL (Clarity page URL = CC salesUrl = GA4 page path)
- **CustomTags**: can tag Clarity sessions with CC campaignId for exact session-to-funnel matching
- **Note**: token expires 2126, no rotation needed

## Future sources (Phase 2+)
- Payment gateway (Stripe/NMI) — actual money movement, decline detail
- 3PL/Fulfillment (ShipBob/ShipStation) — shipping status, delivery times
- Customer support (Gorgias/Zendesk) — ticket volume, categories, CSAT
- Ad platforms (Meta, Google, TikTok) — spend, CPA, ROAS tied to LTV
- Reviews (Judge.me/Yotpo) — satisfaction scores, sentiment
- Post-purchase surveys (Fairing/KnoCommerce) — self-reported attribution
- Inventory levels — stockout prevention for subscription rebills
- Competitive intelligence — separate dedicated tool (built independently)
