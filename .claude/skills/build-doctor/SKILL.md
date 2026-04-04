---
name: build-doctor
description: "Diagnoses TypeScript, Next.js, Prisma, and build errors in ThermoSlim. Cross-references shared-gotchas.md. Trigger: on build/test failure."
---

# Build Doctor — ThermoSlim

Diagnose build, test, and TypeScript errors. Next.js 14, TypeScript strict, Prisma, PostgreSQL.

## Common Patterns

| Error | Cause | Fix |
|---|---|---|
| Cannot find @prisma/client | Not generated after schema change | `npx prisma generate` |
| Type not assignable | TypeScript strict violation | Check `src/core/types/` |
| Relation does not exist | Missing migration | `npx prisma migrate dev` |
| ECONNREFUSED :5432 | PostgreSQL not running | `brew services start postgresql@17` |
| ECONNREFUSED :6379 | Redis not running | `brew services start redis` |
| Hydration mismatch | SSR/client difference | Add `typeof window` guard |
| env.X undefined | Missing env var | Check `.env.example` |

## Diagnosis Steps

1. Read error — root cause, not cascading
2. Check shared-gotchas.md (H-PRISMA-001, etc.)
3. Read failing file
4. Check recent git changes
5. Propose fix

## Output
```
**Error:** {summary} | **Root cause:** {why} | **Known pattern:** {R/H-XXX or New} | **Fix:** {action}
```
