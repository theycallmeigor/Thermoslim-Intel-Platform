/**
 * Database source adapter — pulls CC orders from Prisma
 */
import type { SourceAdapter, CCEvent } from '../types';

export function createDatabaseSource(db: any): SourceAdapter {
  return {
    name: 'database',
    async pull(from: Date, to: Date): Promise<CCEvent[]> {
      const orders = await db.order.findMany({
        where: {
          source: 'CHECKOUTCHAMP',
          createdAt: { gte: from, lte: to },
        },
        select: {
          id: true,
          createdAt: true,
          orderTotal: true,
          status: true,
          paySource: true,
          responseType: true,
          declineReason: true,
          funnelReferenceId: true,
          funnelPageId: true,
          campaignName: true,
          campaignId: true,
          salesUrl: true,
          items: {
            select: { name: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return orders.map((o: any) => {
        const paySource = o.paySource || null;
        const status = o.status || 'PARTIAL';
        // Abandoned checkout = no payment source submitted + PARTIAL status
        const isAbandon = (!paySource || paySource === 'unknown') && status === 'PARTIAL';
        return {
          timestamp: o.createdAt,
          orderId: o.id,
          status,
          paySource,
          funnelId: o.funnelReferenceId || null,
          campaignName: o.campaignName || o.campaignId || null,
          orderTotal: o.orderTotal || 0,
          product: o.items[0]?.name || null,
          isAbandon,
          meta: {
            responseType: o.responseType || null,
            declineReason: o.declineReason || null,
            funnelPageId: o.funnelPageId || null,
            salesUrl: o.salesUrl || null,
          },
        };
      });
    },
  };
}
