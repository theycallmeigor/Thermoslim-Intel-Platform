---
type: analysis
topic: winner-alerts-filters
created: 2026-05-19
---

# Winner-Alerts Filter Analysis — 2026-05-19

## 1. What this pipeline does

The **Competitor Winner Alerts** pipeline watches the ads your competitors run on
Facebook/Meta (via the GetHookd ad intelligence service) and posts a Discord
message every time one of those ads looks like a genuine **winner** — an ad worth
your attention because the competitor is clearly making money from it.

The pipeline is built on a model we call **"day-10 survival"**:

> A competitor ad is treated as a winner when it (a) **started running 10–11 days
> ago**, (b) is **still live** in the Meta ad library, and (c) has a **high GetHookd
> performance score**.

The logic behind the model is sound business intuition: most ads are killed within
a few days because they don't perform. If a competitor is *still* paying to run an
ad ten days later, they're spending real money on it — and money doesn't lie. The
ad survived the cull, so it's probably working. "Survival to day 10" is the cheap,
observable proxy for "this ad is profitable."

The problem is in *how* we confirm the third condition — the performance score —
and in treating the day-10 window as a hard rule. This document explains where the
current filters fall short and what to do about it.

---

## 2. Current Filters

The pipeline today gates an ad through **five filters** before it earns a Discord
alert. An ad must pass *all five*:

1. **Date window** — the ad's `start_date` must fall within `today-11 .. today-10`.
   This is the "day 10–11 survival window." (See `Compute Window` in
   `winner-alerts-v2.sdk.ts`: `sd_lower = minus(11); sd_upper = minus(10)`.)

2. **Still live** — `active_in_library = 1`. The ad must still be running in the
   Meta ad library right now. A `NULL` value here fails the filter.

3. **Performance score ≥ 70** — GetHookd's `performance_score`. This score is
   **tiered and discrete** — only five values ever appear:
   - `1` → "Testing"
   - `41` → "Scaling"
   - `61` → "Growing"
   - `81` → "Optimized"
   - `91` → "Winning"

   So a `≥ 70` threshold actually admits **exactly two tiers**: `81` and `91`.

4. **Brand is active** — the canonical brand the ad belongs to must have
   `status = 'active'`. Paused or archived brands don't generate alerts.

5. **Not already sent** — the ad's `external_id` is checked against the
   `ad_alerts_sent` table so the same ad is never posted to Discord twice.

---

## 3. Why the Current Filters Fall Short

A full investigation on 2026-05-19 surfaced eight problems. Most of them trace back
to one root cause: **we trust the performance score more than the score deserves.**

### A. The score was being read from the wrong place (a bug)

The workflow's `Verify One Ad` step fetches the ad from GetHookd's **single-ad
endpoint**, `GET /api/v1/ads/{id}`. That endpoint returns
`performance_score: null` for most ads. The score is only carried by the **list**
endpoints — `/api/v1/explore` and `/brandspy/{id}/top-ads`.

**Business analogy:** it's like asking for a single product's sales rank by
looking at the product's own page, when the rank only ever appears on the
category bestseller list. The page genuinely doesn't have the number. So the
winner gate was reading a blank where a real score existed elsewhere — and
silently skipping real winners.

### B. `null` scores are everywhere — and that's permanent

Even when you *do* read the score from the correct (`explore`) endpoint, roughly
**50–60% of ads come back with `performance_score: null`**. This was tested across
three age windows:

- Day-10 ads: **12 of 12 null** (100%)
- Day-11 ads: ~40% null
- Day-15 ads: 6 of 10 null

Critically, **the null rate does not shrink as the ad gets older**. A 15-day-old
ad is just as likely to be unscored as a 10-day-old one. So "wait longer and the
score will appear" is false.

The `explore` response metadata explains why: it carries
`"filters": {"exclude_low_impressions": true}`. In plain terms, **GetHookd only
computes a score for ads that have enough impression/spend signal**. A `null`
score means *"we don't have enough data to rate this ad"* — it does **not** mean
*"this ad is bad."*

**Business analogy:** `null` is not a failing grade. It's an "incomplete." The
student didn't fail the exam — they never sat it, because there wasn't enough
proctoring data. Treating "incomplete" as "fail" throws away half the class.

**Consequence:** the `score ≥ 81` gate is **structurally blind to ~half of every
genuinely-running ad**. Those ads can survive 10 days, keep spending the
competitor's money, and *still never qualify as a winner* — purely because no
score exists for them.

### C. The `null` is sticky, not flaky

Repeated `explore` calls return the **same** null (or the same score) for the same
ad. So `null` is a *stable state*, not random noise. **Retrying won't fix it.**
This matters because it rules out the easy fix — you can't just poll until a number
appears. If the ad is unscored today, it's unscored, full stop.

### D. The score in our database is frozen at discovery

The `ads` table's `performance_score` is written **once** — by the brand-pull
workflow, the moment the ad is first discovered. Brand-pull is incremental: it
*skips ads it already knows about*. So the score is captured at day-0 and never
touched again.

There was supposed to be a refresher workflow (`active-ads-refresh`) that re-pulls
live ads and updates their scores. **It was never deployed.**

**Business analogy:** you priced your inventory the day it arrived and never
re-checked the market. An ad discovered at day-0 as a score-`1` "Testing" ad stays
score `1` in our database **forever** — even if it becomes a runaway winner. Gating
on the stored score systematically misses every ad whose score climbed *after* we
first saw it. Which is exactly the population we care about: ads that *grew into*
winners.

### E. Day-10 is probably too early

The sample is blunt: **100% of day-10 ads were unscored; ~60% of day-11 ads had a
real score.** GetHookd's score simply may not be computed yet for very fresh ads.

The day-10/11 window was a reasonable guess, but it's a *guess* — it was never
derived from "when does the score actually become reliable?" We're checking ads on
the one day they're most likely to be unscored.

### F. The score is too coarse to be useful

Only **five discrete tiers** exist. That means:

- You can't tell a *strong* 91 from a *marginal* one.
- You can't see **momentum** — an ad climbing `1 → 61 → 91` (accelerating, a clear
  winner) looks identical to one stuck flat at `81` for a week (plateaued).

A single tier number is a snapshot with no trajectory. Trajectory is where the real
signal lives.

### G. "Survival to day 10" conflates *age* with *performance*

The model assumes survival ≈ profitability. But an ad can survive 10 days in the
library and *still* be a score-`1` "Testing" ad — the competitor just hasn't
gotten around to killing it, or is letting a small budget ride. **Survival is
necessary but not sufficient** for "winner." Age alone proves persistence, not
performance.

### H. Brand isolation is a pseudo-filter

The `explore` endpoint has **no true brand filter**. To isolate one brand's ads,
the pipeline does a free-text search: `query={brand_name}`. That's fragile:

- It **misses** a brand's ads whose copy doesn't happen to contain the brand name.
- It **includes** *other* brands' ads that merely mention the name.

So the set of ads we evaluate for "Brand X" isn't reliably Brand X's ads.
(Mitigation already known: filter the returned results by
`brand.id == gethookd_brand_id`.)

---

## 4. Ideas to Improve

Concrete, actionable changes. Roughly ordered from "fixes a bug" to "rethinks the
model."

### (i) Read the score from `explore`, not `/ads/{id}`

This is the highest-leverage, lowest-risk change. The single-ad endpoint returns
`null` by design; the list endpoints carry the real score. Re-point `Verify One
Ad` (or add a score-enrichment step) at `/explore` or `/brandspy/{id}/top-ads`.
This alone recovers winners the pipeline is currently dropping on the floor.

### (ii) Treat `null` as a distinct third state — "unmeasured"

Right now the logic is binary: score-passes or score-fails. Make it **three-way**:

- **Winner** — score is present and high (`81` / `91`).
- **Not a winner** — score is present and low.
- **Unmeasured** — score is `null`. This is *not* a confirmed loser. It's an ad we
  can't rate with the GetHookd score *yet*.

The `null` bucket should not be silently discarded. It should be routed to a
secondary check (next idea) instead of being treated as a failure.

### (iii) Add a secondary signal for unmeasured ads — creative reuse + longevity

For the ~half of ads GetHookd can't score, lean on signals that **don't depend on
GetHookd's score at all**:

- **`used_count`** — how many times the brand has *re-run the same creative*. A
  brand re-using a creative is voting with its own budget: they're doubling down
  because it works. High reuse is a winner signal that is *independent* of the
  performance score. This is arguably the strongest available proxy for an
  unscored ad.
- **`days_active` / longevity** — an ad that has survived well past day 10 (e.g.
  20+, 30+ days) is an even stronger survival signal. The longer it runs, the more
  the competitor has spent keeping it alive.

Rule of thumb for the unmeasured bucket: *alert if reuse is high OR the ad has run
well past the survival window*, even with a `null` score. Label these alerts
clearly (e.g. "high-reuse signal, score unavailable") so you know it's a different
class of evidence.

### (iv) Cross-check with `/brandspy/{id}/top-ads`

`/brandspy/{id}/top-ads` returns a brand's *top performers* with cleaner score
data. Use it as a second opinion: if an ad shows up on its brand's top-ads list,
that's a strong corroborating winner signal — and it's brand-scoped natively, so
it sidesteps the free-text brand-isolation problem entirely.

### (v) Store daily score snapshots — track momentum, not a point reading

Add a small table (e.g. `ad_score_history`: `ad_id`, `date`, `performance_score`,
`days_active`, `used_count`) and append a row each day during the brand pull.

This turns the coarse 5-tier score into a **trajectory**:

- An ad climbing `1 → 61 → 91` over a week is an accelerating winner — alert it.
- An ad flat at `81` for ten days is a plateau — lower priority.
- An ad that *was* `null` and *became* `81` is a freshly-confirmed winner — and
  you'd only ever catch that transition if you're snapshotting.

Snapshots also retroactively fix **finding D** (frozen score): you stop depending
on the single discovery-time read.

### (vi) Re-evaluate the day-10 window

Now that we know day-10 ads are almost always unscored, the window is working
against us. Two practical options:

- **Shift the window later** — e.g. day 13–15, where ~60%+ of ads carry a real
  score. You alert a few days later but with far more confirmable winners.
- **Widen the window and lean on the snapshots** — evaluate a broader age range
  (day 10 through day 21, say) and let the score-history / reuse signals decide,
  rather than betting everything on a two-day slice.

Either way, the window should be **derived from data** ("when does the score
become reliable?") rather than fixed by intuition.

### (vii) Harden brand isolation with `brand.id == gethookd_brand_id`

When pulling from `explore`, always filter the returned results to
`brand.id == <the brand's gethookd_brand_id>`. This removes the false positives
(other brands mentioning the name) and makes the per-brand ad set trustworthy. It
doesn't fix the false *negatives* (a brand's ads that don't mention the name) —
for that, prefer `/brandspy/{id}` and `/brandspy/{id}/top-ads`, which are
brand-scoped at the source.

### (viii) Other sensible ideas

- **Composite winner score.** Instead of a single hard gate, compute a small
  weighted score: `performance_score` (when present) + `used_count` +
  `days_active` + on-top-ads-list flag. Alert above a composite threshold. This
  degrades gracefully when any one signal is missing.
- **Deploy the `active-ads-refresh` workflow** (finding D's intended fix) so live
  ads get their scores re-pulled, not frozen at discovery.
- **Tier the Discord alert by confidence.** A score-`91` ad that's also on the
  top-ads list is a "strong winner"; a `null`-score ad flagged purely on reuse is
  a "watch" signal. Different colors / prefixes so you can triage at a glance.
- **Track null-rate as an ops metric.** If GetHookd's coverage changes over time,
  you want to know — the whole strategy depends on it.

---

## 5. Recommended Near-Term vs Longer-Term

### Near-term (this week — fixes bugs and stops dropping winners)

1. **(i)** Re-point the score lookup to `explore` / `/brandspy/{id}/top-ads`.
   This is a straight bug fix.
2. **(ii)** Make `null` a distinct "unmeasured" state instead of an automatic
   fail.
3. **(iii)** For unmeasured ads, gate on `used_count` (creative reuse) and
   `days_active` longevity so the ~half of ads GetHookd can't score still get a
   fair shot at an alert.
4. **(vii)** Add the `brand.id == gethookd_brand_id` result filter — small change,
   removes false-positive brands immediately.

These four changes can ship without restructuring the model and should
meaningfully increase the number of real winners surfaced.

### Longer-term (rethinks the model — needs schema + workflow work)

1. **(v)** Stand up an `ad_score_history` table and snapshot scores daily. This is
   the foundation for everything momentum-related.
2. **(vi)** Re-derive the day-10 window from the snapshot data — find the age at
   which the score is actually reliable and move (or widen) the window
   accordingly.
3. **(viii)** Replace the single hard `score ≥ 81` gate with a **composite winner
   score** that combines score, reuse, longevity, and top-ads membership — and
   deploy the missing `active-ads-refresh` workflow so stored scores stay fresh.
4. **(iv)** Wire `/brandspy/{id}/top-ads` in as a corroborating signal.

The near-term work makes today's pipeline honest. The longer-term work replaces
"survival + a coarse score" with "survival + a measured, trending, multi-signal
judgment" — which is what "winner" actually means.
