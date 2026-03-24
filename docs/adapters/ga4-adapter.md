# Google Analytics 4 adapter

## Connection
- GA4 Data API
- Auth: Google service account (JSON credentials)
- Property ID configured in environment

## Sync operations

### Traffic reports (scheduled: hourly)
- Dimensions: date, source, medium, campaign, landingPage
- Metrics: sessions, totalUsers, newUsers, bounceRate, avgSessionDuration, screenPageViews

### Landing page performance (scheduled: hourly)
- Dimensions: landingPage, deviceCategory
- Metrics: sessions, conversions, bounceRate, avgSessionDuration
- Join to CC via: landingPage URL = CC salesUrl

### Conversion funnel (scheduled: daily)
- Custom funnel report: page_view events through checkout flow
- Tracks drop-off from landing page → checkout start → checkout complete

## Join key
- **Page URL**: GA4 landingPage / pagePath = CC salesUrl = Clarity page URL
- UTM parameters extracted from salesUrl also match GA4 source/medium/campaign dimensions

## Key reporting outputs
- Traffic source breakdown per funnel/campaign
- Landing page conversion rates (pre-checkout)
- Device breakdown (mobile vs desktop conversion gap)
- Combined with CC data: full funnel from ad click → landing → checkout → upsell → subscription
