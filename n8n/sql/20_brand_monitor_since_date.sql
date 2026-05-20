-- Per-brand cutoff date: "ignore ads that launched before this date".
-- NULL means no cutoff. Set per brand at onboarding time.
--
-- Replaces the hardcoded `start_date >= '2026-05-01'` filter in the alerts workflow.
-- New brands you onboard tomorrow get their own date; existing brands keep May 1.
--
-- Idempotent: safe to re-run.

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS monitor_since_date date;

UPDATE public.brands
SET monitor_since_date = '2026-05-01'
WHERE monitor_since_date IS NULL AND name IN ('Smooche', 'My Derma Dream');

-- Canonical view now exposes canonical_monitor_since_date for downstream consumers.
CREATE OR REPLACE VIEW public.v_ads_with_canonical_brand AS
SELECT
  a.*,
  COALESCE(b.parent_brand_id, a.brand_id)    AS canonical_brand_id,
  b.account_type                              AS source_account_type,
  b.facebook_page_id                          AS source_facebook_page_id,
  cb.name                                     AS canonical_brand_name,
  b.status                                    AS source_brand_status,
  cb.status                                   AS canonical_brand_status,
  cb.monitor_since_date                       AS canonical_monitor_since_date
FROM public.ads a
JOIN public.brands b  ON b.id = a.brand_id
LEFT JOIN public.brands cb ON cb.id = COALESCE(b.parent_brand_id, a.brand_id);

-- v_winner_candidates: ads eligible for the alert pipeline (status=active + past cutoff).
-- Workflows and future slash commands should query this, not v_ads_with_canonical_brand directly.
CREATE OR REPLACE VIEW public.v_winner_candidates AS
SELECT *
FROM public.v_ads_with_canonical_brand
WHERE canonical_brand_status = 'active'
  AND start_date >= COALESCE(canonical_monitor_since_date, '1970-01-01'::date);
