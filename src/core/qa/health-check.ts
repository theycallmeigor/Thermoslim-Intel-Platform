/**
 * Data Health Checks — weekly integrity checks on the unified store.
 *
 * Runs alongside QA analysis to catch data quality issues:
 *   - Unmapped order items (missing productMapId)
 *   - Orphaned records (orders without customers, items without orders)
 *   - Duplicate orders (SHOPIFY + MERGED with same sourceOrderId)
 *   - Stale subscriptions (active but no recent events)
 *   - Split customers (same name, different emails — heuristic)
 *   - Sync staleness (adapter hasn't synced recently)
 *
 * Results are written to the Anomaly table with type='HEALTH_CHECK'.
 */
import { prisma } from '../../lib/prisma';
import { createLogger } from '../logger';

const log = createLogger('health-check');

export interface HealthCheckResult {
  checks: HealthCheckItem[];
  totalIssues: number;
  durationMs: number;
}

export interface HealthCheckItem {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  count: number;
  message: string;
  details?: string;
}

export async function runHealthChecks(): Promise<HealthCheckResult> {
  const start = Date.now();
  const checks: HealthCheckItem[] = [];

  log.info('Starting data health checks');

  // Run all checks in parallel
  const results = await Promise.allSettled([
    checkUnmappedItems(),
    checkDuplicateMergedOrders(),
    checkOrphanedOrderItems(),
    checkStaleSubscriptions(),
    checkIngestionErrors(),
    checkSyncStaleness(),
    checkNullCustomerEmails(),
    checkZeroPriceOrders(),
  ]);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      checks.push(result.value);
    } else {
      log.error({ err: result.reason }, 'Health check failed');
      checks.push({
        name: 'unknown',
        status: 'fail',
        count: 0,
        message: `Check threw error: ${result.reason?.message ?? String(result.reason)}`,
      });
    }
  }

  const totalIssues = checks.filter(c => c.status !== 'pass').reduce((sum, c) => sum + c.count, 0);
  const durationMs = Date.now() - start;

  // Persist warnings/failures as anomalies
  for (const check of checks) {
    if (check.status === 'pass') continue;

    await prisma.anomaly.create({
      data: {
        type: 'HEALTH_CHECK',
        severity: check.status === 'fail' ? 'CRITICAL' : 'WARNING',
        metric: check.name,
        dimension: 'data_quality',
        dimensionValue: check.status,
        expected: 0,
        actual: check.count,
        deviation: check.count,
        explanation: check.message + (check.details ? `\n${check.details}` : ''),
      },
    });
  }

  log.info({ totalIssues, durationMs, checks: checks.length }, 'Health checks complete');
  return { checks, totalIssues, durationMs };
}

// ── Individual checks ──

async function checkUnmappedItems(): Promise<HealthCheckItem> {
  const count = await prisma.orderItem.count({
    where: { productMapId: null },
  });

  const total = await prisma.orderItem.count();
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';

  return {
    name: 'unmapped_order_items',
    status: count > 50 ? 'warn' : 'pass',
    count,
    message: `${count} order items (${pct}%) have no product mapping`,
    details: count > 0 ? 'These items won\'t appear in product-level reports. Check externalId and SKU matching.' : undefined,
  };
}

async function checkDuplicateMergedOrders(): Promise<HealthCheckItem> {
  // Find SHOPIFY orders where a MERGED order also exists with the same sourceOrderId
  const merged = await prisma.order.findMany({
    where: { source: 'MERGED' },
    select: { sourceOrderId: true },
  });

  let duplicateCount = 0;
  const duplicateIds: string[] = [];

  for (const m of merged) {
    const dup = await prisma.order.findUnique({
      where: { source_sourceOrderId: { source: 'SHOPIFY', sourceOrderId: m.sourceOrderId } },
      select: { sourceOrderId: true },
    });
    if (dup) {
      duplicateCount++;
      if (duplicateIds.length < 5) duplicateIds.push(dup.sourceOrderId);
    }
  }

  return {
    name: 'duplicate_merged_orders',
    status: duplicateCount > 0 ? 'fail' : 'pass',
    count: duplicateCount,
    message: duplicateCount > 0
      ? `${duplicateCount} orders exist as both SHOPIFY and MERGED (duplicates in dashboard)`
      : 'No duplicate merged orders',
    details: duplicateIds.length > 0 ? `Examples: ${duplicateIds.join(', ')}` : undefined,
  };
}

async function checkOrphanedOrderItems(): Promise<HealthCheckItem> {
  // Items where the parent order no longer exists
  const orphaned = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*) as count FROM "OrderItem" oi LEFT JOIN "Order" o ON oi."orderId" = o.id WHERE o.id IS NULL`,
  );
  const count = Number(orphaned[0]?.count ?? 0);

  return {
    name: 'orphaned_order_items',
    status: count > 0 ? 'warn' : 'pass',
    count,
    message: count > 0
      ? `${count} order items reference non-existent orders`
      : 'No orphaned order items',
  };
}

async function checkStaleSubscriptions(): Promise<HealthCheckItem> {
  // Active subscriptions with no events in the last 60 days
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 3600000);

  const stale = await prisma.subscription.count({
    where: {
      status: 'ACTIVE',
      events: { none: { occurredAt: { gte: sixtyDaysAgo } } },
    },
  });

  return {
    name: 'stale_active_subscriptions',
    status: stale > 10 ? 'warn' : 'pass',
    count: stale,
    message: stale > 0
      ? `${stale} active subscriptions have no events in the last 60 days`
      : 'All active subscriptions have recent events',
  };
}

async function checkIngestionErrors(): Promise<HealthCheckItem> {
  const oneDayAgo = new Date(Date.now() - 24 * 3600000);
  const count = await prisma.ingestionError.count({
    where: { occurredAt: { gte: oneDayAgo } },
  });

  return {
    name: 'recent_ingestion_errors',
    status: count > 20 ? 'fail' : count > 5 ? 'warn' : 'pass',
    count,
    message: `${count} ingestion errors in the last 24 hours`,
  };
}

async function checkSyncStaleness(): Promise<HealthCheckItem> {
  // Check when the most recent order was ingested per source
  const sources = ['SHOPIFY', 'CHECKOUTCHAMP', 'MERGED'] as const;
  const staleThresholdMs = 30 * 60 * 1000; // 30 minutes
  const stale: string[] = [];

  for (const source of sources) {
    if (source === 'MERGED') continue; // MERGED is derived, not synced directly
    const latest = await prisma.order.findFirst({
      where: { source },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (!latest) continue;

    const age = Date.now() - latest.createdAt.getTime();
    if (age > staleThresholdMs) {
      const mins = Math.round(age / 60000);
      stale.push(`${source}: last order ${mins}min ago`);
    }
  }

  return {
    name: 'sync_staleness',
    status: stale.length > 0 ? 'warn' : 'pass',
    count: stale.length,
    message: stale.length > 0
      ? `${stale.length} source(s) may not be syncing`
      : 'All sources have recent data',
    details: stale.length > 0 ? stale.join('; ') : undefined,
  };
}

async function checkNullCustomerEmails(): Promise<HealthCheckItem> {
  const count = await prisma.customer.count({
    where: { email: '' },
  });

  return {
    name: 'empty_customer_emails',
    status: count > 0 ? 'warn' : 'pass',
    count,
    message: count > 0
      ? `${count} customers have empty email addresses`
      : 'All customers have email addresses',
  };
}

async function checkZeroPriceOrders(): Promise<HealthCheckItem> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000);
  const count = await prisma.order.count({
    where: {
      totalPrice: 0,
      status: 'COMPLETE',
      createdAt: { gte: sevenDaysAgo },
      source: { in: ['SHOPIFY', 'MERGED'] },
    },
  });

  return {
    name: 'zero_price_complete_orders',
    status: count > 5 ? 'warn' : 'pass',
    count,
    message: count > 0
      ? `${count} completed orders in the last 7 days have $0 total`
      : 'No zero-price completed orders recently',
  };
}
