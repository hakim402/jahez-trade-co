import { Skeleton } from '@/components/ui/skeleton'

export function NotificationsPageSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border/50 pb-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-none rounded-t-sm" />
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Group header */}
      <Skeleton className="h-4 w-16 mt-2" />

      {/* Items */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 flex items-start gap-3">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}