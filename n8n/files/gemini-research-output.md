# Gemini Research Output — Embedding Pipeline Provider Specs

## Voyage Multimodal 3
- **Endpoint**: `POST https://api.voyageai.com/v1/multimodalembeddings`
- **Auth**: `Authorization: Bearer <YOUR_API_KEY>`
- **Request shape**:
```json
{
  "model": "voyage-multimodal-3",
  "input": [
    [
      "Text description of the ad creative",
      { "image": "https://example.com/ad-image.jpg" }
    ]
  ],
  "input_type": "document",
  "output_dimension": 1024
}
```
- **Response shape**:
```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [0.012, -0.034, ...],
      "index": 0
    }
  ],
  "usage": {
    "text_tokens": 15,
    "image_pixels": 500000,
    "total_tokens": 907
  }
}
```
- **Dimensions**: 1024 (default); supports 256, 512, 2048 via Matryoshka.
- **Image URL accepted**: Yes (also supports base64).
- **Rate limits**: 200M tokens & 150B pixels free tier (standard tier limits vary by account).
- **Pricing**: $0.12 per 1M text tokens; $0.60 per 1B pixels.

## Twelve Labs Marengo 3.0
- **Create embed endpoint**: `POST https://api.twelvelabs.io/v1.3/embed/tasks`
- **Auth**: `x-api-key: <YOUR_API_KEY>`
- **Request shape**:
```json
{
  "model_name": "marengo-3.0",
  "video_url": "https://example.com/ad-video.mp4"
}
```
- **Poll endpoint**: `GET https://api.twelvelabs.io/v1.3/embed/tasks/{task_id}`
- **Response shape**:
```json
{
  "id": "task_id",
  "status": "ready",
  "video_embeddings": [0.123, -0.456, ...] 
}
```
- **Video URL accepted**: Yes.
- **Typical latency**: Asynchronous flow; task takes ~30-60s for standard short ads. Poll every 5s.
- **Pricing**: $0.042 per minute for indexing/embedding.

## Cohere Rerank v3.5
- **Endpoint**: `POST https://api.cohere.com/v2/rerank`
- **Auth**: `Authorization: Bearer <YOUR_API_KEY>`
- **Request shape**:
```json
{
  "model": "rerank-v3.5",
  "query": "High-converting supplement ads for joint pain",
  "documents": [
    "Caption: Best joint support formula...",
    "Caption: Say goodbye to knee pain..."
  ],
  "top_n": 10
}
```
- **Max docs per request**: 10,000.
- **Response shape**:
```json
{
  "id": "req_123",
  "results": [
    { "index": 0, "relevance_score": 0.998 },
    { "index": 1, "relevance_score": 0.842 }
  ]
}
```
- **Multimodal support**: No native image support; requires textual metadata/captions for reranking visual assets.
- **Model name string**: `rerank-v3.5`
- **Pricing**: 1 "Search Unit" (1 query + up to 100 documents).

## pgvector HNSW (1024-dim cosine)
- **Recommended m**: 24 - 32 (higher connections improve recall for 1024-dim).
- **Recommended ef_construction**: 128 - 200 (ensure deep enough search during build).
- **Recommended ef_search**: 100 (standard for query time, increase to 200 if recall is low).
- **Supabase notes**: 
    - **Memory**: HNSW indexes must fit in RAM (`shared_buffers`) to avoid disk thrashing.
    - **Halfvec**: Use `halfvec` (FP16) type to reduce memory footprint by 50% with <1% accuracy loss.
    - **Index Command**: `CREATE INDEX ON ads USING hnsw (embedding vector_cosine_ops) WITH (m = 24, ef_construction = 128);`
