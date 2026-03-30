export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { toYMD, parseRange, fmtDollars } from '@/lib/dashboard/formatting';
import { AnalyticsFilters } from './AnalyticsFilters';
import { KpiCard } from '@/components/ui/KpiCard';
import {
  DowChart, type DowData,
  RollingChart, type RollingData,
  ChannelCompChart, type ChannelSplit,
  HeatmapGrid, type HeatmapWeek,
  AnomalyList, type AnomalyData,
} from './charts';

// ─── Helpers ────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Data fetching ──────────────────────────────────────────────────────────

interface Filters {
  from?: string;
  to?: string;
  campaign?: string;
  product?: string;
  channel?: string;
  funnel?: string;
}

async function getAnalyticsData(filters: Filters) {
  const { startDate, endDate } = parseRange(filters.from, filters.to);

  // Build where clause for DailySnapshot
  const where: Record<string, unknown> = {
    date: { gte: startDate, lte: endDate },
  };
  if (filters.campaign) where.campaignId = filters.campaign;
  if (filters.product) where.productLine = filters.product;
  if (filters.channel) where.channel = filters.channel;
  if (filters.funnel) where.funnelId = filters.funnel;

  const snapshots = await prisma.dailySnapshot.findMany({
    where,
    orderBy: { date: 'asc' },
  });

  // ── Filter options (for dropdown population) ──
  const allSnaps = await prisma.dailySnapshot.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    select: { campaignId: true, campaignName: true, productLine: true, channel: true, funnelId: true },
    distinct: ['campaignId', 'productLine', 'channel', 'funnelId'],
  });

  const campaigns = [...new Map(
    allSnaps.filter(s => s.campaignId).map(s => [s.campaignId!, { id: s.campaignId!, name: s.campaignName || s.campaignId! }])
  ).values()];
  const products = [...new Set(allSnaps.map(s => s.productLine).filter(Boolean))] as string[];
  const channels = [...new Set(allSnaps.map(s => s.channel).filter(Boolean))] as string[];
  const funnels = [...new Set(allSnaps.map(s => s.funnelId).filter(Boolean))] as string[];

  // ── Aggregate by date ──
  const dailyMap = new Map<string, {
    orders: number; revenue: number; newOrders: number; recurringOrders: number;
    newSubs: number; cancelledSubs: number;
  }>();

  for (const s of snapshots) {
    const dk = toYMD(s.date);
    const entry = dailyMap.get(dk) ?? { orders: 0, revenue: 0, newOrders: 0, recurringOrders: 0, newSubs: 0, cancelledSubs: 0 };
    entry.orders += s.totalOrders;
    entry.revenue += s.totalRevenue;
    entry.newOrders += s.newOrders;
    entry.recurringOrders += s.recurringOrders;
    entry.newSubs += s.newSubscribers;
    entry.cancelledSubs += s.cancelledSubscribers;
    dailyMap.set(dk, entry);
  }

  const sortedDates = [...dailyMap.keys()].sort();

  // ── KPI cards ──
  let totalOrders = 0, totalRevenue = 0, totalNewSubs = 0, totalCancelled = 0;
  for (const d of dailyMap.values()) {
    totalOrders += d.orders;
    totalRevenue += d.revenue;
    totalNewSubs += d.newSubs;
    totalCancelled += d.cancelledSubs;
  }
  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // ── DOW chart data ──
  const dowAgg: Record<number, { orders: number; revenue: number; count: number }> = {};
  for (let i = 0; i < 7; i++) dowAgg[i] = { orders: 0, revenue: 0, count: 0 };

  for (const [dateStr, data] of dailyMap) {
    const dow = new Date(dateStr + 'T12:00:00Z').getUTCDay();
    dowAgg[dow].orders += data.orders;
    dowAgg[dow].revenue += data.revenue;
    dowAgg[dow].count += 1;
  }

  // Reorder Mon-Sun
  const dowOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
  const dowData: DowData[] = dowOrder.map(d => ({
    day: DAY_NAMES[d],
    orders: dowAgg[d].count > 0 ? Math.round(dowAgg[d].orders / dowAgg[d].count) : 0,
    revenue: dowAgg[d].count > 0 ? Math.round(dowAgg[d].revenue / dowAgg[d].count) : 0,
    aov: 0,
    isWeekend: d === 0 || d === 6,
  }));

  // ── Rolling 7-day chart ──
  const rollingData: RollingData[] = [];
  for (let i = 6; i < sortedDates.length; i++) {
    let orders7 = 0, revenue7 = 0;
    for (let j = i - 6; j <= i; j++) {
      const d = dailyMap.get(sortedDates[j])!;
      orders7 += d.orders;
      revenue7 += d.revenue;
    }
    rollingData.push({ date: sortedDates[i], orders: orders7, revenue: revenue7 });
  }

  // ── Channel composition ──
  const channelAgg = new Map<string, { weekday: number; weekend: number; total: number }>();
  for (const s of snapshots) {
    const ch = s.channel || 'unknown';
    const dk = toYMD(s.date);
    const dow = new Date(dk + 'T12:00:00Z').getUTCDay();
    const isWE = dow === 0 || dow === 6;
    const entry = channelAgg.get(ch) ?? { weekday: 0, weekend: 0, total: 0 };
    if (isWE) entry.weekend += s.totalOrders;
    else entry.weekday += s.totalOrders;
    entry.total += s.totalOrders;
    channelAgg.set(ch, entry);
  }

  const totalWD = [...channelAgg.values()].reduce((s, v) => s + v.weekday, 0) || 1;
  const totalWE = [...channelAgg.values()].reduce((s, v) => s + v.weekend, 0) || 1;
  const channelData: ChannelSplit[] = [...channelAgg.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 6)
    .map(([label, v]) => ({
      label: label.replace('cc_', 'CC ').replace('_', ' '),
      weekday: (v.weekday / totalWD) * 100,
      weekend: (v.weekend / totalWE) * 100,
    }));

  // ── Weekly heatmap ──
  const heatmapData: HeatmapWeek[] = [];
  if (sortedDates.length > 0) {
    // Group by ISO week
    const weekMap = new Map<string, { days: number[]; total: number }>();
    for (const [dateStr, data] of dailyMap) {
      const d = new Date(dateStr + 'T12:00:00Z');
      // Get Monday of this week
      const day = d.getUTCDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setUTCDate(d.getUTCDate() + mondayOffset);
      const weekKey = toYMD(monday);

      const entry = weekMap.get(weekKey) ?? { days: [0, 0, 0, 0, 0, 0, 0], total: 0 };
      const dayIndex = day === 0 ? 6 : day - 1; // Mon=0..Sun=6
      entry.days[dayIndex] += data.orders;
      entry.total += data.orders;
      weekMap.set(weekKey, entry);
    }

    for (const [weekStart, data] of [...weekMap.entries()].sort()) {
      heatmapData.push({ weekStart, days: data.days, total: data.total, note: '' });
    }

    // Mark peak week
    if (heatmapData.length > 0) {
      const peakWeek = heatmapData.reduce((max, w) => w.total > max.total ? w : max);
      peakWeek.note = 'Peak';
    }
  }

  // ── Top campaigns table ──
  const campAgg = new Map<string, { name: string; orders: number; revenue: number; newSubs: number }>();
  for (const s of snapshots) {
    if (!s.campaignId) continue;
    const entry = campAgg.get(s.campaignId) ?? { name: s.campaignName || s.campaignId, orders: 0, revenue: 0, newSubs: 0 };
    entry.orders += s.totalOrders;
    entry.revenue += s.totalRevenue;
    entry.newSubs += s.newSubscribers;
    if (s.campaignName) entry.name = s.campaignName;
    campAgg.set(s.campaignId, entry);
  }
  const topCampaigns = [...campAgg.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10)
    .map(([id, v]) => ({ id, ...v }));

  // ── Top products table ──
  const prodAgg = new Map<string, { orders: number; revenue: number }>();
  for (const s of snapshots) {
    if (!s.productLine) continue;
    const entry = prodAgg.get(s.productLine) ?? { orders: 0, revenue: 0 };
    entry.orders += s.totalOrders;
    entry.revenue += s.totalRevenue;
    prodAgg.set(s.productLine, entry);
  }
  const topProducts = [...prodAgg.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10)
    .map(([name, v]) => ({ name, ...v }));

  // ── Anomalies ──
  const anomalies = await prisma.anomaly.findMany({
    where: { acknowledged: false, resolvedAt: null },
    orderBy: [{ severity: 'desc' }, { detectedAt: 'desc' }],
    take: 20,
  });

  const anomalyData: AnomalyData[] = anomalies.map(a => ({
    id: a.id,
    type: a.type,
    severity: a.severity,
    metric: a.metric,
    dimension: a.dimension,
    dimensionValue: a.dimensionValue,
    expected: a.expected,
    actual: a.actual,
    deviation: a.deviation,
    explanation: a.explanation,
    detectedAt: a.detectedAt.toISOString(),
  }));

  return {
    kpis: { totalOrders, totalRevenue, aov, totalNewSubs, totalCancelled },
    dowData,
    rollingData,
    channelData,
    heatmapData,
    topCampaigns,
    topProducts,
    anomalyData,
    filterOptions: { campaigns, products, channels, funnels },
    dateRange: { from: toYMD(startDate), to: toYMD(endDate) },
  };
}

// ─── Page component ─────────────────────────────────────────────────────────

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; campaign?: string; product?: string; channel?: string; funnel?: string }>;
}) {
  const sp = await searchParams;
  const data = await getAnalyticsData(sp);
  const { kpis, dowData, rollingData, channelData, heatmapData, topCampaigns, topProducts, anomalyData, filterOptions, dateRange } = data;

  return (
    <div className="space-y-6">
      {/* Dimension filters (date range handled by TopBar) */}
      <AnalyticsFilters
        campaigns={filterOptions.campaigns}
        products={filterOptions.products}
        channels={filterOptions.channels}
        funnels={filterOptions.funnels}
        activeCampaign={sp.campaign ?? null}
        activeProduct={sp.product ?? null}
        activeChannel={sp.channel ?? null}
        activeFunnel={sp.funnel ?? null}
      />

      {/* Anomalies */}
      {anomalyData.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-2">Active Anomalies</h2>
          <AnomalyList anomalies={anomalyData} />
        </section>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Orders" value={kpis.totalOrders.toLocaleString()} />
        <KpiCard label="Revenue" value={fmtDollars(kpis.totalRevenue)} />
        <KpiCard label="AOV" value={fmtDollars(kpis.aov)} />
        <KpiCard label="New Subs" value={kpis.totalNewSubs.toLocaleString()} />
        <KpiCard label="Cancelled" value={kpis.totalCancelled.toLocaleString()} />
      </div>

      {/* Charts row 1 */}
      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Day of Week (avg)">
          <DowChart data={dowData} />
        </ChartCard>
        <ChartCard title="Rolling 7-Day Totals">
          <RollingChart data={rollingData} />
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Channel Composition">
          <ChannelCompChart data={channelData} />
        </ChartCard>
        <ChartCard title="Weekly Heatmap">
          <HeatmapGrid data={heatmapData} />
        </ChartCard>
      </div>

      {/* Tables */}
      <div className="grid md:grid-cols-2 gap-4">
        {topCampaigns.length > 0 && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Top Campaigns</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left py-1.5 font-medium">Campaign</th>
                  <th className="text-right py-1.5 font-medium">Orders</th>
                  <th className="text-right py-1.5 font-medium">Revenue</th>
                  <th className="text-right py-1.5 font-medium">New Subs</th>
                </tr>
              </thead>
              <tbody>
                {topCampaigns.map(c => (
                  <tr key={c.id} className="border-t border-gray-800/50">
                    <td className="py-1.5 text-gray-300 truncate max-w-[200px]">{c.name}</td>
                    <td className="py-1.5 text-right text-gray-400">{c.orders}</td>
                    <td className="py-1.5 text-right text-green-400">{fmtDollars(c.revenue)}</td>
                    <td className="py-1.5 text-right text-blue-400">{c.newSubs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {topProducts.length > 0 && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Top Products</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left py-1.5 font-medium">Product Line</th>
                  <th className="text-right py-1.5 font-medium">Orders</th>
                  <th className="text-right py-1.5 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map(p => (
                  <tr key={p.name} className="border-t border-gray-800/50">
                    <td className="py-1.5 text-gray-300">{p.name}</td>
                    <td className="py-1.5 text-right text-gray-400">{p.orders}</td>
                    <td className="py-1.5 text-right text-green-400">{fmtDollars(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-3">{title}</h3>
      {children}
    </div>
  );
}
