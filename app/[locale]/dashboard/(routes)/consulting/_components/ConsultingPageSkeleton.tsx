// app/[locale]/dashboard/(routes)/consulting/_components/ConsultingPageSkeleton.tsx

export function ConsultingPageSkeleton({ isAr = false }: { isAr?: boolean }) {
  return (
    <div
      className="flex flex-col gap-5 animate-pulse"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Open requests banner */}
      <div className="h-14 rounded-2xl border border-border/50 bg-card" />

      {/* Tab strip */}
      <div className="flex gap-1 p-1 rounded-2xl bg-muted/30 border border-border/50 w-fit">
        <div className="h-9 w-36 bg-muted rounded-xl" />
        <div className="h-9 w-36 bg-muted rounded-xl" />
      </div>

      {/* Status filter + action button */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-muted rounded-full" />
        ))}
        <div className="h-8 w-32 bg-muted rounded-xl ml-auto" />
      </div>

      {/* Request cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/50 bg-card overflow-hidden"
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/40 bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="h-7 w-20 bg-muted rounded-full" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
            <div className="h-4 w-16 bg-muted rounded" />
          </div>
          <div className="p-5 space-y-3">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-2/3 bg-muted rounded" />
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-muted rounded-full" />
              <div className="h-5 w-16 bg-muted rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
