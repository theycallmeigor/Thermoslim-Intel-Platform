// app/(dashboard)/orders/payments/DeclineTrendChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';

export interface DeclineDay {
  date: string;
  total: number;
  declined: number;
  rate: number;
}

export function DeclineTrendChart({ data }: { data: DeclineDay[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No payment data</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis dataKey="date" tick={{ fill: chartColors.tick, fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fill: chartColors.tick, fontSize: 10 }} unit="%" />
        <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => v.toFixed(1) + '%'} />
        <Line type="monotone" dataKey="rate" stroke={chartColors.red} strokeWidth={2} dot={false} name="Decline Rate" />
      </LineChart>
    </ResponsiveContainer>
  );
}
