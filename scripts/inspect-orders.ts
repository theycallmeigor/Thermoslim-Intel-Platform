import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  // Search broadly - IDs may be stored differently
  const shopifyOrder = await prisma.order.findFirst({
    where: { source: 'SHOPIFY', sourceOrderId: { contains: '93783733' } },
    include: { customer: true, items: { include: { productMap: true } }, attribution: true }
  });
  const ccOrder = await prisma.order.findFirst({
    where: { source: 'CHECKOUTCHAMP', sourceOrderId: { contains: 'B40B78A5' } },
    include: { customer: true, items: { include: { productMap: true } }, attribution: true }
  });

  // Also search CC for the shopify order number (externalOrderId)
  const ccByExternal = await prisma.order.findFirst({
    where: { source: 'CHECKOUTCHAMP', sourceClientOrderId: { contains: '93783733' } },
    include: { customer: true, items: { include: { productMap: true } } }
  });

  for (const [label, o] of [['SHOPIFY #93783733', shopifyOrder], ['CC B40B78A5', ccOrder], ['CC by externalOrderId', ccByExternal]] as const) {
    if (!o) { console.log(`\n${label}: NOT FOUND`); continue; }
    console.log('\n' + '='.repeat(60));
    console.log(`${label}`);
    console.log(`  DB id: ${o.id}`);
    console.log(`  sourceOrderId: ${o.sourceOrderId}  clientOrderId: ${o.sourceClientOrderId}`);
    console.log(`  Customer: ${o.customer.email}  (ccId=${o.customer.ccCustomerId} shopifyId=${o.customer.shopifyCustomerId})`);
    console.log(`  Status: ${o.status}  Total: $${(o.totalPrice/100).toFixed(2)}  Date: ${o.createdAt.toISOString().slice(0,10)}`);
    console.log(`  Items:`);
    for (const item of o.items) {
      console.log(`    [${item.productSlot}] "${item.name}"  sku=${item.sku}  $${(item.price/100).toFixed(2)}`);
      console.log(`         externalId=${item.externalId}  ccCrmId=${item.ccCrmId}`);
      console.log(`         recurringStatus=${item.recurringStatus}  mapped=${item.productMap?.name ?? 'UNMATCHED'} (shopifyProductId=${item.productMap?.shopifyProductId})`);
    }
  }

  // Find all CC items with externalId matching Shopify product IDs from that order
  if (shopifyOrder) {
    const shopifyProductIds = shopifyOrder.items.map(i => i.externalId).filter(Boolean);
    console.log('\nShopify product IDs on this order:', shopifyProductIds);
  }

  await prisma.$disconnect();
}
main().catch(console.error);
