# CLAUDE.md — Instructions for Claude Code

## Project overview

This is the ThermoSlim Commerce Intelligence Platform — a standalone Next.js web app that unifies data from multiple e-commerce platforms (Shopify, CheckoutChamp, Klaviyo, GA4, Microsoft Clarity) into a single reporting and alerting system.

## Tech stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Prisma ORM
- **Cache**: Redis (via ioredis)
- **Job queue**: BullMQ (Redis-backed)
- **Frontend**: React + Tailwind CSS + Recharts
- **API layer**: tRPC
- **Auth**: NextAuth.js (role-based: admin, viewer)
- **Testing**: Vitest + Playwright

## Architecture principles

1. **Adapter pattern** — each data source has its own adapter in `src/adapters/`. Adapters implement a standard interface: `connect()`, `sync()`, `mapToSchema()`, `handleWebhook()`. New sources are added by creating a new adapter — nothing else changes.

2. **Unified schema** — all data is normalized into common entities (see `prisma/schema.prisma`). An order from Shopify and an order from CheckoutChamp both become rows in the `orders` table with a `source` field.

3. **Product mapping** — Shopify is the product master catalog. CheckoutChamp products link via `externalId` (Shopify product ID). The `product_map` table enriches with product line, frequency, category.

4. **Ingestion pipeline** — `src/core/ingestion/` handles the flow: receive raw data → validate → normalize via adapter → write to unified store → trigger dependent computations (snapshots, alerts).

5. **Module independence** — each module in `src/modules/` (dashboard, alerts, order-qa, funnel) reads from the unified store. Modules don't talk to each other directly.

6. **Single source of truth for metrics** — Revenue and order counts have ONE canonical definition. Fix discrepancies at the data layer (snapshot builder, ingestion), never at the UI layer. Before building any new dashboard or metric:
   - **Revenue** = `Order.totalPrice` where `source IN ('SHOPIFY', 'MERGED')` and `status = 'COMPLETE'`. Raw CHECKOUTCHAMP orders are duplicates and MUST be excluded.
   - **DailySnapshot** is the pre-aggregated source for time-series analytics. It only contains deduplicated, COMPLETE orders. If a new page needs aggregate data over time, query DailySnapshot — not the Order table.
   - **Order table** is the source of truth for real-time / single-order queries (detail pages, customer lookup, recent orders).
   - If numbers disagree between pages, the bug is in the data pipeline — not the UI. Fix it at the source so all consumers benefit.

## Key documentation

Read these before making changes:

- `docs/architecture/overview.md` — system design, data flow, layer responsibilities
- `docs/architecture/unified-schema.md` — database entity design and relationships
- `docs/architecture/ingestion-layer.md` — how data flows from source to store
- `docs/product-mapping.md` — how Shopify ↔ CC product mapping works
- `docs/adapters/` — per-adapter specs with field mappings and API details
- `docs/reports/` — report definitions and which data sources power each metric

## Coding conventions

- Use `async/await` everywhere, no raw promises
- All database queries go through Prisma client — never raw SQL except in migrations
- Adapter methods return normalized types defined in `src/core/types/`
- Error handling: wrap all external API calls in try/catch, log with structured logging, never swallow errors
- Environment variables: all secrets in `.env`, accessed via `src/core/config.ts` — never import process.env directly
- Date handling: store all dates as UTC in the database, convert to user timezone only in the frontend
- Money: store all monetary values as integers (cents) in the database, format to dollars only in the frontend

## File naming

- Files: `kebab-case.ts`
- React components: `PascalCase.tsx`
- Types/interfaces: `PascalCase` with `I` prefix for interfaces (`IOrder`, `IAdapter`)
- Database fields: `camelCase` in Prisma schema
- API routes: `kebab-case`

## Common tasks

### Adding a new data source adapter
1. Create directory `src/adapters/{source-name}/`
2. Implement `IAdapter` interface from `src/core/types/adapter.ts`
3. Add field mapping in `src/adapters/{source-name}/field-map.ts`
4. Register adapter in `src/core/ingestion/registry.ts`
5. Add webhook route if needed in `src/api/webhooks/{source-name}.ts`
6. Write tests in `src/adapters/{source-name}/__tests__/`
7. Document in `docs/adapters/{source-name}.md`

### Adding a new report/metric
1. Define metric computation in `src/modules/{module}/metrics/`
2. Add API route in `src/api/`
3. Build frontend component in `src/web/components/`
4. Document data source requirements in `docs/reports/`

### Adding a new alert rule
1. Define rule in `src/modules/alerts/rules/`
2. Implement `IAlertRule` interface
3. Register in `src/modules/alerts/registry.ts`
4. Add notification template if needed

## Testing

```bash
# Unit tests
npm run test

# Integration tests (requires running DB)
npm run test:integration

# E2E tests
npm run test:e2e
```

## Environment variables

See `.env.example` for all required variables. Critical ones:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET` — Shopify app credentials
- `CC_API_URL`, `CC_API_KEY` — CheckoutChamp API credentials
- `KLAVIYO_API_KEY` — Klaviyo private API key
- `GA4_PROPERTY_ID`, `GA4_CREDENTIALS_JSON` — GA4 service account
- `CLARITY_TOKEN`, `CLARITY_PROJECT_ID` — Clarity Data Export API

---

## STRUCTURAL DEBT GUARD — Pre-Flight Checks

**Read this before writing ANY code in this codebase.** These are known structural weaknesses. Every change must avoid deepening them. If your change violates a guard, stop and refactor first.

### Guard 1: No New Inline Prisma Queries in Pages
**Problem:** 51 dashboard pages query Prisma directly. Revenue dedup filter copy-pasted 20+ times.
**Rule:** New pages MUST use service functions from `src/services/` (create the file if it doesn't exist yet). If a service doesn't exist for the data you need, extract the existing inline query into a service FIRST, then use it.
**Check before commit:** Grep your changed `.tsx` page files for `prisma.` — if found in a page component, you're violating this guard.

### Guard 2: Don't Feed the God Files
**Problem:** `pipeline.ts` (894 lines), `checkoutchamp/index.ts` (763 lines), `cc-qa/researcher.ts` (926 lines).
**Rule:** Never add logic to a file over 400 lines. If you need to add ingestion logic, add it as a new focused file (`upsert-product.ts`, `upsert-subscription.ts`, etc.) and import it. Same for the CC adapter — split by concern (sync, field-mapping, subscriptions).
**Check before commit:** `wc -l` on any file you modified. If it grew and was already >400 lines, extract.

### Guard 3: Scripts Must Use Adapters
**Problem:** `scripts/cc-qa/` (14 files, ~5000 lines) reimplements CC API calls outside the adapter pattern.
**Rule:** New scripts MUST import from `src/adapters/` and `src/core/`. If the adapter doesn't expose what you need, extend the adapter — don't duplicate.
**Check before commit:** Grep new script files for direct `fetch()` calls to CC/Shopify APIs. If found, route through the adapter.

### Guard 4: Error Boundaries on Dashboard Routes
**Problem:** Any failed Prisma query crashes the entire page with Next.js default error screen.
**Rule:** Every new route segment under `app/(dashboard)/` MUST have an `error.tsx` file. Wrap risky queries to show "data unavailable" for that section rather than killing the page.
**Check before commit:** New dashboard route? Check for `error.tsx` in the same directory.

### Guard 5: Batch Database Operations
**Problem:** Ingestion loops do sequential upserts — 500 orders = 1500+ DB round-trips.
**Rule:** Any new ingestion code MUST batch writes. Use `prisma.createMany()`, `prisma.$transaction()`, or at minimum `Promise.all` with `p-limit(10)`.
**Check before commit:** Look for `for/while` loops containing `await prisma.` — batch them.

### Guard 6: Use the Revenue Constant
**Problem:** `source IN ('SHOPIFY', 'MERGED') AND status = 'COMPLETE'` scattered across 10+ files.
**Rule:** Import `REVENUE_WHERE` from `src/lib/constants.ts` (create if missing). One place to update, all consumers benefit.
**Check before commit:** Grep for `source.*SHOPIFY.*MERGED` or `status.*COMPLETE` in new code. Use the constant.

### Guard 7: Adapters Don't Call Pipeline
**Problem:** CC adapter imports `runIngestion()` directly — breaks the layered architecture.
**Rule:** Adapters return `NormalizedRecord[]`. The caller (API route, sync script, worker) passes them to `runIngestion()`. Adapters never import from `src/core/ingestion/`.
**Check before commit:** Grep adapter files for imports from `../../core/ingestion`.

### Guard 8: Auth on API Routes
**Problem:** No `middleware.ts` at project root. API sync routes appear unprotected.
**Rule:** Any new API route that modifies data MUST check authentication. Webhook routes validate their shared secret. Cron routes check `CRON_SECRET`.
**Check before commit:** New API route? Verify auth check exists in the first 5 lines. (battle-tested 2026-04-04 — aligned with global quality gate R-SEC-001)

### Guard Evolution
- Guard catches a real issue → add "battle-tested {date}" note
- Guard never triggers in 10+ sessions → flag for removal
- New structural debt discovered → add a new guard immediately
- Updated: 2026-04-04 (initial set from knowledge graph analysis)

---

## KNOWLEDGE SYSTEM
- **Global rules** (profile, guardrails, model routing): `~/.claude/CLAUDE.md` (auto-loaded). Detailed procedures (session rhythm, quality gate, export format): `~/.claude/docs/`
- **Cross-project gotchas:** `~/Vaults/CROMaxLabs/shared-gotchas.md` — read before bug fixes
- **Decision journal:** `~/Vaults/CROMaxLabs/decision-journal.md` — read before architectural choices
- **Vault domain docs:** `~/Vaults/CROMaxLabs/thermoslim-platform/_INDEX.md`
- **Any agent** (Claude Code, Gemini CLI, OpenClaw) reads the same shared knowledge files
