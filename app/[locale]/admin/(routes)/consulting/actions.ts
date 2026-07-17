"use server"

// app/[locale]/admin/(routes)/consulting/actions.ts

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-guard"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Prisma, ConsultingServiceTopic, ConsultingDeliveryFormat } from "@prisma/client"
import { writeFile, mkdir, unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

// ─────────────────────────────────────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────────────────────────────────────

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

function revalidateAll() {
  revalidatePath("/admin/consulting")
  revalidatePath("/services")
  revalidatePath("/ar/services")
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION A: CONSULTING REQUESTS ──────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Types — Requests
// ─────────────────────────────────────────────────────────────────────────────

export type ConsultingStatus = "NEW" | "IN_REVIEW" | "SCHEDULED" | "CLOSED"
export type ConsultingTopic = "sourcing" | "import" | "logistics" | "market_entry" | "supplier" | "other"

export type ConsultingRequestWithUser = {
  id: string
  userId: string | null
  fullName: string
  email: string
  phone: string | null
  company: string | null
  topic: string
  description: string
  budget: string | null
  status: string
  adminNotes: string | null
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  // Linked service (if the request came from a service card)
  linkedService: {
    id: string
    title: string
    titleAr: string | null
    topic: string
  } | null
  user: {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
    phone: string | null
  } | null
}

function serializeRequest(r: any): ConsultingRequestWithUser {
  return {
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
    linkedService: r.serviceRequests?.[0]?.service
      ? {
        id: r.serviceRequests[0].service.id,
        title: r.serviceRequests[0].service.title,
        titleAr: r.serviceRequests[0].service.titleAr,
        topic: r.serviceRequests[0].service.topic,
      }
      : null,
  }
}

const requestInclude = {
  user: { select: { id: true, email: true, fullName: true, avatarUrl: true, phone: true } },
  // Grab the first linked service if any (a request usually has 0 or 1)
  serviceRequests: {
    take: 1,
    select: {
      service: { select: { id: true, title: true, titleAr: true, topic: true } },
    },
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// A1. LIST REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

const listRequestsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  status: z.enum(["NEW", "IN_REVIEW", "SCHEDULED", "CLOSED"]).optional(),
  topic: z.string().optional(),
  search: z.string().optional(),
  serviceId: z.string().optional(), // filter by originating service
})

export async function getAllConsultingRequests(raw: z.infer<typeof listRequestsSchema>) {
  try {
    await requireAdmin()
    const { page, pageSize, status, topic, search, serviceId } = listRequestsSchema.parse(raw)

    const where: Prisma.ConsultingRequestWhereInput = { isDeleted: false }
    if (status) where.status = status
    if (topic) where.topic = topic

    if (search?.trim()) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    // Filter by originating service
    if (serviceId) {
      where.serviceRequests = { some: { serviceId } }
    }

    const [total, items] = await Promise.all([
      prisma.consultingRequest.count({ where }),
      prisma.consultingRequest.findMany({
        where,
        include: requestInclude,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return {
      success: true,
      data: {
        items: items.map(serializeRequest),
        pagination: {
          page, pageSize,
          totalCount: total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    }
  } catch (err) {
    console.error("[getAllConsultingRequests]", err)
    return { success: false, error: "Failed to fetch consulting requests" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A2. GET SINGLE REQUEST
// ─────────────────────────────────────────────────────────────────────────────

export async function getConsultingRequest(
  id: string
): Promise<ActionResult<ConsultingRequestWithUser>> {
  try {
    await requireAdmin()
    const item = await prisma.consultingRequest.findUnique({
      where: { id },
      include: requestInclude,
    })
    if (!item) return { success: false, error: "Not found" }
    return { success: true, data: serializeRequest(item) }
  } catch (err) {
    console.error("[getConsultingRequest]", err)
    return { success: false, error: "Failed to fetch request" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A3. UPDATE STATUS
// ─────────────────────────────────────────────────────────────────────────────

export async function updateConsultingStatus(
  id: string,
  status: ConsultingStatus,
): Promise<ActionResult<{ status: string }>> {
  try {
    const adminId = await requireAdmin()

    await prisma.consultingRequest.update({ where: { id }, data: { status } })

    await prisma.auditLog.create({
      data: {
        adminId,
        action: "UPDATE_CONSULTING_STATUS",
        entity: "ConsultingRequest",
        entityId: id,
        changes: { status } satisfies Prisma.InputJsonValue,
      },
    })

    revalidatePath("/admin/consulting")
    return { success: true, data: { status } }
  } catch (err) {
    console.error("[updateConsultingStatus]", err)
    return { success: false, error: "Failed to update status" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A4. UPDATE ADMIN NOTES
// ─────────────────────────────────────────────────────────────────────────────

export async function updateConsultingNotes(
  id: string,
  adminNotes: string,
): Promise<ActionResult<{ adminNotes: string | null }>> {
  try {
    const adminId = await requireAdmin()

    const trimmed = adminNotes.trim() || null
    await prisma.consultingRequest.update({ where: { id }, data: { adminNotes: trimmed } })

    await prisma.auditLog.create({
      data: {
        adminId,
        action: "UPDATE_CONSULTING_NOTES",
        entity: "ConsultingRequest",
        entityId: id,
        changes: { adminNotes: trimmed } satisfies Prisma.InputJsonValue,
      },
    })

    revalidatePath("/admin/consulting")
    return { success: true, data: { adminNotes: trimmed } }
  } catch (err) {
    console.error("[updateConsultingNotes]", err)
    return { success: false, error: "Failed to update notes" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A5. SOFT DELETE REQUEST
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteConsultingRequest(
  id: string
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId = await requireAdmin()

    await prisma.consultingRequest.update({ where: { id }, data: { isDeleted: true } })

    await prisma.auditLog.create({
      data: {
        adminId,
        action: "DELETE_CONSULTING_REQUEST",
        entity: "ConsultingRequest",
        entityId: id,
        changes: Prisma.JsonNull,
      },
    })

    revalidatePath("/admin/consulting")
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[deleteConsultingRequest]", err)
    return { success: false, error: "Failed to delete request" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A6. REPLY (in-app notification + audit)
// ─────────────────────────────────────────────────────────────────────────────

export async function replyToConsultingRequest(
  id: string,
  message: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId = await requireAdmin()

    const request = await prisma.consultingRequest.findUnique({
      where: { id },
      select: { userId: true, fullName: true, email: true },
    })
    if (!request) return { success: false, error: "Request not found" }

    if (request.userId) {
      await prisma.notification.create({
        data: {
          userId: request.userId,
          title: "Response to your consulting request",
          message: message.trim(),
          type: "CONSULTING",
          isRead: false,
        },
      })
    }

    await prisma.auditLog.create({
      data: {
        adminId,
        action: "REPLY_CONSULTING_REQUEST",
        entity: "ConsultingRequest",
        entityId: id,
        changes: { message } satisfies Prisma.InputJsonValue,
      },
    })

    revalidatePath("/admin/consulting")
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[replyToConsultingRequest]", err)
    return { success: false, error: "Failed to send reply" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A7. REQUEST STATS
// ─────────────────────────────────────────────────────────────────────────────

export async function getConsultingStats(): Promise<ActionResult<{
  total: number
  byStatus: Record<string, number>
  byTopic: Record<string, number>
  thisWeek: number
}>> {
  try {
    await requireAdmin()

    const weekStart = new Date(Date.now() - 7 * 86_400_000)

    const [byStatus, byTopic, thisWeek] = await Promise.all([
      prisma.consultingRequest.groupBy({
        by: ["status"], where: { isDeleted: false }, _count: true,
      }),
      prisma.consultingRequest.groupBy({
        by: ["topic"], where: { isDeleted: false }, _count: true,
      }),
      prisma.consultingRequest.count({
        where: { isDeleted: false, createdAt: { gte: weekStart } },
      }),
    ])

    const statusMap = byStatus.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = r._count; return acc
    }, {})
    const topicMap = byTopic.reduce<Record<string, number>>((acc, r) => {
      acc[r.topic] = r._count; return acc
    }, {})
    const total = Object.values(statusMap).reduce((a, b) => a + b, 0)

    return { success: true, data: { total, byStatus: statusMap, byTopic: topicMap, thisWeek } }
  } catch (err) {
    console.error("[getConsultingStats]", err)
    return { success: false, error: "Failed to fetch stats" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION B: CONSULTING SERVICES ──────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Types — Services
// ─────────────────────────────────────────────────────────────────────────────

export type ServiceImage = {
  id: string
  serviceId: string
  url: string
  altText: string | null
  isPrimary: boolean
  sortOrder: number
  createdAt: string
}

export type ConsultingServiceFull = {
  id: string
  title: string
  titleAr: string | null
  description: string
  descriptionAr: string | null
  shortDesc: string | null
  shortDescAr: string | null
  topic: ConsultingServiceTopic
  category: string | null
  categoryAr: string | null
  tags: string[]
  priceFrom: number | null
  priceCurrency: string
  duration: string | null
  durationAr: string | null
  deliveryFormat: ConsultingDeliveryFormat | null
  includesEn: string[]
  includesAr: string[]
  viewCount: number
  requestCount: number
  isFeatured: boolean
  featuredUntil: string | null
  sortOrder: number
  isActive: boolean
  isDeleted: boolean
  addedById: string | null
  images: ServiceImage[]
  _count: { serviceRequests: number }
  createdAt: string
  updatedAt: string
}

function serializeService(s: any): ConsultingServiceFull {
  return {
    ...s,
    priceFrom: s.priceFrom !== null ? Number(s.priceFrom) : null,
    featuredUntil: s.featuredUntil ? s.featuredUntil.toISOString() : null,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
    images: (s.images ?? []).map((img: any) => ({
      ...img,
      createdAt: img.createdAt instanceof Date ? img.createdAt.toISOString() : img.createdAt,
    })),
  }
}

const serviceSelect = {
  id: true, title: true, titleAr: true,
  description: true, descriptionAr: true,
  shortDesc: true, shortDescAr: true,
  topic: true, category: true, categoryAr: true, tags: true,
  priceFrom: true, priceCurrency: true,
  duration: true, durationAr: true, deliveryFormat: true,
  includesEn: true, includesAr: true,
  viewCount: true, requestCount: true,
  isFeatured: true, featuredUntil: true, sortOrder: true,
  isActive: true, isDeleted: true, addedById: true,
  images: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      id: true, serviceId: true, url: true,
      altText: true, isPrimary: true, sortOrder: true, createdAt: true,
    },
  },
  _count: { select: { serviceRequests: true } },
  createdAt: true, updatedAt: true,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// B1. LIST SERVICES
// ─────────────────────────────────────────────────────────────────────────────

const listServicesSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  topic: z.nativeEnum(ConsultingServiceTopic).optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function getAllConsultingServices(raw: z.infer<typeof listServicesSchema>) {
  try {
    await requireAdmin()
    const { page, pageSize, topic, search, isActive } = listServicesSchema.parse(raw)

    const where: Prisma.ConsultingServiceWhereInput = { isDeleted: false }
    if (topic !== undefined) where.topic = topic
    if (isActive !== undefined) where.isActive = isActive

    if (search?.trim()) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { titleAr: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { categoryAr: { contains: search, mode: "insensitive" } },
      ]
    }

    const [total, items] = await Promise.all([
      prisma.consultingService.count({ where }),
      prisma.consultingService.findMany({
        where,
        select: serviceSelect,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return {
      success: true,
      data: {
        items: items.map(serializeService),
        pagination: {
          page, pageSize,
          totalCount: total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    }
  } catch (err) {
    console.error("[getAllConsultingServices]", err)
    return { success: false, error: "Failed to fetch services" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B2. GET SINGLE SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export async function getConsultingService(
  id: string
): Promise<ActionResult<ConsultingServiceFull>> {
  try {
    await requireAdmin()
    const s = await prisma.consultingService.findUnique({ where: { id }, select: serviceSelect })
    if (!s) return { success: false, error: "Service not found" }
    return { success: true, data: serializeService(s) }
  } catch (err) {
    console.error("[getConsultingService]", err)
    return { success: false, error: "Failed to fetch service" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B3. CREATE SERVICE
// ─────────────────────────────────────────────────────────────────────────────

const serviceWriteSchema = z.object({
  title: z.string().min(2, "Title is required"),
  titleAr: z.string().optional(),
  description: z.string().min(10, "Description is required"),
  descriptionAr: z.string().optional(),
  shortDesc: z.string().max(200).optional(),
  shortDescAr: z.string().max(200).optional(),
  topic: z.nativeEnum(ConsultingServiceTopic),
  category: z.string().optional(),
  categoryAr: z.string().optional(),
  tags: z.array(z.string()).default([]),
  priceFrom: z.number().positive().optional(),
  priceCurrency: z.string().default("USD"),
  duration: z.string().optional(),
  durationAr: z.string().optional(),
  deliveryFormat: z.nativeEnum(ConsultingDeliveryFormat).optional(),
  includesEn: z.array(z.string()).default([]),
  includesAr: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  featuredUntil: z.coerce.date().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export async function createConsultingService(
  raw: z.infer<typeof serviceWriteSchema>
): Promise<ActionResult<ConsultingServiceFull>> {
  try {
    const adminId = await requireAdmin()
    const data = serviceWriteSchema.parse(raw)

    const service = await prisma.consultingService.create({
      data: { ...data, addedById: adminId },
      select: serviceSelect,
    })

    await prisma.auditLog.create({
      data: {
        adminId,
        action: "CREATE_CONSULTING_SERVICE",
        entity: "ConsultingService",
        entityId: service.id,
        changes: { title: data.title, topic: data.topic } satisfies Prisma.InputJsonValue,
      },
    })

    revalidateAll()
    return { success: true, data: serializeService(service) }
  } catch (err) {
    console.error("[createConsultingService]", err)
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    return { success: false, error: "Failed to create service" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B4. UPDATE SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export async function updateConsultingService(
  id: string,
  raw: Partial<z.infer<typeof serviceWriteSchema>>,
): Promise<ActionResult<ConsultingServiceFull>> {
  try {
    const adminId = await requireAdmin()
    const data = serviceWriteSchema.partial().parse(raw)

    const service = await prisma.consultingService.update({
      where: { id },
      data,
      select: serviceSelect,
    })

    await prisma.auditLog.create({
      data: {
        adminId,
        action: "UPDATE_CONSULTING_SERVICE",
        entity: "ConsultingService",
        entityId: id,
        changes: data as Prisma.InputJsonValue,
      },
    })

    revalidateAll()
    return { success: true, data: serializeService(service) }
  } catch (err) {
    console.error("[updateConsultingService]", err)
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    return { success: false, error: "Failed to update service" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B5. SOFT DELETE SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteConsultingService(
  id: string
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId = await requireAdmin()

    await prisma.consultingService.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    await prisma.auditLog.create({
      data: {
        adminId,
        action: "DELETE_CONSULTING_SERVICE",
        entity: "ConsultingService",
        entityId: id,
        changes: Prisma.JsonNull,
      },
    })

    revalidateAll()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[deleteConsultingService]", err)
    return { success: false, error: "Failed to delete service" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B6. TOGGLE ACTIVE
// ─────────────────────────────────────────────────────────────────────────────

export async function toggleConsultingServiceActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult<{ isActive: boolean }>> {
  try {
    const adminId = await requireAdmin()

    await prisma.consultingService.update({ where: { id }, data: { isActive } })

    await prisma.auditLog.create({
      data: {
        adminId,
        action: "TOGGLE_CONSULTING_SERVICE",
        entity: "ConsultingService",
        entityId: id,
        changes: { isActive } satisfies Prisma.InputJsonValue,
      },
    })

    revalidateAll()
    return { success: true, data: { isActive } }
  } catch (err) {
    console.error("[toggleConsultingServiceActive]", err)
    return { success: false, error: "Failed to toggle service" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B7. REORDER SERVICES (drag-and-drop)
// Takes an array of IDs in the desired order.
// ─────────────────────────────────────────────────────────────────────────────

export async function reorderConsultingServices(
  orderedIds: string[]
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId = await requireAdmin()

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.consultingService.update({ where: { id }, data: { sortOrder: index } })
      )
    )

    await prisma.auditLog.create({
      data: {
        adminId,
        action: "REORDER_CONSULTING_SERVICES",
        entity: "ConsultingService",
        changes: { count: orderedIds.length } satisfies Prisma.InputJsonValue,
      },
    })

    revalidateAll()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[reorderConsultingServices]", err)
    return { success: false, error: "Failed to reorder services" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B8. COMBINED STATS (requests + services)
// ─────────────────────────────────────────────────────────────────────────────

export async function getConsultingFullStats(): Promise<ActionResult<{
  requests: {
    total: number
    byStatus: Record<string, number>
    byTopic: Record<string, number>
    thisWeek: number
  }
  services: {
    total: number
    active: number
    featured: number
    totalRequests: number
    byTopic: Record<string, number>
    topServices: { id: string; title: string; requestCount: number }[]
  }
}>> {
  try {
    await requireAdmin()

    const weekStart = new Date(Date.now() - 7 * 86_400_000)
    const activeBase = { isDeleted: false }
    const svcBase = { isDeleted: false }

    const [
      reqByStatus, reqByTopic, reqThisWeek,
      svcByTopic, svcAgg, svcActive, svcFeatured, topSvc,
    ] = await Promise.all([
      prisma.consultingRequest.groupBy({
        by: ["status"], where: activeBase, _count: true,
      }),
      prisma.consultingRequest.groupBy({
        by: ["topic"], where: activeBase, _count: true,
      }),
      prisma.consultingRequest.count({
        where: { ...activeBase, createdAt: { gte: weekStart } },
      }),
      prisma.consultingService.groupBy({
        by: ["topic"], where: svcBase, _count: true,
      }),
      prisma.consultingService.aggregate({
        where: svcBase, _count: { id: true }, _sum: { requestCount: true },
      }),
      prisma.consultingService.count({ where: { ...svcBase, isActive: true } }),
      prisma.consultingService.count({ where: { ...svcBase, isFeatured: true } }),
      prisma.consultingService.findMany({
        where: svcBase,
        select: { id: true, title: true, requestCount: true },
        orderBy: { requestCount: "desc" },
        take: 5,
      }),
    ])

    const reqStatusMap = reqByStatus.reduce<Record<string, number>>((a, r) => {
      a[r.status] = r._count; return a
    }, {})
    const reqTopicMap = reqByTopic.reduce<Record<string, number>>((a, r) => {
      a[r.topic] = r._count; return a
    }, {})
    const svcTopicMap = svcByTopic.reduce<Record<string, number>>((a, r) => {
      a[r.topic] = r._count; return a
    }, {})
    const reqTotal = Object.values(reqStatusMap).reduce((a, b) => a + b, 0)

    return {
      success: true,
      data: {
        requests: {
          total: reqTotal,
          byStatus: reqStatusMap,
          byTopic: reqTopicMap,
          thisWeek: reqThisWeek,
        },
        services: {
          total: svcAgg._count.id,
          active: svcActive,
          featured: svcFeatured,
          totalRequests: Number(svcAgg._sum.requestCount ?? 0),
          byTopic: svcTopicMap,
          topServices: topSvc,
        },
      },
    }
  } catch (err) {
    console.error("[getConsultingFullStats]", err)
    return { success: false, error: "Failed to fetch stats" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B9. GET SERVICE REQUESTS (who requested a specific service)
// ─────────────────────────────────────────────────────────────────────────────

export async function getServiceRequests(serviceId: string, page = 1, pageSize = 20) {
  try {
    await requireAdmin()

    const [total, items] = await Promise.all([
      prisma.consultingServiceRequest.count({ where: { serviceId } }),
      prisma.consultingServiceRequest.findMany({
        where: { serviceId },
        include: {
          user: {
            select: { id: true, email: true, fullName: true, avatarUrl: true },
          },
          request: {
            select: {
              id: true, status: true, fullName: true, email: true,
              description: true, budget: true, createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    const serialized = items.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      request: r.request
        ? { ...r.request, createdAt: r.request.createdAt.toISOString() }
        : null,
    }))

    return {
      success: true,
      data: {
        items: serialized,
        pagination: {
          page, pageSize,
          totalCount: total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    }
  } catch (err) {
    console.error("[getServiceRequests]", err)
    return { success: false, error: "Failed to fetch service requests" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION C: SERVICE IMAGES ────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "consulting-services")
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024  // 5 MB

// ─────────────────────────────────────────────────────────────────────────────
// C1. UPLOAD IMAGE
// ─────────────────────────────────────────────────────────────────────────────

export async function uploadServiceImage(
  serviceId: string,
  formData: FormData,
): Promise<ActionResult<ServiceImage>> {
  try {
    const adminId = await requireAdmin()
    const file = formData.get("file") as File | null

    if (!file) return { success: false, error: "No file provided" }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) return { success: false, error: "Only JPEG, PNG, WebP or GIF allowed" }
    if (file.size > MAX_IMAGE_BYTES) return { success: false, error: "Image must be under 5 MB" }

    if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true })

    const ext = file.name.split(".").pop() ?? "jpg"
    const filename = `${serviceId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const fullPath = path.join(UPLOAD_DIR, filename)
    await writeFile(fullPath, Buffer.from(await file.arrayBuffer()))

    const url = `/uploads/consulting-services/${filename}`
    const existingCount = await prisma.consultingServiceImage.count({ where: { serviceId } })

    const image = await prisma.consultingServiceImage.create({
      data: {
        serviceId,
        url,
        altText: (formData.get("altText") as string) || null,
        isPrimary: existingCount === 0,
        sortOrder: existingCount,
      },
    })

    await prisma.auditLog.create({
      data: {
        adminId,
        action: "UPLOAD_SERVICE_IMAGE",
        entity: "ConsultingServiceImage",
        entityId: image.id,
        changes: { serviceId, url } satisfies Prisma.InputJsonValue,
      },
    })

    revalidateAll()
    return {
      success: true,
      data: { ...image, createdAt: image.createdAt.toISOString() },
    }
  } catch (err) {
    console.error("[uploadServiceImage]", err)
    return { success: false, error: "Failed to upload image" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C2. DELETE IMAGE
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteServiceImage(
  imageId: string
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId = await requireAdmin()
    const image = await prisma.consultingServiceImage.findUnique({ where: { id: imageId } })
    if (!image) return { success: false, error: "Image not found" }

    // Remove from disk
    if (image.url.startsWith("/uploads/")) {
      const diskPath = path.join(process.cwd(), "public", image.url)
      try { await unlink(diskPath) } catch { /* already gone */ }
    }

    await prisma.consultingServiceImage.delete({ where: { id: imageId } })

    // If we deleted the primary image, promote the next one
    if (image.isPrimary) {
      const next = await prisma.consultingServiceImage.findFirst({
        where: { serviceId: image.serviceId },
        orderBy: { sortOrder: "asc" },
      })
      if (next) {
        await prisma.consultingServiceImage.update({
          where: { id: next.id },
          data: { isPrimary: true },
        })
      }
    }

    await prisma.auditLog.create({
      data: {
        adminId,
        action: "DELETE_SERVICE_IMAGE",
        entity: "ConsultingServiceImage",
        entityId: imageId,
        changes: { url: image.url } satisfies Prisma.InputJsonValue,
      },
    })

    revalidateAll()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[deleteServiceImage]", err)
    return { success: false, error: "Failed to delete image" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C3. SET PRIMARY IMAGE
// ─────────────────────────────────────────────────────────────────────────────

export async function setPrimaryServiceImage(
  serviceId: string,
  imageId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await requireAdmin()

    await prisma.$transaction([
      prisma.consultingServiceImage.updateMany({
        where: { serviceId },
        data: { isPrimary: false },
      }),
      prisma.consultingServiceImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ])

    revalidateAll()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[setPrimaryServiceImage]", err)
    return { success: false, error: "Failed to set primary image" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C4. REORDER IMAGES
// ─────────────────────────────────────────────────────────────────────────────

export async function reorderServiceImages(
  orderedIds: string[]
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await requireAdmin()

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.consultingServiceImage.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    )

    revalidateAll()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[reorderServiceImages]", err)
    return { success: false, error: "Failed to reorder images" }
  }
}