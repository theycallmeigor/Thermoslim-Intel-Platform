import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

/**
 * Create a child logger scoped to a module.
 *
 * Usage:
 *   const log = createLogger('pipeline');
 *   log.info({ orderId }, 'order ingested');
 *   log.error({ err }, 'ingestion failed');
 */
export function createLogger(module: string) {
  return logger.child({ module });
}
