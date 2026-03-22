"use server"

// app/[locale]/admin/(routes)/products/actions.ts

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-guard"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { writeFile, mkdir, unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export type BulkAction =
  | "activate" | "deactivate"
  | "feature" | "unfeature"
  | "delete" | "restore"

export type CreateProductInput = {
  name: string
  nameAr?: string
  description?: string
  descriptionAr?: string
  shortDesc?: string
  shortDescAr?: string
  estimatedPrice?: number
  currency?: string
  sourceCountry?: string
  sourceUrl?: string
  supplier?: string
  category?: string
  categoryAr?: string
  tags?: string[]
  trendScore?: number
  isFeatured?: boolean
  featuredUntil?: Date | string
  images?: {
    url: string
    isPrimary?: boolean
    altText?: string
    sortOrder?: number
  }[]
}

export type UpdateProductInput = Partial<Omit<CreateProductInput, "images">> & {
  isActive?: boolean
  isDeleted?: boolean
}

export type SerializedShippingEstimate = {
  id: string
  userId: string | null
  originCountry: string
  destinationCountry: string
  weightKg: number
  volumeCbm: number | null
  freightType: string
  estimatedCost: number
  currency: string
  transitDays: number | null
  createdAt: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const IMAGE_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products")
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const MAX_IMAGE_BYTES = 10 * 1024 * 1024  // 10 MB

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function revalidateProducts() {
  revalidatePath("/admin/products")
  revalidatePath("/admin/products/[id]", "page")
  revalidatePath("/[locale]", "page")
  revalidatePath("/[locale]/products", "page")
}

function serializeProduct(p: any) {
  return {
    ...p,
    estimatedPrice: p.estimatedPrice !== null ? Number(p.estimatedPrice) : null,
    featuredUntil: p.featuredUntil instanceof Date ? p.featuredUntil.toISOString() : p.featuredUntil,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
    images: (p.images ?? []).map(serializeImage),
  }
}

function serializeImage(img: any) {
  return { ...img, createdAt: img.createdAt instanceof Date ? img.createdAt.toISOString() : img.createdAt }
}

function serializeShippingEstimate(s: any): SerializedShippingEstimate {
  return {
    ...s,
    weightKg: Number(s.weightKg),
    volumeCbm: s.volumeCbm !== null ? Number(s.volumeCbm) : null,
    estimatedCost: Number(s.estimatedCost),
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
  }
}

async function logAdminAction(opts: {
  action: string
  entity: string
  entityId?: string
  changes?: Prisma.InputJsonValue
}) {
  try {
    const adminId = await requireAdmin()
    await prisma.auditLog.create({
      data: { adminId, ...opts, changes: opts.changes ?? Prisma.JsonNull },
    })
  } catch { /* non-fatal */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// Base includes
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Base includes
// ─────────────────────────────────────────────────────────────────────────────

// NOTE: Do NOT use `as const` here — Prisma requires mutable (non-readonly) arrays
// for orderBy. Using `satisfies` keeps IDE autocompletion without readonly narrowing.

const productInclude = {
  images: {
    orderBy: [
      { isPrimary: "desc" as Prisma.SortOrder },
      { sortOrder: "asc" as Prisma.SortOrder },
    ],
  },
  addedBy: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
  _count: { select: { relatedRequests: true, images: true } },
} satisfies Prisma.TrendingProductInclude

// Detail include is defined separately (not via spread) so TypeScript infers
// `relatedRequests` on the query result type correctly.
const productDetailInclude = {
  images: {
    orderBy: [
      { isPrimary: "desc" as Prisma.SortOrder },
      { sortOrder: "asc" as Prisma.SortOrder },
    ],
  },
  addedBy: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
  _count: { select: { relatedRequests: true, images: true } },
  relatedRequests: {
    include: {
      request: {
        select: {
          id: true, description: true, status: true, quantity: true,
          shippingCountry: true, createdAt: true,
          quotes: {
            where: { isDeleted: false },
            select: { id: true, price: true, status: true },
            orderBy: { revision: "desc" as Prisma.SortOrder },
            take: 1,
          },
        },
      },
      user: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: "desc" as Prisma.SortOrder },
    take: 20,
  },
} satisfies Prisma.TrendingProductInclude

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION A: READ ──────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// A1. GET ALL PRODUCTS (paginated, filtered)
// ─────────────────────────────────────────────────────────────────────────────

const listProductsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().default(""),
  category: z.string().default(""),
  status: z.enum(["all", "active", "inactive", "deleted", "featured"]).default("all"),
  sortBy: z.enum(["createdAt", "updatedAt", "trendScore", "viewCount", "inquiryCount", "name", "estimatedPrice"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  tags: z.array(z.string()).default([]),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  sourceCountry: z.string().optional(),
})

export async function getAllProducts(raw: z.infer<typeof listProductsSchema> = {} as any) {
  try {
    await requireAdmin()
    const { page, limit, search, category, status, sortBy, sortOrder, tags, priceMin, priceMax, sourceCountry } = listProductsSchema.parse(raw)

    const skip = (page - 1) * limit
    const where: Prisma.TrendingProductWhereInput = {}

    // Visibility filter
    if (status === "active") { where.isActive = true; where.isDeleted = false }
    else if (status === "inactive") { where.isActive = false; where.isDeleted = false }
    else if (status === "deleted") { where.isDeleted = true }
    else if (status === "featured") { where.isFeatured = true; where.isDeleted = false }
    else { where.isDeleted = false }

    if (category) where.category = category
    if (sourceCountry) where.sourceCountry = sourceCountry

    if (tags.length > 0) {
      where.tags = { hasSome: tags }
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      where.estimatedPrice = {
        ...(priceMin !== undefined && { gte: priceMin }),
        ...(priceMax !== undefined && { lte: priceMax }),
      }
    }

    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { nameAr: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { supplier: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { categoryAr: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ]
    }

    const [products, total] = await Promise.all([
      prisma.trendingProduct.findMany({
        where,
        include: productInclude,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.trendingProduct.count({ where }),
    ])

    return {
      success: true,
      data: {
        products: products.map(serializeProduct),
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    }
  } catch (err) {
    console.error("[getAllProducts]", err)
    return { success: false, error: "Failed to fetch products" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A2. GET SINGLE PRODUCT (with shipping data)
// ─────────────────────────────────────────────────────────────────────────────

export async function getProductById(id: string) {
  try {
    await requireAdmin()

    const product = await prisma.trendingProduct.findUnique({
      where: { id },
      include: productDetailInclude,
    })
    if (!product) return { success: false, error: "Product not found" }

    // Fetch shipping estimates for the most common destination from this product's requests
    let shippingEstimates: SerializedShippingEstimate[] = []
    if (product.sourceCountry) {
      const estimates = await prisma.shippingEstimate.findMany({
        where: { originCountry: product.sourceCountry },
        orderBy: { createdAt: "desc" },
        take: 5,
        distinct: ["destinationCountry", "freightType"],
      })
      shippingEstimates = estimates.map(serializeShippingEstimate)
    }

    return {
      success: true,
      data: {
        ...serializeProduct(product),
        shippingEstimates,
        relatedRequests: (product.relatedRequests ?? []).map((r: any) => ({
          ...r,
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
          request: r.request ? {
            ...r.request,
            createdAt: r.request.createdAt instanceof Date ? r.request.createdAt.toISOString() : r.request.createdAt,
            quotes: (r.request.quotes ?? []).map((q: any) => ({ ...q, price: Number(q.price) })),
          } : null,
        })),
      },
    }
  } catch (err) {
    console.error("[getProductById]", err)
    return { success: false, error: "Failed to fetch product" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A3. GET CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

export async function getProductCategories() {
  try {
    await requireAdmin()
    const results = await prisma.trendingProduct.findMany({
      where: { isDeleted: false },
      select: { category: true, categoryAr: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    })
    return {
      success: true,
      data: results.filter((r) => r.category).map((r) => ({ value: r.category!, labelAr: r.categoryAr })),
    }
  } catch (err) {
    console.error("[getProductCategories]", err)
    return { success: false, error: "Failed to fetch categories" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A4. GET ALL TAGS
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllProductTags() {
  try {
    await requireAdmin()
    const products = await prisma.trendingProduct.findMany({ where: { isDeleted: false }, select: { tags: true } })
    return {
      success: true,
      data: Array.from(new Set(products.flatMap((p) => p.tags))).sort(),
    }
  } catch (err) {
    console.error("[getAllProductTags]", err)
    return { success: false, error: "Failed to fetch tags" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A5. STATS
// ─────────────────────────────────────────────────────────────────────────────

export async function getProductStats(): Promise<ActionResult<{
  total: number
  active: number
  inactive: number
  featured: number
  totalViews: number
  totalInquiries: number
  recentProducts: any[]
  topByViews: any[]
  topByInquiries: any[]
  sourceCountries: { country: string; count: number }[]
  categoryBreakdown: { category: string; count: number }[]
  shippingCoverage: { destinationCountry: string; estimateCount: number }[]
}>> {
  try {
    await requireAdmin()

    const [
      total, active, featured, viewsAgg, inquiriesAgg,
      recentProducts, topByViews, topByInquiries,
      sourceCountryGroups, categoryGroups, shippingCoverage,
    ] = await Promise.all([
      prisma.trendingProduct.count({ where: { isDeleted: false } }),
      prisma.trendingProduct.count({ where: { isActive: true, isDeleted: false } }),
      prisma.trendingProduct.count({ where: { isFeatured: true, isDeleted: false } }),
      prisma.trendingProduct.aggregate({ where: { isDeleted: false }, _sum: { viewCount: true } }),
      prisma.trendingProduct.aggregate({ where: { isDeleted: false }, _sum: { inquiryCount: true } }),
      prisma.trendingProduct.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, nameAr: true, trendScore: true, viewCount: true, inquiryCount: true, isFeatured: true, isActive: true, createdAt: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } },
      }),
      prisma.trendingProduct.findMany({ where: { isDeleted: false }, select: { id: true, name: true, viewCount: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } }, orderBy: { viewCount: "desc" }, take: 5 }),
      prisma.trendingProduct.findMany({ where: { isDeleted: false }, select: { id: true, name: true, inquiryCount: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } }, orderBy: { inquiryCount: "desc" }, take: 5 }),
      prisma.trendingProduct.groupBy({ by: ["sourceCountry"], where: { isDeleted: false, sourceCountry: { not: null } }, _count: true, orderBy: { _count: { sourceCountry: "desc" } }, take: 5 }),
      prisma.trendingProduct.groupBy({ by: ["category"], where: { isDeleted: false, category: { not: null } }, _count: true, orderBy: { _count: { category: "desc" } }, take: 10 }),
      prisma.shippingEstimate.groupBy({ by: ["destinationCountry"], _count: true, orderBy: { _count: { destinationCountry: "desc" } }, take: 10 }),
    ])

    const serialize = (p: any) => ({ ...p, createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt })

    return {
      success: true,
      data: {
        total,
        active,
        inactive: total - active,
        featured,
        totalViews: viewsAgg._sum.viewCount ?? 0,
        totalInquiries: inquiriesAgg._sum.inquiryCount ?? 0,
        recentProducts: recentProducts.map(serialize),
        topByViews: topByViews.map(serialize),
        topByInquiries: topByInquiries.map(serialize),
        sourceCountries: sourceCountryGroups.map((r) => ({ country: r.sourceCountry!, count: r._count })),
        categoryBreakdown: categoryGroups.map((r) => ({ category: r.category!, count: r._count })),
        shippingCoverage: shippingCoverage.map((r) => ({ destinationCountry: r.destinationCountry, estimateCount: r._count })),
      },
    }
  } catch (err) {
    console.error("[getProductStats]", err)
    return { success: false, error: "Failed to fetch stats" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A6. GET TOP PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getTopProducts(
  metric: "viewCount" | "inquiryCount" | "trendScore" = "trendScore",
  limit = 10,
) {
  try {
    await requireAdmin()
    const products = await prisma.trendingProduct.findMany({
      where: { isActive: true, isDeleted: false },
      select: {
        id: true, name: true, nameAr: true,
        trendScore: true, viewCount: true, inquiryCount: true,
        category: true, isFeatured: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
      orderBy: { [metric]: "desc" },
      take: limit,
    })
    return { success: true, data: products }
  } catch (err) {
    console.error("[getTopProducts]", err)
    return { success: false, error: "Failed to fetch top products" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION B: CREATE & UPDATE ───────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// B1. CREATE PRODUCT
// ─────────────────────────────────────────────────────────────────────────────

export async function createProduct(input: CreateProductInput) {
  try {
    const adminId = await requireAdmin()
    if (!input.name?.trim()) return { success: false, error: "Product name is required" }

    const created = await prisma.trendingProduct.create({
      data: {
        name: input.name.trim(),
        nameAr: input.nameAr?.trim(),
        description: input.description?.trim(),
        descriptionAr: input.descriptionAr?.trim(),
        shortDesc: input.shortDesc?.trim(),
        shortDescAr: input.shortDescAr?.trim(),
        estimatedPrice: input.estimatedPrice ?? null,
        currency: input.currency ?? "USD",
        sourceCountry: input.sourceCountry ?? "CN",
        sourceUrl: input.sourceUrl?.trim(),
        supplier: input.supplier?.trim(),
        category: input.category?.trim(),
        categoryAr: input.categoryAr?.trim(),
        tags: input.tags ?? [],
        trendScore: input.trendScore ?? 0,
        isFeatured: input.isFeatured ?? false,
        featuredUntil: input.featuredUntil ? new Date(input.featuredUntil) : null,
        addedById: adminId,
        images: input.images?.length
          ? {
            create: input.images.map((img, index) => ({
              url: img.url,
              isPrimary: img.isPrimary ?? index === 0,
              altText: img.altText?.trim(),
              sortOrder: img.sortOrder ?? index,
            })),
          }
          : undefined,
      },
      include: productInclude,
    })

    await logAdminAction({
      action: "CREATE_TRENDING_PRODUCT",
      entity: "TrendingProduct",
      entityId: created.id,
      changes: { name: created.name, category: created.category, trendScore: created.trendScore, imageCount: (created as any).images?.length ?? 0 },
    })

    revalidateProducts()
    return { success: true, data: serializeProduct(created) }
  } catch (err) {
    console.error("[createProduct]", err)
    return { success: false, error: "Failed to create product" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B2. UPDATE PRODUCT
// ─────────────────────────────────────────────────────────────────────────────

export async function updateProduct(id: string, input: UpdateProductInput) {
  try {
    await requireAdmin()

    const existing = await prisma.trendingProduct.findUnique({ where: { id }, select: { id: true, isDeleted: true } })
    if (!existing) return { success: false, error: "Product not found" }
    if (existing.isDeleted) return { success: false, error: "Cannot update a deleted product" }

    const updated = await prisma.trendingProduct.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.nameAr !== undefined && { nameAr: input.nameAr?.trim() }),
        ...(input.description !== undefined && { description: input.description?.trim() }),
        ...(input.descriptionAr !== undefined && { descriptionAr: input.descriptionAr?.trim() }),
        ...(input.shortDesc !== undefined && { shortDesc: input.shortDesc?.trim() }),
        ...(input.shortDescAr !== undefined && { shortDescAr: input.shortDescAr?.trim() }),
        ...(input.estimatedPrice !== undefined && { estimatedPrice: input.estimatedPrice }),
        ...(input.currency !== undefined && { currency: input.currency }),
        ...(input.sourceCountry !== undefined && { sourceCountry: input.sourceCountry }),
        ...(input.sourceUrl !== undefined && { sourceUrl: input.sourceUrl?.trim() }),
        ...(input.supplier !== undefined && { supplier: input.supplier?.trim() }),
        ...(input.category !== undefined && { category: input.category?.trim() }),
        ...(input.categoryAr !== undefined && { categoryAr: input.categoryAr?.trim() }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.trendScore !== undefined && { trendScore: input.trendScore }),
        ...(input.isFeatured !== undefined && { isFeatured: input.isFeatured }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.featuredUntil !== undefined && { featuredUntil: input.featuredUntil ? new Date(input.featuredUntil) : null }),
      },
      include: productInclude,
    })

    await logAdminAction({ action: "UPDATE_TRENDING_PRODUCT", entity: "TrendingProduct", entityId: id, changes: input as Prisma.InputJsonValue })
    revalidateProducts()
    return { success: true, data: serializeProduct(updated) }
  } catch (err) {
    console.error("[updateProduct]", err)
    return { success: false, error: "Failed to update product" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B3. TOGGLE ACTIVE
// ─────────────────────────────────────────────────────────────────────────────

export async function toggleProductActive(id: string): Promise<ActionResult<{ isActive: boolean }>> {
  try {
    await requireAdmin()
    const p = await prisma.trendingProduct.findUnique({ where: { id }, select: { id: true, isActive: true, isDeleted: true } })
    if (!p) return { success: false, error: "Product not found" }
    if (p.isDeleted) return { success: false, error: "Cannot toggle a deleted product" }

    const updated = await prisma.trendingProduct.update({ where: { id }, data: { isActive: !p.isActive } })
    await logAdminAction({ action: p.isActive ? "DEACTIVATE_PRODUCT" : "ACTIVATE_PRODUCT", entity: "TrendingProduct", entityId: id, changes: { isActive: !p.isActive } })
    revalidateProducts()
    return { success: true, data: { isActive: updated.isActive } }
  } catch (err) {
    console.error("[toggleProductActive]", err)
    return { success: false, error: "Failed to toggle product" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B4. TOGGLE FEATURED
// ─────────────────────────────────────────────────────────────────────────────

export async function toggleProductFeatured(
  id: string,
  featuredUntil?: Date | string,
): Promise<ActionResult<{ isFeatured: boolean }>> {
  try {
    await requireAdmin()
    const p = await prisma.trendingProduct.findUnique({ where: { id }, select: { id: true, isFeatured: true, isDeleted: true } })
    if (!p) return { success: false, error: "Product not found" }
    if (p.isDeleted) return { success: false, error: "Cannot toggle a deleted product" }

    const updated = await prisma.trendingProduct.update({
      where: { id },
      data: {
        isFeatured: !p.isFeatured,
        featuredUntil: !p.isFeatured && featuredUntil ? new Date(featuredUntil) : null,
      },
    })
    await logAdminAction({ action: p.isFeatured ? "UNFEATURE_PRODUCT" : "FEATURE_PRODUCT", entity: "TrendingProduct", entityId: id, changes: { isFeatured: !p.isFeatured } })
    revalidateProducts()
    return { success: true, data: { isFeatured: updated.isFeatured } }
  } catch (err) {
    console.error("[toggleProductFeatured]", err)
    return { success: false, error: "Failed to toggle featured status" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B5. UPDATE TREND SCORE
// ─────────────────────────────────────────────────────────────────────────────

export async function updateTrendScore(id: string, trendScore: number): Promise<ActionResult<{ trendScore: number }>> {
  try {
    await requireAdmin()
    if (trendScore < 0 || trendScore > 100) return { success: false, error: "Trend score must be 0–100" }

    await prisma.trendingProduct.update({ where: { id }, data: { trendScore } })
    await logAdminAction({ action: "UPDATE_TREND_SCORE", entity: "TrendingProduct", entityId: id, changes: { trendScore } })
    revalidateProducts()
    return { success: true, data: { trendScore } }
  } catch (err) {
    console.error("[updateTrendScore]", err)
    return { success: false, error: "Failed to update trend score" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B6. SOFT DELETE
// ─────────────────────────────────────────────────────────────────────────────

export async function softDeleteProduct(id: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await requireAdmin()
    const p = await prisma.trendingProduct.findUnique({ where: { id }, select: { id: true, name: true, isDeleted: true } })
    if (!p) return { success: false, error: "Product not found" }
    if (p.isDeleted) return { success: false, error: "Product is already deleted" }

    await prisma.trendingProduct.update({ where: { id }, data: { isDeleted: true, isActive: false } })
    await logAdminAction({ action: "DELETE_PRODUCT", entity: "TrendingProduct", entityId: id, changes: { name: p.name } })
    revalidateProducts()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[softDeleteProduct]", err)
    return { success: false, error: "Failed to delete product" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B7. RESTORE
// ─────────────────────────────────────────────────────────────────────────────

export async function restoreProduct(id: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await requireAdmin()
    const p = await prisma.trendingProduct.findUnique({ where: { id }, select: { id: true, isDeleted: true } })
    if (!p) return { success: false, error: "Product not found" }
    if (!p.isDeleted) return { success: false, error: "Product is not deleted" }

    await prisma.trendingProduct.update({ where: { id }, data: { isDeleted: false, isActive: true } })
    await logAdminAction({ action: "RESTORE_PRODUCT", entity: "TrendingProduct", entityId: id })
    revalidateProducts()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[restoreProduct]", err)
    return { success: false, error: "Failed to restore product" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B8. HARD DELETE
// ─────────────────────────────────────────────────────────────────────────────

export async function hardDeleteProduct(id: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await requireAdmin()
    const p = await prisma.trendingProduct.findUnique({ where: { id }, select: { id: true, name: true } })
    if (!p) return { success: false, error: "Product not found" }

    await prisma.trendingProduct.delete({ where: { id } })
    await logAdminAction({ action: "HARD_DELETE_PRODUCT", entity: "TrendingProduct", entityId: id, changes: { name: p.name } })
    revalidateProducts()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[hardDeleteProduct]", err)
    return { success: false, error: "Failed to permanently delete product" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B9. BULK OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function bulkProductAction(
  ids: string[],
  action: BulkAction,
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAdmin()
    if (!ids.length) return { success: false, error: "No products selected" }

    const updateData: Prisma.TrendingProductUpdateManyMutationInput = (() => {
      switch (action) {
        case "activate": return { isActive: true, isDeleted: false }
        case "deactivate": return { isActive: false }
        case "feature": return { isFeatured: true }
        case "unfeature": return { isFeatured: false, featuredUntil: null }
        case "delete": return { isDeleted: true, isActive: false }
        case "restore": return { isDeleted: false, isActive: true }
        default: throw new Error(`Unknown action: ${action}`)
      }
    })()

    const result = await prisma.trendingProduct.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    })

    await logAdminAction({ action: `BULK_${action.toUpperCase()}_PRODUCTS`, entity: "TrendingProduct", changes: { ids, count: result.count } })
    revalidateProducts()
    return { success: true, data: { count: result.count } }
  } catch (err) {
    console.error("[bulkProductAction]", err)
    return { success: false, error: "Bulk operation failed" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION C: IMAGE MANAGEMENT ──────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// C1. UPLOAD IMAGE FROM FILE (disk storage)
// ─────────────────────────────────────────────────────────────────────────────

export async function uploadProductImage(
  productId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string; url: string; isPrimary: boolean }>> {
  try {
    await requireAdmin()
    const file = formData.get("file") as File | null
    if (!file) return { success: false, error: "No file provided" }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) return { success: false, error: "Only JPEG, PNG, WebP or GIF allowed" }
    if (file.size > MAX_IMAGE_BYTES) return { success: false, error: "Image must be under 10 MB" }

    const p = await prisma.trendingProduct.findUnique({ where: { id: productId }, select: { id: true, isDeleted: true } })
    if (!p) return { success: false, error: "Product not found" }
    if (p.isDeleted) return { success: false, error: "Cannot add image to deleted product" }

    if (!existsSync(IMAGE_UPLOAD_DIR)) await mkdir(IMAGE_UPLOAD_DIR, { recursive: true })

    const ext = file.name.split(".").pop() ?? "jpg"
    const filename = `${productId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const fullPath = path.join(IMAGE_UPLOAD_DIR, filename)
    await writeFile(fullPath, Buffer.from(await file.arrayBuffer()))

    const url = `/uploads/products/${filename}`
    const existingCount = await prisma.trendingProductImage.count({ where: { productId } })
    const isPrimary = existingCount === 0

    if (isPrimary) {
      await prisma.trendingProductImage.updateMany({ where: { productId }, data: { isPrimary: false } })
    }

    const image = await prisma.trendingProductImage.create({
      data: {
        productId,
        url,
        altText: (formData.get("altText") as string) || null,
        isPrimary,
        sortOrder: existingCount,
      },
    })

    await logAdminAction({ action: "UPLOAD_PRODUCT_IMAGE", entity: "TrendingProduct", entityId: productId, changes: { imageId: image.id, url } })
    revalidateProducts()
    return { success: true, data: { id: image.id, url, isPrimary } }
  } catch (err) {
    console.error("[uploadProductImage]", err)
    return { success: false, error: "Failed to upload image" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C2. ADD IMAGE BY URL (for external URLs — Alibaba, 1688, etc.)
// ─────────────────────────────────────────────────────────────────────────────

export async function addProductImageByUrl(
  productId: string,
  image: { url: string; isPrimary?: boolean; altText?: string; sortOrder?: number },
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()

    const p = await prisma.trendingProduct.findUnique({ where: { id: productId }, select: { id: true, isDeleted: true } })
    if (!p) return { success: false, error: "Product not found" }
    if (p.isDeleted) return { success: false, error: "Cannot add image to deleted product" }

    if (image.isPrimary) {
      await prisma.trendingProductImage.updateMany({ where: { productId }, data: { isPrimary: false } })
    }

    const lastImage = await prisma.trendingProductImage.findFirst({
      where: { productId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true },
    })

    const created = await prisma.trendingProductImage.create({
      data: {
        productId,
        url: image.url,
        isPrimary: image.isPrimary ?? false,
        altText: image.altText?.trim(),
        sortOrder: image.sortOrder ?? (lastImage?.sortOrder ?? -1) + 1,
      },
    })

    await logAdminAction({ action: "ADD_PRODUCT_IMAGE_URL", entity: "TrendingProduct", entityId: productId, changes: { imageId: created.id, url: image.url } })
    revalidateProducts()
    return { success: true, data: { id: created.id } }
  } catch (err) {
    console.error("[addProductImageByUrl]", err)
    return { success: false, error: "Failed to add image" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C3. ADD MULTIPLE IMAGES BY URL (batch)
// ─────────────────────────────────────────────────────────────────────────────

export async function addProductImagesBatch(
  productId: string,
  images: { url: string; isPrimary?: boolean; altText?: string }[],
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAdmin()
    if (!images.length) return { success: false, error: "No images provided" }

    const p = await prisma.trendingProduct.findUnique({ where: { id: productId }, select: { id: true, isDeleted: true } })
    if (!p) return { success: false, error: "Product not found" }
    if (p.isDeleted) return { success: false, error: "Cannot add images to deleted product" }

    if (images.some((img) => img.isPrimary)) {
      await prisma.trendingProductImage.updateMany({ where: { productId }, data: { isPrimary: false } })
    }

    const lastImage = await prisma.trendingProductImage.findFirst({ where: { productId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } })
    const startOrder = (lastImage?.sortOrder ?? -1) + 1

    const result = await prisma.trendingProductImage.createMany({
      data: images.map((img, index) => ({
        productId,
        url: img.url,
        isPrimary: img.isPrimary ?? false,
        altText: img.altText?.trim(),
        sortOrder: startOrder + index,
      })),
    })

    await logAdminAction({ action: "BATCH_ADD_PRODUCT_IMAGES", entity: "TrendingProduct", entityId: productId, changes: { count: result.count } })
    revalidateProducts()
    return { success: true, data: { count: result.count } }
  } catch (err) {
    console.error("[addProductImagesBatch]", err)
    return { success: false, error: "Failed to add images" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C4. SET PRIMARY IMAGE
// ─────────────────────────────────────────────────────────────────────────────

export async function setPrimaryImage(productId: string, imageId: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await requireAdmin()
    const image = await prisma.trendingProductImage.findFirst({ where: { id: imageId, productId } })
    if (!image) return { success: false, error: "Image not found on this product" }

    await prisma.$transaction([
      prisma.trendingProductImage.updateMany({ where: { productId }, data: { isPrimary: false } }),
      prisma.trendingProductImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
    ])

    await logAdminAction({ action: "SET_PRIMARY_IMAGE", entity: "TrendingProduct", entityId: productId, changes: { imageId } })
    revalidateProducts()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[setPrimaryImage]", err)
    return { success: false, error: "Failed to set primary image" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C5. REORDER IMAGES
// ─────────────────────────────────────────────────────────────────────────────

export async function reorderProductImages(productId: string, imageIds: string[]): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await requireAdmin()
    await prisma.$transaction(
      imageIds.map((imageId, index) =>
        prisma.trendingProductImage.updateMany({ where: { id: imageId, productId }, data: { sortOrder: index } })
      )
    )
    await logAdminAction({ action: "REORDER_PRODUCT_IMAGES", entity: "TrendingProduct", entityId: productId, changes: { imageIds } })
    revalidateProducts()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[reorderProductImages]", err)
    return { success: false, error: "Failed to reorder images" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C6. UPDATE ALT TEXT
// ─────────────────────────────────────────────────────────────────────────────

export async function updateImageAltText(imageId: string, altText: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await requireAdmin()
    await prisma.trendingProductImage.update({ where: { id: imageId }, data: { altText: altText.trim() } })
    revalidateProducts()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[updateImageAltText]", err)
    return { success: false, error: "Failed to update alt text" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C7. DELETE IMAGE
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteProductImage(productId: string, imageId: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await requireAdmin()
    const image = await prisma.trendingProductImage.findFirst({ where: { id: imageId, productId }, select: { id: true, isPrimary: true, url: true } })
    if (!image) return { success: false, error: "Image not found on this product" }

    // Remove from disk if local
    if (image.url.startsWith("/uploads/")) {
      const diskPath = path.join(process.cwd(), "public", image.url)
      try { await unlink(diskPath) } catch { /* already gone */ }
    }

    await prisma.trendingProductImage.delete({ where: { id: imageId } })

    if (image.isPrimary) {
      const next = await prisma.trendingProductImage.findFirst({ where: { productId }, orderBy: { sortOrder: "asc" } })
      if (next) await prisma.trendingProductImage.update({ where: { id: next.id }, data: { isPrimary: true } })
    }

    await logAdminAction({ action: "DELETE_PRODUCT_IMAGE", entity: "TrendingProduct", entityId: productId, changes: { imageId } })
    revalidateProducts()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[deleteProductImage]", err)
    return { success: false, error: "Failed to delete image" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION D: TAGS ──────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export async function addProductTags(id: string, newTags: string[]): Promise<ActionResult<{ tags: string[] }>> {
  try {
    await requireAdmin()
    const p = await prisma.trendingProduct.findUnique({ where: { id }, select: { id: true, tags: true, isDeleted: true } })
    if (!p) return { success: false, error: "Product not found" }
    if (p.isDeleted) return { success: false, error: "Cannot update deleted product" }

    const merged = Array.from(new Set([...p.tags, ...newTags.map((t) => t.trim().toLowerCase()).filter(Boolean)]))
    const updated = await prisma.trendingProduct.update({ where: { id }, data: { tags: merged } })
    revalidateProducts()
    return { success: true, data: { tags: updated.tags } }
  } catch (err) {
    console.error("[addProductTags]", err)
    return { success: false, error: "Failed to add tags" }
  }
}

export async function removeProductTag(id: string, tag: string): Promise<ActionResult<{ tags: string[] }>> {
  try {
    await requireAdmin()
    const p = await prisma.trendingProduct.findUnique({ where: { id }, select: { id: true, tags: true, isDeleted: true } })
    if (!p) return { success: false, error: "Product not found" }
    if (p.isDeleted) return { success: false, error: "Cannot update deleted product" }

    const updated = await prisma.trendingProduct.update({ where: { id }, data: { tags: p.tags.filter((t) => t !== tag) } })
    revalidateProducts()
    return { success: true, data: { tags: updated.tags } }
  } catch (err) {
    console.error("[removeProductTag]", err)
    return { success: false, error: "Failed to remove tag" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION E: SHIPPING ESTIMATES (linked to products) ──────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// E1. GET SHIPPING ESTIMATES FOR PRODUCT'S SOURCE COUNTRY
//     Returns current estimates from the product's sourceCountry to all
//     destination countries — shown in the product detail admin view.
// ─────────────────────────────────────────────────────────────────────────────

export async function getProductShippingEstimates(
  productId: string,
): Promise<ActionResult<{
  byRoute: SerializedShippingEstimate[]
  avgCostAir: number
  avgCostSea: number
}>> {
  try {
    await requireAdmin()

    const product = await prisma.trendingProduct.findUnique({
      where: { id: productId },
      select: { sourceCountry: true },
    })
    if (!product) return { success: false, error: "Product not found" }

    const [estimates, airAgg, seaAgg] = await Promise.all([
      prisma.shippingEstimate.findMany({
        where: { originCountry: product.sourceCountry ?? "CN" },
        orderBy: { createdAt: "desc" },
        take: 20,
        distinct: ["destinationCountry", "freightType"],
      }),
      prisma.shippingEstimate.aggregate({
        where: { originCountry: product.sourceCountry ?? "CN", freightType: "air" },
        _avg: { estimatedCost: true },
      }),
      prisma.shippingEstimate.aggregate({
        where: { originCountry: product.sourceCountry ?? "CN", freightType: "sea" },
        _avg: { estimatedCost: true },
      }),
    ])

    return {
      success: true,
      data: {
        byRoute: estimates.map(serializeShippingEstimate),
        avgCostAir: Number(airAgg._avg.estimatedCost ?? 0),
        avgCostSea: Number(seaAgg._avg.estimatedCost ?? 0),
      },
    }
  } catch (err) {
    console.error("[getProductShippingEstimates]", err)
    return { success: false, error: "Failed to fetch shipping estimates" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// E2. CREATE SHIPPING ESTIMATE LINKED TO PRODUCT SOURCE COUNTRY
// ─────────────────────────────────────────────────────────────────────────────

const createShippingForProductSchema = z.object({
  productId: z.string().min(1),
  destinationCountry: z.string().min(2),
  weightKg: z.number().positive(),
  volumeCbm: z.number().positive().optional(),
  freightType: z.enum(["air", "sea"]),
  estimatedCost: z.number().nonnegative(),
  currency: z.string().default("USD"),
  transitDays: z.number().int().positive().optional(),
})

export async function createShippingEstimateForProduct(
  raw: z.infer<typeof createShippingForProductSchema>
): Promise<ActionResult<SerializedShippingEstimate>> {
  try {
    const adminId = await requireAdmin()
    const data = createShippingForProductSchema.parse(raw)

    const product = await prisma.trendingProduct.findUnique({
      where: { id: data.productId },
      select: { sourceCountry: true },
    })
    if (!product) return { success: false, error: "Product not found" }

    const { productId, ...estimateData } = data
    const estimate = await prisma.shippingEstimate.create({
      data: {
        ...estimateData,
        originCountry: product.sourceCountry ?? "CN",
      },
    })

    await prisma.auditLog.create({
      data: {
        adminId,
        action: "CREATE_SHIPPING_FOR_PRODUCT",
        entity: "ShippingEstimate",
        entityId: estimate.id,
        changes: { productId, ...estimateData } satisfies Prisma.InputJsonValue,
      },
    })

    revalidateProducts()
    return { success: true, data: serializeShippingEstimate(estimate) }
  } catch (err) {
    console.error("[createShippingEstimateForProduct]", err)
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    return { success: false, error: "Failed to create shipping estimate" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// E3. GET SHIPPING COST SUGGESTION
//     Given a product + destination country + quantity, returns a shipping
//     cost suggestion using the most recent relevant estimate.
// ─────────────────────────────────────────────────────────────────────────────

export async function getShippingCostSuggestion(
  productId: string,
  destinationCountry: string,
  quantityKg: number,
  freightType: "air" | "sea" = "sea",
): Promise<ActionResult<{
  estimatedCost: number
  currency: string
  transitDays: number | null
  perKgRate: number
  note: string
}>> {
  try {
    await requireAdmin()

    const product = await prisma.trendingProduct.findUnique({
      where: { id: productId },
      select: { sourceCountry: true, estimatedPrice: true },
    })
    if (!product) return { success: false, error: "Product not found" }

    const estimate = await prisma.shippingEstimate.findFirst({
      where: {
        originCountry: product.sourceCountry ?? "CN",
        destinationCountry,
        freightType,
      },
      orderBy: { createdAt: "desc" },
    })

    if (!estimate) {
      return { success: false, error: `No shipping estimate found for ${product.sourceCountry ?? "CN"} → ${destinationCountry} (${freightType})` }
    }

    const baseWeight = Number(estimate.weightKg)
    const baseCost = Number(estimate.estimatedCost)
    const perKgRate = baseCost / Math.max(baseWeight, 1)
    const scaledCost = Math.round(perKgRate * quantityKg * 100) / 100

    return {
      success: true,
      data: {
        estimatedCost: scaledCost,
        currency: estimate.currency,
        transitDays: estimate.transitDays,
        perKgRate: Math.round(perKgRate * 100) / 100,
        note: `Scaled from base estimate of $${baseCost} for ${baseWeight}kg. Actual rate may vary.`,
      },
    }
  } catch (err) {
    console.error("[getShippingCostSuggestion]", err)
    return { success: false, error: "Failed to calculate shipping suggestion" }
  }
}