-- Step 9 v2: Brand DNA via K-means cluster centroids + exemplar ads.
-- See n8n/files/glistening-coalescing-deer.md (Phase 3 Step 9 v2).
-- Replaces v1 "average all ad embeddings" approach (which collapses persona diversity).
-- Populated by n8n/workflows/weekly-kmeans-brand-dna.json.
-- Idempotent.

CREATE TABLE IF NOT EXISTS public.brand_dna_clusters (
  id                 bigserial PRIMARY KEY,
  brand_id           bigint REFERENCES public.brands(id),
  cluster_index      int,                          -- 0..k-1
  cluster_label      text,                         -- AI-labeled persona ("Educational/Authority", "Humor/UGC", etc.)
  centroid_embedding vector(1024),                 -- mathematical centroid of cluster members
  exemplar_ad_id     bigint REFERENCES public.ads(id),  -- closest actual ad to centroid
  member_count       int,
  avg_hook_rate      float,
  created_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brand_dna_clusters_brand_idx
  ON public.brand_dna_clusters (brand_id);
