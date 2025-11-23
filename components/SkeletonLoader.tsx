export default function SkeletonLoader() {
  return (
    <div className="animate-pulse">
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        
        {/* Table Skeleton */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
            
            {/* Table Rows */}
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="grid grid-cols-6 gap-4 pt-4 border-t border-gray-200">
                {[1, 2, 3, 4, 5, 6].map((col) => (
                  <div key={col} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      <div className="relative overflow-x-auto bg-white shadow-sm rounded-lg border border-gray-200">
        {/* Table Header */}
        <div className="text-sm text-gray-700 bg-gray-100 border-b border-gray-200">
          <div className="grid gap-4 px-6 py-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Table Rows */}
        <div className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, row) => (
            <div key={row} className="grid gap-4 px-6 py-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {Array.from({ length: cols }).map((_, col) => (
                <div key={col} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-lg shadow-md p-6">
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Image Skeleton */}
        <div className="w-full md:w-48 h-48 bg-gray-200 rounded-lg"></div>
        
        {/* Content Skeleton */}
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

