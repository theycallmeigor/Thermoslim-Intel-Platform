import { prisma } from '@/lib/prisma';
import { toMonthlyMrr } from '@/lib/dashboard/formatting';
import { getTrialExpectedPrices } from '@/lib/dashboard/trial-prices';

export type MrrResult = {
  totalMrr: number;
  activeCount: number;
  trialCount: number;
  byProductLine: Map<string, { mrr: number; count: number; trials: number }>;
};

/**
 * Single source of truth for MRR calculation.
 * All pages should call this instead of computing MRR independently.
 */
export async function calculateMrr(extraWhere: Record<string, unknown> = {}): Promise<MrrResult> {
  const [subs, trialPrices] = await Promise.all([
    prisma.subscription.findMany({
      where: { status: { in: ['ACTIVE', 'TRIAL'] }, ...extraWhere },
      select: {
        recurringPrice: true,
        frequency: true,
        productMapId: true,
        productMap: { select: { productLine: true } },
      },
    }),
    getTrialExpectedPrices(),
  ]);

  let totalMrr = 0;
  let trialCount = 0;
  const byProductLine = new Map<string, { mrr: number; count: number; trials: number }>();

  for (const sub of subs) {
    const expected = sub.productMapId ? trialPrices.get(sub.productMapId) : undefined;
    const mrr = toMonthlyMrr(sub.recurringPrice, sub.frequency, expected);
    const isTrial = sub.recurringPrice === 0;
    const productLine = sub.productMap?.productLine ?? 'Unlinked';

    totalMrr += mrr;
    if (isTrial) trialCount++;

    const existing = byProductLine.get(productLine) ?? { mrr: 0, count: 0, trials: 0 };
    existing.mrr += mrr;
    existing.count++;
    if (isTrial) existing.trials++;
    byProductLine.set(productLine, existing);
  }

  return {
    totalMrr,
    activeCount: subs.length,
    trialCount,
    byProductLine,
  };
}
