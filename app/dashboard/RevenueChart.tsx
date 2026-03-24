'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface DailyRevenue {
  date: string;
  direct: number;      // Shopify orders not from CC (direct purchases)
  onetime: number;     // CC NEW_SALE, no subscription items
  newSub: number;      // CC NEW_SALE, has subscription items
  recurring: number;   // CC REBILL (recurring charges)
}

const SERIES = [
  { key: 'recurring',  label: 'Recurring billing', color: '#10b981' },
  { key: 'newSub',     label: 'New subscription',  color: '#3b82f6' },
  { key: 'onetime',    label: 'One-time sale',      color: '#f59e0b' },
  { key: 'direct',     label: 'Direct Shopify',     color: '#8b5cf6' },
] as const;

function fmtDollars(cents: number) {
  const d = cents / 100;
  if (d >= 1000) return `$${(d / 1000).toFixed(1)}k`;
  return `$${d.toFixed(0)}`;
}

export function RevenueChart({ data }: { data: DailyRevenue[] }) {
  const hasData = data.some(d => d.direct + d.onetime + d.newSub + d.recurring > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No revenue data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          {SERIES.map(s => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) => {
            const d = new Date(v);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={fmtDollars}
          width={52}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
          labelStyle={{ color: '#9ca3af', fontSize: '11px' }}
          itemStyle={{ fontSize: '11px' }}
          formatter={(value: number, name: string) => {
            const series = SERIES.find(s => s.key === name);
            return [`$${(value / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, series?.label ?? name];
          }}
          labelFormatter={(label: string) =>
            new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          }
        />
        <Legend
          wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }}
          formatter={(value: string) => SERIES.find(s => s.key === value)?.label ?? value}
        />
        {SERIES.map(s => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stackId="rev"
            stroke={s.color}
            strokeWidth={1.5}
            fill={`url(#grad-${s.key})`}
            dot={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
