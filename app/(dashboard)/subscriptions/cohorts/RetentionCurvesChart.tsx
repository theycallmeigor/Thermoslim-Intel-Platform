// app/(dashboard)/subscriptions/cohorts/RetentionCurvesChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';

export interface CohortCurve {
  cohort: string;
  rates: number[]; // retention % for M0, M1, M2...
}

const COHORT_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

export function RetentionCurvesChart({ cohorts, maxMonths }: { cohorts: CohortCurve[]; maxMonths: number }) {
  if (cohorts.length === 0) return <p className="text-gray-600 text-sm">No cohort data</p>;

  // Transform into chart rows: { month: 'M0', 'Jan 2026': 100, 'Feb 2026': 95, ... }
  const data = Array.from({ length: maxMonths + 1 }, (_, m) => {
    const row: Record<string, number | string> = { month: `M${m}` };
    for (const c of cohorts) {
      if (m < c.rates.length && c.rates[m] > 0) {
        row[c.cohort] = c.rates[m];
      }
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis dataKey="month" tick={{ fill: chartColors.tick, fontSize: 10 }} />
        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: chartColors.tick, fontSize: 10 }} />
        <Tooltip
          contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
          formatter={(value: number) => `${value.toFixed(1)}%`}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
        {cohorts.map((c, i) => (
          <Line
            key={c.cohort}
            type="monotone"
            dataKey={c.cohort}
            stroke={COHORT_COLORS[i % COHORT_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3, fill: COHORT_COLORS[i % COHORT_COLORS.length] }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
