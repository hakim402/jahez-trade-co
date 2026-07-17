// app/[locale]/admin/(routes)/requests/_components/RequestPageSkeleton.tsx

export function RequestPageSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-3.5"
          >
            <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-6 w-12 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        <div className="h-9 w-64 rounded-xl bg-muted" />
        <div className="h-9 w-24 rounded-xl bg-muted" />
        <div className="h-9 w-24 rounded-xl bg-muted" />
        <div className="h-9 w-24 rounded-xl bg-muted" />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border/40 bg-muted/20">
          {[
            "w-4",
            "w-36",
            "flex-1",
            "w-8",
            "w-20",
            "w-16",
            "w-16",
            "w-20",
            "w-10",
          ].map((w, i) => (
            <div key={i} className={`h-3 rounded bg-muted ${w}`} />
          ))}
        </div>
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-3.5 border-b border-border/30 last:border-0"
          >
            <div className="h-4 w-4 rounded bg-muted shrink-0" />
            <div className="flex items-center gap-2 w-36 shrink-0">
              <div className="h-7 w-7 rounded-full bg-muted shrink-0" />
              <div className="space-y-1.5 min-w-0">
                <div className="h-3 bg-muted rounded w-24" />
                <div className="h-2.5 bg-muted rounded w-28" />
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-2.5 bg-muted rounded w-1/2" />
            </div>
            <div className="h-3 w-8 bg-muted rounded shrink-0" />
            <div className="h-6 w-20 bg-muted rounded-full shrink-0" />
            <div className="flex gap-0.5 shrink-0">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-2 w-2 rounded-full bg-muted" />
              ))}
            </div>
            <div className="h-3 w-12 bg-muted rounded shrink-0" />
            <div className="h-3 w-16 bg-muted rounded shrink-0" />
            <div className="h-7 w-7 bg-muted rounded-lg shrink-0" />
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card p-4 space-y-3"
          >
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between gap-2">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-6 w-20 bg-muted rounded-full" />
                </div>
                <div className="h-2.5 bg-muted rounded w-40" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-border/30">
              <div className="h-5 w-16 bg-muted rounded-full" />
              <div className="h-5 w-14 bg-muted rounded-full" />
              <div className="h-5 w-20 bg-muted rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-3 border-t border-border/40">
        <div className="h-4 w-44 bg-muted rounded" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-8 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
