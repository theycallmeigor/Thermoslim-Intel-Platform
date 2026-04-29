-- Step 6 v2: Unified multimodal embedding schema.
-- See n8n/files/glistening-coalescing-deer.md (Phase 3 Step 6 v2).
-- Replaces the v1 three-column approach (full_ad_embedding / hook_embedding / copy_embedding).
-- Idempotent — safe to re-run. HNSW indexes live in 07_hnsw_indexes.sql (run after data populates).

CREATE EXTENSION IF NOT EXISTS vector;

-- Optional cleanup of the v1 three-column schema. Uncomment ONLY if a previous
-- run of the v1 plan created these columns and you've confirmed no live readers
-- depend on them. v2 supersedes them with a single primary embedding (model-routed).
--
-- ALTER TABLE public.ads
--   DROP COLUMN IF EXISTS full_ad_embedding,
--   DROP COLUMN IF EXISTS hook_embedding,
--   DROP COLUMN IF EXISTS copy_embedding;

ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS embedding_model text,           -- 'voyage-multimodal-3' | 'marengo-3' | 'gemini-fallback'
  ADD COLUMN IF NOT EXISTS embedding_1024  vector(1024),   -- Voyage Multimodal 3 (static image+text)
  ADD COLUMN IF NOT EXISTS embedding_512   vector(512);    -- Twelve Labs Marengo 3.0 (video)
