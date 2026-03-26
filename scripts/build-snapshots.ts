import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

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

function parseArgs(): { from: Date; to: Date } {
  const args = process.argv.slice(2);
  const today = startOfDayUTC(new Date());

  if (args.includes('--today')) {
    return { from: today, to: addDays(today, 1) };
  }

  const fromArg = args.find((a) => a.startsWith('--from='));
  const from = fromArg
    ? startOfDayUTC(new Date(fromArg.split('=')[1]))
    : addDays(today, -90);

  return { from, to: addDays(today, 1) };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  const { from, to } = parseArgs();
  console.log(
    `📊 Building snapshots from ${from.toISOString().slice(0, 10)} to ${addDays(to, -1).toISOString().slice(0, 10)}`
  );

  let totalUpserted = 0;
  let daysProcessed = 0;

  try {
    let cursor = new Date(from);

    while (cursor < to) {
      const dayStart = cursor;
      const dayEnd = addDays(dayStart, 1);
      const dateKey = startOfDayUTC(dayStart);

      // ----- Fetch orders for the day with their items + product map -----
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
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
        const isRecurring = order.ccOrderType === 'REBILL';
        const isRefunded = order.status === 'REFUNDED';

        // Determine product-level dimensions from order items
        const itemDimensions = order.items.length > 0
          ? order.items.map((item) => ({
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

        for (const dim of uniqueDims.values()) {
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

          bucket.totalOrders += 1;

          // Only count SHOPIFY revenue to avoid double-counting
          if (order.source === 'SHOPIFY' || order.source === 'MERGED') {
            bucket.totalRevenue += order.totalPrice;
            if (isRecurring) {
              bucket.recurringRevenue += order.totalPrice;
            } else {
              bucket.checkoutRevenue += order.totalPrice;
            }
          }

          if (isRefunded) bucket.refunds += 1;
          if (isRecurring) {
            bucket.recurringOrders += 1;
          } else {
            bucket.newOrders += 1;
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

        // Use empty string for nullable unique constraint fields
        const sourceEnum = b.source === 'CHECKOUTCHAMP' ? 'CHECKOUTCHAMP' : 'SHOPIFY';

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
      if (daysProcessed % 10 === 0) {
        console.log(
          `  📅 Processed ${daysProcessed} days (through ${dayStart.toISOString().slice(0, 10)}), ${totalUpserted} snapshots so far`
        );
      }

      cursor = dayEnd;
    }

    console.log(
      `\n✅ Done — ${daysProcessed} days processed, ${totalUpserted} snapshots created/updated`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
