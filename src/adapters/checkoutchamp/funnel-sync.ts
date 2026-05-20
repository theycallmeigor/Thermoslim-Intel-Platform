/**
 * CheckoutChamp Funnel Structure Sync (v2)
 *
 * Derives funnel structure from order item slots + salesUrl data.
 * Each productSlot on UPSALE items represents a funnel page (OTO/downsell).
 * Detects page types from product patterns (downsell = lower price variant).
 * Logs all changes for debugging.
 *
 * Usage:
 *   npx tsx src/adapters/checkoutchamp/funnel-sync.ts
 */

import { URL } from 'url';

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractCheckoutSlug(salesUrl: string | null): string | null {
  if (!salesUrl) return null;
  try {
    const parsed = new URL(salesUrl);
    const parts = parsed.pathname.split('/').filter(Boolean);
    // Skip UUID-like segments, take the last human-readable slug
    return parts.filter(p => !p.match(/^[0-9a-f]{8}-/i)).pop() ?? parts.pop() ?? null;
  } catch {
    return null;
  }
}

function titleCase(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Sync logic ──────────────────────────────────────────────────────────────

export async function syncFunnels(): Promise<{ funnelsUpserted: number; pagesUpserted: number }> {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  const changes: string[] = [];
  let funnelsUpserted = 0;
  let pagesUpserted = 0;

  try {
    console.log('[funnel-sync] Starting funnel structure sync...');

    // ─── Step 1: Get all orders with funnel data ────────────────────────────
    const orders = await db.order.findMany({
      where: {
        source: { in: ['SHOPIFY', 'MERGED'] },
        status: 'COMPLETE',
        OR: [
          { funnelReferenceId: { not: null } },
          { salesUrl: { not: null } },
        ],
      },
      select: {
        id: true,
        funnelReferenceId: true,
        salesUrl: true,
        campaignId: true,
        campaignName: true,
        items: {
          select: {
            productSlot: true,
            productType: true,
            name: true,
            price: true,
            ccCrmId: true,
            productMap: { select: { productLine: true, frequency: true, isSubscription: true } },
          },
          orderBy: { productSlot: 'asc' },
        },
      },
    });

    console.log(`[funnel-sync] Found ${orders.length} orders with funnel/salesUrl data`);

    // ─── Step 2: Group orders by funnel ─────────────────────────────────────
    type FunnelGroup = {
      campaignId: string | null;
      campaignName: string | null;
      checkoutSlugs: Set<string>;
      orders: typeof orders;
    };

    const funnelGroups = new Map<string, FunnelGroup>();

    for (const order of orders) {
      const fid = order.funnelReferenceId ?? 'no-funnel';
      if (!funnelGroups.has(fid)) {
        funnelGroups.set(fid, {
          campaignId: order.campaignId,
          campaignName: order.campaignName,
          checkoutSlugs: new Set(),
          orders: [],
        });
      }
      const group = funnelGroups.get(fid)!;
      group.orders.push(order);
      const slug = extractCheckoutSlug(order.salesUrl);
      if (slug) group.checkoutSlugs.add(slug);
    }

    console.log(`[funnel-sync] Found ${funnelGroups.size} funnel groups`);

    // ─── Step 3: For each funnel, derive page structure from slots ──────────
    for (const [fid, group] of funnelGroups) {
      if (fid === 'no-funnel') continue;

      // Collect all UPSALE slots and their products
      type SlotInfo = {
        products: Map<string, { productLine: string; name: string; price: number; count: number; frequency: string | null; isSubscription: boolean }>;
        totalAccepted: number;
      };
      const slots = new Map<number, SlotInfo>();

      for (const order of group.orders) {
        for (const item of order.items) {
          if (item.productType !== 'UPSALE') continue;
          const slot = item.productSlot;
          if (!slots.has(slot)) slots.set(slot, { products: new Map(), totalAccepted: 0 });
          const slotInfo = slots.get(slot)!;
          slotInfo.totalAccepted++;

          const productLine = item.productMap?.productLine ?? item.name ?? 'Unknown';
          const key = `${productLine}|${item.price}`;
          const existing = slotInfo.products.get(key) ?? {
            productLine,
            name: item.name ?? productLine,
            price: item.price,
            count: 0,
            frequency: item.productMap?.frequency ?? null,
            isSubscription: item.productMap?.isSubscription ?? false,
          };
          existing.count++;
          slotInfo.products.set(key, existing);
        }
      }

      // Determine page type for each slot:
      // - Look at dominant product and price
      // - If slot has a significantly lower price for same product as previous slot → downsell
      // - Otherwise → upsell (OTO)
      const sortedSlots = [...slots.entries()].sort((a, b) => a[0] - b[0]);

      // Build checkout page name from slugs
      const mainCheckoutSlug = [...group.checkoutSlugs][0] ?? 'checkout';
      const funnelDisplayName = titleCase(mainCheckoutSlug);

      // Upsert funnel
      const dbFunnel = await db.funnel.upsert({
        where: { ccReferenceId: fid },
        create: {
          ccReferenceId: fid,
          name: funnelDisplayName,
          campaignId: group.campaignId,
          campaignName: group.campaignName,
        },
        update: {
          name: funnelDisplayName,
          campaignId: group.campaignId,
          campaignName: group.campaignName,
          syncedAt: new Date(),
        },
      });
      funnelsUpserted++;

      // ── Build page list ────────────────────────────────────────────────────
      // Page 0: Checkout
      const checkoutPageId = `checkout-${mainCheckoutSlug}`;
      await db.funnelPage.upsert({
        where: { funnelId_ccPageId: { funnelId: dbFunnel.id, ccPageId: checkoutPageId } },
        create: {
          funnelId: dbFunnel.id,
          ccPageId: checkoutPageId,
          title: `Checkout — ${funnelDisplayName}`,
          slug: mainCheckoutSlug,
          pageType: 'checkout',
          sortOrder: 0,
        },
        update: {
          title: `Checkout — ${funnelDisplayName}`,
          slug: mainCheckoutSlug,
          pageType: 'checkout',
          sortOrder: 0,
        },
      });
      pagesUpserted++;

      // Upsell/downsell pages from slots
      let otoNum = 1;
      let prevProductLine: string | null = null;
      let prevPrice = 0;

      for (let i = 0; i < sortedSlots.length; i++) {
        const [slot, slotInfo] = sortedSlots[i];
        const dominant = [...slotInfo.products.values()].sort((a, b) => b.count - a.count)[0];
        if (!dominant) continue;

        // Detect downsell: same product line as previous slot but lower price
        const isDownsell = prevProductLine === dominant.productLine && dominant.price < prevPrice;
        const pageType = isDownsell ? 'downsell' : 'upsell';

        let pageTitle: string;
        if (isDownsell) {
          pageTitle = `DS${otoNum - 1} — ${dominant.productLine} ($${(dominant.price / 100).toFixed(2)})`;
        } else {
          pageTitle = `OTO${otoNum} — ${dominant.productLine}`;
          if (dominant.frequency) pageTitle += ` (${dominant.frequency})`;
        }

        const pageId = `slot-${slot}`;
        await db.funnelPage.upsert({
          where: { funnelId_ccPageId: { funnelId: dbFunnel.id, ccPageId: pageId } },
          create: {
            funnelId: dbFunnel.id,
            ccPageId: pageId,
            title: pageTitle,
            slug: `slot-${slot}`,
            pageType,
            sortOrder: i + 1,
          },
          update: {
            title: pageTitle,
            pageType,
            sortOrder: i + 1,
          },
        });
        pagesUpserted++;

        changes.push(`  [${fid.slice(0, 8)}] slot ${slot} → ${pageType}: ${pageTitle} (${slotInfo.totalAccepted} accepted)`);

        if (!isDownsell) {
          prevProductLine = dominant.productLine;
          prevPrice = dominant.price;
          otoNum++;
        }
      }

      // Log funnel summary
      const totalOrders = group.orders.length;
      const checkoutNames = [...group.checkoutSlugs].join(', ');
      console.log(`[funnel-sync] Funnel "${funnelDisplayName}" (${fid.slice(0, 8)}): ${totalOrders} orders, ${sortedSlots.length} OTO slots`);
      console.log(`  Checkouts: ${checkoutNames}`);
      for (const [slot, info] of sortedSlots) {
        const prods = [...info.products.values()].sort((a, b) => b.count - a.count);
        const prodSummary = prods.map(p => `${p.productLine} $${(p.price / 100).toFixed(2)} x${p.count}`).join(', ');
        console.log(`  Slot ${slot}: ${info.totalAccepted} accepted — ${prodSummary}`);
      }
    }

    // ─── Step 4: Log changes ────────────────────────────────────────────────
    if (changes.length > 0) {
      console.log('\n[funnel-sync] Changes:');
      for (const c of changes) console.log(c);
    }

    return { funnelsUpserted, pagesUpserted };
  } finally {
    await db.$disconnect();
  }
}

// ─── CLI runner ──────────────────────────────────────────────────────────────

const isMain = typeof require !== 'undefined' && require.main === module;
const isTsx = process.argv[1]?.includes('funnel-sync');

if (isMain || isTsx) {
  const dotenv = require('dotenv');
  const path = require('path');
  const fs = require('fs');
  const envLocal = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
  process.env.DIRECT_URL = process.env.DATABASE_URL!;

  syncFunnels()
    .then(({ funnelsUpserted, pagesUpserted }) => {
      console.log(`\n[funnel-sync] Complete: ${funnelsUpserted} funnels, ${pagesUpserted} pages`);
    })
    .catch((err) => {
      console.error('[funnel-sync] Failed:', err);
      process.exit(1);
    });
}
