# Ad Pattern Detection Engine

Auto-labels ads with winner/loser pattern tags during intake. Validated against 507-ad backfill.

## Architecture

```
intake (n8n enrichment complete)
    ↓
intake_detect_and_label(ad_id)
    ↓
pattern_definitions (rules) → detect_ad_patterns(ad_id) → suggestions
    ↓                                                           ↓
ad_pattern_label_suggestions (staging)              ad_pattern_labels (canonical)
    ↑                                                           ↑
backfill_pattern_detection() (one-time)        promote_pattern_suggestions()
```

## Tables

| Table | Purpose |
|---|---|
| `pattern_definitions` | Rule registry: lexical regex + structural filters + anchor ad IDs |
| `ad_pattern_label_suggestions` | Detector output staging (status: pending/auto_promote/promoted/review/rejected) |
| `ad_pattern_labels` | Canonical labels, queryable for AI generation training |

## Functions

| Function | When to call |
|---|---|
| `detect_ad_patterns(ad_id)` | Returns suggestions for one ad — read-only inspection |
| `intake_detect_and_label(ad_id)` | **Called by n8n after enrichment** — detects + auto-promotes high-conf labels |
| `backfill_pattern_detection(limit, only_unanalyzed)` | One-time backfill across N ads |
| `promote_pattern_suggestions()` | Move all auto_promote suggestions → labels (used by backfill) |
| `pattern_centroid(pattern_name)` | Returns mean embedding of anchor ads — used internally |

## Scoring

```
confidence = lexical_weight × lexical_score + embedding_weight × embedding_norm
embedding_norm = clamp((cosine_sim - 0.55) / 0.45, 0, 1)
```

Per pattern thresholds:
- `confidence >= auto_promote_threshold` (default 0.85) → auto-applied
- `confidence >= review_threshold` (default 0.60) → queued for human review
- Below → discarded

## Validated Predictive Lift (n=507 backfill)

| Pattern | Type | n | Score Lift | Days Lift | % Winners |
|---|---|---|---|---|---|
| video_bof_format_winner | winner | 29 | **+14.7** | **+102** | 100% |
| offer_as_reward_not_headline | winner | 2 | +13.7 | +117 | 100% |
| viral_trust_signal | winner | 19 | +12.0 | +2.9 | 75% |
| ugc_social_proof_hook | winner | 37 | +8.1 | **+74.6** | 63% |
| relief_empowerment_emotional_tone | winner | 56 | +5.6 | +2.3 | 63% |
| without_invasive_procedure | winner | 187 | +3.9 | +10.9 | 47% |
| **anti_sale_headline_as_hook** | **loser** | **67** | **−17.3** | **−9.8** | **9.7%** |
| anti_gifting_frame | loser | 181 | −9.6 | −15.7 | 14.9% |

**Strongest single signal**: `anti_sale_headline_as_hook` is a 17-point score destroyer. If a new ad triggers this pattern with high confidence at intake, it's predicted to die.

## Known Calibration Issue

`anti_manufactured_scarcity` shows +11.7 score lift in backfill (opposite of expected). Either:
1. The pattern is over-matching (false positives on legit social proof copy), OR
2. Hypothesis was wrong — fake-scarcity ads actually win in some categories

Action: review the 17 tagged ads, refine regex or relabel pattern_type to `neutral` until clarified.

## n8n Intake Integration

Add a Postgres node to the enrichment workflow, after `analyzed_at` is set:

```sql
SELECT * FROM intake_detect_and_label({{ $json.ad_id }});
```

Output: array of `{pattern_name, confidence, action}`. Use it to:
- Send Slack alert if `pattern_type='loser'` with confidence >= 0.85 (kill ad early)
- Boost ad budget if `pattern_type='winner'` with multiple high-conf matches
- Feed into AI generation prompts: "Generate ads using these confirmed winning patterns: [...]"

## Adding New Patterns

```sql
INSERT INTO pattern_definitions (
  pattern_name, pattern_type, description,
  lexical_any,        -- regex array, ANY match = score 1.0
  lexical_all,        -- regex array, ALL must match (use ~* operator)
  requires_funnel_stage, requires_ad_type, requires_display_format,
  min_days_active, min_performance_score,
  anchor_ad_ids,      -- canonical examples for centroid
  lexical_weight, embedding_weight,
  auto_promote_threshold, review_threshold
) VALUES (...);

-- Then re-backfill (only newly tagged rows added)
SELECT * FROM backfill_pattern_detection();
SELECT promote_pattern_suggestions();
```

Use `~*` regex syntax (POSIX case-insensitive). Avoid `(?i)` inline flag — unreliable in Postgres POSIX. Tolerate curly apostrophes (`.`) instead of straight `'`.

## AI Generation Query

For training prompts, pull canonical examples per pattern:

```sql
SELECT a.hook, a.body, a.core_angle, a.performance_score, a.days_active
FROM ad_pattern_labels apl
JOIN ads a ON a.id = apl.ad_id
WHERE apl.pattern_name = 'ugc_social_proof_hook'
  AND apl.signal_strength = 'strong'
  AND a.performance_score >= 81
ORDER BY a.days_active DESC
LIMIT 10;
```

## Files

- This doc: `n8n/files/pattern-detection-engine.md`
- Migrations: applied via `mcp__supabase__apply_migration` — see `pattern_definitions`, `ad_pattern_label_suggestions`, `detect_ad_patterns`, `intake_detect_and_label`, `backfill_pattern_detection`, `promote_pattern_suggestions`, `pattern_centroid`
