// app/[locale]/(pages)/services/_components/ServicesListSkeleton.tsx

export function ServicesListSkeleton({ isAr = false }: { isAr?: boolean }) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-pulse" dir={isAr ? "rtl" : "ltr"}>
      {/* Sidebar */}
      <aside className="lg:w-60 shrink-0 space-y-6">
        <div className="h-4 w-20 bg-muted/50 rounded" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 rounded-xl bg-muted/40" />
          ))}
        </div>
        <div className="h-px bg-border/30" />
        <div className="h-4 w-16 bg-muted/50 rounded" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 rounded-xl bg-muted/30" />
          ))}
        </div>
      </aside>
      {/* Grid */}
      <div className="flex-1 space-y-6">
        <div className="flex gap-3">
          <div className="flex-1 h-10 rounded-xl bg-muted/40" />
          <div className="h-10 w-36 rounded-xl bg-muted/30" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/40 bg-card overflow-hidden">
              <div className="h-44 bg-muted/40" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-3/4 bg-muted/50 rounded" />
                <div className="h-3 w-full bg-muted/30 rounded" />
                <div className="h-3 w-2/3 bg-muted/30 rounded" />
                <div className="flex gap-2 pt-1">
                  <div className="h-6 w-16 bg-muted/30 rounded-full" />
                  <div className="h-6 w-20 bg-muted/30 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}