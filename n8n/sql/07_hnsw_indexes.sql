-- Step 6 v2 (deferred): HNSW indexes on the unified embedding columns.
-- See n8n/files/glistening-coalescing-deer.md (Phase 3 Step 6 v2).
-- Run this AFTER >=50 rows have populated embedding_1024 / embedding_512 so the
-- HNSW build is meaningful. Building on a near-empty table wastes index work.
-- Idempotent.

-- Tuning: m=24, ef_construction=128 recommended for 1024-dim cosine at 10k-100k rows.
-- Set ef_search at query time: SET hnsw.ef_search = 100; (increase to 200 if recall is low)
-- Consider halfvec type to reduce memory 50% with <1% accuracy loss at >100k rows.
CREATE INDEX IF NOT EXISTS ads_embed_1024_idx
  ON public.ads USING hnsw (embedding_1024 vector_cosine_ops)
  WITH (m = 24, ef_construction = 128);

CREATE INDEX IF NOT EXISTS ads_embed_512_idx
  ON public.ads USING hnsw (embedding_512 vector_cosine_ops)
  WITH (m = 24, ef_construction = 128);
