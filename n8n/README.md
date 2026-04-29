# Ad Intelligence — n8n + Supabase Operator Guide

System: GetHookd → n8n → Supabase (thermoslim-ad-intel `fliqklclucdhjemdjatr`)  
Plan: `n8n/files/glistening-coalescing-deer.md` (Ultra Plan v2)

---

## Workflow Inventory

| File | n8n Name | Trigger | Status | Notes |
|---|---|---|---|---|
| `brand-pull-orchestrator.json` | GetHookd — Brand Pull Orchestrator | Manual | Import & activate | Fans out to brand-pull per brand |
| `brand-pull.json` | GetHookd — Brand Pull | Called by Orchestrator | Import & activate | Extracts media fields — Phase 1 unblock |
| `daily-delta.json` | GetHookd — Daily Delta | Daily 09:00 UTC | Import, activate after first full pull | Stop-on-known-ID pagination |
| `weekly-digest.json` | GetHookd — Weekly Digest | Monday 08:00 UTC | Import, activate after enrichment | Writes to `weekly_digests` table |
| `embed-ad-router.json` | Embed Ad (Router Sub-Workflow) | Called by enrichment | Skeleton — needs Voyage + Marengo credentials | Routes image→Voyage, video→Marengo |
| `weekly-kmeans-brand-dna.json` | GetHookd — Weekly K-Means Brand DNA | Sunday 06:00 UTC | Skeleton — K-means not implemented | Needs Python runtime or Edge Function |
| `embedding-drift-monitor.json` | GetHookd — Embedding Drift Monitor | Monday 07:00 UTC | Skeleton — needs benchmark table seeded | Tracks Recall@10 over time |

---

## SQL Apply Order

Run files in `n8n/sql/` in numeric order via Supabase SQL editor. All files are idempotent.

| File | What it does | When to run |
|---|---|---|
| `01_brands_gethookd_id.sql` | Adds `gethookd_brand_id` to brands | ✅ Already applied |
| `02_ads_lightbulbs.sql` | 5-Lightbulbs + native_ui + hook_timing columns | ✅ Already applied |
| `03_pgvector_unified.sql` | `embedding_model`, `embedding_1024`, `embedding_512` columns | ✅ Already applied |
| `04_rag_context.sql` | `rag_context` + `rag_context_tsv` generated columns + GIN index | ✅ Already applied |
| `05_brand_dna_clusters.sql` | `brand_dna_clusters` table | ✅ Already applied |
| `06_funnel_coherence.sql` | `funnel_coherence_score` column on ads | ✅ Already applied |
| `07_hnsw_indexes.sql` | HNSW indexes on `embedding_1024` / `embedding_512` | **Defer** — run after ≥50 embeddings populated |
| `08_rag_candidates_fn.sql` | `rag_candidates()` hybrid search function | ✅ Already applied |
| `09_ad_patterns_view.sql` | `ad_patterns` view | ✅ Already applied |
| `10_weekly_digests_table.sql` | `weekly_digests` table | ✅ Already applied |

---

## Phase 1 → Phase 3 Sequencing

### Phase 1: Unblock the pipeline
1. Import `brand-pull-orchestrator.json` + `brand-pull.json` into n8n
2. Verify My Derma Dream has `gethookd_brand_id = 138083` (done), set Smooche's ID
3. Run Brand Pull manually → confirm `thumbnail_url` populates in `ads` table
4. Apply `n8n/patches/enrich-5-lightbulbs.md` to workflow `kSzIsDnDrxa2JKgX`
5. Run enrichment → confirm `lightbulb_*` fields and `analyzed_at` populate
6. Activate `daily-delta.json` for ongoing ingestion

**Phase 1 exit criteria:**
```sql
SELECT count(*) FROM ads WHERE thumbnail_url IS NOT NULL;  -- expect 437
SELECT count(*) FROM ads WHERE analyzed_at IS NOT NULL;    -- expect ≥50
```

### Phase 3: Intelligence layer (after Phase 1 exits)
1. Import + configure `embed-ad-router.json` (requires Voyage + Marengo API keys in n8n)
2. Update enrichment workflow to route through Embed Ad sub-workflow (see `patches/enrich-5-lightbulbs.md`)
3. Run enrichment on all ads → populate `embedding_1024` / `embedding_512`
4. Apply `07_hnsw_indexes.sql` (after ≥50 rows have embeddings)
5. Activate `weekly-digest.json`
6. Implement `weekly-kmeans-brand-dna.json` K-means node (Python runtime or Edge Function)
7. Seed `benchmark_query_ad_pairs` table, activate `embedding-drift-monitor.json`

**Phase 3 exit criteria:**
```sql
-- Hybrid search returns results
SELECT * FROM rag_candidates('pain point hook', '[...]'::vector(1024)) LIMIT 5;

-- Pattern view populated
SELECT * FROM ad_patterns ORDER BY avg_score DESC LIMIT 10;

-- Brand DNA clusters populated
SELECT brand_id, cluster_label, member_count FROM brand_dna_clusters;
```

---

## Credentials Required in n8n

| Credential Name | Type | Used By |
|---|---|---|
| `Supabase account` (id: `i11k5KDK4btEHdID`) | Supabase API | All workflows |
| `Header Auth account` (id: `rG0rVvLzm0TAUBBC`) | HTTP Header Auth | Brand Pull (GetHookd API key) |
| `Voyage API Key` | HTTP Header Auth (Bearer) | `embed-ad-router.json` |
| `Twelve Labs API Key` | HTTP Header Auth (x-api-key) | `embed-ad-router.json` |

---

## Out of Scope / Deferred

- Talent face recognition (Phase 4+)
- Audio fingerprinting (Phase 4+)
- Video modular clip extraction (Phase 4+)
- Comment sentiment scraping (Phase 4+)
- Creative fatigue / CPMr detection (requires Meta Ads API, Phase 5)
- MMR diversification + cross-encoder rerank (Phase 4 generation service, not SQL)
- Generative engine (Phase 4 — separate session)
- Meta Ads API closed-loop feedback (Phase 5)
