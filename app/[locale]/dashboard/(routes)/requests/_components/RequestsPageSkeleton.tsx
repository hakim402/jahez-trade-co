// app/[locale]/dashboard/(routes)/requests/_components/RequestsPageSkeleton.tsx

export function RequestsPageSkeleton({ isAr = false }: { isAr?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-5 animate-pulse ${isAr ? "rtl" : "ltr"}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Plan bar */}
      <div className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-3 w-28 bg-muted rounded" />
          <div className="h-2 w-full bg-muted rounded-full" />
        </div>
        <div className="h-8 w-24 bg-muted rounded-xl shrink-0" />
      </div>

      {/* Status pills */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-muted rounded-full" />
        ))}
        <div className="h-8 w-28 bg-muted rounded-xl ml-auto" />
      </div>

      {/* Request cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/50 bg-card overflow-hidden"
        >
          {/* Card header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/40 bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="h-6 w-20 bg-muted rounded-full" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
            <div className="h-4 w-16 bg-muted rounded" />
          </div>
          {/* Card body */}
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-20 bg-muted rounded-full" />
              <div className="h-6 w-16 bg-muted rounded-full" />
            </div>
            {/* Quote skeleton */}
            <div className="rounded-xl border border-border/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-5 w-28 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded-full" />
              </div>
              <div className="h-3 w-48 bg-muted rounded" />
              <div className="flex gap-2 pt-1">
                <div className="h-8 w-24 bg-muted rounded-xl" />
                <div className="h-8 w-24 bg-muted rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      ))}

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
  );
}
