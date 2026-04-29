-- Step 8: ad_patterns aggregate view for performance pattern queries.
-- See n8n/files/glistening-coalescing-deer.md (Phase 3 Step 8).
-- Example: SELECT * FROM ad_patterns WHERE funnel_stage = 'TOF' ORDER BY avg_score DESC LIMIT 20;

CREATE OR REPLACE VIEW public.ad_patterns AS
SELECT
  hook,
  core_angle,
  funnel_stage,
  ad_type,
  brand_name,
  COUNT(*)                                               AS ad_count,
  ROUND(AVG(performance_score)::numeric, 1)              AS avg_score,
  MAX(performance_score)                                 AS top_score,
  COUNT(*) FILTER (WHERE performance_score > 70)         AS high_performers
FROM public.ads
WHERE status = 'complete'
  AND hook IS NOT NULL
GROUP BY hook, core_angle, funnel_stage, ad_type, brand_name
ORDER BY avg_score DESC NULLS LAST;
