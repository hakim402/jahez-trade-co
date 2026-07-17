// app/[locale]/admin/(routes)/products/_components/ProductPageSkeleton.tsx

export function ProductPageSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-6 w-14 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <div className="h-9 w-64 rounded-xl bg-muted" />
        <div className="h-9 w-28 rounded-xl bg-muted" />
        <div className="h-9 w-28 rounded-xl bg-muted" />
        <div className="h-9 w-28 rounded-xl bg-muted" />
        <div className="h-9 w-24 rounded-xl bg-muted ml-auto" />
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <div className="h-44 bg-muted" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
              <div className="flex gap-1.5 pt-1">
                <div className="h-5 w-14 bg-muted rounded-full" />
                <div className="h-5 w-10 bg-muted rounded-full" />
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-border/30">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-7 w-7 bg-muted rounded-lg" />
              </div>
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
  )
}