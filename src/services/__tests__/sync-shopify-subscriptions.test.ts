import { describe, it, expect } from 'vitest';
import {
  toFrequency,
  calcBillingCycle,
  resolveEventType,
  STATUS_MAP,
} from '../sync-shopify-subscriptions';

// ── toFrequency ────────────────────────────────────────────────────────────

describe('toFrequency', () => {
  it('formats monthly interval', () => {
    expect(toFrequency('MONTH', 1)).toBe('1-month');
    expect(toFrequency('MONTH', 3)).toBe('3-month');
  });

  it('lowercases the interval', () => {
    expect(toFrequency('WEEK', 2)).toBe('2-week');
    expect(toFrequency('DAY', 30)).toBe('30-day');
  });

  it('matches the format expected by toMonthlyMrr()', () => {
    // toMonthlyMrr() expects "{count}-{interval}" — verify the exact delimiter
    const result = toFrequency('MONTH', 1);
    expect(result).toMatch(/^\d+-\w+$/);
  });
});

// ── calcBillingCycle ────────────────────────────────────────────────────────

describe('calcBillingCycle', () => {
  it('returns 1 for a subscription created today', () => {
    const now = new Date().toISOString();
    expect(calcBillingCycle(now, 1)).toBe(1);
  });

  it('returns correct cycle for a monthly sub started ~2 months ago', () => {
    const twoMonthsAgo = new Date(Date.now() - 62 * 24 * 60 * 60 * 1000).toISOString();
    expect(calcBillingCycle(twoMonthsAgo, 1)).toBe(3); // ~2 months = cycle 3
  });

  it('returns 1 minimum — never zero or negative', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(calcBillingCycle(future, 1)).toBe(1);
  });

  it('accounts for interval count (quarterly sub)', () => {
    // 3-month interval, sub started 4 months ago → cycle 2
    const fourMonthsAgo = new Date(Date.now() - 122 * 24 * 60 * 60 * 1000).toISOString();
    expect(calcBillingCycle(fourMonthsAgo, 3)).toBe(2);
  });
});

// ── STATUS_MAP ──────────────────────────────────────────────────────────────

describe('STATUS_MAP', () => {
  it('maps ACTIVE → ACTIVE', () => {
    expect(STATUS_MAP['ACTIVE']).toBe('ACTIVE');
  });

  it('maps PAUSED → PAUSED', () => {
    expect(STATUS_MAP['PAUSED']).toBe('PAUSED');
  });

  it('maps CANCELLED → CANCELLED', () => {
    expect(STATUS_MAP['CANCELLED']).toBe('CANCELLED');
  });

  it('maps EXPIRED → COMPLETE (Shopify expired = terminal, not cancelled)', () => {
    expect(STATUS_MAP['EXPIRED']).toBe('COMPLETE');
  });

  it('returns undefined for unknown statuses (caller falls back to ACTIVE)', () => {
    expect(STATUS_MAP['UNKNOWN_FUTURE_STATUS']).toBeUndefined();
  });
});

// ── resolveEventType ────────────────────────────────────────────────────────

describe('resolveEventType', () => {
  it('returns CREATED for new subscriptions', () => {
    expect(resolveEventType(undefined, 'ACTIVE', true)).toBe('CREATED');
    expect(resolveEventType(undefined, 'PAUSED', true)).toBe('CREATED');
  });

  it('returns null when status has not changed', () => {
    expect(resolveEventType('ACTIVE', 'ACTIVE', false)).toBeNull();
    expect(resolveEventType('PAUSED', 'PAUSED', false)).toBeNull();
  });

  it('returns null when there is no previous status (not new)', () => {
    expect(resolveEventType(undefined, 'ACTIVE', false)).toBeNull();
  });

  it('returns CANCELLED on ACTIVE → CANCELLED', () => {
    expect(resolveEventType('ACTIVE', 'CANCELLED', false)).toBe('CANCELLED');
  });

  it('returns PAUSED on ACTIVE → PAUSED', () => {
    expect(resolveEventType('ACTIVE', 'PAUSED', false)).toBe('PAUSED');
  });

  it('returns EXPIRED on ACTIVE → COMPLETE', () => {
    expect(resolveEventType('ACTIVE', 'COMPLETE', false)).toBe('EXPIRED');
  });

  it('returns RESUMED on PAUSED → ACTIVE', () => {
    expect(resolveEventType('PAUSED', 'ACTIVE', false)).toBe('RESUMED');
  });

  it('returns REACTIVATED on CANCELLED → ACTIVE', () => {
    expect(resolveEventType('CANCELLED', 'ACTIVE', false)).toBe('REACTIVATED');
  });

  it('returns null for unmapped transitions', () => {
    // e.g. COMPLETE → ACTIVE has no defined event type
    expect(resolveEventType('COMPLETE', 'ACTIVE', false)).toBeNull();
  });
});
