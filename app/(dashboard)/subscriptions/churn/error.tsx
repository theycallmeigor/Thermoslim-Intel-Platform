'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="text-red-400 text-lg font-medium">Something went wrong</div>
      <p className="text-gray-400 text-sm max-w-md text-center">
        {error.message || 'An unexpected error occurred loading this page.'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
