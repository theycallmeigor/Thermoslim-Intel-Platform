-- 16_ad_clip_embeddings.sql
-- Idempotent. Stores Twelve Labs Marengo 3.0 clip-level (6s window) embeddings.
-- One row per clip per ad: a 25s video produces ~5 rows, a 60s video ~10.
-- Unique on (ad_id, clip_index, embedding_scope) so re-runs upsert cleanly.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS ad_clip_embeddings (
  clip_id            BIGSERIAL PRIMARY KEY,
  ad_id              BIGINT NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  clip_index         INT NOT NULL,
  embedding_scope    TEXT NOT NULL DEFAULT 'clip',
  start_offset_sec   NUMERIC NOT NULL,
  end_offset_sec     NUMERIC NOT NULL,
  embedding          vector(512) NOT NULL,
  model_id           TEXT NOT NULL DEFAULT 'marengo3.0',
  task_id            TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ad_clip_unique UNIQUE (ad_id, clip_index, embedding_scope)
);

CREATE INDEX IF NOT EXISTS idx_ad_clip_embeddings_ad_id
  ON ad_clip_embeddings (ad_id);

CREATE INDEX IF NOT EXISTS idx_ad_clip_embeddings_hook
  ON ad_clip_embeddings (ad_id)
  WHERE clip_index = 0;

-- HNSW vector index deferred until row count ≥ 1000 (see n8n/sql/07_hnsw_indexes.sql pattern).
-- When ready:
--   CREATE INDEX ON ad_clip_embeddings USING hnsw (embedding vector_cosine_ops);
