-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shopifyOrderId" TEXT;

-- CreateIndex
CREATE INDEX "Order_shopifyOrderId_idx" ON "Order"("shopifyOrderId");
