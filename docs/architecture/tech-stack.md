# Tech stack

## Backend
- **Runtime**: Node.js 20+
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Job queue**: BullMQ
- **API**: tRPC (type-safe RPC between frontend and backend)

## Frontend
- **Framework**: React 18+ (via Next.js)
- **Styling**: Tailwind CSS
- **Charts**: Recharts (primary), with Tremor components for dashboard cards
- **State**: React Query (TanStack Query) for server state
- **Date handling**: date-fns
- **Tables**: TanStack Table

## Auth
- **Library**: NextAuth.js
- **Roles**: admin (full access), viewer (read-only dashboards)
- **Strategy**: credentials + optional OAuth (Google)

## Infrastructure
- **Hosting**: Vercel (frontend) + Railway or Render (backend/DB/Redis)
- **Monitoring**: structured logging to stdout (Pino)
- **Error tracking**: Sentry
- **CI/CD**: GitHub Actions

## External API clients
- Shopify: `@shopify/shopify-api`
- CheckoutChamp: custom REST client (no official SDK)
- Klaviyo: `klaviyo-api` (official Node SDK)
- GA4: `@google-analytics/data` (official)
- Clarity: custom REST client (Data Export API)
