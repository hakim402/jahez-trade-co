// app/[locale]/admin/(routes)/shipments/_components/ShipmentsPageSkeleton.tsx

export function ShipmentsPageSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-6 w-12 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-11 w-full rounded-xl bg-muted" />
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 border-b border-border/30 last:border-0 bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
