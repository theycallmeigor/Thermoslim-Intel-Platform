/**
 * CC Funnel Map — Query all campaigns, all pages within each,
 * and build a conversion map showing how many people reached each page.
 *
 * Two data sources:
 *   1. CC API directly — gets salesUrl, responseType, declineReason (fields we're missing in DB)
 *   2. Database — gets what we already have
 *
 * Builds: Campaign → Funnel → Page → { visits, completes, declines, abandons }
 *
 * Usage:
 *   npx tsx scripts/cc-qa/funnel-map.ts
 *   npx tsx scripts/cc-qa/funnel-map.ts --live    # also pull fresh from CC API
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

const STORE_DIR = path.resolve(__dirname, 'store');

// ═══════════════════════════════════════════════════════════
//  CC API — pull fresh data with fields the DB is missing
// ═══════════════════════════════════════════════════════════

interface CCApiOrder {
  orderId: string;
  orderStatus: string;
  campaignId: number;
  campaignName: string;
  salesUrl: string;
  funnelReferenceId: string;
  paySource: string;
  responseType: string;     // SUCCESS, HARD_DECLINE, SOFT_DECLINE, PENDING
  declineReason: string;    // actual processor decline reason
  totalAmount: string;
  dateCreated: string;
  hasUpsell: boolean;
  items: Record<string, any>;
}

async function pullFromAPI(from: Date, to: Date): Promise<CCApiOrder[]> {
  const { config } = await import('../../src/core/config');
  const baseUrl = config.checkoutChamp.apiUrl.replace(/\/$/, '');
  const authParams = {
    loginId: config.checkoutChamp.apiUsername,
    password: config.checkoutChamp.apiKey,
  };

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const orders: CCApiOrder[] = [];

  // Fetch in 30-day chunks
  let chunkStart = new Date(from);
  while (chunkStart < to) {
    const chunkEnd = new Date(Math.min(
      chunkStart.getTime() + 30 * 86400000,
      to.getTime(),
    ));

    let page = 1;
    let totalResults = Infinity;

    while ((page - 1) * 25 < totalResults) {
      const qs = new URLSearchParams({
        ...authParams,
        startDate: formatDate(chunkStart),
        endDate: formatDate(chunkEnd),
        page: String(page),
      });

      const res = await fetch(`${baseUrl}/order/query/?${qs}`);
      if (!res.ok) throw new Error(`CC API HTTP ${res.status}`);
      const json = await res.json();

      if (json.result !== 'SUCCESS') {
        if (typeof json.message === 'string' && json.message.toLowerCase().includes('no orders')) break;
        throw new Error(`CC API error: ${JSON.stringify(json.message)}`);
      }
      if (typeof json.message === 'string') break;

      totalResults = json.message.totalResults;
      const data = json.message.data;
      if (!data?.length) break;

      orders.push(...data);
      page++;
    }

    chunkStart = new Date(chunkEnd.getTime() + 86400000);
  }

  return orders;
}

// ═══════════════════════════════════════════════════════════
//  BUILD FUNNEL MAP — from database or API data
// ═══════════════════════════════════════════════════════════

interface PageStats {
  slug: string;
  fullUrl: string;
  pageType: string;
  totalOrders: number;
  completeOrders: number;
  declinedOrders: number;
  abandonedOrders: number;
  partialOrders: number;
  revenue: number;          // cents
  declineReasons: Record<string, number>;
  responseTypes: Record<string, number>;
}

interface FunnelStats {
  funnelId: string;
  name: string;
  campaignId: string;
  campaignName: string;
  totalOrders: number;
  pages: PageStats[];
}

function extractSlug(salesUrl: string | null): string {
  if (!salesUrl) return 'unknown';
  try {
    const parsed = new URL(salesUrl);
    const slug = parsed.pathname.replace(/^\//, '').replace(/\/$/, '');
    return slug || 'root';
  } catch {
    return 'unknown';
  }
}

function inferPageType(slug: string): string {
  const lower = slug.toLowerCase();
  if (lower.includes('checkout') || lower.includes('secure-checkout')) return 'checkout';
  if (lower.includes('special-offer') || lower.includes('1time-special')) return 'upsell';
  if (lower.includes('thank') || lower.includes('confirmation')) return 'thankyou';
  if (lower.includes('downsell')) return 'downsell';
  return 'other';
}

// ═══════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const useLive = args.includes('--live');

  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  console.log('\n' + '═'.repeat(120));
  console.log('  CC FUNNEL MAP — Campaign → Page Conversion Analysis');
  console.log('═'.repeat(120));

  const from = new Date('2025-01-01');
  const to = new Date();

  // ── Source 1: Database (always) ──
  console.log('\n  Pulling from database...');
  const dbOrders = await db.order.findMany({
    where: {
      source: 'CHECKOUTCHAMP',
      createdAt: { gte: from, lte: to },
    },
    select: {
      id: true,
      createdAt: true,
      status: true,
      paySource: true,
      orderTotal: true,
      campaignId: true,
      campaignName: true,
      salesUrl: true,
      funnelReferenceId: true,
      responseType: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`  Database: ${dbOrders.length} CC orders`);

  // ── Source 2: CC API (if --live) ──
  let apiOrders: CCApiOrder[] = [];
  let apiResponseTypes: Map<string, { responseType: string; declineReason: string }> = new Map();

  if (useLive) {
    console.log('\n  Pulling fresh from CC API...');
    try {
      apiOrders = await pullFromAPI(from, to);
      console.log(`  API: ${apiOrders.length} orders`);

      // Build lookup for fields missing in DB
      for (const o of apiOrders) {
        apiResponseTypes.set(o.orderId, {
          responseType: o.responseType || '',
          declineReason: (o as any).declineReason || '',
        });
      }

      // Show what we're getting from API that DB is missing
      const withResponse = apiOrders.filter((o) => o.responseType && o.responseType !== '');
      const withDecline = apiOrders.filter((o) => (o as any).declineReason && (o as any).declineReason !== '');
      console.log(`  API has responseType: ${withResponse.length}/${apiOrders.length}`);
      console.log(`  API has declineReason: ${withDecline.length}/${apiOrders.length}`);

      // Show unique response types
      const rtCounts: Record<string, number> = {};
      for (const o of apiOrders) {
        const rt = o.responseType || 'empty';
        rtCounts[rt] = (rtCounts[rt] || 0) + 1;
      }
      console.log('  Response types from API:');
      for (const [rt, count] of Object.entries(rtCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`    ${rt.padEnd(20)} ${count}`);
      }

      // Show unique decline reasons
      const drCounts: Record<string, number> = {};
      for (const o of apiOrders) {
        const dr = (o as any).declineReason || 'empty';
        if (dr !== 'empty') drCounts[dr] = (drCounts[dr] || 0) + 1;
      }
      if (Object.keys(drCounts).length > 0) {
        console.log('  Decline reasons from API:');
        for (const [dr, count] of Object.entries(drCounts).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
          console.log(`    ${dr.padEnd(40)} ${count}`);
        }
      }
    } catch (err: any) {
      console.log(`  API pull failed: ${err.message}`);
      console.log('  Continuing with database only...');
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  BUILD THE MAP
  // ═══════════════════════════════════════════════════════════

  const funnelMap = new Map<string, FunnelStats>();

  for (const o of dbOrders) {
    const funnelId = o.funnelReferenceId || 'no-funnel';
    const campaignId = o.campaignId || 'unknown';
    const campaignName = o.campaignName || 'Unknown Campaign';
    const salesUrl = o.salesUrl || '';
    const slug = extractSlug(salesUrl);
    const pageType = inferPageType(slug);

    // Get API enrichment if available
    const apiData = apiResponseTypes.get(o.id);

    // Initialize funnel
    if (!funnelMap.has(funnelId)) {
      funnelMap.set(funnelId, {
        funnelId,
        name: `${campaignName} — ${funnelId.slice(0, 8)}`,
        campaignId,
        campaignName,
        totalOrders: 0,
        pages: [],
      });
    }
    const funnel = funnelMap.get(funnelId)!;
    funnel.totalOrders++;

    // Find or create page
    let page = funnel.pages.find((p) => p.slug === slug);
    if (!page) {
      page = {
        slug,
        fullUrl: salesUrl,
        pageType,
        totalOrders: 0,
        completeOrders: 0,
        declinedOrders: 0,
        abandonedOrders: 0,
        partialOrders: 0,
        revenue: 0,
        declineReasons: {},
        responseTypes: {},
      };
      funnel.pages.push(page);
    }

    page.totalOrders++;
    page.revenue += o.orderTotal || 0;

    // Classify
    const isAbandon = (!o.paySource || o.paySource === 'unknown') && o.status === 'PARTIAL';
    if (o.status === 'COMPLETE') page.completeOrders++;
    else if (o.status === 'DECLINED') page.declinedOrders++;
    else if (isAbandon) page.abandonedOrders++;
    else if (o.status === 'PARTIAL') page.partialOrders++;

    // Response type tracking
    const rt = apiData?.responseType || o.responseType || 'unknown';
    page.responseTypes[rt] = (page.responseTypes[rt] || 0) + 1;

    if (apiData?.declineReason) {
      page.declineReasons[apiData.declineReason] = (page.declineReasons[apiData.declineReason] || 0) + 1;
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  PRINT THE MAP
  // ═══════════════════════════════════════════════════════════

  // Sort pages within each funnel by type (checkout → upsell → downsell → thankyou → other)
  const typeOrder: Record<string, number> = { checkout: 0, upsell: 1, downsell: 2, thankyou: 3, other: 4 };
  for (const funnel of funnelMap.values()) {
    funnel.pages.sort((a, b) => (typeOrder[a.pageType] ?? 99) - (typeOrder[b.pageType] ?? 99));
  }

  // Sort funnels by total orders
  const sortedFunnels = [...funnelMap.values()].sort((a, b) => b.totalOrders - a.totalOrders);

  const $ = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  console.log('\n' + '═'.repeat(120));
  console.log('  CAMPAIGN → FUNNEL → PAGE CONVERSION MAP');
  console.log('═'.repeat(120));

  for (const funnel of sortedFunnels) {
    const funnelComplete = funnel.pages.reduce((s, p) => s + p.completeOrders, 0);
    const funnelRevenue = funnel.pages.reduce((s, p) => s + p.revenue, 0);
    const funnelDeclined = funnel.pages.reduce((s, p) => s + p.declinedOrders, 0);
    const funnelAbandoned = funnel.pages.reduce((s, p) => s + p.abandonedOrders, 0);

    console.log(`\n  ┌─ FUNNEL: ${funnel.name}`);
    console.log(`  │  Campaign: ${funnel.campaignName} (ID: ${funnel.campaignId})`);
    console.log(`  │  Total: ${funnel.totalOrders} orders | ${funnelComplete} complete | ${funnelDeclined} declined | ${funnelAbandoned} abandoned | ${$(funnelRevenue)}`);
    console.log(`  │`);

    for (let i = 0; i < funnel.pages.length; i++) {
      const p = funnel.pages[i];
      const isLast = i === funnel.pages.length - 1;
      const prefix = isLast ? '  └──' : '  ├──';
      const contPrefix = isLast ? '      ' : '  │   ';

      const convRate = funnel.totalOrders > 0 ? (p.completeOrders / funnel.totalOrders * 100).toFixed(1) : '0.0';
      const reachRate = funnel.totalOrders > 0 ? (p.totalOrders / funnel.totalOrders * 100).toFixed(1) : '0.0';

      const typeIcon = p.pageType === 'checkout' ? '🛒' :
                       p.pageType === 'upsell' ? '⬆️' :
                       p.pageType === 'downsell' ? '⬇️' :
                       p.pageType === 'thankyou' ? '✅' : '📄';

      console.log(`${prefix} ${typeIcon} [${p.pageType.toUpperCase()}] /${p.slug}`);
      console.log(`${contPrefix}  Reached: ${p.totalOrders} (${reachRate}%) | ✓${p.completeOrders} ⊘${p.declinedOrders} 🚪${p.abandonedOrders} | ${$(p.revenue)}`);

      // Show conversion funnel drop from previous page
      if (i > 0) {
        const prev = funnel.pages[i - 1];
        const dropoff = prev.totalOrders > 0
          ? ((1 - p.totalOrders / prev.totalOrders) * 100).toFixed(0)
          : '?';
        console.log(`${contPrefix}  Drop-off from previous: ${dropoff}%`);
      }

      // Show response types if we have them
      const nonUnknownRT = Object.entries(p.responseTypes).filter(([k]) => k !== 'unknown');
      if (nonUnknownRT.length > 0) {
        console.log(`${contPrefix}  Response types: ${nonUnknownRT.map(([k, v]) => `${k}:${v}`).join(' ')}`);
      }

      // Show decline reasons if any
      const declines = Object.entries(p.declineReasons);
      if (declines.length > 0) {
        console.log(`${contPrefix}  Decline reasons: ${declines.map(([k, v]) => `${k}:${v}`).join(' ')}`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  SUMMARY STATS
  // ═══════════════════════════════════════════════════════════

  const allPages: PageStats[] = [];
  for (const f of sortedFunnels) allPages.push(...f.pages);

  const totalOrders = dbOrders.length;
  const totalComplete = allPages.reduce((s, p) => s + p.completeOrders, 0);
  const totalDeclined = allPages.reduce((s, p) => s + p.declinedOrders, 0);
  const totalAbandoned = allPages.reduce((s, p) => s + p.abandonedOrders, 0);
  const totalRevenue = allPages.reduce((s, p) => s + p.revenue, 0);

  console.log('\n' + '═'.repeat(120));
  console.log('  OVERALL SUMMARY');
  console.log('═'.repeat(120));
  console.log(`  Funnels: ${funnelMap.size}`);
  console.log(`  Unique pages: ${allPages.length}`);
  console.log(`  Total orders: ${totalOrders}`);
  console.log(`  Complete: ${totalComplete} (${(totalComplete / totalOrders * 100).toFixed(1)}%)`);
  console.log(`  Declined: ${totalDeclined} (${(totalDeclined / totalOrders * 100).toFixed(1)}%)`);
  console.log(`  Abandoned: ${totalAbandoned} (${(totalAbandoned / totalOrders * 100).toFixed(1)}%)`);
  console.log(`  Revenue: ${$(totalRevenue)}`);

  // Page type breakdown
  console.log('\n  BY PAGE TYPE:');
  const byType: Record<string, { total: number; complete: number; declined: number; abandoned: number; revenue: number }> = {};
  for (const p of allPages) {
    if (!byType[p.pageType]) byType[p.pageType] = { total: 0, complete: 0, declined: 0, abandoned: 0, revenue: 0 };
    byType[p.pageType].total += p.totalOrders;
    byType[p.pageType].complete += p.completeOrders;
    byType[p.pageType].declined += p.declinedOrders;
    byType[p.pageType].abandoned += p.abandonedOrders;
    byType[p.pageType].revenue += p.revenue;
  }
  for (const [type, stats] of Object.entries(byType).sort((a, b) => b[1].total - a[1].total)) {
    const convRate = stats.total > 0 ? (stats.complete / stats.total * 100).toFixed(1) : '0.0';
    console.log(`    ${type.padEnd(12)} | ${String(stats.total).padStart(5)} orders | ${convRate}% conv | ⊘${stats.declined} declined | 🚪${stats.abandoned} abandoned | ${$(stats.revenue)}`);
  }

  // ── Save map to store ──
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
  const mapData = {
    generatedAt: new Date().toISOString(),
    source: useLive ? 'database+api' : 'database',
    summary: {
      funnels: funnelMap.size,
      pages: allPages.length,
      orders: totalOrders,
      complete: totalComplete,
      declined: totalDeclined,
      abandoned: totalAbandoned,
      revenue: totalRevenue,
    },
    funnels: sortedFunnels.map((f) => ({
      funnelId: f.funnelId,
      name: f.name,
      campaignId: f.campaignId,
      campaignName: f.campaignName,
      totalOrders: f.totalOrders,
      pages: f.pages.map((p) => ({
        slug: p.slug,
        pageType: p.pageType,
        totalOrders: p.totalOrders,
        completeOrders: p.completeOrders,
        declinedOrders: p.declinedOrders,
        abandonedOrders: p.abandonedOrders,
        revenue: p.revenue,
        responseTypes: p.responseTypes,
        declineReasons: p.declineReasons,
      })),
    })),
  };

  fs.writeFileSync(
    path.join(STORE_DIR, 'funnel-map.json'),
    JSON.stringify(mapData, null, 2) + '\n',
  );
  console.log(`\n  Saved: scripts/cc-qa/store/funnel-map.json`);
  console.log('═'.repeat(120) + '\n');

  await db.$disconnect();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
