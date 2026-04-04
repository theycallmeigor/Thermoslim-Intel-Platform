export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Funnel Performance — ThermoSlim' };

import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, parseRange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { FunnelCard, type FunnelData, type FunnelPageData } from './FunnelCard';

export default async function FunnelPerformancePage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate } = parseRange(sp.from, sp.to);

  // Get orders with items including productSlot for page mapping
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

  // Get upsell paths for overall take rates
  const upsellPaths = await prisma.upsellPath.findMany({
    where: {
      order: {
        createdAt: { gte: startDate, lte: endDate },
        source: { in: ['SHOPIFY', 'MERGED'] },
        status: 'COMPLETE',
      },
    },
    select: { upsellsAccepted: true, upsellsDeclined: true, revenueAdded: true },
  });

  const totalUpsellAccepted = upsellPaths.reduce((s, p) => s + p.upsellsAccepted, 0);
  const totalUpsellDeclined = upsellPaths.reduce((s, p) => s + p.upsellsDeclined, 0);
  const totalUpsellOffered = totalUpsellAccepted + totalUpsellDeclined;
  const overallTakeRate = totalUpsellOffered > 0 ? totalUpsellAccepted / totalUpsellOffered : 0;

  // Load funnel page titles from DB (set by funnel-sync)
  const funnelPages = await prisma.funnelPage.findMany({
    select: { funnelId: true, ccPageId: true, title: true, pageType: true, sortOrder: true,
      funnel: { select: { ccReferenceId: true } } },
    orderBy: { sortOrder: 'asc' },
  });
  // Build lookup: funnelReferenceId → slot → { title, pageType }
  const slotTitleMap = new Map<string, Map<string, { title: string; pageType: string }>>();
  for (const fp of funnelPages) {
    const fid = fp.funnel.ccReferenceId;
    if (!slotTitleMap.has(fid)) slotTitleMap.set(fid, new Map());
    slotTitleMap.get(fid)!.set(fp.ccPageId, { title: fp.title, pageType: fp.pageType ?? 'other' });
  }

  // Group orders by checkout page (salesUrl slug)
  const checkoutGroups = new Map<string, typeof orders>();
  for (const order of orders) {
    const slug = getCheckoutSlug(order.salesUrl);
    if (!checkoutGroups.has(slug)) checkoutGroups.set(slug, []);
    checkoutGroups.get(slug)!.push(order);
  }

  // Build funnel data — each checkout page variant is a "funnel"
  const funnelData: FunnelData[] = [...checkoutGroups.entries()].map(([checkoutSlug, groupOrders]) => {
    const totalOrders = groupOrders.length;
    const totalRevenue = groupOrders.reduce((s, o) => s + o.totalPrice, 0);
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Build pages from productSlot ordering
    // OFFER items = checkout page, UPSALE items grouped by slot = OTO pages
    // Key by ccCampaignProductId for granular offer-level breakdown
    type ProdAgg = { name: string; campaignProductId: string | null; count: number; revenue: number; price: number; frequency: string | null; isSubscription: boolean };
    const checkoutProducts = new Map<string, ProdAgg>();
    const otoSlots = new Map<number, Map<string, ProdAgg>>();
    // Track which orders reached each slot (for true take rate)
    const ordersPerSlot = new Map<number, Set<string>>();
    let ordersWithUpsells = 0;

    for (const order of groupOrders) {
      let hasUpsell = false;
      // Track max slot this order has items in — order reached all slots up to max
      let maxSlot = 0;
      for (const item of order.items) {
        if (item.productType === 'UPSALE' && item.productSlot > maxSlot) {
          maxSlot = item.productSlot;
        }
      }
      // Mark this order as having reached all upsell slots up to maxSlot
      // (customer saw each page even if they declined)
      if (maxSlot > 0) {
        const allSlots = groupOrders.flatMap(o => o.items.filter(i => i.productType === 'UPSALE').map(i => i.productSlot));
        const uniqueSlots = [...new Set(allSlots)].sort((a, b) => a - b);
        for (const slot of uniqueSlots) {
          if (slot <= maxSlot) {
            if (!ordersPerSlot.has(slot)) ordersPerSlot.set(slot, new Set());
            ordersPerSlot.get(slot)!.add(order.id);
          }
        }
      }

      for (const item of order.items) {
        const freq = item.productMap?.frequency ?? null;
        const isSub = item.productMap?.isSubscription ?? false;

        if (item.productType === 'OFFER' || !item.productType) {
          const prodName = item.productMap?.productLine ?? item.name ?? 'Unknown';
          const existing = checkoutProducts.get(prodName) ?? { name: prodName, campaignProductId: null, count: 0, revenue: 0, price: item.price, frequency: freq, isSubscription: isSub };
          existing.count += 1;
          existing.revenue += item.price;
          if (freq) existing.frequency = freq;
          if (isSub) existing.isSubscription = true;
          checkoutProducts.set(prodName, existing);
        } else if (item.productType === 'UPSALE') {
          hasUpsell = true;
          const slot = item.productSlot;
          if (!otoSlots.has(slot)) otoSlots.set(slot, new Map());
          const slotProducts = otoSlots.get(slot)!;
          // Key by ccCampaignProductId — each is a unique offer on the page
          const displayName = item.name ?? item.productMap?.productLine ?? 'Unknown';
          const key = item.ccCampaignProductId ?? `${displayName}|${item.price}`;
          const existing = slotProducts.get(key) ?? { name: displayName, campaignProductId: item.ccCampaignProductId, count: 0, revenue: 0, price: item.price, frequency: freq, isSubscription: isSub };
          existing.count += 1;
          existing.revenue += item.price;
          if (freq) existing.frequency = freq;
          if (isSub) existing.isSubscription = true;
          slotProducts.set(key, existing);
        }
      }
      if (hasUpsell) ordersWithUpsells++;
    }

    // Build page array
    const pages: FunnelPageData[] = [];

    // Checkout page
    const checkoutProds = [...checkoutProducts.entries()]
      .map(([name, v]) => ({
        name,
        campaignProductId: v.campaignProductId,
        count: v.count,
        rate: totalOrders > 0 ? v.count / totalOrders : 0,
        prices: [v.price],
        frequency: v.frequency,
        isSubscription: v.isSubscription,
      }))
      .sort((a, b) => b.count - a.count);

    pages.push({
      pageType: 'Checkout',
      slug: checkoutSlug,
      orders: totalOrders,
      revenue: groupOrders.reduce((s, o) => {
        const offerRev = o.items.filter(i => i.productType === 'OFFER' || !i.productType).reduce((s2, i) => s2 + i.price, 0);
        return s + offerRev;
      }, 0),
      products: checkoutProds,
    });

    // OTO pages — sorted by slot number
    const sortedSlots = [...otoSlots.entries()].sort((a, b) => a[0] - b[0]);
    let otoNum = 1;
    for (const [slot, slotProducts] of sortedSlots) {
      const pageVisitors = ordersPerSlot.get(slot)?.size ?? totalOrders;

      // Each offer is a distinct campaignProductId
      const prods = [...slotProducts.values()]
        .map(v => ({
          name: v.name,
          campaignProductId: v.campaignProductId,
          count: v.count,
          rate: pageVisitors > 0 ? v.count / pageVisitors : 0,
          prices: [v.price],
          frequency: v.frequency,
          isSubscription: v.isSubscription,
        }))
        .sort((a, b) => b.count - a.count);

      const slotRevenue = [...slotProducts.values()].reduce((s, v) => s + v.revenue, 0);
      const slotAccepted = [...slotProducts.values()].reduce((s, v) => s + v.count, 0);

      // Use funnel page title from DB if available, else generate from slot
      const fid = groupOrders[0]?.funnelReferenceId;
      const dbPageInfo = fid ? slotTitleMap.get(fid)?.get(`slot-${slot}`) : null;
      const dominantName = prods[0]?.name?.toLowerCase() ?? '';
      const isDownsell = dbPageInfo?.pageType === 'downsell' || dominantName.includes('downsell');
      const pageLabel = dbPageInfo?.title ?? (isDownsell ? `Downsell ${otoNum}` : `OTO ${otoNum}`);

      pages.push({
        pageType: pageLabel,
        slug: `${pageVisitors} visitors → ${slotAccepted} accepted`,
        orders: slotAccepted,
        revenue: slotRevenue,
        products: prods,
      });

      if (!isDownsell) otoNum++;
    }

    const displayName = checkoutSlug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    return {
      name: displayName,
      ccReferenceId: groupOrders[0]?.funnelReferenceId ?? null,
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
            <p className="text-gray-600 text-sm">No funnel data found. Check date range or run a sync.</p>
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
    // Get the last meaningful path segment (the checkout page name)
    const parts = url.pathname.split('/').filter(Boolean);
    // Skip UUID-like segments, take the last human-readable slug
    const slug = parts.filter(p => !p.match(/^[0-9a-f]{8}-/i)).pop() ?? parts.pop() ?? 'unknown';
    return slug;
  } catch {
    return 'unknown';
  }
}
