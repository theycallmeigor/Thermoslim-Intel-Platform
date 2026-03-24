# Microsoft Clarity adapter

## Connection
- Data Export API: `https://www.clarity.ms/export-data/api/v1/{projectId}/export/`
- Auth: Bearer token (JWT)
- Project ID: 2702654487149580 (embedded in token `sub` claim)
- **Server-side only**: no CORS headers, must be called from backend
- Token expiry: 2126 (effectively permanent)

## Available endpoints

### Sessions
Full session records with behavioral signals.
Fields: SessionId, UserId, StartTime, Duration, PagesViewed, Device, OS, Browser, Country, Region, City, Referrer, EntryPage, ExitPage, HasRageClicks, HasDeadClicks, HasExcessiveScrolling, HasQuickBack, HasScriptError, ScrollDepthAvg

### Pages
Per-page view data with interaction metrics.
Fields: SessionId, PageUrl, PageTitle, TimeOnPage, ScrollDepth, ClickCount, RageClickCount, DeadClickCount, ResizeCount

### Clicks
Individual click events with type classification.
Fields: SessionId, PageUrl, ClickTarget, ClickType, X, Y, Timestamp, ElementSelector, ElementText

### ScrollDepth
Scroll behavior per page.
Fields: SessionId, PageUrl, MaxScrollDepth, ReachedBottom, TimeToMaxScroll, ScrollSpeed

### CustomTags
Custom tags passed via Clarity JS API. **Critical for funnel matching.**
Fields: SessionId, TagKey, TagValue, Timestamp
- Tag sessions with CC campaignId during checkout for exact session-to-funnel join
- Implementation: add `clarity("set", "campaignId", "{value}");` to checkout pages

### JavaScriptErrors
JS errors captured during sessions.
Fields: SessionId, PageUrl, ErrorMessage, StackTrace, Timestamp, LineNumber, ColumnNumber, FileName
- Monitor for checkout page errors that cause silent failures

### NetworkRequests
Network waterfall data.
Fields: SessionId, PageUrl, RequestUrl, Method, StatusCode, Duration, TransferSize, ResourceType
- Detect slow API calls on checkout/upsell pages

## Sync operations (scheduled: hourly)
- Pull all endpoints for the last hour
- Aggregate page-level metrics into page_analytics table
- Flag high-friction sessions (rage clicks, dead clicks, JS errors)
- Store raw session data for drill-down

## Join keys
- **Page URL**: Clarity page URL = CC salesUrl = GA4 page path
- **CustomTags**: if `campaignId` tag is set, exact match to CC campaignId
- **Timestamp + referrer**: for cross-referencing individual sessions with GA4

## Key friction signals (become alert rules)
- Rage clicks on checkout form elements → possible form validation UX issue
- Rage clicks on upsell frequency selector → possible loading issue affecting offer selection
- Dead clicks on product images → missing click handler, user expects zoom/detail
- Low scroll depth on landing page → above-fold content not engaging
- JS errors on checkout pages → potential silent checkout failures
- Quick-back on upsell pages → confusing or aggressive upsell presentation
