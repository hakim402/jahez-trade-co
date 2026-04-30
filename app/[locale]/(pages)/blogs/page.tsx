import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "../../_components/Header/Header";
import { FooterSection } from "../../_components/Footer/FooterSection";
import { BlogHero } from "./_components/BlogHero";
import { BlogListClient } from "./_components/BlogListClient";
import { BlogListSkeleton } from "./_components/BlogListSkeleton";
import { listPostsPublic, listCategories, listTags } from "./actions";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    tag?: string;
    search?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const baseUrl = "https://jahez.online";

  const title = isAr ? "المدونة | جاهز" : "Blog | JAHEZ";
  const description = isAr
    ? "اقرأ أحدث المقالات والنصائح حول استيراد المنتجات، الخدمات اللوجستية، ودخول الأسواق."
    : "Read the latest articles and insights on product sourcing, logistics, and market entry.";

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/blog`,
      languages: { en: `${baseUrl}/en/blog`, ar: `${baseUrl}/ar/blog` },
    },
    openGraph: {
      title,
      description,
      locale: isAr ? "ar_SA" : "en_US",
      type: "website",
    },
  };
}

export const revalidate = 300;

export default async function BlogPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const isAr = locale === "ar";

  const category = sp.category || undefined;
  const tag = sp.tag || undefined;
  const search = sp.search || undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [categoriesResult, tagsResult, initialPostsResult] = await Promise.all([
    listCategories(locale as "en" | "ar"),
    listTags(locale as "en" | "ar"),
    listPostsPublic({
      locale: locale as "en" | "ar",
      page,
      pageSize: 12,
      categorySlug: category,
      tagSlug: tag,
      search,
    }),
  ]);

  const categories = categoriesResult.success ? categoriesResult.data : [];
  const tags = tagsResult.success ? tagsResult.data : [];
  const posts = initialPostsResult.success ? initialPostsResult.data.posts : [];
  const total = initialPostsResult.success ? initialPostsResult.data.total : 0;
  const totalPages = initialPostsResult.success
    ? initialPostsResult.data.totalPages
    : 0;

  return (
    <main className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <Header />
      <BlogHero
        isAr={isAr}
        totalCount={total}
        categories={categories}
        tags={tags}
      />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<BlogListSkeleton isAr={isAr} />}>
          <BlogListClient
            isAr={isAr}
            initialPosts={posts}
            initialTotal={total}
            initialTotalPages={totalPages}
            initialPage={page}
            categories={categories}
            tags={tags}
            initialFilters={{ category, tag, search }}
          />
        </Suspense>
      </section>
      <FooterSection />
    </main>
  );
}
