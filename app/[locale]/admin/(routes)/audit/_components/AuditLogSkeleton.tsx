// app/[locale]/admin/(routes)/audit/_components/AuditLogSkeleton.tsx

export function AuditLogSkeleton() {
  return (
    <div className="h-full rounded-2xl border border-border/50 bg-card overflow-hidden flex flex-col shadow-sm">

      {/* Filter bar skeleton */}
      <div className="px-4 pt-3.5 pb-3 border-b border-border/40 shrink-0 space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-8 w-56 bg-muted/60 rounded-lg animate-pulse" />
          <div className="h-8 w-32 bg-muted/60 rounded-lg animate-pulse" style={{ animationDelay: '50ms' }} />
          <div className="h-8 w-32 bg-muted/60 rounded-lg animate-pulse" style={{ animationDelay: '100ms' }} />
          <div className="h-8 w-36 bg-muted/60 rounded-lg animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="h-8 w-8 bg-muted/60 rounded-lg animate-pulse ml-auto" style={{ animationDelay: '200ms' }} />
        </div>
      </div>

      {/* Column header skeleton */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border/40 bg-muted/20">
        {[80, 120, 100, 100, 80, 120].map((w, i) => (
          <div
            key={i}
            className="h-3 bg-muted/60 rounded animate-pulse"
            style={{ width: w, animationDelay: `${i * 40}ms` }}
          />
        ))}
      </div>

      {/* Rows skeleton */}
      <div className="flex-1 overflow-hidden divide-y divide-border/40">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 animate-pulse"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            {/* avatar */}
            <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
            {/* admin name */}
            <div className="w-32 space-y-1.5 shrink-0">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-2.5 bg-muted rounded w-32" />
            </div>
            {/* action badge */}
            <div className="h-5 w-36 bg-muted rounded-full shrink-0" />
            {/* entity badge */}
            <div className="h-5 w-28 bg-muted rounded-full shrink-0" />
            {/* entity id */}
            <div className="hidden md:block h-3 w-20 bg-muted rounded font-mono" />
            {/* changes */}
            <div className="hidden lg:block h-3 w-32 bg-muted rounded" />
            {/* timestamp */}
            <div className="h-3 w-24 bg-muted rounded ml-auto shrink-0" />
            {/* menu */}
            <div className="h-7 w-7 bg-muted rounded-lg shrink-0" />
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 shrink-0">
        <div className="h-3.5 w-36 bg-muted rounded animate-pulse" />
        <div className="flex items-center gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-8 bg-muted rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}