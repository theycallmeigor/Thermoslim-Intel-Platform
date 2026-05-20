-- 14_embedding_write_audit.sql
-- Adds write-tracking timestamps and a coverage view so we can prove
-- the backfill workflow is actually persisting embeddings.
-- Idempotent — safe to re-run.

ALTER TABLE ad_unified
  ADD COLUMN IF NOT EXISTS embedding_512_written_at  timestamptz,
  ADD COLUMN IF NOT EXISTS embedding_1024_written_at timestamptz;

-- Trigger: stamp the timestamp whenever the embedding column transitions
-- from NULL → value (or value → different value). Lets us tell "never written"
-- from "written but unchanged this run".
CREATE OR REPLACE FUNCTION trg_stamp_embedding_written()
RETURNS trigger AS $$
BEGIN
  IF NEW.embedding_512 IS DISTINCT FROM OLD.embedding_512 AND NEW.embedding_512 IS NOT NULL THEN
    NEW.embedding_512_written_at := NOW();
  END IF;
  IF NEW.embedding_1024 IS DISTINCT FROM OLD.embedding_1024 AND NEW.embedding_1024 IS NOT NULL THEN
    NEW.embedding_1024_written_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ad_unified_stamp_embedding_written ON ad_unified;
CREATE TRIGGER ad_unified_stamp_embedding_written
BEFORE UPDATE ON ad_unified
FOR EACH ROW
EXECUTE FUNCTION trg_stamp_embedding_written();

-- Coverage view — single query to see backfill progress.
CREATE OR REPLACE VIEW v_embedding_coverage AS
SELECT
  media_type,
  COUNT(*)                                                                 AS total,
  COUNT(*) FILTER (WHERE embedding_512  IS NOT NULL)                       AS with_marengo_512,
  COUNT(*) FILTER (WHERE embedding_1024 IS NOT NULL)                       AS with_voyage_1024,
  COUNT(*) FILTER (WHERE media_type = 'video' AND embedding_512  IS NULL)  AS video_pending,
  COUNT(*) FILTER (WHERE media_type = 'image' AND embedding_1024 IS NULL)  AS image_pending,
  MAX(embedding_512_written_at)                                            AS last_marengo_write,
  MAX(embedding_1024_written_at)                                           AS last_voyage_write
FROM ad_unified
GROUP BY ROLLUP (media_type);
