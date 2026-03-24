import type { SnapshotRow, Injection } from './types';

class SeededRandom {
  private state: number;
  constructor(seed: number) { this.state = seed % 2147483647; if (this.state <= 0) this.state += 2147483646; }
  next(): number { this.state = (this.state * 16807) % 2147483647; return (this.state - 1) / 2147483646; }
  int(min: number, max: number): number { return Math.floor(this.next() * (max - min + 1)) + min; }
  pick<T>(arr: T[]): T { return arr[this.int(0, arr.length - 1)]; }
}

const INJECTION_TYPES: Injection['type'][] = ['zero_out', 'spike', 'gradual_decline', 'channel_shift', 'funnel_break'];

export function generateInjections(
  availableDates: string[],
  channels: string[],
  funnels: string[],
  seed: number,
): Injection[] {
  const rng = new SeededRandom(seed);
  const count = rng.int(8, 12);
  const injections: Injection[] = [];
  const usedDates = new Set<string>();

  for (let i = 0; i < count && i < availableDates.length; i++) {
    let date: string;
    let tries = 0;
    do { date = rng.pick(availableDates); tries++; } while (usedDates.has(date) && tries < 50);
    if (usedDates.has(date)) continue;
    usedDates.add(date);

    const type = rng.pick(INJECTION_TYPES);
    const metric = rng.pick(['totalOrders', 'totalRevenue']);
    let dimension: string | null = null;
    let dimensionValue: string | null = null;

    if (type === 'channel_shift' && channels.length >= 2) {
      dimension = 'channel';
      dimensionValue = rng.pick(channels);
    } else if (type === 'funnel_break' && funnels.length > 0) {
      dimension = 'funnel';
      dimensionValue = rng.pick(funnels);
    }

    injections.push({
      id: `inj-${i}`, type, date, metric, dimension, dimensionValue,
      multiplier: type === 'spike' ? rng.int(3, 5) : undefined,
      days: type === 'gradual_decline' ? rng.int(3, 5) : undefined,
    });
  }
  return injections;
}

export function applyInjections(rows: SnapshotRow[], injections: Injection[]): SnapshotRow[] {
  const result = rows.map(r => ({ ...r, date: new Date(r.date) }));

  for (const inj of injections) {
    const targetDate = inj.date;
    switch (inj.type) {
      case 'zero_out':
        for (const row of result) {
          if (row.date.toISOString().slice(0, 10) !== targetDate) continue;
          if (inj.dimension && (row as any)[inj.dimension === 'channel' ? 'channel' : 'funnelId'] !== inj.dimensionValue) continue;
          (row as any)[inj.metric] = 0;
        }
        break;
      case 'spike':
        for (const row of result) {
          if (row.date.toISOString().slice(0, 10) !== targetDate) continue;
          if (inj.dimension && (row as any)[inj.dimension === 'channel' ? 'channel' : 'funnelId'] !== inj.dimensionValue) continue;
          (row as any)[inj.metric] = Math.round((row as any)[inj.metric] * (inj.multiplier ?? 4));
        }
        break;
      case 'gradual_decline': {
        const days = inj.days ?? 3;
        const baseDate = new Date(targetDate + 'T00:00:00Z');
        for (let d = 0; d < days; d++) {
          const checkDate = new Date(baseDate);
          checkDate.setUTCDate(checkDate.getUTCDate() - d);
          const dk = checkDate.toISOString().slice(0, 10);
          const factor = 1 - 0.05 * (days - d);
          for (const row of result) {
            if (row.date.toISOString().slice(0, 10) !== dk) continue;
            (row as any)[inj.metric] = Math.round((row as any)[inj.metric] * factor);
          }
        }
        break;
      }
      case 'channel_shift':
        for (const row of result) {
          if (row.date.toISOString().slice(0, 10) !== targetDate) continue;
          if (row.channel === inj.dimensionValue) {
            (row as any)[inj.metric] -= Math.round((row as any)[inj.metric] * 0.5);
          }
        }
        break;
      case 'funnel_break':
        for (const row of result) {
          if (row.date.toISOString().slice(0, 10) !== targetDate) continue;
          if (row.funnelId === inj.dimensionValue) {
            (row as any)[inj.metric] = Math.round((row as any)[inj.metric] * 0.3);
          }
        }
        break;
    }
  }
  return result;
}
