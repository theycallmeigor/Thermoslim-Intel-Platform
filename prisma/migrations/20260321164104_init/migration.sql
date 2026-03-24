-- CreateEnum
CREATE TYPE "Source" AS ENUM ('SHOPIFY', 'CHECKOUTCHAMP');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PARTIAL', 'COMPLETE', 'PENDING', 'DECLINED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ResponseType" AS ENUM ('SUCCESS', 'HARD_DECLINE', 'SOFT_DECLINE', 'PENDING', 'COD_PENDING');

-- CreateEnum
CREATE TYPE "PaySource" AS ENUM ('CREDITCARD', 'CHECK', 'ACCTONFILE', 'COD', 'PREPAID', 'APPLEPAY', 'GOOGLEPAY');

-- CreateEnum
CREATE TYPE "RecurringStatus" AS ENUM ('TRIAL', 'ACTIVE', 'RECYCLE_BILLING', 'RECYCLE_FAILED', 'COMPLETE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'RECYCLE_BILLING', 'RECYCLE_FAILED', 'COMPLETE', 'CANCELLED', 'PAUSED');

-- CreateEnum
CREATE TYPE "SubscriptionEventType" AS ENUM ('CREATED', 'BILLED', 'DECLINED', 'CANCELLED', 'PAUSED', 'RESUMED', 'REACTIVATED');

-- CreateEnum
CREATE TYPE "RevenueEventType" AS ENUM ('SALE', 'REFUND', 'CHARGEBACK', 'REBILL', 'VOID');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('HOLD', 'PENDING', 'PENDING_SHIPMENT', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RMA_PENDING', 'RETURNED');

-- CreateEnum
CREATE TYPE "EmailEventType" AS ENUM ('SENT', 'OPENED', 'CLICKED', 'BOUNCED', 'UNSUBSCRIBED');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "source" "Source" NOT NULL,
    "sourceOrderId" TEXT NOT NULL,
    "sourceClientOrderId" TEXT,
    "customerId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "orderTotal" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "totalShipping" INTEGER NOT NULL DEFAULT 0,
    "totalDiscount" INTEGER NOT NULL DEFAULT 0,
    "salesTax" INTEGER NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "campaignId" TEXT,
    "campaignName" TEXT,
    "salesUrl" TEXT,
    "hasUpsells" BOOLEAN NOT NULL DEFAULT false,
    "couponCode" TEXT,
    "ipAddress" TEXT,
    "paySource" "PaySource",
    "responseType" "ResponseType",
    "createdAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productSlot" INTEGER NOT NULL,
    "productMapId" TEXT,
    "ccCrmId" TEXT,
    "ccCampaignProductId" TEXT,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "recurringStatus" "RecurringStatus",
    "billingCycleNumber" INTEGER,
    "recurringPrice" INTEGER,
    "productCategoryId" TEXT,
    "productCategoryName" TEXT,
    "replacedByOrderItemId" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT,
    "billingAddress" JSONB,
    "shippingAddress" JSONB,
    "ccCustomerId" TEXT,
    "shopifyCustomerId" TEXT,
    "klaviyoProfileId" TEXT,
    "contactOptIn" BOOLEAN NOT NULL DEFAULT false,
    "firstOrderAt" TIMESTAMP(3),
    "lastOrderAt" TIMESTAMP(3),
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "ccPurchaseId" TEXT,
    "ccClientPurchaseId" TEXT,
    "originalOrderId" TEXT,
    "productMapId" TEXT,
    "status" "SubscriptionStatus" NOT NULL,
    "currentBillingCycle" INTEGER NOT NULL DEFAULT 1,
    "recurringPrice" INTEGER NOT NULL,
    "frequency" TEXT,
    "campaignId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "lastBilledAt" TIMESTAMP(3),
    "nextBillDate" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionEvent" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "eventType" "SubscriptionEventType" NOT NULL,
    "fromStatus" "SubscriptionStatus",
    "toStatus" "SubscriptionStatus" NOT NULL,
    "billingCycleNumber" INTEGER,
    "amount" INTEGER,
    "declineReason" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "customerId" TEXT NOT NULL,
    "eventType" "RevenueEventType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" "Source" NOT NULL,
    "refundReason" TEXT,
    "chargebackReasonCode" TEXT,
    "transactionId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMap" (
    "id" TEXT NOT NULL,
    "shopifyProductId" TEXT,
    "shopifyVariantId" TEXT,
    "ccCrmId" TEXT,
    "ccCampaignProductIds" JSONB,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "productLine" TEXT,
    "category" TEXT,
    "frequency" TEXT,
    "priceTier" TEXT,
    "isSubscription" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunnelEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "customerId" TEXT,
    "campaignId" TEXT,
    "step" TEXT NOT NULL,
    "pageUrl" TEXT,
    "productMapId" TEXT,
    "accepted" BOOLEAN,
    "occurredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FunnelEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpsellPath" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "initialProductMapId" TEXT,
    "finalProductMapId" TEXT,
    "upsellsAccepted" INTEGER NOT NULL DEFAULT 0,
    "upsellsDeclined" INTEGER NOT NULL DEFAULT 0,
    "revenueAdded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UpsellPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL,
    "klaviyoCampaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "sentAt" TIMESTAMP(3),
    "sends" INTEGER NOT NULL DEFAULT 0,
    "opens" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "bounces" INTEGER NOT NULL DEFAULT 0,
    "unsubscribes" INTEGER NOT NULL DEFAULT 0,
    "attributedRevenue" INTEGER NOT NULL DEFAULT 0,
    "attributedOrders" INTEGER NOT NULL DEFAULT 0,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailFlow" (
    "id" TEXT NOT NULL,
    "klaviyoFlowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sends" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "attributedRevenue" INTEGER NOT NULL DEFAULT 0,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "eventType" "EmailEventType" NOT NULL,
    "campaignId" TEXT,
    "flowId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageAnalytics" (
    "id" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "avgTimeOnPage" DOUBLE PRECISION,
    "bounceRate" DOUBLE PRECISION,
    "avgScrollDepth" DOUBLE PRECISION,
    "rageClicks" INTEGER NOT NULL DEFAULT 0,
    "deadClicks" INTEGER NOT NULL DEFAULT 0,
    "excessiveScrollSessions" INTEGER NOT NULL DEFAULT 0,
    "jsErrorCount" INTEGER NOT NULL DEFAULT 0,
    "topReferrers" JSONB,
    "deviceBreakdown" JSONB,

    CONSTRAINT "PageAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attribution" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sourceId" TEXT,
    "pubId" TEXT,
    "subAffId" TEXT,
    "sourceValue1" TEXT,
    "sourceValue2" TEXT,
    "sourceValue3" TEXT,
    "sourceValue4" TEXT,
    "sourceValue5" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "httpReferer" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Attribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySnapshot" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "source" "Source",
    "campaignId" TEXT,
    "productLine" TEXT,
    "frequency" TEXT,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "checkoutRevenue" INTEGER NOT NULL DEFAULT 0,
    "recurringRevenue" INTEGER NOT NULL DEFAULT 0,
    "refunds" INTEGER NOT NULL DEFAULT 0,
    "chargebacks" INTEGER NOT NULL DEFAULT 0,
    "newSubscribers" INTEGER NOT NULL DEFAULT 0,
    "cancelledSubscribers" INTEGER NOT NULL DEFAULT 0,
    "activeSubscribers" INTEGER NOT NULL DEFAULT 0,
    "activeMRR" INTEGER NOT NULL DEFAULT 0,
    "avgOrderValue" INTEGER NOT NULL DEFAULT 0,
    "churnRate" DOUBLE PRECISION,

    CONSTRAINT "DailySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionError" (
    "id" TEXT NOT NULL,
    "source" "Source" NOT NULL,
    "errorType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "IngestionError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_campaignId_idx" ON "Order"("campaignId");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_source_sourceOrderId_key" ON "Order"("source", "sourceOrderId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_externalId_idx" ON "OrderItem"("externalId");

-- CreateIndex
CREATE INDEX "OrderItem_ccCampaignProductId_idx" ON "OrderItem"("ccCampaignProductId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_ccCustomerId_key" ON "Customer"("ccCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_shopifyCustomerId_key" ON "Customer"("shopifyCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_klaviyoProfileId_key" ON "Customer"("klaviyoProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_ccPurchaseId_key" ON "Subscription"("ccPurchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_ccClientPurchaseId_key" ON "Subscription"("ccClientPurchaseId");

-- CreateIndex
CREATE INDEX "Subscription_customerId_idx" ON "Subscription"("customerId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_campaignId_idx" ON "Subscription"("campaignId");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_subscriptionId_idx" ON "SubscriptionEvent"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_occurredAt_idx" ON "SubscriptionEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "RevenueEvent_orderId_idx" ON "RevenueEvent"("orderId");

-- CreateIndex
CREATE INDEX "RevenueEvent_customerId_idx" ON "RevenueEvent"("customerId");

-- CreateIndex
CREATE INDEX "RevenueEvent_occurredAt_idx" ON "RevenueEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "ProductMap_externalId_idx" ON "ProductMap"("externalId");

-- CreateIndex
CREATE INDEX "ProductMap_shopifyProductId_idx" ON "ProductMap"("shopifyProductId");

-- CreateIndex
CREATE INDEX "ProductMap_ccCrmId_idx" ON "ProductMap"("ccCrmId");

-- CreateIndex
CREATE INDEX "ProductMap_productLine_idx" ON "ProductMap"("productLine");

-- CreateIndex
CREATE INDEX "FunnelEvent_campaignId_idx" ON "FunnelEvent"("campaignId");

-- CreateIndex
CREATE INDEX "FunnelEvent_occurredAt_idx" ON "FunnelEvent"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "UpsellPath_orderId_key" ON "UpsellPath"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailCampaign_klaviyoCampaignId_key" ON "EmailCampaign"("klaviyoCampaignId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailFlow_klaviyoFlowId_key" ON "EmailFlow"("klaviyoFlowId");

-- CreateIndex
CREATE INDEX "EmailEvent_customerId_idx" ON "EmailEvent"("customerId");

-- CreateIndex
CREATE INDEX "EmailEvent_occurredAt_idx" ON "EmailEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "PageAnalytics_date_idx" ON "PageAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PageAnalytics_pageUrl_date_key" ON "PageAnalytics"("pageUrl", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Attribution_orderId_key" ON "Attribution"("orderId");

-- CreateIndex
CREATE INDEX "DailySnapshot_date_idx" ON "DailySnapshot"("date");

-- CreateIndex
CREATE INDEX "DailySnapshot_campaignId_idx" ON "DailySnapshot"("campaignId");

-- CreateIndex
CREATE INDEX "DailySnapshot_productLine_idx" ON "DailySnapshot"("productLine");

-- CreateIndex
CREATE INDEX "IngestionError_occurredAt_idx" ON "IngestionError"("occurredAt");

-- CreateIndex
CREATE INDEX "IngestionError_source_idx" ON "IngestionError"("source");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productMapId_fkey" FOREIGN KEY ("productMapId") REFERENCES "ProductMap"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_productMapId_fkey" FOREIGN KEY ("productMapId") REFERENCES "ProductMap"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionEvent" ADD CONSTRAINT "SubscriptionEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEvent" ADD CONSTRAINT "RevenueEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEvent" ADD CONSTRAINT "RevenueEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelEvent" ADD CONSTRAINT "FunnelEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelEvent" ADD CONSTRAINT "FunnelEvent_productMapId_fkey" FOREIGN KEY ("productMapId") REFERENCES "ProductMap"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpsellPath" ADD CONSTRAINT "UpsellPath_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "EmailFlow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attribution" ADD CONSTRAINT "Attribution_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
