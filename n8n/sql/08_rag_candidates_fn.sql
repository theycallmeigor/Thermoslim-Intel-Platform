-- Step 7 v2 Stage A: rag_candidates() — fast top-100 candidate filtering via
-- BM25 + vector cosine, fused with Reciprocal Rank Fusion, performance-weighted.
-- See n8n/files/glistening-coalescing-deer.md (Phase 3 Step 7 v2).
-- Stage B (MMR diversification) and Stage C (cross-encoder rerank) live in the
-- application layer (n8n Code node or Phase 4 generation service).

-- NOTE: ads table has no 'status' column — uses analyzed_at IS NOT NULL as enrichment signal.
-- NOTE: ads table has no 'hook_rate' column — uses performance_score until Meta Ads API (Phase 5).
CREATE OR REPLACE FUNCTION public.rag_candidates(
  query_text          text,
  query_embedding     vector(1024),
  filter_funnel_stage text    DEFAULT NULL,
  filter_ad_type      text    DEFAULT NULL,
  min_performance     integer DEFAULT 0
)
RETURNS TABLE(
  id                bigint,
  brand_name        text,
  rag_context       text,
  performance_score integer,
  score             float
)
LANGUAGE sql STABLE AS $$
  WITH vec AS (
    SELECT id,
           row_number() OVER (ORDER BY embedding_1024 <=> query_embedding) AS rnk
    FROM public.ads
    WHERE analyzed_at IS NOT NULL
      AND enrichment_error IS NULL
      AND embedding_1024 IS NOT NULL
      AND (filter_funnel_stage IS NULL OR funnel_stage = filter_funnel_stage)
      AND (filter_ad_type      IS NULL OR ad_type      = filter_ad_type)
      AND COALESCE(performance_score, 0) >= min_performance
    ORDER BY embedding_1024 <=> query_embedding
    LIMIT 100
  ),
  kw AS (
    SELECT id,
           row_number() OVER (
             ORDER BY ts_rank_cd(rag_context_tsv, plainto_tsquery('english', query_text)) DESC
           ) AS rnk
    FROM public.ads
    WHERE rag_context_tsv @@ plainto_tsquery('english', query_text)
    LIMIT 100
  ),
  fused AS (
    SELECT id, SUM(1.0 / (60 + rnk)) AS rrf
    FROM (SELECT id, rnk FROM vec UNION ALL SELECT id, rnk FROM kw) u
    GROUP BY id
  )
  SELECT a.id, a.brand_name, a.rag_context, a.performance_score,
         (f.rrf * (1 + COALESCE(a.performance_score, 0)::float / 100.0))::float AS score
  FROM fused f JOIN public.ads a ON a.id = f.id
  ORDER BY score DESC LIMIT 100;
$$;
