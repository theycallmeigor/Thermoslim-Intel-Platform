/**
 * Post-ingestion hooks — triggered after data lands in the database.
 *
 * Hooks run asynchronously and never block the ingestion response.
 * The QA hook is debounced: if multiple orders arrive within the
 * debounce window (default 60s), only one QA run fires.
 *
 * When BullMQ/Redis is available, hooks dispatch jobs to the queue
 * instead of running inline. This enables 24/7 background processing.
 */
import { runQAAnalysis } from '../qa/runner';
import type { QARunResult } from '../qa/runner';
import { dispatchQAJob } from '../sync/worker';

// ── Debounce state ──

let qaTimer: ReturnType<typeof setTimeout> | null = null;
let qaRunning = false;
let pendingOrderCount = 0;

/** How long to wait after the last order before triggering QA (ms) */
const QA_DEBOUNCE_MS = 60_000; // 60 seconds

/** Minimum orders needed before QA will run (avoid running on 1 order) */
const QA_MIN_ORDERS = 1;

// ── Public API ──

export type PostHookSource = 'webhook' | 'sync' | 'manual';

/**
 * Notify the post-hook system that orders have been ingested.
 * Call this after runIngestion() completes for order records.
 *
 * @param count Number of orders just ingested
 * @param source Where they came from (webhook, sync, manual)
 */
export function notifyOrdersIngested(count: number, source: PostHookSource): void {
  if (count <= 0) return;

  pendingOrderCount += count;
  console.log(`[post-hooks] ${count} order(s) ingested via ${source} (${pendingOrderCount} pending QA)`);

  // Reset the debounce timer
  if (qaTimer) clearTimeout(qaTimer);

  if (source === 'sync') {
    // After a full sync, run QA immediately (don't debounce)
    scheduleQARun(0);
  } else {
    // Webhooks: debounce — wait for burst to settle
    scheduleQARun(QA_DEBOUNCE_MS);
  }
}

/**
 * Force a QA run right now, bypassing debounce.
 * Used by manual triggers and the BullMQ worker.
 */
export async function forceQARun(options?: { days?: number; quick?: boolean }): Promise<QARunResult | null> {
  return executeQARun(options);
}

// ── Internal ──

function scheduleQARun(delayMs: number): void {
  if (qaTimer) clearTimeout(qaTimer);

  qaTimer = setTimeout(async () => {
    qaTimer = null;
    if (pendingOrderCount < QA_MIN_ORDERS) return;

    // Try BullMQ first — if Redis is available, dispatch to queue
    try {
      const dispatched = await dispatchQAJob({ quick: true });
      if (dispatched) {
        console.log('[post-hooks] QA job dispatched to BullMQ queue');
        pendingOrderCount = 0;
        return;
      }
    } catch {
      // Redis not available — fall through to inline execution
    }

    // Fallback: run inline
    await executeQARun({ quick: true });
  }, delayMs);
}

async function executeQARun(options?: { days?: number; quick?: boolean }): Promise<QARunResult | null> {
  if (qaRunning) {
    console.log('[post-hooks] QA already running, skipping');
    return null;
  }

  qaRunning = true;
  const orderCount = pendingOrderCount;
  pendingOrderCount = 0;

  console.log(`[post-hooks] Starting QA analysis (${orderCount} orders triggered this run)...`);

  try {
    const result = await runQAAnalysis({
      days: options?.days ?? 10,
      quick: options?.quick ?? false,
    });

    console.log(
      `[post-hooks] QA complete: ${result.eventsAnalyzed} events, ${result.correlationsFound} correlations, ` +
      `${result.streaksFound} streaks, ${result.totalLearnings} learnings (${result.durationMs}ms)`,
    );

    if (result.topRisks.length > 0) {
      console.log(`[post-hooks] Top risk: ${result.topRisks[0].field}=${result.topRisks[0].value} (${(result.topRisks[0].failRate * 100).toFixed(0)}% fail, ${result.topRisks[0].lift.toFixed(1)}x baseline)`);
    }

    return result;
  } catch (err) {
    console.error('[post-hooks] QA analysis failed:', err);
    return null;
  } finally {
    qaRunning = false;
  }
}
