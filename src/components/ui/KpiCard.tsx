interface KpiCardProps {
  label: string;
  value: string;
  change?: string | null;
  positive?: boolean;
  sub?: string;
}

export function KpiCard({ label, value, change, positive, sub }: KpiCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
        {change && (
          <span className={`text-xs font-medium mb-0.5 ${positive ? 'text-green-400' : 'text-red-400'}`}>
            {change}
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}
