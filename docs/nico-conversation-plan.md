# Conversation Plan: Nico Meeting
**Prep date:** 2026-03-30

---

## Context
Igor is solo dev, baby coming end of April. There are **8 client action items** across multiple systems — Nico needs to unblock them. The platform went from 2 pages to 17 this week. The goal of this meeting is: show momentum, get blockers unblocked, align on what matters before Igor's availability drops.

---

## 1. OPEN: Demo the Platform (3 min)

**Design note:** UI mockups were prototyped in Google Stitch before implementation. Stitch exports (HTML + screenshots) are in `docs/design/stitch-export/stitch/` for 5 screens:
- `dashboard_home` — main dashboard layout
- `customer_360_page` — customer detail view
- `order_detail_page` — order detail panel/page
- `upcoming_rebills` / `upcoming_rebills_dashboard` — rebills views

These informed the final implementation. Show Nico both the Stitch mockups and the working app if you want to demonstrate the design → code pipeline.

Pull up `localhost:3000/dashboard` and click through the sidebar.

**Click path:**
1. Dashboard → point out churn rate KPI (new), subscriber activity chart
2. Subscriptions → Churn Analytics → show billing cycle milestone chart ("we can see customers cancel mostly after cycle 1 — that's your retention problem")
3. Subscriptions → Cohort Retention → show retention curves + LTV columns
4. Operations → Ingestion Health → "the platform monitors its own data pipeline"
5. Operations → Order QA → "this flags data quality issues automatically"

**Script:** "We went from 2 pages to 17 this week. Every metric uses a single revenue definition — numbers can't disagree between pages. Loading skeletons, browser titles, the whole shell is production-grade."

---

## 2. CLIENT ACTION ITEMS — The Blockers (5 min)

There are **8 things only Nico or his team can do.** Go through them in priority order:

### Critical (blocking entire feature categories)

| # | What Nico Does | What It Unlocks | Time for Nico |
|---|----------------|-----------------|---------------|
| 1 | **Run merge script on prod** — approve running `merge-existing-duplicates.ts` during off-hours | Fixes ~1,338 duplicate orders, corrects revenue accuracy | 5 min (approve + schedule) |
| 2 | **Loop API: answer 5 questions** — log into Loop admin → Settings → API tokens | Subscription lifecycle analytics (churn reasons, payment recovery, cohort retention with real data) | 15 min |
| 3 | **CC static IP whitelisting** — approve $15/mo QuotaGuard add-on, then whitelist the IP in CC admin | Production CC data syncing (currently only works in dev) | 10 min |
| 4 | **Klaviyo private API key** — Settings → API Keys → Create Private Key (Read access) | Email campaign dashboards, flow analytics, subscriber engagement | 5 min |
| 5 | **GA4 service account** — share GA4 property access (Viewer role) + send JSON credentials + property ID | Traffic analytics, landing page performance, conversion funnels | 15 min |
| 6 | **CC webhook profiles** — configure 6 event types in CC admin (I have a step-by-step doc, or I can do it with admin access) | Real-time CC order flow (currently batch-only) | 15 min |

### AI Tooling — Non-Negotiable for Development Speed

| # | What Nico Approves | Why |
|---|---|---|
| 7 | **Claude Max (x20 or minimum x5)** | This is the primary development engine. Every page, every adapter, every data pipeline — built with Claude Code. x5 is functional but x20 eliminates rate limit interruptions during sprint sessions. The platform went from 2 to 17 pages in one week because of this tool. Losing access or downgrading = development stops. |
| 8 | **Google AI (Gemini CLI)** | Handles all research — Loop's 170 help articles were crawled, API catalogs built, analytics audits written entirely by Gemini. Also used for market research and competitor intelligence. |
| 9 | **ChatGPT account** | Reference and cross-validation. Used for quick lookups, API doc interpretation, and second opinions on architectural decisions. |

**Script:** "The AI accounts aren't optional tooling — they're the development team. Claude builds the code, Gemini does the research, ChatGPT is the reference library. Without them there is no development velocity. The x20 Claude plan specifically prevents the rate-limiting that forces 30-60 minute pauses mid-sprint."

### Nice-to-Have (can wait)

| # | What | What It Unlocks |
|---|------|-----------------|
| 10 | **Slack incoming webhook URL** | Real-time Slack alerts for anomalies |
| 11 | **Alert email recipients + SMTP** | Scheduled email alert digests |

**Script:** "I've got 6 things that only you or your team can do. They're all 5-15 minutes each. Once they're done, I can build the Loop adapter, turn on Klaviyo and GA4, and get CC running in production. Right now the platform can't talk to half its data sources because we're missing keys and access."

### Loop — The 5 Questions (have ready to share/print)

1. Loop API v2 base URL
2. Auth header: `X-Loop-Token` or `Authorization: Bearer`?
3. Webhook HMAC signature — algorithm and secret?
4. Does `order.processed` webhook include the Shopify order ID?
5. How to detect trial subscriptions from selling plan attributes?

"Go to Loop admin → Settings → Generate API tokens. The first 2 answers will be right there. For webhooks, their developer docs at help.loopwork.co/developer-hub should have it."

---

## 3. PRIORITIES: What to build next (3 min)

Frame as: "We have 3-4 weeks of solid dev time before baby. Here's what I'd recommend in order:"

**Tier 1 — Immediate (this week)**
1. Run merge script (you approve, I run it — 5 min)
2. Loop adapter (once 5 questions answered — 2-3 sessions)

**Tier 2 — Next 2 weeks**
3. CC webhook profiles (needs admin access)
4. Klaviyo adapter (needs API key — 1-2 sessions)
5. Anomaly tuner applied to production (self-contained, no blockers)

**Tier 3 — If there's time**
6. GA4 + Clarity adapters (needs service account)
7. Funnel analytics page
8. BullMQ job queue dashboard

**Tier 2.5 — Marketing Automation Alerts (ready to build now, data exists):**
These 4 use data already in the platform. No new integrations needed.

| Alert | What It Does | Marketing Action |
|-------|-------------|-----------------|
| **Churn prevention** | Fires when churn rate spikes above baseline | Feed cancel reasons into Klaviyo retention flows |
| **Campaign ROI kill switch** | Flags campaigns that drop >50% from their own baseline | "Pause Campaign X — revenue dropped 60%" |
| **Upsell funnel alert** | Fires when accept rate drops >20% | "Review upsell offer — conversion fell from 15% to 11%" |
| **Rebill failure trigger** | Fires when decline rate spikes >2x average | Auto-trigger "update payment" Klaviyo flow |

All 4 write to the existing Anomaly table — no schema changes. Show up on Ingestion Health page immediately. Slack/email once those are set up.

**Future ideas (not committed):**
- Flawless sync between Loop and ThermoSlim (bidirectional subscription state)
- Ad platform adapters (Meta, Google, TikTok) for true ROAS
- Inventory prediction from subscription renewal dates
- AI daily summaries
- Customer health score
- LTV prediction model
- Email flow performance autopilot (needs Klaviyo)
- Winback campaign auto-segmentation (needs Klaviyo)
- Subscriber engagement scoring (needs Klaviyo + Loop)
- Cohort-based ad audience sync (needs Loop + ad platforms)

**Ask:** "Does this priority order match what matters to you? Anything you'd move up or skip?"

---

## 4. CLOSE: Action Items (1 min)

Read these back and confirm:

**Nico's action items:**
- [ ] Approve merge script execution (this week)
- [ ] Get Loop API answers (5 questions — print and hand over)
- [ ] Approve QuotaGuard ($15/mo) for CC static IP
- [ ] Generate Klaviyo private API key (Read access)
- [ ] Share GA4 service account + property ID
- [ ] CC webhook config (do together or delegate)

**Igor's action items (once unblocked):**
- [ ] Run merge script on prod
- [ ] Build Loop adapter
- [ ] Configure CC webhooks
- [ ] Build Klaviyo adapter
- [ ] Apply anomaly tuner to production

---

## Preparation Checklist

Before the meeting:
- [ ] Dev server running at localhost:3000
- [ ] Print or screen-share the 5 Loop questions
- [ ] Have `docs/superpowers/plans/2026-03-23-cc-webhook-profiles-setup.md` ready to share
- [ ] Have `docs/notes-for-nico.md` ready as leave-behind

## Tips

- **Lead with the demo, not the ask list.** Show 17 pages, earn trust, then ask for 6 things.
- **Don't say "blocked."** Say "I've built everything I can without these — once I have them, the next 5 features unlock immediately."
- **Be specific about Loop.** "Log into Loop admin, go to Settings → API tokens" is better than "can you get me API info."
- **Name the QuotaGuard cost upfront.** $15/mo is nothing but surprise costs annoy clients.
- **Baby timeline is leverage, not weakness.** "I want to get the high-value stuff done while I'm fully available" creates urgency.
