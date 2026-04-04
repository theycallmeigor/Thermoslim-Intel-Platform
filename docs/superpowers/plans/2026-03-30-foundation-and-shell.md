# Foundation & Layout Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract shared utilities and components from the existing 2 pages, create a sidebar+topbar layout shell, and migrate existing pages into it — establishing the foundation for 15+ dashboards.

**Architecture:** Next.js App Router route groups. A `(dashboard)` route group wraps all dashboard pages with a shared layout (sidebar + top bar). Shared UI components live in `src/components/ui/`, shared formatting/color utilities in `src/lib/dashboard/`. Existing pages move into the route group with minimal logic changes.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Prisma

---

### File Map

**New files to create:**
| File | Responsibility |
|------|---------------|
| `src/lib/dashboard/formatting.ts` | `fmt$`, `fmtK`, `fmtDollars`, `pctChange`, `toYMD`, `parseRange` |
| `src/lib/dashboard/colors.ts` | `statusColors`, `sourceColors`, source label/type helpers |
| `src/components/ui/KpiCard.tsx` | Reusable KPI card (label, value, change, sub) |
| `src/components/ui/Badge.tsx` | Status/source/type badge with color lookup |
| `src/components/ui/PageHeader.tsx` | Page title + optional subtitle |
| `app/(dashboard)/layout.tsx` | Sidebar + top bar + content area wrapper |
| `app/(dashboard)/Sidebar.tsx` | Client component: collapsible sidebar nav |
| `app/(dashboard)/TopBar.tsx` | Client component: breadcrumb + date filter + sync |

**Files to move (route group migration):**
| From | To |
|------|-----|
| `app/dashboard/page.tsx` | `app/(dashboard)/dashboard/page.tsx` |
| `app/dashboard/RevenueChart.tsx` | `app/(dashboard)/dashboard/RevenueChart.tsx` |
| `app/dashboard/SubscriberDonut.tsx` | `app/(dashboard)/dashboard/SubscriberDonut.tsx` |
| `app/dashboard/DateFilter.tsx` | remove (absorbed into TopBar) |
| `app/dashboard/SyncButton.tsx` | `app/(dashboard)/SyncButton.tsx` (shared) |

**Known issue:** `app/dashboard/page.tsx` imports `SubscriberActivityChart` from `./SubscriberActivityChart` but this file does not exist on disk. During migration (Task 7), we must create a stub `SubscriberActivityChart.tsx` to prevent build failure, then implement it properly.
| `app/analytics/page.tsx` | `app/(dashboard)/analytics/page.tsx` |
| `app/analytics/charts.tsx` | `app/(dashboard)/analytics/charts.tsx` |
| `app/analytics/AnalyticsFilters.tsx` | `app/(dashboard)/analytics/AnalyticsFilters.tsx` |

**Files to modify:**
| File | Change |
|------|--------|
| `app/layout.tsx` | Keep as-is (root layout stays minimal) |
| `app/page.tsx` | Update redirect from `/dashboard` (unchanged URL) |
| `app/(dashboard)/dashboard/page.tsx` | Import from shared utils, remove inline helpers/components |
| `app/(dashboard)/analytics/page.tsx` | Import from shared utils, remove duplicated helpers |

---

### Task 1: Extract shared formatting utilities

**Files:**
- Create: `src/lib/dashboard/formatting.ts`
- Test: `src/lib/dashboard/__tests__/formatting.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/dashboard/__tests__/formatting.test.ts
import { describe, it, expect } from 'vitest';
import { fmt$, fmtK, fmtDollars, pctChange, toYMD, parseRange } from '../formatting';

describe('fmt$', () => {
  it('formats cents to dollars with 2 decimals', () => {
    expect(fmt$(4999)).toBe('$49.99');
    expect(fmt$(0)).toBe('$0.00');
    expect(fmt$(100)).toBe('$1.00');
  });
});

describe('fmtK', () => {
  it('formats large values with k/M suffix', () => {
    expect(fmtK(100_000)).toBe('$1.0k'); // 100000 cents = $1000
    expect(fmtK(500_000_000)).toBe('$5.00M'); // 500M cents = $5M
  });
  it('formats small values normally', () => {
    expect(fmtK(4999)).toBe('$49.99');
  });
});

describe('fmtDollars', () => {
  it('formats with k/M suffix', () => {
    expect(fmtDollars(150000)).toBe('$1.5k'); // 150000 cents
    expect(fmtDollars(100_000_000)).toBe('$1.0M');
  });
});

describe('pctChange', () => {
  it('returns null when prev is 0', () => {
    expect(pctChange(100, 0)).toBeNull();
  });
  it('returns formatted percentage', () => {
    expect(pctChange(110, 100)).toBe('+10.0%');
    expect(pctChange(90, 100)).toBe('-10.0%');
  });
});

describe('toYMD', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(toYMD(new Date('2026-03-30T15:00:00Z'))).toBe('2026-03-30');
  });
});

describe('parseRange', () => {
  it('returns date range with previous period', () => {
    const result = parseRange('2026-03-01', '2026-03-30');
    expect(result.startDate.toISOString()).toContain('2026-03-01');
    expect(result.endDate.toISOString()).toContain('2026-03-30');
    expect(result.prevStart).toBeDefined();
    expect(result.prevEnd).toBeDefined();
  });
  it('defaults to last 30 days when no args', () => {
    const result = parseRange();
    expect(result.startDate < result.endDate).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/dashboard/__tests__/formatting.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement formatting utilities**

```typescript
// src/lib/dashboard/formatting.ts
import { startOfDay, subDays } from 'date-fns';

/** Format cents as $X.XX */
export function fmt$(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

/** Format cents as $Xk or $XM for large values, $X.XX for small */
export function fmtK(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(2)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}k`;
  return fmt$(cents);
}

/** Format cents with abbreviated suffix (no decimals for small) */
export function fmtDollars(cents: number): string {
  const d = cents / 100;
  if (d >= 1_000_000) return `$${(d / 1_000_000).toFixed(1)}M`;
  if (d >= 1000) return `$${(d / 1000).toFixed(1)}k`;
  return `$${d.toFixed(0)}`;
}

/** Calculate period-over-period percentage change */
export function pctChange(curr: number, prev: number): string | null {
  if (prev === 0) return null;
  const pct = ((curr - prev) / prev) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

/** Format Date to YYYY-MM-DD string */
export function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Parse date range from URL params with previous period for comparison */
export function parseRange(from?: string, to?: string) {
  const endDate = to ? new Date(to + 'T23:59:59Z') : new Date();
  const startDate = from ? new Date(from + 'T00:00:00Z') : startOfDay(subDays(endDate, 29));
  const rangeDays = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
  const prevEnd = new Date(startDate.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - rangeDays * 86400000);
  return { startDate, endDate, prevStart, prevEnd };
}

/** Normalize subscription recurring price to monthly MRR */
export function toMonthlyMrr(recurringPrice: number, frequency: string | null): number {
  const freqMonths: Record<string, number> = { '1-month': 1, '3-month': 3, '6-month': 6 };
  const months = freqMonths[frequency ?? ''] ?? 1;
  return Math.round(recurringPrice / months);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/dashboard/__tests__/formatting.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/dashboard/formatting.ts src/lib/dashboard/__tests__/formatting.test.ts
git commit -m "feat: extract shared formatting utilities for dashboard pages"
```

---

### Task 2: Extract shared color maps and badge helpers

**Files:**
- Create: `src/lib/dashboard/colors.ts`

- [ ] **Step 1: Create color maps and helpers**

```typescript
// src/lib/dashboard/colors.ts

/** Order status → Tailwind badge classes */
export const statusColors: Record<string, string> = {
  COMPLETE: 'bg-green-500/10 text-green-400',
  PENDING: 'bg-yellow-500/10 text-yellow-400',
  PARTIAL: 'bg-blue-500/10 text-blue-400',
  REFUNDED: 'bg-purple-500/10 text-purple-400',
  DECLINED: 'bg-red-500/10 text-red-400',
};

/** Order source → Tailwind badge classes */
export const sourceColors: Record<string, string> = {
  SHOPIFY: 'bg-emerald-500/10 text-emerald-400',
  CHECKOUTCHAMP: 'bg-blue-500/10 text-blue-400',
  MERGED: 'bg-blue-500/10 text-blue-400',
};

/** Subscription status → Tailwind badge classes */
export const subscriptionStatusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400',
  TRIAL: 'bg-blue-500/10 text-blue-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
  PAUSED: 'bg-yellow-500/10 text-yellow-400',
  RECYCLE_BILLING: 'bg-orange-500/10 text-orange-400',
  RECYCLE_FAILED: 'bg-red-500/10 text-red-400',
  COMPLETE: 'bg-gray-500/10 text-gray-400',
};

/** Humanized source label from order fields */
export function getSourceLabel(order: {
  source: string;
  ccSourceOrderId?: string | null;
  ccCustom1?: string | null;
  tags?: string | null;
}): { label: string; linked: boolean } {
  if (order.source === 'MERGED') return { label: 'CC', linked: true };
  if (order.source === 'CHECKOUTCHAMP') return { label: 'CC', linked: false };
  if (order.ccCustom1 || (order.tags && /New Sale|Recurring|Subscription/.test(order.tags))) {
    return { label: 'CC', linked: true };
  }
  return { label: 'Shopify', linked: false };
}

/** Humanized source display name */
export function humanizeSource(source: string): string {
  const map: Record<string, string> = {
    SHOPIFY: 'Shopify',
    CHECKOUTCHAMP: 'CC',
    MERGED: 'CC\u2194S',
  };
  return map[source] ?? source;
}

/** Humanized status display name */
export function humanizeStatus(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** Detect subscription/rebill from order fields */
export function getOrderType(order: {
  ccOrderType?: string | null;
  tags?: string | null;
}): 'rebill' | 'subscription' | 'one-time' {
  if (order.ccOrderType === 'REBILL') return 'rebill';
  const tags = order.tags ?? '';
  if (tags.includes('Recurring')) return 'rebill';
  if (tags.includes('Subscription')) return 'subscription';
  return 'one-time';
}

/** Recharts color palette for consistent chart styling */
export const chartColors = {
  primary: '#3b82f6',
  green: '#10b981',
  purple: '#8b5cf6',
  orange: '#f59e0b',
  red: '#ef4444',
  cyan: '#06b6d4',
  grid: '#1f2937',
  tick: '#6b7280',
  tooltipBg: '#111827',
  tooltipBorder: '#374151',
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/dashboard/colors.ts
git commit -m "feat: extract shared color maps and badge helpers"
```

---

### Task 3: Create shared UI components

**Files:**
- Create: `src/components/ui/KpiCard.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/PageHeader.tsx`

- [ ] **Step 1: Create KpiCard component**

```tsx
// src/components/ui/KpiCard.tsx

interface KpiCardProps {
  label: string;
  value: string;
  change?: string | null;
  positive?: boolean;
  sub?: string;
}

export function KpiCard({ label, value, change, positive, sub }: KpiCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
        {change && (
          <span className={`text-xs font-medium mb-0.5 ${positive ? 'text-green-400' : 'text-red-400'}`}>
            {change}
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Create Badge component**

```tsx
// src/components/ui/Badge.tsx

interface BadgeProps {
  label: string;
  colorClass?: string;
}

export function Badge({ label, colorClass = 'bg-gray-500/10 text-gray-400' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${colorClass}`}>
      {label}
    </span>
  );
}
```

- [ ] **Step 3: Create PageHeader component**

```tsx
// src/components/ui/PageHeader.tsx

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode; // slot for action buttons
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/KpiCard.tsx src/components/ui/Badge.tsx src/components/ui/PageHeader.tsx
git commit -m "feat: add shared KpiCard, Badge, and PageHeader components"
```

---

### Task 4: Create Sidebar component

**Files:**
- Create: `app/(dashboard)/Sidebar.tsx`

- [ ] **Step 1: Create sidebar with nav groupings**

```tsx
// app/(dashboard)/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Analytics', href: '/analytics' },
    ],
  },
  {
    title: 'Subscriptions',
    items: [
      { label: 'MRR Waterfall', href: '/subscriptions/mrr' },
      { label: 'Churn Analytics', href: '/subscriptions/churn' },
      { label: 'Cohort Retention', href: '/subscriptions/cohorts' },
      { label: 'Frequency Analysis', href: '/subscriptions/frequency' },
    ],
  },
  {
    title: 'Orders',
    items: [
      { label: 'Upcoming Rebills', href: '/orders/rebills' },
      { label: 'Refunds & Chargebacks', href: '/orders/refunds' },
      { label: 'Payment Health', href: '/orders/payments' },
    ],
  },
  {
    title: 'Performance',
    items: [
      { label: 'Campaigns', href: '/performance/campaigns' },
      { label: 'Products', href: '/performance/products' },
      { label: 'Upsell & AOV', href: '/performance/upsells' },
      { label: 'Attribution', href: '/performance/attribution' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Customer Lookup', href: '/operations/customers' },
      { label: 'Order QA', href: '/operations/qa' },
      { label: 'Ingestion Health', href: '/operations/health' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-[#0f1117] border-r border-gray-800 flex flex-col flex-shrink-0 h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-800">
        <div className="text-[15px] font-bold text-white tracking-tight">ThermoSlim</div>
        <div className="text-[10px] text-gray-500 mt-0.5">Commerce Intelligence</div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 py-3 px-3 space-y-5">
        {NAV.map((group) => (
          <div key={group.title}>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1.5">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
                        active
                          ? 'bg-gray-800/80 text-blue-400 font-medium'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-800 px-5 py-3">
        <Link href="/settings" className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors">
          Settings
        </Link>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(dashboard)/Sidebar.tsx"
git commit -m "feat: add sidebar navigation component"
```

---

### Task 5: Create TopBar component

**Files:**
- Create: `app/(dashboard)/TopBar.tsx`
- Move: `app/dashboard/DateFilter.tsx` → absorbed into TopBar
- Move: `app/dashboard/SyncButton.tsx` → `app/(dashboard)/SyncButton.tsx`

- [ ] **Step 1: Move SyncButton to shared location**

Copy `app/dashboard/SyncButton.tsx` to `app/(dashboard)/SyncButton.tsx` (unchanged content).

- [ ] **Step 2: Create TopBar**

```tsx
// app/(dashboard)/TopBar.tsx
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toYMD } from '@/lib/dashboard/formatting';
import SyncButton from './SyncButton';

const PRESETS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'YTD', days: -1 },
  { label: 'All', days: 0 },
];

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);

  function apply(f: string, t: string) {
    const p = new URLSearchParams(params.toString());
    p.set('from', f);
    p.set('to', t);
    router.push(`${pathname}?${p.toString()}`);
  }

  function applyPreset(days: number) {
    const t = toYMD(new Date());
    if (days === 0) { apply('2000-01-01', t); return; }
    if (days === -1) { apply(toYMD(new Date(new Date().getFullYear(), 0, 1)), t); return; }
    apply(toYMD(new Date(Date.now() - days * 86400000)), t);
  }

  // Derive page title from pathname
  const segments = pathname.split('/').filter(Boolean);
  const pageTitle = segments[segments.length - 1]
    ?.replace(/-/g, ' ')
    ?.replace(/\b\w/g, c => c.toUpperCase()) ?? 'Dashboard';

  return (
    <div className="border-b border-gray-800 bg-[#0a0c10] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-white">{pageTitle}</h2>
        <span className="text-gray-600 text-xs">·</span>
        <span className="text-gray-500 text-xs">Last synced recently</span>
      </div>

      <div className="flex items-center gap-2">
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.days)}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer"
          >
            {p.label}
          </button>
        ))}

        <div className="flex items-center gap-1.5 ml-1">
          <input
            type="date"
            value={localFrom}
            onChange={e => setLocalFrom(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          />
          <span className="text-gray-600 text-xs">&rarr;</span>
          <input
            type="date"
            value={localTo}
            onChange={e => setLocalTo(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => apply(localFrom, localTo)}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>

        <div className="ml-2 border-l border-gray-700 pl-2">
          <SyncButton />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/TopBar.tsx" "app/(dashboard)/SyncButton.tsx"
git commit -m "feat: add TopBar with date filter and SyncButton"
```

---

### Task 6: Create dashboard layout shell

**Files:**
- Create: `app/(dashboard)/layout.tsx`

- [ ] **Step 1: Create the layout**

```tsx
// app/(dashboard)/layout.tsx
import { Suspense } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Suspense>
          <TopBar />
        </Suspense>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(dashboard)/layout.tsx"
git commit -m "feat: add dashboard layout shell with sidebar and top bar"
```

---

### Task 7: Migrate existing dashboard page into route group

**Files:**
- Move: `app/dashboard/*` → `app/(dashboard)/dashboard/*`
- Modify: `app/(dashboard)/dashboard/page.tsx` — remove inline helpers, import from shared

- [ ] **Step 1: Move files**

```bash
mkdir -p "app/(dashboard)/dashboard"
cp app/dashboard/page.tsx "app/(dashboard)/dashboard/page.tsx"
cp app/dashboard/RevenueChart.tsx "app/(dashboard)/dashboard/RevenueChart.tsx"
cp app/dashboard/SubscriberDonut.tsx "app/(dashboard)/dashboard/SubscriberDonut.tsx"
```

Do NOT copy `DateFilter.tsx` or `SyncButton.tsx` — they're replaced by TopBar/shared SyncButton.

**Note:** `SubscriberActivityChart.tsx` does not exist on disk despite being imported by `page.tsx`. Create a stub in the next step.

- [ ] **Step 1b: Create SubscriberActivityChart stub**

The dashboard page imports `SubscriberActivityChart` but the file never existed. Create a minimal working component:

```tsx
// app/(dashboard)/dashboard/SubscriberActivityChart.tsx
'use client';

import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';

export interface SubActivityDay {
  date: string;
  active: number;
  new: number;
  reactivated: number;
  resumed: number;
  cancelled: number;
  paused: number;
  declined: number;
}

export function SubscriberActivityChart({ data }: { data: SubActivityDay[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No activity data</p>;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 10 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 10 }} />
        <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
        <Bar yAxisId="right" dataKey="new" stackId="add" fill="#10b981" />
        <Bar yAxisId="right" dataKey="reactivated" stackId="add" fill="#06b6d4" />
        <Bar yAxisId="right" dataKey="resumed" stackId="add" fill="#6ee7b7" />
        <Bar yAxisId="right" dataKey="cancelled" stackId="sub" fill="#ef4444" />
        <Bar yAxisId="right" dataKey="paused" stackId="sub" fill="#f59e0b" />
        <Bar yAxisId="right" dataKey="declined" stackId="sub" fill="#f87171" />
        <Line yAxisId="left" type="monotone" dataKey="active" stroke="#3b82f6" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Update imports in page.tsx**

In `app/(dashboard)/dashboard/page.tsx`:

1. Remove the inline `parseRange` function — import from `@/lib/dashboard/formatting`
2. Remove inline `fmt$`, `fmtK`, `pctChange` — import from `@/lib/dashboard/formatting`
3. Remove inline `toMonthlyMrr` — import from `@/lib/dashboard/formatting`
4. Remove inline `statusColors`, `sourceColors`, `getSourceLabel` — import from `@/lib/dashboard/colors`
5. Remove inline `isSubscriptionOrder` — import `getOrderType` from `@/lib/dashboard/colors`. Note: return type changes from `'rebill' | 'subscription' | null` to `'rebill' | 'subscription' | 'one-time'`. Update any `if (subType)` checks to `if (subType !== 'one-time')`.
6. Remove inline `KpiCard` function — import from `@/components/ui/KpiCard`
7. Remove inline `ConnectionBadge` function — remove the connection status section entirely (move to settings later)
8. Remove `DateFilter` and `SyncButton` imports — layout handles these now
9. Remove the header section (h1 "ThermoSlim Intelligence") — layout sidebar handles branding
10. Remove the connection status badges section
11. Remove the date filter section — TopBar handles this now
12. **Keep:** `getDashboardData`, chart imports (`RevenueChart`, `SubscriberDonut`, `SubscriberActivityChart`), `date-fns` imports (`format`, `subDays`), all rendering logic from KPI strip downward

The page should start at the KPI strip — the layout provides everything above it.

- [ ] **Step 3: Verify the page renders**

Run: `npm run dev`
Navigate to `http://localhost:3000/dashboard`
Expected: Sidebar on left, top bar with date presets, dashboard content in center. Same data as before.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/dashboard/"
git commit -m "feat: migrate dashboard page into route group with shared layout"
```

---

### Task 8: Migrate analytics page into route group

**Files:**
- Move: `app/analytics/*` → `app/(dashboard)/analytics/*`
- Modify: `app/(dashboard)/analytics/page.tsx` — import from shared utils

- [ ] **Step 1: Move files**

```bash
mkdir -p "app/(dashboard)/analytics"
cp app/analytics/page.tsx "app/(dashboard)/analytics/page.tsx"
cp app/analytics/charts.tsx "app/(dashboard)/analytics/charts.tsx"
cp app/analytics/AnalyticsFilters.tsx "app/(dashboard)/analytics/AnalyticsFilters.tsx"
```

- [ ] **Step 2: Update imports in page.tsx**

In `app/(dashboard)/analytics/page.tsx`:

1. Remove inline `toYMD`, `parseRange`, `fmtDollars` — import from `@/lib/dashboard/formatting`
2. Remove any header/back-link that the layout now handles

- [ ] **Step 3: Verify the page renders**

Run: `npm run dev`
Navigate to `http://localhost:3000/analytics`
Expected: Same sidebar, top bar, analytics content displays correctly.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/analytics/"
git commit -m "feat: migrate analytics page into route group with shared layout"
```

---

### Task 9: Clean up old routes and update redirect

**Files:**
- Remove: `app/dashboard/` (old location)
- Remove: `app/analytics/` (old location)
- Modify: `app/page.tsx` — verify redirect still works

- [ ] **Step 1: Remove old directories**

```bash
rm -rf app/dashboard app/analytics
```

- [ ] **Step 2: Verify `app/page.tsx` redirect works**

The redirect to `/dashboard` should still work because Next.js route groups `(dashboard)` are transparent to the URL. `/dashboard` still maps to `app/(dashboard)/dashboard/page.tsx`.

- [ ] **Step 3: Full smoke test**

Run: `npm run dev`
- `http://localhost:3000/` → redirects to `/dashboard` → shows dashboard with sidebar
- `http://localhost:3000/dashboard` → dashboard with sidebar
- `http://localhost:3000/analytics` → analytics with sidebar
- Date presets in top bar work
- All charts render

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old route directories, complete migration to route group"
```

---

### Task 10: Add documentation

**Files:**
- Create: `docs/patterns/dashboard-development.md`

- [ ] **Step 1: Write the dashboard development guide**

This document should explain:
1. **How to add a new dashboard page** — create a directory under `app/(dashboard)/`, create `page.tsx`, import shared utilities
2. **Shared utilities reference** — what's in `src/lib/dashboard/formatting.ts` and `colors.ts`
3. **Shared components reference** — KpiCard, Badge, PageHeader props and usage
4. **Layout structure** — how the sidebar/topbar/content area work
5. **Data fetching pattern** — async server component, Prisma queries, pass to client chart components
6. **Adding a nav item** — edit `NAV` array in `Sidebar.tsx`
7. **Chart styling conventions** — use `chartColors` from colors.ts, consistent tooltip/grid styling

Include code examples for each.

- [ ] **Step 2: Commit**

```bash
git add docs/patterns/dashboard-development.md
git commit -m "docs: add dashboard development guide for new pages"
```

---

### Verification Checklist

After all tasks complete:

- [ ] `npm run dev` — site loads at `/dashboard` with sidebar
- [ ] Sidebar navigation shows all 5 groups
- [ ] Active nav item is highlighted
- [ ] TopBar shows page title, date presets, custom range
- [ ] Dashboard page renders all sections (KPIs, charts, tables)
- [ ] Analytics page renders all sections
- [ ] `npx vitest run` — formatting tests pass
- [ ] No duplicated `fmt$`, `fmtK`, `parseRange`, etc. across pages
- [ ] `docs/patterns/dashboard-development.md` exists and is accurate
