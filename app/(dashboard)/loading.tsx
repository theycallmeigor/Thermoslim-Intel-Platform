export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div>
        <div className="h-7 w-48 bg-gray-800 rounded" />
        <div className="h-4 w-72 bg-gray-800/60 rounded mt-2" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5">
            <div className="h-3 w-20 bg-gray-800 rounded mb-3" />
            <div className="h-7 w-24 bg-gray-800 rounded" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="h-4 w-36 bg-gray-800 rounded mb-4" />
        <div className="h-[260px] bg-gray-800/30 rounded" />
      </div>

      {/* Table skeleton */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <div className="h-4 w-32 bg-gray-800 rounded" />
        </div>
        <div className="divide-y divide-gray-800/60">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="px-6 py-4 flex gap-8">
              <div className="h-4 w-24 bg-gray-800/50 rounded" />
              <div className="h-4 w-32 bg-gray-800/50 rounded" />
              <div className="h-4 w-16 bg-gray-800/50 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
