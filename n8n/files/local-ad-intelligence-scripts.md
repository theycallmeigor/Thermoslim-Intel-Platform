# Local Ad Intelligence Scripts

Here are the specific scripts needed to execute the plan defined in `local-ad-intelligence-pipeline.md`.

## 1. HNSW Params Bump (Supabase SQL)

Run this directly in the Supabase SQL Editor to upgrade your vector index.

```sql
-- Drop the existing index if it exists
DROP INDEX IF EXISTS competitor_ads_embedding_idx;

-- Create the new production-grade index
CREATE INDEX competitor_ads_embedding_idx 
ON public.competitor_ads 
USING hnsw (embedding_1024 vector_cosine_ops) 
WITH (m = 24, ef_construction = 128);
```

## 2. Event-Driven K-Means Clustering (n8n Python Node)

Paste this into the Python Code node inside your new K-Means sub-workflow. 
*Note: This script has been updated to pull the `brand_id` dynamically from the "Execute Workflow Trigger" node rather than a static loop.*

```python
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import normalize
import math

# Get the embedding items passed into this node
items = _input.all()

# Get the brand_id dynamically from the sub-workflow trigger
try:
    # Change "Execute Workflow Trigger" to the exact name of your trigger node if different
    brand_id = _$("Execute Workflow Trigger").item.json.get("brand_id")
except Exception:
    brand_id = None

# Filter to valid items with embeddings
valid_items = [item.json for item in items if item.json.get("embedding_1024")]
count = len(valid_items)

result = []

# Handle edge case: brand has < 2 ads with embeddings -> skip, return empty
if count >= 2 and brand_id is not None:
    ids = [item["id"] for item in valid_items]
    embeddings = np.array([item["embedding_1024"] for item in valid_items])
    
    # Normalize embeddings to unit vectors (Cosine distance)
    embeddings = normalize(embeddings, norm='l2', axis=1)
    
    # Calculate k: GREATEST(2, LEAST(5, FLOOR(count / 5)))
    k = max(2, min(5, math.floor(count / 5)))
    
    # Perform K-Means clustering
    kmeans = KMeans(n_clusters=k, random_state=42, n_init='auto')
    cluster_labels = kmeans.fit_predict(embeddings)
    
    # Ensure centroids are normalized unit vectors
    centroids = normalize(kmeans.cluster_centers_, norm='l2', axis=1)
    
    for cluster_idx in range(k):
        member_indices = np.where(cluster_labels == cluster_idx)[0]
        member_count = len(member_indices)
        
        if member_count == 0:
            continue
            
        centroid = centroids[cluster_idx]
        cluster_embeddings = embeddings[member_indices]
        
        # Calculate cosine similarity (dot product of normalized vectors)
        similarities = np.dot(cluster_embeddings, centroid)
        
        # Find exemplar (ad with highest cosine similarity to centroid)
        exemplar_relative_idx = np.argmax(similarities)
        exemplar_idx = member_indices[exemplar_relative_idx]
        exemplar_id = ids[exemplar_idx]
        
        # Format the output required for Supabase upsert
        result.append({
            "json": {
                "brand_id": brand_id,
                "cluster_index": cluster_idx,
                "centroid_embedding": centroid.tolist(),
                "exemplar_ad_id": exemplar_id,
                "member_count": member_count,
                "cluster_label": None
            }
        })

return result
```

## 3. MMR Diversification (n8n JavaScript Node)

*(You've already saved this to `n8n/files/mmr-code-node.js`, but it is included here for completeness.)*

```javascript
const LAMBDA = 0.7; // 0 = max diversity, 1 = max relevance
const K = 20;

// Extract raw JSON from n8n items
const items = $input.all().map(item => item.json);

if (items.length <= K) {
  return items.map(item => ({ json: item }));
}

// Filter to items that have embeddings and scores
const candidates = items.filter(i => 
  i.embedding_1024 && Array.isArray(i.embedding_1024) && typeof i.score === 'number'
);

if (candidates.length === 0) {
  return [];
}

// Helper to calculate cosine similarity (dot product of unit vectors)
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

const selectedItems = [];
const unselectedItems = [...candidates];

while (selectedItems.length < K && unselectedItems.length > 0) {
  let bestIdx = -1;
  let highestMMR = -Infinity;

  for (let i = 0; i < unselectedItems.length; i++) {
    const candidate = unselectedItems[i];
    const relevance = candidate.score;

    let maxSimToSelected = 0;
    
    if (selectedItems.length > 0) {
      maxSimToSelected = -Infinity;
      for (const selected of selectedItems) {
        const sim = cosineSimilarity(candidate.embedding_1024, selected.embedding_1024);
        if (sim > maxSimToSelected) {
          maxSimToSelected = sim;
        }
      }
    }

    // MMR formula: λ * relevance(c) - (1 - λ) * max_sim(c, already_selected)
    const mmrScore = (LAMBDA * relevance) - ((1 - LAMBDA) * maxSimToSelected);

    if (mmrScore > highestMMR) {
      highestMMR = mmrScore;
      bestIdx = i;
    }
  }

  if (bestIdx !== -1) {
    selectedItems.push(unselectedItems[bestIdx]);
    unselectedItems.splice(bestIdx, 1);
  } else {
    break;
  }
}

return selectedItems.map(item => ({ json: item }));
```
