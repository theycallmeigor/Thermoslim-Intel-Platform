// app/(dashboard)/subscriptions/churn/ChurnTrendChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';

export interface ChurnDay {
  date: string;
  cancelled: number;
  paused: number;
}

export function ChurnTrendChart({ data }: { data: ChurnDay[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No churn data</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis dataKey="date" tick={{ fill: chartColors.tick, fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fill: chartColors.tick, fontSize: 10 }} />
        <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} />
        <Line type="monotone" dataKey="cancelled" stroke={chartColors.red} strokeWidth={2} dot={false} name="Cancelled" />
        <Line type="monotone" dataKey="paused" stroke={chartColors.orange} strokeWidth={2} dot={false} name="Paused" />
      </LineChart>
    </ResponsiveContainer>
  );
}
