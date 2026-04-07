import { syncShopifySubscriptions } from '../src/services/sync-shopify-subscriptions';

(async () => {
  const result = await syncShopifySubscriptions();
  console.log('Backfill complete:', result);
  process.exit(0);
})();
