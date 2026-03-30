// app/(dashboard)/operations/health/page.tsx
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';

export default async function IngestionHealthPage() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    errorsLast24h,
    errorsLast7d,
    openErrors,
    errorsBySource,
    errorsByType,
    // Snapshot freshness — most recent snapshot date
    latestSnapshot,
    // Total anomalies open
    openAnomalies,
    recentAnomalies,
  ] = await Promise.all([
    prisma.ingestionError.count({ where: { occurredAt: { gte: last24h } } }),
    prisma.ingestionError.count({ where: { occurredAt: { gte: last7d } } }),
    prisma.ingestionError.count({ where: { resolved: false } }),
    prisma.ingestionError.groupBy({
      by: ['source'],
      where: { occurredAt: { gte: last7d } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.ingestionError.groupBy({
      by: ['errorType'],
      where: { occurredAt: { gte: last7d } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    }),
    prisma.dailySnapshot.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true },
    }),
    prisma.anomaly.count({ where: { resolvedAt: null, acknowledged: false } }),
    prisma.anomaly.findMany({
      where: { resolvedAt: null },
      orderBy: { detectedAt: 'desc' },
      take: 10,
      select: { id: true, type: true, severity: true, metric: true, dimension: true, dimensionValue: true, expected: true, actual: true, deviation: true, detectedAt: true, acknowledged: true },
    }),
  ]);

  // Snapshot staleness
  const snapshotDate = latestSnapshot?.date ? new Date(latestSnapshot.date) : null;
  const snapshotAgeHours = snapshotDate
    ? Math.round((now.getTime() - snapshotDate.getTime()) / (1000 * 60 * 60))
    : null;
  const snapshotFresh = snapshotAgeHours !== null && snapshotAgeHours < 26;

  // System status
  const systemStatus = openErrors === 0 && openAnomalies === 0 ? 'Healthy' : openErrors > 5 ? 'Degraded' : 'Warning';
  const statusColor = systemStatus === 'Healthy' ? 'text-green-400' : systemStatus === 'Warning' ? 'text-yellow-400' : 'text-red-400';
  const statusBg = systemStatus === 'Healthy' ? 'bg-green-500/10' : systemStatus === 'Warning' ? 'bg-yellow-500/10' : 'bg-red-500/10';

  return (
    <div className="space-y-6">
      <PageHeader title="Ingestion Health" subtitle="Pipeline status, error rates, and snapshot freshness" />

      {/* System status banner */}
      <div className={`rounded-xl border px-6 py-4 flex items-center justify-between ${systemStatus === 'Healthy' ? 'border-green-600/30 bg-green-500/5' : systemStatus === 'Warning' ? 'border-yellow-600/30 bg-yellow-500/5' : 'border-red-600/30 bg-red-500/5'}`}>
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${systemStatus === 'Healthy' ? 'bg-green-400' : systemStatus === 'Warning' ? 'bg-yellow-400' : 'bg-red-400'} animate-pulse`} />
          <span className={`text-sm font-semibold ${statusColor}`}>System {systemStatus}</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <span>Snapshot: {snapshotDate ? snapshotDate.toLocaleDateString() : '—'} {snapshotAgeHours !== null ? `(${snapshotAgeHours}h ago)` : ''}</span>
          <span className={snapshotFresh ? 'text-green-400' : 'text-red-400'}>{snapshotFresh ? '✓ Fresh' : '⚠ Stale'}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Open Errors" value={openErrors.toLocaleString()} />
        <KpiCard label="Errors (24h)" value={errorsLast24h.toLocaleString()} />
        <KpiCard label="Errors (7d)" value={errorsLast7d.toLocaleString()} />
        <KpiCard label="Open Anomalies" value={openAnomalies.toLocaleString()} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Errors by source */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Errors by Source (7d)</h3>
          </div>
          {errorsBySource.length === 0 ? (
            <div className="px-6 py-8 text-center text-green-400 text-sm">No errors in the last 7 days</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Source</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {errorsBySource.map(r => (
                  <tr key={r.source} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-3 text-gray-300">{r.source}</td>
                    <td className="px-6 py-3 text-right text-red-400 tabular-nums font-medium">{r._count.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Errors by type */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Top Error Types (7d)</h3>
          </div>
          {errorsByType.length === 0 ? (
            <div className="px-6 py-8 text-center text-green-400 text-sm">No errors in the last 7 days</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Error Type</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {errorsByType.map(r => (
                  <tr key={r.errorType} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-3 text-gray-300 font-mono text-xs">{r.errorType}</td>
                    <td className="px-6 py-3 text-right text-red-400 tabular-nums">{r._count.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Active anomalies */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Active Anomalies
            {openAnomalies > 0 && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">{openAnomalies} open</span>
            )}
          </h3>
        </div>
        {recentAnomalies.length === 0 ? (
          <div className="px-6 py-8 text-center text-green-400 text-sm">No active anomalies</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Severity</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Metric</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Dimension</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Expected</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Actual</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Deviation</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Detected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {recentAnomalies.map(a => {
                const sevColor = a.severity === 'critical' ? 'text-red-400 bg-red-500/10' : a.severity === 'high' ? 'text-orange-400 bg-orange-500/10' : 'text-yellow-400 bg-yellow-500/10';
                return (
                  <tr key={a.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sevColor}`}>{a.severity}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-300 font-mono text-xs">{a.metric}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{a.dimension ? `${a.dimension}=${a.dimensionValue}` : '—'}</td>
                    <td className="px-6 py-3 text-right text-gray-400 tabular-nums text-xs">{a.expected.toFixed(1)}</td>
                    <td className="px-6 py-3 text-right text-gray-200 tabular-nums text-xs">{a.actual.toFixed(1)}</td>
                    <td className="px-6 py-3 text-right tabular-nums text-xs">
                      <span className={a.deviation > 0 ? 'text-red-400' : 'text-green-400'}>
                        {a.deviation > 0 ? '+' : ''}{a.deviation.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-gray-500 text-xs">
                      {new Date(a.detectedAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
