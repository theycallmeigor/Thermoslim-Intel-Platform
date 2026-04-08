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
    '/campaigns?filter=equals(messages.channel,"email")&fields[campaign]=name,status,send_time'
  );

  console.log(`[sync-klaviyo] fetched ${campaigns.length} campaigns`);

  let synced = 0;
  let errors = 0;

  for (const campaign of campaigns) {
    try {
      // Fetch campaign messages for subject line
      let subject: string | null = null;
      try {
        const msgResp = await klaviyoGet<{ data: KlaviyoCampaignMessage[] }>(
          `/campaigns/${campaign.id}/campaign-messages?fields[campaign-message]=label,subject,channel`
        );
        subject = msgResp.data?.[0]?.attributes?.subject ?? null;
      } catch {
        // Some campaigns may not have messages
      }

      await prisma.emailCampaign.upsert({
        where: { klaviyoCampaignId: campaign.id },
        update: {
          name: campaign.attributes.name,
          subject,
          sentAt: campaign.attributes.send_time ? new Date(campaign.attributes.send_time) : null,
          syncedAt: new Date(),
        },
        create: {
          klaviyoCampaignId: campaign.id,
          name: campaign.attributes.name,
          subject,
          sentAt: campaign.attributes.send_time ? new Date(campaign.attributes.send_time) : null,
        },
      });
      synced++;
    } catch (err) {
      console.error(`[sync-klaviyo] campaign ${campaign.id} error:`, err instanceof Error ? err.message : err);
      errors++;
    }
  }

  return { synced, errors };
}

// --- Flow sync ---

async function syncFlows(): Promise<{ synced: number; errors: number }> {
  const flows = await fetchAllPages<KlaviyoFlow>(
    '/flows?fields[flow]=name,status,trigger_type'
  );

  console.log(`[sync-klaviyo] fetched ${flows.length} flows`);

  let synced = 0;
  let errors = 0;

  for (const flow of flows) {
    try {
      await prisma.emailFlow.upsert({
        where: { klaviyoFlowId: flow.id },
        update: {
          name: flow.attributes.name,
          status: flow.attributes.status,
          syncedAt: new Date(),
        },
        create: {
          klaviyoFlowId: flow.id,
          name: flow.attributes.name,
          status: flow.attributes.status,
        },
      });
      synced++;
    } catch (err) {
      console.error(`[sync-klaviyo] flow ${flow.id} error:`, err instanceof Error ? err.message : err);
      errors++;
    }
  }

  return { synced, errors };
}

// --- Main export ---

export async function syncKlaviyo(): Promise<{
  campaigns: { synced: number; errors: number };
  flows: { synced: number; errors: number };
}> {
  console.log('[sync-klaviyo] starting');

  const [campaigns, flows] = await Promise.all([
    syncCampaigns(),
    syncFlows(),
  ]);

  console.log(`[sync-klaviyo] done: campaigns=${campaigns.synced}/${campaigns.errors}err flows=${flows.synced}/${flows.errors}err`);

  return { campaigns, flows };
}
