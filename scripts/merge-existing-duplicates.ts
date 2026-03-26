/**
 * One-time migration script: merge existing CC↔Shopify duplicate orders.
 *
 * Finds all CheckoutChamp orders that have a shopifyOrderId pointing at a Shopify order,
 * merges CC-specific fields onto the Shopify order (marking it MERGED), then deletes the
 * CC order and all its child records.
 *
 * Usage:
 *   npx tsx scripts/merge-existing-duplicates.ts [--dry-run]
 */

import { prisma } from '../src/lib/prisma';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`\n=== Merge Existing CC↔Shopify Duplicates ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE'}\n`);

  // Step 1: Find all CC orders with a shopifyOrderId
  const ccOrders = await prisma.order.findMany({
    where: {
      source: 'CHECKOUTCHAMP',
      shopifyOrderId: { not: null },
    },
    include: {
      items: true,
      attribution: true,
    },
  });

  console.log(`Found ${ccOrders.length} CC orders with shopifyOrderId\n`);

  let merged = 0;
  let skipped = 0;
  let errors = 0;

  for (const ccOrder of ccOrders) {
    const shopifyOrderId = ccOrder.shopifyOrderId!;

    try {
      // Step 2: Find matching Shopify order
      const shopifyOrder = await prisma.order.findUnique({
        where: {
          source_sourceOrderId: { source: 'SHOPIFY', sourceOrderId: shopifyOrderId },
        },
        include: {
          items: true,
          attribution: true,
        },
      });

      if (!shopifyOrder) {
        console.log(`  SKIP: CC order ${ccOrder.sourceOrderId} → no Shopify order found for ${shopifyOrderId}`);
        skipped++;
        continue;
      }

      console.log(`  MERGE: CC ${ccOrder.sourceOrderId} → Shopify ${shopifyOrder.sourceOrderId}`);

      if (DRY_RUN) {
        merged++;
        continue;
      }

      // Step 3: Merge in a transaction
      await prisma.$transaction(async (tx) => {
        // --- 3a. Build CC-wins enrichment payload ---
        const ccEnrichment: Record<string, unknown> = {
          source: 'MERGED' as const,
          ccSourceOrderId: ccOrder.sourceOrderId,
        };

        const ccWinsFields = [
          'campaignId', 'campaignName', 'salesUrl', 'ccOrderType',
          'funnelReferenceId', 'avsResponse', 'cvvResponse', 'cardType',
          'cardLast4', 'cardIsDebit', 'cardIsPrepaid', 'isDeclineSave',
          'userAgent', 'device', 'browser', 'geoState', 'geoCountry',
          'ccCustom1', 'ccCustom2', 'fulfillmentData', 'refundRemaining',
        ] as const;

        for (const field of ccWinsFields) {
          const value = (ccOrder as Record<string, unknown>)[field];
          if (value != null) {
            ccEnrichment[field] = value;
          }
        }

        // hasUpsells: OR — true if either side says true
        if (ccOrder.hasUpsells) {
          ccEnrichment.hasUpsells = true;
        }

        // Update the Shopify order with CC enrichment
        await tx.order.update({
          where: { id: shopifyOrder.id },
          data: ccEnrichment,
        });

        // --- 3b. Merge order items ---
        for (const ccItem of ccOrder.items) {
          // Match by externalId
          const matchingItem = ccItem.externalId
            ? shopifyOrder.items.find(i => i.externalId === ccItem.externalId)
            : null;

          if (matchingItem) {
            // Enrich existing Shopify item with CC-specific fields
            const itemUpdate: Record<string, unknown> = {};
            if (ccItem.ccCrmId != null) itemUpdate.ccCrmId = ccItem.ccCrmId;
            if (ccItem.ccCampaignProductId != null) itemUpdate.ccCampaignProductId = ccItem.ccCampaignProductId;
            if (ccItem.recurringStatus != null) itemUpdate.recurringStatus = ccItem.recurringStatus;
            if (ccItem.billingCycleNumber != null) itemUpdate.billingCycleNumber = ccItem.billingCycleNumber;
            if (ccItem.merchantId != null) itemUpdate.merchantId = ccItem.merchantId;
            if (ccItem.responseType != null) itemUpdate.responseType = ccItem.responseType;
            if (ccItem.txnType != null) itemUpdate.txnType = ccItem.txnType;
            if (ccItem.productType != null) itemUpdate.productType = ccItem.productType;
            if (ccItem.productDescription != null) itemUpdate.productDescription = ccItem.productDescription;

            if (Object.keys(itemUpdate).length > 0) {
              await tx.orderItem.update({
                where: { id: matchingItem.id },
                data: itemUpdate,
              });
            }
          }
          // Non-matching CC items are dropped — they'll be deleted with the CC order
        }

        // --- 3c. Handle attribution ---
        const ccAttrib = ccOrder.attribution;
        const shopifyAttrib = shopifyOrder.attribution;

        if (ccAttrib && !shopifyAttrib) {
          // CC has attribution, Shopify doesn't — re-parent to Shopify order
          await tx.attribution.update({
            where: { id: ccAttrib.id },
            data: { orderId: shopifyOrder.id },
          });
        } else if (ccAttrib && shopifyAttrib) {
          // Both have attribution — merge (CC wins for non-null fields), then delete CC's
          const attrMerge: Record<string, unknown> = {};
          const attrFields = [
            'sourceId', 'pubId', 'subAffId',
            'sourceValue1', 'sourceValue2', 'sourceValue3', 'sourceValue4', 'sourceValue5',
            'utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'utmTerm',
            'httpReferer', 'userAgent',
          ] as const;

          for (const field of attrFields) {
            const ccVal = (ccAttrib as Record<string, unknown>)[field];
            if (ccVal != null) {
              attrMerge[field] = ccVal;
            }
          }

          if (Object.keys(attrMerge).length > 0) {
            await tx.attribution.update({
              where: { id: shopifyAttrib.id },
              data: attrMerge,
            });
          }

          // Delete CC's attribution (it's separate from the one we just updated)
          await tx.attribution.delete({ where: { id: ccAttrib.id } });
        }
        // If only Shopify has attribution (or neither), nothing to do

        // --- 3d. Delete ALL child records of the CC order ---
        // Attribution was already handled above; delete only if it wasn't re-parented
        if (!ccAttrib || (ccAttrib && shopifyAttrib)) {
          // Already deleted or re-parented above — no-op for attribution
        } else {
          // ccAttrib was re-parented, so don't delete it
        }
        // Delete remaining child records that weren't re-parented
        // (Attribution was handled above, so we only deleteMany for the rest)
        await tx.orderItem.deleteMany({ where: { orderId: ccOrder.id } });
        await tx.revenueEvent.deleteMany({ where: { orderId: ccOrder.id } });
        await tx.funnelEvent.deleteMany({ where: { orderId: ccOrder.id } });
        await tx.upsellPath.deleteMany({ where: { orderId: ccOrder.id } });

        // If attribution wasn't re-parented (it was either merged+deleted or didn't exist),
        // make sure any remaining attribution for CC order is cleaned up
        // (In the re-parent case, orderId was already changed to shopifyOrder.id)
        await tx.attribution.deleteMany({ where: { orderId: ccOrder.id } });

        // --- 3e. Delete the CC order row ---
        await tx.order.delete({ where: { id: ccOrder.id } });
      });

      merged++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR merging CC order ${ccOrder.sourceOrderId}: ${message}`);
      errors++;
    }
  }

  // Summary
  console.log(`\n=== Summary ===`);
  console.log(`  Merged:  ${merged}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors:  ${errors}`);
  console.log(`  Total:   ${ccOrders.length}`);
  if (DRY_RUN) {
    console.log(`\n  (Dry run — no changes were made)`);
  }
  console.log('');
}

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
