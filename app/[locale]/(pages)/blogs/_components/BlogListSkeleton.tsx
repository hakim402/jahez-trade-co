// app/[locale]/(pages)/blogs/_components/BlogListSkeleton.tsx

export function BlogListSkeleton({ isAr = false }: { isAr?: boolean }) {
  return (
    <div
      className="flex flex-col lg:flex-row gap-8 animate-pulse"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Sidebar skeleton */}
      <aside className="lg:w-60 shrink-0 space-y-6">
        <div className="h-4 w-20 bg-muted/50 rounded" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 rounded-xl bg-muted/40" />
          ))}
        </div>
        <div className="h-px bg-border/30" />
        <div className="h-4 w-16 bg-muted/50 rounded" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 w-16 rounded-full bg-muted/30" />
          ))}
        </div>
      </aside>

      {/* Content skeleton */}
      <div className="flex-1 space-y-6">
        <div className="flex gap-3">
          <div className="flex-1 h-10 rounded-xl bg-muted/40" />
          <div className="h-10 w-36 rounded-xl bg-muted/30" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/40 bg-card overflow-hidden"
            >
              <div className="h-48 bg-muted/40" />
              <div className="p-5 space-y-3">
                <div className="h-6 w-3/4 bg-muted/50 rounded" />
                <div className="h-4 w-full bg-muted/30 rounded" />
                <div className="h-4 w-2/3 bg-muted/30 rounded" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-20 bg-muted/30 rounded-full" />
                  <div className="h-6 w-24 bg-muted/30 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
