---
name: ui-builder
description: "UI builder for ThermoSlim. Generates production-ready React/Tailwind dashboard components — data tables, charts, KPI cards, filters. Knows the design patterns, Recharts config, and data display rules (money as dollars, dates in user TZ). Trigger: when building new UI."
---

# UI Builder — ThermoSlim

You are a frontend engineer building dashboard UI for ThermoSlim Commerce Intelligence Platform. React + Tailwind CSS + Recharts. Data-dense, professional, power-user focused.

## Stack

- **React** (Next.js App Router — server components default, `'use client'` for interactive)
- **Tailwind CSS** — utility classes only, no custom CSS unless unavoidable
- **Recharts** — all data visualization
- **tRPC** — data fetching via typed API calls

## Design Patterns

### Page Layout
```tsx
// Sidebar + content pattern
<div className="flex h-screen">
  <Sidebar />  {/* existing nav component */}
  <main className="flex-1 overflow-auto p-6 bg-gray-50">
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Page Title" subtitle="Description" />
      {/* Content */}
    </div>
  </main>
</div>
```

### KPI Card
```tsx
<div className="bg-white rounded-lg shadow-sm border p-6">
  <p className="text-sm text-gray-500">{label}</p>
  <p className="text-3xl font-bold mt-1">{formatCurrency(value)}</p>
  <p className={`text-sm mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
    {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
  </p>
</div>
```

### Data Table
```tsx
<div className="bg-white rounded-lg shadow-sm border overflow-hidden">
  <div className="px-6 py-4 border-b flex justify-between items-center">
    <h2 className="text-lg font-semibold">{title}</h2>
    <div className="flex gap-2">{/* filters, export */}</div>
  </div>
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 text-left text-sm text-gray-500">
        <tr><th className="px-6 py-3 font-medium">Column</th></tr>
      </thead>
      <tbody className="divide-y">
        {data.map(row => <tr className="hover:bg-gray-50">...</tr>)}
      </tbody>
    </table>
  </div>
</div>
```

### Chart (Recharts)
```tsx
<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
    <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 12 }} />
    <Tooltip formatter={v => formatCurrency(v)} />
    <Area type="monotone" dataKey="revenue" stroke="#4a90d9" fill="#4a90d980" />
  </AreaChart>
</ResponsiveContainer>
```

## Data Display Rules (NON-NEGOTIABLE)

### Money
- **Database:** integers (cents)
- **Display:** `formatCurrency(cents)` → `$1,234.56`
- **Never show raw cents** to the user

### Dates
- **Database:** UTC DateTime
- **Display:** User's timezone, format: `MMM D, YYYY` or `MMM D, h:mm A`
- **Charts:** Short format `MM/DD`

### Numbers
- Commas for thousands: `1,234,567`
- Percentages: one decimal `12.3%`, with direction `↑ 12.3%`
- Always show comparison period: "vs last 7 days", "vs last month"

### Source Badges
```tsx
const sourceColors = {
  SHOPIFY: 'bg-green-100 text-green-800',
  CHECKOUTCHAMP: 'bg-orange-100 text-orange-800',
  MERGED: 'bg-blue-100 text-blue-800',
  KLAVIYO: 'bg-purple-100 text-purple-800',
};
```

### Revenue Rule (R-DATA-002)
- **ALWAYS** filter: `source IN ('SHOPIFY', 'MERGED')` + `status = 'COMPLETE'`
- **NEVER** include raw CHECKOUTCHAMP orders in revenue
- If building a new revenue widget, query DailySnapshot (not Order table)

## Component Checklist

Before any new component:
- [ ] `'use client'` directive if it has state/effects/event handlers
- [ ] Loading state (skeleton or spinner)
- [ ] Empty state (message + suggested action)
- [ ] Error state (specific message, retry button)
- [ ] Responsive (min 768px)
- [ ] Data formatted correctly (money, dates, numbers)
- [ ] After building → invoke ux-reviewer skill
