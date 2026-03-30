# Dashboard Development Guide

Quick reference for building new dashboard pages in the ThermoSlim platform. Follow these patterns to maintain consistency and reusability across all 18 dashboard pages.

## Adding a New Dashboard Page

### Step 1: Create the directory structure

```bash
mkdir -p app/(dashboard)/your-page-name
touch app/(dashboard)/your-page-name/page.tsx
```

### Step 2: Create the async server component

The page should be an async server component that:
- Accepts `searchParams` for date filtering
- Fetches data via Prisma
- Returns JSX with shared UI components

Example:

```tsx
// app/(dashboard)/your-page-name/page.tsx
import { prisma } from '@/lib/prisma';
import { fmt$, formatK, parseRange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import ChartComponent from './ChartComponent';

export default async function YourPageName({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const { startDate, endDate } = parseRange(searchParams.from, searchParams.to);

  // Fetch aggregated data for KPIs
  const totalOrders = await prisma.order.count({
    where: { createdAt: { gte: startDate, lte: endDate } }
  });

  const totalRevenue = await prisma.order.aggregate({
    where: { createdAt: { gte: startDate, lte: endDate } },
    _sum: { totalPrice: true }
  });

  // Fetch time-series data for charts
  const chartData = await prisma.order.groupBy({
    by: ['createdAt'],
    where: { createdAt: { gte: startDate, lte: endDate } },
    _count: true,
    _sum: { totalPrice: true }
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Your Page Name" />

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Orders" value={String(totalOrders)} />
        <KpiCard label="Revenue" value={fmt$(totalRevenue._sum.totalPrice || 0)} />
      </div>

      {/* Section Header */}
      <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Trends
      </div>

      {/* Chart Component */}
      <ChartComponent data={chartData} />
    </div>
  );
}
```

### Step 3: Create client chart components

Use `'use client'` for interactive charts that need browser APIs (Recharts, etc.):

```tsx
// app/(dashboard)/your-page-name/ChartComponent.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';
import { toYMD } from '@/lib/dashboard/formatting';

export default function ChartComponent({ data }: { data: any[] }) {
  const formatted = data.map(d => ({
    date: toYMD(d.createdAt),
    count: d._count,
    revenue: d._sum.totalPrice
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis
            dataKey="date"
            tick={{ fill: chartColors.tick, fontSize: 11 }}
          />
          <YAxis tick={{ fill: chartColors.tick, fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: chartColors.tooltipBg,
              border: `1px solid ${chartColors.tooltipBorder}`
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="count" stroke={chartColors.blue} strokeWidth={2} />
          <Line type="monotone" dataKey="revenue" stroke={chartColors.green} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

## Data Fetching Pattern

### Server Component (Data Layer)

- Accepts `searchParams` from Next.js router
- Uses `parseRange()` to normalize date inputs (handles 7d, 30d, 90d, YTD, All, custom ranges)
- Executes Prisma queries directly
- Passes plain data objects to client components

### Client Components (Presentation Layer)

- Marked with `'use client'`
- Receive pre-computed data as props
- Handle rendering only — no data fetching
- Use Recharts, badge styles, formatting utilities

### Example: KPI Data

```tsx
const revenue = await prisma.order.aggregate({
  where: { createdAt: { gte: startDate, lte: endDate }, status: 'paid' },
  _sum: { totalPrice: true }
});

<KpiCard
  label="Revenue"
  value={fmt$(revenue._sum.totalPrice || 0)}
  change={calculateChange(previousPeriod, revenue)}
/>
```

## Adding a Nav Item

Edit the `NAV` array in `app/(dashboard)/Sidebar.tsx`:

```tsx
const NAV = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
      { label: 'Your New Page', href: '/your-page-name', icon: 'IconName' }
    ]
  },
  // ...
];
```

Available icon names come from Lucide React (`lucide-react`). Common ones: `LayoutDashboard`, `TrendingUp`, `Users`, `ShoppingCart`, `AlertCircle`, `Settings`, `BarChart3`, `PieChart`, `Clock`.

## Shared Utilities Reference

### `src/lib/dashboard/formatting.ts`

| Export | Signature | Example |
|--------|-----------|---------|
| `fmt$` | `(cents: number) => string` | `fmt$(10050)` → `"$100.50"` |
| `fmtK` | `(n: number) => string` | `fmtK(5432)` → `"5.4K"` |
| `pctChange` | `(current: number, previous: number) => string` | `pctChange(110, 100)` → `"+10%"` |
| `toYMD` | `(date: Date \| string) => string` | `toYMD(new Date())` → `"2026-03-30"` |
| `toMonthlyMrr` | `(orders: any[]) => ChartDataPoint[]` | Aggregates orders by month, sums revenue |
| `parseRange` | `(from?: string, to?: string) => { startDate: Date, endDate: Date }` | Handles "7d", "30d", "90d", "ytd", "all", or ISO dates |

### `src/lib/dashboard/colors.ts`

| Export | Type | Usage |
|--------|------|-------|
| `statusColors` | `{ [key: string]: string }` | Map order/subscription status to hex colors |
| `sourceColors` | `{ [key: string]: string }` | Map data source (shopify, cc, etc.) to colors |
| `subscriptionStatusColors` | `{ [key: string]: string }` | Colors for subscription states |
| `chartColors` | `{ blue, green, orange, red, gray, tick, grid, tooltipBg, tooltipBorder }` | Consistent chart styling |
| `humanizeSource(source: string)` | `string` | `"shopify"` → `"Shopify"` |
| `humanizeStatus(status: string)` | `string` | `"pending_payment"` → `"Pending Payment"` |
| `getSourceLabel(source: string)` | `string` | Alias for `humanizeSource` |
| `getOrderType(order: any)` | `string` | Determines order type (new, rebill, etc.) |

## Shared Components Reference

### `KpiCard`

```tsx
<KpiCard
  label="Total Revenue"
  value="$45,320"
  change="+12%" // optional
  changeType="positive" // optional: "positive" | "negative" | "neutral"
  subtitle="vs. last period" // optional
/>
```

Props:
- `label: string` — KPI title
- `value: string` — Primary metric (formatted)
- `change?: string` — Percent or absolute change
- `changeType?: 'positive' | 'negative' | 'neutral'` — Arrow color
- `subtitle?: string` — Secondary text

### `Badge`

```tsx
<Badge status="completed" source="shopify" size="sm" />
```

Props:
- `status?: string` — Uses `statusColors` to determine color
- `source?: string` — Uses `sourceColors` to determine color
- `size?: 'xs' | 'sm' | 'md'` — Badge size
- `children?: React.ReactNode` — Custom label text

### `PageHeader`

```tsx
<PageHeader
  title="Orders"
  description="All orders across all sources"
  action={<button>Export</button>} // optional
/>
```

Props:
- `title: string` — Page title
- `description?: string` — Subtitle
- `action?: React.ReactNode` — Right-aligned action button/control

## Chart Styling Conventions

All charts should use consistent colors, grid, and tooltip styling via `chartColors`:

```tsx
import { chartColors } from '@/lib/dashboard/colors';
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

<LineChart data={data}>
  <CartesianGrid
    strokeDasharray="3 3"
    stroke={chartColors.grid}
    vertical={false}
  />
  <XAxis
    dataKey="date"
    tick={{ fill: chartColors.tick, fontSize: 11 }}
    stroke={chartColors.grid}
  />
  <YAxis
    tick={{ fill: chartColors.tick, fontSize: 11 }}
    stroke={chartColors.grid}
  />
  <Tooltip
    contentStyle={{
      background: chartColors.tooltipBg,
      border: `1px solid ${chartColors.tooltipBorder}`,
      borderRadius: '6px'
    }}
    cursor={{ stroke: chartColors.grid, strokeDasharray: '3 3' }}
  />
</LineChart>
```

Use `chartColors.blue`, `chartColors.green`, `chartColors.orange`, `chartColors.red` for data series.

## Page Layout Conventions

### Overall Structure

```tsx
<div className="space-y-6">
  {/* Header */}
  <PageHeader title="..." />

  {/* KPI Row */}
  <div className="grid grid-cols-4 gap-4">
    <KpiCard ... />
    <KpiCard ... />
    <KpiCard ... />
    <KpiCard ... />
  </div>

  {/* Section */}
  <div>
    <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
      Section Name
    </div>
    {/* Section content */}
  </div>
</div>
```

### Common Layouts

**4-Column KPI Grid:**
```tsx
<div className="grid grid-cols-4 gap-4">
  {/* 4 KpiCards */}
</div>
```

**2-Column Content:**
```tsx
<div className="grid grid-cols-2 gap-6">
  <div className="...">Left</div>
  <div className="...">Right</div>
</div>
```

**Full-Width Chart:**
```tsx
<div className="bg-white rounded-lg border border-gray-200 p-6">
  <ResponsiveContainer width="100%" height={300}>
    <ChartComponent ... />
  </ResponsiveContainer>
</div>
```

### Section Headers

All section headers use:
```tsx
<div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
  Section Name
</div>
```

Place 4-6px below the element it describes (use `mb-4` or similar).

## Testing

Run the dev server to test:
```bash
npm run dev
```

Navigate to `http://localhost:3000` and visit your new page. Check:
- ✓ Date range selection works (TopBar presets)
- ✓ KPI values update when range changes
- ✓ Charts render without errors
- ✓ Layout is responsive (check sidebar collapse)
- ✓ No console errors or warnings

## Common Pitfalls

1. **Forgetting `'use client'` on chart components** — Recharts needs browser APIs
2. **Mixing data fetching in client components** — Fetch in server component, pass data as props
3. **Not using `parseRange()`** — Always normalize date inputs, don't assume format
4. **Hardcoding colors** — Use `chartColors`, `statusColors`, `sourceColors` exports
5. **Inconsistent spacing** — Always use `space-y-6` for outer div, `gap-4` for grids
6. **Forgetting to add nav item** — Update `Sidebar.tsx` NAV array when creating new pages
