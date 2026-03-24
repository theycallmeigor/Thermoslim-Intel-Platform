/**
 * Sub-daily snapshot generation
 *
 * Queries raw Order.createdAt timestamps and groups them into time windows
 * (15min, 1h, 4h, 6h) to create SnapshotRow-compatible data for the detector.
 */

import type { SnapshotRow, Timeframe } from './types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface OrderForSnapshot {
  createdAt: Date;
  campaignId: string | null;
  campaignName: string | null;
  salesUrl: string | null;
  funnelReferenceId: string | null;
  orderTotal: number;
  ccOrderType: string | null;
  source: string;
  items: Array<{
    price: number;
    quantity: number;
    recurringStatus: string | null;
  }>;
}

// ── Time window helpers ────────────────────────────────────────────────────────

const WINDOW_MINUTES: Record<string, number> = {
  '15min': 15,
  '1h': 60,
  '4h': 240,
  '6h': 360,
};

function getWindowStart(date: Date, windowMinutes: number): Date {
  const ms = date.getTime();
  const windowMs = windowMinutes * 60 * 1000;
  const aligned = Math.floor(ms / windowMs) * windowMs;
  return new Date(aligned);
}

function getWindowKey(date: Date, windowMinutes: number): string {
  const start = getWindowStart(date, windowMinutes);
  return start.toISOString();
}

// ── Derive channel from order ──────────────────────────────────────────────────

function deriveChannel(order: OrderForSnapshot): string {
  if (order.source === 'SHOPIFY') {
    if (order.ccOrderType === 'REBILL') return 'cc_recurring';
    return 'direct';
  }
  // CC orders
  if (order.ccOrderType === 'REBILL') return 'cc_recurring';
  const hasRecurring = order.items.some((i) => i.recurringStatus && i.recurringStatus !== 'TRIAL');
  if (hasRecurring) return 'cc_new_sub';
  return 'cc_onetime';
}

// ── Main: build sub-daily snapshots ────────────────────────────────────────────

interface WindowBucket {
  totalOrders: number;
  totalRevenue: number;
  newOrders: number;
  recurringOrders: number;
  newSubscribers: number;
  cancelledSubscribers: number;
  refunds: number;
  totalOrderValue: number;
}

function emptyBucket(): WindowBucket {
  return {
    totalOrders: 0, totalRevenue: 0, newOrders: 0, recurringOrders: 0,
    newSubscribers: 0, cancelledSubscribers: 0, refunds: 0, totalOrderValue: 0,
  };
}

export function buildSubdailySnapshots(
  orders: OrderForSnapshot[],
  timeframe: Timeframe,
): SnapshotRow[] {
  const windowMinutes = WINDOW_MINUTES[timeframe];
  if (!windowMinutes) {
    throw new Error(`Timeframe ${timeframe} is not a sub-daily timeframe`);
  }

  // Group by (windowKey, campaignId, channel, funnelId)
  const buckets = new Map<string, {
    windowStart: Date;
    campaignId: string | null;
    campaignName: string | null;
    channel: string | null;
    funnelId: string | null;
    productLine: string | null;
    bucket: WindowBucket;
  }>();

  for (const order of orders) {
    const windowKey = getWindowKey(order.createdAt, windowMinutes);
    const channel = deriveChannel(order);
    const funnelId = order.funnelReferenceId ?? null;
    const isRecurring = order.ccOrderType === 'REBILL';

    // Overall bucket (no dimension)
    const overallKey = `${windowKey}||||||`;
    if (!buckets.has(overallKey)) {
      buckets.set(overallKey, {
        windowStart: new Date(windowKey),
        campaignId: null, campaignName: null, channel: null, funnelId: null, productLine: null,
        bucket: emptyBucket(),
      });
    }
    const overall = buckets.get(overallKey)!.bucket;
    overall.totalOrders++;
    overall.totalRevenue += order.orderTotal;
    overall.totalOrderValue += order.orderTotal;
    if (isRecurring) overall.recurringOrders++;
    else overall.newOrders++;

    // Per-channel bucket
    const channelKey = `${windowKey}|||${channel}||`;
    if (!buckets.has(channelKey)) {
      buckets.set(channelKey, {
        windowStart: new Date(windowKey),
        campaignId: null, campaignName: null, channel, funnelId: null, productLine: null,
        bucket: emptyBucket(),
      });
    }
    const channelBucket = buckets.get(channelKey)!.bucket;
    channelBucket.totalOrders++;
    channelBucket.totalRevenue += order.orderTotal;
    channelBucket.totalOrderValue += order.orderTotal;
    if (isRecurring) channelBucket.recurringOrders++;
    else channelBucket.newOrders++;

    // Per-campaign bucket
    if (order.campaignId) {
      const campKey = `${windowKey}|${order.campaignId}||||`;
      if (!buckets.has(campKey)) {
        buckets.set(campKey, {
          windowStart: new Date(windowKey),
          campaignId: order.campaignId, campaignName: order.campaignName,
          channel: null, funnelId: null, productLine: null,
          bucket: emptyBucket(),
        });
      }
      const campBucket = buckets.get(campKey)!.bucket;
      campBucket.totalOrders++;
      campBucket.totalRevenue += order.orderTotal;
      campBucket.totalOrderValue += order.orderTotal;
      if (isRecurring) campBucket.recurringOrders++;
      else campBucket.newOrders++;
    }

    // Per-funnel bucket
    if (funnelId) {
      const funnelKey = `${windowKey}||||${funnelId}|`;
      if (!buckets.has(funnelKey)) {
        buckets.set(funnelKey, {
          windowStart: new Date(windowKey),
          campaignId: null, campaignName: null, channel: null, funnelId, productLine: null,
          bucket: emptyBucket(),
        });
      }
      const funnelBucket = buckets.get(funnelKey)!.bucket;
      funnelBucket.totalOrders++;
      funnelBucket.totalRevenue += order.orderTotal;
      funnelBucket.totalOrderValue += order.orderTotal;
      if (isRecurring) funnelBucket.recurringOrders++;
      else funnelBucket.newOrders++;
    }
  }

  // Convert to SnapshotRow[]
  const rows: SnapshotRow[] = [];
  for (const entry of buckets.values()) {
    const b = entry.bucket;
    rows.push({
      date: entry.windowStart,
      campaignId: entry.campaignId,
      campaignName: entry.campaignName,
      productLine: entry.productLine,
      channel: entry.channel,
      funnelId: entry.funnelId,
      totalOrders: b.totalOrders,
      totalRevenue: b.totalRevenue,
      newOrders: b.newOrders,
      recurringOrders: b.recurringOrders,
      newSubscribers: b.newSubscribers,
      cancelledSubscribers: b.cancelledSubscribers,
      refunds: b.refunds,
      avgOrderValue: b.totalOrders > 0 ? Math.round(b.totalOrderValue / b.totalOrders) : 0,
    });
  }

  return rows.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ── Load orders from DB ────────────────────────────────────────────────────────

export async function loadOrdersForSubdaily(startDate?: Date): Promise<OrderForSnapshot[]> {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();
  try {
    const where = startDate ? { createdAt: { gte: startDate } } : {};
    const orders = await db.order.findMany({
      where,
      select: {
        createdAt: true,
        campaignId: true,
        campaignName: true,
        salesUrl: true,
        funnelReferenceId: true,
        orderTotal: true,
        ccOrderType: true,
        source: true,
        items: {
          select: {
            price: true,
            quantity: true,
            recurringStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return orders as OrderForSnapshot[];
  } finally {
    await db.$disconnect();
  }
}
