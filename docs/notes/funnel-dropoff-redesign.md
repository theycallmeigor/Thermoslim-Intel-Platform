# Funnel Drop-off Redesign — Stitch Design Reference

## Design: "Obsidian Architect" branching funnel flow

Reference files: `/Users/igordviniatin/Downloads/stitch (2)/`
- `screen.png` — visual mockup
- `code.html` — full HTML/Tailwind implementation
- `DESIGN.md` — design system doc

## Key UI Patterns to Implement

1. **SVG path connections** between nodes (accept = green curve, decline = red curve, drop-off = dashed gray)
2. **Node cards** with: label (Entry/Upsell/Downsell), title, reach count, accept/conversion %
3. **Branching layout** — accept path goes up/forward, decline path goes down to downsell
4. **Color system**: primary (#c0c1ff), secondary/accept (#4edea3), tertiary/decline (#ff5451), surface layers
5. **Bottom section**: Revenue Breakdown by Node, AOV Velocity by path length

## Data Sources (already populated)
- FunnelEvent table (1,500 records) — per-page accept/decline
- UpsellPath table (1,494 records) — upsell count + revenue per order
- Funnel config (src/config/funnel-config.ts) — page structure

## Implementation Notes
- Use absolute positioning for nodes on a scrollable canvas
- SVG curves for connections (Bezier paths)
- Each node reads from FunnelEvent grouped by step name
- Downsell nodes offset vertically below the main flow
- Client component needed for interactivity (expand nodes, hover tooltips)
