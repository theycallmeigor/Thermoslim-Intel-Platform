'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';

export interface DayVolume {
  date: string;
  count: number;
  revenue: number;
}

export function RebillCalendar({ data }: { data: DayVolume[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No upcoming rebills</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis
          dataKey="date"
          tick={{ fill: chartColors.tick, fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: chartColors.tick, fontSize: 10 }} />
        <Tooltip
          contentStyle={{
            background: chartColors.tooltipBg,
            border: `1px solid ${chartColors.tooltipBorder}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: number, name: string) => [value, name === 'count' ? 'Rebills' : name]}
        />
        <Bar dataKey="count" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
