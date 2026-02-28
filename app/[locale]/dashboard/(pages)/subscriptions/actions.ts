'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { SubscriptionItemStatus } from '@prisma/client'

type GetSubscriptionItemsParams = {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  status?: SubscriptionItemStatus
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

export async function getUserSubscriptionItems(params: GetSubscriptionItemsParams = {}) {
  const userId = await getCurrentUserId()
  const {
    page = 1,
    pageSize = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
  } = params

  const where = {
    subscription: { userId },
    ...(status && { status }),
  }
  const total = await prisma.subscriptionItem.count({ where })

  const items = await prisma.subscriptionItem.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      plan: true,
      subscription: {
        select: { clerkSubscriptionId: true },
      },
    },
  })

  // Transform to plain objects with Decimal → number conversion
  const transformed = items.map(item => ({
    id: item.id,
    clerkItemId: item.clerkItemId,
    planName: item.plan?.name || 'Unknown Plan',
    status: item.status,
    currentPeriodStart: item.currentPeriodStart,
    currentPeriodEnd: item.currentPeriodEnd,
    trialEndsAt: item.trialEndsAt,
    isDefaultPlan: item.isDefaultPlan,
    cancelAtPeriodEnd: item.status === 'CANCELED',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    clerkSubscriptionId: item.subscription.clerkSubscriptionId,
    // Serialize plan's amount if plan exists
    plan: item.plan
      ? {
          ...item.plan,
          amount: item.plan.amount ? Number(item.plan.amount) : null,
        }
      : null,
  }))

  return {
    items: transformed,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getSubscriptionItemDetails(itemId: string) {
  const userId = await getCurrentUserId()
  const item = await prisma.subscriptionItem.findFirst({
    where: { id: itemId, subscription: { userId } },
    include: {
      plan: true,
      subscription: {
        include: {
          paymentAttempts: {
            orderBy: { occurredAt: 'desc' },
            take: 5,
          },
        },
      },
    },
  })
  if (!item) throw new Error('Subscription not found')

  // Serialize Decimal fields in the result
  return {
    ...item,
    plan: item.plan
      ? {
          ...item.plan,
          amount: item.plan.amount ? Number(item.plan.amount) : null,
        }
      : null,
    subscription: {
      ...item.subscription,
      paymentAttempts: item.subscription.paymentAttempts.map(attempt => ({
        ...attempt,
        amount: attempt.amount ? Number(attempt.amount) : null,
      })),
    },
  }
}
