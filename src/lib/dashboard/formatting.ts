import { startOfDay, subDays } from 'date-fns';

/** Format cents as $X.XX */
export function fmt$(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Format cents as $Xk or $XM for large values, $X.XX for small */
export function fmtK(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(2)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}k`;
  return fmt$(cents);
}

/** Format cents with abbreviated suffix (no decimals for small) */
export function fmtDollars(cents: number): string {
  const d = cents / 100;
  if (d >= 1_000_000) return `$${(d / 1_000_000).toFixed(1)}M`;
  if (d >= 1000) return `$${(d / 1000).toFixed(1)}k`;
  return `$${d.toFixed(0)}`;
}

/** Calculate period-over-period percentage change */
export function pctChange(curr: number, prev: number): string | null {
  if (prev === 0) return null;
  const pct = ((curr - prev) / prev) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

/** Format Date to YYYY-MM-DD string */
export function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Parse date range from URL params with previous period for comparison */
export function parseRange(from?: string, to?: string) {
  const endDate = to ? new Date(to + 'T23:59:59Z') : new Date();
  const startDate = from ? new Date(from + 'T00:00:00Z') : startOfDay(subDays(endDate, 29));
  const rangeDays = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
  const prevEnd = new Date(startDate.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - rangeDays * 86400000);
  return { startDate, endDate, prevStart, prevEnd };
}

/** Normalize subscription recurring price to monthly MRR */
export function toMonthlyMrr(recurringPrice: number, frequency: string | null): number {
  const freqMonths: Record<string, number> = { '1-month': 1, '3-month': 3, '6-month': 6 };
  const months = freqMonths[frequency ?? ''] ?? 1;
  return Math.round(recurringPrice / months);
}
