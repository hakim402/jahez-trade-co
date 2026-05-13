"use client";

// app/[locale]/(pages)/blogs/_components/BlogCard.tsx

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { CalendarDays, ArrowRight, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PublicPostCard } from "../actions";
import { useState } from "react";

interface BlogCardProps {
  post: PublicPostCard;
  isAr: boolean;
  layout: "grid" | "list";
}

// Helper hook: Track failed image URLs for graceful fallbacks
function useBlogImageErrorHandler() {
  const [errorUrls, setErrorUrls] = useState<Set<string>>(new Set());

  const handleError = (url: string) => {
    console.warn(`BlogCard image failed to load: ${url}`);
    setErrorUrls((prev) => new Set(prev).add(url));
  };

  const hasError = (url: string) => errorUrls.has(url);

  return { handleError, hasError };
}

export function BlogCard({ post, isAr, layout }: BlogCardProps) {
  const postUrl = `/${isAr ? "ar" : "en"}/blogs/${post.slug}`;
  const formattedDate = new Intl.DateTimeFormat(isAr ? "ar" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(post.publishedAt ? new Date(post.publishedAt) : new Date());

  const title = post.title;
  const excerpt = post.excerpt || "...";

  // Track image errors for this card
  const { handleError, hasError } = useBlogImageErrorHandler();
  const imageUrl = post.primaryImage?.url;
  const imageHasError = imageUrl ? hasError(imageUrl) : false;

  if (layout === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="group rounded-2xl border border-border/40 bg-card hover:border-(--brand)/30 hover:shadow-lg transition-all duration-300 overflow-hidden"
      >
        <Link href={postUrl} className="flex items-center gap-5 p-5">
          {/* Image */}
          <div className="w-28 h-28 rounded-xl overflow-hidden shrink-0 bg-muted/30">
            {post.primaryImage?.url && !imageHasError ? (
              <Image
                src={post.primaryImage.url}
                alt={post.primaryImage.altText ?? title}
                width={112}
                height={112}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                // Skip Next.js optimizer for user uploads
                unoptimized={true}
                // Handle load errors gracefully
                onError={() => handleError(post.primaryImage!.url)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-(--brand)/8">
                <Tag className="w-8 h-8 text-(--brand)/40" />
                {/* Fallback text if image fails */}
                {post.primaryImage?.url && imageHasError && (
                  <span className="absolute bottom-1 text-[9px] text-muted-foreground">
                    Unavailable
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {post.category && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-(--brand)/10 text-(--brand) border border-(--brand)/20 mb-1.5">
                    {post.category.name}
                  </span>
                )}
                <h3 className="text-base font-bold text-foreground group-hover:text-(--brand) transition-colors line-clamp-2">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {excerpt}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <CalendarDays className="w-3 h-3" /> {formattedDate}
              </span>
              {post.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.slug}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>

          <ArrowRight
            className={cn(
              "w-5 h-5 text-muted-foreground/30 group-hover:text-(--brand) group-hover:translate-x-1 transition-all shrink-0",
              isAr && "rotate-180 group-hover:-translate-x-1",
            )}
          />
        </Link>
      </motion.div>
    );
  }

  // Grid layout
  return (
    <Card className="group h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-(--brand)/30">
      <Link
        href={postUrl}
        className="block relative h-48 w-full overflow-hidden bg-muted"
      >
        {post.primaryImage?.url && !imageHasError ? (
          <Image
            src={post.primaryImage.url}
            alt={post.primaryImage.altText ?? title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            //  Skip Next.js optimizer for user uploads
            unoptimized={true}
            //  Handle load errors gracefully
            onError={() => handleError(post.primaryImage!.url)}
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-(--brand)/20 to-indigo-200 dark:to-indigo-950 flex items-center justify-center">
            <Tag className="w-12 h-12 text-(--brand)/30" />
            {/* Fallback text if image fails */}
            {post.primaryImage?.url && imageHasError && (
              <span className="absolute bottom-2 text-[10px] text-muted-foreground">
                Image unavailable
              </span>
            )}
          </div>
        )}

        {post.category && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm border border-border/40 text-foreground">
              {post.category.name}
            </span>
          </div>
        )}
      </Link>

      <CardHeader className="pb-2">
        <CardTitle className="text-xl leading-tight">
          <Link
            href={postUrl}
            className="hover:text-(--brand) transition-colors line-clamp-2"
          >
            {title}
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent className="grow">
        <p className="text-muted-foreground line-clamp-3 text-sm">{excerpt}</p>
      </CardContent>

      <CardFooter className="pt-2 flex items-center justify-between border-t">
        <time
          dateTime={post.publishedAt ?? undefined}
          className="text-xs text-muted-foreground flex items-center gap-1"
        >
          <CalendarDays className="w-3 h-3" /> {formattedDate}
        </time>
        <Button
          asChild
          variant="link"
          className="p-0 text-(--brand) hover:opacity-80 transition-opacity"
        >
          <Link href={postUrl}>
            {isAr ? "اقرأ المزيد" : "Read more"} {isAr ? "←" : "→"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
