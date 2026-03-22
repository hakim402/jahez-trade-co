// app/[locale]/admin/(routes)/consulting/_components/ConsultingPageSkeleton.tsx

export function ConsultingPageSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 bg-muted rounded-xl" />
          <div className="h-4 w-72 bg-muted rounded-lg" />
        </div>
        <div className="h-9 w-24 bg-muted rounded-xl shrink-0" />
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-3.5"
          >
            <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-6 w-10 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Tab strip */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/30 border border-border/50 w-fit">
        <div className="h-9 w-32 bg-muted rounded-xl" />
        <div className="h-9 w-28 bg-muted rounded-xl" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-2">
        <div className="h-9 flex-1 max-w-sm rounded-xl bg-muted" />
        <div className="h-9 w-24 rounded-xl bg-muted" />
        <div className="h-9 w-24 rounded-xl bg-muted" />
      </div>

      {/* Desktop table skeleton */}
      <div className="hidden md:block rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border/40 bg-muted/20">
          {["w-36", "w-28", "flex-1", "w-24", "w-24", "w-24", "w-10"].map(
            (w, i) => (
              <div key={i} className={`h-3 rounded bg-muted ${w}`} />
            ),
          )}
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3.5 border-b border-border/30 last:border-0"
          >
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-7 w-7 rounded-full bg-muted" />
              <div className="space-y-1.5">
                <div className="h-3 bg-muted rounded w-24" />
                <div className="h-2.5 bg-muted rounded w-32" />
              </div>
            </div>
            <div className="h-3 w-24 bg-muted rounded shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
            <div className="h-6 w-20 bg-muted rounded-full shrink-0" />
            <div className="h-3 w-20 bg-muted rounded shrink-0" />
            <div className="h-3 w-20 bg-muted rounded shrink-0" />
            <div className="h-7 w-7 bg-muted rounded-lg shrink-0" />
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card p-4 space-y-3"
          >
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between gap-2">
                  <div className="h-4 bg-muted rounded w-28" />
                  <div className="h-6 w-20 bg-muted rounded-full" />
                </div>
                <div className="h-2.5 bg-muted rounded w-40" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
