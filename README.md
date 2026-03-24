# ThermoSlim Commerce Intelligence Platform

A standalone web app that unifies commerce data across Shopify, CheckoutChamp, Klaviyo, GA4, and Microsoft Clarity into a single intelligence layer — with subscription reporting, funnel analytics, automated alerts, and order QA.

## Quick start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your API keys and database URL

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Architecture

See `docs/architecture/overview.md` for the full system design.

## Data sources

| Source | Purpose | Adapter |
|--------|---------|---------|
| Shopify | Product master, orders, customers | `src/adapters/shopify/` |
| CheckoutChamp | Transactions, subscriptions, funnels, attribution | `src/adapters/checkoutchamp/` |
| Klaviyo | Email campaigns, flows, engagement | `src/adapters/klaviyo/` |
| Google Analytics 4 | Traffic, landing pages, pre-checkout funnel | `src/adapters/ga4/` |
| Microsoft Clarity | Behavioral analytics, rage clicks, scroll depth | `src/adapters/clarity/` |

## Project structure

```
thermoslim-platform/
├── docs/              # Architecture, specs, and reference docs
├── src/
│   ├── adapters/      # Data source connectors (one per platform)
│   ├── core/          # Ingestion engine, sync, schema utilities
│   ├── modules/       # Business logic modules (dashboard, alerts, QA)
│   ├── api/           # API routes (tRPC or REST)
│   └── web/           # Next.js frontend
├── prisma/            # Database schema and migrations
└── scripts/           # Utility scripts (backfill, seed, etc.)
```

## Phases

1. **Foundation + Dashboard** — Shopify + CC adapters, unified schema, product mapping, subscription dashboard
2. **Alerts Engine** — Anomaly detection, threshold rules, notifications
3. **Order QA** — Cross-platform reconciliation, validation rules
4. **Advanced** — Cohort analysis, LTV prediction, forecasting
