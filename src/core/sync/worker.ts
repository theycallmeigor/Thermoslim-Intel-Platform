/**
 * BullMQ worker — processes sync and QA jobs from the queue.
 *
 * Run with: npm run worker:start
 *
 * Jobs:
 *   - qa:analyze    — Run QA multi-resolution analysis
 *   - sync:cc       — Sync CheckoutChamp orders
 *   - sync:shopify  — Sync Shopify orders
 *
 * When Redis is not available, falls back to direct execution.
 */
import { Worker, Queue, type Job } from 'bullmq';
import { config } from '../config';

const QUEUE_NAME = 'thermoslim-jobs';

// ── Redis connection (lazy) ──
// Use BullMQ's built-in ioredis to avoid version mismatch with top-level ioredis

let redisOpts: { host: string; port: number; maxRetriesPerRequest: null } | null = null;

function getRedisOpts(): typeof redisOpts {
  if (redisOpts) return redisOpts;
  if (!config.redis.url) {
    console.log('[worker] No REDIS_URL — running without queue');
    return null;
  }
  try {
    const url = new URL(config.redis.url);
    redisOpts = {
      host: url.hostname,
      port: parseInt(url.port || '6379'),
      maxRetriesPerRequest: null,
    };
    return redisOpts;
  } catch {
    console.log('[worker] Invalid REDIS_URL — running without queue');
    return null;
  }
}

// ── Queue (for dispatching jobs from the app) ──

let queue: Queue | null = null;

export function getQueue(): Queue | null {
  if (queue) return queue;
  const opts = getRedisOpts();
  if (!opts) return null;
  queue = new Queue(QUEUE_NAME, { connection: opts });
  return queue;
}

/**
 * Dispatch a QA analysis job to the queue.
 * If Redis is unavailable, returns false (caller should run inline).
 */
export async function dispatchQAJob(options?: { days?: number; quick?: boolean }): Promise<boolean> {
  const q = getQueue();
  if (!q) return false;

  await q.add('qa:analyze', {
    days: options?.days ?? 10,
    quick: options?.quick ?? false,
    triggeredAt: new Date().toISOString(),
  }, {
    // Deduplicate: only one QA job in the queue at a time
    jobId: 'qa-latest',
    removeOnComplete: 10,
    removeOnFail: 5,
    // Don't retry QA — it's idempotent and will run again on next trigger
    attempts: 1,
  });

  console.log('[worker] QA job dispatched to queue');
  return true;
}

/**
 * Dispatch a sync job to the queue.
 */
export async function dispatchSyncJob(
  adapter: 'cc' | 'shopify',
  options?: { fullSync?: boolean; startDate?: string },
): Promise<boolean> {
  const q = getQueue();
  if (!q) return false;

  await q.add(`sync:${adapter}`, {
    ...options,
    triggeredAt: new Date().toISOString(),
  }, {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: { type: 'exponential', delay: 30_000 },
  });

  return true;
}

// ── Worker (runs in a separate process via npm run worker:start) ──

async function processJob(job: Job): Promise<void> {
  console.log(`[worker] Processing ${job.name} (${job.id})`);

  switch (job.name) {
    case 'qa:analyze': {
      const { runQAAnalysis } = await import('../qa/runner');
      const result = await runQAAnalysis({
        days: job.data.days ?? 10,
        quick: job.data.quick ?? false,
      });
      console.log(`[worker] QA complete: ${result.eventsAnalyzed} events, ${result.correlationsFound} correlations, ${result.streaksFound} streaks`);
      break;
    }

    case 'sync:cc': {
      const { CheckoutChampAdapter } = await import('../../adapters/checkoutchamp');
      const adapter = new CheckoutChampAdapter();
      await adapter.connect();
      const result = await adapter.sync({
        fullSync: job.data.fullSync ?? false,
        startDate: job.data.startDate ? new Date(job.data.startDate) : undefined,
      });
      console.log(`[worker] CC sync: ${result.recordsProcessed} processed, ${result.recordsCreated} created, ${result.recordsUpdated} updated`);
      break;
    }

    case 'sync:shopify': {
      const { ShopifyAdapter } = await import('../../adapters/shopify');
      const adapter = new ShopifyAdapter();
      await adapter.connect();
      const result = await adapter.sync({
        fullSync: job.data.fullSync ?? false,
      });
      console.log(`[worker] Shopify sync: ${result.recordsProcessed} processed`);
      break;
    }

    default:
      console.log(`[worker] Unknown job: ${job.name}`);
  }
}

// ── Start worker (only when run directly) ──

export async function startWorker(): Promise<void> {
  const opts = getRedisOpts();
  if (!opts) {
    console.error('[worker] Cannot start — no Redis connection. Set REDIS_URL in .env');
    process.exit(1);
  }

  console.log('[worker] Starting BullMQ worker...');

  const worker = new Worker(QUEUE_NAME, processJob, {
    connection: opts,
    concurrency: 1, // One job at a time — QA and sync should not overlap
  });

  worker.on('completed', (job) => {
    console.log(`[worker] ✓ ${job.name} completed (${job.id})`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[worker] ✗ ${job?.name} failed:`, err.message);
  });

  // Schedule recurring jobs
  const q = getQueue()!;

  // CC sync every 15 minutes
  await q.upsertJobScheduler('cc-sync-schedule', {
    every: 15 * 60 * 1000,
  }, {
    name: 'sync:cc',
    data: { fullSync: false },
    opts: { removeOnComplete: 5, removeOnFail: 3, attempts: 3, backoff: { type: 'exponential', delay: 30_000 } },
  });

  // Full QA analysis every hour
  await q.upsertJobScheduler('qa-hourly-schedule', {
    every: 60 * 60 * 1000,
  }, {
    name: 'qa:analyze',
    data: { days: 10, quick: false },
    opts: { removeOnComplete: 5, removeOnFail: 3 },
  });

  console.log('[worker] Scheduled: CC sync (15min), QA analysis (1hr)');
  console.log('[worker] Ready and listening for jobs...');
}

// If run directly (npm run worker:start)
if (require.main === module) {
  startWorker().catch((err) => {
    console.error('[worker] Fatal:', err);
    process.exit(1);
  });
}
