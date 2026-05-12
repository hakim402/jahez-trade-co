"use server"

// app/[locale]/(pages)/blogs/actions.ts
//
// Public-facing server actions for the blog system.
// Rules:
//  • Only PUBLISHED, non-deleted posts are ever exposed.
//  • All bilingual fields are resolved to the requested locale with
//    automatic fallback to English when the Arabic value is absent.
//  • Auth (Clerk) is optional for read actions, required for mutations
//    (reactions, comments). Clients are never allowed to moderate.
//  • Every mutating action revalidates only what it touches to keep
//    ISR as aggressive as possible.

import { revalidatePath, revalidateTag } from "next/cache"
import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Prisma, ReactionType } from "@prisma/client"

// ─────────────────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────────────────

export type Locale = "en" | "ar"

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the internal DB user id (not Clerk id) for the signed-in user.
 *  Throws a friendly string if the user is not authenticated or not found. */
async function requireAuthUser(): Promise<string> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("You must be signed in to do that.")

  const user = await prisma.user.findUnique({
    where: { clerkId, isDeleted: false },
    select: { id: true, isActive: true },
  })
  if (!user) throw new Error("User account not found.")
  if (!user.isActive) throw new Error("Your account has been suspended.")

  return user.id
}

/** Returns { userId, dbUserId } — both nullable — so read actions can
 *  optionally attach per-user state (e.g. "did I react to this post?"). */
async function getOptionalAuth(): Promise<{
  clerkId: string | null
  dbUserId: string | null
}> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { clerkId: null, dbUserId: null }

    const user = await prisma.user.findUnique({
      where: { clerkId, isDeleted: false, isActive: true },
      select: { id: true },
    })
    return { clerkId, dbUserId: user?.id ?? null }
  } catch {
    return { clerkId: null, dbUserId: null }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Locale-aware field resolver
// ─────────────────────────────────────────────────────────────────────────────

/** Picks the localised value of a bilingual field, falling back to English. */
function l<T>(enVal: T, arVal: T | null | undefined, locale: Locale): T {
  if (locale === "ar" && arVal != null && arVal !== "") return arVal
  return enVal
}

// ─────────────────────────────────────────────────────────────────────────────
// Serialisation helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Strips raw Date objects so Next.js can safely pass the result across
 *  the server → client boundary without "non-serialisable" warnings. */
function toISO(d: Date | string | null | undefined): string | null {
  if (!d) return null
  return d instanceof Date ? d.toISOString() : d
}

// ─────────────────────────────────────────────────────────────────────────────
// Revalidation helpers
// ─────────────────────────────────────────────────────────────────────────────

function revalidateBlogList(locale?: Locale) {
  revalidatePath(`/en/blog`)
  revalidatePath(`/ar/blog`)
  if (locale) revalidatePath(`/${locale}/blog`)
}

function revalidateBlogPost(slugEn: string, slugAr?: string | null) {
  revalidatePath(`/en/blog/${slugEn}`)
  if (slugAr) revalidatePath(`/ar/blog/${slugAr}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Prisma include shapes (shared across read actions)
// ─────────────────────────────────────────────────────────────────────────────

const publicPostListInclude = {
  author: {
    select: { id: true, fullName: true, avatarUrl: true },
  },
  category: {
    select: { id: true, slug: true, nameEn: true, nameAr: true },
  },
  images: {
    where: { isPrimary: true },
    take: 1,
    select: { url: true, altText: true },
  },
  tags: {
    include: {
      tag: { select: { id: true, slug: true, nameEn: true, nameAr: true } },
    },
  },
  _count: { select: { comments: { where: { isDeleted: false } }, reactions: true } },
} satisfies Prisma.PostInclude


const publicPostDetailInclude = {
  author: {
    select: { id: true, fullName: true, avatarUrl: true },
  },
  category: {
    select: { id: true, slug: true, nameEn: true, nameAr: true, descEn: true, descAr: true },
  },
  images: {
    orderBy: [
      { isPrimary: "desc" as Prisma.SortOrder },
      { sortOrder: "asc" as Prisma.SortOrder },
    ],
    select: { id: true, url: true, altText: true, isPrimary: true, sortOrder: true },
  },
  videos: {
    orderBy: { sortOrder: "asc" as Prisma.SortOrder },
    select: { id: true, url: true, sortOrder: true },
  },
  tags: {
    include: {
      tag: { select: { id: true, slug: true, nameEn: true, nameAr: true } },
    },
  },
  _count: {
    select: { comments: { where: { isDeleted: false } }, reactions: true },
  },
} satisfies Prisma.PostInclude

// ─────────────────────────────────────────────────────────────────────────────
// Shared where-clause: always restrict to public-visible posts
// ─────────────────────────────────────────────────────────────────────────────

const publicPostBase: Prisma.PostWhereInput = {
  status: "PUBLISHED",
  isDeleted: false,
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION A: POSTS – PUBLIC READ ───────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// A1. GET PUBLISHED POSTS (paginated, filtered, locale-aware)
// ─────────────────────────────────────────────────────────────────────────────

const listPublicPostsSchema = z.object({
  locale: z.enum(["en", "ar"]).default("en"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(12),
  search: z.string().default(""),
  categorySlug: z.string().optional(),
  tagSlug: z.string().optional(),
  authorId: z.string().optional(),
  sortBy: z
    .enum(["publishedAt", "createdAt", "viewCount", "titleEn"])
    .default("publishedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export type ListPublicPostsInput = z.infer<typeof listPublicPostsSchema>

export async function getPublishedPosts(
  raw: Partial<ListPublicPostsInput> = {},
): Promise<
  ActionResult<{
    posts: PublicPostCard[]
    total: number
    page: number
    limit: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }>
> {
  try {
    const {
      locale,
      page,
      limit,
      search,
      categorySlug,
      tagSlug,
      authorId,
      sortBy,
      sortOrder,
    } = listPublicPostsSchema.parse(raw)

    const skip = (page - 1) * limit
    const where: Prisma.PostWhereInput = { ...publicPostBase }

    if (categorySlug) {
      where.category = { slug: categorySlug }
    }
    if (tagSlug) {
      where.tags = { some: { tag: { slug: tagSlug } } }
    }
    if (authorId) {
      where.authorId = authorId
    }
    if (search.trim()) {
      // Search both languages so users typing in either script get results
      where.OR = [
        { titleEn: { contains: search, mode: "insensitive" } },
        { titleAr: { contains: search, mode: "insensitive" } },
        { excerptEn: { contains: search, mode: "insensitive" } },
        { excerptAr: { contains: search, mode: "insensitive" } },
      ]
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: publicPostListInclude,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ])

    return {
      success: true,
      data: {
        posts: posts.map((p) => serializePostCard(p, locale)),
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    }
  } catch (err) {
    console.error("[getPublishedPosts]", err)
    return { success: false, error: "Failed to load posts." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A2. GET SINGLE POST BY SLUG (locale-aware, increments view count)
// ─────────────────────────────────────────────────────────────────────────────

export async function getPostBySlug(
  slug: string,
  locale: Locale = "en",
): Promise<ActionResult<PublicPostDetail>> {
  try {
    // Build a locale-specific where clause but also accept the opposite
    // language slug so deep-links never hard-404.
    const where: Prisma.PostWhereInput = {
      ...publicPostBase,
      OR:
        locale === "ar"
          ? [{ slugAr: slug }, { slugEn: slug }]
          : [{ slugEn: slug }, { slugAr: slug }],
    }

    const post = await prisma.post.findFirst({
      where,
      include: publicPostDetailInclude,
    })

    if (!post) return { success: false, error: "Post not found." }

    // Fire-and-forget view count increment (no await so it doesn't slow SSR)
    prisma.post
      .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {/* non-critical */ })

    const { dbUserId } = await getOptionalAuth()
    const userReaction = dbUserId
      ? await prisma.postReaction.findUnique({
        where: { postId_userId: { postId: post.id, userId: dbUserId } },
        select: { type: true },
      })
      : null

    return { success: true, data: serializePostDetail(post, locale, userReaction?.type ?? null) }
  } catch (err) {
    console.error("[getPostBySlug]", err)
    return { success: false, error: "Failed to load post." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A3. GET RELATED POSTS (same category or overlapping tags, excludes current)
// ─────────────────────────────────────────────────────────────────────────────

export async function getRelatedPosts(
  postId: string,
  locale: Locale = "en",
  limit = 4,
): Promise<ActionResult<PublicPostCard[]>> {
  try {
    const source = await prisma.post.findFirst({
      where: { ...publicPostBase, id: postId },
      select: {
        categoryId: true,
        tags: { select: { tagId: true } },
      },
    }) as { categoryId: string | null; tags: { tagId: string }[] } | null
    if (!source) return { success: true, data: [] }

    const tagIds = source.tags.map((t) => t.tagId)

    const posts = await prisma.post.findMany({
      where: {
        ...publicPostBase,
        id: { not: postId },
        OR: [
          ...(source.categoryId ? [{ categoryId: source.categoryId }] : []),
          ...(tagIds.length ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
        ],
      },
      include: publicPostListInclude,
      orderBy: { publishedAt: "desc" },
      take: limit,
    })

    return { success: true, data: posts.map((p) => serializePostCard(p, locale)) }
  } catch (err) {
    console.error("[getRelatedPosts]", err)
    return { success: false, error: "Failed to load related posts." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A4. GET FEATURED / LATEST POSTS (for homepage hero sections)
// ─────────────────────────────────────────────────────────────────────────────

export async function getFeaturedPosts(
  locale: Locale = "en",
  limit = 6,
): Promise<ActionResult<PublicPostCard[]>> {
  try {
    const posts = await prisma.post.findMany({
      where: publicPostBase,
      include: publicPostListInclude,
      orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
      take: limit,
    })
    return { success: true, data: posts.map((p) => serializePostCard(p, locale)) }
  } catch (err) {
    console.error("[getFeaturedPosts]", err)
    return { success: false, error: "Failed to load featured posts." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A5. GET POST METADATA ONLY (for <head> / generateMetadata usage)
// ─────────────────────────────────────────────────────────────────────────────

export async function getPostMeta(
  slug: string,
  locale: Locale = "en",
): Promise<
  ActionResult<{
    title: string
    description: string | null
    ogImageUrl: string | null
    ogImageAlt: string | null
    canonicalUrl: string | null
    twitterCard: string | null
    publishedAt: string | null
    author: string | null
    slugEn: string
    slugAr: string | null
  }>
> {
  try {
    const post = await prisma.post.findFirst({
      where: {
        ...publicPostBase,
        OR:
          locale === "ar"
            ? [{ slugAr: slug }, { slugEn: slug }]
            : [{ slugEn: slug }, { slugAr: slug }],
      },
      select: {
        titleEn: true,
        titleAr: true,
        metaTitleEn: true,
        metaTitleAr: true,
        metaDescriptionEn: true,
        metaDescriptionAr: true,
        ogImageUrl: true,
        ogImageAltEn: true,
        ogImageAltAr: true,
        canonicalUrl: true,
        twitterCard: true,
        publishedAt: true,
        slugEn: true,
        slugAr: true,
        author: { select: { fullName: true } },
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    })
    if (!post) return { success: false, error: "Post not found." }

    return {
      success: true,
      data: {
        title: l(post.metaTitleEn ?? post.titleEn, post.metaTitleAr ?? post.titleAr, locale),
        description: l(post.metaDescriptionEn, post.metaDescriptionAr, locale),
        ogImageUrl: post.ogImageUrl ?? post.images[0]?.url ?? null,
        ogImageAlt: l(post.ogImageAltEn, post.ogImageAltAr, locale),
        canonicalUrl: post.canonicalUrl,
        twitterCard: post.twitterCard,
        publishedAt: toISO(post.publishedAt),
        author: post.author.fullName ?? null,
        slugEn: post.slugEn,
        slugAr: post.slugAr ?? null,
      },
    }
  } catch (err) {
    console.error("[getPostMeta]", err)
    return { success: false, error: "Failed to load post metadata." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION B: CATEGORIES & TAGS – PUBLIC READ ───────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// B1. GET ALL CATEGORIES (with published post counts)
// ─────────────────────────────────────────────────────────────────────────────

export async function getPublicCategories(
  locale: Locale = "en",
): Promise<ActionResult<PublicCategory[]>> {
  try {
    const categories = await prisma.postCategory.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: publicPostBase,
            },
          },
        },
        children: {
          select: {
            id: true,
            slug: true,
            nameEn: true,
            nameAr: true,
            _count: {
              select: {
                posts: { where: publicPostBase },
              },
            },
          },
        },
        parent: {
          select: { id: true, slug: true, nameEn: true, nameAr: true },
        },
      },
      orderBy: { nameEn: "asc" },
      where: { parentId: null }, // top-level first; children are nested
    })

    const serialize = (cat: any): PublicCategory => ({
      id: cat.id,
      slug: cat.slug,
      name: l(cat.nameEn, cat.nameAr, locale),
      description: l(cat.descEn ?? null, cat.descAr ?? null, locale),
      postCount: cat._count.posts,
      parent: cat.parent
        ? { id: cat.parent.id, slug: cat.parent.slug, name: l(cat.parent.nameEn, cat.parent.nameAr, locale) }
        : null,
      children: (cat.children ?? []).map((c: any) => ({
        id: c.id,
        slug: c.slug,
        name: l(c.nameEn, c.nameAr, locale),
        description: null,
        postCount: c._count.posts,
        parent: null,
        children: [],
      })),
    })

    return { success: true, data: categories.map(serialize) }
  } catch (err) {
    console.error("[getPublicCategories]", err)
    return { success: false, error: "Failed to load categories." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B2. GET ALL TAGS (with published post counts)
// ─────────────────────────────────────────────────────────────────────────────

export async function getPublicTags(
  locale: Locale = "en",
): Promise<ActionResult<PublicTag[]>> {
  try {
    const tags = await prisma.postTag.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: { post: publicPostBase },
            },
          },
        },
      },
      orderBy: { nameEn: "asc" },
    })

    const data: PublicTag[] = tags
      .filter((t) => t._count.posts > 0) // only show tags with live posts
      .map((t) => ({
        id: t.id,
        slug: t.slug,
        name: l(t.nameEn, t.nameAr, locale),
        postCount: t._count.posts,
      }))

    return { success: true, data }
  } catch (err) {
    console.error("[getPublicTags]", err)
    return { success: false, error: "Failed to load tags." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION C: COMMENTS – PUBLIC READ & WRITE ────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const getCommentsSchema = z.object({
  postId: z.string().min(1),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export type GetCommentsInput = z.infer<typeof getCommentsSchema>

// ─────────────────────────────────────────────────────────────────────────────
// C1. GET THREADED COMMENTS FOR A POST
// ─────────────────────────────────────────────────────────────────────────────

export async function getPostComments(
  raw: GetCommentsInput,
): Promise<
  ActionResult<{
    comments: PublicComment[]
    total: number
    page: number
    pages: number
    hasNext: boolean
  }>
> {
  try {
    const { postId, page, limit, sortOrder } = getCommentsSchema.parse(raw)
    const { dbUserId } = await getOptionalAuth()

    // Verify the post is public
    const post = await prisma.post.findFirst({
      where: { id: postId, ...publicPostBase },
      select: { id: true },
    })
    if (!post) return { success: false, error: "Post not found." }

    const where: Prisma.CommentWhereInput = {
      postId,
      parentId: null, // top-level only; replies fetched recursively below
      isDeleted: false,
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          author: { select: { id: true, fullName: true, avatarUrl: true } },
          reactions: dbUserId
            ? { where: { userId: dbUserId }, select: { type: true } }
            : false,
          _count: {
            select: {
              replies: { where: { isDeleted: false } },
              reactions: true,
            },
          },
          replies: {
            where: { isDeleted: false },
            include: {
              author: { select: { id: true, fullName: true, avatarUrl: true } },
              reactions: dbUserId
                ? { where: { userId: dbUserId }, select: { type: true } }
                : false,
              _count: { select: { reactions: true } },
              replies: {
                // One more level deep (grandchildren) for typical 3-level threading
                where: { isDeleted: false },
                include: {
                  author: { select: { id: true, fullName: true, avatarUrl: true } },
                  reactions: dbUserId
                    ? { where: { userId: dbUserId }, select: { type: true } }
                    : false,
                  _count: { select: { reactions: true } },
                },
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ])

    const serializeComment = (c: any): PublicComment => ({
      id: c.id,
      content: c.content,
      createdAt: toISO(c.createdAt)!,
      updatedAt: toISO(c.updatedAt),
      author: {
        id: c.author.id,
        fullName: c.author.fullName ?? "Anonymous",
        avatarUrl: c.author.avatarUrl ?? null,
      },
      reactionCount: c._count?.reactions ?? 0,
      replyCount: c._count?.replies ?? 0,
      myReaction: (c.reactions?.[0]?.type ?? null) as ReactionType | null,
      replies: (c.replies ?? []).map(serializeComment),
    })

    return {
      success: true,
      data: {
        comments: comments.map(serializeComment),
        total,
        page,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    }
  } catch (err) {
    console.error("[getPostComments]", err)
    return { success: false, error: "Failed to load comments." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C2. CREATE COMMENT (auth required)
// ─────────────────────────────────────────────────────────────────────────────

const createCommentSchema = z.object({
  postId: z.string().min(1),
  content: z
    .string()
    .min(1, "Comment cannot be empty.")
    .max(2000, "Comment is too long (max 2 000 characters)."),
  parentId: z.string().optional(),
  locale: z.enum(["en", "ar"]).default("en"),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>

export async function createComment(
  raw: CreateCommentInput,
): Promise<ActionResult<PublicComment>> {
  try {
    const dbUserId = await requireAuthUser()
    const { postId, content, parentId, locale } = createCommentSchema.parse(raw)

    // Verify the post exists and is public
    const post = await prisma.post.findFirst({
      where: { id: postId, ...publicPostBase },
      select: { id: true, slugEn: true, slugAr: true },
    })
    if (!post) return { success: false, error: "Post not found or not available." }

    // If replying, verify the parent comment belongs to this post
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId, postId, isDeleted: false },
        select: { id: true, parentId: true },
      })
      if (!parent) return { success: false, error: "Parent comment not found." }
      // Prevent replying to a reply (enforce max 2-level threading on write)
      if (parent.parentId) {
        return {
          success: false,
          error: "Replies to replies are not supported. Reply to the top-level comment instead.",
        }
      }
    }

    // Basic rate-limit: max 10 comments per user per post per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentCount = await prisma.comment.count({
      where: { postId, authorId: dbUserId, createdAt: { gte: oneHourAgo } },
    })
    if (recentCount >= 10) {
      return { success: false, error: "You're commenting too fast. Please wait a moment." }
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: dbUserId,
        content: content.trim(),
        parentId: parentId ?? null,
      },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
        _count: { select: { reactions: true, replies: true } },
      },
    })

    revalidateBlogPost(post.slugEn, post.slugAr)

    return {
      success: true,
      data: {
        id: comment.id,
        content: comment.content,
        createdAt: toISO(comment.createdAt)!,
        updatedAt: toISO(comment.updatedAt),
        author: {
          id: comment.author.id,
          fullName: comment.author.fullName ?? "Anonymous",
          avatarUrl: comment.author.avatarUrl ?? null,
        },
        reactionCount: 0,
        replyCount: 0,
        myReaction: null,
        replies: [],
      },
    }
  } catch (err) {
    if (err instanceof Error) {
      // Surface user-facing messages from requireAuthUser / schema parsing
      return { success: false, error: err.message }
    }
    console.error("[createComment]", err)
    return { success: false, error: "Failed to post comment." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C3. UPDATE OWN COMMENT (auth required, only the author may edit)
// ─────────────────────────────────────────────────────────────────────────────

export async function updateComment(
  commentId: string,
  content: string,
): Promise<ActionResult<{ id: string; content: string; updatedAt: string }>> {
  try {
    const dbUserId = await requireAuthUser()

    const parsed = z
      .string()
      .min(1, "Comment cannot be empty.")
      .max(2000, "Too long.")
      .parse(content)

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, isDeleted: true, post: { select: { slugEn: true, slugAr: true } } },
    })
    if (!comment) return { success: false, error: "Comment not found." }
    if (comment.isDeleted) return { success: false, error: "Cannot edit a deleted comment." }
    if (comment.authorId !== dbUserId) return { success: false, error: "You can only edit your own comments." }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: parsed.trim() },
      select: { id: true, content: true, updatedAt: true },
    })

    revalidateBlogPost(comment.post.slugEn, comment.post.slugAr)

    return {
      success: true,
      data: {
        id: updated.id,
        content: updated.content,
        updatedAt: toISO(updated.updatedAt)!,
      },
    }
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message }
    console.error("[updateComment]", err)
    return { success: false, error: "Failed to update comment." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C4. SOFT-DELETE OWN COMMENT (auth required)
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteOwnComment(
  commentId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const dbUserId = await requireAuthUser()

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, isDeleted: true, post: { select: { slugEn: true, slugAr: true } } },
    })
    if (!comment) return { success: false, error: "Comment not found." }
    if (comment.isDeleted) return { success: false, error: "Comment is already deleted." }
    if (comment.authorId !== dbUserId) return { success: false, error: "You can only delete your own comments." }

    await prisma.comment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: "[Deleted by author]",
      },
    })

    revalidateBlogPost(comment.post.slugEn, comment.post.slugAr)
    return { success: true, data: { ok: true } }
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message }
    console.error("[deleteOwnComment]", err)
    return { success: false, error: "Failed to delete comment." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION D: REACTIONS – POST & COMMENT ────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// D1. TOGGLE POST REACTION  (LIKE / DISLIKE — one reaction per user per post)
//     • First call with a type  → creates the reaction
//     • Second call with same   → removes it (toggle off)
//     • Call with different     → switches type
// ─────────────────────────────────────────────────────────────────────────────

export async function togglePostReaction(
  postId: string,
  type: ReactionType,
): Promise<
  ActionResult<{
    likes: number
    dislikes: number
    myReaction: ReactionType | null
  }>
> {
  try {
    const dbUserId = await requireAuthUser()

    const post = await prisma.post.findFirst({
      where: { id: postId, ...publicPostBase },
      select: { id: true, slugEn: true, slugAr: true },
    })
    if (!post) return { success: false, error: "Post not found." }

    const existing = await prisma.postReaction.findUnique({
      where: { postId_userId: { postId, userId: dbUserId } },
    })

    if (!existing) {
      // No prior reaction → create
      await prisma.postReaction.create({ data: { postId, userId: dbUserId, type } })
    } else if (existing.type === type) {
      // Same reaction → remove (toggle off)
      await prisma.postReaction.delete({ where: { id: existing.id } })
    } else {
      // Different reaction → switch
      await prisma.postReaction.update({ where: { id: existing.id }, data: { type } })
    }

    // Return fresh counts
    const [likes, dislikes] = await Promise.all([
      prisma.postReaction.count({ where: { postId, type: "LIKE" } }),
      prisma.postReaction.count({ where: { postId, type: "DISLIKE" } }),
    ])

    const current = await prisma.postReaction.findUnique({
      where: { postId_userId: { postId, userId: dbUserId } },
      select: { type: true },
    })

    revalidateBlogPost(post.slugEn, post.slugAr)
    return {
      success: true,
      data: { likes, dislikes, myReaction: current?.type ?? null },
    }
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message }
    console.error("[togglePostReaction]", err)
    return { success: false, error: "Failed to update reaction." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// D2. TOGGLE COMMENT REACTION  (same toggle semantics as post reaction)
// ─────────────────────────────────────────────────────────────────────────────

export async function toggleCommentReaction(
  commentId: string,
  type: ReactionType,
): Promise<
  ActionResult<{
    total: number
    myReaction: ReactionType | null
  }>
> {
  try {
    const dbUserId = await requireAuthUser()

    const comment = await prisma.comment.findUnique({
      where: { id: commentId, isDeleted: false },
      select: { id: true },
    })
    if (!comment) return { success: false, error: "Comment not found." }

    const existing = await prisma.commentReaction.findUnique({
      where: { commentId_userId: { commentId, userId: dbUserId } },
    })

    if (!existing) {
      await prisma.commentReaction.create({ data: { commentId, userId: dbUserId, type } })
    } else if (existing.type === type) {
      await prisma.commentReaction.delete({ where: { id: existing.id } })
    } else {
      await prisma.commentReaction.update({ where: { id: existing.id }, data: { type } })
    }

    const total = await prisma.commentReaction.count({ where: { commentId } })
    const current = await prisma.commentReaction.findUnique({
      where: { commentId_userId: { commentId, userId: dbUserId } },
      select: { type: true },
    })

    return { success: true, data: { total, myReaction: current?.type ?? null } }
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message }
    console.error("[toggleCommentReaction]", err)
    return { success: false, error: "Failed to update reaction." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// D3. GET REACTION COUNTS (for optimistic UI hydration on page load)
// ─────────────────────────────────────────────────────────────────────────────

export async function getPostReactionCounts(
  postId: string,
): Promise<ActionResult<{ likes: number; dislikes: number; myReaction: ReactionType | null }>> {
  try {
    const { dbUserId } = await getOptionalAuth()

    const [likes, dislikes, myReaction] = await Promise.all([
      prisma.postReaction.count({ where: { postId, type: "LIKE" } }),
      prisma.postReaction.count({ where: { postId, type: "DISLIKE" } }),
      dbUserId
        ? prisma.postReaction.findUnique({
          where: { postId_userId: { postId, userId: dbUserId } },
          select: { type: true },
        })
        : Promise.resolve(null),
    ])

    return { success: true, data: { likes, dislikes, myReaction: myReaction?.type ?? null } }
  } catch (err) {
    console.error("[getPostReactionCounts]", err)
    return { success: false, error: "Failed to fetch reactions." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION E: ADS ───────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// E1. GET AD BY PLACEMENT (locale-aware — returns the correct code)
// ─────────────────────────────────────────────────────────────────────────────

export async function getAdByPlacement(
  placement: string,
  locale: Locale = "en",
): Promise<ActionResult<{ id: string; adCode: string | null; adType: string | null } | null>> {
  try {
    const ad = await prisma.googleAd.findUnique({
      where: { placement, isActive: true },
      select: { id: true, adCodeEn: true, adCodeAr: true, adType: true },
    })

    if (!ad) return { success: true, data: null }

    return {
      success: true,
      data: {
        id: ad.id,
        adCode: locale === "ar" ? (ad.adCodeAr ?? ad.adCodeEn) : ad.adCodeEn,
        adType: ad.adType,
      },
    }
  } catch (err) {
    console.error("[getAdByPlacement]", err)
    return { success: false, error: "Failed to load ad." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// E2. GET MULTIPLE ADS BY PLACEMENTS (batch fetch for layout components)
// ─────────────────────────────────────────────────────────────────────────────

export async function getAdsByPlacements(
  placements: string[],
  locale: Locale = "en",
): Promise<ActionResult<Record<string, { id: string; adCode: string | null; adType: string | null }>>> {
  try {
    if (!placements.length) return { success: true, data: {} }

    const ads = await prisma.googleAd.findMany({
      where: { placement: { in: placements }, isActive: true },
      select: { id: true, placement: true, adCodeEn: true, adCodeAr: true, adType: true },
    })

    const map: Record<string, { id: string; adCode: string | null; adType: string | null }> = {}
    for (const ad of ads) {
      map[ad.placement] = {
        id: ad.id,
        adCode: locale === "ar" ? (ad.adCodeAr ?? ad.adCodeEn) : ad.adCodeEn,
        adType: ad.adType,
      }
    }

    return { success: true, data: map }
  } catch (err) {
    console.error("[getAdsByPlacements]", err)
    return { success: false, error: "Failed to load ads." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION F: SITEMAP & RSS HELPERS ─────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// F1. GET ALL POST SLUGS (used for generateStaticParams / sitemap.xml)
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllPublicSlugs(): Promise<
  ActionResult<{ slugEn: string; slugAr: string | null; updatedAt: string }[]>
> {
  try {
    const posts = await prisma.post.findMany({
      where: publicPostBase,
      select: { slugEn: true, slugAr: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    })

    return {
      success: true,
      data: posts.map((p) => ({
        slugEn: p.slugEn,
        slugAr: p.slugAr ?? null,
        updatedAt: toISO(p.updatedAt)!,
      })),
    }
  } catch (err) {
    console.error("[getAllPublicSlugs]", err)
    return { success: false, error: "Failed to load slugs." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// F2. GET RSS FEED DATA
// ─────────────────────────────────────────────────────────────────────────────

export async function getRssFeedData(
  locale: Locale = "en",
  limit = 20,
): Promise<
  ActionResult<
    {
      title: string
      slug: string
      excerpt: string | null
      publishedAt: string | null
      author: string | null
      imageUrl: string | null
    }[]
  >
> {
  try {
    const posts = await prisma.post.findMany({
      where: publicPostBase,
      select: {
        titleEn: true,
        titleAr: true,
        slugEn: true,
        slugAr: true,
        excerptEn: true,
        excerptAr: true,
        publishedAt: true,
        author: { select: { fullName: true } },
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
    })

    return {
      success: true,
      data: posts.map((p) => ({
        title: l(p.titleEn, p.titleAr, locale),
        slug: l(p.slugEn, p.slugAr, locale),
        excerpt: l(p.excerptEn ?? null, p.excerptAr ?? null, locale),
        publishedAt: toISO(p.publishedAt),
        author: p.author.fullName ?? null,
        imageUrl: p.images[0]?.url ?? null,
      })),
    }
  } catch (err) {
    console.error("[getRssFeedData]", err)
    return { success: false, error: "Failed to generate RSS data." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION G: SEARCH ────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const searchPostsSchema = z.object({
  query: z.string().min(1).max(200),
  locale: z.enum(["en", "ar"]).default("en"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(30).default(10),
  categorySlug: z.string().optional(),
})

export type SearchPostsInput = z.infer<typeof searchPostsSchema>

export async function searchPosts(
  raw: SearchPostsInput,
): Promise<ActionResult<{ posts: PublicPostCard[]; total: number; hasMore: boolean }>> {
  try {
    const { query, locale, page, limit, categorySlug } = searchPostsSchema.parse(raw)

    const where: Prisma.PostWhereInput = {
      ...publicPostBase,
      OR: [
        { titleEn: { contains: query, mode: "insensitive" } },
        { titleAr: { contains: query, mode: "insensitive" } },
        { excerptEn: { contains: query, mode: "insensitive" } },
        { excerptAr: { contains: query, mode: "insensitive" } },
        { contentEn: { contains: query, mode: "insensitive" } },
        { contentAr: { contains: query, mode: "insensitive" } },
        { tags: { some: { tag: { OR: [{ nameEn: { contains: query, mode: "insensitive" } }, { nameAr: { contains: query, mode: "insensitive" } }] } } } },
      ],
    }
    if (categorySlug) where.category = { slug: categorySlug }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: publicPostListInclude,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.post.count({ where }),
    ])

    return {
      success: true,
      data: {
        posts: posts.map((p) => serializePostCard(p, locale)),
        total,
        hasMore: page * limit < total,
      },
    }
  } catch (err) {
    console.error("[searchPosts]", err)
    return { success: false, error: "Search failed." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION H: USER READING HISTORY (auth-optional) ──────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// H1. GET POSTS COMMENTED ON BY THE CURRENT USER  (profile / activity page)
// ─────────────────────────────────────────────────────────────────────────────

export async function getMyCommentedPosts(
  locale: Locale = "en",
  page = 1,
  limit = 10,
): Promise<ActionResult<{ posts: PublicPostCard[]; total: number }>> {
  try {
    const dbUserId = await requireAuthUser()

    const commentedPostIds = await prisma.comment.findMany({
      where: { authorId: dbUserId, isDeleted: false },
      select: { postId: true },
      distinct: ["postId"],
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    })

    const ids = commentedPostIds.map((c) => c.postId)
    if (!ids.length) return { success: true, data: { posts: [], total: 0 } }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { id: { in: ids }, ...publicPostBase },
        include: publicPostListInclude,
      }),
      prisma.comment.groupBy({
        by: ["postId"],
        where: { authorId: dbUserId, isDeleted: false },
        _count: true,
      }).then((r) => r.length),
    ])

    return {
      success: true,
      data: { posts: posts.map((p) => serializePostCard(p, locale)), total },
    }
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message }
    console.error("[getMyCommentedPosts]", err)
    return { success: false, error: "Failed to load activity." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// H2. GET POSTS LIKED BY THE CURRENT USER
// ─────────────────────────────────────────────────────────────────────────────

export async function getMyLikedPosts(
  locale: Locale = "en",
  page = 1,
  limit = 10,
): Promise<ActionResult<{ posts: PublicPostCard[]; total: number }>> {
  try {
    const dbUserId = await requireAuthUser()

    const [reactions, total] = await Promise.all([
      prisma.postReaction.findMany({
        where: { userId: dbUserId, type: "LIKE" },
        select: { postId: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.postReaction.count({ where: { userId: dbUserId, type: "LIKE" } }),
    ])

    const ids = reactions.map((r) => r.postId)
    if (!ids.length) return { success: true, data: { posts: [], total: 0 } }

    const posts = await prisma.post.findMany({
      where: { id: { in: ids }, ...publicPostBase },
      include: publicPostListInclude,
    })

    return {
      success: true,
      data: { posts: posts.map((p) => serializePostCard(p, locale)), total },
    }
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message }
    console.error("[getMyLikedPosts]", err)
    return { success: false, error: "Failed to load liked posts." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── OUTPUT TYPES & SERIALISERS ────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─── Public "card" shape (used in lists) ─────────────────────────────────────

export type PublicPostCard = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  publishedAt: string | null
  viewCount: number
  commentCount: number
  reactionCount: number
  primaryImage: { url: string; altText: string | null } | null
  author: { id: string; fullName: string; avatarUrl: string | null }
  category: { id: string; slug: string; name: string } | null
  tags: { id: string; slug: string; name: string }[]
}

// ─── Public "detail" shape (used on post page) ───────────────────────────────

export type PublicPostDetail = PublicPostCard & {
  contentEn: string
  contentAr: string | null
  content: string  // resolved to locale
  images: { id: string; url: string; altText: string | null; isPrimary: boolean; sortOrder: number }[]
  videos: { id: string; url: string; sortOrder: number }[]
  seo: {
    metaTitle: string | null
    metaDescription: string | null
    ogImageUrl: string | null
    ogImageAlt: string | null
    canonicalUrl: string | null
    twitterCard: string | null
  }
  slugEn: string
  slugAr: string | null
  myReaction: ReactionType | null
}

// ─── Category & Tag shapes ────────────────────────────────────────────────────

export type PublicCategory = {
  id: string
  slug: string
  name: string
  description: string | null
  postCount: number
  parent: { id: string; slug: string; name: string } | null
  children: PublicCategory[]
}

export type PublicTag = {
  id: string
  slug: string
  name: string
  postCount: number
}

// ─── Comment shape ────────────────────────────────────────────────────────────

export type PublicComment = {
  id: string
  content: string
  createdAt: string
  updatedAt: string | null
  author: { id: string; fullName: string; avatarUrl: string | null }
  reactionCount: number
  replyCount: number
  myReaction: ReactionType | null
  replies: PublicComment[]
}

// ─── Serialisers ─────────────────────────────────────────────────────────────

function serializePostCard(post: any, locale: Locale): PublicPostCard {
  return {
    id: post.id,
    title: l(post.titleEn, post.titleAr, locale),
    slug: l(post.slugEn, post.slugAr ?? post.slugEn, locale),
    excerpt: l(post.excerptEn ?? null, post.excerptAr ?? null, locale),
    publishedAt: toISO(post.publishedAt),
    viewCount: post.viewCount ?? 0,
    commentCount: post._count?.comments ?? 0,
    reactionCount: post._count?.reactions ?? 0,
    primaryImage: post.images?.[0]
      ? { url: post.images[0].url, altText: post.images[0].altText ?? null }
      : null,
    author: {
      id: post.author.id,
      fullName: post.author.fullName ?? "Anonymous",
      avatarUrl: post.author.avatarUrl ?? null,
    },
    category: post.category
      ? {
        id: post.category.id,
        slug: post.category.slug,
        name: l(post.category.nameEn, post.category.nameAr, locale),
      }
      : null,
    tags: (post.tags ?? []).map((t: any) => ({
      id: t.tag.id,
      slug: t.tag.slug,
      name: l(t.tag.nameEn, t.tag.nameAr, locale),
    })),
  }
}

function serializePostDetail(
  post: any,
  locale: Locale,
  myReaction: ReactionType | null,
): PublicPostDetail {
  const card = serializePostCard(post, locale)
  return {
    ...card,
    contentEn: post.contentEn,
    contentAr: post.contentAr ?? null,
    content: l(post.contentEn, post.contentAr, locale),
    images: (post.images ?? []).map((img: any) => ({
      id: img.id,
      url: img.url,
      altText: img.altText ?? null,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
    videos: (post.videos ?? []).map((v: any) => ({
      id: v.id,
      url: v.url,
      sortOrder: v.sortOrder,
    })),
    seo: {
      metaTitle: l(post.metaTitleEn ?? null, post.metaTitleAr ?? null, locale),
      metaDescription: l(post.metaDescriptionEn ?? null, post.metaDescriptionAr ?? null, locale),
      ogImageUrl: post.ogImageUrl ?? post.images?.[0]?.url ?? null,
      ogImageAlt: l(post.ogImageAltEn ?? null, post.ogImageAltAr ?? null, locale),
      canonicalUrl: post.canonicalUrl ?? null,
      twitterCard: post.twitterCard ?? null,
    },
    slugEn: post.slugEn,
    slugAr: post.slugAr ?? null,
    myReaction,
  }
}