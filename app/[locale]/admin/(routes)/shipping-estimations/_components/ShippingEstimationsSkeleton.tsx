export function ShippingEstimationsSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
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

      <div className="flex gap-2 flex-wrap">
        <div className="h-9 w-64 rounded-xl bg-muted" />
        <div className="h-9 w-24 rounded-xl bg-muted" />
        <div className="h-9 w-24 rounded-xl bg-muted" />
        <div className="h-9 w-32 rounded-xl bg-muted ml-auto" />
      </div>

      <div className="hidden md:block rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border/40 bg-muted/20">
          {["w-32", "w-32", "w-24", "w-24", "w-24", "w-24", "w-20", "w-10"].map(
            (w, i) => (
              <div key={i} className={`h-3 rounded bg-muted ${w}`} />
            ),
          )}
        </div>

        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 border-b border-border/30 last:border-0"
          >
            <div className="h-8 w-8 rounded-xl bg-muted" />
            <div className="h-3 w-32 bg-muted rounded" />
            <div className="h-3 w-28 bg-muted rounded" />
            <div className="h-6 w-20 bg-muted rounded-full" />
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-6 w-16 bg-muted rounded-full" />
            <div className="h-7 w-7 bg-muted rounded-lg ml-auto" />
          </div>
        ))}
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card p-4 space-y-3"
          >
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="h-3 w-56 bg-muted rounded" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-muted rounded-full" />
              <div className="h-5 w-20 bg-muted rounded-full" />
              <div className="h-5 w-14 bg-muted rounded-full ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}