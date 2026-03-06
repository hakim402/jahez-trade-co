// app/[locale]/admin/(routes)/video-bookings/_components/BookingsTableSkeleton.tsx

export function BookingsTableSkeleton() {
  return (
    <div className="h-full rounded-2xl border border-border/50 bg-card overflow-hidden flex flex-col shadow-sm">

      {/* Filter bar skeleton */}
      <div className="px-4 pt-3.5 pb-3 border-b border-border/40 shrink-0 space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-8 w-56 bg-muted/60 rounded-lg animate-pulse" />
          <div className="h-8 w-28 bg-muted/60 rounded-lg animate-pulse" style={{ animationDelay: '60ms' }} />
          <div className="h-8 w-24 bg-muted/60 rounded-lg animate-pulse ml-auto" style={{ animationDelay: '90ms' }} />
        </div>

        {/* Status tabs skeleton */}
        <div className="flex gap-1 overflow-x-auto">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-7 rounded-lg bg-muted/50 animate-pulse shrink-0"
              style={{ width: i === 0 ? '3rem' : `${4.5 + i * 0.3}rem`, animationDelay: `${i * 40}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Rows skeleton */}
      <div className="flex-1 overflow-hidden divide-y divide-border/40">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3.5 animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* avatar */}
            <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
            {/* name + email */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="h-3.5 bg-muted rounded w-32" />
              <div className="h-3   bg-muted rounded w-44" />
            </div>
            {/* type */}
            <div className="hidden sm:block h-3.5 w-16 bg-muted rounded" />
            {/* status badge */}
            <div className="h-5 w-24 bg-muted rounded-full" />
            {/* scheduled */}
            <div className="hidden md:block h-3.5 w-32 bg-muted rounded" />
            {/* duration */}
            <div className="hidden lg:block h-3.5 w-10 bg-muted rounded" />
            {/* created */}
            <div className="hidden lg:block h-3.5 w-20 bg-muted rounded" />
            {/* menu */}
            <div className="h-7 w-7 bg-muted rounded-lg shrink-0 ml-auto" />
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 shrink-0">
        <div className="h-3.5 w-36 bg-muted rounded animate-pulse" />
        <div className="flex items-center gap-1">
          <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" style={{ animationDelay: '60ms' }} />
          <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" style={{ animationDelay: '120ms' }} />
          <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" style={{ animationDelay: '180ms' }} />
        </div>
      </div>
    </div>
  )
}