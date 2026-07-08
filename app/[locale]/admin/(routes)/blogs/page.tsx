// app/[locale]/admin/(routes)/blogs/page.tsx

import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllPosts, getBlogStats, getAllCategories, getAllTags } from "./actions";
import { BlogPageClient } from "./_components/BlogPageClient";
import { BlogPageSkeleton } from "./_components/BlogPageSkeleton";
import { AdminHeader } from "../../_components/AdminHeader";

// ─── FORCE DYNAMIC RENDERING ──────────────────
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "Blog Management | Admin" };

type StatusFilter = "all" | "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DELETED";
type SortByFilter = "createdAt" | "updatedAt" | "publishedAt" | "titleEn";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

function safeData<T>(
  result: { success: boolean; data?: T; error?: string },
  fallback: T,
): T {
  return result.success && result.data !== undefined ? result.data : fallback;
}

export default async function BlogsPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const page    = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const limit   = 16;
  const status  = ((sp.status as StatusFilter) || "all") satisfies StatusFilter;
  const sortBy  = ((sp.sortBy  as SortByFilter) || "createdAt") satisfies SortByFilter;
  const sortOrder = ((sp.sortOrder as "asc" | "desc") || "desc") satisfies "asc" | "desc";
  const categoryId = sp.category || undefined;
  const search     = sp.search   || undefined;

  const categoryIdParam = sp.category ?? "";
  const searchParam = sp.search ?? "";

  const [listResult, statsResult, categoriesResult, tagsResult] = await Promise.all([
    getAllPosts({ page, limit, status, categoryId: categoryIdParam, search: searchParam, sortBy, sortOrder }),
    getBlogStats(),
    getAllCategories(true),
    getAllTags(true),
  ]);

  const listData = safeData(listResult, {
    posts: [],
    total: 0,
    page,
    limit,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const stats      = statsResult.success      ? (statsResult.data ?? null)      : null;
  const categories = safeData(categoriesResult, []);
  const tags       = safeData(tagsResult,       []);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 min-h-screen">
      <AdminHeader />
      <Suspense fallback={<BlogPageSkeleton />}>
        <BlogPageClient
          initialPosts={listData.posts as any}
          pagination={{ page, limit, total: listData.total, pages: listData.pages }}
          stats={stats as any}
          categories={categories as any}
          tags={tags as any}
          filters={{ page, limit, status, categoryId, search, sortBy, sortOrder }}
        />
      </Suspense>
    </div>
  );
}