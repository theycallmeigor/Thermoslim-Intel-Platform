// CheckoutChamp adapter — implements IAdapter
// See docs/adapters/checkoutchamp-adapter.md for spec

import { config } from '../../core/config';
import type { IAdapter, NormalizedRecord, SyncOptions, SyncResult, SyncError } from '../../core/types';
import { orderStatusMap, paySourceMap, responseTypeMap, subscriptionStatusMap } from './field-map';
import { runIngestion } from '../../core/ingestion/pipeline';

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
  purchaseId: string;          // Non-empty = subscription item
  purchaseStatus: string;      // ACTIVE, CANCELLED, etc.
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
    const order = payload as CCOrder;
    if (!order.orderId) return;
    const records = this.mapOrderToSchema(order);
    await runIngestion(records, { source: options?.source ?? 'webhook' });
  }

  async disconnect(): Promise<void> {
    // Stateless HTTP
  }

  // ─── Private: API ──────────────────────────────────────────────────────────

  private async apiGet(path: string, params: Record<string, string>): Promise<CCApiResponse> {
    const qs = new URLSearchParams({ ...this.authParams, ...params });
    const url = `${this.baseUrl}${path}?${qs}`;
    const res = await fetch(url, { method: 'GET' });
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
      records.push({
        type: 'subscription',
        data: {
          customerEmail: order.emailAddress,
          ccPurchaseId: item.ccPurchaseId as string,
          ccClientPurchaseId: null,
          originalOrderId: order.orderId,
          status: subscriptionStatusMap[item.purchaseStatus as string] ?? 'ACTIVE',
          recurringPrice: item.price as number,
          campaignId: order.campaignId ? String(order.campaignId) : null,
          startedAt: ccDateToIso(order.dateCreated),
          nextBillDate: item.nextBillDate
            ? ccDateToIso(item.nextBillDate as string)
            : null,
          shopifyExternalId: item.externalId as string | null,
        },
      });
    }

    return records;
  }

  private extractItems(order: CCOrder): Array<Record<string, unknown>> {
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
