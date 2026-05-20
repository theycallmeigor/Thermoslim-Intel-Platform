// Competitor Winner Alerts (Discord) — notifier — workflow 61GMgo5hvImUYXB0
// SDK source of truth. Reconstructed 2026-05-19 from live get_workflow_details.
// Changes vs the original live draft:
//   - Fetch Winners `limit` 5 -> 500 (lift the limited-test cap).
//   - Discord card: replaced GetHookd's unreliable `days_active` field with
//     `Days Live` = age computed from start_date (today - start_date). days_active
//     is frozen-at-pull and inconsistent (reads 11 for a 10-day-old ad); the
//     winner gate and the card both rely on start_date, the immutable signal.
// Winner = start_date in the today-11..today-10 window + active + score >= 81.
// Called by the GetHookd Day-10 Refresher (vUtztzKNemlbxfQS). Reads the ads
// table for day-10/11 winners (score >= 81, active), dedups vs ad_alerts_sent,
// posts to Discord. Test runs -> test webhook + Skip Mark; production -> prod
// webhook + Mark Alert Sent.
import { workflow, node, trigger, newCredential, merge, splitInBatches, nextBatch, ifElse } from '@n8n/workflow-sdk';

const whenCalled = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.1,
  config: { name: 'When Called', parameters: { inputSource: 'passthrough' }, position: [224, 432] },
  output: [{ is_test: false }],
});

const manualTest = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Test', position: [0, 240] },
  output: [{}],
});

const setTestDay = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Set Test Day',
    parameters: {
      mode: 'manual',
      assignments: { assignments: [{ id: '1', name: 'test_day', value: 10, type: 'number' }] },
    },
    position: [224, 240],
  },
  output: [{ test_day: 10 }],
});

const computeWindow = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Compute Window',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `let testDay = 0;
let isTest = false;
let known = false;
try { testDay = Number($('Set Test Day').first().json.test_day) || 0; isTest = true; known = true; } catch (e) {}
if (!known) {
  try { const inp = $('When Called').first().json; if (inp && typeof inp.is_test !== 'undefined') { isTest = Boolean(inp.is_test); known = true; } } catch (e) {}
}
const today = new Date();
const toISO = (d) => d.toISOString().slice(0, 10);
const minus = (n) => { const x = new Date(today); x.setUTCDate(x.getUTCDate() - n); return toISO(x); };
let sd_lower; let sd_upper;
if (testDay > 0) { sd_lower = minus(testDay + 1); sd_upper = minus(testDay); }
else { sd_lower = minus(11); sd_upper = minus(10); }
return [{ json: { is_test: isTest, test_day: testDay, sd_lower, sd_upper } }];`,
    },
    position: [448, 432],
  },
  output: [{ is_test: false, test_day: 0, sd_lower: '2026-05-08', sd_upper: '2026-05-09' }],
});

const fetchWinners = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch Winners',
    parameters: {
      method: 'GET',
      url: 'https://fliqklclucdhjemdjatr.supabase.co/rest/v1/ads',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          { name: 'select', value: 'id,external_id,brand_id,brand_name,title,body,share_url,thumbnail_url,landing_page,display_format,start_date,days_active,performance_score,performance_score_title' },
          { name: 'start_date', value: '=gte.{{ $json.sd_lower }}' },
          { name: 'start_date', value: '=lte.{{ $json.sd_upper }}' },
          { name: 'active_in_library', value: 'eq.1' },
          { name: 'performance_score', value: 'gte.81' },
          { name: 'order', value: 'performance_score.desc' },
          { name: 'limit', value: '500' },
        ],
      },
    },
    credentials: { supabaseApi: newCredential('Supabase API') },
    position: [672, 144],
  },
  output: [{ id: 1, external_id: '1', brand_name: 'Smooche', performance_score: 91 }],
});

const fetchAlreadySent = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch Already-Sent IDs',
    parameters: {
      method: 'GET',
      url: 'https://fliqklclucdhjemdjatr.supabase.co/rest/v1/ad_alerts_sent',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          { name: 'select', value: 'ad_external_id' },
          { name: 'alert_channel', value: 'eq.discord' },
          { name: 'limit', value: '10000' },
        ],
      },
    },
    credentials: { supabaseApi: newCredential('Supabase API') },
    position: [672, 336],
  },
  output: [{ ad_external_id: '1' }],
});

const fetchWebhooks = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch Discord Webhooks',
    parameters: {
      method: 'GET',
      url: 'https://fliqklclucdhjemdjatr.supabase.co/rest/v1/app_settings',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          { name: 'select', value: 'value' },
          { name: 'key', value: "={{ $json.is_test ? 'eq.winning_alerts_webhook_test' : 'eq.winning_alerts_webhook' }}" },
        ],
      },
    },
    credentials: { supabaseApi: newCredential('Supabase API') },
    position: [672, 528],
  },
  output: [{ value: 'https://discord.com/api/webhooks/x/y' }],
});

const collectFetches = merge({
  version: 3.2,
  config: { name: 'Collect Fetches', parameters: { mode: 'append', numberInputs: 3 }, position: [896, 416] },
});

const preparePerWinner = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare Per-Winner Items',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `let isTest = false;
try { isTest = Boolean($('Compute Window').first().json.is_test); } catch (e) {}
const trunc = (s, n) => { if (!s) return ''; const t = String(s).replace(/\\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
let winners = [];
try { winners = $('Fetch Winners').all().map(i => i.json).filter(w => w && w.external_id); } catch (e) { return []; }
let sentSet = new Set();
try { sentSet = new Set($('Fetch Already-Sent IDs').all().map(i => String(i.json && i.json.ad_external_id)).filter(Boolean)); } catch (e) {}
let webhookUrls = [];
try { webhookUrls = $('Fetch Discord Webhooks').all().map(i => String(i.json.value || '')).filter(Boolean); } catch (e) {}
const webhook = webhookUrls[0] || '';
if (!webhook) return [];
const out = []; const seen = new Set();
for (const w of winners) {
  const ext = String(w.external_id || '');
  if (!ext || sentSet.has(ext) || seen.has(ext)) continue;
  seen.add(ext);
  const score = w.performance_score != null ? Number(w.performance_score) : null;
  const adTitle = trunc(w.title, 80) || ('Ad ' + ext);
  const ageDays = w.start_date ? Math.floor((Date.now() - Date.parse(String(w.start_date))) / 86400000) : null;
  const fields = [
    { name: 'Days Live', value: ageDays != null ? (ageDays + 'd') : '—', inline: true },
    { name: 'Started', value: (w.start_date ? String(w.start_date).slice(0, 10) : '—'), inline: true },
    { name: 'Score', value: String(score != null ? score : '') + ' (' + (w.performance_score_title || '') + ')', inline: true },
    { name: 'Format', value: (w.display_format ? String(w.display_format).toLowerCase() : '—'), inline: true },
  ];
  if (w.landing_page) fields.push({ name: 'Landing Page', value: trunc(w.landing_page, 150), inline: false });
  const embed = {
    title: (isTest ? '[TEST] ' : '') + (w.brand_name || 'Unknown') + ' — ' + adTitle,
    url: w.share_url,
    description: trunc(w.body, 240) || '_(no ad copy)_',
    color: isTest ? 16753920 : 5814783,
    fields,
    footer: { text: 'external_id ' + ext + (isTest ? ' — TEST RUN' : '') },
  };
  if (w.thumbnail_url) embed.image = { url: w.thumbnail_url };
  out.push({ json: {
    is_test: isTest,
    _webhook_url: webhook,
    ad_db_id: w.id,
    external_id: ext,
    score: score,
    discord_body: { content: (isTest ? '🧪 TEST — ' : '🏆 New winner — ') + (w.brand_name || 'Unknown'), embeds: [embed] },
    insert_row: { ad_external_id: ext, ad_db_id: w.id, source_brand_id: w.brand_id, canonical_brand_id: w.brand_id, alert_channel: 'discord', days_active_at_alert: w.days_active, performance_score_at_alert: score, share_url: w.share_url },
  } });
}
return out;`,
    },
    executeOnce: true,
    position: [1120, 432],
  },
  output: [{ external_id: '1', _webhook_url: 'https://discord.com/api/webhooks/x/y' }],
});

const loopOverWinners = splitInBatches({
  version: 3,
  config: { name: 'Loop Over Winners', parameters: { batchSize: 1 }, position: [1344, 432] },
});

const postDiscord = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Post Discord',
    parameters: {
      method: 'POST',
      url: '={{ $("Prepare Per-Winner Items").item.json._webhook_url }}',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: { parameters: [{ name: 'Content-Type', value: 'application/json' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify($("Prepare Per-Winner Items").item.json.discord_body) }}',
    },
    position: [1568, 192],
    retryOnFail: true,
    onError: 'continueRegularOutput',
  },
  output: [{}],
});

const waitThrottle = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'Wait Throttle',
    parameters: { resume: 'timeInterval', amount: 2.5, unit: 'seconds' },
    position: [1792, 192],
  },
  output: [{}],
});

const postOK = ifElse({
  version: 2.3,
  config: {
    name: 'Post OK?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, typeValidation: 'loose' },
        conditions: [{ id: 'c1', leftValue: '={{ $json.error == null }}', rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
    position: [2016, 192],
  },
});

const isProduction = ifElse({
  version: 2.3,
  config: {
    name: 'Is Production?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, typeValidation: 'loose' },
        conditions: [{ id: 'c1', leftValue: '={{ $("Prepare Per-Winner Items").item.json.is_test === true }}', rightValue: '', operator: { type: 'boolean', operation: 'false', singleValue: true } }],
        combinator: 'and',
      },
    },
    position: [2240, 96],
  },
});

const markAlertSent = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Mark Alert Sent',
    parameters: {
      method: 'POST',
      url: 'https://fliqklclucdhjemdjatr.supabase.co/rest/v1/ad_alerts_sent',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'Prefer', value: 'resolution=ignore-duplicates,return=minimal' },
          { name: 'Content-Type', value: 'application/json' },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify($("Prepare Per-Winner Items").item.json.insert_row) }}',
    },
    credentials: { supabaseApi: newCredential('Supabase API') },
    position: [2464, 272],
  },
  output: [{}],
});

const allWinnersDone = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'All Winners Done', position: [1568, 0] },
  output: [{}],
});

const skipMarkTest = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Skip Mark (Test)', position: [2464, 480] },
  output: [{}],
});

const skipPostFailed = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Skip (Post Failed)', position: [2240, 288] },
  output: [{}],
});

export default workflow('61GMgo5hvImUYXB0', 'Competitor Winner Alerts (Discord) — notifier')
  .add(whenCalled)
  .to(computeWindow)
  .to(fetchWinners.to(collectFetches.input(0)))
  .add(computeWindow)
  .to(fetchAlreadySent.to(collectFetches.input(1)))
  .add(computeWindow)
  .to(fetchWebhooks.to(collectFetches.input(2)))
  .add(collectFetches)
  .to(preparePerWinner)
  .to(loopOverWinners
    .onDone(allWinnersDone)
    .onEachBatch(postDiscord
      .to(waitThrottle)
      .to(postOK
        .onTrue(isProduction
          .onTrue(markAlertSent.to(nextBatch(loopOverWinners)))
          .onFalse(skipMarkTest.to(nextBatch(loopOverWinners))))
        .onFalse(skipPostFailed.to(nextBatch(loopOverWinners))))))
  .add(manualTest)
  .to(setTestDay)
  .to(computeWindow);
