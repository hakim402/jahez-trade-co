// app/[locale]/(pages)/blogs/[slug]/_components/RelatedPosts.tsx

import Link from "next/link";
import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { PublicPostCard } from "../../actions";

interface RelatedPostsProps {
  posts: PublicPostCard[];
  isAr: boolean;
}

export function RelatedPosts({ posts, isAr }: RelatedPostsProps) {
  return (
    <div className="my-12">
      <h2 className="text-2xl font-bold mb-6">{isAr ? "مقالات ذات صلة" : "Related Posts"}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link key={post.id} href={`/${isAr ? "ar" : "en"}/blogs/${post.slug}`} className="group">
            <div className="rounded-xl overflow-hidden border border-border/40 bg-card hover:shadow-lg transition-all h-full flex flex-col">
              <div className="relative h-40 bg-muted">
                {post.primaryImage?.url ? (
                  <Image
                    src={post.primaryImage.url}
                    alt={post.primaryImage.altText ?? post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-color/10" />
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold line-clamp-2 group-hover:text-color transition-colors">
                  {post.title}
                </h3>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <CalendarDays className="w-3 h-3" />
                  <span>
                    {post.publishedAt
                      ? format(new Date(post.publishedAt), "PPP", { locale: isAr ? ar : enUS })
                      : ""}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}