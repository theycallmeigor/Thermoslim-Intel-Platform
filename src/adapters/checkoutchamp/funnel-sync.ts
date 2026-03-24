/**
 * CheckoutChamp Funnel Structure Sync
 *
 * Derives funnel structure from existing order data in the DB.
 * Groups orders by funnelReferenceId and extracts unique page slugs from salesUrl.
 * CC API doesn't expose a /funnel/list endpoint — funnels are implicit in order data.
 *
 * Usage:
 *   npx tsx src/adapters/checkoutchamp/funnel-sync.ts
 */

import { URL } from 'url';

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractSlug(salesUrl: string | null): string | null {
  if (!salesUrl) return null;
  try {
    const parsed = new URL(salesUrl);
    const slug = parsed.pathname.replace(/^\//, '').replace(/\/$/, '');
    return slug || null;
  } catch {
    return null;
  }
}

/**
 * Infer page type from slug name.
 * CC funnel pages typically follow a naming convention:
 *   checkout*, secure-checkout* → checkout
 *   special-offer*, 1time-special-offer* → upsell
 *   thank*, confirmation* → thankyou
 */
function inferPageType(slug: string): string {
  const lower = slug.toLowerCase();
  if (lower.includes('checkout') || lower.includes('secure-checkout')) return 'checkout';
  if (lower.includes('special-offer') || lower.includes('1time-special')) return 'upsell';
  if (lower.includes('thank') || lower.includes('confirmation')) return 'thankyou';
  if (lower.includes('downsell')) return 'downsell';
  return 'other';
}

// ─── Sync logic ──────────────────────────────────────────────────────────────

export async function syncFunnels(): Promise<{ funnelsUpserted: number; pagesUpserted: number }> {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  let funnelsUpserted = 0;
  let pagesUpserted = 0;

  try {
    console.log('  Deriving funnel structure from order data...');

    // Query distinct (funnelReferenceId, salesUrl, campaignId, campaignName) from orders
    const orders = await db.order.findMany({
      where: {
        funnelReferenceId: { not: null },
      },
      select: {
        funnelReferenceId: true,
        salesUrl: true,
        campaignId: true,
        campaignName: true,
      },
      distinct: ['funnelReferenceId', 'salesUrl'],
    });

    // Group by funnelReferenceId
    const funnelMap = new Map<string, {
      campaignId: string | null;
      campaignName: string | null;
      slugs: Set<string>;
      urls: Map<string, string>; // slug → full URL (first seen)
    }>();

    for (const order of orders) {
      const fid = order.funnelReferenceId!;
      if (!funnelMap.has(fid)) {
        funnelMap.set(fid, {
          campaignId: order.campaignId,
          campaignName: order.campaignName,
          slugs: new Set(),
          urls: new Map(),
        });
      }
      const entry = funnelMap.get(fid)!;
      const slug = extractSlug(order.salesUrl);
      if (slug) {
        entry.slugs.add(slug);
        if (!entry.urls.has(slug) && order.salesUrl) {
          // Store full URL without query params for matching
          try {
            const parsed = new URL(order.salesUrl);
            entry.urls.set(slug, `${parsed.origin}/${slug}`);
          } catch {
            entry.urls.set(slug, order.salesUrl);
          }
        }
      }
    }

    console.log(`  Found ${funnelMap.size} funnels from ${orders.length} order records`);

    for (const [fid, entry] of funnelMap.entries()) {
      // Upsert funnel
      const dbFunnel = await db.funnel.upsert({
        where: { ccReferenceId: fid },
        create: {
          ccReferenceId: fid,
          name: entry.campaignName ? `${entry.campaignName} Funnel` : `Funnel ${fid.slice(0, 8)}`,
          campaignId: entry.campaignId,
          campaignName: entry.campaignName,
        },
        update: {
          campaignId: entry.campaignId,
          campaignName: entry.campaignName,
          syncedAt: new Date(),
        },
      });
      funnelsUpserted++;

      // Sort pages by inferred type (checkout first, then upsells, then others)
      const typeOrder: Record<string, number> = { checkout: 0, upsell: 1, downsell: 2, thankyou: 3, other: 4 };
      const sortedSlugs = [...entry.slugs].sort((a, b) => {
        const ta = typeOrder[inferPageType(a)] ?? 99;
        const tb = typeOrder[inferPageType(b)] ?? 99;
        return ta - tb || a.localeCompare(b);
      });

      for (let i = 0; i < sortedSlugs.length; i++) {
        const slug = sortedSlugs[i];
        const pageType = inferPageType(slug);
        const externalUrl = entry.urls.get(slug) ?? null;

        await db.funnelPage.upsert({
          where: {
            funnelId_ccPageId: {
              funnelId: dbFunnel.id,
              ccPageId: slug, // use slug as the page ID since CC doesn't expose page IDs
            },
          },
          create: {
            funnelId: dbFunnel.id,
            ccPageId: slug,
            title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            slug,
            pageType,
            externalUrl,
            sortOrder: i,
          },
          update: {
            title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            pageType,
            externalUrl,
            sortOrder: i,
          },
        });
        pagesUpserted++;
      }

      console.log(`  Funnel "${dbFunnel.name}" (${fid.slice(0, 8)}...): ${sortedSlugs.length} pages`);
      for (const slug of sortedSlugs) {
        console.log(`    [${inferPageType(slug)}] /${slug}`);
      }
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
      console.log(`\nFunnel sync complete: ${funnelsUpserted} funnels, ${pagesUpserted} pages`);
    })
    .catch((err) => {
      console.error('Funnel sync failed:', err);
      process.exit(1);
    });
}
