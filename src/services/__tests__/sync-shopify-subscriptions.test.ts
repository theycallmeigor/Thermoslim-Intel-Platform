import { describe, it, expect } from 'vitest';
import {
  parseFrequency,
  calcBillingCycle,
  buildDedupeKey,
} from '../sync-shopify-subscriptions';

// ── parseFrequency ──────────────────────────────────────────────────────

describe('parseFrequency', () => {
  it('parses "Delivery every month " → 1-month', () => {
    expect(parseFrequency('Delivery every month ')).toBe('1-month');
  });

  it('parses "Delivery every two months " → 2-month', () => {
    expect(parseFrequency('Delivery every two months ')).toBe('2-month');
  });

  it('parses "Delivery every 3 months" → 3-month', () => {
    expect(parseFrequency('Delivery every 3 months')).toBe('3-month');
  });

  it('parses "Delivery every three months" → 3-month', () => {
    expect(parseFrequency('Delivery every three months')).toBe('3-month');
  });

  it('parses weekly plans', () => {
    expect(parseFrequency('Delivery every 2 weeks')).toBe('2-week');
    expect(parseFrequency('Delivery every week')).toBe('1-week');
  });

  it('handles case insensitivity and trimming', () => {
    expect(parseFrequency('  DELIVERY EVERY MONTH  ')).toBe('1-month');
    expect(parseFrequency('delivery every Two Months')).toBe('2-month');
  });

  it('defaults to 1-month for unparseable names', () => {
    expect(parseFrequency('Subscribe & Save')).toBe('1-month');
    expect(parseFrequency('')).toBe('1-month');
  });

  it('output format matches toMonthlyMrr() expectations', () => {
    const result = parseFrequency('Delivery every month');
    expect(result).toMatch(/^\d+-\w+$/);
  });
});

// ── calcBillingCycle ────────────────────────────────────────────────────

describe('calcBillingCycle', () => {
  it('returns 1 for a subscription created today', () => {
    const now = new Date().toISOString();
    expect(calcBillingCycle(now, 1)).toBe(1);
  });

  it('returns correct cycle for ~2 months ago', () => {
    const twoMonthsAgo = new Date(Date.now() - 62 * 24 * 60 * 60 * 1000).toISOString();
    expect(calcBillingCycle(twoMonthsAgo, 1)).toBe(3);
  });

  it('returns 1 minimum — never zero or negative', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(calcBillingCycle(future, 1)).toBe(1);
  });

  it('accounts for interval count (bi-monthly)', () => {
    const fourMonthsAgo = new Date(Date.now() - 122 * 24 * 60 * 60 * 1000).toISOString();
    expect(calcBillingCycle(fourMonthsAgo, 2)).toBe(3);
  });
});

// ── buildDedupeKey ──────────────────────────────────────────────────────

describe('buildDedupeKey', () => {
  it('builds stable key from email + productId + sellingPlanId', () => {
    const key = buildDedupeKey('test@example.com', '12345', 'gid://shopify/SellingPlan/99');
    expect(key).toBe('test@example.com::12345::gid://shopify/SellingPlan/99');
  });

  it('produces different keys for different products', () => {
    const k1 = buildDedupeKey('a@b.com', '111', 'sp1');
    const k2 = buildDedupeKey('a@b.com', '222', 'sp1');
    expect(k1).not.toBe(k2);
  });

  it('produces different keys for different selling plans', () => {
    const k1 = buildDedupeKey('a@b.com', '111', 'sp1');
    const k2 = buildDedupeKey('a@b.com', '111', 'sp2');
    expect(k1).not.toBe(k2);
  });
});
