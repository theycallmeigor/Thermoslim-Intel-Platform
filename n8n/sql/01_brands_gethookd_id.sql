-- Step 2: Add gethookd_brand_id column to brands and seed My Derma Dream.
-- See n8n/files/glistening-coalescing-deer.md (Phase 1 Step 2).
-- Idempotent — safe to re-run.

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS gethookd_brand_id bigint;

UPDATE public.brands
   SET gethookd_brand_id = 138083
 WHERE name = 'My Derma Dream'
   AND (gethookd_brand_id IS NULL OR gethookd_brand_id <> 138083);
