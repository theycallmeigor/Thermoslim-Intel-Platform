import { describe, it, expect } from 'vitest';
import { fmt$, fmtK, fmtDollars, pctChange, toYMD, parseRange } from '../formatting';

describe('fmt$', () => {
  it('formats cents to dollars with 2 decimals', () => {
    expect(fmt$(4999)).toBe('$49.99');
    expect(fmt$(0)).toBe('$0.00');
    expect(fmt$(100)).toBe('$1.00');
  });
});

describe('fmtK', () => {
  it('formats large values with k/M suffix', () => {
    expect(fmtK(100_000)).toBe('$1.0k'); // 100000 cents = $1000
    expect(fmtK(500_000_000)).toBe('$5.00M'); // 500M cents = $5M
  });
  it('formats small values normally', () => {
    expect(fmtK(4999)).toBe('$49.99');
  });
});

describe('fmtDollars', () => {
  it('formats with k/M suffix', () => {
    expect(fmtDollars(150000)).toBe('$1.5k'); // 150000 cents
    expect(fmtDollars(100_000_000)).toBe('$1.0M');
  });
});

describe('pctChange', () => {
  it('returns null when prev is 0', () => {
    expect(pctChange(100, 0)).toBeNull();
  });
  it('returns formatted percentage', () => {
    expect(pctChange(110, 100)).toBe('+10.0%');
    expect(pctChange(90, 100)).toBe('-10.0%');
  });
});

describe('toYMD', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(toYMD(new Date('2026-03-30T15:00:00Z'))).toBe('2026-03-30');
  });
});

describe('parseRange', () => {
  it('returns date range with previous period', () => {
    const result = parseRange('2026-03-01', '2026-03-30');
    expect(result.startDate.toISOString()).toContain('2026-03-01');
    expect(result.endDate.toISOString()).toContain('2026-03-30');
    expect(result.prevStart).toBeDefined();
    expect(result.prevEnd).toBeDefined();
  });
  it('defaults to last 30 days when no args', () => {
    const result = parseRange();
    expect(result.startDate < result.endDate).toBe(true);
  });
});
