-- 12_pattern_detection_engine.sql
-- Detection functions: centroid, single-ad detect, intake hook, backfill, promote.
-- Idempotent — safe to re-run. Replaces functions on each apply.

-- pattern_centroid: mean embedding of anchor ads (vector(3072) for gemini-embedding-2)
DROP FUNCTION IF EXISTS pattern_centroid(text);
CREATE OR REPLACE FUNCTION pattern_centroid(p_pattern_name text)
RETURNS vector(3072)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  centroid vector(3072);
  anchor_ids bigint[];
BEGIN
  SELECT anchor_ad_ids INTO anchor_ids
  FROM pattern_definitions WHERE pattern_name = p_pattern_name;

  IF anchor_ids IS NULL OR array_length(anchor_ids,1) = 0 THEN RETURN NULL; END IF;

  SELECT AVG(embedding)::vector(3072) INTO centroid
  FROM ads WHERE id = ANY(anchor_ids) AND embedding IS NOT NULL;

  RETURN centroid;
END $$;

-- detect_ad_patterns: scores all known patterns against an ad, returns suggestions above review threshold
DROP FUNCTION IF EXISTS detect_ad_patterns(bigint);
CREATE OR REPLACE FUNCTION detect_ad_patterns(p_ad_id bigint)
RETURNS TABLE (
  pattern_name text, pattern_type text, confidence numeric,
  lexical_score numeric, embedding_similarity numeric, status text
)
LANGUAGE plpgsql AS $$
DECLARE
  ad_row record; pdef record;
  text_blob text; hook_text text;
  any_match int; all_match boolean;
  lex_score numeric; emb_sim numeric; emb_norm numeric; conf numeric;
  centroid vector(3072); passes_structure boolean; rgx text;
BEGIN
  SELECT a.* INTO ad_row FROM ads a WHERE a.id = p_ad_id;
  IF NOT FOUND THEN RETURN; END IF;

  text_blob := COALESCE(ad_row.hook,'') || E'\n' || COALESCE(ad_row.title,'') || E'\n' || COALESCE(ad_row.body,'');
  hook_text := COALESCE(ad_row.hook,'') || ' ' || COALESCE(ad_row.title,'');

  FOR pdef IN SELECT * FROM pattern_definitions WHERE active LOOP
    passes_structure := true;
    IF pdef.requires_funnel_stage IS NOT NULL AND ad_row.funnel_stage IS DISTINCT FROM pdef.requires_funnel_stage THEN passes_structure := false; END IF;
    IF pdef.requires_ad_type IS NOT NULL AND ad_row.ad_type IS DISTINCT FROM pdef.requires_ad_type THEN passes_structure := false; END IF;
    IF pdef.requires_display_format IS NOT NULL AND ad_row.display_format IS DISTINCT FROM pdef.requires_display_format THEN passes_structure := false; END IF;
    IF pdef.min_days_active IS NOT NULL AND COALESCE(ad_row.days_active,0) < pdef.min_days_active THEN passes_structure := false; END IF;
    IF pdef.min_performance_score IS NOT NULL AND COALESCE(ad_row.performance_score,0) < pdef.min_performance_score THEN passes_structure := false; END IF;
    IF NOT passes_structure THEN CONTINUE; END IF;

    lex_score := NULL;
    IF pdef.lexical_any IS NOT NULL THEN
      any_match := 0;
      FOREACH rgx IN ARRAY pdef.lexical_any LOOP
        IF pdef.pattern_name = 'anti_sale_headline_as_hook' THEN
          IF hook_text ~* rgx THEN any_match := any_match + 1; END IF;
        ELSE
          IF text_blob ~* rgx THEN any_match := any_match + 1; END IF;
        END IF;
      END LOOP;
      lex_score := CASE WHEN any_match >= 1 THEN 1.0 ELSE 0.0 END;
    END IF;

    IF pdef.lexical_all IS NOT NULL THEN
      all_match := true;
      FOREACH rgx IN ARRAY pdef.lexical_all LOOP
        IF text_blob !~* rgx THEN all_match := false; EXIT; END IF;
      END LOOP;
      IF lex_score IS NULL THEN
        lex_score := CASE WHEN all_match THEN 1.0 ELSE 0.0 END;
      ELSE
        lex_score := lex_score * (CASE WHEN all_match THEN 1.0 ELSE 0.0 END);
      END IF;
    END IF;
    IF lex_score IS NULL THEN lex_score := 0; END IF;

    emb_sim := NULL; emb_norm := 0;
    IF ad_row.embedding IS NOT NULL AND pdef.embedding_weight > 0 THEN
      centroid := pattern_centroid(pdef.pattern_name);
      IF centroid IS NOT NULL THEN
        emb_sim := 1 - (ad_row.embedding <=> centroid);
        emb_norm := GREATEST(0, LEAST(1, (emb_sim - 0.55) / 0.45));
      END IF;
    END IF;

    IF pdef.lexical_any IS NULL AND pdef.lexical_all IS NULL AND (pdef.min_days_active IS NOT NULL OR pdef.min_performance_score IS NOT NULL OR pdef.requires_funnel_stage IS NOT NULL) THEN
      conf := 1.0;
    ELSE
      conf := pdef.lexical_weight * lex_score + pdef.embedding_weight * emb_norm;
    END IF;

    IF conf >= pdef.review_threshold THEN
      pattern_name := pdef.pattern_name;
      pattern_type := pdef.pattern_type;
      confidence := ROUND(conf, 4);
      lexical_score := ROUND(lex_score, 4);
      embedding_similarity := ROUND(COALESCE(emb_sim, 0), 4);
      status := CASE WHEN conf >= pdef.auto_promote_threshold THEN 'auto_promote' ELSE 'review' END;
      RETURN NEXT;
    END IF;
  END LOOP;
  RETURN;
END $$;

-- intake_detect_and_label: called from n8n after enrichment. Detects + auto-promotes high-conf labels.
DROP FUNCTION IF EXISTS intake_detect_and_label(bigint);
CREATE OR REPLACE FUNCTION intake_detect_and_label(p_ad_id bigint)
RETURNS TABLE (pattern_name text, confidence numeric, action text)
LANGUAGE plpgsql AS $$
DECLARE rec record; pd_row record;
BEGIN
  FOR rec IN SELECT * FROM detect_ad_patterns(p_ad_id) LOOP
    SELECT * INTO pd_row FROM pattern_definitions WHERE pattern_name = rec.pattern_name;

    INSERT INTO ad_pattern_label_suggestions (ad_id, pattern_name, confidence, lexical_score, embedding_similarity, status, detector_version)
    VALUES (p_ad_id, rec.pattern_name, rec.confidence, rec.lexical_score, rec.embedding_similarity, rec.status, 'v1')
    ON CONFLICT (ad_id, pattern_name, detector_version) DO UPDATE SET
      confidence = EXCLUDED.confidence, status = EXCLUDED.status, detected_at = NOW();

    IF rec.status = 'auto_promote' THEN
      INSERT INTO ad_pattern_labels (ad_id, pattern_name, pattern_type, signal_strength, notes)
      VALUES (
        p_ad_id, rec.pattern_name, pd_row.pattern_type,
        CASE WHEN rec.confidence >= 0.95 THEN 'strong' WHEN rec.confidence >= 0.80 THEN 'moderate' ELSE 'weak' END,
        'auto-detected at intake conf=' || rec.confidence::text
      )
      ON CONFLICT (ad_id, pattern_name) DO NOTHING;

      UPDATE ad_pattern_label_suggestions SET status = 'promoted', promoted_at = NOW()
      WHERE ad_id = p_ad_id AND pattern_name = rec.pattern_name AND detector_version = 'v1';
      action := 'auto_promoted';
    ELSE
      action := 'queued_for_review';
    END IF;

    pattern_name := rec.pattern_name; confidence := rec.confidence;
    RETURN NEXT;
  END LOOP;
  RETURN;
END $$;

-- backfill_pattern_detection: run detection across N ads, write to suggestions
DROP FUNCTION IF EXISTS backfill_pattern_detection(int, boolean);
CREATE OR REPLACE FUNCTION backfill_pattern_detection(p_limit int DEFAULT NULL, p_only_unanalyzed boolean DEFAULT false)
RETURNS TABLE (ads_processed int, suggestions_written int, auto_promotable int)
LANGUAGE plpgsql AS $$
DECLARE
  ad_id_iter bigint;
  proc int := 0; written int := 0; promotable int := 0;
  rec record;
BEGIN
  FOR ad_id_iter IN
    SELECT id FROM ads
    WHERE embedding IS NOT NULL
    AND (NOT p_only_unanalyzed OR analyzed_at IS NULL)
    ORDER BY id
    LIMIT COALESCE(p_limit, 100000)
  LOOP
    proc := proc + 1;
    FOR rec IN SELECT * FROM detect_ad_patterns(ad_id_iter) LOOP
      INSERT INTO ad_pattern_label_suggestions
        (ad_id, pattern_name, confidence, lexical_score, embedding_similarity, status, detector_version)
      VALUES
        (ad_id_iter, rec.pattern_name, rec.confidence, rec.lexical_score, rec.embedding_similarity, rec.status, 'v1')
      ON CONFLICT (ad_id, pattern_name, detector_version) DO UPDATE SET
        confidence = EXCLUDED.confidence,
        lexical_score = EXCLUDED.lexical_score,
        embedding_similarity = EXCLUDED.embedding_similarity,
        status = EXCLUDED.status,
        detected_at = NOW();
      written := written + 1;
      IF rec.status = 'auto_promote' THEN promotable := promotable + 1; END IF;
    END LOOP;
  END LOOP;
  ads_processed := proc; suggestions_written := written; auto_promotable := promotable;
  RETURN NEXT;
END $$;

-- promote_pattern_suggestions: copy auto_promote suggestions into ad_pattern_labels
DROP FUNCTION IF EXISTS promote_pattern_suggestions();
CREATE OR REPLACE FUNCTION promote_pattern_suggestions()
RETURNS int LANGUAGE plpgsql AS $$
DECLARE promoted int := 0;
BEGIN
  WITH ins AS (
    INSERT INTO ad_pattern_labels (ad_id, pattern_name, pattern_type, signal_strength, notes, labeled_at)
    SELECT
      s.ad_id, s.pattern_name, pd.pattern_type,
      CASE WHEN s.confidence >= 0.95 THEN 'strong' WHEN s.confidence >= 0.80 THEN 'moderate' ELSE 'weak' END,
      'auto-detected v1 conf=' || s.confidence::text || ' lex=' || s.lexical_score::text || ' emb=' || s.embedding_similarity::text,
      NOW()
    FROM ad_pattern_label_suggestions s
    JOIN pattern_definitions pd ON pd.pattern_name = s.pattern_name
    WHERE s.status = 'auto_promote'
    ON CONFLICT (ad_id, pattern_name) DO NOTHING
    RETURNING ad_id
  )
  SELECT COUNT(*) INTO promoted FROM ins;

  UPDATE ad_pattern_label_suggestions SET status = 'promoted', promoted_at = NOW()
  WHERE status = 'auto_promote';

  RETURN promoted;
END $$;
