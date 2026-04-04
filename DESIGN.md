# Design System: ThermoSlim Platform

## 1. Visual Theme & Atmosphere

ThermoSlim is a commerce intelligence dashboard for a health/supplement brand. The aesthetic is clean, data-dense, and business-professional — a founder or operator who logs in every morning should feel like they're looking at a Bloomberg terminal crossed with a Shopify analytics page. Light mode. Charts front and center. Every number has context (trend, comparison, unit).

**Key Characteristics:**
- Light-mode-only: `#f8fafc` base (slightly cooler than pure white)
- Sidebar navigation — persistent, fixed left column
- Data-first: KPI cards + charts + tables are the primary UI patterns
- Recharts for all data visualization — consistent palette, no random colors
- Tailwind CSS throughout — no custom CSS files
- Money always in dollars (UI) — never expose cents-stored-as-integers
- Dates always in user's timezone — never raw UTC strings
- Adapter source badges everywhere data touches a source system

---

## 2. Color Palette & Roles

### Background Surfaces
- **Page Background** (`#f8fafc` / `bg-slate-50`): Base layer for all pages
- **Sidebar** (`#ffffff` / `bg-white`): Left nav column, slightly elevated
- **Card Surface** (`#ffffff` / `bg-white`): KPI cards, chart containers, data panels
- **Table Row Hover** (`#f1f5f9` / `bg-slate-100`): Row hover state

### Text & Content
- **Primary Text** (`#0f172a` / `text-slate-900`): Headings, KPI numbers, important data
- **Secondary Text** (`#475569` / `text-slate-600`): Body text, labels, descriptions
- **Muted Text** (`#94a3b8` / `text-slate-400`): Timestamps, placeholders, footnotes
- **Sidebar Text** (`#334155` / `text-slate-700`): Nav link labels

### Interactive
- **Accent Blue** (`#3b82f6` / `text-blue-500`): Links, active nav items, primary actions
- **Primary Button** (`#2563eb` / `bg-blue-600`): CTA buttons
- **Primary Hover** (`#1d4ed8` / `bg-blue-700`): Button hover
- **Active Nav BG** (`#eff6ff` / `bg-blue-50`): Active sidebar link background

### Adapter Source Badges (critical — never mix these up)
- **SHOPIFY** (`bg-green-100 text-green-700`): Shopify-sourced data
- **CHECKOUTCHAMP** (`bg-orange-100 text-orange-700`): CC-sourced data
- **MERGED** (`bg-blue-100 text-blue-700`): Cross-source merged records
- **KLAVIYO** (`bg-purple-100 text-purple-700`): Klaviyo-sourced data
- **GA4** (`bg-yellow-100 text-yellow-700`): Google Analytics sourced

### Status & Metrics
- **Positive Trend** (`#16a34a` / `text-green-600`): Revenue up, conversion up
- **Negative Trend** (`#dc2626` / `text-red-600`): Revenue down, issues
- **Neutral/Flat** (`#94a3b8` / `text-slate-400`): No significant change
- **Warning** (`#d97706` / `text-amber-600`): Stale data, sync issues
- **Danger** (`#dc2626` / `text-red-600`): Errors, failed jobs

### Recharts Data Palette
For consistent chart colors across all visualizations:
```
Series 1: #3b82f6  (blue-500)   — primary metric
Series 2: #10b981  (emerald-500) — secondary metric / comparison
Series 3: #f59e0b  (amber-500)   — tertiary / warning tier
Series 4: #8b5cf6  (violet-500)  — fourth series (rare)
Series 5: #ec4899  (pink-500)    — fifth series (rare)
Grid:      #e2e8f0  (slate-200)   — chart gridlines
Tooltip:   #1e293b  (slate-800 bg) + white text
```

### Borders & Dividers
- **Default Border** (`#e2e8f0` / `border-slate-200`): Card outlines, table separators
- **Sidebar Border** (`#e2e8f0` / `border-slate-200`): Sidebar right edge
- **Table Header** (`border-b-2 border-slate-200`): Stronger separator

---

## 3. Typography Rules

### Font Family
- **Primary**: System fonts — `font-sans` (Tailwind default: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
- **Monospace**: `font-mono` — for IDs, hashes, raw values that should look like data
- **No custom fonts.** System stack only. Dashboard must load instantly.

### Hierarchy

| Role | Size | Weight | Color | Usage |
|------|------|--------|-------|-------|
| Page Title | `text-xl` (20px) | `font-semibold` | `text-slate-900` | One per page |
| Section Header | `text-base` (16px) | `font-semibold` | `text-slate-900` | Card titles |
| KPI Number | `text-3xl` (30px) | `font-bold` | `text-slate-900` | Stat values |
| KPI Label | `text-xs` (12px) | `font-medium` | `text-slate-500` | Below KPI numbers |
| Body | `text-sm` (14px) | `font-normal` | `text-slate-600` | Default content |
| Table Header | `text-xs` (12px) | `font-medium` | `text-slate-500` | Column headers, uppercase |
| Table Data | `text-sm` (14px) | `font-normal` | `text-slate-900` | Cell content |
| Badge | `text-xs` (12px) | `font-medium` | varies | Source badges, status |
| Sidebar Nav | `text-sm` (14px) | `font-medium` | `text-slate-700` | Nav labels |

### Data Formatting Rules (CRITICAL — apply everywhere)

**Money:**
- DB stores integers in cents (e.g., `4999` = $49.99)
- Display: `$49.99` — always format with `toLocaleString('en-US', { style: 'currency', currency: 'USD' })`
- Never display raw cents to the user
- Revenue rule (R-DATA-002): Never display revenue data from a single source — always use the merged/reconciled value

**Dates:**
- DB stores UTC timestamps
- Display: convert to user's local timezone with `Intl.DateTimeFormat`
- Relative dates for recent events: "2 hours ago", "yesterday"
- Absolute dates for historical: "Mar 28, 2026"
- Never show ISO strings like `2026-03-28T14:23:11.000Z` to users

**Numbers:**
- Large numbers: `12,847` (commas, no abbreviation unless chart axis)
- Chart axes may abbreviate: `12.8K`, `$4.2M`
- Percentages: `24.3%` — one decimal place

---

## 4. Component Stylings

### KPI Card
```
bg-white rounded-lg border border-slate-200 p-4
Layout: flex flex-col gap-1
Label: text-xs font-medium text-slate-500 uppercase tracking-wide
Value: text-3xl font-bold text-slate-900
Trend: text-sm flex items-center gap-1
  ↑ positive: text-green-600
  ↓ negative: text-red-600
  → flat: text-slate-400
Subtext: text-xs text-slate-400 (comparison period)
```

### Data Table
```
Wrapper: bg-white rounded-lg border border-slate-200 overflow-hidden
Table: w-full text-sm
Header row: bg-slate-50 border-b-2 border-slate-200
Header cell: px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide
Body cell: px-4 py-3 border-b border-slate-100
Row hover: hover:bg-slate-50
Numbers: text-right font-mono (right-align all numeric columns)
Empty state: py-12 text-center text-slate-400 text-sm
```

### Chart Container
```
bg-white rounded-lg border border-slate-200 p-4
Header: flex justify-between items-center mb-4
  Title: text-base font-semibold text-slate-900
  Controls: text-xs text-slate-500 (period selector, export)
Chart: ResponsiveContainer width="100%" height={300}
```

### Sidebar Navigation
```
Sidebar: w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col
Logo area: px-4 py-4 border-b border-slate-200
Nav section: flex-1 overflow-y-auto py-2
Section label: px-4 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider
Nav item: flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg mx-2 cursor-pointer
  Default: text-slate-700 hover:bg-slate-100
  Active: bg-blue-50 text-blue-600
```

### Adapter Source Badge
```
inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
SHOPIFY: bg-green-100 text-green-700
CHECKOUTCHAMP: bg-orange-100 text-orange-700
MERGED: bg-blue-100 text-blue-700
KLAVIYO: bg-purple-100 text-purple-700
GA4: bg-yellow-100 text-yellow-700
```

### Sync Status Badge
```
inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
● Synced: bg-green-100 text-green-700
● Syncing: bg-blue-100 text-blue-600 (pulse animation)
⚠ Stale: bg-amber-100 text-amber-700
✕ Error: bg-red-100 text-red-700
```

### Primary Button
```
bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg
transition-colors duration-150
```

### Secondary Button
```
bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2
rounded-lg border border-slate-200 transition-colors duration-150
```

### Form Inputs
```
bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900
placeholder:text-slate-400
focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
```

### Alert / Error Banner
```
bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3
Icon: text-red-500
Title: text-sm font-semibold text-red-700
Body: text-sm text-red-600
```

---

## 5. Layout Principles

### Page Structure
```
Fixed sidebar (w-64) + scrollable main content
Main: ml-64 min-h-screen bg-slate-50
Content wrapper: max-w-7xl mx-auto px-6 py-6
Page header: flex justify-between items-center mb-6
KPI row: grid grid-cols-4 gap-4 mb-6
Charts row: grid grid-cols-2 gap-6 mb-6 (or single full-width)
Data table: full width of content area
```

### Spacing Scale
| Token | Value | Usage |
|-------|-------|-------|
| xs | `p-1` (4px) | Badge padding, icon gaps |
| sm | `p-2` (8px) | Compact table cells, tight items |
| md | `p-3` (12px) | Standard table cells, sidebar items |
| lg | `p-4` (16px) | Card padding, page sections |
| xl | `p-6` (24px) | Page padding, major section gaps |

### Grid Patterns
- KPI row: `grid-cols-4` on desktop, `grid-cols-2` on tablet
- Chart row: `grid-cols-2` for side-by-side, full-width for primary chart
- Always `gap-4` between cards, `gap-6` between chart rows

### Data Density
Moderate density — more readable than spy-baby-spy (operator tool), less spacious than MasterApp (demo tool). Target: 5-6 KPIs above the fold on a 1280px screen.

---

## 6. Depth & Elevation

### Surface Hierarchy
```
Layer 0: #f8fafc — page background (deepest)
Layer 1: #ffffff — cards, sidebar, panels (with border)
Layer 2: #ffffff — dropdowns, tooltips (with shadow)
Layer 3: #ffffff + overlay — modals
```

### Shadow System
```
Cards:     shadow-sm (0 1px 2px rgba(0,0,0,0.05))
Dropdowns: shadow-md (0 4px 6px rgba(0,0,0,0.07))
Modals:    shadow-xl (0 20px 25px rgba(0,0,0,0.1))
Sidebar:   shadow-none + right border
```

Use borders first, shadows second. Cards use `border border-slate-200` as primary definition, `shadow-sm` as accent.

### Chart Tooltip
```
bg-slate-800 rounded-lg px-3 py-2 shadow-lg
text-white text-sm
Value labels: font-mono font-semibold
```

---

## 7. Do's and Don'ts

### Do
- **Always show adapter source badge** next to any data field that came from an external system
- **Always reconcile revenue** from MERGED source — R-DATA-002: never show raw single-source revenue
- **Format money from cents** — `price / 100` before display, always `$` symbol
- **Convert timestamps** to user timezone before display
- **Show sync status** on any data section — users need to know if data is stale
- **Right-align numbers** in tables — consistency makes scanning faster
- **Include loading skeleton** — Recharts data fetches take 200-800ms, show skeleton cards
- **Show data freshness** — "Last synced 4 min ago" in page header or card footer
- **Include empty state** with sync CTA if no data for the period

### Don't
- **Never show raw cents** — `4999` must become `$49.99`
- **Never show UTC strings** — `2026-03-28T14:23:11.000Z` is never user-facing
- **Never mix adapter colors** — Shopify is always green, CC always orange
- **Never expose Prisma error messages** — wrap all DB errors in user-friendly messages
- **Never skip auth guard** — all `/app/*` routes require valid session
- **Never auto-refresh faster than 60s** — API rate limits, and data doesn't change that fast
- **Don't use arbitrary Recharts colors** — only the defined 5-color palette
- **Don't show single-source revenue figures** — always the merged/reconciled value
- **Don't add mobile layouts** — this is a desktop analytics tool (1280px minimum)

---

## 8. Responsive Behavior

### Breakpoints
| Screen | Width | Strategy |
|--------|-------|----------|
| Large monitor | 1920px+ | 5-column KPI rows, expanded charts |
| Desktop | 1280px | Primary target — 4-column KPI, 2-column charts |
| Laptop | 1024px | 2-column KPI, charts stack vertically |
| Tablet | 768px | Sidebar collapses to icon-only, tables scroll |
| Mobile | <768px | Not supported — analytics requires full screen |

### Sidebar Collapse
At `<1024px`: sidebar collapses from `w-64` to `w-16` (icon-only mode). Labels hide, tooltips show on hover. Main content `ml-16`.

### Table Overflow
Tables never hide columns — they scroll horizontally (`overflow-x-auto` on wrapper). All data is accessible.

### Chart Responsiveness
All Recharts use `<ResponsiveContainer width="100%" height={300}>`. Height fixed, width fluid.

---

## 9. Agent Prompt Guide

### Quick Reference
```
Page bg: bg-slate-50
Card: bg-white rounded-lg border border-slate-200
Sidebar: w-64 bg-white border-r border-slate-200
Accent: text-blue-600 / bg-blue-600
Text: text-slate-900 (primary), text-slate-600 (body), text-slate-400 (muted)
Border: border-slate-200
Badge sizes: px-2 py-0.5 rounded text-xs font-medium
Max width: max-w-7xl mx-auto
Font: font-sans (Tailwind system stack), text-sm default for body
Recharts palette: #3b82f6, #10b981, #f59e0b, #8b5cf6, #ec4899
```

### Adapter Badge Quick Reference
```
SHOPIFY:       bg-green-100 text-green-700
CHECKOUTCHAMP: bg-orange-100 text-orange-700
MERGED:        bg-blue-100 text-blue-700
KLAVIYO:       bg-purple-100 text-purple-700
GA4:           bg-yellow-100 text-yellow-700
```

### When Building a New Page
1. Start with sidebar layout: `ml-64 min-h-screen bg-slate-50`
2. Page header: title + date range picker + sync status
3. KPI row: `grid grid-cols-4 gap-4` with KPI card components
4. Charts: `grid grid-cols-2 gap-6` with ResponsiveContainer
5. Data table: full width, sort/filter controls above
6. Apply auth guard on page load (redirect to `/login` if no session)
7. Three states: loading skeleton → data → empty state with sync CTA
8. Read DESIGN.md first for any UI work, then run ux-reviewer skill after
