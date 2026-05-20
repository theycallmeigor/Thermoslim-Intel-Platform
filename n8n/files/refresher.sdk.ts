// GetHookd Day-10 Refresher — workflow vUtztzKNemlbxfQS
// SDK source of truth. Rebuilt 2026-05-19 to fix two bugs found in execution 3830:
//   1. Upsert Ads to DB rejected by PostgREST ("All object keys must match") —
//      Build Ad Rows produced non-uniform rows (scored rows carried 2 extra keys).
//      FIX: Build Ad Rows now emits up to 2 items — one uniform scored array,
//      one uniform unscored array. The single Upsert HTTP node runs once per
//      item natively → two internally-uniform PostgREST calls. The unscored
//      batch omits performance_score entirely, so merge-duplicates never
//      clobbers an existing DB score with null (the v2 anti-clobber invariant).
//   2. Call Notifier failed ("No information about the workflow to execute
//      found") — executeWorkflow requires workflowId as a resource-locator
//      object, not a plain string. FIX: __rl object + mode 'once' so the 2
//      input items still trigger the Notifier exactly once.
import { workflow, node, trigger, newCredential } from '@n8n/workflow-sdk';

const manualTest = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Test', position: [0, 0] },
  output: [{}],
});

const dailyTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Daily 12:30 UTC',
    parameters: { rule: { interval: [{ field: 'cronExpression', expression: '30 12 * * *' }] } },
    position: [224, 192],
  },
  output: [{}],
});

const setTestDay = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Set Test Day',
    parameters: {
      assignments: { assignments: [{ id: '1', name: 'test_day', value: 10, type: 'number' }] },
      options: {},
    },
    position: [224, 0],
  },
  output: [{ test_day: 10 }],
});

const computeWindow = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Compute Window',
    parameters: {
      jsCode: `let testDay = 0;
let isTest = false;
try { testDay = Number($('Set Test Day').first().json.test_day) || 0; isTest = true; } catch (e) { isTest = false; }
const today = new Date();
const toISO = (d) => d.toISOString().slice(0, 10);
const minus = (n) => { const x = new Date(today); x.setUTCDate(x.getUTCDate() - n); return toISO(x); };
let sd_lower; let sd_upper;
if (isTest) {
  if (testDay > 0) { sd_lower = minus(testDay + 1); sd_upper = minus(testDay); }
  else { sd_lower = minus(60); sd_upper = minus(0); }
} else {
  sd_lower = minus(11); sd_upper = minus(10);
}
return [{ json: { is_test: isTest, test_day: testDay, sd_lower, sd_upper } }];`,
    },
    position: [448, 96],
  },
  output: [{ is_test: true, test_day: 10, sd_lower: '2026-05-08', sd_upper: '2026-05-09' }],
});

const fetchBrands = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch Brands',
    parameters: {
      url: 'https://fliqklclucdhjemdjatr.supabase.co/rest/v1/brands',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: 'select', value: 'id,name,gethookd_brand_id' },
          { name: 'status', value: 'eq.active' },
          { name: 'gethookd_brand_id', value: 'not.is.null' },
        ],
      },
      options: {},
    },
    credentials: { supabaseApi: newCredential('Supabase API') },
    position: [672, 96],
  },
  output: [{ id: 1, name: 'Smooche', gethookd_brand_id: 46083 }],
});

const prepareBrandItems = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare Brand Items',
    parameters: {
      jsCode: `let isTest = false; let sd_lower = null; let sd_upper = null;
try { const cw = $('Compute Window').first().json; isTest = Boolean(cw.is_test); sd_lower = cw.sd_lower; sd_upper = cw.sd_upper; } catch (e) {}
let brands = [];
try { brands = $('Fetch Brands').all().map(i => i.json).filter(b => b && b.gethookd_brand_id); } catch (e) { return []; }
if (brands.length === 0) return [];
return brands.map(b => ({ json: { brand_id: b.id, brand_name: b.name, gethookd_brand_id: b.gethookd_brand_id, sd_lower, sd_upper, is_test: isTest } }));`,
    },
    position: [896, 96],
  },
  output: [{ brand_id: 1, brand_name: 'Smooche', gethookd_brand_id: 46083 }],
});

const exploreBrand = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Explore Brand',
    parameters: {
      url: 'https://app.gethookd.ai/api/v1/explore',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'httpHeaderAuth',
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: 'query', value: '={{ $json.brand_name }}' },
          { name: 'status', value: 'active' },
          { name: 'start-date', value: '={{ $json.sd_lower }}' },
          { name: 'end-date', value: '={{ $json.sd_upper }}' },
          { name: 'sort_column', value: 'start_date' },
          { name: 'sort_direction', value: 'desc' },
          { name: 'per_page', value: '100' },
        ],
      },
      options: {},
    },
    credentials: { httpHeaderAuth: newCredential('GetHookd API') },
    position: [1120, 96],
    retryOnFail: true,
    onError: 'continueRegularOutput',
  },
  output: [{ data: [] }],
});

const buildAdRows = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Ad Rows',
    parameters: {
      jsCode: `// Emits up to 2 items: one uniform "scored" array, one uniform "unscored"
// array. PostgREST bulk upsert requires every object in an array to have an
// identical key set; the single Upsert HTTP node runs once per item, so each
// POST is internally uniform. The unscored batch omits performance_score so
// merge-duplicates never overwrites an existing DB score with null.
const brandMap = {};
try { for (const b of $('Prepare Brand Items').all()) { const j = b.json || {}; if (j.gethookd_brand_id != null) brandMap[String(j.gethookd_brand_id)] = j; } } catch (e) {}
const now = new Date().toISOString();
const scored = []; const unscored = []; const seen = new Set();
for (const item of $input.all()) {
  const resp = (item && item.json) || {};
  const data = Array.isArray(resp.data) ? resp.data : [];
  for (const ad of data) {
    if (!ad || !ad.brand) continue;
    const brand = brandMap[String(ad.brand.id)];
    if (!brand) continue;
    if (seen.has(ad.id)) continue;
    seen.add(ad.id);
    const row = {
      id: ad.id,
      external_id: ad.external_id != null ? ad.external_id : null,
      brand_id: brand.brand_id,
      brand_name: brand.brand_name,
      brand_external_id: ad.brand.external_id != null ? ad.brand.external_id : null,
      platform: ad.platform != null ? ad.platform : null,
      display_format: ad.display_format != null ? ad.display_format : null,
      title: ad.title != null ? ad.title : null,
      body: ad.body != null ? ad.body : null,
      cta_type: ad.cta_type != null ? ad.cta_type : null,
      cta_text: ad.cta_text != null ? ad.cta_text : null,
      landing_page: ad.landing_page != null ? ad.landing_page : null,
      link_description: ad.link_description != null ? ad.link_description : null,
      start_date: ad.start_date != null ? ad.start_date : null,
      end_date: ad.end_date != null ? ad.end_date : null,
      days_active: ad.days_active != null ? ad.days_active : null,
      active_in_library: ad.active_in_library != null ? ad.active_in_library : null,
      ad_spend_range_score: ad.ad_spend_range_score != null ? ad.ad_spend_range_score : null,
      ad_spend_range_score_title: ad.ad_spend_range_score_title != null ? ad.ad_spend_range_score_title : null,
      gender_audience: ad.gender_audience != null ? ad.gender_audience : null,
      age_audience_min: ad.age_audience_min != null ? ad.age_audience_min : null,
      age_audience_max: ad.age_audience_max != null ? ad.age_audience_max : null,
      media_type: ad.media && ad.media[0] ? ad.media[0].type : null,
      media_url: ad.media && ad.media[0] ? ad.media[0].url : null,
      thumbnail_url: ad.media && ad.media[0] ? ad.media[0].thumbnail_url : null,
      share_url: ad.share_url != null ? ad.share_url : null,
      updated_at: now,
    };
    if (ad.performance_score != null) {
      row.performance_score = Number(ad.performance_score);
      row.performance_score_title = ad.performance_score_title != null ? ad.performance_score_title : null;
      scored.push(row);
    } else {
      unscored.push(row);
    }
  }
}
const out = [];
if (scored.length) out.push({ json: { ad_rows: scored, count: scored.length, band: 'scored' } });
if (unscored.length) out.push({ json: { ad_rows: unscored, count: unscored.length, band: 'unscored' } });
return out;`,
    },
    position: [1344, 96],
  },
  output: [{ ad_rows: [], count: 0, band: 'scored' }],
});

const upsertAds = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Upsert Ads to DB',
    parameters: {
      method: 'POST',
      url: 'https://fliqklclucdhjemdjatr.supabase.co/rest/v1/ads',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Prefer', value: 'resolution=merge-duplicates,return=minimal' },
          { name: 'Content-Type', value: 'application/json' },
        ],
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify($json.ad_rows) }}',
      options: {},
    },
    credentials: { supabaseApi: newCredential('Supabase API') },
    position: [1568, 96],
    retryOnFail: true,
    onError: 'continueRegularOutput',
  },
  output: [{}],
});

const notifierInput = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Notifier Input',
    parameters: {
      assignments: {
        assignments: [
          { id: '1', name: 'is_test', value: '={{ $("Compute Window").first().json.is_test }}', type: 'boolean' },
        ],
      },
      options: {},
    },
    position: [1792, 96],
  },
  output: [{ is_test: true }],
});

const callNotifier = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Call Notifier',
    parameters: {
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: '61GMgo5hvImUYXB0' },
      mode: 'once',
      options: {},
    },
    position: [2016, 96],
  },
  output: [{}],
});

export default workflow('vUtztzKNemlbxfQS', 'GetHookd Day-10 Refresher')
  .add(manualTest)
  .to(setTestDay)
  .to(computeWindow)
  .to(fetchBrands)
  .to(prepareBrandItems)
  .to(exploreBrand)
  .to(buildAdRows)
  .to(upsertAds)
  .to(notifierInput)
  .to(callNotifier)
  .add(dailyTrigger)
  .to(computeWindow);
