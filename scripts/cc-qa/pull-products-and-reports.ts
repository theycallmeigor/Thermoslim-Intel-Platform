/**
 * Pull product catalog + summary reports from CC API:
 *   1. product/query — full product catalog
 *   2. order/summary reportType=gateway — per-gateway approve/decline rates
 *   3. order/summary reportType=funnel — per-funnel conversion data
 *   4. order/summary reportType=date — daily volume trends
 *   5. reports/mid-summary — MID health (approved/declined/refunded per gateway)
 *
 * Usage:
 *   npx tsx scripts/cc-qa/pull-products-and-reports.ts
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

  async function apiGet(endpoint: string, params: Record<string, string>): Promise<any> {
    const qs = new URLSearchParams({ ...authParams, ...params });
    const res = await fetch(`${baseUrl}${endpoint}?${qs}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${endpoint}`);
    return res.json();
  }

  console.log('\n' + '═'.repeat(80));
  console.log('  CC DATA PULL — Products + Summary Reports');
  console.log('═'.repeat(80));

  const startDate = '01/01/2025';
  const endDate = formatDate(new Date());

  // ═══════════════════════════════════════════════════════════
  //  1. PRODUCT CATALOG
  // ═══════════════════════════════════════════════════════════
  console.log('\n  ── 1. Product Catalog ──');
  try {
    const campaignProducts = await apiGet('/product/query/', { campaignId: '2' });
    if (campaignProducts.result === 'SUCCESS' && typeof campaignProducts.message !== 'string') {
      const products = campaignProducts.message.data || campaignProducts.message;
      console.log(`  Campaign products: ${Array.isArray(products) ? products.length : 'object'}`);
      if (Array.isArray(products)) {
        for (const p of products.slice(0, 20)) {
          console.log(`    ID:${String(p.campaignProductId || p.productId).padEnd(6)} ${(p.productName || p.name || '').padEnd(50)} $${p.price || '?'}`);
        }
      } else {
        // Products might be an object keyed by ID
        const entries = Object.entries(products);
        console.log(`  ${entries.length} products found`);
        for (const [id, p] of entries.slice(0, 20)) {
          const prod = p as any;
          console.log(`    ID:${id.padEnd(6)} ${(prod.productName || prod.name || '').padEnd(50)} $${prod.price || '?'}`);
        }
      }
    } else {
      console.log(`  Campaign products response: ${JSON.stringify(campaignProducts.message).slice(0, 200)}`);
    }

    // Also get base products
    const baseProducts = await apiGet('/product/query/', { allProducts: '1' });
    if (baseProducts.result === 'SUCCESS' && typeof baseProducts.message !== 'string') {
      const products = baseProducts.message.data || baseProducts.message;
      const count = Array.isArray(products) ? products.length : Object.keys(products).length;
      console.log(`  Base products: ${count}`);
    }
  } catch (err: any) {
    console.log(`  Product query failed: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════════
  //  2. ORDER SUMMARY — by gateway
  // ═══════════════════════════════════════════════════════════
  console.log('\n  ── 2. Order Summary by Gateway ──');
  try {
    const gatewayReport = await apiGet('/order/summary/', {
      startDate, endDate, reportType: 'gateway',
    });
    if (gatewayReport.result === 'SUCCESS') {
      const data = typeof gatewayReport.message === 'object' && !Array.isArray(gatewayReport.message)
        ? gatewayReport.message.data || [gatewayReport.message]
        : gatewayReport.message;
      console.log('  Gateway performance:');
      if (Array.isArray(data)) {
        for (const g of data) {
          console.log(`    Gateway ${String(g.gatewayId || g.name || g.merchantId || '?').padEnd(15)} | `
            + `Approved: ${g.approvedCount || g.approved || '?'} | `
            + `Declined: ${g.declinedCount || g.declined || '?'} | `
            + `Revenue: $${g.approvedAmount || g.revenue || '?'}`);
        }
      } else {
        console.log(`  Raw: ${JSON.stringify(data).slice(0, 500)}`);
      }
    } else {
      console.log(`  Response: ${JSON.stringify(gatewayReport.message).slice(0, 300)}`);
    }
  } catch (err: any) {
    console.log(`  Gateway summary failed: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════════
  //  3. ORDER SUMMARY — by funnel
  // ═══════════════════════════════════════════════════════════
  console.log('\n  ── 3. Order Summary by Funnel ──');
  try {
    const funnelReport = await apiGet('/order/summary/', {
      startDate, endDate, reportType: 'funnel',
    });
    if (funnelReport.result === 'SUCCESS') {
      const data = typeof funnelReport.message === 'object' && !Array.isArray(funnelReport.message)
        ? funnelReport.message.data || [funnelReport.message]
        : funnelReport.message;
      console.log('  Funnel conversion data:');
      if (Array.isArray(data)) {
        for (const f of data) {
          console.log(`    ${JSON.stringify(f).slice(0, 120)}`);
        }
      } else {
        console.log(`  Raw: ${JSON.stringify(data).slice(0, 500)}`);
      }
    } else {
      console.log(`  Response: ${JSON.stringify(funnelReport.message).slice(0, 300)}`);
    }
  } catch (err: any) {
    console.log(`  Funnel summary failed: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════════
  //  4. ORDER SUMMARY — by date (last 30 days)
  // ═══════════════════════════════════════════════════════════
  console.log('\n  ── 4. Order Summary by Date (last 30 days) ──');
  try {
    const thirtyDaysAgo = formatDate(new Date(Date.now() - 30 * 86400000));
    const dateReport = await apiGet('/order/summary/', {
      startDate: thirtyDaysAgo, endDate, reportType: 'date',
    });
    if (dateReport.result === 'SUCCESS') {
      const data = typeof dateReport.message === 'object' && !Array.isArray(dateReport.message)
        ? dateReport.message.data || [dateReport.message]
        : dateReport.message;
      if (Array.isArray(data)) {
        console.log('  Date'.padEnd(14) + 'Orders'.padStart(8) + 'Revenue'.padStart(12) + 'Declined'.padStart(10));
        console.log('  ' + '-'.repeat(44));
        for (const d of data.slice(-15)) {
          console.log(`  ${String(d.date || d.dateCreated || '?').padEnd(12)} ${String(d.orderCount || d.orders || '?').padStart(8)} ${String(d.revenue ? '$' + d.revenue : '?').padStart(12)} ${String(d.declinedCount || d.declined || '?').padStart(10)}`);
        }
      } else {
        console.log(`  Raw: ${JSON.stringify(data).slice(0, 500)}`);
      }
    } else {
      console.log(`  Response: ${JSON.stringify(dateReport.message).slice(0, 300)}`);
    }
  } catch (err: any) {
    console.log(`  Date summary failed: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════════
  //  5. MID SUMMARY — gateway health
  // ═══════════════════════════════════════════════════════════
  console.log('\n  ── 5. MID Summary (Gateway Health) ──');
  try {
    const midReport = await apiGet('/reports/mid-summary/', {
      startDate, endDate,
    });
    if (midReport.result === 'SUCCESS' && typeof midReport.message !== 'string') {
      const data = midReport.message.data || [];
      console.log('  MID Health:');
      console.log('  ' + 'MID'.padEnd(8) + 'Approved'.padStart(10) + 'Declined'.padStart(10) + 'Refunded'.padStart(10) + 'Approve%'.padStart(10));
      console.log('  ' + '-'.repeat(48));
      for (const m of data) {
        const total = (m.approved || 0) + (m.declined || 0);
        const approvePct = total > 0 ? ((m.approved || 0) / total * 100).toFixed(1) : '?';
        console.log(`  ${String(m.midId).padEnd(8)} ${String(m.approved || 0).padStart(10)} ${String(m.declined || 0).padStart(10)} ${String(m.refunded || 0).padStart(10)} ${String(approvePct + '%').padStart(10)}`);
      }
    } else {
      console.log(`  Response: ${JSON.stringify(midReport.message).slice(0, 300)}`);
    }
  } catch (err: any) {
    console.log(`  MID summary failed: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════════
  //  6. ORDER SUMMARY — by product
  // ═══════════════════════════════════════════════════════════
  console.log('\n  ── 6. Order Summary by Product ──');
  try {
    const productReport = await apiGet('/order/summary/', {
      startDate, endDate, reportType: 'product',
    });
    if (productReport.result === 'SUCCESS') {
      const data = typeof productReport.message === 'object' && !Array.isArray(productReport.message)
        ? productReport.message.data || [productReport.message]
        : productReport.message;
      if (Array.isArray(data)) {
        for (const p of data.slice(0, 20)) {
          console.log(`    ${JSON.stringify(p).slice(0, 120)}`);
        }
      } else {
        console.log(`  Raw: ${JSON.stringify(data).slice(0, 500)}`);
      }
    } else {
      console.log(`  Response: ${JSON.stringify(productReport.message).slice(0, 300)}`);
    }
  } catch (err: any) {
    console.log(`  Product summary failed: ${err.message}`);
  }

  // Save all raw report data
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
  console.log(`\n  All data logged above — review and we'll map what's valuable.`);
  console.log('═'.repeat(80) + '\n');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
