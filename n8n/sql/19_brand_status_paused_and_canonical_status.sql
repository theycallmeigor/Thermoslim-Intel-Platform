-- Add 'paused' as a third allowed brand status (reversible deactivation),
-- expose brand status through the canonical view so alert workflows can filter on it,
-- and pause My Derma Dream (preserves 50 ads, stops daily ingestion + alerts).
--
-- Idempotent: safe to re-run. UPDATE is a no-op if MDD is already paused.

ALTER TABLE public.brands DROP CONSTRAINT IF EXISTS brands_status_check;
ALTER TABLE public.brands ADD CONSTRAINT brands_status_check
  CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'archived'::text]));

CREATE OR REPLACE VIEW public.v_ads_with_canonical_brand AS
SELECT
  a.*,
  COALESCE(b.parent_brand_id, a.brand_id)    AS canonical_brand_id,
  b.account_type                              AS source_account_type,
  b.facebook_page_id                          AS source_facebook_page_id,
  cb.name                                     AS canonical_brand_name,
  b.status                                    AS source_brand_status,
  cb.status                                   AS canonical_brand_status
FROM public.ads a
JOIN public.brands b  ON b.id = a.brand_id
LEFT JOIN public.brands cb ON cb.id = COALESCE(b.parent_brand_id, a.brand_id);

UPDATE public.brands
SET status = 'paused',
    updated_at = now()
WHERE name = 'My Derma Dream';
