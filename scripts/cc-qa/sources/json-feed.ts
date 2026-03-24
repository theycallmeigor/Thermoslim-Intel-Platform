/**
 * JSON feed source adapter — for network logs, recordings, external feeds
 *
 * Expects JSON files with structure:
 * [{ timestamp, orderId, status, paySource, funnelId, campaignName, orderTotal, product, ...meta }]
 *
 * Usage:
 *   const source = createJsonFeedSource('/path/to/feed.json');
 *   // or for a directory of JSON files:
 *   const source = createJsonFeedSource('/path/to/feeds/');
 */
import * as fs from 'fs';
import * as path from 'path';
import type { SourceAdapter, CCEvent } from '../types';

export function createJsonFeedSource(filePath: string): SourceAdapter {
  return {
    name: `json:${path.basename(filePath)}`,
    async pull(from: Date, to: Date): Promise<CCEvent[]> {
      const files: string[] = [];

      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        for (const f of fs.readdirSync(filePath)) {
          if (f.endsWith('.json')) files.push(path.join(filePath, f));
        }
      } else {
        files.push(filePath);
      }

      const events: CCEvent[] = [];
      for (const file of files) {
        const raw = JSON.parse(fs.readFileSync(file, 'utf-8'));
        const records = Array.isArray(raw) ? raw : [raw];

        for (const r of records) {
          const ts = new Date(r.timestamp || r.createdAt || r.date);
          if (ts < from || ts > to) continue;

          const paySource = r.paySource || r.payMethod || r.payment_method || null;
          const status = normalizeStatus(r.status);
          const isAbandon = (!paySource || paySource === 'unknown') && status === 'PARTIAL';
          events.push({
            timestamp: ts,
            orderId: r.orderId || r.id || `json-${Date.now()}`,
            status,
            paySource,
            funnelId: r.funnelId || r.funnel_id || r.funnelReferenceId || null,
            campaignName: r.campaignName || r.campaign || null,
            orderTotal: r.orderTotal || r.total || r.amount || 0,
            product: r.product || r.productName || r.item || null,
            isAbandon,
            meta: r,  // keep the full record for downstream analysis
          });
        }
      }

      return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    },
  };
}

function normalizeStatus(s: string): CCEvent['status'] {
  if (!s) return 'PARTIAL';
  const upper = s.toUpperCase();
  if (upper.includes('COMPLETE') || upper.includes('SUCCESS') || upper.includes('APPROVED')) return 'COMPLETE';
  if (upper.includes('DECLINE') || upper.includes('REJECT') || upper.includes('DENIED')) return 'DECLINED';
  if (upper.includes('REFUND')) return 'REFUNDED';
  return 'PARTIAL';
}
