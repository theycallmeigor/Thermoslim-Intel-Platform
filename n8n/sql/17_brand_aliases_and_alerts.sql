-- Brand aliasing for TOF (top-of-funnel) accounts + Discord alert dedup.
-- See: project skinny pipeline v1 (2026-05-12).
--
-- Model:
--   - A "main" brand has parent_brand_id = NULL.
--   - A TOF alias account is a brand row with parent_brand_id = <main brand id>.
--   - v_ads_with_canonical_brand exposes both raw brand_id and rolled-up canonical_brand_id.
--
-- Idempotent: safe to re-run.

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS parent_brand_id bigint REFERENCES public.brands(id),
  ADD COLUMN IF NOT EXISTS account_type text
    CHECK (account_type IN ('main', 'tof', 'whitelist', 'unknown'))
    DEFAULT 'main',
  ADD COLUMN IF NOT EXISTS facebook_page_id text,
  ADD COLUMN IF NOT EXISTS facebook_page_url text;

CREATE INDEX IF NOT EXISTS idx_brands_parent_brand_id
  ON public.brands(parent_brand_id)
  WHERE parent_brand_id IS NOT NULL;

-- View: every ad joined to its canonical (parent) brand.
-- canonical_brand_id = parent_brand_id if alias, else brand_id itself.
CREATE OR REPLACE VIEW public.v_ads_with_canonical_brand AS
SELECT
  a.*,
  COALESCE(b.parent_brand_id, a.brand_id) AS canonical_brand_id,
  b.account_type                          AS source_account_type,
  b.facebook_page_id                      AS source_facebook_page_id,
  cb.name                                 AS canonical_brand_name
FROM public.ads a
JOIN public.brands b  ON b.id = a.brand_id
LEFT JOIN public.brands cb ON cb.id = COALESCE(b.parent_brand_id, a.brand_id);

-- Discord alert dedup: one row per ad we've already notified about.
CREATE TABLE IF NOT EXISTS public.ad_alerts_sent (
  ad_external_id            text PRIMARY KEY,
  ad_db_id                  bigint NOT NULL REFERENCES public.ads(id),
  source_brand_id           bigint NOT NULL REFERENCES public.brands(id),
  canonical_brand_id        bigint NOT NULL REFERENCES public.brands(id),
  alert_channel             text   NOT NULL DEFAULT 'discord',
  sent_at                   timestamptz NOT NULL DEFAULT now(),
  days_active_at_alert      integer,
  performance_score_at_alert integer,
  share_url                 text
);

CREATE INDEX IF NOT EXISTS idx_ad_alerts_sent_canonical
  ON public.ad_alerts_sent(canonical_brand_id, sent_at DESC);
