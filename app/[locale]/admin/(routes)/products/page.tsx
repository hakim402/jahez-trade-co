// app/[locale]/admin/(routes)/products/page.tsx

import { Suspense } from "react"
import { getAllProducts, getProductStats, getProductCategories } from "./actions"
import { ProductsClient } from "./_components/ProductsClient"
import { ProductStats } from "./_components/ProductStats"
import { AdminHeader } from "../../_components/AdminHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { Flame } from "lucide-react"

export const metadata = {
  title: "Trending Products — Admin",
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    category?: string
    status?: string
    sortBy?: string
    sortOrder?: string
  }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams

  const page      = Number(params.page ?? 1)
  const search    = params.search ?? ""
  const category  = params.category ?? ""
  const status    = params.status ?? "all"
  const sortBy    = params.sortBy ?? "createdAt"
  const sortOrder = (params.sortOrder as "asc" | "desc") ?? "desc"

  const [productsData, stats, categories] = await Promise.all([
    getAllProducts({ page, search, category, status, sortBy, sortOrder }),
    getProductStats(),
    getProductCategories(),
  ])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <AdminHeader />

      <div className="flex flex-col flex-1 overflow-hidden px-4 md:px-6 lg:px-8 pt-6 pb-4 gap-5 max-w-screen-2xl mx-auto w-full">

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7b57fc]/10">
              <Flame className="h-5 w-5 text-[#7b57fc]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-color">
                Trending Products
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Manage trending products displayed to clients on the platform.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/50 self-start sm:self-auto">
            <Flame size={14} className="text-muted-foreground" />
            <span className="text-sm font-bold text-foreground tabular-nums">
              {productsData.total.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">total</span>
          </div>
        </div>

        {/* ── KPI Stats ───────────────────────────────────────────── */}
        <Suspense fallback={<StatsSkeletons />}>
          <ProductStats stats={stats} />
        </Suspense>

        {/* ── Table — fills remaining height ──────────────────────── */}
        <div className="flex-1 min-h-0">
          <ProductsClient
            initialData={productsData}
            categories={categories}
            initialFilters={{ page, search, category, status, sortBy, sortOrder }}
          />
        </div>

      </div>
    </div>
  )
}

function StatsSkeletons() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[72px] rounded-2xl" />
      ))}
    </div>
  )
}