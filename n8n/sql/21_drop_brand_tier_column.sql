-- Drop the vestigial `tier` column from brands.
--
-- Was used by an earlier architecture to bucket brands into pull cadences
-- (full_pull / daily_delta / weekly_sweep / paused). The current architecture
-- handles cadence via `last_delta_check_at` (per-row 5-day check) and gating via
-- `status` (active/paused/archived). No workflow filters on `tier` — only SELECTed it
-- as a no-op pass-through.
--
-- All workflows that SELECTed tier (brand-pull, brand-pull-orchestrator, active-ads-refresh)
-- have been updated to drop it from their column lists before this migration runs.
-- The form workflow FsYIjP0QZZBBYZlm has been updated to no longer ask for it.
--
-- Idempotent: safe to re-run.

ALTER TABLE public.brands DROP COLUMN IF EXISTS tier;
