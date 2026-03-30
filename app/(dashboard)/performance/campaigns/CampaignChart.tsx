// app/(dashboard)/performance/campaigns/CampaignChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';
import { fmtDollars } from '@/lib/dashboard/formatting';

export interface CampaignBar {
  name: string;
  revenue: number;
  orders: number;
}

export function CampaignChart({ data }: { data: CampaignBar[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No campaign data</p>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 140 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis type="number" tick={{ fill: chartColors.tick, fontSize: 10 }} tickFormatter={(v) => fmtDollars(v)} />
        <YAxis dataKey="name" type="category" tick={{ fill: chartColors.tick, fontSize: 10 }} width={130} />
        <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmtDollars(v)} />
        <Bar dataKey="revenue" fill={chartColors.primary} radius={[0, 4, 4, 0]} name="Revenue" />
      </BarChart>
    </ResponsiveContainer>
  );
}
