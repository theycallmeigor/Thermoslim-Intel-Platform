# Local Ad Intelligence Pipeline Implementation

## Goal
Implement local intelligence enhancements (HNSW Indexing, Event-Driven K-Means Clustering, and MMR Diversification) to establish a real-time, highly accurate competitive ad intelligence foundation.

## Tasks
- [ ] Task 1: Drop existing `competitor_ads_embedding_idx` and create new HNSW index with `m=24`, `ef_construction=128` via Supabase SQL Editor → Verify: Supabase confirms index creation without errors
- [ ] Task 2: Convert the `weekly-kmeans-brand-dna` workflow to an event-driven sub-workflow by changing the Cron trigger to an "Execute Workflow" Trigger that accepts `brand_id` as input → Verify: Workflow runs when triggered manually with a test `brand_id`
- [ ] Task 3: Paste the Python K-Means script into this sub-workflow → Verify: Node accurately processes the specified brand's ads and passes output to Upsert Clusters node
- [ ] Task 4: Add an "Execute Workflow" node to the very end of your main Ad Ingestion pipeline, configured to call the K-Means sub-workflow and pass the current `brand_id` → Verify: Ingesting new ads automatically triggers the K-Means update upon completion
- [ ] Task 5: Paste the JS MMR logic into a new n8n Code node downstream of the `rag_candidates()` query in your retrieval flow → Verify: Node executes, outputs exactly 20 (or fewer) items, and diversifies results

## Done When
- [ ] HNSW pgvector index is live in production Supabase
- [ ] K-Means clustering runs automatically and updates Supabase immediately after new ads are ingested for a brand
- [ ] MMR JS node is integrated into the retrieval workflow and successfully balances relevance with diversity
