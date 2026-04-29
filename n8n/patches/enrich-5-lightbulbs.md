# Patch: Ads — Multimodal Enrich + Embed (kSzIsDnDrxa2JKgX)

Two changes required in the n8n UI. Apply in order.

---

## Change 1: Add 5-Lightbulbs to Gemini Flash classifier prompt

Find the **Gemini Flash** node (the one that analyzes the ad thumbnail + text and returns JSON).

Append the following to the JSON schema in its output instructions:

```json
"lightbulb_status_quo":   "What is the prospect currently doing or believing that keeps them stuck?",
"lightbulb_alternatives": "What other solutions has the prospect tried or considered?",
"lightbulb_mechanism":    "What is the unique mechanism or approach this ad introduces?",
"lightbulb_offer":        "What is the specific offer, CTA, or next step?",
"lightbulb_new_life":     "What transformation or outcome does the ad promise?",
"native_ui_hijacking":    true/false — does the ad mimic iOS/TikTok native UI elements?,
"hook_timing_seconds":    float — at what second does the core value prop / problem statement land?
```

Update the PATCH body node to include these new fields alongside the existing ones:

```json
{
  "lightbulb_status_quo":   "{{ $json.lightbulb_status_quo }}",
  "lightbulb_alternatives": "{{ $json.lightbulb_alternatives }}",
  "lightbulb_mechanism":    "{{ $json.lightbulb_mechanism }}",
  "lightbulb_offer":        "{{ $json.lightbulb_offer }}",
  "lightbulb_new_life":     "{{ $json.lightbulb_new_life }}",
  "native_ui_hijacking":    "{{ $json.native_ui_hijacking }}",
  "hook_timing_seconds":    "{{ $json.hook_timing_seconds }}"
}
```

---

## Change 2: Add embedding model router

After the Gemini Flash classification node, add a **Switch** node on `media_type`:

| Condition | Branch |
|---|---|
| `media_type == 'image'` or null | → Voyage Multimodal 3 (HTTP node) |
| `media_type == 'video'` | → Twelve Labs Marengo 3.0 (HTTP node) |
| fallback | → Gemini Embedding (existing node, keep as-is) |

### Voyage Multimodal 3 HTTP node
- **Method**: POST
- **URL**: `https://api.voyageai.com/v1/multimodal/embeddings`
- **Auth**: Bearer — credential name `Voyage API Key`
- **Body**:
```json
{
  "model": "voyage-multimodal-3",
  "inputs": [
    {
      "content": [
        { "type": "image_url", "image_url": "{{ $json.thumbnail_url }}" },
        { "type": "text",      "text": "{{ $json.title }} {{ $json.body }}" }
      ]
    }
  ]
}
```
- **Output**: write `data[0].embedding` → `embedding_1024`, set `embedding_model = 'voyage-multimodal-3'`

### Twelve Labs Marengo 3.0 HTTP node
- **Method**: POST  
- **URL**: `https://api.twelvelabs.io/v1.3/embed`
- **Auth**: Bearer — credential name `Twelve Labs API Key`
- **Body**:
```json
{
  "model_name": "Marengo-retrieval-2.7",
  "video_url":  "{{ $json.media_url }}"
}
```
- **Output**: write `video_embedding.float` → `embedding_512`, set `embedding_model = 'marengo-3'`
- Note: Marengo embed is async — add a polling loop or use webhook callback

### PATCH body update
Replace the current single `embedding` column write with:
```json
{
  "embedding_model": "{{ $json.embedding_model }}",
  "embedding_1024":  "{{ $json.embedding_1024 ?? null }}",
  "embedding_512":   "{{ $json.embedding_512 ?? null }}"
}
```

---

## Verification

After applying both changes, run the workflow on a single `pending` ad row:

```sql
-- Confirm 5-Lightbulbs populated
SELECT id, lightbulb_status_quo, lightbulb_mechanism, hook_timing_seconds
FROM ads WHERE analyzed_at IS NOT NULL ORDER BY analyzed_at DESC LIMIT 1;

-- Confirm embedding routed correctly
SELECT id, embedding_model, 
       CASE WHEN embedding_1024 IS NOT NULL THEN 'populated' ELSE 'null' END AS embed_1024,
       CASE WHEN embedding_512  IS NOT NULL THEN 'populated' ELSE 'null' END AS embed_512
FROM ads WHERE analyzed_at IS NOT NULL ORDER BY analyzed_at DESC LIMIT 1;
```
