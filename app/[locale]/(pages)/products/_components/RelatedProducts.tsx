// ═══════════════════════════════════════════════════════════════════════════
// FILE 3: app/[locale]/(pages)/products/_components/related-products.tsx
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma"
import { ProductCard } from "./ProductCard"
import { TrendingUp } from "lucide-react"

interface RelatedProductsProps {
  currentId: string
  category: string | null
  isAr: boolean
}

export async function RelatedProducts({ currentId, category, isAr }: RelatedProductsProps) {
  const related = await prisma.trendingProduct.findMany({
    where: {
      id:        { not: currentId },
      isActive:  true,
      isDeleted: false,
      ...(category ? { category } : {}),
    },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
    },
    orderBy: { trendScore: "desc" },
    take: 4,
  })

  if (related.length === 0) return null

  return (
    <div className="mt-16 pt-10 border-t border-border/50">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-4 h-4 text-[#7b57fc]" />
        <h2 className="text-base font-semibold text-foreground">
          {isAr ? "منتجات ذات صلة" : "Related Products"}
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {related.map((p, i) => (
          <ProductCard
            key={p.id}
            product={p as any}
            isAr={isAr}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}