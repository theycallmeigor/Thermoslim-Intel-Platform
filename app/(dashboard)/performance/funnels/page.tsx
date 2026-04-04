export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Funnel Performance — ThermoSlim' };

import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, parseRange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { FunnelCard, type FunnelData, type FunnelPageData } from './FunnelCard';
import { FUNNEL_CONFIGS, findFunnelConfig, type FunnelPageConfig } from '@/config/funnel-config';

export default async function FunnelPerformancePage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate } = parseRange(sp.from, sp.to);

  // Get orders with items
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      source: { in: ['SHOPIFY', 'MERGED'] },
      status: 'COMPLETE',
      salesUrl: { not: null },
    },
    select: {
      id: true, totalPrice: true, salesUrl: true,
      funnelReferenceId: true, campaignName: true,
      items: {
        select: {
          productSlot: true, name: true, price: true, quantity: true,
          productType: true, ccCrmId: true, ccCampaignProductId: true,
          productMap: { select: { name: true, productLine: true, frequency: true, isSubscription: true } },
        },
        orderBy: { productSlot: 'asc' },
      },
    },
  });

  // Calculate take rate from order items (UpsellPath table is empty)
  // Take rate = orders with at least 1 UPSALE item / total orders
  let ordersWithUpsell = 0;
  let totalUpsaleItems = 0;
  for (const order of orders) {
    const upsaleCount = order.items.filter(i => i.productType === 'UPSALE').length;
    if (upsaleCount > 0) ordersWithUpsell++;
    totalUpsaleItems += upsaleCount;
  }
  const overallTakeRate = orders.length > 0 ? ordersWithUpsell / orders.length : 0;

  // Group orders by funnel (using config or checkout slug)
  type OrderGroup = { config: typeof FUNNEL_CONFIGS[0] | null; orders: typeof orders; checkoutSlug: string };
  const funnelGroups = new Map<string, OrderGroup>();

  for (const order of orders) {
    const slug = getCheckoutSlug(order.salesUrl);
    const config = findFunnelConfig(order.funnelReferenceId, slug);
    const groupKey = config?.referenceId ?? slug;

    if (!funnelGroups.has(groupKey)) {
      funnelGroups.set(groupKey, { config, orders: [], checkoutSlug: slug });
    }
    funnelGroups.get(groupKey)!.orders.push(order);
  }

  // Build funnel data
  const funnelData: FunnelData[] = [...funnelGroups.entries()].map(([key, group]) => {
    const { config, orders: groupOrders, checkoutSlug } = group;
    const totalOrders = groupOrders.length;
    const totalRevenue = groupOrders.reduce((s, o) => s + o.totalPrice, 0);
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const pages: FunnelPageData[] = [];

    if (config) {
      // ─── CONFIG-BASED: match UPSALE items to configured pages by ccCrmId ───
      const configPages = config.pages;

      for (const pageConfig of configPages) {
        const crmIdSet = new Set(pageConfig.productCrmIds);

        if (pageConfig.type === 'checkout') {
          // Checkout: count all orders, show OFFER items
          const offerProducts = new Map<string, { name: string; count: number; revenue: number; price: number; frequency: string | null; isSubscription: boolean }>();
          for (const order of groupOrders) {
            for (const item of order.items) {
              if (item.productType !== 'OFFER' && item.productType !== null) continue;
              const prodLine = item.productMap?.productLine ?? item.name ?? 'Unknown';
              const prodKey = `${prodLine}|${item.price}`;
              const existing = offerProducts.get(prodKey) ?? { name: prodLine, count: 0, revenue: 0, price: item.price, frequency: item.productMap?.frequency ?? null, isSubscription: item.productMap?.isSubscription ?? false };
              existing.count++;
              existing.revenue += item.price;
              offerProducts.set(prodKey, existing);
            }
          }

          pages.push({
            pageType: pageConfig.name,
            slug: checkoutSlug,
            orders: totalOrders,
            revenue: [...offerProducts.values()].reduce((s, v) => s + v.revenue, 0),
            products: [...offerProducts.values()]
              .map(v => ({ name: v.name, campaignProductId: null, count: v.count, rate: totalOrders > 0 ? v.count / totalOrders : 0, prices: [v.price], frequency: v.frequency, isSubscription: v.isSubscription }))
              .sort((a, b) => b.count - a.count),
          });
        } else {
          // OTO/Downsell: match UPSALE items by ccCrmId
          let pageAccepted = 0;
          let pageRevenue = 0;
          let ordersReached = 0;
          const products = new Map<string, { name: string; crmId: string | null; count: number; revenue: number; prices: Set<number>; frequency: string | null; isSubscription: boolean }>();

          for (const order of groupOrders) {
            const upsaleItems = order.items.filter(i => i.productType === 'UPSALE');
            if (upsaleItems.length === 0) continue;

            // Did this order have any UPSALE item that could match this page or a later page?
            // An order "reached" this page if it has upsale items matching this page OR any later page
            const thisPageIdx = configPages.indexOf(pageConfig);
            const laterPages = configPages.slice(thisPageIdx);
            const laterCrmIds = new Set(laterPages.flatMap(p => p.productCrmIds));

            const hasLaterMatch = upsaleItems.some(i => i.ccCrmId && laterCrmIds.has(i.ccCrmId));
            const hasThisMatch = upsaleItems.some(i => i.ccCrmId && crmIdSet.has(i.ccCrmId));

            if (hasThisMatch || hasLaterMatch) ordersReached++;

            // Count items matching this page
            for (const item of upsaleItems) {
              if (!item.ccCrmId || !crmIdSet.has(item.ccCrmId)) continue;
              pageAccepted++;
              pageRevenue += item.price;

              const prodLine = item.productMap?.productLine ?? 'Unknown';
              const freq = item.productMap?.frequency ?? null;
              // Group by ccCrmId — each CC product is a distinct offer
              const key = item.ccCrmId ?? `${prodLine}|${item.price}`;
              const existing = products.get(key) ?? { name: freq ? `${prodLine} (${freq})` : prodLine, crmId: item.ccCrmId, count: 0, revenue: 0, prices: new Set(), frequency: freq, isSubscription: item.productMap?.isSubscription ?? false };
              existing.count++;
              existing.revenue += item.price;
              existing.prices.add(item.price);
              products.set(key, existing);
            }
          }

          pages.push({
            pageType: pageConfig.name,
            slug: `${ordersReached} reached → ${pageAccepted} accepted`,
            orders: pageAccepted,
            revenue: pageRevenue,
            products: [...products.values()]
              .map(v => ({ name: v.name, campaignProductId: v.crmId, count: v.count, rate: ordersReached > 0 ? v.count / ordersReached : 0, prices: [...v.prices].sort((a, b) => a - b), frequency: v.frequency, isSubscription: v.isSubscription }))
              .sort((a, b) => b.count - a.count),
          });
        }
      }
    } else {
      // ─── FALLBACK: slot-based grouping for unconfigured funnels ────────────
      const slotProducts = new Map<number, Map<string, { name: string; crmId: string | null; count: number; revenue: number; price: number; frequency: string | null; isSubscription: boolean }>>();

      for (const order of groupOrders) {
        for (const item of order.items) {
          if (item.productType !== 'UPSALE') continue;
          const slot = item.productSlot;
          if (!slotProducts.has(slot)) slotProducts.set(slot, new Map());
          const prods = slotProducts.get(slot)!;
          const prodLine = item.productMap?.productLine ?? 'Unknown';
          const key = `${prodLine}|${item.price}`;
          const freq = item.productMap?.frequency ?? null;
          const existing = prods.get(key) ?? { name: freq ? `${prodLine} (${freq})` : prodLine, crmId: item.ccCrmId, count: 0, revenue: 0, price: item.price, frequency: freq, isSubscription: item.productMap?.isSubscription ?? false };
          existing.count++;
          existing.revenue += item.price;
          prods.set(key, existing);
        }
      }

      // Checkout
      pages.push({
        pageType: 'Checkout',
        slug: checkoutSlug,
        orders: totalOrders,
        revenue: totalRevenue,
        products: [{ name: 'Body Sculpting Device', campaignProductId: null, count: totalOrders, rate: 1, prices: [9995], frequency: null, isSubscription: false }],
      });

      // OTO pages from slots
      let otoNum = 1;
      for (const [slot, prods] of [...slotProducts.entries()].sort((a, b) => a[0] - b[0])) {
        pages.push({
          pageType: `OTO ${otoNum}`,
          slug: `slot ${slot}`,
          orders: [...prods.values()].reduce((s, v) => s + v.count, 0),
          revenue: [...prods.values()].reduce((s, v) => s + v.revenue, 0),
          products: [...prods.values()]
            .map(v => ({ name: v.name, campaignProductId: v.crmId, count: v.count, rate: totalOrders > 0 ? v.count / totalOrders : 0, prices: [v.price], frequency: v.frequency, isSubscription: v.isSubscription }))
            .sort((a, b) => b.count - a.count),
        });
        otoNum++;
      }
    }

    return {
      name: config?.name ?? titleCase(checkoutSlug),
      ccReferenceId: config?.referenceId ?? groupOrders[0]?.funnelReferenceId ?? null,
      totalOrders,
      totalRevenue,
      aov,
      pages,
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totalFunnelOrders = orders.length;
  const totalFunnelRevenue = orders.reduce((s, o) => s + o.totalPrice, 0);
  const avgRevPerVisit = totalFunnelOrders > 0 ? Math.round(totalFunnelRevenue / totalFunnelOrders) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Funnel Performance" subtitle="Campaign funnel analytics from CheckoutChamp" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Funnels" value={funnelData.length.toLocaleString()} />
        <KpiCard label="Funnel Orders" value={totalFunnelOrders.toLocaleString()} />
        <KpiCard label="Upsell Take Rate" value={`${(overallTakeRate * 100).toFixed(1)}%`} />
        <KpiCard label="Avg Rev / Visit" value={fmt$(avgRevPerVisit)} />
      </div>

      <div className="space-y-3">
        {funnelData.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-10 text-center">
            <p className="text-gray-600 text-sm">No funnel data found. Check date range.</p>
          </div>
        ) : (
          funnelData.map((funnel, i) => <FunnelCard key={i} funnel={funnel} />)
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCheckoutSlug(salesUrl: string | null): string {
  if (!salesUrl) return 'unknown';
  try {
    const url = new URL(salesUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts.filter(p => !p.match(/^[0-9a-f]{8}-/i)).pop() ?? parts.pop() ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function titleCase(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
