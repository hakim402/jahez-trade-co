'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { listPostsPublic, type PublicPostSummary } from '@/app/[locale]/(pages)/blogs/actions';

type Locale = 'en' | 'ar';

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------
function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// -----------------------------------------------------------------------------
// HARDCODED TRANSLATIONS (replace with i18n keys later)
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
  };
}

// -----------------------------------------------------------------------------
// SKELETON CARD
// -----------------------------------------------------------------------------
function SkeletonCard() {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="h-48 w-full bg-muted animate-pulse" />
      <CardHeader className="pb-2">
        <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
        <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
          <div className="h-4 w-4/6 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        <div className="h-4 w-24 bg-muted animate-pulse rounded ml-auto" />
      </CardFooter>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// BLOG POST CARD
// -----------------------------------------------------------------------------
function BlogPostCard({
  post,
  locale,
  readMoreText,
}: {
  post: PublicPostSummary;
  locale: Locale;
  readMoreText: string;
}) {
  const isRtl = locale === 'ar';
  const postUrl = `/${locale}/blogs/${post.slug}`;
  const formattedDate = formatDate(post.publishedAt || post.createdAt, locale);

  return (
    <Card className="group h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl">
      <Link href={postUrl} className="block relative h-48 w-full overflow-hidden bg-muted">
        {post.ogImageUrl ? (
          <Image
            src={post.ogImageUrl}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-indigo-200 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900" />
        )}
      </Link>
      <CardHeader className="pb-2">
        {post.category && (
          <div
            className={`text-sm text-color font-medium mb-1 ${isRtl ? 'text-right' : ''}`}
          >
            {post.category.name}
          </div>
        )}
        <CardTitle className={`text-xl leading-tight ${isRtl ? 'text-right' : ''}`}>
          <Link
            href={postUrl}
            className="hover:text-color transition-colors duration-200"
          >
            {post.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="grow">
        <p
          className={`text-muted-foreground line-clamp-3 ${isRtl ? 'text-right' : ''}`}
        >
          {post.excerpt || (post.title && '...')}
        </p>
      </CardContent>
      <CardFooter
        className={`pt-2 flex items-center justify-between border-t ${isRtl ? 'flex-row-reverse' : ''}`}
      >
        <time
          dateTime={post.publishedAt?.toISOString() || post.createdAt.toISOString()}
          className="text-xs text-muted-foreground"
        >
          {formattedDate}
        </time>
        <Button
          asChild
          variant="link"
          className="p-0 text-color hover:opacity-80 transition-opacity duration-200"
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
  const locale = rawLocale as Locale; // Cast to the expected type
  const [posts, setPosts] = useState<PublicPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isRtl = locale === 'ar';
  const t = getTranslations(locale);

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const result = await listPostsPublic({ locale, page: 1, pageSize: 6 });
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

  // -------------------------------------------------------------------------
  // RENDER ERROR
  // -------------------------------------------------------------------------
  if (error) {
    return (
      <section className="w-full py-16 text-center" dir={isRtl ? 'rtl' : 'ltr'}>
        <p className="text-destructive">⚠️ {error}</p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="mt-4"
        >
          {t.retry}
        </Button>
      </section>
    );
  }

  // -------------------------------------------------------------------------
  // MAIN RENDER
  // -------------------------------------------------------------------------
  return (
    <section className="w-full" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero Banner */}
      <div className="relative w-full h-[40vh] min-h-75 bg-linear-to-r from-indigo-500 to-indigo-700 flex items-center justify-center overflow-hidden">
        {/* Optional overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            {t.heading}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl mb-8 text-white/90"
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
              className="bg-color hover:opacity-90 text-white px-8 py-3 rounded-full shadow-lg transition-all duration-200 text-base font-medium"
            >
              <Link href={`/${locale}/blogs`}>{t.cta}</Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Recent Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold mb-8 text-foreground border-r-4 border-color pr-4 inline-block">
          {t.recentPosts}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 mt-8">
            <p className="text-muted-foreground">{t.noPosts}</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
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
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}