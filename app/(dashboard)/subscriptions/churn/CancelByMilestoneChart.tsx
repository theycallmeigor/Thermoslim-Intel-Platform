// app/(dashboard)/subscriptions/churn/CancelByMilestoneChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';

export interface MilestoneBar {
  cycle: string;
  count: number;
}

export function CancelByMilestoneChart({ data }: { data: MilestoneBar[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No milestone data</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis dataKey="cycle" tick={{ fill: chartColors.tick, fontSize: 10 }} />
        <YAxis tick={{ fill: chartColors.tick, fontSize: 10 }} />
        <Tooltip
          contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
          labelFormatter={(l) => `After cycle ${l}`}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Cancellations">
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? chartColors.red : chartColors.orange} fillOpacity={Math.max(0.4, 1 - i * 0.08)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
