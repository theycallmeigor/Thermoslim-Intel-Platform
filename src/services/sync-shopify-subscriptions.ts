// Syncs Loop subscriptions via Shopify's subscriptionContracts GraphQL endpoint.
// No Loop API required — contracts live natively in Shopify.
// Architecture: this service owns the Prisma upserts; it imports only credentials from the adapter.

import { prisma } from '../lib/prisma';
import { shopifyGraphQL } from '../adapters/shopify';
import type { SubscriptionStatus, SubscriptionEventType } from '@prisma/client';

// --- Types ---

interface GQLContractLine {
  productId: string | null;
  variantId: string | null;
  title: string;
  currentPrice: { amount: string; currencyCode: string };
  sellingPlanName: string | null;
}

interface GQLContract {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  nextBillingDate: string | null;
  lastPaymentStatus: string | null;
  customer: { id: string; email: string } | null;
  lines: { edges: Array<{ node: GQLContractLine }> };
  billingPolicy: { interval: string; intervalCount: number };
}

interface GQLResponse {
  data?: {
    subscriptionContracts: {
      edges: Array<{ node: GQLContract }>;
      pageInfo: { hasNextPage: boolean; endCursor: string };
    };
  };
  errors?: Array<{ message: string }>;
  extensions?: { cost?: { throttleStatus?: { currentlyAvailable: number } } };
}

// --- Constants ---

const GRAPHQL_QUERY = `
  query GetSubscriptionContracts($first: Int!, $after: String, $query: String) {
    subscriptionContracts(first: $first, after: $after, query: $query) {
      edges {
        node {
          id status createdAt updatedAt nextBillingDate lastPaymentStatus
          customer { id email }
          lines(first: 5) {
            edges { node { productId variantId title currentPrice { amount currencyCode } sellingPlanName } }
          }
          billingPolicy { interval intervalCount }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const STATUS_MAP: Record<string, SubscriptionStatus> = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'COMPLETE',
};

// --- Helpers (exported for testing) ---

export function toFrequency(interval: string, intervalCount: number): string {
  // Must match "1-month" / "3-month" format expected by toMonthlyMrr()
  return `${intervalCount}-${interval.toLowerCase()}`;
}

export function calcBillingCycle(createdAt: string, intervalCount: number): number {
  const msPerMonth = 1000 * 60 * 60 * 24 * 30.4375;
  const monthsSince = (Date.now() - new Date(createdAt).getTime()) / msPerMonth;
  return Math.max(1, Math.floor(monthsSince / intervalCount) + 1);
}

export function resolveEventType(
  prevStatus: SubscriptionStatus | undefined,
  nextStatus: SubscriptionStatus,
  isNew: boolean,
): SubscriptionEventType | null {
  if (isNew) return 'CREATED';
  if (!prevStatus || prevStatus === nextStatus) return null;
  if (nextStatus === 'CANCELLED') return 'CANCELLED';
  if (nextStatus === 'PAUSED') return 'PAUSED';
  if (nextStatus === 'COMPLETE') return 'EXPIRED';
  if (prevStatus === 'PAUSED' && nextStatus === 'ACTIVE') return 'RESUMED';
  if (prevStatus === 'CANCELLED' && nextStatus === 'ACTIVE') return 'REACTIVATED';
  return null;
}

// --- Main export ---

export async function syncShopifySubscriptions(): Promise<{
  synced: number;
  skipped: number;
  errors: number;
}> {
  const existingCount = await prisma.subscription.count({
    where: { shopifyContractId: { not: null } },
  });
  const isBackfill = existingCount === 0;

  // Incremental: 25h lookback for hourly cron (overlap prevents gaps on failed runs)
  const queryFilter = isBackfill
    ? null
    : `updated_at:>='${new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()}'`;

  const { url, headers } = shopifyGraphQL();
  let cursor: string | null = null;
  let synced = 0, skipped = 0, errors = 0;

  console.log(`[sync-shopify-subs] starting ${isBackfill ? 'BACKFILL' : 'incremental'}`);

  do {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: GRAPHQL_QUERY,
        variables: { first: 50, after: cursor ?? undefined, query: queryFilter ?? undefined },
      }),
    });

    if (!res.ok) throw new Error(`Shopify GraphQL HTTP error ${res.status}`);

    const json = await res.json() as GQLResponse;

    if (json.errors?.length) {
      throw new Error(`Shopify GraphQL error: ${json.errors[0].message}`);
    }

    const page = json.data!.subscriptionContracts;
    const available = json.extensions?.cost?.throttleStatus?.currentlyAvailable ?? 1000;
    if (available < 100) {
      console.log(`[sync-shopify-subs] throttle: ${available} points remaining, sleeping 2s`);
      await new Promise(r => setTimeout(r, 2000));
    }

    const result = await processPage(page.edges.map(e => e.node), isBackfill);
    synced += result.synced;
    skipped += result.skipped;
    errors += result.errors;

    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (cursor);

  console.log(`[sync-shopify-subs] done: synced=${synced} skipped=${skipped} errors=${errors}`);
  return { synced, skipped, errors };
}

// --- Page processor ---

async function processPage(
  contracts: GQLContract[],
  isBackfill: boolean,
): Promise<{ synced: number; skipped: number; errors: number }> {
  const valid: GQLContract[] = [];
  let skipped = 0;

  for (const c of contracts) {
    if (!c.customer?.email) {
      console.log(`[sync-shopify-subs] skip ${c.id}: no customer email`);
      skipped++;
      continue;
    }
    if (c.lines.edges.length === 0) {
      console.log(`[sync-shopify-subs] skip ${c.id}: no lines`);
      skipped++;
      continue;
    }
    valid.push(c);
  }

  if (valid.length === 0) return { synced: 0, skipped, errors: 0 };

  // 1. Batch-upsert customers
  const emails = [...new Set(valid.map(c => c.customer!.email))];
  await prisma.$transaction(
    emails.map(email => prisma.customer.upsert({ where: { email }, update: {}, create: { email } })),
  );

  // 2. Load customer IDs, existing subs, product maps in parallel
  const shopifyProductIds = valid
    .map(c => c.lines.edges[0]?.node.productId?.replace('gid://shopify/Product/', ''))
    .filter((id): id is string => Boolean(id));

  const [customers, existingSubs, productMaps] = await Promise.all([
    prisma.customer.findMany({ where: { email: { in: emails } }, select: { id: true, email: true } }),
    prisma.subscription.findMany({
      where: { shopifyContractId: { in: valid.map(c => c.id) } },
      select: { id: true, shopifyContractId: true, status: true },
    }),
    prisma.productMap.findMany({
      where: { shopifyProductId: { in: shopifyProductIds } },
      select: { id: true, shopifyProductId: true },
    }),
  ]);

  const customerMap = new Map(customers.map(c => [c.email, c.id]));
  const existingMap = new Map(existingSubs.map(s => [s.shopifyContractId!, { id: s.id, status: s.status }]));
  const productMapLookup = new Map(productMaps.map(p => [p.shopifyProductId!, p.id]));

  // 3. Build upserts + collect pending events
  type PendingEvent = {
    contractId: string;
    eventType: SubscriptionEventType;
    fromStatus: SubscriptionStatus | null;
    toStatus: SubscriptionStatus;
    occurredAt: Date;
  };
  const pendingEvents: PendingEvent[] = [];

  const upserts = valid.map(c => {
    const line = c.lines.edges[0].node;
    const customerId = customerMap.get(c.customer!.email)!;
    const shopifyProductId = line.productId?.replace('gid://shopify/Product/', '') ?? null;
    const productMapId = shopifyProductId ? (productMapLookup.get(shopifyProductId) ?? null) : null;
    const newStatus = STATUS_MAP[c.status] ?? 'ACTIVE';
    const existing = existingMap.get(c.id);
    const isNew = !existing;
    const intervalCount = c.billingPolicy.intervalCount;

    // cancelledAt: use updatedAt on backfill, now() on incremental transition
    const cancelledAt =
      newStatus === 'CANCELLED'
        ? isBackfill ? new Date(c.updatedAt) : new Date()
        : existing?.status === 'CANCELLED'
        ? null  // reactivated — clear cancelledAt
        : undefined; // no change

    const eventType = resolveEventType(existing?.status, newStatus, isNew);
    if (eventType) {
      pendingEvents.push({
        contractId: c.id,
        eventType,
        fromStatus: existing?.status ?? null,
        toStatus: newStatus,
        occurredAt: isNew ? new Date(c.createdAt) : new Date(),
      });
    }

    const fields = {
      customerId,
      status: newStatus,
      shopifyContractId: c.id,
      sellingPlanName: line.sellingPlanName ?? null,
      recurringPrice: Math.round(parseFloat(line.currentPrice.amount) * 100),
      frequency: toFrequency(c.billingPolicy.interval, intervalCount),
      currentBillingCycle: calcBillingCycle(c.createdAt, intervalCount),
      nextBillDate: c.nextBillingDate ? new Date(c.nextBillingDate) : null,
      startedAt: new Date(c.createdAt),
      ...(productMapId ? { productMapId } : {}),
      ...(cancelledAt !== undefined ? { cancelledAt } : {}),
    };

    return prisma.subscription.upsert({
      where: { shopifyContractId: c.id },
      update: fields,
      create: fields,
    });
  });

  // 4. Execute batch upsert in transaction
  try {
    await prisma.$transaction(upserts);
  } catch (err) {
    console.error('[sync-shopify-subs] transaction error:', err instanceof Error ? err.message : err);
    return { synced: 0, skipped, errors: valid.length };
  }

  // 5. Emit subscription events
  if (pendingEvents.length > 0) {
    const updatedSubs = await prisma.subscription.findMany({
      where: { shopifyContractId: { in: pendingEvents.map(e => e.contractId) } },
      select: { id: true, shopifyContractId: true },
    });
    const subIdMap = new Map(updatedSubs.map(s => [s.shopifyContractId!, s.id]));

    await prisma.subscriptionEvent.createMany({
      data: pendingEvents.map(e => ({
        subscriptionId: subIdMap.get(e.contractId)!,
        eventType: e.eventType,
        fromStatus: e.fromStatus ?? undefined,
        toStatus: e.toStatus,
        occurredAt: e.occurredAt,
      })),
      skipDuplicates: true,
    });
  }

  return { synced: valid.length, skipped, errors: 0 };
}
