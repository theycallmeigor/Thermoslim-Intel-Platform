/**
 * Clarity + Funnel Sync — CLI
 *
 * Usage:
 *   npx tsx scripts/sync-clarity.ts                  # sync last 1 day of Clarity + funnels
 *   npx tsx scripts/sync-clarity.ts --days=7         # sync last 7 days of Clarity
 *   npx tsx scripts/sync-clarity.ts --clarity-only   # skip funnel sync
 *   npx tsx scripts/sync-clarity.ts --funnels-only   # only sync funnel structure
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

function parseArgs() {
  const args = process.argv.slice(2);
  let days = 1;
  let clarityOnly = false;
  let funnelsOnly = false;

  for (const arg of args) {
    if (arg.startsWith('--days=')) days = parseInt(arg.split('=')[1], 10);
    if (arg === '--clarity-only') clarityOnly = true;
    if (arg === '--funnels-only') funnelsOnly = true;
  }

  return { days, clarityOnly, funnelsOnly };
}

async function main() {
  const { days, clarityOnly, funnelsOnly } = parseArgs();

  console.log('═'.repeat(60));
  console.log('  CLARITY + FUNNEL SYNC');
  console.log('═'.repeat(60));

  // ── Step 1: Funnel structure sync ────────────────────────────────────────
  if (!clarityOnly) {
    console.log('\n── Step 1: Funnel Structure Sync ──────────────────────────────');
    try {
      const { syncFunnels } = await import('../src/adapters/checkoutchamp/funnel-sync');
      const { funnelsUpserted, pagesUpserted } = await syncFunnels();
      console.log(`  Done: ${funnelsUpserted} funnels, ${pagesUpserted} pages`);
    } catch (err) {
      console.error('  Funnel sync failed:', err instanceof Error ? err.message : err);
      if (funnelsOnly) process.exit(1);
      console.log('  Continuing with Clarity sync...');
    }
  }

  // ── Step 2: Clarity data sync ────────────────────────────────────────────
  if (!funnelsOnly) {
    console.log(`\n── Step 2: Clarity Data Sync (${days} day(s)) ─────────────────────`);
    try {
      const { ClarityAdapter } = await import('../src/adapters/clarity');
      const adapter = new ClarityAdapter();
      await adapter.connect();
      console.log('  Connected to Clarity API');

      const endDate = new Date();
      const startDate = new Date(Date.now() - days * 86400000);

      const result = await adapter.sync({ startDate, endDate });
      console.log(`  Done: ${result.recordsCreated} PageAnalytics records`);
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.length}`);
        for (const e of result.errors.slice(0, 5)) {
          console.log(`    - ${e.recordId}: ${e.message}`);
        }
      }
      console.log(`  Duration: ${(result.duration / 1000).toFixed(1)}s`);
    } catch (err) {
      console.error('  Clarity sync failed:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  Sync complete');
  console.log('═'.repeat(60) + '\n');
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
