import { runDetection } from './detector';
import { applyInjections } from './inject';
import type { DetectorConfig, SnapshotRow, Injection, Hint, ScoreBreakdown } from './types';

export function scoreConfig(
  rawSnapshots: SnapshotRow[],
  config: DetectorConfig,
  injections: Injection[],
  hints: Hint[],
): ScoreBreakdown {
  // 1. Apply injections to a copy of the data
  const snapshots = applyInjections(rawSnapshots, injections);

  // 2. Get all unique dates sorted
  const allDates = [...new Set(snapshots.map(s => s.date.toISOString().slice(0, 10)))].sort();

  // Build scoring sets
  const injectionDates = new Set(injections.map(inj => inj.date));
  const realHintDates = new Set(hints.filter(h => h.type === 'real').map(h => h.date));
  const falseAlarmDates = new Set(hints.filter(h => h.type === 'false_alarm').map(h => h.date));
  const shouldFireDates = new Set([...injectionDates, ...realHintDates]);

  let injectionsCaught = 0;
  let hintsCaught = 0;
  let falsePositives = 0;
  let specificityHits = 0;
  let specificityTotal = 0;

  // 3. Run detection for each testable date
  for (let i = config.lookbackDays; i < allDates.length; i++) {
    const todayKey = allDates[i];
    const windowStart = allDates[Math.max(0, i - config.lookbackDays)];
    const windowSnapshots = snapshots.filter(s => {
      const dk = s.date.toISOString().slice(0, 10);
      return dk >= windowStart && dk <= todayKey;
    });

    const detected = runDetection(windowSnapshots, todayKey, config);
    const dayDetections = detected.filter(a => a.date === todayKey);

    if (injectionDates.has(todayKey)) {
      if (dayDetections.length > 0) {
        injectionsCaught++;
        // Check specificity
        const dayInjections = injections.filter(inj => inj.date === todayKey && inj.dimension);
        for (const inj of dayInjections) {
          specificityTotal++;
          const matched = dayDetections.some(d =>
            d.dimension === inj.dimension && d.dimensionValue === inj.dimensionValue
          );
          if (matched) specificityHits++;
        }
      }
    } else if (realHintDates.has(todayKey)) {
      if (dayDetections.length > 0) hintsCaught++;
    } else if (falseAlarmDates.has(todayKey)) {
      if (dayDetections.length > 0) falsePositives++;
    } else {
      // Clean day
      if (dayDetections.length > 0) falsePositives++;
    }
  }

  // 4. Compute scores
  const injectionsTotal = injectionDates.size;
  const hintsTotal = realHintDates.size;
  const catchTotal = injectionsTotal + hintsTotal;
  const catchRate = catchTotal > 0 ? ((injectionsCaught + hintsCaught) / catchTotal) * 100 : 100;

  const cleanDayCount = allDates.length - config.lookbackDays - injectionDates.size - realHintDates.size;
  const quietRate = cleanDayCount > 0 ? Math.max(0, 100 - (falsePositives / cleanDayCount) * 100) : 100;

  const specificityRate = specificityTotal > 0 ? (specificityHits / specificityTotal) * 100 : 100;

  const total = 0.40 * catchRate + 0.40 * quietRate + 0.20 * specificityRate;

  return {
    total, catch: catchRate, quiet: quietRate, specificity: specificityRate,
    details: {
      injectionsCaught, injectionsTotal, hintsCaught, hintsTotal,
      falsePositives, cleanDays: cleanDayCount, specificityHits, specificityTotal,
    },
  };
}
