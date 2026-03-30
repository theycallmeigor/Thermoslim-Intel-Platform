'use client';

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export interface SubActivityDay {
  date: string;
  active: number;
  new: number;
  reactivated: number;
  resumed: number;
  cancelled: number;
  paused: number;
  declined: number;
}

export function SubscriberActivityChart({ data }: { data: SubActivityDay[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No activity data</p>;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 10 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 10 }} />
        <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
        <Bar yAxisId="right" dataKey="new" stackId="add" fill="#10b981" />
        <Bar yAxisId="right" dataKey="reactivated" stackId="add" fill="#06b6d4" />
        <Bar yAxisId="right" dataKey="resumed" stackId="add" fill="#6ee7b7" />
        <Bar yAxisId="right" dataKey="cancelled" stackId="sub" fill="#ef4444" />
        <Bar yAxisId="right" dataKey="paused" stackId="sub" fill="#f59e0b" />
        <Bar yAxisId="right" dataKey="declined" stackId="sub" fill="#f87171" />
        <Line yAxisId="left" type="monotone" dataKey="active" stroke="#3b82f6" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
