// app/[locale]/admin/(routes)/product-requests/actions.ts
'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { z } from 'zod'
import { RequestStatus, QuoteStatus, Prisma } from '@prisma/client'

// ---------------------------
// SCHEMAS
// ---------------------------
const getRequestsFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  status: z.nativeEnum(RequestStatus).optional(),
  clientEmail: z.string().email().optional(),
  createdAtFrom: z.date().optional(),
  createdAtTo: z.date().optional(),
})

const updateStatusSchema = z.object({
  requestId: z.string().cuid(),
  newStatus: z.nativeEnum(RequestStatus),
})

const createQuoteSchema = z.object({
  requestId: z.string().cuid(),
  price: z.number().positive(),
  currency: z.string().default('USD'),
  validUntil: z.date().optional(),
  adminNotes: z.string().optional(),
})

const updateQuoteStatusSchema = z.object({
  quoteId: z.string().cuid(),
  newStatus: z.nativeEnum(QuoteStatus),
})

const softDeleteQuoteSchema = z.object({
  quoteId: z.string().cuid(),
})

// -----------------------------------
// ACTIONS
// -----------------------------------
export type GetRequestsFilter = z.infer<typeof getRequestsFilterSchema>


// -----------------------------------
// FUNC TO GET ALL PRODUCT REQUESTS  
// -----------------------------------
export async function getAllProductRequests(filters: GetRequestsFilter) {
  try {
    await requireAdmin()
    const validated = getRequestsFilterSchema.parse(filters)

    const { page, pageSize, status, clientEmail, createdAtFrom, createdAtTo } = validated
    const skip = (page - 1) * pageSize

    // Build where clause with explicit typing to avoid type errors
    const where: Prisma.ProductRequestWhereInput = {
      isDeleted: false,
      ...(status && { status }),
      ...(clientEmail && {
        client: { email: { contains: clientEmail, mode: 'insensitive' } },
      }),
      ...(createdAtFrom || createdAtTo
        ? {
            createdAt: {
              ...(createdAtFrom && { gte: createdAtFrom }),
              ...(createdAtTo && { lte: createdAtTo }),
            },
          }
        : {}),
    }

    const [requests, totalCount] = await prisma.$transaction([
      prisma.productRequest.findMany({
        where,
        include: {
          client: { select: { id: true, email: true, fullName: true } },
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
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      prisma.productRequest.count({ where }),
    ])

    return {
      success: true,
      data: {
        requests,
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

// -----------------------------------
// FUNC TO UPDATE REQUEST STATUS
// -----------------------------------
export async function updateRequestStatus(requestId: string, newStatus: RequestStatus) {
  try {
    const adminId = await requireAdmin()
    const validated = updateStatusSchema.parse({ requestId, newStatus })

    const request = await prisma.productRequest.findUnique({
      where: { id: validated.requestId, isDeleted: false },
      include: { client: { select: { id: true } } },
    })

    if (!request) {
      return { success: false, error: 'Request not found' }
    }

    if (request.status === validated.newStatus) {
      return { success: false, error: 'Status is already set to this value' }
    }

    // Optional: add allowed transition logic here if needed

    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.productRequest.update({
        where: { id: validated.requestId },
        data: { status: validated.newStatus },
        include: {
          client: { select: { id: true, email: true } },
          quotes: true,
          acceptedQuote: true,
          files: true,
          statusHistory: true,
        },
      })

      // Status history
      await tx.requestStatusHistory.create({
        data: {
          requestId: updatedRequest.id,
          oldStatus: request.status,
          newStatus: validated.newStatus,
          changedById: adminId,
        },
      })

      // Client notification
      await tx.notification.create({
        data: {
          userId: request.client.id, // fixed: client.id, not clientId
          title: 'Request Status Updated',
          message: `Your request status has been changed from ${request.status} to ${validated.newStatus}.`,
          type: 'REQUEST_STATUS_CHANGE',
          requestId: updatedRequest.id,
        },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          adminId,
          action: 'UPDATE_REQUEST_STATUS',
          entity: 'ProductRequest',
          entityId: updatedRequest.id,
          changes: { oldStatus: request.status, newStatus: validated.newStatus },
        },
      })

      return updatedRequest
    })

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' }
    }
    return { success: false, error: 'Failed to update status' }
  }
}

// -----------------------------------
// FUNC TO CREATE A QUOTE
// -----------------------------------
export async function createQuote(data: z.infer<typeof createQuoteSchema>) {
  try {
    const adminId = await requireAdmin()
    const validated = createQuoteSchema.parse(data)

    const request = await prisma.productRequest.findUnique({
      where: { id: validated.requestId, isDeleted: false },
      include: {
        client: { select: { id: true } },
        quotes: { where: { isDeleted: false } }, // to check if any quotes exist
      },
    })

    if (!request) {
      return { success: false, error: 'Request not found' }
    }

    const result = await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.create({
        data: {
          requestId: request.id,
          createdById: adminId,
          price: validated.price,
          currency: validated.currency,
          validUntil: validated.validUntil,
          adminNotes: validated.adminNotes,
          status: 'DRAFT',
        },
      })

      // Quote status history (initial)
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: quote.id,
          oldStatus: 'DRAFT',
          newStatus: 'DRAFT',
          changedById: adminId,
        },
      })

      // If this is the first quote, update request status to QUOTED (if appropriate)
      if (request.quotes.length === 0 && request.status === 'SUBMITTED') {
        await tx.productRequest.update({
          where: { id: request.id },
          data: { status: 'QUOTED' },
        })

        await tx.requestStatusHistory.create({
          data: {
            requestId: request.id,
            oldStatus: 'SUBMITTED',
            newStatus: 'QUOTED',
            changedById: adminId,
          },
        })
      }

      // Client notification
      await tx.notification.create({
        data: {
          userId: request.client.id, // fixed
          title: 'New Quote Created',
          message: 'A new quote has been created for your request.',
          type: 'QUOTE_CREATED',
          requestId: request.id,
          quoteId: quote.id,
        },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          adminId,
          action: 'CREATE_QUOTE',
          entity: 'Quote',
          entityId: quote.id,
          changes: {
            requestId: request.id,
            price: validated.price,
            currency: validated.currency,
          },
        },
      })

      return quote
    })

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' }
    }
    return { success: false, error: 'Failed to create quote' }
  }
}

// -----------------------------------
// FUNC TO UPDATE QUOTE STATUS
// -----------------------------------
export async function updateQuoteStatus(quoteId: string, newStatus: QuoteStatus) {
  try {
    const adminId = await requireAdmin()
    const validated = updateQuoteStatusSchema.parse({ quoteId, newStatus })

    const quote = await prisma.quote.findUnique({
      where: { id: validated.quoteId, isDeleted: false },
      include: {
        request: {
          include: { client: { select: { id: true } } },
        },
      },
    })

    if (!quote) {
      return { success: false, error: 'Quote not found' }
    }

    if (quote.status === validated.newStatus) {
      return { success: false, error: 'Quote already has this status' }
    }

    // Prevent accepting a quote if the request already has an accepted quote
    if (validated.newStatus === 'ACCEPTED' && quote.request.acceptedQuoteId) {
      return { success: false, error: 'This request already has an accepted quote' }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedQuote = await tx.quote.update({
        where: { id: validated.quoteId },
        data: { status: validated.newStatus },
        include: { request: true },
      })

      // Quote status history
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: updatedQuote.id,
          oldStatus: quote.status,
          newStatus: validated.newStatus,
          changedById: adminId,
        },
      })

      // If ACCEPTED, update the linked request
      if (validated.newStatus === 'ACCEPTED') {
        await tx.productRequest.update({
          where: { id: quote.requestId },
          data: {
            acceptedQuoteId: updatedQuote.id,
            status: 'APPROVED',
          },
        })

        await tx.requestStatusHistory.create({
          data: {
            requestId: quote.requestId,
            oldStatus: quote.request.status,
            newStatus: 'APPROVED',
            changedById: adminId,
          },
        })
      }

      // Client notification
      let notificationMessage = `Your quote status has been updated to ${validated.newStatus}.`
      if (validated.newStatus === 'ACCEPTED') {
        notificationMessage = 'Your quote has been accepted and your request is now approved.'
      } else if (validated.newStatus === 'REJECTED') {
        notificationMessage = 'Your quote has been rejected.'
      }

      await tx.notification.create({
        data: {
          userId: quote.request.client.id, // fixed
          title: 'Quote Status Updated',
          message: notificationMessage,
          type: 'QUOTE_STATUS_CHANGE',
          requestId: quote.requestId,
          quoteId: updatedQuote.id,
        },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          adminId,
          action: 'UPDATE_QUOTE_STATUS',
          entity: 'Quote',
          entityId: updatedQuote.id,
          changes: {
            oldStatus: quote.status,
            newStatus: validated.newStatus,
            requestId: quote.requestId,
          },
        },
      })

      return updatedQuote
    })

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' }
    }
    return { success: false, error: 'Failed to update quote status' }
  }
}

// -----------------------------------
// FUNC TO DELETE REQUEST
// -----------------------------------
export async function softDeleteRequest(requestId: string) {
  try {
    const adminId = await requireAdmin()

    const request = await prisma.productRequest.findUnique({
      where: { id: requestId, isDeleted: false },
    })

    if (!request) {
      return { success: false, error: 'Request not found' }
    }

    await prisma.$transaction(async (tx) => {
      await tx.productRequest.update({
        where: { id: requestId },
        data: { isDeleted: true },
      })

      await tx.auditLog.create({
        data: {
          adminId,
          action: 'SOFT_DELETE_REQUEST',
          entity: 'ProductRequest',
          entityId: requestId,
          changes: { isDeleted: true },
        },
      })
    })

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to delete request' }
  }
}

// -----------------------------------
// FUNC TO DELETE QUOTE
// -----------------------------------

export async function softDeleteQuote(input: { quoteId: string }) {
  try {
    const adminId = await requireAdmin()
    const { quoteId } = softDeleteQuoteSchema.parse(input)

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId, isDeleted: false },
      select: { requestId: true },
    })

    if (!quote) {
      return { success: false, error: 'Quote not found' }
    }

    await prisma.$transaction(async (tx) => {
      await tx.quote.update({
        where: { id: quoteId },
        data: { isDeleted: true },
      })

      await tx.auditLog.create({
        data: {
          adminId,
          action: 'SOFT_DELETE_QUOTE',
          entity: 'Quote',
          entityId: quoteId,
          changes: { isDeleted: true },
        },
      })
    })

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' }
    }
    return { success: false, error: 'Failed to delete quote' }
  }
}