// Shopify adapter — custom app with static access token
// See docs/adapters/shopify-adapter.md for spec

import { config } from '../../core/config';
import type { IAdapter, NormalizedRecord, SyncOptions, SyncResult, SyncError } from '../../core/types';
import { orderStatusMap, paySourceMap, responseTypeMap } from './field-map';
import { runIngestion } from '../../core/ingestion/pipeline';
import { prisma } from '../../lib/prisma';

// --- Shopify REST API raw types ---

interface ShopifyAddress {
  first_name?: string;
  last_name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  country?: string;
  zip?: string;
  phone?: string;
}

interface ShopifySellingPlan {
  selling_plan_id: number;
  name: string;           // e.g., "Delivery every 30 days"
}

interface ShopifyLineItem {
  id: number;
  variant_id: number | null;
  product_id: number | null;
  name: string;
  sku: string | null;
  price: string;
  quantity: number;
  vendor: string | null;
  selling_plan_allocation?: {
    selling_plan: ShopifySellingPlan;
  } | null;
}

interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  orders_count: number;
  total_spent: string;
  tags: string;
  default_address?: ShopifyAddress;
}

interface ShopifyRefundLineItem {
  line_item_id: number;
  quantity: number;
  subtotal: string;
}

interface ShopifyRefund {
  id: number;
  created_at: string;
  note: string | null;
  refund_line_items: ShopifyRefundLineItem[];
  transactions: Array<{ amount: string; kind: string }>;
}

interface ShopifyFulfillment {
  id: number;
  status: string;         // "success", "cancelled", "error", "failure"
  tracking_number: string | null;
  tracking_company: string | null;
  tracking_url: string | null;
  created_at: string;
  shipment_status: string | null;
}

interface ShopifyOrder {
  id: number;
  financial_status: string;
  email: string;
  phone: string | null;
  total_price: string;
  subtotal_price: string;
  total_shipping_price_set?: { shop_money: { amount: string } };
  total_discounts: string;
  total_tax: string;
  currency: string;
  payment_gateway: string;
  browser_ip: string | null;
  created_at: string;
  customer: ShopifyCustomer | null;
  line_items: ShopifyLineItem[];
  billing_address: ShopifyAddress | null;
  shipping_address: ShopifyAddress | null;
  discount_codes: Array<{ code: string; amount: string; type: string }>;
  discount_applications: Array<{ type: string; title: string; value: string; value_type: string; target_type: string }>;
  tags: string;
  source_name: string;
  note: string | null;
  note_attributes: Array<{ name: string; value: string }>;
  fulfillment_status: string | null;
  fulfillments: ShopifyFulfillment[];
  refunds: ShopifyRefund[];
}

interface ShopifyProductVariant {
  id: number;
  sku: string | null;
  price: string;
  title: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  product_type: string;
  status: string;
  variants: ShopifyProductVariant[];
}

// Convert Shopify price string ("99.99") to cents integer
function toCents(value: string | undefined | null): number {
  return Math.round(parseFloat(value || '0') * 100);
}

// Exported for use by sync-shopify-subscriptions service
export function shopifyGraphQL(): { url: string; headers: Record<string, string> } {
  const domain = config.shopify.storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return {
    url: `https://${domain}/admin/api/2024-10/graphql.json`,
    headers: {
      'X-Shopify-Access-Token': config.shopify.accessToken,
      'Content-Type': 'application/json',
    },
  };
}

export class ShopifyAdapter implements IAdapter {
  name = 'shopify';
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    const domain = config.shopify.storeUrl
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    this.baseUrl = `https://${domain}/admin/api/2024-10`;
    this.headers = {
      'X-Shopify-Access-Token': config.shopify.accessToken,
      'Content-Type': 'application/json',
    };
  }

  async connect(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/shop.json`, { headers: this.headers });
    if (!res.ok) {
      throw new Error(`Shopify connection failed: ${res.status} ${res.statusText}`);
    }
  }

  async sync(options?: SyncOptions): Promise<SyncResult> {
    const start = Date.now();
    const errors: SyncError[] = [];
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;

    // Sync products first — they populate the ProductMap used by order items
    const products = await this.fetchAll<ShopifyProduct>('products', 'products');
    for (const product of products) {
      const records = this.mapProductToSchema(product);
      const result = await runIngestion(records);
      recordsCreated += result.created;
      recordsUpdated += result.updated;
    }
    recordsProcessed += products.length;

    // Sync orders with line items (customers are embedded in the response)
    const orderParams = new URLSearchParams({ status: 'any', limit: '250' });
    if (options?.startDate) orderParams.set('created_at_min', options.startDate.toISOString());
    if (options?.endDate) orderParams.set('created_at_max', options.endDate.toISOString());

    const orders = await this.fetchAll<ShopifyOrder>('orders', 'orders', orderParams);
    for (const order of orders) {
      try {
        const records = this.mapOrderToSchema(order);
        const result = await runIngestion(records);
        recordsCreated += result.created;
        recordsUpdated += result.updated;
      } catch (err) {
        errors.push({
          recordId: String(order.id),
          message: err instanceof Error ? err.message : 'Unknown error',
          payload: { orderId: order.id },
        });
      }
    }
    recordsProcessed += orders.length;

    return {
      source: this.name,
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      errors,
      duration: Date.now() - start,
    };
  }

  // Dispatcher — detects record type by structure
  mapToSchema(raw: unknown): NormalizedRecord[] {
    const obj = raw as Record<string, unknown>;
    if ('line_items' in obj) return this.mapOrderToSchema(raw as unknown as ShopifyOrder);
    if ('variants' in obj) return this.mapProductToSchema(raw as unknown as ShopifyProduct);
    return this.mapCustomerToSchema(raw as unknown as ShopifyCustomer);
  }

  async handleWebhook(payload: unknown): Promise<void> {
    const event = payload as { topic: string; data: unknown };
    if (!event.topic || !event.data) return;

    if (event.topic === 'orders/create' || event.topic === 'orders/updated') {
      const records = this.mapOrderToSchema(event.data as ShopifyOrder);
      await runIngestion(records);
    } else if (event.topic === 'products/update' || event.topic === 'products/create') {
      const records = this.mapProductToSchema(event.data as ShopifyProduct);
      await runIngestion(records);
    } else if (event.topic === 'refunds/create') {
      const refund = event.data as { order_id: number };
      if (!refund.order_id) return;
      const shopifyOrderId = String(refund.order_id);
      // Update whichever row owns this Shopify order (SHOPIFY or MERGED)
      const result = await prisma.order.updateMany({
        where: {
          sourceOrderId: shopifyOrderId,
          source: { in: ['SHOPIFY', 'MERGED'] },
        },
        data: { status: 'REFUNDED' },
      });
      console.log(`[shopify adapter] refunds/create: updated ${result.count} order(s) to REFUNDED for shopifyOrderId=${shopifyOrderId}`);
    } else if (event.topic === 'products/delete') {
      const product = event.data as { id: number };
      console.log(`[shopify adapter] products/delete received for productId=${product.id} — ProductMap entry retained for order history`);
    }
  }

  async disconnect(): Promise<void> {
    // Stateless HTTP — nothing to tear down
  }

  // --- Private: fetch with cursor-based pagination ---

  private async fetchAll<T>(
    path: string,
    responseKey: string,
    params?: URLSearchParams,
  ): Promise<T[]> {
    const results: T[] = [];
    const baseParams = new URLSearchParams({ limit: '250' });
    if (params) params.forEach((v, k) => baseParams.set(k, v));

    let url: string | null = `${this.baseUrl}/${path}.json?${baseParams}`;

    while (url) {
      const res = await fetch(url, { headers: this.headers });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') ?? '2', 10);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }

      if (!res.ok) {
        throw new Error(`Shopify API error ${res.status} fetching ${path}`);
      }

      const json = await res.json() as Record<string, T[]>;
      results.push(...(json[responseKey] ?? []));
      url = this.parseNextUrl(res.headers.get('Link'));
    }

    return results;
  }

  private parseNextUrl(linkHeader: string | null): string | null {
    if (!linkHeader) return null;
    const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    return match ? match[1] : null;
  }

  // --- Private: schema mappers ---

  private mapOrderToSchema(order: ShopifyOrder): NormalizedRecord[] {
    const records: NormalizedRecord[] = [];
    const customerEmail = order.email || order.customer?.email || '';

    if (customerEmail) {
      records.push({
        type: 'customer',
        data: {
          email: customerEmail,
          shopifyCustomerId: order.customer?.id ? String(order.customer.id) : undefined,
          firstName: order.customer?.first_name ?? undefined,
          lastName: order.customer?.last_name ?? undefined,
          fullName: order.customer
            ? [order.customer.first_name, order.customer.last_name].filter(Boolean).join(' ') || undefined
            : undefined,
          phone: order.phone ?? order.customer?.phone ?? undefined,
          billingAddress: order.billing_address ?? undefined,
          shippingAddress: order.shipping_address ?? undefined,
          shopifyOrdersCount: order.customer?.orders_count ?? undefined,
          shopifyTotalSpent: order.customer?.total_spent ? toCents(order.customer.total_spent) : undefined,
          customerTags: order.customer?.tags ?? undefined,
        },
      });
    }

    records.push({
      type: 'order',
      data: {
        source: 'SHOPIFY',
        sourceOrderId: String(order.id),
        customerEmail,
        status: orderStatusMap[order.financial_status] ?? 'PENDING',
        responseType: responseTypeMap[order.financial_status] ?? 'SUCCESS',
        orderTotal: toCents(order.subtotal_price),
        totalPrice: toCents(order.total_price),
        totalShipping: toCents(order.total_shipping_price_set?.shop_money.amount),
        totalDiscount: toCents(order.total_discounts),
        salesTax: toCents(order.total_tax),
        currencyCode: order.currency ?? 'USD',
        couponCode: order.discount_codes?.[0]?.code ?? null,
        ipAddress: order.browser_ip ?? null,
        paySource: paySourceMap[order.payment_gateway] ?? null,
        tags: order.tags || null,
        createdAt: order.created_at,
        // Fulfillment data
        fulfillmentStatus: order.fulfillment_status ?? null,
        fulfillmentData: order.fulfillments?.length > 0 ? JSON.stringify(order.fulfillments.map(f => ({
          trackingNumber: f.tracking_number,
          carrier: f.tracking_company,
          trackingUrl: f.tracking_url,
          status: f.status,
          shippedAt: f.created_at,
        }))) : null,
        // Note/attributes
        note: order.note ?? null,
        items: order.line_items.map((item, idx) => ({
          productSlot: idx + 1,
          shopifyVariantId: item.variant_id ? String(item.variant_id) : null,
          shopifyProductId: item.product_id ? String(item.product_id) : null,
          name: item.name,
          sku: item.sku ?? null,
          price: toCents(item.price),
          quantity: item.quantity,
          vendor: item.vendor ?? null,
          // Loop subscription detection via selling_plan
          sellingPlan: item.selling_plan_allocation?.selling_plan?.name ?? null,
        })),
      },
    });

    // Create RevenueEvent records for refunds
    if (order.refunds?.length > 0) {
      for (const refund of order.refunds) {
        const refundAmount = refund.transactions
          ?.filter(t => t.kind === 'refund')
          .reduce((s, t) => s + toCents(t.amount), 0) ?? 0;

        if (refundAmount > 0) {
          records.push({
            type: 'revenue_event' as any,
            data: {
              sourceOrderId: String(order.id),
              customerEmail,
              eventType: 'REFUND',
              amount: refundAmount,
              reason: refund.note ?? 'Shopify refund',
              occurredAt: refund.created_at,
            },
          });
        }
      }
    }

    return records;
  }

  private mapProductToSchema(product: ShopifyProduct): NormalizedRecord[] {
    return product.variants.map(variant => ({
      type: 'product' as const,
      data: {
        shopifyProductId: String(product.id),
        shopifyVariantId: String(variant.id),
        // Use "Product - Variant" name when there are multiple variants
        name: product.variants.length > 1
          ? `${product.title} - ${variant.title}`
          : product.title,
        sku: variant.sku ?? null,
        category: product.product_type || null,
      },
    }));
  }

  private mapCustomerToSchema(customer: ShopifyCustomer): NormalizedRecord[] {
    return [{
      type: 'customer',
      data: {
        email: customer.email,
        shopifyCustomerId: String(customer.id),
        firstName: customer.first_name ?? undefined,
        lastName: customer.last_name ?? undefined,
        fullName: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || undefined,
        phone: customer.phone ?? undefined,
        billingAddress: customer.default_address ?? undefined,
      },
    }];
  }
}
