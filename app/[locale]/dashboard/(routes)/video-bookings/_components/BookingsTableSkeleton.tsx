// app/[locale]/dashboard/(routes)/video-bookings/_components/BookingsTableSkeleton.tsx

export function BookingsTableSkeleton() {
  return (
    <div className="space-y-5">
      {/* Plan banner skeleton */}
      <div className="rounded-2xl border border-border/10 bg-card/30 p-4 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-muted/30 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-32 rounded-lg bg-muted/40 animate-pulse" />
            <div className="h-3 w-20 rounded-lg bg-muted/30 animate-pulse" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/30 animate-pulse" />
        </div>
      </div>

      {/* Action bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-28 rounded-lg bg-muted/30 animate-pulse" />
        <div className="h-9 w-32 rounded-xl bg-muted/30 animate-pulse" />
      </div>

      {/* Status tabs skeleton */}
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-7 rounded-xl bg-muted/20 animate-pulse"
            
          />
        ))}
      </div>

      {/* Table card skeleton */}
      <div className="rounded-2xl border border-border/10 bg-card/40 overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border/10 bg-muted/10">
          {[100, 90, 140, 70, 100, 40].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded bg-muted/30 animate-pulse shrink-0"
              
            />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3.5 border-b border-border/5 last:border-0"
            
          >
            {/* type */}
            <div
              className="flex items-center gap-2 shrink-0"
              
            >
              <div className="h-7 w-7 rounded-lg bg-muted/30 animate-pulse" />
              <div className="h-3.5 w-14 rounded bg-muted/30 animate-pulse" />
            </div>
            {/* status badge */}
            <div
              className="h-5 w-24 rounded-full bg-muted/30 animate-pulse shrink-0"
            />
            {/* scheduled */}
            <div className="h-3.5 w-32 rounded bg-muted/25 animate-pulse hidden sm:block shrink-0" />
            {/* duration */}
            <div className="h-3.5 w-14 rounded bg-muted/25 animate-pulse hidden md:block shrink-0" />
            {/* created */}
            <div className="h-3.5 w-20 rounded bg-muted/20 animate-pulse hidden lg:block shrink-0" />
            {/* actions */}
            <div className="h-7 w-7 rounded-lg bg-muted/20 animate-pulse ml-auto shrink-0" />
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between pt-1">
        <div className="h-3 w-32 rounded bg-muted/25 animate-pulse" />
        <div className="flex items-center gap-1">
          <div className="h-8 w-8 rounded-lg bg-muted/20 animate-pulse" />
          <div className="h-3 w-12 rounded bg-muted/20 animate-pulse mx-2" />
          <div className="h-8 w-8 rounded-lg bg-muted/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
