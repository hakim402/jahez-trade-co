// app/[locale]/dashboard/(routes)/video-booking/_components/BookingPageSkeleton.tsx

export function BookingPageSkeleton({ isAr = false }: { isAr?: boolean }) {
  return (
    <div className="flex flex-col gap-5 animate-pulse" dir={isAr ? "rtl" : "ltr"}>

      {/* Plan bar */}
      <div className="h-14 rounded-2xl border border-border/50 bg-card" />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-muted shrink-0" />
            <div className="space-y-2">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-6 w-10 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Status pills + button */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-muted rounded-full" />
        ))}
        <div className="h-8 w-32 bg-muted rounded-xl ml-auto" />
      </div>

      {/* Booking cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="h-6 w-24 bg-muted rounded-full" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
            <div className="h-4 w-20 bg-muted rounded" />
          </div>
          <div className="p-5 space-y-3">
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-muted rounded-full" />
              <div className="h-5 w-16 bg-muted rounded-full" />
            </div>
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="flex gap-2 pt-2">
              <div className="h-8 w-24 bg-muted rounded-xl" />
              <div className="h-8 w-24 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}