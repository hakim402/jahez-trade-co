// app/[locale]/(pages)/blogs/page.tsx

import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "../../_components/Header/Header";
import { FooterSection } from "../../_components/Footer/FooterSection";
import { BlogHero } from "./_components/BlogHero";
import { BlogListClient } from "./_components/BlogListClient";
import { BlogListSkeleton } from "./_components/BlogListSkeleton";
import { getPublishedPosts, getPublicCategories, getPublicTags } from "./actions";

// ─── SEO IMPORTS ─────────────────────────────
import { generatePageMetadata } from "@/lib/seo/metadata";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import BlogSchema from "@/components/seo/BlogSchema";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    tag?: string;
    search?: string;
    page?: string;
  }>;
}

// ─── SIMPLIFIED METADATA ─────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata({
    pageType: "blog",
    locale: locale as "en" | "ar",
    country: "GLOBAL",
    pathSegment: "blogs",
  });
}

export const revalidate = 300;

export default async function BlogPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const isAr = locale === "ar";

  const categorySlug = sp.category || undefined;
  const tagSlug = sp.tag || undefined;
  const search = sp.search || undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const limit = 12;

  const [categoriesResult, tagsResult, initialPostsResult] = await Promise.all([
    getPublicCategories(locale as "en" | "ar"),
    getPublicTags(locale as "en" | "ar"),
    getPublishedPosts({
      locale: locale as "en" | "ar",
      page,
      limit,
      categorySlug,
      tagSlug,
      search,
    }),
  ]);

  const categories = categoriesResult.success ? categoriesResult.data : [];
  const tags = tagsResult.success ? tagsResult.data : [];
  const posts = initialPostsResult.success ? initialPostsResult.data.posts : [];
  const total = initialPostsResult.success ? initialPostsResult.data.total : 0;
  const totalPages = initialPostsResult.success
    ? initialPostsResult.data.pages
    : 0;

  // Breadcrumb items
  const breadcrumbItems = [
    { name: isAr ? "الرئيسية" : "Home", url: `/${locale}` },
    { name: isAr ? "المدونة" : "Blog", url: `/${locale}/blogs` },
  ];

  return (
    <main className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <Header />

      {/* ─── SCHEMA MARKUP ─────────────────────── */}
      <BreadcrumbSchema items={breadcrumbItems} />

      {/* Blog Schema for first 3 posts */}
      {posts.slice(0, 3).map((post) => (
        <Suspense key={post.id} fallback={null}>
          <BlogSchema post={post as any} locale={locale as "en" | "ar"} />
        </Suspense>
      ))}

      <BlogHero
        isAr={isAr}
        totalCount={total}
        categories={categories}
        tags={tags}
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Suspense fallback={<BlogListSkeleton isAr={isAr} />}>
          <BlogListClient
            isAr={isAr}
            initialPosts={posts}
            initialTotal={total}
            initialTotalPages={totalPages}
            initialPage={page}
            categories={categories}
            tags={tags}
            initialFilters={{
              category: categorySlug,
              tag: tagSlug,
              search,
            }}
          />
        </Suspense>
      </section>

      <FooterSection />
    </main>
  );
}