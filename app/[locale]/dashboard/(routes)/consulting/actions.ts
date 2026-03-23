"use server"

// app/[locale]/dashboard/(routes)/consulting/actions.ts

import { auth }           from "@clerk/nextjs/server"
import { prisma }         from "@/lib/prisma"
import { z }              from "zod"
import { Prisma, ConsultingServiceTopic } from "@prisma/client"
import { revalidatePath } from "next/cache"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export type ConsultingStatus = "NEW" | "IN_REVIEW" | "SCHEDULED" | "CLOSED"
export type ConsultingTopic  = ConsultingServiceTopic

/**
 * Billing gate info for the consulting dashboard.
 *
 * BILLING_ENABLED=false  → hasAccess = true, planName = "Platform Access"
 * BILLING_ENABLED=true   → hasAccess = true only when user has an active
 *                          subscription item (any plan).
 *
 * Note: Unlike requests/bookings, consulting does NOT have per-plan request
 * quotas — access is binary (subscription required or not). The open-request
 * cap of 5 applies to ALL users who have access.
 */
export type ConsultingPlanInfo = {
  planName:       string
  hasAccess:      boolean
  billingEnabled: boolean
  openCount:      number    // current open (NEW | IN_REVIEW) requests
  openLimit:      number    // always MAX_OPEN_REQUESTS (5) when hasAccess
}

export type SerializedConsultingRequest = {
  id:          string
  userId:      string | null
  fullName:    string
  email:       string
  phone:       string | null
  company:     string | null
  topic:       string
  description: string
  budget:      string | null
  status:      ConsultingStatus
  adminNotes:  string | null   // only exposed when SCHEDULED or CLOSED
  isDeleted:   boolean
  createdAt:   string
  updatedAt:   string
  linkedService: {
    id:          string
    title:       string
    titleAr:     string | null
    topic:       string
    shortDesc:   string | null
    shortDescAr: string | null
    primaryImage:string | null
  } | null
}

export type ConsultingDashboardSummary = {
  user: { id: string; fullName: string | null; email: string; avatarUrl: string | null }
  planInfo:     ConsultingPlanInfo
  freeForm: {
    items:      SerializedConsultingRequest[]
    total:      number
    open:       number
    pagination: { page: number; pageSize: number; totalCount: number; totalPages: number }
  }
  serviceRequests: {
    items: SerializedConsultingRequest[]
    total: number
    open:  number
  }
  totalOpen:     number
  canSubmitMore: boolean   // false when totalOpen >= 5 OR !planInfo.hasAccess
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_OPEN_REQUESTS = 5
const OPEN_STATUSES: ConsultingStatus[]         = ["NEW", "IN_REVIEW"]
const NOTES_VISIBLE_STATUSES: ConsultingStatus[] = ["SCHEDULED", "CLOSED"]

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

async function requireClient() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("UNAUTHORIZED")

  const user = await prisma.user.findUnique({
    where:  { clerkId, isDeleted: false, isActive: true },
    select: { id: true, role: true, fullName: true, email: true, avatarUrl: true, phone: true },
  })
  if (!user)                  throw new Error("USER_NOT_FOUND")
  if (user.role !== "CLIENT") throw new Error("FORBIDDEN")
  return user
}

function authError(err: unknown): ActionResult<never> {
  const msg = err instanceof Error ? err.message : ""
  if (msg === "UNAUTHORIZED")   return { success: false, error: "Please sign in to continue." }
  if (msg === "USER_NOT_FOUND") return { success: false, error: "Account not found." }
  if (msg === "FORBIDDEN")      return { success: false, error: "Only client accounts can perform this action." }
  return { success: false, error: "An unexpected error occurred." }
}

async function notifyAdmins(title: string, message: string): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where:  { role: "ADMIN", isActive: true, isDeleted: false },
      select: { id: true },
    })
    if (admins.length === 0) return
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId:  a.id,
        title,
        message,
        type:    "CONSULTING",
        isRead:  false,
      })),
    })
  } catch { /* non-fatal */ }
}

function serializeRequest(r: any): SerializedConsultingRequest {
  const showNotes = NOTES_VISIBLE_STATUSES.includes(r.status as ConsultingStatus)
  const sr        = r.serviceRequests?.[0]
  const linkedService = sr?.service
    ? {
        id:           sr.service.id,
        title:        sr.service.title,
        titleAr:      sr.service.titleAr,
        topic:        sr.service.topic,
        shortDesc:    sr.service.shortDesc,
        shortDescAr:  sr.service.shortDescAr,
        primaryImage: sr.service.images?.[0]?.url ?? null,
      }
    : null

  return {
    id:           r.id,
    userId:       r.userId,
    fullName:     r.fullName,
    email:        r.email,
    phone:        r.phone,
    company:      r.company,
    topic:        r.topic,
    description:  r.description,
    budget:       r.budget,
    status:       r.status as ConsultingStatus,
    adminNotes:   showNotes ? (r.adminNotes ?? null) : null,
    isDeleted:    r.isDeleted,
    createdAt:    r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    updatedAt:    r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
    linkedService,
  }
}

const requestInclude = {
  serviceRequests: {
    take:   1,
    select: {
      id:        true,
      serviceId: true,
      service: {
        select: {
          id: true, title: true, titleAr: true, topic: true,
          shortDesc: true, shortDescAr: true,
          images: {
            where:  { isPrimary: true },
            select: { url: true },
            take:   1,
          },
        },
      },
    },
  },
} as const

async function getOpenCount(userId: string): Promise<number> {
  return prisma.consultingRequest.count({
    where: { userId, isDeleted: false, status: { in: OPEN_STATUSES } },
  })
}

// ═════════════════════════════════════════════════════════════════════════════
// ── BILLING GATE ─────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Resolves whether the user can access the consulting module.
 *
 * BILLING_ENABLED=false  →  unlimited / full platform access.
 * BILLING_ENABLED=true   →  any active SubscriptionItem required.
 *                           No plan-specific quotas — access is binary.
 *
 * The 5-open-request cap applies on top of billing access and is enforced
 * in every mutation via `canSubmitMore`.
 */
export async function getUserConsultingPlanInfo(
  userId: string,
): Promise<ConsultingPlanInfo> {
  const billingEnabled = process.env.BILLING_ENABLED === "true"

  const openCount = await getOpenCount(userId)

  // ── Billing disabled — full platform access, no cap ─────────────────────
  if (!billingEnabled) {
    return {
      planName:       "Platform Access",
      hasAccess:      true,
      billingEnabled: false,
      openCount,
      openLimit:      Infinity,    // no cap when billing is off
    }
  }

  // ── Billing enabled — any active subscription item grants access ──────────
  const subscription = await prisma.subscription.findUnique({
    where:  { userId },
    select: {
      items: {
        where:   { status: "ACTIVE" },
        orderBy: { isDefaultPlan: "asc" },
        take:    1,
        select:  { plan: { select: { name: true, isDefault: true } } },
      },
    },
  })

  const activePlan = subscription?.items[0]?.plan

  if (!activePlan) {
    return {
      planName:       "No Plan",
      hasAccess:      false,
      billingEnabled: true,
      openCount,
      openLimit:      MAX_OPEN_REQUESTS,
    }
  }

  return {
    planName:       activePlan.name,
    hasAccess:      true,
    billingEnabled: true,
    openCount,
    openLimit:      MAX_OPEN_REQUESTS,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION A: FREE-FORM CONSULTING REQUESTS ─────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const submitFreeFormSchema = z.object({
  fullName:    z.string().min(2,   "Name is required"),
  email:       z.string().email(  "Valid email is required"),
  phone:       z.string().optional(),
  company:     z.string().optional(),
  topic:       z.nativeEnum(ConsultingServiceTopic, { message: "Select a valid topic" }),
  description: z.string()
    .min(10,  "Please describe your need (min 10 characters)")
    .max(2000,"Description is too long"),
  budget:      z.string().optional(),
})

export async function submitConsultingRequest(
  raw: z.infer<typeof submitFreeFormSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user      = await requireClient()
    const validated = submitFreeFormSchema.parse(raw)

    // ── Billing gate ──────────────────────────────────────────────────────
    const planInfo = await getUserConsultingPlanInfo(user.id)
    if (!planInfo.hasAccess) {
      return { success: false, error: "UPGRADE_REQUIRED" }
    }

    // ── Open-request cap (only applies when billing is enabled) ──────────────
    if (planInfo.openLimit !== Infinity && planInfo.openCount >= planInfo.openLimit) {
      return {
        success: false,
        error:   `You have ${planInfo.openCount} open consulting request${planInfo.openCount !== 1 ? "s" : ""}. Please wait for a response before submitting another.`,
      }
    }

    const req = await prisma.consultingRequest.create({
      data: {
        userId:      user.id,
        fullName:    validated.fullName.trim(),
        email:       validated.email.trim().toLowerCase(),
        phone:       validated.phone?.trim()   || null,
        company:     validated.company?.trim() || null,
        topic:       validated.topic,
        description: validated.description.trim(),
        budget:      validated.budget?.trim()  || null,
        status:      "NEW",
      },
    })

    await notifyAdmins(
      "New Consulting Request",
      `${validated.fullName} submitted a consulting request: ${validated.topic}`,
    )

    revalidatePath("/dashboard/consulting")
    return { success: true, data: { id: req.id } }
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[submitConsultingRequest]", err)
    return { success: false, error: "Failed to submit request. Please try again." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION B: SERVICE-ORIGINATED REQUESTS ───────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const requestServiceSchema = z.object({
  serviceId:   z.string().min(1),
  fullName:    z.string().min(2,   "Name is required"),
  email:       z.string().email(  "Valid email is required"),
  phone:       z.string().optional(),
  company:     z.string().optional(),
  description: z.string()
    .min(10,  "Please describe your needs (min 10 characters)")
    .max(2000,"Description is too long"),
  budget:      z.string().optional(),
})

export async function requestConsultingService(
  raw: z.infer<typeof requestServiceSchema>,
): Promise<ActionResult<{ consultingRequestId: string; serviceRequestId: string }>> {
  try {
    const user      = await requireClient()
    const validated = requestServiceSchema.parse(raw)

    // ── Billing gate ──────────────────────────────────────────────────────
    const planInfo = await getUserConsultingPlanInfo(user.id)
    if (!planInfo.hasAccess) {
      return { success: false, error: "UPGRADE_REQUIRED" }
    }

    const service = await prisma.consultingService.findUnique({
      where:  { id: validated.serviceId, isActive: true, isDeleted: false },
      select: { id: true, topic: true, title: true, titleAr: true },
    })
    if (!service) {
      return { success: false, error: "Service not found or no longer available." }
    }

    // ── Open-request cap (only applies when billing is enabled) ──────────────
    if (planInfo.openLimit !== Infinity && planInfo.openCount >= planInfo.openLimit) {
      return {
        success: false,
        error:   `You have ${planInfo.openCount} open requests — the maximum allowed. Please wait for a response before submitting another.`,
      }
    }

    const duplicate = await prisma.consultingServiceRequest.findFirst({
      where: {
        serviceId: service.id,
        userId:    user.id,
        request:   { isDeleted: false, status: { in: OPEN_STATUSES } },
      },
      select: { id: true },
    })
    if (duplicate) {
      return {
        success: false,
        error:   "You already have an open request for this service. Please wait for a response.",
      }
    }

    const [consultingReq, serviceReq] = await prisma.$transaction(async (tx) => {
      const cr = await tx.consultingRequest.create({
        data: {
          userId:      user.id,
          fullName:    validated.fullName.trim(),
          email:       validated.email.trim().toLowerCase(),
          phone:       validated.phone?.trim()   || null,
          company:     validated.company?.trim() || null,
          topic:       service.topic,
          description: validated.description.trim(),
          budget:      validated.budget?.trim() || null,
          status:      "NEW",
        },
      })

      const sr = await tx.consultingServiceRequest.create({
        data: { serviceId: service.id, requestId: cr.id, userId: user.id },
      })

      await tx.consultingService.update({
        where: { id: service.id },
        data:  { requestCount: { increment: 1 } },
      })

      return [cr, sr]
    })

    await notifyAdmins(
      `Service Request: ${service.title}`,
      `${validated.fullName} requested the "${service.title}" consulting service.`,
    )

    revalidatePath("/dashboard/consulting")
    return {
      success: true,
      data: { consultingRequestId: consultingReq.id, serviceRequestId: serviceReq.id },
    }
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[requestConsultingService]", err)
    return { success: false, error: "Failed to submit request. Please try again." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION C: READ ──────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export async function getMyConsultingRequests(opts: {
  page?:     number
  pageSize?: number
  status?:   ConsultingStatus
} = {}): Promise<ActionResult<{
  items:      SerializedConsultingRequest[]
  pagination: { page: number; pageSize: number; totalCount: number; totalPages: number }
  open:       number
}>> {
  try {
    const user     = await requireClient()
    const page     = Math.max(1, opts.page     ?? 1)
    const pageSize = Math.min(50, opts.pageSize ?? 10)

    const where: Prisma.ConsultingRequestWhereInput = {
      userId:          user.id,
      isDeleted:       false,
      serviceRequests: { none: {} },
      ...(opts.status && { status: opts.status }),
    }

    const [totalCount, items, open] = await Promise.all([
      prisma.consultingRequest.count({ where }),
      prisma.consultingRequest.findMany({
        where, include: requestInclude, orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      getOpenCount(user.id),
    ])

    return {
      success: true,
      data: {
        items:      items.map(serializeRequest),
        pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
        open,
      },
    }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[getMyConsultingRequests]", err)
    return { success: false, error: "Failed to load your consulting requests." }
  }
}

export async function getMyServiceRequests(): Promise<ActionResult<{
  items: SerializedConsultingRequest[]
  total: number
  open:  number
}>> {
  try {
    const user = await requireClient()

    const [items, open] = await Promise.all([
      prisma.consultingRequest.findMany({
        where: { userId: user.id, isDeleted: false, serviceRequests: { some: {} } },
        include: requestInclude,
        orderBy: { createdAt: "desc" },
      }),
      getOpenCount(user.id),
    ])

    return {
      success: true,
      data: { items: items.map(serializeRequest), total: items.length, open },
    }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[getMyServiceRequests]", err)
    return { success: false, error: "Failed to load your service requests." }
  }
}

export async function getMyConsultingRequest(
  id: string,
): Promise<ActionResult<SerializedConsultingRequest>> {
  try {
    const user = await requireClient()

    const req = await prisma.consultingRequest.findUnique({
      where: { id, isDeleted: false }, include: requestInclude,
    })
    if (!req)                   return { success: false, error: "Request not found." }
    if (req.userId !== user.id) return { success: false, error: "Access denied." }

    return { success: true, data: serializeRequest(req) }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[getMyConsultingRequest]", err)
    return { success: false, error: "Failed to load request." }
  }
}

export async function getConsultingDashboardSummary(
  page     = 1,
  pageSize = 10,
  status?: ConsultingStatus,
): Promise<ActionResult<ConsultingDashboardSummary>> {
  try {
    const user = await requireClient()

    const baseWhere: Prisma.ConsultingRequestWhereInput = {
      userId: user.id, isDeleted: false,
    }

    const freeFormWhere: Prisma.ConsultingRequestWhereInput = {
      ...baseWhere, serviceRequests: { none: {} }, ...(status && { status }),
    }

    const serviceWhere: Prisma.ConsultingRequestWhereInput = {
      ...baseWhere, serviceRequests: { some: {} },
    }

    const [
      planInfo,
      freeFormTotal,
      freeFormItems,
      serviceItems,
      totalOpen,
    ] = await Promise.all([
      getUserConsultingPlanInfo(user.id),
      prisma.consultingRequest.count({ where: freeFormWhere }),
      prisma.consultingRequest.findMany({
        where:   freeFormWhere,
        include: requestInclude,
        orderBy: { createdAt: "desc" },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
      }),
      prisma.consultingRequest.findMany({
        where: serviceWhere, include: requestInclude, orderBy: { createdAt: "desc" },
      }),
      getOpenCount(user.id),
    ])

    const serializedFreeForm    = freeFormItems.map(serializeRequest)
    const serializedServiceReqs = serviceItems.map(serializeRequest)

    const freeFormOpen = serializedFreeForm.filter((r) =>
      OPEN_STATUSES.includes(r.status as ConsultingStatus)
    ).length

    const serviceOpen = serializedServiceReqs.filter((r) =>
      OPEN_STATUSES.includes(r.status as ConsultingStatus)
    ).length

    // canSubmitMore: billing gate passes AND under the open-request cap
    // When BILLING_ENABLED=false → openLimit is Infinity → no cap → always true
    const canSubmitMore = planInfo.hasAccess &&
      (planInfo.openLimit === Infinity || totalOpen < planInfo.openLimit)

    return {
      success: true,
      data: {
        user: { id: user.id, fullName: user.fullName, email: user.email, avatarUrl: user.avatarUrl },
        planInfo,
        freeForm: {
          items:      serializedFreeForm,
          total:      freeFormTotal,
          open:       freeFormOpen,
          pagination: { page, pageSize, totalCount: freeFormTotal, totalPages: Math.ceil(freeFormTotal / pageSize) },
        },
        serviceRequests: {
          items: serializedServiceReqs,
          total: serviceItems.length,
          open:  serviceOpen,
        },
        totalOpen,
        canSubmitMore,
      },
    }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[getConsultingDashboardSummary]", err)
    return { success: false, error: "Failed to load consulting dashboard." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION D: MUTATIONS ─────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const updateSchema = z.object({
  description: z.string().min(10).max(2000).optional(),
  phone:       z.string().optional(),
  company:     z.string().optional(),
  budget:      z.string().optional(),
})

export async function updateMyConsultingRequest(
  id:  string,
  raw: z.infer<typeof updateSchema>,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const user      = await requireClient()
    const validated = updateSchema.parse(raw)

    const req = await prisma.consultingRequest.findUnique({
      where:  { id, isDeleted: false },
      select: { userId: true, status: true },
    })
    if (!req)                   return { success: false, error: "Request not found." }
    if (req.userId !== user.id) return { success: false, error: "Access denied." }
    if (req.status !== "NEW")   return { success: false, error: "Only NEW requests can be edited." }

    await prisma.consultingRequest.update({
      where: { id },
      data: {
        ...(validated.description !== undefined && { description: validated.description.trim() }),
        ...(validated.phone       !== undefined && { phone:       validated.phone?.trim()   || null }),
        ...(validated.company     !== undefined && { company:     validated.company?.trim() || null }),
        ...(validated.budget      !== undefined && { budget:      validated.budget?.trim()  || null }),
      },
    })

    revalidatePath("/dashboard/consulting")
    return { success: true, data: { ok: true } }
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[updateMyConsultingRequest]", err)
    return { success: false, error: "Failed to update request." }
  }
}

export async function cancelConsultingRequest(
  id: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const user = await requireClient()

    const req = await prisma.consultingRequest.findUnique({
      where:  { id, isDeleted: false },
      select: {
        userId:  true,
        status:  true,
        serviceRequests: { select: { serviceId: true }, take: 1 },
      },
    })

    if (!req)                   return { success: false, error: "Request not found." }
    if (req.userId !== user.id) return { success: false, error: "Access denied." }
    if (req.status !== "NEW")   return { success: false, error: "Only NEW requests can be cancelled." }

    const linkedServiceId = req.serviceRequests[0]?.serviceId ?? null

    if (linkedServiceId) {
      await prisma.$transaction([
        prisma.consultingRequest.update({ where: { id }, data: { isDeleted: true } }),
        prisma.consultingService.update({
          where: { id: linkedServiceId },
          data:  { requestCount: { decrement: 1 } },
        }),
      ])
    } else {
      await prisma.consultingRequest.update({ where: { id }, data: { isDeleted: true } })
    }

    revalidatePath("/dashboard/consulting")
    return { success: true, data: { ok: true } }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[cancelConsultingRequest]", err)
    return { success: false, error: "Failed to cancel request." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION E: SERVICE CARD HELPERS ──────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export async function hasRequestedService(serviceId: string): Promise<boolean> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return false

    const user = await prisma.user.findUnique({
      where:  { clerkId, isDeleted: false, isActive: true },
      select: { id: true },
    })
    if (!user) return false

    const existing = await prisma.consultingServiceRequest.findFirst({
      where: {
        serviceId,
        userId:  user.id,
        request: { isDeleted: false, status: { in: OPEN_STATUSES } },
      },
      select: { id: true },
    })

    return !!existing
  } catch {
    return false
  }
}

export async function getOpenRequestCount(): Promise<number | null> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return null

    const user = await prisma.user.findUnique({
      where:  { clerkId, isDeleted: false, isActive: true },
      select: { id: true },
    })
    if (!user) return null

    return getOpenCount(user.id)
  } catch {
    return null
  }
}