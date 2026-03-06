import { Skeleton } from '@/components/ui/skeleton'

export function BookingsTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-0 border-b">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 mx-1 rounded-none" />
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {['Client', 'Type', 'Status', 'Scheduled', 'Created', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {Array.from({ length: 7 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                <td className="px-4 py-3"><Skeleton className="h-6 w-24 rounded-full" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}