// app/(dashboard)/performance/products/ProductChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';
import { fmtDollars } from '@/lib/dashboard/formatting';

export interface ProductBar {
  name: string;
  revenue: number;
  orders: number;
}

export function ProductChart({ data }: { data: ProductBar[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No product data</p>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis dataKey="name" tick={{ fill: chartColors.tick, fontSize: 10 }} />
        <YAxis tick={{ fill: chartColors.tick, fontSize: 10 }} tickFormatter={(v) => fmtDollars(v)} />
        <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmtDollars(v)} />
        <Bar dataKey="revenue" fill={chartColors.green} radius={[4, 4, 0, 0]} name="Revenue" />
      </BarChart>
    </ResponsiveContainer>
  );
}
