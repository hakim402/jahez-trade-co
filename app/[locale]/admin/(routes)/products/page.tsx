// app/[locale]/admin/(routes)/products/page.tsx

import { Suspense } from "react";
import type { Metadata } from "next";
import {
  getAllProducts,
  getProductStats,
  getProductCategories,
} from "./actions";
import { ProductPageClient } from "./_components/ProductPageClient";
import { ProductPageSkeleton } from "./_components/ProductPageSkeleton";
import { AdminHeader } from "../../_components/AdminHeader";


// ─── FORCE DYNAMIC RENDERING ──────────────────
export const dynamic = "force-dynamic";
export const revalidate = 0;


export const metadata: Metadata = { title: "Trending Products | Admin" };

type StatusFilter = "all" | "active" | "inactive" | "deleted" | "featured";
type SortByFilter =
  | "createdAt"
  | "updatedAt"
  | "trendScore"
  | "viewCount"
  | "inquiryCount"
  | "name"
  | "estimatedPrice";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    sourceCountry?: string;
    priceMin?: string;
    priceMax?: string;
  }>;
}

// Helper to safely extract data from an ActionResult
function safeData<T>(
  result: { success: boolean; data?: T; error?: string },
  fallback: T,
): T {
  return result.success && result.data !== undefined ? result.data : fallback;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const limit = 16;

  const filters = {
    page,
    limit,
    status: (sp.status as StatusFilter) || "all",
    category: sp.category || "",
    search: sp.search || "",
    sortBy: (sp.sortBy as SortByFilter) || "createdAt",
    sortOrder: (sp.sortOrder as "asc" | "desc") || "desc",
    sourceCountry: sp.sourceCountry || undefined,
    priceMin: sp.priceMin ? Number(sp.priceMin) : undefined,
    priceMax: sp.priceMax ? Number(sp.priceMax) : undefined,
    tags: [] as string[],
  };

  const [listResult, statsResult, categoriesResult] = await Promise.all([
    getAllProducts(filters),
    getProductStats(),
    getProductCategories(),
  ]);

  // Extract data with fallbacks
  const { products, total, pages } = safeData(listResult, {
    products: [],
    total: 0,
    page,
    limit,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const stats = statsResult.success ? statsResult.data : null;
  const categories = safeData(categoriesResult, []);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 min-h-screen">
      <AdminHeader />

      <Suspense fallback={<ProductPageSkeleton />}>
        <ProductPageClient
          initialProducts={products}
          pagination={{ page, limit, total, pages }}
          stats={stats}
          categories={categories}
          filters={filters}
        />
      </Suspense>
    </div>
  );
}
