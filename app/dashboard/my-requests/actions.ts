'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { RequestStatus } from '@prisma/client'

// ----------------------------------------------------------------------
// Validation Schemas
// ----------------------------------------------------------------------
const createRequestSchema = z.object({
  productLink: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  quantity: z.coerce.number().int().positive(),
  shippingCountry: z.string().min(1),
  customNotes: z.string().optional().nullable(),
})

const updateRequestSchema = z.object({
  id: z.string(),
  productLink: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  quantity: z.coerce.number().int().positive(),
  shippingCountry: z.string().min(1),
  customNotes: z.string().optional().nullable(),
})

// ----------------------------------------------------------------------
// Types for params
// ----------------------------------------------------------------------
type GetRequestsParams = {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  status?: RequestStatus
}

// ----------------------------------------------------------------------
// Helper: get current user ID
// ----------------------------------------------------------------------
async function getCurrentUserId() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) throw new Error('User not found')
  return user.id
}

// ----------------------------------------------------------------------
// Get user's requests with pagination, sorting, filtering
// ----------------------------------------------------------------------
export async function getUserRequests(params: GetRequestsParams = {}) {
  const userId = await getCurrentUserId()
  const {
    page = 1,
    pageSize = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
  } = params

  const where = { userId, ...(status && { status }) }
  const total = await prisma.productRequest.count({ where })

 const requests = await prisma.productRequest.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      files: true,
      quotes: {
        orderBy: { createdAt: 'desc' },
        take: 1, // only latest quote
      },
      _count: {
        select: { files: true, quotes: true },
      },
    },
  });

  // Convert Decimal price to number
  const serializedRequests = requests.map((request) => ({
    ...request,
    quotes: request.quotes.map((quote) => ({
      ...quote,
      price: quote.price ? quote.price.toNumber() : null, // or .toString() if you prefer
    })),
  }));

  return {
    requests: serializedRequests,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ----------------------------------------------------------------------
// Get single request details
// ----------------------------------------------------------------------
export async function getRequestDetails(requestId: string) {
  const userId = await getCurrentUserId()
  const request = await prisma.productRequest.findFirst({
    where: { id: requestId, userId },
    include: {
      files: true,
      quotes: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!request) throw new Error('Request not found');

  // Convert Decimal price to number
  const serializedRequest = {
    ...request,
    quotes: request.quotes.map((quote) => ({
      ...quote,
      price: quote.price ? quote.price.toNumber() : null,
    })),
  };

  return serializedRequest;
}

// ----------------------------------------------------------------------
// Create new request
// ----------------------------------------------------------------------
export async function createRequest(formData: FormData) {
  const userId = await getCurrentUserId()
  const rawData = {
    productLink: formData.get('productLink'),
    description: formData.get('description'),
    quantity: formData.get('quantity'),
    shippingCountry: formData.get('shippingCountry'),
    customNotes: formData.get('customNotes'),
  }
  const validated = createRequestSchema.parse(rawData)

  // In a real app, you'd handle file uploads here.
  // For now, we just create the request without files.
  const request = await prisma.productRequest.create({
    data: {
      userId,
      ...validated,
      status: 'SUBMITTED',
    },
  })

  revalidatePath('/dashboard/my-requests')
  return { success: true, requestId: request.id }
}

// ----------------------------------------------------------------------
// Update request (only if status allows, e.g., SUBMITTED)
// ----------------------------------------------------------------------
export async function updateRequest(formData: FormData) {
  const userId = await getCurrentUserId()
  const id = formData.get('id') as string
  if (!id) throw new Error('Request ID required')

  // Verify ownership and status
  const existing = await prisma.productRequest.findFirst({
    where: { id, userId },
  })
  if (!existing) throw new Error('Request not found')
  if (existing.status !== 'SUBMITTED') {
    throw new Error('Cannot update request after submission')
  }

  const rawData = {
    id,
    productLink: formData.get('productLink'),
    description: formData.get('description'),
    quantity: formData.get('quantity'),
    shippingCountry: formData.get('shippingCountry'),
    customNotes: formData.get('customNotes'),
  }
  const validated = updateRequestSchema.parse(rawData)

  await prisma.productRequest.update({
    where: { id },
    data: {
      productLink: validated.productLink,
      description: validated.description,
      quantity: validated.quantity,
      shippingCountry: validated.shippingCountry,
      customNotes: validated.customNotes,
    },
  })

  revalidatePath('/dashboard/my-requests')
  revalidatePath(`/dashboard/my-requests/${id}`)
  return { success: true }
}

// ----------------------------------------------------------------------
// Cancel request (only if status is SUBMITTED)
// ----------------------------------------------------------------------
export async function cancelRequest(requestId: string) {
  const userId = await getCurrentUserId()
  const request = await prisma.productRequest.findFirst({
    where: { id: requestId, userId },
  })
  if (!request) throw new Error('Request not found')
  if (request.status !== 'SUBMITTED') {
    throw new Error('Cannot cancel request that is already processed')
  }

  await prisma.productRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED' }, // or maybe a CANCELLED status? but we have REJECTED
  })

  revalidatePath('/dashboard/my-requests')
  return { success: true }
}