-- Step 10A + 10B: rag_context generated column + tsvector full-text search.
-- See n8n/files/glistening-coalescing-deer.md (Phase 3 Step 10).
-- The rag_context payload is what gets stuffed into the LLM context window.
-- Idempotent.

ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS rag_context text
  GENERATED ALWAYS AS (
    COALESCE('Hook: '    || hook,               '') || E'\n' ||
    COALESCE('Angle: '   || core_angle,         '') || E'\n' ||
    COALESCE('Stage: '   || funnel_stage,       '') || E'\n' ||
    COALESCE('Persona: ' || target_persona,     '') || E'\n' ||
    COALESCE('Visual: '  || visual_description, '') || E'\n' ||
    COALESCE('Brief: '   || creative_brief,     '')
  ) STORED;

ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS rag_context_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', COALESCE(rag_context, ''))) STORED;

CREATE INDEX IF NOT EXISTS ads_rag_tsv_idx
  ON public.ads USING gin(rag_context_tsv);
