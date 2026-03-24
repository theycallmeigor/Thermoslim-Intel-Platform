import { describe, it, expect } from 'vitest';
import { scoreConfig } from '../../scripts/autoresearch/evaluate';
import { DEFAULT_CONFIG } from '../../scripts/autoresearch/types';
import type { SnapshotRow, Injection, Hint } from '../../scripts/autoresearch/types';

function makeRows(days: number): SnapshotRow[] {
  const rows: SnapshotRow[] = [];
  const base = new Date('2026-03-21T00:00:00Z');
  for (let i = days; i >= 0; i--) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - i);
    rows.push({
      date: d, campaignId: null, campaignName: null, productLine: null,
      channel: 'direct', funnelId: null,
      totalOrders: 10, totalRevenue: 50000, newOrders: 8, recurringOrders: 2,
      newSubscribers: 2, cancelledSubscribers: 0, refunds: 0, avgOrderValue: 5000,
    });
  }
  return rows;
}

describe('scoreConfig', () => {
  it('returns high quiet rate for stable data with no injections', () => {
    const rows = makeRows(30);
    const result = scoreConfig(rows, DEFAULT_CONFIG, [], []);
    expect(result.quiet).toBeGreaterThanOrEqual(90);
  });

  it('returns high catch rate when injection is detected', () => {
    const rows = makeRows(30);
    const targetDate = rows[25].date.toISOString().slice(0, 10);
    const injections: Injection[] = [{
      id: 'i1', type: 'zero_out', date: targetDate,
      metric: 'totalOrders', dimension: null, dimensionValue: null,
    }];
    const result = scoreConfig(rows, DEFAULT_CONFIG, injections, []);
    expect(result.catch).toBeGreaterThan(0);
  });

  it('penalizes false alarms on false_alarm hint days', () => {
    const rows = makeRows(30);
    rows[20].totalOrders = 100;
    const hints: Hint[] = [{
      date: rows[20].date.toISOString().slice(0, 10),
      type: 'false_alarm', description: 'expected spike',
    }];
    const looseConfig = { ...DEFAULT_CONFIG, warningThreshold: 1.2 };
    const result = scoreConfig(rows, looseConfig, [], hints);
    expect(result.quiet).toBeLessThan(100);
  });

  it('tight threshold catches more injections than loose', () => {
    const rows = makeRows(30);
    const targetDate = rows[25].date.toISOString().slice(0, 10);
    const injections: Injection[] = [{
      id: 'i1', type: 'zero_out', date: targetDate,
      metric: 'totalOrders', dimension: null, dimensionValue: null,
    }];
    const tight = scoreConfig(rows, { ...DEFAULT_CONFIG, warningThreshold: 1.5 }, injections, []);
    const loose = scoreConfig(rows, { ...DEFAULT_CONFIG, warningThreshold: 3.8 }, injections, []);
    expect(tight.catch).toBeGreaterThanOrEqual(loose.catch);
  });
});
