/**
 * CC QA Autoresearcher
 *
 * Discovers relevant fields in the database, enriches CC events with
 * additional dimensions, feeds them to the QA learner, and iterates
 * until patterns stabilize.
 *
 * Runs in rounds:
 *   Round 1: Base fields (what we had)
 *   Round 2: + responseType, ipAddress
 *   Round 3: + Attribution (userAgent, utm)
 *   Round 4: + FunnelEvent (step-level conversion)
 *   Round 5: + SubscriptionEvent (decline reasons)
 *   Round 6: + RevenueEvent (chargebacks, refunds)
 *   Round 7: + PageAnalytics (UX signals)
 *
 * Each round enriches events, runs streak detection, updates learnings,
 * and checks if new dimensions improved signal. Stops when no new
 * patterns discovered for 2 consecutive rounds.
 *
 * Usage:
 *   npx tsx scripts/cc-qa/researcher.ts
 *   npx tsx scripts/cc-qa/researcher.ts --rounds=3    # limit rounds
 *   npx tsx scripts/cc-qa/researcher.ts --days=30     # last 30 days
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

import {
  buildWindows, buildHourlyWindows, detectStreaks, updateLearnings,
  exportFindings, saveLearnings, loadLearnings, saveFindings,
} from './engine';
import type { Resolution } from './engine';
import type { CCEvent, HourlyWindow, FailureStreak, QALearning, TrainingFinding } from './types';
import { DEFAULT_QA_CONFIG } from './types';

const STORE_DIR = path.resolve(__dirname, 'store');

// ═══════════════════════════════════════════════════════════
//  ENRICHMENT LAYERS — each adds new dimensions to events
// ═══════════════════════════════════════════════════════════

interface EnrichmentLayer {
  name: string;
  description: string;
  /** Fields this layer adds to CCEvent.meta */
  fields: string[];
  /** Pull enrichment data and merge into events */
  enrich(db: any, events: CCEvent[]): Promise<CCEvent[]>;
}

const LAYERS: EnrichmentLayer[] = [
  // ── Layer 1: Response type + IP ──
  {
    name: 'response-type',
    description: 'Payment response details (HARD_DECLINE vs SOFT_DECLINE vs PENDING)',
    fields: ['responseType', 'ipAddress', 'ccOrderType', 'hasUpsells', 'couponCode'],
    async enrich(db, events) {
      const orderIds = events.map((e) => e.orderId);
      const orders = await db.order.findMany({
        where: { id: { in: orderIds } },
        select: {
          id: true,
          responseType: true,
          ipAddress: true,
          ccOrderType: true,
          hasUpsells: true,
          couponCode: true,
        },
      });
      const orderMap = new Map(orders.map((o: any) => [o.id, o]));

      return events.map((e) => {
        const o = orderMap.get(e.orderId);
        if (!o) return e;
        return {
          ...e,
          meta: {
            ...e.meta,
            responseType: o.responseType,
            ipAddress: o.ipAddress,
            ccOrderType: o.ccOrderType,
            hasUpsells: o.hasUpsells,
            couponCode: o.couponCode,
          },
        };
      });
    },
  },

  // ── Layer 2: Funnel page data ──
  {
    name: 'funnel-page',
    description: 'Page-level funnel data — which page the order landed on, page type, conversion context',
    fields: ['pageSlug', 'pageType', 'funnelName', 'checkoutVariant'],
    async enrich(db, events) {
      // Get all funnel page IDs from events
      const pageIds = [...new Set(events.map((e) => e.meta?.funnelPageId).filter(Boolean))];
      if (pageIds.length === 0) return events;

      const pages = await db.funnelPage.findMany({
        where: { id: { in: pageIds } },
        include: { funnel: true },
      });
      const pageMap = new Map(pages.map((p: any) => [p.id, p]));

      return events.map((e) => {
        const pageId = e.meta?.funnelPageId;
        if (!pageId) return e;
        const page = pageMap.get(pageId);
        if (!page) return e;

        // Derive checkout variant from slug (e.g., checkout2 vs secure-checkout vs checkout-bsd-quiz)
        const slug = page.slug || page.ccPageId || '';
        let checkoutVariant = 'other';
        if (slug.includes('checkout2')) checkoutVariant = 'checkout2';
        else if (slug.includes('secure-checkout')) checkoutVariant = 'secure-checkout';
        else if (slug.includes('checkout-bsd')) checkoutVariant = 'bsd-checkout';
        else if (slug.includes('checkout-v2')) checkoutVariant = 'checkout-v2';
        else if (slug.includes('checkout')) checkoutVariant = 'checkout-classic';
        else if (slug.includes('special-offer') || slug.includes('1time-special')) checkoutVariant = 'upsell';

        return {
          ...e,
          meta: {
            ...e.meta,
            pageSlug: slug,
            pageType: page.pageType || 'other',
            funnelName: page.funnel?.name || 'unknown',
            checkoutVariant,
          },
        };
      });
    },
  },

  // ── Layer 3: Browser / Device / Geo (from browserDetails) ──
  {
    name: 'browser-device',
    description: 'Browser, device type, geo location from CC browserDetails',
    fields: ['device', 'browser', 'geoState', 'geoCountry', 'deviceCategory'],
    async enrich(db, events) {
      const orderIds = events.map((e) => e.orderId);
      const orders = await db.order.findMany({
        where: { id: { in: orderIds } },
        select: {
          id: true,
          device: true,
          browser: true,
          geoState: true,
          geoCountry: true,
        },
      });
      const orderMap = new Map(orders.map((o: any) => [o.id, o]));

      return events.map((e) => {
        const o = orderMap.get(e.orderId);
        if (!o) return e;
        // Derive device category
        const dev = (o.device || '').toLowerCase();
        let deviceCategory = 'unknown';
        if (dev.includes('mobile')) deviceCategory = 'mobile';
        else if (dev.includes('tablet')) deviceCategory = 'tablet';
        else if (dev.includes('desktop')) deviceCategory = 'desktop';

        return {
          ...e,
          meta: {
            ...e.meta,
            device: o.device,
            browser: o.browser,
            geoState: o.geoState,
            geoCountry: o.geoCountry,
            deviceCategory,
          },
        };
      });
    },
  },

  // ── Layer 4: Card / AVS / CVV / Payment verification ──
  {
    name: 'payment-verification',
    description: 'Card type, AVS/CVV response, debit/prepaid flags, decline reason',
    fields: ['cardType', 'avsResponse', 'cvvResponse', 'cardIsDebit', 'cardIsPrepaid', 'declineReasonCategory', 'isDeclineSave'],
    async enrich(db, events) {
      const orderIds = events.map((e) => e.orderId);
      const orders = await db.order.findMany({
        where: { id: { in: orderIds } },
        select: {
          id: true,
          cardType: true,
          avsResponse: true,
          cvvResponse: true,
          cardIsDebit: true,
          cardIsPrepaid: true,
          isDeclineSave: true,
          declineReason: true,
        },
      });
      const orderMap = new Map(orders.map((o: any) => [o.id, o]));

      return events.map((e) => {
        const o = orderMap.get(e.orderId);
        if (!o) return e;
        // Categorize decline reasons
        const dr = (o.declineReason || '').toLowerCase();
        let declineReasonCategory = null;
        if (dr) {
          if (dr.includes('issuer') || dr.includes('declined')) declineReasonCategory = 'issuer_decline';
          else if (dr.includes('validation') || dr.includes('invalid')) declineReasonCategory = 'validation_error';
          else if (dr.includes('auth') && dr.includes('fail')) declineReasonCategory = 'auth_failure';
          else if (dr.includes('expired')) declineReasonCategory = 'expired';
          else if (dr.includes('fraud') || dr.includes('restrict')) declineReasonCategory = 'fraud_flag';
          else if (dr.includes('internal') || dr.includes('error')) declineReasonCategory = 'processor_error';
          else declineReasonCategory = 'other';
        }

        return {
          ...e,
          meta: {
            ...e.meta,
            cardType: o.cardType,
            avsResponse: o.avsResponse,
            cvvResponse: o.cvvResponse,
            cardIsDebit: o.cardIsDebit,
            cardIsPrepaid: o.cardIsPrepaid,
            isDeclineSave: o.isDeclineSave,
            declineReasonText: o.declineReason ? o.declineReason.slice(0, 60) : null,
            declineReasonCategory,
          },
        };
      });
    },
  },

  // ── Layer 5: CC Custom fields (checkout variant from ccCustom2) ──
  {
    name: 'cc-custom-fields',
    description: 'CC custom fields — ccCustom1 (brand), ccCustom2 (checkout variant name)',
    fields: ['ccCustom1', 'ccCustom2'],
    async enrich(db, events) {
      const orderIds = events.map((e) => e.orderId);
      const orders = await db.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, ccCustom1: true, ccCustom2: true },
      });
      const orderMap = new Map(orders.map((o: any) => [o.id, o]));

      return events.map((e) => {
        const o = orderMap.get(e.orderId);
        if (!o) return e;
        return {
          ...e,
          meta: {
            ...e.meta,
            ccCustom1: o.ccCustom1,
            ccCustom2: o.ccCustom2,
          },
        };
      });
    },
  },

  // ── Layer 6: Attribution (traffic source) ──
  {
    name: 'attribution',
    description: 'Traffic source, UTM params, user agent, referer',
    fields: ['utmSource', 'utmMedium', 'utmCampaign', 'userAgent', 'httpReferer', 'pubId', 'subAffId'],
    async enrich(db, events) {
      const orderIds = events.map((e) => e.orderId);
      const attrs = await db.attribution.findMany({
        where: { orderId: { in: orderIds } },
        select: {
          orderId: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          userAgent: true,
          httpReferer: true,
          pubId: true,
          subAffId: true,
        },
      });
      const attrMap = new Map(attrs.map((a: any) => [a.orderId, a]));

      return events.map((e) => {
        const a = attrMap.get(e.orderId);
        if (!a) return e;
        return {
          ...e,
          meta: {
            ...e.meta,
            utmSource: a.utmSource,
            utmMedium: a.utmMedium,
            utmCampaign: a.utmCampaign,
            userAgent: a.userAgent,
            httpReferer: a.httpReferer,
            pubId: a.pubId,
            subAffId: a.subAffId,
            // Derived: device type from user agent
            deviceType: classifyDevice(a.userAgent),
          },
        };
      });
    },
  },

  // ── Layer 7: Order items (product-level detail) ──
  {
    name: 'order-items',
    description: 'Item-level price, quantity, recurring status, product category',
    fields: ['itemPrice', 'itemQuantity', 'recurringStatus', 'billingCycle', 'productCategory', 'sku'],
    async enrich(db, events) {
      const orderIds = events.map((e) => e.orderId);
      const items = await db.orderItem.findMany({
        where: { orderId: { in: orderIds } },
        select: {
          orderId: true,
          price: true,
          quantity: true,
          recurringStatus: true,
          billingCycleNumber: true,
          productCategoryName: true,
          sku: true,
          name: true,
        },
      });

      const itemMap = new Map<string, any[]>();
      for (const item of items) {
        const arr = itemMap.get(item.orderId) ?? [];
        arr.push(item);
        itemMap.set(item.orderId, arr);
      }

      return events.map((e) => {
        const orderItems = itemMap.get(e.orderId) ?? [];
        const totalItems = orderItems.length;
        const hasRecurring = orderItems.some((i: any) => i.recurringStatus && i.recurringStatus !== 'CANCELLED');
        const maxBillingCycle = Math.max(0, ...orderItems.map((i: any) => i.billingCycleNumber || 0));
        const categories = [...new Set(orderItems.map((i: any) => i.productCategoryName).filter(Boolean))];
        const avgItemPrice = totalItems > 0 ? orderItems.reduce((s: number, i: any) => s + (i.price || 0), 0) / totalItems : 0;

        return {
          ...e,
          meta: {
            ...e.meta,
            totalItems,
            hasRecurring,
            maxBillingCycle,
            categories: categories.join(','),
            avgItemPrice,
            skus: orderItems.map((i: any) => i.sku).filter(Boolean).join(','),
          },
        };
      });
    },
  },

  // ── Layer 8: Funnel events (step-level conversion) ──
  {
    name: 'funnel-events',
    description: 'Funnel step tracking — which steps were accepted/declined',
    fields: ['funnelSteps', 'stepsAccepted', 'stepsDeclined', 'lastStep'],
    async enrich(db, events) {
      const orderIds = events.map((e) => e.orderId).filter(Boolean);
      const funnelEvents = await db.funnelEvent.findMany({
        where: { orderId: { in: orderIds } },
        select: {
          orderId: true,
          step: true,
          accepted: true,
          pageUrl: true,
        },
        orderBy: { occurredAt: 'asc' },
      });

      const funnelMap = new Map<string, any[]>();
      for (const fe of funnelEvents) {
        if (!fe.orderId) continue;
        const arr = funnelMap.get(fe.orderId) ?? [];
        arr.push(fe);
        funnelMap.set(fe.orderId, arr);
      }

      return events.map((e) => {
        const steps = funnelMap.get(e.orderId) ?? [];
        return {
          ...e,
          meta: {
            ...e.meta,
            funnelSteps: steps.length,
            stepsAccepted: steps.filter((s: any) => s.accepted === true).length,
            stepsDeclined: steps.filter((s: any) => s.accepted === false).length,
            lastStep: steps[steps.length - 1]?.step || null,
            lastStepUrl: steps[steps.length - 1]?.pageUrl || null,
          },
        };
      });
    },
  },

  // ── Layer 9: Upsell path ──
  {
    name: 'upsell-path',
    description: 'Upsell acceptance/decline and revenue impact',
    fields: ['upsellsAccepted', 'upsellsDeclined', 'revenueAdded'],
    async enrich(db, events) {
      const orderIds = events.map((e) => e.orderId);
      const paths = await db.upsellPath.findMany({
        where: { orderId: { in: orderIds } },
        select: {
          orderId: true,
          upsellsAccepted: true,
          upsellsDeclined: true,
          revenueAdded: true,
        },
      });
      const pathMap = new Map(paths.map((p: any) => [p.orderId, p]));

      return events.map((e) => {
        const p = pathMap.get(e.orderId);
        if (!p) return e;
        return {
          ...e,
          meta: {
            ...e.meta,
            upsellsAccepted: p.upsellsAccepted,
            upsellsDeclined: p.upsellsDeclined,
            revenueAdded: p.revenueAdded,
          },
        };
      });
    },
  },

  // ── Layer 10: Revenue events (chargebacks, refunds) ──
  {
    name: 'revenue-events',
    description: 'Chargebacks, refund reasons, transaction history',
    fields: ['hasChargeback', 'chargebackReason', 'refundReason', 'revenueEventCount'],
    async enrich(db, events) {
      const orderIds = events.map((e) => e.orderId);
      const revEvents = await db.revenueEvent.findMany({
        where: { orderId: { in: orderIds } },
        select: {
          orderId: true,
          eventType: true,
          chargebackReasonCode: true,
          refundReason: true,
        },
      });

      const revMap = new Map<string, any[]>();
      for (const re of revEvents) {
        if (!re.orderId) continue;
        const arr = revMap.get(re.orderId) ?? [];
        arr.push(re);
        revMap.set(re.orderId, arr);
      }

      return events.map((e) => {
        const revs = revMap.get(e.orderId) ?? [];
        const chargebacks = revs.filter((r: any) => r.eventType === 'CHARGEBACK');
        const refunds = revs.filter((r: any) => r.eventType === 'REFUND');
        return {
          ...e,
          meta: {
            ...e.meta,
            revenueEventCount: revs.length,
            hasChargeback: chargebacks.length > 0,
            chargebackReason: chargebacks[0]?.chargebackReasonCode || null,
            hasRefund: refunds.length > 0,
            refundReason: refunds[0]?.refundReason || null,
          },
        };
      });
    },
  },

  // ── Layer 11: Customer history ──
  {
    name: 'customer-history',
    description: 'Customer order history, total revenue, first/last order timing',
    fields: ['customerTotalOrders', 'customerTotalRevenue', 'isFirstOrder', 'daysSinceFirstOrder'],
    async enrich(db, events) {
      // Get unique customer IDs from orders
      const orderIds = events.map((e) => e.orderId);
      const orders = await db.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, customerId: true },
      });
      const orderCustomerMap = new Map(orders.map((o: any) => [o.id, o.customerId]));
      const customerIds = [...new Set(orders.map((o: any) => o.customerId).filter(Boolean))];

      const customers = await db.customer.findMany({
        where: { id: { in: customerIds } },
        select: {
          id: true,
          totalOrders: true,
          totalRevenue: true,
          firstOrderAt: true,
        },
      });
      const custMap = new Map(customers.map((c: any) => [c.id, c]));

      return events.map((e) => {
        const custId = orderCustomerMap.get(e.orderId);
        const cust = custId ? custMap.get(custId) : null;
        if (!cust) return e;

        const daysSinceFirst = cust.firstOrderAt
          ? Math.floor((e.timestamp.getTime() - cust.firstOrderAt.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        return {
          ...e,
          meta: {
            ...e.meta,
            customerTotalOrders: cust.totalOrders,
            customerTotalRevenue: cust.totalRevenue,
            isFirstOrder: (cust.totalOrders || 0) <= 1,
            daysSinceFirstOrder: daysSinceFirst,
          },
        };
      });
    },
  },
];

// ═══════════════════════════════════════════════════════════
//  DIMENSION ANALYSIS — find correlations with failures
// ═══════════════════════════════════════════════════════════

interface DimensionCorrelation {
  field: string;
  value: string;
  totalOrders: number;
  failedOrders: number;
  failRate: number;
  baselineFailRate: number;
  lift: number;  // failRate / baselineFailRate
  significance: 'HIGH' | 'MEDIUM' | 'LOW';
}

function analyzeDimensions(events: CCEvent[]): DimensionCorrelation[] {
  // Filter out abandoned checkouts — only analyze real payment attempts
  const activeEvents = events.filter((e) => !e.isAbandon);
  const totalFailed = activeEvents.filter((e) => e.status === 'PARTIAL' || e.status === 'DECLINED').length;
  const baselineFailRate = activeEvents.length > 0 ? totalFailed / activeEvents.length : 0;

  const correlations: DimensionCorrelation[] = [];

  // Extract all meta fields and their values
  const fieldValues = new Map<string, Map<string, { total: number; failed: number }>>();

  for (const e of activeEvents) {
    if (!e.meta) continue;
    const isFailed = e.status === 'PARTIAL' || e.status === 'DECLINED';

    for (const [field, rawValue] of Object.entries(e.meta)) {
      // Skip non-categorical fields
      if (typeof rawValue === 'object' || rawValue === undefined) continue;

      const value = String(rawValue);
      if (value.length > 100) continue; // skip long strings like full user agents

      if (!fieldValues.has(field)) fieldValues.set(field, new Map());
      const valMap = fieldValues.get(field)!;
      if (!valMap.has(value)) valMap.set(value, { total: 0, failed: 0 });
      const counts = valMap.get(value)!;
      counts.total++;
      if (isFailed) counts.failed++;
    }
  }

  // Compute correlations
  for (const [field, valMap] of fieldValues) {
    for (const [value, counts] of valMap) {
      if (counts.total < 5) continue; // need minimum sample size

      const failRate = counts.failed / counts.total;
      const lift = baselineFailRate > 0 ? failRate / baselineFailRate : 0;

      // Significance based on sample size and lift
      let significance: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (counts.total >= 20 && Math.abs(lift - 1) > 0.5) significance = 'HIGH';
      else if (counts.total >= 10 && Math.abs(lift - 1) > 0.3) significance = 'MEDIUM';

      if (significance !== 'LOW') {
        correlations.push({
          field,
          value: value.slice(0, 60),
          totalOrders: counts.total,
          failedOrders: counts.failed,
          failRate,
          baselineFailRate,
          lift,
          significance,
        });
      }
    }
  }

  // Filter out known survivorship-bias and tautological correlations:
  // - hasUpsells=true: upsells are post-purchase, so success causes upsells, not vice versa
  // - ccOrderType=RECURRING: recurring only fires on customers with valid payment on file
  // - responseType=SUCCESS: tautological — SUCCESS means the order completed
  // - pageType=upsell with low fail: upsells only show after successful checkout
  // - declineReasonCategory != null with high fail: tautological — decline reason exists because it failed
  // - isDeclineSave=true with high fail: decline-save orders are inherently declined
  const filtered = correlations.filter((c) => {
    if (c.field === 'hasUpsells' && c.value === 'true') return false;
    if (c.field === 'ccOrderType' && c.value === 'RECURRING') return false;
    if (c.field === 'responseType' && c.value === 'SUCCESS') return false;
    if (c.field === 'pageType' && c.value === 'upsell' && c.lift < 1) return false;
    // Tautological: decline reason only populated on failed orders
    if (c.field === 'declineReasonCategory' && c.lift > 1) return false;
    if (c.field === 'declineReasonText' && c.lift > 1) return false;
    if (c.field === 'isDeclineSave' && c.value === 'true') return false;
    return true;
  });

  return filtered.sort((a, b) => Math.abs(b.lift - 1) - Math.abs(a.lift - 1));
}

// ═══════════════════════════════════════════════════════════
//  MULTI-RESOLUTION CASCADE
//  15min → 1h → 4h → 1d
//  Each resolution enriches all layers, finds correlations,
//  detects streaks. Learnings from finer resolution feed into
//  coarser resolution as priors.
// ═══════════════════════════════════════════════════════════

const RESOLUTIONS: Resolution[] = ['15min', '1h', '4h', '1d'];
const RESOLUTION_LABELS: Record<Resolution, string> = {
  '15min': '15-Minute',
  '1h':    '1-Hour',
  '4h':    '4-Hour',
  '1d':    'Daily',
};

// Adjusted config per resolution — finer windows need lower order thresholds
const RESOLUTION_CONFIGS: Record<Resolution, typeof DEFAULT_QA_CONFIG> = {
  '15min': { ...DEFAULT_QA_CONFIG, minOrdersPerHour: 1, minStreakHours: 2, streakStartThreshold: 0.20 },
  '1h':    { ...DEFAULT_QA_CONFIG, minOrdersPerHour: 1, minStreakHours: 1, streakStartThreshold: 0.15 },
  '4h':    { ...DEFAULT_QA_CONFIG, minOrdersPerHour: 2, minStreakHours: 1, streakStartThreshold: 0.12 },
  '1d':    { ...DEFAULT_QA_CONFIG, minOrdersPerHour: 3, minStreakHours: 1, streakStartThreshold: 0.10 },
};

interface ResolutionResult {
  resolution: Resolution;
  windows: number;
  streaks: number;
  correlations: DimensionCorrelation[];
  newPatterns: number;
  totalPatterns: number;
}

async function main() {
  const args = process.argv.slice(2);
  const daysArg = args.find((a) => a.startsWith('--days='));
  const days = daysArg ? parseInt(daysArg.split('=')[1]) : 0;

  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  const to = new Date();
  const from = days > 0
    ? new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
    : new Date('2025-01-01');

  console.log('\n' + '═'.repeat(120));
  console.log('  CC QA AUTORESEARCHER — Multi-Resolution Cascade');
  console.log('  15min → 1h → 4h → Daily — learnings feed forward');
  console.log('═'.repeat(120));
  console.log(`  Range: ${from.toISOString().slice(0, 10)} → ${to.toISOString().slice(0, 10)}`);
  console.log(`  Layers: ${LAYERS.map((l) => l.name).join(', ')}`);
  console.log(`  Resolutions: ${RESOLUTIONS.join(' → ')}\n`);

  // ── Pull base CC events ──
  const baseOrders = await db.order.findMany({
    where: {
      source: 'CHECKOUTCHAMP',
      createdAt: { gte: from, lte: to },
    },
    select: {
      id: true,
      createdAt: true,
      orderTotal: true,
      status: true,
      paySource: true,
      responseType: true,
      declineReason: true,
      funnelReferenceId: true,
      funnelPageId: true,
      salesUrl: true,
      campaignName: true,
      campaignId: true,
      items: { select: { name: true }, take: 1 },
    },
    orderBy: { createdAt: 'asc' },
  });

  let events: CCEvent[] = baseOrders.map((o: any) => {
    const paySource = o.paySource || null;
    const status = o.status || 'PARTIAL';
    const isAbandon = (!paySource || paySource === 'unknown') && status === 'PARTIAL';
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
      },
    };
  });

  const abandons = events.filter((e) => e.isAbandon).length;
  console.log(`  Base events: ${events.length} (${events.length - abandons} active, ${abandons} abandoned)`);

  // ── Enrich all layers first (once) ──
  console.log('\n  Enriching all layers...');
  for (const layer of LAYERS) {
    try {
      events = await layer.enrich(db, events);
      console.log(`    ✓ ${layer.name}: +${layer.fields.length} fields`);
    } catch (err: any) {
      console.log(`    ✗ ${layer.name}: ${err.message} (skipped)`);
    }
  }

  // ── Run multi-resolution cascade ──
  let priorLearnings = loadLearnings();
  const allCorrelations: DimensionCorrelation[] = [];
  const resolutionResults: ResolutionResult[] = [];

  for (const resolution of RESOLUTIONS) {
    const resConfig = RESOLUTION_CONFIGS[resolution];
    const resStart = Date.now();

    console.log('\n' + '▓'.repeat(120));
    console.log(`  RESOLUTION: ${RESOLUTION_LABELS[resolution]} (${resolution})`);
    console.log('▓'.repeat(120));

    // Build windows at this resolution
    const windows = buildWindows(events, resolution);
    const nonEmpty = windows.filter((w) => w.totalOrders > 0).length;
    console.log(`  Windows: ${windows.length} total, ${nonEmpty} with orders`);

    // Detect streaks at this resolution
    const streaks = detectStreaks(windows, resConfig, priorLearnings);
    console.log(`  Streaks detected: ${streaks.length}`);

    if (streaks.length > 0) {
      console.log('\n  STREAKS:');
      for (const s of streaks.slice(0, 10)) {
        console.log(`    ${s.startWindow} → ${s.endWindow}: ${(s.failRate * 100).toFixed(0)}% fail (${s.totalFailures}/${s.totalOrders}) [${s.severity}] ${s.fingerprint.primaryDimension}=${s.fingerprint.primaryValue}`);
      }
    }

    // Analyze correlations at this resolution's granularity
    const correlations = analyzeDimensions(events);
    const newCorrelations = correlations.filter((c) => {
      // Only keep correlations not already found at a finer resolution
      return !allCorrelations.some((ac) => ac.field === c.field && ac.value === c.value);
    });

    if (newCorrelations.length > 0) {
      console.log(`\n  NEW CORRELATIONS (${newCorrelations.length}):`);
      for (const c of newCorrelations.slice(0, 12)) {
        const dir = c.lift > 1 ? '↑' : '↓';
        const icon = c.significance === 'HIGH' ? '🔴' : '🟡';
        console.log(`    ${icon} ${c.field}=${c.value}: ${(c.failRate * 100).toFixed(0)}% fail (n=${c.totalOrders}) — ${c.lift.toFixed(1)}x ${dir}`);
      }
    }
    allCorrelations.push(...newCorrelations);

    // Update learnings from this resolution
    const prevPatterns = priorLearnings.filter((l) => l.type === 'pattern').length;
    priorLearnings = updateLearnings(streaks, windows, priorLearnings);
    priorLearnings = learnFromCorrelations(correlations, priorLearnings);
    const newPatterns = priorLearnings.filter((l) => l.type === 'pattern').length - prevPatterns;
    const totalPatterns = priorLearnings.filter((l) => l.type === 'pattern').length;

    console.log(`\n  New patterns: ${newPatterns} | Total patterns: ${totalPatterns} | Learnings carried forward: ${priorLearnings.length}`);
    console.log(`  Resolution time: ${((Date.now() - resStart) / 1000).toFixed(1)}s`);

    resolutionResults.push({
      resolution,
      windows: nonEmpty,
      streaks: streaks.length,
      correlations: newCorrelations,
      newPatterns,
      totalPatterns,
    });
  }

  // ── Save everything ──
  saveLearnings(priorLearnings);
  const findings = exportFindings(
    detectStreaks(buildWindows(events, '1h'), DEFAULT_QA_CONFIG, priorLearnings),
    priorLearnings,
  );
  saveFindings(findings);

  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(STORE_DIR, 'correlations.json'),
    JSON.stringify(allCorrelations, null, 2) + '\n',
  );

  // ═══════════════════════════════════════════════════════════
  //  FINAL REPORT
  // ═══════════════════════════════════════════════════════════
  console.log('\n\n' + '═'.repeat(120));
  console.log('  AUTORESEARCHER — MULTI-RESOLUTION FINAL REPORT');
  console.log('═'.repeat(120));

  console.log('\n  CASCADE SUMMARY:');
  console.log('  ' + 'Resolution'.padEnd(12) + 'Windows'.padStart(8) + 'Streaks'.padStart(9) + 'New Corr'.padStart(10) + 'New Pat'.padStart(9) + 'Total Pat'.padStart(11));
  console.log('  ' + '-'.repeat(59));
  for (const r of resolutionResults) {
    console.log(`  ${r.resolution.padEnd(12)} ${String(r.windows).padStart(7)} ${String(r.streaks).padStart(8)} ${String(r.correlations.length).padStart(9)} ${String(r.newPatterns).padStart(8)} ${String(r.totalPatterns).padStart(10)}`);
  }

  console.log('\n  TOP CORRELATIONS (all resolutions):');
  const topAll = allCorrelations
    .filter((c) => c.significance === 'HIGH')
    .sort((a, b) => Math.abs(b.lift - 1) - Math.abs(a.lift - 1))
    .slice(0, 20);

  for (const c of topAll) {
    const dir = c.lift > 1 ? '↑ RISK' : '↓ SAFE';
    console.log(`    ${c.field}=${c.value}: ${(c.failRate * 100).toFixed(0)}% fail (n=${c.totalOrders}) — ${c.lift.toFixed(1)}x baseline ${dir}`);
  }

  console.log('\n  LEARNED PATTERNS:');
  const patterns = priorLearnings.filter((l) => l.type === 'pattern').sort((a, b) => b.confirmations - a.confirmations);
  for (const p of patterns.slice(0, 15)) {
    const exported = p.exportToTraining ? ' → TRAINING' : '';
    console.log(`    ${p.pattern.dimension}=${p.pattern.value}: baseline ${(p.pattern.baseline * 100).toFixed(1)}% | confirmed ${p.confirmations}x${exported}`);
  }

  console.log(`\n  FILES SAVED:`);
  console.log(`    Learnings: scripts/cc-qa/store/learnings.json (${priorLearnings.length} entries)`);
  console.log(`    Correlations: scripts/cc-qa/store/correlations.json (${allCorrelations.length} entries)`);
  console.log(`    Training: scripts/cc-qa/store/training-findings.json (${findings.length} findings)`);
  console.log('═'.repeat(120) + '\n');

  await db.$disconnect();
}

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

/** Learn from high-significance correlations */
function learnFromCorrelations(correlations: DimensionCorrelation[], learnings: QALearning[]): QALearning[] {
  const now = new Date().toISOString();

  for (const c of correlations) {
    if (c.significance !== 'HIGH') continue;

    const matchIdx = learnings.findIndex((l) =>
      l.type === 'correlation' &&
      l.pattern.dimension === c.field &&
      l.pattern.value === c.value,
    );

    if (matchIdx >= 0) {
      learnings[matchIdx].confirmations++;
      learnings[matchIdx].lastSeen = now;
      learnings[matchIdx].pattern.baseline = c.failRate;
      if (learnings[matchIdx].confirmations >= 3) learnings[matchIdx].exportToTraining = true;
    } else {
      learnings.push({
        id: `corr-${c.field}-${c.value.slice(0, 12)}-${Date.now()}`,
        discoveredAt: now,
        type: 'correlation',
        description: `${c.field}=${c.value}: ${(c.failRate * 100).toFixed(0)}% fail (${c.lift.toFixed(1)}x baseline)`,
        pattern: {
          dimension: c.field,
          value: c.value,
          metric: 'failRate',
          baseline: c.failRate,
          alertThreshold: c.failRate * 0.8,
        },
        confirmations: 1,
        lastSeen: now,
        exportToTraining: false,
      });
    }
  }

  return learnings;
}

function classifyDevice(userAgent: string | null): string {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) return 'bot';
  return 'desktop';
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
