-- 13_pattern_categories.sql
-- Adds 7-category taxonomy + auto-anchor refresh + category centroid detection.
-- Idempotent — safe to re-run.

-- 1. Schema additions
ALTER TABLE pattern_definitions ADD COLUMN IF NOT EXISTS pattern_category text;
ALTER TABLE ad_pattern_labels ADD COLUMN IF NOT EXISTS pattern_category text;

-- 2. Assign categories
UPDATE pattern_definitions SET pattern_category = CASE pattern_name
  WHEN 'ugc_social_proof_hook'              THEN 'social_proof'
  WHEN 'viral_trust_signal'                 THEN 'social_proof'
  WHEN 'without_invasive_procedure'         THEN 'pain_avoidance'
  WHEN 'specificity_credibility_stack'      THEN 'credibility_stack'
  WHEN 'relief_empowerment_emotional_tone'  THEN 'credibility_stack'
  WHEN 'product_demo_mof_winner'            THEN 'format_fit'
  WHEN 'video_bof_format_winner'            THEN 'format_fit'
  WHEN 'offer_as_reward_not_headline'       THEN 'format_fit'
  WHEN 'long_runner_anchor'                 THEN 'durability'
  WHEN 'anti_sale_headline_as_hook'         THEN 'lazy_urgency'
  WHEN 'anti_manufactured_scarcity'         THEN 'lazy_urgency'
  WHEN 'anti_gifting_frame'                 THEN 'misframed_value'
  ELSE pattern_category
END
WHERE pattern_category IS NULL OR pattern_category != CASE pattern_name
  WHEN 'ugc_social_proof_hook'              THEN 'social_proof'
  WHEN 'viral_trust_signal'                 THEN 'social_proof'
  WHEN 'without_invasive_procedure'         THEN 'pain_avoidance'
  WHEN 'specificity_credibility_stack'      THEN 'credibility_stack'
  WHEN 'relief_empowerment_emotional_tone'  THEN 'credibility_stack'
  WHEN 'product_demo_mof_winner'            THEN 'format_fit'
  WHEN 'video_bof_format_winner'            THEN 'format_fit'
  WHEN 'offer_as_reward_not_headline'       THEN 'format_fit'
  WHEN 'long_runner_anchor'                 THEN 'durability'
  WHEN 'anti_sale_headline_as_hook'         THEN 'lazy_urgency'
  WHEN 'anti_manufactured_scarcity'         THEN 'lazy_urgency'
  WHEN 'anti_gifting_frame'                 THEN 'misframed_value'
  ELSE pattern_category
END;

UPDATE ad_pattern_labels apl
SET pattern_category = pd.pattern_category
FROM pattern_definitions pd
WHERE pd.pattern_name = apl.pattern_name AND apl.pattern_category IS NULL;

CREATE INDEX IF NOT EXISTS pd_category_idx ON pattern_definitions(pattern_category);
CREATE INDEX IF NOT EXISTS apl_category_idx ON ad_pattern_labels(pattern_category);

-- 3. Self-improving anchor refresh: pull top labeled ads back into anchor_ad_ids per pattern
DROP FUNCTION IF EXISTS refresh_pattern_anchors(int);
CREATE OR REPLACE FUNCTION refresh_pattern_anchors(p_top_n int DEFAULT 15)
RETURNS TABLE (pattern_name text, old_anchor_count int, new_anchor_count int)
LANGUAGE plpgsql AS $$
DECLARE pdef record; new_anchors bigint[]; old_count int;
BEGIN
  FOR pdef IN SELECT pd.pattern_name, pd.pattern_type, pd.anchor_ad_ids FROM pattern_definitions pd LOOP
    SELECT ARRAY_AGG(id) INTO new_anchors FROM (
      SELECT a.id
      FROM ad_pattern_labels apl
      JOIN ads a ON a.id = apl.ad_id
      WHERE apl.pattern_name = pdef.pattern_name
        AND apl.signal_strength IN ('strong','moderate')
        AND a.embedding IS NOT NULL
        AND CASE
          WHEN pdef.pattern_type = 'winner' THEN COALESCE(a.performance_score, 0) >= 81
          WHEN pdef.pattern_type = 'loser' THEN COALESCE(a.performance_score, 100) <= 41 OR COALESCE(a.days_active, 999) <= 3
          ELSE true
        END
      ORDER BY
        CASE WHEN pdef.pattern_type = 'winner' THEN a.performance_score ELSE -a.performance_score END DESC NULLS LAST,
        a.days_active DESC NULLS LAST
      LIMIT p_top_n
    ) sub;

    new_anchors := ARRAY(
      SELECT DISTINCT unnest FROM unnest(COALESCE(pdef.anchor_ad_ids,'{}'::bigint[]) || COALESCE(new_anchors,'{}'::bigint[]))
    );

    old_count := COALESCE(array_length(pdef.anchor_ad_ids,1),0);
    UPDATE pattern_definitions SET anchor_ad_ids = new_anchors, updated_at = NOW()
    WHERE pattern_definitions.pattern_name = pdef.pattern_name;

    pattern_name := pdef.pattern_name;
    old_anchor_count := old_count;
    new_anchor_count := COALESCE(array_length(new_anchors,1),0);
    RETURN NEXT;
  END LOOP;
END $$;

-- 4. Category centroid: pools all anchors in a category for stronger semantic match
DROP FUNCTION IF EXISTS category_centroid(text);
CREATE OR REPLACE FUNCTION category_centroid(p_category text)
RETURNS vector(3072)
LANGUAGE plpgsql STABLE AS $$
DECLARE centroid vector(3072); all_anchors bigint[];
BEGIN
  SELECT ARRAY(SELECT DISTINCT unnest FROM unnest(
    (SELECT array_agg(unnest) FROM
      (SELECT unnest(anchor_ad_ids) FROM pattern_definitions WHERE pattern_category = p_category) sub
    )
  )) INTO all_anchors;

  IF all_anchors IS NULL OR array_length(all_anchors,1) = 0 THEN RETURN NULL; END IF;

  SELECT AVG(embedding)::vector(3072) INTO centroid
  FROM ads WHERE id = ANY(all_anchors) AND embedding IS NOT NULL;
  RETURN centroid;
END $$;

-- 5. Category detection: scores ad against all 7 category centroids
DROP FUNCTION IF EXISTS detect_ad_categories(bigint);
CREATE OR REPLACE FUNCTION detect_ad_categories(p_ad_id bigint)
RETURNS TABLE (pattern_category text, similarity numeric, n_anchors int)
LANGUAGE plpgsql AS $$
DECLARE ad_emb vector(3072); cat_row record; cent vector(3072); cat_text text;
BEGIN
  SELECT embedding INTO ad_emb FROM ads WHERE id = p_ad_id;
  IF ad_emb IS NULL THEN RETURN; END IF;

  FOR cat_row IN
    SELECT DISTINCT pd.pattern_category as cat
    FROM pattern_definitions pd
    WHERE pd.pattern_category IS NOT NULL
  LOOP
    cat_text := cat_row.cat;
    cent := category_centroid(cat_text);
    IF cent IS NOT NULL THEN
      pattern_category := cat_text;
      similarity := ROUND((1 - (ad_emb <=> cent))::numeric, 4);
      SELECT COUNT(DISTINCT u) INTO n_anchors FROM (
        SELECT unnest(pd2.anchor_ad_ids) u FROM pattern_definitions pd2 WHERE pd2.pattern_category = cat_text
      ) s;
      RETURN NEXT;
    END IF;
  END LOOP;
END $$;

-- 6. Update intake_detect_and_label to also stamp pattern_category on new labels
CREATE OR REPLACE FUNCTION intake_detect_and_label(p_ad_id bigint)
RETURNS TABLE (pattern_name text, pattern_category text, confidence numeric, action text)
LANGUAGE plpgsql AS $$
DECLARE rec record; pd_row record;
BEGIN
  FOR rec IN SELECT * FROM detect_ad_patterns(p_ad_id) LOOP
    SELECT * INTO pd_row FROM pattern_definitions WHERE pattern_definitions.pattern_name = rec.pattern_name;

    INSERT INTO ad_pattern_label_suggestions (ad_id, pattern_name, confidence, lexical_score, embedding_similarity, status, detector_version)
    VALUES (p_ad_id, rec.pattern_name, rec.confidence, rec.lexical_score, rec.embedding_similarity, rec.status, 'v1')
    ON CONFLICT (ad_id, pattern_name, detector_version) DO UPDATE SET
      confidence = EXCLUDED.confidence, status = EXCLUDED.status, detected_at = NOW();

    IF rec.status = 'auto_promote' THEN
      INSERT INTO ad_pattern_labels (ad_id, pattern_name, pattern_type, pattern_category, signal_strength, notes)
      VALUES (
        p_ad_id, rec.pattern_name, pd_row.pattern_type, pd_row.pattern_category,
        CASE WHEN rec.confidence >= 0.95 THEN 'strong' WHEN rec.confidence >= 0.80 THEN 'moderate' ELSE 'weak' END,
        'auto-detected at intake conf=' || rec.confidence::text
      )
      ON CONFLICT (ad_id, pattern_name) DO NOTHING;

      UPDATE ad_pattern_label_suggestions SET status = 'promoted', promoted_at = NOW()
      WHERE ad_id = p_ad_id AND ad_pattern_label_suggestions.pattern_name = rec.pattern_name AND detector_version = 'v1';
      action := 'auto_promoted';
    ELSE
      action := 'queued_for_review';
    END IF;

    pattern_name := rec.pattern_name;
    pattern_category := pd_row.pattern_category;
    confidence := rec.confidence;
    RETURN NEXT;
  END LOOP;
END $$;
