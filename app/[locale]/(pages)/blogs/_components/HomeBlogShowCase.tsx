"use client";
// app/[locale]/(pages)/blogs/_components/HomeBlogShowCase.tsx

import { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getPublishedPosts,
  type PublicPostCard,
} from "@/app/[locale]/(pages)/blogs/actions";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type Locale = "en" | "ar";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function formatDate(dateStr: string | null, locale: string): string {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────
function getT(locale: Locale) {
  const ar = locale === "ar";
  return {
    heading: ar ? "من مدونتنا" : "From Our Blog",
    description: ar
      ? "أفكار، قصص، وتحديثات من فريقنا."
      : "Insights, stories, and updates from our team.",
    cta: ar ? "عرض جميع المقالات" : "View All Posts",
    readMore: ar ? "اقرأ المزيد" : "Read more",
    recentPosts: ar ? "أحدث المقالات" : "Recent Posts",
    featured: ar ? "مقال مميز" : "Featured Post",
    retry: ar ? "إعادة المحاولة" : "Retry",
    noPosts: ar ? "لا توجد مقالات حالياً." : "No posts found.",
    minRead: ar ? "دقائق" : "min read",
  };
}

// ─────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────
function SkeletonFeatured() {
  return (
    <div className="relative rounded-3xl overflow-hidden bg-muted animate-pulse aspect- md:aspect-2/1" />
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border/40 bg-card">
      <div className="h-44 bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-20 bg-muted animate-pulse rounded-full" />
        <div className="h-5 w-4/5 bg-muted animate-pulse rounded" />
        <div className="h-3 w-full bg-muted animate-pulse rounded" />
        <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CATEGORY PILL
// ─────────────────────────────────────────────
function CategoryPill({
  name,
  inverted = false,
}: {
  name: string;
  inverted?: boolean;
}) {
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase
        ${
          inverted
            ? "bg-white/20 text-white backdrop-blur-sm border border-white/30"
            : "bg-(--brand)/10 text-(--brand) border border-(--brand)/20"
        }
      `}
    >
      {name}
    </span>
  );
}

// ─────────────────────────────────────────────
// READING TIME BAR
// ─────────────────────────────────────────────
function ReadingTime({ minutes, label }: { minutes: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="w-1 rounded-full transition-all duration-300"
            style={{
              height: i < Math.min(minutes, 5) ? "10px" : "4px",
              background:
                i < Math.min(minutes, 5)
                  ? "var(--brand)"
                  : "var(--color-border, oklch(0.928 0.006 264.531))",
              opacity: i < Math.min(minutes, 5) ? 1 - i * 0.15 : 0.4,
            }}
          />
        ))}
      </span>
      <span>
        {minutes} {label}
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────
// FEATURED CARD (hero – first post)
// ─────────────────────────────────────────────
function FeaturedCard({
  post,
  locale,
  t,
}: {
  post: PublicPostCard;
  locale: Locale;
  t: ReturnType<typeof getT>;
}) {
  const isRtl = locale === "ar";
  const postUrl = `/${locale}/blogs/${post.slug}`;
  const authorName = post.author.fullName ?? "Anonymous";
  const readingTime = estimateReadingTime(post.excerpt || post.title);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative group rounded-3xl overflow-hidden"
    >
      <Link href={postUrl} className="block">
        {/* Image layer */}
        <div className="relative w-full aspect-video md:aspect-2/1 overflow-hidden bg-linear-to-br from-purple-900 via-indigo-900 to-blue-900">
          {post.primaryImage?.url ? (
            <Image
              src={post.primaryImage.url}
              alt={post.primaryImage.altText ?? post.title}
              fill
              priority
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              sizes="(max-width: 768px) 100vw, 80vw"
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-[#7b57fc]/80 via-indigo-700/70 to-blue-800/60">
              {/* Decorative blobs */}
              <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-400/10 rounded-full blur-2xl" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-black/40 to-transparent" />

          {/* Content */}
          <div
            className={`absolute inset-0 flex flex-col justify-end p-6 md:p-10 ${isRtl ? "items-end text-right" : "items-start text-left"}`}
          >
            {/* Badges */}
            <div
              className={`flex gap-2 mb-4 flex-wrap ${isRtl ? "flex-row-reverse" : ""}`}
            >
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-color text-white">
                {t.featured}
              </span>
              {post.category && (
                <CategoryPill name={post.category.name} inverted />
              )}
            </div>

            {/* Title */}
            <h2 className="text-white font-bold text-2xl md:text-4xl lg:text-5xl leading-tight max-w-3xl mb-3 line-clamp-3">
              {post.title}
            </h2>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-white/75 text-sm md:text-base max-w-xl mb-5 line-clamp-2">
                {post.excerpt}
              </p>
            )}

            {/* Footer row */}
            <div
              className={`flex items-center gap-4 flex-wrap ${isRtl ? "flex-row-reverse" : ""}`}
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7 ring-2 ring-white/30">
                  {post.author.avatarUrl && (
                    <AvatarImage src={post.author.avatarUrl} alt={authorName} />
                  )}
                  <AvatarFallback className="text-[10px] bg-white/20 text-white">
                    {getInitials(authorName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white/80 text-sm">{authorName}</span>
              </div>
              {post.publishedAt && (
                <span className="text-white/50 text-xs hidden sm:block">
                  {formatDate(post.publishedAt, locale)}
                </span>
              )}
              <ReadingTime minutes={readingTime} label={t.minRead} />
            </div>
          </div>
        </div>

        {/* Read more bar */}
        <div
          className={`
            absolute bottom-0 inset-x-0 h-0.5 bg-linear-to-r from-(--brand) to-indigo-400
            scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out
            ${isRtl ? "origin-right" : "origin-left"}
          `}
        />
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// SECONDARY CARD (remaining posts)
// ─────────────────────────────────────────────
function PostCard({
  post,
  locale,
  index,
  t,
}: {
  post: PublicPostCard;
  locale: Locale;
  index: number;
  t: ReturnType<typeof getT>;
}) {
  const isRtl = locale === "ar";
  const postUrl = `/${locale}/blogs/${post.slug}`;
  const authorName = post.author.fullName ?? "Anonymous";
  const readingTime = estimateReadingTime(post.excerpt || post.title);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.55,
        delay: index * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group flex flex-col h-full"
    >
      <Link
        href={postUrl}
        className="flex flex-col h-full rounded-2xl overflow-hidden border border-border/40 bg-card hover:border-[var(--brand)]/40 hover:shadow-[0_8px_32px_rgba(123,87,252,0.12)] transition-all duration-400"
      >
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-50 dark:from-indigo-950 dark:to-purple-900/50 flex-shrink-0">
          {post.primaryImage?.url ? (
            <Image
              src={post.primaryImage.url}
              alt={post.primaryImage.altText ?? post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--brand)]/20 flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-[var(--brand)]/0 group-hover:bg-[var(--brand)]/8 transition-colors duration-400" />

          {/* Category */}
          {post.category && (
            <div className={`absolute top-3 ${isRtl ? "right-3" : "left-3"}`}>
              <CategoryPill name={post.category.name} />
            </div>
          )}
        </div>

        {/* Body */}
        <div
          className={`flex flex-col flex-grow p-5 gap-3 ${isRtl ? "text-right items-end" : "text-left items-start"}`}
        >
          {/* Title */}
          <h3 className="font-bold text-base leading-snug text-foreground line-clamp-2 group-hover:text-[var(--brand)] transition-colors duration-200">
            {post.title}
          </h3>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-muted-foreground text-sm line-clamp-2 flex-grow">
              {post.excerpt}
            </p>
          )}

          {/* Spacer */}
          <div className="flex-grow" />

          {/* Footer */}
          <div
            className={`w-full pt-3 border-t border-border/30 flex items-center justify-between gap-2 ${isRtl ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`flex items-center gap-1.5 min-w-0 ${isRtl ? "flex-row-reverse" : ""}`}
            >
              <Avatar className="h-5 w-5 flex-shrink-0">
                {post.author.avatarUrl && (
                  <AvatarImage src={post.author.avatarUrl} alt={authorName} />
                )}
                <AvatarFallback className="text-[9px]">
                  {getInitials(authorName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">
                {authorName}
              </span>
            </div>
            <ReadingTime minutes={readingTime} label={t.minRead} />
          </div>
        </div>

        {/* Animated bottom bar */}
        <div
          className={`h-0.5 bg-gradient-to-r from-[var(--brand)] to-indigo-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-400 ${isRtl ? "origin-right" : "origin-left"}`}
        />
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────
function SectionHeader({
  title,
  cta,
  ctaHref,
  isRtl,
}: {
  title: string;
  cta?: string;
  ctaHref?: string;
  isRtl: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-center justify-between mb-10 ${isRtl ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`flex items-center gap-4 ${isRtl ? "flex-row-reverse" : ""}`}
      >
        <div className="h-8 w-1 rounded-full bg-linear-to-b from-(--brand) to-indigo-400" />
        <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
          {title}
        </h2>
      </div>
      {cta && ctaHref && (
        <Link
          href={ctaHref}
          className="text-sm font-medium text-color hover:opacity-75 transition-opacity flex items-center gap-1.5"
        >
          <span>{cta}</span>
          <span className="text-lg leading-none">{isRtl ? "←" : "→"}</span>
        </Link>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function HomeBlogShowCase() {
  const locale = useLocale() as Locale;
  const [posts, setPosts] = useState<PublicPostCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

  const isRtl = locale === "ar";
  const t = getT(locale);

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const result = await getPublishedPosts({ locale, page: 1, limit: 7 });
        if (result.success) {
          setPosts(result.data.posts);
          setError(null);
        } else {
          setError(result.error);
        }
      } catch (err: any) {
        setError(err?.message ?? "Failed to load posts");
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [locale]);

  const featured = posts[0] ?? null;
  const rest = posts.slice(1);

  if (error) {
    return (
      <section className="w-full py-20 text-center" dir={isRtl ? "rtl" : "ltr"}>
        <p className="text-destructive mb-4"> {error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          {t.retry}
        </Button>
      </section>
    );
  }

  return (
    <section className="w-full" dir={isRtl ? "rtl" : "ltr"}>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 space-y-16">
        {/* ── Featured Post ── */}
        <div>
          <SectionHeader title={t.featured} isRtl={isRtl} />
          {loading ? (
            <SkeletonFeatured />
          ) : featured ? (
            <FeaturedCard post={featured} locale={locale} t={t} />
          ) : null}
        </div>

        {/* ── Recent Posts Grid ── */}
        {(loading || rest.length > 0) && (
          <div>
            <SectionHeader
              title={t.recentPosts}
              cta={t.cta}
              ctaHref={`/${locale}/blogs`}
              isRtl={isRtl}
            />

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : rest.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
                {t.noPosts}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((post, idx) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    locale={locale}
                    index={idx}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── View All CTA ── */}
        {!loading && posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex justify-center pt-4"
          >
            <Link
              href={`/${locale}/blogs`}
              className="group inline-flex items-center gap-3 px-8 py-3.5 rounded-full border border-(--brand)/30 bg-(--brand)/5 hover:bg-(--brand)/10 text-(--brand) font-semibold text-sm transition-all duration-300 hover:border-(--brand)/60"
            >
              <span>{t.cta}</span>
              <span
                className={`transition-transform duration-300 text-lg ${isRtl ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"}`}
              >
                {isRtl ? "←" : "→"}
              </span>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
