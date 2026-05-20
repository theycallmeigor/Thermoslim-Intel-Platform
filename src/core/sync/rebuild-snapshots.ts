import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classifyChannel(tags: string | null): string {
  if (!tags) return 'direct';
  const hasRecurring = tags.includes('Recurring');
  const hasSubscription = tags.includes('Subscription');
  const hasNewSale = tags.includes('New Sale');
  if (hasRecurring && hasSubscription) return 'cc_recurring';
  if (hasNewSale && hasSubscription) return 'cc_new_sub';
  if (hasNewSale) return 'cc_onetime';
  return 'direct';
}

function deriveFunnelId(salesUrl: string | null): string | null {
  if (!salesUrl) return null;
  try {
    const url = new URL(salesUrl);
    return url.pathname.split('/').filter(Boolean)[0] || null;
  } catch {
    return null;
  }
}

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

// ---------------------------------------------------------------------------
// Core rebuild logic
// ---------------------------------------------------------------------------

export async function rebuildSnapshots(
  from: Date,
  to: Date
): Promise<{ daysProcessed: number; snapshotsUpserted: number }> {
  let totalUpserted = 0;
  let daysProcessed = 0;

  let cursor = new Date(from);

  while (cursor < to) {
    const dayStart = cursor;
    const dayEnd = addDays(dayStart, 1);
    const dateKey = startOfDayUTC(dayStart);

    // ----- Fetch deduplicated, completed orders only -----
    // SHOPIFY + MERGED = single source of truth for revenue.
    // Raw CHECKOUTCHAMP orders are duplicates and carry no unique revenue.
    // Only COMPLETE orders count — PENDING/DECLINED are not realized revenue.
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: dayStart, lt: dayEnd },
        source: { in: ['SHOPIFY', 'MERGED'] },
        status: 'COMPLETE',
      },
      include: {
        items: {
          include: { productMap: { select: { productLine: true, frequency: true } } },
        },
      },
    });

    // ----- Fetch subscriptions created / cancelled that day -----
    const newSubs = await prisma.subscription.findMany({
      where: { startedAt: { gte: dayStart, lt: dayEnd } },
      include: { productMap: { select: { productLine: true, frequency: true } } },
    });
    const cancelledSubs = await prisma.subscription.findMany({
      where: { cancelledAt: { gte: dayStart, lt: dayEnd } },
      include: { productMap: { select: { productLine: true, frequency: true } } },
    });

    // ----- Build aggregation buckets -----
    type Bucket = {
      source: string;
      campaignId: string;
      campaignName: string;
      productLine: string;
      frequency: string;
      channel: string;
      funnelId: string;
      pageUrl: string;
      totalOrders: number;
      totalRevenue: number;
      checkoutRevenue: number;
      recurringRevenue: number;
      refunds: number;
      newOrders: number;
      recurringOrders: number;
      newSubscribers: number;
      cancelledSubscribers: number;
    };

    const buckets = new Map<string, Bucket>();

    function getKey(
      source: string,
      campaignId: string,
      productLine: string,
      frequency: string,
      channel: string,
      funnelId: string,
      pageUrl: string
    ): string {
      return [source, campaignId, productLine, frequency, channel, funnelId, pageUrl].join('|');
    }

    function ensureBucket(
      source: string,
      campaignId: string,
      campaignName: string,
      productLine: string,
      frequency: string,
      channel: string,
      funnelId: string,
      pageUrl: string
    ): Bucket {
      const key = getKey(source, campaignId, productLine, frequency, channel, funnelId, pageUrl);
      let b = buckets.get(key);
      if (!b) {
        b = {
          source,
          campaignId,
          campaignName,
          productLine,
          frequency,
          channel,
          funnelId,
          pageUrl,
          totalOrders: 0,
          totalRevenue: 0,
          checkoutRevenue: 0,
          recurringRevenue: 0,
          refunds: 0,
          newOrders: 0,
          recurringOrders: 0,
          newSubscribers: 0,
          cancelledSubscribers: 0,
        };
        buckets.set(key, b);
      }
      // Keep the most recent non-empty campaignName
      if (campaignName) b.campaignName = campaignName;
      return b;
    }

    for (const order of orders) {
      const channel = classifyChannel(order.tags);
      const funnelId = deriveFunnelId(order.salesUrl) ?? '';
      const pageUrl = order.salesUrl ?? '';
      const campaignId = order.campaignId ?? '';
      const campaignName = order.campaignName ?? '';
      const isRecurring =
        order.ccOrderType === 'REBILL' ||
        order.items.some((i: any) => (i.billingCycleNumber ?? 0) > 1) ||
        (order.tags?.split(',').map((t: string) => t.trim()).includes('Recurring') ?? false);
      const isRefunded = order.status === 'REFUNDED';

      // Determine product-level dimensions from order items
      const itemDimensions = order.items.length > 0
        ? order.items.map((item: any) => ({
            productLine: item.productMap?.productLine ?? '',
            frequency: item.productMap?.frequency ?? '',
          }))
        : [{ productLine: '', frequency: '' }];

      // Deduplicate item dimensions to avoid inflating counts
      const uniqueDims = new Map<string, { productLine: string; frequency: string }>();
      for (const dim of itemDimensions) {
        const dk = `${dim.productLine}|${dim.frequency}`;
        if (!uniqueDims.has(dk)) uniqueDims.set(dk, dim);
      }

      // Use only the FIRST product dimension for order-level metrics
      // to avoid counting one order multiple times across buckets.
      // If an order has items in multiple product lines, the order/revenue
      // goes to the first dimension only.
      const dims = [...uniqueDims.values()];
      for (let i = 0; i < dims.length; i++) {
        const dim = dims[i];
        const bucket = ensureBucket(
          order.source,
          campaignId,
          campaignName,
          dim.productLine,
          dim.frequency,
          channel,
          funnelId,
          pageUrl
        );

        // Only count order + revenue in the first dimension bucket
        if (i === 0) {
          bucket.totalOrders += 1;
          bucket.totalRevenue += order.totalPrice;
          if (isRecurring) {
            bucket.recurringRevenue += order.totalPrice;
            bucket.recurringOrders += 1;
          } else {
            bucket.checkoutRevenue += order.totalPrice;
            bucket.newOrders += 1;
          }
          if (isRefunded) bucket.refunds += 1;
        }
      }
    }

    // ----- Count new subscribers -----
    for (const sub of newSubs) {
      const productLine = sub.productMap?.productLine ?? '';
      const frequency = sub.productMap?.frequency ?? '';
      const campaignId = sub.campaignId ?? '';
      const bucket = ensureBucket('SHOPIFY', campaignId, '', productLine, frequency, '', '', '');
      bucket.newSubscribers += 1;
    }

    // ----- Count cancelled subscribers -----
    for (const sub of cancelledSubs) {
      const productLine = sub.productMap?.productLine ?? '';
      const frequency = sub.productMap?.frequency ?? '';
      const campaignId = sub.campaignId ?? '';
      const bucket = ensureBucket('SHOPIFY', campaignId, '', productLine, frequency, '', '', '');
      bucket.cancelledSubscribers += 1;
    }

    // ----- Upsert each bucket into DailySnapshot -----
    for (const b of buckets.values()) {
      const avgOrderValue =
        b.totalOrders > 0 ? Math.round(b.totalRevenue / b.totalOrders) : 0;

      // All orders are SHOPIFY or MERGED — map MERGED to SHOPIFY for snapshot grouping
      const sourceEnum = b.source === 'MERGED' ? 'SHOPIFY' : b.source;

      await prisma.dailySnapshot.upsert({
        where: {
          date_source_campaignId_productLine_frequency_channel_funnelId_pageUrl: {
            date: dateKey,
            source: sourceEnum as any,
            campaignId: b.campaignId || '',
            productLine: b.productLine || '',
            frequency: b.frequency || '',
            channel: b.channel || '',
            funnelId: b.funnelId || '',
            pageUrl: b.pageUrl || '',
          },
        },
        create: {
          date: dateKey,
          source: sourceEnum as any,
          campaignId: b.campaignId || '',
          campaignName: b.campaignName || null,
          productLine: b.productLine || '',
          frequency: b.frequency || '',
          channel: b.channel || '',
          funnelId: b.funnelId || '',
          pageUrl: b.pageUrl || '',
          totalOrders: b.totalOrders,
          newOrders: b.newOrders,
          recurringOrders: b.recurringOrders,
          totalRevenue: b.totalRevenue,
          checkoutRevenue: b.checkoutRevenue,
          recurringRevenue: b.recurringRevenue,
          refunds: b.refunds,
          newSubscribers: b.newSubscribers,
          cancelledSubscribers: b.cancelledSubscribers,
          avgOrderValue,
        },
        update: {
          campaignName: b.campaignName || null,
          totalOrders: b.totalOrders,
          newOrders: b.newOrders,
          recurringOrders: b.recurringOrders,
          totalRevenue: b.totalRevenue,
          checkoutRevenue: b.checkoutRevenue,
          recurringRevenue: b.recurringRevenue,
          refunds: b.refunds,
          newSubscribers: b.newSubscribers,
          cancelledSubscribers: b.cancelledSubscribers,
          avgOrderValue,
        },
      });

      totalUpserted += 1;
    }

    daysProcessed += 1;
    cursor = dayEnd;
  }

  return { daysProcessed, snapshotsUpserted: totalUpserted };
}
