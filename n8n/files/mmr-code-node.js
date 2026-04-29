// MMR Diversification — n8n Code node
// Drop into any workflow after rag_candidates() returns results.
// Input: items with embedding_1024 (float[]) and score (float)
// Output: top-20 items diversified by Maximal Marginal Relevance
//
// Prerequisite: fetch embedding_1024 for each candidate in a prior Supabase query
// and join onto the rag_candidates() output before this node runs.

const LAMBDA = 0.7; // 0 = max diversity, 1 = max relevance. Tune empirically.
const K = 20;

const items = $input.all().map(item => item.json);

if (items.length <= K) {
  return items.map(item => ({ json: item }));
}

const candidates = items.filter(i =>
  i.embedding_1024 && Array.isArray(i.embedding_1024) && typeof i.score === 'number'
);

if (candidates.length === 0) return [];

function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) dot += vecA[i] * vecB[i];
  return dot;
}

const selected = [];
const unselected = [...candidates];

while (selected.length < K && unselected.length > 0) {
  let bestIdx = -1;
  let bestMMR = -Infinity;

  for (let i = 0; i < unselected.length; i++) {
    const c = unselected[i];
    const relevance = c.score;
    let maxSim = selected.length === 0 ? 0 : -Infinity;
    for (const s of selected) {
      const sim = cosineSimilarity(c.embedding_1024, s.embedding_1024);
      if (sim > maxSim) maxSim = sim;
    }
    const mmr = LAMBDA * relevance - (1 - LAMBDA) * maxSim;
    if (mmr > bestMMR) { bestMMR = mmr; bestIdx = i; }
  }

  if (bestIdx !== -1) {
    selected.push(unselected[bestIdx]);
    unselected.splice(bestIdx, 1);
  } else break;
}

return selected.map(item => ({ json: item }));
