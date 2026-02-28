'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { PaymentAttemptStatus } from '@prisma/client'

type GetPaymentsParams = {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  status?: PaymentAttemptStatus
}

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

export async function getUserPayments(params: GetPaymentsParams = {}) {
  const userId = await getCurrentUserId()
  const {
    page = 1,
    pageSize = 10,
    sortBy = 'occurredAt',
    sortOrder = 'desc',
    status,
  } = params

  const where = {
    OR: [
      { subscription: { userId } },
      { subscriptionItem: { subscription: { userId } } },
    ],
    ...(status && { status }),
  }

  const total = await prisma.paymentAttempt.count({ where })

  const payments = await prisma.paymentAttempt.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      subscription: {
        select: {
          id: true,
          clerkSubscriptionId: true,
          user: { select: { id: true } },
        },
      },
      subscriptionItem: {
        include: {
          plan: { select: { name: true, amount: true, currency: true } },
          subscription: { select: { clerkSubscriptionId: true } },
        },
      },
    },
  })

  // Recursively serialize all Decimal fields
  const serializedPayments = payments.map((payment) => ({
    ...payment,
    amount: payment.amount ? Number(payment.amount) : null,
    subscriptionItem: payment.subscriptionItem
      ? {
          ...payment.subscriptionItem,
          plan: payment.subscriptionItem.plan
            ? {
                ...payment.subscriptionItem.plan,
                amount: payment.subscriptionItem.plan.amount
                  ? Number(payment.subscriptionItem.plan.amount)
                  : null,
              }
            : null,
        }
      : null,
  }))

  return {
    payments: serializedPayments,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getPaymentDetails(paymentId: string) {
  const userId = await getCurrentUserId()
  const payment = await prisma.paymentAttempt.findFirst({
    where: {
      id: paymentId,
      OR: [
        { subscription: { userId } },
        { subscriptionItem: { subscription: { userId } } },
      ],
    },
    include: {
      subscription: {
        select: {
          id: true,
          clerkSubscriptionId: true,
          user: { select: { id: true } },
        },
      },
      subscriptionItem: {
        include: {
          plan: { select: { name: true, amount: true, currency: true } },
          subscription: { select: { clerkSubscriptionId: true } },
        },
      },
    },
  })
  if (!payment) throw new Error('Payment not found')

  // Serialize all Decimal fields
  return {
    ...payment,
    amount: payment.amount ? Number(payment.amount) : null,
    subscriptionItem: payment.subscriptionItem
      ? {
          ...payment.subscriptionItem,
          plan: payment.subscriptionItem.plan
            ? {
                ...payment.subscriptionItem.plan,
                amount: payment.subscriptionItem.plan.amount
                  ? Number(payment.subscriptionItem.plan.amount)
                  : null,
              }
            : null,
        }
      : null,
  }
}