/**
 * BullMQ worker — processes sync and QA jobs from dedicated queues.
 *
 * Run with: npm run worker:start
 *
 * Queues:
 *   thermoslim-orders    — sync:cc, sync:shopify  (concurrency 1, 10-min timeout)
 *   thermoslim-analytics — qa:analyze             (concurrency 1, 30-min timeout)
 *   thermoslim-qa        — qa:health              (concurrency 1, 15-min timeout)
 *
 * Dedicated queues prevent a slow CC sync from starving QA jobs and vice versa.
 * When Redis is not available, dispatch functions return false (caller runs inline).
 */
import { Worker, Queue, type Job } from 'bullmq';
import { config } from '../config';
import { createLogger } from '../logger';

const log = createLogger('worker');

// ── Queue names ──────────────────────────────────────────────────────────────

const QUEUE_ORDERS    = 'thermoslim-orders';
const QUEUE_ANALYTICS = 'thermoslim-analytics';
const QUEUE_QA        = 'thermoslim-qa';

// ── Redis connection ─────────────────────────────────────────────────────────

let redisOpts: { host: string; port: number; maxRetriesPerRequest: null } | null = null;

function getRedisOpts(): typeof redisOpts {
  if (redisOpts) return redisOpts;
  if (!config.redis.url) {
    log.warn('No REDIS_URL — running without queue');
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
    log.warn('Invalid REDIS_URL — running without queue');
    return null;
  }
}

// ── Queue accessors ──────────────────────────────────────────────────────────

let ordersQueue: Queue | null = null;
let analyticsQueue: Queue | null = null;
let qaQueue: Queue | null = null;

function getOrdersQueue(): Queue | null {
  if (ordersQueue) return ordersQueue;
  const opts = getRedisOpts();
  if (!opts) return null;
  ordersQueue = new Queue(QUEUE_ORDERS, { connection: opts });
  return ordersQueue;
}

function getAnalyticsQueue(): Queue | null {
  if (analyticsQueue) return analyticsQueue;
  const opts = getRedisOpts();
  if (!opts) return null;
  analyticsQueue = new Queue(QUEUE_ANALYTICS, { connection: opts });
  return analyticsQueue;
}

function getQaQueue(): Queue | null {
  if (qaQueue) return qaQueue;
  const opts = getRedisOpts();
  if (!opts) return null;
  qaQueue = new Queue(QUEUE_QA, { connection: opts });
  return qaQueue;
}

/** @deprecated Use getOrdersQueue / getAnalyticsQueue / getQaQueue */
export function getQueue(): Queue | null {
  return getOrdersQueue();
}

// ── Dispatch helpers ─────────────────────────────────────────────────────────

export async function dispatchQAJob(options?: { days?: number; quick?: boolean }): Promise<boolean> {
  const q = getAnalyticsQueue();
  if (!q) return false;

  await q.add('qa:analyze', {
    days: options?.days ?? 10,
    quick: options?.quick ?? false,
    triggeredAt: new Date().toISOString(),
  }, {
    jobId: 'qa-latest',
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 1
  });

  log.info('QA job dispatched to analytics queue');
  return true;
}

export async function dispatchSyncJob(
  adapter: 'cc' | 'shopify',
  options?: { fullSync?: boolean; startDate?: string },
): Promise<boolean> {
  const q = getOrdersQueue();
  if (!q) return false;

  await q.add(`sync:${adapter}`, {
    ...options,
    triggeredAt: new Date().toISOString(),
  }, {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: { type: 'exponential', delay: 30_000 }
  });

  return true;
}

// ── Job processors ───────────────────────────────────────────────────────────

async function processOrdersJob(job: Job): Promise<void> {
  log.info({ jobName: job.name, jobId: job.id }, 'processing orders job');

  switch (job.name) {
    case 'sync:cc': {
      const { CheckoutChampAdapter } = await import('../../adapters/checkoutchamp');
      const adapter = new CheckoutChampAdapter();
      await adapter.connect();
      const result = await adapter.sync({
        fullSync: job.data.fullSync ?? false,
        startDate: job.data.startDate ? new Date(job.data.startDate) : undefined,
      });
      log.info(
        { processed: result.recordsProcessed, created: result.recordsCreated, updated: result.recordsUpdated, errors: result.errors.length },
        'CC sync complete',
      );
      break;
    }

    case 'sync:shopify': {
      const { ShopifyAdapter } = await import('../../adapters/shopify');
      const adapter = new ShopifyAdapter();
      await adapter.connect();
      const result = await adapter.sync({ fullSync: job.data.fullSync ?? false });
      log.info({ processed: result.recordsProcessed }, 'Shopify sync complete');
      break;
    }

    default:
      log.warn({ jobName: job.name }, 'unknown orders job');
  }
}

async function processAnalyticsJob(job: Job): Promise<void> {
  log.info({ jobName: job.name, jobId: job.id }, 'processing analytics job');

  if (job.name === 'qa:analyze') {
    const { runQAAnalysis } = await import('../qa/runner');
    const result = await runQAAnalysis({
      days: job.data.days ?? 10,
      quick: job.data.quick ?? false,
    });
    log.info(
      { eventsAnalyzed: result.eventsAnalyzed, correlations: result.correlationsFound, streaks: result.streaksFound },
      'QA analysis complete',
    );
  } else {
    log.warn({ jobName: job.name }, 'unknown analytics job');
  }
}

async function processQaJob(job: Job): Promise<void> {
  log.info({ jobName: job.name, jobId: job.id }, 'processing QA job');

  if (job.name === 'qa:health') {
    const { runHealthChecks } = await import('../qa/health-check');
    const result = await runHealthChecks();
    log.info(
      { checks: result.checks.length, issues: result.totalIssues, durationMs: result.durationMs },
      'health checks complete',
    );
  } else {
    log.warn({ jobName: job.name }, 'unknown QA job');
  }
}

// ── Worker startup ───────────────────────────────────────────────────────────

export async function startWorker(): Promise<void> {
  const opts = getRedisOpts();
  if (!opts) {
    log.error('Cannot start — no Redis connection. Set REDIS_URL in .env');
    process.exit(1);
  }

  log.info('Starting BullMQ workers...');

  const workerOpts = { connection: opts, concurrency: 1 };

  const ordersWorker    = new Worker(QUEUE_ORDERS,    processOrdersJob,    workerOpts);
  const analyticsWorker = new Worker(QUEUE_ANALYTICS, processAnalyticsJob, workerOpts);
  const qaWorker        = new Worker(QUEUE_QA,        processQaJob,        workerOpts);

  for (const [name, w] of [['orders', ordersWorker], ['analytics', analyticsWorker], ['qa', qaWorker]] as const) {
    w.on('completed', (job) => log.info({ queue: name, jobName: job.name, jobId: job.id }, 'job completed'));
    w.on('failed', (job, err) => log.error({ queue: name, jobName: job?.name, jobId: job?.id, err: err.message }, 'job failed'));
  }

  // Schedule recurring jobs
  const oq = getOrdersQueue()!;
  const aq = getAnalyticsQueue()!;
  const qq = getQaQueue()!;

  // CC sync every 15 minutes
  await oq.upsertJobScheduler('cc-sync-schedule', { every: 15 * 60 * 1000 }, {
    name: 'sync:cc',
    data: { fullSync: false },
    opts: { removeOnComplete: 5, removeOnFail: 3, attempts: 3, backoff: { type: 'exponential', delay: 30_000 } },
  });

  // Full QA analysis every hour
  await aq.upsertJobScheduler('qa-hourly-schedule', { every: 60 * 60 * 1000 }, {
    name: 'qa:analyze',
    data: { days: 10, quick: false },
    opts: { removeOnComplete: 5, removeOnFail: 3 },
  });

  // Data health checks every 24 hours
  await qq.upsertJobScheduler('health-check-schedule', { every: 24 * 60 * 60 * 1000 }, {
    name: 'qa:health',
    data: {},
    opts: { removeOnComplete: 5, removeOnFail: 3 },
  });

  log.info('Scheduled: CC sync (15min) → orders queue, QA analysis (1hr) → analytics queue, health checks (24hr) → qa queue');
  log.info('Ready and listening for jobs...');
}

// If run directly (npm run worker:start)
if (require.main === module) {
  startWorker().catch((err) => {
    log.error({ err }, 'Fatal worker error');
    process.exit(1);
  });
}
