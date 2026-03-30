// app/(dashboard)/orders/refunds/RefundTrendChart.tsx
'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';

export interface RefundDay {
  date: string;
  refunds: number;
  chargebacks: number;
}

export function RefundTrendChart({ data }: { data: RefundDay[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No refund data</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis dataKey="date" tick={{ fill: chartColors.tick, fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fill: chartColors.tick, fontSize: 10 }} />
        <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} />
        <Area type="monotone" dataKey="refunds" stackId="1" fill={chartColors.purple} stroke={chartColors.purple} fillOpacity={0.3} name="Refunds" />
        <Area type="monotone" dataKey="chargebacks" stackId="1" fill={chartColors.red} stroke={chartColors.red} fillOpacity={0.3} name="Chargebacks" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
