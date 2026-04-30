// app/[locale]/admin/(routes)/blogs/_components/BlogPageSkeleton.tsx

export function BlogPageSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-3.5"
          >
            <div className="h-10 w-10 rounded-xl bg-muted/60 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-2.5 w-16 bg-muted/60 rounded-full" />
              <div className="h-6 w-12 bg-muted/60 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar row */}
      <div className="flex flex-wrap gap-2 justify-between">
        <div className="flex gap-2">
          <div className="h-8 w-28 rounded-xl bg-muted/60" />
          <div className="h-8 w-20 rounded-xl bg-muted/60" />
        </div>
        <div className="h-8 w-20 rounded-xl bg-muted/60" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <div className="h-9 w-64 rounded-xl bg-muted/60" />
        <div className="h-9 w-32 rounded-xl bg-muted/60" />
        <div className="h-9 w-36 rounded-xl bg-muted/60" />
        <div className="h-9 w-44 rounded-xl bg-muted/60" />
      </div>

      {/* Post grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card overflow-hidden"
            style={{ opacity: 1 - i * 0.08 }}
          >
            <div className="h-44 bg-muted/60" />
            <div className="p-4 space-y-3">
              <div className="space-y-1.5">
                <div className="h-4 w-4/5 bg-muted/60 rounded" />
                <div className="h-3 w-2/5 bg-muted/40 rounded" />
              </div>
              <div className="h-3 w-full bg-muted/40 rounded" />
              <div className="h-3 w-3/4 bg-muted/40 rounded" />
              <div className="flex gap-1.5 pt-0.5">
                <div className="h-5 w-16 bg-muted/50 rounded-full" />
                <div className="h-5 w-12 bg-muted/50 rounded-full" />
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-border/30">
                <div className="h-3 w-20 bg-muted/40 rounded" />
                <div className="h-7 w-7 bg-muted/50 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-3 border-t border-border/40">
        <div className="h-4 w-44 bg-muted/50 rounded" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-8 rounded-xl bg-muted/50" />
          ))}
        </div>
      </div>
    </div>
  );
}