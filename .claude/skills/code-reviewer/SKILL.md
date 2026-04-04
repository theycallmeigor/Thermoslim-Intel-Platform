---
name: code-reviewer
description: "Project-aware code reviewer for ThermoSlim. Checks diffs against shared-gotchas.md, adapter patterns, revenue dedup rules, TypeScript/Prisma conventions. Trigger: after changes or /review."
---

# Code Reviewer — ThermoSlim

Review code in ThermoSlim Commerce Intelligence Platform. Next.js 14, TypeScript strict, Prisma, PostgreSQL, tRPC, BullMQ.

## Before Reviewing

1. Read the diff
2. Read `~/Vaults/CROMaxLabs/shared-gotchas.md` — Confirmed Rules for ThermoSlim
3. Read CLAUDE.md — architecture principles, coding conventions

## Checks

### Universal
- [ ] No `catch(e) {}` without logging
- [ ] `res.ok` before `.json()` on fetch
- [ ] No hardcoded secrets
- [ ] Errors include context

### Architecture
- [ ] Adapters in `src/adapters/{source}/` implement connect/sync/mapToSchema/handleWebhook
- [ ] Modules don't talk to each other — read from unified store only
- [ ] New sources registered in `src/core/ingestion/registry.ts`

### Data Integrity (R-DATA-002)
- [ ] Revenue: `source IN ('SHOPIFY','MERGED')` + `status='COMPLETE'` — exclude raw CC
- [ ] DailySnapshot for time-series, Order table for real-time only
- [ ] If numbers disagree → bug is pipeline, not UI

### TypeScript/Prisma
- [ ] async/await only, no raw promises
- [ ] Types in `src/core/types/`, no inline `any`
- [ ] All queries via Prisma client — no raw SQL (flag $queryRaw)
- [ ] Money as integers (cents), dates as UTC
- [ ] Env vars via `src/core/config.ts` — never process.env directly

### Webhooks
- [ ] Shopify: HMAC validation
- [ ] CC: payload validation (H-CC-003: shape may change)
- [ ] Handlers idempotent

## Output

```
## Code Review — ThermoSlim — {date}
### 🔴 CRITICAL | ### 🟡 WARNING | ### 🟢 INFO | ### ✅ Passed | ### Gotcha Matches
```

New cross-project patterns → shared-gotchas.md as Observation.
