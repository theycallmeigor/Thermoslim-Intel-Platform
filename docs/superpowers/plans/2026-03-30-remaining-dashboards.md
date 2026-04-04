# Remaining Dashboard Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 7 dashboard pages using existing database data, completing the core BI platform.

**Architecture:** Each page is an async Next.js server component under `app/(dashboard)/`. Data fetching via Prisma, charts via Recharts client components. All pages inherit sidebar + topbar from the shared layout. Use `DailySnapshot` for time-series aggregations, direct table queries for detail/real-time views.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Prisma

---

## CRITICAL RULES — READ BEFORE EVERY TASK

These rules exist because of real bugs we hit. Violating them WILL break the app.

### 1. Schema Drift — NEVER use `include: { relation: true }`

The Prisma schema has columns that DO NOT exist in the actual database. Always use `select` with specific fields.

**BAD:** `include: { customer: true }` — will crash at runtime
**GOOD:** `customer: { select: { email: true, fullName: true } }`

### 2. Actual Database Columns (verified 2026-03-30)

Use ONLY these columns in queries:

**Customer:** `id, email, phone, firstName, lastName, fullName, ccCustomerId, shopifyCustomerId, contactOptIn, createdAt`
- **MISSING from DB:** `totalOrders, totalRevenue, firstOrderAt, lastOrderAt` — compute from relations instead

**Order:** `id, source, sourceOrderId, sourceClientOrderId, customerId, status, orderTotal, totalPrice, totalShipping, totalDiscount, salesTax, currencyCode, campaignId, campaignName, salesUrl, hasUpsells, couponCode, ipAddress, paySource, responseType, createdAt, syncedAt, shopifyOrderId, ccOrderType, tags, funnelReferenceId, declineReason, funnelPageId, avsResponse, browser, cardIsDebit, cardIsPrepaid, cardLast4, cardType, ccCustom1, ccCustom2, cvvResponse, device, fulfillmentData, geoCountry, geoState, isDeclineSave, refundRemaining, userAgent, ccSourceOrderId`

**OrderItem:** `id, orderId, productSlot, productMapId, ccCrmId, ccCampaignProductId, externalId, name, sku, price, quantity, recurringStatus, billingCycleNumber, recurringPrice, productCategoryId, productCategoryName, replacedByOrderItemId, merchantId, productDescription, productType, responseType, txnType`

**Subscription:** `id, customerId, ccPurchaseId, ccClientPurchaseId, originalOrderId, productMapId, status, currentBillingCycle, recurringPrice, frequency, campaignId, startedAt, cancelledAt, cancelReason, lastBilledAt, nextBillDate`

**SubscriptionEvent:** `id, subscriptionId, eventType, fromStatus, toStatus, billingCycleNumber, amount, declineReason, metadata, occurredAt`

**RevenueEvent:** `id, orderId, customerId, eventType, amount, source, refundReason, chargebackReasonCode, transactionId, occurredAt`

**DailySnapshot:** `id, date, source, campaignId, campaignName, productLine, frequency, channel, funnelId, pageUrl, totalOrders, newOrders, recurringOrders, totalRevenue, checkoutRevenue, recurringRevenue, refunds, chargebacks, newSubscribers, cancelledSubscribers, activeSubscribers, activeMRR, avgOrderValue, churnRate, pageViews, uniqueVisitors`

**ProductMap:** `id, shopifyProductId, shopifyVariantId, ccCrmId, ccCampaignProductIds, externalId, name, sku, productLine, category, frequency, priceTier, isSubscription, metadata, createdAt, updatedAt`

**Attribution:** `id, orderId, sourceId, pubId, subAffId, sourceValue1-5, utmSource, utmMedium, utmCampaign, utmContent, utmTerm, httpReferer, userAgent`

### 3. Revenue Definition — Single Source of Truth

- Revenue = `Order.totalPrice` where `source IN ('SHOPIFY', 'MERGED')` and `status = 'COMPLETE'`
- `DailySnapshot` already contains only deduplicated COMPLETE orders — safe to sum directly
- Raw `CHECKOUTCHAMP` orders are duplicates — NEVER count them for revenue or order totals

### 4. Money is in Cents

All monetary values in the database are stored as integers (cents). Use `fmt$()` for exact display ($49.99), `fmtK()` for abbreviated ($1.0k), `fmtDollars()` for compact ($50).

### 5. Page Boilerplate

Every page starts with:
```tsx
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { fmt$, fmtK, fmtDollars, pctChange, parseRange } from '@/lib/dashboard/formatting';
import { statusColors, sourceColors, humanizeStatus, humanizeSource, chartColors } from '@/lib/dashboard/colors';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
```

### 6. searchParams is a Promise

In Next.js 14+, `searchParams` must be awaited:
```tsx
export default async function Page({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate, prevStart, prevEnd } = parseRange(sp.from, sp.to);
```

### 7. Shared Component Props (actual signatures)

```tsx
// KpiCard — label and value required, rest optional
<KpiCard label="Revenue" value="$10.5k" change="+12.3%" positive={true} sub="vs prev period" />

// Badge — label required, colorClass optional (defaults to gray)
<Badge label="Complete" colorClass={statusColors['COMPLETE']} />

// PageHeader — title required, subtitle and children optional
<PageHeader title="Page Name" subtitle="Description">
  <button>Action</button>
</PageHeader>
```

### 8. Chart Component Pattern

```tsx
// Always 'use client', always import chartColors
'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';

// Always use this tooltip/grid pattern:
<CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
<XAxis dataKey="date" tick={{ fill: chartColors.tick, fontSize: 10 }} interval="preserveStartEnd" />
<YAxis tick={{ fill: chartColors.tick, fontSize: 10 }} />
<Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} />
```

### 9. Table Pattern

```tsx
<div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-800">
    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Title</h3>
  </div>
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-800">
          <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Col</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800/60">
        {rows.map(row => (
          <tr key={row.id} className="hover:bg-gray-800/40 transition-colors">
            <td className="px-6 py-3.5 text-gray-300">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

### 10. Working Directory

All work happens in: `/Users/igordviniatin/Documents/thermoslim-platform/.worktrees/foundation-shell`
(Git worktree on branch `feature/foundation-shell`)

### 11. After Each Task

Run `npx vitest run` to ensure no tests break. Then commit.

---

## File Map

**New files to create:**

| File | Responsibility |
|------|---------------|
| `app/(dashboard)/subscriptions/churn/page.tsx` | Churn analytics — cancel reasons, trends, rate |
| `app/(dashboard)/subscriptions/churn/ChurnTrendChart.tsx` | Line chart of cancellations over time |
| `app/(dashboard)/subscriptions/churn/CancelReasonsChart.tsx` | Bar chart of cancel reasons |
| `app/(dashboard)/orders/refunds/page.tsx` | Refunds & chargebacks — amounts, trends |
| `app/(dashboard)/orders/refunds/RefundTrendChart.tsx` | Stacked area chart of refunds + chargebacks |
| `app/(dashboard)/performance/campaigns/page.tsx` | Campaign performance from DailySnapshot |
| `app/(dashboard)/performance/campaigns/CampaignChart.tsx` | Bar chart of top campaigns by revenue |
| `app/(dashboard)/performance/products/page.tsx` | Product performance from DailySnapshot |
| `app/(dashboard)/performance/products/ProductChart.tsx` | Bar chart of product lines by revenue |
| `app/(dashboard)/orders/payments/page.tsx` | Payment health — decline rates, card types |
| `app/(dashboard)/orders/payments/DeclineTrendChart.tsx` | Line chart of decline rate over time |
| `app/(dashboard)/subscriptions/cohorts/page.tsx` | Cohort retention heatmap |
| `app/(dashboard)/subscriptions/frequency/page.tsx` | Frequency analysis — 1mo vs 3mo vs 6mo |
| `app/(dashboard)/subscriptions/frequency/FrequencyDonut.tsx` | Pie chart of frequency distribution |

**File to modify:**
| File | Change |
|------|--------|
| `app/(dashboard)/Sidebar.tsx` | Already has all nav links — no changes needed |

---

### Task 1: Churn Analytics

**Files:**
- Create: `app/(dashboard)/subscriptions/churn/page.tsx`
- Create: `app/(dashboard)/subscriptions/churn/ChurnTrendChart.tsx`
- Create: `app/(dashboard)/subscriptions/churn/CancelReasonsChart.tsx`

- [ ] **Step 1: Create ChurnTrendChart client component**

```tsx
// app/(dashboard)/subscriptions/churn/ChurnTrendChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';

export interface ChurnDay {
  date: string;
  cancelled: number;
  paused: number;
}

export function ChurnTrendChart({ data }: { data: ChurnDay[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No churn data</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis dataKey="date" tick={{ fill: chartColors.tick, fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fill: chartColors.tick, fontSize: 10 }} />
        <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} />
        <Line type="monotone" dataKey="cancelled" stroke={chartColors.red} strokeWidth={2} dot={false} name="Cancelled" />
        <Line type="monotone" dataKey="paused" stroke={chartColors.orange} strokeWidth={2} dot={false} name="Paused" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Create CancelReasonsChart client component**

```tsx
// app/(dashboard)/subscriptions/churn/CancelReasonsChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';

export interface ReasonCount {
  reason: string;
  count: number;
}

export function CancelReasonsChart({ data }: { data: ReasonCount[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No cancel reasons recorded</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis type="number" tick={{ fill: chartColors.tick, fontSize: 10 }} />
        <YAxis dataKey="reason" type="category" tick={{ fill: chartColors.tick, fontSize: 10 }} width={110} />
        <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="count" fill={chartColors.red} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: Create churn page**

```tsx
// app/(dashboard)/subscriptions/churn/page.tsx
export const dynamic = 'force-dynamic';

import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { parseRange, pctChange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { ChurnTrendChart, type ChurnDay } from './ChurnTrendChart';
import { CancelReasonsChart, type ReasonCount } from './CancelReasonsChart';

export default async function ChurnPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate, prevStart, prevEnd } = parseRange(sp.from, sp.to);

  const [cancelled, prevCancelled, paused, activeSubs, cancelledEvents, cancelReasons] = await Promise.all([
    // Cancelled in period
    prisma.subscription.count({
      where: { status: 'CANCELLED', cancelledAt: { gte: startDate, lte: endDate } },
    }),
    // Cancelled in previous period
    prisma.subscription.count({
      where: { status: 'CANCELLED', cancelledAt: { gte: prevStart, lte: prevEnd } },
    }),
    // Paused in period (from events)
    prisma.subscriptionEvent.count({
      where: { eventType: 'PAUSED', occurredAt: { gte: startDate, lte: endDate } },
    }),
    // Active subs (for churn rate denominator)
    prisma.subscription.count({
      where: { status: { in: ['ACTIVE', 'TRIAL'] } },
    }),
    // Daily cancel + pause events for trend chart
    prisma.subscriptionEvent.findMany({
      where: {
        eventType: { in: ['CANCELLED', 'PAUSED'] },
        occurredAt: { gte: startDate, lte: endDate },
      },
      select: { eventType: true, occurredAt: true },
      orderBy: { occurredAt: 'asc' },
    }),
    // Cancel reasons
    prisma.subscription.groupBy({
      by: ['cancelReason'],
      where: { cancelledAt: { gte: startDate, lte: endDate }, cancelReason: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ]);

  // Build trend data
  const dayMap = new Map<string, { cancelled: number; paused: number }>();
  for (const e of cancelledEvents) {
    const dk = format(new Date(e.occurredAt), 'MMM d');
    const entry = dayMap.get(dk) ?? { cancelled: 0, paused: 0 };
    if (e.eventType === 'CANCELLED') entry.cancelled += 1;
    else entry.paused += 1;
    dayMap.set(dk, entry);
  }
  const trendData: ChurnDay[] = [...dayMap.entries()].map(([date, v]) => ({ date, ...v }));

  // Build cancel reasons data
  const reasonData: ReasonCount[] = cancelReasons.map(r => ({
    reason: (r.cancelReason ?? 'Unknown').slice(0, 30),
    count: r._count.id,
  }));

  // Churn rate = cancelled in period / active subs at start
  const churnRate = activeSubs > 0 ? ((cancelled / activeSubs) * 100).toFixed(1) + '%' : '—';
  const cancelChange = pctChange(cancelled, prevCancelled);

  return (
    <div className="space-y-6">
      <PageHeader title="Churn Analytics" subtitle="Subscription cancellations and pauses" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Cancelled (Period)" value={cancelled.toLocaleString()} change={cancelChange} positive={cancelChange ? cancelChange.startsWith('-') : undefined} />
        <KpiCard label="Paused (Period)" value={paused.toLocaleString()} />
        <KpiCard label="Churn Rate" value={churnRate} sub="cancelled / active subs" />
        <KpiCard label="Active Subscribers" value={activeSubs.toLocaleString()} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Cancellation & Pause Trend</h3>
          <ChurnTrendChart data={trendData} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Top Cancel Reasons</h3>
          <CancelReasonsChart data={reasonData} />
        </div>
      </div>

      {/* Recent cancellations table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Cancellations</h3>
        </div>
        {/* Fetch inline for table to keep the Promise.all clean */}
        <RecentCancellationsTable startDate={startDate} endDate={endDate} />
      </div>
    </div>
  );
}

async function RecentCancellationsTable({ startDate, endDate }: { startDate: Date; endDate: Date }) {
  const cancellations = await prisma.subscription.findMany({
    where: { status: 'CANCELLED', cancelledAt: { gte: startDate, lte: endDate } },
    select: {
      id: true,
      cancelledAt: true,
      cancelReason: true,
      recurringPrice: true,
      frequency: true,
      currentBillingCycle: true,
      customer: { select: { email: true } },
      productMap: { select: { name: true } },
    },
    orderBy: { cancelledAt: 'desc' },
    take: 30,
  });

  const { fmt$ } = await import('@/lib/dashboard/formatting');

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Date</th>
            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Customer</th>
            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Product</th>
            <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Price</th>
            <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Cycle</th>
            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Reason</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {cancellations.map(s => (
            <tr key={s.id} className="hover:bg-gray-800/40 transition-colors">
              <td className="px-6 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                {s.cancelledAt ? format(new Date(s.cancelledAt), 'MMM d, yyyy') : '—'}
              </td>
              <td className="px-6 py-3.5 text-gray-300 font-mono text-xs">{s.customer.email}</td>
              <td className="px-6 py-3.5 text-gray-300 text-xs">{s.productMap?.name ?? '—'}</td>
              <td className="px-6 py-3.5 text-right text-gray-200 tabular-nums">{fmt$(s.recurringPrice)}</td>
              <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{s.currentBillingCycle}</td>
              <td className="px-6 py-3.5 text-gray-500 text-xs truncate max-w-[200px]">{s.cancelReason ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `cd /Users/igordviniatin/Documents/thermoslim-platform/.worktrees/foundation-shell && npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
cd /Users/igordviniatin/Documents/thermoslim-platform/.worktrees/foundation-shell
git add "app/(dashboard)/subscriptions/churn/"
git commit -m "feat: add churn analytics dashboard page"
```

---

### Task 2: Refunds & Chargebacks

**Files:**
- Create: `app/(dashboard)/orders/refunds/page.tsx`
- Create: `app/(dashboard)/orders/refunds/RefundTrendChart.tsx`

- [ ] **Step 1: Create RefundTrendChart client component**

```tsx
// app/(dashboard)/orders/refunds/RefundTrendChart.tsx
'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';

export interface RefundDay {
  date: string;
  refunds: number;
  chargebacks: number;
}

export function RefundTrendChart({ data }: { data: RefundDay[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No refund data</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis dataKey="date" tick={{ fill: chartColors.tick, fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fill: chartColors.tick, fontSize: 10 }} />
        <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} />
        <Area type="monotone" dataKey="refunds" stackId="1" fill={chartColors.purple} stroke={chartColors.purple} fillOpacity={0.3} name="Refunds" />
        <Area type="monotone" dataKey="chargebacks" stackId="1" fill={chartColors.red} stroke={chartColors.red} fillOpacity={0.3} name="Chargebacks" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Create refunds page**

```tsx
// app/(dashboard)/orders/refunds/page.tsx
export const dynamic = 'force-dynamic';

import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, parseRange, pctChange } from '@/lib/dashboard/formatting';
import { humanizeSource, sourceColors } from '@/lib/dashboard/colors';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { RefundTrendChart, type RefundDay } from './RefundTrendChart';

export default async function RefundsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate, prevStart, prevEnd } = parseRange(sp.from, sp.to);

  const [refunds, prevRefunds, chargebacks, prevChargebacks, events, totalRevenue] = await Promise.all([
    prisma.revenueEvent.aggregate({
      where: { eventType: 'REFUND', occurredAt: { gte: startDate, lte: endDate } },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.revenueEvent.aggregate({
      where: { eventType: 'REFUND', occurredAt: { gte: prevStart, lte: prevEnd } },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.revenueEvent.aggregate({
      where: { eventType: 'CHARGEBACK', occurredAt: { gte: startDate, lte: endDate } },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.revenueEvent.aggregate({
      where: { eventType: 'CHARGEBACK', occurredAt: { gte: prevStart, lte: prevEnd } },
      _count: { id: true },
      _sum: { amount: true },
    }),
    // All refund+chargeback events for trend chart
    prisma.revenueEvent.findMany({
      where: {
        eventType: { in: ['REFUND', 'CHARGEBACK'] },
        occurredAt: { gte: startDate, lte: endDate },
      },
      select: { eventType: true, occurredAt: true, amount: true },
      orderBy: { occurredAt: 'asc' },
    }),
    // Total revenue for refund rate calculation
    prisma.revenueEvent.aggregate({
      where: { eventType: { in: ['SALE', 'REBILL'] }, occurredAt: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),
  ]);

  // Build trend data
  const dayMap = new Map<string, { refunds: number; chargebacks: number }>();
  for (const e of events) {
    const dk = format(new Date(e.occurredAt), 'MMM d');
    const entry = dayMap.get(dk) ?? { refunds: 0, chargebacks: 0 };
    if (e.eventType === 'REFUND') entry.refunds += 1;
    else entry.chargebacks += 1;
    dayMap.set(dk, entry);
  }
  const trendData: RefundDay[] = [...dayMap.entries()].map(([date, v]) => ({ date, ...v }));

  const refundAmt = refunds._sum.amount ?? 0;
  const cbAmt = chargebacks._sum.amount ?? 0;
  const totalRev = totalRevenue._sum.amount ?? 0;
  const refundRate = totalRev > 0 ? ((refundAmt / totalRev) * 100).toFixed(1) + '%' : '—';
  const cbRate = totalRev > 0 ? ((cbAmt / totalRev) * 100).toFixed(2) + '%' : '—';

  // Recent events table
  const recentEvents = await prisma.revenueEvent.findMany({
    where: {
      eventType: { in: ['REFUND', 'CHARGEBACK'] },
      occurredAt: { gte: startDate, lte: endDate },
    },
    select: {
      id: true,
      eventType: true,
      amount: true,
      source: true,
      refundReason: true,
      chargebackReasonCode: true,
      occurredAt: true,
      customer: { select: { email: true } },
    },
    orderBy: { occurredAt: 'desc' },
    take: 40,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Refunds & Chargebacks" subtitle="Money leaving the business" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Refunds" value={fmtK(refundAmt)} change={pctChange(refundAmt, prevRefunds._sum.amount ?? 0)} positive={false} sub={`${refunds._count.id} events`} />
        <KpiCard label="Chargebacks" value={fmtK(cbAmt)} change={pctChange(cbAmt, prevChargebacks._sum.amount ?? 0)} positive={false} sub={`${chargebacks._count.id} events`} />
        <KpiCard label="Refund Rate" value={refundRate} sub="refunds / gross revenue" />
        <KpiCard label="Chargeback Rate" value={cbRate} sub="chargebacks / gross revenue" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Refund & Chargeback Trend</h3>
        <RefundTrendChart data={trendData} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Events</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Date</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Type</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Customer</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Amount</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Source</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {recentEvents.map(e => (
                <tr key={e.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 text-gray-400 text-xs whitespace-nowrap">{format(new Date(e.occurredAt), 'MMM d, yyyy')}</td>
                  <td className="px-6 py-3.5">
                    <Badge label={e.eventType} colorClass={e.eventType === 'REFUND' ? 'bg-purple-500/10 text-purple-400' : 'bg-red-500/10 text-red-400'} />
                  </td>
                  <td className="px-6 py-3.5 text-gray-300 font-mono text-xs">{e.customer.email}</td>
                  <td className="px-6 py-3.5 text-right text-red-400 tabular-nums font-medium">{fmt$(e.amount)}</td>
                  <td className="px-6 py-3.5"><Badge label={humanizeSource(e.source)} colorClass={sourceColors[e.source]} /></td>
                  <td className="px-6 py-3.5 text-gray-500 text-xs truncate max-w-[200px]">{e.refundReason ?? e.chargebackReasonCode ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify and commit**

```bash
cd /Users/igordviniatin/Documents/thermoslim-platform/.worktrees/foundation-shell
npx vitest run
git add "app/(dashboard)/orders/refunds/"
git commit -m "feat: add refunds & chargebacks dashboard page"
```

---

### Task 3: Campaign Performance

**Files:**
- Create: `app/(dashboard)/performance/campaigns/page.tsx`
- Create: `app/(dashboard)/performance/campaigns/CampaignChart.tsx`

- [ ] **Step 1: Create CampaignChart client component**

```tsx
// app/(dashboard)/performance/campaigns/CampaignChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';
import { fmtDollars } from '@/lib/dashboard/formatting';

export interface CampaignBar {
  name: string;
  revenue: number;
  orders: number;
}

export function CampaignChart({ data }: { data: CampaignBar[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No campaign data</p>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 140 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis type="number" tick={{ fill: chartColors.tick, fontSize: 10 }} tickFormatter={(v) => fmtDollars(v)} />
        <YAxis dataKey="name" type="category" tick={{ fill: chartColors.tick, fontSize: 10 }} width={130} />
        <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmtDollars(v)} />
        <Bar dataKey="revenue" fill={chartColors.primary} radius={[0, 4, 4, 0]} name="Revenue" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Create campaigns page**

Data source: `DailySnapshot` grouped by `campaignId`. This is already deduplicated and COMPLETE-only.

```tsx
// app/(dashboard)/performance/campaigns/page.tsx
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, fmtDollars, parseRange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { CampaignChart, type CampaignBar } from './CampaignChart';

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate } = parseRange(sp.from, sp.to);

  const snapshots = await prisma.dailySnapshot.findMany({
    where: { date: { gte: startDate, lte: endDate }, campaignId: { not: '' } },
    select: { campaignId: true, campaignName: true, totalOrders: true, totalRevenue: true, newSubscribers: true, newOrders: true, recurringOrders: true },
  });

  // Aggregate by campaign
  const campMap = new Map<string, { name: string; orders: number; revenue: number; newSubs: number; newOrders: number; recurringOrders: number }>();
  for (const s of snapshots) {
    if (!s.campaignId) continue;
    const entry = campMap.get(s.campaignId) ?? { name: s.campaignName || s.campaignId, orders: 0, revenue: 0, newSubs: 0, newOrders: 0, recurringOrders: 0 };
    entry.orders += s.totalOrders;
    entry.revenue += s.totalRevenue;
    entry.newSubs += s.newSubscribers;
    entry.newOrders += s.newOrders;
    entry.recurringOrders += s.recurringOrders;
    if (s.campaignName) entry.name = s.campaignName;
    campMap.set(s.campaignId, entry);
  }

  const campaigns = [...campMap.entries()]
    .map(([id, v]) => ({ id, ...v, aov: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0 }))
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const totalOrders = campaigns.reduce((s, c) => s + c.orders, 0);
  const totalNewSubs = campaigns.reduce((s, c) => s + c.newSubs, 0);

  const chartData: CampaignBar[] = campaigns.slice(0, 10).map(c => ({
    name: c.name.length > 25 ? c.name.slice(0, 22) + '...' : c.name,
    revenue: c.revenue,
    orders: c.orders,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Campaign Performance" subtitle="Revenue and orders by campaign" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Revenue" value={fmtK(totalRevenue)} />
        <KpiCard label="Total Orders" value={totalOrders.toLocaleString()} />
        <KpiCard label="New Subscribers" value={totalNewSubs.toLocaleString()} />
        <KpiCard label="Campaigns Active" value={campaigns.length.toLocaleString()} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Top 10 Campaigns by Revenue</h3>
        <CampaignChart data={chartData} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">All Campaigns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Campaign</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Orders</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">New</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Recurring</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Revenue</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">AOV</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">New Subs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 text-gray-300 text-xs truncate max-w-[200px]">{c.name}</td>
                  <td className="px-6 py-3.5 text-right text-gray-300 tabular-nums">{c.orders}</td>
                  <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{c.newOrders}</td>
                  <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{c.recurringOrders}</td>
                  <td className="px-6 py-3.5 text-right text-gray-200 tabular-nums font-medium">{fmtK(c.revenue)}</td>
                  <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{fmt$(c.aov)}</td>
                  <td className="px-6 py-3.5 text-right text-blue-400 tabular-nums">{c.newSubs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify and commit**

```bash
cd /Users/igordviniatin/Documents/thermoslim-platform/.worktrees/foundation-shell
npx vitest run
git add "app/(dashboard)/performance/campaigns/"
git commit -m "feat: add campaign performance dashboard page"
```

---

### Task 4: Product Performance

**Files:**
- Create: `app/(dashboard)/performance/products/page.tsx`
- Create: `app/(dashboard)/performance/products/ProductChart.tsx`

- [ ] **Step 1: Create ProductChart client component**

```tsx
// app/(dashboard)/performance/products/ProductChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';
import { fmtDollars } from '@/lib/dashboard/formatting';

export interface ProductBar {
  name: string;
  revenue: number;
  orders: number;
}

export function ProductChart({ data }: { data: ProductBar[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No product data</p>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis dataKey="name" tick={{ fill: chartColors.tick, fontSize: 10 }} />
        <YAxis tick={{ fill: chartColors.tick, fontSize: 10 }} tickFormatter={(v) => fmtDollars(v)} />
        <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmtDollars(v)} />
        <Bar dataKey="revenue" fill={chartColors.green} radius={[4, 4, 0, 0]} name="Revenue" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Create products page**

Data source: `DailySnapshot` grouped by `productLine`.

```tsx
// app/(dashboard)/performance/products/page.tsx
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, fmtDollars, parseRange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProductChart, type ProductBar } from './ProductChart';

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate } = parseRange(sp.from, sp.to);

  const snapshots = await prisma.dailySnapshot.findMany({
    where: { date: { gte: startDate, lte: endDate }, productLine: { not: '' } },
    select: { productLine: true, totalOrders: true, totalRevenue: true, newOrders: true, recurringOrders: true, newSubscribers: true },
  });

  // Aggregate by product line
  const prodMap = new Map<string, { orders: number; revenue: number; newOrders: number; recurringOrders: number; newSubs: number }>();
  for (const s of snapshots) {
    if (!s.productLine) continue;
    const entry = prodMap.get(s.productLine) ?? { orders: 0, revenue: 0, newOrders: 0, recurringOrders: 0, newSubs: 0 };
    entry.orders += s.totalOrders;
    entry.revenue += s.totalRevenue;
    entry.newOrders += s.newOrders;
    entry.recurringOrders += s.recurringOrders;
    entry.newSubs += s.newSubscribers;
    prodMap.set(s.productLine, entry);
  }

  const products = [...prodMap.entries()]
    .map(([name, v]) => ({ name, ...v, aov: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0 }))
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);
  const totalOrders = products.reduce((s, p) => s + p.orders, 0);
  const topProduct = products[0]?.name ?? '—';

  const chartData: ProductBar[] = products.slice(0, 8).map(p => ({ name: p.name, revenue: p.revenue, orders: p.orders }));

  return (
    <div className="space-y-6">
      <PageHeader title="Product Performance" subtitle="Revenue and orders by product line" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Revenue" value={fmtK(totalRevenue)} />
        <KpiCard label="Total Orders" value={totalOrders.toLocaleString()} />
        <KpiCard label="Product Lines" value={products.length.toLocaleString()} />
        <KpiCard label="Top Product" value={topProduct} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Revenue by Product Line</h3>
        <ProductChart data={chartData} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">All Products</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Product Line</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Orders</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">New</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Recurring</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Revenue</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">AOV</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {products.map(p => (
                <tr key={p.name} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 text-gray-300 font-medium">{p.name}</td>
                  <td className="px-6 py-3.5 text-right text-gray-300 tabular-nums">{p.orders}</td>
                  <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{p.newOrders}</td>
                  <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{p.recurringOrders}</td>
                  <td className="px-6 py-3.5 text-right text-gray-200 tabular-nums font-medium">{fmtK(p.revenue)}</td>
                  <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{fmt$(p.aov)}</td>
                  <td className="px-6 py-3.5 text-right text-gray-500 tabular-nums">{totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) + '%' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify and commit**

```bash
cd /Users/igordviniatin/Documents/thermoslim-platform/.worktrees/foundation-shell
npx vitest run
git add "app/(dashboard)/performance/products/"
git commit -m "feat: add product performance dashboard page"
```

---

### Task 5: Payment Health

**Files:**
- Create: `app/(dashboard)/orders/payments/page.tsx`
- Create: `app/(dashboard)/orders/payments/DeclineTrendChart.tsx`

- [ ] **Step 1: Create DeclineTrendChart client component**

```tsx
// app/(dashboard)/orders/payments/DeclineTrendChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';

export interface DeclineDay {
  date: string;
  total: number;
  declined: number;
  rate: number;
}

export function DeclineTrendChart({ data }: { data: DeclineDay[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No payment data</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis dataKey="date" tick={{ fill: chartColors.tick, fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fill: chartColors.tick, fontSize: 10 }} unit="%" />
        <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => v.toFixed(1) + '%'} />
        <Line type="monotone" dataKey="rate" stroke={chartColors.red} strokeWidth={2} dot={false} name="Decline Rate" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Create payments page**

Data source: `Order` table — payment fields (paySource, cardType, responseType, declineReason).

```tsx
// app/(dashboard)/orders/payments/page.tsx
export const dynamic = 'force-dynamic';

import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, parseRange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { DeclineTrendChart, type DeclineDay } from './DeclineTrendChart';

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate } = parseRange(sp.from, sp.to);

  const where = { source: { in: ['SHOPIFY' as const, 'MERGED' as const] }, createdAt: { gte: startDate, lte: endDate } };

  const [totalOrders, declinedOrders, cardTypeBreakdown, paySourceBreakdown, topDeclineReasons, dailyOrders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.count({ where: { ...where, status: 'DECLINED' } }),
    prisma.order.groupBy({
      by: ['cardType'],
      where: { ...where, cardType: { not: null } },
      _count: { id: true },
      _sum: { totalPrice: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.order.groupBy({
      by: ['paySource'],
      where: { ...where, paySource: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.order.groupBy({
      by: ['declineReason'],
      where: { ...where, status: 'DECLINED', declineReason: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    // Daily totals for decline rate trend
    prisma.order.findMany({
      where,
      select: { createdAt: true, status: true },
    }),
  ]);

  const declineRate = totalOrders > 0 ? ((declinedOrders / totalOrders) * 100).toFixed(1) + '%' : '—';
  const approvalRate = totalOrders > 0 ? (((totalOrders - declinedOrders) / totalOrders) * 100).toFixed(1) + '%' : '—';

  // Build daily decline rate trend
  const dayTotals = new Map<string, { total: number; declined: number }>();
  for (const o of dailyOrders) {
    const dk = format(new Date(o.createdAt), 'MMM d');
    const entry = dayTotals.get(dk) ?? { total: 0, declined: 0 };
    entry.total += 1;
    if (o.status === 'DECLINED') entry.declined += 1;
    dayTotals.set(dk, entry);
  }
  const trendData: DeclineDay[] = [...dayTotals.entries()].map(([date, v]) => ({
    date,
    total: v.total,
    declined: v.declined,
    rate: v.total > 0 ? (v.declined / v.total) * 100 : 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Payment Health" subtitle="Decline rates, card types, and processor performance" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Transactions" value={totalOrders.toLocaleString()} />
        <KpiCard label="Declined" value={declinedOrders.toLocaleString()} />
        <KpiCard label="Decline Rate" value={declineRate} />
        <KpiCard label="Approval Rate" value={approvalRate} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Daily Decline Rate</h3>
        <DeclineTrendChart data={trendData} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Card Types */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Card Types</h3>
          <div className="space-y-2">
            {cardTypeBreakdown.map(c => (
              <div key={c.cardType ?? 'unknown'} className="flex justify-between text-xs">
                <span className="text-gray-300">{c.cardType ?? 'Unknown'}</span>
                <span className="text-gray-400 tabular-nums">{c._count.id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pay Sources */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment Methods</h3>
          <div className="space-y-2">
            {paySourceBreakdown.map(p => (
              <div key={p.paySource ?? 'unknown'} className="flex justify-between text-xs">
                <span className="text-gray-300">{p.paySource ?? 'Unknown'}</span>
                <span className="text-gray-400 tabular-nums">{p._count.id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Decline Reasons */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Top Decline Reasons</h3>
          <div className="space-y-2">
            {topDeclineReasons.map(r => (
              <div key={r.declineReason ?? 'unknown'} className="flex justify-between text-xs">
                <span className="text-gray-300 truncate max-w-[150px]">{r.declineReason ?? 'Unknown'}</span>
                <span className="text-red-400 tabular-nums">{r._count.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify and commit**

```bash
cd /Users/igordviniatin/Documents/thermoslim-platform/.worktrees/foundation-shell
npx vitest run
git add "app/(dashboard)/orders/payments/"
git commit -m "feat: add payment health dashboard page"
```

---

### Task 6: Cohort Retention

**Files:**
- Create: `app/(dashboard)/subscriptions/cohorts/page.tsx`

- [ ] **Step 1: Create cohorts page with heatmap**

This page uses a server-rendered heatmap (no client chart needed — CSS grid is cleaner for heatmaps).

```tsx
// app/(dashboard)/subscriptions/cohorts/page.tsx
export const dynamic = 'force-dynamic';

import { format, startOfMonth, addMonths, differenceInMonths } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';

export default async function CohortsPage() {
  // Get all subscriptions with their events
  const subs = await prisma.subscription.findMany({
    select: {
      id: true,
      startedAt: true,
      status: true,
      cancelledAt: true,
      events: {
        select: { eventType: true, occurredAt: true },
        where: { eventType: { in: ['BILLED', 'CANCELLED'] } },
        orderBy: { occurredAt: 'asc' },
      },
    },
  });

  // Group subs by cohort month (startedAt month)
  const now = new Date();
  const cohortMap = new Map<string, { total: number; retained: number[] }>();
  const maxMonths = 6;

  for (const sub of subs) {
    const cohortKey = format(startOfMonth(new Date(sub.startedAt)), 'yyyy-MM');
    const monthsSinceStart = differenceInMonths(now, new Date(sub.startedAt));
    if (monthsSinceStart < 0) continue;

    const entry = cohortMap.get(cohortKey) ?? { total: 0, retained: new Array(maxMonths + 1).fill(0) };
    entry.total += 1;

    // Determine which months this sub was active
    const cancelMonth = sub.cancelledAt ? differenceInMonths(new Date(sub.cancelledAt), new Date(sub.startedAt)) : Infinity;
    for (let m = 0; m <= Math.min(maxMonths, monthsSinceStart); m++) {
      if (m < cancelMonth) entry.retained[m] += 1;
    }
    cohortMap.set(cohortKey, entry);
  }

  const cohorts = [...cohortMap.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 8)
    .reverse();

  const totalSubs = subs.length;
  const activeSubs = subs.filter(s => s.status === 'ACTIVE' || s.status === 'TRIAL').length;
  const avgRetention = cohorts.length > 0
    ? (cohorts.reduce((sum, [, c]) => {
        const lastMonth = Math.min(maxMonths, c.retained.length - 1);
        return sum + (c.total > 0 ? c.retained[lastMonth] / c.total : 0);
      }, 0) / cohorts.length * 100).toFixed(0) + '%'
    : '—';

  return (
    <div className="space-y-6">
      <PageHeader title="Cohort Retention" subtitle="Monthly subscription cohort retention rates" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Subscribers" value={totalSubs.toLocaleString()} />
        <KpiCard label="Active Now" value={activeSubs.toLocaleString()} />
        <KpiCard label="Avg Retention" value={avgRetention} sub="at latest month" />
        <KpiCard label="Cohorts Tracked" value={cohorts.length.toLocaleString()} />
      </div>

      {/* Heatmap table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Retention by Cohort Month</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-500 uppercase font-medium">Cohort</th>
                <th className="px-4 py-3 text-right text-gray-500 uppercase font-medium">Size</th>
                {Array.from({ length: maxMonths + 1 }, (_, i) => (
                  <th key={i} className="px-4 py-3 text-center text-gray-500 uppercase font-medium">M{i}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {cohorts.map(([key, cohort]) => (
                <tr key={key}>
                  <td className="px-4 py-3 text-gray-300 font-medium whitespace-nowrap">{key}</td>
                  <td className="px-4 py-3 text-right text-gray-400 tabular-nums">{cohort.total}</td>
                  {cohort.retained.slice(0, maxMonths + 1).map((count, i) => {
                    const rate = cohort.total > 0 ? count / cohort.total : 0;
                    const pct = (rate * 100).toFixed(0);
                    // Color intensity based on retention rate
                    const bg = rate >= 0.8 ? 'bg-green-500/20' : rate >= 0.6 ? 'bg-green-500/10' : rate >= 0.4 ? 'bg-yellow-500/10' : rate >= 0.2 ? 'bg-orange-500/10' : rate > 0 ? 'bg-red-500/10' : 'bg-gray-800/30';
                    const text = rate >= 0.6 ? 'text-green-400' : rate >= 0.4 ? 'text-yellow-400' : rate >= 0.2 ? 'text-orange-400' : rate > 0 ? 'text-red-400' : 'text-gray-600';
                    return (
                      <td key={i} className={`px-4 py-3 text-center tabular-nums font-medium ${bg} ${text}`}>
                        {count > 0 ? pct + '%' : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify and commit**

```bash
cd /Users/igordviniatin/Documents/thermoslim-platform/.worktrees/foundation-shell
npx vitest run
git add "app/(dashboard)/subscriptions/cohorts/"
git commit -m "feat: add cohort retention dashboard page"
```

---

### Task 7: Frequency Analysis

**Files:**
- Create: `app/(dashboard)/subscriptions/frequency/page.tsx`
- Create: `app/(dashboard)/subscriptions/frequency/FrequencyDonut.tsx`

- [ ] **Step 1: Create FrequencyDonut client component**

```tsx
// app/(dashboard)/subscriptions/frequency/FrequencyDonut.tsx
'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';

export interface FreqSlice {
  name: string;
  value: number;
  mrr: number;
}

const COLORS = [chartColors.primary, chartColors.green, chartColors.orange, chartColors.purple, chartColors.cyan, chartColors.red];

export function FrequencyDonut({ data }: { data: FreqSlice[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No frequency data</p>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Create frequency page**

```tsx
// app/(dashboard)/subscriptions/frequency/page.tsx
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, toMonthlyMrr } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { FrequencyDonut, type FreqSlice } from './FrequencyDonut';

export default async function FrequencyPage() {
  const subs = await prisma.subscription.findMany({
    where: { status: { in: ['ACTIVE', 'TRIAL'] } },
    select: {
      id: true,
      recurringPrice: true,
      frequency: true,
      currentBillingCycle: true,
      productMap: { select: { name: true, productLine: true } },
    },
  });

  // Group by frequency
  const freqMap = new Map<string, { count: number; totalPrice: number; totalMrr: number; avgCycle: number; cycleSum: number }>();
  for (const sub of subs) {
    const freq = sub.frequency ?? 'unknown';
    const entry = freqMap.get(freq) ?? { count: 0, totalPrice: 0, totalMrr: 0, avgCycle: 0, cycleSum: 0 };
    entry.count += 1;
    entry.totalPrice += sub.recurringPrice;
    entry.totalMrr += toMonthlyMrr(sub.recurringPrice, sub.frequency);
    entry.cycleSum += sub.currentBillingCycle;
    freqMap.set(freq, entry);
  }

  const frequencies = [...freqMap.entries()]
    .map(([freq, v]) => ({
      frequency: freq,
      label: freq === 'unknown' ? 'Unknown' : freq.replace('-', ' '),
      count: v.count,
      totalPrice: v.totalPrice,
      mrr: v.totalMrr,
      avgCycle: v.count > 0 ? (v.cycleSum / v.count).toFixed(1) : '0',
      avgPrice: v.count > 0 ? Math.round(v.totalPrice / v.count) : 0,
    }))
    .sort((a, b) => b.mrr - a.mrr);

  const totalMrr = frequencies.reduce((s, f) => s + f.mrr, 0);
  const totalSubs = subs.length;
  const topFreq = frequencies[0]?.label ?? '—';

  const donutData: FreqSlice[] = frequencies.map(f => ({
    name: f.label,
    value: f.count,
    mrr: f.mrr,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Frequency Analysis" subtitle="Subscription frequency distribution and MRR impact" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total MRR" value={fmtK(totalMrr)} />
        <KpiCard label="Active Subs" value={totalSubs.toLocaleString()} />
        <KpiCard label="Frequency Types" value={frequencies.length.toLocaleString()} />
        <KpiCard label="Top Frequency" value={topFreq} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Subscriber Distribution</h3>
          <FrequencyDonut data={donutData} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Frequency</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Subs</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">MRR</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Avg Price</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Avg Cycle</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">% MRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {frequencies.map(f => (
                  <tr key={f.frequency} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-3.5 text-gray-300 font-medium">{f.label}</td>
                    <td className="px-6 py-3.5 text-right text-gray-300 tabular-nums">{f.count}</td>
                    <td className="px-6 py-3.5 text-right text-gray-200 tabular-nums font-medium">{fmtK(f.mrr)}</td>
                    <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{fmt$(f.avgPrice)}</td>
                    <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{f.avgCycle}</td>
                    <td className="px-6 py-3.5 text-right text-gray-500 tabular-nums">{totalMrr > 0 ? ((f.mrr / totalMrr) * 100).toFixed(1) + '%' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify and commit**

```bash
cd /Users/igordviniatin/Documents/thermoslim-platform/.worktrees/foundation-shell
npx vitest run
git add "app/(dashboard)/subscriptions/frequency/"
git commit -m "feat: add frequency analysis dashboard page"
```

---

### Verification Checklist

After all tasks complete:

- [ ] `npx vitest run` — all tests pass
- [ ] `npm run dev` — site loads without errors
- [ ] `/subscriptions/churn` — shows cancel reasons, trend, table
- [ ] `/orders/refunds` — shows refund/chargeback amounts and trends
- [ ] `/performance/campaigns` — shows campaigns ranked by revenue
- [ ] `/performance/products` — shows product lines ranked by revenue
- [ ] `/orders/payments` — shows decline rates, card types
- [ ] `/subscriptions/cohorts` — shows retention heatmap
- [ ] `/subscriptions/frequency` — shows frequency distribution and MRR
- [ ] All sidebar nav links work for these pages
- [ ] Date range from TopBar affects pages that use `parseRange`
