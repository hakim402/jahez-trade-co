'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { SubscriptionStatus } from '@prisma/client'

// ----------------------------------------------------------------------
// Types for params
// ----------------------------------------------------------------------
type GetSubscriptionsParams = {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  status?: SubscriptionStatus
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
// Get user's subscriptions with pagination, sorting, filtering
// ----------------------------------------------------------------------
export async function getUserSubscriptions(params: GetSubscriptionsParams = {}) {
  const userId = await getCurrentUserId()
  const {
    page = 1,
    pageSize = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
  } = params

  const where = { userId, ...(status && { status }) }
  const total = await prisma.subscription.count({ where })

  const subscriptions = await prisma.subscription.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      plan: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      trialEndsAt: true,
      createdAt: true,
      stripeSubscriptionId: true,
    },
  })

  return {
    subscriptions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// ----------------------------------------------------------------------
// Get single subscription details
// ----------------------------------------------------------------------
export async function getSubscriptionDetails(subscriptionId: string) {
  const userId = await getCurrentUserId()
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId },
    select: {
      id: true,
      plan: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      trialEndsAt: true,
      createdAt: true,
      updatedAt: true,
      stripeSubscriptionId: true,
      stripeCustomerId: true,
    },
  })
  if (!subscription) throw new Error('Subscription not found')
  return subscription
}

// ----------------------------------------------------------------------
// Cancel subscription (only if status is ACTIVE, PAST_DUE, or TRIALING)
// ----------------------------------------------------------------------
export async function cancelSubscription(subscriptionId: string) {
  const userId = await getCurrentUserId()
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId },
  })
  if (!subscription) throw new Error('Subscription not found')

  // Only allow cancellation if it's not already canceled
  if (subscription.status === 'CANCELED') {
    throw new Error('Subscription is already canceled')
  }

  // In a real app, you'd also cancel the subscription in Stripe.
  // For now, we just update the status and set cancelAtPeriodEnd.
  // Note: Typically you'd set cancelAtPeriodEnd = true and let it expire,
  // but here we'll set status to CANCELED immediately for simplicity.
  // You might want to handle Stripe webhooks to sync status.

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'CANCELED',
      cancelAtPeriodEnd: false, // or true if you want it to expire at period end
    },
  })

  revalidatePath('/dashboard/my-subscriptions')
  return { success: true }
}