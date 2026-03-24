// One-time CC backfill script — run locally with your IP whitelisted in CC
// Usage: npm run sync:cc
// Usage (full 2yr history): npm run sync:cc -- --full
// Usage (custom start date): npm run sync:cc -- --from=2024-01-01

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local first, fall back to .env
// IMPORTANT: must happen before any adapter imports, which read process.env at module eval time.
// Static imports are hoisted in ESM, so we use dynamic import() below for the adapter.
const envLocal = path.resolve(process.cwd(), '.env.local');
const envFile = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envLocal)) {
  dotenv.config({ path: envLocal });
} else if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
}

const args = process.argv.slice(2);
const fullSync = args.includes('--full');
const fromArg = args.find(a => a.startsWith('--from='))?.split('=')[1];
const startDate = fromArg ? new Date(fromArg) : undefined;

async function main() {
  // Dynamic import so env vars are set before config.ts evaluates process.env
  const { CheckoutChampAdapter } = await import('../src/adapters/checkoutchamp');

  console.log('🔌 Connecting to CheckoutChamp...');
  const adapter = new CheckoutChampAdapter();

  await adapter.connect();
  console.log('✅ Connected\n');

  const mode = fullSync ? 'full (2 years)' : fromArg ? `from ${fromArg}` : 'last 90 days';
  console.log(`📦 Starting sync — ${mode}`);
  console.log('   This may take several minutes depending on order volume...\n');

  const result = await adapter.sync({ fullSync, startDate });

  console.log('─'.repeat(50));
  console.log(`✅ Sync complete`);
  console.log(`   Processed : ${result.recordsProcessed}`);
  console.log(`   Created   : ${result.recordsCreated}`);
  console.log(`   Updated   : ${result.recordsUpdated}`);
  console.log(`   Errors    : ${result.errors.length}`);
  console.log(`   Duration  : ${(result.duration / 1000).toFixed(1)}s`);

  if (result.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    result.errors.slice(0, 10).forEach(e => console.log(`   [${e.recordId}] ${e.message}`));
    if (result.errors.length > 10) console.log(`   ... and ${result.errors.length - 10} more`);
  }
}

main().catch(err => {
  console.error('❌ Sync failed:', err.message);
  process.exit(1);
});
