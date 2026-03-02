// app/[locale]/dashboard/(routes)/my-request/actions.ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { RequestStatus, QuoteStatus } from '@prisma/client'

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
async function requireClient() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true, isActive: true, isDeleted: true },
  })

  if (!user || user.isDeleted || !user.isActive) throw new Error('User not found or inactive')
  if (user.role !== 'CLIENT') throw new Error('Forbidden')
  return user.id
}

/**
 * Returns the user's active plan and the corresponding request limit.
 * Plan names are assumed to be stored in Clerk and synced to the Plan model.
 * Adjust the mapping to match your actual plan names.
 */
async function getUserPlanLimits(userId: string): Promise<{ planName: string; limit: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: {
        include: {
          items: {
            where: { status: 'ACTIVE' },
            include: { plan: true },
          },
        },
      },
    },
  })

  // Default to no plan (limit 0) if no active subscription
  if (!user?.subscription || user.subscription.items.length === 0) {
    return { planName: 'NONE', limit: 0 }
  }

  // Assume the first active item represents the plan
  const plan = user.subscription.items[0].plan
  if (!plan) return { planName: 'UNKNOWN', limit: 0 }

  // Map plan name to request limit – adjust to your exact plan names
  const limitMap: Record<string, number> = {
    free: 2,
    pro: 5,
    vip: Infinity,
  }
  const planName = plan.name.toLowerCase()
  const limit = limitMap[planName] ?? 0
  return { planName, limit }
}


async function getAdminUserIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isDeleted: false, isActive: true },
    select: { id: true },
  })
  return admins.map((a) => a.id)
}

// ------------------------------------------------------------------
// Schemas
// ------------------------------------------------------------------
const createRequestSchema = z.object({
  productLink: z.string().url().optional(),
  description: z.string().optional(),
  quantity: z.number().int().positive(),
  shippingCountry: z.string().min(1),
  customNotes: z.string().optional(),
})

const getMyRequestsFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  status: z.nativeEnum(RequestStatus).optional(),
})

// ------------------------------------------------------------------
// Actions
// ------------------------------------------------------------------
export async function createProductRequest(data: z.infer<typeof createRequestSchema>) {
  try {
    const clientId = await requireClient()
    const validated = createRequestSchema.parse(data)

    // Check subscription limits
    const { planName, limit } = await getUserPlanLimits(clientId)
    if (limit === 0) {
      return { success: false, error: 'No active subscription or plan not recognized' }
    }
    if (limit !== Infinity) {
      const existingCount = await prisma.productRequest.count({
        where: { clientId, isDeleted: false },
      })
      if (existingCount >= limit) {
        return {
          success: false,
          error: `Your ${planName} plan allows only ${limit} active requests. Please upgrade or delete some requests.`,
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.productRequest.create({
        data: {
          clientId,
          ...validated,
          status: 'SUBMITTED',
        },
      })

      // Status history (initial)
      await tx.requestStatusHistory.create({
        data: {
          requestId: request.id,
          oldStatus: 'SUBMITTED',
          newStatus: 'SUBMITTED',
          changedById: clientId,
        },
      })

      // Notify all admins
      const adminIds = await getAdminUserIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map((adminId) => ({
            userId: adminId,
            title: 'New Product Request',
            message: 'A new product request has been submitted.',
            type: 'NEW_REQUEST',
            requestId: request.id,
          })),
        })
      }

      return request
    })

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' }
    }
    return { success: false, error: 'Failed to create request' }
  }
}

// ... (rest of the file unchanged, only modify getMyRequests)

export async function getMyRequests(filters: z.infer<typeof getMyRequestsFilterSchema>) {
  try {
    const clientId = await requireClient()
    const validated = getMyRequestsFilterSchema.parse(filters)

    const { page, pageSize, status } = validated
    const skip = (page - 1) * pageSize

    const where = {
      clientId,
      isDeleted: false,
      ...(status && { status }),
    }

    const [requests, totalCount] = await prisma.$transaction([
      prisma.productRequest.findMany({
        where,
        include: {
          quotes: {
            where: { isDeleted: false },
            include: { createdBy: { select: { id: true, email: true, fullName: true } } },
            orderBy: { createdAt: 'desc' },
          },
          acceptedQuote: true,
          files: true,
          statusHistory: {
            include: { changedBy: { select: { id: true, email: true, fullName: true } } },
            orderBy: { changedAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.productRequest.count({ where }),
    ])

    // 🔁 Transform Decimal fields to strings
    const transformedRequests = requests.map(request => ({
      ...request,
      quotes: request.quotes.map(quote => ({
        ...quote,
        price: quote.price.toString(),
      })),
      acceptedQuote: request.acceptedQuote
        ? {
            ...request.acceptedQuote,
            price: request.acceptedQuote.price.toString(),
          }
        : null,
    }))

    return {
      success: true,
      data: {
        requests: transformedRequests,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid filters' }
    }
    return { success: false, error: 'Failed to fetch requests' }
  }
}

export async function acceptQuote(quoteId: string) {
  try {
    const clientId = await requireClient()

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId, isDeleted: false },
      include: {
        request: {
          include: { client: { select: { id: true } } },
        },
      },
    })

    if (!quote) {
      return { success: false, error: 'Quote not found' }
    }

    if (quote.request.clientId !== clientId) {
      return { success: false, error: 'Unauthorized' }
    }

    if (quote.status !== 'SENT') {
      return { success: false, error: 'Only SENT quotes can be accepted' }
    }

    // Check if request already has an accepted quote
    if (quote.request.acceptedQuoteId) {
      return { success: false, error: 'This request already has an accepted quote' }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedQuote = await tx.quote.update({
        where: { id: quoteId },
        data: { status: 'ACCEPTED' },
        include: { request: true },
      })

      // Quote status history
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: updatedQuote.id,
          oldStatus: 'SENT',
          newStatus: 'ACCEPTED',
          changedById: clientId,
        },
      })

      // Update request
      await tx.productRequest.update({
        where: { id: quote.requestId },
        data: {
          acceptedQuoteId: updatedQuote.id,
          status: 'APPROVED',
        },
      })

      // Request status history
      await tx.requestStatusHistory.create({
        data: {
          requestId: quote.requestId,
          oldStatus: quote.request.status,
          newStatus: 'APPROVED',
          changedById: clientId,
        },
      })

      // Notify all admins
      const adminIds = await getAdminUserIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map((adminId) => ({
            userId: adminId,
            title: 'Quote Accepted',
            message: 'A client has accepted a quote.',
            type: 'QUOTE_ACCEPTED',
            requestId: quote.requestId,
            quoteId: updatedQuote.id,
          })),
        })
      }

      return updatedQuote
    })

    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: 'Failed to accept quote' }
  }
}

export async function rejectQuote(quoteId: string) {
  try {
    const clientId = await requireClient()

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId, isDeleted: false },
      include: {
        request: {
          include: { client: { select: { id: true } } },
        },
      },
    })

    if (!quote) {
      return { success: false, error: 'Quote not found' }
    }

    if (quote.request.clientId !== clientId) {
      return { success: false, error: 'Unauthorized' }
    }

    if (quote.status !== 'SENT') {
      return { success: false, error: 'Only SENT quotes can be rejected' }
    }

    await prisma.$transaction(async (tx) => {
      const updatedQuote = await tx.quote.update({
        where: { id: quoteId },
        data: { status: 'REJECTED' },
      })

      await tx.quoteStatusHistory.create({
        data: {
          quoteId: updatedQuote.id,
          oldStatus: 'SENT',
          newStatus: 'REJECTED',
          changedById: clientId,
        },
      })

      const adminIds = await getAdminUserIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map((adminId) => ({
            userId: adminId,
            title: 'Quote Rejected',
            message: 'A client has rejected a quote.',
            type: 'QUOTE_REJECTED',
            requestId: quote.requestId,
            quoteId: updatedQuote.id,
          })),
        })
      }
    })

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to reject quote' }
  }
}

export async function softDeleteMyRequest(requestId: string) {
  try {
    const clientId = await requireClient()

    const request = await prisma.productRequest.findUnique({
      where: { id: requestId, isDeleted: false },
    })

    if (!request) {
      return { success: false, error: 'Request not found' }
    }

    if (request.clientId !== clientId) {
      return { success: false, error: 'Unauthorized' }
    }

    if (request.status !== 'SUBMITTED') {
      return { success: false, error: 'Only requests with status SUBMITTED can be deleted' }
    }

    await prisma.productRequest.update({
      where: { id: requestId },
      data: { isDeleted: true },
    })

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to delete request' }
  }
}