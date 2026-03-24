import { describe, it, expect } from 'vitest';
import { analyzeOrders } from '../../scripts/autoresearch/order-analyzer';
import type { OrderRow } from '../../scripts/autoresearch/order-analyzer';

function makeOrder(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    id: 'test-' + Math.random().toString(36).slice(2),
    status: 'COMPLETE',
    paySource: 'CREDITCARD',
    responseType: 'SUCCESS',
    campaignId: 'camp1',
    campaignName: 'Campaign 1',
    salesUrl: null,
    ccOrderType: 'NEW_SALE',
    orderTotal: 5000,
    createdAt: new Date('2026-03-15T12:00:00Z'),
    items: [{ name: 'ThermoSlim', sku: 'TS-1', price: 5000, quantity: 1, productCategoryName: 'Supplements', recurringStatus: null }],
    ...overrides,
  };
}

function makeBaseline(count: number, overrides: Partial<OrderRow> = {}): OrderRow[] {
  return Array.from({ length: count }, (_, i) =>
    makeOrder({
      createdAt: new Date(`2026-03-${String(1 + (i % 14)).padStart(2, '0')}T${String(8 + (i % 12)).padStart(2, '0')}:00:00Z`),
      ...overrides,
    })
  );
}

describe('order-analyzer', () => {
  it('returns empty findings when distributions match', () => {
    const baseline = makeBaseline(100);
    const flagged = makeBaseline(25);
    const result = analyzeOrders(flagged, baseline, '2026-03-15', 14);
    expect(result.flaggedOrderCount).toBe(25);
    expect(result.findings.length).toBe(0);
  });

  it('detects payment method distribution shift', () => {
    const baseline = makeBaseline(100, { paySource: 'CREDITCARD' });
    const flagged = Array.from({ length: 20 }, () => makeOrder({ paySource: 'APPLEPAY' }));
    const result = analyzeOrders(flagged, baseline, '2026-03-15', 14);
    const pmFinding = result.findings.find((f) => f.category === 'paymentMethod');
    expect(pmFinding).toBeDefined();
    expect(pmFinding!.finding).toContain('Missing payment methods: CREDITCARD');
  });

  it('detects high decline rate', () => {
    const baseline = makeBaseline(100, { status: 'COMPLETE' });
    const flagged = [
      ...Array.from({ length: 15 }, () => makeOrder({ status: 'DECLINED', responseType: 'HARD_DECLINE' })),
      ...Array.from({ length: 5 }, () => makeOrder({ status: 'COMPLETE' })),
    ];
    const result = analyzeOrders(flagged, baseline, '2026-03-15', 14);
    const declineFinding = result.findings.find((f) => f.category === 'declineRate');
    expect(declineFinding).toBeDefined();
    expect(declineFinding!.finding).toContain('75.0%');
  });

  it('detects partial vs complete ratio shift', () => {
    const baseline = makeBaseline(100, { status: 'COMPLETE' });
    const flagged = [
      ...Array.from({ length: 15 }, () => makeOrder({ status: 'PARTIAL' })),
      ...Array.from({ length: 5 }, () => makeOrder({ status: 'COMPLETE' })),
    ];
    const result = analyzeOrders(flagged, baseline, '2026-03-15', 14);
    const partialFinding = result.findings.find((f) => f.category === 'partialRatio');
    expect(partialFinding).toBeDefined();
    expect(partialFinding!.finding).toContain('increased');
  });

  it('detects campaign dropout', () => {
    const baseline = [
      ...makeBaseline(50, { campaignName: 'Campaign A' }),
      ...makeBaseline(50, { campaignName: 'Campaign B' }),
    ];
    // All flagged orders from Campaign A only — Campaign B is missing
    const flagged = Array.from({ length: 20 }, () => makeOrder({ campaignName: 'Campaign A' }));
    const result = analyzeOrders(flagged, baseline, '2026-03-15', 14);
    const dropoutFinding = result.findings.find((f) => f.category === 'campaignDropout');
    expect(dropoutFinding).toBeDefined();
    expect(dropoutFinding!.finding).toContain('Campaign B');
  });

  it('detects decline pattern anomaly with hard declines', () => {
    const baseline = [
      ...makeBaseline(90, { status: 'COMPLETE' }),
      ...makeBaseline(10, { status: 'DECLINED', responseType: 'SOFT_DECLINE' }),
    ];
    const flagged = [
      ...Array.from({ length: 5 }, () => makeOrder({ status: 'COMPLETE' })),
      ...Array.from({ length: 10 }, () => makeOrder({ status: 'DECLINED', responseType: 'HARD_DECLINE' })),
    ];
    const result = analyzeOrders(flagged, baseline, '2026-03-15', 14);
    const declinePattern = result.findings.find((f) => f.category === 'declinePattern');
    expect(declinePattern).toBeDefined();
    expect(declinePattern!.finding).toContain('Hard decline rate');
  });

  it('returns no findings when flagged day has zero orders', () => {
    const baseline = makeBaseline(100);
    const result = analyzeOrders([], baseline, '2026-03-15', 14);
    expect(result.flaggedOrderCount).toBe(0);
    expect(result.findings.length).toBe(0);
  });

  it('detects AOV shift', () => {
    const baseline = makeBaseline(100, { orderTotal: 5000 }); // $50
    const flagged = Array.from({ length: 20 }, () => makeOrder({ orderTotal: 10000 })); // $100
    const result = analyzeOrders(flagged, baseline, '2026-03-15', 14);
    const aovFinding = result.findings.find((f) => f.category === 'avgOrderValue');
    expect(aovFinding).toBeDefined();
    expect(aovFinding!.finding).toContain('increased');
  });
});
