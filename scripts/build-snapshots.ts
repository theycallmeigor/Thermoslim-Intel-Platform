import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

// ---------------------------------------------------------------------------
// CLI helpers
// ---------------------------------------------------------------------------

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

function parseArgs(): { from: Date; to: Date } {
  const args = process.argv.slice(2);
  const today = startOfDayUTC(new Date());

  if (args.includes('--today')) {
    return { from: today, to: addDays(today, 1) };
  }

  const fromArg = args.find((a) => a.startsWith('--from='));
  const from = fromArg
    ? startOfDayUTC(new Date(fromArg.split('=')[1]))
    : addDays(today, -90);

  return { from, to: addDays(today, 1) };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Dynamic import after dotenv loads
  const { rebuildSnapshots } = await import('../src/core/sync/rebuild-snapshots');

  const { from, to } = parseArgs();
  console.log(
    `📊 Building snapshots from ${from.toISOString().slice(0, 10)} to ${addDays(to, -1).toISOString().slice(0, 10)}`
  );

  const { daysProcessed, snapshotsUpserted } = await rebuildSnapshots(from, to);
  console.log(`\n✅ Done — ${daysProcessed} days processed, ${snapshotsUpserted} snapshots created/updated`);
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
