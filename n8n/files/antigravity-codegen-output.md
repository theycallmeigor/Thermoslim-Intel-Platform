# Antigravity Codegen Output

Here are the completed code blocks for the K-Means clustering and MMR diversification n8n nodes, as requested in the brief.

## Task 1: K-Means Brand DNA (Python)

**Node type:** Python Code node

```python
# Paste into n8n Python Code node
# Input: items (list of dicts with 'id' and 'embedding_1024')
# Output: list of cluster dicts for Supabase upsert

import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import normalize
import math

# Get inputs
items = _input.all()

# Get brand context from the 'Per Brand' node
try:
    brand_id = _$("Per Brand").item.json.get("brand_id")
except Exception:
    brand_id = None

# Filter to valid items with embeddings
valid_items = [item.json for item in items if item.json.get("embedding_1024")]
count = len(valid_items)

result = []

# Handle edge case: brand has < 2 ads with embeddings -> skip, return empty
if count >= 2:
    ids = [item["id"] for item in valid_items]
    embeddings = np.array([item["embedding_1024"] for item in valid_items])
    
    # Normalize embeddings to unit vectors so Euclidean distance used by KMeans
    # effectively performs cosine clustering.
    embeddings = normalize(embeddings, norm='l2', axis=1)
    
    # Calculate k: GREATEST(2, LEAST(5, FLOOR(count / 5)))
    k = max(2, min(5, math.floor(count / 5)))
    
    # Perform K-Means clustering
    kmeans = KMeans(n_clusters=k, random_state=42, n_init='auto')
    cluster_labels = kmeans.fit_predict(embeddings)
    
    # Ensure centroids are also normalized unit vectors
    centroids = normalize(kmeans.cluster_centers_, norm='l2', axis=1)
    
    # Find exemplar and member count for each cluster
    for cluster_idx in range(k):
        # Indices of items belonging to this cluster
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

## Task 2: MMR Diversification (JavaScript)

**Node type:** JavaScript Code node

```javascript
// MMR Diversification — n8n Code node
// Input: items with embedding_1024 (float[]) and score (float)
// Output: top-20 items diversified by Maximal Marginal Relevance

const LAMBDA = 0.7;
const K = 20;

// Extract raw JSON from n8n items
const items = $input.all().map(item => item.json);

// Handle edge case: fewer than 20 candidates -> return all
if (items.length <= K) {
  return items.map(item => ({ json: item }));
}

// Filter to items that actually have embeddings and scores to prevent errors
const candidates = items.filter(i => 
  i.embedding_1024 && Array.isArray(i.embedding_1024) && typeof i.score === 'number'
);

if (candidates.length === 0) {
  return [];
}

// Helper to calculate cosine similarity between two unit vectors (dot product)
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

// Iteratively pick the candidate with the highest MMR score
while (selectedItems.length < K && unselectedItems.length > 0) {
  let bestIdx = -1;
  let highestMMR = -Infinity;

  for (let i = 0; i < unselectedItems.length; i++) {
    const candidate = unselectedItems[i];
    const relevance = candidate.score; // Already normalized 0..1 per requirements

    let maxSimToSelected = 0;
    
    if (selectedItems.length > 0) {
      maxSimToSelected = -Infinity;
      // Calculate max_sim(c, selected)
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
    break; // Failsafe
  }
}

// Return in n8n's expected output format
return selectedItems.map(item => ({ json: item }));
```
