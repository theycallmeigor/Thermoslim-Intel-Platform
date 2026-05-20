# Ads — Multimodal Enrich v2 — Spec

**Status:** Design locked · awaiting build into `Qh9EycVgrSgaRZd2`
**Created:** 2026-05-12
**Author:** Igor + Claude
**Supersedes:** `kSzIsDnDrxa2JKgX` (current v1, branch-by-`if-isVideo`, single failure path)

---

## Why v2 exists

v1 (`kSzIsDnDrxa2JKgX`) has three structural weaknesses:

1. **Silent failures** — `enrichment_error` is set but `analyzed_at` stays NULL forever; no review queue. 14 brand-1 video ads have NULL `visual_description` from this exact pattern.
2. **One-size-fits-all classification schema** — DPA catalog ads get persona/pain/tone (meaningless), DCO ads get `shot_style` (always "static"), video gets the same prompt as image (missing hook timing).
3. **Embedding work scattered across 3 workflows** — `embed-ad-router`, `transcribe-ad-router`, and v1 produce different fields, no single workflow guarantees completeness.

v2 fixes all three: per-format lanes, single Verify gate, all embeddings in one body.

---

## Triggers (3 entry points → one workflow body)

| Trigger | Cron / Source | Scope |
|---|---|---|
| `Schedule Daily` | `0 9 * * *` UTC (placeholder; align with Brand Pull once locked) | All pending ads, all brands |
| `When Called (executeWorkflowTrigger)` | Fired from Add Brand Form on new-brand insert | Filter `Fetch Pending` to that `brand_id` only |
| `Manual Run` | Testing / one-off | Optional `brand_id` query param |

The `Every 6h` schedule from v1 is **removed**.

---

## Settings (critical)

```json
{
  "executionOrder": "v1",
  "availableInMCP": true,
  "binaryMode": "memory",
  "timeSavedMode": "fixed",
  "callerPolicy": "workflowsFromSameOwner"
}
```

`binaryMode: "memory"` is the bug fix. Without it, `Download Thumb` returns filesystem-v2 reference strings instead of base64, and every visual-classification falls through to text-only. The defensive `isRealBase64` guard stays in code as belt-and-suspenders, but should never trigger in v2.

---

## Schema migration (apply before v2 activates)

```sql
ALTER TABLE ads
  ADD COLUMN IF NOT EXISTS body_summary TEXT,
  ADD COLUMN IF NOT EXISTS transcript_summary TEXT,
  ADD COLUMN IF NOT EXISTS dco_variant_hint TEXT;

CREATE TABLE IF NOT EXISTS ads_pending_review (
  id BIGSERIAL PRIMARY KEY,
  ad_id BIGINT NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  lane TEXT,
  flagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution TEXT
);
CREATE INDEX IF NOT EXISTS idx_ads_pending_review_unresolved
  ON ads_pending_review (ad_id) WHERE resolved_at IS NULL;
```

---

## Topology

```
[Schedule Daily] [When Called] [Manual Run]
        \           |           /
         → Fetch Pending Ads  (optional brand_id filter)
                    ↓
           Prepare Paths       (compute _lane key + asset paths)
                    ↓
              Loop (batch 10)
                    ↓
       Switch on display_format
        ├─ dco   → Switch media_type
        │           ├─ image → LANE A (DCO image)
        │           └─ video → LANE D (shared video)
        ├─ dpa   → LANE B (DPA — catalog product)
        ├─ image → LANE C (vanilla image)
        └─ video → LANE D (shared video)
                          ↓
                Merge (all lanes converge)
                          ↓
              Verify Nothing Missing
                ├─ pass → PATCH ads (mark analyzed_at)
                └─ fail → INSERT ads_pending_review
                          ↓
                       Loop ←┘  (back for next batch)
```

---

## Lane node lists

### Lane A — DCO Image (211 ads · 42%)

| # | Node | Type | Purpose |
|---|---|---|---|
| A1 | Download Thumb | httpRequest GET | fetch thumbnail_url as binary |
| A2 | Classify DCO-image | httpRequest POST | gemini-2.5-flash + DCO-image schema (NO shot_style, includes dco_variant_hint) |
| A3 | Build Embed Text | code | concat classified fields |
| A4 | Gemini Embed 3072d | httpRequest POST | gemini-embedding-2 |
| A5 | Download Main Asset | httpRequest GET | full-res jpg/png |
| A6 | Voyage Embed 1024d | httpRequest POST | voyage-multimodal-3 on asset image |
| A7 | Upload to Supabase Storage | httpRequest POST | `ad-assets/{slug}/{id}.jpg` |
| A8 | Drive Backup Asset | googleDrive | upload to brand folder |
| A9 | Body Summary | httpRequest POST | gemini-2.5-flash ≤250 words |
| A10 | Assemble Patch | code | build PATCH body for `ads` |
| A11 | Set lane=`dco/image` | set | tag for Verify gate |

**Required fields for Verify:** `visual_description, embedding, embedding_1024, asset_public_url, body_summary`

**Skipped:** transcript, embedding_512, hook_timing_seconds. `shot_style` hardcoded to `"static_image"`.

---

### Lane B — DPA (7 ads · 1%)

| # | Node | Type | Purpose |
|---|---|---|---|
| B1 | Download Thumb | httpRequest GET | product card image |
| B2 | Extract Slug | code | parse landing_page URL → product slug |
| B3 | Resolve product_id | httpRequest GET | `GET /rest/v1/products?slug=eq.{slug}&select=id` |
| B4 | Classify DPA | httpRequest POST | restricted schema (visual_description, on_screen_text, lightbulb_offer, lightbulb_new_life only) |
| B5 | Build Embed Text | code | DPA-focused concat |
| B6 | Gemini Embed 3072d | httpRequest POST | standard |
| B7 | Voyage Embed 1024d | httpRequest POST | on product card |
| B8 | Upload to Supabase Storage | httpRequest POST | standard |
| B9 | Drive Backup Asset | googleDrive | standard |
| B10 | Assemble Patch | code | includes product_id |
| B11 | Set lane=`dpa/image` | set | tag |

**Required for Verify:** `visual_description, product_id, embedding, embedding_1024, asset_public_url`

**Skipped:** persona, pain_point, emotional_tone, talent_description, body_summary, transcript, all video fields, 3 of 5 lightbulbs (keep offer + new_life only).

**Key win:** `product_id` is the deterministic deliverable — DPA is the ONE format where slug→product mapping is reliable.

---

### Lane C — Vanilla Image (96 ads · 19%)

Identical to Lane A minus `dco_variant_hint`.

| # | Node | Difference from Lane A |
|---|---|---|
| C1-C9 | Same | — |
| C10 | Assemble Patch | no `dco_variant_hint` field |
| C11 | Set lane=`image/image` | tag |

`shot_style` classified normally (vs A's constant). All 5 lightbulbs populated.

**Required for Verify:** `visual_description, embedding, embedding_1024, asset_public_url, body_summary`

---

### Lane D — Video (184 ads · 37%)

Heaviest lane, shared by `video/video` AND `dco/video`.

| # | Node | Type | Purpose |
|---|---|---|---|
| D1 | Download Thumb | httpRequest GET | key-frame thumbnail |
| D2 | Classify Video | httpRequest POST | full schema incl. shot_style, hook_timing_seconds, all 5 lightbulbs |
| D3 | Build Embed Text | code | concat (transcript field if available from prior run) |
| D4 | Gemini Embed 3072d | httpRequest POST | standard |
| D5 | Branch on performance_score | if | `>= 70` → multi-frame path |
| D6a | Extract 3 Key Frames | executeCommand | ffmpeg @ 25%, 50%, 75% of duration (hi-perf only) |
| D6b | Use Thumbnail Only | set | `_frames = [thumbnail]` (lo-perf) |
| D7 | Voyage Embed 1024d Mean-Pool | httpRequest POST + code | embed each frame, mean-pool to single 1024d |
| D8 | Download Main Asset (mp4) | httpRequest GET | video binary |
| D9 | Upload to Supabase Storage | httpRequest POST | `ad-assets/{slug}/{id}.mp4` |
| D10 | Drive Backup mp4 | googleDrive | upload to brand folder |
| D11 | Marengo Task Create | httpRequest POST | `POST /embed/tasks` model=marengo3.0 |
| D12 | Poll Marengo | httpRequest GET (loop) | until status=ready (max 300s) |
| D13 | Insert Clip Rows | httpRequest POST | bulk INSERT `ad_clip_embeddings` |
| D14 | Mean-pool → embedding_512 | code | average clip vectors |
| D15 | Pegasus Transcribe | httpRequest POST | Twelve Labs `/summarize` or `/gist` |
| D16 | Transcript Summary | httpRequest POST | gemini-2.5-flash ≤250 words |
| D17 | Drive Backup Transcript | googleDrive | upload .txt |
| D18 | Refine hook_timing | code | override Gemini estimate with transcript timestamps if available |
| D19 | Assemble Patch | code | all video fields + transcript_written_at, embedding_*_written_at |
| D20 | Set lane=`video/video` (or `dco/video`) | set | tag — preserves dco distinction for analytics |

**Required for Verify:** `visual_description, transcript, transcript_summary, embedding, embedding_1024, embedding_512, asset_public_url`

`dco_variant_hint` NOT relevant for video DCO (Meta DCO video = single creative cycled, not assembled).

---

## Shared tail (post-lane)

| # | Node | Type | Purpose |
|---|---|---|---|
| T1 | Merge All Lanes | merge | mode=`combine`, join on `id` |
| T2 | Verify Nothing Missing | code | per-lane required-field check |
| T3 | Route on _missing.length | if | `>0` → T4 · `=0` → T5 |
| T4 | INSERT ads_pending_review | httpRequest POST | with reason `incomplete_enrichment:{missing}` |
| T5 | PATCH ads (complete) | httpRequest PATCH | write all fields + `analyzed_at`, `embedded_at` |
| T6 | Loop continuation | splitInBatches | next batch |

**Verify code logic:**

```js
const required = {
  'dco/image':   ['visual_description','embedding','embedding_1024','asset_public_url','body_summary'],
  'dco/video':   ['visual_description','transcript','transcript_summary','embedding','embedding_1024','embedding_512','asset_public_url'],
  'dpa/image':   ['visual_description','product_id','embedding','embedding_1024','asset_public_url'],
  'image/image': ['visual_description','embedding','embedding_1024','asset_public_url','body_summary'],
  'video/video': ['visual_description','transcript','transcript_summary','embedding','embedding_1024','embedding_512','asset_public_url']
};
const lane = $json._lane;
const missing = required[lane].filter(f => $json[f] == null || $json[f] === '');
return { json: { ...$json, _missing: missing, _lane: lane } };
```

---

## Credentials required (must be attached after import)

| Credential | Used by |
|---|---|
| `supabaseApi` (service role) | Fetch Pending, all Supabase Storage uploads, all PATCH/INSERT |
| `httpHeaderAuth` "Gemini API Key" | Classify nodes, Embed 3072d, Body/Transcript summaries |
| `httpHeaderAuth` "Voyage API Key" | Voyage 1024d on every lane |
| `httpHeaderAuth` "Twelve Labs API Key" | Marengo task + Pegasus transcribe (Lane D only) |
| `googleDriveOAuth2Api` | Drive backup nodes (Lane A/B/C asset, Lane D mp4 + transcript) |

---

## Per-format volume (brands 1 + 2 today)

```
dco/image  211  ████████████████████████████████  42%  → Lane A
video      165  █████████████████████████         33%  → Lane D
image       96  ██████████████                    19%  → Lane C
dco/video   19  ███                                4%  → Lane D
dpa/image    7  █                                  1%  → Lane B
```

---

## Migration sequence (idempotent, safe to retry)

1. **Apply schema migration** above (3 columns + `ads_pending_review` table).
2. **Build v2** into `Qh9EycVgrSgaRZd2` — drag-import JSON, reattach 5 creds, leave **inactive**.
3. **Dry-run on 5 ads per lane** (20 total via Manual Run with hand-picked IDs). Verify:
   - Each lane produces all required fields
   - Verify gate routes correctly (force a NULL → confirm row lands in `ads_pending_review`)
   - Drive backups appear in correct brand folder
4. **Rename v1** (`kSzIsDnDrxa2JKgX`) → `Ads — Multimodal Enrich v1 (archive)` and disable its `Every 6h` schedule.
5. **Activate v2 schedule** (`Schedule Daily` ON).
6. **Backfill** `body_summary` for 287 image ads + `transcript_summary` for 71 video ads via one-shot Gemini Flash script (~$0.10, ~5 min).

---

## Open questions (non-blocking — answer during dry-run)

1. Daily schedule UTC time — placeholder `0 9 * * *` until Brand Pull cron is locked.
2. Transcript engine — Pegasus (cheaper, slower) vs Gemini long-context on mp4 (3× cost, faster)? Default: Pegasus.
3. Voyage 3-frames threshold — `performance_score >= 70`? Default: yes.
4. `ads_pending_review` handoff — Slack alert per row vs dashboard-only? Default: dashboard-only for now, Slack later.

---

## What v2 does NOT do (deferred to future sessions)

- `product_id` resolution for non-DPA ads (DCO/image/video) — needs landing-page slug strategy
- `funnel_coherence_score` — LP crawler not built
- HNSW index on `embedding_512` / `embedding_1024` — defer until clip table grows past 50k rows
- K-means brand DNA clustering — separate workflow, fires off this one's outputs

---

## File outputs

- This spec: `n8n/files/multimodal-enrich-v2-spec.md`
- Workflow JSON: `n8n/workflows/multimodal-enrich-v2.json`
- Backfill script: `scripts/backfill_summaries.py` (TBD post-v2-activation)
