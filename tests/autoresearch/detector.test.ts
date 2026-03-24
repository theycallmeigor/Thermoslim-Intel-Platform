import { describe, it, expect } from 'vitest';
import { runDetection } from '../../scripts/autoresearch/detector';
import { DEFAULT_CONFIG } from '../../scripts/autoresearch/types';
import type { SnapshotRow } from '../../scripts/autoresearch/types';

function makeDay(dateStr: string, overrides: Partial<SnapshotRow> = {}): SnapshotRow {
  return {
    date: new Date(dateStr + 'T00:00:00Z'),
    campaignId: null, campaignName: null, productLine: null,
    channel: null, funnelId: null,
    totalOrders: 10, totalRevenue: 50000, newOrders: 8, recurringOrders: 2,
    newSubscribers: 2, cancelledSubscribers: 0, refunds: 0, avgOrderValue: 5000,
    ...overrides,
  };
}

function generate14Days(baseDate: string): SnapshotRow[] {
  const rows: SnapshotRow[] = [];
  const base = new Date(baseDate + 'T00:00:00Z');
  for (let i = 14; i >= 1; i--) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - i);
    rows.push(makeDay(d.toISOString().slice(0, 10)));
  }
  return rows;
}

describe('runDetection', () => {
  it('returns no anomalies for stable data', () => {
    const today = '2026-03-21';
    const data = [...generate14Days(today), makeDay(today)];
    const result = runDetection(data, today, DEFAULT_CONFIG);
    expect(result.filter(a => a.type === 'METRIC')).toHaveLength(0);
  });

  it('detects a spike as WARNING or CRITICAL', () => {
    const today = '2026-03-21';
    const data = [...generate14Days(today), makeDay(today, { totalOrders: 100 })];
    const result = runDetection(data, today, DEFAULT_CONFIG);
    const orderAnomalies = result.filter(a => a.metric === 'totalOrders' && a.dimension === null);
    expect(orderAnomalies.length).toBeGreaterThan(0);
    expect(['WARNING', 'CRITICAL']).toContain(orderAnomalies[0].severity);
  });

  it('detects a zero-out as anomalous', () => {
    const today = '2026-03-21';
    const data = [...generate14Days(today), makeDay(today, { totalOrders: 0, totalRevenue: 0 })];
    const result = runDetection(data, today, DEFAULT_CONFIG);
    expect(result.filter(a => a.metric === 'totalOrders').length).toBeGreaterThan(0);
  });

  it('respects configurable warningThreshold', () => {
    const today = '2026-03-21';
    const data = [...generate14Days(today), makeDay(today, { totalOrders: 25 })];
    const looseConfig = { ...DEFAULT_CONFIG, warningThreshold: 3.5 };
    const tightConfig = { ...DEFAULT_CONFIG, warningThreshold: 1.5 };
    const loose = runDetection(data, today, looseConfig);
    const tight = runDetection(data, today, tightConfig);
    expect(tight.length).toBeGreaterThanOrEqual(loose.length);
  });

  it('detects funnel breakage', () => {
    const today = '2026-03-21';
    const history = generate14Days(today).flatMap(row => [
      row,
      makeDay(row.date.toISOString().slice(0, 10), { funnelId: 'funnelA', totalOrders: 5 }),
    ]);
    const todayRows = [
      makeDay(today),
      makeDay(today, { funnelId: 'funnelA', totalOrders: 1 }),
    ];
    const result = runDetection([...history, ...todayRows], today, DEFAULT_CONFIG);
    const funnelAnomalies = result.filter(a => a.type === 'FUNNEL');
    expect(funnelAnomalies.length).toBeGreaterThan(0);
  });
});
