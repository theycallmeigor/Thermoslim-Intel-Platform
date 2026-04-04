# Sprint: Pipeline Fixes + Dashboard Enhancements

**Date:** 2026-04-04
**Approach:** Fix pipeline first, then build UI on correct data

## Scope

1. Data pipeline fixes (seed script + snapshot builder)
2. Order detail links fix
3. Frequency analysis — product × frequency matrix
4. Upcoming rebills — pagination + unknown resolution + status filter
5. Product mapping audit UI (new page)
6. Funnel performance page (new page)

**Out of scope:** Loop Subscriptions, analytics audit dashboards, BullMQ dashboard, alert thresholds, CC flat field webhook fix, duplicate line items investigation.

---

## 1. Data Pipeline Fixes

### 1A: Seed Script — Eliminate "Bundle" as Product Line

**File:** `scripts/seed.ts`

**Problem:** Lines 76-81 detect multiple series codes in a SKU and override `productLine = 'Bundle'`. Lines 123-126 do the same via name matching (`/bundle|starter|value|ultimate|all.in.one/i`). This causes 515 of 704 orders to be categorized as "Bundle" instead of their actual product line (e.g., Body Sculpting Device).

**Changes:**
- **Remove lines 76-81** (multi-series → Bundle override in `deriveFromSku()`). For multi-item SKUs, keep the first/highest-priority series code match instead.
- **Change lines 123-126** (name-based bundle detection): Map bundle names to their primary product. "Starter Bundle" → "Body Sculpting Device". Remove `'Bundle'` as a valid product line entirely.
- **Update name-matching fallback** (line 239): Replace `match = allMapsForCheck.find(m => m.productLine === 'Bundle')` with `match = allMapsForCheck.find(m => m.productLine === 'Body Sculpting Device')` since bundles are device-centric.

**Result:** No ProductMap entry should have `productLine = 'Bundle'` after running seed.

### 1B: Snapshot Builder — Recurring Order Detection

**File:** `scripts/build-snapshots.ts`

**Problem:** Line 191: `const isRecurring = order.ccOrderType === 'REBILL'`. MERGED orders may not carry `ccOrderType` from the CC side, causing all rebills to count as new orders. Screenshot confirms: recurring = 0 across all products.

**Changes:**
- **Replace line 191** with multi-signal detection:
  ```typescript
  const isRecurring =
    order.ccOrderType === 'REBILL' ||
    order.items.some(i => (i.billingCycleNumber ?? 0) > 1) ||
    (order.tags?.includes('Recurring') ?? false);
  ```
- **Add `billingCycleNumber` to the items include** (line 96) since it's not currently selected.

**Result:** Recurring orders are correctly classified using three signals: ccOrderType, billingCycleNumber, and tags.

### Post-Fix Steps

After deploying both fixes:
1. Run `npx tsx scripts/seed.ts` to re-enrich ProductMap entries
2. Run `npx tsx scripts/build-snapshots.ts` to rebuild all snapshots
3. Verify Products Performance page shows correct product lines and non-zero recurring counts

---

## 2. Order Detail Links Fix

**File:** `app/(dashboard)/orders/[id]/page.tsx`

**Problem:** External links to Shopify admin and CC CRM depend on env vars (`SHOPIFY_STORE_URL`, `CC_API_URL`) that are either unset or point to API domains, not admin/CRM domains.

**Changes:**
- **Remove env var lookups** (lines 109-110)
- **Hardcode URLs:**
  - Shopify: `https://admin.shopify.com/store/tvbczb-ie/orders/{shopifyOrderId}`
  - CC CRM: `https://crm.checkoutchamp.com/customer/cs/orders/?orderId={ccSourceOrderId}`
- **Conditions remain the same:** Shopify link shows when `shopifyOrderId` exists, CC link shows when source is CHECKOUTCHAMP or MERGED

**Scope:** Detail page only, not the All Orders table.

---

## 3. Frequency Analysis — Product × Frequency Matrix

**File:** `app/(dashboard)/subscriptions/frequency/page.tsx`

**Problem:** Current page groups subscriptions by frequency only. No visibility into which products have which frequencies.

**Changes:**
- **Keep existing content** (donut chart + frequency table)
- **Add new section below:** Product × Frequency matrix table
  - Rows: product lines (from `productMap.productLine`)
  - Columns: each frequency found (e.g., 1-month, 3-month, 6-month, unknown)
  - Cells: subscriber count + MRR contribution
  - Totals row and column
- **Data source:** Same `Subscription` query already in use — add second grouping level by `productMap.productLine`

---

## 4. Upcoming Rebills — Pagination + Unknowns + Status Filter

**File:** `app/(dashboard)/orders/rebills/page.tsx`

### 4A: Cursor-Based Pagination
- Add `page` URL search param (default 1)
- 50 items per page
- Add prev/next buttons below table
- Server-side pagination via Prisma `skip`/`take`
- Total count in table header ("Showing 1-50 of 342")

### 4B: Resolve Unknowns
- After seed script fix (1A), most `productMapId` nulls should be backfilled
- For remaining nulls: show subscription `frequency` field as fallback instead of "Unknown"
- Add "Unlinked" count badge in KPI strip to surface remaining gaps

### 4C: Status Filter
- Tab bar above table: All | Active | Trial | Recycle Billing
- Filters both the table AND KPI aggregates
- Uses `status` URL search param
- Default: All

---

## 5. Product Mapping Audit UI (New Page)

**Route:** `/operations/product-mapping`
**Nav:** Under Operations, after Ingestion Health

### Layout

**KPI Strip (4 cards):**
- Total ProductMap Entries
- Linked OrderItems (% of total)
- Unlinked OrderItems (count)
- Unlinked Subscriptions (count)

**Product Map Table:**
| Name | Product Line | Category | CC CRM ID | Shopify ID | Frequency | Subscription? | Linked Orders |
|------|-------------|----------|-----------|------------|-----------|--------------|--------------|

All ProductMap entries, sorted by linked order count descending.

**Gaps Table:**
| CC CRM ID | Product Name (sample) | Unlinked Orders | First Seen |
|-----------|----------------------|----------------|-----------|

OrderItems where `productMapId IS NULL`, grouped by `ccCrmId` + `name`, with count of affected orders. These are the products the seed script doesn't know about.

**Read-only** — no editing. Seed script handles enrichment. This page shows what the seed script missed.

---

## 6. Funnel Performance Page (New Page)

**Route:** `/performance/funnels`
**Nav:** Under Performance, between Products and Upsell & AOV

### Data Source
Pure CC data: `Order` + `OrderItem` + `UpsellPath` tables. No GA4/Clarity dependency.

**Prerequisite:** Run `funnel-sync.ts` to populate `Funnel` and `FunnelPage` tables. If empty, derive funnel structure on-the-fly from order `salesUrl` patterns.

### Layout

**KPI Strip (4 cards):**
- Total Funnels
- Total Funnel Orders
- Upsell Take Rate (overall)
- Avg Revenue Per Funnel Visit

**Funnel Cards** (one per funnel, expandable):
- Funnel name (from `campaignName` or `salesUrl` path prefix)
- Total orders, revenue, AOV

**Expanded View Per Funnel** — page-by-page breakdown:
- Page type (Checkout, OTO1, OTO2, Downsell, Thank You)
- Order count and revenue per page
- Products on each page with accept/decline counts and take rate %
  - E.g., "Conductive Gel — 340 accepted (42%), Maintenance Cream — 180 (22%), Declined — 290 (36%)"

### Data Derivation
- **Funnel identification:** Group by `Funnel.ccReferenceId` if populated, else group orders by `salesUrl` path prefix
- **Page sequence:** From `FunnelPage.pageType` + `sortOrder` if populated, else infer from slug patterns (checkout, upsell, downsell, thankyou)
- **Products per page:** Join OrderItem on order, use `productType` (OFFER vs UPSALE) to distinguish checkout vs upsell products
- **Take rates:** From `UpsellPath` records (`upsellsAccepted` / `upsellsOffered`)

---

## Execution Order

1. **Fix 1A** — Seed script: remove Bundle product line
2. **Fix 1B** — Snapshot builder: fix recurring detection
3. Run seed + rebuild snapshots
4. **Fix 2** — Order detail links
5. **Fix 3** — Frequency analysis matrix
6. **Fix 4** — Rebills pagination + unknowns + status filter
7. **New page 5** — Product mapping audit
8. **New page 6** — Funnel performance

Items 1-4 are quick fixes (~2 hrs total). Items 5-6 are new builds (~2-3 hrs total).

---

## Known Issues Flagged But Not In Scope

- **Duplicate line items** on order detail (8 identical rows) — data/ingestion bug, needs separate investigation
- **Merge-duplicates script** — flagged urgent March 27, status unknown, should be run on production
- **CC webhook flat fields** — webhook-path issue, not blocking sync-path
- **DailySnapshot not automated** — `build-snapshots.ts` is manual/cron, not triggered after sync
