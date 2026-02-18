// app/dashboard/payments/actions.ts

'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { PaymentStatus } from '@prisma/client'

// ----------------------------------------------------------------------
// Types for params
// ----------------------------------------------------------------------
type GetPaymentsParams = {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  status?: PaymentStatus
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
// Get user's payments with pagination, sorting, filtering
// ----------------------------------------------------------------------
export async function getUserPayments(params: GetPaymentsParams = {}) {
  const userId = await getCurrentUserId()
  const {
    page = 1,
    pageSize = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
  } = params

  const where = { userId, ...(status && { status }) }
  const total = await prisma.payment.count({ where })

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      booking: {
        select: {
          id: true,
          type: true,
          scheduledAt: true,
        },
      },
    },
  })

  // ✅ Convert Decimal amount to plain number
  const serializedPayments = payments.map((payment) => ({
    ...payment,
    amount: payment.amount ? Number(payment.amount) : null,
  }))

  return {
    payments: serializedPayments,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// ----------------------------------------------------------------------
// Get single payment details
// ----------------------------------------------------------------------
export async function getPaymentDetails(paymentId: string) {
  const userId = await getCurrentUserId()
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId },
    include: {
      booking: {
        select: {
          id: true,
          type: true,
          location: true,
          scheduledAt: true,
          status: true,
        },
      },
    },
  })
  if (!payment) throw new Error('Payment not found')

  // ✅ Convert Decimal amount to plain number
  return {
    ...payment,
    amount: payment.amount ? Number(payment.amount) : null,
  }
}