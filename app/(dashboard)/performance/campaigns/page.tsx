// app/(dashboard)/performance/campaigns/page.tsx
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { fmt$, fmtK, fmtDollars, parseRange } from '@/lib/dashboard/formatting';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { CampaignChart, type CampaignBar } from './CampaignChart';

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { startDate, endDate } = parseRange(sp.from, sp.to);

  const snapshots = await prisma.dailySnapshot.findMany({
    where: { date: { gte: startDate, lte: endDate }, campaignId: { not: '' } },
    select: { campaignId: true, campaignName: true, totalOrders: true, totalRevenue: true, newSubscribers: true, newOrders: true, recurringOrders: true },
  });

  // Aggregate by campaign
  const campMap = new Map<string, { name: string; orders: number; revenue: number; newSubs: number; newOrders: number; recurringOrders: number }>();
  for (const s of snapshots) {
    if (!s.campaignId) continue;
    const entry = campMap.get(s.campaignId) ?? { name: s.campaignName || s.campaignId, orders: 0, revenue: 0, newSubs: 0, newOrders: 0, recurringOrders: 0 };
    entry.orders += s.totalOrders;
    entry.revenue += s.totalRevenue;
    entry.newSubs += s.newSubscribers;
    entry.newOrders += s.newOrders;
    entry.recurringOrders += s.recurringOrders;
    if (s.campaignName) entry.name = s.campaignName;
    campMap.set(s.campaignId, entry);
  }

  const campaigns = [...campMap.entries()]
    .map(([id, v]) => ({ id, ...v, aov: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0 }))
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const totalOrders = campaigns.reduce((s, c) => s + c.orders, 0);
  const totalNewSubs = campaigns.reduce((s, c) => s + c.newSubs, 0);

  const chartData: CampaignBar[] = campaigns.slice(0, 10).map(c => ({
    name: c.name.length > 25 ? c.name.slice(0, 22) + '...' : c.name,
    revenue: c.revenue,
    orders: c.orders,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Campaign Performance" subtitle="Revenue and orders by campaign" />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Revenue" value={fmtK(totalRevenue)} />
        <KpiCard label="Total Orders" value={totalOrders.toLocaleString()} />
        <KpiCard label="New Subscribers" value={totalNewSubs.toLocaleString()} />
        <KpiCard label="Campaigns Active" value={campaigns.length.toLocaleString()} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Top 10 Campaigns by Revenue</h3>
        <CampaignChart data={chartData} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">All Campaigns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Campaign</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Orders</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">New</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Recurring</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Revenue</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">AOV</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">New Subs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 text-gray-300 text-xs truncate max-w-[200px]">{c.name}</td>
                  <td className="px-6 py-3.5 text-right text-gray-300 tabular-nums">{c.orders}</td>
                  <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{c.newOrders}</td>
                  <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{c.recurringOrders}</td>
                  <td className="px-6 py-3.5 text-right text-gray-200 tabular-nums font-medium">{fmtK(c.revenue)}</td>
                  <td className="px-6 py-3.5 text-right text-gray-400 tabular-nums">{fmt$(c.aov)}</td>
                  <td className="px-6 py-3.5 text-right text-blue-400 tabular-nums">{c.newSubs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
