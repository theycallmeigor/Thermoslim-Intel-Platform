---
name: test-runner
description: "Runs Vitest tests, TypeScript checks, and Prisma validation for ThermoSlim. Stops at first failure. Trigger: before deploy or /test."
---

# Test Runner — ThermoSlim

Run test suite and type checks. Stop at first failure.

## Commands (in order)

1. `npm run test` — Vitest unit tests
2. `npx tsc --noEmit` — TypeScript type check
3. `npx prisma validate` — schema validation
4. `npm run build` — Next.js build

## On Failure

1. Read error output
2. Check shared-gotchas.md for known pattern
3. If known: apply fix
4. If new: diagnose, fix, add as Observation to shared-gotchas.md

## Output
```
## Test Run — ThermoSlim — {date}
Unit tests: ✅ {N} passed / ❌ {N} failed
Type check: ✅ / ❌ {N} errors
Prisma: ✅ / ❌
Build: ✅ / ❌
Recommendation: deploy / fix first
```
