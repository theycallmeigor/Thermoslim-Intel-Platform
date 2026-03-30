'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell, PieChart, Pie,
} from 'recharts';
import { fmtDollars } from '@/lib/dashboard/formatting';

const CHART_STYLE = {
  grid: '#1f2937',
  tick: { fill: '#6b7280', fontSize: 11 },
  tooltip: { backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' },
};

// ─── Day of Week Bar Chart ───────────────────────────────────────────────────

export interface DowData {
  day: string;
  orders: number;
  revenue: number;
  aov: number;
  isWeekend: boolean;
}

export function DowChart({ data }: { data: DowData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} vertical={false} />
        <XAxis dataKey="day" tick={CHART_STYLE.tick} axisLine={false} tickLine={false} />
        <YAxis tick={CHART_STYLE.tick} axisLine={false} tickLine={false} width={40} />
        <Tooltip contentStyle={CHART_STYLE.tooltip} labelStyle={{ color: '#9ca3af', fontSize: '11px' }}
          formatter={(v: number, name: string) => [name === 'revenue' ? fmtDollars(v) : v, name === 'revenue' ? 'Avg Revenue' : 'Avg Orders']} />
        <Bar dataKey="orders" name="orders" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.isWeekend ? '#f59e0b' : '#3b82f6'} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Rolling 7-Day Line Chart ────────────────────────────────────────────────

export interface RollingData {
  date: string;
  orders: number;
  revenue: number;
}

export function RollingChart({ data }: { data: RollingData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} vertical={false} />
        <XAxis dataKey="date" tick={CHART_STYLE.tick} axisLine={false} tickLine={false}
          tickFormatter={(v: string) => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }} />
        <YAxis yAxisId="left" tick={CHART_STYLE.tick} axisLine={false} tickLine={false} width={40} />
        <YAxis yAxisId="right" orientation="right" tick={CHART_STYLE.tick} axisLine={false} tickLine={false} width={55}
          tickFormatter={fmtDollars} />
        <Tooltip contentStyle={CHART_STYLE.tooltip} labelStyle={{ color: '#9ca3af', fontSize: '11px' }}
          formatter={(v: number, name: string) => [name === 'revenue' ? fmtDollars(v) : v, name === 'revenue' ? '7-day Revenue' : '7-day Orders']}
          labelFormatter={(l: string) => new Date(l).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
        <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={false} name="orders" />
        <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} name="revenue" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Channel Composition Chart ───────────────────────────────────────────────

export interface ChannelSplit {
  label: string;
  weekday: number;
  weekend: number;
}

const CHANNEL_COLORS = ['#8b5cf6', '#f59e0b', '#3b82f6', '#10b981'];

export function ChannelCompChart({ data }: { data: ChannelSplit[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 80, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} horizontal={false} />
        <XAxis type="number" tick={CHART_STYLE.tick} axisLine={false} tickLine={false}
          tickFormatter={(v: number) => `${v}%`} />
        <YAxis type="category" dataKey="label" tick={CHART_STYLE.tick} axisLine={false} tickLine={false} width={80} />
        <Tooltip contentStyle={CHART_STYLE.tooltip} formatter={(v: number) => [`${v.toFixed(1)}%`]} />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
        <Bar dataKey="weekday" name="Weekday" fill="#3b82f6" fillOpacity={0.8} radius={[0, 4, 4, 0]} />
        <Bar dataKey="weekend" name="Weekend" fill="#f59e0b" fillOpacity={0.8} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Heatmap Grid ────────────────────────────────────────────────────────────

export interface HeatmapWeek {
  weekStart: string;
  days: number[]; // Mon=0, Sun=6
  total: number;
  note: string;
}

function heatColor(value: number, max: number): string {
  if (value === 0) return 'bg-gray-900';
  const ratio = value / max;
  if (ratio > 0.75) return 'bg-blue-500';
  if (ratio > 0.5) return 'bg-blue-600';
  if (ratio > 0.25) return 'bg-blue-700';
  return 'bg-blue-900';
}

export function HeatmapGrid({ data }: { data: HeatmapWeek[] }) {
  const maxVal = Math.max(...data.flatMap(w => w.days));
  const LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="overflow-x-auto">
      <table className="text-xs w-full">
        <thead>
          <tr className="text-gray-500">
            <th className="text-left font-medium py-1 px-2">Week</th>
            {LABELS.map(l => <th key={l} className="font-medium py-1 px-2 text-center">{l}</th>)}
            <th className="font-medium py-1 px-2 text-right">Total</th>
            <th className="font-medium py-1 px-2 text-left">Note</th>
          </tr>
        </thead>
        <tbody>
          {data.map(w => (
            <tr key={w.weekStart} className="border-t border-gray-800">
              <td className="py-1 px-2 text-gray-400 font-mono">{w.weekStart}</td>
              {w.days.map((d, i) => (
                <td key={i} className="py-1 px-1 text-center">
                  <span className={`inline-block w-8 rounded py-0.5 text-center ${heatColor(d, maxVal)} ${d > 0 ? 'text-white' : 'text-gray-700'}`}>
                    {d}
                  </span>
                </td>
              ))}
              <td className="py-1 px-2 text-right text-gray-300 font-medium">{w.total}</td>
              <td className="py-1 px-2 text-yellow-500">{w.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Anomaly Card ────────────────────────────────────────────────────────────

export interface AnomalyData {
  id: string;
  type: string;
  severity: string;
  metric: string;
  dimension: string | null;
  dimensionValue: string | null;
  expected: number;
  actual: number;
  deviation: number;
  explanation: string;
  detectedAt: string;
}

export function AnomalyCard({ anomaly, onAcknowledge }: { anomaly: AnomalyData; onAcknowledge: (id: string) => void }) {
  const isCritical = anomaly.severity === 'CRITICAL';
  return (
    <div className={`rounded-lg border p-3 ${isCritical ? 'border-red-600 bg-red-950/30' : 'border-amber-600 bg-amber-950/30'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isCritical ? 'bg-red-600 text-white' : 'bg-amber-600 text-black'}`}>
              {anomaly.severity}
            </span>
            <span className="text-[10px] text-gray-500 uppercase">{anomaly.type}</span>
          </div>
          <p className="text-sm text-gray-200">{anomaly.explanation}</p>
          <p className="text-[10px] text-gray-500 mt-1">
            Expected: {anomaly.expected.toFixed(1)} → Actual: {anomaly.actual.toFixed(1)} ({anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation.toFixed(0)}%)
          </p>
        </div>
        <button onClick={() => onAcknowledge(anomaly.id)}
          className="text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer whitespace-nowrap">
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function AnomalyList({ anomalies }: { anomalies: AnomalyData[] }) {
  async function acknowledge(id: string) {
    await fetch(`/api/analytics/anomalies/${id}/acknowledge`, { method: 'POST' });
    window.location.reload();
  }

  if (anomalies.length === 0) return null;

  return (
    <div className="space-y-2">
      {anomalies.map(a => <AnomalyCard key={a.id} anomaly={a} onAcknowledge={acknowledge} />)}
    </div>
  );
}
