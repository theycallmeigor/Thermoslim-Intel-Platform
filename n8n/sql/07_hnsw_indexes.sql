-- Step 6 v2 (deferred): HNSW indexes on the unified embedding columns.
-- See n8n/files/glistening-coalescing-deer.md (Phase 3 Step 6 v2).
-- Run this AFTER >=50 rows have populated embedding_1024 / embedding_512 so the
-- HNSW build is meaningful. Building on a near-empty table wastes index work.
-- Idempotent.

CREATE INDEX IF NOT EXISTS ads_embed_1024_idx
  ON public.ads USING hnsw (embedding_1024 vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS ads_embed_512_idx
  ON public.ads USING hnsw (embedding_512 vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
