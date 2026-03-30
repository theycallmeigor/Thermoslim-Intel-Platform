'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export interface DonutSlice {
  name: string;
  value: number;
}

export function SubscriberDonut({ data, label }: { data: DonutSlice[]; label: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
        No data
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={72}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
            formatter={(value: number, name: string) => [`${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`, name]}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }}
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '-8px' }}>
        <span className="text-xl font-bold text-white tabular-nums">{total.toLocaleString()}</span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
    </div>
  );
}
