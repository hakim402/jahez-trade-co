'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { RequestStatus, Quote } from '@prisma/client'
import { requireAdmin } from '@/lib/admin-guard'
import { logAdminAction } from '@/lib/audit'

// Helper to serialize a single quote (convert Decimal price to number)
function serializeQuote(quote: Quote) {
  return {
    ...quote,
    price: quote.price.toNumber(), // Convert Decimal to number
  }
}

// Get requests with pagination, sorting, and filters
export async function getRequests({
  page = 1,
  pageSize = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  status,
  userId,
  search,
  from,
  to,
}: {
  page?: number
  pageSize?: number
  sortBy?: 'createdAt' | 'status' | 'quantity' | 'user.fullName'
  sortOrder?: 'asc' | 'desc'
  status?: RequestStatus
  userId?: string
  search?: string
  from?: Date
  to?: Date
}) {
  await requireAdmin()

  const skip = (page - 1) * pageSize
  const where: any = {}

  if (status) where.status = status
  if (userId) where.userId = userId
  if (search) {
    where.OR = [
      { productLink: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { customNotes: { contains: search, mode: 'insensitive' } },
      { user: { fullName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = from
    if (to) where.createdAt.lte = to
  }

  // Handle sorting by user field
  let orderBy: any = {}
  if (sortBy === 'user.fullName') {
    orderBy = { user: { fullName: sortOrder } }
  } else {
    orderBy = { [sortBy]: sortOrder }
  }

  const [requests, totalCount] = await Promise.all([
    prisma.productRequest.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        files: true,
        quotes: { orderBy: { createdAt: 'desc' } },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.productRequest.count({ where }),
  ])

  // Serialize quotes (convert Decimal price to number) for each request
  const serializedRequests = requests.map((request) => ({
    ...request,
    quotes: request.quotes.map(serializeQuote),
  }))

  return {
    requests: serializedRequests,
    totalCount,
    pageCount: Math.ceil(totalCount / pageSize),
  }
}

// Get single request (for details drawer)
export async function getRequestById(requestId: string) {
  await requireAdmin()
  const request = await prisma.productRequest.findUnique({
    where: { id: requestId },
    include: {
      user: { select: { id: true, fullName: true, email: true, avatarUrl: true, phone: true } },
      files: true,
      quotes: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!request) return null

  // Serialize quotes in the same way
  return {
    ...request,
    quotes: request.quotes.map(serializeQuote),
  }
}

// Update status + admin notes
export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus,
  adminNotes?: string
) {
  await requireAdmin()
  const request = await prisma.productRequest.update({
    where: { id: requestId },
    data: { status, adminNotes, quotedAt: status === 'QUOTED' ? new Date() : undefined },
  })
  await logAdminAction({
    action: 'UPDATE_REQUEST_STATUS',
    entity: 'ProductRequest',
    entityId: requestId,
    changes: { status, adminNotes },
  })
  revalidatePath('/admin/client-requests')
  return request
}

// Create a quote
export async function createQuote(
  requestId: string,
  data: { price: number; currency?: string; adminNotes?: string; quoteFileUrl?: string }
) {
  await requireAdmin()
  const quote = await prisma.quote.create({
    data: {
      requestId,
      price: data.price,
      currency: data.currency || 'USD',
      adminNotes: data.adminNotes,
      quoteFileUrl: data.quoteFileUrl,
    },
  })
  // Auto-update request status to QUOTED
  await prisma.productRequest.update({
    where: { id: requestId },
    data: { status: 'QUOTED', quotedAt: new Date() },
  })
  await logAdminAction({
    action: 'CREATE_QUOTE',
    entity: 'Quote',
    entityId: quote.id,
    changes: { requestId, ...data },
  })
  revalidatePath('/admin/client-requests')
  return quote
}

// Delete a quote
export async function deleteQuote(quoteId: string) {
  await requireAdmin()
  await prisma.quote.delete({ where: { id: quoteId } })
  await logAdminAction({ action: 'DELETE_QUOTE', entity: 'Quote', entityId: quoteId })
  revalidatePath('/admin/client-requests')
}