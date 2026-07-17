// app/[locale]/(pages)/blogs/[slug]/_components/PostHeader.tsx

import { CalendarDays, Clock, Tag } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { PublicPostDetail } from "../../actions";

interface PostHeaderProps {
  post: PublicPostDetail;
  isAr: boolean;
}

export function PostHeader({ post, isAr }: PostHeaderProps) {
  const formattedDate = post.publishedAt
    ? format(new Date(post.publishedAt), "PPP", { locale: isAr ? ar : enUS })
    : null;
  const readingTime = Math.ceil((post.content?.length || 500) / 1500);

  return (
    <div className="mb-8 text-center">
      {post.category && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-color border border-color/20 rounded-full px-3 py-1 bg-color/5">
            {post.category.name}
          </span>
        </div>
      )}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
        {post.title}
      </h1>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
        {formattedDate && (
          <span className="flex items-center gap-1">
            <CalendarDays className="w-4 h-4" /> {formattedDate}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" /> {readingTime} min read
        </span>
        {post.tags.length > 0 && (
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            <div className="flex gap-1">
              {post.tags.slice(0, 3).map((tag) => (
                <span key={tag.slug} className="text-xs bg-muted/50 px-2 py-0.5 rounded-full">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}