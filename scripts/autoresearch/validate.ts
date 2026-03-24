import type { DetectorConfig } from './types';

const VALID_METRICS = [
  'totalOrders', 'totalRevenue', 'newOrders', 'recurringOrders',
  'newSubscribers', 'cancelledSubscribers', 'refunds', 'avgOrderValue',
];
const VALID_OUTLIER_METHODS = ['none', 'iqr', 'trim5'];

export function validateConfig(config: DetectorConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (config.lookbackDays < 3 || config.lookbackDays > 60) errors.push('lookbackDays must be 3–60');
  if (config.minHistory < 3 || config.minHistory > 30) errors.push('minHistory must be 3–30');
  if (config.minHistory >= config.lookbackDays) errors.push('minHistory must be < lookbackDays');
  if (config.warningThreshold < 1.0 || config.warningThreshold > 4.0) errors.push('warningThreshold must be 1.0–4.0');
  if (config.criticalThreshold <= config.warningThreshold) errors.push('criticalThreshold must be > warningThreshold');
  if (config.criticalThreshold > 6.0) errors.push('criticalThreshold must be <= 6.0');
  if (config.funnelDropWarning < 0.05 || config.funnelDropWarning > 0.80) errors.push('funnelDropWarning must be 0.05–0.80');
  if (config.funnelDropCritical <= config.funnelDropWarning) errors.push('funnelDropCritical must be > funnelDropWarning');
  if (config.funnelDropCritical > 0.95) errors.push('funnelDropCritical must be <= 0.95');
  if (config.topCampaignsToCheck < 5 || config.topCampaignsToCheck > 50) errors.push('topCampaignsToCheck must be 5–50');
  if (!Array.isArray(config.metricsToCheck) || config.metricsToCheck.length === 0)
    errors.push('metricsToCheck must be a non-empty array');
  else {
    for (const m of config.metricsToCheck) {
      if (!VALID_METRICS.includes(m)) errors.push(`Unknown metric: ${m}`);
    }
  }
  if (!VALID_OUTLIER_METHODS.includes(config.outlierMethod))
    errors.push(`outlierMethod must be one of: ${VALID_OUTLIER_METHODS.join(', ')}`);
  return { valid: errors.length === 0, errors };
}
