'use server'

// app/[locale]/(pages)/blog/actions.ts

import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { ReactionType } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Locale = 'en' | 'ar'

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  return prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true, isActive: true, isDeleted: true },
  })
}

async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser()
  if (!user) throw new Error('Unauthorized')
  if (!user.isActive || user.isDeleted) throw new Error('Account is inactive')
  return user
}

/**
 * Selects locale-aware scalar fields for a post.
 * The select object is used in Prisma queries.
 */
function postLocaleSelect(locale: Locale) {
  return {
    id: true,
    slugEn: true,
    slugAr: true,
    status: true,
    publishedAt: true,
    createdAt: true,
    updatedAt: true,
    ogImageUrl: true,
    twitterCard: true,
    canonicalUrl: true,
    // Bilingual scalars — always include En; include Ar only when needed
    titleEn: true,
    titleAr: locale === 'ar',
    excerptEn: true,
    excerptAr: locale === 'ar',
    contentEn: true,
    contentAr: locale === 'ar',
    metaTitleEn: true,
    metaTitleAr: locale === 'ar',
    metaDescriptionEn: true,
    metaDescriptionAr: locale === 'ar',
    ogImageAltEn: true,
    ogImageAltAr: locale === 'ar',
  }
}

/** Resolves the display value: use Arabic if locale=ar AND value exists, else fall back to English. */
function resolveLocaleField<T>(en: T, ar: T | null | undefined, locale: Locale): T {
  if (locale === 'ar' && ar != null) return ar
  return en
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC POST LISTING
// ─────────────────────────────────────────────────────────────────────────────

export interface ListPostsPublicInput {
  locale: Locale
  page?: number
  pageSize?: number
  categorySlug?: string
  tagSlug?: string
  search?: string
}

export interface PublicPostSummary {
  id: string
  slug: string           // resolved slug for this locale
  title: string
  excerpt: string | null
  publishedAt: Date | null
  createdAt: Date
  ogImageUrl: string | null
  author: { fullName: string | null; avatarUrl: string | null }
  category: { slug: string; name: string } | null
  tags: Array<{ slug: string; name: string }>
  reactionCounts: { LIKE: number; DISLIKE: number }
  commentCount: number
}

export async function listPostsPublic(
  input: ListPostsPublicInput
): Promise<
  ActionResult<{
    posts: PublicPostSummary[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }>
> {
  try {
    const { locale, page = 1, pageSize = 12, categorySlug, tagSlug, search } = input
    const skip = (page - 1) * pageSize

    const where = {
      isDeleted: false,
      status: 'PUBLISHED' as const,
      ...(categorySlug
        ? { category: { slug: categorySlug } }
        : {}),
      ...(tagSlug
        ? { tags: { some: { tag: { slug: tagSlug } } } }
        : {}),
      ...(search
        ? {
            OR: [
              { titleEn: { contains: search, mode: 'insensitive' as const } },
              { titleAr: { contains: search, mode: 'insensitive' as const } },
              { excerptEn: { contains: search, mode: 'insensitive' as const } },
              { excerptAr: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [rawPosts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          slugEn: true,
          slugAr: true,
          titleEn: true,
          titleAr: true,
          excerptEn: true,
          excerptAr: true,
          publishedAt: true,
          createdAt: true,
          ogImageUrl: true,
          author: { select: { fullName: true, avatarUrl: true } },
          category: { select: { slug: true, nameEn: true, nameAr: true } },
          tags: {
            select: { tag: { select: { slug: true, nameEn: true, nameAr: true } } },
          },
          reactions: { select: { type: true } },
          _count: { select: { comments: { where: { isDeleted: false } } } },
        },
      }),
      prisma.post.count({ where }),
    ])

    const posts: PublicPostSummary[] = rawPosts.map((p) => {
      const reactionCounts = { LIKE: 0, DISLIKE: 0 }
      for (const r of p.reactions) reactionCounts[r.type]++

      // Slug: for Arabic routes, prefer slugAr; fall back to slugEn if absent
      const slug = locale === 'ar' ? (p.slugAr ?? p.slugEn) : p.slugEn

      return {
        id: p.id,
        slug,
        title: resolveLocaleField(p.titleEn, p.titleAr, locale),
        excerpt: resolveLocaleField(p.excerptEn ?? null, p.excerptAr ?? null, locale),
        publishedAt: p.publishedAt,
        createdAt: p.createdAt,
        ogImageUrl: p.ogImageUrl,
        author: p.author,
        category: p.category
          ? {
              slug: p.category.slug,
              name: resolveLocaleField(p.category.nameEn, p.category.nameAr, locale),
            }
          : null,
        tags: p.tags.map((t) => ({
          slug: t.tag.slug,
          name: resolveLocaleField(t.tag.nameEn, t.tag.nameAr, locale),
        })),
        reactionCounts,
        commentCount: p._count.comments,
      }
    })

    return {
      success: true,
      data: { posts, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to list posts' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE POST BY SLUG (bilingual with Arabic fallback)
// ─────────────────────────────────────────────────────────────────────────────

export interface GetPostBySlugInput {
  slug: string
  locale: Locale
}

export async function getPostBySlug(
  input: GetPostBySlugInput
): Promise<ActionResult<any>> {
  try {
    const { slug, locale } = input

    // Build slug lookup based on locale rules:
    // • en routes: ONLY match slugEn
    // • ar routes: try slugAr first; if not found, fall back to slugEn
    let post = await prisma.post.findFirst({
      where: {
        isDeleted: false,
        status: 'PUBLISHED',
        // For English: only slugEn. For Arabic: slugAr OR slugEn fallback.
        ...(locale === 'en'
          ? { slugEn: slug }
          : { OR: [{ slugAr: slug }, { slugEn: slug }] }),
      },
      select: {
        id: true,
        slugEn: true,
        slugAr: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        ogImageUrl: true,
        twitterCard: true,
        canonicalUrl: true,
        titleEn: true,
        titleAr: true,
        excerptEn: true,
        excerptAr: true,
        contentEn: true,
        contentAr: true,
        metaTitleEn: true,
        metaTitleAr: true,
        metaDescriptionEn: true,
        metaDescriptionAr: true,
        ogImageAltEn: true,
        ogImageAltAr: true,
        author: { select: { id: true, fullName: true, avatarUrl: true } },
        category: {
          select: { id: true, slug: true, nameEn: true, nameAr: true },
        },
        tags: {
          select: { tag: { select: { id: true, slug: true, nameEn: true, nameAr: true } } },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            url: true,
            altEn: true,
            altAr: true,
            captionEn: true,
            captionAr: true,
            sortOrder: true,
            file: { select: { url: true } },
          },
        },
        videos: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            provider: true,
            videoId: true,
            url: true,
            titleEn: true,
            titleAr: true,
            sortOrder: true,
          },
        },
        reactions: { select: { type: true } },
        _count: {
          select: { comments: { where: { isDeleted: false } } },
        },
      },
    })

    if (!post) return { success: false, error: 'Post not found' }

    // Merge resolved locale fields on top of the raw record
    const reactionCounts = { LIKE: 0, DISLIKE: 0 }
    for (const r of post.reactions) reactionCounts[r.type]++

    const resolvedPost = {
      ...post,
      // Resolved display slug for this locale
      slug: locale === 'ar' ? (post.slugAr ?? post.slugEn) : post.slugEn,
      title: resolveLocaleField(post.titleEn, post.titleAr, locale),
      excerpt: resolveLocaleField(post.excerptEn ?? null, post.excerptAr ?? null, locale),
      content: resolveLocaleField(post.contentEn, post.contentAr, locale),
      metaTitle: resolveLocaleField(post.metaTitleEn ?? null, post.metaTitleAr ?? null, locale),
      metaDescription: resolveLocaleField(
        post.metaDescriptionEn ?? null,
        post.metaDescriptionAr ?? null,
        locale
      ),
      ogImageAlt: resolveLocaleField(
        post.ogImageAltEn ?? null,
        post.ogImageAltAr ?? null,
        locale
      ),
      category: post.category
        ? {
            ...post.category,
            name: resolveLocaleField(post.category.nameEn, post.category.nameAr, locale),
          }
        : null,
      tags: post.tags.map((t) => ({
        ...t.tag,
        name: resolveLocaleField(t.tag.nameEn, t.tag.nameAr, locale),
      })),
      images: post.images.map((img) => ({
        ...img,
        resolvedUrl: img.file?.url ?? img.url ?? null,
        alt: resolveLocaleField(img.altEn ?? null, img.altAr ?? null, locale),
        caption: resolveLocaleField(img.captionEn ?? null, img.captionAr ?? null, locale),
      })),
      videos: post.videos.map((v) => ({
        ...v,
        title: resolveLocaleField(v.titleEn ?? null, v.titleAr ?? null, locale),
      })),
      reactionCounts,
      commentCount: post._count.comments,
    }

    return { success: true, data: resolvedPost }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to get post' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMENTS — READ
// ─────────────────────────────────────────────────────────────────────────────

export async function listComments(input: {
  postId: string
  page?: number
  pageSize?: number
}): Promise<
  ActionResult<{
    comments: any[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }>
> {
  try {
    const { postId, page = 1, pageSize = 20 } = input
    const skip = (page - 1) * pageSize

    const where = { postId, parentId: null, isDeleted: false }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, fullName: true, avatarUrl: true } },
          replies: {
            where: { isDeleted: false },
            orderBy: { createdAt: 'asc' },
            include: {
              author: { select: { id: true, fullName: true, avatarUrl: true } },
              _count: { select: { reactions: true } },
            },
          },
          _count: { select: { reactions: true, replies: { where: { isDeleted: false } } } },
        },
      }),
      prisma.comment.count({ where }),
    ])

    return {
      success: true,
      data: { comments, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to load comments' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMENTS — WRITE (write-once; no editing allowed)
// ─────────────────────────────────────────────────────────────────────────────

export async function addComment(input: {
  postId: string
  content: string
  parentId?: string
  locale: Locale
}): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireAuthenticatedUser()
    const { postId, content, parentId, locale } = input

    if (!content.trim()) return { success: false, error: 'Comment cannot be empty' }

    // Verify the post exists and is published
    const post = await prisma.post.findFirst({
      where: { id: postId, isDeleted: false, status: 'PUBLISHED' },
      select: { id: true, slugEn: true, slugAr: true },
    })
    if (!post) return { success: false, error: 'Post not found' }

    // If replying, verify the parent comment belongs to the same post and is not deleted
    if (parentId) {
      const parent = await prisma.comment.findFirst({
        where: { id: parentId, postId, isDeleted: false, parentId: null }, // only one level deep
      })
      if (!parent) return { success: false, error: 'Parent comment not found' }
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: user.id,
        content: content.trim(),
        parentId: parentId ?? null,
      },
      select: { id: true },
    })

    const slugPath = locale === 'ar' ? (post.slugAr ?? post.slugEn) : post.slugEn
    revalidatePath(`/${locale}/blogs/${slugPath}`)

    return { success: true, data: comment }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to add comment' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMENTS — SOFT DELETE (own comment only)
// ─────────────────────────────────────────────────────────────────────────────

export async function softDeleteComment(input: {
  commentId: string
  locale: Locale
}): Promise<ActionResult<undefined>> {
  try {
    const user = await requireAuthenticatedUser()
    const { commentId, locale } = input

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        authorId: true,
        isDeleted: true,
        post: { select: { slugEn: true, slugAr: true } },
      },
    })

    if (!comment) return { success: false, error: 'Comment not found' }
    if (comment.isDeleted) return { success: false, error: 'Already deleted' }

    // Clients can only delete their own comments; admins can delete any
    if (user.role !== 'ADMIN' && comment.authorId !== user.id) {
      return { success: false, error: 'Forbidden' }
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true, deletedAt: new Date() },
    })

    if (comment.post) {
      const slugPath =
        locale === 'ar'
          ? (comment.post.slugAr ?? comment.post.slugEn)
          : comment.post.slugEn
      revalidatePath(`/${locale}/blogs/${slugPath}`)
    }

    return { success: true, data: undefined }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to delete comment' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REACTIONS — POST
// ─────────────────────────────────────────────────────────────────────────────

export async function togglePostReaction(input: {
  postId: string
  type: ReactionType
  locale: Locale
}): Promise<ActionResult<{ reactionCounts: { LIKE: number; DISLIKE: number }; userReaction: ReactionType | null }>> {
  try {
    const user = await requireAuthenticatedUser()
    const { postId, type, locale } = input

    const post = await prisma.post.findFirst({
      where: { id: postId, isDeleted: false, status: 'PUBLISHED' },
      select: { id: true, slugEn: true, slugAr: true },
    })
    if (!post) return { success: false, error: 'Post not found' }

    const existing = await prisma.postReaction.findUnique({
      where: { postId_userId: { postId, userId: user.id } },
    })

    let userReaction: ReactionType | null = null

    if (existing) {
      if (existing.type === type) {
        // Toggle off: remove the reaction
        await prisma.postReaction.delete({
          where: { postId_userId: { postId, userId: user.id } },
        })
        userReaction = null
      } else {
        // Switch reaction type
        await prisma.postReaction.update({
          where: { postId_userId: { postId, userId: user.id } },
          data: { type },
        })
        userReaction = type
      }
    } else {
      await prisma.postReaction.create({
        data: { postId, userId: user.id, type },
      })
      userReaction = type
    }

    const reactions = await prisma.postReaction.groupBy({
      by: ['type'],
      where: { postId },
      _count: { type: true },
    })

    const reactionCounts = { LIKE: 0, DISLIKE: 0 }
    for (const r of reactions) reactionCounts[r.type] = r._count.type

    const slugPath = locale === 'ar' ? (post.slugAr ?? post.slugEn) : post.slugEn
    revalidatePath(`/${locale}/blogs/${slugPath}`)

    return { success: true, data: { reactionCounts, userReaction } }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to toggle reaction' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REACTIONS — COMMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function toggleCommentReaction(input: {
  commentId: string
  type: ReactionType
  locale: Locale
}): Promise<ActionResult<{ reactionCounts: { LIKE: number; DISLIKE: number }; userReaction: ReactionType | null }>> {
  try {
    const user = await requireAuthenticatedUser()
    const { commentId, type, locale } = input

    const comment = await prisma.comment.findFirst({
      where: { id: commentId, isDeleted: false },
      select: {
        id: true,
        post: { select: { slugEn: true, slugAr: true, status: true, isDeleted: true } },
      },
    })
    if (!comment || comment.post.isDeleted || comment.post.status !== 'PUBLISHED') {
      return { success: false, error: 'Comment not found' }
    }

    const existing = await prisma.commentReaction.findUnique({
      where: { commentId_userId: { commentId, userId: user.id } },
    })

    let userReaction: ReactionType | null = null

    if (existing) {
      if (existing.type === type) {
        await prisma.commentReaction.delete({
          where: { commentId_userId: { commentId, userId: user.id } },
        })
        userReaction = null
      } else {
        await prisma.commentReaction.update({
          where: { commentId_userId: { commentId, userId: user.id } },
          data: { type },
        })
        userReaction = type
      }
    } else {
      await prisma.commentReaction.create({
        data: { commentId, userId: user.id, type },
      })
      userReaction = type
    }

    const reactions = await prisma.commentReaction.groupBy({
      by: ['type'],
      where: { commentId },
      _count: { type: true },
    })

    const reactionCounts = { LIKE: 0, DISLIKE: 0 }
    for (const r of reactions) reactionCounts[r.type] = r._count.type

    const slugPath =
      locale === 'ar'
        ? (comment.post.slugAr ?? comment.post.slugEn)
        : comment.post.slugEn
    revalidatePath(`/${locale}/blogs/${slugPath}`)

    return { success: true, data: { reactionCounts, userReaction } }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to toggle comment reaction' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET USER'S OWN REACTION (for hydrating UI state)
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserPostReaction(
  postId: string
): Promise<ActionResult<ReactionType | null>> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: true, data: null }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) return { success: true, data: null }

    const reaction = await prisma.postReaction.findUnique({
      where: { postId_userId: { postId, userId: user.id } },
      select: { type: true },
    })

    return { success: true, data: reaction?.type ?? null }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to get reaction' }
  }
}

export async function getUserCommentReaction(
  commentId: string
): Promise<ActionResult<ReactionType | null>> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: true, data: null }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) return { success: true, data: null }

    const reaction = await prisma.commentReaction.findUnique({
      where: { commentId_userId: { commentId, userId: user.id } },
      select: { type: true },
    })

    return { success: true, data: reaction?.type ?? null }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to get reaction' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC CATEGORIES & TAGS
// ─────────────────────────────────────────────────────────────────────────────

export async function listCategories(
  locale: Locale
): Promise<ActionResult<any[]>> {
  try {
    const categories = await prisma.postCategory.findMany({
      orderBy: { nameEn: 'asc' },
      include: {
        children: {
          select: {
            id: true,
            slug: true,
            nameEn: true,
            nameAr: true,
          },
        },
        _count: {
          select: {
            posts: {
              where: { isDeleted: false, status: 'PUBLISHED' },
            },
          },
        },
      },
      where: { parentId: null }, // top-level only; children nested
    })

    return {
      success: true,
      data: categories.map((c) => ({
        ...c,
        name: resolveLocaleField(c.nameEn, c.nameAr, locale),
        desc: resolveLocaleField(c.descEn ?? null, c.descAr ?? null, locale),
        children: c.children.map((ch) => ({
          ...ch,
          name: resolveLocaleField(ch.nameEn, ch.nameAr, locale),
        })),
        postCount: c._count.posts,
      })),
    }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to list categories' }
  }
}

export async function listTags(locale: Locale): Promise<ActionResult<any[]>> {
  try {
    const tags = await prisma.postTag.findMany({
      orderBy: { nameEn: 'asc' },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                post: { isDeleted: false, status: 'PUBLISHED' },
              },
            },
          },
        },
      },
    })

    return {
      success: true,
      data: tags.map((t) => ({
        ...t,
        name: resolveLocaleField(t.nameEn, t.nameAr, locale),
        postCount: t._count.posts,
      })),
    }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to list tags' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE ADS — PUBLIC FETCH (returns null when placement inactive)
// ─────────────────────────────────────────────────────────────────────────────

export async function getAdByPlacement(
  placement: string,
  locale: Locale
): Promise<ActionResult<{ adCode: string; adType: string | null } | null>> {
  try {
    const ad = await prisma.googleAd.findUnique({
      where: { placement },
      select: {
        isActive: true,
        adCodeEn: true,
        adCodeAr: true,
        adType: true,
      },
    })

    // Return null when placement missing or explicitly disabled
    if (!ad || !ad.isActive) return { success: true, data: null }

    const adCode = resolveLocaleField(ad.adCodeEn ?? null, ad.adCodeAr ?? null, locale)

    // If there is no code for this locale (and no English fallback), return null
    if (!adCode) return { success: true, data: null }

    return { success: true, data: { adCode, adType: ad.adType ?? null } }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to get ad' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATED POSTS (same category, excluding current)
// ─────────────────────────────────────────────────────────────────────────────

export async function getRelatedPosts(input: {
  postId: string
  categoryId?: string
  locale: Locale
  limit?: number
}): Promise<ActionResult<PublicPostSummary[]>> {
  try {
    const { postId, categoryId, locale, limit = 4 } = input

    const posts = await prisma.post.findMany({
      where: {
        id: { not: postId },
        isDeleted: false,
        status: 'PUBLISHED',
        ...(categoryId ? { categoryId } : {}),
      },
      take: limit,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        slugEn: true,
        slugAr: true,
        titleEn: true,
        titleAr: true,
        excerptEn: true,
        excerptAr: true,
        publishedAt: true,
        createdAt: true,
        ogImageUrl: true,
        author: { select: { fullName: true, avatarUrl: true } },
        category: { select: { slug: true, nameEn: true, nameAr: true } },
        tags: { select: { tag: { select: { slug: true, nameEn: true, nameAr: true } } } },
        reactions: { select: { type: true } },
        _count: { select: { comments: { where: { isDeleted: false } } } },
      },
    })

    const result: PublicPostSummary[] = posts.map((p) => {
      const reactionCounts = { LIKE: 0, DISLIKE: 0 }
      for (const r of p.reactions) reactionCounts[r.type]++

      return {
        id: p.id,
        slug: locale === 'ar' ? (p.slugAr ?? p.slugEn) : p.slugEn,
        title: resolveLocaleField(p.titleEn, p.titleAr, locale),
        excerpt: resolveLocaleField(p.excerptEn ?? null, p.excerptAr ?? null, locale),
        publishedAt: p.publishedAt,
        createdAt: p.createdAt,
        ogImageUrl: p.ogImageUrl,
        author: p.author,
        category: p.category
          ? {
              slug: p.category.slug,
              name: resolveLocaleField(p.category.nameEn, p.category.nameAr, locale),
            }
          : null,
        tags: p.tags.map((t) => ({
          slug: t.tag.slug,
          name: resolveLocaleField(t.tag.nameEn, t.tag.nameAr, locale),
        })),
        reactionCounts,
        commentCount: p._count.comments,
      }
    })

    return { success: true, data: result }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to get related posts' }
  }
}