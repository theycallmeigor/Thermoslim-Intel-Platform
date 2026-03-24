/**
 * CC Backfill — Three operations:
 *   1. Link orders → FunnelPage via slug matching (sets funnelPageId)
 *   2. Pull responseType + declineReason from CC API for all orders
 *   3. Compute page-level conversion stats
 *
 * Usage:
 *   npx tsx scripts/cc-qa/backfill.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

const STORE_DIR = path.resolve(__dirname, 'store');

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════
//  1. LINK ORDERS → FUNNEL PAGES
// ═══════════════════════════════════════════════════════════

async function linkOrdersToPages(db: any): Promise<number> {
  console.log('\n  ═══ STEP 1: Link orders to FunnelPage records ═══');

  // Load all funnel pages into a lookup: (funnelId, slug) → pageId
  const funnels = await db.funnel.findMany({
    include: { pages: true },
  });

  // Build lookup: funnelReferenceId → { slug → funnelPageId }
  const lookup = new Map<string, Map<string, string>>();
  for (const f of funnels) {
    const slugMap = new Map<string, string>();
    for (const p of f.pages) {
      if (p.slug) slugMap.set(p.slug, p.id);
      if (p.ccPageId) slugMap.set(p.ccPageId, p.id);
    }
    lookup.set(f.ccReferenceId, slugMap);
  }
  console.log(`  Loaded ${funnels.length} funnels, ${[...lookup.values()].reduce((s, m) => s + m.size, 0)} page slugs`);

  // Get all CC orders missing funnelPageId
  const orders = await db.order.findMany({
    where: {
      source: 'CHECKOUTCHAMP',
      funnelPageId: null,
      funnelReferenceId: { not: null },
    },
    select: { id: true, salesUrl: true, funnelReferenceId: true },
  });
  console.log(`  Orders to link: ${orders.length}`);

  let linked = 0;
  for (const o of orders) {
    const slug = extractSlug(o.salesUrl);
    if (!slug || !o.funnelReferenceId) continue;

    const slugMap = lookup.get(o.funnelReferenceId);
    if (!slugMap) continue;

    const pageId = slugMap.get(slug);
    if (!pageId) continue;

    await db.order.update({
      where: { id: o.id },
      data: { funnelPageId: pageId },
    });
    linked++;
  }

  console.log(`  Linked: ${linked}/${orders.length} orders → FunnelPage`);
  return linked;
}

// ═══════════════════════════════════════════════════════════
//  2. PULL RESPONSE TYPE + DECLINE REASON FROM CC API
// ═══════════════════════════════════════════════════════════

async function pullResponseTypes(db: any): Promise<number> {
  console.log('\n  ═══ STEP 2: Pull responseType + declineReason from CC API ═══');

  const { config } = await import('../../src/core/config');
  const baseUrl = config.checkoutChamp.apiUrl.replace(/\/$/, '');
  const authParams = {
    loginId: config.checkoutChamp.apiUsername,
    password: config.checkoutChamp.apiKey,
  };

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  // Get date range of CC orders
  const oldest = await db.order.findFirst({
    where: { source: 'CHECKOUTCHAMP' },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });
  const newest = await db.order.findFirst({
    where: { source: 'CHECKOUTCHAMP' },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (!oldest || !newest) {
    console.log('  No CC orders found');
    return 0;
  }

  const from = oldest.createdAt;
  const to = new Date(newest.createdAt.getTime() + 86400000); // +1 day buffer
  console.log(`  Date range: ${formatDate(from)} → ${formatDate(to)}`);

  // Fetch all orders from CC API
  const apiOrders: Array<{
    orderId: string;
    responseType: string;
    declineReason: string;
  }> = [];

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

      try {
        const res = await fetch(`${baseUrl}/order/query/?${qs}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (json.result !== 'SUCCESS') {
          if (typeof json.message === 'string' && json.message.toLowerCase().includes('no orders')) break;
          throw new Error(`API error: ${JSON.stringify(json.message)}`);
        }
        if (typeof json.message === 'string') break;

        totalResults = json.message.totalResults;
        const data = json.message.data;
        if (!data?.length) break;

        for (const o of data) {
          apiOrders.push({
            orderId: o.orderId,
            responseType: o.responseType || '',
            declineReason: o.declineReason || '',
          });
        }
        page++;
      } catch (err: any) {
        console.log(`  API error on ${formatDate(chunkStart)} page ${page}: ${err.message}`);
        break;
      }
    }

    console.log(`  Chunk ${formatDate(chunkStart)} → ${formatDate(chunkEnd)}: ${apiOrders.length} total orders fetched`);
    chunkStart = new Date(chunkEnd.getTime() + 86400000);
  }

  console.log(`  Total from API: ${apiOrders.length} orders`);

  // Map CC responseType string → Prisma enum
  const responseTypeMap: Record<string, string> = {
    SUCCESS: 'SUCCESS',
    HARD_DECLINE: 'HARD_DECLINE',
    SOFT_DECLINE: 'SOFT_DECLINE',
    PENDING: 'PENDING',
    COD_PENDING: 'COD_PENDING',
  };

  // Update DB orders that are missing responseType
  let updated = 0;
  let declinesFilled = 0;
  for (const apiOrder of apiOrders) {
    const rt = responseTypeMap[apiOrder.responseType];
    if (!rt && !apiOrder.declineReason) continue;

    try {
      const dbOrder = await db.order.findFirst({
        where: { source: 'CHECKOUTCHAMP', sourceOrderId: apiOrder.orderId },
        select: { id: true, responseType: true, declineReason: true },
      });

      if (!dbOrder) continue;

      const updateData: Record<string, unknown> = {};
      if (rt && !dbOrder.responseType) {
        updateData.responseType = rt;
      }
      if (apiOrder.declineReason && !dbOrder.declineReason) {
        updateData.declineReason = apiOrder.declineReason;
        declinesFilled++;
      }

      if (Object.keys(updateData).length > 0) {
        await db.order.update({ where: { id: dbOrder.id }, data: updateData });
        updated++;
      }
    } catch (err: any) {
      // Skip individual order errors
    }
  }

  console.log(`  Updated: ${updated} orders (responseType filled)`);
  console.log(`  Decline reasons filled: ${declinesFilled}`);
  return updated;
}

// ═══════════════════════════════════════════════════════════
//  3. COMPUTE PAGE-LEVEL CONVERSION STATS
// ═══════════════════════════════════════════════════════════

interface PageConversionStats {
  funnelPageId: string;
  funnelName: string;
  slug: string;
  pageType: string;
  totalOrders: number;
  completeOrders: number;
  declinedOrders: number;
  abandonedOrders: number;
  partialOrders: number;
  revenue: number;
  conversionRate: number;
  topDeclineReasons: Record<string, number>;
  responseBreakdown: Record<string, number>;
}

async function computePageStats(db: any): Promise<PageConversionStats[]> {
  console.log('\n  ═══ STEP 3: Compute page-level conversion stats ═══');

  const pages = await db.funnelPage.findMany({
    include: {
      funnel: true,
      orders: {
        select: {
          status: true,
          paySource: true,
          orderTotal: true,
          responseType: true,
          declineReason: true,
        },
      },
    },
  });

  const stats: PageConversionStats[] = [];

  for (const page of pages) {
    const orders = page.orders;
    const total = orders.length;
    if (total === 0) continue;

    let complete = 0;
    let declined = 0;
    let abandoned = 0;
    let partial = 0;
    let revenue = 0;
    const declineReasons: Record<string, number> = {};
    const responseBreakdown: Record<string, number> = {};

    for (const o of orders) {
      const isAbandon = (!o.paySource || o.paySource === 'unknown') && o.status === 'PARTIAL';

      if (o.status === 'COMPLETE') complete++;
      else if (o.status === 'DECLINED') declined++;
      else if (isAbandon) abandoned++;
      else if (o.status === 'PARTIAL') partial++;

      revenue += o.orderTotal || 0;

      const rt = o.responseType || 'unknown';
      responseBreakdown[rt] = (responseBreakdown[rt] || 0) + 1;

      if (o.declineReason) {
        declineReasons[o.declineReason] = (declineReasons[o.declineReason] || 0) + 1;
      }
    }

    stats.push({
      funnelPageId: page.id,
      funnelName: page.funnel.name,
      slug: page.slug || page.ccPageId,
      pageType: page.pageType || 'other',
      totalOrders: total,
      completeOrders: complete,
      declinedOrders: declined,
      abandonedOrders: abandoned,
      partialOrders: partial,
      revenue,
      conversionRate: total > 0 ? complete / total : 0,
      topDeclineReasons: declineReasons,
      responseBreakdown,
    });
  }

  // Sort by total orders desc
  stats.sort((a, b) => b.totalOrders - a.totalOrders);

  // Print
  const $ = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  console.log('\n  PAGE-LEVEL CONVERSION STATS');
  console.log('  ' + '─'.repeat(110));
  console.log('  ' + 'Page'.padEnd(35) + 'Type'.padEnd(12) + 'Orders'.padStart(7) + '  ✓Complete'.padStart(10) + '  ⊘Declined'.padStart(10) + '  🚪Abandon'.padStart(10) + '  Conv%'.padStart(7) + '  Revenue'.padStart(10));
  console.log('  ' + '─'.repeat(110));

  for (const s of stats) {
    const slug = s.slug.length > 32 ? s.slug.slice(0, 32) + '…' : s.slug;
    const conv = (s.conversionRate * 100).toFixed(1);
    console.log(
      '  ' +
      `/${slug}`.padEnd(35) +
      s.pageType.padEnd(12) +
      String(s.totalOrders).padStart(7) +
      String(s.completeOrders).padStart(10) +
      String(s.declinedOrders).padStart(10) +
      String(s.abandonedOrders).padStart(10) +
      `${conv}%`.padStart(7) +
      $(s.revenue).padStart(10),
    );

    // Show decline reasons if any
    const reasons = Object.entries(s.topDeclineReasons).sort((a, b) => b[1] - a[1]);
    if (reasons.length > 0) {
      for (const [reason, count] of reasons.slice(0, 3)) {
        console.log('  ' + ''.padEnd(35) + `  └ ${reason}: ${count}`);
      }
    }

    // Show response type breakdown if non-trivial
    const nonUnknown = Object.entries(s.responseBreakdown).filter(([k]) => k !== 'unknown');
    if (nonUnknown.length > 0) {
      console.log('  ' + ''.padEnd(35) + `  Response: ${nonUnknown.map(([k, v]) => `${k}:${v}`).join(' ')}`);
    }
  }

  // Save to store
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(STORE_DIR, 'page-conversion-stats.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      pages: stats,
      summary: {
        totalPages: stats.length,
        totalOrders: stats.reduce((s, p) => s + p.totalOrders, 0),
        totalComplete: stats.reduce((s, p) => s + p.completeOrders, 0),
        totalDeclined: stats.reduce((s, p) => s + p.declinedOrders, 0),
        totalAbandoned: stats.reduce((s, p) => s + p.abandonedOrders, 0),
        totalRevenue: stats.reduce((s, p) => s + p.revenue, 0),
        overallConversionRate: stats.reduce((s, p) => s + p.completeOrders, 0) / Math.max(stats.reduce((s, p) => s + p.totalOrders, 0), 1),
      },
    }, null, 2) + '\n',
  );
  console.log(`\n  Saved: scripts/cc-qa/store/page-conversion-stats.json`);

  return stats;
}

// ═══════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  console.log('\n' + '═'.repeat(80));
  console.log('  CC BACKFILL — Link Pages + Pull API Data + Conversion Stats');
  console.log('═'.repeat(80));

  try {
    // Step 1: Link orders to funnel pages
    const linked = await linkOrdersToPages(db);

    // Step 2: Pull responseType + declineReason from CC API
    const apiUpdated = await pullResponseTypes(db);

    // Step 3: Compute page-level conversion stats
    const stats = await computePageStats(db);

    console.log('\n' + '═'.repeat(80));
    console.log('  BACKFILL COMPLETE');
    console.log('═'.repeat(80));
    console.log(`  Orders linked to pages: ${linked}`);
    console.log(`  Orders updated from API: ${apiUpdated}`);
    console.log(`  Pages with stats: ${stats.length}`);
    console.log('═'.repeat(80) + '\n');
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
