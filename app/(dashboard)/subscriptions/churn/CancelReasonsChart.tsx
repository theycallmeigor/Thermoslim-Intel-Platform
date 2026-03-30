// app/(dashboard)/subscriptions/churn/CancelReasonsChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';

export interface ReasonCount {
  reason: string;
  count: number;
}

export function CancelReasonsChart({ data }: { data: ReasonCount[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No cancel reasons recorded</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis type="number" tick={{ fill: chartColors.tick, fontSize: 10 }} />
        <YAxis dataKey="reason" type="category" tick={{ fill: chartColors.tick, fontSize: 10 }} width={110} />
        <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="count" fill={chartColors.red} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
