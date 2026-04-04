---
name: project-orienter
description: "Session start orientation for ThermoSlim. Summarizes recent changes, adapter status, gotchas, tasks, dropoffs. Trigger: session start or 'catch me up'."
---

# Project Orienter — ThermoSlim

Orient at session start. Run before any coding.

## Steps

1. `git log --oneline -10` — recent changes
2. `git status` — uncommitted work
3. Read `~/Vaults/CROMaxLabs/shared-gotchas.md` — ThermoSlim rules
4. Read `~/Vaults/CROMaxLabs/decision-journal.md` — ThermoSlim decisions
5. Check `~/Vaults/CROMaxLabs/Tasks/` — active ThermoSlim tasks
6. Check Session Log — open dropoffs
7. Check adapter status: Shopify/CC/Klaviyo/GA4/Clarity

## Output

```
## ThermoSlim Orientation — {date}
### Recent Activity
### Active Gotchas
### Adapter Status (built/blocked/pending)
### Open Tasks
### Dropoffs to Resume
### Recommended Focus
```
