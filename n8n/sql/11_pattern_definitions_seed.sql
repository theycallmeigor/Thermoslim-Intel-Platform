-- 11_pattern_definitions_seed.sql
-- Pattern detection rule registry. Idempotent — safe to re-run.
-- Each row encodes ONE detectable pattern: lexical regex + structural filters + anchor ads for embedding centroid.

CREATE TABLE IF NOT EXISTS public.pattern_definitions (
  pattern_name text PRIMARY KEY,
  pattern_type text NOT NULL CHECK (pattern_type IN ('winner', 'loser', 'neutral')),
  description text,
  lexical_any text[],
  lexical_all text[],
  requires_funnel_stage text,
  requires_ad_type text,
  requires_display_format text,
  min_days_active int,
  min_performance_score int,
  anchor_ad_ids bigint[],
  lexical_weight numeric DEFAULT 0.7,
  embedding_weight numeric DEFAULT 0.3,
  auto_promote_threshold numeric DEFAULT 0.85,
  review_threshold numeric DEFAULT 0.60,
  active boolean DEFAULT true,
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ad_pattern_label_suggestions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ad_id bigint NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  pattern_name text NOT NULL REFERENCES public.pattern_definitions(pattern_name) ON DELETE CASCADE,
  confidence numeric NOT NULL,
  lexical_score numeric,
  embedding_similarity numeric,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','auto_promote','promoted','rejected','review')),
  detector_version text DEFAULT 'v1',
  detected_at timestamptz DEFAULT NOW(),
  promoted_at timestamptz,
  UNIQUE (ad_id, pattern_name, detector_version)
);

CREATE INDEX IF NOT EXISTS aps_ad_id_idx ON public.ad_pattern_label_suggestions(ad_id);
CREATE INDEX IF NOT EXISTS aps_pattern_idx ON public.ad_pattern_label_suggestions(pattern_name);
CREATE INDEX IF NOT EXISTS aps_status_idx ON public.ad_pattern_label_suggestions(status);

CREATE TABLE IF NOT EXISTS public.ad_pattern_labels (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ad_id bigint NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  pattern_name text NOT NULL,
  pattern_type text NOT NULL CHECK (pattern_type IN ('winner', 'loser', 'neutral')),
  signal_strength text CHECK (signal_strength IN ('strong', 'moderate', 'weak')),
  notes text,
  labeled_at timestamptz DEFAULT NOW(),
  UNIQUE (ad_id, pattern_name)
);

CREATE INDEX IF NOT EXISTS ad_pattern_labels_ad_id_idx ON public.ad_pattern_labels(ad_id);
CREATE INDEX IF NOT EXISTS ad_pattern_labels_pattern_name_idx ON public.ad_pattern_labels(pattern_name);
CREATE INDEX IF NOT EXISTS ad_pattern_labels_pattern_type_idx ON public.ad_pattern_labels(pattern_type);

-- ============================================================================
-- Seed: 12 patterns derived from 3-product / 507-ad analysis (2026-04-29)
-- ============================================================================
INSERT INTO pattern_definitions (
  pattern_name, pattern_type, description, lexical_any, lexical_all,
  requires_funnel_stage, requires_ad_type, requires_display_format,
  min_days_active, min_performance_score, anchor_ad_ids,
  lexical_weight, embedding_weight, auto_promote_threshold, review_threshold
) VALUES

-- WINNERS ----------------------------------------------------------------
('ugc_social_proof_hook', 'winner',
 'First-person testimonial or witness reaction in hook',
 ARRAY[
   'my (husband|friends?|wife|mom|sister|partner|coworker|boss) (gasped|said|told|asked|noticed)',
   '(i.ve been|i have been|i.m) getting [a-z ]*compliments',
   'getting (sooo|so) many compliments',
   'i thought i had',
   'i never thought',
   'everyone (keeps|is) (asking|saying)',
   'people (keep|won.t stop) (asking|telling)',
   'they say i (have|look)',
   'after using.*[a-z]+ (i|my)',
   'i can.t believe (i|my|the)'
 ],
 NULL, NULL, NULL, NULL, NULL, NULL,
 ARRAY[78215929, 78215910, 64658898, 93444039, 93444007, 31983]::bigint[],
 0.7, 0.3, 0.85, 0.60),

('without_invasive_procedure', 'winner',
 'Pain avoidance framing — names the feared alternative',
 ARRAY[
   'without (the )?(injection|injections|surgery|surgeries|needle|needles|botox|filler|fillers|invasive|knife)',
   'no (more |needs? for |surgery|injections?|needles?|guessing|mismatches?|shade.matching)',
   'no.surgery',
   'non.invasive',
   'skip the (injection|surgery|needles)',
   'avoid (injections?|surgery|needles)'
 ],
 NULL, NULL, NULL, NULL, NULL, NULL,
 ARRAY[78215929, 78932354, 31983, 93444039]::bigint[],
 0.75, 0.25, 0.85, 0.60),

('specificity_credibility_stack', 'winner',
 'Time quantifier + clinical/natural credential + concrete result',
 NULL,
 ARRAY[
   '\b(\d+)\s?(min|minute|minutes|sec|second|seconds|day|days|week|weeks)\b',
   '(dermatologist|clinically|harvard|natural|vegan|cruelty.free|fda|patent|clinical)'
 ],
 NULL, NULL, NULL, NULL, NULL,
 ARRAY[78215929, 78932354]::bigint[],
 0.8, 0.2, 0.85, 0.55),

('viral_trust_signal', 'winner',
 'Uses "viral" as social proof shorthand',
 ARRAY['\bviral\b', 'went viral', 'tiktok.{0,20}famous'],
 NULL, NULL, NULL, NULL, NULL, NULL,
 ARRAY[66534800, 66534792]::bigint[],
 0.85, 0.15, 0.80, 0.60),

('product_demo_mof_winner', 'winner',
 'Product demo at middle-of-funnel — durable for tech-complex products',
 NULL, NULL, 'MOF', 'PRODUCT_DEMO', NULL, 10, 81,
 ARRAY[78932354, 93444063]::bigint[],
 0.5, 0.5, 0.90, 0.70),

('video_bof_format_winner', 'winner',
 'Video + BOF combination — only sustained format past day 10',
 NULL, NULL, 'BOF', NULL, 'video', 10, 81,
 ARRAY[78215929, 64658898]::bigint[],
 0.5, 0.5, 0.95, 0.75),

('relief_empowerment_emotional_tone', 'winner',
 'Emotional tone words that map to high-converting beauty BOF',
 ARRAY[
   '(relief|empowerment|empowered|empowering|finally|hope|hopeful|reassuring)',
   '(after (decades|years) of)',
   'not (anymore|this time)'
 ],
 NULL, NULL, NULL, NULL, NULL, NULL,
 ARRAY[78932354]::bigint[],
 0.7, 0.3, 0.85, 0.60),

('long_runner_anchor', 'winner',
 'Days active >= 100 — confirmed durability',
 NULL, NULL, NULL, NULL, NULL, 100, NULL,
 ARRAY[64658898]::bigint[],
 0.0, 0.0, 0.99, 0.99),

('offer_as_reward_not_headline', 'winner',
 'Discount appears in body but NOT as primary hook framing',
 NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 ARRAY[64658960, 66534800]::bigint[],
 0.4, 0.6, 0.85, 0.65),

-- LOSERS ----------------------------------------------------------------
('anti_sale_headline_as_hook', 'loser',
 'Sale/discount terminology as primary hook — algorithm-killer',
 ARRAY[
   '^(buy 1[, ]+get 1|biggest sale|spring sale|holiday sale|black friday|our biggest)',
   '^(\d+%\s?off|up to \d+%)',
   '^(sale|deal|discount|promo).{0,20}(live|today|now|ends)',
   '^(almost gone|last chance|final hours)'
 ],
 NULL, NULL, NULL, NULL, NULL, NULL,
 ARRAY[95020197, 95020202]::bigint[],
 0.85, 0.15, 0.85, 0.60),

('anti_manufactured_scarcity', 'loser',
 'Fake/inflated urgency numbers — damages trust. CALIBRATION NOTE: backfill showed +11.7 score lift, hypothesis may be wrong; review before trusting.',
 ARRAY[
   '\d{2,4}\s+(orders?|sold|bought|customers?)\s+(in (the )?last|today|right now)',
   'stock dropping (faster|fast)',
   '\d+%\s+(of inventory|of stock|sold)\s+in (the )?last',
   'checkout chaos',
   'live update.{0,30}(stock|inventory|orders)'
 ],
 NULL, NULL, NULL, NULL, NULL, NULL,
 ARRAY[95021618]::bigint[],
 0.9, 0.1, 0.85, 0.55),

('anti_gifting_frame', 'loser',
 'Pushes self into giver role without setting up self-benefit pain',
 ARRAY[
   'mom deserves (more|better)',
   'treat (mom|dad|her|him)',
   '(gift|present) (for|to) (mom|dad|her|him)',
   'perfect (gift|present)',
   'one for you[, ]+one for'
 ],
 NULL, NULL, NULL, NULL, NULL, NULL,
 ARRAY[95020193, 95020197]::bigint[],
 0.8, 0.2, 0.85, 0.60)

ON CONFLICT (pattern_name) DO UPDATE SET
  pattern_type = EXCLUDED.pattern_type,
  description = EXCLUDED.description,
  lexical_any = EXCLUDED.lexical_any,
  lexical_all = EXCLUDED.lexical_all,
  requires_funnel_stage = EXCLUDED.requires_funnel_stage,
  requires_ad_type = EXCLUDED.requires_ad_type,
  requires_display_format = EXCLUDED.requires_display_format,
  min_days_active = EXCLUDED.min_days_active,
  min_performance_score = EXCLUDED.min_performance_score,
  anchor_ad_ids = EXCLUDED.anchor_ad_ids,
  lexical_weight = EXCLUDED.lexical_weight,
  embedding_weight = EXCLUDED.embedding_weight,
  auto_promote_threshold = EXCLUDED.auto_promote_threshold,
  review_threshold = EXCLUDED.review_threshold,
  updated_at = NOW();
