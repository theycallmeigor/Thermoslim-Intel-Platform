// app/(dashboard)/subscriptions/churn/ChurnTrendChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';

export interface ChurnDay {
  date: string;
  cancelled: number;
  paused: number;
  resumed: number;
  churnRate: number;
}

const pctFormatter = (v: number) => `${v.toFixed(1)}%`;

export function ChurnTrendChart({ data }: { data: ChurnDay[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No churn data</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis dataKey="date" tick={{ fill: chartColors.tick, fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis yAxisId="rate" tickFormatter={pctFormatter} tick={{ fill: chartColors.tick, fontSize: 10 }} />
        <YAxis yAxisId="count" orientation="right" tick={{ fill: chartColors.tick, fontSize: 10 }} />
        <Tooltip
          contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
          formatter={(value: number, name: string) => name === 'Churn Rate' ? `${value.toFixed(2)}%` : value}
        />
        <Line yAxisId="rate" type="monotone" dataKey="churnRate" stroke={chartColors.primary} strokeWidth={2} dot={false} name="Churn Rate" />
        <Line yAxisId="count" type="monotone" dataKey="cancelled" stroke={chartColors.red} strokeWidth={1.5} dot={false} name="Cancelled" strokeDasharray="4 2" />
        <Line yAxisId="count" type="monotone" dataKey="paused" stroke={chartColors.orange} strokeWidth={1.5} dot={false} name="Paused" strokeDasharray="4 2" />
        <Line yAxisId="count" type="monotone" dataKey="resumed" stroke="#22d3ee" strokeWidth={1.5} dot={false} name="Resumed" strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  );
}
