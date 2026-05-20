# Sprint: Pipeline Fixes + Dashboard Enhancements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix data pipeline bugs (Bundle product line, recurring detection, duplicate items), automate snapshots, fix order detail links, enhance 3 existing pages, and build 2 new pages.

**Architecture:** Pipeline-first approach. Fix seed script and snapshot builder so all downstream UI reads correct data. Add post-sync snapshot rebuild via extracted module. New pages follow existing patterns (server components, Prisma queries, KpiCard/PageHeader/table layout).

**Tech Stack:** Next.js 14 App Router, Prisma, TypeScript, Tailwind, Recharts

**Spec:** `docs/superpowers/specs/2026-04-04-sprint-pipeline-fixes-and-new-pages-design.md`

---

## File Map

### Modified Files
| File | Change |
|------|--------|
| `scripts/seed.ts` | Remove "Bundle" product line, map bundles to Body Sculpting Device |
| `scripts/build-snapshots.ts` | Fix recurring detection with multi-signal check |
| `app/(dashboard)/orders/[id]/page.tsx` | Hardcode Shopify + CC external links |
| `app/(dashboard)/subscriptions/frequency/page.tsx` | Add product × frequency matrix |
| `app/(dashboard)/orders/rebills/page.tsx` | Add pagination, status filter, unknown resolution |
| `app/(dashboard)/Sidebar.tsx` | Add Product Mapping + Funnels nav items |
| `app/api/sync/checkoutchamp/route.ts` | Call snapshot rebuild after sync |
| `app/api/sync/shopify/route.ts` | Call snapshot rebuild after sync |
| `app/api/cron/sync-cc/route.ts` | Call snapshot rebuild after sync |
| `src/core/ingestion/pipeline.ts` | Fix duplicate items in merge path |

### New Files
| File | Purpose |
|------|---------|
| `src/core/sync/rebuild-snapshots.ts` | Extracted snapshot rebuild module (shared by script + API routes) |
| `app/(dashboard)/operations/product-mapping/page.tsx` | Product mapping audit page |
| `app/(dashboard)/performance/funnels/page.tsx` | Funnel performance page |
| `app/(dashboard)/performance/funnels/FunnelCard.tsx` | Client component for expandable funnel cards |

---

## Task 1: Fix Seed Script — Eliminate "Bundle" Product Line

**Files:**
- Modify: `scripts/seed.ts:57-100` (deriveFromSku), `scripts/seed.ts:112-143` (enrichment), `scripts/seed.ts:231-243` (name fallback)

- [ ] **Step 1: Fix `deriveFromSku()` — remove Bundle override**

In `scripts/seed.ts`, replace lines 76-81:
```typescript
  // OLD: Detect if it's a bundle (multiple series codes in SKU)
  // const seriesCount = Object.keys(SERIES_TO_LINE).filter(s => sku.includes(s)).length;
  // if (seriesCount > 1) {
  //   productLine = 'Bundle';
  //   category = 'Bundle';
  // }
```
With nothing — just delete these lines. The first series code match (line 68-74) is already correct for multi-item SKUs (picks the first/highest-priority match).

- [ ] **Step 2: Fix name-based bundle detection**

Replace lines 123-126:
```typescript
    // OLD:
    // const isBundleName = /bundle|starter|value|ultimate|all.in.one/i.test(pm.name);
    // const finalLine = isBundleName && !productLine ? 'Bundle' : productLine;
    // const finalCat  = isBundleName && !category    ? 'Bundle' : category;

    // NEW: Bundles are Body Sculpting Device packages
    const isBundleName = /bundle|starter|value|ultimate|all.in.one/i.test(pm.name);
    const finalLine = isBundleName && !productLine ? 'Body Sculpting Device' : productLine;
    const finalCat  = isBundleName && !category    ? 'Device' : category;
```

- [ ] **Step 3: Fix name-matching fallback**

Replace line 239-240:
```typescript
      // OLD: match = allMapsForCheck.find(m => m.productLine === 'Bundle');
      // NEW: bundles are device packages
      } else if (lower.includes('bundle')) {
        match = allMapsForCheck.find(m => m.productLine === 'Body Sculpting Device');
```

- [ ] **Step 4: Also fix `isSubscription` for bundles**

Line 97 currently excludes Bundle from subscriptions. Since we're removing Bundle as a category, this line needs updating:
```typescript
    // OLD: const isSubscription = category !== 'Device' && category !== 'Bundle' && category !== 'Accessory';
    const isSubscription = category !== 'Device' && category !== 'Accessory';
```

- [ ] **Step 5: Commit**

```bash
git add scripts/seed.ts
git commit -m "fix: eliminate Bundle as product line — map to Body Sculpting Device"
```

---

## Task 2: Fix Snapshot Builder — Recurring Order Detection

**Files:**
- Modify: `scripts/build-snapshots.ts:191`

- [ ] **Step 1: Replace recurring detection logic**

Replace line 191:
```typescript
        // OLD: const isRecurring = order.ccOrderType === 'REBILL';
        const isRecurring =
          order.ccOrderType === 'REBILL' ||
          order.items.some(i => (i.billingCycleNumber ?? 0) > 1) ||
          (order.tags?.split(',').map(t => t.trim()).includes('Recurring') ?? false);
```

Note: `billingCycleNumber` is already available on items — the include at line 94-98 uses `include` (not `select`), so all OrderItem fields are returned. No cast needed; Prisma's return type already includes `billingCycleNumber`.

- [ ] **Step 2: Commit**

```bash
git add scripts/build-snapshots.ts
git commit -m "fix: recurring detection uses ccOrderType + billingCycleNumber + tags"
```

---

## Task 3: Fix Duplicate Line Items

**Files:**
- Modify: `src/core/ingestion/pipeline.ts` — merge path (lines ~366-441)

- [ ] **Step 1: Investigate current merge item logic**

Read `src/core/ingestion/pipeline.ts` lines 350-450 to understand the exact merge flow. The bug: when backfill re-syncs an already-merged order, the merge path creates new items without checking if they already exist.

- [ ] **Step 2: Determine root cause**

Check these hypotheses:
1. Backfill re-triggers merge path on already-merged orders where `targetOrder.items` includes previously merged CC items → items get re-appended
2. CC API returns duplicate items in the `items` array for bundle products
3. Standard upsert path (line 559 `deleteMany` + line 568 `writeOrderItems`) runs correctly, but the merge path (lines 366-441) has match-by-externalId logic that creates new items for CC-only products each time

**Important:** The merge path is NOT a simple blind create — it matches by `externalId` first. A blanket `deleteMany` could lose Shopify-originated item data. The fix must be targeted to the actual root cause.

- [ ] **Step 3: Implement targeted fix based on findings**

Apply the fix appropriate to the root cause found in Step 2. If fix is > 30 min, document findings and defer.

- [ ] **Step 4: Commit**

```bash
git add src/core/ingestion/pipeline.ts
git commit -m "fix: prevent duplicate order items during merge/backfill"
```

---

## Task 4: Fix Order Detail External Links

**Files:**
- Modify: `app/(dashboard)/orders/[id]/page.tsx:109-141`

- [ ] **Step 1: Remove env var lookups and hardcode URLs**

Delete lines 109-110:
```typescript
  // DELETE: const shopifyStoreUrl = process.env.SHOPIFY_STORE_URL;
  // DELETE: const ccApiUrl = process.env.CC_API_URL;
```

Replace the Shopify link (lines 122-131):
```tsx
        {order.shopifyOrderId && (
          <a
            href={`https://admin.shopify.com/store/tvbczb-ie/orders/${order.shopifyOrderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            View in Shopify
          </a>
        )}
```

Replace the CC link (lines 132-141):
```tsx
        {(order.source === 'CHECKOUTCHAMP' || order.source === 'MERGED') && order.ccSourceOrderId && (
          <a
            href={`https://crm.checkoutchamp.com/customer/cs/orders/?orderId=${order.ccSourceOrderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            View in CC
          </a>
        )}
```

- [ ] **Step 2: Commit**

```bash
git add app/(dashboard)/orders/[id]/page.tsx
git commit -m "fix: hardcode Shopify + CC CRM links on order detail page"
```

---

## Task 5: Frequency Analysis — Add Product × Frequency Matrix

**Files:**
- Modify: `app/(dashboard)/subscriptions/frequency/page.tsx`

- [ ] **Step 1: Add product × frequency grouping to data fetching**

After the existing `freqMap` grouping (around line 30), add a second grouping:

```typescript
  // Product × Frequency matrix
  const matrixMap = new Map<string, Map<string, { count: number; mrr: number }>>();
  const allFrequencies = new Set<string>();

  for (const sub of subs) {
    const product = sub.productMap?.productLine ?? 'Unlinked';
    const freq = sub.frequency ?? 'unknown';
    allFrequencies.add(freq);

    if (!matrixMap.has(product)) matrixMap.set(product, new Map());
    const freqRow = matrixMap.get(product)!;
    const cell = freqRow.get(freq) ?? { count: 0, mrr: 0 };
    cell.count += 1;
    cell.mrr += toMonthlyMrr(sub.recurringPrice, sub.frequency);
    freqRow.set(freq, cell);
  }

  const freqColumns = [...allFrequencies].sort();
  const matrixRows = [...matrixMap.entries()]
    .map(([product, freqRow]) => {
      const totalCount = [...freqRow.values()].reduce((s, c) => s + c.count, 0);
      const totalMrr = [...freqRow.values()].reduce((s, c) => s + c.mrr, 0);
      return { product, freqRow, totalCount, totalMrr };
    })
    .sort((a, b) => b.totalMrr - a.totalMrr);
```

- [ ] **Step 2: Add matrix table to JSX**

After the existing grid (donut + breakdown table), add:

```tsx
      {/* Product × Frequency Matrix */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Product × Frequency</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Product</th>
                {freqColumns.map(f => (
                  <th key={f} className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">
                    {f === 'unknown' ? 'Unknown' : f.replace('-', ' ')}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {matrixRows.map(row => (
                <tr key={row.product} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 text-gray-300 font-medium">{row.product}</td>
                  {freqColumns.map(f => {
                    const cell = row.freqRow.get(f);
                    return (
                      <td key={f} className="px-4 py-3.5 text-right tabular-nums">
                        {cell ? (
                          <div>
                            <span className="text-gray-300">{cell.count}</span>
                            <span className="text-gray-600 text-xs ml-1">({fmtK(cell.mrr)})</span>
                          </div>
                        ) : (
                          <span className="text-gray-700">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-6 py-3.5 text-right tabular-nums">
                    <span className="text-gray-200 font-medium">{row.totalCount}</span>
                    <span className="text-gray-500 text-xs ml-1">({fmtK(row.totalMrr)})</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
```

- [ ] **Step 3: Commit**

```bash
git add app/(dashboard)/subscriptions/frequency/page.tsx
git commit -m "feat: add product × frequency matrix to frequency analysis"
```

---

## Task 6: Upcoming Rebills — Pagination + Status Filter + Unknowns

**Files:**
- Modify: `app/(dashboard)/orders/rebills/page.tsx`

- [ ] **Step 1: Add URL params for page and status**

Update the searchParams destructuring:
```typescript
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10));
  const validStatuses = ['ACTIVE', 'TRIAL', 'RECYCLE_BILLING'];
  const rawStatus = sp.status ?? 'all';
  const statusFilter = rawStatus === 'all' || validStatuses.includes(rawStatus.toUpperCase()) ? rawStatus : 'all';
  const PAGE_SIZE = 50;
```

- [ ] **Step 2: Update getRebillData to accept status filter and pagination**

Replace the function signature and queries:
```typescript
async function getRebillData(rangeStart: Date, rangeEnd: Date, statusFilter: string, page: number) {
  const now = new Date();
  const windowStart = rangeStart > now ? rangeStart : now;
  const windowEnd = rangeEnd;
  const in7Days = addDays(windowStart, 7);

  const PAGE_SIZE = 50;

  // Build status where clause
  const validStatuses = ['ACTIVE', 'TRIAL', 'RECYCLE_BILLING'] as const;
  const statusWhere = statusFilter === 'all'
    ? { status: { in: [...validStatuses] } }
    : { status: statusFilter.toUpperCase() };

  const [kpi7, kpi30, totalCount, upcoming] = await Promise.all([
    prisma.subscription.aggregate({
      where: {
        ...statusWhere,
        nextBillDate: { gte: windowStart, lte: in7Days },
      },
      _count: { id: true },
      _sum: { recurringPrice: true },
    }),
    prisma.subscription.aggregate({
      where: {
        ...statusWhere,
        nextBillDate: { gte: windowStart, lte: windowEnd },
      },
      _count: { id: true },
      _sum: { recurringPrice: true },
    }),
    prisma.subscription.count({
      where: {
        ...statusWhere,
        nextBillDate: { not: null },
      },
    }),
    prisma.subscription.findMany({
      where: {
        ...statusWhere,
        nextBillDate: { not: null },
      },
      orderBy: { nextBillDate: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        customer: { select: { email: true, firstName: true, lastName: true } },
        productMap: { select: { name: true, productLine: true, frequency: true } },
      },
    }),
  ]);

  return { kpi7, kpi30, upcoming, totalCount, windowStart, windowEnd };
}
```

- [ ] **Step 3: Add status tab bar to JSX**

After the PageHeader, before the KPI strip:
```tsx
      {/* Status filter tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
        {[
          { key: 'all', label: 'All' },
          { key: 'ACTIVE', label: 'Active' },
          { key: 'TRIAL', label: 'Trial' },
          { key: 'RECYCLE_BILLING', label: 'Recycle Billing' },
        ].map(tab => {
          const isActive = statusFilter === tab.key;
          return (
            <a
              key={tab.key}
              href={`?status=${tab.key}&page=1${sp.from ? `&from=${sp.from}` : ''}${sp.to ? `&to=${sp.to}` : ''}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </a>
          );
        })}
      </div>
```

- [ ] **Step 4: Add pagination controls below table**

After the closing `</table>`, add:
```tsx
        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-800">
          <span className="text-xs text-gray-500">
            Showing {Math.min((page - 1) * 50 + 1, totalCount)}–{Math.min(page * 50, totalCount)} of {totalCount}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?page=${page - 1}&status=${statusFilter}${sp.from ? `&from=${sp.from}` : ''}${sp.to ? `&to=${sp.to}` : ''}`}
                className="px-3 py-1 text-xs font-medium rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Previous
              </a>
            )}
            {page * 50 < totalCount && (
              <a
                href={`?page=${page + 1}&status=${statusFilter}${sp.from ? `&from=${sp.from}` : ''}${sp.to ? `&to=${sp.to}` : ''}`}
                className="px-3 py-1 text-xs font-medium rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Next
              </a>
            )}
          </div>
        </div>
```

- [ ] **Step 5: Fix "Unknown" product display**

In the table row, replace the product name cell:
```tsx
                    <td className="px-6 py-3 text-gray-300">
                      {sub.productMap?.name ?? sub.productMap?.productLine ?? sub.frequency ?? 'Unlinked'}
                    </td>
```

- [ ] **Step 6: Add "Unlinked" KPI badge**

Add a 5th KPI or modify an existing one. Simplest: query count of unlinked subs and show as subtitle on an existing card. Or add after the KPI strip:

Query at the top of the page:
```typescript
  const unlinkedCount = await prisma.subscription.count({
    where: { productMapId: null, status: { in: ['ACTIVE', 'TRIAL', 'RECYCLE_BILLING'] } },
  });
```

Show as a small warning badge below the KPI strip if > 0:
```tsx
      {unlinkedCount > 0 && (
        <div className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2">
          {unlinkedCount} subscription{unlinkedCount !== 1 ? 's' : ''} have no product mapping — run seed script to backfill
        </div>
      )}
```

- [ ] **Step 7: Commit**

```bash
git add app/(dashboard)/orders/rebills/page.tsx
git commit -m "feat: add pagination, status filter, and unknown resolution to rebills"
```

---

## Task 7A: Extract Snapshot Rebuild Module

**Files:**
- Create: `src/core/sync/rebuild-snapshots.ts`
- Modify: `scripts/build-snapshots.ts`

- [ ] **Step 1: Extract rebuild logic into shared module**

Create `src/core/sync/rebuild-snapshots.ts`:
```typescript
import { prisma } from '@/lib/prisma';

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

function classifyChannel(tags: string | null): string {
  if (!tags) return 'direct';
  const hasRecurring = tags.includes('Recurring');
  const hasSubscription = tags.includes('Subscription');
  const hasNewSale = tags.includes('New Sale');
  if (hasRecurring && hasSubscription) return 'cc_recurring';
  if (hasNewSale && hasSubscription) return 'cc_new_sub';
  if (hasNewSale) return 'cc_onetime';
  return 'direct';
}

function deriveFunnelId(salesUrl: string | null): string | null {
  if (!salesUrl) return null;
  try {
    const url = new URL(salesUrl);
    return url.pathname.split('/').filter(Boolean)[0] || null;
  } catch {
    return null;
  }
}

/**
 * Rebuild DailySnapshot for a date range.
 * Extracted from scripts/build-snapshots.ts so API routes can call it.
 */
export async function rebuildSnapshots(from: Date, to: Date): Promise<{ daysProcessed: number; snapshotsUpserted: number }> {
  let totalUpserted = 0;
  let daysProcessed = 0;
  let cursor = new Date(from);

  while (cursor < to) {
    const dayStart = cursor;
    const dayEnd = addDays(dayStart, 1);
    const dateKey = startOfDayUTC(dayStart);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: dayStart, lt: dayEnd },
        source: { in: ['SHOPIFY', 'MERGED'] },
        status: 'COMPLETE',
      },
      include: {
        items: {
          include: { productMap: { select: { productLine: true, frequency: true } } },
        },
      },
    });

    const newSubs = await prisma.subscription.findMany({
      where: { startedAt: { gte: dayStart, lt: dayEnd } },
      include: { productMap: { select: { productLine: true, frequency: true } } },
    });
    const cancelledSubs = await prisma.subscription.findMany({
      where: { cancelledAt: { gte: dayStart, lt: dayEnd } },
      include: { productMap: { select: { productLine: true, frequency: true } } },
    });

    type Bucket = {
      source: string; campaignId: string; campaignName: string;
      productLine: string; frequency: string; channel: string;
      funnelId: string; pageUrl: string;
      totalOrders: number; totalRevenue: number; checkoutRevenue: number;
      recurringRevenue: number; refunds: number; newOrders: number;
      recurringOrders: number; newSubscribers: number; cancelledSubscribers: number;
    };

    const buckets = new Map<string, Bucket>();

    function getKey(source: string, campaignId: string, productLine: string, frequency: string, channel: string, funnelId: string, pageUrl: string): string {
      return [source, campaignId, productLine, frequency, channel, funnelId, pageUrl].join('|');
    }

    function ensureBucket(source: string, campaignId: string, campaignName: string, productLine: string, frequency: string, channel: string, funnelId: string, pageUrl: string): Bucket {
      const key = getKey(source, campaignId, productLine, frequency, channel, funnelId, pageUrl);
      let b = buckets.get(key);
      if (!b) {
        b = { source, campaignId, campaignName, productLine, frequency, channel, funnelId, pageUrl, totalOrders: 0, totalRevenue: 0, checkoutRevenue: 0, recurringRevenue: 0, refunds: 0, newOrders: 0, recurringOrders: 0, newSubscribers: 0, cancelledSubscribers: 0 };
        buckets.set(key, b);
      }
      if (campaignName) b.campaignName = campaignName;
      return b;
    }

    for (const order of orders) {
      const channel = classifyChannel(order.tags);
      const funnelId = deriveFunnelId(order.salesUrl) ?? '';
      const pageUrl = order.salesUrl ?? '';
      const campaignId = order.campaignId ?? '';
      const campaignName = order.campaignName ?? '';
      const isRecurring =
        order.ccOrderType === 'REBILL' ||
        order.items.some((i: any) => (i.billingCycleNumber ?? 0) > 1) ||
        (order.tags?.split(',').map(t => t.trim()).includes('Recurring') ?? false);
      const isRefunded = order.status === 'REFUNDED';

      const itemDimensions = order.items.length > 0
        ? order.items.map((item) => ({
            productLine: item.productMap?.productLine ?? '',
            frequency: item.productMap?.frequency ?? '',
          }))
        : [{ productLine: '', frequency: '' }];

      const uniqueDims = new Map<string, { productLine: string; frequency: string }>();
      for (const dim of itemDimensions) {
        const dk = `${dim.productLine}|${dim.frequency}`;
        if (!uniqueDims.has(dk)) uniqueDims.set(dk, dim);
      }

      const dims = [...uniqueDims.values()];
      for (let i = 0; i < dims.length; i++) {
        const dim = dims[i];
        const bucket = ensureBucket(order.source, campaignId, campaignName, dim.productLine, dim.frequency, channel, funnelId, pageUrl);
        if (i === 0) {
          bucket.totalOrders += 1;
          bucket.totalRevenue += order.totalPrice;
          if (isRecurring) {
            bucket.recurringRevenue += order.totalPrice;
            bucket.recurringOrders += 1;
          } else {
            bucket.checkoutRevenue += order.totalPrice;
            bucket.newOrders += 1;
          }
          if (isRefunded) bucket.refunds += 1;
        }
      }
    }

    for (const sub of newSubs) {
      const productLine = sub.productMap?.productLine ?? '';
      const frequency = sub.productMap?.frequency ?? '';
      const campaignId = sub.campaignId ?? '';
      const bucket = ensureBucket('SHOPIFY', campaignId, '', productLine, frequency, '', '', '');
      bucket.newSubscribers += 1;
    }

    for (const sub of cancelledSubs) {
      const productLine = sub.productMap?.productLine ?? '';
      const frequency = sub.productMap?.frequency ?? '';
      const campaignId = sub.campaignId ?? '';
      const bucket = ensureBucket('SHOPIFY', campaignId, '', productLine, frequency, '', '', '');
      bucket.cancelledSubscribers += 1;
    }

    for (const b of buckets.values()) {
      const avgOrderValue = b.totalOrders > 0 ? Math.round(b.totalRevenue / b.totalOrders) : 0;
      const sourceEnum = b.source === 'MERGED' ? 'SHOPIFY' : b.source;

      await prisma.dailySnapshot.upsert({
        where: {
          date_source_campaignId_productLine_frequency_channel_funnelId_pageUrl: {
            date: dateKey, source: sourceEnum as any, campaignId: b.campaignId || '',
            productLine: b.productLine || '', frequency: b.frequency || '',
            channel: b.channel || '', funnelId: b.funnelId || '', pageUrl: b.pageUrl || '',
          },
        },
        create: {
          date: dateKey, source: sourceEnum as any, campaignId: b.campaignId || '',
          campaignName: b.campaignName || null, productLine: b.productLine || '',
          frequency: b.frequency || '', channel: b.channel || '', funnelId: b.funnelId || '',
          pageUrl: b.pageUrl || '', totalOrders: b.totalOrders, newOrders: b.newOrders,
          recurringOrders: b.recurringOrders, totalRevenue: b.totalRevenue,
          checkoutRevenue: b.checkoutRevenue, recurringRevenue: b.recurringRevenue,
          refunds: b.refunds, newSubscribers: b.newSubscribers,
          cancelledSubscribers: b.cancelledSubscribers, avgOrderValue,
        },
        update: {
          campaignName: b.campaignName || null, totalOrders: b.totalOrders,
          newOrders: b.newOrders, recurringOrders: b.recurringOrders,
          totalRevenue: b.totalRevenue, checkoutRevenue: b.checkoutRevenue,
          recurringRevenue: b.recurringRevenue, refunds: b.refunds,
          newSubscribers: b.newSubscribers, cancelledSubscribers: b.cancelledSubscribers,
          avgOrderValue,
        },
      });
      totalUpserted += 1;
    }

    daysProcessed += 1;
    cursor = dayEnd;
  }

  return { daysProcessed, snapshotsUpserted: totalUpserted };
}
```

- [ ] **Step 2: Update build-snapshots.ts to use the shared module**

Replace the logic in `scripts/build-snapshots.ts` main() to import and call `rebuildSnapshots()`. Keep the CLI arg parsing and console output, but delegate the actual work:

```typescript
// At top: import { rebuildSnapshots } from '../src/core/sync/rebuild-snapshots';
// In main(): const { daysProcessed, snapshotsUpserted } = await rebuildSnapshots(from, to);
```

Note: The script uses `dotenv` for env loading which must happen before the import. Use dynamic import:

```typescript
async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const { rebuildSnapshots } = await import('../src/core/sync/rebuild-snapshots');

  const { from, to } = parseArgs();
  console.log(`Building snapshots from ${from.toISOString().slice(0, 10)} to ${to.toISOString().slice(0, 10)}`);

  const { daysProcessed, snapshotsUpserted } = await rebuildSnapshots(from, to);
  console.log(`Done — ${daysProcessed} days processed, ${snapshotsUpserted} snapshots created/updated`);
}
```

Keep `parseArgs()`, `dotenv` setup, and error handling in the script. Delete all the duplicated bucket/upsert logic.

- [ ] **Step 3: Commit**

```bash
git add src/core/sync/rebuild-snapshots.ts scripts/build-snapshots.ts
git commit -m "refactor: extract snapshot rebuild into shared module"
```

---

## Task 7B: Wire Snapshot Rebuild Into Sync Routes

**Files:**
- Modify: `app/api/sync/checkoutchamp/route.ts`
- Modify: `app/api/sync/shopify/route.ts`
- Modify: `app/api/cron/sync-cc/route.ts`

- [ ] **Step 1: Add snapshot rebuild call to CC sync route**

In `app/api/sync/checkoutchamp/route.ts`, after the successful sync:
```typescript
import { rebuildSnapshots } from '@/core/sync/rebuild-snapshots';

// After adapter.sync() succeeds:
const syncEnd = new Date();
const syncStart = body.startDate ? new Date(body.startDate) : new Date(syncEnd.getTime() - 5 * 60 * 60 * 1000);
rebuildSnapshots(syncStart, syncEnd).catch(err =>
  console.error('[sync/cc] snapshot rebuild failed:', err instanceof Error ? err.message : err)
);
```

Fire-and-forget — don't block the sync response. Log errors.

- [ ] **Step 2: Add snapshot rebuild to cron sync route**

In `app/api/cron/sync-cc/route.ts`, same pattern after sync completes.

- [ ] **Step 3: Add snapshot rebuild to Shopify sync route**

In `app/api/sync/shopify/route.ts`, same pattern after sync completes.

- [ ] **Step 4: Commit**

```bash
git add app/api/sync/checkoutchamp/route.ts app/api/sync/shopify/route.ts app/api/cron/sync-cc/route.ts
git commit -m "feat: automate DailySnapshot rebuild after sync"
```

---

## Task 8: Product Mapping Audit Page

**Files:**
- Create: `app/(dashboard)/operations/product-mapping/page.tsx`
- Modify: `app/(dashboard)/Sidebar.tsx`

- [ ] **Step 1: Create the page**

Create `app/(dashboard)/operations/product-mapping/page.tsx`:
```typescript
export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Product Mapping — ThermoSlim' };

import { prisma } from '@/lib/prisma';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function ProductMappingPage() {
  const [allMaps, totalItems, unlinkedItems, unlinkedSubs, gapRows] = await Promise.all([
    // All product maps with linked order count
    prisma.productMap.findMany({
      select: {
        id: true, name: true, productLine: true, category: true,
        ccCrmId: true, shopifyProductId: true, frequency: true, isSubscription: true,
        _count: { select: { orderItems: true } },
      },
      orderBy: { orderItems: { _count: 'desc' } },
    }),
    prisma.orderItem.count(),
    prisma.orderItem.count({ where: { productMapId: null } }),
    prisma.subscription.count({ where: { productMapId: null } }),
    // Gap analysis: unlinked items grouped by ccCrmId + name
    prisma.orderItem.groupBy({
      by: ['ccCrmId', 'name'],
      where: { productMapId: null },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 50,
    }),
  ]);

  const linkedItems = totalItems - unlinkedItems;
  const linkRate = totalItems > 0 ? Math.round((linkedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Product Mapping" subtitle="Audit product mapping coverage and identify gaps" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="ProductMap Entries" value={allMaps.length.toLocaleString()} />
        <KpiCard label="Linked Items" value={`${linkRate}%`} />
        <KpiCard label="Unlinked Items" value={unlinkedItems.toLocaleString()} />
        <KpiCard label="Unlinked Subs" value={unlinkedSubs.toLocaleString()} />
      </div>

      {/* Product Map Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">All Product Maps</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Name</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Product Line</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Category</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">CC CRM ID</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Shopify ID</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Frequency</th>
                <th className="px-4 py-3 text-center text-xs text-gray-500 uppercase tracking-wider font-medium">Sub?</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Linked Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {allMaps.map(pm => (
                <tr key={pm.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 text-gray-200 max-w-[250px] truncate">{pm.name}</td>
                  <td className="px-4 py-3.5 text-gray-300">{pm.productLine ?? '—'}</td>
                  <td className="px-4 py-3.5 text-gray-400">{pm.category ?? '—'}</td>
                  <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{pm.ccCrmId ?? '—'}</td>
                  <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{pm.shopifyProductId ? pm.shopifyProductId.slice(0, 12) + '…' : '—'}</td>
                  <td className="px-4 py-3.5 text-gray-400">{pm.frequency ?? '—'}</td>
                  <td className="px-4 py-3.5 text-center">{pm.isSubscription ? '✓' : '—'}</td>
                  <td className="px-4 py-3.5 text-right text-gray-300 tabular-nums">{pm._count.orderItems}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gaps Table */}
      {gapRows.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider">Unmapped Products</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">CC CRM ID</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Product Name</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Unlinked Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {gapRows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-3.5 text-gray-400 font-mono text-xs">{row.ccCrmId ?? '—'}</td>
                    <td className="px-6 py-3.5 text-gray-300">{row.name ?? 'Unknown'}</td>
                    <td className="px-6 py-3.5 text-right text-yellow-400 tabular-nums font-medium">{row._count.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add to Sidebar**

In `app/(dashboard)/Sidebar.tsx`, add to the Operations group after Ingestion Health:
```typescript
  { href: '/operations/product-mapping', label: 'Product Mapping' },
```

- [ ] **Step 3: Commit**

```bash
git add app/(dashboard)/operations/product-mapping/page.tsx app/(dashboard)/Sidebar.tsx
git commit -m "feat: add product mapping audit page"
```

---

## Task 9: Funnel Performance Page

**Files:**
- Create: `app/(dashboard)/performance/funnels/page.tsx`
- Create: `app/(dashboard)/performance/funnels/FunnelCard.tsx`
- Modify: `app/(dashboard)/Sidebar.tsx` (already modified in Task 8)

- [ ] **Step 1: Run funnel-sync to populate tables**

```bash
npx tsx src/adapters/checkoutchamp/funnel-sync.ts
```

If this fails or produces no data, the page will use fallback derivation from `salesUrl`.

- [ ] **Step 2: Create client component for expandable funnel cards**

Create `app/(dashboard)/performance/funnels/FunnelCard.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { fmt$, fmtK } from '@/lib/dashboard/formatting';

export type FunnelPageData = {
  pageType: string;
  slug: string;
  orders: number;
  revenue: number;
  products: { name: string; count: number; rate: number }[];
};

export type FunnelData = {
  name: string;
  ccReferenceId: string | null;
  totalOrders: number;
  totalRevenue: number;
  aov: number;
  pages: FunnelPageData[];
};

export function FunnelCard({ funnel }: { funnel: FunnelData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/40 transition-colors"
      >
        <div className="text-left">
          <h3 className="text-sm font-semibold text-white">{funnel.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{funnel.ccReferenceId ?? 'Derived from URLs'}</p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="text-right">
            <div className="text-gray-500 text-xs">Orders</div>
            <div className="text-gray-200 tabular-nums">{funnel.totalOrders}</div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 text-xs">Revenue</div>
            <div className="text-gray-200 tabular-nums">{fmtK(funnel.totalRevenue)}</div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 text-xs">AOV</div>
            <div className="text-gray-200 tabular-nums">{fmt$(funnel.aov)}</div>
          </div>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-800 px-6 py-4 space-y-4">
          {funnel.pages.map((page, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 bg-gray-800 rounded px-2 py-0.5 uppercase">
                    {page.pageType}
                  </span>
                  <span className="text-xs text-gray-600 font-mono">{page.slug}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-400">{page.orders} orders</span>
                  <span className="text-gray-300">{fmtK(page.revenue)}</span>
                </div>
              </div>
              {page.products.length > 0 && (
                <div className="ml-4 space-y-1">
                  {page.products.map((prod, j) => (
                    <div key={j} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{prod.name}</span>
                      <span className="tabular-nums">
                        <span className="text-gray-300">{prod.count}</span>
                        <span className="text-gray-600 ml-1">({(prod.rate * 100).toFixed(1)}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create the server page**

Create `app/(dashboard)/performance/funnels/page.tsx`:
```typescript
export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Funnel Performance — ThermoSlim' };

import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, parseRange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { FunnelCard, type FunnelData, type FunnelPageData } from './FunnelCard';

export default async function FunnelPerformancePage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate } = parseRange(sp.from, sp.to);

  // Try to use Funnel table first
  const funnels = await prisma.funnel.findMany({
    include: {
      pages: { orderBy: { sortOrder: 'asc' } },
    },
  });

  // Get orders with funnel data in date range
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      source: { in: ['SHOPIFY', 'MERGED'] },
      status: 'COMPLETE',
      OR: [
        { funnelReferenceId: { not: null } },
        { salesUrl: { not: null } },
      ],
    },
    select: {
      id: true, totalPrice: true, salesUrl: true,
      funnelReferenceId: true, campaignName: true,
      items: {
        select: {
          name: true, price: true, productType: true,
          productMap: { select: { name: true, productLine: true } },
        },
      },
    },
  });

  // Get upsell paths for take rates
  const upsellPaths = await prisma.upsellPath.findMany({
    where: {
      order: {
        createdAt: { gte: startDate, lte: endDate },
        source: { in: ['SHOPIFY', 'MERGED'] },
        status: 'COMPLETE',
      },
    },
    select: { upsellsAccepted: true, upsellsDeclined: true, revenueAdded: true },
  });

  const totalUpsellAccepted = upsellPaths.reduce((s, p) => s + p.upsellsAccepted, 0);
  const totalUpsellDeclined = upsellPaths.reduce((s, p) => s + p.upsellsDeclined, 0);
  const totalUpsellOffered = totalUpsellAccepted + totalUpsellDeclined;
  const overallTakeRate = totalUpsellOffered > 0 ? totalUpsellAccepted / totalUpsellOffered : 0;

  // Group orders by funnel
  const funnelMap = new Map<string, { name: string; ccReferenceId: string | null; orders: typeof orders }>();

  for (const order of orders) {
    const funnelKey = order.funnelReferenceId ?? deriveFunnelKey(order.salesUrl);
    if (!funnelKey) continue;

    if (!funnelMap.has(funnelKey)) {
      const matchedFunnel = funnels.find(f => f.ccReferenceId === funnelKey);
      funnelMap.set(funnelKey, {
        name: matchedFunnel?.name ?? order.campaignName ?? funnelKey,
        ccReferenceId: order.funnelReferenceId,
        orders: [],
      });
    }
    funnelMap.get(funnelKey)!.orders.push(order);
  }

  // Build funnel data for display
  const funnelData: FunnelData[] = [...funnelMap.entries()].map(([key, group]) => {
    const totalOrders = group.orders.length;
    const totalRevenue = group.orders.reduce((s, o) => s + o.totalPrice, 0);
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Group by page (from salesUrl slug)
    const pageMap = new Map<string, { orders: typeof orders; pageType: string }>();
    for (const order of group.orders) {
      const slug = getPageSlug(order.salesUrl);
      const pageType = inferPageType(slug);
      if (!pageMap.has(slug)) pageMap.set(slug, { orders: [], pageType });
      pageMap.get(slug)!.orders.push(order);
    }

    const pages: FunnelPageData[] = [...pageMap.entries()].map(([slug, pageGroup]) => {
      const pageOrders = pageGroup.orders.length;
      const pageRevenue = pageGroup.orders.reduce((s, o) => s + o.totalPrice, 0);

      // Product breakdown for this page
      const productCounts = new Map<string, number>();
      for (const order of pageGroup.orders) {
        for (const item of order.items) {
          const prodName = item.productMap?.productLine ?? item.name ?? 'Unknown';
          productCounts.set(prodName, (productCounts.get(prodName) ?? 0) + 1);
        }
      }

      const products = [...productCounts.entries()]
        .map(([name, count]) => ({ name, count, rate: pageOrders > 0 ? count / pageOrders : 0 }))
        .sort((a, b) => b.count - a.count);

      return { pageType: pageGroup.pageType, slug, orders: pageOrders, revenue: pageRevenue, products };
    });

    // Sort pages by type priority
    const typeOrder = ['checkout', 'upsell', 'downsell', 'thankyou', 'other'];
    pages.sort((a, b) => typeOrder.indexOf(a.pageType) - typeOrder.indexOf(b.pageType));

    return { name: group.name, ccReferenceId: group.ccReferenceId, totalOrders, totalRevenue, aov, pages };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totalFunnelOrders = orders.length;
  const totalFunnelRevenue = orders.reduce((s, o) => s + o.totalPrice, 0);
  const avgRevPerVisit = totalFunnelOrders > 0 ? Math.round(totalFunnelRevenue / totalFunnelOrders) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Funnel Performance" subtitle="Campaign funnel analytics from CheckoutChamp" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Funnels" value={funnelData.length.toLocaleString()} />
        <KpiCard label="Funnel Orders" value={totalFunnelOrders.toLocaleString()} />
        <KpiCard label="Upsell Take Rate" value={`${(overallTakeRate * 100).toFixed(1)}%`} />
        <KpiCard label="Avg Rev / Visit" value={fmt$(avgRevPerVisit)} />
      </div>

      <div className="space-y-3">
        {funnelData.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-10 text-center">
            <p className="text-gray-600 text-sm">No funnel data found. Run funnel-sync first.</p>
          </div>
        ) : (
          funnelData.map((funnel, i) => <FunnelCard key={i} funnel={funnel} />)
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveFunnelKey(salesUrl: string | null): string | null {
  if (!salesUrl) return null;
  try {
    const url = new URL(salesUrl);
    return url.pathname.split('/').filter(Boolean)[0] || null;
  } catch {
    return null;
  }
}

function getPageSlug(salesUrl: string | null): string {
  if (!salesUrl) return 'unknown';
  try {
    const url = new URL(salesUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts.length > 1 ? parts.slice(1).join('/') : parts[0] ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function inferPageType(slug: string): string {
  const lower = slug.toLowerCase();
  if (lower.includes('checkout') || lower.includes('order-form')) return 'checkout';
  if (lower.includes('downsell') || lower.includes('ds')) return 'downsell';
  if (lower.includes('upsell') || lower.includes('oto') || lower.includes('upgrade')) return 'upsell';
  if (lower.includes('thank') || lower.includes('confirm')) return 'thankyou';
  return 'other';
}
```

- [ ] **Step 4: Add Funnels to Sidebar**

In `app/(dashboard)/Sidebar.tsx`, add to the Performance group after Products:
```typescript
  { href: '/performance/funnels', label: 'Funnels' },
```

- [ ] **Step 5: Commit**

```bash
git add app/(dashboard)/performance/funnels/page.tsx app/(dashboard)/performance/funnels/FunnelCard.tsx app/(dashboard)/Sidebar.tsx
git commit -m "feat: add funnel performance page with expandable cards"
```

---

## Task 10: Run Pipeline Scripts + Verify

- [ ] **Step 1: Run seed script**

```bash
npx tsx scripts/seed.ts
```

Expected: "Bundle" product line entries should be gone. All mapped to "Body Sculpting Device".

- [ ] **Step 2: Run snapshot rebuild**

```bash
npx tsx scripts/build-snapshots.ts
```

Expected: Non-zero recurring orders in output. Product lines should be actual products, not "Bundle".

- [ ] **Step 3: Run funnel sync**

```bash
npx tsx src/adapters/checkoutchamp/funnel-sync.ts
```

Expected: Funnel and FunnelPage tables populated.

- [ ] **Step 4: Verify Products Performance page**

Load `/performance/products` — should show "Body Sculpting Device" instead of "Bundle", with non-zero recurring counts.

- [ ] **Step 5: Verify all new/modified pages load without errors**

- `/orders/{any-order-id}` — Shopify + CC links visible
- `/subscriptions/frequency` — matrix table visible
- `/orders/rebills` — pagination controls, status tabs
- `/operations/product-mapping` — audit tables
- `/performance/funnels` — funnel cards

- [ ] **Step 6: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address verification issues from sprint testing"
```
