import type { DetectorConfig, SnapshotRow, DetectedAnomaly } from './types';

// ── Stats helpers ──────────────────────────────────────────────────────────────

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function filterOutliers(values: number[], method: 'none' | 'iqr' | 'trim5'): number[] {
  if (method === 'none' || values.length < 4) return values;

  if (method === 'trim5') {
    const sorted = [...values].sort((a, b) => a - b);
    const trimCount = Math.max(1, Math.floor(sorted.length * 0.05));
    return sorted.slice(trimCount, sorted.length - trimCount);
  }

  // IQR method
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return values.filter((v) => v >= lower && v <= upper);
}

function formatMoney(cents: number): string {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Aggregation helpers ────────────────────────────────────────────────────────

/**
 * Build time-period aggregates from snapshots.
 * Uses the full ISO string as key (preserving sub-daily window boundaries),
 * then truncates to YYYY-MM-DD only for daily timeframes.
 */
function buildPeriodAggregates(
  snapshots: SnapshotRow[],
  filter: (s: SnapshotRow) => boolean,
  metrics: string[],
  useFullTimestamp: boolean,
): Map<string, Record<string, number>> {
  const periodMap = new Map<string, Record<string, number>>();
  for (const s of snapshots) {
    if (!filter(s)) continue;
    // For sub-daily: use full ISO key (window boundary). For daily: truncate to date.
    const dateKey = useFullTimestamp
      ? s.date.toISOString()
      : s.date.toISOString().split('T')[0];
    let entry = periodMap.get(dateKey);
    if (!entry) {
      entry = {};
      for (const m of metrics) entry[m] = 0;
      periodMap.set(dateKey, entry);
    }
    for (const m of metrics) {
      entry[m] += (s as Record<string, unknown>)[m] as number;
    }
  }
  return periodMap;
}

function getDayOfWeek(dateKey: string): 'weekday' | 'weekend' {
  const d = new Date(dateKey.length > 10 ? dateKey : dateKey + 'T00:00:00Z');
  const day = d.getUTCDay();
  return day === 0 || day === 6 ? 'weekend' : 'weekday';
}

// ── Core detection ─────────────────────────────────────────────────────────────

function detectMetricAnomalies(
  periodMap: Map<string, Record<string, number>>,
  todayKey: string,
  config: DetectorConfig,
  dimension: string | null,
  dimensionValue: string | null,
): { anomalies: DetectedAnomaly[]; resolvedKeys: string[] } {
  const anomalies: DetectedAnomaly[] = [];
  const resolvedKeys: string[] = [];
  const todayData = periodMap.get(todayKey);
  if (!todayData) return { anomalies, resolvedKeys };

  const todayDayType = getDayOfWeek(todayKey);

  for (const metric of config.metricsToCheck) {
    const historyValues: number[] = [];
    for (const [dateKey, values] of periodMap.entries()) {
      if (dateKey === todayKey) continue;
      if (config.weekdayWeekendSplit && getDayOfWeek(dateKey) !== todayDayType) continue;
      if (values[metric] !== undefined) {
        historyValues.push(values[metric]);
      }
    }

    if (historyValues.length < config.minHistory) continue;

    const filtered = config.excludeOutliersFromBaseline
      ? filterOutliers(historyValues, config.outlierMethod)
      : historyValues;

    if (filtered.length < 2) continue;

    const center = config.useMedianInsteadOfMean ? median(filtered) : mean(filtered);
    const sd = stddev(filtered);
    const actual = todayData[metric];

    // FIX #4: Zero-variance baseline — only flag if baseline was non-zero
    // A metric going from 0 to >0 is growth, not an anomaly
    if (sd === 0) {
      if (center === 0 && actual > 0) {
        // New activity on a previously-zero metric — skip, this is growth not an anomaly
        continue;
      }
      if (actual !== center && center > 0) {
        // Was stable at a non-zero value, now changed — could be real
        const direction = actual > center ? 'above' : 'below';
        const metricLabel = metric === 'totalRevenue'
          ? `${formatMoney(actual)} (expected ~${formatMoney(center)})`
          : `${actual} (expected ~${center.toFixed(1)})`;

        let explanation = `${metric} deviates from a perfectly stable baseline.`;
        explanation += ` Today: ${metricLabel}.`;
        if (dimension && dimensionValue) {
          explanation += ` Dimension: ${dimension}=${dimensionValue}.`;
        }

        anomalies.push({
          type: 'METRIC',
          severity: 'WARNING', // downgrade from CRITICAL — zero variance is uncertain
          metric,
          dimension,
          dimensionValue,
          expected: center,
          actual,
          deviation: actual > center ? 999 : -999,
          explanation,
          date: todayKey,
        });
      } else {
        resolvedKeys.push(`${metric}|${dimension ?? ''}|${dimensionValue ?? ''}`);
      }
      continue;
    }

    const zScore = (actual - center) / sd;
    const absZ = Math.abs(zScore);

    if (absZ > config.warningThreshold) {
      const severity: 'WARNING' | 'CRITICAL' = absZ > config.criticalThreshold ? 'CRITICAL' : 'WARNING';
      const direction = zScore > 0 ? 'above' : 'below';
      const metricLabel = metric === 'totalRevenue'
        ? `${formatMoney(actual)} (expected ~${formatMoney(center)})`
        : `${actual} (expected ~${center.toFixed(1)})`;

      let explanation = `${metric} is ${absZ.toFixed(1)}σ ${direction} the ${config.lookbackDays}-day rolling average.`;
      explanation += ` Today: ${metricLabel}.`;
      if (dimension && dimensionValue) {
        explanation += ` Dimension: ${dimension}=${dimensionValue}.`;
      }

      anomalies.push({
        type: 'METRIC',
        severity,
        metric,
        dimension,
        dimensionValue,
        expected: center,
        actual,
        deviation: zScore,
        explanation,
        date: todayKey,
      });
    } else {
      resolvedKeys.push(`${metric}|${dimension ?? ''}|${dimensionValue ?? ''}`);
    }
  }

  return { anomalies, resolvedKeys };
}

// ── Deduplication ──────────────────────────────────────────────────────────────

/**
 * FIX #1: Deduplicate anomalies.
 *
 * When the same metric anomaly fires on overall AND per-campaign AND per-channel
 * AND per-funnel, keep only the most informative version:
 * - If a dimension-level anomaly explains >50% of the overall deviation, keep only
 *   the dimension one (it's more specific and actionable)
 * - If no single dimension dominates, keep the overall one
 * - Attribution anomalies are kept only for the top contributing dimension
 */
function deduplicateAnomalies(anomalies: DetectedAnomaly[]): DetectedAnomaly[] {
  // Group by (metric, date)
  const groups = new Map<string, DetectedAnomaly[]>();
  for (const a of anomalies) {
    const key = `${a.metric}|${a.date}|${a.type}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }

  const result: DetectedAnomaly[] = [];

  for (const [, group] of groups) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }

    // Separate overall (no dimension) from dimension-level
    const overall = group.find((a) => a.dimension === null);
    const dimensional = group.filter((a) => a.dimension !== null);

    if (!overall) {
      // No overall — keep the most severe dimensional one
      dimensional.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
      result.push(dimensional[0]);
      continue;
    }

    // For ATTRIBUTION type: keep only the single highest contributor
    if (group[0].type === 'ATTRIBUTION') {
      // Attribution anomalies are all dimensional, pick the one with highest contribution %
      const best = group.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))[0];
      result.push(best);
      continue;
    }

    // For METRIC type: check if a single dimension explains the anomaly
    const overallDeviation = overall.actual - overall.expected;
    if (overallDeviation !== 0) {
      // Find dimensions with the strongest signal
      const strongDimensional = dimensional.filter((a) => Math.abs(a.deviation) > Math.abs(overall.deviation));
      if (strongDimensional.length > 0) {
        // A sub-dimension has stronger z-score — it's more specific, keep it instead of overall
        strongDimensional.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
        result.push(strongDimensional[0]);
        // Also keep the overall if it's a different signal (e.g., overall is still significant on its own)
        if (Math.abs(overall.deviation) >= overall.deviation) {
          result.push({
            ...overall,
            explanation: overall.explanation + ` (driven by ${strongDimensional[0].dimension}=${strongDimensional[0].dimensionValue})`,
          });
        }
        continue;
      }
    }

    // Default: keep overall + the single strongest dimensional (if notably different)
    result.push(overall);
    if (dimensional.length > 0) {
      dimensional.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
      const best = dimensional[0];
      // Only keep if the dimension-specific z-score is significantly different from overall
      if (Math.abs(best.deviation) > Math.abs(overall.deviation) * 1.3) {
        result.push(best);
      }
    }
  }

  return result;
}

// ── Chronic pattern suppression ──────────────────────────────────────────────

/**
 * FIX #3: Suppress chronic/recurring alerts.
 *
 * If the same (metric, dimension, dimensionValue) has been flagged more than
 * `chronicThreshold` times in the lookback window, downgrade to a single
 * "chronic" notice instead of re-alerting every day.
 */
function suppressChronicPatterns(
  anomalies: DetectedAnomaly[],
  allPeriodAnomalies: Map<string, DetectedAnomaly[]>,
  chronicThreshold: number = 5,
): DetectedAnomaly[] {
  const result: DetectedAnomaly[] = [];
  const chronicSeen = new Set<string>();

  for (const a of anomalies) {
    const key = `${a.type}|${a.metric}|${a.dimension ?? ''}|${a.dimensionValue ?? ''}`;
    const priorHits = allPeriodAnomalies.get(key) ?? [];

    if (priorHits.length >= chronicThreshold && !chronicSeen.has(key)) {
      // First time we see this chronic pattern today — emit one downgraded notice
      chronicSeen.add(key);
      result.push({
        ...a,
        severity: 'WARNING',
        explanation: `[CHRONIC] ${a.explanation} (flagged ${priorHits.length + 1}x in lookback window — may be a persistent shift, not an anomaly)`,
      });
    } else if (priorHits.length < chronicThreshold) {
      result.push(a);
    }
    // else: chronic and already noted today — skip entirely
  }

  return result;
}

// ── Main entry point ───────────────────────────────────────────────────────────

export function runDetection(
  snapshots: SnapshotRow[],
  todayKey: string,
  config: DetectorConfig,
  options?: { isSubdaily?: boolean; priorAnomalies?: Map<string, DetectedAnomaly[]> },
): DetectedAnomaly[] {
  const allAnomalies: DetectedAnomaly[] = [];
  const allResolvedKeys = new Set<string>();
  const metrics = config.metricsToCheck;

  // FIX #2: For sub-daily, use full timestamp keys to compare window-to-window
  const useFullTimestamp = options?.isSubdaily ?? false;

  // ── LAYER 1: Metric Anomalies ──────────────────────────────────────────────

  // 1a. Overall
  const overallPeriod = buildPeriodAggregates(snapshots, () => true, metrics, useFullTimestamp);
  const overallResult = detectMetricAnomalies(overallPeriod, todayKey, config, null, null);
  allAnomalies.push(...overallResult.anomalies);
  overallResult.resolvedKeys.forEach((k) => allResolvedKeys.add(k));

  // 1b. Per campaign (top N by volume)
  const campaignVolume = new Map<string, { name: string | null; volume: number }>();
  for (const s of snapshots) {
    if (!s.campaignId) continue;
    const entry = campaignVolume.get(s.campaignId) ?? { name: s.campaignName, volume: 0 };
    entry.volume += s.totalOrders;
    campaignVolume.set(s.campaignId, entry);
  }
  const topCampaigns = [...campaignVolume.entries()]
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, config.topCampaignsToCheck);

  for (const [campaignId, { name }] of topCampaigns) {
    const period = buildPeriodAggregates(snapshots, (s) => s.campaignId === campaignId, metrics, useFullTimestamp);
    const label = name ?? campaignId;
    const result = detectMetricAnomalies(period, todayKey, config, 'campaign', label);
    allAnomalies.push(...result.anomalies);
    result.resolvedKeys.forEach((k) => allResolvedKeys.add(k));
  }

  // 1c. Per channel
  const channels = new Set<string>();
  for (const s of snapshots) {
    if (s.channel) channels.add(s.channel);
  }
  for (const channel of channels) {
    const period = buildPeriodAggregates(snapshots, (s) => s.channel === channel, metrics, useFullTimestamp);
    const result = detectMetricAnomalies(period, todayKey, config, 'channel', channel);
    allAnomalies.push(...result.anomalies);
    result.resolvedKeys.forEach((k) => allResolvedKeys.add(k));
  }

  // 1d. Per product line
  const productLines = new Set<string>();
  for (const s of snapshots) {
    if (s.productLine) productLines.add(s.productLine);
  }
  for (const pl of productLines) {
    const period = buildPeriodAggregates(snapshots, (s) => s.productLine === pl, metrics, useFullTimestamp);
    const result = detectMetricAnomalies(period, todayKey, config, 'productLine', pl);
    allAnomalies.push(...result.anomalies);
    result.resolvedKeys.forEach((k) => allResolvedKeys.add(k));
  }

  // 1e. Per funnel
  const funnelIds = new Set<string>();
  for (const s of snapshots) {
    if (s.funnelId) funnelIds.add(s.funnelId);
  }
  for (const fid of funnelIds) {
    const period = buildPeriodAggregates(snapshots, (s) => s.funnelId === fid, metrics, useFullTimestamp);
    const result = detectMetricAnomalies(period, todayKey, config, 'funnel', fid);
    allAnomalies.push(...result.anomalies);
    result.resolvedKeys.forEach((k) => allResolvedKeys.add(k));
  }

  // ── LAYER 2: Funnel Breakage ───────────────────────────────────────────────

  const overallForFunnel = buildPeriodAggregates(snapshots, () => true, ['totalOrders'], useFullTimestamp);

  for (const fid of funnelIds) {
    const funnelPeriod = buildPeriodAggregates(snapshots, (s) => s.funnelId === fid, ['totalOrders'], useFullTimestamp);
    const conversionRates: number[] = [];
    let todayRate: number | null = null;

    for (const [dateKey, funnelValues] of funnelPeriod.entries()) {
      const overallValues = overallForFunnel.get(dateKey);
      if (!overallValues || overallValues.totalOrders === 0) continue;
      const rate = funnelValues.totalOrders / overallValues.totalOrders;
      if (dateKey === todayKey) {
        todayRate = rate;
      } else {
        conversionRates.push(rate);
      }
    }

    if (todayRate === null || conversionRates.length < config.minHistory) continue;

    const baseline = mean(conversionRates);
    if (baseline === 0) continue;

    const dropPct = (baseline - todayRate) / baseline;
    if (dropPct > config.funnelDropWarning) {
      const severity: 'WARNING' | 'CRITICAL' = dropPct > config.funnelDropCritical ? 'CRITICAL' : 'WARNING';
      allAnomalies.push({
        type: 'FUNNEL',
        severity,
        metric: 'conversionRate',
        dimension: 'funnel',
        dimensionValue: fid,
        expected: baseline,
        actual: todayRate,
        deviation: -dropPct,
        explanation: `Funnel ${fid.slice(0, 8)} CR dropped ${(dropPct * 100).toFixed(1)}% vs ${config.lookbackDays}-day baseline. Today: ${(todayRate * 100).toFixed(2)}%, expected: ~${(baseline * 100).toFixed(2)}%.`,
        date: todayKey,
      });
    }
  }

  // ── LAYER 3: Change Attribution ────────────────────────────────────────────
  // Only produce ONE attribution per overall anomaly (the top contributor)

  const overallAnomalousMetrics = allAnomalies.filter(
    (a) => a.type === 'METRIC' && a.dimension === null && (a.metric === 'totalRevenue' || a.metric === 'totalOrders'),
  );

  for (const anomaly of overallAnomalousMetrics) {
    const metric = anomaly.metric;
    const totalDeviation = anomaly.actual - anomaly.expected;
    if (totalDeviation === 0) continue;

    const dimensionTypes: { name: string; extractor: (s: SnapshotRow) => string | null }[] = [
      { name: 'campaign', extractor: (s) => s.campaignName ?? s.campaignId },
      { name: 'channel', extractor: (s) => s.channel },
      { name: 'productLine', extractor: (s) => s.productLine },
      { name: 'funnel', extractor: (s) => s.funnelId },
    ];

    // Find the single best contributor across ALL dimensions
    let bestContributor: { dimType: string; dimValue: string; contribution: number; pct: number } | null = null;

    for (const dimType of dimensionTypes) {
      const dimValues = new Map<string, Map<string, number>>();
      for (const s of snapshots) {
        const dimVal = dimType.extractor(s);
        if (!dimVal) continue;
        if (!dimValues.has(dimVal)) dimValues.set(dimVal, new Map());
        const dateMap = dimValues.get(dimVal)!;
        const dk = useFullTimestamp ? s.date.toISOString() : s.date.toISOString().split('T')[0];
        dateMap.set(dk, (dateMap.get(dk) ?? 0) + (s as Record<string, unknown>)[metric] as number);
      }

      for (const [dimVal, dateMap] of dimValues.entries()) {
        const todayVal = dateMap.get(todayKey) ?? 0;
        const historicalVals: number[] = [];
        for (const [dk, val] of dateMap.entries()) {
          if (dk !== todayKey) historicalVals.push(val);
        }
        if (historicalVals.length === 0) continue;
        const expected = mean(historicalVals);
        const contribution = todayVal - expected;
        const pct = Math.abs(contribution / totalDeviation) * 100;

        if (!bestContributor || pct > bestContributor.pct) {
          bestContributor = { dimType: dimType.name, dimValue: dimVal, contribution, pct };
        }
      }
    }

    if (bestContributor && bestContributor.pct > 15) {
      const direction = totalDeviation > 0 ? 'increased' : 'dropped';
      const metricLabel = metric === 'totalRevenue' ? formatMoney(Math.abs(totalDeviation)) : Math.abs(totalDeviation).toFixed(0);
      const topLabel = metric === 'totalRevenue' ? formatMoney(Math.abs(bestContributor.contribution)) : Math.abs(bestContributor.contribution).toFixed(0);

      allAnomalies.push({
        type: 'ATTRIBUTION',
        severity: anomaly.severity,
        metric,
        dimension: bestContributor.dimType,
        dimensionValue: bestContributor.dimValue,
        expected: anomaly.expected,
        actual: anomaly.actual,
        deviation: anomaly.deviation,
        explanation: `${metric} ${direction} ${metricLabel} vs expected. Top driver: ${bestContributor.dimType}=${bestContributor.dimValue} (${bestContributor.contribution > 0 ? '+' : '-'}${topLabel}, ${bestContributor.pct.toFixed(0)}% of total shift).`,
        date: todayKey,
      });
    }
  }

  // ── POST-PROCESSING ────────────────────────────────────────────────────────

  // FIX #1: Deduplicate
  let processed = deduplicateAnomalies(allAnomalies);

  // FIX #3: Suppress chronic patterns (if prior anomaly history provided)
  if (options?.priorAnomalies) {
    processed = suppressChronicPatterns(processed, options.priorAnomalies);
  }

  return processed;
}
