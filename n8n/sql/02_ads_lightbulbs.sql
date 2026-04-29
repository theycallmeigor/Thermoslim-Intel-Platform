-- Step 5a: 5-Lightbulbs framework columns + native UI hijacking + hook timing.
-- See n8n/files/glistening-coalescing-deer.md (Phase 1 Step 5a).
-- Idempotent.

ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS lightbulb_status_quo   text,
  ADD COLUMN IF NOT EXISTS lightbulb_alternatives text,
  ADD COLUMN IF NOT EXISTS lightbulb_mechanism    text,
  ADD COLUMN IF NOT EXISTS lightbulb_offer        text,
  ADD COLUMN IF NOT EXISTS lightbulb_new_life     text,
  ADD COLUMN IF NOT EXISTS native_ui_hijacking    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hook_timing_seconds    float;
