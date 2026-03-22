"use server"

// app/[locale]/admin/(routes)/requests/actions.ts

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-guard"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Prisma, RequestStatus, QuoteStatus } from "@prisma/client"
import { writeFile, mkdir, unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

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

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "requests")

const ALLOWED_FILE_TYPES = new Set([
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
const MAX_FILE_BYTES = 20 * 1024 * 1024  // 20 MB

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true })
}

function revalidateRequests() {
  revalidatePath("/admin/requests")
  revalidatePath("/admin/product-requests")
}

function serializeRequest(r: any): any {
  return {
    ...r,
    aiEstimatedPrice: r.aiEstimatedPrice ? Number(r.aiEstimatedPrice) : null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
    quotes: (r.quotes ?? []).map((q: any) => ({
      ...q,
      price: Number(q.price),
      createdAt: q.createdAt instanceof Date ? q.createdAt.toISOString() : q.createdAt,
      updatedAt: q.updatedAt instanceof Date ? q.updatedAt.toISOString() : q.updatedAt,
      validUntil: q.validUntil instanceof Date ? q.validUntil.toISOString() : q.validUntil,
      files: q.files ?? [],
      statusHistory: (q.statusHistory ?? []).map(serializeHistoryEntry),
    })),
    acceptedQuote: r.acceptedQuote
      ? {
        ...r.acceptedQuote,
        price: Number(r.acceptedQuote.price),
        createdAt: r.acceptedQuote.createdAt instanceof Date ? r.acceptedQuote.createdAt.toISOString() : r.acceptedQuote.createdAt,
        updatedAt: r.acceptedQuote.updatedAt instanceof Date ? r.acceptedQuote.updatedAt.toISOString() : r.acceptedQuote.updatedAt,
        validUntil: r.acceptedQuote.validUntil instanceof Date ? r.acceptedQuote.validUntil.toISOString() : r.acceptedQuote.validUntil,
        files: r.acceptedQuote.files ?? [],
        statusHistory: (r.acceptedQuote.statusHistory ?? []).map(serializeHistoryEntry),
      }
      : null,
    aiSuggestions: (r.aiSuggestions ?? []).map((s: any) => ({
      ...s,
      estimatedPrice: Number(s.estimatedPrice),
      createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    })),
    statusHistory: (r.statusHistory ?? []).map(serializeHistoryEntry),
    files: (r.files ?? []).map(serializeFile),
    shippingEstimate: r.shippingEstimate ? serializeShippingEstimate(r.shippingEstimate) : null,
  }
}

function serializeHistoryEntry(h: any) {
  return { ...h, changedAt: h.changedAt instanceof Date ? h.changedAt.toISOString() : h.changedAt }
}

function serializeFile(f: any) {
  return { ...f, createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt }
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

// ─────────────────────────────────────────────────────────────────────────────
// Base select — used by both list and single fetches
// ─────────────────────────────────────────────────────────────────────────────

const requestSelect = {
  id: true, clientId: true, productLink: true, description: true,
  quantity: true, shippingCountry: true, customNotes: true,
  status: true, priority: true, acceptedQuoteId: true,
  aiParsedData: true, aiEstimatedPrice: true, aiConfidence: true,
  isDeleted: true, createdAt: true, updatedAt: true,

  client: {
    select: { id: true, email: true, fullName: true, avatarUrl: true, phone: true },
  },

  files: {
    select: {
      id: true, url: true, fileType: true, fileName: true,
      fileSize: true, requestId: true, quoteId: true,
      uploadedById: true, createdAt: true,
    },
  },

  quotes: {
    where: { isDeleted: false },
    orderBy: { revision: "desc" as const },
    select: {
      id: true, requestId: true, createdById: true, price: true,
      currency: true, status: true, validUntil: true, revision: true,
      adminNotes: true, isDeleted: true, createdAt: true, updatedAt: true,
      createdBy: { select: { id: true, email: true, fullName: true } },
      files: { select: { id: true, url: true, fileType: true, fileName: true, fileSize: true, createdAt: true } },
      statusHistory: {
        orderBy: { changedAt: "desc" as const },
        select: {
          id: true, quoteId: true, oldStatus: true, newStatus: true, changedAt: true,
          changedBy: { select: { id: true, email: true, fullName: true } }
        },
      },
    },
  },

  statusHistory: {
    orderBy: { changedAt: "desc" as const },
    select: {
      id: true, requestId: true, oldStatus: true, newStatus: true, changedAt: true,
      changedBy: { select: { id: true, email: true, fullName: true } }
    },
  },

  aiSuggestions: {
    orderBy: { createdAt: "desc" as const },
    take: 5,
    select: {
      id: true, requestId: true, estimatedPrice: true, currency: true,
      confidence: true, suggestedSupplierIds: true, createdAt: true
    },
  },

  acceptedQuote: {
    select: {
      id: true, requestId: true, createdById: true, price: true,
      currency: true, status: true, validUntil: true, revision: true,
      adminNotes: true, isDeleted: true, createdAt: true, updatedAt: true,
      createdBy: { select: { id: true, email: true, fullName: true } },
      files: { select: { id: true, url: true, fileType: true, fileName: true, fileSize: true, createdAt: true } },
      statusHistory: {
        orderBy: { changedAt: "desc" as const },
        select: {
          id: true, quoteId: true, oldStatus: true, newStatus: true, changedAt: true,
          changedBy: { select: { id: true, email: true, fullName: true } }
        },
      },
    },
  },

  _count: { select: { quotes: true, files: true } },
} as const

// Extended select that includes shipping estimate (for detail view)
const requestDetailSelect = {
  ...requestSelect,
  // pull the most recent shipping estimate for this client + shippingCountry
  client: {
    select: {
      id: true, email: true, fullName: true, avatarUrl: true, phone: true,
    },
  },
} as const

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION A: PRODUCT REQUESTS ─────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// A1. LIST REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

const listRequestsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(RequestStatus).optional(),
  priority: z.number().int().min(0).max(5).optional(),
  clientEmail: z.string().optional(),
  search: z.string().optional(),
  createdAtFrom: z.coerce.date().optional(),
  createdAtTo: z.coerce.date().optional(),
  shippingCountry: z.string().optional(),
  hasQuotes: z.boolean().optional(),
  sortBy: z.enum(["createdAt", "priority", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export async function getAllProductRequests(raw: z.infer<typeof listRequestsSchema>) {
  try {
    await requireAdmin()
    const {
      page, pageSize, status, priority, clientEmail, search,
      createdAtFrom, createdAtTo, shippingCountry, hasQuotes, sortBy, sortOrder,
    } = listRequestsSchema.parse(raw)

    const where: Prisma.ProductRequestWhereInput = { isDeleted: false }

    if (status) where.status = status
    if (priority !== undefined) where.priority = priority
    if (shippingCountry) where.shippingCountry = { equals: shippingCountry, mode: "insensitive" }

    if (createdAtFrom || createdAtTo) {
      where.createdAt = {
        ...(createdAtFrom && { gte: createdAtFrom }),
        ...(createdAtTo && { lte: createdAtTo }),
      }
    }

    if (hasQuotes !== undefined) {
      where.quotes = hasQuotes ? { some: { isDeleted: false } } : { none: {} }
    }

    if (clientEmail) {
      where.client = { email: { contains: clientEmail, mode: "insensitive" } }
    }

    if (search?.trim() && !clientEmail) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { productLink: { contains: search, mode: "insensitive" } },
        { customNotes: { contains: search, mode: "insensitive" } },
        {
          client: {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { fullName: { contains: search, mode: "insensitive" } },
            ]
          }
        },
      ]
    }

    const orderBy: Prisma.ProductRequestOrderByWithRelationInput[] =
      sortBy === "priority"
        ? [{ priority: sortOrder }, { createdAt: "desc" }]
        : sortBy === "status"
          ? [{ status: sortOrder }, { createdAt: "desc" }]
          : [{ createdAt: sortOrder }]

    const [totalCount, requests] = await Promise.all([
      prisma.productRequest.count({ where }),
      prisma.productRequest.findMany({
        where,
        select: requestSelect,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return {
      success: true,
      data: {
        requests: requests.map(serializeRequest),
        pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
      },
    }
  } catch (err) {
    console.error("[getAllProductRequests]", err)
    return { success: false, error: "Failed to fetch requests" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A2. GET SINGLE REQUEST (with shipping estimate lookup)
// ─────────────────────────────────────────────────────────────────────────────

export async function getProductRequest(id: string) {
  try {
    await requireAdmin()

    const r = await prisma.productRequest.findUnique({
      where: { id },
      select: requestSelect,
    })
    if (!r) return { success: false, error: "Not found" }

    // Fetch most recent shipping estimate for this client to the same country
    let shippingEstimate: SerializedShippingEstimate | null = null
    if (r.clientId && r.shippingCountry) {
      const est = await prisma.shippingEstimate.findFirst({
        where: { userId: r.clientId, destinationCountry: r.shippingCountry },
        orderBy: { createdAt: "desc" },
      })
      if (est) shippingEstimate = serializeShippingEstimate(est)
    }

    return {
      success: true,
      data: {
        ...serializeRequest(r),
        shippingEstimate,
      },
    }
  } catch (err) {
    console.error("[getProductRequest]", err)
    return { success: false, error: "Failed to fetch request" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A3. UPDATE STATUS
// ─────────────────────────────────────────────────────────────────────────────

export async function updateRequestStatus(
  requestId: string,
  newStatus: RequestStatus,
  note?: string,
): Promise<ActionResult<{ newStatus: RequestStatus }>> {
  try {
    const adminId = await requireAdmin()

    const req = await prisma.productRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, clientId: true },
    })
    if (!req) return { success: false, error: "Request not found" }

    const oldStatus = req.status

    await prisma.$transaction([
      prisma.productRequest.update({ where: { id: requestId }, data: { status: newStatus } }),
      prisma.requestStatusHistory.create({
        data: { requestId, oldStatus, newStatus, changedById: adminId },
      }),
      prisma.auditLog.create({
        data: {
          adminId,
          action: "UPDATE_REQUEST_STATUS",
          entity: "ProductRequest",
          entityId: requestId,
          changes: { oldStatus, newStatus, note } satisfies Prisma.InputJsonValue,
        },
      }),
      prisma.notification.create({
        data: {
          userId: req.clientId,
          title: `Request status updated to ${newStatus}`,
          message: note ?? `Your product request has been moved to ${newStatus}.`,
          type: "REQUEST",
          requestId,
        },
      }),
    ])

    revalidateRequests()
    return { success: true, data: { newStatus } }
  } catch (err) {
    console.error("[updateRequestStatus]", err)
    return { success: false, error: "Failed to update status" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A4. UPDATE PRIORITY
// ─────────────────────────────────────────────────────────────────────────────

export async function updateRequestPriority(
  requestId: string,
  priority: number,
): Promise<ActionResult<{ priority: number }>> {
  try {
    const adminId = await requireAdmin()
    if (priority < 0 || priority > 5) return { success: false, error: "Priority must be 0–5" }

    await prisma.$transaction([
      prisma.productRequest.update({ where: { id: requestId }, data: { priority } }),
      prisma.auditLog.create({
        data: {
          adminId,
          action: "UPDATE_REQUEST_PRIORITY",
          entity: "ProductRequest",
          entityId: requestId,
          changes: { priority } satisfies Prisma.InputJsonValue,
        },
      }),
    ])

    revalidateRequests()
    return { success: true, data: { priority } }
  } catch (err) {
    console.error("[updateRequestPriority]", err)
    return { success: false, error: "Failed to update priority" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A5. BULK STATUS UPDATE
// ─────────────────────────────────────────────────────────────────────────────

export async function bulkUpdateRequestStatus(
  requestIds: string[],
  newStatus: RequestStatus,
): Promise<ActionResult<{ count: number }>> {
  try {
    const adminId = await requireAdmin()
    if (!requestIds.length) return { success: false, error: "No requests selected" }

    const requests = await prisma.productRequest.findMany({
      where: { id: { in: requestIds }, isDeleted: false },
      select: { id: true, status: true, clientId: true },
    })

    await prisma.$transaction([
      prisma.productRequest.updateMany({
        where: { id: { in: requestIds }, isDeleted: false },
        data: { status: newStatus },
      }),
      ...requests.map((r) =>
        prisma.requestStatusHistory.create({
          data: { requestId: r.id, oldStatus: r.status, newStatus, changedById: adminId },
        })
      ),
      ...requests.map((r) =>
        prisma.notification.create({
          data: {
            userId: r.clientId,
            title: `Request status updated to ${newStatus}`,
            message: `Your product request has been moved to ${newStatus}.`,
            type: "REQUEST",
            requestId: r.id,
          },
        })
      ),
      prisma.auditLog.create({
        data: {
          adminId,
          action: "BULK_UPDATE_REQUEST_STATUS",
          entity: "ProductRequest",
          changes: { requestIds, newStatus, count: requests.length } satisfies Prisma.InputJsonValue,
        },
      }),
    ])

    revalidateRequests()
    return { success: true, data: { count: requests.length } }
  } catch (err) {
    console.error("[bulkUpdateRequestStatus]", err)
    return { success: false, error: "Failed to bulk update status" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A6. SOFT DELETE
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteProductRequest(requestId: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId = await requireAdmin()

    await prisma.$transaction([
      prisma.productRequest.update({ where: { id: requestId }, data: { isDeleted: true } }),
      prisma.auditLog.create({
        data: {
          adminId,
          action: "DELETE_REQUEST",
          entity: "ProductRequest",
          entityId: requestId,
          changes: Prisma.JsonNull,
        },
      }),
    ])

    revalidateRequests()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[deleteProductRequest]", err)
    return { success: false, error: "Failed to delete request" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A7. RESTORE
// ─────────────────────────────────────────────────────────────────────────────

export async function restoreProductRequest(requestId: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId = await requireAdmin()

    await prisma.productRequest.update({ where: { id: requestId }, data: { isDeleted: false } })

    await prisma.auditLog.create({
      data: {
        adminId,
        action: "RESTORE_REQUEST",
        entity: "ProductRequest",
        entityId: requestId,
        changes: Prisma.JsonNull,
      },
    })

    revalidateRequests()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[restoreProductRequest]", err)
    return { success: false, error: "Failed to restore request" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION B: QUOTES ────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// B1. CREATE QUOTE
// ─────────────────────────────────────────────────────────────────────────────

const createQuoteSchema = z.object({
  requestId: z.string().min(1),
  price: z.number().positive(),
  currency: z.string().default("USD"),
  validUntil: z.coerce.date().optional(),
  adminNotes: z.string().optional(),
  status: z.nativeEnum(QuoteStatus).default("DRAFT"),
})

export async function createQuote(raw: z.infer<typeof createQuoteSchema>): Promise<ActionResult<{ id: string }>> {
  try {
    const adminId = await requireAdmin()
    const { requestId, price, currency, validUntil, adminNotes, status } = createQuoteSchema.parse(raw)

    const req = await prisma.productRequest.findUnique({
      where: { id: requestId },
      select: { id: true, clientId: true, _count: { select: { quotes: true } } },
    })
    if (!req) return { success: false, error: "Request not found" }

    const revision = req._count.quotes + 1

    const quote = await prisma.$transaction(async (tx) => {
      const q = await tx.quote.create({
        data: { requestId, createdById: adminId, price, currency, validUntil, adminNotes, status, revision },
      })
      await tx.quoteStatusHistory.create({
        data: { quoteId: q.id, oldStatus: "DRAFT", newStatus: status, changedById: adminId },
      })
      await tx.auditLog.create({
        data: {
          adminId,
          action: "CREATE_QUOTE",
          entity: "Quote",
          entityId: q.id,
          changes: { requestId, price, currency, status } satisfies Prisma.InputJsonValue,
        },
      })
      if (status === "SENT") {
        await tx.notification.create({
          data: {
            userId: req.clientId,
            title: "New quote received",
            message: `A quote of ${price} ${currency} has been sent for your request.`,
            type: "QUOTE",
            requestId,
            quoteId: q.id,
          },
        })
      }
      return q
    })

    revalidateRequests()
    return { success: true, data: { id: quote.id } }
  } catch (err) {
    console.error("[createQuote]", err)
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    return { success: false, error: "Failed to create quote" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B2. UPDATE QUOTE
// ─────────────────────────────────────────────────────────────────────────────

const updateQuoteSchema = z.object({
  price: z.number().positive().optional(),
  currency: z.string().optional(),
  validUntil: z.coerce.date().optional(),
  adminNotes: z.string().optional(),
})

export async function updateQuote(
  quoteId: string,
  raw: z.infer<typeof updateQuoteSchema>,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId = await requireAdmin()
    const data = updateQuoteSchema.parse(raw)

    await prisma.quote.update({ where: { id: quoteId }, data })

    await prisma.auditLog.create({
      data: {
        adminId,
        action: "UPDATE_QUOTE",
        entity: "Quote",
        entityId: quoteId,
        changes: data as Prisma.InputJsonValue,
      },
    })

    revalidateRequests()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[updateQuote]", err)
    return { success: false, error: "Failed to update quote" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B3. UPDATE QUOTE STATUS
// ─────────────────────────────────────────────────────────────────────────────

export async function updateQuoteStatus(
  quoteId: string,
  newStatus: QuoteStatus,
): Promise<ActionResult<{ newStatus: QuoteStatus }>> {
  try {
    const adminId = await requireAdmin()

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: { id: true, status: true, requestId: true, price: true, currency: true, request: { select: { clientId: true } } },
    })
    if (!quote) return { success: false, error: "Quote not found" }

    const oldStatus = quote.status

    await prisma.$transaction([
      prisma.quote.update({ where: { id: quoteId }, data: { status: newStatus } }),
      prisma.quoteStatusHistory.create({
        data: { quoteId, oldStatus, newStatus, changedById: adminId },
      }),
      prisma.auditLog.create({
        data: {
          adminId,
          action: "UPDATE_QUOTE_STATUS",
          entity: "Quote",
          entityId: quoteId,
          changes: { oldStatus, newStatus } satisfies Prisma.InputJsonValue,
        },
      }),
      ...(newStatus === "SENT"
        ? [prisma.notification.create({
          data: {
            userId: quote.request.clientId,
            title: "Quote updated",
            message: `Your quote of ${Number(quote.price)} ${quote.currency} has been updated.`,
            type: "QUOTE",
            requestId: quote.requestId,
            quoteId,
          },
        })]
        : []),
      ...(newStatus === "ACCEPTED"
        ? [prisma.productRequest.update({
          where: { id: quote.requestId },
          data: { acceptedQuoteId: quoteId, status: "APPROVED" },
        })]
        : []),
    ])

    revalidateRequests()
    return { success: true, data: { newStatus } }
  } catch (err) {
    console.error("[updateQuoteStatus]", err)
    return { success: false, error: "Failed to update quote status" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B4. DELETE QUOTE
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteQuote(quoteId: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId = await requireAdmin()

    await prisma.$transaction([
      prisma.quote.update({ where: { id: quoteId }, data: { isDeleted: true } }),
      prisma.auditLog.create({
        data: {
          adminId,
          action: "DELETE_QUOTE",
          entity: "Quote",
          entityId: quoteId,
          changes: Prisma.JsonNull,
        },
      }),
    ])

    revalidateRequests()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[deleteQuote]", err)
    return { success: false, error: "Failed to delete quote" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION C: FILE MANAGEMENT ───────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// C1. UPLOAD FILE
// ─────────────────────────────────────────────────────────────────────────────

export async function uploadFile(
  formData: FormData
): Promise<ActionResult<{ id: string; url: string; fileName: string }>> {
  try {
    const adminId = await requireAdmin()
    const file = formData.get("file") as File | null
    const requestId = formData.get("requestId") as string | null
    const quoteId = formData.get("quoteId") as string | null

    if (!file) return { success: false, error: "No file provided" }
    if (!requestId && !quoteId) return { success: false, error: "Must specify requestId or quoteId" }
    if (!ALLOWED_FILE_TYPES.has(file.type)) return { success: false, error: `File type ${file.type} not allowed` }
    if (file.size > MAX_FILE_BYTES) return { success: false, error: "File exceeds 20 MB limit" }

    await ensureUploadDir()

    const ext = file.name.split(".").pop() ?? "bin"
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const fullPath = path.join(UPLOAD_DIR, safeName)
    await writeFile(fullPath, Buffer.from(await file.arrayBuffer()))

    const url = `/uploads/requests/${safeName}`
    const record = await prisma.file.create({
      data: {
        url,
        fileType: file.type,
        fileName: file.name,
        fileSize: file.size,
        requestId: requestId ?? undefined,
        quoteId: quoteId ?? undefined,
        uploadedById: adminId,
      },
    })

    await prisma.auditLog.create({
      data: {
        adminId,
        action: "UPLOAD_FILE",
        entity: "File",
        entityId: record.id,
        changes: { fileName: file.name, requestId, quoteId, fileSize: file.size } satisfies Prisma.InputJsonValue,
      },
    })

    revalidateRequests()
    return { success: true, data: { id: record.id, url, fileName: file.name } }
  } catch (err) {
    console.error("[uploadFile]", err)
    return { success: false, error: "Upload failed" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C2. DELETE FILE
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteFile(fileId: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId = await requireAdmin()
    const file = await prisma.file.findUnique({ where: { id: fileId } })
    if (!file) return { success: false, error: "File not found" }

    if (file.url.startsWith("/uploads/")) {
      const diskPath = path.join(process.cwd(), "public", file.url)
      try { await unlink(diskPath) } catch { /* already gone */ }
    }

    await prisma.$transaction([
      prisma.file.delete({ where: { id: fileId } }),
      prisma.auditLog.create({
        data: {
          adminId,
          action: "DELETE_FILE",
          entity: "File",
          entityId: fileId,
          changes: { fileName: file.fileName, url: file.url } satisfies Prisma.InputJsonValue,
        },
      }),
    ])

    revalidateRequests()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[deleteFile]", err)
    return { success: false, error: "Failed to delete file" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION D: AI QUOTE GENERATION ──────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export async function generateAIQuote(requestId: string): Promise<ActionResult<{
  estimatedPrice: string
  currency: string
  confidence: number
  reasoning: string
  suggestedNotes: string
}>> {
  try {
    const adminId = await requireAdmin()

    const req = await prisma.productRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true, productLink: true, description: true,
        quantity: true, shippingCountry: true, customNotes: true,
        client: { select: { fullName: true, email: true } },
      },
    })
    if (!req) return { success: false, error: "Request not found" }

    // Also fetch shipping estimate to include in the prompt
    let shippingContext = ""
    if (req.shippingCountry) {
      const est = await prisma.shippingEstimate.findFirst({
        where: { destinationCountry: req.shippingCountry },
        orderBy: { createdAt: "desc" },
      })
      if (est) {
        shippingContext = `\n- Shipping estimate to ${req.shippingCountry}: $${Number(est.estimatedCost)} (${est.freightType}, ${est.transitDays ?? "?"} days)`
      }
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return { success: false, error: "GROQ_API_KEY not configured" }

    const prompt = `You are a B2B product sourcing expert. Analyse this product request and generate a pricing estimate.

Product Request:
- Description: ${req.description ?? "Not provided"}
- Product Link: ${req.productLink ?? "Not provided"}
- Quantity: ${req.quantity}
- Shipping Country: ${req.shippingCountry}
- Client Notes: ${req.customNotes ?? "None"}
- Client: ${req.client?.fullName ?? req.client?.email ?? "Unknown"}${shippingContext}

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "estimatedPrice": number,
  "currency": "USD",
  "confidence": number between 0 and 1,
  "reasoning": "2-3 sentence explanation of pricing factors",
  "suggestedNotes": "professional notes for the client quote"
}`

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 512,
        temperature: 0.3,
        messages: [
          { role: "system", content: "You are a B2B sourcing pricing expert. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    })

    if (!response.ok) throw new Error(`Groq error ${response.status}: ${await response.text()}`)

    const groqData = await response.json()
    const rawText = groqData.choices?.[0]?.message?.content?.trim() ?? ""
    const parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim())
    const { estimatedPrice, currency, confidence, reasoning, suggestedNotes } = parsed

    if (typeof estimatedPrice !== "number") throw new Error("Invalid AI response structure")

    const clampedConfidence = Math.min(1, Math.max(0, confidence ?? 0.5))

    await prisma.$transaction([
      prisma.aISuggestion.create({
        data: { requestId, estimatedPrice, currency: currency ?? "USD", confidence: clampedConfidence },
      }),
      prisma.productRequest.update({
        where: { id: requestId },
        data: {
          aiEstimatedPrice: estimatedPrice,
          aiConfidence: clampedConfidence,
          aiParsedData: parsed satisfies Prisma.InputJsonValue,
        },
      }),
      prisma.auditLog.create({
        data: {
          adminId,
          action: "AI_QUOTE_GENERATED",
          entity: "ProductRequest",
          entityId: requestId,
          changes: { estimatedPrice, confidence: clampedConfidence } satisfies Prisma.InputJsonValue,
        },
      }),
    ])

    revalidateRequests()
    return {
      success: true,
      data: {
        estimatedPrice: estimatedPrice.toString(),
        currency: currency ?? "USD",
        confidence: clampedConfidence,
        reasoning,
        suggestedNotes,
      },
    }
  } catch (err) {
    console.error("[generateAIQuote]", err)
    return { success: false, error: "AI generation failed. Please try again." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION E: SHIPPING ESTIMATES (linked to requests) ──────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// E1. CREATE SHIPPING ESTIMATE FOR A REQUEST
//     Admin manually creates a shipping estimate that will be shown alongside
//     the product request detail view.
// ─────────────────────────────────────────────────────────────────────────────

const createShippingForRequestSchema = z.object({
  requestId: z.string().min(1),
  originCountry: z.string().min(2),
  destinationCountry: z.string().min(2),
  weightKg: z.number().positive(),
  volumeCbm: z.number().positive().optional(),
  freightType: z.enum(["air", "sea"]),
  estimatedCost: z.number().nonnegative(),
  currency: z.string().default("USD"),
  transitDays: z.number().int().positive().optional(),
})

export async function createShippingEstimateForRequest(
  raw: z.infer<typeof createShippingForRequestSchema>
): Promise<ActionResult<SerializedShippingEstimate>> {
  try {
    const adminId = await requireAdmin()
    const data = createShippingForRequestSchema.parse(raw)

    // Get the clientId from the request
    const req = await prisma.productRequest.findUnique({
      where: { id: data.requestId },
      select: { clientId: true },
    })
    if (!req) return { success: false, error: "Request not found" }

    const { requestId, ...estimateData } = data

    const estimate = await prisma.shippingEstimate.create({
      data: { ...estimateData, userId: req.clientId },
    })

    await prisma.auditLog.create({
      data: {
        adminId,
        action: "CREATE_SHIPPING_FOR_REQUEST",
        entity: "ShippingEstimate",
        entityId: estimate.id,
        changes: { requestId, ...estimateData } satisfies Prisma.InputJsonValue,
      },
    })

    revalidateRequests()
    return { success: true, data: serializeShippingEstimate(estimate) }
  } catch (err) {
    console.error("[createShippingEstimateForRequest]", err)
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    return { success: false, error: "Failed to create shipping estimate" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// E2. GET SHIPPING ESTIMATES FOR A CLIENT
// ─────────────────────────────────────────────────────────────────────────────

export async function getClientShippingEstimates(
  clientId: string,
  destination?: string,
): Promise<ActionResult<SerializedShippingEstimate[]>> {
  try {
    await requireAdmin()

    const estimates = await prisma.shippingEstimate.findMany({
      where: {
        userId: clientId,
        ...(destination && { destinationCountry: destination }),
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return { success: true, data: estimates.map(serializeShippingEstimate) }
  } catch (err) {
    console.error("[getClientShippingEstimates]", err)
    return { success: false, error: "Failed to fetch shipping estimates" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// E3. GET SHIPPING ESTIMATE BY COUNTRY PAIR (for inline suggestion)
// ─────────────────────────────────────────────────────────────────────────────

export async function getShippingEstimateByRoute(
  originCountry: string,
  destinationCountry: string,
  freightType: "air" | "sea" = "sea",
): Promise<SerializedShippingEstimate | null> {
  try {
    await requireAdmin()
    const est = await prisma.shippingEstimate.findFirst({
      where: { originCountry, destinationCountry, freightType },
      orderBy: { createdAt: "desc" },
    })
    return est ? serializeShippingEstimate(est) : null
  } catch {
    return null
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── SECTION F: STATS & ANALYTICS ────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export async function getRequestStats(): Promise<ActionResult<{
  byStatus: Record<string, number>
  submittedToday: number
  submittedWeek: number
  pendingQuotes: number
  totalActive: number
  avgResolutionDays: number
  topShippingCountries: { country: string; count: number }[]
  priorityBreakdown: { priority: number; count: number }[]
}>> {
  try {
    await requireAdmin()

    const todayStart = new Date(new Date().setHours(0, 0, 0, 0))
    const weekStart = new Date(Date.now() - 7 * 86_400_000)

    const [
      byStatus, submittedToday, submittedWeek, pendingQuotes, totalActive,
      completedRequests, countryGroups, priorityGroups,
    ] = await Promise.all([
      prisma.productRequest.groupBy({ by: ["status"], where: { isDeleted: false }, _count: true }),
      prisma.productRequest.count({ where: { isDeleted: false, createdAt: { gte: todayStart } } }),
      prisma.productRequest.count({ where: { isDeleted: false, createdAt: { gte: weekStart } } }),
      prisma.quote.count({ where: { isDeleted: false, status: "DRAFT" } }),
      prisma.productRequest.count({ where: { isDeleted: false, status: { in: ["SUBMITTED", "IN_REVIEW", "QUOTED"] } } }),
      // For avg resolution: completed requests in last 90 days
      prisma.productRequest.findMany({
        where: { isDeleted: false, status: "COMPLETED", updatedAt: { gte: new Date(Date.now() - 90 * 86_400_000) } },
        select: { createdAt: true, updatedAt: true },
        take: 200,
      }),
      prisma.productRequest.groupBy({ by: ["shippingCountry"], where: { isDeleted: false }, _count: true, orderBy: { _count: { shippingCountry: "desc" } }, take: 5 }),
      prisma.productRequest.groupBy({ by: ["priority"], where: { isDeleted: false }, _count: true }),
    ])

    const statusMap = byStatus.reduce<Record<string, number>>((acc, r) => { acc[r.status] = r._count; return acc }, {})

    const avgResolutionDays = completedRequests.length > 0
      ? Math.round(
        completedRequests.reduce((sum, r) => sum + (r.updatedAt.getTime() - r.createdAt.getTime()), 0)
        / completedRequests.length / 86_400_000
      )
      : 0

    return {
      success: true,
      data: {
        byStatus: statusMap,
        submittedToday,
        submittedWeek,
        pendingQuotes,
        totalActive,
        avgResolutionDays,
        topShippingCountries: countryGroups.map((r) => ({ country: r.shippingCountry, count: r._count })),
        priorityBreakdown: priorityGroups.map((r) => ({ priority: r.priority, count: r._count })),
      },
    }
  } catch (err) {
    console.error("[getRequestStats]", err)
    return { success: false, error: "Failed to fetch stats" }
  }
}