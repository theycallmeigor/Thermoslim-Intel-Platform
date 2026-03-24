import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocal = path.resolve(process.cwd(), '.env.local');
const envFile = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
else if (fs.existsSync(envFile)) dotenv.config({ path: envFile });

async function main() {
  const { ShopifyAdapter } = await import('../src/adapters/shopify');
  const adapter = new ShopifyAdapter();
  console.log('🔌 Connecting to Shopify...');
  await adapter.connect();
  console.log('✅ Connected\n📦 Syncing orders (pulling tags)...');
  const result = await adapter.sync();
  console.log(`✅ Done — ${result.recordsProcessed} processed, ${result.recordsCreated} created, ${result.recordsUpdated} updated, ${result.errors.length} errors in ${(result.duration/1000).toFixed(1)}s`);
  if (result.errors.length > 0) result.errors.slice(0,5).forEach(e => console.log(`  ❌ ${e.recordId}: ${e.message}`));
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
