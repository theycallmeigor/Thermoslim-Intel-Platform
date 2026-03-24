import type { OrderStatus, PaySource } from '@prisma/client';

// Maps Shopify financial_status → unified OrderStatus enum
export const orderStatusMap: Record<string, OrderStatus> = {
  pending: 'PENDING',
  authorized: 'PENDING',
  partially_paid: 'PARTIAL',
  paid: 'COMPLETE',
  partially_refunded: 'PARTIAL',
  refunded: 'REFUNDED',
  voided: 'DECLINED',
};

// Maps Shopify payment_gateway → unified PaySource enum
export const paySourceMap: Record<string, PaySource> = {
  credit_card: 'CREDITCARD',
  shopify_payments: 'CREDITCARD',
  paypal: 'CREDITCARD',
  apple_pay: 'APPLEPAY',
  google_pay: 'GOOGLEPAY',
  check: 'CHECK',
  cod: 'COD',
};

// Maps Shopify financial_status → unified ResponseType enum
export const responseTypeMap: Record<string, string> = {
  paid: 'SUCCESS',
  partially_paid: 'SUCCESS',
  authorized: 'PENDING',
  pending: 'PENDING',
  voided: 'HARD_DECLINE',
  refunded: 'SUCCESS',
  partially_refunded: 'SUCCESS',
};
