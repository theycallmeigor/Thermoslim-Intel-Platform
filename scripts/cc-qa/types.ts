/**
 * CC QA Module — Types
 * Self-contained type system for checkout quality analysis
 */

// ── Source adapters ──
// Each source provides hourly windows of CC checkout events
export interface SourceAdapter {
  name: string;
  /** Pull events for a time range, return raw events */
  pull(from: Date, to: Date): Promise<CCEvent[]>;
}

export interface CCEvent {
  timestamp: Date;
  orderId: string;
  status: 'COMPLETE' | 'PARTIAL' | 'DECLINED' | 'REFUNDED';
  paySource: string | null;       // CREDITCARD, PREPAID, unknown, null
  funnelId: string | null;
  campaignName: string | null;
  orderTotal: number;             // cents
  product: string | null;
  /** true when paySource is unknown/null + PARTIAL = abandoned checkout (never submitted payment) */
  isAbandon: boolean;
  /** Extensible metadata from any source (network logs, recordings, etc.) */
  meta?: Record<string, unknown>;
}

// ── Hourly aggregates ──
export interface HourlyWindow {
  windowStart: Date;              // hour boundary
  windowKey: string;              // "2026-03-18T14" ISO format
  totalOrders: number;
  completeOrders: number;
  partialOrders: number;          // PARTIAL with known paySource (real failures)
  declinedOrders: number;
  refundedOrders: number;
  abandonedOrders: number;        // paySource=unknown/null + PARTIAL (never submitted payment)
  revenue: number;
  failRate: number;               // real failures only: (partial + declined) / (total - abandoned)
  abandonRate: number;            // abandoned / total
  zeroRevenueCount: number;
  byPaySource: Record<string, { total: number; failed: number }>;
  byFunnel: Record<string, { total: number; failed: number }>;
  byCampaign: Record<string, { total: number; failed: number }>;
}

// ── Streak detection ──
export interface FailureStreak {
  id: string;
  startWindow: string;            // first bad hour
  endWindow: string;              // last bad hour
  durationHours: number;
  totalOrders: number;
  totalFailures: number;
  failRate: number;
  peakFailRate: number;
  peakWindow: string;
  /** Root cause fingerprint — which dimension drove the streak */
  fingerprint: StreakFingerprint;
  /** Was this pattern seen before? */
  priorOccurrences: number;
  severity: 'WARNING' | 'CRITICAL' | 'CHRONIC';
}

export interface StreakFingerprint {
  primaryDimension: 'paySource' | 'funnel' | 'campaign' | 'mixed';
  primaryValue: string;           // e.g. "unknown", "8B0924CC..."
  failPattern: 'constant' | 'escalating' | 'intermittent' | 'burst';
  /** Contribution of this dimension to total failures (0-1) */
  contribution: number;
}

// ── Learnings (what the model remembers) ──
export interface QALearning {
  id: string;
  discoveredAt: string;           // ISO date
  type: 'pattern' | 'threshold' | 'correlation' | 'baseline';
  /** Human-readable description */
  description: string;
  /** Machine-readable pattern for matching */
  pattern: LearnedPattern;
  /** How many times this has been confirmed */
  confirmations: number;
  /** Last time this was seen */
  lastSeen: string;
  /** Should this be exported to anomaly detection training? */
  exportToTraining: boolean;
}

export interface LearnedPattern {
  dimension: string;
  value: string;
  metric: string;                 // failRate, zeroRevenueRate, declineRate
  /** Normal baseline value for this dimension */
  baseline: number;
  /** Threshold that triggers a streak alert */
  alertThreshold: number;
  /** What hour-of-day patterns exist? */
  hourlyProfile?: number[];       // 24 entries, baseline per hour
  /** Day-of-week pattern? */
  dowProfile?: number[];          // 7 entries
}

// ── Training export (what goes to anomaly detection) ──
export interface TrainingFinding {
  source: 'cc-qa';
  timestamp: string;
  type: 'streak' | 'baseline_shift' | 'new_pattern' | 'chronic';
  severity: 'WARNING' | 'CRITICAL';
  metric: string;
  dimension: string;
  value: string;
  /** The data — used by anomaly detector to adjust configs */
  data: {
    failRate: number;
    baseline: number;
    deviation: number;
    durationHours: number;
    affectedOrders: number;
    lostRevenue: number;
  };
  description: string;
}

// ── QA Config ──
export interface QAConfig {
  /** Minimum orders per hour to evaluate (below = skip) */
  minOrdersPerHour: number;
  /** Fail rate threshold to start a streak */
  streakStartThreshold: number;
  /** Fail rate threshold to end a streak */
  streakEndThreshold: number;
  /** Minimum consecutive bad hours to count as a streak */
  minStreakHours: number;
  /** How many prior hours for baseline */
  baselineHours: number;
  /** After this many occurrences, mark as CHRONIC */
  chronicThreshold: number;
  /** Enabled sources */
  sources: string[];
}

export const DEFAULT_QA_CONFIG: QAConfig = {
  minOrdersPerHour: 1,            // optimal: low-volume stores need every order counted
  streakStartThreshold: 0.15,     // optimal: lowered from 0.25 — catches 25% more failures
  streakEndThreshold: 0.10,       // optimal: lowered from 0.15 — tighter hysteresis band
  minStreakHours: 1,              // optimal: single-hour bursts are real at low volume
  baselineHours: 168,             // 7 days
  chronicThreshold: 5,
  sources: ['database'],
};
