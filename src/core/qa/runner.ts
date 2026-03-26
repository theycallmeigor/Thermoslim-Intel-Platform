/**
 * QA Runner — runs multi-resolution cascade analysis on CC orders.
 *
 * Importable by both:
 *   - The app (post-ingestion hook, BullMQ worker)
 *   - CLI scripts (scripts/cc-qa/researcher.ts)
 *
 * Pulls orders from DB, enriches with all dimensions, runs
 * 15min → 1h → 4h → daily streak detection, saves learnings.
 */
import { prisma } from '../../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

// Re-export Resolution type from engine for consumers
export type { Resolution } from '../../../scripts/cc-qa/engine';

const STORE_DIR = path.resolve(process.cwd(), 'scripts/cc-qa/store');

export interface QARunResult {
  eventsAnalyzed: number;
  activeEvents: number;
  correlationsFound: number;
  streaksFound: number;
  patternsLearned: number;
  totalLearnings: number;
  durationMs: number;
  topRisks: Array<{ field: string; value: string; failRate: number; lift: number; orders: number }>;
}

export interface QARunOptions {
  /** How many days back to analyze. Default: 10 */
  days?: number;
  /** If true, only run 1h resolution (faster, for webhook triggers). Default: false */
  quick?: boolean;
}

/**
 * Run the full QA analysis cascade.
 * Safe to call concurrently — uses file-based learnings with last-write-wins.
 */
export async function runQAAnalysis(options: QARunOptions = {}): Promise<QARunResult> {
  const start = Date.now();
  const days = options.days ?? 10;
  const quick = options.quick ?? false;

  // Dynamic import to avoid loading heavy script modules at app boot
  const [
    { buildWindows, detectStreaks, updateLearnings, exportFindings, saveLearnings, loadLearnings, saveFindings },
    { DEFAULT_QA_CONFIG },
  ] = await Promise.all([
    import('../../../scripts/cc-qa/engine'),
    import('../../../scripts/cc-qa/types'),
  ]);

  type CCEvent = import('../../../scripts/cc-qa/types').CCEvent;
  type QALearning = import('../../../scripts/cc-qa/types').QALearning;
  type Resolution = import('../../../scripts/cc-qa/engine').Resolution;

  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

  // Pull base events
  const baseOrders = await prisma.order.findMany({
    where: {
      source: { in: ['CHECKOUTCHAMP', 'MERGED'] },
      createdAt: { gte: from, lte: to },
    },
    select: {
      id: true, createdAt: true, orderTotal: true, status: true,
      paySource: true, responseType: true, declineReason: true,
      funnelReferenceId: true, funnelPageId: true, salesUrl: true,
      campaignName: true, campaignId: true,
      // New fields
      device: true, browser: true, geoState: true, geoCountry: true,
      cardType: true, avsResponse: true, cvvResponse: true,
      cardIsDebit: true, cardIsPrepaid: true, isDeclineSave: true,
      ccCustom1: true, ccCustom2: true, userAgent: true,
      items: { select: { name: true, merchantId: true, responseType: true }, take: 1 },
    },
    orderBy: { createdAt: 'asc' },
  });

  let events: CCEvent[] = baseOrders.map((o: any) => {
    const paySource = o.paySource || null;
    const status = o.status || 'PARTIAL';
    const isAbandon = (!paySource || paySource === 'unknown') && status === 'PARTIAL';

    // Derive device category
    const dev = (o.device || '').toLowerCase();
    let deviceCategory = 'unknown';
    if (dev.includes('mobile')) deviceCategory = 'mobile';
    else if (dev.includes('tablet')) deviceCategory = 'tablet';
    else if (dev.includes('desktop')) deviceCategory = 'desktop';

    // Derive checkout variant from slug
    const salesUrl = o.salesUrl || '';
    let checkoutVariant = 'other';
    if (salesUrl.includes('checkout2')) checkoutVariant = 'checkout2';
    else if (salesUrl.includes('secure-checkout')) checkoutVariant = 'secure-checkout';
    else if (salesUrl.includes('checkout-bsd')) checkoutVariant = 'bsd-checkout';
    else if (salesUrl.includes('checkout-v2')) checkoutVariant = 'checkout-v2';
    else if (salesUrl.includes('checkout')) checkoutVariant = 'checkout-classic';

    // Categorize decline reason
    const dr = (o.declineReason || '').toLowerCase();
    let declineReasonCategory = null;
    if (dr) {
      if (dr.includes('issuer') || dr.includes('declined')) declineReasonCategory = 'issuer_decline';
      else if (dr.includes('validation') || dr.includes('invalid')) declineReasonCategory = 'validation_error';
      else if (dr.includes('auth') && dr.includes('fail')) declineReasonCategory = 'auth_failure';
      else if (dr.includes('expired')) declineReasonCategory = 'expired';
      else declineReasonCategory = 'other';
    }

    return {
      timestamp: o.createdAt,
      orderId: o.id,
      status,
      paySource,
      funnelId: o.funnelReferenceId || null,
      campaignName: o.campaignName || o.campaignId || null,
      orderTotal: o.orderTotal || 0,
      product: o.items[0]?.name || null,
      isAbandon,
      meta: {
        responseType: o.responseType || null,
        declineReason: o.declineReason || null,
        funnelPageId: o.funnelPageId || null,
        salesUrl: o.salesUrl || null,
        device: o.device, browser: o.browser,
        geoState: o.geoState, geoCountry: o.geoCountry,
        deviceCategory,
        cardType: o.cardType, avsResponse: o.avsResponse, cvvResponse: o.cvvResponse,
        cardIsDebit: o.cardIsDebit, cardIsPrepaid: o.cardIsPrepaid,
        isDeclineSave: o.isDeclineSave,
        declineReasonCategory,
        ccCustom1: o.ccCustom1, ccCustom2: o.ccCustom2,
        checkoutVariant,
      },
    };
  });

  const activeEvents = events.filter((e) => !e.isAbandon).length;

  // Multi-resolution cascade (or single for quick mode)
  const resolutions: Resolution[] = quick ? ['1h'] : ['15min', '1h', '4h', '1d'];

  const resConfigs: Record<string, typeof DEFAULT_QA_CONFIG> = {
    '15min': { ...DEFAULT_QA_CONFIG, minOrdersPerHour: 1, minStreakHours: 2, streakStartThreshold: 0.20 },
    '1h': { ...DEFAULT_QA_CONFIG, minOrdersPerHour: 1, minStreakHours: 1, streakStartThreshold: 0.15 },
    '4h': { ...DEFAULT_QA_CONFIG, minOrdersPerHour: 2, minStreakHours: 1, streakStartThreshold: 0.12 },
    '1d': { ...DEFAULT_QA_CONFIG, minOrdersPerHour: 3, minStreakHours: 1, streakStartThreshold: 0.10 },
  };

  let learnings = loadLearnings();
  let totalStreaks = 0;
  const allCorrelations: Array<{ field: string; value: string; failRate: number; lift: number; totalOrders: number; significance: string }> = [];

  // Analyze correlations once (same events at all resolutions)
  const correlations = analyzeDimensions(events);
  for (const c of correlations) {
    allCorrelations.push({
      field: c.field, value: c.value, failRate: c.failRate,
      lift: c.lift, totalOrders: c.totalOrders, significance: c.significance,
    });
  }

  // Run cascade
  for (const resolution of resolutions) {
    const windows = buildWindows(events, resolution);
    const cfg = resConfigs[resolution] || DEFAULT_QA_CONFIG;
    const streaks = detectStreaks(windows, cfg, learnings);
    totalStreaks += streaks.length;
    learnings = updateLearnings(streaks, windows, learnings);
  }

  // Learn from correlations
  learnings = learnFromCorrelations(correlations, learnings);

  // Save — wrapped in try/catch: Vercel serverless has a read-only fs outside /tmp
  try {
    saveLearnings(learnings);
    const findings = exportFindings(
      detectStreaks(buildWindows(events, '1h'), DEFAULT_QA_CONFIG, learnings),
      learnings,
    );
    saveFindings(findings);

    if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(STORE_DIR, 'correlations.json'),
      JSON.stringify(allCorrelations, null, 2) + '\n',
    );
  } catch {
    // File persistence is for local CLI scripts only — non-fatal in serverless
  }

  const topRisks = allCorrelations
    .filter((c) => c.significance === 'HIGH' && c.lift > 1)
    .sort((a, b) => b.lift - a.lift)
    .slice(0, 10)
    .map((c) => ({ field: c.field, value: c.value, failRate: c.failRate, lift: c.lift, orders: c.totalOrders }));

  return {
    eventsAnalyzed: events.length,
    activeEvents,
    correlationsFound: allCorrelations.length,
    streaksFound: totalStreaks,
    patternsLearned: learnings.filter((l) => l.type === 'pattern').length,
    totalLearnings: learnings.length,
    durationMs: Date.now() - start,
    topRisks,
  };
}

// ── Inline correlation analysis (extracted from researcher.ts) ──

interface DimensionCorrelation {
  field: string;
  value: string;
  totalOrders: number;
  failedOrders: number;
  failRate: number;
  baselineFailRate: number;
  lift: number;
  significance: 'HIGH' | 'MEDIUM' | 'LOW';
}

function analyzeDimensions(events: Array<{ status: string; isAbandon: boolean; meta?: Record<string, unknown> }>): DimensionCorrelation[] {
  const activeEvents = events.filter((e) => !e.isAbandon);
  const totalFailed = activeEvents.filter((e) => e.status === 'PARTIAL' || e.status === 'DECLINED').length;
  const baselineFailRate = activeEvents.length > 0 ? totalFailed / activeEvents.length : 0;

  const fieldValues = new Map<string, Map<string, { total: number; failed: number }>>();

  for (const e of activeEvents) {
    if (!e.meta) continue;
    const isFailed = e.status === 'PARTIAL' || e.status === 'DECLINED';
    for (const [field, rawValue] of Object.entries(e.meta)) {
      if (typeof rawValue === 'object' || rawValue === undefined) continue;
      const value = String(rawValue);
      if (value.length > 100) continue;
      if (!fieldValues.has(field)) fieldValues.set(field, new Map());
      const valMap = fieldValues.get(field)!;
      if (!valMap.has(value)) valMap.set(value, { total: 0, failed: 0 });
      const counts = valMap.get(value)!;
      counts.total++;
      if (isFailed) counts.failed++;
    }
  }

  const correlations: DimensionCorrelation[] = [];
  for (const [field, valMap] of Array.from(fieldValues.entries())) {
    for (const [value, counts] of Array.from(valMap.entries())) {
      if (counts.total < 5) continue;
      const failRate = counts.failed / counts.total;
      const lift = baselineFailRate > 0 ? failRate / baselineFailRate : 0;
      let significance: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (counts.total >= 20 && Math.abs(lift - 1) > 0.5) significance = 'HIGH';
      else if (counts.total >= 10 && Math.abs(lift - 1) > 0.3) significance = 'MEDIUM';
      if (significance !== 'LOW') {
        correlations.push({ field, value: value.slice(0, 60), totalOrders: counts.total, failedOrders: counts.failed, failRate, baselineFailRate, lift, significance });
      }
    }
  }

  // Filter survivorship bias
  return correlations.filter((c) => {
    if (c.field === 'hasUpsells' && c.value === 'true') return false;
    if (c.field === 'ccOrderType' && c.value === 'RECURRING') return false;
    if (c.field === 'responseType' && c.value === 'SUCCESS') return false;
    if (c.field === 'pageType' && c.value === 'upsell' && c.lift < 1) return false;
    if (c.field === 'declineReasonCategory' && c.lift > 1) return false;
    if (c.field === 'declineReasonText' && c.lift > 1) return false;
    if (c.field === 'isDeclineSave' && c.value === 'true') return false;
    return true;
  }).sort((a, b) => Math.abs(b.lift - 1) - Math.abs(a.lift - 1));
}

function learnFromCorrelations(correlations: DimensionCorrelation[], learnings: any[]): any[] {
  const now = new Date().toISOString();
  for (const c of correlations) {
    if (c.significance !== 'HIGH') continue;
    const matchIdx = learnings.findIndex((l: any) =>
      l.type === 'correlation' && l.pattern.dimension === c.field && l.pattern.value === c.value,
    );
    if (matchIdx >= 0) {
      learnings[matchIdx].confirmations++;
      learnings[matchIdx].lastSeen = now;
      learnings[matchIdx].pattern.baseline = c.failRate;
      if (learnings[matchIdx].confirmations >= 3) learnings[matchIdx].exportToTraining = true;
    } else {
      learnings.push({
        id: `corr-${c.field}-${c.value.slice(0, 12)}-${Date.now()}`,
        discoveredAt: now, type: 'correlation',
        description: `${c.field}=${c.value}: ${(c.failRate * 100).toFixed(0)}% fail (${c.lift.toFixed(1)}x baseline)`,
        pattern: { dimension: c.field, value: c.value, metric: 'failRate', baseline: c.failRate, alertThreshold: c.failRate * 0.8 },
        confirmations: 1, lastSeen: now, exportToTraining: false,
      });
    }
  }
  return learnings;
}
