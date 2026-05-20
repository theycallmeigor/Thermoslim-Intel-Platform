# n8n: Add Pattern Detection to Enrichment Pipeline

**Target workflow:** `Ads — Multimodal Enrich + Embed + Supabase` (id: `kSzIsDnDrxa2JKgX`)

**Insertion point:** Between `Update Ad Row` and `Loop Ads`. Two new nodes run in sequence: per-pattern detection, then category-level scoring.

## Add Node 1: `Detect Patterns` (per-pattern + auto-promote)

1. Open the workflow in n8n
2. Click the `+` between `Update Ad Row` and `Loop Ads`
3. Pick **HTTP Request** node, name it `Detect Patterns`
4. Configure:

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `https://fliqklclucdhjemdjatr.supabase.co/rest/v1/rpc/intake_detect_and_label` |
| Authentication | `Predefined Credential Type` → `Supabase API` |
| Send Headers | ON |
|   `Content-Type` | `application/json` |
| Send Body | ON |
| Body Content Type | `JSON` |
| JSON Body | `={{ { p_ad_id: $json._adId } }}` |
| Options → Response → Never Error | ON |
| Options → Timeout | `30000` |

5. **Connection:** `Update Ad Row` → `Detect Patterns` → `Detect Categories` → `Loop Ads`

## Add Node 2: `Detect Categories` (broader category-level scoring)

Repeat the HTTP Request node setup with these differences:

| Field | Value |
|---|---|
| URL | `https://fliqklclucdhjemdjatr.supabase.co/rest/v1/rpc/detect_ad_categories` |
| JSON Body | `={{ { p_ad_id: $('Update Ad Row').item.json._adId } }}` |

Returns array of `{pattern_category, similarity, n_anchors}` for all 7 categories. Useful for AI generation prompts that want a broader semantic match than per-pattern detection. Does NOT auto-promote (read-only scoring).

## What Happens at Runtime

For every ad that finishes enrichment, this node:
1. Calls the Postgres function `intake_detect_and_label(ad_id)`
2. Function runs all 12 active patterns from `pattern_definitions`
3. Auto-promotes labels with `confidence >= auto_promote_threshold` to `ad_pattern_labels`
4. Queues lower-confidence matches in `ad_pattern_label_suggestions` for review
5. Returns `[{pattern_name, confidence, action}, ...]`

## Optional: Slack Alert on High-Confidence Loser

Add an `IF` node after `Detect Patterns` to fire a Slack alert when a known loser pattern fires:

```javascript
// IF condition (returns true if any loser pattern with conf >= 0.85 detected)
$json.some(p => 
  ['anti_sale_headline_as_hook','anti_gifting_frame','anti_manufactured_scarcity'].includes(p.pattern_name)
  && p.confidence >= 0.85 
  && p.action === 'auto_promoted'
)
```

If true → Slack node with message:
```
⚠️ Loser pattern detected on ad {{ $('Update Ad Row').item.json._adId }}
Patterns: {{ $json.filter(p => p.action === 'auto_promoted').map(p => p.pattern_name + ' (' + p.confidence + ')').join(', ') }}
Recommend killing this ad early — historical data shows ~10% winner rate.
```

## Test Manually First

Before enabling, test the RPC endpoint with a known winner ad:

```bash
curl -X POST 'https://fliqklclucdhjemdjatr.supabase.co/rest/v1/rpc/intake_detect_and_label' \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"p_ad_id": 78215929}'
```

Expected output (per-pattern):
```json
[
  {"pattern_name":"video_bof_format_winner","pattern_category":"format_fit","confidence":1.0,"action":"auto_promoted"},
  {"pattern_name":"without_invasive_procedure","pattern_category":"pain_avoidance","confidence":0.9361,"action":"auto_promoted"},
  {"pattern_name":"ugc_social_proof_hook","pattern_category":"social_proof","confidence":0.9579,"action":"auto_promoted"}
]
```

Category-level test:
```bash
curl -X POST 'https://fliqklclucdhjemdjatr.supabase.co/rest/v1/rpc/detect_ad_categories' \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H 'Content-Type: application/json' -d '{"p_ad_id": 78215929}'
# Top result: social_proof similarity ~0.95 (winner clusters in winner categories)
```

## Rollback

If something breaks: in n8n, delete the `Detect Patterns` node and reconnect `Update Ad Row` → `Loop Ads` directly. The pattern data already in Supabase is unaffected — only new intake stops being labeled.
