-- Add Loop subscription fields to Subscription table
-- shopifyContractId: primary dedup key for Loop subs via Shopify GraphQL
-- loopSubscriptionId: reserved for future Loop API integration
-- sellingPlanName: human-readable selling plan (e.g. "Delivery every 30 days")

ALTER TABLE "Subscription" ADD COLUMN "shopifyContractId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "loopSubscriptionId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "sellingPlanName" TEXT;

CREATE UNIQUE INDEX "Subscription_shopifyContractId_key" ON "Subscription"("shopifyContractId");
CREATE UNIQUE INDEX "Subscription_loopSubscriptionId_key" ON "Subscription"("loopSubscriptionId");

-- Add EXPIRED and SKIPPED to SubscriptionEventType enum
ALTER TYPE "SubscriptionEventType" ADD VALUE 'EXPIRED';
ALTER TYPE "SubscriptionEventType" ADD VALUE 'SKIPPED';
