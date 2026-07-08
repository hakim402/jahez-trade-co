// app/[locale]/(pages)/blogs/[slug]/page.tsx

import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/app/[locale]/_components/Header/Header";
import { FooterSection } from "@/app/[locale]/_components/Footer/FooterSection";
import { getPostBySlug, getRelatedPosts } from "../actions";
import { PostHeader } from "./_components/PostHeader";
import { PostContent } from "./_components/PostContent";
import { PostMeta } from "./_components/PostMeta";
import { AuthorCard } from "./_components/AuthorCard";
import { RelatedPosts } from "./_components/RelatedPosts";
import { CommentsSection } from "./_components/CommentsSection";
import { SocialShare } from "./_components/SocialShare";
import { PostSkeleton } from "./_components/PostSkeleton";
import { PostMedia } from "./_components/PostMedia";
import { PostVideo } from "./_components/PostVideo";
import { headers } from "next/headers";

// ─── SEO IMPORTS ─────────────────────────────
import { generatePageMetadata } from "@/lib/seo/metadata";
import BlogSchema from "@/components/seo/BlogSchema";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// ─── SIMPLIFIED METADATA ─────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const result = await getPostBySlug(slug, locale as "en" | "ar");

  if (!result.success) {
    return { title: "Post not found" };
  }

  const post = result.data;
  const title = post.seo?.metaTitle ?? post.title;
  const description = post.seo?.metaDescription ?? post.excerpt ?? undefined;
  const imageUrl = post.seo?.ogImageUrl ?? post.images?.[0]?.url ?? null;

  return generatePageMetadata({
    pageType: "blog",
    locale: locale as "en" | "ar",
    country: "GLOBAL",
    pathSegment: `blogs/${post.slug}`,
    customTitle: title,
    customDescription: description,
    ogImageUrl: imageUrl,
    ogImageAlt: title,
    publishedDate: post.publishedAt || undefined,
    modifiedDate: post.publishedAt || undefined,
    authorName: post.author.fullName,
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const isAr = locale === "ar";
  const postResult = await getPostBySlug(slug, locale as "en" | "ar");
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;
  const absoluteUrl = `${baseUrl}/${locale}/blogs/${slug}`;

  if (!postResult.success) {
    notFound();
  }

  const post = postResult.data;
  const relatedResult = await getRelatedPosts(
    post.id,
    locale as "en" | "ar",
    3,
  );
  const relatedPosts = relatedResult.success ? relatedResult.data : [];

  // Breadcrumb items
  const breadcrumbItems = [
    { name: isAr ? "الرئيسية" : "Home", url: `/${locale}` },
    { name: isAr ? "المدونة" : "Blog", url: `/${locale}/blogs` },
    { name: post.title, url: "" },
  ];

  return (
    <main className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <Header />

      {/* ─── SCHEMA MARKUP ─────────────────────── */}
      <BlogSchema post={post as any} locale={locale as "en" | "ar"} />
      <BreadcrumbSchema items={breadcrumbItems} />

      <article className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24">
        <Suspense fallback={<PostSkeleton isAr={isAr} />}>
          <PostHeader post={post} isAr={isAr} />
          <PostMedia post={post} isAr={isAr} />
          <PostContent content={post.content} isAr={isAr} />
          <PostVideo
            videos={post.videos}
            isAr={isAr}
            title={isAr ? "فيديوهات ذات صلة" : "Related Videos"}
          />
          <PostMeta post={post} isAr={isAr} />
          <div className="my-8 flex flex-wrap items-center justify-between gap-4 border-y border-border/40 py-4">
            <AuthorCard author={post.author} isAr={isAr} />
            <SocialShare url={absoluteUrl} title={post.title} isAr={isAr} />
          </div>
          {relatedPosts.length > 0 && (
            <RelatedPosts posts={relatedPosts} isAr={isAr} />
          )}
          <CommentsSection postId={post.id} isAr={isAr} />
        </Suspense>
      </article>
      <FooterSection />
    </main>
  );
}