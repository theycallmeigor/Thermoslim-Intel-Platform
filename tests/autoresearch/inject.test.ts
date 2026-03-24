import { describe, it, expect } from 'vitest';
import { generateInjections, applyInjections } from '../../scripts/autoresearch/inject';
import type { SnapshotRow, Injection } from '../../scripts/autoresearch/types';

function makeRow(date: string, overrides: Partial<SnapshotRow> = {}): SnapshotRow {
  return {
    date: new Date(date + 'T00:00:00Z'),
    campaignId: null, campaignName: null, productLine: null,
    channel: 'direct', funnelId: null,
    totalOrders: 10, totalRevenue: 50000, newOrders: 8, recurringOrders: 2,
    newSubscribers: 2, cancelledSubscribers: 0, refunds: 0, avgOrderValue: 5000,
    ...overrides,
  };
}

describe('generateInjections', () => {
  it('generates deterministic injections with same seed', () => {
    const dates = ['2026-02-01', '2026-02-15', '2026-03-01'];
    const channels = ['direct', 'cc_onetime'];
    const funnels = ['checkout2'];
    const a = generateInjections(dates, channels, funnels, 42);
    const b = generateInjections(dates, channels, funnels, 42);
    expect(a).toEqual(b);
  });

  it('generates 8-12 injections', () => {
    const dates = Array.from({ length: 30 }, (_, i) => `2026-02-${String(i + 1).padStart(2, '0')}`);
    const result = generateInjections(dates, ['direct'], ['checkout2'], 123);
    expect(result.length).toBeGreaterThanOrEqual(8);
    expect(result.length).toBeLessThanOrEqual(12);
  });
});

describe('applyInjections', () => {
  it('zero_out sets metric to 0', () => {
    const rows = [makeRow('2026-02-10')];
    const injections: Injection[] = [{
      id: 'test-1', type: 'zero_out', date: '2026-02-10',
      metric: 'totalOrders', dimension: null, dimensionValue: null,
    }];
    const result = applyInjections(rows, injections);
    expect(result[0].totalOrders).toBe(0);
  });

  it('spike multiplies metric', () => {
    const rows = [makeRow('2026-02-10')];
    const injections: Injection[] = [{
      id: 'test-2', type: 'spike', date: '2026-02-10',
      metric: 'totalRevenue', dimension: null, dimensionValue: null, multiplier: 5,
    }];
    const result = applyInjections(rows, injections);
    expect(result[0].totalRevenue).toBe(250000);
  });

  it('does not mutate original rows', () => {
    const rows = [makeRow('2026-02-10')];
    const injections: Injection[] = [{
      id: 'test-3', type: 'zero_out', date: '2026-02-10',
      metric: 'totalOrders', dimension: null, dimensionValue: null,
    }];
    applyInjections(rows, injections);
    expect(rows[0].totalOrders).toBe(10);
  });
});
