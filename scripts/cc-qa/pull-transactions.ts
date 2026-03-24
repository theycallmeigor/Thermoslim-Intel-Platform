/**
 * Pull transaction-level data from CC API — the ONLY source for:
 *   - declineReason (processor's actual decline text)
 *   - authCode (authorization codes)
 *   - cardBin (first 6 digits — identifies issuing bank)
 *   - merchantTxnId (processor transaction ID)
 *   - chargeback data
 *
 * Maps transactions back to orders in the database.
 *
 * Usage:
 *   npx tsx scripts/cc-qa/pull-transactions.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

const STORE_DIR = path.resolve(__dirname, 'store');

async function main() {
  const { config } = await import('../../src/core/config');
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  const baseUrl = config.checkoutChamp.apiUrl.replace(/\/$/, '');
  const authParams = {
    loginId: config.checkoutChamp.apiUsername,
    password: config.checkoutChamp.apiKey,
  };
  const formatDate = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}/${dd}/${d.getFullYear()}`;
  };

  console.log('\n' + '═'.repeat(80));
  console.log('  CC TRANSACTION PULL — declineReason, authCode, cardBin, chargebacks');
  console.log('═'.repeat(80));

  // Get date range from DB
  const oldest = await db.order.findFirst({
    where: { source: 'CHECKOUTCHAMP' },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });
  const newest = await db.order.findFirst({
    where: { source: 'CHECKOUTCHAMP' },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  if (!oldest || !newest) { console.log('  No CC orders'); return; }

  const from = oldest.createdAt;
  const to = new Date(newest.createdAt.getTime() + 86400000);
  console.log(`  Date range: ${formatDate(from)} → ${formatDate(to)}\n`);

  // First, sample to see what fields we get
  let sampleShown = false;
  const allTxns: any[] = [];

  // Fetch in 30-day chunks
  let chunkStart = new Date(from);
  while (chunkStart < to) {
    const chunkEnd = new Date(Math.min(
      chunkStart.getTime() + 30 * 86400000,
      to.getTime(),
    ));

    let page = 1;
    let totalResults = Infinity;

    while ((page - 1) * 200 < totalResults) {
      const qs = new URLSearchParams({
        ...authParams,
        startDate: formatDate(chunkStart),
        endDate: formatDate(chunkEnd),
        page: String(page),
        resultsPerPage: '200',
      });

      try {
        const res = await fetch(`${baseUrl}/transactions/query/?${qs}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (json.result !== 'SUCCESS') {
          if (typeof json.message === 'string' && json.message.toLowerCase().includes('no result')) break;
          throw new Error(`API: ${JSON.stringify(json.message)}`);
        }
        if (typeof json.message === 'string') break;

        totalResults = json.message.totalResults;
        const data = json.message.data;
        if (!data?.length) break;

        // Show sample
        if (!sampleShown && data.length > 0) {
          console.log('  SAMPLE TRANSACTION FIELDS:');
          const sample = data[0];
          const keys = Object.keys(sample).sort();
          for (const key of keys) {
            const val = sample[key];
            if (val !== null && val !== undefined && val !== '' && val !== '0') {
              const display = typeof val === 'object' ? JSON.stringify(val).slice(0, 80) : String(val).slice(0, 80);
              console.log(`    ${key.padEnd(28)} ${display}`);
            }
          }

          // Find a declined transaction to show decline fields
          const declined = data.find((t: any) => t.responseType === 'HARD_DECLINE' || t.responseType === 'SOFT_DECLINE');
          if (declined) {
            console.log('\n  SAMPLE DECLINED TRANSACTION:');
            for (const key of Object.keys(declined).sort()) {
              const val = declined[key];
              if (val !== null && val !== undefined && val !== '' && val !== '0') {
                const display = typeof val === 'object' ? JSON.stringify(val).slice(0, 80) : String(val).slice(0, 80);
                console.log(`    ${key.padEnd(28)} ${display}`);
              }
            }
          }
          sampleShown = true;
          console.log('');
        }

        allTxns.push(...data);
        page++;
      } catch (err: any) {
        console.log(`  Error ${formatDate(chunkStart)} p${page}: ${err.message}`);
        break;
      }
    }

    console.log(`  ${formatDate(chunkStart)} → ${formatDate(chunkEnd)}: ${allTxns.length} total txns`);
    chunkStart = new Date(chunkEnd.getTime() + 86400000);
  }

  console.log(`\n  Total transactions: ${allTxns.length}`);

  // ── Map transactions to orders and update ──
  console.log('\n  Mapping transactions to orders...');

  let updated = 0;
  let declinesFilled = 0;
  let notFound = 0;

  // Group by orderId
  const txnByOrder = new Map<string, any[]>();
  for (const txn of allTxns) {
    const oid = txn.orderId;
    if (!oid) continue;
    const arr = txnByOrder.get(oid) ?? [];
    arr.push(txn);
    txnByOrder.set(oid, arr);
  }

  const responseTypeMap: Record<string, string> = {
    SUCCESS: 'SUCCESS',
    HARD_DECLINE: 'HARD_DECLINE',
    SOFT_DECLINE: 'SOFT_DECLINE',
    PENDING: 'PENDING',
    COD_PENDING: 'COD_PENDING',
  };

  for (const [orderId, txns] of txnByOrder) {
    // Find the most relevant transaction (first SALE, or first declined)
    const saleTxn = txns.find((t: any) => t.txnType === 'SALE') || txns[0];

    try {
      const dbOrder = await db.order.findFirst({
        where: { source: 'CHECKOUTCHAMP', sourceOrderId: orderId },
        select: { id: true, responseType: true, declineReason: true },
      });
      if (!dbOrder) { notFound++; continue; }

      const updateData: Record<string, unknown> = {};

      // Response type from transaction
      const rt = responseTypeMap[saleTxn.responseType];
      if (rt && !dbOrder.responseType) {
        updateData.responseType = rt;
      }

      // Decline reason — the key field only available here
      const reason = saleTxn.declineReason || saleTxn.responseText || saleTxn.merchantResponse;
      if (reason && !dbOrder.declineReason) {
        updateData.declineReason = reason;
        declinesFilled++;
      }

      if (Object.keys(updateData).length > 0) {
        await db.order.update({ where: { id: dbOrder.id }, data: updateData });
        updated++;
      }
    } catch {}
  }

  console.log(`  Updated: ${updated} orders`);
  console.log(`  Decline reasons filled: ${declinesFilled}`);
  console.log(`  Not found in DB: ${notFound}`);

  // ── Stats ──
  const rtCounts: Record<string, number> = {};
  const declineReasons: Record<string, number> = {};
  for (const txn of allTxns) {
    const rt = txn.responseType || 'unknown';
    rtCounts[rt] = (rtCounts[rt] || 0) + 1;

    const dr = txn.declineReason || txn.responseText || txn.merchantResponse;
    if (dr && (txn.responseType === 'HARD_DECLINE' || txn.responseType === 'SOFT_DECLINE')) {
      declineReasons[dr] = (declineReasons[dr] || 0) + 1;
    }
  }

  console.log('\n  TRANSACTION RESPONSE TYPES:');
  for (const [rt, count] of Object.entries(rtCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${rt.padEnd(20)} ${count}`);
  }

  if (Object.keys(declineReasons).length > 0) {
    console.log('\n  DECLINE REASONS:');
    for (const [reason, count] of Object.entries(declineReasons).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
      console.log(`    ${reason.padEnd(50)} ${count}`);
    }
  }

  // Save to store
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(STORE_DIR, 'transaction-data.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalTransactions: allTxns.length,
      responseTypeCounts: rtCounts,
      declineReasons,
      ordersUpdated: updated,
      declineReasonsFilled: declinesFilled,
    }, null, 2) + '\n',
  );

  console.log(`\n  Saved: scripts/cc-qa/store/transaction-data.json`);
  console.log('═'.repeat(80) + '\n');

  await db.$disconnect();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
