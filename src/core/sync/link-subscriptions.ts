import { prisma } from '@/lib/prisma';

/**
 * Link unlinked subscriptions to ProductMap entries.
 * Uses the same logic as scripts/seed.ts Step 2 + Step 3.
 */
export async function linkUnlinkedSubscriptions(): Promise<{ linked: number }> {
  // Find subs with null productMapId
  const unlinked = await prisma.subscription.findMany({
    where: { productMapId: null },
    select: { id: true, originalOrderId: true, ccPurchaseId: true, recurringPrice: true },
    take: 500,
  });

  if (unlinked.length === 0) return { linked: 0 };

  let linked = 0;

  // Build lookup maps
  const allMaps = await prisma.productMap.findMany({
    select: { id: true, ccCrmId: true, shopifyProductId: true, externalId: true, productLine: true },
  });
  const ccCrmLookup = new Map(allMaps.filter(m => m.ccCrmId).map(m => [m.ccCrmId!, m.id]));

  for (const sub of unlinked) {
    let pmId: string | null = null;

    // Try to find via original order's items
    if (sub.originalOrderId) {
      const items = await prisma.orderItem.findMany({
        where: { orderId: sub.originalOrderId },
        select: { productMapId: true, ccCrmId: true, externalId: true },
      });

      for (const item of items) {
        if (item.productMapId) { pmId = item.productMapId; break; }
        if (item.ccCrmId) { pmId = ccCrmLookup.get(item.ccCrmId) ?? null; if (pmId) break; }
      }
    }

    if (pmId) {
      await prisma.subscription.update({ where: { id: sub.id }, data: { productMapId: pmId } });
      linked++;
    }
  }

  return { linked };
}
