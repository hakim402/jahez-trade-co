"use server";

// app/[locale]/(pages)/services/actions.ts

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma, ConsultingServiceTopic } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PublicServiceImage = {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

export type PublicConsultingService = {
  id: string;
  title: string;
  titleAr: string | null;
  description: string;
  descriptionAr: string | null;
  shortDesc: string | null;
  shortDescAr: string | null;
  topic: ConsultingServiceTopic;
  category: string | null;
  categoryAr: string | null;
  tags: string[];
  priceFrom: number | null; // Decimal serialised
  priceCurrency: string;
  duration: string | null;
  durationAr: string | null;
  deliveryFormat: string | null;
  includesEn: string[];
  includesAr: string[];
  viewCount: number;
  requestCount: number;
  isFeatured: boolean;
  images: PublicServiceImage[];
  createdAt: string; // ISO string
};

// Lightweight card variant — used for listing pages and related sections
// where full description is not needed
export type PublicConsultingServiceCard = Omit<
  PublicConsultingService,
  "description" | "descriptionAr" | "includesEn" | "includesAr"
>;

export type ServiceCategory = {
  category: string;
  categoryAr: string | null;
  count: number;
};

export type ServiceTopicCount = {
  topic: ConsultingServiceTopic;
  count: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

// Only active, non-deleted records are ever shown publicly
const PUBLIC_WHERE = { isActive: true, isDeleted: false } as const;

// Full select — used for detail page
const fullSelect = {
  id: true,
  title: true,
  titleAr: true,
  description: true,
  descriptionAr: true,
  shortDesc: true,
  shortDescAr: true,
  topic: true,
  category: true,
  categoryAr: true,
  tags: true,
  priceFrom: true,
  priceCurrency: true,
  duration: true,
  durationAr: true,
  deliveryFormat: true,
  includesEn: true,
  includesAr: true,
  viewCount: true,
  requestCount: true,
  isFeatured: true,
  images: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      id: true,
      url: true,
      altText: true,
      isPrimary: true,
      sortOrder: true,
    },
  },
  createdAt: true,
} as const;

// Card select — strips description + includesEn/Ar for lighter payloads
const cardSelect = {
  id: true,
  title: true,
  titleAr: true,
  shortDesc: true,
  shortDescAr: true,
  topic: true,
  category: true,
  categoryAr: true,
  tags: true,
  priceFrom: true,
  priceCurrency: true,
  duration: true,
  durationAr: true,
  deliveryFormat: true,
  viewCount: true,
  requestCount: true,
  isFeatured: true,
  images: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      id: true,
      url: true,
      altText: true,
      isPrimary: true,
      sortOrder: true,
    },
  },
  createdAt: true,
} as const;

function serializeFull(s: any): PublicConsultingService {
  return {
    ...s,
    priceFrom: s.priceFrom !== null ? Number(s.priceFrom) : null,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    images: (s.images ?? []).map(serializeImage),
  };
}

function serializeCard(s: any): PublicConsultingServiceCard {
  return {
    ...s,
    priceFrom: s.priceFrom !== null ? Number(s.priceFrom) : null,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    images: (s.images ?? []).map(serializeImage),
  };
}

function serializeImage(img: any): PublicServiceImage {
  return {
    id: img.id,
    url: img.url,
    altText: img.altText,
    isPrimary: img.isPrimary,
    sortOrder: img.sortOrder,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET ALL SERVICES (listing page — paginated, filterable)
// ─────────────────────────────────────────────────────────────────────────────

const listSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(12),
  topic: z.nativeEnum(ConsultingServiceTopic).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  featured: z.boolean().optional(),
  sortBy: z.enum(["newest", "popular", "price_asc", "price_desc"]).default("popular"),
});

// Use z.input to make all fields optional (defaults are applied by parse)
export type GetServicesInput = z.input<typeof listSchema>;
export type GetServicesResult =
  | {
      success: true;
      data: {
        items: PublicConsultingServiceCard[];
        total: number;
        totalPages: number;
        page: number;
      };
    }
  | { success: false; error: string };

export async function getPublicConsultingServices(
  raw: GetServicesInput = {}
): Promise<GetServicesResult> {
  try {
    const { page, pageSize, topic, category, search, featured, sortBy } =
      listSchema.parse(raw);

    const where: Prisma.ConsultingServiceWhereInput = { ...PUBLIC_WHERE };
    if (topic) where.topic = topic;
    if (featured) where.isFeatured = true;

    if (category?.trim()) {
      where.OR = [
        { category: { equals: category, mode: "insensitive" } },
        { categoryAr: { equals: category, mode: "insensitive" } },
      ];
    }

    if (search?.trim()) {
      const s = search.trim();
      where.OR = [
        { title: { contains: s, mode: "insensitive" } },
        { titleAr: { contains: s, mode: "insensitive" } },
        { shortDesc: { contains: s, mode: "insensitive" } },
        { shortDescAr: { contains: s, mode: "insensitive" } },
        { category: { contains: s, mode: "insensitive" } },
        { categoryAr: { contains: s, mode: "insensitive" } },
        { tags: { has: s } },
      ];
    }

    const orderBy: Prisma.ConsultingServiceOrderByWithRelationInput[] = (() => {
      switch (sortBy) {
        case "popular":
          return [
            { isFeatured: "desc" },
            { requestCount: "desc" },
            { sortOrder: "asc" },
          ];
        case "newest":
          return [{ createdAt: "desc" }];
        case "price_asc":
          return [{ priceFrom: { sort: "asc", nulls: "last" } }];
        case "price_desc":
          return [{ priceFrom: { sort: "desc", nulls: "last" } }];
        default:
          return [{ isFeatured: "desc" }, { sortOrder: "asc" }];
      }
    })();

    const [total, items] = await Promise.all([
      prisma.consultingService.count({ where }),
      prisma.consultingService.findMany({
        where,
        select: cardSelect,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      success: true,
      data: {
        items: items.map(serializeCard),
        total,
        totalPages: Math.ceil(total / pageSize),
        page,
      },
    };
  } catch (err) {
    console.error("[getPublicConsultingServices]", err);
    return {
      success: false,
      error: "Failed to load services. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET SINGLE SERVICE (detail page)
// ─────────────────────────────────────────────────────────────────────────────

export async function getPublicConsultingServiceById(
  id: string
): Promise<
  | { success: true; data: PublicConsultingService }
  | { success: false; error: string }
> {
  try {
    if (!id?.trim()) return { success: false, error: "Service ID is required." };

    const service = await prisma.consultingService.findUnique({
      where: { id, ...PUBLIC_WHERE },
      select: fullSelect,
    });

    if (!service) return { success: false, error: "Service not found." };
    return { success: true, data: serializeFull(service) };
  } catch (err) {
    console.error("[getPublicConsultingServiceById]", err);
    return { success: false, error: "Failed to load service." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET FEATURED SERVICES  (homepage section, max 6 by default)
//    Only returns services whose featuredUntil is null or in the future.
// ─────────────────────────────────────────────────────────────────────────────

export async function getFeaturedConsultingServices(
  limit = 6
): Promise<PublicConsultingServiceCard[]> {
  try {
    const now = new Date();
    const services = await prisma.consultingService.findMany({
      where: {
        ...PUBLIC_WHERE,
        isFeatured: true,
        OR: [{ featuredUntil: null }, { featuredUntil: { gte: now } }],
      },
      select: cardSelect,
      orderBy: [{ sortOrder: "asc" }, { requestCount: "desc" }],
      take: limit,
    });
    return services.map(serializeCard);
  } catch (err) {
    console.error("[getFeaturedConsultingServices]", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET RELATED SERVICES  (detail page sidebar / bottom section)
//    Tries same-topic first, tops up from most-popular if short.
// ─────────────────────────────────────────────────────────────────────────────

export async function getRelatedConsultingServices(
  currentId: string,
  topic: ConsultingServiceTopic,
  limit = 3
): Promise<PublicConsultingServiceCard[]> {
  try {
    const sameTopic = await prisma.consultingService.findMany({
      where: { ...PUBLIC_WHERE, topic, id: { not: currentId } },
      select: cardSelect,
      orderBy: [{ isFeatured: "desc" }, { requestCount: "desc" }],
      take: limit,
    });

    if (sameTopic.length >= limit) return sameTopic.map(serializeCard);

    const topUp = await prisma.consultingService.findMany({
      where: {
        ...PUBLIC_WHERE,
        id: { not: currentId, notIn: sameTopic.map((s) => s.id) },
      },
      select: cardSelect,
      orderBy: { requestCount: "desc" },
      take: limit - sameTopic.length,
    });

    return [...sameTopic, ...topUp].map(serializeCard);
  } catch (err) {
    console.error("[getRelatedConsultingServices]", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET SERVICES BY TOPIC  (topic section on listing page or homepage)
//    Returns one "shelf" of cards for a single topic.
// ─────────────────────────────────────────────────────────────────────────────

export async function getConsultingServicesByTopic(
  topic: ConsultingServiceTopic,
  limit = 4,
  excludeId?: string
): Promise<PublicConsultingServiceCard[]> {
  try {
    const services = await prisma.consultingService.findMany({
      where: {
        ...PUBLIC_WHERE,
        topic,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: cardSelect,
      orderBy: [
        { isFeatured: "desc" },
        { requestCount: "desc" },
        { sortOrder: "asc" },
      ],
      take: limit,
    });
    return services.map(serializeCard);
  } catch (err) {
    console.error("[getConsultingServicesByTopic]", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. GET ALL CATEGORIES  (filter chips on listing page)
// ─────────────────────────────────────────────────────────────────────────────

export async function getPublicServiceCategories(): Promise<ServiceCategory[]> {
  try {
    const raw = await prisma.consultingService.groupBy({
      by: ["category", "categoryAr"],
      where: { ...PUBLIC_WHERE, category: { not: null } },
      _count: { id: true },
    });
    return raw
      .filter((r) => r.category !== null)
      .map((r) => ({
        category: r.category!,
        categoryAr: r.categoryAr,
        count: r._count.id,
      }))
      .sort((a, b) => b.count - a.count);
  } catch (err) {
    console.error("[getPublicServiceCategories]", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET TOPIC COUNTS  (topic filter pills with numbers)
// ─────────────────────────────────────────────────────────────────────────────

export async function getPublicTopicCounts(): Promise<ServiceTopicCount[]> {
  try {
    const raw = await prisma.consultingService.groupBy({
      by: ["topic"],
      where: PUBLIC_WHERE,
      _count: { id: true },
    });
    return raw
      .map((r) => ({ topic: r.topic, count: r._count.id }))
      .sort((a, b) => b.count - a.count);
  } catch (err) {
    console.error("[getPublicTopicCounts]", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. GET LISTING PAGE METADATA
//    Single call that fetches everything a listing page needs except the
//    paginated service cards (those are fetched separately or client-side).
//    Returns: categories, topic counts, featured services, total count.
// ─────────────────────────────────────────────────────────────────────────────

export type ListingPageMeta = {
  categories: ServiceCategory[];
  topicCounts: ServiceTopicCount[];
  featured: PublicConsultingServiceCard[];
  totalCount: number;
};

export async function getListingPageMeta(
  featuredLimit = 3
): Promise<ListingPageMeta> {
  try {
    const now = new Date();
    const [categories, topicCounts, featured, totalCount] = await Promise.all([
      // categories
      prisma.consultingService.groupBy({
        by: ["category", "categoryAr"],
        where: { ...PUBLIC_WHERE, category: { not: null } },
        _count: { id: true },
      }),
      // topic counts
      prisma.consultingService.groupBy({
        by: ["topic"],
        where: PUBLIC_WHERE,
        _count: { id: true },
      }),
      // featured (respects featuredUntil)
      prisma.consultingService.findMany({
        where: {
          ...PUBLIC_WHERE,
          isFeatured: true,
          OR: [{ featuredUntil: null }, { featuredUntil: { gte: now } }],
        },
        select: cardSelect,
        orderBy: [{ sortOrder: "asc" }, { requestCount: "desc" }],
        take: featuredLimit,
      }),
      // total active services
      prisma.consultingService.count({ where: PUBLIC_WHERE }),
    ]);

    return {
      categories: categories
        .filter((r) => r.category !== null)
        .map((r) => ({
          category: r.category!,
          categoryAr: r.categoryAr,
          count: r._count.id,
        }))
        .sort((a, b) => b.count - a.count),
      topicCounts: topicCounts
        .map((r) => ({ topic: r.topic, count: r._count.id }))
        .sort((a, b) => b.count - a.count),
      featured: featured.map(serializeCard),
      totalCount,
    };
  } catch (err) {
    console.error("[getListingPageMeta]", err);
    return { categories: [], topicCounts: [], featured: [], totalCount: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. GET DETAIL PAGE DATA
//    Single call for the detail page:
//    service (full) + related cards + view count increment.
// ─────────────────────────────────────────────────────────────────────────────

export type DetailPageData = {
  service: PublicConsultingService;
  related: PublicConsultingServiceCard[];
};

export async function getDetailPageData(
  id: string,
  relatedLimit = 3
): Promise<
  | { success: true; data: DetailPageData }
  | { success: false; error: string }
> {
  try {
    if (!id?.trim()) return { success: false, error: "Service ID is required." };

    const service = await prisma.consultingService.findUnique({
      where: { id, ...PUBLIC_WHERE },
      select: fullSelect,
    });
    if (!service) return { success: false, error: "Service not found." };

    // Related + view increment run in parallel — view increment is non-fatal
    const [related] = await Promise.all([
      // related services
      (async () => {
        const sameTopic = await prisma.consultingService.findMany({
          where: { ...PUBLIC_WHERE, topic: service.topic, id: { not: id } },
          select: cardSelect,
          orderBy: [{ isFeatured: "desc" }, { requestCount: "desc" }],
          take: relatedLimit,
        });
        if (sameTopic.length >= relatedLimit) return sameTopic.map(serializeCard);
        const topUp = await prisma.consultingService.findMany({
          where: {
            ...PUBLIC_WHERE,
            id: { not: id, notIn: sameTopic.map((s) => s.id) },
          },
          select: cardSelect,
          orderBy: { requestCount: "desc" },
          take: relatedLimit - sameTopic.length,
        });
        return [...sameTopic, ...topUp].map(serializeCard);
      })(),
      // view counter (fire-and-forget)
      prisma.consultingService
        .updateMany({
          where: { id, ...PUBLIC_WHERE },
          data: { viewCount: { increment: 1 } },
        })
        .catch(() => null),
    ]);

    return {
      success: true,
      data: { service: serializeFull(service), related },
    };
  } catch (err) {
    console.error("[getDetailPageData]", err);
    return { success: false, error: "Failed to load service." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. SEARCH SERVICES  (search bar autocomplete / results page)
//     Lightweight — returns only id, title, titleAr, topic, primaryImage.
// ─────────────────────────────────────────────────────────────────────────────

export type ServiceSearchResult = {
  id: string;
  title: string;
  titleAr: string | null;
  topic: ConsultingServiceTopic;
  category: string | null;
  categoryAr: string | null;
  shortDesc: string | null;
  shortDescAr: string | null;
  primaryImage: string | null;
};

export async function searchConsultingServices(
  query: string,
  limit = 8
): Promise<ServiceSearchResult[]> {
  try {
    const q = query.trim();
    if (!q) return [];

    const results = await prisma.consultingService.findMany({
      where: {
        ...PUBLIC_WHERE,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { titleAr: { contains: q, mode: "insensitive" } },
          { shortDesc: { contains: q, mode: "insensitive" } },
          { shortDescAr: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { categoryAr: { contains: q, mode: "insensitive" } },
          { tags: { has: q } },
        ],
      },
      select: {
        id: true,
        title: true,
        titleAr: true,
        topic: true,
        category: true,
        categoryAr: true,
        shortDesc: true,
        shortDescAr: true,
        images: {
          where: { isPrimary: true },
          select: { url: true },
          take: 1,
        },
      },
      orderBy: [{ isFeatured: "desc" }, { requestCount: "desc" }],
      take: limit,
    });

    return results.map((s) => ({
      id: s.id,
      title: s.title,
      titleAr: s.titleAr,
      topic: s.topic,
      category: s.category,
      categoryAr: s.categoryAr,
      shortDesc: s.shortDesc,
      shortDescAr: s.shortDescAr,
      primaryImage: s.images[0]?.url ?? null,
    }));
  } catch (err) {
    console.error("[searchConsultingServices]", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. GET SERVICES COUNT BY TOPIC  (homepage stats strip)
// ─────────────────────────────────────────────────────────────────────────────

export async function getServiceStats(): Promise<{
  totalServices: number;
  totalTopics: number;
  totalRequests: number;
}> {
  try {
    const [totalServices, topicsRaw, agg] = await Promise.all([
      prisma.consultingService.count({ where: PUBLIC_WHERE }),
      prisma.consultingService.groupBy({
        by: ["topic"],
        where: PUBLIC_WHERE,
        _count: true,
      }),
      prisma.consultingService.aggregate({
        where: PUBLIC_WHERE,
        _sum: { requestCount: true },
      }),
    ]);

    return {
      totalServices,
      totalTopics: topicsRaw.length,
      totalRequests: Number(agg._sum.requestCount ?? 0),
    };
  } catch (err) {
    console.error("[getServiceStats]", err);
    return { totalServices: 0, totalTopics: 0, totalRequests: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. INCREMENT VIEW COUNT  (standalone — call from client components)
//     Fire-and-forget, never throws, never blocks rendering.
// ─────────────────────────────────────────────────────────────────────────────

export async function incrementServiceView(id: string): Promise<void> {
  try {
    await prisma.consultingService.updateMany({
      where: { id, ...PUBLIC_WHERE },
      data: { viewCount: { increment: 1 } },
    });
  } catch {
    /* non-fatal */
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// SITEMAP HELPER – Lightweight fetch of all public service IDs and updatedAt
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllServiceIdsForSitemap(): Promise<
  Array<{ id: string; updatedAt: Date }>
> {
  const services = await prisma.consultingService.findMany({
    where: { isActive: true, isDeleted: false },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return services;
}