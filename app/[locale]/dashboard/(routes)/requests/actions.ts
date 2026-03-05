'use server'

import { auth }           from '@clerk/nextjs/server'
import { prisma }         from '@/lib/prisma'
import { z }              from 'zod'
import { RequestStatus, Prisma } from '@prisma/client'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync }     from 'fs'
import path               from 'path'
import { revalidatePath } from 'next/cache'
import type { UserPlanInfo } from './_components/types'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// AUTH HELPER — CLIENT only
// ─────────────────────────────────────────────────────────────────────────────

async function requireClient() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await prisma.user.findUnique({
    where:  { clerkId, isDeleted: false, isActive: true },
    select: { id: true, role: true, fullName: true, email: true, avatarUrl: true },
  })
  if (!user) throw new Error('User not found')
  if (user.role !== 'CLIENT') throw new Error('Forbidden')
  return user
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN LIMIT HELPER
// ─────────────────────────────────────────────────────────────────────────────
//
// Map plan name → max active requests.
// Adjust the keys to match your exact Clerk/Plan names.
//
const PLAN_LIMIT_MAP: Record<string, number> = {
  free:       2,
  starter:    5,
  pro:        15,
  business:   50,
  enterprise: Infinity,
  vip:        Infinity,
}

export async function getUserPlanInfo(userId: string): Promise<UserPlanInfo> {
  const [subscription, usedCount] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId },
      select: {
        items: {
          where:   { status: 'ACTIVE' },
          orderBy: { isDefaultPlan: 'asc' },
          take: 1,
          select: { plan: { select: { name: true, isDefault: true } } },
        },
      },
    }),
    prisma.productRequest.count({ where: { clientId: userId, isDeleted: false } }),
  ])

  const billingEnabled = process.env.BILLING_ENABLED === 'true'

  // If billing is disabled → grant unlimited access
  if (!billingEnabled) {
    return { planName: 'Platform Access', limit: Infinity, usedCount, hasAccess: true }
  }

  const plan = subscription?.items[0]?.plan
  if (!plan) return { planName: 'None', limit: 0, usedCount, hasAccess: false }

  const key   = plan.name.toLowerCase()
  const limit = PLAN_LIMIT_MAP[key] ?? (plan.isDefault ? 2 : 0)

  return {
    planName:  plan.name,
    limit,
    usedCount,
    hasAccess: limit === Infinity || usedCount < limit,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN IDS HELPER
// ─────────────────────────────────────────────────────────────────────────────

async function getAdminIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where:  { role: 'ADMIN', isDeleted: false, isActive: true },
    select: { id: true },
  })
  return admins.map(a => a.id)
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SELECT
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
    orderBy: { revision: 'desc' as const },
    select: {
      id: true, requestId: true, price: true, currency: true, status: true,
      validUntil: true, revision: true, adminNotes: true,
      isDeleted: true, createdAt: true, updatedAt: true, createdById: true,
      createdBy: { select: { id: true, email: true, fullName: true } },
      files: {
        select: {
          id: true, url: true, fileType: true, fileName: true, fileSize: true,
          requestId: true, quoteId: true, uploadedById: true, createdAt: true,
        },
      },
    },
  },
  statusHistory: {
    orderBy: { changedAt: 'desc' as const },
    select: {
      id: true, requestId: true, oldStatus: true, newStatus: true, changedAt: true,
      changedBy: { select: { id: true, email: true, fullName: true } },
    },
  },
  acceptedQuote: {
    select: {
      id: true, requestId: true, price: true, currency: true, status: true,
      validUntil: true, revision: true, adminNotes: true,
      isDeleted: true, createdAt: true, updatedAt: true, createdById: true,
      createdBy: { select: { id: true, email: true, fullName: true } },
      files: {
        select: {
          id: true, url: true, fileType: true, fileName: true, fileSize: true,
          requestId: true, quoteId: true, uploadedById: true, createdAt: true,
        },
      },
    },
  },
} as const

function serializeRequest(r: any) {
  return {
    ...r,
    aiEstimatedPrice: r.aiEstimatedPrice ? r.aiEstimatedPrice.toString() : null,
    quotes: r.quotes?.map((q: any) => ({
      ...q, price: q.price.toString(), files: q.files ?? [],
    })) ?? [],
    acceptedQuote: r.acceptedQuote
      ? { ...r.acceptedQuote, price: r.acceptedQuote.price.toString(), files: r.acceptedQuote.files ?? [] }
      : null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET USER CONTEXT (plan info + requests in one call)
// ─────────────────────────────────────────────────────────────────────────────

export type UserContext = {
  user:    { id: string; fullName: string | null; email: string; avatarUrl: string | null }
  plan:    UserPlanInfo
}

export async function getClientContext(): Promise<ActionResult<UserContext>> {
  try {
    const user = await requireClient()
    const plan = await getUserPlanInfo(user.id)
    return { success: true, data: { user, plan } }
  } catch (err) {
    console.error('[getClientContext]', err)
    return { success: false, error: 'Failed to load context' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET MY REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

const listSchema = z.object({
  page:     z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  status:   z.nativeEnum(RequestStatus).optional(),
})

export async function getMyRequests(raw: z.infer<typeof listSchema>) {
  try {
    const user      = await requireClient()
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
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
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
    console.error('[getMyRequests]', err)
    return { success: false, error: 'Failed to fetch requests' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CREATE PRODUCT REQUEST
// ─────────────────────────────────────────────────────────────────────────────

const createSchema = z.object({
  productLink:     z.string().url('Must be a valid URL').optional().or(z.literal('')),
  description:     z.string().min(1, 'Description is required').max(2000),
  quantity:        z.number().int().positive('Quantity must be a positive number'),
  shippingCountry: z.string().min(2, 'Shipping country is required'),
  customNotes:     z.string().max(1000).optional(),
})

export async function createProductRequest(
  raw: z.infer<typeof createSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireClient()
    const plan = await getUserPlanInfo(user.id)

    if (!plan.hasAccess) {
      if (plan.limit === 0) return { success: false, error: 'UPGRADE_REQUIRED' }
      return {
        success: false,
        error: `Your ${plan.planName} plan allows ${plan.limit} requests. You have used ${plan.usedCount}. Upgrade to submit more.`,
      }
    }

    const validated = createSchema.parse(raw)

    const request = await prisma.$transaction(async tx => {
      const req = await tx.productRequest.create({
        data: {
          clientId:        user.id,
          productLink:     validated.productLink || null,
          description:     validated.description,
          quantity:        validated.quantity,
          shippingCountry: validated.shippingCountry,
          customNotes:     validated.customNotes || null,
          status:          'SUBMITTED',
        },
      })

      await tx.requestStatusHistory.create({
        data: { requestId: req.id, oldStatus: 'SUBMITTED', newStatus: 'SUBMITTED', changedById: user.id },
      })

      const adminIds = await getAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map(adminId => ({
            userId:    adminId,
            title:     'New Product Request',
            message:   `${user.fullName ?? user.email} submitted a new request: ${validated.description.slice(0, 80)}`,
            type:      'REQUEST',
            requestId: req.id,
          })),
        })
      }

      return req
    })

    revalidatePath('/dashboard/request')
    return { success: true, data: { id: request.id } }
  } catch (err) {
    console.error('[createProductRequest]', err)
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    return { success: false, error: 'Failed to create request' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. UPLOAD FILE (attached to request)
// ─────────────────────────────────────────────────────────────────────────────

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'client-requests')

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
  'application/zip', 'application/x-zip-compressed',
])
const MAX_BYTES = 20 * 1024 * 1024

export async function uploadClientFile(
  formData: FormData,
): Promise<ActionResult<{ id: string; url: string; fileName: string }>> {
  try {
    const user      = await requireClient()
    const file      = formData.get('file') as File | null
    const requestId = formData.get('requestId') as string | null

    if (!file)      return { success: false, error: 'No file provided' }
    if (!requestId) return { success: false, error: 'No requestId provided' }
    if (!ALLOWED_MIME.has(file.type)) return { success: false, error: `File type not allowed` }
    if (file.size > MAX_BYTES)        return { success: false, error: 'File exceeds 20 MB limit' }

    // Verify ownership
    const req = await prisma.productRequest.findUnique({
      where:  { id: requestId },
      select: { clientId: true, status: true },
    })
    if (!req || req.clientId !== user.id) return { success: false, error: 'Access denied' }

    if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true })

    const ext      = file.name.split('.').pop() ?? 'bin'
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const fullPath = path.join(UPLOAD_DIR, safeName)

    await writeFile(fullPath, Buffer.from(await file.arrayBuffer()))

    const url = `/uploads/client-requests/${safeName}`

    const record = await prisma.file.create({
      data: {
        url, fileType: file.type, fileName: file.name,
        fileSize: file.size, requestId, uploadedById: user.id,
      },
    })

    revalidatePath('/dashboard/request')
    return { success: true, data: { id: record.id, url, fileName: file.name } }
  } catch (err) {
    console.error('[uploadClientFile]', err)
    return { success: false, error: 'Upload failed' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. DELETE FILE (only own files on SUBMITTED requests)
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteClientFile(fileId: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const user = await requireClient()

    const file = await prisma.file.findUnique({
      where:  { id: fileId },
      select: {
        id: true, url: true, fileName: true, uploadedById: true,
        request: { select: { clientId: true, status: true } },
      },
    })
    if (!file) return { success: false, error: 'File not found' }
    if (file.request?.clientId !== user.id) return { success: false, error: 'Access denied' }

    // Allow delete only on SUBMITTED or IN_REVIEW requests
    const deletableStatuses: RequestStatus[] = ['SUBMITTED', 'IN_REVIEW']
    if (file.request?.status && !deletableStatuses.includes(file.request.status)) {
      return { success: false, error: 'Cannot remove files from requests in progress' }
    }

    if (file.url.startsWith('/uploads/')) {
      const disk = path.join(process.cwd(), 'public', file.url)
      try { await unlink(disk) } catch { /* already gone */ }
    }

    await prisma.file.delete({ where: { id: fileId } })
    revalidatePath('/dashboard/request')
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error('[deleteClientFile]', err)
    return { success: false, error: 'Failed to delete file' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ACCEPT QUOTE
// ─────────────────────────────────────────────────────────────────────────────

export async function acceptQuote(quoteId: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const user = await requireClient()

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId, isDeleted: false },
      include: { request: { select: { id: true, clientId: true, status: true, acceptedQuoteId: true } } },
    })
    if (!quote)                                return { success: false, error: 'Quote not found' }
    if (quote.request.clientId !== user.id)   return { success: false, error: 'Unauthorized' }
    if (quote.status !== 'SENT')              return { success: false, error: 'Only SENT quotes can be accepted' }
    if (quote.request.acceptedQuoteId)        return { success: false, error: 'A quote is already accepted' }

    await prisma.$transaction(async tx => {
      await tx.quote.update({ where: { id: quoteId }, data: { status: 'ACCEPTED' } })

      await tx.quoteStatusHistory.create({
        data: { quoteId, oldStatus: 'SENT', newStatus: 'ACCEPTED', changedById: user.id },
      })

      await tx.productRequest.update({
        where: { id: quote.requestId },
        data:  { acceptedQuoteId: quoteId, status: 'APPROVED' },
      })

      await tx.requestStatusHistory.create({
        data: {
          requestId: quote.requestId,
          oldStatus: quote.request.status,
          newStatus: 'APPROVED',
          changedById: user.id,
        },
      })

      const adminIds = await getAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map(adminId => ({
            userId:    adminId,
            title:     'Quote Accepted',
            message:   `${user.fullName ?? user.email} accepted a quote of ${quote.price} ${quote.currency}.`,
            type:      'QUOTE',
            requestId: quote.requestId,
            quoteId,
          })),
        })
      }
    })

    revalidatePath('/dashboard/request')
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error('[acceptQuote]', err)
    return { success: false, error: 'Failed to accept quote' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. REJECT QUOTE
// ─────────────────────────────────────────────────────────────────────────────

export async function rejectQuote(quoteId: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const user = await requireClient()

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId, isDeleted: false },
      include: { request: { select: { id: true, clientId: true } } },
    })
    if (!quote)                              return { success: false, error: 'Quote not found' }
    if (quote.request.clientId !== user.id) return { success: false, error: 'Unauthorized' }
    if (quote.status !== 'SENT')            return { success: false, error: 'Only SENT quotes can be rejected' }

    await prisma.$transaction(async tx => {
      await tx.quote.update({ where: { id: quoteId }, data: { status: 'REJECTED' } })

      await tx.quoteStatusHistory.create({
        data: { quoteId, oldStatus: 'SENT', newStatus: 'REJECTED', changedById: user.id },
      })

      const adminIds = await getAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map(adminId => ({
            userId:    adminId,
            title:     'Quote Rejected',
            message:   `${user.fullName ?? user.email} rejected a quote.`,
            type:      'QUOTE',
            requestId: quote.requestId,
            quoteId,
          })),
        })
      }
    })

    revalidatePath('/dashboard/request')
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error('[rejectQuote]', err)
    return { success: false, error: 'Failed to reject quote' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. SOFT DELETE OWN REQUEST (SUBMITTED only)
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteMyRequest(requestId: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const user = await requireClient()

    const req = await prisma.productRequest.findUnique({
      where:  { id: requestId, isDeleted: false },
      select: { clientId: true, status: true },
    })
    if (!req)                      return { success: false, error: 'Request not found' }
    if (req.clientId !== user.id)  return { success: false, error: 'Unauthorized' }
    if (req.status !== 'SUBMITTED') return { success: false, error: 'Only SUBMITTED requests can be deleted' }

    await prisma.productRequest.update({ where: { id: requestId }, data: { isDeleted: true } })

    revalidatePath('/dashboard/request')
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error('[deleteMyRequest]', err)
    return { success: false, error: 'Failed to delete request' }
  }
}