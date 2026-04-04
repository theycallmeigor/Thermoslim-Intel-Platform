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

  // Get orders with funnel data in date range
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      source: { in: ['SHOPIFY', 'MERGED'] },
      status: 'COMPLETE',
      OR: [
        { funnelReferenceId: { not: null } },
        { salesUrl: { not: null } },
      ],
    },
    select: {
      id: true, totalPrice: true, salesUrl: true,
      funnelReferenceId: true, campaignName: true,
      items: {
        select: {
          name: true, price: true, productType: true,
          productMap: { select: { name: true, productLine: true } },
        },
      },
    },
  });

  // Get upsell paths for take rates
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

  // Load Funnel table for name resolution
  const dbFunnels = await prisma.funnel.findMany({
    include: { pages: { where: { pageType: 'checkout' }, orderBy: { sortOrder: 'asc' }, take: 1 } },
  });
  const funnelNameMap = new Map<string, string>();
  for (const f of dbFunnels) {
    // Use the checkout page slug as the display name (more useful than "Shopify Funnel")
    const checkoutSlug = f.pages[0]?.slug;
    const displayName = checkoutSlug
      ? checkoutSlug.replace(/^\//, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : f.name;
    funnelNameMap.set(f.ccReferenceId, displayName);
  }

  // Group orders by funnel
  const funnelMap = new Map<string, { name: string; ccReferenceId: string | null; orders: typeof orders }>();

  for (const order of orders) {
    const funnelKey = order.funnelReferenceId ?? deriveFunnelKey(order.salesUrl);
    if (!funnelKey) continue;

    if (!funnelMap.has(funnelKey)) {
      const resolvedName = funnelNameMap.get(funnelKey) ?? funnelKey;
      funnelMap.set(funnelKey, {
        name: resolvedName,
        ccReferenceId: order.funnelReferenceId,
        orders: [],
      });
    }
    funnelMap.get(funnelKey)!.orders.push(order);
  }

  // Build funnel data for display
  const funnelData: FunnelData[] = [...funnelMap.entries()].map(([key, group]) => {
    const totalOrders = group.orders.length;
    const totalRevenue = group.orders.reduce((s, o) => s + o.totalPrice, 0);
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Group by page (from salesUrl slug)
    const pageMap = new Map<string, { orders: typeof orders; pageType: string }>();
    for (const order of group.orders) {
      const slug = getPageSlug(order.salesUrl);
      const pageType = inferPageType(slug);
      if (!pageMap.has(slug)) pageMap.set(slug, { orders: [], pageType });
      pageMap.get(slug)!.orders.push(order);
    }

    const pages: FunnelPageData[] = [...pageMap.entries()].map(([slug, pageGroup]) => {
      const pageOrders = pageGroup.orders.length;
      const pageRevenue = pageGroup.orders.reduce((s, o) => s + o.totalPrice, 0);

      // Product breakdown
      const productCounts = new Map<string, number>();
      for (const order of pageGroup.orders) {
        for (const item of order.items) {
          const prodName = item.productMap?.productLine ?? item.name ?? 'Unknown';
          productCounts.set(prodName, (productCounts.get(prodName) ?? 0) + 1);
        }
      }

      const products = [...productCounts.entries()]
        .map(([name, count]) => ({ name, count, rate: pageOrders > 0 ? count / pageOrders : 0 }))
        .sort((a, b) => b.count - a.count);

      return { pageType: pageGroup.pageType, slug, orders: pageOrders, revenue: pageRevenue, products };
    });

    // Sort pages by type priority
    const typeOrder = ['checkout', 'upsell', 'downsell', 'thankyou', 'other'];
    pages.sort((a, b) => typeOrder.indexOf(a.pageType) - typeOrder.indexOf(b.pageType));

    return { name: group.name, ccReferenceId: group.ccReferenceId, totalOrders, totalRevenue, aov, pages };
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
            <p className="text-gray-600 text-sm">No funnel data found. Run funnel-sync first or check date range.</p>
          </div>
        ) : (
          funnelData.map((funnel, i) => <FunnelCard key={i} funnel={funnel} />)
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveFunnelKey(salesUrl: string | null): string | null {
  if (!salesUrl) return null;
  try {
    const url = new URL(salesUrl);
    return url.pathname.split('/').filter(Boolean)[0] || null;
  } catch {
    return null;
  }
}

function getPageSlug(salesUrl: string | null): string {
  if (!salesUrl) return 'unknown';
  try {
    const url = new URL(salesUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts.length > 1 ? parts.slice(1).join('/') : parts[0] ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function inferPageType(slug: string): string {
  const lower = slug.toLowerCase();
  if (lower.includes('checkout') || lower.includes('order-form')) return 'checkout';
  if (lower.includes('downsell') || lower.includes('ds')) return 'downsell';
  if (lower.includes('upsell') || lower.includes('oto') || lower.includes('upgrade')) return 'upsell';
  if (lower.includes('thank') || lower.includes('confirm')) return 'thankyou';
  return 'other';
}
