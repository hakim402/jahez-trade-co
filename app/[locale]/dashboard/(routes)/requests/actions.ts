"use server"

// app/[locale]/dashboard/(routes)/requests/actions.ts

import { auth }           from "@clerk/nextjs/server"
import { prisma }         from "@/lib/prisma"
import { z }              from "zod"
import { RequestStatus, QuoteStatus, Prisma } from "@prisma/client"
import { writeFile, mkdir, unlink } from "fs/promises"
import { existsSync }     from "fs"
import path               from "path"
import { revalidatePath } from "next/cache"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export type UserPlanInfo = {
  planName:  string
  limit:     number       // Infinity = unlimited
  usedCount: number
  hasAccess: boolean
}

export type SerializedFile = {
  id:           string
  url:          string
  fileType:     string
  fileName:     string | null
  fileSize:     number | null
  requestId:    string | null
  quoteId:      string | null
  uploadedById: string | null
  createdAt:    string
}

export type SerializedQuote = {
  id:          string
  requestId:   string
  createdById: string
  price:       string       // Decimal → string to avoid serialization issues
  currency:    string
  status:      QuoteStatus
  validUntil:  string | null
  revision:    number
  adminNotes:  string | null
  isDeleted:   boolean
  createdAt:   string
  updatedAt:   string
  createdBy:   { id: string; email: string; fullName: string | null }
  files:       SerializedFile[]
}

export type SerializedRequest = {
  id:               string
  clientId:         string
  productLink:      string | null
  description:      string | null
  quantity:         number
  shippingCountry:  string
  customNotes:      string | null
  status:           RequestStatus
  priority:         number
  acceptedQuoteId:  string | null
  aiEstimatedPrice: string | null   // Decimal → string
  aiConfidence:     number | null
  isDeleted:        boolean
  createdAt:        string
  updatedAt:        string
  files:            SerializedFile[]
  quotes:           SerializedQuote[]
  acceptedQuote:    SerializedQuote | null
  statusHistory: Array<{
    id:         string
    requestId:  string
    oldStatus:  RequestStatus
    newStatus:  RequestStatus
    changedAt:  string
    changedBy:  { id: string; email: string; fullName: string | null }
  }>
}

export type UserContext = {
  user: { id: string; fullName: string | null; email: string; avatarUrl: string | null }
  plan: UserPlanInfo
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "client-requests")

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "text/csv",
  "application/zip", "application/x-zip-compressed",
])
const MAX_BYTES = 20 * 1024 * 1024  // 20 MB

// Plan name → max *active* (non-deleted) requests.
// Keys are lowercased plan names from Clerk. Add/rename to match yours.
const PLAN_LIMIT_MAP: Record<string, number> = {
  free:       2,
  starter:    5,
  pro:        15,
  business:   50,
  enterprise: Infinity,
  vip:        Infinity,
}

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

async function requireClient() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("UNAUTHORIZED")

  const user = await prisma.user.findUnique({
    where:  { clerkId, isDeleted: false, isActive: true },
    select: { id: true, role: true, fullName: true, email: true, avatarUrl: true },
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

async function getAdminIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where:  { role: "ADMIN", isDeleted: false, isActive: true },
    select: { id: true },
  })
  return admins.map((a) => a.id)
}

function serializeFile(f: any): SerializedFile {
  return {
    ...f,
    createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt,
  }
}

function serializeQuote(q: any): SerializedQuote {
  return {
    ...q,
    price:     q.price?.toString() ?? "0",
    validUntil:q.validUntil instanceof Date ? q.validUntil.toISOString() : q.validUntil,
    createdAt: q.createdAt instanceof Date  ? q.createdAt.toISOString()  : q.createdAt,
    updatedAt: q.updatedAt instanceof Date  ? q.updatedAt.toISOString()  : q.updatedAt,
    files:     (q.files ?? []).map(serializeFile),
  }
}

function serializeRequest(r: any): SerializedRequest {
  return {
    ...r,
    aiEstimatedPrice: r.aiEstimatedPrice ? r.aiEstimatedPrice.toString() : null,
    createdAt:  r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    updatedAt:  r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
    files:      (r.files ?? []).map(serializeFile),
    quotes:     (r.quotes ?? []).map(serializeQuote),
    acceptedQuote: r.acceptedQuote ? serializeQuote(r.acceptedQuote) : null,
    statusHistory: (r.statusHistory ?? []).map((h: any) => ({
      ...h,
      changedAt: h.changedAt instanceof Date ? h.changedAt.toISOString() : h.changedAt,
    })),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Prisma select — used by list + single fetch
// ─────────────────────────────────────────────────────────────────────────────

const requestSelect = {
  id: true, clientId: true, productLink: true, description: true,
  quantity: true, shippingCountry: true, customNotes: true,
  status: true, priority: true, acceptedQuoteId: true,
  aiEstimatedPrice: true, aiConfidence: true,
  isDeleted: true, createdAt: true, updatedAt: true,

  files: {
    select: {
      id: true, url: true, fileType: true, fileName: true, fileSize: true,
      requestId: true, quoteId: true, uploadedById: true, createdAt: true,
    },
  },

  quotes: {
    where:   { isDeleted: false },
    orderBy: { revision: "desc" as const },
    select: {
      id: true, requestId: true, createdById: true, price: true,
      currency: true, status: true, validUntil: true, revision: true,
      adminNotes: true, isDeleted: true, createdAt: true, updatedAt: true,
      createdBy: { select: { id: true, email: true, fullName: true } },
      files: {
        select: {
          id: true, url: true, fileType: true, fileName: true,
          fileSize: true, requestId: true, quoteId: true,
          uploadedById: true, createdAt: true,
        },
      },
    },
  },

  statusHistory: {
    orderBy: { changedAt: "desc" as const },
    select: {
      id: true, requestId: true, oldStatus: true, newStatus: true, changedAt: true,
      changedBy: { select: { id: true, email: true, fullName: true } },
    },
  },

  acceptedQuote: {
    select: {
      id: true, requestId: true, createdById: true, price: true,
      currency: true, status: true, validUntil: true, revision: true,
      adminNotes: true, isDeleted: true, createdAt: true, updatedAt: true,
      createdBy: { select: { id: true, email: true, fullName: true } },
      files: {
        select: {
          id: true, url: true, fileType: true, fileName: true,
          fileSize: true, requestId: true, quoteId: true,
          uploadedById: true, createdAt: true,
        },
      },
    },
  },
} as const

// ═════════════════════════════════════════════════════════════════════════════
// ── 1. PLAN / CONTEXT ────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Resolves the user's current plan and how many active requests they have.
 *
 * BILLING_ENABLED=false  →  every user gets unlimited access regardless of plan.
 * BILLING_ENABLED=true   →  plan is read from the active SubscriptionItem and
 *                           mapped to a request limit via PLAN_LIMIT_MAP.
 */
export async function getUserPlanInfo(userId: string): Promise<UserPlanInfo> {
  const billingEnabled = process.env.BILLING_ENABLED === "true"

  const usedCount = await prisma.productRequest.count({
    where: { clientId: userId, isDeleted: false },
  })

  // ── Billing disabled — unlimited ─────────────────────────────────────────
  if (!billingEnabled) {
    return {
      planName:  "Platform Access",
      limit:     Infinity,
      usedCount,
      hasAccess: true,
    }
  }

  // ── Billing enabled — read active subscription item ───────────────────────
  const subscription = await prisma.subscription.findUnique({
    where:  { userId },
    select: {
      items: {
        where:   { status: "ACTIVE" },
        orderBy: { isDefaultPlan: "asc" },   // non-default first (paid plan)
        take:    1,
        select:  {
          plan: { select: { name: true, isDefault: true } },
        },
      },
    },
  })

  const plan = subscription?.items[0]?.plan
  if (!plan) {
    return { planName: "None", limit: 0, usedCount, hasAccess: false }
  }

  const key   = plan.name.toLowerCase()
  const limit = PLAN_LIMIT_MAP[key] ?? (plan.isDefault ? 2 : 0)

  return {
    planName:  plan.name,
    limit,
    usedCount,
    hasAccess: limit === Infinity || usedCount < limit,
  }
}

/**
 * Single call that hydrates the client dashboard top bar —
 * returns the authenticated user + their plan info.
 */
export async function getClientContext(): Promise<ActionResult<UserContext>> {
  try {
    const user = await requireClient()
    const plan = await getUserPlanInfo(user.id)
    return { success: true, data: { user, plan } }
  } catch (err) {
    if (err instanceof Error) return authError(err)
    console.error("[getClientContext]", err)
    return { success: false, error: "Failed to load context" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 2. READ ──────────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const listSchema = z.object({
  page:     z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  status:   z.nativeEnum(RequestStatus).optional(),
})

/**
 * Returns the current client's product requests, paginated and optionally
 * filtered by status. Quotes are visible to the client only when SENT/ACCEPTED.
 * adminNotes on quotes are always included (they're informational for the client).
 */
export async function getMyRequests(
  raw: z.infer<typeof listSchema>,
): Promise<ActionResult<{
  requests:   SerializedRequest[]
  pagination: { page: number; pageSize: number; totalCount: number; totalPages: number }
}>> {
  try {
    const user = await requireClient()
    const { page, pageSize, status } = listSchema.parse(raw)

    const where: Prisma.ProductRequestWhereInput = {
      clientId:  user.id,
      isDeleted: false,
      ...(status && { status }),
    }

    const [totalCount, requests] = await Promise.all([
      prisma.productRequest.count({ where }),
      prisma.productRequest.findMany({
        where,
        select:  requestSelect,
        orderBy: { createdAt: "desc" },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
      }),
    ])

    return {
      success: true,
      data: {
        requests:   requests.map(serializeRequest),
        pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
      },
    }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[getMyRequests]", err)
    return { success: false, error: "Failed to fetch requests" }
  }
}

/**
 * Returns a single request by ID, verifying ownership.
 */
export async function getMyRequest(
  requestId: string,
): Promise<ActionResult<SerializedRequest>> {
  try {
    const user = await requireClient()

    const req = await prisma.productRequest.findUnique({
      where:  { id: requestId, isDeleted: false },
      select: requestSelect,
    })

    if (!req)                      return { success: false, error: "Request not found" }
    if (req.clientId !== user.id)  return { success: false, error: "Access denied" }

    return { success: true, data: serializeRequest(req) }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[getMyRequest]", err)
    return { success: false, error: "Failed to fetch request" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 3. CREATE REQUEST ────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const createSchema = z.object({
  productLink:     z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description:     z.string().min(1, "Description is required").max(2000),
  quantity:        z.number().int().positive("Quantity must be a positive number"),
  shippingCountry: z.string().min(2, "Shipping country is required"),
  customNotes:     z.string().max(1000).optional(),
})

export async function createProductRequest(
  raw: z.infer<typeof createSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireClient()

    // ── Plan gate ──────────────────────────────────────────────────────────
    const plan = await getUserPlanInfo(user.id)
    if (!plan.hasAccess) {
      if (plan.limit === 0) {
        // No plan at all → signal UI to show upgrade prompt
        return { success: false, error: "UPGRADE_REQUIRED" }
      }
      return {
        success: false,
        error:   `Your ${plan.planName} plan allows ${plan.limit} request${plan.limit !== 1 ? "s" : ""}. You have used ${plan.usedCount}. Please upgrade to submit more.`,
      }
    }

    const validated = createSchema.parse(raw)

    const request = await prisma.$transaction(async (tx) => {
      const req = await tx.productRequest.create({
        data: {
          clientId:        user.id,
          productLink:     validated.productLink || null,
          description:     validated.description,
          quantity:        validated.quantity,
          shippingCountry: validated.shippingCountry,
          customNotes:     validated.customNotes || null,
          status:          "SUBMITTED",
        },
      })

      // Seed the status history
      await tx.requestStatusHistory.create({
        data: {
          requestId:   req.id,
          oldStatus:   "SUBMITTED",
          newStatus:   "SUBMITTED",
          changedById: user.id,
        },
      })

      // Notify all admins
      const adminIds = await getAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map((adminId) => ({
            userId:    adminId,
            title:     "New Product Request",
            message:   `${user.fullName ?? user.email} submitted a new request: ${validated.description.slice(0, 80)}`,
            type:      "REQUEST",
            requestId: req.id,
          })),
        })
      }

      return req
    })

    revalidatePath("/dashboard/requests")
    return { success: true, data: { id: request.id } }
  } catch (err) {
    if (err instanceof z.ZodError)  return { success: false, error: err.issues[0].message }
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[createProductRequest]", err)
    return { success: false, error: "Failed to create request" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 4. FILE MANAGEMENT ───────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export async function uploadClientFile(
  formData: FormData,
): Promise<ActionResult<{ id: string; url: string; fileName: string }>> {
  try {
    const user      = await requireClient()
    const file      = formData.get("file")      as File   | null
    const requestId = formData.get("requestId") as string | null

    if (!file)      return { success: false, error: "No file provided" }
    if (!requestId) return { success: false, error: "No requestId provided" }

    if (!ALLOWED_MIME.has(file.type)) return { success: false, error: "File type not allowed" }
    if (file.size > MAX_BYTES)         return { success: false, error: "File exceeds 20 MB limit" }

    // Verify ownership and that the request is still editable
    const req = await prisma.productRequest.findUnique({
      where:  { id: requestId, isDeleted: false },
      select: { clientId: true, status: true },
    })
    if (!req)                     return { success: false, error: "Request not found" }
    if (req.clientId !== user.id) return { success: false, error: "Access denied" }

    // Allow file uploads while the request is open
    const uploadableStatuses: RequestStatus[] = ["SUBMITTED", "IN_REVIEW", "QUOTED"]
    if (!uploadableStatuses.includes(req.status)) {
      return { success: false, error: "Files can only be added to open requests" }
    }

    if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true })

    const ext      = file.name.split(".").pop() ?? "bin"
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const fullPath = path.join(UPLOAD_DIR, safeName)
    await writeFile(fullPath, Buffer.from(await file.arrayBuffer()))

    const url    = `/uploads/client-requests/${safeName}`
    const record = await prisma.file.create({
      data: {
        url,
        fileType:     file.type,
        fileName:     file.name,
        fileSize:     file.size,
        requestId,
        uploadedById: user.id,
      },
    })

    revalidatePath("/dashboard/requests")
    return { success: true, data: { id: record.id, url, fileName: file.name } }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[uploadClientFile]", err)
    return { success: false, error: "Upload failed" }
  }
}

export async function deleteClientFile(
  fileId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const user = await requireClient()

    const file = await prisma.file.findUnique({
      where:  { id: fileId },
      select: {
        id: true, url: true, uploadedById: true,
        request: { select: { clientId: true, status: true } },
      },
    })
    if (!file)                              return { success: false, error: "File not found" }
    if (file.request?.clientId !== user.id) return { success: false, error: "Access denied" }

    // Only deletable while the request is still open
    const deletableStatuses: RequestStatus[] = ["SUBMITTED", "IN_REVIEW"]
    if (file.request?.status && !deletableStatuses.includes(file.request.status)) {
      return { success: false, error: "Cannot remove files from requests in progress" }
    }

    if (file.url.startsWith("/uploads/")) {
      const disk = path.join(process.cwd(), "public", file.url)
      try { await unlink(disk) } catch { /* already gone */ }
    }

    await prisma.file.delete({ where: { id: fileId } })
    revalidatePath("/dashboard/requests")
    return { success: true, data: { ok: true } }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[deleteClientFile]", err)
    return { success: false, error: "Failed to delete file" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 5. QUOTE ACTIONS ─────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export async function acceptQuote(
  quoteId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const user = await requireClient()

    const quote = await prisma.quote.findUnique({
      where:   { id: quoteId, isDeleted: false },
      include: {
        request: {
          select: { id: true, clientId: true, status: true, acceptedQuoteId: true },
        },
      },
    })

    if (!quote)                              return { success: false, error: "Quote not found" }
    if (quote.request.clientId !== user.id) return { success: false, error: "Unauthorized" }
    if (quote.status !== "SENT")            return { success: false, error: "Only SENT quotes can be accepted" }
    if (quote.request.acceptedQuoteId)      return { success: false, error: "A quote is already accepted for this request" }

    await prisma.$transaction(async (tx) => {
      await tx.quote.update({
        where: { id: quoteId },
        data:  { status: "ACCEPTED" },
      })

      await tx.quoteStatusHistory.create({
        data: { quoteId, oldStatus: "SENT", newStatus: "ACCEPTED", changedById: user.id },
      })

      await tx.productRequest.update({
        where: { id: quote.requestId },
        data:  { acceptedQuoteId: quoteId, status: "APPROVED" },
      })

      await tx.requestStatusHistory.create({
        data: {
          requestId:   quote.requestId,
          oldStatus:   quote.request.status,
          newStatus:   "APPROVED",
          changedById: user.id,
        },
      })

      const adminIds = await getAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map((adminId) => ({
            userId:    adminId,
            title:     "Quote Accepted",
            message:   `${user.fullName ?? user.email} accepted a quote of ${quote.price} ${quote.currency}.`,
            type:      "QUOTE",
            requestId: quote.requestId,
            quoteId,
          })),
        })
      }
    })

    revalidatePath("/dashboard/requests")
    return { success: true, data: { ok: true } }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[acceptQuote]", err)
    return { success: false, error: "Failed to accept quote" }
  }
}

export async function rejectQuote(
  quoteId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const user = await requireClient()

    const quote = await prisma.quote.findUnique({
      where:   { id: quoteId, isDeleted: false },
      include: {
        request: { select: { id: true, clientId: true } },
      },
    })

    if (!quote)                              return { success: false, error: "Quote not found" }
    if (quote.request.clientId !== user.id) return { success: false, error: "Unauthorized" }
    if (quote.status !== "SENT")            return { success: false, error: "Only SENT quotes can be rejected" }

    await prisma.$transaction(async (tx) => {
      await tx.quote.update({
        where: { id: quoteId },
        data:  { status: "REJECTED" },
      })

      await tx.quoteStatusHistory.create({
        data: { quoteId, oldStatus: "SENT", newStatus: "REJECTED", changedById: user.id },
      })

      const adminIds = await getAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map((adminId) => ({
            userId:    adminId,
            title:     "Quote Rejected",
            message:   `${user.fullName ?? user.email} rejected a quote for request #${quote.requestId.slice(-6).toUpperCase()}.`,
            type:      "QUOTE",
            requestId: quote.requestId,
            quoteId,
          })),
        })
      }
    })

    revalidatePath("/dashboard/requests")
    return { success: true, data: { ok: true } }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[rejectQuote]", err)
    return { success: false, error: "Failed to reject quote" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 6. DELETE OWN REQUEST ────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export async function deleteMyRequest(
  requestId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const user = await requireClient()

    const req = await prisma.productRequest.findUnique({
      where:  { id: requestId, isDeleted: false },
      select: { clientId: true, status: true },
    })

    if (!req)                      return { success: false, error: "Request not found" }
    if (req.clientId !== user.id)  return { success: false, error: "Unauthorized" }
    if (req.status !== "SUBMITTED") return { success: false, error: "Only SUBMITTED requests can be withdrawn" }

    await prisma.productRequest.update({
      where: { id: requestId },
      data:  { isDeleted: true },
    })

    revalidatePath("/dashboard/requests")
    return { success: true, data: { ok: true } }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[deleteMyRequest]", err)
    return { success: false, error: "Failed to withdraw request" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 7. DASHBOARD SUMMARY (one call to hydrate the page) ──────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export type DashboardSummary = {
  user:      UserContext["user"]
  plan:      UserPlanInfo
  requests:  SerializedRequest[]
  pagination:{ page: number; pageSize: number; totalCount: number; totalPages: number }
  counts: {
    submitted:    number
    inReview:     number
    quoted:       number
    approved:     number
    inProduction: number
    shipped:      number
    completed:    number
  }
}

export async function getDashboardSummary(
  page     = 1,
  pageSize = 20,
  status?: RequestStatus,
): Promise<ActionResult<DashboardSummary>> {
  try {
    const user = await requireClient()

    const baseWhere: Prisma.ProductRequestWhereInput = {
      clientId: user.id, isDeleted: false,
    }

    const [plan, totalCount, requests, byStatus] = await Promise.all([
      getUserPlanInfo(user.id),
      prisma.productRequest.count({ where: { ...baseWhere, ...(status && { status }) } }),
      prisma.productRequest.findMany({
        where:   { ...baseWhere, ...(status && { status }) },
        select:  requestSelect,
        orderBy: { createdAt: "desc" },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
      }),
      // Count by status for the status pills
      prisma.productRequest.groupBy({
        by:    ["status"],
        where: baseWhere,
        _count: true,
      }),
    ])

    const countMap = byStatus.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = r._count; return acc
    }, {})

    return {
      success: true,
      data: {
        user,
        plan,
        requests:   requests.map(serializeRequest),
        pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
        counts: {
          submitted:    countMap["SUBMITTED"]     ?? 0,
          inReview:     countMap["IN_REVIEW"]     ?? 0,
          quoted:       countMap["QUOTED"]         ?? 0,
          approved:     countMap["APPROVED"]       ?? 0,
          inProduction: countMap["IN_PRODUCTION"]  ?? 0,
          shipped:      countMap["SHIPPED"]        ?? 0,
          completed:    countMap["COMPLETED"]      ?? 0,
        },
      },
    }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[getDashboardSummary]", err)
    return { success: false, error: "Failed to load dashboard" }
  }
}