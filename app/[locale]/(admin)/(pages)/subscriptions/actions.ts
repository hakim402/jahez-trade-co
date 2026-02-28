// app/admin/(pages)/subscriptions/actions.ts

'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client'
import { requireAdmin } from '@/lib/admin-guard'
import { logAdminAction } from '@/lib/audit'

// Get subscriptions with pagination, sorting, and filters
export async function getSubscriptions({
  page = 1,
  pageSize = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  plan,
  status,
  search,
  from,
  to,
}: {
  page?: number
  pageSize?: number
  sortBy?: 'createdAt' | 'currentPeriodEnd' | 'plan' | 'status' | 'user.fullName'
  sortOrder?: 'asc' | 'desc'
  plan?: SubscriptionPlan
  status?: SubscriptionStatus
  search?: string
  from?: Date
  to?: Date
}) {
  await requireAdmin()

  const skip = (page - 1) * pageSize
  const where: any = {}

  if (plan) where.plan = plan
  if (status) where.status = status
  if (search) {
    where.OR = [
      { user: { fullName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { stripeSubscriptionId: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (from || to) {
    where.currentPeriodEnd = {}
    if (from) where.currentPeriodEnd.gte = from
    if (to) where.currentPeriodEnd.lte = to
  }

  // Handle sorting by user field
  let orderBy: any = {}
  if (sortBy === 'user.fullName') {
    orderBy = { user: { fullName: sortOrder } }
  } else {
    orderBy = { [sortBy]: sortOrder }
  }

  const [subscriptions, totalCount] = await Promise.all([
    prisma.subscription.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.subscription.count({ where }),
  ])

  return { subscriptions, totalCount, pageCount: Math.ceil(totalCount / pageSize) }
}

// Get single subscription (for details drawer)
export async function getSubscriptionById(subscriptionId: string) {
  await requireAdmin()
  return prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
    },
  })
}

// Update subscription status and cancelAtPeriodEnd
export async function updateSubscription(
  subscriptionId: string,
  data: {
    status?: SubscriptionStatus
    cancelAtPeriodEnd?: boolean
  }
) {
  await requireAdmin()
  const subscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data,
  })
  await logAdminAction({
    action: 'UPDATE_SUBSCRIPTION',
    entity: 'Subscription',
    entityId: subscriptionId,
    changes: data,
  })
  revalidatePath('/admin/subscriptions')
  return subscription
}

// Optional: Sync with Stripe (if you want to pull latest data)
export async function syncSubscriptionFromStripe(subscriptionId: string) {
  await requireAdmin()
  // This would call Stripe API to get latest subscription data
  // and update the local record accordingly.
  // For now, placeholder.
  // ...
  revalidatePath('/admin/subscriptions')
}