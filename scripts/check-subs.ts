import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  const byStatus = await db.subscription.groupBy({
    by: ['status'],
    _count: true,
    orderBy: { _count: { status: 'desc' } },
  });
  console.log('Status breakdown:');
  console.table(byStatus.map(r => ({ status: r.status, count: r._count })));
  console.log('Total:', byStatus.reduce((s, r) => s + r._count, 0));

  // When did ACTIVE subscriptions start?
  const activeDates = await db.subscription.groupBy({
    by: ['status'],
    where: { status: 'ACTIVE' },
    _min: { startedAt: true },
    _max: { startedAt: true },
  });
  console.log('\nActive subscription date range:');
  console.table(activeDates.map(r => ({
    status: r.status,
    earliest: r._min.startedAt?.toISOString().split('T')[0],
    latest: r._max.startedAt?.toISOString().split('T')[0],
  })));

  // Count active subs by start month
  const active = await db.subscription.findMany({
    where: { status: 'ACTIVE' },
    select: { startedAt: true },
  });
  const byMonth: Record<string, number> = {};
  for (const s of active) {
    if (!s.startedAt) continue;
    const m = s.startedAt.toISOString().slice(0, 7);
    byMonth[m] = (byMonth[m] ?? 0) + 1;
  }
  console.log('\nActive subs by start month:');
  for (const [m, c] of Object.entries(byMonth).sort()) console.log(`  ${m}: ${c}`);

  await db.$disconnect();
}
main().catch(console.error);
