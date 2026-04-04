# Phase 5: Loop Integration — Deep Risk Audit & Edge Case Discovery

## Your Role

You are the risk analyst for the ThermoSlim Commerce Intelligence Platform. Your job is to find every edge case, gotcha, and unanswered question that could cause data integrity issues, silent failures, or require rework if discovered after the Loop adapter is built.

You are NOT writing code. You are producing a comprehensive risk register and question list.

## Context

Phases 1-4 produced: a 170-article knowledge base, API/webhook catalog, analytics audit, and integration spec. The architecture decision is locked: Loop writes Subscription + SubscriptionEvent records only, never Orders. But we need to stress-test this decision against real-world edge cases.

## Input — Read All

```
docs/integrations/loop-subscriptions/
├── knowledge-base/ (170 articles across 15 collections)
├── api-reference.md
├── webhook-catalog.md
├── data-model.md
├── subscription-lifecycle.md
├── analytics-audit.md
└── integration-spec.md
```

Also read from the Obsidian vault at `/Users/igordviniatin/Vaults/CROMaxLabs/thermoslim-platform/`:
```
adapters/Loop Subscriptions Adapter.md
adapters/loop/integration-decision.md
adapters/loop/analytics-audit.md
lessons/Gotchas.md
lessons/Pain Points.md
lessons/Future Risk Areas.md
```

## Research Tasks

### 1. Webhook Reliability & Ordering (CRITICAL)

Research from the Loop knowledge base and developer hub:

- What is Loop's webhook retry policy? How many retries, over what time window?
- Can webhooks arrive out of order? (e.g., `order.processed` before `subscription.created`)
- What happens if our endpoint returns 500? Does Loop queue or drop?
- Is there a webhook event log in Loop admin where Nico can see delivery status?
- Can the same webhook fire twice? Under what conditions?
- What's the payload size limit? Could a subscription with 10+ line items exceed it?
- Is there a webhook test/replay feature in Loop admin?

### 2. Subscription State Machine Edge Cases

Research every state transition that could break our status mapping:

- **Pause during dunning:** Customer pauses while in RECYCLE_BILLING. Which webhook fires? Does Loop allow this?
- **Cancel during pause:** Customer cancels while paused. Does Loop fire `subscription.cancelled` with fromStatus=PAUSED?
- **Reactivate after expire:** Can an EXPIRED (COMPLETE) subscription be reactivated? Or is it terminal?
- **Multiple cancellations:** Can a subscription receive `subscription.cancelled` twice? (e.g., customer cancels, then Loop's dunning also fires cancel)
- **Immediate cancel after create:** Customer subscribes and cancels within minutes. Do we get `subscription.created` then `subscription.cancelled` or could they merge?
- **Swap product mid-subscription:** Customer swaps from Product A to Product B via Loop portal. Is this `subscription.updated` or a new subscription?
- **Frequency change:** Customer changes from monthly to quarterly. Is this `subscription.updated`? Does it change the selling plan ID?
- **Gift subscription lifecycle:** Does a gift sub follow the same state machine or have special events?
- **Prepaid subscription:** A 3-month prepaid sub — does it fire `order.processed` once (upfront) or 3 times?
- **Merge subscriptions:** Loop has a "merge subscriptions" feature. What events fire when two subs are merged into one?

### 3. Billing & Revenue Edge Cases

- **Partial payment:** `order.partiallyProcessed` — what does "partial" mean? Partial items? Partial dollar amount?
- **Order skip then unskip:** Customer skips, then unskips. Net effect should be zero. Does `order.unskipped` restore the original `nextBillDate`?
- **Double billing:** Can Loop accidentally bill twice in one cycle? How is this handled?
- **Refund via Loop:** If a refund is processed through Loop (not Shopify admin), does Loop fire a webhook? Or does only Shopify's refund event fire?
- **Price change:** If the subscription price changes (e.g., merchant increases price), does Loop fire `subscription.updated` with the new price? Or is there a separate event?
- **Discount applied/removed:** Subscription discounts — do they fire events? Can they change `recurringPrice` mid-cycle?
- **Currency:** Does Loop support multi-currency? If the store is USD-only, can we assume all amounts are USD?

### 4. Customer Identity Edge Cases

- **Customer email change:** If a Shopify customer changes their email, does Loop's webhook still reference the old email? How do we maintain the join?
- **Multiple subscriptions per customer:** Customer has 3 active subscriptions. Are they 3 separate Subscription records? Do they share a customer ID?
- **Guest checkout subscription:** Can someone subscribe without a Shopify account? How does customer identity work?

### 5. Product & Selling Plan Edge Cases

- **Product deleted from Shopify:** Subscription exists but product is removed from Shopify. What does Loop do? Does the subscription continue?
- **Variant change:** Customer swaps to a different variant of the same product. Is this `subscription.updated`?
- **Selling plan deleted:** What happens to subscriptions on a selling plan that gets deleted in Loop admin?
- **Trial detection:** How exactly to detect trials? Is it `selling_plan.trialDays > 0`? Or is there a separate field? What about "$0 first order" trials vs "free trial" trials?

### 6. Migration & Backfill Risks

- **Historical data depth:** When we first sync via `GET /subscriptions`, do we get full history or just current state?
- **Cancelled subscription history:** Can we pull subscriptions that are already cancelled? Or does the API only return active/paused?
- **Event history via API:** Is there an endpoint for historical billing attempts per subscription? Or do we only get events going forward via webhooks?
- **Rate limits:** What are the API rate limits for `GET /subscriptions`? If there are 5,000 subscriptions, can we backfill in one run?
- **Pagination:** How does Loop paginate? Cursor-based or page-based? What's the max page size?

### 7. Integration Architecture Risks

- **Webhook + API race condition:** A webhook arrives for a subscription we haven't pulled yet via API. Do we create the Subscription on webhook, or reject and wait for the next sync?
- **Shopify order ID linkage:** The integration spec says `order.processed` may include the Shopify order ID. If it DOESN'T, how do we link a Loop billing event to the Shopify order it created? This is critical for the "Loop never writes Orders" constraint.
- **Deduplication key:** We plan to use `loopSubscriptionId` as the dedup key. Is this truly unique and immutable? Can it change?
- **Clock skew:** If Loop's timestamps and our server's timestamps differ, could we miss events in the "since last sync" window?

### 8. Operational Risks for Nico

- **Webhook registration:** Is webhook registration done via API or only via Loop Admin UI? Can we automate it?
- **API token rotation:** Do Loop API tokens expire? If so, how do we handle rotation without downtime?
- **Loop outage impact:** If Loop goes down, do we lose data? Or does Loop replay events after recovery?
- **HMAC secret rotation:** If the webhook secret changes, is there a grace period where both old and new secrets are valid?

## Output Format

Produce a single file: `docs/integrations/loop-subscriptions/risk-audit.md`

Structure it as:

```markdown
# Loop Integration Risk Audit

## Critical Risks (must resolve before build)
[numbered list with: risk, impact, question to answer, who answers it]

## High Risks (must resolve before production)
[same format]

## Medium Risks (should resolve, can work around)
[same format]

## Low Risks (nice to know)
[same format]

## Updated Questions for Nico
[consolidated list of ALL questions Nico needs to answer, organized by where he finds the answer]

## Edge Cases to Test
[concrete test scenarios for the adapter, derived from the risks above]
```

## Rules

- Do NOT guess answers. If the knowledge base doesn't cover it, say "UNKNOWN — requires API exploration" or "UNKNOWN — ask Loop support"
- For each risk, state the IMPACT if it's not handled (data corruption? silent miss? revenue discrepancy?)
- Prioritize by blast radius: risks that affect ALL subscriptions > risks that affect edge cases
- Cross-reference against `lessons/Gotchas.md` — we've been burned before by similar issues with CheckoutChamp
