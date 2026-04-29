-- Step 11: weekly_digests storage table.
-- See n8n/files/glistening-coalescing-deer.md (Phase 3 Step 11).
-- Populated by n8n/workflows/weekly-digest.json.
-- Idempotent.

CREATE TABLE IF NOT EXISTS public.weekly_digests (
  id            bigserial PRIMARY KEY,
  brand_name    text,
  week_start    date,
  new_ad_count  int,
  new_hooks     text[],
  new_angles    text[],
  summary_text  text,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS weekly_digests_brand_week_idx
  ON public.weekly_digests (brand_name, week_start);
