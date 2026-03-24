export interface DetectorConfig {
  lookbackDays: number;
  minHistory: number;
  warningThreshold: number;
  criticalThreshold: number;
  funnelDropWarning: number;
  funnelDropCritical: number;
  topCampaignsToCheck: number;
  metricsToCheck: string[];
  useMedianInsteadOfMean: boolean;
  weekdayWeekendSplit: boolean;
  excludeOutliersFromBaseline: boolean;
  outlierMethod: 'none' | 'iqr' | 'trim5';
}
export interface TimeframeConfig {
  '15min': DetectorConfig; '1h': DetectorConfig; '4h': DetectorConfig;
  '6h': DetectorConfig; '1d': DetectorConfig; '1w': DetectorConfig;
}
export type Timeframe = keyof TimeframeConfig;
export const TIMEFRAME_ORDER: Timeframe[] = ['15min', '1h', '4h', '6h', '1d', '1w'];
export interface SnapshotRow {
  date: Date; campaignId: string | null; campaignName: string | null;
  productLine: string | null; channel: string | null; funnelId: string | null;
  totalOrders: number; totalRevenue: number; newOrders: number; recurringOrders: number;
  newSubscribers: number; cancelledSubscribers: number; refunds: number; avgOrderValue: number;
}
export interface DetectedAnomaly {
  type: 'METRIC' | 'FUNNEL' | 'ATTRIBUTION'; severity: 'WARNING' | 'CRITICAL';
  metric: string; dimension: string | null; dimensionValue: string | null;
  expected: number; actual: number; deviation: number; explanation: string; date: string;
}
export interface Injection {
  id: string; type: 'zero_out' | 'spike' | 'gradual_decline' | 'channel_shift' | 'funnel_break';
  date: string; metric: string; dimension: string | null; dimensionValue: string | null;
  multiplier?: number; days?: number;
}
export interface Hint {
  date: string; type: 'real' | 'false_alarm'; metric?: string;
  dimension?: string; dimensionValue?: string; description: string;
}
export interface ScoreBreakdown {
  total: number; catch: number; quiet: number; specificity: number;
  details: {
    injectionsCaught: number; injectionsTotal: number; hintsCaught: number; hintsTotal: number;
    falsePositives: number; cleanDays: number; specificityHits: number; specificityTotal: number;
  };
}
export interface ExperimentLog {
  id: number; timestamp: string; timeframe: Timeframe; config: DetectorConfig;
  score: ScoreBreakdown; bestScore: number; accepted: boolean; reasoning: string; durationMs: number;
}
export const DEFAULT_CONFIG: DetectorConfig = {
  lookbackDays: 14, minHistory: 7, warningThreshold: 2.0, criticalThreshold: 3.0,
  funnelDropWarning: 0.25, funnelDropCritical: 0.50, topCampaignsToCheck: 20,
  metricsToCheck: ['totalOrders', 'totalRevenue', 'newSubscribers', 'cancelledSubscribers'],
  useMedianInsteadOfMean: false, weekdayWeekendSplit: false,
  excludeOutliersFromBaseline: false, outlierMethod: 'none',
};
