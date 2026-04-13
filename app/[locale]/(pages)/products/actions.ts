"use server"

// app/[locale]/(pages)/products/actions.ts

import { prisma } from "@/lib/prisma"

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

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


// ─────────────────────────────────────────────────────────────────────────────
// SITEMAP HELPER – Lightweight fetch of all public product IDs and updatedAt
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllProductIdsForSitemap(): Promise<
  Array<{ id: string; updatedAt: Date }>
> {
  const products = await prisma.trendingProduct.findMany({
    where: { isActive: true, isDeleted: false },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return products;
}