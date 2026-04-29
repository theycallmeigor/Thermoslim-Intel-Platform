# Gemini CLI Research Brief — Ad Intelligence Embedding Pipeline

## Purpose
Fill in the missing provider details for `n8n/workflows/embed-ad-router.json` and inform Phase 3 reranking setup. Output findings to `n8n/files/gemini-research-output.md`.

---

## Research Tasks

### 1. Voyage Multimodal 3

**Goal**: Confirm the exact API contract so the embed-ad-router HTTP node can be finalized.

Find and document:
- Base URL (is it `https://api.voyageai.com/v1/multimodal/embeddings`? Confirm.)
- Auth header format (Authorization: Bearer? x-api-key?)
- Request body schema — how to pass a single image URL + text string together
- Response shape — where is the embedding vector in the JSON (`data[0].embedding`?)
- Output dimensions — does voyage-multimodal-3 always return 1024-dim?
- Whether image must be base64 or URL is accepted directly
- Rate limits and pricing per 1k tokens / images (as of 2026)
- Any batch size limits per request

### 2. Twelve Labs Marengo 3.0

**Goal**: Understand the async embed flow so the placeholder in embed-ad-router.json can be completed.

Find and document:
- Endpoint for creating an embed task (is it `POST /v1.3/embed`? Confirm.)
- Auth header format
- Request body — `model_name` exact string for Marengo 3.0, does it accept `video_url` directly or require upload?
- Whether video must be uploaded to Twelve Labs storage first, or public URL is fine
- Poll endpoint — how to check task status and retrieve the embedding once ready
- Response shape — where is the 512-dim vector (`video_embedding.float`?)
- Typical latency for a 30-60 second video
- Pricing per video / per minute

### 3. Cohere Rerank v3

**Goal**: Confirm input/output contract for Phase 4 cross-encoder reranking node.

Find and document:
- Endpoint URL
- Auth header
- Request body — how to pass a query string + list of document strings
- Max documents per request
- Response shape — how scores are returned, range (0-1? log-probability?)
- Whether it supports multimodal (text + image) or text-only
- Pricing per request / per doc
- Model name string for rerank v3 (e.g. `rerank-v3.5`?)

### 4. pgvector HNSW tuning for 1024-dim cosine (2025-2026 best practices)

Find and document:
- Recommended `m` and `ef_construction` values for 1024-dim vectors at ~10k-100k rows
- `ef_search` setting for query time (set via `SET hnsw.ef_search = N`)
- Any Supabase-specific pgvector version limitations or index build time expectations

---

## Output Format

Save findings to `n8n/files/gemini-research-output.md` with this structure:

```markdown
# Gemini Research Output — Embedding Pipeline Provider Specs

## Voyage Multimodal 3
- Endpoint: ...
- Auth: ...
- Request shape: (code block)
- Response shape: (code block)
- Dimensions: ...
- Image URL accepted: yes/no
- Rate limits: ...
- Pricing: ...

## Twelve Labs Marengo 3.0
- Create embed endpoint: ...
- Auth: ...
- Request shape: (code block)
- Poll endpoint: ...
- Response shape: (code block)
- Video URL accepted: yes/no
- Typical latency: ...
- Pricing: ...

## Cohere Rerank v3
- Endpoint: ...
- Auth: ...
- Request shape: (code block)
- Max docs per request: ...
- Response shape: (code block)
- Multimodal support: yes/no
- Model name string: ...
- Pricing: ...

## pgvector HNSW (1024-dim cosine)
- Recommended m: ...
- Recommended ef_construction: ...
- Recommended ef_search: ...
- Supabase notes: ...
```
