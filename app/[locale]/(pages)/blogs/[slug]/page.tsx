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

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Generate metadata dynamically
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const result = await getPostBySlug({ slug, locale: locale as "en" | "ar" });
  if (!result.success || !result.data) {
    return { title: "Post not found" };
  }
  const post = result.data;
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt;
  const imageUrl = post.ogImageUrl || post.images?.[0]?.resolvedUrl;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author.fullName || "JAHEZ"],
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const isAr = locale === "ar";
  const postResult = await getPostBySlug({ slug, locale: locale as "en" | "ar" });

  if (!postResult.success || !postResult.data) {
    notFound();
  }

  const post = postResult.data;
  const relatedResult = await getRelatedPosts({
    postId: post.id,
    categoryId: post.category?.id,
    locale: locale as "en" | "ar",
    limit: 3,
  });
  const relatedPosts = relatedResult.success ? relatedResult.data : [];

  return (
    <main className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <Header />
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Suspense fallback={<PostSkeleton isAr={isAr} />}>
          <PostHeader post={post} isAr={isAr} />
          <PostMeta post={post} isAr={isAr} />
          <PostContent content={post.content} isAr={isAr} />
          <div className="my-8 flex flex-wrap items-center justify-between gap-4 border-y border-border/40 py-4">
            <AuthorCard author={post.author} isAr={isAr} />
            <SocialShare url={`/${locale}/blogs/${slug}`} title={post.title} isAr={isAr} />
          </div>
          {relatedPosts.length > 0 && (
            <RelatedPosts posts={relatedPosts} isAr={isAr} />
          )}
          <CommentsSection postId={post.id} postSlug={slug} isAr={isAr} />
        </Suspense>
      </article>
      <FooterSection />
    </main>
  );
}