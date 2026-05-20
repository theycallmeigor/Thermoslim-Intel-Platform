# GetHookd Ad-Intel Pipeline — Operator's Guide

> Last built 2026-05-13. Read this before touching any workflow. Each section tells you what a step does, what correct output looks like, and what you **must not break** when fixing something else.

---

## § 1. Overview

A four-workflow chain that monitors competitor ads on GetHookd and fires Discord alerts when an ad crosses a "winner" threshold.

**Plain English:** The user adds a brand via a form. Once a day at 8:30 AM ET, every active brand gets its ads pulled from GetHookd. Any ad that has been live ≥10 days with a performance score ≥50 fires a Discord notification. Already-alerted ads are skipped on subsequent runs.

```
                  ┌──────────────────────┐
   user submits → │ Add Brand Form       │ FsYIjP0QZZBBYZlm
                  └──────────┬───────────┘
                             │ creates brand row
                             │ optionally triggers initial pull
                             ▼
   ┌──────────────────────────────────────────────────┐
   │             Brand Pull v2 (by ID)                │ skDkD5b9Rf9gQ4Gr
   │  inputs: brand_id, max_pages, [pull_since_date]  │
   │  → /brandspy/{gethookd_brand_id}                 │
   │  → upserts ads                                   │
   │  → stamps brands.last_full_pull_at               │
   │  → calls Alerts workflow                         │
   └──────────┬───────────────────────────────────────┘
              ▲                            │
              │ once per brand             ▼
   ┌──────────┴───────────┐    ┌───────────────────────────┐
   │ Daily Brand Pull     │    │ Competitor Winner Alerts  │ Sekmk7nuEK37l2Hw
   │ (8:30 AM ET cron)    │    │  reads v_winner_candidates│
   │ nlQqFFXYRJo9eOP9     │    │  posts to Discord webhook │
   │ passes yesterday's   │    │  dedupes via              │
   │ date as cutoff       │    │    ad_alerts_sent         │
   └──────────────────────┘    └───────────────────────────┘
```

**Active brands (2026-05-13):**

| db id | name | gethookd_brand_id | monitor_since |
|---|---|---|---|
| 1  | Smooche             | 137961  | 2026-05-01 |
| 19 | Korean Beauty Tips  | 4341222 | 2026-05-01 |
| 20 | Besque              | 50636   | 2026-05-01 |
| 21 | 40 Plus & Fabulous  | 53713   | 2026-05-01 |

**Cadence:**
- **Daily 8:30 AM ET** — Daily Brand Pull fires, pulls each brand's new ads since yesterday, triggers alerts per brand
- **On-demand** — Manual Test on any workflow, or Add Brand Form submission, runs the same chain ad-hoc

---

## § 2. Workflow Reference

### 2.1 Add Brand Form (`FsYIjP0QZZBBYZlm`)

- **Purpose:** Front door for onboarding a new brand. Creates the `brands` row, optionally kicks off an initial pull.
- **Triggered by:** Form submission (n8n hosted form)
- **Step-by-step:**
  1. `Add Brand Form` — n8n form trigger, fields: GetHookd URL, brand name (optional), monitor_since date, account type, notes, pull mode (Skip / Test 1 page / Full pull)
  2. `Extract & Validate` (code) — parses `brand_id` from GetHookd URL, normalizes the date, derives slug, decides `wants_pull` + `max_pages` from the dropdown
  3. `Insert into brands` (Supabase POST `/brands` with `Prefer: resolution=merge-duplicates`) — creates or updates the brand row; sets `monitor_since_date`, defaults `status=active`
  4. `Carry Brand ID` (code) — pulls `id` and `name` from the insert response; forwards `wants_pull` + `max_pages`
  5. `Pull Now?` (if) — branches on `wants_pull === true`
  6. `Trigger Brand Pull v2` (executeWorkflow → `skDkD5b9Rf9gQ4Gr`) — passes `brand_id` and `max_pages`. Fires async (`waitForSubWorkflow: false`)
- **Expected end state:**
  - One row in `brands` with `monitor_since_date` set and `name` (placeholder = `Pending: brand <id>` if user left blank)
  - If pull was chosen: Brand Pull v2 execution starts within seconds
- **Failure modes:**
  - Bad GetHookd URL → `Extract & Validate` throws "Invalid GetHookd URL"
  - Duplicate `gethookd_brand_id` → insert returns 409; merge-duplicates handles it but `monitor_since_date` may be overwritten
  - Wrong name re-submission collides with existing brand row (placeholder rename fails later — see §6 gotcha 8)
- **DON'T BREAK:**
  - The `wants_pull` + `max_pages` payload shape to Brand Pull v2 — that workflow's `When Called` trigger expects exactly these two parameter names (plus optional `pull_since_date`)
  - The `name = 'Pending: brand <id>'` convention — Brand Pull v2's rename step filters on `name=like.Pending*`

---

### 2.2 Brand Pull v2 (by ID) (`skDkD5b9Rf9gQ4Gr`)

- **Purpose:** Pull all (or delta) active ads for one brand from GetHookd, upsert into Supabase, then fire the alerts workflow for that brand.
- **Triggered by:** Manual Test, `When Called` sub-workflow trigger (from Daily Orchestrator or Add Brand Form)
- **Inputs (`When Called`):**
  - `brand_id` (int, required) — DB row id (NOT gethookd_brand_id)
  - `max_pages` (int, default 500) — pagination safety cap
  - `pull_since_date` (string `YYYY-MM-DD`, optional) — overrides brand's `monitor_since_date` for this run only. When set, enables **delta mode** (early-stop when a page is entirely below the cutoff)
- **Step-by-step:**
  1. `Manual Test` / `When Called` → `Fetch Brand` (Supabase GET `/brands?id=eq.<brand_id>`)
  2. `Init State` (code) — reads response, builds `state` object: `brand_id`, `brand_name`, `gethookd_brand_id`, `monitor_since_date` (or `pull_since_date` override → stored as `monitor_since_date` in state with `is_delta_run: true`), `page: 1`, `max_pages`, `_stop: false`
  3. `GetHookd — Fetch Page` (HTTP GET `https://app.gethookd.ai/api/v1/brandspy/{gethookd_brand_id}?status=active&per_page=25&page={page}`) — uses Header Auth credential
  4. `Extract Ads` (code) — handles both `/brandspy` (`data.ads.data`) and `/explore` (`data`) response shapes; filters out ads with `start_date < cutoff`; tracks `onPageCutoffCount`; if **delta mode** AND `onPageCutoffCount === items.length`, sets `_stop = true`; emits one item per ad to upsert (or one `_empty` sentinel)
  5. `Upsert Ads` (Supabase POST `/ads` with `Prefer: resolution=merge-duplicates,return=minimal`) — upserts page batch by primary key `id`
  6. `Collapse Counter` (set, `executeOnce: true`) — collects `_stop`, `_page`, etc. from the last Extract Ads item into one state object for the loop
  7. `More Pages?` (if) — `_stop === false` → `Increment Page` → back to `GetHookd Fetch Page`; `_stop === true` → finalize branch
  8. `Update Brand Name (if placeholder)` (Supabase PATCH `/brands?id=eq.X&name=like.Pending*`) — only renames if name is still a placeholder
  9. `Mark Brand Done` (Supabase PATCH `/brands?id=eq.X`) — stamps `last_full_pull_at = NOW()`
  10. `Trigger Alerts` (executeWorkflow → `Sekmk7nuEK37l2Hw`) — passes `brand_id`
- **Expected end state:**
  - New ads upserted into `ads` (each row's `updated_at` = run time)
  - `brands.last_full_pull_at` is fresh
  - Alerts workflow fires asynchronously
- **Failure modes:**
  - `Init State` "Brand not found" → `Fetch Brand` returned `[]` (bad brand_id), connections broken (skips Fetch Brand), or credentials unbound
  - GetHookd 401 / "Invalid or expired token" → rotate API key in n8n Header Auth credential
  - `Update Brand Name` 409 → placeholder rename collides with an existing brand of that name (rare; usually means the user re-submitted the form for the same brand)
- **DON'T BREAK:**
  - `Set Test Inputs → Fetch Brand` wire (drag-drop has rewired it to skip Fetch Brand before — see §6 gotcha 6)
  - The `data.ads.data` extraction path — `/brandspy` wraps differently than `/explore`
  - `executeOnce: true` on `Collapse Counter` — without it, you get N executions per ad and infinite loops
  - Async sub-workflow call (`waitForSubWorkflow: false`) — synchronous calls trip n8n's nested execution limit
  - The `pull_since_date` → `is_delta_run` derivation in `Init State` — Extract Ads' early-stop only triggers when `is_delta_run === true`

---

### 2.3 Daily Brand Pull (8:30 AM ET) (`nlQqFFXYRJo9eOP9`)

- **Purpose:** Cron orchestrator. Once a day, fetches all active brands and runs Brand Pull v2 for each in delta mode.
- **Triggered by:** Schedule (cron `30 8 * * *`)
- **Step-by-step:**
  1. `Daily 8:30 AM ET` (scheduleTrigger) — fires once a day. **Timezone must be set to `America/New_York` in the node UI** (cron defaults to UTC otherwise)
  2. `Get Active Brands` (Supabase GET `/brands?status=eq.active&gethookd_brand_id=not.is.null`) — returns one row per active brand
  3. `Map Per-Brand Inputs` (set) — emits per brand: `brand_id`, `max_pages: 50`, `pull_since_date: {{ $now.minus({days: 1}).toFormat('yyyy-MM-dd') }}`
  4. `Run Brand Pull v2` (executeWorkflow, `mode: 'each'`) — fires one execution per brand sequentially with the mapped inputs
- **Expected end state:**
  - One Brand Pull v2 execution per active brand
  - Each pull completes in seconds (delta runs hit the early-stop on page 1 or 2)
  - `brands.last_full_pull_at` updated for each brand
  - Alerts workflow fires per brand, posts new winners to Discord
- **Failure modes:**
  - Cron didn't fire → check workflow is **published** (`active: true`); check timezone setting; the cron only fires when active version is published
  - Wrong time of day (4:30 AM ET, etc.) → timezone is UTC; set it to `America/New_York` on the schedule node
  - All brands skipped → credentials unbound on `Get Active Brands`; or `status` field name changed
- **DON'T BREAK:**
  - The `{{ $now.minus({days: 1}).toFormat('yyyy-MM-dd') }}` expression — Brand Pull v2's delta mode requires this exact string format (YYYY-MM-DD)
  - `mode: 'each'` on the Execute Workflow node — `mode: 'all'` would batch and only call once with array input
  - Cron expression `30 8 * * *` — n8n version of "every day at 8:30"

---

### 2.4 Competitor Winner Alerts (Discord) (`Sekmk7nuEK37l2Hw`)

- **Purpose:** Find ads that just crossed the winner threshold and post them to Discord (one message per ad, throttled to avoid rate limits).
- **Triggered by:** `Daily 9am` schedule (independent backup), `When Called` from Brand Pull v2, or `Manual Test`
- **Inputs (Manual Test / Set Test Brand):**
  - `test_brand_id` (int, default 0) — set to a brand id to filter to one brand for testing; 0 = global check
- **Step-by-step:**
  1. Any trigger → `Set Test Brand` (manual path only) → `Merge Triggers` (code, single entry point that reads `test_brand_id` from Set Test Brand if available)
  2. Three HTTP fetches in parallel from `Merge Triggers`:
     - `Fetch Winners` — `GET /v_winner_candidates?days_active=gte.10&performance_score=gte.50&active_in_library=eq.1&order=performance_score.desc&limit=200` (and `canonical_brand_id=eq.<test_brand_id>` if test mode)
     - `Fetch Already-Sent IDs` — `GET /ad_alerts_sent?alert_channel=eq.discord&limit=10000`
     - `Fetch Discord Webhook` — `GET /app_settings?key=eq.winning_alerts_webhook&limit=1`
  3. All three converge into `Prepare Per-Winner Items` (code, `executeOnce: true`) — diffs Winners vs Sent, builds one item per unalerted winner containing `_webhook_url`, `discord_body` (with embed), and `insert_row`
  4. `Has New Winners?` (if) — `_no_new === true` → `No New Winners` (noOp); else → `Post Discord (Throttled)`
  5. `Post Discord (Throttled)` (HTTP POST to `$json._webhook_url`) — embeds title, image, fields (Days Active, Score, Format, Landing Page), footer with `external_id`. HTTP node's `batching: { batchSize: 1, batchInterval: 600 }` throttles to ~1.6 req/sec
  6. `Mark Alert Sent` (Supabase POST `/ad_alerts_sent`) — body is `$('Prepare Per-Winner Items').item.json.insert_row` (NOT `$json.insert_row` — see §6 gotcha 4)
- **Expected end state:**
  - One Discord message per new winner (with image, clickable title, landing page link)
  - One row inserted into `ad_alerts_sent` per posted winner (idempotency)
- **Failure modes:**
  - "undefined is not valid JSON" on Mark Alert Sent → expression is reading `$json` instead of `$('Prepare Per-Winner Items').item.json` (HTTP nodes overwrite `$json`)
  - "Node X hasn't been executed" → credentials unbound on one of the three fetches; the missing node fails silently and downstream code throws
  - Discord 429 → throttle interval too aggressive; raise `batchInterval` from 600 to 1000
  - 0 new winners but you expected some → check `ad_alerts_sent` for already-marked rows; the diff dedupes
- **DON'T BREAK:**
  - `executeOnce: true` on `Prepare Per-Winner Items` — without it, the code node fires 3 times (once per fetch convergence) producing duplicate Discord posts
  - The `$('Prepare Per-Winner Items').item.json` reference in Mark Alert Sent — required because Post Discord replaces `$json` with the Discord response
  - The `_webhook_url` embedded in each item — passing it via data lineage (not via `$('Fetch Discord Webhook')`) is what makes n8n's expression checker happy across the multi-branch fan-in
  - `resolution=ignore-duplicates` on Mark Alert Sent — safety net for re-runs

---

## § 3. Database Contract

The pipeline reads/writes these tables. Don't rename columns or change types without updating every consumer.

### `brands`

| column | type | written by | read by |
|---|---|---|---|
| `id` (PK) | bigint | Add Brand Form | everyone (foreign key to ads.brand_id) |
| `name` | text | Add Brand Form, Brand Pull v2 (rename) | display only |
| `gethookd_brand_id` | bigint | Add Brand Form (parsed from URL) | Brand Pull v2 (Fetch Brand → state) |
| `monitor_since_date` | date | Add Brand Form | Brand Pull v2 Init State (default cutoff) |
| `status` | text (`active`/`paused`/`archived`) | Add Brand Form, manual | Daily Orchestrator filter, v_winner_candidates filter |
| `last_full_pull_at` | timestamptz | Brand Pull v2 (Mark Brand Done) | observability only |
| `slug` | text | Add Brand Form, Brand Pull v2 rename | display only |

Unique constraint: `brands_name_key` on `name` (causes placeholder rename collisions — gotcha 8)

### `ads`

| column | notes |
|---|---|
| `id` (PK) | = GetHookd ad id (bigint). Upsert key. |
| `external_id` | GetHookd's external_id string. Used by `ad_alerts_sent` for dedup. |
| `brand_id` | FK → brands.id (our internal id) |
| `start_date` | the date the ad started running on Facebook |
| `days_active` | from GetHookd. Freezes after pull unless we re-fetch. |
| `performance_score` | from GetHookd. Same caveat. |
| `active_in_library` | 0/1/null. Alerts filter requires `= 1` — NULL fails. |
| `updated_at` | stamped by Brand Pull v2 every upsert |
| (plus 30+ other ad metadata fields) | not load-bearing for alerts |

### `ad_alerts_sent`

| column | notes |
|---|---|
| `ad_external_id` | unique with `alert_channel` |
| `alert_channel` | always `'discord'` for this pipeline |
| `canonical_brand_id` | mirrors `brands.id` |
| `days_active_at_alert`, `performance_score_at_alert`, `share_url` | snapshot at alert time |
| `sent_at` | NOW() default |

Used purely for idempotency. Never deleted by the pipeline (delete manually if you want to re-alert).

### `v_winner_candidates` (view)

```sql
SELECT * FROM v_ads_with_canonical_brand
WHERE canonical_brand_status = 'active'
  AND start_date >= COALESCE(canonical_monitor_since_date, '1970-01-01'::date);
```

Note: the view does NOT filter by `days_active` or `performance_score`. The alerts workflow's `Fetch Winners` HTTP query applies those filters at request time. Don't move that filter into the view without updating the workflow.

### `app_settings`

Key/value store. Only key used here: `winning_alerts_webhook` (value = Discord webhook URL). **Never paste the webhook URL into code or workflow JSON** — read it via Fetch Discord Webhook every run.

---

## § 4. External Dependencies

### GetHookd API

- **Base:** `https://app.gethookd.ai/api/v1`
- **Auth:** `Authorization: Bearer <GETHOOKED_API_KEY>` (env var or n8n Header Auth credential)
- **Endpoints in use:**
  - `GET /authcheck` — free probe to verify token
  - `GET /brandspy/{brand_id}?status=active&per_page=25&page=N` — the main pull endpoint
- **Response shape for `/brandspy/{brand_id}`:**
  ```
  { errors, data: { brand_name, active_ads, ads: { data: [...], current_page, last_page, total } }, used_credits, remaining_credits }
  ```
  Ads are nested two levels deep (`data.ads.data`). Pagination meta lives at `data.ads.{current_page,last_page,total}`.
- **Cost:** 0.01 credits per item returned
- **Rate limits:** 5 req/sec, 300 req/min, 5000 req/hour
- **Token rotation:** if `/authcheck` returns "Invalid or expired token", rotate via GetHookd dashboard, then update n8n's Header Auth credential AND `.env.local` (the env copy may be a backfill key for manual scripts)

### Supabase

- **Project:** `fliqklclucdhjemdjatr`
- **REST base:** `https://fliqklclucdhjemdjatr.supabase.co/rest/v1`
- **n8n credential:** "Supabase account" (predefined type `supabaseApi`)
- **Manual script env vars (in `.env.local`):** `AD_INTEL_SUPABASE_URL`, `AD_INTEL_SUPABASE_KEY` (service role) — used for ad-hoc backfills
- **Upsert pattern:** POST with `Prefer: resolution=merge-duplicates` matches against the primary key (`id` for `ads`, `id` for `brands`)

### Discord webhook

- Read from `app_settings.winning_alerts_webhook` on every alerts run — never hardcoded
- **Rate limit:** 5 requests per 2 seconds per webhook
- **Embed limits:** max 10 embeds per message, 6000 char total across all embeds
- Alerts workflow throttles via HTTP node's `batching.batchInterval: 600` ms = ~1.6 req/sec

---

## § 5. Filter Logic — Three Filters, Easy to Confuse

| filter | where it's set | where it's applied | effect of tightening | effect of loosening |
|---|---|---|---|---|
| `monitor_since_date` | per brand (form input → `brands.monitor_since_date`) | Brand Pull v2 `Extract Ads` (skips ads with `start_date < cutoff`) AND `v_winner_candidates` view | Fewer ads ever enter the system for this brand | More historical ads pulled, more API credits spent |
| `pull_since_date` | per run (Daily Orchestrator passes `today - 1`) | Brand Pull v2 `Init State` overrides `monitor_since_date` for this run; `Extract Ads` triggers early-stop when whole page is below | Faster daily runs, only catches very-fresh ads | Slower daily runs, may overlap with previous days' work |
| **Winner threshold** | hardcoded in alerts workflow's `Fetch Winners` HTTP query: `days_active >= 10 AND performance_score >= 50 AND active_in_library = 1` | At Supabase query time | Fewer Discord posts, higher quality | More posts, includes ads that haven't proven themselves |

**Critical:** `monitor_since_date` is a brand-level configuration the user sets once. `pull_since_date` is a per-run override that only the daily cron uses. They should never both be in the request body — only one or the other.

---

## § 6. Known Gotchas (battle-tested 2026-05-13)

1. **MCP `update_workflow` regenerates node IDs.** Every push strips the Supabase / Header Auth credential bindings on HTTP nodes. After every MCP update + publish, open each HTTP node in the n8n UI and re-select the credential. Affects: Brand Pull v2 (5 nodes), Alerts (4 nodes), Daily Orchestrator (1 node).

2. **Schedule triggers default to UTC.** Set node-level `Timezone` to `America/New_York` on the Daily 8:30 AM ET schedule trigger. Otherwise cron `30 8 * * *` runs at 4:30 AM ET, not 8:30.

3. **`/brandspy` vs `/explore` response shapes differ.** `/brandspy` returns ads nested at `data.ads.data`. `/explore` returns them at `data`. Brand Pull v2's `Extract Ads` handles both, but if you swap endpoints, re-verify the path.

4. **HTTP Request overwrites `$json`.** A downstream Code/HTTP node trying to read fields from the upstream item must use `$('Upstream Node').item.json.fieldName`. We hit this on Mark Alert Sent (after Post Discord overwrote `$json` with Discord's response).

5. **Multi-input fan-in fires a node N times.** When three nodes connect to one Code node, it runs three times unless `executeOnce: true` is set. Caused duplicate Discord posts in early Alerts iterations. Apply `executeOnce: true` on the convergence Code node, or use a single Merge Triggers code node upstream.

6. **n8n editor drag-drop silently rewires nodes.** While editing `Set Test Inputs` parameters once, the connection got dragged from `Set Test Inputs → Fetch Brand` to `Set Test Inputs → Init State`, skipping the brand lookup. Always glance at the canvas after parameter edits.

7. **GetHookd `/explore` rejected `start_date_from`** with "Unrecognized parameter". The correct param is `start-date` (hyphen) and it requires a paired `end-date`. We chose to stay on `/brandspy` and use client-side cutoff instead, but if you ever switch to `/explore`, that's the right param name.

8. **Placeholder rename collides with existing brand name.** Brand Pull v2's `Update Brand Name` patches the row only when `name LIKE 'Pending%'`. If the user re-submits the form for an already-existing brand, the placeholder rename can hit the unique constraint on `name`. Fix: delete the empty placeholder row or rename the conflicting brand.

9. **`active_in_library IS NULL` rows can't be winners.** Legacy ads from older ingestion paths have NULL — the alerts filter is `eq.1`, NULL fails. Fresh `/brandspy` pulls populate the column correctly. Backfill with a SQL update if you need to clean up.

10. **Discord 429 with N per-item posts × multiple brands.** Daily orchestrator may trigger several brand-specific alert runs in quick succession. The HTTP node's `batching: { batchSize: 1, batchInterval: 600 }` paces requests to ~1.6/sec. If you see 429s, raise the interval to 1000+.

---

## § 7. Recovery Procedures

| symptom | diagnosis | fix |
|---|---|---|
| Cron didn't fire (no `brands.last_full_pull_at` update overnight) | Workflow not published, or timezone misconfigured, or schedule trigger missing | n8n UI → open Daily Brand Pull → confirm "Active" toggle is green → publish if needed → confirm schedule node timezone = `America/New_York` |
| Pull stuck on one brand | Likely `Update Brand Name` collision (placeholder name matches existing brand) | Run `SELECT id, name FROM brands WHERE gethookd_brand_id = <X>` — if two rows exist, delete the empty placeholder; the next run will succeed |
| Alerts not firing despite winners present | Webhook URL missing OR credentials unbound on Fetch* nodes | Run `SELECT value FROM app_settings WHERE key='winning_alerts_webhook'` — must return a Discord URL. In n8n, open Alerts workflow → rebind credentials on Fetch Winners / Fetch Already-Sent IDs / Fetch Discord Webhook / Mark Alert Sent |
| Duplicate Discord posts for the same ad | `Mark Alert Sent` failed silently (no row in `ad_alerts_sent`) | Check `ad_alerts_sent` rows for the brand — if missing, the upsert errored. Re-bind Supabase credential on Mark Alert Sent. The new run will re-post but `resolution=ignore-duplicates` keeps the table clean |
| "Brand not found" in Brand Pull v2 | Wire from `Set Test Inputs` skips `Fetch Brand`, OR brand_id doesn't exist | Open Brand Pull v2 in n8n → confirm wire goes Set Test Inputs → Fetch Brand → Init State. If broken, re-drag. Otherwise `SELECT * FROM brands WHERE id = <X>` to confirm row exists |
| All credentials wiped after MCP push | Expected behavior — MCP regenerates node IDs | Open each HTTP node listed in the MCP push response's `note` field → Credential → select existing credential |
| Smooche has 0 winners but should | `active_in_library = NULL` on legacy rows | Re-pull Smooche via Brand Pull v2 manually (Set Test Inputs brand_id=1, max_pages=50, Manual Test) — fresh pulls populate `active_in_library` from GetHookd response |

---

## § 8. Workflow IDs (cheat-sheet)

```
Add Brand Form                   FsYIjP0QZZBBYZlm
Brand Pull v2 (by ID)            skDkD5b9Rf9gQ4Gr
Daily Brand Pull (8:30 AM ET)    nlQqFFXYRJo9eOP9
Competitor Winner Alerts         Sekmk7nuEK37l2Hw
```

URL prefix: `https://thermoslim123.app.n8n.cloud/workflow/<id>`

---

## § 9. Quick health checks

These are SQL queries you can paste into Supabase SQL editor (or pipe via psql) for fast orientation.

```sql
-- Did the cron fire in the last 26h?
SELECT id, name, last_full_pull_at,
       NOW() - last_full_pull_at AS age
  FROM brands
 WHERE status = 'active'
 ORDER BY last_full_pull_at NULLS FIRST;

-- How many May ads per brand and how many qualify as winners?
SELECT b.id, b.name,
       COUNT(*) FILTER (WHERE a.start_date >= b.monitor_since_date) AS in_window,
       COUNT(*) FILTER (WHERE a.days_active >= 10
                         AND a.performance_score >= 50
                         AND a.active_in_library = 1
                         AND a.start_date >= b.monitor_since_date) AS winners_now
  FROM brands b LEFT JOIN ads a ON a.brand_id = b.id
 WHERE b.status = 'active'
 GROUP BY b.id, b.name ORDER BY b.id;

-- Alerts sent today
SELECT canonical_brand_id, COUNT(*) AS sent_today
  FROM ad_alerts_sent
 WHERE alert_channel = 'discord' AND sent_at::date = CURRENT_DATE
 GROUP BY canonical_brand_id;

-- Tomorrow's queue (day-9 ads that flip to winners overnight)
SELECT b.name, COUNT(*) AS day_9_ads
  FROM ads a JOIN brands b ON b.id = a.brand_id
 WHERE a.days_active = 9 AND a.performance_score >= 50 AND a.active_in_library = 1
 GROUP BY b.name ORDER BY day_9_ads DESC;
```
