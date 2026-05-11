"use server"

// app/[locale]/admin/(routes)/blogs/actions.ts

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-guard"
import { logAdminAction } from "@/lib/audit"
import { z } from "zod"
import { Prisma, PostStatus } from "@prisma/client"
import { writeFile, mkdir, unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export type Locale = "en" | "ar"

export type CreatePostInput = {
    titleEn: string
    titleAr?: string
    slugEn: string
    slugAr?: string
    excerptEn?: string
    excerptAr?: string
    contentEn: string
    contentAr?: string
    status?: PostStatus
    publishedAt?: Date | string | null
    categoryId?: string
    tagIds?: string[]
    // SEO
    metaTitleEn?: string
    metaTitleAr?: string
    metaDescriptionEn?: string
    metaDescriptionAr?: string
    ogImageUrl?: string
    ogImageAltEn?: string
    ogImageAltAr?: string
    twitterCard?: string
    canonicalUrl?: string
    // Media
    images?: {
        url: string
        isPrimary?: boolean
        altText?: string
        sortOrder?: number
    }[]
    videos?: {
        url: string
        sortOrder?: number
    }[]
}

export type UpdatePostInput = Partial<Omit<CreatePostInput, "images" | "videos">> & {
    isDeleted?: boolean
}

export type CreateCategoryInput = {
    slug: string
    nameEn: string
    nameAr?: string
    descEn?: string
    descAr?: string
    parentId?: string | null
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>

export type CreateTagInput = {
    slug: string
    nameEn: string
    nameAr?: string
}

export type UpdateTagInput = Partial<CreateTagInput>

export type BulkPostAction =
    | "publish"
    | "unpublish"
    | "archive"
    | "delete"
    | "restore"

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const IMAGE_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "blog")
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10 MB

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely parse a date value, returning null if invalid
 */
function parseDateSafe(value: Date | string | null | undefined): Date | null {
    if (!value) return null
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
}

/**
 * Generate a unique slug with retry logic
 */
async function generateUniqueSlugSafe(
    base: string,
    locale: Locale,
    excludeId?: string,
    maxAttempts = 100
): Promise<string> {
    let slug = base
    let attempt = 0

    while (attempt < maxAttempts) {
        const candidate = attempt === 0 ? slug : `${base}-${attempt}`
        const where: Prisma.PostWhereInput = {
            AND: [
                locale === "ar" ? { slugAr: candidate } : { slugEn: candidate },
                { isDeleted: false },
                ...(excludeId ? [{ id: { not: excludeId } }] : [])
            ]
        }

        const exists = await prisma.post.count({ where })
        if (exists === 0) return candidate
        
        attempt++
    }
    // Fallback with timestamp if all attempts fail
    return `${base}-${Date.now()}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Revalidation helpers
// ─────────────────────────────────────────────────────────────────────────────

function revalidatePosts() {
    revalidatePath("/admin/blogs")
    revalidatePath("/admin/blogs/[id]", "page")
    revalidatePath("/[locale]", "page")
    revalidatePath("/[locale]/blog", "page")
    revalidatePath("/[locale]/blog/[slug]", "page")
}

function revalidateCategories() {
    revalidatePath("/admin/blogs/categories")
    revalidatePath("/[locale]/blog", "page")
}

function revalidateTags() {
    revalidatePath("/admin/blogs/tags")
    revalidatePath("/[locale]/blog", "page")
}

// ─────────────────────────────────────────────────────────────────────────────
// Serialization helpers
// ─────────────────────────────────────────────────────────────────────────────

function serializePost(p: any) {
    return {
        ...p,
        publishedAt: p.publishedAt instanceof Date ? p.publishedAt.toISOString() : p.publishedAt,
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
        updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
        images: (p.images ?? []).map(serializePostImage),
        videos: (p.videos ?? []).map((v: any) => ({
            ...v,
            createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
        })),
        tags: (p.tags ?? []).map((t: any) => ({
            ...t,
            tag: t.tag
                ? {
                    ...t.tag,
                    createdAt: t.tag.createdAt instanceof Date ? t.tag.createdAt.toISOString() : t.tag.createdAt,
                    updatedAt: t.tag.updatedAt instanceof Date ? t.tag.updatedAt.toISOString() : t.tag.updatedAt,
                }
                : null,
        })),
        author: p.author
            ? {
                ...p.author,
                createdAt: p.author.createdAt instanceof Date ? p.author.createdAt.toISOString() : p.author.createdAt,
            }
            : null,
        category: p.category
            ? {
                ...p.category,
                createdAt: p.category.createdAt instanceof Date ? p.category.createdAt.toISOString() : p.category.createdAt,
                updatedAt: p.category.updatedAt instanceof Date ? p.category.updatedAt.toISOString() : p.category.updatedAt,
            }
            : null,
    }
}

function serializePostImage(img: any) {
    return {
        ...img,
        createdAt: img.createdAt instanceof Date ? img.createdAt.toISOString() : img.createdAt,
    }
}

function serializeComment(c: any): any {
    return {
        ...c,
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
        updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
        deletedAt: c.deletedAt instanceof Date ? c.deletedAt.toISOString() : c.deletedAt,
        replies: (c.replies ?? []).map(serializeComment),
    }
}

function serializeCategory(cat: any) {
    return {
        ...cat,
        createdAt: cat.createdAt instanceof Date ? cat.createdAt.toISOString() : cat.createdAt,
        updatedAt: cat.updatedAt instanceof Date ? cat.updatedAt.toISOString() : cat.updatedAt,
        children: (cat.children ?? []).map(serializeCategory),
    }
}

function serializeTag(tag: any) {
    return {
        ...tag,
        createdAt: tag.createdAt instanceof Date ? tag.createdAt.toISOString() : tag.createdAt,
        updatedAt: tag.updatedAt instanceof Date ? tag.updatedAt.toISOString() : tag.updatedAt,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Prisma includes
// ─────────────────────────────────────────────────────────────────────────────

const postListInclude = {
    author: {
        select: { id: true, fullName: true, email: true, avatarUrl: true },
    },
    category: {
        select: { id: true, slug: true, nameEn: true, nameAr: true },
    },
    images: {
        where: { isPrimary: true },
        take: 1,
        orderBy: { sortOrder: "asc" as Prisma.SortOrder },
    },
    tags: {
        include: {
            tag: { select: { id: true, slug: true, nameEn: true, nameAr: true } },
        },
    },
    _count: { select: { comments: true, reactions: true, videos: true, images: true } },
} satisfies Prisma.PostInclude

const postDetailInclude = {
    author: {
        select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
    },
    category: {
        select: { id: true, slug: true, nameEn: true, nameAr: true, descEn: true, descAr: true },
    },
    images: {
        orderBy: [
            { isPrimary: "desc" as Prisma.SortOrder },
            { sortOrder: "asc" as Prisma.SortOrder },
        ],
    },
    videos: {
        orderBy: { sortOrder: "asc" as Prisma.SortOrder },
    },
    tags: {
        include: {
            tag: { select: { id: true, slug: true, nameEn: true, nameAr: true } },
        },
    },
    _count: { select: { comments: true, reactions: true } },
} satisfies Prisma.PostInclude

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION A: POSTS – READ ──────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// A1. GET ALL POSTS (paginated + filtered)
// ─────────────────────────────────────────────────────────────────────────────

const listPostsSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    search: z.string().default(""),
    status: z.enum(["all", "DRAFT", "PUBLISHED", "ARCHIVED", "DELETED"]).default("all"),
    categoryId: z.string().optional(),
    tagId: z.string().optional(),
    authorId: z.string().optional(),
    sortBy: z
        .enum(["createdAt", "updatedAt", "publishedAt", "titleEn"])
        .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export async function getAllPosts(raw: z.infer<typeof listPostsSchema> = {} as any): Promise<
    ActionResult<{
        posts: any[]
        total: number
        page: number
        limit: number
        pages: number
        hasNext: boolean
        hasPrev: boolean
    }>
> {
    try {
        await requireAdmin()
        const { page, limit, search, status, categoryId, tagId, authorId, sortBy, sortOrder } =
            listPostsSchema.parse(raw)

        const skip = (page - 1) * limit
        const where: Prisma.PostWhereInput = {}

        // Status / visibility filter
        if (status === "DELETED") {
            where.isDeleted = true
        } else {
            where.isDeleted = false
            if (status !== "all") where.status = status as PostStatus
        }

        if (categoryId) where.categoryId = categoryId
        if (authorId) where.authorId = authorId
        if (tagId) {
            where.tags = { some: { tagId } }
        }

        if (search.trim()) {
            where.OR = [
                { titleEn: { contains: search, mode: "insensitive" } },
                { titleAr: { contains: search, mode: "insensitive" } },
                { excerptEn: { contains: search, mode: "insensitive" } },
                { excerptAr: { contains: search, mode: "insensitive" } },
                { slugEn: { contains: search, mode: "insensitive" } },
                { slugAr: { contains: search, mode: "insensitive" } },
            ]
        }

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                include: postListInclude,
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
            }),
            prisma.post.count({ where }),
        ])

        return {
            success: true,
            data: {
                posts: posts.map(serializePost),
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        }
    } catch (err) {
        console.error("[getAllPosts]", err)
        return { success: false, error: "Failed to fetch posts" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// A2. GET SINGLE POST BY ID
// ─────────────────────────────────────────────────────────────────────────────

export async function getPostById(id: string): Promise<ActionResult<any>> {
    try {
        await requireAdmin()

        const post = await prisma.post.findUnique({
            where: { id },
            include: postDetailInclude,
        })
        if (!post) return { success: false, error: "Post not found" }

        return { success: true, data: serializePost(post) }
    } catch (err) {
        console.error("[getPostById]", err)
        return { success: false, error: "Failed to fetch post" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// A3. GET POST BY SLUG (locale-aware — used for preview)
// ─────────────────────────────────────────────────────────────────────────────

export async function getPostBySlug(
    slug: string,
    locale: Locale = "en",
): Promise<ActionResult<any>> {
    try {
        await requireAdmin()

        const where: Prisma.PostWhereUniqueInput =
            locale === "ar" ? { slugAr: slug } : { slugEn: slug }

        const post = await prisma.post.findUnique({
            where,
            include: postDetailInclude,
        })
        if (!post) return { success: false, error: "Post not found" }

        return { success: true, data: serializePost(post) }
    } catch (err) {
        console.error("[getPostBySlug]", err)
        return { success: false, error: "Failed to fetch post" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// A4. BLOG STATS
// ─────────────────────────────────────────────────────────────────────────────

export async function getBlogStats(): Promise<
    ActionResult<{
        total: number
        published: number
        draft: number
        archived: number
        deleted: number
        totalComments: number
        totalReactions: number
        recentPosts: any[]
        topByComments: any[]
        topByReactions: any[]
        categoryBreakdown: { category: string; count: number }[]
        statusBreakdown: { status: string; count: number }[]
    }>
> {
    try {
        await requireAdmin()

        const [
            total,
            published,
            draft,
            archived,
            deleted,
            totalComments,
            totalReactions,
            recentPosts,
            topByComments,
            topByReactions,
            categoryGroups,
        ] = await Promise.all([
            prisma.post.count({ where: { isDeleted: false } }),
            prisma.post.count({ where: { isDeleted: false, status: "PUBLISHED" } }),
            prisma.post.count({ where: { isDeleted: false, status: "DRAFT" } }),
            prisma.post.count({ where: { isDeleted: false, status: "ARCHIVED" } }),
            prisma.post.count({ where: { isDeleted: true } }),
            prisma.comment.count({ where: { isDeleted: false } }),
            prisma.postReaction.count(),
            prisma.post.findMany({
                where: { isDeleted: false },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: {
                    id: true,
                    titleEn: true,
                    titleAr: true,
                    slugEn: true,
                    status: true,
                    publishedAt: true,
                    createdAt: true,
                    images: { where: { isPrimary: true }, take: 1, select: { url: true } },
                    _count: { select: { comments: true, reactions: true } },
                },
            }),
            prisma.post.findMany({
                where: { isDeleted: false, status: "PUBLISHED" },
                orderBy: { comments: { _count: "desc" } },
                take: 5,
                select: {
                    id: true,
                    titleEn: true,
                    titleAr: true,
                    slugEn: true,
                    _count: { select: { comments: true, reactions: true } },
                },
            }),
            prisma.post.findMany({
                where: { isDeleted: false, status: "PUBLISHED" },
                orderBy: { reactions: { _count: "desc" } },
                take: 5,
                select: {
                    id: true,
                    titleEn: true,
                    titleAr: true,
                    slugEn: true,
                    _count: { select: { comments: true, reactions: true } },
                },
            }),
            prisma.post.groupBy({
                by: ["categoryId"],
                where: { isDeleted: false, categoryId: { not: null } },
                _count: true,
                orderBy: { _count: { categoryId: "desc" } },
                take: 10,
            }),
        ])

        // Resolve category IDs → names
        const categoryIds = categoryGroups.map((g) => g.categoryId!).filter(Boolean)
        const categories = categoryIds.length
            ? await prisma.postCategory.findMany({
                where: { id: { in: categoryIds } },
                select: { id: true, nameEn: true },
            })
            : []

        const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.nameEn]))

        const serialize = (p: any) => ({
            ...p,
            createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
            publishedAt: p.publishedAt instanceof Date ? p.publishedAt.toISOString() : p.publishedAt,
        })

        return {
            success: true,
            data: {
                total,
                published,
                draft,
                archived,
                deleted,
                totalComments,
                totalReactions,
                recentPosts: recentPosts.map(serialize),
                topByComments: topByComments.map(serialize),
                topByReactions: topByReactions.map(serialize),
                categoryBreakdown: categoryGroups.map((g) => ({
                    category: categoryMap[g.categoryId!] ?? "Uncategorized",
                    count: g._count,
                })),
                statusBreakdown: [
                    { status: "PUBLISHED", count: published },
                    { status: "DRAFT", count: draft },
                    { status: "ARCHIVED", count: archived },
                ],
            },
        }
    } catch (err) {
        console.error("[getBlogStats]", err)
        return { success: false, error: "Failed to fetch blog stats" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// A5. SLUG AVAILABILITY CHECK
// ─────────────────────────────────────────────────────────────────────────────

export async function checkSlugAvailability(
    slug: string,
    locale: Locale = "en",
    excludeId?: string,
): Promise<ActionResult<{ available: boolean }>> {
    try {
        await requireAdmin()

        const where: Prisma.PostWhereInput = {
            AND: [
                locale === "ar" ? { slugAr: slug } : { slugEn: slug },
                { isDeleted: false },
                ...(excludeId ? [{ id: { not: excludeId } }] : [])
            ]
        }

        const count = await prisma.post.count({ where })
        return { success: true, data: { available: count === 0 } }
    } catch (err) {
        console.error("[checkSlugAvailability]", err)
        return { success: false, error: "Failed to check slug" }
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION B: POSTS – CREATE & UPDATE ──────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// B1. CREATE POST
// ─────────────────────────────────────────────────────────────────────────────

export async function createPost(input: CreatePostInput): Promise<ActionResult<any>> {
    try {
        const adminId = await requireAdmin()

        // Required field validation
        if (!input.titleEn?.trim()) return { success: false, error: "English title is required" }
        if (!input.slugEn?.trim()) return { success: false, error: "English slug is required" }
        if (!input.contentEn?.trim()) return { success: false, error: "English content is required" }

        // Slug uniqueness check (exclude soft-deleted posts)
        const slugConflict = await prisma.post.count({ 
            where: { 
                slugEn: input.slugEn.trim(),
                isDeleted: false 
            } 
        })
        if (slugConflict > 0) return { success: false, error: "English slug already exists" }

        if (input.slugAr) {
            const arConflict = await prisma.post.count({ 
                where: { 
                    slugAr: input.slugAr.trim(),
                    isDeleted: false 
                } 
            })
            if (arConflict > 0) return { success: false, error: "Arabic slug already exists" }
        }

        // Resolve publish time with safe parsing
        const isPublishing = input.status === "PUBLISHED"
        const publishedAt = isPublishing
            ? parseDateSafe(input.publishedAt) ?? new Date()
            : parseDateSafe(input.publishedAt)

        const created = await prisma.post.create({
            data: {
                titleEn: input.titleEn.trim(),
                titleAr: input.titleAr?.trim(),
                slugEn: input.slugEn.trim(),
                slugAr: input.slugAr?.trim() || null,
                excerptEn: input.excerptEn?.trim(),
                excerptAr: input.excerptAr?.trim(),
                contentEn: input.contentEn,
                contentAr: input.contentAr || null,
                status: input.status ?? "DRAFT",
                publishedAt,
                authorId: adminId,
                categoryId: input.categoryId || null,
                // SEO
                metaTitleEn: input.metaTitleEn?.trim(),
                metaTitleAr: input.metaTitleAr?.trim(),
                metaDescriptionEn: input.metaDescriptionEn?.trim(),
                metaDescriptionAr: input.metaDescriptionAr?.trim(),
                ogImageUrl: input.ogImageUrl?.trim(),
                ogImageAltEn: input.ogImageAltEn?.trim(),
                ogImageAltAr: input.ogImageAltAr?.trim(),
                twitterCard: input.twitterCard ?? "summary_large_image",
                canonicalUrl: input.canonicalUrl?.trim(),
                // Tags (many-to-many via PostTagOnPost)
                tags: input.tagIds?.length
                    ? {
                        create: input.tagIds.map((tagId) => ({ tagId })),
                    }
                    : undefined,
                // Images
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
                // Videos
                videos: input.videos?.length
                    ? {
                        create: input.videos.map((vid, index) => ({
                            url: vid.url,
                            sortOrder: vid.sortOrder ?? index,
                        })),
                    }
                    : undefined,
            },
            include: postDetailInclude,
        })

        await logAdminAction({
            action: "CREATE_POST",
            entity: "Post",
            entityId: created.id,
            changes: {
                titleEn: created.titleEn,
                slugEn: created.slugEn,
                status: created.status,
                categoryId: created.categoryId,
            },
        })

        revalidatePosts()
        return { success: true, data: serializePost(created) }
    } catch (err) {
        console.error("[createPost]", err)
        return { success: false, error: "Failed to create post" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// B2. UPDATE POST
// ─────────────────────────────────────────────────────────────────────────────

export async function updatePost(id: string, input: UpdatePostInput): Promise<ActionResult<any>> {
    try {
        await requireAdmin()

        const existing = await prisma.post.findUnique({
            where: { id },
            select: { id: true, isDeleted: true, status: true, slugEn: true, slugAr: true },
        })
        if (!existing) return { success: false, error: "Post not found" }
        if (existing.isDeleted) return { success: false, error: "Cannot update a deleted post" }

        // Slug uniqueness checks (skip if unchanged, exclude soft-deleted)
        if (input.slugEn && input.slugEn.trim() !== existing.slugEn) {
            const conflict = await prisma.post.count({
                where: { 
                    slugEn: input.slugEn.trim(), 
                    id: { not: id },
                    isDeleted: false 
                },
            })
            if (conflict > 0) return { success: false, error: "English slug already in use" }
        }

        if (input.slugAr && input.slugAr.trim() !== existing.slugAr) {
            const conflict = await prisma.post.count({
                where: { 
                    slugAr: input.slugAr.trim(), 
                    id: { not: id },
                    isDeleted: false 
                },
            })
            if (conflict > 0) return { success: false, error: "Arabic slug already in use" }
        }

        // Auto-set publishedAt when transitioning to PUBLISHED (with safe parsing)
        let publishedAt: Date | null | undefined = undefined
        if (input.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
            publishedAt = parseDateSafe(input.publishedAt) ?? new Date()
        } else if (input.publishedAt !== undefined) {
            publishedAt = parseDateSafe(input.publishedAt)
        }

        const updated = await prisma.post.update({
            where: { id },
            data: {
                ...(input.titleEn !== undefined && { titleEn: input.titleEn.trim() }),
                ...(input.titleAr !== undefined && { titleAr: input.titleAr?.trim() ?? null }),
                ...(input.slugEn !== undefined && { slugEn: input.slugEn.trim() }),
                ...(input.slugAr !== undefined && { slugAr: input.slugAr?.trim() ?? null }),
                ...(input.excerptEn !== undefined && { excerptEn: input.excerptEn?.trim() ?? null }),
                ...(input.excerptAr !== undefined && { excerptAr: input.excerptAr?.trim() ?? null }),
                ...(input.contentEn !== undefined && { contentEn: input.contentEn }),
                ...(input.contentAr !== undefined && { contentAr: input.contentAr ?? null }),
                ...(input.status !== undefined && { status: input.status }),
                ...(publishedAt !== undefined && { publishedAt }),
                ...(input.categoryId !== undefined && { categoryId: input.categoryId ?? null }),
                ...(input.metaTitleEn !== undefined && { metaTitleEn: input.metaTitleEn?.trim() ?? null }),
                ...(input.metaTitleAr !== undefined && { metaTitleAr: input.metaTitleAr?.trim() ?? null }),
                ...(input.metaDescriptionEn !== undefined && { metaDescriptionEn: input.metaDescriptionEn?.trim() ?? null }),
                ...(input.metaDescriptionAr !== undefined && { metaDescriptionAr: input.metaDescriptionAr?.trim() ?? null }),
                ...(input.ogImageUrl !== undefined && { ogImageUrl: input.ogImageUrl?.trim() ?? null }),
                ...(input.ogImageAltEn !== undefined && { ogImageAltEn: input.ogImageAltEn?.trim() ?? null }),
                ...(input.ogImageAltAr !== undefined && { ogImageAltAr: input.ogImageAltAr?.trim() ?? null }),
                ...(input.twitterCard !== undefined && { twitterCard: input.twitterCard ?? null }),
                ...(input.canonicalUrl !== undefined && { canonicalUrl: input.canonicalUrl?.trim() ?? null }),
                // FIX: Handle isDeleted field
                ...(input.isDeleted !== undefined && { isDeleted: input.isDeleted }),
                // Tags: full replace when provided
                ...(input.tagIds !== undefined && {
                    tags: {
                        deleteMany: {},
                        create: input.tagIds.map((tagId) => ({ tagId })),
                    },
                }),
            },
            include: postDetailInclude,
        })

        await logAdminAction({
            action: "UPDATE_POST",
            entity: "Post",
            entityId: id,
            changes: input as Record<string, unknown>,
        })

        revalidatePosts()
        return { success: true, data: serializePost(updated) }
    } catch (err) {
        console.error("[updatePost]", err)
        return { success: false, error: "Failed to update post" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// B3. PUBLISH POST
// ─────────────────────────────────────────────────────────────────────────────

export async function publishPost(
    id: string,
    scheduledAt?: Date | string,
): Promise<ActionResult<{ status: PostStatus; publishedAt: string }>> {
    try {
        await requireAdmin()

        const post = await prisma.post.findUnique({ where: { id }, select: { id: true, isDeleted: true, status: true } })
        if (!post) return { success: false, error: "Post not found" }
        if (post.isDeleted) return { success: false, error: "Cannot publish a deleted post" }

        const publishedAt = parseDateSafe(scheduledAt) ?? new Date()

        const updated = await prisma.post.update({
            where: { id },
            data: { status: "PUBLISHED", publishedAt },
            select: { status: true, publishedAt: true },
        })

        await logAdminAction({
            action: "PUBLISH_POST",
            entity: "Post",
            entityId: id,
            changes: { previousStatus: post.status, publishedAt: publishedAt.toISOString() },
        })

        revalidatePosts()
        return {
            success: true,
            data: {
                status: updated.status,
                publishedAt: updated.publishedAt!.toISOString(),
            },
        }
    } catch (err) {
        console.error("[publishPost]", err)
        return { success: false, error: "Failed to publish post" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// B4. UNPUBLISH → DRAFT
// ─────────────────────────────────────────────────────────────────────────────

export async function unpublishPost(id: string): Promise<ActionResult<{ status: PostStatus }>> {
    try {
        await requireAdmin()

        const post = await prisma.post.findUnique({ where: { id }, select: { id: true, isDeleted: true } })
        if (!post) return { success: false, error: "Post not found" }
        if (post.isDeleted) return { success: false, error: "Cannot unpublish a deleted post" }

        await prisma.post.update({ where: { id }, data: { status: "DRAFT" } })
        await logAdminAction({ action: "UNPUBLISH_POST", entity: "Post", entityId: id })
        revalidatePosts()
        return { success: true, data: { status: "DRAFT" } }
    } catch (err) {
        console.error("[unpublishPost]", err)
        return { success: false, error: "Failed to unpublish post" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// B5. ARCHIVE POST
// ─────────────────────────────────────────────────────────────────────────────

export async function archivePost(id: string): Promise<ActionResult<{ status: PostStatus }>> {
    try {
        await requireAdmin()

        const post = await prisma.post.findUnique({ where: { id }, select: { id: true, isDeleted: true } })
        if (!post) return { success: false, error: "Post not found" }
        if (post.isDeleted) return { success: false, error: "Cannot archive a deleted post" }

        await prisma.post.update({ where: { id }, data: { status: "ARCHIVED" } })
        await logAdminAction({ action: "ARCHIVE_POST", entity: "Post", entityId: id })
        revalidatePosts()
        return { success: true, data: { status: "ARCHIVED" } }
    } catch (err) {
        console.error("[archivePost]", err)
        return { success: false, error: "Failed to archive post" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// B6. SOFT DELETE
// ─────────────────────────────────────────────────────────────────────────────

export async function softDeletePost(id: string): Promise<ActionResult<{ ok: boolean }>> {
    try {
        await requireAdmin()

        const post = await prisma.post.findUnique({ where: { id }, select: { id: true, titleEn: true, isDeleted: true } })
        if (!post) return { success: false, error: "Post not found" }
        if (post.isDeleted) return { success: false, error: "Post is already deleted" }

        await prisma.post.update({ where: { id }, data: { isDeleted: true } })
        await logAdminAction({ action: "DELETE_POST", entity: "Post", entityId: id, changes: { title: post.titleEn } })
        revalidatePosts()
        return { success: true, data: { ok: true } }
    } catch (err) {
        console.error("[softDeletePost]", err)
        return { success: false, error: "Failed to delete post" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// B7. RESTORE
// ─────────────────────────────────────────────────────────────────────────────

export async function restorePost(id: string): Promise<ActionResult<{ ok: boolean }>> {
    try {
        await requireAdmin()

        const post = await prisma.post.findUnique({ where: { id }, select: { id: true, isDeleted: true } })
        if (!post) return { success: false, error: "Post not found" }
        if (!post.isDeleted) return { success: false, error: "Post is not deleted" }

        await prisma.post.update({ where: { id }, data: { isDeleted: false, status: "DRAFT" } })
        await logAdminAction({ action: "RESTORE_POST", entity: "Post", entityId: id })
        revalidatePosts()
        return { success: true, data: { ok: true } }
    } catch (err) {
        console.error("[restorePost]", err)
        return { success: false, error: "Failed to restore post" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// B8. HARD DELETE
// ─────────────────────────────────────────────────────────────────────────────

export async function hardDeletePost(id: string): Promise<ActionResult<{ ok: boolean }>> {
    try {
        await requireAdmin()

        const post = await prisma.post.findUnique({
            where: { id },
            select: {
                id: true,
                titleEn: true,
                images: { select: { id: true, url: true } },
            },
        })
        if (!post) return { success: false, error: "Post not found" }

        // FIX: Delete from DB first, then clean up disk
        await prisma.post.delete({ where: { id } })
        
        // Remove locally-uploaded images from disk (best effort)
        for (const img of post.images) {
            if (img.url.startsWith("/uploads/")) {
                const diskPath = path.join(process.cwd(), "public", img.url)
                try { await unlink(diskPath) } catch { /* already gone or error, log if needed */ }
            }
        }

        await logAdminAction({ action: "HARD_DELETE_POST", entity: "Post", entityId: id, changes: { title: post.titleEn } })
        revalidatePosts()
        return { success: true, data: { ok: true } }
    } catch (err) {
        console.error("[hardDeletePost]", err)
        return { success: false, error: "Failed to permanently delete post" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// B9. BULK OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function bulkPostAction(
    ids: string[],
    action: BulkPostAction,
): Promise<ActionResult<{ count: number }>> {
    try {
        await requireAdmin()
        if (!ids.length) return { success: false, error: "No posts selected" }

        const data: Prisma.PostUpdateManyMutationInput = (() => {
            switch (action) {
                case "publish": return { status: "PUBLISHED", publishedAt: new Date() }
                case "unpublish": return { status: "DRAFT" }
                case "archive": return { status: "ARCHIVED" }
                case "delete": return { isDeleted: true }
                case "restore": return { isDeleted: false, status: "DRAFT" }
                default: throw new Error(`Unknown bulk action: ${action}`)
            }
        })()

        const result = await prisma.post.updateMany({
            where: { id: { in: ids } },
            data,
        })

        await logAdminAction({
            action: `BULK_${action.toUpperCase()}_POSTS`,
            entity: "Post",
            changes: { ids, count: result.count },
        })
        revalidatePosts()
        return { success: true, data: { count: result.count } }
    } catch (err) {
        console.error("[bulkPostAction]", err)
        return { success: false, error: "Bulk operation failed" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// B10. DUPLICATE POST (as DRAFT)
// ─────────────────────────────────────────────────────────────────────────────

export async function duplicatePost(id: string): Promise<ActionResult<any>> {
    try {
        const adminId = await requireAdmin()

        const original = await prisma.post.findUnique({
            where: { id },
            include: {
                images: true,
                videos: true,
                tags: { select: { tagId: true } },
            },
        })
        if (!original) return { success: false, error: "Post not found" }

        const baseSuffix = `-copy-${Date.now()}`
        const slugEn = await generateUniqueSlugSafe(
            `${original.slugEn}${baseSuffix}`, 
            "en", 
            undefined
        )
        const slugAr = original.slugAr 
            ? await generateUniqueSlugSafe(`${original.slugAr}${baseSuffix}`, "ar", undefined)
            : null

        const { id: _id, createdAt: _c, updatedAt: _u, publishedAt: _p, ...rest } = original

        const created = await prisma.post.create({
            data: {
                ...rest,
                titleEn: `${original.titleEn} (Copy)`,
                titleAr: original.titleAr ? `${original.titleAr} (نسخة)` : null,
                slugEn,
                slugAr,
                status: "DRAFT",
                publishedAt: null,
                authorId: adminId,
                tags: {
                    create: original.tags.map((t) => ({ tagId: t.tagId })),
                },
                images: {
                    create: original.images.map(({ id: _iid, postId: _pid, createdAt: _ica, ...img }) => img),
                },
                videos: {
                    create: original.videos.map(({ id: _vid, postId: _vpid, createdAt: _vca, ...vid }) => vid),
                },
            },
            include: postDetailInclude,
        })

        await logAdminAction({
            action: "DUPLICATE_POST",
            entity: "Post",
            entityId: created.id,
            changes: { originalId: id, newSlugEn: created.slugEn },
        })

        revalidatePosts()
        return { success: true, data: serializePost(created) }
    } catch (err) {
        console.error("[duplicatePost]", err)
        return { success: false, error: "Failed to duplicate post" }
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION C: IMAGE MANAGEMENT ──────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// C1. UPLOAD IMAGE (disk storage)
// ─────────────────────────────────────────────────────────────────────────────

export async function uploadPostImage(
    postId: string,
    formData: FormData,
): Promise<ActionResult<{ id: string; url: string; isPrimary: boolean }>> {
    try {
        await requireAdmin()

        const file = formData.get("file") as File | null
        if (!file) return { success: false, error: "No file provided" }
        if (!ALLOWED_IMAGE_TYPES.has(file.type)) return { success: false, error: "Only JPEG, PNG, WebP or GIF allowed" }
        if (file.size > MAX_IMAGE_BYTES) return { success: false, error: "Image must be under 10 MB" }

        const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, isDeleted: true } })
        if (!post) return { success: false, error: "Post not found" }
        if (post.isDeleted) return { success: false, error: "Cannot add image to a deleted post" }

        if (!existsSync(IMAGE_UPLOAD_DIR)) await mkdir(IMAGE_UPLOAD_DIR, { recursive: true })

        const ext = file.name.split(".").pop() ?? "jpg"
        const filename = `${postId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const fullPath = path.join(IMAGE_UPLOAD_DIR, filename)
        
        // Write file to disk first
        await writeFile(fullPath, Buffer.from(await file.arrayBuffer()))
        
        const url = `/uploads/blog/${filename}`
        
        try {
            const existingCount = await prisma.postImage.count({ where: { postId } })
            const isPrimary = existingCount === 0

            if (isPrimary) {
                await prisma.postImage.updateMany({ where: { postId }, data: { isPrimary: false } })
            }

            const image = await prisma.postImage.create({
                data: {
                    postId,
                    url,
                    altText: (formData.get("altText") as string) || null,
                    isPrimary,
                    sortOrder: existingCount,
                },
            })

            await logAdminAction({
                action: "UPLOAD_POST_IMAGE",
                entity: "Post",
                entityId: postId,
                changes: { imageId: image.id, url },
            })
            revalidatePosts()
            return { success: true, data: { id: image.id, url, isPrimary } }
        } catch (dbError) {
            // FIX: Clean up file if DB operation fails
            try { await unlink(fullPath) } catch { /* ignore cleanup errors */ }
            throw dbError
        }
    } catch (err) {
        console.error("[uploadPostImage]", err)
        return { success: false, error: "Failed to upload image" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// C2. ADD IMAGE BY URL (external CDN / Unsplash / etc.)
// ─────────────────────────────────────────────────────────────────────────────

export async function addPostImageByUrl(
    postId: string,
    image: { url: string; isPrimary?: boolean; altText?: string; sortOrder?: number },
): Promise<ActionResult<{ id: string }>> {
    try {
        await requireAdmin()

        const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, isDeleted: true } })
        if (!post) return { success: false, error: "Post not found" }
        if (post.isDeleted) return { success: false, error: "Cannot add image to a deleted post" }

        if (image.isPrimary) {
            await prisma.postImage.updateMany({ where: { postId }, data: { isPrimary: false } })
        }

        const last = await prisma.postImage.findFirst({
            where: { postId },
            orderBy: { sortOrder: "desc" },
            select: { sortOrder: true },
        })

        const created = await prisma.postImage.create({
            data: {
                postId,
                url: image.url,
                isPrimary: image.isPrimary ?? false,
                altText: image.altText?.trim(),
                sortOrder: image.sortOrder ?? (last?.sortOrder ?? -1) + 1,
            },
        })

        await logAdminAction({ action: "ADD_POST_IMAGE_URL", entity: "Post", entityId: postId, changes: { imageId: created.id, url: image.url } })
        revalidatePosts()
        return { success: true, data: { id: created.id } }
    } catch (err) {
        console.error("[addPostImageByUrl]", err)
        return { success: false, error: "Failed to add image" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// C3. SET PRIMARY IMAGE
// ─────────────────────────────────────────────────────────────────────────────

export async function setPostPrimaryImage(
    postId: string,
    imageId: string,
): Promise<ActionResult<{ ok: boolean }>> {
    try {
        await requireAdmin()

        const image = await prisma.postImage.findFirst({ where: { id: imageId, postId } })
        if (!image) return { success: false, error: "Image not found on this post" }

        await prisma.$transaction([
            prisma.postImage.updateMany({ where: { postId }, data: { isPrimary: false } }),
            prisma.postImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
        ])

        await logAdminAction({ action: "SET_POST_PRIMARY_IMAGE", entity: "Post", entityId: postId, changes: { imageId } })
        revalidatePosts()
        return { success: true, data: { ok: true } }
    } catch (err) {
        console.error("[setPostPrimaryImage]", err)
        return { success: false, error: "Failed to set primary image" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// C4. REORDER IMAGES
// ─────────────────────────────────────────────────────────────────────────────

export async function reorderPostImages(
    postId: string,
    imageIds: string[],
): Promise<ActionResult<{ ok: boolean }>> {
    try {
        await requireAdmin()

        await prisma.$transaction(
            imageIds.map((imageId, index) =>
                prisma.postImage.updateMany({ where: { id: imageId, postId }, data: { sortOrder: index } })
            ),
        )

        await logAdminAction({ action: "REORDER_POST_IMAGES", entity: "Post", entityId: postId, changes: { imageIds } })
        revalidatePosts()
        return { success: true, data: { ok: true } }
    } catch (err) {
        console.error("[reorderPostImages]", err)
        return { success: false, error: "Failed to reorder images" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// C5. UPDATE IMAGE ALT TEXT
// ─────────────────────────────────────────────────────────────────────────────

export async function updatePostImageAltText(
    imageId: string,
    altText: string,
): Promise<ActionResult<{ ok: boolean }>> {
    try {
        await requireAdmin()

        await prisma.postImage.update({ where: { id: imageId }, data: { altText: altText.trim() } })
        revalidatePosts()
        return { success: true, data: { ok: true } }
    } catch (err) {
        console.error("[updatePostImageAltText]", err)
        return { success: false, error: "Failed to update alt text" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// C6. DELETE IMAGE
// ─────────────────────────────────────────────────────────────────────────────

export async function deletePostImage(
    postId: string,
    imageId: string,
): Promise<ActionResult<{ ok: boolean }>> {
    try {
        await requireAdmin()

        const image = await prisma.postImage.findFirst({
            where: { id: imageId, postId },
            select: { id: true, isPrimary: true, url: true },
        })
        if (!image) return { success: false, error: "Image not found on this post" }

        // FIX: Delete from DB first, then clean up disk
        await prisma.postImage.delete({ where: { id: imageId } })

        // Remove from disk if local (best effort)
        if (image.url.startsWith("/uploads/")) {
            const diskPath = path.join(process.cwd(), "public", image.url)
            try { await unlink(diskPath) } catch { /* already gone */ }
        }

        // Promote next image to primary
        if (image.isPrimary) {
            const next = await prisma.postImage.findFirst({
                where: { postId },
                orderBy: { sortOrder: "asc" },
            })
            if (next) await prisma.postImage.update({ where: { id: next.id }, data: { isPrimary: true } })
        }

        await logAdminAction({ action: "DELETE_POST_IMAGE", entity: "Post", entityId: postId, changes: { imageId } })
        revalidatePosts()
        return { success: true, data: { ok: true } }
    } catch (err) {
        console.error("[deletePostImage]", err)
        return { success: false, error: "Failed to delete image" }
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION D: VIDEO EMBEDS ──────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// D1. ADD VIDEO EMBED
// ─────────────────────────────────────────────────────────────────────────────

export async function addPostVideo(
    postId: string,
    video: { url: string; sortOrder?: number },
): Promise<ActionResult<{ id: string }>> {
    try {
        await requireAdmin()

        const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, isDeleted: true } })
        if (!post) return { success: false, error: "Post not found" }
        if (post.isDeleted) return { success: false, error: "Cannot add video to a deleted post" }

        const last = await prisma.postVideoEmbed.findFirst({
            where: { postId },
            orderBy: { sortOrder: "desc" },
            select: { sortOrder: true },
        })

        const created = await prisma.postVideoEmbed.create({
            data: {
                postId,
                url: video.url.trim(),
                sortOrder: video.sortOrder ?? (last?.sortOrder ?? -1) + 1,
            },
        })

        revalidatePosts()
        return { success: true, data: { id: created.id } }
    } catch (err) {
        console.error("[addPostVideo]", err)
        return { success: false, error: "Failed to add video" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// D2. DELETE VIDEO EMBED
// ─────────────────────────────────────────────────────────────────────────────

export async function deletePostVideo(
    postId: string,
    videoId: string,
): Promise<ActionResult<{ ok: boolean }>> {
    try {
        await requireAdmin()

        const video = await prisma.postVideoEmbed.findFirst({ where: { id: videoId, postId } })
        if (!video) return { success: false, error: "Video not found on this post" }

        await prisma.postVideoEmbed.delete({ where: { id: videoId } })
        revalidatePosts()
        return { success: true, data: { ok: true } }
    } catch (err) {
        console.error("[deletePostVideo]", err)
        return { success: false, error: "Failed to delete video" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// D3. REORDER VIDEO EMBEDS
// ─────────────────────────────────────────────────────────────────────────────

export async function reorderPostVideos(
    postId: string,
    videoIds: string[],
): Promise<ActionResult<{ ok: boolean }>> {
    try {
        await requireAdmin()

        await prisma.$transaction(
            videoIds.map((videoId, index) =>
                prisma.postVideoEmbed.updateMany({ where: { id: videoId, postId }, data: { sortOrder: index } })
            ),
        )

        revalidatePosts()
        return { success: true, data: { ok: true } }
    } catch (err) {
        console.error("[reorderPostVideos]", err)
        return { success: false, error: "Failed to reorder videos" }
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION E: CATEGORIES ────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const categoryInclude = {
    parent: { select: { id: true, slug: true, nameEn: true, nameAr: true } },
    children: { select: { id: true, slug: true, nameEn: true, nameAr: true } },
    _count: { select: { posts: true } },
} satisfies Prisma.PostCategoryInclude

// ─────────────────────────────────────────────────────────────────────────────
// E1. GET ALL CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllCategories(
    includePostCount = true,
): Promise<ActionResult<any[]>> {
    try {
        await requireAdmin()

        const categories = await prisma.postCategory.findMany({
            include: includePostCount
                ? categoryInclude
                : { parent: { select: { id: true, slug: true, nameEn: true } }, children: true },
            orderBy: { nameEn: "asc" },
        })

        return { success: true, data: categories.map(serializeCategory) }
    } catch (err) {
        console.error("[getAllCategories]", err)
        return { success: false, error: "Failed to fetch categories" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// E2. GET CATEGORY BY ID
// ─────────────────────────────────────────────────────────────────────────────

export async function getCategoryById(id: string): Promise<ActionResult<any>> {
    try {
        await requireAdmin()

        const cat = await prisma.postCategory.findUnique({
            where: { id },
            include: categoryInclude,
        })
        if (!cat) return { success: false, error: "Category not found" }

        return { success: true, data: serializeCategory(cat) }
    } catch (err) {
        console.error("[getCategoryById]", err)
        return { success: false, error: "Failed to fetch category" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// E3. CREATE CATEGORY
// ─────────────────────────────────────────────────────────────────────────────

export async function createCategory(input: CreateCategoryInput): Promise<ActionResult<any>> {
    try {
        await requireAdmin()

        if (!input.slug?.trim()) return { success: false, error: "Slug is required" }
        if (!input.nameEn?.trim()) return { success: false, error: "English name is required" }

        const slugConflict = await prisma.postCategory.count({ where: { slug: input.slug.trim() } })
        if (slugConflict > 0) return { success: false, error: "Slug already exists" }

        const category = await prisma.postCategory.create({
            data: {
                slug: input.slug.trim(),
                nameEn: input.nameEn.trim(),
                nameAr: input.nameAr?.trim(),
                descEn: input.descEn?.trim(),
                descAr: input.descAr?.trim(),
                parentId: input.parentId ?? null,
            },
            include: categoryInclude,
        })

        await logAdminAction({
            action: "CREATE_CATEGORY",
            entity: "PostCategory",
            entityId: category.id,
            changes: { slug: category.slug, nameEn: category.nameEn },
        })

        revalidateCategories()
        return { success: true, data: serializeCategory(category) }
    } catch (err) {
        console.error("[createCategory]", err)
        return { success: false, error: "Failed to create category" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// E4. UPDATE CATEGORY
// ─────────────────────────────────────────────────────────────────────────────

export async function updateCategory(
    id: string,
    input: UpdateCategoryInput,
): Promise<ActionResult<any>> {
    try {
        await requireAdmin()

        const existing = await prisma.postCategory.findUnique({ where: { id } })
        if (!existing) return { success: false, error: "Category not found" }

        if (input.slug && input.slug.trim() !== existing.slug) {
            const conflict = await prisma.postCategory.count({
                where: { slug: input.slug.trim(), id: { not: id } },
            })
            if (conflict > 0) return { success: false, error: "Slug already in use" }
        }

        // Prevent circular parent reference
        if (input.parentId === id) return { success: false, error: "Category cannot be its own parent" }

        const updated = await prisma.postCategory.update({
            where: { id },
            data: {
                ...(input.slug !== undefined && { slug: input.slug.trim() }),
                ...(input.nameEn !== undefined && { nameEn: input.nameEn.trim() }),
                ...(input.nameAr !== undefined && { nameAr: input.nameAr?.trim() ?? null }),
                ...(input.descEn !== undefined && { descEn: input.descEn?.trim() ?? null }),
                ...(input.descAr !== undefined && { descAr: input.descAr?.trim() ?? null }),
                ...(input.parentId !== undefined && { parentId: input.parentId ?? null }),
            },
            include: categoryInclude,
        })

        await logAdminAction({
            action: "UPDATE_CATEGORY",
            entity: "PostCategory",
            entityId: id,
            changes: input as Record<string, unknown>,
        })

        revalidateCategories()
        return { success: true, data: serializeCategory(updated) }
    } catch (err) {
        console.error("[updateCategory]", err)
        return { success: false, error: "Failed to update category" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// E5. DELETE CATEGORY
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteCategory(id: string): Promise<ActionResult<{ ok: boolean }>> {
    try {
        await requireAdmin()

        const cat = await prisma.postCategory.findUnique({
            where: { id },
            include: { _count: { select: { posts: true, children: true } } },
        })
        if (!cat) return { success: false, error: "Category not found" }
        if (cat._count.posts > 0) return { success: false, error: `Cannot delete: ${cat._count.posts} post(s) use this category` }
        if (cat._count.children > 0) return { success: false, error: `Cannot delete: ${cat._count.children} sub-categor(ies) exist` }

        await prisma.postCategory.delete({ where: { id } })
        await logAdminAction({ action: "DELETE_CATEGORY", entity: "PostCategory", entityId: id, changes: { slug: cat.slug } })
        revalidateCategories()
        return { success: true, data: { ok: true } }
    } catch (err) {
        console.error("[deleteCategory]", err)
        return { success: false, error: "Failed to delete category" }
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION F: TAGS ──────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// F1. GET ALL TAGS
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllTags(includePostCount = true): Promise<ActionResult<any[]>> {
    try {
        await requireAdmin()

        const tags = await prisma.postTag.findMany({
            include: includePostCount ? { _count: { select: { posts: true } } } : undefined,
            orderBy: { nameEn: "asc" },
        })

        return { success: true, data: tags.map(serializeTag) }
    } catch (err) {
        console.error("[getAllTags]", err)
        return { success: false, error: "Failed to fetch tags" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// F2. CREATE TAG
// ─────────────────────────────────────────────────────────────────────────────

export async function createTag(input: CreateTagInput): Promise<ActionResult<any>> {
    try {
        await requireAdmin()

        if (!input.slug?.trim()) return { success: false, error: "Slug is required" }
        if (!input.nameEn?.trim()) return { success: false, error: "English name is required" }

        const slugConflict = await prisma.postTag.count({ where: { slug: input.slug.trim() } })
        if (slugConflict > 0) return { success: false, error: "Tag slug already exists" }

        const tag = await prisma.postTag.create({
            data: {
                slug: input.slug.trim(),
                nameEn: input.nameEn.trim(),
                nameAr: input.nameAr?.trim(),
            },
        })

        await logAdminAction({
            action: "CREATE_TAG",
            entity: "PostTag",
            entityId: tag.id,
            changes: { slug: tag.slug, nameEn: tag.nameEn },
        })

        revalidateTags()
        return { success: true, data: serializeTag(tag) }
    } catch (err) {
        console.error("[createTag]", err)
        return { success: false, error: "Failed to create tag" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// F3. UPDATE TAG
// ─────────────────────────────────────────────────────────────────────────────

export async function updateTag(id: string, input: UpdateTagInput): Promise<ActionResult<any>> {
    try {
        await requireAdmin()

        const existing = await prisma.postTag.findUnique({ where: { id } })
        if (!existing) return { success: false, error: "Tag not found" }

        if (input.slug && input.slug.trim() !== existing.slug) {
            const conflict = await prisma.postTag.count({
                where: { slug: input.slug.trim(), id: { not: id } },
            })
            if (conflict > 0) return { success: false, error: "Slug already in use" }
        }

        const updated = await prisma.postTag.update({
            where: { id },
            data: {
                ...(input.slug !== undefined && { slug: input.slug.trim() }),
                ...(input.nameEn !== undefined && { nameEn: input.nameEn.trim() }),
                ...(input.nameAr !== undefined && { nameAr: input.nameAr?.trim() ?? null }),
            },
        })

        await logAdminAction({ action: "UPDATE_TAG", entity: "PostTag", entityId: id, changes: input as Record<string, unknown> })
        revalidateTags()
        return { success: true, data: serializeTag(updated) }
    } catch (err) {
        console.error("[updateTag]", err)
        return { success: false, error: "Failed to update tag" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// F4. DELETE TAG
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteTag(id: string): Promise<ActionResult<{ ok: boolean }>> {
    try {
        await requireAdmin()

        const tag = await prisma.postTag.findUnique({
            where: { id },
            include: { _count: { select: { posts: true } } },
        })
        if (!tag) return { success: false, error: "Tag not found" }
        if (tag._count.posts > 0) return { success: false, error: `Cannot delete: ${tag._count.posts} post(s) use this tag` }

        await prisma.postTag.delete({ where: { id } })
        await logAdminAction({ action: "DELETE_TAG", entity: "PostTag", entityId: id, changes: { slug: tag.slug } })
        revalidateTags()
        return { success: true, data: { ok: true } }
    } catch (err) {
        console.error("[deleteTag]", err)
        return { success: false, error: "Failed to delete tag" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// F5. MERGE TAGS (move all posts from sourceId to targetId, then delete source)
// ─────────────────────────────────────────────────────────────────────────────

export async function mergeTags(
    sourceId: string,
    targetId: string,
): Promise<ActionResult<{ movedCount: number }>> {
    try {
        await requireAdmin()
        if (sourceId === targetId) return { success: false, error: "Cannot merge a tag with itself" }

        // FIX: Move all queries inside transaction to prevent race conditions
        const result = await prisma.$transaction(async (tx) => {
            const [source, target] = await Promise.all([
                tx.postTag.findUnique({ where: { id: sourceId } }),
                tx.postTag.findUnique({ where: { id: targetId } }),
            ])
            if (!source) throw new Error("Source tag not found")
            if (!target) throw new Error("Target tag not found")

            // Find posts that have source tag but NOT target tag
            const sourcePivots = await tx.postTagOnPost.findMany({
                where: { tagId: sourceId },
                select: { postId: true },
            })

            const existingTargetPostIds = new Set(
                (await tx.postTagOnPost.findMany({
                    where: { tagId: targetId },
                    select: { postId: true },
                })).map((p) => p.postId),
            )

            const toCreate = sourcePivots.filter((p) => !existingTargetPostIds.has(p.postId))

            await Promise.all([
                // Create new pivots for posts that don't already have the target tag
                toCreate.length > 0 
                    ? tx.postTagOnPost.createMany({
                        data: toCreate.map((p) => ({ postId: p.postId, tagId: targetId })),
                        skipDuplicates: true,
                    })
                    : Promise.resolve(),
                // Delete all source pivots
                tx.postTagOnPost.deleteMany({ where: { tagId: sourceId } }),
                // Delete the source tag
                tx.postTag.delete({ where: { id: sourceId } }),
            ])

            return { source, target, movedCount: toCreate.length }
        })

        await logAdminAction({
            action: "MERGE_TAGS",
            entity: "PostTag",
            entityId: targetId,
            changes: { 
                sourceId, 
                sourceSlug: result.source.slug, 
                targetSlug: result.target.slug, 
                movedCount: result.movedCount 
            },
        })

        revalidateTags()
        revalidatePosts()
        return { success: true, data: { movedCount: result.movedCount } }
    } catch (err) {
        console.error("[mergeTags]", err)
        return { success: false, error: "Failed to merge tags" }
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION G: COMMENTS (moderation) ────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const commentInclude = {
    author: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
    replies: {
        include: {
            author: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
            reactions: true,
            _count: { select: { replies: true } },
        },
        orderBy: { createdAt: "asc" as Prisma.SortOrder },
    },
    reactions: true,
    _count: { select: { replies: true, reactions: true } },
} satisfies Prisma.CommentInclude

// ─────────────────────────────────────────────────────────────────────────────
// G1. GET COMMENTS FOR POST
// ─────────────────────────────────────────────────────────────────────────────

const listCommentsSchema = z.object({
    postId: z.string().min(1),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    includeDeleted: z.boolean().default(false),
    topLevelOnly: z.boolean().default(true),
})

export async function getPostComments(
    raw: z.infer<typeof listCommentsSchema>,
): Promise<ActionResult<{ comments: any[]; total: number; page: number; pages: number }>> {
    try {
        await requireAdmin()
        const { postId, page, limit, includeDeleted, topLevelOnly } = listCommentsSchema.parse(raw)

        const where: Prisma.CommentWhereInput = {
            postId,
            ...(topLevelOnly && { parentId: null }),
            ...(!includeDeleted && { isDeleted: false }),
        }

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where,
                include: commentInclude,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.comment.count({ where }),
        ])

        return {
            success: true,
            data: {
                comments: comments.map(serializeComment),
                total,
                page,
                pages: Math.ceil(total / limit),
            },
        }
    } catch (err) {
        console.error("[getPostComments]", err)
        return { success: false, error: "Failed to fetch comments" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// G2. GET ALL COMMENTS ACROSS BLOG (for moderation dashboard)
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllComments(opts: {
    page?: number
    limit?: number
    includeDeleted?: boolean
    search?: string
}): Promise<ActionResult<{ comments: any[]; total: number }>> {
    try {
        await requireAdmin()
        const { page = 1, limit = 30, includeDeleted = false, search = "" } = opts

        const where: Prisma.CommentWhereInput = {
            ...(!includeDeleted && { isDeleted: false }),
            ...(search.trim() && { content: { contains: search, mode: "insensitive" } }),
        }

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where,
                include: {
                    author: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
                    post: { select: { id: true, titleEn: true, titleAr: true, slugEn: true } },
                    _count: { select: { replies: true, reactions: true } },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.comment.count({ where }),
        ])

        return {
            success: true,
            data: {
                comments: comments.map(serializeComment),
                total,
            },
        }
    } catch (err) {
        console.error("[getAllComments]", err)
        return { success: false, error: "Failed to fetch comments" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// G3. SOFT DELETE COMMENT (moderation)
// ─────────────────────────────────────────────────────────────────────────────

export async function moderateDeleteComment(
    commentId: string,
): Promise<ActionResult<{ ok: boolean }>> {
    try {
        await requireAdmin()

        const comment = await prisma.comment.findUnique({ where: { id: commentId } })
        if (!comment) return { success: false, error: "Comment not found" }
        if (comment.isDeleted) return { success: false, error: "Comment already deleted" }

        await prisma.comment.update({
            where: { id: commentId },
            data: { isDeleted: true, deletedAt: new Date(), content: "[Removed by moderator]" },
        })

        await logAdminAction({ action: "MODERATE_DELETE_COMMENT", entity: "Comment", entityId: commentId, changes: { postId: comment.postId } })
        revalidatePosts()
        return { success: true, data: { ok: true } }
    } catch (err) {
        console.error("[moderateDeleteComment]", err)
        return { success: false, error: "Failed to delete comment" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// G4. RESTORE COMMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function restoreComment(commentId: string): Promise<ActionResult<{ ok: boolean }>> {
    try {
        await requireAdmin()

        const comment = await prisma.comment.findUnique({ where: { id: commentId } })
        if (!comment) return { success: false, error: "Comment not found" }
        if (!comment.isDeleted) return { success: false, error: "Comment is not deleted" }

        await prisma.comment.update({
            where: { id: commentId },
            data: { isDeleted: false, deletedAt: null },
        })

        await logAdminAction({ action: "RESTORE_COMMENT", entity: "Comment", entityId: commentId })
        revalidatePosts()
        return { success: true, data: { ok: true } }
    } catch (err) {
        console.error("[restoreComment]", err)
        return { success: false, error: "Failed to restore comment" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// G5. HARD DELETE COMMENT (+ all replies cascade via schema)
// ─────────────────────────────────────────────────────────────────────────────

export async function hardDeleteComment(commentId: string): Promise<ActionResult<{ ok: boolean }>> {
    try {
        await requireAdmin()

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { id: true, postId: true },
        })
        if (!comment) return { success: false, error: "Comment not found" }

        await prisma.comment.delete({ where: { id: commentId } })
        await logAdminAction({ action: "HARD_DELETE_COMMENT", entity: "Comment", entityId: commentId, changes: { postId: comment.postId } })
        revalidatePosts()
        return { success: true, data: { ok: true } }
    } catch (err) {
        console.error("[hardDeleteComment]", err)
        return { success: false, error: "Failed to permanently delete comment" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// G6. ADMIN POST COMMENT (admin adds a comment as themselves)
// ─────────────────────────────────────────────────────────────────────────────

export async function adminPostComment(opts: {
    postId: string
    content: string
    parentId?: string
}): Promise<ActionResult<any>> {
    try {
        const adminId = await requireAdmin()
        if (!opts.content.trim()) return { success: false, error: "Comment content is required" }

        const post = await prisma.post.findUnique({ where: { id: opts.postId }, select: { id: true, isDeleted: true } })
        if (!post) return { success: false, error: "Post not found" }
        if (post.isDeleted) return { success: false, error: "Post is deleted" }

        // FIX: Validate parentId belongs to same post
        if (opts.parentId) {
            const parent = await prisma.comment.findUnique({
                where: { id: opts.parentId },
                select: { postId: true }
            })
            if (!parent || parent.postId !== opts.postId) {
                return { success: false, error: "Invalid parent comment" }
            }
        }

        const comment = await prisma.comment.create({
            data: {
                postId: opts.postId,
                authorId: adminId,
                content: opts.content.trim(),
                parentId: opts.parentId ?? null,
            },
            include: commentInclude,
        })

        revalidatePosts()
        return { success: true, data: serializeComment(comment) }
    } catch (err) {
        console.error("[adminPostComment]", err)
        return { success: false, error: "Failed to post comment" }
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION H: REACTIONS ─────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// H1. GET REACTION SUMMARY FOR POST
// ─────────────────────────────────────────────────────────────────────────────

export async function getPostReactionSummary(postId: string): Promise<
    ActionResult<{ likes: number; dislikes: number; total: number }>
> {
    try {
        await requireAdmin()

        const [likes, dislikes] = await Promise.all([
            prisma.postReaction.count({ where: { postId, type: "LIKE" } }),
            prisma.postReaction.count({ where: { postId, type: "DISLIKE" } }),
        ])

        return { success: true, data: { likes, dislikes, total: likes + dislikes } }
    } catch (err) {
        console.error("[getPostReactionSummary]", err)
        return { success: false, error: "Failed to fetch reactions" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// H2. DELETE REACTION (admin can remove a specific reaction)
// ─────────────────────────────────────────────────────────────────────────────

export async function deletePostReaction(reactionId: string): Promise<ActionResult<{ ok: boolean }>> {
    try {
        await requireAdmin()

        const reaction = await prisma.postReaction.findUnique({ where: { id: reactionId } })
        if (!reaction) return { success: false, error: "Reaction not found" }

        await prisma.postReaction.delete({ where: { id: reactionId } })
        await logAdminAction({ action: "DELETE_POST_REACTION", entity: "PostReaction", entityId: reactionId })
        revalidatePosts()
        return { success: true, data: { ok: true } }
    } catch (err) {
        console.error("[deletePostReaction]", err)
        return { success: false, error: "Failed to delete reaction" }
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION I: GOOGLE ADS MANAGEMENT ────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export type UpsertAdInput = {
    placement: string
    adCodeEn?: string
    adCodeAr?: string
    adType?: string
    isActive?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// I1. GET ALL ADS
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllAds(): Promise<ActionResult<any[]>> {
    try {
        await requireAdmin()

        const ads = await prisma.googleAd.findMany({ orderBy: { placement: "asc" } })
        return {
            success: true,
            data: ads.map((ad) => ({
                ...ad,
                createdAt: ad.createdAt instanceof Date ? ad.createdAt.toISOString() : ad.createdAt,
                updatedAt: ad.updatedAt instanceof Date ? ad.updatedAt.toISOString() : ad.updatedAt,
            })),
        }
    } catch (err) {
        console.error("[getAllAds]", err)
        return { success: false, error: "Failed to fetch ads" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// I2. UPSERT AD (create or update by placement)
// ─────────────────────────────────────────────────────────────────────────────

export async function upsertAd(input: UpsertAdInput): Promise<ActionResult<any>> {
    try {
        await requireAdmin()

        if (!input.placement?.trim()) return { success: false, error: "Placement identifier is required" }

        const ad = await prisma.googleAd.upsert({
            where: { placement: input.placement.trim() },
            create: {
                placement: input.placement.trim(),
                adCodeEn: input.adCodeEn?.trim() ?? null,
                adCodeAr: input.adCodeAr?.trim() ?? null,
                adType: input.adType ?? "display",
                isActive: input.isActive ?? true,
            },
            update: {
                ...(input.adCodeEn !== undefined && { adCodeEn: input.adCodeEn?.trim() ?? null }),
                ...(input.adCodeAr !== undefined && { adCodeAr: input.adCodeAr?.trim() ?? null }),
                ...(input.adType !== undefined && { adType: input.adType }),
                ...(input.isActive !== undefined && { isActive: input.isActive }),
            },
        })

        await logAdminAction({
            action: "UPSERT_AD",
            entity: "GoogleAd",
            entityId: ad.id,
            changes: { placement: ad.placement, isActive: ad.isActive },
        })

        return {
            success: true,
            data: {
                ...ad,
                createdAt: ad.createdAt instanceof Date ? ad.createdAt.toISOString() : ad.createdAt,
                updatedAt: ad.updatedAt instanceof Date ? ad.updatedAt.toISOString() : ad.updatedAt,
            },
        }
    } catch (err) {
        console.error("[upsertAd]", err)
        return { success: false, error: "Failed to save ad" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// I3. TOGGLE AD ACTIVE
// ─────────────────────────────────────────────────────────────────────────────

export async function toggleAdActive(id: string): Promise<ActionResult<{ isActive: boolean }>> {
    try {
        await requireAdmin()

        const ad = await prisma.googleAd.findUnique({ where: { id }, select: { id: true, isActive: true } })
        if (!ad) return { success: false, error: "Ad not found" }

        const updated = await prisma.googleAd.update({ where: { id }, data: { isActive: !ad.isActive } })
        await logAdminAction({ action: ad.isActive ? "DEACTIVATE_AD" : "ACTIVATE_AD", entity: "GoogleAd", entityId: id })
        return { success: true, data: { isActive: updated.isActive } }
    } catch (err) {
        console.error("[toggleAdActive]", err)
        return { success: false, error: "Failed to toggle ad" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// I4. DELETE AD
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteAd(id: string): Promise<ActionResult<{ ok: boolean }>> {
    try {
        await requireAdmin()

        const ad = await prisma.googleAd.findUnique({ where: { id }, select: { id: true, placement: true } })
        if (!ad) return { success: false, error: "Ad not found" }

        await prisma.googleAd.delete({ where: { id } })
        await logAdminAction({ action: "DELETE_AD", entity: "GoogleAd", entityId: id, changes: { placement: ad.placement } })
        return { success: true, data: { ok: true } }
    } catch (err) {
        console.error("[deleteAd]", err)
        return { success: false, error: "Failed to delete ad" }
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION J: SEO UTILITIES ─────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// J1. AUTO-GENERATE SEO FIELDS (fills missing metaTitle/Description from content)
// ─────────────────────────────────────────────────────────────────────────────

export async function autoFillSeoFields(
    id: string,
): Promise<ActionResult<{ ok: boolean; filled: string[] }>> {
    try {
        await requireAdmin()

        const post = await prisma.post.findUnique({
            where: { id },
            select: {
                titleEn: true,
                titleAr: true,
                excerptEn: true,
                excerptAr: true,
                metaTitleEn: true,
                metaTitleAr: true,
                metaDescriptionEn: true,
                metaDescriptionAr: true,
                ogImageUrl: true,
                images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
        })
        if (!post) return { success: false, error: "Post not found" }

        const updateData: Prisma.PostUpdateInput = {}
        const filled: string[] = []

        if (!post.metaTitleEn && post.titleEn) {
            updateData.metaTitleEn = post.titleEn.slice(0, 60)
            filled.push("metaTitleEn")
        }
        if (!post.metaTitleAr && post.titleAr) {
            updateData.metaTitleAr = post.titleAr.slice(0, 60)
            filled.push("metaTitleAr")
        }
        if (!post.metaDescriptionEn && post.excerptEn) {
            updateData.metaDescriptionEn = post.excerptEn.slice(0, 160)
            filled.push("metaDescriptionEn")
        }
        if (!post.metaDescriptionAr && post.excerptAr) {
            updateData.metaDescriptionAr = post.excerptAr.slice(0, 160)
            filled.push("metaDescriptionAr")
        }
        if (!post.ogImageUrl && post.images[0]?.url) {
            updateData.ogImageUrl = post.images[0].url
            filled.push("ogImageUrl")
        }

        if (filled.length > 0) {
            await prisma.post.update({ where: { id }, data: updateData })
            revalidatePosts()
        }

        return { success: true, data: { ok: true, filled } }
    } catch (err) {
        console.error("[autoFillSeoFields]", err)
        return { success: false, error: "Failed to auto-fill SEO fields" }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// J2. GENERATE SLUG FROM TITLE
// ─────────────────────────────────────────────────────────────────────────────

export async function generateUniqueSlug(
    title: string,
    locale: Locale = "en",
    excludeId?: string,
): Promise<ActionResult<{ slug: string }>> {
    try {
        await requireAdmin()

        // Basic slug generation
        const base = title
            .toLowerCase()
            .trim()
            .replace(/[\s_]+/g, "-")
            .replace(/[^\w\-\u0600-\u06FF]/g, "") // keep latin, arabic, hyphens
            .replace(/--+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 80)

        const slug = await generateUniqueSlugSafe(base, locale, excludeId)

        return { success: true, data: { slug } }
    } catch (err) {
        console.error("[generateUniqueSlug]", err)
        return { success: false, error: "Failed to generate slug" }
    }
}