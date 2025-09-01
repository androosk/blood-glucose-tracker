'use client'

interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className = "h-4 w-full" }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <LoadingSkeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <LoadingSkeleton className="h-10 w-24" />
          <LoadingSkeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <LoadingSkeleton className="h-4 w-20 mb-2" />
            <LoadingSkeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <LoadingSkeleton className="h-6 w-32 mb-4" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <LoadingSkeleton className="h-6 w-40 mb-4" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      </div>

      {/* List skeleton */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <LoadingSkeleton className="h-8 w-20 rounded-full mr-4" />
                <div>
                  <LoadingSkeleton className="h-4 w-24 mb-1" />
                  <LoadingSkeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex gap-2">
                <LoadingSkeleton className="h-8 w-8 rounded" />
                <LoadingSkeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}