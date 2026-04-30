'use client';
// app/[locale]/(pages)/blogs/_components/HomeBlogShowCase.tsx

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPublishedPosts, type PublicPostCard } from '@/app/[locale]/(pages)/blogs/actions';

type Locale = 'en' | 'ar';

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------
function formatDate(dateStr: string | null, locale: string): string {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr));
}

function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// -----------------------------------------------------------------------------
// TRANSLATIONS (can be moved to next-intl later)
// -----------------------------------------------------------------------------
function getTranslations(locale: Locale) {
  const isAr = locale === 'ar';
  return {
    heading: isAr ? 'من مدونتنا' : 'From Our Blog',
    description: isAr
      ? 'أفكار، قصص، وتحديثات من فريقنا.'
      : 'Insights, stories, and updates from our team.',
    cta: isAr ? 'عرض جميع المقالات' : 'View All Posts',
    readMore: isAr ? 'اقرأ المزيد' : 'Read more',
    recentPosts: isAr ? 'أحدث المقالات' : 'Recent Posts',
    retry: isAr ? 'إعادة المحاولة' : 'Retry',
    noPosts: isAr ? 'لا توجد مقالات حالياً.' : 'No posts found.',
    minRead: isAr ? 'دقائق قراءة' : 'min read',
  };
}

// -----------------------------------------------------------------------------
// SKELETON CARD (enhanced)
// -----------------------------------------------------------------------------
function SkeletonCard() {
  return (
    <Card className="h-full flex flex-col overflow-hidden border-border/50 shadow-sm">
      <div className="h-52 w-full bg-muted animate-pulse" />
      <CardHeader className="pb-2">
        <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
        <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
        <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
        <div className="h-4 w-4/6 bg-muted animate-pulse rounded" />
      </CardContent>
      <CardFooter className="pt-2 flex items-center justify-between">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-8 w-20 bg-muted animate-pulse rounded" />
      </CardFooter>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// BLOG POST CARD (enhanced)
// -----------------------------------------------------------------------------
function BlogPostCard({
  post,
  locale,
  readMoreText,
  minReadText,
}: {
  post: PublicPostCard;
  locale: Locale;
  readMoreText: string;
  minReadText: string;
}) {
  const isRtl = locale === 'ar';
  const postUrl = `/${locale}/blogs/${post.slug}`;
  const formattedDate = formatDate(post.publishedAt, locale);
  const readingTime = estimateReadingTime(post.excerpt || post.title);
  const authorName = post.author.fullName ?? 'Anonymous';
  const authorInitials = getInitials(authorName);

  return (
    <Card className="group h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/30 border-border/50 bg-card">
      <Link href={postUrl} className="block relative h-52 w-full overflow-hidden bg-muted">
        {post.primaryImage?.url ? (
          <Image
            src={post.primaryImage.url}
            alt={post.primaryImage.altText ?? post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-indigo-200 to-indigo-100 dark:from-indigo-950 dark:to-indigo-800" />
        )}
        {/* Category badge overlay */}
        {post.category && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-block bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full">
              {post.category.name}
            </span>
          </div>
        )}
      </Link>
      <CardHeader className="pb-2 space-y-2">
        <CardTitle className={`text-xl leading-tight ${isRtl ? 'text-right' : ''}`}>
          <Link
            href={postUrl}
            className="hover:text-primary transition-colors duration-200 line-clamp-2"
          >
            {post.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="grow">
        <p className={`text-muted-foreground line-clamp-3 ${isRtl ? 'text-right' : ''}`}>
          {post.excerpt || post.title}
        </p>
      </CardContent>
      <CardFooter className="pt-2 flex flex-col gap-2 border-t border-border/30">
        {/* Author + date + reading time row */}
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              {post.author.avatarUrl && (
                <AvatarImage src={post.author.avatarUrl} alt={authorName} />
              )}
              <AvatarFallback className="text-[10px]">{authorInitials}</AvatarFallback>
            </Avatar>
            <span>{authorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <time dateTime={post.publishedAt ?? undefined}>
              {formattedDate}
            </time>
            <span>•</span>
            <span>{readingTime} {minReadText}</span>
          </div>
        </div>
        <Button
          asChild
          variant="link"
          className="p-0 text-primary hover:opacity-80 transition-opacity duration-200 self-start"
        >
          <Link href={postUrl}>
            {readMoreText} {isRtl ? '←' : '→'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------
export default function HomeBlogShowCase() {
  const rawLocale = useLocale();
  const locale = rawLocale as Locale;
  const [posts, setPosts] = useState<PublicPostCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isRtl = locale === 'ar';
  const t = getTranslations(locale);

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const result = await getPublishedPosts({ locale, page: 1, limit: 6 });
        if (result.success) {
          setPosts(result.data.posts);
          setError(null);
        } else {
          setError(result.error);
          setPosts([]);
        }
      } catch (err: any) {
        setError(err.message ?? 'Failed to load posts');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [locale]);

  if (error) {
    return (
      <section className="w-full py-16 text-center" dir={isRtl ? 'rtl' : 'ltr'}>
        <p className="text-destructive">⚠️ {error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
          {t.retry}
        </Button>
      </section>
    );
  }

  return (
    <section className="w-full" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero Banner with improved gradient and animation */}
      <div className="relative w-full h-[45vh] min-h-87.5 bg-linear-to-br from-purple-600 via-indigo-600 to-blue-700 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight"
          >
            {t.heading}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto"
          >
            {t.description}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              asChild
              className="bg-white text-gray-900 hover:bg-gray-100 rounded-full px-8 py-3 text-base font-medium shadow-lg transition-all duration-200"
            >
              <Link href={`/${locale}/blogs`}>{t.cta}</Link>
            </Button>
          </motion.div>
        </div>
        {/* Decorative shape */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-background to-transparent" />
      </div>

      {/* Recent Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground border-l-4 border-primary pl-4">
            {t.recentPosts}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t.noPosts}</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {posts.map((post, idx) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <BlogPostCard
                  post={post}
                  locale={locale}
                  readMoreText={t.readMore}
                  minReadText={t.minRead}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}