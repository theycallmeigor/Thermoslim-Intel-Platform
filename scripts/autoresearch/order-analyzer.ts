/**
 * Order-Level Pattern Analyzer
 *
 * Second-pass engine that digs into raw Order + OrderItem records on flagged days
 * to find micro-patterns the aggregate detector misses:
 *   - Order status distribution shifts (PARTIAL vs COMPLETE vs DECLINED)
 *   - Payment method gaps (e.g., no card orders, only PayPal/ApplePay)
 *   - Decline/error response type patterns
 *   - Product mix shifts
 *   - Campaign dropout (campaign present in baseline, absent on flagged day)
 *   - Time-of-day distribution changes
 *   - Order type shifts (NEW_SALE vs REBILL)
 */

import type { DetectorConfig } from './types';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface OrderRow {
  id: string;
  status: string;
  paySource: string | null;
  responseType: string | null;
  campaignId: string | null;
  campaignName: string | null;
  salesUrl: string | null;
  ccOrderType: string | null;
  orderTotal: number;
  createdAt: Date;
  items: OrderItemRow[];
}

export interface OrderItemRow {
  name: string;
  sku: string | null;
  price: number;
  quantity: number;
  productCategoryName: string | null;
  recurringStatus: string | null;
}

export interface PatternFinding {
  category: string;       // e.g., 'paymentMethod', 'orderStatus', 'declinePattern'
  finding: string;        // human-readable description
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  baselineDistribution: Record<string, number>;  // percentages
  flaggedDistribution: Record<string, number>;    // percentages
  deviationScore: number; // 0-1, higher = more anomalous
}

export interface OrderAnalysisResult {
  date: string;
  flaggedOrderCount: number;
  baselineOrderCount: number;
  baselineDays: number;
  findings: PatternFinding[];
}

// ── Distribution helpers ───────────────────────────────────────────────────────

function countBy<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function toPercentages(counts: Record<string, number>, total: number): Record<string, number> {
  const pcts: Record<string, number> = {};
  for (const [key, count] of Object.entries(counts)) {
    pcts[key] = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  }
  return pcts;
}

/**
 * Compare two distributions and return a deviation score (0-1).
 * Uses total variation distance: sum of |p_i - q_i| / 2 over all categories.
 */
function distributionDistance(
  baseline: Record<string, number>,
  flagged: Record<string, number>,
): number {
  const allKeys = new Set([...Object.keys(baseline), ...Object.keys(flagged)]);
  let totalDiff = 0;
  for (const key of allKeys) {
    const b = (baseline[key] ?? 0) / 100;
    const f = (flagged[key] ?? 0) / 100;
    totalDiff += Math.abs(b - f);
  }
  return Math.min(totalDiff / 2, 1); // TVD is bounded [0,1]
}

/**
 * Find categories that appeared in baseline but are completely absent on flagged day.
 */
function findMissingCategories(
  baselineCounts: Record<string, number>,
  flaggedCounts: Record<string, number>,
  minBaselinePct: number = 5, // only flag if it was at least 5% of baseline
  baselineTotal: number,
): string[] {
  const missing: string[] = [];
  for (const [key, count] of Object.entries(baselineCounts)) {
    const pct = (count / baselineTotal) * 100;
    if (pct >= minBaselinePct && !(key in flaggedCounts)) {
      missing.push(key);
    }
  }
  return missing;
}

/**
 * Find categories with large proportional shifts.
 */
function findLargeShifts(
  baselinePcts: Record<string, number>,
  flaggedPcts: Record<string, number>,
  minShiftPct: number = 15,
): Array<{ key: string; baselinePct: number; flaggedPct: number; shift: number }> {
  const shifts: Array<{ key: string; baselinePct: number; flaggedPct: number; shift: number }> = [];
  const allKeys = new Set([...Object.keys(baselinePcts), ...Object.keys(flaggedPcts)]);
  for (const key of allKeys) {
    const b = baselinePcts[key] ?? 0;
    const f = flaggedPcts[key] ?? 0;
    const shift = f - b;
    if (Math.abs(shift) >= minShiftPct) {
      shifts.push({ key, baselinePct: b, flaggedPct: f, shift });
    }
  }
  return shifts.sort((a, b) => Math.abs(b.shift) - Math.abs(a.shift));
}

// ── Hour bucket helper ─────────────────────────────────────────────────────────

function getHourBucket(date: Date): string {
  const hour = date.getUTCHours();
  if (hour < 6) return '00-06';
  if (hour < 12) return '06-12';
  if (hour < 18) return '12-18';
  return '18-24';
}

// ── Main analysis ──────────────────────────────────────────────────────────────

export function analyzeOrders(
  flaggedDayOrders: OrderRow[],
  baselineOrders: OrderRow[],
  date: string,
  baselineDays: number,
): OrderAnalysisResult {
  const findings: PatternFinding[] = [];
  const fTotal = flaggedDayOrders.length;
  const bTotal = baselineOrders.length;

  if (fTotal === 0) {
    return { date, flaggedOrderCount: 0, baselineOrderCount: bTotal, baselineDays, findings: [] };
  }

  // ── 1. Order status distribution ───────────────────────────────────────────
  {
    const fCounts = countBy(flaggedDayOrders, (o) => o.status);
    const bCounts = countBy(baselineOrders, (o) => o.status);
    const fPcts = toPercentages(fCounts, fTotal);
    const bPcts = toPercentages(bCounts, bTotal);
    const distance = distributionDistance(bPcts, fPcts);

    if (distance > 0.1) {
      const shifts = findLargeShifts(bPcts, fPcts, 10);
      const shiftDesc = shifts.map((s) =>
        `${s.key}: ${s.baselinePct.toFixed(1)}% → ${s.flaggedPct.toFixed(1)}% (${s.shift > 0 ? '+' : ''}${s.shift.toFixed(1)}pp)`
      ).join('; ');

      findings.push({
        category: 'orderStatus',
        finding: `Order status distribution shifted significantly. ${shiftDesc || 'Multiple small shifts across statuses.'}`,
        severity: distance > 0.3 ? 'CRITICAL' : 'WARNING',
        baselineDistribution: bPcts,
        flaggedDistribution: fPcts,
        deviationScore: distance,
      });
    }

    // Specific: high decline rate
    const declineRate = ((fCounts['DECLINED'] ?? 0) / fTotal) * 100;
    const baselineDeclineRate = bTotal > 0 ? ((bCounts['DECLINED'] ?? 0) / bTotal) * 100 : 0;
    if (declineRate > baselineDeclineRate + 15) {
      findings.push({
        category: 'declineRate',
        finding: `Decline rate spiked to ${declineRate.toFixed(1)}% (baseline: ${baselineDeclineRate.toFixed(1)}%). ${fCounts['DECLINED'] ?? 0} out of ${fTotal} orders declined.`,
        severity: declineRate > 40 ? 'CRITICAL' : 'WARNING',
        baselineDistribution: { declined: baselineDeclineRate },
        flaggedDistribution: { declined: declineRate },
        deviationScore: Math.min((declineRate - baselineDeclineRate) / 100, 1),
      });
    }

    // Specific: partial vs complete ratio shift
    const partialRate = ((fCounts['PARTIAL'] ?? 0) / fTotal) * 100;
    const baselinePartialRate = bTotal > 0 ? ((bCounts['PARTIAL'] ?? 0) / bTotal) * 100 : 0;
    if (Math.abs(partialRate - baselinePartialRate) > 15) {
      const dir = partialRate > baselinePartialRate ? 'increased' : 'decreased';
      findings.push({
        category: 'partialRatio',
        finding: `Partial order ratio ${dir}: ${partialRate.toFixed(1)}% vs baseline ${baselinePartialRate.toFixed(1)}%. This suggests ${dir === 'increased' ? 'checkout completion issues or upsell path problems' : 'fewer multi-step orders'}.`,
        severity: Math.abs(partialRate - baselinePartialRate) > 30 ? 'CRITICAL' : 'WARNING',
        baselineDistribution: { partial: baselinePartialRate, complete: 100 - baselinePartialRate },
        flaggedDistribution: { partial: partialRate, complete: 100 - partialRate },
        deviationScore: Math.min(Math.abs(partialRate - baselinePartialRate) / 100, 1),
      });
    }
  }

  // ── 2. Payment method distribution ─────────────────────────────────────────
  {
    const fCounts = countBy(flaggedDayOrders, (o) => o.paySource ?? 'UNKNOWN');
    const bCounts = countBy(baselineOrders, (o) => o.paySource ?? 'UNKNOWN');
    const fPcts = toPercentages(fCounts, fTotal);
    const bPcts = toPercentages(bCounts, bTotal);
    const distance = distributionDistance(bPcts, fPcts);

    if (distance > 0.1) {
      const missing = findMissingCategories(bCounts, fCounts, 5, bTotal);
      const shifts = findLargeShifts(bPcts, fPcts, 10);

      let desc = '';
      if (missing.length > 0) {
        desc += `Missing payment methods: ${missing.join(', ')}. `;
      }
      if (shifts.length > 0) {
        desc += shifts.map((s) =>
          `${s.key}: ${s.baselinePct.toFixed(1)}% → ${s.flaggedPct.toFixed(1)}%`
        ).join('; ');
      }

      findings.push({
        category: 'paymentMethod',
        finding: `Payment method distribution anomaly. ${desc || 'Multiple small shifts.'}`,
        severity: missing.length > 0 || distance > 0.3 ? 'CRITICAL' : 'WARNING',
        baselineDistribution: bPcts,
        flaggedDistribution: fPcts,
        deviationScore: distance,
      });
    }
  }

  // ── 3. Response type / decline patterns ────────────────────────────────────
  {
    const declinedFlagged = flaggedDayOrders.filter((o) => o.status === 'DECLINED');
    const declinedBaseline = baselineOrders.filter((o) => o.status === 'DECLINED');

    if (declinedFlagged.length >= 2) {
      const fCounts = countBy(declinedFlagged, (o) => o.responseType ?? 'UNKNOWN');
      const bCounts = countBy(declinedBaseline, (o) => o.responseType ?? 'UNKNOWN');
      const fPcts = toPercentages(fCounts, declinedFlagged.length);
      const bPcts = toPercentages(bCounts, declinedBaseline.length || 1);

      const hardDeclineRate = (fCounts['HARD_DECLINE'] ?? 0) / declinedFlagged.length * 100;
      const baselineHardRate = declinedBaseline.length > 0
        ? (bCounts['HARD_DECLINE'] ?? 0) / declinedBaseline.length * 100
        : 0;

      if (hardDeclineRate > baselineHardRate + 20 || declinedFlagged.length > declinedBaseline.length / Math.max(baselineDays, 1) * 3) {
        findings.push({
          category: 'declinePattern',
          finding: `Decline pattern anomaly. ${declinedFlagged.length} declines on flagged day (baseline avg: ${(declinedBaseline.length / Math.max(baselineDays, 1)).toFixed(1)}/day). Hard decline rate: ${hardDeclineRate.toFixed(0)}% (baseline: ${baselineHardRate.toFixed(0)}%).`,
          severity: hardDeclineRate > 70 ? 'CRITICAL' : 'WARNING',
          baselineDistribution: bPcts,
          flaggedDistribution: fPcts,
          deviationScore: Math.min(hardDeclineRate / 100, 1),
        });
      }
    }
  }

  // ── 4. Campaign activity ───────────────────────────────────────────────────
  {
    const fCounts = countBy(flaggedDayOrders, (o) => o.campaignName ?? o.campaignId ?? 'NONE');
    const bCounts = countBy(baselineOrders, (o) => o.campaignName ?? o.campaignId ?? 'NONE');
    const fPcts = toPercentages(fCounts, fTotal);
    const bPcts = toPercentages(bCounts, bTotal);

    const missing = findMissingCategories(bCounts, fCounts, 10, bTotal);
    if (missing.length > 0) {
      findings.push({
        category: 'campaignDropout',
        finding: `Campaigns active in baseline but absent on flagged day: ${missing.join(', ')}. This may indicate a paused or broken campaign.`,
        severity: 'WARNING',
        baselineDistribution: bPcts,
        flaggedDistribution: fPcts,
        deviationScore: 0.5,
      });
    }

    const distance = distributionDistance(bPcts, fPcts);
    if (distance > 0.15) {
      const shifts = findLargeShifts(bPcts, fPcts, 10);
      if (shifts.length > 0) {
        findings.push({
          category: 'campaignMix',
          finding: `Campaign mix shifted. ${shifts.map((s) => `${s.key}: ${s.baselinePct.toFixed(1)}% → ${s.flaggedPct.toFixed(1)}%`).join('; ')}`,
          severity: distance > 0.3 ? 'WARNING' : 'INFO',
          baselineDistribution: bPcts,
          flaggedDistribution: fPcts,
          deviationScore: distance,
        });
      }
    }
  }

  // ── 5. Product mix from OrderItems ─────────────────────────────────────────
  {
    const fItems = flaggedDayOrders.flatMap((o) => o.items);
    const bItems = baselineOrders.flatMap((o) => o.items);

    if (fItems.length > 0 && bItems.length > 0) {
      const fCounts = countBy(fItems, (i) => i.productCategoryName ?? i.name);
      const bCounts = countBy(bItems, (i) => i.productCategoryName ?? i.name);
      const fPcts = toPercentages(fCounts, fItems.length);
      const bPcts = toPercentages(bCounts, bItems.length);
      const distance = distributionDistance(bPcts, fPcts);

      if (distance > 0.15) {
        const shifts = findLargeShifts(bPcts, fPcts, 10);
        findings.push({
          category: 'productMix',
          finding: `Product mix shifted. ${shifts.map((s) => `${s.key}: ${s.baselinePct.toFixed(1)}% → ${s.flaggedPct.toFixed(1)}%`).join('; ') || 'Multiple small shifts.'}`,
          severity: distance > 0.3 ? 'WARNING' : 'INFO',
          baselineDistribution: bPcts,
          flaggedDistribution: fPcts,
          deviationScore: distance,
        });
      }

      // Recurring vs new item ratio
      const fRecurring = fItems.filter((i) => i.recurringStatus && i.recurringStatus !== 'TRIAL').length;
      const bRecurring = bItems.filter((i) => i.recurringStatus && i.recurringStatus !== 'TRIAL').length;
      const fRecPct = fItems.length > 0 ? (fRecurring / fItems.length) * 100 : 0;
      const bRecPct = bItems.length > 0 ? (bRecurring / bItems.length) * 100 : 0;

      if (Math.abs(fRecPct - bRecPct) > 15) {
        findings.push({
          category: 'recurringRatio',
          finding: `Recurring item ratio shifted: ${fRecPct.toFixed(1)}% vs baseline ${bRecPct.toFixed(1)}%. ${fRecPct > bRecPct ? 'More recurring orders than usual (rebill wave?)' : 'Fewer recurring orders (billing failures?)'}.`,
          severity: Math.abs(fRecPct - bRecPct) > 30 ? 'WARNING' : 'INFO',
          baselineDistribution: { recurring: bRecPct, new: 100 - bRecPct },
          flaggedDistribution: { recurring: fRecPct, new: 100 - fRecPct },
          deviationScore: Math.min(Math.abs(fRecPct - bRecPct) / 100, 1),
        });
      }
    }
  }

  // ── 6. Order type (CC: NEW_SALE vs REBILL) ─────────────────────────────────
  {
    const fWithType = flaggedDayOrders.filter((o) => o.ccOrderType);
    const bWithType = baselineOrders.filter((o) => o.ccOrderType);

    if (fWithType.length > 0 && bWithType.length > 0) {
      const fCounts = countBy(fWithType, (o) => o.ccOrderType!);
      const bCounts = countBy(bWithType, (o) => o.ccOrderType!);
      const fPcts = toPercentages(fCounts, fWithType.length);
      const bPcts = toPercentages(bCounts, bWithType.length);
      const distance = distributionDistance(bPcts, fPcts);

      if (distance > 0.15) {
        findings.push({
          category: 'orderType',
          finding: `CC order type mix shifted. ${findLargeShifts(bPcts, fPcts, 10).map((s) => `${s.key}: ${s.baselinePct.toFixed(1)}% → ${s.flaggedPct.toFixed(1)}%`).join('; ')}`,
          severity: distance > 0.3 ? 'WARNING' : 'INFO',
          baselineDistribution: bPcts,
          flaggedDistribution: fPcts,
          deviationScore: distance,
        });
      }
    }
  }

  // ── 7. Time-of-day distribution ────────────────────────────────────────────
  {
    const fCounts = countBy(flaggedDayOrders, (o) => getHourBucket(o.createdAt));
    const bCounts = countBy(baselineOrders, (o) => getHourBucket(o.createdAt));
    const fPcts = toPercentages(fCounts, fTotal);
    const bPcts = toPercentages(bCounts, bTotal);
    const distance = distributionDistance(bPcts, fPcts);

    if (distance > 0.15) {
      const shifts = findLargeShifts(bPcts, fPcts, 10);
      findings.push({
        category: 'timeOfDay',
        finding: `Order timing shifted. ${shifts.map((s) => `${s.key}h: ${s.baselinePct.toFixed(1)}% → ${s.flaggedPct.toFixed(1)}%`).join('; ') || 'Orders clustered differently across time buckets.'}`,
        severity: 'INFO',
        baselineDistribution: bPcts,
        flaggedDistribution: fPcts,
        deviationScore: distance,
      });
    }
  }

  // ── 8. Average order value ─────────────────────────────────────────────────
  {
    const fAvg = fTotal > 0
      ? flaggedDayOrders.reduce((s, o) => s + o.orderTotal, 0) / fTotal
      : 0;
    const bAvg = bTotal > 0
      ? baselineOrders.reduce((s, o) => s + o.orderTotal, 0) / bTotal
      : 0;

    if (bAvg > 0) {
      const pctChange = ((fAvg - bAvg) / bAvg) * 100;
      if (Math.abs(pctChange) > 20) {
        findings.push({
          category: 'avgOrderValue',
          finding: `Average order value ${pctChange > 0 ? 'increased' : 'decreased'} ${Math.abs(pctChange).toFixed(0)}%: $${(fAvg / 100).toFixed(2)} vs baseline $${(bAvg / 100).toFixed(2)}.`,
          severity: Math.abs(pctChange) > 40 ? 'WARNING' : 'INFO',
          baselineDistribution: { avgCents: bAvg },
          flaggedDistribution: { avgCents: fAvg },
          deviationScore: Math.min(Math.abs(pctChange) / 100, 1),
        });
      }
    }
  }

  // Sort by severity, then deviation score
  const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
  findings.sort((a, b) => {
    const sDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sDiff !== 0) return sDiff;
    return b.deviationScore - a.deviationScore;
  });

  return {
    date,
    flaggedOrderCount: fTotal,
    baselineOrderCount: bTotal,
    baselineDays,
    findings,
  };
}
