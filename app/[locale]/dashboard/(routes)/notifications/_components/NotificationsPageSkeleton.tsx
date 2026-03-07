export function NotificationsPageSkeleton() {
  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 rounded-xl bg-muted/30 animate-pulse"
          />
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-36 rounded-lg bg-muted/30 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded-lg bg-muted/30 animate-pulse" />
          <div className="h-8 w-24 rounded-lg bg-muted/30 animate-pulse" />
        </div>
      </div>

      {/* Group header */}
      <div className="flex items-center gap-3">
        <div className="h-3 w-14 rounded-md bg-muted/20 animate-pulse" />
        <div className="flex-1 h-px bg-border/10" />
        <div className="h-3 w-4 rounded-md bg-muted/20 animate-pulse" />
      </div>

      {/* Notification item skeletons */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/10 bg-card/40 p-4 flex items-start gap-3 animate-pulse"
          >
            {/* Icon badge */}
            <div className="h-9 w-9 rounded-xl bg-muted/40 shrink-0" />
            {/* Content */}
            <div className="flex-1 space-y-2 pt-0.5">
              <div className="h-3.5 w-2/5 rounded-md bg-muted/40" />
              <div className="h-3 w-3/5 rounded-md bg-muted/25" />
              <div className="h-3 w-1/4 rounded-full bg-muted/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
