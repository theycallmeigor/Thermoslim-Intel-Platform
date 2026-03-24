import { describe, it, expect } from 'vitest';
import { validateConfig } from '../../scripts/autoresearch/validate';
import { DEFAULT_CONFIG } from '../../scripts/autoresearch/types';

describe('validateConfig', () => {
  it('accepts the default config', () => {
    expect(validateConfig(DEFAULT_CONFIG)).toEqual({ valid: true, errors: [] });
  });
  it('rejects lookbackDays below 3', () => {
    const result = validateConfig({ ...DEFAULT_CONFIG, lookbackDays: 2 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('lookbackDays must be 3–60');
  });
  it('rejects minHistory >= lookbackDays', () => {
    const result = validateConfig({ ...DEFAULT_CONFIG, minHistory: 14, lookbackDays: 14 });
    expect(result.valid).toBe(false);
  });
  it('rejects criticalThreshold <= warningThreshold', () => {
    const result = validateConfig({ ...DEFAULT_CONFIG, warningThreshold: 3.0, criticalThreshold: 2.5 });
    expect(result.valid).toBe(false);
  });
  it('rejects funnelDropCritical <= funnelDropWarning', () => {
    const result = validateConfig({ ...DEFAULT_CONFIG, funnelDropWarning: 0.5, funnelDropCritical: 0.4 });
    expect(result.valid).toBe(false);
  });
  it('rejects invalid outlierMethod', () => {
    const result = validateConfig({ ...DEFAULT_CONFIG, outlierMethod: 'bad' as any });
    expect(result.valid).toBe(false);
  });
  it('rejects empty metricsToCheck', () => {
    const result = validateConfig({ ...DEFAULT_CONFIG, metricsToCheck: [] });
    expect(result.valid).toBe(false);
  });
  it('rejects unknown metric names', () => {
    const result = validateConfig({ ...DEFAULT_CONFIG, metricsToCheck: ['nonexistent'] });
    expect(result.valid).toBe(false);
  });
});
