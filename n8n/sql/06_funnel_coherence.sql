-- Step 10b: Funnel coherence score.
-- See n8n/files/glistening-coalescing-deer.md (Phase 3 Step 10b).
-- Computed as 1 - cosine_distance(ad.embedding, landing_page.embedding).
-- Stored 0..1; below 0.6 typically signals high CPA risk.
-- Populated by the enrichment workflow after landing-page embedding is available.
-- Idempotent.

ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS funnel_coherence_score float;
