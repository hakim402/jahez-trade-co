// app/[locale]/admin/(routes)/video-bookings/_components/VideoBookingPageSkeleton.tsx

export function BookingPageSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-muted shrink-0" />
            <div className="space-y-2">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-6 w-10 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-muted/30 border border-border/50 w-fit">
        <div className="h-9 w-32 bg-muted rounded-xl" />
        <div className="h-9 w-32 bg-muted rounded-xl" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="h-9 w-56 bg-muted rounded-xl" />
        <div className="h-9 w-32 bg-muted rounded-xl" />
        <div className="h-9 w-28 bg-muted rounded-xl" />
        <div className="h-9 w-28 bg-muted rounded-xl" />
        <div className="h-9 w-24 bg-muted rounded-xl ml-auto" />
      </div>

      {/* Table */}
      <div className="hidden md:block rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border/40 bg-muted/20">
          {["w-32", "flex-1", "w-20", "w-24", "w-24", "w-28", "w-12"].map((w, i) => (
            <div key={i} className={`h-3 rounded bg-muted ${w}`} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-border/30 last:border-0">
            <div className="flex items-center gap-2 w-32 shrink-0">
              <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-2.5 w-28 bg-muted rounded" />
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
            <div className="h-6 w-20 bg-muted rounded-full shrink-0" />
            <div className="h-3 w-24 bg-muted rounded shrink-0" />
            <div className="h-3 w-24 bg-muted rounded shrink-0" />
            <div className="h-3 w-28 bg-muted rounded shrink-0" />
            <div className="h-7 w-7 bg-muted rounded-lg shrink-0" />
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3 w-28 bg-muted rounded" />
                  <div className="h-2.5 w-36 bg-muted rounded" />
                </div>
              </div>
              <div className="h-6 w-20 bg-muted rounded-full" />
            </div>
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-muted rounded-full" />
              <div className="h-5 w-20 bg-muted rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-3 border-t border-border/40">
        <div className="h-4 w-40 bg-muted rounded" />
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-8 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}