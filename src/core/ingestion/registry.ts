import { IAdapter } from '../types/adapter';

const adapters = new Map<string, IAdapter>();

export function registerAdapter(adapter: IAdapter): void {
  adapters.set(adapter.name, adapter);
}

export function getAdapter(name: string): IAdapter | undefined {
  return adapters.get(name);
}

export function getAllAdapters(): IAdapter[] {
  return Array.from(adapters.values());
}

let initialized = false;

/**
 * Register all known adapters. Safe to call multiple times — idempotent.
 * Must be called before any getAdapter() / getAllAdapters() usage.
 * Import is dynamic to avoid circular deps and keep adapters tree-shakeable.
 */
export async function initRegistry(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const [{ ShopifyAdapter }, { CheckoutChampAdapter }, { ClarityAdapter }] = await Promise.all([
    import('@/adapters/shopify'),
    import('@/adapters/checkoutchamp'),
    import('@/adapters/clarity'),
  ]);

  registerAdapter(new ShopifyAdapter());
  registerAdapter(new CheckoutChampAdapter());
  registerAdapter(new ClarityAdapter());
}
