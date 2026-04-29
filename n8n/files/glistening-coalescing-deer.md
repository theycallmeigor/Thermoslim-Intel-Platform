# Ad Intelligence — Phase 1 + Phase 3 Plan

## Context

Building a competitive ad intelligence engine using GetHookd API, n8n, Supabase, and Gemini. The pipeline has two stages: ingestion (n8n → Supabase `ads` table) and enrichment (multimodal AI classification + embeddings). Currently 437 ads exist but 0 are enriched because `thumbnail_url`, `media_url`, and `media_type` are NULL in all rows. The fixed Brand Pull workflow JSON already exists at the project root with the media field extraction code — it just needs to be imported and wired up.

Phase 3 delivers Supabase-native intelligence: hybrid retrieval, brand DNA representation, multimodal pattern analysis, and a weekly digest workflow. This creates the searchable corpus that previews the Phase 4 generative engine.

This document was pressure-tested via two parallel deep research streams (industry teardowns of Foreplay/Motion App/AdCreative.ai/Pencil/Omneky + AdsRx direct-response course findings). The architecture below is **Ultra Plan v2** — research-revised from the v1 first-principles design.

---

## Ultra Plan v2 — Synthesis of Research

### Confirmed by research (keep as-is)
- **Phase 1 priority**: thumbnail_url extraction is the top bottleneck — without it, the entire enrichment pipeline is blocked
- **n8n + Supabase + pgvector stack**: validated; Foreplay uses identical orchestration patterns
- **Hybrid retrieval (BM25 + vector + RRF)**: industry standard, keep
- **Performance-weighted scoring**: keep — but specifically weight by Hook Rate / Thumb-stop rate, not generic performance_score

### Revised by research (architectural changes from v1)
| v1 Decision | v2 Decision | Why |
|---|---|---|
| 3 separate vector columns (`full_ad_embedding`, `hook_embedding`, `copy_embedding`) | Single unified multimodal index + late-interaction reranking (MUVERA pattern) | Storing 3 columns fragments semantic context and forces inefficient weighting heuristics. SOTA uses single dense vector for fast ANN filtering, then multi-vector cross-encoder reranking on top-100 |
| Gemini Embedding 768-dim for everything | **Voyage Multimodal 3 for static image+text**, **Twelve Labs Marengo 3.0 (512-dim) for video**, Gemini as cost-efficient fallback | Voyage and Marengo benchmark higher on creative similarity tasks; Marengo is video-native vs frame-sampling |
| Brand DNA = average of all ad embeddings | **K-means clustering with k=3-5 sub-clusters per brand**, store cluster centroids + closest-vector exemplar per cluster | Averaging causes semantic vector collapse — distinct campaign styles obliterated. Clusters preserve persona/product-line nuance |
| Top-K vector retrieval | **Top-K → MMR diversification → cross-encoder rerank** | Pure cosine similarity returns near-identical ads → mode collapse in generative output. MMR injects diversity required for creative RAG |
| Cross-encoder reranking deferred to Phase 4 | **Integrate reranker in Phase 3** | Late-interaction (ColBERT-style) reranking is the SOTA — defer only for cost reasons, not architecture |
| Generic creative_brief column for RAG context | **Atomic anchors prompt structure** with strict markdown hierarchies, JSON schemas, discrete tone scales | Free-form descriptive prompts cause LLM style drift. Atomic anchors enforce brand consistency |

### New additions from research (didn't exist in v1)
1. **MMR (Maximal Marginal Relevance)** — λ-tuned diversity penalty in retrieval to prevent mode collapse
2. **5 Lightbulbs framework classification** (Status Quo, Other Options, Your Approach, Your Offer, New Life) — add to Gemini Flash enrichment prompt
3. **Hook timing temporal segmentation** — frame-by-frame analysis of 0-3s window; Hook Rate / Thumb-stop rate as primary performance signal
4. **Funnel coherence score** — semantic similarity between ad embedding and landing page embedding, predicts post-click conversion viability
5. **Audio fingerprinting** — spectrogram embeddings for trending sound detection (TikTok/Reels) and copyright risk flagging
6. **Talent face recognition** — CNN facial encoding to track recurring UGC creators across competitors
7. **Creative fatigue detection** — CPMr time-series regression per ad (predicts 2-4 week creative refresh cycles)
8. **AAA Method generation constraint** (Angle + Ad Type + Action) — Phase 4 generative outputs must change exactly ONE variable per variation for scientific A/B testing
9. **Native UI hijacking detection** — flag ads mimicking iOS/TikTok native interfaces (proven trust-builders)
10. **LLM-as-judge with Grading Notes** — pre-launch evaluation with domain heuristics (96% human-alignment); paired with closed-loop Meta Ads API for post-launch
11. **Carousel handling** — embed each card individually + sequential aggregation, never single vector
12. **Comment sentiment scraping** — Amazon reviews / Reddit / YouTube comments for customer language extraction
13. **Embedding drift monitoring** — weekly Recall@K cron against benchmark dataset, triggers re-indexing
14. **Modular API abstraction** — embedding model and generation model behind interfaces, swappable without refactor (avoids vendor lock-in as model deprecations accelerate)
15. **Copyright / Market Harm safeguards** — strict output filters + negative prompts ensuring transformative (not derivative) generation, per *Kadrey v. Meta* and *Bartz v. Anthropic* rulings

### Cut by research
- **3-column vector schema** (replaced by unified multi-vector + late-interaction)
- **Vector averaging for brand DNA** (replaced by K-means clusters)
- **LLM-as-judge for "aesthetic quality"** — only use real Hook Rate / CPA / CTR data for performance evaluation; LLM judge is for brand-safety/structural-coherence rubrics only
- **Subjective creative rubrics** that aren't tied to front-end performance metrics

### Independent verification still needed (research flagged as out-of-scope)
- Detailed legal counsel review of scraping + generation under "Market Harm" standard for the user's specific jurisdiction
- Empirical benchmark of Voyage Multimodal 3 vs Gemini vs Cohere v4 on the user's actual ad corpus (proxy benchmarks may not reflect domain)
- 2026-2027 model deprecation timelines for chosen providers (build modular regardless)
- MMR λ tuning on actual creative corpus (start at λ=0.5, A/B test)

---

## Phase 1 — Fix the Foundation

### Step 1: Import the Fixed Brand Pull Workflow
- **Source file**: `/Users/igordviniatin/Documents/thermoslim-platform/GetHookd — Brand Pull copy (1).json`
- Import into n8n via MCP (`mcp__n8n__update_workflow` with ID `tJQcvlYBRb6WAc3D`) or manual import in n8n UI
- The fix extracts media fields in the Code node:
  ```js
  media_type: ad.media && ad.media[0] ? ad.media[0].type : null,
  media_url: ad.media && ad.media[0] ? ad.media[0].url : null,
  thumbnail_url: ad.media && ad.media[0] ? ad.media[0].thumbnail_url : null,
  ```
- **Verify**: Run manually on My Derma Dream, confirm 1-2 rows in `ads` table have `thumbnail_url` populated before proceeding

### Step 2: Schema — Add `gethookd_brand_id` to Brands Table
Execute in Supabase SQL editor:
```sql
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS gethookd_brand_id bigint;
UPDATE public.brands SET gethookd_brand_id = 138083 WHERE name = 'My Derma Dream';
```

### Step 3: Wire Brand Pull to Read from Brands Table
Modify the Brand Pull workflow to be data-driven instead of hardcoded:
- Add a Supabase HTTP node at the start: `GET /brands?tier=neq.paused&select=id,name,gethookd_brand_id`
- Replace hardcoded `138083` in the API URL with `{{ $json.gethookd_brand_id }}`
- Add outer loop (SplitInBatches) over brands array before the pagination loop
- Update `last_full_pull_at` on the brand row after each brand completes

### Step 4: Build Daily Delta Workflow
New n8n workflow (or scheduled variant of Brand Pull):
- Trigger: Schedule (daily, off-peak)
- For each brand from `brands` table:
  1. Fetch `SELECT external_id FROM ads WHERE brand_external_id = '{{ brandName }}'` → build Set of known IDs
  2. Paginate GetHookd API page-by-page
  3. In Code node: check each ad's `external_id` against known set
  4. **Stop condition**: If any ad on the current page is already known, stop pagination (assume sorted newest-first)
  5. Upsert only the new batch
  6. Update `last_delta_check_at` on brand row
- Keep full Brand Pull as a separate, manually-triggered workflow

### Step 5: Upgrade Enrichment Pipeline + Run It
Two changes to the existing `Ads — Multimodal Enrich + Embed` workflow (ID `kSzIsDnDrxa2JKgX`):

**5a. Add 5 Lightbulbs framework to Gemini Flash classifier prompt.** Currently extracts hook/angle/persona — add five new fields:
```
- lightbulb_status_quo: "What is the prospect currently doing or believing?"
- lightbulb_alternatives: "What other options has the prospect tried/considered?"
- lightbulb_mechanism: "What's the unique approach this ad offers?"
- lightbulb_offer: "What is the specific offer/CTA?"
- lightbulb_new_life: "What transformation/outcome is promised?"
```
Add to Supabase `ads` table:
```sql
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS lightbulb_status_quo text,
  ADD COLUMN IF NOT EXISTS lightbulb_alternatives text,
  ADD COLUMN IF NOT EXISTS lightbulb_mechanism text,
  ADD COLUMN IF NOT EXISTS lightbulb_offer text,
  ADD COLUMN IF NOT EXISTS lightbulb_new_life text,
  ADD COLUMN IF NOT EXISTS native_ui_hijacking boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hook_timing_seconds float;
```

**5b. Run enrichment** to backfill all 437 ads with v2 schema.

**Exit criteria for Phase 1**: All 437 rows have `thumbnail_url` NOT NULL; 50+ rows have `status = 'complete'` with `embedding` populated and 5 Lightbulbs fields filled.

---

## Phase 3 v2 — Intelligence Layer (Research-Driven Architecture)

> Execute after Phase 1 exit criteria are met. Significantly revised from v1 — see Synthesis section above for diff.

> Sections marked **[v1 archived]** are kept for reference but superseded by v2 steps.

### Step 6 v2: Unified Multimodal Vector Schema (replaces v1 three-column split)

**Decision**: Single primary embedding column per ad, model selected by `media_type`. Drop the three-column architecture — it fragments semantic context. Use late-interaction reranking instead for nuanced queries.

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop the v1 three-column approach if already created:
-- ALTER TABLE public.ads DROP COLUMN IF EXISTS full_ad_embedding,
--                       DROP COLUMN IF EXISTS hook_embedding,
--                       DROP COLUMN IF EXISTS copy_embedding;

-- v2 schema: one primary embedding + dimension-flexible storage
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS embedding_model text,  -- 'voyage-multimodal-3' | 'marengo-3' | 'gemini-fallback'
  ADD COLUMN IF NOT EXISTS embedding_1024 vector(1024),  -- Voyage Multimodal 3 (static image+text)
  ADD COLUMN IF NOT EXISTS embedding_512 vector(512);    -- Marengo 3.0 (video)

-- HNSW indexes (build after data populates):
CREATE INDEX IF NOT EXISTS ads_embed_1024_idx ON ads USING hnsw (embedding_1024 vector_cosine_ops);
CREATE INDEX IF NOT EXISTS ads_embed_512_idx ON ads USING hnsw (embedding_512 vector_cosine_ops);
```

**Enrichment pipeline routing** (modify `Ads — Multimodal Enrich + Embed`):
- `media_type = 'image'` → Voyage Multimodal 3 → `embedding_1024`
- `media_type = 'video'` → Twelve Labs Marengo 3.0 → `embedding_512`
- Fallback (provider down or cost-saving): Gemini Embedding → set `embedding_model = 'gemini-fallback'`

**Modular abstraction**: route through a single n8n sub-workflow `Embed Ad` that takes (`media_url`, `media_type`, `text_payload`) and returns `(vector, dim, model_id)`. Swap providers without touching upstream/downstream nodes.

The `ads` table needs three separate embedding columns, not one. This enables format-aware queries:
- `full_ad_embedding` — combined visual + copy (general semantic meaning)
- `hook_embedding` — first frame / first 3s only (critical for video/Reel pattern matching)
- `copy_embedding` — text only (separates copywriting trends from visual trends)

```sql
-- Verify pgvector is enabled:
CREATE EXTENSION IF NOT EXISTS vector;

-- Add three embedding columns (skip if already exist):
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS full_ad_embedding vector(768),
  ADD COLUMN IF NOT EXISTS hook_embedding vector(768),
  ADD COLUMN IF NOT EXISTS copy_embedding vector(768);

-- HNSW indexes on each (build after data is populated):
CREATE INDEX IF NOT EXISTS ads_full_embed_idx ON ads USING hnsw (full_ad_embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX IF NOT EXISTS ads_hook_embed_idx ON ads USING hnsw (hook_embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX IF NOT EXISTS ads_copy_embed_idx ON ads USING hnsw (copy_embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
```

**Enrichment pipeline update** (modify `Ads — Multimodal Enrich + Embed` workflow):
- `full_ad_embedding`: Pass `thumbnail_url` image + `title` + `body` to Gemini Embedding in one call
- `hook_embedding`: Pass thumbnail only (no copy) — approximates visual hook for image ads; for video, pass first-frame URL when available
- `copy_embedding`: Pass `title` + `body` + `hook` + `core_angle` text only

For Phase 1 (static image ads, no video processing yet): `hook_embedding` ≈ image-only embedding; `copy_embedding` ≈ text-only embedding. Video frame extraction is a future enhancement.

### Step 7 v2: Hybrid Retrieval + MMR + Late-Interaction Reranking

Three-stage pipeline (replaces v1 single similarity function):

**Stage A — Fast candidate filtering (top-100):**
- BM25 full-text search on `rag_context_tsv`
- Vector cosine on primary embedding column
- RRF (Reciprocal Rank Fusion) to merge → top-100 candidates
- Performance-weighted (multiply RRF score by `1 + hook_rate/100`)

**Stage B — MMR diversification (top-100 → top-20):**
Iteratively select candidates that maximize relevance to query while penalizing redundancy with already-selected ads:
```
score(c) = λ * sim(c, query) - (1-λ) * max(sim(c, c_selected))
```
- `λ = 0.7` is a reasonable starting default (relevance-leaning with some diversity); tune empirically
- Implement as a Postgres function or n8n Code node post-RPC
- This prevents mode collapse in the generative LLM context (single-style retrieval = clone output)

**Stage C — Late-interaction reranking (top-20 → top-5):**
Run Cohere Rerank v3 (or self-hosted BGE-Reranker-v2-M3 / ColBERT) on the diversified set. The cross-encoder scores each (query, candidate) pair with full token-level attention — much higher precision than bi-encoder cosine.

```sql
-- Stage A: BM25 + vector hybrid (returns 100 candidates)
CREATE OR REPLACE FUNCTION rag_candidates(
  query_text text,
  query_embedding vector(1024),
  filter_funnel_stage text DEFAULT NULL,
  filter_ad_type text DEFAULT NULL,
  min_hook_rate float DEFAULT 0
)
RETURNS TABLE(id bigint, brand_name text, rag_context text, hook_rate float, score float)
LANGUAGE sql STABLE AS $$
  WITH vec AS (
    SELECT id, row_number() OVER (ORDER BY embedding_1024 <=> query_embedding) AS rnk
    FROM ads
    WHERE status = 'complete' AND embedding_1024 IS NOT NULL
      AND (filter_funnel_stage IS NULL OR funnel_stage = filter_funnel_stage)
      AND (filter_ad_type IS NULL OR ad_type = filter_ad_type)
      AND COALESCE(hook_rate, 0) >= min_hook_rate
    ORDER BY embedding_1024 <=> query_embedding LIMIT 100
  ),
  kw AS (
    SELECT id, row_number() OVER (
      ORDER BY ts_rank_cd(rag_context_tsv, plainto_tsquery('english', query_text)) DESC
    ) AS rnk
    FROM ads
    WHERE rag_context_tsv @@ plainto_tsquery('english', query_text) LIMIT 100
  ),
  fused AS (
    SELECT id, SUM(1.0 / (60 + rnk)) AS rrf FROM (
      SELECT id, rnk FROM vec UNION ALL SELECT id, rnk FROM kw
    ) u GROUP BY id
  )
  SELECT a.id, a.brand_name, a.rag_context, a.hook_rate,
         (f.rrf * (1 + COALESCE(a.hook_rate, 0) / 100.0))::float
  FROM fused f JOIN ads a ON a.id = f.id
  ORDER BY 5 DESC LIMIT 100;
$$;
```

MMR + reranking are implemented in the application layer (n8n Code node or Phase 4 generation service), not as Postgres functions — Postgres isn't the right place for iterative selection logic with cross-encoder API calls.

### Step 7b: ~~Per-column similarity functions~~ [v1 archived — superseded by Step 7 v2 unified pipeline]

The v1 plan's `match_ads_full / match_ads_hook / match_ads_copy` functions are replaced by:
```sql
-- Generic pattern; replicate for hook_embedding and copy_embedding
CREATE OR REPLACE FUNCTION match_ads_full(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 20,
  filter_brand_id bigint DEFAULT NULL
)
RETURNS TABLE(
  id bigint, brand_name text, title text, hook text, core_angle text,
  funnel_stage text, ad_type text, performance_score int, thumbnail_url text, similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT a.id, a.brand_name, a.title, a.hook, a.core_angle,
    a.funnel_stage, a.ad_type, a.performance_score, a.thumbnail_url,
    1 - (a.full_ad_embedding <=> query_embedding) AS similarity
  FROM ads a
  WHERE a.status = 'complete'
    AND a.full_ad_embedding IS NOT NULL
    AND (filter_brand_id IS NULL OR a.brand_id = filter_brand_id)
    AND 1 - (a.full_ad_embedding <=> query_embedding) > match_threshold
  ORDER BY a.full_ad_embedding <=> query_embedding
  LIMIT match_count;
$$;
-- Repeat: match_ads_hook (uses hook_embedding), match_ads_copy (uses copy_embedding)
```
Usage: "Find ads with the same visual hook" → `match_ads_hook`. "Find ads with the same copy angle" → `match_ads_copy`. "Find ads like this one overall" → `match_ads_full`.

### Step 8: Performance Pattern View
```sql
CREATE OR REPLACE VIEW ad_patterns AS
SELECT 
  hook,
  core_angle,
  funnel_stage,
  ad_type,
  brand_name,
  COUNT(*) AS ad_count,
  ROUND(AVG(performance_score), 1) AS avg_score,
  MAX(performance_score) AS top_score,
  COUNT(*) FILTER (WHERE performance_score > 70) AS high_performers
FROM ads
WHERE status = 'complete'
  AND hook IS NOT NULL
GROUP BY hook, core_angle, funnel_stage, ad_type, brand_name
ORDER BY avg_score DESC NULLS LAST;
```
Query: `SELECT * FROM ad_patterns WHERE funnel_stage = 'TOF' ORDER BY avg_score DESC LIMIT 20`

### Step 9 v2: Brand DNA via K-Means Centroid Clustering (replaces v1 averaging)

**Decision**: Vector averaging causes semantic collapse — distinct campaign styles (humor TikTok vs. trust LinkedIn) average into a generic centroid representing nothing real. Use K-means clustering with k=3-5 per brand to preserve persona diversity.

```sql
-- Replace single brand embedding with cluster table:
CREATE TABLE IF NOT EXISTS brand_dna_clusters (
  id bigserial PRIMARY KEY,
  brand_id bigint REFERENCES brands(id),
  cluster_index int,                        -- 0..k-1
  cluster_label text,                       -- AI-labeled persona ("Educational/Authority", "Humor/UGC", etc.)
  centroid_embedding vector(1024),          -- mathematical centroid
  exemplar_ad_id bigint REFERENCES ads(id), -- closest actual ad to centroid (more concrete than centroid alone)
  member_count int,
  avg_hook_rate float,
  created_at timestamptz DEFAULT now()
);
```

**Computation pipeline** (n8n workflow, scheduled weekly):
1. For each brand with ≥10 complete ads:
2. Pull all `embedding_1024` values for that brand
3. Run K-means with k=min(5, count/5) — small brands get fewer clusters
4. For each cluster: compute centroid + find closest ad (exemplar)
5. Use Gemini Flash to label each cluster ("Look at these 5 ads — what persona/strategy do they share? Output a 2-4 word label")
6. Upsert into `brand_dna_clusters`

K-means via Supabase: easiest is to call out to a Python service (Supabase Edge Function with scikit-learn, or n8n Python code node). Postgres has no native K-means.

**Querying brand DNA**: "Generate ad in Brand X's authority persona" → look up `cluster_label = 'authority'` → use `exemplar_ad_id` and `centroid_embedding` as RAG seeds.

### Step 10: RAG Architecture (foundation for Phase 4 generation)

The retrieval layer must be designed before Phase 4. Three additions to Phase 3:

**A. `rag_context` generated column on `ads`** — denormalized text payload that gets stuffed into the LLM context window. Avoids JOIN at query time and gives a single "document" representation.

```sql
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS rag_context text
  GENERATED ALWAYS AS (
    COALESCE('Hook: ' || hook, '') || E'\n' ||
    COALESCE('Angle: ' || core_angle, '') || E'\n' ||
    COALESCE('Stage: ' || funnel_stage, '') || E'\n' ||
    COALESCE('Persona: ' || target_persona, '') || E'\n' ||
    COALESCE('Visual: ' || visual_description, '') || E'\n' ||
    COALESCE('Brief: ' || creative_brief, '')
  ) STORED;
```

**B. Hybrid retrieval RPC (BM25 + vector + RRF)** — pure vector misses exact keyword matches ("Doctor Reacts", specific product claims). Combine full-text and vector search with Reciprocal Rank Fusion, then weight by performance.

```sql
-- Full-text search column (tsvector index):
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS rag_context_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', COALESCE(rag_context, ''))) STORED;
CREATE INDEX IF NOT EXISTS ads_rag_tsv_idx ON ads USING gin(rag_context_tsv);

-- Hybrid search RPC: combines BM25 + vector via RRF, weights by performance_score
CREATE OR REPLACE FUNCTION rag_search(
  query_text text,
  query_embedding vector(768),
  match_count int DEFAULT 10,
  filter_funnel_stage text DEFAULT NULL,
  filter_ad_type text DEFAULT NULL,
  min_performance int DEFAULT 0,
  embedding_col text DEFAULT 'full_ad_embedding'  -- swap to 'hook_embedding' or 'copy_embedding'
)
RETURNS TABLE(id bigint, brand_name text, rag_context text, performance_score int, score float)
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY EXECUTE format($q$
    WITH vec AS (
      SELECT id, row_number() OVER (ORDER BY %I <=> $1) AS rnk
      FROM ads
      WHERE status = 'complete' AND %I IS NOT NULL
        AND ($2 IS NULL OR funnel_stage = $2)
        AND ($3 IS NULL OR ad_type = $3)
        AND performance_score >= $4
      ORDER BY %I <=> $1 LIMIT 50
    ),
    kw AS (
      SELECT id, row_number() OVER (ORDER BY ts_rank_cd(rag_context_tsv, plainto_tsquery('english', $5)) DESC) AS rnk
      FROM ads
      WHERE status = 'complete' AND rag_context_tsv @@ plainto_tsquery('english', $5)
      LIMIT 50
    ),
    fused AS (
      SELECT id, SUM(1.0 / (60 + rnk)) AS rrf_score FROM (
        SELECT id, rnk FROM vec UNION ALL SELECT id, rnk FROM kw
      ) u GROUP BY id
    )
    SELECT a.id, a.brand_name, a.rag_context, a.performance_score,
           (f.rrf_score * (1 + COALESCE(a.performance_score, 0)::float / 100))::float AS score
    FROM fused f JOIN ads a ON a.id = f.id
    ORDER BY score DESC LIMIT $6
  $q$, embedding_col, embedding_col, embedding_col)
  USING query_embedding, filter_funnel_stage, filter_ad_type, min_performance, query_text, match_count;
END $$;
```

**C. Reranking layer (Phase 4 prep, optional in Phase 3)** — bi-encoder retrieval (Gemini Embedding) is fast but blunt. After hybrid search returns top-50, run a cross-encoder reranker (Cohere Rerank v3 or BGE-Reranker-v2-M3 self-hosted) to score each candidate against the query. Cuts noise dramatically. This is the same pattern as the vault `retrieve.sh` pipeline.

In Phase 3 you can skip this — performance-weighted RRF is "good enough" for browsing. Add reranking when Phase 4 generation begins, because LLM context windows are precious and you want only the top 5-10 truly relevant ads.

### Embedding Model Strategy

**Phase 3 recommendation: stay with Gemini Embedding for all three columns.** Reasons:
1. Already in the enrichment pipeline (Gemini Flash for classification → Gemini Embedding for vectors). Same vector space across columns means cross-column queries are valid.
2. 768-dim slots cleanly into pgvector with HNSW indexing.
3. Native multimodal — image + text in one call, no stitching.
4. Cost is negligible at 437-10k ad scale.

**Strategic combinations to consider later (NOT Phase 3):**

| Layer | Model | When to add |
|---|---|---|
| Bi-encoder retrieval | Gemini Embedding (current) | Phase 3 — keep |
| Specialist visual hook | Jina-CLIP-v2 (open-weight) | If hook similarity quality is poor on video ads — CLIP-style models are trained specifically on image-text alignment |
| Specialist copy semantics | Voyage-3 | If copy_embedding clustering is noisy — Voyage is purpose-built for retrieval |
| Cross-encoder reranker | Cohere Rerank v3 OR BGE-Reranker-v2-M3 | Phase 4, before generation — dramatically improves precision of top-10 |
| Long-context embed | Cohere Embed v4 (128k) | When Funnel Crawler lands and you need to embed full landing pages |

**Anti-pattern: don't mix bi-encoder providers in the same column.** If `copy_embedding` is half Gemini, half Voyage, you can't compare distances. Either re-embed the entire corpus on switch, or keep one model per column for life.

**Self-hosting consideration:** at 10k+ ads with weekly re-embeds, open-weight models (Qwen3-Embedding, NV-Embed-v2 on a small GPU box) become cheaper than API calls. Defer this decision until corpus growth justifies it.

### Step 10b: Funnel Coherence Score
For ads that link to a known landing page (manual entry or Phase 2 funnel records), compute the semantic similarity between the ad's embedding and the landing page's embedding (long-context, use Cohere Embed v4 128k for landing pages):
```sql
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS funnel_coherence_score float;
-- Computed as: 1 - cosine_distance(ad.embedding, landing_page.embedding)
-- Stored 0..1; below 0.6 typically = high CPA risk
```
Phase 4 generation should warn or block when proposing an ad whose retrieved exemplars all have low coherence with the proposed landing page.

### Step 10c: Creative Fatigue Detection (defer if no CPMr time-series)
Time-series regression on `performance_score` (or CPMr if Meta API connected) per ad over time. Flag ads where score declines >20% over 14 days as "fatigued." Useful signal to exclude from RAG retrieval (don't learn from dying creative). Defer until Meta Ads API integration in Phase 5.

### Step 10d: Embedding Drift Monitoring
Weekly cron workflow: run a fixed benchmark of "known good" query→ad pairs (e.g., 50 hand-curated). Compute Recall@10 over time. Alert if drops >10% week-over-week. Triggers re-indexing or model upgrade investigation.

### Step 11: Weekly Digest n8n Workflow
New n8n workflow — schedule weekly:
1. `GET /ads?select=brand_name,hook,core_angle,ad_type,start_date&start_date=gte.{7_days_ago}&status=eq.complete`
2. Code node: group by brand, aggregate new hooks/angles seen this week vs. prior corpus
3. Generate summary per brand: "3 new TOF video ads with pain-point hooks, 1 new retargeting angle"
4. Upsert summary rows to new `weekly_digests` table:
   ```sql
   CREATE TABLE weekly_digests (
     id bigserial PRIMARY KEY,
     brand_name text,
     week_start date,
     new_ad_count int,
     new_hooks text[],
     new_angles text[],
     summary_text text,
     created_at timestamptz DEFAULT now()
   );
   ```

---

## Verification

**Phase 1 done when:**
- `SELECT count(*) FROM ads WHERE thumbnail_url IS NOT NULL` = 437
- `SELECT count(*) FROM ads WHERE status = 'complete'` >= 50
- Brand Pull workflow reads from `brands` table (no hardcoded IDs in workflow JSON)
- Delta workflow runs without error and updates `last_delta_check_at`

**Phase 3 done when:**
- `SELECT match_ads_full(full_ad_embedding, 0.7, 5) FROM ads WHERE id = {any_complete_ad_id}` returns results
- `SELECT * FROM ad_patterns LIMIT 10` returns rows with avg_score populated
- `SELECT embedding FROM brands WHERE name = 'My Derma Dream'` is NOT NULL
- `SELECT * FROM rag_search('pain point hook', '{any_embedding}'::vector, 5)` returns ranked results with `rag_context` populated
- Weekly digest workflow completes dry run without error

**Phase 4 readiness signal**: RAG retrieval returns top-5 ads with rag_context payloads ready to drop into a generation prompt. At that point the system is one prompt template away from generative briefs.

---

## Phase 4 Preview — Generative Engine Architecture (Research-Driven)

> Not in scope to build now. Documented here so Phase 3 schema/decisions don't paint Phase 4 into a corner.

### Generation pipeline shape
```
User intent → Query embed → Stage A (RRF candidates) → Stage B (MMR diversity)
  → Stage C (cross-encoder rerank) → Top-5 atomic-anchor context
  → Generation LLM (Gemini 3.x Pro / Claude 4.x Opus) with brand DNA cluster constraint
  → LLM-as-judge evaluation (Grading Notes rubric)
  → Output: Creative brief + asset prompt + landing-page wireframe
  → Phase 5: Closed-loop feedback from Meta Ads API performance data
```

### Key Phase 4 design rules from research
- **AAA Method enforcement**: each generation produces N variations changing exactly ONE variable (visual hook OR copy angle OR CTA). Prevents test dilution.
- **Atomic anchors prompt structure**: strict markdown hierarchy with mandatory brand rules, structural beats, negative constraints. No conversational free-form prompts.
- **Disentangled style/content**: when applying Brand X's DNA cluster to a new product, the brand's style (tone, color, talent type) is carried; the content (specific product, action) is replaced. Use OmniPrism-style decoupling if budget allows; otherwise enforce via atomic-anchor prompt structure.
- **Negative prompting for transformative output**: "Do not reproduce specific phrases, slogans, or visual compositions from retrieved competitor ads. Output must be transformative — extract the underlying psychological pattern, not the surface artifact." Required for Market Harm safety.
- **LLM-as-judge with Grading Notes** (pre-launch): rubric scoring for brand-safety, structural-coherence, factual-adherence — NOT for "aesthetic quality." Grading Notes injected per brand to anchor the judge.
- **Meta Ads API closed loop** (post-launch, Phase 5): pull actual Hook Rate / CPA / CTR for ads that ran. Use as ground truth to retrain the corpus ranking — system learns what *actually* works for the user's brand vs general patterns.

**Phase 4 preview**: Pick a top-scoring ad from `ad_patterns`, run `match_ads` with its embedding, get 20 semantically similar ads ranked by similarity + performance_score. That's the corpus a generative engine would use to write a brief.

---

## Deep Research Phase (Pre-Implementation)

> Goal: Pressure-test this plan against the SOTA in ad intelligence + generative creative systems. Surface missing opportunities, anti-patterns, and architectural decisions we haven't considered. Run this BEFORE executing Phase 1, then converge findings into an Ultra Plan v2.

### Why this phase exists
The current plan is internally coherent but built from first principles. It has not been benchmarked against:
- What top ad intelligence tools (Foreplay, Atria, AdSpy, Motion App, Pencil, AdCreative.ai, Omneky) actually do under the hood
- Latest research on multimodal retrieval for creative content (2025-2026)
- Generative-creative specific RAG patterns (different from QA-style RAG)
- Evaluation methodologies for AI-generated ad creative
- Production lessons from teams shipping ad-generation systems

### Deep Research Prompt (paste into Google Deep Research / Gemini Deep Research)

```
I am building a competitive ad intelligence platform that ingests competitor ads from
ad libraries (via the GetHookd API), enriches them with multimodal AI classification
and embeddings (Gemini Flash + Gemini Embedding 768-dim), and stores everything in
Supabase with pgvector. The end goal is a generative creative engine that:
1. Finds top-performing competitor ads in a niche via vector + keyword hybrid search
2. Reconstructs their creative DNA (hook, angle, persona, format)
3. Generates new ad briefs and assets for the user's brand using these patterns

Current architecture:
- Ingestion: n8n workflows pulling from GetHookd brand spy API
- Storage: Supabase Postgres with three vector columns per ad (full_ad_embedding,
  hook_embedding, copy_embedding), all 768-dim Gemini Embedding
- Retrieval: Hybrid search via Reciprocal Rank Fusion (BM25 tsvector + vector
  cosine), weighted by performance_score, filtered by funnel_stage/ad_type
- Enrichment: Gemini Flash returns ad_type, funnel_stage, hook, core_angle,
  target_persona, pain_point, emotional_tone, visual_description, talent_description,
  color_palette, shot_style, on_screen_text, creative_brief, confidence
- Reranking: Planned cross-encoder rerank (Cohere Rerank v3 or BGE-Reranker-v2-M3)
  before LLM generation
- Generation: Phase 4 — feed top-N retrieved ads as few-shot context into a
  generation model to produce briefs / copy / asset prompts

Please research thoroughly and surface:

1. SOTA ARCHITECTURE BENCHMARKING
   - How do leading ad intelligence platforms (Foreplay, Atria, AdSpy, Motion App,
     Magic Brief, Creative OS) structure their data pipelines? What do they index
     beyond what I've described? Look for engineering blog posts, conference talks,
     LinkedIn posts from their founders/engineers, podcast interviews.
   - How do generative ad platforms (AdCreative.ai, Pencil, Omneky, Vidext) bridge
     from competitor data to generated creative? What is their specific RAG / fewshot
     / agentic structure?
   - What signals beyond performance_score do they extract? (engagement velocity,
     creative fatigue, audience overlap, funnel position inferred from landing page,
     coherence score, etc.)

2. MULTIMODAL EMBEDDING STATE-OF-THE-ART (2025-2026)
   - What is the current best practice for embedding short-form video ads
     (Reels/TikTok) at scale? Frame sampling vs. dedicated video embedding models
     (VideoCLIP, V-JEPA-2, Twelve Labs Marengo)?
   - For static image + text ad embeddings, is there benchmark evidence Gemini
     Embedding beats Cohere Embed v4 or Voyage Multimodal-3 on creative similarity
     tasks specifically (not generic retrieval)?
   - Is the three-vector approach (full + hook + copy) supported by any published
     research, or is a single dense + sparse vector pair sufficient?
   - When does fine-tuning a domain-specific embedding model on your own ad corpus
     beat using a general SOTA model? What is the corpus size threshold?

3. RAG PATTERNS FOR CREATIVE GENERATION (NOT QA)
   - Standard RAG is built for factual QA. Creative generation is different —
     you want diverse, high-quality exemplars, not the closest match. What
     retrieval strategies work better here? (MMR for diversity, performance-weighted
     sampling, contrastive retrieval, etc.)
   - How should the generation prompt be structured when the goal is to learn
     patterns, not regurgitate? Look for research on in-context creative generation,
     few-shot prompt engineering for creative tasks.
   - What evaluation methods exist for "is this generated brief actually good"?
     (LLM-as-judge with rubrics, human eval, A/B test in production, predictive
     performance scoring models)

4. CREATIVE DNA / BRAND-LEVEL REPRESENTATION
   - The plan currently averages all ad embeddings to get a brand DNA vector. Is
     there a better representation? (clustering centroids, learned brand encoders,
     attribute disentanglement)
   - How do platforms like Brandfetch, Klue, Crayon represent brand strategy
     computationally?

5. AD-SPECIFIC SIGNALS WE MIGHT BE MISSING
   - Audio fingerprinting for trending sounds (Reels/TikTok)
   - Talent face recognition for "this brand reuses the same UGC creator"
   - Hook timing analysis (when does the value prop hit)
   - Aspect ratio / platform-format fingerprinting
   - Color psychology signals
   - On-screen text density / pacing
   - Comment sentiment scraping
   - Refresh rate / creative fatigue detection
   - Funnel coherence (ad <-> landing page message match score)
   - Offer structure extraction (price points, bundles, guarantee terms)

6. PRODUCTION LESSONS / ANTI-PATTERNS
   - What goes wrong when teams ship ad intelligence systems? (cold-start, embedding
     drift, classification false positives, vendor model deprecation, performance
     score inflation, etc.)
   - What governance / IP / scraping legality issues need to be considered when
     storing competitor creative at scale?
   - Where does this category go from here — what are research labs and startups
     building in 2026 that would make a "stock" pgvector + Gemini approach feel
     dated in 12 months?

7. GAPS IN MY CURRENT PLAN
   - Read this plan critically. What architectural decisions are made that should
     be questioned? What is missing entirely? What should be cut as overkill?

Format your response as:
- Section per research question
- Cite sources (papers, blog posts, products) inline
- Include a final "Top 10 Highest-Leverage Additions to Plan" ranked list
- Include a "5 Things to Cut or De-Risk" list
```

### Parallel Research (Claude-side, while user runs Deep Research)
While the user runs the prompt above, I will investigate (in a follow-up session, with web access enabled):
- Foreplay / Atria / Motion App / Pencil / AdCreative.ai engineering posts and product teardowns
- Recent papers on multimodal retrieval for creative/ad domains (arXiv 2024-2026)
- Twelve Labs Marengo, V-JEPA-2, VideoCLIP benchmark performance vs. frame-sampling approaches
- LangChain / LlamaIndex creative-RAG patterns vs. QA-RAG patterns
- Cross-encoder reranker comparisons specifically on visual+text similarity (Cohere v3, BGE v2-M3, Voyage Rerank)
- Production case studies from Omneky, Vidext, others

### Convergence: Ultra Plan v2
After both research streams complete:
1. User pastes Deep Research findings into the next session
2. I synthesize Deep Research + my parallel findings + this plan
3. Output: Ultra Plan v2 with:
   - "Confirmed" decisions (research validated current plan)
   - "Revised" decisions (research surfaced better approach — diff explained)
   - "Net new" additions (signals/patterns we didn't consider)
   - "Cut" items (research showed marginal value or anti-pattern)
   - Phase 1 stays as-is unless research finds something show-stopping (the Brand Pull fix doesn't need optimization)
   - Phase 3 may absorb significant changes
   - Phase 4 architecture may be predetermined by research findings

---

## Files to Create/Modify (v2)

| Action | File/Resource |
|---|---|
| Import (update) | n8n workflow `tJQcvlYBRb6WAc3D` (Brand Pull) |
| Source JSON | `GetHookd — Brand Pull copy (1).json` (project root) |
| Modify | n8n workflow `kSzIsDnDrxa2JKgX` (Multimodal Enrich + Embed) — add 5 Lightbulbs prompt + native UI + hook timing fields |
| Create | n8n sub-workflow `Embed Ad` (modular embed router: Voyage / Marengo / Gemini) |
| Create | n8n daily delta workflow |
| Create | n8n weekly digest workflow |
| Create | n8n weekly K-means brand DNA workflow |
| Create | n8n weekly embedding drift monitor |
| SQL (run in Supabase) | Steps 2, 5a, 6 v2, 7 v2, 8, 9 v2, 10b, 10c, 10d, 11 above |
| Store workflow JSONs | `n8n/` directory in project root |
| New table | `brand_dna_clusters` (Step 9 v2) |
| New columns on `ads` | embedding_model, embedding_1024, embedding_512, lightbulb_*, native_ui_hijacking, hook_timing_seconds, funnel_coherence_score, rag_context, rag_context_tsv |

## Implementation Order (v2 sequencing)

1. **Phase 1 (now)**: Steps 1-5 (Brand Pull fix → schema → wire-up → enrichment v2 with 5 Lightbulbs)
2. **Phase 3 foundation**: Step 6 v2 (unified embedding schema), modify enrichment workflow to route by media_type
3. **Phase 3 retrieval**: Steps 7 v2 (hybrid + MMR + rerank), 8 (pattern view), 10b (funnel coherence)
4. **Phase 3 brand DNA**: Step 9 v2 (K-means)
5. **Phase 3 ops**: Steps 10d (drift monitor), 11 (weekly digest)
6. **Phase 4** (separate session): generation engine with atomic anchors + AAA method + LLM-as-judge
7. **Phase 5** (separate session): Meta Ads API closed-loop feedback

Defer until Phase 4+: talent face recognition, audio fingerprinting, modular video clip extraction, comment sentiment scraping, creative fatigue (10c) requires CPMr from Meta API.
