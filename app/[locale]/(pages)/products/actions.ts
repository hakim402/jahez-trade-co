"use server"

// app/[locale]/(pages)/products/actions.ts
//
// All functions return plain serializable objects.
// Prisma Decimal and Date fields are converted at the source —
// never rely on the caller to serialize them.

import { prisma } from "@/lib/prisma"

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All active products for the public listing page.
 * Returns plain serializable objects — safe to pass to Client Components.
 * Decimal → number | null · Date → ISO string
 */
export async function getTrendingProducts(limit = 50) {
  const raw = await prisma.trendingProduct.findMany({
    where: { isActive: true, isDeleted: false },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
    },
    orderBy: [
      { isFeatured: "desc" },
      { trendScore: "desc" },
      { createdAt:  "desc" },
    ],
    take: limit,
  })

  // Serialize every non-plain type here so ALL callers (server pages,
  // client components via useEffect, server actions) receive clean data.
  return raw.map((p) => ({
    ...p,
    estimatedPrice: p.estimatedPrice !== null ? Number(p.estimatedPrice) : null,
    featuredUntil:  p.featuredUntil  ? p.featuredUntil.toISOString()    : null,
    createdAt:      p.createdAt.toISOString(),
    updatedAt:      p.updatedAt.toISOString(),
  }))
}

/**
 * Single product for the public detail page.
 * Returns null only if the ID doesn't exist or is hard-deleted.
 */
export async function getPublicProductById(id: string) {
  const p = await prisma.trendingProduct.findUnique({
    where: { id, isDeleted: false },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      _count: { select: { relatedRequests: true } },
    },
  })

  if (!p) return null

  return {
    ...p,
    estimatedPrice: p.estimatedPrice !== null ? Number(p.estimatedPrice) : null,
    featuredUntil:  p.featuredUntil  ? p.featuredUntil.toISOString()    : null,
    createdAt:      p.createdAt.toISOString(),
    updatedAt:      p.updatedAt.toISOString(),
  }
}

/**
 * Distinct categories of active products — for public filter pills.
 */
export async function getPublicProductCategories() {
  const results = await prisma.trendingProduct.findMany({
    where:    { isActive: true, isDeleted: false },
    select:   { category: true, categoryAr: true },
    distinct: ["category"],
    orderBy:  { category: "asc" },
  })

  return results
    .filter((r) => r.category)
    .map((r) => ({ value: r.category!, labelAr: r.categoryAr }))
}

/**
 * Related products for the detail page.
 * Tries same category first; tops up from general trending if not enough.
 */
export async function getRelatedProducts(
  currentId: string,
  category: string | null,
  limit = 4
) {
  const byCategory = category
    ? await prisma.trendingProduct.findMany({
        where:   { id: { not: currentId }, isActive: true, isDeleted: false, category },
        include: { images: { where: { isPrimary: true }, take: 1 } },
        orderBy: { trendScore: "desc" },
        take:    limit,
      })
    : []

  const list =
    byCategory.length >= limit
      ? byCategory
      : [
          ...byCategory,
          ...(await prisma.trendingProduct.findMany({
            where:   { id: { notIn: [currentId, ...byCategory.map((p) => p.id)] }, isActive: true, isDeleted: false },
            include: { images: { where: { isPrimary: true }, take: 1 } },
            orderBy: { trendScore: "desc" },
            take:    limit - byCategory.length,
          })),
        ]

  return list.map((p) => ({
    ...p,
    estimatedPrice: p.estimatedPrice !== null ? Number(p.estimatedPrice) : null,
    featuredUntil:  p.featuredUntil  ? p.featuredUntil.toISOString()    : null,
    createdAt:      p.createdAt.toISOString(),
    updatedAt:      p.updatedAt.toISOString(),
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// LIGHTWEIGHT WRITES
// ─────────────────────────────────────────────────────────────────────────────

export async function incrementProductView(id: string) {
  await prisma.trendingProduct.updateMany({
    where: { id, isActive: true, isDeleted: false },
    data:  { viewCount: { increment: 1 } },
  })
}

export async function incrementProductInquiry(id: string) {
  await prisma.trendingProduct.updateMany({
    where: { id, isActive: true, isDeleted: false },
    data:  { inquiryCount: { increment: 1 } },
  })
}

export async function linkProductRequest(
  productId: string,
  requestId: string,
  userId?: string
) {
  const existing = await prisma.trendingProductRequest.findFirst({
    where: { productId, requestId },
  })
  if (existing) return existing

  const [link] = await prisma.$transaction([
    prisma.trendingProductRequest.create({
      data: { productId, requestId, userId },
    }),
    prisma.trendingProduct.update({
      where: { id: productId },
      data:  { inquiryCount: { increment: 1 } },
    }),
  ])

  return link
}