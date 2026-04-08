-- AlterTable: add source field to Subscription
ALTER TABLE "Subscription" ADD COLUMN "source" "Source";

-- Backfill: CC subscriptions
UPDATE "Subscription" SET "source" = 'CHECKOUTCHAMP' WHERE "ccPurchaseId" IS NOT NULL AND "source" IS NULL;

-- Backfill: Shopify/Loop subscriptions
UPDATE "Subscription" SET "source" = 'SHOPIFY' WHERE "shopifyContractId" IS NOT NULL AND "source" IS NULL;

-- CreateIndex
CREATE INDEX "Subscription_source_idx" ON "Subscription"("source");
