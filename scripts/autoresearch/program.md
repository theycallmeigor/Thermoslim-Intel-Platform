# Research Direction

Optimize anomaly detection for the ThermoSlim e-commerce platform.

## Context
- 80 days of DailySnapshot data (Jan-Mar 2026)
- ~25 orders/day average, growing over time
- Weekend volumes are similar to weekdays (no significant weekend drop)
- Multiple channels: direct, cc_onetime, cc_new_sub, cc_recurring
- Key funnels: checkout2, and others

## Goals
1. Maximize catch rate - never miss a real anomaly
2. Minimize false alarms - especially on weekends and holidays
3. Explore whether splitting baselines by weekday/weekend helps
4. Try different lookback windows - shorter might catch sudden changes faster
5. Consider whether median is more robust than mean for small sample sizes

## Constraints
- Prefer fewer false alarms over catching every edge case
- A config that fires >3 alerts per day on average is too noisy
