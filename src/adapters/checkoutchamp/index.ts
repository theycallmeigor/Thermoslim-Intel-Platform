// CheckoutChamp adapter — implements IAdapter
// See docs/adapters/checkoutchamp-adapter.md for spec

import { ProxyAgent } from 'undici';
import { config } from '../../core/config';
import type { IAdapter, NormalizedRecord, SyncOptions, SyncResult, SyncError } from '../../core/types';
import { orderStatusMap, paySourceMap, responseTypeMap, subscriptionStatusMap } from './field-map';
import { runIngestion } from '../../core/ingestion/pipeline';

// Route CC API calls through QuoteGuard static IP proxy
const proxyDispatcher = config.proxy.quoteguardUrl
  ? new ProxyAgent(config.proxy.quoteguardUrl)
  : undefined;

// ─── CC API raw types (actual response shape) ────────────────────────────────

interface CCItem {
  productId: string;
  transactionItemId: string;
  name: string;
  variantDetailId: string;
  variantName: string;
  externalProductId: string;   // Shopify product ID
  qty: string;
  shipping: string;
  price: string;
  purchaseId: string;           // Non-empty = subscription item
  clientPurchaseId: string;     // Client-assigned purchase ID
  purchaseStatus: string;       // ACTIVE, CANCELLED, etc.
  nextBillDate: string;
  cancelAfterDate: string;
  txnType: string;             // SALE, REBILL, CHARGEBACK
  productType: string;         // OFFER, UPSALE
  orderItemId: string;
  productSku: string;
  replacedByOrderItemId: string;
  responseType: string;
  salesTax: string;
  actualProductId: string;
  currentProductId: string;
  currentPrice: string;
  currentQty: string;
  pauseScheduled: string;
  cancellationScheduled: string;
  merchantId: string;
  productDescription: string;
}

interface CCOrder {
  orderId: string;
  actualOrderId: number;
  externalOrderId: string;     // Shopify order ID
  clientOrderId: string;
  orderType: string;           // NEW_SALE, REBILL, CHARGEBACK
  orderStatus: string;         // COMPLETE, PENDING, PARTIAL, DECLINED, REFUNDED
  dateCreated: string;         // "YYYY-MM-DD HH:MM:SS"
  dateUpdated: string;
  totalAmount: string;
  price: string;
  baseShipping: string;
  discountPrice: string;
  salesTax: string;
  surcharge: string | null;
  shipUpcharge: string;
  currencyCode: string;
  currencySymbol: string;
  campaignId: number;
  campaignName: string;
  salesUrl: string;
  paySource: string;
  couponCode: string | null;
  ipAddress: string;
  hasUpsell: boolean;
  funnelReferenceId: string;
  responseType: string;      // SUCCESS, HARD_DECLINE, SOFT_DECLINE, PENDING, COD_PENDING
  declineReason: string;     // processor decline reason text
  // Customer
  customerId: number;
  emailAddress: string;
  firstName: string;
  lastName: string;
  name: string;
  phoneNumber: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  shipFirstName: string;
  shipLastName: string;
  shipAddress1: string;
  shipAddress2: string | null;
  shipCity: string;
  shipState: string;
  shipCountry: string;
  shipPostalCode: string;
  // Attribution
  sourceId: string | null;
  sourceTitle: string | null;
  affId: string | null;
  sourceValue1: string | null;
  sourceValue2: string | null;
  sourceValue3: string | null;
  sourceValue4: string | null;
  sourceValue5: string | null;
  UTMSource: string | null;
  UTMMedium: string | null;
  UTMCampaign: string | null;
  UTMTerm: string | null;
  UTMContent: string | null;
  custom1: string | null;
  custom2: string | null;
  custom3: string | null;
  custom4: string | null;
  custom5: string | null;
  // Top-level subscription fields (Profiles 3 & 4 — not available in CC API order response)
  purchaseId: string | null;         // Subscription ID (top-level, for lifecycle events)
  clientPurchaseId: string | null;   // Client purchase ID (top-level)
  recurringPrice: string | null;     // Subscription recurring price
  originalOrderId: string | null;    // Original order that started the subscription
  // Payment verification
  avsResponse: string | null;
  cvvResponse: string | null;
  cardType: string | null;
  cardLast4: string | null;
  cardIsDebit: string | null;     // "1" or ""
  cardIsPrepaid: string | null;   // "1" or ""
  isDeclineSave: string | null;   // "1" or ""
  refundRemaining: string | null;
  // Browser details (when includeBrowserDetails=1)
  browserDetails?: {
    userAgent?: string;
    device?: string;
    browser?: string;
    geoState?: string;
    geoCountry?: string;
    requestUri?: string;
    acceptHeader?: string;
    httpReferer?: string;
  };
  // Fulfillment
  fulfillments?: Array<Record<string, unknown>>;
  // Items: object keyed by productId
  items: Record<string, CCItem>;
}

interface CCApiResponse {
  result: string;        // "SUCCESS" | "ERROR"
  message: {
    totalResults: number;
    resultsPerPage: number;
    page: number;
    data: CCOrder[];
  } | string;           // string on error
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toCents(value: string | null | undefined): number {
  return Math.round(parseFloat(value || '0') * 100);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// "YYYY-MM-DD HH:MM:SS" → ISO string
function ccDateToIso(dateStr: string): string {
  return dateStr.replace(' ', 'T');
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export class CheckoutChampAdapter implements IAdapter {
  name = 'checkoutchamp';
  private baseUrl: string;
  private authParams: Record<string, string>;

  constructor() {
    this.baseUrl = config.checkoutChamp.apiUrl.replace(/\/$/, '');
    this.authParams = {
      loginId: config.checkoutChamp.apiUsername,
      password: config.checkoutChamp.apiKey,
    };
  }

  async connect(): Promise<void> {
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    const today = formatDate(new Date());
    const res = await this.apiGet('/order/query/', { startDate: yesterday, endDate: today, page: '1' });
    if (res.result !== 'SUCCESS') {
      const msg = typeof res.message === 'string' ? res.message : JSON.stringify(res.message);
      throw new Error(`CC connection failed: ${msg}`);
    }
  }

  async sync(options?: SyncOptions): Promise<SyncResult> {
    const start = Date.now();
    const errors: SyncError[] = [];
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;

    const endDate = options?.endDate ?? new Date();
    const startDate = options?.startDate ?? new Date(
      options?.fullSync
        ? Date.now() - 730 * 86400000
        : Date.now() - 90 * 86400000
    );

    // Query in 30-day chunks to avoid timeouts
    let chunkStart = new Date(startDate);
    while (chunkStart < endDate) {
      const chunkEnd = new Date(Math.min(
        chunkStart.getTime() + 30 * 86400000,
        endDate.getTime()
      ));

      console.log(`  Fetching ${formatDate(chunkStart)} → ${formatDate(chunkEnd)}...`);
      const orders = await this.fetchOrders(chunkStart, chunkEnd);
      console.log(`  Got ${orders.length} orders`);

      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        if (i > 0 && i % 50 === 0) {
          console.log(`  Progress: ${i}/${orders.length} (${recordsCreated} created, ${recordsUpdated} updated, ${errors.length} errors)`);
        }
        try {
          const records = this.mapOrderToSchema(order);
          // Skip per-order post-hooks during bulk sync — we fire QA once at the end
          const result = await runIngestion(records, { source: 'sync', skipPostHooks: true });
          recordsCreated += result.created;
          recordsUpdated += result.updated;
        } catch (err) {
          errors.push({
            recordId: order.orderId,
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      recordsProcessed += orders.length;
      chunkStart = new Date(chunkEnd.getTime() + 86400000);
    }

    // Fire post-hooks once after the full sync completes
    if (recordsProcessed > 0) {
      const { notifyOrdersIngested } = await import('../../core/ingestion/post-hooks');
      notifyOrdersIngested(recordsProcessed, 'sync');
    }

    return {
      source: this.name,
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      errors,
      duration: Date.now() - start,
    };
  }

  mapToSchema(raw: unknown): NormalizedRecord[] {
    return this.mapOrderToSchema(raw as CCOrder);
  }

  async handleWebhook(payload: unknown, options?: { source?: 'webhook' | 'sync' | 'manual' }): Promise<void> {
    const raw = payload as Record<string, string>;
    if (!raw.orderId) return;

    // CC webhook field names differ from CC API field names — normalize before processing.
    // Webhook: orderTotal → API: totalAmount
    // Webhook: clientOrderId → API: orderId (alphanumeric string)
    // Webhook: orderId (numeric) → API: actualOrderId
    const normalized: Record<string, unknown> = { ...raw };
    if (raw.orderTotal && !raw.totalAmount) normalized.totalAmount = raw.orderTotal;
    if (raw.clientOrderId && !normalized.orderId) normalized.orderId = raw.clientOrderId;

    // CC GET postbacks are thin (no totalAmount/items) — try to fetch full order from API.
    // PARTIAL events are abandoned checkouts — no complete order exists in CC,
    // so skip the API fetch and save the thin record as-is.
    // If the CC API call fails, fall back to saving the thin record so the order at least
    // lands in the DB; the scheduled sync will enrich it with full details later.
    let order: CCOrder = normalized as unknown as CCOrder;
    const isPartial = raw.orderStatus === 'PARTIAL';
    const isThin = !raw.orderTotal && !raw.totalAmount && !raw.items;
    if (isThin && !isPartial) {
      try {
        const full = await this.fetchOrderById(raw.orderId, raw.dateCreated);
        if (full) {
          order = full;
        } else {
          console.warn(`[cc adapter] handleWebhook: no full order found for orderId=${raw.orderId}, saving thin record`);
        }
      } catch (err) {
        console.error(`[cc adapter] handleWebhook: CC API fetch failed for orderId=${raw.orderId}, saving thin record:`, err);
      }
    }

    const records = this.mapOrderToSchema(order);
    console.log(`[cc adapter] ingesting orderId=${raw.orderId}, records=${records.length}, isThin=${isThin}`);
    try {
      const result = await runIngestion(records, { source: options?.source ?? 'webhook' });
      console.log(`[cc adapter] ingestion done: created=${result.created}, updated=${result.updated}`);
    } catch (err) {
      console.error(`[cc adapter] runIngestion failed for orderId=${raw.orderId}:`, err instanceof Error ? err.message : err);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    // Stateless HTTP
  }

  // ─── Private: API ──────────────────────────────────────────────────────────

  private async fetchOrderById(orderId: string, dateCreated?: string): Promise<CCOrder | null> {
    if (!dateCreated) return null;
    const date = new Date(dateCreated.replace(' ', 'T'));
    const orders = await this.fetchOrders(date, new Date(date.getTime() + 86400000));
    console.log(`[cc adapter] fetchOrderById: looking for orderId=${orderId} in ${orders.length} orders`);
    if (orders.length > 0) {
      console.log(`[cc adapter] first order sample: orderId=${orders[0].orderId}, actualOrderId=${orders[0].actualOrderId}`);
    }
    // CC postback sends numeric order ID — try matching both orderId and actualOrderId
    const match = orders.find(
      o => String(o.actualOrderId) === String(orderId) || String(o.orderId) === String(orderId)
    );
    if (!match) {
      console.warn(`[cc adapter] fetchOrderById: no match for orderId=${orderId}`);
    }
    return match ?? null;
  }

  private async apiGet(path: string, params: Record<string, string>): Promise<CCApiResponse> {
    const qs = new URLSearchParams({ ...this.authParams, ...params });
    const url = `${this.baseUrl}${path}?${qs}`;
    const res = await fetch(url, { method: 'GET', dispatcher: proxyDispatcher } as RequestInit);
    if (!res.ok) throw new Error(`CC API HTTP error ${res.status} on ${path}`);
    return res.json() as Promise<CCApiResponse>;
  }

  private async fetchOrders(startDate: Date, endDate: Date): Promise<CCOrder[]> {
    const orders: CCOrder[] = [];
    let page = 1;
    let totalResults = Infinity;

    while ((page - 1) * 200 < totalResults) {
      const json = await this.apiGet('/order/query/', {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        page: String(page),
        resultsPerPage: '200',
        includeBrowserDetails: '1',
        includeCustomFields: '1',
      });

      if (json.result !== 'SUCCESS') {
        const msg = typeof json.message === 'string' ? json.message : JSON.stringify(json.message);
        // "No orders matching" is not a real error — just an empty range, stop paginating
        if (typeof json.message === 'string' && json.message.toLowerCase().includes('no orders')) {
          break;
        }
        throw new Error(`CC API error: ${msg}`);
      }

      if (typeof json.message === 'string') break;

      totalResults = json.message.totalResults;
      const data = json.message.data;
      if (!data?.length) break;

      orders.push(...data);
      page++;
    }

    return orders;
  }

  // ─── Private: schema mapping ───────────────────────────────────────────────

  private mapOrderToSchema(order: CCOrder): NormalizedRecord[] {
    const records: NormalizedRecord[] = [];

    // Customer
    records.push({
      type: 'customer',
      data: {
        email: order.emailAddress,
        ccCustomerId: order.customerId ? String(order.customerId) : undefined,
        firstName: order.firstName || undefined,
        lastName: order.lastName || undefined,
        fullName: order.name || undefined,
        phone: order.phoneNumber || undefined,
        billingAddress: order.address1 ? {
          address1: order.address1,
          address2: order.address2 ?? null,
          city: order.city,
          province: order.state,
          zip: order.postalCode,
          country: order.country,
        } : undefined,
        shippingAddress: order.shipAddress1 ? {
          address1: order.shipAddress1,
          address2: order.shipAddress2 ?? null,
          city: order.shipCity,
          province: order.shipState,
          zip: order.shipPostalCode,
          country: order.shipCountry,
        } : undefined,
      },
    });

    // Build normalized items from items object
    const items = this.extractItems(order);

    // Determine total price: use price field (matches totalAmount for most orders)
    const totalPrice = toCents(order.price || order.totalAmount);
    const totalShipping = toCents(order.baseShipping);
    const totalDiscount = toCents(order.discountPrice);
    const salesTax = toCents(order.salesTax);

    // Order
    records.push({
      type: 'order',
      data: {
        source: 'CHECKOUTCHAMP',
        sourceOrderId: order.orderId,
        sourceClientOrderId: order.clientOrderId || null,
        customerEmail: order.emailAddress,
        status: orderStatusMap[order.orderStatus] ?? 'PENDING',
        responseType: responseTypeMap[order.responseType] ?? undefined,
        orderTotal: toCents(order.totalAmount),
        totalPrice,
        totalShipping,
        totalDiscount,
        salesTax,
        currencyCode: order.currencyCode || 'USD',
        campaignId: order.campaignId ? String(order.campaignId) : null,
        campaignName: order.campaignName || null,
        salesUrl: order.salesUrl || null,
        hasUpsells: order.hasUpsell ?? false,
        couponCode: order.couponCode || null,
        ipAddress: order.ipAddress || null,
        paySource: paySourceMap[order.paySource] ?? null,
        declineReason: order.declineReason || null,
        shopifyOrderId: order.externalOrderId || null,
        ccOrderType: order.orderType || null,
        funnelReferenceId: order.funnelReferenceId || null,
        // Payment verification
        avsResponse: order.avsResponse || null,
        cvvResponse: order.cvvResponse || null,
        cardType: order.cardType || null,
        cardLast4: order.cardLast4 || null,
        cardIsDebit: order.cardIsDebit === '1' ? true : order.cardIsDebit === '' ? false : null,
        cardIsPrepaid: order.cardIsPrepaid === '1' ? true : order.cardIsPrepaid === '' ? false : null,
        isDeclineSave: order.isDeclineSave === '1' ? true : null,
        refundRemaining: order.refundRemaining ? toCents(order.refundRemaining) : null,
        // Browser details
        userAgent: order.browserDetails?.userAgent || null,
        device: order.browserDetails?.device || null,
        browser: order.browserDetails?.browser || null,
        geoState: order.browserDetails?.geoState || null,
        geoCountry: order.browserDetails?.geoCountry || null,
        // Custom fields
        ccCustom1: order.custom1 || null,
        ccCustom2: order.custom2 || null,
        ccCustom3: order.custom3 || null,
        ccCustom4: order.custom4 || null,
        ccCustom5: order.custom5 || null,
        // Fulfillment
        fulfillmentData: order.fulfillments || null,
        createdAt: ccDateToIso(order.dateCreated),
        items,
        attribution: {
          sourceId: order.sourceId || null,
          pubId: order.affId || null,
          subAffId: null,
          sourceValue1: order.sourceValue1 || null,
          sourceValue2: order.sourceValue2 || null,
          sourceValue3: order.sourceValue3 || null,
          sourceValue4: order.sourceValue4 || null,
          sourceValue5: order.sourceValue5 || null,
          utmSource: order.UTMSource || null,
          utmMedium: order.UTMMedium || null,
          utmCampaign: order.UTMCampaign || null,
          utmContent: order.UTMContent || null,
          utmTerm: order.UTMTerm || null,
          httpReferer: order.browserDetails?.httpReferer || null,
          userAgent: order.browserDetails?.userAgent || null,
        },
      },
    });

    // Subscriptions: one record per item that has a purchaseId
    for (const item of items) {
      if (!item.ccPurchaseId) continue;

      const billingCycle = item.billingCycleNumber as number | null;
      // orderType is not available as a CC webhook token — infer REBILL from billingCycleNumber
      const inferredOrderType = billingCycle != null && billingCycle > 1 ? 'REBILL' : (order.orderType || null);

      // Prefer item-level recurringPrice; fall back to top-level recurringPrice field (Profile 3)
      const recurringPrice = (item.price as number) || toCents(order.recurringPrice);

      // Use top-level originalOrderId if present (Profile 4 lifecycle events)
      const originalOrderId = order.originalOrderId || order.orderId;

      records.push({
        type: 'subscription',
        data: {
          customerEmail: order.emailAddress,
          ccPurchaseId: item.ccPurchaseId as string,
          ccClientPurchaseId: (item.ccClientPurchaseId as string | null) || null,
          originalOrderId,
          status: subscriptionStatusMap[item.purchaseStatus as string] ?? 'ACTIVE',
          recurringPrice,
          campaignId: order.campaignId ? String(order.campaignId) : null,
          startedAt: ccDateToIso(order.dateCreated),
          nextBillDate: item.nextBillDate
            ? ccDateToIso(item.nextBillDate as string)
            : null,
          shopifyExternalId: item.externalId as string | null,
          billingCycleNumber: billingCycle,
          orderType: inferredOrderType,
        },
      });
    }

    return records;
  }

  private extractItems(order: CCOrder): Array<Record<string, unknown>> {
    // CC API returns nested items object; CC webhook sends flat product1_* keys
    const flat = order as unknown as Record<string, string>;
    if (!order.items && flat.product1_name) {
      const items: Array<Record<string, unknown>> = [];
      for (let i = 1; i <= 5; i++) {
        if (!flat[`product${i}_name`]) break;
        items.push({
          productSlot: i,
          ccCrmId: flat[`product${i}_crmId`] || null,
          ccCampaignProductId: flat[`product${i}_campaignProductId`] || null,
          externalId: flat[`product${i}_externalId`] || null,
          name: flat[`product${i}_name`],
          sku: flat[`product${i}_sku`] || null,
          price: toCents(flat[`product${i}_price`]),
          quantity: parseInt(flat[`product${i}_qty`] || '1', 10),
          ccPurchaseId: flat[`product${i}_purchaseId`] || null,
          ccClientPurchaseId: flat[`product${i}_clientPurchaseId`] || null,
          purchaseStatus: flat[`product${i}_recurringstatus`] || null,
          nextBillDate: flat[`product${i}_nextBillDate`] || null,
          recurringstatus: flat[`product${i}_recurringstatus`] || null,
          billingCycleNumber: flat[`product${i}_billingCycleNumber`] ? parseInt(flat[`product${i}_billingCycleNumber`], 10) : null,
          productCategoryId: flat[`product${i}_productCategoryId`] || null,
          productCategoryName: flat[`product${i}_productCategoryName`] || null,
          merchantId: null,
          responseType: null,
          txnType: null,
          productType: null,
          productDescription: null,
        });
      }
      if (items.length > 0) return items;

      // No product slots — fall back to top-level subscription fields.
      // Profile 4 lifecycle events (Cancel/Pause/Deactivate) may not include product rows.
      if (order.purchaseId) {
        return [{
          productSlot: 1,
          ccCrmId: null,
          ccCampaignProductId: null,
          externalId: null,
          name: flat.campaignName || 'Subscription',
          sku: null,
          price: toCents(order.recurringPrice),
          quantity: 1,
          ccPurchaseId: order.purchaseId,
          ccClientPurchaseId: order.clientPurchaseId || null,
          purchaseStatus: flat.orderStatus || null,
          nextBillDate: null,
          recurringstatus: flat.orderStatus || null,
          billingCycleNumber: null,
          productCategoryId: null,
          productCategoryName: null,
          merchantId: null,
          responseType: null,
          txnType: null,
          productType: null,
          productDescription: null,
        }];
      }

      return [];
    }

    if (!order.items || typeof order.items !== 'object') return [];

    return Object.values(order.items).map((item, index) => ({
      productSlot: index + 1,
      ccCrmId: item.productId || null,
      ccCampaignProductId: item.transactionItemId || null,
      externalId: item.externalProductId || null,   // Shopify product ID
      name: item.name,
      sku: item.productSku || null,
      price: toCents(item.price),
      quantity: parseInt(item.qty || '1', 10),
      ccPurchaseId: item.purchaseId || null,         // present = subscription item
      ccClientPurchaseId: item.clientPurchaseId || null,
      purchaseStatus: item.purchaseStatus || null,
      nextBillDate: item.nextBillDate || null,
      recurringstatus: item.purchaseStatus || null,
      billingCycleNumber: null,
      productCategoryId: null,
      productCategoryName: null,
      merchantId: item.merchantId || null,
      responseType: item.responseType || null,
      txnType: item.txnType || null,
      productType: item.productType || null,
      productDescription: item.productDescription || null,
    }));
  }
}
