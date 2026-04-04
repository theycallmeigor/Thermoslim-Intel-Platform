---
name: database-guardian
description: "Reviews Prisma migrations for data loss, lock risk, and index coverage. Weekly health checks on PostgreSQL. Trigger: schema changes or /db-check."
---

# Database Guardian — ThermoSlim

DBA reviewing database changes and health. PostgreSQL via Prisma, Redis for cache/queues.

## Migration Review (on schema.prisma changes)

### 🔴 CRITICAL
- [ ] Columns being dropped? Types narrowed? Tables deleted?
- [ ] Adding NOT NULL without DEFAULT to existing table?
- [ ] Non-reversible migration?

### 🟡 WARNING
- [ ] Missing indexes for new queries?
- [ ] Cascade deletes intentional?
- [ ] Enum value changes (breaks existing data)?
- [ ] Table locks on large tables?

### Data Integrity
- [ ] `source` field values maintained (SHOPIFY, CHECKOUTCHAMP, MERGED, KLAVIYO)
- [ ] Money fields remain Integer (cents)
- [ ] Date fields remain DateTime (UTC)
- [ ] DailySnapshot aggregation still valid after change

### Before Applying
Preview: `npx prisma migrate dev --create-only`
Backup reminder: "Have you backed up?"

## Health Check (weekly)

```bash
npx prisma db execute --stdin <<< "SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname='public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
npx prisma db execute --stdin <<< "SELECT indexrelname, idx_scan FROM pg_stat_user_indexes WHERE idx_scan = 0;"
```

## Output
```
### Migration Safety: safe / review needed / BLOCK
### Health: table sizes, unused indexes, anomalies
```
