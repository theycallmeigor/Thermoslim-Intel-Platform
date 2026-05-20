import { prisma } from '@/lib/prisma';

/**
 * Get expected rebill prices for $0 trial subscriptions.
 * Looks up the most common non-zero price for subs with the same productMapId.
 * Returns a Map of productMapId → expected price in cents.
 */
export async function getTrialExpectedPrices(): Promise<Map<string, number>> {
  const expectedPrices = new Map<string, number>();

  // Get all productMapIds that have $0 active subs
  const trialProductMapIds = await prisma.subscription.findMany({
    where: { recurringPrice: 0, status: { in: ['ACTIVE', 'TRIAL'] } },
    select: { productMapId: true },
    distinct: ['productMapId'],
  });

  for (const { productMapId } of trialProductMapIds) {
    if (!productMapId) continue;
    if (expectedPrices.has(productMapId)) continue;

    // Get most common non-zero price for this product
    const prices = await prisma.subscription.groupBy({
      by: ['recurringPrice'],
      where: { productMapId, recurringPrice: { gt: 0 } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    });

    if (prices[0]) {
      expectedPrices.set(productMapId, prices[0].recurringPrice);
    }
  }

  return expectedPrices;
}
