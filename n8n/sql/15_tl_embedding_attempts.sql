-- 15_tl_embedding_attempts.sql
-- Raw log of every Twelve Labs / Voyage embedding attempt.
-- We INSERT BEFORE we know if the call worked, so we never silently lose
-- a paid-for embedding to a downstream UPDATE failure. Idempotent.

CREATE TABLE IF NOT EXISTS tl_embedding_attempts (
  attempt_id        bigserial PRIMARY KEY,
  ad_id             text        NOT NULL,
  media_type        text        NOT NULL,
  media_url         text,
  model_id          text,
  status            text        NOT NULL DEFAULT 'pending',  -- pending | ready | failed | applied
  vector            vector(512),
  vector_1024       vector(1024),
  raw_response      jsonb,
  error_text        text,
  task_id           text,
  created_at        timestamptz NOT NULL DEFAULT NOW(),
  applied_at        timestamptz
);

CREATE INDEX IF NOT EXISTS idx_tl_attempts_ad_id   ON tl_embedding_attempts (ad_id);
CREATE INDEX IF NOT EXISTS idx_tl_attempts_status  ON tl_embedding_attempts (status);
CREATE INDEX IF NOT EXISTS idx_tl_attempts_created ON tl_embedding_attempts (created_at DESC);

-- Replay helper: for any ad_id whose ad_unified.embedding_512 is NULL but we
-- have a successful 'ready' attempt logged, copy the vector across. Safe to
-- run any time after the trigger has stamped attempts as 'ready'.
CREATE OR REPLACE FUNCTION fn_apply_pending_embeddings()
RETURNS TABLE (ad_id_applied text, dim int) AS $$
  WITH src AS (
    SELECT DISTINCT ON (a.ad_id) a.attempt_id, a.ad_id, a.vector, a.vector_1024
    FROM tl_embedding_attempts a
    WHERE a.status = 'ready'
    ORDER BY a.ad_id, a.created_at DESC
  ),
  upd AS (
    UPDATE ad_unified u
    SET embedding_512  = COALESCE(u.embedding_512,  src.vector),
        embedding_1024 = COALESCE(u.embedding_1024, src.vector_1024)
    FROM src
    WHERE u.id = src.ad_id
      AND (
        (u.embedding_512  IS NULL AND src.vector       IS NOT NULL) OR
        (u.embedding_1024 IS NULL AND src.vector_1024  IS NOT NULL)
      )
    RETURNING u.id, src.attempt_id, COALESCE(array_length(src.vector::real[],1), array_length(src.vector_1024::real[],1)) AS dim
  ),
  mark AS (
    UPDATE tl_embedding_attempts a
    SET status='applied', applied_at = NOW()
    FROM upd
    WHERE a.attempt_id = upd.attempt_id
    RETURNING a.ad_id, COALESCE(array_length(a.vector::real[],1), array_length(a.vector_1024::real[],1)) AS dim
  )
  SELECT ad_id, dim FROM mark;
$$ LANGUAGE sql;

-- Coverage view extended with attempt-log signal.
CREATE OR REPLACE VIEW v_embedding_coverage AS
SELECT
  u.media_type,
  COUNT(*)                                                                  AS total,
  COUNT(*) FILTER (WHERE u.embedding_512  IS NOT NULL)                      AS with_marengo_512,
  COUNT(*) FILTER (WHERE u.embedding_1024 IS NOT NULL)                      AS with_voyage_1024,
  COUNT(*) FILTER (WHERE u.media_type='video' AND u.embedding_512  IS NULL) AS video_pending,
  COUNT(*) FILTER (WHERE u.media_type='image' AND u.embedding_1024 IS NULL) AS image_pending,
  (SELECT COUNT(*) FROM tl_embedding_attempts WHERE status='ready')         AS attempts_ready_unapplied,
  (SELECT COUNT(*) FROM tl_embedding_attempts WHERE status='failed')        AS attempts_failed,
  (SELECT MAX(created_at) FROM tl_embedding_attempts)                       AS last_attempt_at
FROM ad_unified u
GROUP BY ROLLUP (u.media_type);
