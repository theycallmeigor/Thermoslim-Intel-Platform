import { prisma } from '../lib/prisma';
import { config } from '../core/config';
import type { SubscriptionEventType, SubscriptionStatus } from '@prisma/client';

const BASE_URL = 'https://a.klaviyo.com/api';
const REVISION = '2024-10-15';
const CURSOR_KEY = 'klaviyo-loop-events';
const DEFAULT_BACKFILL_DAYS = 90;

function headers(): Record<string, string> {
  return {
    Authorization: `Klaviyo-API-Key ${config.klaviyo.apiKey}`,
    revision: REVISION,
    Accept: 'application/json',
  };
}

// --- Event mapping ---

const METRIC_TO_EVENT_TYPE: Record<string, SubscriptionEventType> = {
  loop_subscription_started: 'CREATED',
  loop_order_processed: 'BILLED',
  loop_billing_attempt_failed: 'DECLINED',
  loop_billing_attempt_failed_and_will_be_retried: 'DECLINED',
  loop_billing_attempt_failed_and_last_retry_left: 'DECLINED',
  loop_subscription_cancelled: 'CANCELLED',
  loop_subscription_paused: 'PAUSED',
  loop_subscription_resumed: 'RESUMED',
  loop_subscription_reactivated: 'REACTIVATED',
  loop_subscription_expired: 'EXPIRED',
  loop_order_skipped: 'SKIPPED',
};

export function mapLoopMetricToEventType(metricName: string): SubscriptionEventType | null {
  return METRIC_TO_EVENT_TYPE[metricName] ?? null;
}

interface SubscriptionUpdate {
  status?: SubscriptionStatus;
  cancelledAt?: Date;
  cancelReason?: string;
  lastBilledAt?: Date;
}

export function mapLoopEventToSubscriptionUpdate(
  eventType: SubscriptionEventType,
  eventProperties: Record<string, unknown>,
  occurredAt: Date,
): SubscriptionUpdate | null {
  switch (eventType) {
    case 'CREATED':
      return { status: 'ACTIVE' };
    case 'CANCELLED':
      return {
        status: 'CANCELLED',
        cancelledAt: occurredAt,
        cancelReason: (eventProperties.cancel_reason as string | undefined) ?? undefined,
      };
    case 'EXPIRED':
      return {
        status: 'CANCELLED',
        cancelledAt: occurredAt,
        cancelReason: 'Subscription expired',
      };
    case 'PAUSED':
      return { status: 'PAUSED' };
    case 'RESUMED':
      return { status: 'ACTIVE' };
    case 'REACTIVATED':
      return { status: 'ACTIVE' };
    case 'BILLED':
      return { lastBilledAt: occurredAt };
    case 'SKIPPED':
      return null;
    case 'DECLINED':
      return null;
    default:
      return null;
  }
}

// --- Klaviyo API types ---

interface KlaviyoMetric {
  id: string;
  attributes: { name: string };
}

interface KlaviyoEvent {
  id: string;
  attributes: {
    datetime: string;
    event_properties: Record<string, unknown>;
    metric_id: string;
    profile_id: string;
  };
  relationships?: {
    profile?: { data?: { id: string } };
  };
}

// --- Klaviyo API helpers ---

async function fetchAllPages<T>(path: string): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = `${BASE_URL}${path}`;

  while (url) {
    const resp = await fetch(url, { headers: headers() });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Klaviyo API error ${resp.status}: ${body.slice(0, 200)}`);
    }
    const json: { data?: T[]; links?: { next?: string } } = await resp.json();
    results.push(...(json.data ?? []));
    url = json.links?.next ?? null;
  }

  return results;
}

async function fetchLoopMetricIds(): Promise<Map<string, string>> {
  const metrics = await fetchAllPages<KlaviyoMetric>('/metrics');
  const result = new Map<string, string>();
  for (const m of metrics) {
    if (m.attributes.name.startsWith('loop_')) {
      result.set(m.id, m.attributes.name);
    }
  }
  return result;
}

async function fetchEventsForMetric(metricId: string, sinceDate: string): Promise<KlaviyoEvent[]> {
  const filter = `equals(metric_id,"${metricId}"),greater-or-equal(datetime,"${sinceDate}")`;
  return fetchAllPages<KlaviyoEvent>(`/events?filter=${encodeURIComponent(filter)}&sort=datetime`);
}

async function resolveProfileEmail(profileId: string): Promise<string | null> {
  const resp = await fetch(
    `${BASE_URL}/profiles/${profileId}?fields[profile]=email`,
    { headers: headers() },
  );
  if (!resp.ok) {
    console.error(`[sync-loop-events] profile fetch failed ${profileId}: ${resp.status}`);
    return null;
  }
  const json: { data?: { attributes?: { email?: string | null } } } = await resp.json();
  return json.data?.attributes?.email ?? null;
}

// --- Main sync ---

export async function syncLoopEvents(): Promise<{
  processed: number;
  skipped: number;
  unmatched: number;
  errors: number;
}> {
  const start = Date.now();
  console.log('[sync-loop-events] starting');

  const metricMap = await fetchLoopMetricIds();
  console.log(`[sync-loop-events] found ${metricMap.size} loop metrics`);

  const cursorRow = await prisma.syncCursor.findUnique({ where: { key: CURSOR_KEY } });
  const sinceDate = cursorRow
    ? cursorRow.cursor
    : new Date(Date.now() - DEFAULT_BACKFILL_DAYS * 86400 * 1000).toISOString();

  const allEvents: Array<{ event: KlaviyoEvent; metricName: string }> = [];
  for (const [metricId, metricName] of metricMap) {
    const events = await fetchEventsForMetric(metricId, sinceDate);
    for (const event of events) {
      allEvents.push({ event, metricName });
    }
  }

  allEvents.sort((a, b) =>
    a.event.attributes.datetime.localeCompare(b.event.attributes.datetime),
  );

  console.log(`[sync-loop-events] ${allEvents.length} events to process`);

  const pLimit = (await import('p-limit')).default;
  const limit = pLimit(5);

  let processed = 0;
  let skipped = 0;
  let unmatched = 0;
  let errors = 0;

  const profileEmailCache = new Map<string, string | null>();
  let lastDatetime: string | null = null;

  await Promise.all(
    allEvents.map(({ event, metricName }) =>
      limit(async () => {
        const klaviyoEventId = event.id;
        lastDatetime = event.attributes.datetime;

        const eventType = mapLoopMetricToEventType(metricName);
        if (!eventType) {
          skipped++;
          return;
        }

        const existing = await prisma.subscriptionEvent.findUnique({
          where: { klaviyoEventId },
          select: { id: true },
        });
        if (existing) {
          skipped++;
          return;
        }

        const profileId =
          event.relationships?.profile?.data?.id ?? event.attributes.profile_id;

        if (!profileEmailCache.has(profileId)) {
          profileEmailCache.set(profileId, await resolveProfileEmail(profileId));
        }
        const email = profileEmailCache.get(profileId) ?? null;

        if (!email) {
          console.error(`[sync-loop-events] no email for profile ${profileId}, event ${klaviyoEventId}`);
          errors++;
          return;
        }

        try {
          const customer = await prisma.customer.upsert({
            where: { email },
            update: {},
            create: { email },
            select: { id: true },
          });

          const subscriptions = await prisma.subscription.findMany({
            where: { customerId: customer.id, source: 'SHOPIFY' },
            select: { id: true, status: true },
          });

          if (subscriptions.length === 0) {
            await prisma.ingestionError.create({
              data: {
                source: 'LOOP',
                errorType: 'UNMATCHED_LOOP_EVENT',
                message: `No SHOPIFY subscription for customer ${email}`,
                payload: { klaviyoEventId, metricName, email },
              },
            });
            unmatched++;
            return;
          }

          const occurredAt = new Date(event.attributes.datetime);
          const properties = event.attributes.event_properties ?? {};
          const subscriptionUpdate = mapLoopEventToSubscriptionUpdate(eventType, properties, occurredAt);

          const nextBillDate =
            typeof properties.next_charge_scheduled_at === 'string'
              ? new Date(properties.next_charge_scheduled_at)
              : typeof properties.rescheduled_date === 'string'
                ? new Date(properties.rescheduled_date)
                : null;

          for (const sub of subscriptions) {
            try {
              await prisma.$transaction(async (tx) => {
                await tx.subscriptionEvent.create({
                  data: {
                    subscriptionId: sub.id,
                    eventType,
                    fromStatus: sub.status,
                    toStatus: subscriptionUpdate?.status ?? sub.status,
                    occurredAt,
                    klaviyoEventId,
                    source: 'LOOP',
                    declineReason:
                      typeof properties.decline_reason === 'string'
                        ? properties.decline_reason
                        : undefined,
                    metadata: properties as never,
                  },
                });

                const updateData: Record<string, unknown> = {};
                if (subscriptionUpdate) {
                  if (subscriptionUpdate.status) updateData.status = subscriptionUpdate.status;
                  if (subscriptionUpdate.cancelledAt) updateData.cancelledAt = subscriptionUpdate.cancelledAt;
                  if (subscriptionUpdate.cancelReason) updateData.cancelReason = subscriptionUpdate.cancelReason;
                  if (subscriptionUpdate.lastBilledAt) updateData.lastBilledAt = subscriptionUpdate.lastBilledAt;
                }
                if (nextBillDate) updateData.nextBillDate = nextBillDate;

                if (Object.keys(updateData).length > 0) {
                  await tx.subscription.update({
                    where: { id: sub.id },
                    data: updateData,
                  });
                }
              });

              processed++;
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              if (msg.includes('Unique constraint') && msg.includes('klaviyoEventId')) {
                skipped++;
              } else {
                console.error(`[sync-loop-events] sub ${sub.id} event ${klaviyoEventId}:`, msg);
                errors++;
              }
            }
          }
        } catch (err) {
          console.error(`[sync-loop-events] event ${klaviyoEventId}:`, err instanceof Error ? err.message : err);
          errors++;
        }
      }),
    ),
  );

  if (lastDatetime) {
    await prisma.syncCursor.upsert({
      where: { key: CURSOR_KEY },
      update: { cursor: lastDatetime },
      create: { key: CURSOR_KEY, cursor: lastDatetime },
    });
  }

  console.log(
    `[sync-loop-events] done in ${((Date.now() - start) / 1000).toFixed(1)}s — ` +
    `processed=${processed} skipped=${skipped} unmatched=${unmatched} errors=${errors}`,
  );

  return { processed, skipped, unmatched, errors };
}
