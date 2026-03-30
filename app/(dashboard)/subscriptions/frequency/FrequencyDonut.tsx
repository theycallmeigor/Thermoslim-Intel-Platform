// app/(dashboard)/subscriptions/frequency/FrequencyDonut.tsx
'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';

export interface FreqSlice {
  name: string;
  value: number;
  mrr: number;
}

const COLORS = [chartColors.primary, chartColors.green, chartColors.orange, chartColors.purple, chartColors.cyan, chartColors.red];

export function FrequencyDonut({ data }: { data: FreqSlice[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No frequency data</p>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
