# Loop Integration — Pre-Build Gotchas
**Created:** 2026-03-30
**Status:** Unresolved — review before building adapter

---

## 1. Shopify Order ID Linkage (CRITICAL)
The entire architecture relies on Loop never writing Orders. But we need to link Loop billing events (`order.processed`) to the Shopify order they created. If the webhook payload doesn't include `shopify_order_id`, we have no way to connect a Loop billing event to its Shopify order.

**Impact:** Billing cycle counts drift from actual order counts. Can't validate billing → order linkage. MRR vs revenue disagreement.
**Ask Nico:** "Does the `order.processed` webhook payload include `shopify_order_id`?"

## 2. Subscription Created Before Customer Exists
Loop's `subscription.created` webhook references a customer by email. If the Shopify adapter hasn't synced that customer yet, the Subscription insert fails (FK constraint on `customerId`).

**Fix:** Upsert customer on webhook arrival — create from email if not found.

## 3. Price in Dollars vs Cents
Loop sends prices as decimal strings (e.g., `"49.99"`). DB stores cents as integers. Floating point: `49.99 * 100 = 4998.999...` truncates to 4998 instead of 4999.

**Fix:** Always use `Math.round(parseFloat(price) * 100)`, never `parseInt`.

## 4. Prepaid Subscriptions Break MRR Math
A 3-month prepaid subscription pays upfront. Loop might fire one `order.processed` for the full amount. `toMonthlyMrr()` divides by frequency months — if `recurringPrice` is the full prepaid amount and frequency isn't set correctly, MRR is wildly inflated.

**Ask Nico:** "Do you sell prepaid subscriptions? If so, what does the billing event look like?"

## 5. Merge Subscriptions = Data Chaos
Loop has a "merge subscriptions" feature. Two subs become one. Old subscription records need handling — cancel? Archive? Billing cycle count resets? Cohort assignment breaks.

**Ask Nico:** "Do you use Loop's merge subscriptions feature?"

## 6. CC Subscription Data Overlap
CheckoutChamp subscriptions already exist in the `Subscription` table. Some might be the same subscriptions that exist in Loop (migrated or dual-tracked). Risk of duplicate subscription records.

**Ask Nico:** "Are any subscriptions tracked in BOTH CheckoutChamp and Loop? Or is Loop the sole subscription platform?"

## 7. Webhook Secret Exposure
CC webhook uses secret-in-URL pattern (visible in Vercel logs, browser history). HMAC validation is much safer for Loop.

**Ask Nico:** "Does Loop support HMAC webhook signatures? What's the verification mechanism?"

## 8. Merge Script Must Run First
~1,338 unmerged CC orders. If Loop billing events reference Shopify orders that should be MERGED but aren't, subscription-to-order linkage is inconsistent. Run merge script BEFORE starting Loop adapter.

**Action:** Run `scripts/merge-existing-duplicates.ts` on prod before Loop build.

## 9. Clock/Timezone on nextBillDate
Loop stores dates in UTC but merchants think in local time. `nextBillDate` of `2026-04-01T00:00:00Z` in EST = 8pm March 31. The "Tomorrow" rebills preset could show the wrong day.

**Fix:** Document timezone handling. Consider store timezone offset in date display.

## 10. Gift Subscriptions Inflate Churn
Gift subscriptions expire naturally (gift period ends). Loop fires `subscription.expired`. If counted in churn analytics, churn rate is inflated by gift expirations that aren't customer dissatisfaction.

**Ask Nico:** "Do you sell gift subscriptions? How many per month?"

---

## Consolidated Questions for Nico

### From Original 5 (Phase 4)
1. Loop API v2 base URL?
2. Auth header — `X-Loop-Token` or `Authorization: Bearer`?
3. Webhook HMAC signature — algorithm and secret?
4. Does `order.processed` payload include Shopify order ID?
5. How to detect trial subscriptions from selling plan attributes?

### From Gotcha Analysis (Phase 5)
6. Do you sell prepaid subscriptions? What does the billing event look like?
7. Do you use Loop's merge subscriptions feature?
8. Are any subscriptions tracked in BOTH CC and Loop, or is Loop the sole sub platform?
9. Do you sell gift subscriptions? How many per month?
10. Approve running merge script on prod before Loop build?

### Pending Gemini Deep Research
Run `gemini -p gemini-prompts/loop-phase5-deep-risk-audit.md` to discover additional risks from the 170 knowledge base articles.
