// Backfill numeric CC order IDs on MERGED orders
// Usage: npx tsx scripts/backfill-cc-ids.ts

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

import { CheckoutChampAdapter } from '../src/adapters/checkoutchamp';

async function main() {
  const adapter = new CheckoutChampAdapter();
  await adapter.connect();
  console.log('Connected to CC API');

  const now = new Date();
  const batchDays = 7;
  const totalDays = 90;

  for (let offset = 0; offset < totalDays; offset += batchDays) {
    const endDate = new Date(now.getTime() - offset * 86400000);
    const startDate = new Date(endDate.getTime() - batchDays * 86400000);

    const label = `${startDate.toISOString().slice(0, 10)} → ${endDate.toISOString().slice(0, 10)}`;
    console.log(`Syncing ${label}`);
    try {
      const result = await adapter.sync({ fullSync: false, startDate, endDate });
      console.log(`  processed: ${result.recordsProcessed}, updated: ${result.recordsUpdated}, errors: ${result.errors.length}`);
    } catch (err) {
      console.error(`  FAILED: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log('\nDone — all batches synced');
}

main().catch(e => { console.error(e); process.exit(1); });
