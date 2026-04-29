# Antigravity Codegen Brief — K-Means + MMR Implementation

## Purpose
Replace two TODO placeholders in the ad intelligence pipeline with working code. No MCP access needed — output is standalone code that gets integrated back into the n8n workflows.

---

## Task 1: K-Means Brand DNA (Python)

**Replace the placeholder in** `n8n/workflows/weekly-kmeans-brand-dna.json` — the node named "K-Means Clustering (TODO)".

### Input (what the node receives)
Array of items, each with:
```json
{ "id": 12345, "embedding_1024": [0.123, -0.456, ...] }
```
The brand context (brand_id, brand_name) is available from `$('Per Brand').item.json`.

### Required output per cluster
```json
[
  {
    "brand_id": 2,
    "cluster_index": 0,
    "centroid_embedding": [0.1, 0.2, ...],
    "exemplar_ad_id": 12345,
    "member_count": 47,
    "cluster_label": null
  }
]
```
`cluster_label` is null here — a separate Gemini Flash call labels it after upsert.

### Logic requirements
- `k = GREATEST(2, LEAST(5, FLOOR(count / 5)))` — floor at 2, cap at 5
- Use cosine distance (not euclidean) — embeddings are unit-normalized
- For each cluster: find the exemplar (ad with highest cosine similarity to centroid)
- After clustering: upsert results into `public.brand_dna_clusters` via the existing Supabase credential

### Constraints
- Must run in **n8n Python Code node** (self-hosted n8n with `NODE_FUNCTION_ALLOW_EXTERNAL=scikit-learn,numpy`)
- OR as a standalone Python script callable from n8n Execute Command node
- Libraries available: `scikit-learn`, `numpy`
- Handle edge case: brand has < 2 ads with embeddings → skip, return empty

### Deliverable
A single Python code block ready to paste into n8n's Python Code node:

```python
# Paste into n8n Python Code node
# Input: items (list of dicts with 'id' and 'embedding_1024')
# Output: list of cluster dicts for Supabase upsert

import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import normalize

# ... your implementation here
```

---

## Task 2: MMR Diversification (JavaScript)

**New n8n Code node** to sit between `rag_candidates()` RPC output and the cross-encoder reranker (or directly before LLM context assembly in Phase 4).

### Input
Array of candidate items from `rag_candidates()`, each with:
```json
{
  "id": 12345,
  "brand_name": "My Derma Dream",
  "rag_context": "Hook: Pain point...\nAngle: Authority...",
  "performance_score": 82,
  "score": 0.0134,
  "embedding_1024": [0.1, 0.2, ...]
}
```
Note: `embedding_1024` needs to be fetched in a prior Supabase query and joined — the `rag_candidates()` function doesn't return it. Account for this (the Code node should accept items that have been enriched with their embeddings).

### Required output
Top-20 items selected by MMR, preserving all original fields.

### Logic
```
MMR score(c) = λ * relevance(c) - (1 - λ) * max_sim(c, already_selected)
```
- `λ = 0.7` default (expose as a configurable constant at top of code)
- `relevance(c)` = the `score` field from `rag_candidates()` (already normalized 0..1)
- `max_sim(c, selected)` = max cosine similarity between c's embedding and any already-selected item's embedding
- Iterate: pick the candidate with highest MMR score, add to selected, repeat until k=20

### Constraints
- Pure JavaScript (n8n Code node, no external libraries)
- Implement cosine similarity inline (dot product of unit vectors)
- Handle edge case: fewer than 20 candidates → return all

### Deliverable
A complete JavaScript Code node body:

```javascript
// MMR Diversification — n8n Code node
// Input: items with embedding_1024 (float[]) and score (float)
// Output: top-20 items diversified by Maximal Marginal Relevance

const LAMBDA = 0.7;
const K = 20;

// ... your implementation here

return selectedItems.map(item => ({ json: item }));
```

---

## Integration Notes

Once both are done, hand back:
1. The Python K-means block → replaces the `jsCode` in `weekly-kmeans-brand-dna.json` node "K-Means Clustering (TODO)"
2. The JS MMR block → new Code node to add to whatever workflow calls `rag_candidates()`

File back to: `n8n/files/antigravity-codegen-output.md` with both code blocks clearly labeled.
