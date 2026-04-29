# Multimodal Embedding Strategy for Ad Intelligence

To build a competitive intelligence platform that doesn't just archive ads but *understands* them enough to generate new variations, you need a robust multimodal embedding architecture. The goal is to map creative assets, ad copy, and performance data into a shared vector space where mathematical distance equals semantic similarity.

## 1. SOTA Embedding Models (2026 Landscape)

The landscape has shifted from stitching together separate text and image models (like OpenAI CLIP + text-embedding-ada) to **natively multimodal models** that process all data types into a single unified latent space.

### Top Contenders
1. **Google Gemini Embedding 2 (SOTA Unified)**: Currently the leader for natively multimodal tasks. It can take text, images, video segments, and audio in a single pass and output a unified 768-dim or 3072-dim vector. *Highly recommended for your pipeline.*
2. **Cohere Embed v4**: Excellent for production RAG systems. It handles text and images extremely well with massive context windows (128k), making it great for embedding entire landing pages alongside ad creatives.
3. **Open-Weight / Self-Hosted (Qwen3-Embedding, NV-Embed-v2, Jina v5)**: If you are looking to save API costs at scale, these open-weight models match proprietary performance. Jina-CLIP is specifically optimized for e-commerce and visual similarity.

**Strategic Recommendation:** Use **Gemini Embedding** via Vertex AI. Since your enrichment pipeline is already using Gemini Flash for classification, using Gemini Embeddings ensures the semantic understanding matches the classification logic.

---

## 2. Handling Different Ad Formats

A static image and a 60-second TikTok Reel cannot be embedded using the exact same strategy. Here is how to architect the embedding pipeline for each format:

### A. Static Image Ads
*   **Challenge**: Aligning the visual hook with the overlaid text and ad copy.
*   **Strategy (Dual-Payload)**:
    1.  Pass the `thumbnail_url` (the image itself) + the `body` (ad copy) + `title` to the multimodal embedding model simultaneously.
    2.  The resulting vector represents the *combined* meaning of the visual and the text.
*   **Use Case**: Finding competitors who are using similar visual aesthetics (e.g., "UGC selfie") but with different copy angles.

### B. Carousel Ads
*   **Challenge**: Carousels tell a sequential story. Embedding just the first image misses the payoff. Embedding all images into one vector muddies the data.
*   **Strategy (Sequence & Aggregate)**:
    1.  Embed each card in the carousel individually (Image + Card Text).
    2.  Create a "Parent Ad" embedding by either taking the mean (average) of the card embeddings OR using a sequential model to understand the narrative arc.
*   **Use Case**: Reconstructing competitor product feature highlights. E.g., Card 1: Pain point, Card 2: Solution, Card 3: Social Proof.

### C. Standard Video Ads (e.g., Facebook In-Feed)
*   **Challenge**: Videos contain visual scenes, spoken audio, and on-screen text.
*   **Strategy (Frame Sampling + Transcript)**:
    1.  Extract the audio transcript (via Whisper or Gemini Flash).
    2.  Sample 3-5 keyframes from the video (e.g., First 3 seconds [the hook], middle [the pitch], end [the CTA]).
    3.  Feed the Transcript + Keyframes + Ad Copy into the multimodal model.
*   **Use Case**: A/B testing analysis. "Find all videos that use a 'Doctor Reacts' visual hook but have a 'Discount' CTA."

### D. Reels / TikTok Ads (Short-Form Vertical)
*   **Challenge**: Extremely fast-paced, highly reliant on trending audio, text-to-speech, and rapid visual cuts. The "Hook" is entirely in the first 1-2 seconds.
*   **Strategy (Temporal Weighting)**:
    1.  Isolate the first 3 seconds of the video. Embed this *separately* as the `hook_embedding`.
    2.  Embed the rest of the video as the `body_embedding`.
    3.  Extract the audio track to identify if it uses a trending sound (audio fingerprinting).
*   **Use Case**: Hook generation. By clustering only the `hook_embeddings` of top-performing Reels, the generative AI can suggest new 3-second hooks for your products based on what is currently stopping the scroll.

---

## 3. Advancing the Platform: Generative & Operational Strategy

Once your database is populated with these embeddings, you move from "Spying" to "Generating."

### A. Generating A/B Test Ideas
*   **How it works**: Query the vector database for a specific top-performing ad. The system finds the 10 nearest neighbors (similar ads). The AI analyzes the *differences* between these similar ads (e.g., "They all use the same visual, but ad X changed the headline to focus on price and performed better").
*   **Output**: The system generates a `creative_brief` suggesting: "Test your existing UGC video with a price-focused text overlay, based on competitor Y's success."

### B. Generating New Ad Assets
*   **How it works**: You input your product data into the system. The system searches the embedding space for the highest-performing competitor funnels in your niche.
*   **Output**: The system feeds the retrieved competitor ad structures (the "winning formulas") into a generative model (like Gemini 3.1 Pro + Imagen 3 or Runway for video) as a few-shot prompt. It outputs a brand-new, unique ad tailored to your brand, using the competitor's proven psychological framework.

### C. Landing Page / Funnel Cloning
*   **How it works**: When the Funnel Crawler runs, it embeds the landing page structure (Headline, Hero Image, Benefit layout, Offer presentation).
*   **Output**: By matching ad embeddings to landing page embeddings, the system understands *message match*. If you want to launch a new product, the system can generate the ad copy *and* the matching landing page wireframe simultaneously, ensuring high conversion continuity.

## Summary Architecture

Your Supabase `ads` table should eventually have three vector columns to support this:
1.  `full_ad_embedding` (vector 768) — The general semantic meaning of the ad.
2.  `hook_embedding` (vector 768) — specifically the visual/audio of the first 3 seconds (crucial for Reels).
3.  `copy_embedding` (vector 768) — Just the text, allowing you to separate visual trends from copywriting trends.
