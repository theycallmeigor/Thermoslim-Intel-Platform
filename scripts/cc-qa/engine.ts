/**
 * CC QA Engine — Core streak detection + learning
 *
 * 1. Aggregates CC events into 1-hour windows
 * 2. Detects failure streaks across dimensions (paySource, funnel, campaign)
 * 3. Fingerprints each streak to identify root cause
 * 4. Learns patterns over time and updates baselines
 * 5. Exports findings for anomaly detection training
 */
import * as fs from 'fs';
import * as path from 'path';
import type {
  CCEvent, HourlyWindow, FailureStreak, StreakFingerprint,
  QALearning, LearnedPattern, TrainingFinding, QAConfig,
} from './types';
import { DEFAULT_QA_CONFIG } from './types';

const STORE_DIR = path.resolve(__dirname, 'store');

// ═══════════════════════════════════════════════════════════
//  1. AGGREGATE INTO TIME WINDOWS (multi-resolution)
// ═══════════════════════════════════════════════════════════

export type Resolution = '15min' | '1h' | '4h' | '1d';

const RESOLUTION_MS: Record<Resolution, number> = {
  '15min': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
};

function windowKey(ts: Date, resolution: Resolution): string {
  const t = ts.getTime();
  switch (resolution) {
    case '15min': {
      const iso = ts.toISOString();
      const min = Math.floor(ts.getUTCMinutes() / 15) * 15;
      return iso.slice(0, 11) + String(ts.getUTCHours()).padStart(2, '0') + ':' + String(min).padStart(2, '0');
    }
    case '1h':
      return ts.toISOString().slice(0, 13);
    case '4h': {
      const iso = ts.toISOString();
      const block = Math.floor(ts.getUTCHours() / 4) * 4;
      return iso.slice(0, 11) + String(block).padStart(2, '0');
    }
    case '1d':
      return ts.toISOString().slice(0, 10);
  }
}

function windowStartDate(key: string, resolution: Resolution): Date {
  switch (resolution) {
    case '15min': return new Date(key.slice(0, 10) + 'T' + key.slice(11) + ':00.000Z');
    case '1h': return new Date(key + ':00:00.000Z');
    case '4h': return new Date(key.slice(0, 10) + 'T' + key.slice(11) + ':00:00.000Z');
    case '1d': return new Date(key + 'T00:00:00.000Z');
  }
}

export function buildWindows(events: CCEvent[], resolution: Resolution = '1h'): HourlyWindow[] {
  const byKey = new Map<string, CCEvent[]>();

  for (const e of events) {
    const key = windowKey(e.timestamp, resolution);
    const arr = byKey.get(key) ?? [];
    arr.push(e);
    byKey.set(key, arr);
  }

  const windows: HourlyWindow[] = [];
  for (const [key, windowEvents] of [...byKey.entries()].sort()) {
    windows.push(aggregateWindow(key, windowEvents, resolution));
  }

  return windows;
}

/** Legacy alias */
export function buildHourlyWindows(events: CCEvent[]): HourlyWindow[] {
  return buildWindows(events, '1h');
}

function aggregateWindow(key: string, windowEvents: CCEvent[], resolution: Resolution): HourlyWindow {
  const total = windowEvents.length;
  const abandoned = windowEvents.filter((e) => e.isAbandon).length;
  const realFailures = windowEvents.filter((e) => !e.isAbandon && (e.status === 'PARTIAL' || e.status === 'DECLINED'));
  const partial = realFailures.filter((e) => e.status === 'PARTIAL').length;
  const declined = realFailures.filter((e) => e.status === 'DECLINED').length;
  const complete = windowEvents.filter((e) => e.status === 'COMPLETE').length;
  const refunded = windowEvents.filter((e) => e.status === 'REFUNDED').length;
  const revenue = windowEvents.reduce((s, e) => s + e.orderTotal, 0);
  const zeroRev = windowEvents.filter((e) => e.orderTotal === 0 && e.status !== 'REFUNDED' && !e.isAbandon).length;

  const activeEvents = windowEvents.filter((e) => !e.isAbandon);

  const byPaySource: Record<string, { total: number; failed: number }> = {};
  for (const e of activeEvents) {
    const ps = e.paySource || 'unknown';
    if (!byPaySource[ps]) byPaySource[ps] = { total: 0, failed: 0 };
    byPaySource[ps].total++;
    if (e.status === 'PARTIAL' || e.status === 'DECLINED') byPaySource[ps].failed++;
  }

  const byFunnel: Record<string, { total: number; failed: number }> = {};
  for (const e of activeEvents) {
    const f = e.funnelId || 'no-funnel';
    if (!byFunnel[f]) byFunnel[f] = { total: 0, failed: 0 };
    byFunnel[f].total++;
    if (e.status === 'PARTIAL' || e.status === 'DECLINED') byFunnel[f].failed++;
  }

  const byCampaign: Record<string, { total: number; failed: number }> = {};
  for (const e of activeEvents) {
    const c = e.campaignName || 'unknown';
    if (!byCampaign[c]) byCampaign[c] = { total: 0, failed: 0 };
    byCampaign[c].total++;
    if (e.status === 'PARTIAL' || e.status === 'DECLINED') byCampaign[c].failed++;
  }

  const nonAbandoned = total - abandoned;
  const failCount = partial + declined;

  return {
    windowStart: windowStartDate(key, resolution),
    windowKey: key,
    totalOrders: total,
    completeOrders: complete,
    partialOrders: partial,
    declinedOrders: declined,
    refundedOrders: refunded,
    abandonedOrders: abandoned,
    revenue,
    failRate: nonAbandoned > 0 ? failCount / nonAbandoned : 0,
    abandonRate: total > 0 ? abandoned / total : 0,
    zeroRevenueCount: zeroRev,
    byPaySource,
    byFunnel,
    byCampaign,
  };
}

// ═══════════════════════════════════════════════════════════
//  2. DETECT FAILURE STREAKS
// ═══════════════════════════════════════════════════════════

export function detectStreaks(
  windows: HourlyWindow[],
  config: QAConfig = DEFAULT_QA_CONFIG,
  priorLearnings: QALearning[] = [],
): FailureStreak[] {
  const streaks: FailureStreak[] = [];
  let currentStreak: HourlyWindow[] = [];

  for (const w of windows) {
    if (w.totalOrders < config.minOrdersPerHour) {
      // Low volume — flush any active streak
      if (currentStreak.length >= config.minStreakHours) {
        streaks.push(buildStreak(currentStreak, priorLearnings));
      }
      currentStreak = [];
      continue;
    }

    if (w.failRate >= config.streakStartThreshold) {
      currentStreak.push(w);
    } else if (w.failRate < config.streakEndThreshold) {
      // Streak ended
      if (currentStreak.length >= config.minStreakHours) {
        streaks.push(buildStreak(currentStreak, priorLearnings));
      }
      currentStreak = [];
    } else {
      // In the hysteresis zone — continue existing streak but don't start new one
      if (currentStreak.length > 0) {
        currentStreak.push(w);
      }
    }
  }

  // Flush final streak
  if (currentStreak.length >= config.minStreakHours) {
    streaks.push(buildStreak(currentStreak, priorLearnings));
  }

  return streaks;
}

function buildStreak(windows: HourlyWindow[], priorLearnings: QALearning[]): FailureStreak {
  const totalOrders = windows.reduce((s, w) => s + w.totalOrders, 0);
  const totalFailures = windows.reduce((s, w) => s + w.partialOrders + w.declinedOrders, 0);
  const failRate = totalOrders > 0 ? totalFailures / totalOrders : 0;

  // Find peak
  let peakRate = 0;
  let peakKey = windows[0].windowKey;
  for (const w of windows) {
    if (w.failRate > peakRate) {
      peakRate = w.failRate;
      peakKey = w.windowKey;
    }
  }

  // Fingerprint
  const fingerprint = fingerprintStreak(windows);

  // Check prior occurrences
  const priorOccurrences = countPriorOccurrences(fingerprint, priorLearnings);

  // Severity
  let severity: FailureStreak['severity'] = 'WARNING';
  if (failRate > 0.5 || windows.length >= 8) severity = 'CRITICAL';
  if (priorOccurrences >= 5) severity = 'CHRONIC';

  return {
    id: `streak-${windows[0].windowKey}-${windows.length}h`,
    startWindow: windows[0].windowKey,
    endWindow: windows[windows.length - 1].windowKey,
    durationHours: windows.length,
    totalOrders,
    totalFailures,
    failRate,
    peakFailRate: peakRate,
    peakWindow: peakKey,
    fingerprint,
    priorOccurrences,
    severity,
  };
}

// ═══════════════════════════════════════════════════════════
//  3. FINGERPRINT — IDENTIFY ROOT CAUSE DIMENSION
// ═══════════════════════════════════════════════════════════

function fingerprintStreak(windows: HourlyWindow[]): StreakFingerprint {
  // Aggregate failures by dimension across the streak
  const payTotals: Record<string, { total: number; failed: number }> = {};
  const funnelTotals: Record<string, { total: number; failed: number }> = {};
  const campTotals: Record<string, { total: number; failed: number }> = {};

  for (const w of windows) {
    for (const [k, v] of Object.entries(w.byPaySource)) {
      if (!payTotals[k]) payTotals[k] = { total: 0, failed: 0 };
      payTotals[k].total += v.total;
      payTotals[k].failed += v.failed;
    }
    for (const [k, v] of Object.entries(w.byFunnel)) {
      if (!funnelTotals[k]) funnelTotals[k] = { total: 0, failed: 0 };
      funnelTotals[k].total += v.total;
      funnelTotals[k].failed += v.failed;
    }
    for (const [k, v] of Object.entries(w.byCampaign)) {
      if (!campTotals[k]) campTotals[k] = { total: 0, failed: 0 };
      campTotals[k].total += v.total;
      campTotals[k].failed += v.failed;
    }
  }

  const totalFailures = Object.values(payTotals).reduce((s, v) => s + v.failed, 0);

  // Find top contributor in each dimension
  const topPay = findTopContributor(payTotals, totalFailures);
  const topFunnel = findTopContributor(funnelTotals, totalFailures);
  const topCamp = findTopContributor(campTotals, totalFailures);

  // Pick the dimension with highest contribution
  const candidates = [
    { dim: 'paySource' as const, ...topPay },
    { dim: 'funnel' as const, ...topFunnel },
    { dim: 'campaign' as const, ...topCamp },
  ].sort((a, b) => b.contribution - a.contribution);

  const best = candidates[0];

  // Determine pattern type
  const failPattern = classifyPattern(windows);

  return {
    primaryDimension: best.contribution > 0.5 ? best.dim : 'mixed',
    primaryValue: best.value,
    failPattern,
    contribution: best.contribution,
  };
}

function findTopContributor(
  totals: Record<string, { total: number; failed: number }>,
  totalFailures: number,
): { value: string; contribution: number } {
  let bestValue = 'unknown';
  let bestContribution = 0;

  for (const [k, v] of Object.entries(totals)) {
    const contribution = totalFailures > 0 ? v.failed / totalFailures : 0;
    if (contribution > bestContribution) {
      bestContribution = contribution;
      bestValue = k;
    }
  }

  return { value: bestValue, contribution: bestContribution };
}

function classifyPattern(windows: HourlyWindow[]): StreakFingerprint['failPattern'] {
  if (windows.length < 3) return 'burst';

  const rates = windows.map((w) => w.failRate);
  const first = rates.slice(0, Math.ceil(rates.length / 2));
  const second = rates.slice(Math.ceil(rates.length / 2));

  const avgFirst = first.reduce((s, r) => s + r, 0) / first.length;
  const avgSecond = second.reduce((s, r) => s + r, 0) / second.length;

  // Check variance
  const variance = rates.reduce((s, r) => s + (r - (avgFirst + avgSecond) / 2) ** 2, 0) / rates.length;
  const cv = Math.sqrt(variance) / ((avgFirst + avgSecond) / 2);

  if (cv > 0.5) return 'intermittent';
  if (avgSecond > avgFirst * 1.3) return 'escalating';
  return 'constant';
}

function countPriorOccurrences(fp: StreakFingerprint, learnings: QALearning[]): number {
  return learnings.filter((l) =>
    l.pattern.dimension === fp.primaryDimension &&
    l.pattern.value === fp.primaryValue,
  ).reduce((s, l) => s + l.confirmations, 0);
}

// ═══════════════════════════════════════════════════════════
//  4. LEARNING — BUILD AND UPDATE PATTERNS
// ═══════════════════════════════════════════════════════════

export function updateLearnings(
  streaks: FailureStreak[],
  windows: HourlyWindow[],
  existing: QALearning[],
): QALearning[] {
  const learnings = [...existing];
  const now = new Date().toISOString();

  for (const streak of streaks) {
    const fp = streak.fingerprint;
    const matchIdx = learnings.findIndex((l) =>
      l.pattern.dimension === fp.primaryDimension &&
      l.pattern.value === fp.primaryValue &&
      l.pattern.metric === 'failRate',
    );

    if (matchIdx >= 0) {
      // Update existing learning
      const l = learnings[matchIdx];
      l.confirmations++;
      l.lastSeen = now;
      l.description = `${fp.primaryDimension}=${fp.primaryValue}: ${streak.failRate.toFixed(0)}% fail rate over ${streak.durationHours}h (seen ${l.confirmations}x)`;

      // Update baseline with exponential moving average (alpha=0.1 optimal — slow drift)
      const alpha = 0.1;
      l.pattern.baseline = l.pattern.baseline * (1 - alpha) + streak.failRate * alpha;

      // Export to training after first confirmation (optimal for low-volume)
      if (l.confirmations >= 1) l.exportToTraining = true;
    } else {
      // New learning
      learnings.push({
        id: `learn-${fp.primaryDimension}-${fp.primaryValue.slice(0, 8)}-${Date.now()}`,
        discoveredAt: now,
        type: 'pattern',
        description: `${fp.primaryDimension}=${fp.primaryValue}: ${(streak.failRate * 100).toFixed(0)}% fail rate over ${streak.durationHours}h`,
        pattern: {
          dimension: fp.primaryDimension,
          value: fp.primaryValue,
          metric: 'failRate',
          baseline: streak.failRate,
          alertThreshold: streak.failRate * 0.8, // alert at 80% of observed rate
        },
        confirmations: 1,
        lastSeen: now,
        exportToTraining: false,
      });
    }
  }

  // Build hourly baselines per dimension
  updateHourlyBaselines(windows, learnings, now);

  return learnings;
}

function updateHourlyBaselines(windows: HourlyWindow[], learnings: QALearning[], now: string) {
  // Build hour-of-day profiles for key dimensions
  const hourlyByPay: Record<string, number[]> = {};
  const hourlyCounts: Record<string, number[]> = {};

  for (const w of windows) {
    const hour = w.windowStart.getUTCHours();
    for (const [ps, v] of Object.entries(w.byPaySource)) {
      // Skip 'unknown' — abandons are filtered out, no useful baseline
      if (ps === 'unknown') continue;
      if (!hourlyByPay[ps]) {
        hourlyByPay[ps] = new Array(24).fill(0);
        hourlyCounts[ps] = new Array(24).fill(0);
      }
      hourlyByPay[ps][hour] += v.total > 0 ? v.failed / v.total : 0;
      hourlyCounts[ps][hour]++;
    }
  }

  // Save/update baseline learnings
  for (const [ps, rates] of Object.entries(hourlyByPay)) {
    const counts = hourlyCounts[ps];
    const profile = rates.map((r, i) => counts[i] > 0 ? r / counts[i] : 0);

    const matchIdx = learnings.findIndex((l) =>
      l.type === 'baseline' &&
      l.pattern.dimension === 'paySource' &&
      l.pattern.value === ps,
    );

    if (matchIdx >= 0) {
      learnings[matchIdx].pattern.hourlyProfile = profile;
      learnings[matchIdx].lastSeen = now;
    } else {
      const avgRate = profile.reduce((s, v) => s + v, 0) / 24;
      learnings.push({
        id: `baseline-pay-${ps.slice(0, 8)}-${Date.now()}`,
        discoveredAt: now,
        type: 'baseline',
        description: `Hourly fail rate profile for paySource=${ps}`,
        pattern: {
          dimension: 'paySource',
          value: ps,
          metric: 'failRate',
          baseline: avgRate,
          alertThreshold: avgRate * 1.5,
          hourlyProfile: profile,
        },
        confirmations: 1,
        lastSeen: now,
        exportToTraining: false,
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  5. EXPORT FINDINGS FOR ANOMALY DETECTION TRAINING
// ═══════════════════════════════════════════════════════════

export function exportFindings(
  streaks: FailureStreak[],
  learnings: QALearning[],
): TrainingFinding[] {
  const findings: TrainingFinding[] = [];

  for (const streak of streaks) {
    // Estimate lost revenue from failures
    const avgOrderValue = streak.totalOrders > 0
      ? (streak.totalOrders - streak.totalFailures) > 0 ? 0 : 0  // computed below
      : 0;

    findings.push({
      source: 'cc-qa',
      timestamp: streak.startWindow,
      type: streak.severity === 'CHRONIC' ? 'chronic' : 'streak',
      severity: streak.severity === 'CHRONIC' ? 'WARNING' : streak.severity,
      metric: 'ccFailRate',
      dimension: streak.fingerprint.primaryDimension,
      value: streak.fingerprint.primaryValue,
      data: {
        failRate: streak.failRate,
        baseline: 0.05,  // will be filled from learnings
        deviation: streak.failRate / 0.05,
        durationHours: streak.durationHours,
        affectedOrders: streak.totalFailures,
        lostRevenue: 0,  // will be computed when we have AOV data
      },
      description: `CC ${streak.severity}: ${streak.fingerprint.primaryDimension}=${streak.fingerprint.primaryValue} at ${(streak.failRate * 100).toFixed(0)}% fail for ${streak.durationHours}h (${streak.totalFailures}/${streak.totalOrders} orders)`,
    });
  }

  // Export confirmed learnings as baseline shifts
  for (const l of learnings) {
    if (!l.exportToTraining || l.type !== 'pattern') continue;

    findings.push({
      source: 'cc-qa',
      timestamp: l.lastSeen,
      type: 'baseline_shift',
      severity: l.confirmations >= 5 ? 'CRITICAL' : 'WARNING',
      metric: l.pattern.metric,
      dimension: l.pattern.dimension,
      value: l.pattern.value,
      data: {
        failRate: l.pattern.baseline,
        baseline: 0.05,
        deviation: l.pattern.baseline / 0.05,
        durationHours: 0,
        affectedOrders: 0,
        lostRevenue: 0,
      },
      description: `Learned: ${l.description} (confirmed ${l.confirmations}x)`,
    });
  }

  return findings;
}

// ═══════════════════════════════════════════════════════════
//  6. PERSISTENCE — SAVE/LOAD LEARNINGS
// ═══════════════════════════════════════════════════════════

export function saveLearnings(learnings: QALearning[]): void {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(STORE_DIR, 'learnings.json'),
    JSON.stringify(learnings, null, 2) + '\n',
  );
}

export function loadLearnings(): QALearning[] {
  const file = path.join(STORE_DIR, 'learnings.json');
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

export function saveFindings(findings: TrainingFinding[]): void {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(STORE_DIR, 'training-findings.json'),
    JSON.stringify(findings, null, 2) + '\n',
  );
}

export function loadFindings(): TrainingFinding[] {
  const file = path.join(STORE_DIR, 'training-findings.json');
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}
