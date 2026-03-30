'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { chartColors } from '@/lib/dashboard/colors';
import { fmtDollars } from '@/lib/dashboard/formatting';

export interface WaterfallMonth {
  month: string;
  newMrr: number;
  reactivation: number;
  churn: number; // negative number (cents)
  net: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs"
      style={{
        background: chartColors.tooltipBg,
        borderColor: chartColors.tooltipBorder,
      }}
    >
      <p className="text-gray-300 font-semibold mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="text-gray-200 tabular-nums font-medium">
            {fmtDollars(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function WaterfallChart({ data }: { data: WaterfallMonth[] }) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-600 text-sm">
        No data for selected period.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={chartColors.grid} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tick={{ fill: chartColors.tick, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => fmtDollars(v)}
          tick={{ fill: chartColors.tick, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: chartColors.tick, paddingTop: 8 }}
        />
        <ReferenceLine y={0} stroke={chartColors.tooltipBorder} />
        <Bar
          dataKey="newMrr"
          name="New MRR"
          stackId="movement"
          fill={chartColors.green}
          radius={[2, 2, 0, 0]}
          maxBarSize={48}
        />
        <Bar
          dataKey="reactivation"
          name="Reactivation"
          stackId="movement"
          fill={chartColors.cyan}
          maxBarSize={48}
        />
        <Bar
          dataKey="churn"
          name="Churn"
          stackId="movement"
          fill={chartColors.red}
          radius={[0, 0, 2, 2]}
          maxBarSize={48}
        />
        <Line
          type="monotone"
          dataKey="net"
          name="Net MRR"
          stroke={chartColors.primary}
          strokeWidth={2}
          dot={{ fill: chartColors.primary, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
