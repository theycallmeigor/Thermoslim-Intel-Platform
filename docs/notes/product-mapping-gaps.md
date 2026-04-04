# Product Mapping Gaps — 2026-04-04

## Missing ccCrmId on ProductMap (86 entries)
Most are Shopify-originated variants that were never bridged to CC CRM IDs.
The seed script's Step 2b attempts to bridge via OrderItem linking, but misses many.

## Unmapped CC CRM IDs for Sculpt+ Conductive Gel
These ccCrmIds appear in OrderItems but have no ProductMap entry:
- 2 — Sculpt+ Conductive Gel (old variant)
- 61 — Sculpt+ Conductive Gel variant
- 63 — Sculpt+ Conductive Gel - 3 Month Supply
- 189 — Sculpt+ Conductive Gel variant
- 193 — Sculpt+ Conductive Gel CC Subs
- 187 — Sculpt+ Conductive Gel variant

## Variant IDs not tracked
- `shopifyVariantId` field exists on ProductMap but not populated
- CC `variantDetailId` available in order item data but not stored
- Need to add variant tracking to both Shopify and CC sync

## Next steps
1. Run CC campaign product sync to auto-create ProductMap entries (needs API endpoint confirmation)
2. Bridge ccCrmId on existing entries using OrderItem linkage (run seed.ts Step 2b with broader matching)
3. Add variantDetailId to OrderItem schema and CC adapter
4. Add shopifyVariantId population to Shopify sync
