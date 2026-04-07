# Loop via Shopify Subscriptions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync Loop subscription data via Shopify's Admin GraphQL `subscriptionContracts` endpoint, populating the empty churn, cohort, and frequency dashboards.

**Architecture:** A dedicated service (`sync-shopify-subscriptions.ts`) queries Shopify GraphQL, upserts Subscription records with `shopifyContractId` as dedup key, and emits SubscriptionEvents on status transitions. A cron route triggers hourly syncs. First run backfills all historical contracts.

**Tech Stack:** Shopify Admin GraphQL API, Prisma ORM, Next.js API route, Vitest

**Spec:** `docs/superpowers/specs/2026-04-07-loop-via-shopify-subscriptions-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `prisma/schema.prisma` | Add 3 fields to Subscription + 2 enum values to SubscriptionEventType |
| `src/services/sync-shopify-subscriptions.ts` | Core sync logic: GraphQL fetch, upsert, event emission (~250 lines) |
| `src/services/__tests__/sync-shopify-subscriptions.test.ts` | Unit tests for mapping, frequency normalization, status transitions |
| `app/api/cron/sync-shopify-subs/route.ts` | Cron endpoint with CRON_SECRET auth |

---

### Task 1: Schema Migration

**Files:**
- Modify: `prisma/schema.prisma:62-70` (SubscriptionEventType enum)
- Modify: `prisma/schema.prisma:224-248` (Subscription model)

- [ ] **Step 1: Add new enum values to SubscriptionEventType**

In `prisma/schema.prisma`, add after `REACTIVATED`:

```prisma
enum SubscriptionEventType {
  CREATED
  BILLED
  DECLINED
  CANCELLED
  PAUSED
  RESUMED
  REACTIVATED
  EXPIRED
  SKIPPED
}
```

- [ ] **Step 2: Add new fields to Subscription model**

In `prisma/schema.prisma`, add after `nextBillDate` (line 242) and before `events`:

```prisma
  loopSubscriptionId   String?              @unique
  shopifyContractId    String?              @unique
  sellingPlanName      String?
```

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name add-loop-subscription-fields
```

Expected: Migration created and applied. Prisma client regenerated.

- [ ] **Step 4: Verify generated client**

```bash
npx prisma generate
```

Expected: No errors. New fields available on `Subscription` type.

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: add Loop subscription fields and event types to schema"
```

---

### Task 2: Sync Service — Tests First

**Files:**
- Create: `src/services/__tests__/sync-shopify-subscriptions.test.ts`

- [ ] **Step 1: Write tests for frequency normalization**

Create `src/services/__tests__/sync-shopify-subscriptions.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  normalizeFrequency,
  mapContractStatus,
  resolveStatus,
  calculateBillingCycle,
  toCents,
} from '../sync-shopify-subscriptions';

describe('normalizeFrequency', () => {
  it('formats MONTH interval as lowercase with dash', () => {
    expect(normalizeFrequency('MONTH', 1)).toBe('1-month');
    expect(normalizeFrequency('MONTH', 3)).toBe('3-month');
    expect(normalizeFrequency('MONTH', 6)).toBe('6-month');
  });

  it('formats WEEK interval', () => {
    expect(normalizeFrequency('WEEK', 2)).toBe('2-week');
  });

  it('formats DAY interval', () => {
    expect(normalizeFrequency('DAY', 30)).toBe('30-day');
  });
});

describe('mapContractStatus', () => {
  it('maps ACTIVE to ACTIVE', () => {
    expect(mapContractStatus('ACTIVE')).toBe('ACTIVE');
  });

  it('maps PAUSED to PAUSED', () => {
    expect(mapContractStatus('PAUSED')).toBe('PAUSED');
  });

  it('maps CANCELLED to CANCELLED', () => {
    expect(mapContractStatus('CANCELLED')).toBe('CANCELLED');
  });

  it('maps EXPIRED to COMPLETE', () => {
    expect(mapContractStatus('EXPIRED')).toBe('COMPLETE');
  });

  it('defaults unknown status to ACTIVE', () => {
    expect(mapContractStatus('UNKNOWN_THING')).toBe('ACTIVE');
  });
});

describe('resolveStatus', () => {
  it('returns RECYCLE_BILLING when contract is ACTIVE but lastPaymentStatus is FAILED', () => {
    expect(resolveStatus('ACTIVE', 'FAILED')).toBe('RECYCLE_BILLING');
  });

  it('returns ACTIVE when contract is ACTIVE and lastPaymentStatus is SUCCEEDED', () => {
    expect(resolveStatus('ACTIVE', 'SUCCEEDED')).toBe('ACTIVE');
  });

  it('returns ACTIVE when contract is ACTIVE and lastPaymentStatus is null', () => {
    expect(resolveStatus('ACTIVE', null)).toBe('ACTIVE');
  });

  it('returns CANCELLED regardless of lastPaymentStatus', () => {
    expect(resolveStatus('CANCELLED', 'FAILED')).toBe('CANCELLED');
  });
});

describe('calculateBillingCycle', () => {
  it('returns 1 for a brand new subscription', () => {
    const now = new Date('2026-04-07');
    const created = new Date('2026-04-01');
    expect(calculateBillingCycle(created, now, 'MONTH', 1)).toBe(1);
  });

  it('returns 4 for a 3-month-old monthly subscription', () => {
    const now = new Date('2026-04-07');
    const created = new Date('2026-01-01');
    expect(calculateBillingCycle(created, now, 'MONTH', 1)).toBe(4);
  });

  it('returns 2 for a 3-month-old quarterly subscription', () => {
    const now = new Date('2026-04-07');
    const created = new Date('2026-01-01');
    expect(calculateBillingCycle(created, now, 'MONTH', 3)).toBe(2);
  });

  it('returns at least 1 even for future dates', () => {
    const now = new Date('2026-04-07');
    const created = new Date('2026-05-01');
    expect(calculateBillingCycle(created, now, 'MONTH', 1)).toBe(1);
  });
});

describe('toCents', () => {
  it('converts decimal string to integer cents using Math.round', () => {
    expect(toCents('49.99')).toBe(4999);
    expect(toCents('0.00')).toBe(0);
    expect(toCents('100.00')).toBe(10000);
  });

  it('handles floating point edge case', () => {
    // 49.99 * 100 = 4998.999... — Math.round fixes this
    expect(toCents('49.99')).toBe(4999);
  });

  it('returns 0 for empty/null input', () => {
    expect(toCents('')).toBe(0);
    expect(toCents(undefined as any)).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/services/__tests__/sync-shopify-subscriptions.test.ts
```

Expected: FAIL — module not found (service doesn't exist yet).

- [ ] **Step 3: Commit failing tests**

```bash
git add src/services/__tests__/sync-shopify-subscriptions.test.ts
git commit -m "test: add tests for Loop subscription sync helpers"
```

---

### Task 3: Sync Service — Implementation

**Files:**
- Create: `src/services/sync-shopify-subscriptions.ts`

- [ ] **Step 1: Implement the service**

Create `src/services/sync-shopify-subscriptions.ts`:

```typescript
import { prisma } from '@/lib/prisma';
import { config } from '@/core/config';
import type { SubscriptionStatus, SubscriptionEventType } from '@prisma/client';

// --- Exported helpers (tested independently) ---

export function normalizeFrequency(interval: string, intervalCount: number): string {
  return `${intervalCount}-${interval.toLowerCase()}`;
}

export function mapContractStatus(status: string): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'COMPLETE',
  };
  return map[status] ?? 'ACTIVE';
}

/** Combines contract status with lastPaymentStatus to detect dunning */
export function resolveStatus(
  contractStatus: string,
  lastPaymentStatus: string | null,
): SubscriptionStatus {
  const base = mapContractStatus(contractStatus);
  // If contract shows ACTIVE but last payment failed, it's in dunning
  if (base === 'ACTIVE' && lastPaymentStatus === 'FAILED') {
    return 'RECYCLE_BILLING';
  }
  return base;
}

export function calculateBillingCycle(
  createdAt: Date,
  now: Date,
  interval: string,
  intervalCount: number,
): number {
  const msPerMonth = 30.44 * 24 * 60 * 60 * 1000;
  const msPerUnit: Record<string, number> = {
    month: msPerMonth,
    week: 7 * 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
  };
  const unitMs = msPerUnit[interval.toLowerCase()] ?? msPerMonth;
  const elapsed = now.getTime() - createdAt.getTime();
  if (elapsed <= 0) return 1;
  return Math.floor(elapsed / (unitMs * intervalCount)) + 1;
}

export function toCents(value: string | undefined | null): number {
  return Math.round(parseFloat(value || '0') * 100);
}

// --- GraphQL types ---

interface ContractNode {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  nextBillingDate: string | null;
  lastPaymentStatus: string | null;
  customer: { id: string; email: string | null } | null;
  lines: {
    edges: Array<{
      node: {
        productId: string | null;
        variantId: string | null;
        title: string;
        quantity: number;
        currentPrice: { amount: string; currencyCode: string };
        sellingPlanName: string | null;
      };
    }>;
  };
  billingPolicy: { interval: string; intervalCount: number } | null;
}

interface GraphQLResponse {
  data?: {
    subscriptionContracts: {
      edges: Array<{ node: ContractNode }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  };
  errors?: Array<{ message: string }>;
  extensions?: {
    cost?: {
      throttleStatus?: { currentlyAvailable: number; maximumAvailable: number };
    };
  };
}

// --- GraphQL query ---

const SUBSCRIPTION_CONTRACTS_QUERY = `
  query GetSubscriptionContracts($first: Int!, $after: String, $query: String) {
    subscriptionContracts(first: $first, after: $after, query: $query) {
      edges {
        node {
          id
          status
          createdAt
          updatedAt
          nextBillingDate
          lastPaymentStatus
          customer { id email }
          lines(first: 5) {
            edges {
              node {
                productId
                variantId
                title
                quantity
                currentPrice { amount currencyCode }
                sellingPlanName
              }
            }
          }
          billingPolicy { interval intervalCount }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

// --- Core sync function ---

export async function syncShopifySubscriptions(): Promise<{
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}> {
  const stats = { processed: 0, created: 0, updated: 0, skipped: 0, errors: [] as string[] };

  // Determine if this is backfill or incremental
  const existingCount = await prisma.subscription.count({
    where: { shopifyContractId: { not: null } },
  });

  let queryFilter: string | undefined;
  if (existingCount > 0) {
    // Incremental: 5-hour lookback to overlap with hourly cron (matches CC sync pattern)
    const lookback = new Date(Date.now() - 5 * 60 * 60 * 1000);
    queryFilter = `updated_at:>='${lookback.toISOString()}'`;
  }
  // else: backfill — no filter, pull everything

  const contracts = await fetchAllContracts(queryFilter);
  console.log(`[sync-shopify-subs] fetched ${contracts.length} contracts (${existingCount === 0 ? 'backfill' : 'incremental'})`);

  // Process with controlled concurrency (Guard 5: avoid sequential DB round-trips)
  const CONCURRENCY = 5;
  for (let i = 0; i < contracts.length; i += CONCURRENCY) {
    const batch = contracts.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(node => upsertContract(node))
    );
    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      stats.processed++;
      if (r.status === 'fulfilled') {
        if (r.value === 'created') stats.created++;
        else if (r.value === 'updated') stats.updated++;
        else stats.skipped++;
      } else {
        const msg = `Contract ${batch[j].id}: ${r.reason instanceof Error ? r.reason.message : 'Unknown error'}`;
        console.error(`[sync-shopify-subs] ${msg}`);
        stats.errors.push(msg);
      }
    }
  }

  console.log(`[sync-shopify-subs] done: ${stats.processed} processed, ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped, ${stats.errors.length} errors`);
  return stats;
}

// --- Fetch all contracts with cursor pagination ---

async function fetchAllContracts(queryFilter?: string): Promise<ContractNode[]> {
  const graphqlUrl = buildGraphqlUrl();
  const headers = buildHeaders();
  const contracts: ContractNode[] = [];
  let after: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const variables: Record<string, unknown> = { first: 50, after, query: queryFilter ?? null };
    const res = await fetch(graphqlUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: SUBSCRIPTION_CONTRACTS_QUERY, variables }),
    });

    if (!res.ok) {
      throw new Error(`Shopify GraphQL error: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as GraphQLResponse;

    if (json.errors?.length) {
      throw new Error(`GraphQL errors: ${json.errors.map(e => e.message).join(', ')}`);
    }

    if (!json.data) {
      throw new Error('No data in GraphQL response');
    }

    const { edges, pageInfo } = json.data.subscriptionContracts;
    contracts.push(...edges.map(e => e.node));
    hasNextPage = pageInfo.hasNextPage;
    after = pageInfo.endCursor;

    // Cost-based throttling
    const available = json.extensions?.cost?.throttleStatus?.currentlyAvailable;
    if (available !== undefined && available < 100) {
      console.log(`[sync-shopify-subs] throttle: ${available} points remaining, sleeping 2s`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  return contracts;
}

// --- Upsert a single contract ---

async function upsertContract(node: ContractNode): Promise<'created' | 'updated' | 'skipped'> {
  // Skip contracts with no lines or no customer email
  const firstLine = node.lines.edges[0]?.node;
  if (!firstLine) {
    console.log(`[sync-shopify-subs] skipping ${node.id}: no line items`);
    return 'skipped';
  }

  const email = node.customer?.email;
  if (!email) {
    console.log(`[sync-shopify-subs] skipping ${node.id}: no customer email`);
    return 'skipped';
  }

  // Upsert customer
  const shopifyCustomerId = node.customer?.id
    ? node.customer.id.replace('gid://shopify/Customer/', '')
    : undefined;

  const customer = await prisma.customer.upsert({
    where: { email },
    create: { email, shopifyCustomerId },
    update: shopifyCustomerId ? { shopifyCustomerId } : {},
  });

  // Resolve product
  const shopifyProductId = firstLine.productId
    ? firstLine.productId.replace('gid://shopify/Product/', '')
    : null;

  let productMapId: string | null = null;
  if (shopifyProductId) {
    const productMap = await prisma.productMap.findFirst({
      where: { shopifyProductId },
      select: { id: true },
    });
    productMapId = productMap?.id ?? null;
  }

  // Map fields
  const interval = node.billingPolicy?.interval ?? 'MONTH';
  const intervalCount = node.billingPolicy?.intervalCount ?? 1;
  const newStatus = resolveStatus(node.status, node.lastPaymentStatus);
  const now = new Date();

  const subscriptionData = {
    customerId: customer.id,
    shopifyContractId: node.id,
    sellingPlanName: firstLine.sellingPlanName ?? null,
    status: newStatus,
    recurringPrice: toCents(firstLine.currentPrice.amount),
    frequency: normalizeFrequency(interval, intervalCount),
    currentBillingCycle: calculateBillingCycle(new Date(node.createdAt), now, interval, intervalCount),
    startedAt: new Date(node.createdAt),
    nextBillDate: node.nextBillingDate ? new Date(node.nextBillingDate) : null,
    lastBilledAt: null as Date | null, // Not available from GraphQL
    productMapId,
  };

  // Check if exists
  const existing = await prisma.subscription.findUnique({
    where: { shopifyContractId: node.id },
    select: { id: true, status: true },
  });

  if (!existing) {
    // Create new subscription
    const sub = await prisma.subscription.create({
      data: subscriptionData,
    });

    // Emit CREATED event with original timestamp
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId: sub.id,
        eventType: 'CREATED',
        fromStatus: null,
        toStatus: newStatus,
        amount: subscriptionData.recurringPrice,
        occurredAt: new Date(node.createdAt),
      },
    });

    // If created as CANCELLED, also set cancelledAt
    if (newStatus === 'CANCELLED') {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { cancelledAt: new Date(node.updatedAt) },
      });
    }

    return 'created';
  }

  // Update existing — check for status transition
  const oldStatus = existing.status;
  const statusChanged = oldStatus !== newStatus;

  const updateData: Record<string, unknown> = {
    status: newStatus,
    recurringPrice: subscriptionData.recurringPrice,
    frequency: subscriptionData.frequency,
    currentBillingCycle: subscriptionData.currentBillingCycle,
    nextBillDate: subscriptionData.nextBillDate,
    productMapId,
  };

  // Handle cancelledAt
  if (statusChanged && newStatus === 'CANCELLED') {
    updateData.cancelledAt = now;
  } else if (statusChanged && oldStatus === 'CANCELLED' && newStatus === 'ACTIVE') {
    updateData.cancelledAt = null;
  }

  await prisma.subscription.update({
    where: { id: existing.id },
    data: updateData,
  });

  // Emit status transition event
  if (statusChanged) {
    const eventTypeMap: Record<string, SubscriptionEventType> = {
      CANCELLED: 'CANCELLED',
      PAUSED: 'PAUSED',
      ACTIVE: oldStatus === 'PAUSED' ? 'RESUMED' : oldStatus === 'CANCELLED' ? 'REACTIVATED' : 'CREATED',
      COMPLETE: 'EXPIRED',
    };

    const eventType = eventTypeMap[newStatus];
    if (eventType) {
      await prisma.subscriptionEvent.create({
        data: {
          subscriptionId: existing.id,
          eventType,
          fromStatus: oldStatus,
          toStatus: newStatus,
          occurredAt: now,
        },
      });
    }
  }

  return 'updated';
}

// --- URL/header builders ---

function buildGraphqlUrl(): string {
  const domain = config.shopify.storeUrl
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  return `https://${domain}/admin/api/2024-10/graphql.json`;
}

function buildHeaders(): Record<string, string> {
  return {
    'X-Shopify-Access-Token': config.shopify.accessToken,
    'Content-Type': 'application/json',
  };
}
```

- [ ] **Step 2: Run tests — verify they pass**

```bash
npx vitest run src/services/__tests__/sync-shopify-subscriptions.test.ts
```

Expected: All tests PASS (the pure helper functions don't need DB).

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/services/sync-shopify-subscriptions.ts
git commit -m "feat: implement Loop subscription sync via Shopify GraphQL"
```

---

### Task 4: Cron Route

**Files:**
- Create: `app/api/cron/sync-shopify-subs/route.ts`

- [ ] **Step 1: Create the cron route**

Create `app/api/cron/sync-shopify-subs/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { syncShopifySubscriptions } from '@/services/sync-shopify-subscriptions';

export const maxDuration = 120; // Allow up to 2 minutes for GraphQL pagination

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncShopifySubscriptions();
    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Subscription sync failed';
    console.error('[cron:sync-shopify-subs] error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/sync-shopify-subs/route.ts
git commit -m "feat: add cron route for Shopify subscription sync"
```

---

### Task 5: Build Verification + Post-Backfill Validation Query

**Files:**
- None (verification only)

- [ ] **Step 1: Full build check**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run all tests**

```bash
npm run test
```

Expected: All tests pass (formatting tests + new sync tests).

- [ ] **Step 3: Prepare validation query for post-backfill**

After deploying and running the first sync, run this query to flag outlier prices (prepaid subscription risk from vault gotcha #4):

```sql
-- Run via Prisma Studio or psql after first sync

-- Check for outlier prices (prepaid risk, vault gotcha #4)
SELECT "shopifyContractId", "recurringPrice", "frequency", "status"
FROM "Subscription"
WHERE "shopifyContractId" IS NOT NULL
  AND "recurringPrice" > 10000  -- > $100/month is suspicious
ORDER BY "recurringPrice" DESC;

-- Check for non-month frequencies (toMonthlyMrr only handles month intervals)
SELECT DISTINCT "frequency", COUNT(*) as count
FROM "Subscription"
WHERE "shopifyContractId" IS NOT NULL
GROUP BY "frequency"
ORDER BY count DESC;
-- If any week/day frequencies appear, extend toMonthlyMrr() in formatting.ts
```

- [ ] **Step 4: Final commit with all changes**

```bash
git add -A
git status
git commit -m "feat: Loop subscription sync via Shopify GraphQL

Adds hourly sync of Shopify SubscriptionContracts (created by Loop)
into the Subscription table. Backfills historical data on first run,
then incremental. Populates churn, cohort, and frequency dashboards.

- Schema: 3 new fields on Subscription, 2 new SubscriptionEventType values
- Service: sync-shopify-subscriptions.ts with GraphQL pagination + throttling
- Cron: /api/cron/sync-shopify-subs with CRON_SECRET auth
- Tests: frequency normalization, status mapping, billing cycle calculation"
```

---

## Summary

| Task | What | Files | Commit |
|---|---|---|---|
| 1 | Schema migration | `prisma/schema.prisma` | `feat: add Loop subscription fields` |
| 2 | Tests first | `src/services/__tests__/sync-shopify-subscriptions.test.ts` | `test: add sync helper tests` |
| 3 | Service implementation | `src/services/sync-shopify-subscriptions.ts` | `feat: implement subscription sync` |
| 4 | Cron route | `app/api/cron/sync-shopify-subs/route.ts` | `feat: add cron route` |
| 5 | Build + validation | (none) | Final combined commit |

**Total new files:** 3 (service, test, cron route)
**Modified files:** 1 (schema)
**Adapter untouched:** Yes (service reads config.shopify directly)
