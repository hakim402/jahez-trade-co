
// app/[locale]/(pages)/blogs/[slug]/_components/PostSkeleton.tsx

export function PostSkeleton({ isAr }: { isAr: boolean }) {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-muted rounded w-3/4 mx-auto mb-4" />
      <div className="h-4 bg-muted rounded w-1/2 mx-auto mb-8" />
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/5" />
      </div>
    </div>
  );
}