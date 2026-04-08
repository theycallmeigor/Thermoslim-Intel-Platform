// Syncs Klaviyo campaigns and flows into EmailCampaign and EmailFlow tables.
// Uses Klaviyo v3 REST API with private API key auth.

import { prisma } from '../lib/prisma';
import { config } from '../core/config';

const BASE_URL = 'https://a.klaviyo.com/api';
const REVISION = '2024-10-15';

function headers(): Record<string, string> {
  return {
    Authorization: `Klaviyo-API-Key ${config.klaviyo.apiKey}`,
    revision: REVISION,
    Accept: 'application/json',
  };
}

// --- Types ---

interface KlaviyoCampaign {
  id: string;
  attributes: {
    name: string;
    status: string;
    send_time: string | null;
    audiences?: { included?: Array<{ id: string }> };
  };
}

interface KlaviyoCampaignMessage {
  id: string;
  attributes: {
    label: string;
    subject: string | null;
    channel: string;
  };
}

interface KlaviyoFlow {
  id: string;
  attributes: {
    name: string;
    status: string;
    trigger_type: string | null;
  };
}

interface KlaviyoMetricAggregate {
  attributes: {
    data: Array<{
      measurements: Record<string, number[]>;
    }>;
  };
}

// --- API helpers ---

async function klaviyoGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: headers() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Klaviyo API error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function fetchAllPages<T>(path: string): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = `${BASE_URL}${path}`;

  while (url) {
    const resp: Response = await fetch(url, { headers: headers() });
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

// --- Campaign sync ---

async function syncCampaigns(): Promise<{ synced: number; errors: number }> {
  // Fetch all sent campaigns
  const campaigns = await fetchAllPages<KlaviyoCampaign>(
    "/campaigns?filter=equals(messages.channel,'email')&fields[campaign]=name,status,send_time"
  );

  console.log(`[sync-klaviyo] fetched ${campaigns.length} campaigns`);

  let synced = 0;
  let errors = 0;

  // Batch upsert campaigns (skip per-campaign message fetch to stay within timeout)
  const upserts = campaigns.map(campaign =>
    prisma.emailCampaign.upsert({
      where: { klaviyoCampaignId: campaign.id },
      update: {
        name: campaign.attributes.name,
        sentAt: campaign.attributes.send_time ? new Date(campaign.attributes.send_time) : null,
        syncedAt: new Date(),
      },
      create: {
        klaviyoCampaignId: campaign.id,
        name: campaign.attributes.name,
        sentAt: campaign.attributes.send_time ? new Date(campaign.attributes.send_time) : null,
      },
    })
  );

  try {
    await prisma.$transaction(upserts);
    synced = campaigns.length;
  } catch (err) {
    console.error('[sync-klaviyo] campaign batch error:', err instanceof Error ? err.message : err);
    errors = campaigns.length;
  }

  return { synced, errors };
}

// --- Flow sync ---

async function syncFlows(): Promise<{ synced: number; errors: number; errorDetails: string[] }> {
  const flows = await fetchAllPages<KlaviyoFlow>(
    '/flows?fields[flow]=name,status'
  );

  console.log(`[sync-klaviyo] fetched ${flows.length} flows`);

  let synced = 0;
  let errors = 0;

  const errorDetails: string[] = [];
  for (const flow of flows) {
    try {
      await prisma.emailFlow.upsert({
        where: { klaviyoFlowId: flow.id },
        update: {
          name: flow.attributes.name,
          status: flow.attributes.status ?? 'unknown',
          syncedAt: new Date(),
        },
        create: {
          klaviyoFlowId: flow.id,
          name: flow.attributes.name,
          status: flow.attributes.status ?? 'unknown',
        },
      });
      synced++;
    } catch (err) {
      const msg = `flow ${flow.id} (${flow.attributes.name}): ${err instanceof Error ? err.message : err}`;
      console.error(`[sync-klaviyo] ${msg}`);
      errorDetails.push(msg);
      errors++;
    }
  }

  return { synced, errors, errorDetails };
}

// --- Subscriber profile sync ---

interface KlaviyoProfile {
  id: string;
  attributes: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
    properties: Record<string, unknown>;
  };
}

async function syncSubscriberProfiles(): Promise<{ synced: number; updated: number; errors: number }> {
  // Fetch all profiles — Klaviyo paginates automatically
  const profiles = await fetchAllPages<KlaviyoProfile>(
    '/profiles?fields[profile]=email,first_name,last_name,phone_number,properties'
  );

  console.log(`[sync-klaviyo] fetched ${profiles.length} profiles`);

  let synced = 0;
  let updated = 0;
  let errors = 0;

  for (const profile of profiles) {
    const email = profile.attributes.email;
    if (!email) continue;

    const props = profile.attributes.properties ?? {};

    // Extract Loop subscription properties
    const loopActive = props.$loop_active_subscriber as boolean | undefined;
    const loopActiveSubCount = props.$loop_active_subscription_count as number | undefined;
    const loopCancelledCount = props.$loop_cancelled_subscription_count as number | undefined;
    const loopPausedCount = props.$loop_paused_subscription_count as number | undefined;
    const loopNextBilling = props.$loop_next_billing_date as string | undefined;
    const loopProcessedOrders = props.$loop_processed_order_count as number | undefined;
    const loopSubRevenue = props.$loop_subscription_revenue as number | undefined;
    const loopLineItems = props.$loop_subscribed_line_item_names as string | undefined;
    const loopFirstSubDate = props.$loop_first_subscription_acquisition_date as string | undefined;
    const loopLastOrderDate = props.$loop_last_subscription_order_date as string | undefined;

    // Skip profiles with no Loop subscription data
    const hasLoopData = loopActive !== undefined || loopActiveSubCount !== undefined;
    if (!hasLoopData) continue;

    try {
      // Upsert customer with Klaviyo profile ID
      const customer = await prisma.customer.upsert({
        where: { email },
        update: {
          klaviyoProfileId: profile.id,
          firstName: profile.attributes.first_name ?? undefined,
          lastName: profile.attributes.last_name ?? undefined,
          phone: profile.attributes.phone_number ?? undefined,
        },
        create: {
          email,
          klaviyoProfileId: profile.id,
          firstName: profile.attributes.first_name ?? undefined,
          lastName: profile.attributes.last_name ?? undefined,
          phone: profile.attributes.phone_number ?? undefined,
        },
      });
      synced++;

      // Update Shopify subscriptions for this customer with Loop data
      if (loopActive !== undefined) {
        const shopifySubs = await prisma.subscription.findMany({
          where: { customerId: customer.id, source: 'SHOPIFY' },
          select: { id: true, status: true },
        });

        for (const sub of shopifySubs) {
          // Infer status from Loop properties
          let newStatus = sub.status;
          if (loopActive === false && loopCancelledCount && loopCancelledCount > 0) {
            newStatus = 'CANCELLED';
          } else if (loopActive === false && loopPausedCount && loopPausedCount > 0) {
            newStatus = 'PAUSED';
          } else if (loopActive === true) {
            newStatus = 'ACTIVE';
          }

          const updateData: Record<string, unknown> = {};
          if (newStatus !== sub.status) updateData.status = newStatus;
          if (loopNextBilling) updateData.nextBillDate = new Date(loopNextBilling);
          if (loopProcessedOrders) updateData.currentBillingCycle = loopProcessedOrders;
          if (newStatus === 'CANCELLED' && sub.status !== 'CANCELLED') {
            updateData.cancelledAt = new Date();
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.subscription.update({
              where: { id: sub.id },
              data: updateData,
            });

            // Emit status change event
            if (newStatus !== sub.status) {
              const eventTypeMap: Record<string, string> = {
                CANCELLED: 'CANCELLED',
                PAUSED: 'PAUSED',
                ACTIVE: sub.status === 'PAUSED' ? 'RESUMED' : sub.status === 'CANCELLED' ? 'REACTIVATED' : 'CREATED',
              };
              const eventType = eventTypeMap[newStatus];
              if (eventType) {
                await prisma.subscriptionEvent.create({
                  data: {
                    subscriptionId: sub.id,
                    eventType: eventType as never,
                    fromStatus: sub.status,
                    toStatus: newStatus,
                    occurredAt: new Date(),
                  },
                });
              }
            }
            updated++;
          }
        }
      }
    } catch (err) {
      console.error(`[sync-klaviyo] profile ${email} error:`, err instanceof Error ? err.message : err);
      errors++;
    }
  }

  console.log(`[sync-klaviyo] profiles: synced=${synced} updated=${updated} errors=${errors}`);
  return { synced, updated, errors };
}

// --- Main export ---

export async function syncKlaviyo(): Promise<{
  campaigns: { synced: number; errors: number };
  flows: { synced: number; errors: number };
  profiles: { synced: number; updated: number; errors: number };
}> {
  const start = Date.now();
  console.log('[sync-klaviyo] starting');

  // Campaigns + flows in parallel (fast), then profiles (slower, sequential DB writes)
  const [campaigns, flows] = await Promise.all([
    syncCampaigns(),
    syncFlows(),
  ]);

  const profiles = await syncSubscriberProfiles();

  console.log(`[sync-klaviyo] total time: ${((Date.now() - start) / 1000).toFixed(1)}s`);
  console.log(`[sync-klaviyo] done: campaigns=${campaigns.synced} flows=${flows.synced} profiles=${profiles.synced} sub-updates=${profiles.updated}`);

  return { campaigns, flows, profiles };
}
