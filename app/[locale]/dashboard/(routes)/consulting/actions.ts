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

// Status is stored as plain String in the schema — these are the valid values.
export type ConsultingStatus = "NEW" | "IN_REVIEW" | "SCHEDULED" | "CLOSED"
export type ConsultingTopic  = ConsultingServiceTopic

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
  // adminNotes only exposed when status is SCHEDULED or CLOSED
  adminNotes:  string | null
  isDeleted:   boolean
  createdAt:   string
  updatedAt:   string
  // If this request originated from a service card, include brief service info
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
  canSubmitMore: boolean   // false when totalOpen >= 5
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// Maximum open (NEW | IN_REVIEW) consulting requests per client across both
// free-form and service-originated requests combined.
const MAX_OPEN_REQUESTS = 5

// Statuses that block new submissions
const OPEN_STATUSES: ConsultingStatus[] = ["NEW", "IN_REVIEW"]

// Statuses where adminNotes are visible to the client
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
  } catch { /* non-fatal — notifications must never block the main flow */ }
}

function serializeRequest(r: any): SerializedConsultingRequest {
  const showNotes = NOTES_VISIBLE_STATUSES.includes(r.status as ConsultingStatus)

  // Grab the linked service from serviceRequests junction if present
  const sr = r.serviceRequests?.[0]
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

// Include for fetching requests with their linked service
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

// ─────────────────────────────────────────────────────────────────────────────
// Open-request count (shared between free-form and service-originated)
// ─────────────────────────────────────────────────────────────────────────────

async function getOpenCount(userId: string): Promise<number> {
  return prisma.consultingRequest.count({
    where: {
      userId,
      isDeleted: false,
      status:    { in: OPEN_STATUSES },
    },
  })
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

/**
 * Submit a free-form consulting request from the dashboard.
 * Contact details are pre-filled from the user's profile but overridable.
 */
export async function submitConsultingRequest(
  raw: z.infer<typeof submitFreeFormSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user      = await requireClient()
    const validated = submitFreeFormSchema.parse(raw)

    const openCount = await getOpenCount(user.id)
    if (openCount >= MAX_OPEN_REQUESTS) {
      return {
        success: false,
        error:   `You have ${openCount} open consulting request${openCount !== 1 ? "s" : ""}. Please wait for a response before submitting another.`,
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

/**
 * Request a specific consulting service card.
 * Creates a ConsultingRequest pre-filled with the service's topic,
 * then creates the ConsultingServiceRequest junction record.
 * Increments the service's requestCount atomically.
 */
export async function requestConsultingService(
  raw: z.infer<typeof requestServiceSchema>,
): Promise<ActionResult<{ consultingRequestId: string; serviceRequestId: string }>> {
  try {
    const user      = await requireClient()
    const validated = requestServiceSchema.parse(raw)

    // Verify the service exists and is publicly accessible
    const service = await prisma.consultingService.findUnique({
      where:  { id: validated.serviceId, isActive: true, isDeleted: false },
      select: { id: true, topic: true, title: true, titleAr: true },
    })
    if (!service) {
      return { success: false, error: "Service not found or no longer available." }
    }

    // Global open-request limit
    const openCount = await getOpenCount(user.id)
    if (openCount >= MAX_OPEN_REQUESTS) {
      return {
        success: false,
        error:   `You have ${openCount} open requests — the maximum allowed. Please wait for a response before submitting another.`,
      }
    }

    // Prevent duplicate open request for the same service by this user
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

    // Atomic: create ConsultingRequest + junction + increment counter
    const [consultingReq, serviceReq] = await prisma.$transaction(async (tx) => {
      const cr = await tx.consultingRequest.create({
        data: {
          userId:      user.id,
          fullName:    validated.fullName.trim(),
          email:       validated.email.trim().toLowerCase(),
          phone:       validated.phone?.trim()   || null,
          company:     validated.company?.trim() || null,
          topic:       service.topic,         // pre-filled from service
          description: validated.description.trim(),
          budget:      validated.budget?.trim() || null,
          status:      "NEW",
        },
      })

      const sr = await tx.consultingServiceRequest.create({
        data: {
          serviceId: service.id,
          requestId: cr.id,
          userId:    user.id,
        },
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
      data: {
        consultingRequestId: consultingReq.id,
        serviceRequestId:    serviceReq.id,
      },
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

/**
 * Get all free-form consulting requests (not originated from a service card),
 * paginated and optionally filtered by status.
 */
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
      userId:    user.id,
      isDeleted: false,
      // Free-form only: exclude requests that came from a service card
      serviceRequests: { none: {} },
      ...(opts.status && { status: opts.status }),
    }

    const [totalCount, items, open] = await Promise.all([
      prisma.consultingRequest.count({ where }),
      prisma.consultingRequest.findMany({
        where,
        include: requestInclude,
        orderBy: { createdAt: "desc" },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
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

/**
 * Get all service-originated consulting requests for the current user.
 * Returns the full list (not paginated — users typically have few of these).
 */
export async function getMyServiceRequests(): Promise<ActionResult<{
  items: SerializedConsultingRequest[]
  total: number
  open:  number
}>> {
  try {
    const user = await requireClient()

    const [items, open] = await Promise.all([
      prisma.consultingRequest.findMany({
        where: {
          userId:    user.id,
          isDeleted: false,
          // Service-originated: has at least one junction row
          serviceRequests: { some: {} },
        },
        include: requestInclude,
        orderBy: { createdAt: "desc" },
      }),
      getOpenCount(user.id),
    ])

    return {
      success: true,
      data: {
        items: items.map(serializeRequest),
        total: items.length,
        open,
      },
    }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[getMyServiceRequests]", err)
    return { success: false, error: "Failed to load your service requests." }
  }
}

/**
 * Get a single consulting request by ID, verifying ownership.
 */
export async function getMyConsultingRequest(
  id: string,
): Promise<ActionResult<SerializedConsultingRequest>> {
  try {
    const user = await requireClient()

    const req = await prisma.consultingRequest.findUnique({
      where:   { id, isDeleted: false },
      include: requestInclude,
    })

    if (!req)                    return { success: false, error: "Request not found." }
    if (req.userId !== user.id)  return { success: false, error: "Access denied." }

    return { success: true, data: serializeRequest(req) }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[getMyConsultingRequest]", err)
    return { success: false, error: "Failed to load request." }
  }
}

/**
 * Full dashboard summary — one call to hydrate the entire consulting page.
 * Returns both free-form and service-originated requests plus counts.
 */
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
      ...baseWhere,
      serviceRequests: { none: {} },
      ...(status && { status }),
    }

    const serviceWhere: Prisma.ConsultingRequestWhereInput = {
      ...baseWhere,
      serviceRequests: { some: {} },
    }

    const [
      freeFormTotal,
      freeFormItems,
      serviceItems,
      totalOpen,
    ] = await Promise.all([
      prisma.consultingRequest.count({ where: freeFormWhere }),
      prisma.consultingRequest.findMany({
        where:   freeFormWhere,
        include: requestInclude,
        orderBy: { createdAt: "desc" },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
      }),
      prisma.consultingRequest.findMany({
        where:   serviceWhere,
        include: requestInclude,
        orderBy: { createdAt: "desc" },
      }),
      getOpenCount(user.id),
    ])

    const serializedFreeForm   = freeFormItems.map(serializeRequest)
    const serializedServiceReqs= serviceItems.map(serializeRequest)

    const freeFormOpen = serializedFreeForm.filter((r) =>
      OPEN_STATUSES.includes(r.status as ConsultingStatus)
    ).length

    const serviceOpen  = serializedServiceReqs.filter((r) =>
      OPEN_STATUSES.includes(r.status as ConsultingStatus)
    ).length

    return {
      success: true,
      data: {
        user: {
          id:        user.id,
          fullName:  user.fullName,
          email:     user.email,
          avatarUrl: user.avatarUrl,
        },
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
        canSubmitMore: totalOpen < MAX_OPEN_REQUESTS,
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

/**
 * Update a free-form consulting request.
 * Only allowed while status = "NEW" (before admin starts reviewing).
 */
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

/**
 * Cancel / soft-delete a consulting request.
 * Only allowed while status = "NEW".
 * For service-originated requests, decrements the service's requestCount.
 */
export async function cancelConsultingRequest(
  id: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const user = await requireClient()

    const req = await prisma.consultingRequest.findUnique({
      where:   { id, isDeleted: false },
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
      // Decrement service request counter and soft-delete atomically
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
// ─────────────────────────────────────────────────────────────────────────────
// These are called from the public /services page to check state before
// showing the "Request this service" button.
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Fast boolean check — disables the "Request" button on a public service card
 * if the current user already has an open request for that service.
 * Returns false if the user is not logged in (guest visitors).
 */
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

/**
 * Returns the open-request count for the authenticated user.
 * Used by the public service page to disable the button with a message
 * if the user has reached the limit.
 * Returns null if the user is not logged in.
 */
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