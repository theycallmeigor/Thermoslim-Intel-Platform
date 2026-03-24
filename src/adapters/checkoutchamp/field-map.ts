import type { OrderStatus, PaySource, ResponseType, SubscriptionStatus } from '@prisma/client';

// CC orderStatus → unified OrderStatus
export const orderStatusMap: Record<string, OrderStatus> = {
  COMPLETE: 'COMPLETE',
  PARTIAL: 'PARTIAL',
  PENDING: 'PENDING',
  DECLINED: 'DECLINED',
  REFUNDED: 'REFUNDED',
  // Legacy response_type values (webhooks may still send these)
  SUCCESS: 'COMPLETE',
  HARD_DECLINE: 'DECLINED',
  SOFT_DECLINE: 'DECLINED',
  COD_PENDING: 'PENDING',
};

// CC paySource → our enum (PAYPAL and others map to null via the adapter)
export const paySourceMap: Record<string, PaySource> = {
  CREDITCARD: 'CREDITCARD',
  CHECK: 'CHECK',
  ACCTONFILE: 'ACCTONFILE',
  COD: 'COD',
  PREPAID: 'PREPAID',
  APPLEPAY: 'APPLEPAY',
  GOOGLEPAY: 'GOOGLEPAY',
};

// CC responseType → unified ResponseType
export const responseTypeMap: Record<string, ResponseType> = {
  SUCCESS: 'SUCCESS',
  HARD_DECLINE: 'HARD_DECLINE',
  SOFT_DECLINE: 'SOFT_DECLINE',
  PENDING: 'PENDING',
  COD_PENDING: 'COD_PENDING',
};

// CC purchaseStatus → unified SubscriptionStatus
export const subscriptionStatusMap: Record<string, SubscriptionStatus> = {
  TRIAL: 'TRIAL',
  ACTIVE: 'ACTIVE',
  RECYCLE_BILLING: 'RECYCLE_BILLING',
  RECYCLE_FAILED: 'RECYCLE_FAILED',
  COMPLETE: 'COMPLETE',
  CANCELLED: 'CANCELLED',
  PAUSED: 'PAUSED',
  // Legacy casing from old API
  Trial: 'TRIAL',
  Active: 'ACTIVE',
  'Recycle Billing': 'RECYCLE_BILLING',
  'Recycle Failed': 'RECYCLE_FAILED',
  Complete: 'COMPLETE',
  Cancelled: 'CANCELLED',
};
