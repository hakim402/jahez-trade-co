// app/[locale]/admin/(routes)/product-requests/_components/RequestsTableSkeleton.tsx
// Used as the Suspense fallback in page.tsx.

export function RequestsTableSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
      {/* Header row */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border/40 bg-muted/20">
        {[
          "w-8",
          "w-24",
          "flex-1",
          "w-12",
          "w-20",
          "w-20",
          "w-12",
          "w-16",
          "w-20",
          "w-8",
        ].map((w, i) => (
          <div key={i} className={`h-3 bg-muted rounded ${w} animate-pulse`} />
        ))}
      </div>
      {/* Skeleton rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3.5 border-b border-border/30 animate-pulse"
        >
          <div className="h-3.5 w-8 bg-muted rounded font-mono shrink-0" />
          {/* client */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-7 w-7 rounded-full bg-muted" />
            <div className="space-y-1.5">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-2.5 bg-muted rounded w-32" />
            </div>
          </div>
          {/* product */}
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="h-3 bg-muted rounded w-40" />
            <div className="h-2.5 bg-muted rounded w-24" />
          </div>
          {/* qty */}
          <div className="h-3.5 w-8 bg-muted rounded" />
          {/* status */}
          <div className="h-5 w-20 bg-muted rounded-full" />
          {/* priority */}
          <div className="h-4 w-16 bg-muted rounded" />
          {/* quotes */}
          <div className="h-3.5 w-6 bg-muted rounded" />
          {/* ai */}
          <div className="h-3.5 w-16 bg-muted rounded" />
          {/* created */}
          <div className="h-3.5 w-16 bg-muted rounded" />
          {/* menu */}
          <div className="h-7 w-7 bg-muted rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}
