/**
 * Backfill funnelReferenceId on existing CC orders from the CC API.
 * One-time script — future orders will have it set during sync.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  try {
    // Get all CC orders missing funnelReferenceId
    const ordersToUpdate = await db.order.findMany({
      where: {
        source: 'CHECKOUTCHAMP',
        funnelReferenceId: null,
      },
      select: { id: true, sourceOrderId: true },
    });

    console.log(`Found ${ordersToUpdate.length} CC orders missing funnelReferenceId`);
    if (ordersToUpdate.length === 0) return;

    // Fetch from CC API in date chunks
    const baseUrl = 'https://api.checkoutchamp.com';
    const authParams = 'loginId=igor.ai&password=thermoslimapi345';

    // Build a lookup map: CC orderId → funnelReferenceId
    const funnelMap = new Map<string, { funnelId: string; salesUrl: string }>();

    // Fetch all orders from CC API
    let page = 1;
    let totalFetched = 0;
    while (true) {
      const url = `${baseUrl}/order/query/?${authParams}&startDate=2025-01-01&endDate=2026-12-31&page=${page}`;
      const res = await fetch(url);
      const data = await res.json() as any;

      if (data.result !== 'SUCCESS' || typeof data.message === 'string') break;

      const orders = data.message.data;
      if (!orders?.length) break;

      for (const o of orders) {
        if (o.funnelReferenceId) {
          funnelMap.set(o.orderId, {
            funnelId: o.funnelReferenceId,
            salesUrl: o.salesUrl || null,
          });
        }
      }

      totalFetched += orders.length;
      console.log(`  Fetched page ${page}: ${orders.length} orders (${totalFetched} total, ${funnelMap.size} with funnels)`);

      if (totalFetched >= data.message.totalResults) break;
      page++;
    }

    console.log(`\nUpdating ${ordersToUpdate.length} orders...`);

    let updated = 0;
    for (const order of ordersToUpdate) {
      const match = funnelMap.get(order.sourceOrderId);
      if (match) {
        await db.order.update({
          where: { id: order.id },
          data: { funnelReferenceId: match.funnelId },
        });
        updated++;
      }
    }

    console.log(`Updated ${updated} orders with funnelReferenceId`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
