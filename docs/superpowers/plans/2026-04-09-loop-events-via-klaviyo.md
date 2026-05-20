# Loop Subscription Events via Klaviyo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync Loop subscription lifecycle events from Klaviyo Events API into SubscriptionEvent table, simplify profile sync, and fix dashboard pages to reflect Loop data.

**Architecture:** Klaviyo Metrics API resolves `loop_*` metric IDs, then Events API fetches per-metric events with cursor-based pagination. Events map to SubscriptionEvent rows with LOOP source. Profile sync keeps enrichment only (nextBillDate, currentBillingCycle), drops status inference.

**Tech Stack:** Prisma, Klaviyo REST API v2024-10-15, Next.js App Router, Vitest

**Spec:** `docs/superpowers/specs/2026-04-09-loop-events-via-klaviyo-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `prisma/schema.prisma` | Add LOOP to Source enum, klaviyoEventId + source on SubscriptionEvent, SyncCursor model |
| `src/services/sync-loop-events.ts` | New file: fetchLoopMetricIds(), syncLoopEvents(), event mapping, subscription matching |
| `src/services/sync-klaviyo.ts` | Simplify syncSubscriberProfiles(), import and call syncLoopEvents() |
| `src/services/__tests__/sync-loop-events.test.ts` | Unit tests for event mapping, subscription matching |
| `src/components/ui/SourceFilter.tsx` | Update to include LOOP option |
| `app/(dashboard)/subscriptions/mrr/page.tsx` | Add PAUSED to waterfall movements |
| `app/(dashboard)/subscriptions/churn/page.tsx` | Add RESUMED to trend, use event cancel reasons |
| `app/(dashboard)/subscriptions/churn/ChurnTrendChart.tsx` | Add `resumed` to ChurnDay type |
| `app/(dashboard)/subscriptions/cohorts/page.tsx` | Count PAUSED as churned in retention |
| `app/(dashboard)/analytics/forecast/page.tsx` | Include PAUSED in churn rate |
| `app/(dashboard)/subscriptions/mrr/error.tsx` | Error boundary (Guard 4) |
| `app/(dashboard)/subscriptions/churn/error.tsx` | Error boundary (Guard 4) |
| `app/(dashboard)/subscriptions/cohorts/error.tsx` | Error boundary (Guard 4) |
| `app/(dashboard)/analytics/forecast/error.tsx` | Error boundary (Guard 4) |

---

### Task 1: Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_loop_events_schema/migration.sql`

- [ ] **Step 1: Add LOOP to Source enum**

In `prisma/schema.prisma`, find:
```prisma
enum Source {
  SHOPIFY
  CHECKOUTCHAMP
  MERGED
}
```
Replace with:
```prisma
enum Source {
  SHOPIFY
  CHECKOUTCHAMP
  MERGED
  LOOP
}
```

- [ ] **Step 2: Add fields to SubscriptionEvent**

In `prisma/schema.prisma`, find the `model SubscriptionEvent` block. Add two fields before the `@@index` lines:
```prisma
  klaviyoEventId   String?              @unique
  source           Source?
```

Add an index:
```prisma
  @@index([source])
```

- [ ] **Step 3: Add SyncCursor model**

Add at the end of `prisma/schema.prisma`:
```prisma
model SyncCursor {
  id        String   @id @default(uuid())
  key       String   @unique
  cursor    String
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 4: Generate and apply migration**

Run:
```bash
npx prisma migrate dev --name add_loop_events_schema
```
Expected: Migration created and applied successfully. Prisma client regenerated.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add LOOP source, klaviyoEventId, SyncCursor schema for Loop events"
```

---

### Task 2: Event Mapping & Matching Logic (TDD)

**Files:**
- Create: `src/services/sync-loop-events.ts`
- Create: `src/services/__tests__/sync-loop-events.test.ts`

- [ ] **Step 1: Write failing tests for event mapping**

Create `src/services/__tests__/sync-loop-events.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { mapLoopMetricToEventType, mapLoopEventToSubscriptionUpdate } from '../sync-loop-events';

describe('mapLoopMetricToEventType', () => {
  it('maps loop_subscription_started → CREATED', () => {
    expect(mapLoopMetricToEventType('loop_subscription_started')).toBe('CREATED');
  });
  it('maps loop_order_processed → BILLED', () => {
    expect(mapLoopMetricToEventType('loop_order_processed')).toBe('BILLED');
  });
  it('maps loop_billing_attempt_failed → DECLINED', () => {
    expect(mapLoopMetricToEventType('loop_billing_attempt_failed')).toBe('DECLINED');
  });
  it('maps loop_billing_attempt_failed_and_will_be_retried → DECLINED', () => {
    expect(mapLoopMetricToEventType('loop_billing_attempt_failed_and_will_be_retried')).toBe('DECLINED');
  });
  it('maps loop_billing_attempt_failed_and_last_retry_left → DECLINED', () => {
    expect(mapLoopMetricToEventType('loop_billing_attempt_failed_and_last_retry_left')).toBe('DECLINED');
  });
  it('maps loop_subscription_cancelled → CANCELLED', () => {
    expect(mapLoopMetricToEventType('loop_subscription_cancelled')).toBe('CANCELLED');
  });
  it('maps loop_subscription_paused → PAUSED', () => {
    expect(mapLoopMetricToEventType('loop_subscription_paused')).toBe('PAUSED');
  });
  it('maps loop_subscription_resumed → RESUMED', () => {
    expect(mapLoopMetricToEventType('loop_subscription_resumed')).toBe('RESUMED');
  });
  it('maps loop_subscription_reactivated → REACTIVATED', () => {
    expect(mapLoopMetricToEventType('loop_subscription_reactivated')).toBe('REACTIVATED');
  });
  it('maps loop_subscription_expired → EXPIRED', () => {
    expect(mapLoopMetricToEventType('loop_subscription_expired')).toBe('EXPIRED');
  });
  it('maps loop_order_skipped → SKIPPED', () => {
    expect(mapLoopMetricToEventType('loop_order_skipped')).toBe('SKIPPED');
  });
  it('returns null for unmapped events', () => {
    expect(mapLoopMetricToEventType('loop_upcoming_order')).toBeNull();
  });
});

describe('mapLoopEventToSubscriptionUpdate', () => {
  const eventDate = new Date('2026-03-15T10:30:00Z');

  it('returns status ACTIVE for CREATED', () => {
    const result = mapLoopEventToSubscriptionUpdate('CREATED', {}, eventDate);
    expect(result).toEqual({ status: 'ACTIVE' });
  });
  it('returns CANCELLED with real occurredAt timestamp and cancelReason', () => {
    const result = mapLoopEventToSubscriptionUpdate('CANCELLED', { cancel_reason: 'Too expensive' }, eventDate);
    expect(result!.status).toBe('CANCELLED');
    expect(result!.cancelledAt).toEqual(eventDate);
    expect(result!.cancelReason).toBe('Too expensive');
  });
  it('returns PAUSED status', () => {
    const result = mapLoopEventToSubscriptionUpdate('PAUSED', {}, eventDate);
    expect(result).toEqual({ status: 'PAUSED' });
  });
  it('returns ACTIVE for RESUMED', () => {
    const result = mapLoopEventToSubscriptionUpdate('RESUMED', {}, eventDate);
    expect(result).toEqual({ status: 'ACTIVE' });
  });
  it('returns ACTIVE for REACTIVATED', () => {
    const result = mapLoopEventToSubscriptionUpdate('REACTIVATED', {}, eventDate);
    expect(result).toEqual({ status: 'ACTIVE' });
  });
  it('returns CANCELLED with "Subscription expired" for EXPIRED', () => {
    const result = mapLoopEventToSubscriptionUpdate('EXPIRED', {}, eventDate);
    expect(result!.status).toBe('CANCELLED');
    expect(result!.cancelledAt).toEqual(eventDate);
    expect(result!.cancelReason).toBe('Subscription expired');
  });
  it('returns lastBilledAt with event timestamp for BILLED', () => {
    const result = mapLoopEventToSubscriptionUpdate('BILLED', {}, eventDate);
    expect(result!.lastBilledAt).toEqual(eventDate);
  });
  it('returns null for SKIPPED (no status change)', () => {
    const result = mapLoopEventToSubscriptionUpdate('SKIPPED', {}, eventDate);
    expect(result).toBeNull();
  });
  it('returns null for DECLINED (no subscription status change)', () => {
    const result = mapLoopEventToSubscriptionUpdate('DECLINED', { decline_reason: 'Card expired' }, eventDate);
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services/__tests__/sync-loop-events.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement mapping functions**

Create `src/services/sync-loop-events.ts`:
```typescript
// Syncs Loop subscription lifecycle events from Klaviyo Events API.
// Loop pushes events to Klaviyo as metrics (loop_subscription_cancelled, etc.).
// We resolve metric IDs first, then fetch events per metric with cursor pagination.

import { prisma } from '../lib/prisma';
import { config } from '../core/config';
import type { SubscriptionEventType } from '@prisma/client';

const BASE_URL = 'https://a.klaviyo.com/api';
const REVISION = '2024-10-15';

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

export function mapLoopEventToSubscriptionUpdate(
  eventType: SubscriptionEventType,
  eventProperties: Record<string, unknown>,
  occurredAt: Date,
): Record<string, unknown> | null {
  switch (eventType) {
    case 'CREATED':
    case 'RESUMED':
    case 'REACTIVATED':
      return { status: 'ACTIVE' };
    case 'CANCELLED':
      return {
        status: 'CANCELLED',
        cancelledAt: occurredAt,
        cancelReason: (eventProperties.cancel_reason as string) ?? null,
      };
    case 'EXPIRED':
      return {
        status: 'CANCELLED',
        cancelledAt: occurredAt,
        cancelReason: 'Subscription expired',
      };
    case 'PAUSED':
      return { status: 'PAUSED' };
    case 'BILLED':
      return { lastBilledAt: occurredAt };
    case 'SKIPPED':
    case 'DECLINED':
      return null; // No subscription-level update
    default:
      return null;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services/__tests__/sync-loop-events.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/sync-loop-events.ts src/services/__tests__/sync-loop-events.test.ts
git commit -m "feat: add Loop event mapping with tests"
```

---

### Task 3: Klaviyo Metrics Discovery + Events Fetch

**Files:**
- Modify: `src/services/sync-loop-events.ts`

- [ ] **Step 1: Add fetchLoopMetricIds() function**

Append to `src/services/sync-loop-events.ts`:
```typescript
// --- Klaviyo API helpers ---

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

interface KlaviyoEventWithProfile extends KlaviyoEvent {
  profileEmail: string | null;
}

async function fetchLoopMetricIds(): Promise<Map<string, string>> {
  // Returns Map<metricId, metricName> for all loop_* metrics
  const metricMap = new Map<string, string>();
  let url: string | null = `${BASE_URL}/metrics`;

  while (url) {
    const resp = await fetch(url, { headers: headers() });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Klaviyo metrics API error ${resp.status}: ${body.slice(0, 200)}`);
    }
    const json = await resp.json() as { data?: KlaviyoMetric[]; links?: { next?: string } };
    for (const metric of json.data ?? []) {
      if (metric.attributes.name.startsWith('loop_')) {
        metricMap.set(metric.id, metric.attributes.name);
      }
    }
    url = json.links?.next ?? null;
  }

  console.log(`[sync-loop-events] found ${metricMap.size} loop_* metrics`);
  return metricMap;
}
```

- [ ] **Step 2: Add fetchEventsForMetric() function**

Append to `src/services/sync-loop-events.ts`:
```typescript
async function fetchEventsForMetric(
  metricId: string,
  sinceDate: string,
): Promise<KlaviyoEvent[]> {
  const events: KlaviyoEvent[] = [];
  let url: string | null = `${BASE_URL}/events?filter=equals(metric_id,"${metricId}"),greater-or-equal(datetime,"${sinceDate}")&sort=datetime`;

  while (url) {
    const resp = await fetch(url, { headers: headers() });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Klaviyo events API error ${resp.status}: ${body.slice(0, 200)}`);
    }
    const json = await resp.json() as { data?: KlaviyoEvent[]; links?: { next?: string } };
    events.push(...(json.data ?? []));
    url = json.links?.next ?? null;
  }

  return events;
}
```

- [ ] **Step 3: Add resolveProfileEmail() helper**

Append to `src/services/sync-loop-events.ts`:
```typescript
async function resolveProfileEmail(profileId: string): Promise<string | null> {
  try {
    const resp = await fetch(`${BASE_URL}/profiles/${profileId}?fields[profile]=email`, {
      headers: headers(),
    });
    if (!resp.ok) return null;
    const json = await resp.json() as { data?: { attributes?: { email?: string } } };
    return json.data?.attributes?.email ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/services/sync-loop-events.ts
git commit -m "feat: add Klaviyo metrics discovery and events fetch helpers"
```

---

### Task 4: Core syncLoopEvents() Function

**Depends on:** Task 1 (migration must be applied and `prisma generate` run — LOOP enum must exist in Prisma client)

**Files:**
- Modify: `src/services/sync-loop-events.ts`

- [ ] **Step 1: Implement syncLoopEvents()**

Append to `src/services/sync-loop-events.ts`:
```typescript
const CURSOR_KEY = 'klaviyo-loop-events';
const DEFAULT_BACKFILL_DAYS = 90;

export async function syncLoopEvents(): Promise<{ synced: number; skipped: number; errors: number }> {
  const start = Date.now();
  console.log('[sync-loop-events] starting');

  // Step 0: Resolve Loop metric IDs
  const metricMap = await fetchLoopMetricIds();
  if (metricMap.size === 0) {
    console.log('[sync-loop-events] no loop_* metrics found in Klaviyo');
    return { synced: 0, skipped: 0, errors: 0 };
  }

  // Step 1: Read cursor
  const cursorRow = await prisma.syncCursor.findUnique({ where: { key: CURSOR_KEY } });
  const backfillDays = parseInt(process.env.LOOP_EVENTS_BACKFILL_DAYS ?? '') || DEFAULT_BACKFILL_DAYS;
  const sinceDate = cursorRow?.cursor
    ?? new Date(Date.now() - backfillDays * 24 * 60 * 60 * 1000).toISOString();

  console.log(`[sync-loop-events] fetching events since ${sinceDate}`);

  // Step 2: Fetch events for each metric
  const allEvents: Array<{ event: KlaviyoEvent; metricName: string }> = [];
  for (const [metricId, metricName] of metricMap) {
    try {
      const events = await fetchEventsForMetric(metricId, sinceDate);
      for (const event of events) {
        allEvents.push({ event, metricName });
      }
    } catch (err) {
      console.error(`[sync-loop-events] error fetching metric ${metricName}:`, err instanceof Error ? err.message : err);
    }
  }

  // Sort by datetime ascending for consistent cursor advancement
  allEvents.sort((a, b) => a.event.attributes.datetime.localeCompare(b.event.attributes.datetime));
  console.log(`[sync-loop-events] fetched ${allEvents.length} total events`);

  // Step 3: Process events with profile email cache to avoid redundant API calls
  const profileEmailCache = new Map<string, string | null>();
  let synced = 0;
  let skipped = 0;
  let errors = 0;
  let lastDatetime = sinceDate;

  // Process with p-limit(5) to batch DB writes per Guard 5
  const pLimit = (await import('p-limit')).default;
  const limit = pLimit(5);

  const tasks = allEvents.map(({ event, metricName }) =>
    limit(async () => {
      try {
        const eventType = mapLoopMetricToEventType(metricName);

        // Skip unmapped events — don't create fake CREATED events
        if (!eventType) {
          skipped++;
          lastDatetime = event.attributes.datetime;
          return;
        }

        // Check if already synced (dedup)
        const existing = await prisma.subscriptionEvent.findUnique({
          where: { klaviyoEventId: event.id },
          select: { id: true },
        });
        if (existing) {
          skipped++;
          lastDatetime = event.attributes.datetime;
          return;
        }

        // Resolve profile email (cached per profile ID)
        const profileId = event.relationships?.profile?.data?.id ?? event.attributes.profile_id;
        let email: string | null = null;
        if (profileId) {
          if (profileEmailCache.has(profileId)) {
            email = profileEmailCache.get(profileId)!;
          } else {
            email = await resolveProfileEmail(profileId);
            profileEmailCache.set(profileId, email);
          }
        }
        if (!email) {
          console.warn(`[sync-loop-events] no email for event ${event.id}, skipping`);
          skipped++;
          return;
        }

        // Find or create customer
        let customer = await prisma.customer.findUnique({ where: { email } });
        if (!customer) {
          customer = await prisma.customer.create({
            data: { email, klaviyoProfileId: profileId ?? undefined },
          });
        }

        // Find SHOPIFY subscription for this customer
        const shopifySubs = await prisma.subscription.findMany({
          where: { customerId: customer.id, source: 'SHOPIFY' },
          select: { id: true, status: true, currentBillingCycle: true },
        });

        if (shopifySubs.length === 0) {
          await prisma.ingestionError.create({
            data: {
              source: 'LOOP',
              errorType: 'UNMATCHED_LOOP_EVENT',
              message: `No SHOPIFY subscription for ${email} (event: ${metricName})`,
              payload: { klaviyoEventId: event.id, email, metricName, eventProperties: event.attributes.event_properties },
            },
          });
          skipped++;
          lastDatetime = event.attributes.datetime;
          return;
        }

        // Match subscription (first match for single-sub, product match for multi)
        const sub = shopifySubs[0]; // TODO: multi-sub product matching from event payload

        // Build event data — use real event timestamp, not wall clock
        const eventProperties = event.attributes.event_properties ?? {};
        const occurredAt = new Date(event.attributes.datetime);
        const subUpdate = mapLoopEventToSubscriptionUpdate(eventType, eventProperties, occurredAt);

        // Handle rescheduled/delayed — update nextBillDate
        const isReschedule = metricName === 'loop_subscription_rescheduled' || metricName === 'loop_subscription_delayed';
        const nextBillDate = isReschedule && eventProperties.next_billing_date
          ? new Date(eventProperties.next_billing_date as string)
          : undefined;

        // Determine toStatus for the event row
        const toStatus = subUpdate?.status as string ?? sub.status;

        // Write event + update subscription atomically
        await prisma.$transaction([
          prisma.subscriptionEvent.create({
            data: {
              subscriptionId: sub.id,
              eventType,
              fromStatus: sub.status,
              toStatus,
              billingCycleNumber: sub.currentBillingCycle,
              amount: eventProperties.total_price ? Math.round(Number(eventProperties.total_price) * 100) : undefined,
              declineReason: eventProperties.decline_reason as string ?? eventProperties.error_message as string ?? undefined,
              metadata: eventProperties,
              occurredAt,
              klaviyoEventId: event.id,
              source: 'LOOP',
            },
          }),
          ...(subUpdate ? [
            prisma.subscription.update({
              where: { id: sub.id },
              data: {
                ...subUpdate,
                ...(nextBillDate ? { nextBillDate } : {}),
                ...(eventType === 'BILLED' ? { currentBillingCycle: { increment: 1 } } : {}),
              },
            }),
          ] : []),
          ...(nextBillDate && !subUpdate ? [
            prisma.subscription.update({
              where: { id: sub.id },
              data: { nextBillDate },
            }),
          ] : []),
        ]);

        synced++;
        lastDatetime = event.attributes.datetime;

        if (synced % 100 === 0) {
          console.log(`[sync-loop-events] progress: ${synced} synced, ${skipped} skipped`);
        }
      } catch (err) {
        console.error(`[sync-loop-events] error processing event ${event.id}:`, err instanceof Error ? err.message : err);
        if (err instanceof Error && err.message.includes('Unique constraint')) {
          skipped++;
        } else {
          errors++;
        }
      }
    })
  );

  await Promise.all(tasks);

  // Step 4: Save cursor
  if (lastDatetime !== sinceDate) {
    await prisma.syncCursor.upsert({
      where: { key: CURSOR_KEY },
      update: { cursor: lastDatetime },
      create: { key: CURSOR_KEY, cursor: lastDatetime },
    });
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[sync-loop-events] done in ${elapsed}s: synced=${synced} skipped=${skipped} errors=${errors}`);
  return { synced, skipped, errors };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit src/services/sync-loop-events.ts`
Expected: No errors (or fix any type issues)

- [ ] **Step 3: Commit**

```bash
git add src/services/sync-loop-events.ts
git commit -m "feat: implement syncLoopEvents with cursor-based Klaviyo event sync"
```

---

### Task 5: Simplify Profile Sync + Wire into Cron

**Files:**
- Modify: `src/services/sync-klaviyo.ts`

- [ ] **Step 1: Remove status-change logic from syncSubscriberProfiles()**

In `src/services/sync-klaviyo.ts`, replace lines 234-287 (the `if (loopActive !== undefined) {` block through its closing `}`) with a simpler enrichment-only block:

```typescript
      // Enrich Shopify subscriptions with Loop profile data (no status changes — events handle that)
      const shopifySubs = await prisma.subscription.findMany({
        where: { customerId: customer.id, source: 'SHOPIFY' },
        select: { id: true },
      });

      for (const sub of shopifySubs) {
        const enrichData: Record<string, unknown> = {};
        if (loopNextBilling) enrichData.nextBillDate = new Date(loopNextBilling);
        if (loopProcessedOrders) enrichData.currentBillingCycle = loopProcessedOrders;

        if (Object.keys(enrichData).length > 0) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: enrichData,
          });
          updated++;
        }
      }
```

- [ ] **Step 2: Import and call syncLoopEvents() in main export**

At the top of `src/services/sync-klaviyo.ts`, add:
```typescript
import { syncLoopEvents } from './sync-loop-events';
```

In the `syncKlaviyo()` function, add after `const profiles = await syncSubscriberProfiles();`:
```typescript
  const loopEvents = await syncLoopEvents();
```

Update the return to include `loopEvents`:
```typescript
  return { campaigns, flows, profiles, loopEvents };
```

Update the return type to include:
```typescript
  loopEvents: { synced: number; skipped: number; errors: number };
```

- [ ] **Step 3: Run existing tests**

Run: `npx vitest run`
Expected: All existing tests still pass

- [ ] **Step 4: Commit**

```bash
git add src/services/sync-klaviyo.ts
git commit -m "refactor: simplify profile sync, wire syncLoopEvents into Klaviyo cron"
```

---

### Task 6: Update SourceFilter Component

**Files:**
- Modify: `src/components/ui/SourceFilter.tsx`

- [ ] **Step 1: Add LOOP option to SourceFilter**

In `src/components/ui/SourceFilter.tsx`, replace the OPTIONS array:
```typescript
const OPTIONS = [
  { value: '', label: 'All' },
  { value: 'SHOPIFY', label: 'Shopify' },
  { value: 'LOOP', label: 'Loop' },
  { value: 'CHECKOUTCHAMP', label: 'CC' },
] as const;
```

Note: Previously `SHOPIFY` was labeled "Loop". Now that LOOP is its own source, fix the labels.

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/SourceFilter.tsx
git commit -m "feat: add LOOP source to SourceFilter, fix label mapping"
```

---

### Task 7: MRR Waterfall Page Fix

**Files:**
- Modify: `app/(dashboard)/subscriptions/mrr/page.tsx`

- [ ] **Step 1: Add PAUSED to waterfall event types**

In `app/(dashboard)/subscriptions/mrr/page.tsx`, find line 46:
```typescript
        eventType: { in: ['CREATED', 'CANCELLED', 'REACTIVATED', 'RESUMED'] },
```
Replace with:
```typescript
        eventType: { in: ['CREATED', 'CANCELLED', 'REACTIVATED', 'RESUMED', 'PAUSED'] },
```

- [ ] **Step 2: Handle PAUSED as downside in waterfall computation**

Find the waterfall computation logic (where it maps events to MRR movements). Ensure PAUSED events contribute to the `churned` bucket alongside CANCELLED. Look for where `eventType === 'CANCELLED'` determines negative MRR and add `|| eventType === 'PAUSED'` to that condition.

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/subscriptions/mrr/page.tsx
git commit -m "feat: include PAUSED events in MRR waterfall movements"
```

---

### Task 8: Churn Page Fix — Add RESUMED to Trends

**Files:**
- Modify: `app/(dashboard)/subscriptions/churn/page.tsx`
- Modify: `app/(dashboard)/subscriptions/churn/ChurnTrendChart.tsx`

- [ ] **Step 1: Add cancel reasons from SubscriptionEvent metadata**

The current cancel reasons query (line 50-56) uses `subscription.groupBy` on `cancelReason`. This only works once Loop events populate `cancelReason` on the Subscription table — which the sync already does. No page change needed for this.

However, add RESUMED to the trend chart events query (line 41-48) so we can show recovery alongside churn:
```typescript
        eventType: { in: ['CANCELLED', 'PAUSED', 'RESUMED'] },
```

And update the dayMap processing to include resumed:
```typescript
  const dayMap = new Map<string, { cancelled: number; paused: number; resumed: number }>();
  for (const e of cancelledEvents) {
    const dk = format(new Date(e.occurredAt), 'MMM d');
    const entry = dayMap.get(dk) ?? { cancelled: 0, paused: 0, resumed: 0 };
    if (e.eventType === 'CANCELLED') entry.cancelled += 1;
    else if (e.eventType === 'PAUSED') entry.paused += 1;
    else if (e.eventType === 'RESUMED') entry.resumed += 1;
    dayMap.set(dk, entry);
  }
```

- [ ] **Step 2: Update ChurnDay type in ChurnTrendChart.tsx**

In `app/(dashboard)/subscriptions/churn/ChurnTrendChart.tsx`, find the `ChurnDay` interface/type and add `resumed: number`. Update the chart to render a green/cyan line for resumed counts alongside the existing cancelled/paused lines.

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/subscriptions/churn/page.tsx app/\(dashboard\)/subscriptions/churn/ChurnTrendChart.tsx
git commit -m "feat: add RESUMED events to churn trend chart"
```

---

### Task 9: Cohorts Page Fix — Count Paused as Churned

**Files:**
- Modify: `app/(dashboard)/subscriptions/cohorts/page.tsx`

- [ ] **Step 1: Include PAUSED status in churn calculation**

In `app/(dashboard)/subscriptions/cohorts/page.tsx`, find line 54:
```typescript
    const cancelMonth = sub.cancelledAt ? differenceInMonths(new Date(sub.cancelledAt), new Date(sub.startedAt)) : Infinity;
```
Replace with:
```typescript
    // Paused subs are revenue-negative — treat as churned for retention
    const churnedAt = sub.cancelledAt ?? (sub.status === 'PAUSED' ? new Date() : null);
    const cancelMonth = churnedAt ? differenceInMonths(new Date(churnedAt), new Date(sub.startedAt)) : Infinity;
```

Also add `status` to the select if not already there (it is — line 28).

- [ ] **Step 2: Commit**

```bash
git add app/\(dashboard\)/subscriptions/cohorts/page.tsx
git commit -m "feat: count paused subscriptions as churned in cohort retention"
```

---

### Task 10: Forecast Page Fix — Include Paused in Churn Rate

**Files:**
- Modify: `app/(dashboard)/analytics/forecast/page.tsx`

- [ ] **Step 1: Count PAUSED + CANCELLED for churn rate**

In `app/(dashboard)/analytics/forecast/page.tsx`, find lines 55-59:
```typescript
  const cancelCount = await prisma.subscriptionEvent.count({
    where: {
      eventType: 'CANCELLED',
      occurredAt: { gte: last90Start },
    },
  });
```
Replace with:
```typescript
  const cancelCount = await prisma.subscriptionEvent.count({
    where: {
      eventType: { in: ['CANCELLED', 'PAUSED'] },
      occurredAt: { gte: last90Start },
    },
  });
```

- [ ] **Step 2: Commit**

```bash
git add app/\(dashboard\)/analytics/forecast/page.tsx
git commit -m "feat: include paused subscriptions in forecast churn rate"
```

---

### Task 11: Error Boundaries (Guard 4)

**Files:**
- Create: `app/(dashboard)/subscriptions/mrr/error.tsx`
- Create: `app/(dashboard)/subscriptions/churn/error.tsx`
- Create: `app/(dashboard)/subscriptions/cohorts/error.tsx`
- Create: `app/(dashboard)/analytics/forecast/error.tsx`

- [ ] **Step 1: Create error boundary template**

All four files use the same pattern. Create each with:
```tsx
'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="text-red-400 text-lg font-medium">Something went wrong</div>
      <p className="text-gray-400 text-sm max-w-md text-center">
        {error.message || 'An unexpected error occurred loading this page.'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(dashboard\)/subscriptions/mrr/error.tsx app/\(dashboard\)/subscriptions/churn/error.tsx app/\(dashboard\)/subscriptions/cohorts/error.tsx app/\(dashboard\)/analytics/forecast/error.tsx
git commit -m "feat: add error boundaries to subscription and forecast pages (Guard 4)"
```

---

### Task 12: Verify Full Build + Run Tests

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (existing + new sync-loop-events tests)

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Verify Prisma client generation**

Run: `npx prisma generate`
Expected: Client generated with LOOP source and new models

- [ ] **Step 4: Run dev server smoke test**

Run: `npm run dev` and verify subscription pages load without errors.

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: fix build issues from Loop events integration"
```
