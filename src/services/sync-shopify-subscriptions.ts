// Syncs Loop subscriptions by scanning Shopify orders that have selling plans.
// No subscription contract scope needed — uses read_orders only.
// Dedup key: customer email + sellingPlanId + productId → one Subscription row per combo.
// Status is always ACTIVE for orders with selling plans (no contract-level status available).

import { prisma } from '../lib/prisma';
import { shopifyGraphQL } from '../adapters/shopify';
import type { SubscriptionEventType } from '@prisma/client';

// --- Types ---

interface GQLLineItem {
  title: string;
  quantity: number;
  originalUnitPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  sellingPlan: { name: string; sellingPlanId: string } | null;
  product: { id: string } | null;
  variant: { id: string } | null;
}

interface GQLOrder {
  id: string;
  name: string;
  createdAt: string;
  customer: { email: string } | null;
  lineItems: { edges: Array<{ node: GQLLineItem }> };
}

interface GQLResponse {
  data?: {
    orders: {
      edges: Array<{ node: GQLOrder }>;
      pageInfo: { hasNextPage: boolean; endCursor: string };
    };
  };
  errors?: Array<{ message: string }>;
  extensions?: { cost?: { throttleStatus?: { currentlyAvailable: number } } };
}

// --- GraphQL query ---

const ORDERS_QUERY = `
  query GetOrders($first: Int!, $after: String, $query: String) {
    orders(first: $first, after: $after, sortKey: CREATED_AT, reverse: true, query: $query) {
      edges {
        node {
          id
          name
          createdAt
          customer { email }
          lineItems(first: 10) {
            edges {
              node {
                title
                quantity
                originalUnitPriceSet { shopMoney { amount currencyCode } }
                sellingPlan { name sellingPlanId }
                product { id }
                variant { id }
              }
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

// --- Helpers (exported for testing) ---

const WORD_TO_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

/**
 * Parses Loop selling plan names into normalized frequency.
 * Known formats from Shopify data:
 *   "Delivery every month " → "1-month"
 *   "Delivery every two months " → "2-month"
 *   "Delivery every 3 months" → "3-month"
 */
export function parseFrequency(sellingPlanName: string): string {
  const normalized = sellingPlanName.trim().toLowerCase();

  // Pattern: "delivery every [N|word] month(s)/week(s)/day(s)"
  const match = normalized.match(/every\s+(\w+)\s+(month|week|day)s?/);
  if (match) {
    const rawCount = match[1];
    const unit = match[2];
    const count = WORD_TO_NUM[rawCount] ?? parseInt(rawCount, 10);
    if (!isNaN(count)) {
      return `${count}-${unit}`;
    }
  }

  // Pattern: "delivery every month" (no count = 1)
  const simpleMatch = normalized.match(/every\s+(month|week|day)s?\b/);
  if (simpleMatch) {
    return `1-${simpleMatch[1]}`;
  }

  // Fallback: log and default to 1-month
  console.warn(`[sync-shopify-subs] unparseable selling plan name: "${sellingPlanName}" → defaulting to 1-month`);
  return '1-month';
}

export function calcBillingCycle(firstOrderDate: string, intervalMonths: number): number {
  const msPerMonth = 1000 * 60 * 60 * 24 * 30.4375;
  const monthsSince = (Date.now() - new Date(firstOrderDate).getTime()) / msPerMonth;
  return Math.max(1, Math.floor(monthsSince / intervalMonths) + 1);
}

/** Build a stable dedup key from email + product + selling plan */
export function buildDedupeKey(email: string, productId: string, sellingPlanId: string): string {
  return `${email}::${productId}::${sellingPlanId}`;
}

// --- Aggregated subscription from orders ---

interface AggregatedSub {
  email: string;
  shopifyProductId: string;
  sellingPlanId: string;
  sellingPlanName: string;
  frequency: string;
  latestPrice: number; // cents
  firstOrderDate: string;
  latestOrderDate: string;
  orderCount: number;
  title: string;
}

// --- Main export ---

export async function syncShopifySubscriptions(): Promise<{
  synced: number;
  skipped: number;
  errors: number;
}> {
  const { url, headers } = shopifyGraphQL();
  let cursor: string | null = null;
  const allSubOrders: Array<{ order: GQLOrder; line: GQLLineItem }> = [];

  // Determine lookback: backfill pulls all orders, incremental pulls recent
  const existingCount = await prisma.subscription.count({
    where: { shopifyContractId: { not: null } },
  });
  const isBackfill = existingCount === 0;

  // For incremental, look back 35 days to catch monthly subscription renewals
  const queryFilter = isBackfill
    ? undefined
    : `created_at:>='${new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()}'`;

  console.log(`[sync-shopify-subs] starting ${isBackfill ? 'BACKFILL' : 'incremental'}`);

  // 1. Fetch all orders, collect those with selling plans
  do {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: ORDERS_QUERY,
        variables: { first: 50, after: cursor ?? undefined, query: queryFilter ?? undefined },
      }),
    });

    if (!res.ok) throw new Error(`Shopify GraphQL HTTP error ${res.status}`);

    const json = await res.json() as GQLResponse;

    if (json.errors?.length) {
      throw new Error(`Shopify GraphQL error: ${json.errors[0].message}`);
    }

    const page = json.data!.orders;
    const available = json.extensions?.cost?.throttleStatus?.currentlyAvailable ?? 1000;
    if (available < 100) {
      console.log(`[sync-shopify-subs] throttle: ${available} points remaining, sleeping 2s`);
      await new Promise(r => setTimeout(r, 2000));
    }

    for (const { node: order } of page.edges) {
      if (!order.customer?.email) continue;
      for (const { node: line } of order.lineItems.edges) {
        if (line.sellingPlan && line.product?.id) {
          allSubOrders.push({ order, line });
        }
      }
    }

    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (cursor);

  console.log(`[sync-shopify-subs] found ${allSubOrders.length} order line items with selling plans`);

  if (allSubOrders.length === 0) {
    console.log('[sync-shopify-subs] no subscription orders found');
    return { synced: 0, skipped: 0, errors: 0 };
  }

  // 2. Aggregate by customer+product+sellingPlan → one subscription per combo
  const subMap = new Map<string, AggregatedSub>();

  for (const { order, line } of allSubOrders) {
    const email = order.customer!.email;
    const productId = line.product!.id.replace('gid://shopify/Product/', '');
    const sellingPlanId = line.sellingPlan!.sellingPlanId;
    const key = buildDedupeKey(email, productId, sellingPlanId);

    const existing = subMap.get(key);
    const price = Math.round(parseFloat(line.originalUnitPriceSet.shopMoney.amount) * 100);

    if (!existing) {
      subMap.set(key, {
        email,
        shopifyProductId: productId,
        sellingPlanId,
        sellingPlanName: line.sellingPlan!.name,
        frequency: parseFrequency(line.sellingPlan!.name),
        latestPrice: price,
        firstOrderDate: order.createdAt,
        latestOrderDate: order.createdAt,
        orderCount: 1,
        title: line.title,
      });
    } else {
      existing.orderCount++;
      // Track earliest and latest order dates
      if (order.createdAt < existing.firstOrderDate) {
        existing.firstOrderDate = order.createdAt;
      }
      if (order.createdAt > existing.latestOrderDate) {
        existing.latestOrderDate = order.createdAt;
        existing.latestPrice = price; // use most recent price
      }
    }
  }

  console.log(`[sync-shopify-subs] aggregated ${subMap.size} unique subscriptions`);

  // 3. Batch upsert into DB
  return processSubscriptions([...subMap.values()], isBackfill);
}

// --- DB processor ---

async function processSubscriptions(
  subs: AggregatedSub[],
  isBackfill: boolean,
): Promise<{ synced: number; skipped: number; errors: number }> {
  // 1. Batch-upsert customers
  const emails = [...new Set(subs.map(s => s.email))];
  await prisma.$transaction(
    emails.map(email => prisma.customer.upsert({ where: { email }, update: {}, create: { email } })),
  );

  // 2. Load lookups in parallel
  const shopifyProductIds = [...new Set(subs.map(s => s.shopifyProductId))];
  // Use sellingPlanId as the shopifyContractId for dedup (repurposing the unique field)
  const dedupKeys = subs.map(s => buildDedupeKey(s.email, s.shopifyProductId, s.sellingPlanId));

  const [customers, existingSubs, productMaps] = await Promise.all([
    prisma.customer.findMany({ where: { email: { in: emails } }, select: { id: true, email: true } }),
    prisma.subscription.findMany({
      where: { shopifyContractId: { in: dedupKeys } },
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

  // 3. Build upserts + events
  type PendingEvent = {
    dedupKey: string;
    eventType: SubscriptionEventType;
    occurredAt: Date;
  };
  const pendingEvents: PendingEvent[] = [];

  const intervalFromFreq = (freq: string): number => {
    const match = freq.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  };

  const upserts = subs.map(sub => {
    const customerId = customerMap.get(sub.email)!;
    const productMapId = productMapLookup.get(sub.shopifyProductId) ?? null;
    const dedupKey = buildDedupeKey(sub.email, sub.shopifyProductId, sub.sellingPlanId);
    const existing = existingMap.get(dedupKey);
    const isNew = !existing;

    if (isNew) {
      pendingEvents.push({
        dedupKey,
        eventType: 'CREATED',
        occurredAt: new Date(sub.firstOrderDate),
      });
    }

    const fields = {
      customerId,
      status: 'ACTIVE' as const, // orders with selling plans are active subscriptions
      shopifyContractId: dedupKey,
      sellingPlanName: sub.sellingPlanName.trim(),
      recurringPrice: sub.latestPrice,
      frequency: sub.frequency,
      currentBillingCycle: sub.orderCount,
      startedAt: new Date(sub.firstOrderDate),
      nextBillDate: null as Date | null, // not available from orders
      ...(productMapId ? { productMapId } : {}),
    };

    return prisma.subscription.upsert({
      where: { shopifyContractId: dedupKey },
      update: fields,
      create: fields,
    });
  });

  // 4. Execute batch upsert
  try {
    await prisma.$transaction(upserts);
  } catch (err) {
    console.error('[sync-shopify-subs] transaction error:', err instanceof Error ? err.message : err);
    return { synced: 0, skipped: 0, errors: subs.length };
  }

  // 5. Emit CREATED events for new subscriptions
  if (pendingEvents.length > 0) {
    const updatedSubs = await prisma.subscription.findMany({
      where: { shopifyContractId: { in: pendingEvents.map(e => e.dedupKey) } },
      select: { id: true, shopifyContractId: true },
    });
    const subIdMap = new Map(updatedSubs.map(s => [s.shopifyContractId!, s.id]));

    await prisma.subscriptionEvent.createMany({
      data: pendingEvents.map(e => ({
        subscriptionId: subIdMap.get(e.dedupKey)!,
        eventType: e.eventType,
        fromStatus: undefined,
        toStatus: 'ACTIVE' as const,
        occurredAt: e.occurredAt,
      })),
      skipDuplicates: true,
    });
  }

  console.log(`[sync-shopify-subs] done: synced=${subs.length} (${pendingEvents.length} new)`);
  return { synced: subs.length, skipped: 0, errors: 0 };
}
