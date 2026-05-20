// src/lib/dashboard/colors.ts

/** Order status → Tailwind badge classes */
export const statusColors: Record<string, string> = {
  COMPLETE: 'bg-green-500/10 text-green-400',
  PENDING: 'bg-yellow-500/10 text-yellow-400',
  PARTIAL: 'bg-blue-500/10 text-blue-400',
  REFUNDED: 'bg-purple-500/10 text-purple-400',
  DECLINED: 'bg-red-500/10 text-red-400',
};

/** Order source → Tailwind badge classes */
export const sourceColors: Record<string, string> = {
  SHOPIFY: 'bg-emerald-500/10 text-emerald-400',
  CHECKOUTCHAMP: 'bg-blue-500/10 text-blue-400',
  MERGED: 'bg-blue-500/10 text-blue-400',
};

/** Subscription status → Tailwind badge classes */
export const subscriptionStatusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400',
  TRIAL: 'bg-blue-500/10 text-blue-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
  PAUSED: 'bg-yellow-500/10 text-yellow-400',
  RECYCLE_BILLING: 'bg-orange-500/10 text-orange-400',
  RECYCLE_FAILED: 'bg-red-500/10 text-red-400',
  COMPLETE: 'bg-gray-500/10 text-gray-400',
};

/** Humanized source display name */
export function humanizeSource(source: string): string {
  const map: Record<string, string> = {
    SHOPIFY: 'Shopify',
    CHECKOUTCHAMP: 'CC',
    MERGED: 'CC↔S',
  };
  return map[source] ?? source;
}

/** Humanized status display name */
export function humanizeStatus(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** Humanized source label from order fields */
export function getSourceLabel(order: {
  source: string;
  ccSourceOrderId?: string | null;
  ccCustom1?: string | null;
  tags?: string | null;
}): { label: string; linked: boolean } {
  if (order.source === 'MERGED') return { label: 'CC', linked: true };
  if (order.source === 'CHECKOUTCHAMP') return { label: 'CC', linked: false };
  if (order.ccCustom1 || (order.tags && /New Sale|Recurring|Subscription/.test(order.tags))) {
    return { label: 'CC', linked: true };
  }
  return { label: 'Shopify', linked: false };
}

/** Detect subscription/rebill from order fields */
export function getOrderType(order: {
  ccOrderType?: string | null;
  tags?: string | null;
}): 'rebill' | 'subscription' | 'one-time' {
  if (order.ccOrderType === 'REBILL') return 'rebill';
  const tags = (order.tags ?? '').toLowerCase();
  if (tags.includes('recurring')) return 'rebill';
  if (tags.includes('subscription') || tags.includes('loop') || tags.includes('prepaid')) return 'subscription';
  return 'one-time';
}

/** Recharts color palette for consistent chart styling */
export const chartColors = {
  primary: '#3b82f6',
  green: '#10b981',
  purple: '#8b5cf6',
  orange: '#f59e0b',
  red: '#ef4444',
  cyan: '#06b6d4',
  grid: '#1f2937',
  tick: '#6b7280',
  tooltipBg: '#111827',
  tooltipBorder: '#374151',
} as const;
