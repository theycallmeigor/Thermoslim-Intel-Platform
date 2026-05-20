import { workflow, node, trigger, ifElse, splitInBatches, nextBatch, merge, newCredential, expr } from '@n8n/workflow-sdk';

const SUPABASE = 'https://fliqklclucdhjemdjatr.supabase.co/rest/v1';

const daily9am = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Daily 9am',
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

const whenCalled = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.1,
  config: { name: 'When Called', parameters: { inputSource: 'passthrough' }, position: [0, 400] },
  output: [{}],
});

const computeWindow = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Compute Window',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "let testDay = 0;\nlet isTest = false;\ntry { testDay = Number($('Set Test Day').first().json.test_day) || 0; isTest = true; } catch (e) { isTest = false; }\nconst today = new Date();\nconst toISO = (d) => d.toISOString().slice(0, 10);\nconst minus = (n) => { const x = new Date(today); x.setUTCDate(x.getUTCDate() - n); return toISO(x); };\nlet sd_lower; let sd_upper;\nif (isTest) {\n  if (testDay > 0) { sd_lower = minus(testDay); sd_upper = minus(testDay); }\n  else { sd_lower = minus(60); sd_upper = minus(0); }\n} else {\n  sd_lower = minus(11); sd_upper = minus(10);\n}\nreturn [{ json: { is_test: isTest, test_day: testDay, sd_lower, sd_upper } }];",
    },
    position: [440, 200],
  },
  output: [{ is_test: true, test_day: 10, sd_lower: '2026-05-08', sd_upper: '2026-05-08' }],
});

const fetchWinners = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch Winners',
    parameters: {
      method: 'GET',
      url: SUPABASE + '/v_winner_candidates',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          { name: 'select', value: 'id,external_id,brand_id,brand_name,canonical_brand_id,canonical_brand_name,title,body,share_url,thumbnail_url,landing_page,display_format,start_date,days_active,performance_score' },
          { name: 'start_date', value: expr('gte.{{ $json.sd_lower }}') },
          { name: 'start_date', value: expr('lte.{{ $json.sd_upper }}') },
          { name: 'active_in_library', value: 'eq.1' },
          { name: 'order', value: 'start_date.desc' },
        ],
      },
    },
    credentials: { supabaseApi: newCredential('Supabase ThermoSlim') },
    position: [680, 40],
  },
  output: [{ id: 98480390, external_id: '1434633868463325', brand_name: 'Besque', canonical_brand_name: 'Besque', title: 'Sample', start_date: '2026-05-08', days_active: 11, performance_score: 70, share_url: 'https://x', thumbnail_url: 'https://t', landing_page: 'https://l', display_format: 'video', brand_id: 1, canonical_brand_id: 1, body: 'copy' }],
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
  config: { name: 'Collect Fetches', parameters: { mode: 'append', numberInputs: 3 }, position: [840, 200] },
});

const preparePerWinner = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare Per-Winner Items',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "let isTest = false;\ntry { isTest = Boolean($('Compute Window').first().json.is_test); } catch (e) {}\nlet winners = [];\ntry { winners = $('Fetch Winners').all().map(i => i.json).filter(w => w && w.external_id); } catch (e) { return []; }\nlet sentSet = new Set();\ntry { sentSet = new Set($('Fetch Already-Sent IDs').all().map(i => String(i.json && i.json.ad_external_id)).filter(Boolean)); } catch (e) {}\nlet webhookUrls = [];\ntry { webhookUrls = $('Fetch Discord Webhooks').all().map(i => String(i.json.value || '')).filter(Boolean); } catch (e) {}\nconst newWinners = winners.filter(w => !sentSet.has(String(w.external_id)));\nif (newWinners.length === 0 || webhookUrls.length === 0) return [];\nconst items = [];\nfor (const w of newWinners) {\n  for (const webhookUrl of webhookUrls) {\n    items.push({ json: { is_test: isTest, _webhook_url: webhookUrl, w: w, ad_db_id: w.id, external_id: w.external_id } });\n  }\n}\nreturn items;",
    },
    executeOnce: true,
    position: [920, 200],
  },
  output: [{ is_test: true, _webhook_url: 'https://discord.com/api/webhooks/x/y', w: { id: 98480390, external_id: '1434633868463325' }, ad_db_id: 98480390, external_id: '1434633868463325' }],
});

const loopOverAds = splitInBatches({
  version: 3,
  config: { name: 'Loop Over Ads', parameters: { batchSize: 1 }, position: [1140, 200] },
});

const allAdsDone = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'All Ads Done', position: [1360, 40] },
  output: [{}],
});

const verifyOneAd = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Verify One Ad',
    parameters: {
      method: 'GET',
      url: expr('https://app.gethookd.ai/api/v1/ads/{{ $json.ad_db_id }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'httpHeaderAuth',
    },
    credentials: { httpHeaderAuth: newCredential('GetHookd API') },
    retryOnFail: true,
    onError: 'continueRegularOutput',
    position: [1360, 360],
  },
  output: [{ data: { id: 98480390, active_in_library: 1, performance_score: 70, title: 'Sample', body: 'copy', display_format: 'video', start_date: '2026-05-08' } }],
});

const buildResult = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Result',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const trunc = (s, n) => { if (!s) return ''; const t = String(s).replace(/\\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };\nconst resp = $input.first().json || {};\nlet prep = {};\ntry { prep = $('Loop Over Ads').item.json || {}; } catch (e) {}\nconst w = prep.w || {};\nconst d = resp.data;\nconst errored = resp.errors === true || (resp.error && resp.error !== false);\nconst isTest = Boolean(prep.is_test);\nconst apiScore = (d && d.performance_score != null) ? Number(d.performance_score) : null;\nconst dbScore = (w.performance_score != null) ? Number(w.performance_score) : null;\nconst score = dbScore != null ? dbScore : apiScore;\nlet state;\nif (errored || !d || d.active_in_library == null) state = 'unknown';\nelse if (Number(d.active_in_library) !== 1) state = 'dead';\nelse state = 'live';\nconst title = (d && d.title) || w.title;\nconst body = (d && d.body) || w.body;\nconst fmt = (d && d.display_format) || w.display_format;\nconst startDate = (d && d.start_date) || w.start_date || null;\nlet daysActive = w.days_active;\nif (startDate) daysActive = Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000);\nlet discord_body = null; let insert_row = null; let update_row = null;\nif (state === 'live') {\n  update_row = { active_in_library: 1, updated_at: new Date().toISOString() };\n  if (score != null) update_row.performance_score = score;\n  const brand = w.canonical_brand_name || w.brand_name || 'Unknown';\n  const adTitle = trunc(title, 80) || ('Ad ' + w.external_id);\n  const fields = [\n    { name: 'Days Active', value: String(daysActive || ''), inline: true },\n    { name: 'Started', value: (startDate ? String(startDate).slice(0, 10) : '—'), inline: true },\n    { name: 'Score', value: String(score != null ? score : ''), inline: true },\n    { name: 'Format', value: (fmt ? String(fmt).toLowerCase() : '—'), inline: true }\n  ];\n  if (w.landing_page) fields.push({ name: 'Landing Page', value: trunc(w.landing_page, 150), inline: false });\n  const titlePrefix = isTest ? '[TEST] ' : '';\n  const embed = {\n    title: titlePrefix + brand + ' — ' + adTitle,\n    url: w.share_url,\n    description: trunc(body, 240) || '_(no ad copy)_',\n    color: isTest ? 16753920 : 5814783,\n    fields,\n    footer: { text: 'external_id ' + w.external_id + (isTest ? ' — TEST RUN' : '') }\n  };\n  if (w.thumbnail_url) embed.image = { url: w.thumbnail_url };\n  discord_body = { content: (isTest ? '🧪 TEST — ' : '🏆 New winner — ') + brand, embeds: [embed] };\n  insert_row = { ad_external_id: w.external_id, ad_db_id: w.id, source_brand_id: w.brand_id, canonical_brand_id: w.canonical_brand_id, alert_channel: 'discord', days_active_at_alert: daysActive, performance_score_at_alert: score, share_url: w.share_url };\n}\nreturn [{ json: { _verify_state: state, is_test: isTest, ad_db_id: w.id, score: score, start_date: startDate, _webhook_url: prep._webhook_url, discord_body: discord_body, insert_row: insert_row, update_row: update_row } }];",
    },
    position: [1580, 360],
  },
  output: [{ _verify_state: 'live', is_test: true, ad_db_id: 98480390, score: 70, start_date: '2026-05-08', _webhook_url: 'https://discord.com/api/webhooks/x/y', discord_body: { content: 'New winner', embeds: [] }, insert_row: { ad_external_id: '1434633868463325' }, update_row: { active_in_library: 1 } }],
});

const isLive = ifElse({
  version: 2.3,
  config: {
    name: 'Is Live?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, typeValidation: 'loose' },
        conditions: [{ id: 'c1', leftValue: expr('{{ $json._verify_state }}'), rightValue: 'live', operator: { type: 'string', operation: 'equals' } }],
        combinator: 'and',
      },
    },
    position: [1800, 360],
  },
});

const refreshLiveInDb = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Refresh Live in DB',
    parameters: {
      method: 'PATCH',
      url: SUPABASE + '/ads',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: { parameters: [{ name: 'id', value: expr('eq.{{ $("Build Result").item.json.ad_db_id }}') }] },
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: { parameters: [{ name: 'Prefer', value: 'return=minimal' }, { name: 'Content-Type', value: 'application/json' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($("Build Result").item.json.update_row) }}'),
    },
    credentials: { supabaseApi: newCredential('Supabase ThermoSlim') },
    position: [2020, 240],
  },
  output: [{}],
});

const postDiscord = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Post Discord',
    parameters: {
      method: 'POST',
      url: expr('{{ $("Build Result").item.json._webhook_url }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: { parameters: [{ name: 'Content-Type', value: 'application/json' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($("Build Result").item.json.discord_body) }}'),
    },
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 2000,
    onError: 'continueRegularOutput',
    position: [2680, 120],
  },
  output: [{}],
});

const waitThrottle = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Wait Throttle', parameters: { resume: 'timeInterval', amount: 2.5, unit: 'seconds' }, position: [2900, 120] },
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
    position: [3120, 120],
  },
});

const isProduction = ifElse({
  version: 2.3,
  config: {
    name: 'Is Production?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, typeValidation: 'loose' },
        conditions: [{ id: 'c1', leftValue: expr('{{ $("Build Result").item.json.is_test === true }}'), rightValue: '', operator: { type: 'boolean', operation: 'false', singleValue: true } }],
        combinator: 'and',
      },
    },
    position: [3340, 60],
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
      jsonBody: expr('{{ JSON.stringify($("Build Result").item.json.insert_row) }}'),
    },
    credentials: { supabaseApi: newCredential('Supabase ThermoSlim') },
    position: [3560, 0],
  },
  output: [{}],
});

const skipMarkTest = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Skip Mark (Test)', position: [3560, 120] },
  output: [{}],
});

const skipPostFailed = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Skip (Post Failed)', position: [3340, 240] },
  output: [{}],
});

const isDead = ifElse({
  version: 2.3,
  config: {
    name: 'Is Dead?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, typeValidation: 'loose' },
        conditions: [{ id: 'c1', leftValue: expr('{{ $json._verify_state }}'), rightValue: 'dead', operator: { type: 'string', operation: 'equals' } }],
        combinator: 'and',
      },
    },
    position: [2020, 480],
  },
});

const markKilledInDb = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Mark Killed in DB',
    parameters: {
      method: 'PATCH',
      url: SUPABASE + '/ads',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: { parameters: [{ name: 'id', value: expr('eq.{{ $json.ad_db_id }}') }] },
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: { parameters: [{ name: 'Prefer', value: 'return=minimal' }, { name: 'Content-Type', value: 'application/json' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ active_in_library: 0, updated_at: $now.toISO() }) }}'),
    },
    credentials: { supabaseApi: newCredential('Supabase ThermoSlim') },
    position: [2240, 480],
  },
  output: [{}],
});

const skipUnknown = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Skip (Unknown)', position: [2240, 620] },
  output: [{}],
});

const scoreKnown = ifElse({
  version: 2.3,
  config: {
    name: 'Score Known?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, typeValidation: 'loose' },
        conditions: [{ id: 'c1', leftValue: expr('{{ $("Build Result").item.json.score != null }}'), rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
    position: [2240, 200],
  },
});

const scoreGate = ifElse({
  version: 2.3,
  config: {
    name: 'Score >= 70?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, typeValidation: 'loose' },
        conditions: [{ id: 'c1', leftValue: expr('{{ $("Build Result").item.json.score }}'), rightValue: 70, operator: { type: 'number', operation: 'gte' } }],
        combinator: 'and',
      },
    },
    position: [2460, 120],
  },
});

const skipUnknownScore = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Skip (Unknown Score)', position: [2460, 360] },
  output: [{}],
});

const skipBelow70 = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Skip (Below 70)', position: [2680, 320] },
  output: [{}],
});

export default workflow('competitor-winner-alerts-v2', 'Competitor Winner Alerts (Discord) v2 — survival')
  .add(daily9am)
  .to(computeWindow)
  .add(manualTest)
  .to(setTestDay)
  .to(computeWindow)
  .add(whenCalled)
  .to(computeWindow)
  .add(computeWindow)
  .to(fetchWinners.to(collectFetches.input(0)))
  .add(computeWindow)
  .to(fetchAlreadySent.to(collectFetches.input(1)))
  .add(computeWindow)
  .to(fetchWebhooks.to(collectFetches.input(2)))
  .add(collectFetches)
  .to(preparePerWinner)
  .add(preparePerWinner)
  .to(
    loopOverAds
      .onDone(allAdsDone)
      .onEachBatch(
        verifyOneAd.to(
          buildResult.to(
            isLive
              .onTrue(
                refreshLiveInDb.to(
                  scoreKnown
                    .onTrue(
                      scoreGate
                        .onTrue(
                          postDiscord.to(
                            waitThrottle.to(
                              postOk
                                .onTrue(
                                  isProduction
                                    .onTrue(markAlertSent.to(nextBatch(loopOverAds)))
                                    .onFalse(skipMarkTest.to(nextBatch(loopOverAds))),
                                )
                                .onFalse(skipPostFailed.to(nextBatch(loopOverAds))),
                            ),
                          ),
                        )
                        .onFalse(skipBelow70.to(nextBatch(loopOverAds))),
                    )
                    .onFalse(skipUnknownScore.to(nextBatch(loopOverAds))),
                ),
              )
              .onFalse(
                isDead
                  .onTrue(markKilledInDb.to(nextBatch(loopOverAds)))
                  .onFalse(skipUnknown.to(nextBatch(loopOverAds))),
              ),
          ),
        ),
      ),
  );
