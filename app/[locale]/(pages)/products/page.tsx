// app/[locale]/(pages)/products/page.tsx

import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { getTrendingProducts, getPublicProductCategories } from "./actions";
import { ProductsGrid } from "./_components/ProductsGrid";
import { ProductsPageHero } from "./_components/ProductsPageHero";
import { Header } from "../../_components/Header/Header";
import { FooterSection } from "../../_components/Footer/FooterSection";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trending Products",
  description:
    "Browse our latest trending products sourced from global markets.",
};

export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const locale = await getLocale();
  const isAr = locale === "ar";

  // getTrendingProducts already serializes Decimal → number and Date → ISO string
  // No additional mapping needed here.
  const [products, categories] = await Promise.all([
    getTrendingProducts(50),
    getPublicProductCategories(),
  ]);

  const featuredCount = products.filter((p) => p.isFeatured).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ProductsPageHero
        isAr={isAr}
        totalCount={products.length}
        featuredCount={featuredCount}
        categories={categories}
      />

      <Suspense fallback={<GridSkeleton />}>
        <ProductsGrid
          products={products as any}
          categories={categories}
          isAr={isAr}
          initialSearch={params.search ?? ""}
          initialCategory={params.category ?? ""}
          initialSort={params.sort ?? "trending"}
        />
      </Suspense>

      <FooterSection />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-16 pt-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 overflow-hidden"
          >
            <Skeleton className="aspect-square w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4 rounded-lg" />
              <Skeleton className="h-3 w-1/2 rounded-lg" />
              <Skeleton className="h-9 w-full rounded-xl mt-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
