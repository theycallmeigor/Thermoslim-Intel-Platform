// Competitor Winner Alerts (Discord) v3 — explore-sourced
// Workflow ID: 61GMgo5hvImUYXB0  (created 2026-05-19, simplified to 20 nodes)
//
// WHY v3: v2 read performance_score from GetHookd /ads/{id}, which returns null.
// v3 sources the score from the /explore list endpoint (date-windowed), which carries it.
// Flow: explore the day-10/11 window per brand -> filter to ads scored >=81 ("over 70")
// still active -> dedup vs ad_alerts_sent -> post to Discord.
//
// DESIGN NOTE: there is NO per-brand loop. The "Explore Brand" HTTP node receives the 5
// brand items from "Prepare Brand Items" and n8n runs it once per item natively (5 explore
// calls fan out). "Extract Winners" then flattens all 5 responses, whitelists ads by
// ad.brand.id == one of our gethookd_brand_id values, and filters. Only "Loop Over Winners"
// is a real loop — it exists to throttle Discord posts 2.5s apart.
//
// TESTING MODE: Explore Brand uses per_page=10 (~0.10 credits/brand). Bump to per_page=100
// + pagination for production.
//
// KNOWN LIMITATION: GetHookd returns performance_score:null for ~50-60% of ads regardless
// of age (exclude_low_impressions — unmeasured ads). Those never pass the >=81 gate.
// See n8n/files/winner-alerts-filter-analysis-2026-05-19.md for the full analysis.

import { workflow, node, trigger, ifElse, splitInBatches, nextBatch, merge, newCredential, expr } from '@n8n/workflow-sdk';

const SUPABASE = 'https://fliqklclucdhjemdjatr.supabase.co/rest/v1';

const daily9am = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Daily 12:45 UTC',
    parameters: { rule: { interval: [{ field: 'cronExpression', expression: '45 12 * * *' }] } },
    position: [0, 200],
  },
  output: [{}],
});

const manualTest = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Test', position: [0, 0] },
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
    position: [220, 0],
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
      jsCode: "let testDay = 0;\nlet isTest = false;\ntry { testDay = Number($('Set Test Day').first().json.test_day) || 0; isTest = true; } catch (e) { isTest = false; }\nconst today = new Date();\nconst toISO = (d) => d.toISOString().slice(0, 10);\nconst minus = (n) => { const x = new Date(today); x.setUTCDate(x.getUTCDate() - n); return toISO(x); };\nlet sd_lower; let sd_upper;\nif (isTest) {\n  if (testDay > 0) { sd_lower = minus(testDay + 1); sd_upper = minus(testDay); }\n  else { sd_lower = minus(60); sd_upper = minus(0); }\n} else {\n  sd_lower = minus(11); sd_upper = minus(10);\n}\nreturn [{ json: { is_test: isTest, test_day: testDay, sd_lower, sd_upper } }];",
    },
    position: [440, 200],
  },
  output: [{ is_test: true, test_day: 10, sd_lower: '2026-05-08', sd_upper: '2026-05-09' }],
});

const fetchBrands = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch Brands',
    parameters: {
      method: 'GET',
      url: SUPABASE + '/brands',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          { name: 'select', value: 'id,name,gethookd_brand_id' },
          { name: 'status', value: 'eq.active' },
          { name: 'gethookd_brand_id', value: 'not.is.null' },
        ],
      },
    },
    credentials: { supabaseApi: newCredential('Supabase ThermoSlim') },
    position: [680, 40],
  },
  output: [{ id: 22, name: 'DRMTLGY', gethookd_brand_id: 432 }],
});

const fetchAlreadySent = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch Already-Sent IDs',
    parameters: {
      method: 'GET',
      url: SUPABASE + '/ad_alerts_sent',
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
    credentials: { supabaseApi: newCredential('Supabase ThermoSlim') },
    position: [680, 200],
  },
  output: [{ ad_external_id: '1434633868463325' }],
});

const fetchWebhooks = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch Discord Webhooks',
    parameters: {
      method: 'GET',
      url: SUPABASE + '/app_settings',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          { name: 'select', value: 'value' },
          { name: 'key', value: expr("{{ $json.is_test ? 'eq.winning_alerts_webhook_test' : 'eq.winning_alerts_webhook' }}") },
        ],
      },
    },
    credentials: { supabaseApi: newCredential('Supabase ThermoSlim') },
    position: [680, 360],
  },
  output: [{ value: 'https://discord.com/api/webhooks/x/y' }],
});

const collectFetches = merge({
  version: 3.2,
  config: { name: 'Collect Fetches', parameters: { mode: 'append', numberInputs: 3 }, position: [900, 200] },
});

const prepareBrands = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare Brand Items',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "let isTest = false; let sd_lower = null; let sd_upper = null;\ntry { const cw = $('Compute Window').first().json; isTest = Boolean(cw.is_test); sd_lower = cw.sd_lower; sd_upper = cw.sd_upper; } catch (e) {}\nlet brands = [];\ntry { brands = $('Fetch Brands').all().map(i => i.json).filter(b => b && b.gethookd_brand_id); } catch (e) { return []; }\nlet webhookUrls = [];\ntry { webhookUrls = $('Fetch Discord Webhooks').all().map(i => String(i.json.value || '')).filter(Boolean); } catch (e) {}\nconst webhook = webhookUrls[0] || '';\nif (brands.length === 0 || !webhook) return [];\nreturn brands.map(b => ({ json: { brand_id: b.id, brand_name: b.name, gethookd_brand_id: b.gethookd_brand_id, sd_lower, sd_upper, is_test: isTest, _webhook_url: webhook } }));",
    },
    executeOnce: true,
    position: [1120, 200],
  },
  output: [{ brand_id: 22, brand_name: 'DRMTLGY', gethookd_brand_id: 432, sd_lower: '2026-05-08', sd_upper: '2026-05-09', is_test: true, _webhook_url: 'https://discord.com/api/webhooks/x/y' }],
});

const exploreBrand = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Explore Brand',
    parameters: {
      method: 'GET',
      url: 'https://app.gethookd.ai/api/v1/explore',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'httpHeaderAuth',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          { name: 'query', value: expr('{{ $json.brand_name }}') },
          { name: 'status', value: 'active' },
          { name: 'start-date', value: expr('{{ $json.sd_lower }}') },
          { name: 'end-date', value: expr('{{ $json.sd_upper }}') },
          { name: 'sort_column', value: 'start_date' },
          { name: 'sort_direction', value: 'desc' },
          { name: 'per_page', value: '10' },
        ],
      },
    },
    credentials: { httpHeaderAuth: newCredential('GetHookd API') },
    retryOnFail: true,
    onError: 'continueRegularOutput',
    position: [1340, 200],
  },
  output: [{ data: [] }],
});

const extractWinners = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Extract Winners',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const trunc = (s, n) => { if (!s) return ''; const t = String(s).replace(/\\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };\nlet isTest = false;\ntry { isTest = Boolean($('Compute Window').first().json.is_test); } catch (e) {}\nconst brandMap = {};\ntry { for (const b of $('Prepare Brand Items').all()) { const j = b.json || {}; if (j.gethookd_brand_id != null) brandMap[String(j.gethookd_brand_id)] = j; } } catch (e) {}\nlet sentSet = new Set();\ntry { sentSet = new Set($('Fetch Already-Sent IDs').all().map(i => String(i.json && i.json.ad_external_id)).filter(Boolean)); } catch (e) {}\nconst out = []; const seen = new Set();\nfor (const item of $input.all()) {\n  const resp = (item && item.json) || {};\n  const data = Array.isArray(resp.data) ? resp.data : [];\n  for (const ad of data) {\n    if (!ad || !ad.brand) continue;\n    const brand = brandMap[String(ad.brand.id)];\n    if (!brand) continue;\n    if (Number(ad.active_in_library) !== 1) continue;\n    const score = ad.performance_score != null ? Number(ad.performance_score) : null;\n    if (score == null || score < 81) continue;\n    const ext = String(ad.external_id || '');\n    if (!ext || sentSet.has(ext) || seen.has(ext)) continue;\n    seen.add(ext);\n    const adTitle = trunc(ad.title, 80) || ('Ad ' + ext);\n    const fields = [\n      { name: 'Days Active', value: String(ad.days_active || ''), inline: true },\n      { name: 'Started', value: (ad.start_date ? String(ad.start_date).slice(0, 10) : '—'), inline: true },\n      { name: 'Score', value: String(score) + ' (' + (ad.performance_score_title || '') + ')', inline: true },\n      { name: 'Format', value: (ad.display_format ? String(ad.display_format).toLowerCase() : '—'), inline: true },\n    ];\n    if (ad.landing_page) fields.push({ name: 'Landing Page', value: trunc(ad.landing_page, 150), inline: false });\n    const embed = {\n      title: (isTest ? '[TEST] ' : '') + brand.brand_name + ' — ' + adTitle,\n      url: ad.share_url,\n      description: trunc(ad.body, 240) || '_(no ad copy)_',\n      color: isTest ? 16753920 : 5814783,\n      fields,\n      footer: { text: 'external_id ' + ext + (isTest ? ' — TEST RUN' : '') },\n    };\n    const thumb = ad.media && ad.media[0] ? ad.media[0].thumbnail_url : null;\n    if (thumb) embed.image = { url: thumb };\n    out.push({ json: {\n      is_test: isTest,\n      _webhook_url: brand._webhook_url,\n      ad_db_id: ad.id,\n      external_id: ext,\n      score: score,\n      discord_body: { content: (isTest ? '🧪 TEST — ' : '🏆 New winner — ') + brand.brand_name, embeds: [embed] },\n      insert_row: { ad_external_id: ext, ad_db_id: ad.id, source_brand_id: brand.brand_id, canonical_brand_id: brand.brand_id, alert_channel: 'discord', days_active_at_alert: ad.days_active, performance_score_at_alert: score, share_url: ad.share_url },\n    } });\n  }\n}\nreturn out;",
    },
    position: [1560, 200],
  },
  output: [{ is_test: true, _webhook_url: 'https://discord.com/api/webhooks/x/y', ad_db_id: 98480390, external_id: '1434633868463325', score: 91, discord_body: { content: 'New winner', embeds: [] }, insert_row: { ad_external_id: '1434633868463325' } }],
});

const loopOverWinners = splitInBatches({
  version: 3,
  config: { name: 'Loop Over Winners', parameters: { batchSize: 1 }, position: [1780, 200] },
});

const allWinnersDone = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'All Winners Done', position: [2000, 40] },
  output: [{}],
});

const postDiscord = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Post Discord',
    parameters: {
      method: 'POST',
      url: expr('{{ $("Extract Winners").item.json._webhook_url }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: { parameters: [{ name: 'Content-Type', value: 'application/json' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($("Extract Winners").item.json.discord_body) }}'),
    },
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 2000,
    onError: 'continueRegularOutput',
    position: [2000, 280],
  },
  output: [{}],
});

const waitThrottle = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Wait Throttle', parameters: { resume: 'timeInterval', amount: 2.5, unit: 'seconds' }, position: [2220, 280] },
  output: [{}],
});

const postOk = ifElse({
  version: 2.3,
  config: {
    name: 'Post OK?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, typeValidation: 'loose' },
        conditions: [{ id: 'c1', leftValue: expr('{{ $json.error == null }}'), rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
    position: [2440, 280],
  },
});

const isProduction = ifElse({
  version: 2.3,
  config: {
    name: 'Is Production?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, typeValidation: 'loose' },
        conditions: [{ id: 'c1', leftValue: expr('{{ $("Extract Winners").item.json.is_test === true }}'), rightValue: '', operator: { type: 'boolean', operation: 'false', singleValue: true } }],
        combinator: 'and',
      },
    },
    position: [2660, 200],
  },
});

const markAlertSent = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Mark Alert Sent',
    parameters: {
      method: 'POST',
      url: SUPABASE + '/ad_alerts_sent',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: { parameters: [{ name: 'Prefer', value: 'resolution=ignore-duplicates,return=minimal' }, { name: 'Content-Type', value: 'application/json' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($("Extract Winners").item.json.insert_row) }}'),
    },
    credentials: { supabaseApi: newCredential('Supabase ThermoSlim') },
    position: [2880, 120],
  },
  output: [{}],
});

const skipMarkTest = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Skip Mark (Test)', position: [2880, 280] },
  output: [{}],
});

const skipPostFailed = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Skip (Post Failed)', position: [2660, 400] },
  output: [{}],
});

export default workflow('competitor-winner-alerts-v3', 'Competitor Winner Alerts (Discord) v3 — explore-sourced')
  .add(daily9am)
  .to(computeWindow)
  .add(manualTest)
  .to(setTestDay)
  .to(computeWindow)
  .add(computeWindow)
  .to(fetchBrands.to(collectFetches.input(0)))
  .add(computeWindow)
  .to(fetchAlreadySent.to(collectFetches.input(1)))
  .add(computeWindow)
  .to(fetchWebhooks.to(collectFetches.input(2)))
  .add(collectFetches)
  .to(prepareBrands)
  .add(prepareBrands)
  .to(exploreBrand)
  .add(exploreBrand)
  .to(extractWinners)
  .add(extractWinners)
  .to(
    loopOverWinners
      .onDone(allWinnersDone)
      .onEachBatch(
        postDiscord.to(
          waitThrottle.to(
            postOk
              .onTrue(
                isProduction
                  .onTrue(markAlertSent.to(nextBatch(loopOverWinners)))
                  .onFalse(skipMarkTest.to(nextBatch(loopOverWinners))),
              )
              .onFalse(skipPostFailed.to(nextBatch(loopOverWinners))),
          ),
        ),
      ),
  );
