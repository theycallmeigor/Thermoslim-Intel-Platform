// Ingestion pipeline — validate → normalize → write → post-hooks
// See docs/architecture/ingestion-layer.md for full design

import { prisma } from '../../lib/prisma';
import type { NormalizedRecord } from '../types';
import type { OrderStatus, PaySource, ResponseType, SubscriptionStatus } from '@prisma/client';
import { notifyOrdersIngested, type PostHookSource } from './post-hooks';

export interface IngestionResult {
  created: number;
  updated: number;
}

export interface IngestionOptions {
  /** Where this ingestion was triggered from — used by post-hooks */
  source?: PostHookSource;
  /** Skip post-hooks (useful for bulk re-syncs where you'll trigger QA manually after) */
  skipPostHooks?: boolean;
}

// Main entry point — processes a batch of normalized records in dependency order
export async function runIngestion(
  records: NormalizedRecord[],
  options?: IngestionOptions,
): Promise<IngestionResult> {
  let created = 0;
  let updated = 0;

  const products = records.filter(r => r.type === 'product');
  const customers = records.filter(r => r.type === 'customer');
  const orders = records.filter(r => r.type === 'order');
  const subscriptions = records.filter(r => r.type === 'subscription');

  // Dependency order: products → customers → orders → subscriptions
  for (const r of products) {
    const result = await upsertProduct(r.data as unknown as ProductData);
    if (result.created) created++; else updated++;
  }
  for (const r of customers) {
    const result = await upsertCustomer(r.data as unknown as CustomerData);
    if (result.created) created++; else updated++;
  }
  for (const r of orders) {
    const result = await upsertOrder(r.data as unknown as OrderData);
    if (result.created) created++; else updated++;
  }
  for (const r of subscriptions) {
    const result = await upsertSubscription(r.data as unknown as SubscriptionData);
    if (result.created) created++; else updated++;
  }

  // Fire post-ingestion hooks (non-blocking) for order records
  if (orders.length > 0 && !options?.skipPostHooks) {
    // Fire-and-forget — never blocks the ingestion response
    try {
      notifyOrdersIngested(orders.length, options?.source ?? 'sync');
    } catch {
      // Post-hooks must never break ingestion
    }
  }

  return { created, updated };
}

// --- Internal typed interfaces ---

interface ProductData {
  shopifyProductId: string;
  shopifyVariantId?: string;
  name: string;
  sku?: string | null;
  category?: string | null;
}

interface CustomerData {
  email: string;
  shopifyCustomerId?: string;
  ccCustomerId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  billingAddress?: unknown;
  shippingAddress?: unknown;
}

interface OrderItemData {
  productSlot: number;
  shopifyVariantId?: string | null;
  shopifyProductId?: string | null;
  ccCrmId?: string | null;
  ccCampaignProductId?: string | null;
  externalId?: string | null;
  name: string;
  sku?: string | null;
  price: number;
  quantity: number;
  recurringstatus?: string | null;
  billingCycleNumber?: number | null;
  productCategoryId?: string | null;
  productCategoryName?: string | null;
  merchantId?: string | null;
  responseType?: string | null;
  txnType?: string | null;
  productType?: string | null;
  productDescription?: string | null;
}

interface AttributionData {
  sourceId?: string | null;
  pubId?: string | null;
  subAffId?: string | null;
  sourceValue1?: string | null;
  sourceValue2?: string | null;
  sourceValue3?: string | null;
  sourceValue4?: string | null;
  sourceValue5?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  httpReferer?: string | null;
  userAgent?: string | null;
}

interface OrderData {
  source: 'SHOPIFY' | 'CHECKOUTCHAMP';
  sourceOrderId: string;
  sourceClientOrderId?: string | null;
  customerEmail: string;
  status: OrderStatus;
  responseType?: string;
  orderTotal: number;
  totalPrice: number;
  totalShipping: number;
  totalDiscount: number;
  salesTax: number;
  currencyCode: string;
  campaignId?: string | null;
  campaignName?: string | null;
  salesUrl?: string | null;
  hasUpsells?: boolean;
  couponCode?: string | null;
  ipAddress?: string | null;
  paySource?: PaySource | null;
  shopifyOrderId?: string | null;
  ccOrderType?: string | null;
  funnelReferenceId?: string | null;
  declineReason?: string | null;
  // Payment verification
  avsResponse?: string | null;
  cvvResponse?: string | null;
  cardType?: string | null;
  cardLast4?: string | null;
  cardIsDebit?: boolean | null;
  cardIsPrepaid?: boolean | null;
  isDeclineSave?: boolean | null;
  refundRemaining?: number | null;
  // Browser / device
  userAgent?: string | null;
  device?: string | null;
  browser?: string | null;
  geoState?: string | null;
  geoCountry?: string | null;
  // CC custom fields
  ccCustom1?: string | null;
  ccCustom2?: string | null;
  // Fulfillment
  fulfillmentData?: unknown | null;
  tags?: string | null;
  createdAt: string;
  items: OrderItemData[];
  attribution?: AttributionData | null;
}

interface SubscriptionData {
  customerEmail: string;
  ccPurchaseId: string;
  ccClientPurchaseId?: string | null;
  originalOrderId?: string | null;
  status: SubscriptionStatus;
  recurringPrice: number;
  campaignId?: string | null;
  startedAt: string;
  nextBillDate?: string | null;
  shopifyExternalId?: string | null;
}

// --- Upsert functions ---

async function upsertProduct(data: ProductData): Promise<{ created: boolean }> {
  const existing = await prisma.productMap.findFirst({
    where: {
      shopifyProductId: data.shopifyProductId,
      shopifyVariantId: data.shopifyVariantId ?? null,
    },
  });

  if (existing) {
    await prisma.productMap.update({
      where: { id: existing.id },
      data: { name: data.name, sku: data.sku, category: data.category },
    });
    return { created: false };
  }

  await prisma.productMap.create({
    data: {
      shopifyProductId: data.shopifyProductId,
      shopifyVariantId: data.shopifyVariantId,
      name: data.name,
      sku: data.sku,
      category: data.category,
    },
  });
  return { created: true };
}

async function upsertCustomer(data: CustomerData): Promise<{ created: boolean }> {
  if (!data.email) return { created: false };

  // If a ccCustomerId is supplied, check it isn't already claimed by a different email
  let safeCcCustomerId = data.ccCustomerId;
  if (safeCcCustomerId) {
    const claimed = await prisma.customer.findUnique({ where: { ccCustomerId: safeCcCustomerId } });
    if (claimed && claimed.email !== data.email) {
      // Different customer already owns this CC ID — skip overwriting to avoid constraint error
      safeCcCustomerId = undefined;
    }
  }

  const existing = await prisma.customer.findUnique({ where: { email: data.email } });

  if (existing) {
    await prisma.customer.update({
      where: { email: data.email },
      data: {
        shopifyCustomerId: data.shopifyCustomerId ?? existing.shopifyCustomerId,
        ccCustomerId: safeCcCustomerId ?? existing.ccCustomerId,
        firstName: data.firstName ?? existing.firstName,
        lastName: data.lastName ?? existing.lastName,
        fullName: data.fullName ?? existing.fullName,
        phone: data.phone ?? existing.phone,
        billingAddress: (data.billingAddress as object) ?? existing.billingAddress,
        shippingAddress: (data.shippingAddress as object) ?? existing.shippingAddress,
      },
    });
    return { created: false };
  }

  await prisma.customer.create({
    data: {
      email: data.email,
      shopifyCustomerId: data.shopifyCustomerId,
      ccCustomerId: safeCcCustomerId,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: data.fullName,
      phone: data.phone,
      billingAddress: data.billingAddress as object,
      shippingAddress: data.shippingAddress as object,
    },
  });
  return { created: true };
}

async function upsertOrder(data: OrderData): Promise<{ created: boolean }> {
  if (!data.customerEmail) {
    throw new Error(`Order ${data.sourceOrderId} has no email — skipping`);
  }
  const customer = await prisma.customer.findUnique({ where: { email: data.customerEmail } });
  if (!customer) {
    throw new Error(`Customer not found for email: ${data.customerEmail}`);
  }

  // --- Merge path: CC order with a matching Shopify order ---
  if (data.source === 'CHECKOUTCHAMP' && data.shopifyOrderId) {
    // Look for existing Shopify order to merge into
    const shopifyOrder = await prisma.order.findUnique({
      where: {
        source_sourceOrderId: { source: 'SHOPIFY', sourceOrderId: data.shopifyOrderId },
      },
      include: { items: true },
    });

    // Also check if already merged (re-ingestion scenario)
    const mergedOrder = await prisma.order.findFirst({
      where: { source: 'MERGED', sourceOrderId: data.shopifyOrderId },
      include: { items: true },
    });

    const targetOrder = shopifyOrder ?? mergedOrder;

    if (targetOrder) {
      // Build the CC-wins enrichment payload (only overwrite if CC provides a value)
      const ccEnrichment: Record<string, unknown> = {
        source: 'MERGED' as const,
        ccSourceOrderId: data.sourceOrderId,
      };

      // CC wins for these fields — only set if CC provides a non-null value
      const ccWinsFields = [
        'paySource', 'declineReason', 'campaignId', 'campaignName',
        'salesUrl', 'ccOrderType', 'funnelReferenceId', 'avsResponse',
        'cvvResponse', 'cardType', 'cardLast4', 'cardIsDebit', 'cardIsPrepaid',
        'isDeclineSave', 'userAgent', 'device', 'browser', 'geoState',
        'geoCountry', 'ccCustom1', 'ccCustom2', 'fulfillmentData', 'refundRemaining',
      ] as const;

      for (const field of ccWinsFields) {
        if (data[field] != null) {
          ccEnrichment[field] = data[field];
        }
      }

      // responseType needs casting
      if (data.responseType != null) {
        ccEnrichment.responseType = data.responseType as ResponseType;
      }

      // hasUpsells uses OR — true if either side says true
      if (data.hasUpsells) {
        ccEnrichment.hasUpsells = true;
      }

      // Update the target order — Shopify wins for financial fields (not overwritten)
      await prisma.order.update({
        where: { id: targetOrder.id },
        data: ccEnrichment,
      });

      // --- Merge items ---
      for (const ccItem of data.items) {
        // Try to find a matching existing item by externalId
        const matchingItem = ccItem.externalId
          ? targetOrder.items.find(i => i.externalId === ccItem.externalId)
          : null;

        if (matchingItem) {
          // Update existing item with CC-specific fields
          const itemUpdate: Record<string, unknown> = {};
          if (ccItem.ccCrmId != null) itemUpdate.ccCrmId = ccItem.ccCrmId;
          if (ccItem.ccCampaignProductId != null) itemUpdate.ccCampaignProductId = ccItem.ccCampaignProductId;
          if (ccItem.recurringstatus != null) {
            itemUpdate.recurringStatus = ccItem.recurringstatus.replace(' ', '_').toUpperCase();
          }
          if (ccItem.billingCycleNumber != null) itemUpdate.billingCycleNumber = ccItem.billingCycleNumber;
          if (ccItem.merchantId != null) itemUpdate.merchantId = ccItem.merchantId;
          if (ccItem.responseType != null) itemUpdate.responseType = ccItem.responseType;
          if (ccItem.txnType != null) itemUpdate.txnType = ccItem.txnType;
          if (ccItem.productType != null) itemUpdate.productType = ccItem.productType;
          if (ccItem.productDescription != null) itemUpdate.productDescription = ccItem.productDescription;

          if (Object.keys(itemUpdate).length > 0) {
            await prisma.orderItem.update({
              where: { id: matchingItem.id },
              data: itemUpdate,
            });
          }
        } else {
          // CC-only item — add with incremented productSlot
          const maxSlot = targetOrder.items.reduce(
            (max, i) => Math.max(max, i.productSlot),
            0,
          );

          // Resolve product map for the new item
          let productMapId: string | null = null;
          if (ccItem.externalId) {
            const pm = await prisma.productMap.findFirst({
              where: { shopifyProductId: ccItem.externalId },
            });
            productMapId = pm?.id ?? null;
          }
          if (!productMapId && ccItem.sku) {
            const pm = await prisma.productMap.findFirst({
              where: { sku: ccItem.sku },
            });
            productMapId = pm?.id ?? null;
          }

          await prisma.orderItem.create({
            data: {
              orderId: targetOrder.id,
              productSlot: maxSlot + 1 + data.items.indexOf(ccItem),
              productMapId,
              ccCrmId: ccItem.ccCrmId,
              ccCampaignProductId: ccItem.ccCampaignProductId,
              externalId: ccItem.externalId ?? null,
              name: ccItem.name,
              sku: ccItem.sku,
              price: ccItem.price,
              quantity: ccItem.quantity,
              recurringStatus: ccItem.recurringstatus
                ? (ccItem.recurringstatus.replace(' ', '_').toUpperCase() as never)
                : null,
              billingCycleNumber: ccItem.billingCycleNumber,
              productCategoryId: ccItem.productCategoryId,
              productCategoryName: ccItem.productCategoryName,
              merchantId: ccItem.merchantId ?? null,
              responseType: ccItem.responseType ?? null,
              txnType: ccItem.txnType ?? null,
              productType: ccItem.productType ?? null,
              productDescription: ccItem.productDescription ?? null,
            },
          });
        }
      }

      // Write CC attribution
      if (data.attribution) {
        await upsertAttribution(targetOrder.id, data.attribution);
      }

      return { created: false };
    }
    // No matching Shopify order found — fall through to standard upsert
  }

  // --- Standard upsert path ---
  const existing = await prisma.order.findUnique({
    where: {
      source_sourceOrderId: { source: data.source, sourceOrderId: data.sourceOrderId },
    },
  });

  const orderPayload = {
    customerId: customer.id,
    status: data.status,
    responseType: (data.responseType as ResponseType) ?? undefined,
    orderTotal: data.orderTotal,
    totalPrice: data.totalPrice,
    totalShipping: data.totalShipping,
    totalDiscount: data.totalDiscount,
    salesTax: data.salesTax,
    currencyCode: data.currencyCode,
    campaignId: data.campaignId,
    campaignName: data.campaignName,
    salesUrl: data.salesUrl,
    hasUpsells: data.hasUpsells ?? false,
    couponCode: data.couponCode,
    ipAddress: data.ipAddress,
    paySource: data.paySource,
    shopifyOrderId: data.shopifyOrderId ?? null,
    ccOrderType: data.ccOrderType ?? null,
    funnelReferenceId: data.funnelReferenceId ?? null,
    declineReason: data.declineReason ?? null,
    // Payment verification
    avsResponse: data.avsResponse ?? null,
    cvvResponse: data.cvvResponse ?? null,
    cardType: data.cardType ?? null,
    cardLast4: data.cardLast4 ?? null,
    cardIsDebit: data.cardIsDebit ?? null,
    cardIsPrepaid: data.cardIsPrepaid ?? null,
    isDeclineSave: data.isDeclineSave ?? null,
    refundRemaining: data.refundRemaining ?? null,
    // Browser / device
    userAgent: data.userAgent ?? null,
    device: data.device ?? null,
    browser: data.browser ?? null,
    geoState: data.geoState ?? null,
    geoCountry: data.geoCountry ?? null,
    // CC custom
    ccCustom1: data.ccCustom1 ?? null,
    ccCustom2: data.ccCustom2 ?? null,
    // Fulfillment
    fulfillmentData: data.fulfillmentData ?? undefined,
    tags: data.tags ?? null,
    sourceClientOrderId: data.sourceClientOrderId,
    createdAt: new Date(data.createdAt),
  };

  let orderId: string;

  if (existing) {
    await prisma.order.update({ where: { id: existing.id }, data: orderPayload });
    await prisma.orderItem.deleteMany({ where: { orderId: existing.id } });
    orderId = existing.id;
  } else {
    const order = await prisma.order.create({
      data: { source: data.source, sourceOrderId: data.sourceOrderId, ...orderPayload },
    });
    orderId = order.id;
  }

  await writeOrderItems(orderId, data.items);

  // Write attribution if present
  if (data.attribution) {
    await upsertAttribution(orderId, data.attribution);
  }

  return { created: !existing };
}

async function upsertAttribution(orderId: string, data: AttributionData): Promise<void> {
  const existing = await prisma.attribution.findUnique({ where: { orderId } });
  if (existing) {
    await prisma.attribution.update({ where: { orderId }, data });
  } else {
    await prisma.attribution.create({ data: { orderId, ...data } });
  }
}

async function upsertSubscription(data: SubscriptionData): Promise<{ created: boolean }> {
  const customer = await prisma.customer.findUnique({ where: { email: data.customerEmail } });
  if (!customer) throw new Error(`Customer not found for subscription: ${data.customerEmail}`);

  // Try to find matching product map via shopify external ID
  let productMapId: string | null = null;
  if (data.shopifyExternalId) {
    const pm = await prisma.productMap.findFirst({
      where: { shopifyProductId: data.shopifyExternalId },
    });
    productMapId = pm?.id ?? null;
  }

  const existing = data.ccPurchaseId
    ? await prisma.subscription.findUnique({ where: { ccPurchaseId: data.ccPurchaseId } })
    : null;

  const payload = {
    customerId: customer.id,
    status: data.status,
    recurringPrice: data.recurringPrice,
    campaignId: data.campaignId,
    startedAt: new Date(data.startedAt),
    nextBillDate: data.nextBillDate ? new Date(data.nextBillDate) : null,
    productMapId,
    ccClientPurchaseId: data.ccClientPurchaseId,
    originalOrderId: data.originalOrderId,
  };

  if (existing) {
    await prisma.subscription.update({ where: { id: existing.id }, data: payload });
    return { created: false };
  }

  await prisma.subscription.create({
    data: { ccPurchaseId: data.ccPurchaseId, ...payload },
  });
  return { created: true };
}

async function writeOrderItems(orderId: string, items: OrderItemData[]): Promise<void> {
  for (const item of items) {
    let productMapId: string | null = null;

    // Match priority: Shopify variant ID → Shopify product ID → CC externalId → SKU
    if (item.shopifyVariantId) {
      const pm = await prisma.productMap.findFirst({
        where: { shopifyVariantId: item.shopifyVariantId },
      });
      productMapId = pm?.id ?? null;
    } else if (item.shopifyProductId) {
      const pm = await prisma.productMap.findFirst({
        where: { shopifyProductId: item.shopifyProductId },
      });
      productMapId = pm?.id ?? null;
    } else if (item.externalId) {
      // CC externalId = Shopify product ID
      const pm = await prisma.productMap.findFirst({
        where: { shopifyProductId: item.externalId },
      });
      productMapId = pm?.id ?? null;
    }
    // Fallback: match by SKU when no ID match
    if (!productMapId && item.sku) {
      const pm = await prisma.productMap.findFirst({
        where: { sku: item.sku },
      });
      productMapId = pm?.id ?? null;
    }

    await prisma.orderItem.create({
      data: {
        orderId,
        productSlot: item.productSlot,
        productMapId,
        ccCrmId: item.ccCrmId,
        ccCampaignProductId: item.ccCampaignProductId,
        externalId: item.externalId ?? item.shopifyVariantId ?? null,
        name: item.name,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        recurringStatus: item.recurringstatus
          ? (item.recurringstatus.replace(' ', '_').toUpperCase() as never)
          : null,
        billingCycleNumber: item.billingCycleNumber,
        productCategoryId: item.productCategoryId,
        productCategoryName: item.productCategoryName,
        merchantId: item.merchantId ?? null,
        responseType: item.responseType ?? null,
        txnType: item.txnType ?? null,
        productType: item.productType ?? null,
        productDescription: item.productDescription ?? null,
      },
    });
  }
}
