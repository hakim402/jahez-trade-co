"use server"

// app/[locale]/admin/(routes)/products/actions.ts
// ⚠️  ADMIN ONLY — every function calls requireAdmin() as its first line.
//     For public data, import from ./public-actions.ts

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-guard"
import { logAdminAction } from "@/lib/audit"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

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

export type BulkAction =
  | "activate"
  | "deactivate"
  | "feature"
  | "unfeature"
  | "delete"
  | "restore"

export type ProductWithImages = Awaited<ReturnType<typeof getProductById>>

// ─────────────────────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────────────────────

function revalidateProducts() {
  revalidatePath("/admin/products")
  revalidatePath("/admin/products/[id]", "page")
  revalidatePath("/[locale]", "page")
  revalidatePath("/[locale]/dashboard", "page")
  revalidatePath("/[locale]/products", "page")
  revalidatePath("/[locale]/products/[id]", "page")
}

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllProducts({
  page = 1,
  limit = 20,
  search = "",
  category = "",
  status = "all",
  sortBy = "createdAt",
  sortOrder = "desc",
}: {
  page?: number
  limit?: number
  search?: string
  category?: string
  status?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
} = {}) {
  await requireAdmin()

  const skip = (page - 1) * limit
  const where: any = {}

  if (status === "active")        { where.isActive = true;  where.isDeleted = false }
  else if (status === "inactive") { where.isActive = false; where.isDeleted = false }
  else if (status === "deleted")  { where.isDeleted = true }
  else if (status === "featured") { where.isFeatured = true; where.isDeleted = false }
  else                            { where.isDeleted = false }

  if (category) where.category = category

  if (search.trim()) {
    where.OR = [
      { name:        { contains: search, mode: "insensitive" } },
      { nameAr:      { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { supplier:    { contains: search, mode: "insensitive" } },
      { category:    { contains: search, mode: "insensitive" } },
    ]
  }

  const allowedSortFields = [
    "createdAt", "updatedAt", "trendScore",
    "viewCount", "inquiryCount", "name", "estimatedPrice",
  ]
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt"

  const [products, total] = await Promise.all([
    prisma.trendingProduct.findMany({
      where,
      include: {
        images:  { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        addedBy: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        _count:  { select: { relatedRequests: true } },
      },
      orderBy: { [safeSortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.trendingProduct.count({ where }),
  ])

  return {
    products,
    total,
    page,
    limit,
    pages:   Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  }
}

export async function getProductById(id: string) {
  await requireAdmin()

  const product = await prisma.trendingProduct.findUnique({
    where: { id },
    include: {
      images:  { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      addedBy: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      relatedRequests: {
        include: {
          request: { select: { id: true, description: true, status: true, createdAt: true } },
          user:    { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: { select: { relatedRequests: true, images: true } },
    },
  })

  if (!product) throw new Error("Product not found")
  return product
}

export async function getProductCategories() {
  await requireAdmin()

  const results = await prisma.trendingProduct.findMany({
    where:    { isDeleted: false },
    select:   { category: true, categoryAr: true },
    distinct: ["category"],
    orderBy:  { category: "asc" },
  })

  return results
    .filter((r) => r.category)
    .map((r) => ({ value: r.category!, labelAr: r.categoryAr }))
}

export async function getProductStats() {
  await requireAdmin()

  const [total, active, featured, totalViews, totalInquiries, recentProducts] =
    await Promise.all([
      prisma.trendingProduct.count({ where: { isDeleted: false } }),
      prisma.trendingProduct.count({ where: { isActive: true,   isDeleted: false } }),
      prisma.trendingProduct.count({ where: { isFeatured: true, isDeleted: false } }),
      prisma.trendingProduct.aggregate({ where: { isDeleted: false }, _sum: { viewCount: true } }),
      prisma.trendingProduct.aggregate({ where: { isDeleted: false }, _sum: { inquiryCount: true } }),
      prisma.trendingProduct.findMany({
        where:   { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true, name: true, nameAr: true,
          trendScore: true, viewCount: true, inquiryCount: true,
          isFeatured: true, isActive: true, createdAt: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      }),
    ])

  return {
    total,
    active,
    inactive:       total - active,
    featured,
    totalViews:     totalViews._sum.viewCount      ?? 0,
    totalInquiries: totalInquiries._sum.inquiryCount ?? 0,
    recentProducts,
  }
}

export async function getTopProducts(
  metric: "viewCount" | "inquiryCount" | "trendScore" = "trendScore",
  limit = 10
) {
  await requireAdmin()

  return prisma.trendingProduct.findMany({
    where:  { isActive: true, isDeleted: false },
    select: {
      id: true, name: true, nameAr: true,
      trendScore: true, viewCount: true, inquiryCount: true,
      category: true, isFeatured: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
    orderBy: { [metric]: "desc" },
    take: limit,
  })
}

export async function getAllProductTags() {
  await requireAdmin()

  const products = await prisma.trendingProduct.findMany({
    where:  { isDeleted: false },
    select: { tags: true },
  })

  return Array.from(new Set(products.flatMap((p) => p.tags))).sort()
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

export async function createProduct(input: CreateProductInput) {
  const adminId = await requireAdmin()

  if (!input.name?.trim()) throw new Error("Product name is required")

  const created = await prisma.trendingProduct.create({
    data: {
      name:           input.name.trim(),
      nameAr:         input.nameAr?.trim(),
      description:    input.description?.trim(),
      descriptionAr:  input.descriptionAr?.trim(),
      shortDesc:      input.shortDesc?.trim(),
      shortDescAr:    input.shortDescAr?.trim(),
      estimatedPrice: input.estimatedPrice ?? null,
      currency:       input.currency      ?? "USD",
      sourceCountry:  input.sourceCountry ?? "CN",
      sourceUrl:      input.sourceUrl?.trim(),
      supplier:       input.supplier?.trim(),
      category:       input.category?.trim(),
      categoryAr:     input.categoryAr?.trim(),
      tags:           input.tags ?? [],
      trendScore:     input.trendScore  ?? 0,
      isFeatured:     input.isFeatured  ?? false,
      featuredUntil:  input.featuredUntil ? new Date(input.featuredUntil) : null,
      addedById: adminId,
      images: input.images?.length
        ? {
            create: input.images.map((img, index) => ({
              url:       img.url,
              isPrimary: img.isPrimary ?? index === 0,
              altText:   img.altText?.trim(),
              sortOrder: img.sortOrder ?? index,
            })),
          }
        : undefined,
    },
  })

  // Re-fetch with includes for fully-typed return
  const product = await prisma.trendingProduct.findUniqueOrThrow({
    where:   { id: created.id },
    include: {
      images:  true,
      addedBy: { select: { id: true, fullName: true } },
    },
  })

  await logAdminAction({
    action:   "CREATE_TRENDING_PRODUCT",
    entity:   "TrendingProduct",
    entityId: product.id,
    changes:  {
      name:       product.name,
      category:   product.category,
      trendScore: product.trendScore,
      imageCount: product.images.length,
    },
  })

  revalidateProducts()
  return product
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

export async function updateProduct(id: string, input: UpdateProductInput) {
  await requireAdmin()

  const existing = await prisma.trendingProduct.findUnique({
    where: { id }, select: { id: true, isDeleted: true },
  })
  if (!existing)          throw new Error("Product not found")
  if (existing.isDeleted) throw new Error("Cannot update a deleted product")

  const updated = await prisma.trendingProduct.update({
    where: { id },
    data: {
      ...(input.name          !== undefined && { name:          input.name.trim() }),
      ...(input.nameAr        !== undefined && { nameAr:        input.nameAr?.trim() }),
      ...(input.description   !== undefined && { description:   input.description?.trim() }),
      ...(input.descriptionAr !== undefined && { descriptionAr: input.descriptionAr?.trim() }),
      ...(input.shortDesc     !== undefined && { shortDesc:     input.shortDesc?.trim() }),
      ...(input.shortDescAr   !== undefined && { shortDescAr:   input.shortDescAr?.trim() }),
      ...(input.estimatedPrice !== undefined && { estimatedPrice: input.estimatedPrice }),
      ...(input.currency      !== undefined && { currency:      input.currency }),
      ...(input.sourceCountry !== undefined && { sourceCountry: input.sourceCountry }),
      ...(input.sourceUrl     !== undefined && { sourceUrl:     input.sourceUrl?.trim() }),
      ...(input.supplier      !== undefined && { supplier:      input.supplier?.trim() }),
      ...(input.category      !== undefined && { category:      input.category?.trim() }),
      ...(input.categoryAr    !== undefined && { categoryAr:    input.categoryAr?.trim() }),
      ...(input.tags          !== undefined && { tags:          input.tags }),
      ...(input.trendScore    !== undefined && { trendScore:    input.trendScore }),
      ...(input.isFeatured    !== undefined && { isFeatured:    input.isFeatured }),
      ...(input.featuredUntil !== undefined && {
        featuredUntil: input.featuredUntil ? new Date(input.featuredUntil) : null,
      }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
    include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
  })

  await logAdminAction({
    action: "UPDATE_TRENDING_PRODUCT", entity: "TrendingProduct", entityId: id, changes: input,
  })

  revalidateProducts()
  return updated
}

export async function toggleProductActive(id: string) {
  await requireAdmin()

  const product = await prisma.trendingProduct.findUnique({
    where: { id }, select: { id: true, isActive: true, isDeleted: true, name: true },
  })
  if (!product)          throw new Error("Product not found")
  if (product.isDeleted) throw new Error("Cannot toggle a deleted product")

  const updated = await prisma.trendingProduct.update({
    where: { id }, data: { isActive: !product.isActive },
  })

  await logAdminAction({
    action:   product.isActive ? "DEACTIVATE_TRENDING_PRODUCT" : "ACTIVATE_TRENDING_PRODUCT",
    entity:   "TrendingProduct",
    entityId: id,
    changes:  { isActive: !product.isActive },
  })

  revalidateProducts()
  return updated
}

export async function toggleProductFeatured(id: string, featuredUntil?: Date | string) {
  await requireAdmin()

  const product = await prisma.trendingProduct.findUnique({
    where: { id }, select: { id: true, isFeatured: true, isDeleted: true },
  })
  if (!product)          throw new Error("Product not found")
  if (product.isDeleted) throw new Error("Cannot toggle a deleted product")

  const updated = await prisma.trendingProduct.update({
    where: { id },
    data: {
      isFeatured:    !product.isFeatured,
      featuredUntil: !product.isFeatured && featuredUntil ? new Date(featuredUntil) : null,
    },
  })

  await logAdminAction({
    action:   product.isFeatured ? "UNFEATURE_TRENDING_PRODUCT" : "FEATURE_TRENDING_PRODUCT",
    entity:   "TrendingProduct",
    entityId: id,
    changes:  { isFeatured: !product.isFeatured, featuredUntil: featuredUntil ?? null },
  })

  revalidateProducts()
  return updated
}

export async function updateTrendScore(id: string, trendScore: number) {
  await requireAdmin()

  if (trendScore < 0 || trendScore > 100)
    throw new Error("Trend score must be between 0 and 100")

  const updated = await prisma.trendingProduct.update({
    where: { id }, data: { trendScore },
  })

  await logAdminAction({
    action: "UPDATE_TREND_SCORE", entity: "TrendingProduct", entityId: id, changes: { trendScore },
  })

  revalidateProducts()
  return updated
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function addProductImage(
  productId: string,
  image: { url: string; isPrimary?: boolean; altText?: string; sortOrder?: number }
) {
  await requireAdmin()

  const product = await prisma.trendingProduct.findUnique({
    where: { id: productId }, select: { id: true, isDeleted: true },
  })
  if (!product)          throw new Error("Product not found")
  if (product.isDeleted) throw new Error("Cannot add image to deleted product")

  if (image.isPrimary) {
    await prisma.trendingProductImage.updateMany({
      where: { productId }, data: { isPrimary: false },
    })
  }

  const lastImage = await prisma.trendingProductImage.findFirst({
    where: { productId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true },
  })

  const created = await prisma.trendingProductImage.create({
    data: {
      productId,
      url:       image.url,
      isPrimary: image.isPrimary ?? false,
      altText:   image.altText?.trim(),
      sortOrder: image.sortOrder ?? (lastImage?.sortOrder ?? -1) + 1,
    },
  })

  await logAdminAction({
    action: "ADD_PRODUCT_IMAGE", entity: "TrendingProduct",
    entityId: productId, changes: { imageId: created.id, url: image.url },
  })

  revalidateProducts()
  return created
}

export async function addProductImages(
  productId: string,
  images: { url: string; isPrimary?: boolean; altText?: string }[]
) {
  await requireAdmin()

  const product = await prisma.trendingProduct.findUnique({
    where: { id: productId }, select: { id: true, isDeleted: true },
  })
  if (!product)          throw new Error("Product not found")
  if (product.isDeleted) throw new Error("Cannot add images to deleted product")

  if (images.some((img) => img.isPrimary)) {
    await prisma.trendingProductImage.updateMany({
      where: { productId }, data: { isPrimary: false },
    })
  }

  const lastImage = await prisma.trendingProductImage.findFirst({
    where: { productId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true },
  })
  const startOrder = (lastImage?.sortOrder ?? -1) + 1

  const created = await prisma.trendingProductImage.createMany({
    data: images.map((img, index) => ({
      productId,
      url:       img.url,
      isPrimary: img.isPrimary ?? false,
      altText:   img.altText?.trim(),
      sortOrder: startOrder + index,
    })),
  })

  await logAdminAction({
    action: "ADD_PRODUCT_IMAGES", entity: "TrendingProduct",
    entityId: productId, changes: { count: images.length },
  })

  revalidateProducts()
  return created
}

export async function setPrimaryImage(productId: string, imageId: string) {
  await requireAdmin()

  const image = await prisma.trendingProductImage.findFirst({
    where: { id: imageId, productId },
  })
  if (!image) throw new Error("Image not found on this product")

  await prisma.$transaction([
    prisma.trendingProductImage.updateMany({ where: { productId }, data: { isPrimary: false } }),
    prisma.trendingProductImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ])

  await logAdminAction({
    action: "SET_PRIMARY_IMAGE", entity: "TrendingProduct",
    entityId: productId, changes: { imageId },
  })

  revalidateProducts()
}

export async function reorderProductImages(productId: string, imageIds: string[]) {
  await requireAdmin()

  await prisma.$transaction(
    imageIds.map((imageId, index) =>
      prisma.trendingProductImage.updateMany({
        where: { id: imageId, productId }, data: { sortOrder: index },
      })
    )
  )

  await logAdminAction({
    action: "REORDER_PRODUCT_IMAGES", entity: "TrendingProduct",
    entityId: productId, changes: { imageIds },
  })

  revalidateProducts()
}

export async function updateImageAltText(imageId: string, altText: string) {
  await requireAdmin()

  const updated = await prisma.trendingProductImage.update({
    where: { id: imageId }, data: { altText: altText.trim() },
  })

  revalidateProducts()
  return updated
}

export async function deleteProductImage(productId: string, imageId: string) {
  await requireAdmin()

  const image = await prisma.trendingProductImage.findFirst({
    where: { id: imageId, productId }, select: { id: true, isPrimary: true },
  })
  if (!image) throw new Error("Image not found on this product")

  await prisma.trendingProductImage.delete({ where: { id: imageId } })

  if (image.isPrimary) {
    const nextImage = await prisma.trendingProductImage.findFirst({
      where: { productId }, orderBy: { sortOrder: "asc" },
    })
    if (nextImage) {
      await prisma.trendingProductImage.update({
        where: { id: nextImage.id }, data: { isPrimary: true },
      })
    }
  }

  await logAdminAction({
    action: "DELETE_PRODUCT_IMAGE", entity: "TrendingProduct",
    entityId: productId, changes: { imageId },
  })

  revalidateProducts()
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE / RESTORE
// ─────────────────────────────────────────────────────────────────────────────

export async function softDeleteProduct(id: string) {
  await requireAdmin()

  const product = await prisma.trendingProduct.findUnique({
    where: { id }, select: { id: true, name: true, isDeleted: true },
  })
  if (!product)          throw new Error("Product not found")
  if (product.isDeleted) throw new Error("Product is already deleted")

  await prisma.trendingProduct.update({
    where: { id }, data: { isDeleted: true, isActive: false },
  })

  await logAdminAction({
    action: "DELETE_TRENDING_PRODUCT", entity: "TrendingProduct",
    entityId: id, changes: { name: product.name },
  })

  revalidateProducts()
}

export async function restoreProduct(id: string) {
  await requireAdmin()

  const product = await prisma.trendingProduct.findUnique({
    where: { id }, select: { id: true, isDeleted: true },
  })
  if (!product)           throw new Error("Product not found")
  if (!product.isDeleted) throw new Error("Product is not deleted")

  const restored = await prisma.trendingProduct.update({
    where: { id }, data: { isDeleted: false, isActive: true },
  })

  await logAdminAction({
    action: "RESTORE_TRENDING_PRODUCT", entity: "TrendingProduct", entityId: id,
  })

  revalidateProducts()
  return restored
}

export async function hardDeleteProduct(id: string) {
  await requireAdmin()

  const product = await prisma.trendingProduct.findUnique({
    where: { id }, select: { id: true, name: true },
  })
  if (!product) throw new Error("Product not found")

  await prisma.trendingProduct.delete({ where: { id } })

  await logAdminAction({
    action: "HARD_DELETE_TRENDING_PRODUCT", entity: "TrendingProduct",
    entityId: id, changes: { name: product.name },
  })

  revalidateProducts()
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function bulkProductAction(ids: string[], action: BulkAction) {
  await requireAdmin()

  if (!ids.length) throw new Error("No products selected")

  let updateData: any = {}

  switch (action) {
    case "activate":   updateData = { isActive: true,  isDeleted: false }; break
    case "deactivate": updateData = { isActive: false };                    break
    case "feature":    updateData = { isFeatured: true };                   break
    case "unfeature":  updateData = { isFeatured: false, featuredUntil: null }; break
    case "delete":     updateData = { isDeleted: true,  isActive: false }; break
    case "restore":    updateData = { isDeleted: false, isActive: true };  break
    default: throw new Error(`Unknown bulk action: ${action}`)
  }

  const result = await prisma.trendingProduct.updateMany({
    where: { id: { in: ids } },
    data:  updateData,
  })

  await logAdminAction({
    action:  `BULK_${action.toUpperCase()}_PRODUCTS`,
    entity:  "TrendingProduct",
    changes: { ids, count: result.count },
  })

  revalidateProducts()
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// TAGS
// ─────────────────────────────────────────────────────────────────────────────

export async function addProductTags(id: string, newTags: string[]) {
  await requireAdmin()

  const product = await prisma.trendingProduct.findUnique({
    where: { id }, select: { id: true, tags: true, isDeleted: true },
  })
  if (!product)          throw new Error("Product not found")
  if (product.isDeleted) throw new Error("Cannot update deleted product")

  const merged = Array.from(
    new Set([...product.tags, ...newTags.map((t) => t.trim().toLowerCase()).filter(Boolean)])
  )

  const updated = await prisma.trendingProduct.update({
    where: { id }, data: { tags: merged },
  })

  revalidateProducts()
  return updated
}

export async function removeProductTag(id: string, tag: string) {
  await requireAdmin()

  const product = await prisma.trendingProduct.findUnique({
    where: { id }, select: { id: true, tags: true, isDeleted: true },
  })
  if (!product)          throw new Error("Product not found")
  if (product.isDeleted) throw new Error("Cannot update deleted product")

  const updated = await prisma.trendingProduct.update({
    where: { id }, data: { tags: product.tags.filter((t) => t !== tag) },
  })

  revalidateProducts()
  return updated
}