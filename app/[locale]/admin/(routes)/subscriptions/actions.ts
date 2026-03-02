// app/[locale]/admin/(routes)/subscriptions/actions.ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { SubscriptionItemStatus } from '@prisma/client'

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
async function requireAdmin() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const admin = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true, isActive: true, isDeleted: true },
  })

  if (!admin || admin.isDeleted || !admin.isActive) throw new Error('User not found or inactive')
  if (admin.role !== 'ADMIN') throw new Error('Forbidden')
  return admin.id
}

// ------------------------------------------------------------------
// Schemas
// ------------------------------------------------------------------
const getAllSubscriptionsFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  planId: z.string().cuid().optional(),
  status: z.nativeEnum(SubscriptionItemStatus).optional(),
  userEmail: z.string().email().optional(),
  expiringBefore: z.date().optional(),
  expiringAfter: z.date().optional(),
})

const updateSubscriptionPlanSchema = z.object({
  userId: z.string().cuid(),
  planId: z.string().cuid(),
})

const deactivateSubscriptionSchema = z.object({
  userId: z.string().cuid(),
})

const grantManualSubscriptionSchema = z.object({
  userId: z.string().cuid(),
  planId: z.string().cuid(),
  durationDays: z.number().int().positive(),
})

// ------------------------------------------------------------------
// Internal helper to get all admin IDs for notifications
// ------------------------------------------------------------------
async function getAllAdminIds() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isDeleted: false, isActive: true },
    select: { id: true },
  })
  return admins.map(a => a.id)
}

// ------------------------------------------------------------------
// Actions
// ------------------------------------------------------------------
export async function getAllSubscriptions(filters: z.infer<typeof getAllSubscriptionsFilterSchema>) {
  try {
    await requireAdmin()
    const validated = getAllSubscriptionsFilterSchema.parse(filters)

    const { page, pageSize, planId, status, userEmail, expiringBefore, expiringAfter } = validated
    const skip = (page - 1) * pageSize

    // Build where clause for SubscriptionItem, joining with User through Subscription
    const where: any = {
      ...(planId && { planId }),
      ...(status && { status }),
      subscription: {
        user: {
          isDeleted: false,
          isActive: true,
          ...(userEmail && { email: { contains: userEmail, mode: 'insensitive' } }),
        },
      },
    }

    if (expiringBefore || expiringAfter) {
      where.currentPeriodEnd = {}
      if (expiringBefore) where.currentPeriodEnd.lte = expiringBefore
      if (expiringAfter) where.currentPeriodEnd.gte = expiringAfter
    }

    const [items, totalCount] = await prisma.$transaction([
      prisma.subscriptionItem.findMany({
        where,
        include: {
          plan: true,
          subscription: {
            include: {
              user: { select: { id: true, email: true, fullName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.subscriptionItem.count({ where }),
    ])

    // Format response to include user details at top level
    const subscriptions = items.map(item => ({
      id: item.id,
      status: item.status,
      currentPeriodStart: item.currentPeriodStart,
      currentPeriodEnd: item.currentPeriodEnd,
      isDefaultPlan: item.isDefaultPlan,
      trialEndsAt: item.trialEndsAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      plan: item.plan,
      user: item.subscription?.user,
    }))

    return {
      success: true,
      data: {
        subscriptions,
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
    return { success: false, error: 'Failed to fetch subscriptions' }
  }
}

export async function updateSubscriptionPlan(input: z.infer<typeof updateSubscriptionPlanSchema>) {
  try {
    const adminId = await requireAdmin()
    const validated = updateSubscriptionPlanSchema.parse(input)

    const result = await prisma.$transaction(async (tx) => {
      // Find user and their subscription container
      const user = await tx.user.findUnique({
        where: { id: validated.userId, isDeleted: false, isActive: true },
        include: { subscription: { include: { items: { where: { status: 'ACTIVE' } } } } },
      })
      if (!user) throw new Error('User not found or inactive')
      if (!user.subscription) throw new Error('User has no subscription container')

      const activeItem = user.subscription.items[0]
      if (!activeItem) throw new Error('No active subscription item found')

      // Verify new plan exists
      const newPlan = await tx.plan.findUnique({ where: { id: validated.planId } })
      if (!newPlan) throw new Error('Plan not found')

      // Cancel current active item
      await tx.subscriptionItem.update({
        where: { id: activeItem.id },
        data: { status: 'CANCELED' },
      })

      // Determine new period: for simplicity, start now, end based on plan interval
      const now = new Date()
      let periodEnd = new Date(now)
      if (newPlan.interval === 'month') {
        periodEnd.setMonth(periodEnd.getMonth() + (newPlan.intervalCount || 1))
      } else if (newPlan.interval === 'year') {
        periodEnd.setFullYear(periodEnd.getFullYear() + (newPlan.intervalCount || 1))
      } else {
        // default to 30 days
        periodEnd.setDate(periodEnd.getDate() + 30)
      }

      // Create new active item
      const newItem = await tx.subscriptionItem.create({
        data: {
          subscriptionId: user.subscription.id,
          planId: newPlan.id,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          adminId,
          action: 'UPDATE_SUBSCRIPTION_PLAN',
          entity: 'SubscriptionItem',
          entityId: newItem.id,
          changes: {
            userId: user.id,
            oldPlanId: activeItem.planId,
            newPlanId: newPlan.id,
          },
        },
      })

      // Notify user
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Subscription Plan Updated',
          message: `Your subscription plan has been updated to ${newPlan.name} by an administrator.`,
          type: 'SUBSCRIPTION_UPDATED',
        },
      })

      // Notify other admins (optional)
      const adminIds = await getAllAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map(id => ({
            userId: id,
            title: 'Subscription Plan Updated',
            message: `Plan for user ${user.email} was updated to ${newPlan.name}.`,
            type: 'SUBSCRIPTION_UPDATED',
          })),
        })
      }

      return newItem
    })

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update subscription plan' }
  }
}

export async function deactivateSubscription(input: z.infer<typeof deactivateSubscriptionSchema>) {
  try {
    const adminId = await requireAdmin()
    const validated = deactivateSubscriptionSchema.parse(input)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: validated.userId, isDeleted: false },
        include: { subscription: { include: { items: { where: { status: 'ACTIVE' } } } } },
      })
      if (!user) throw new Error('User not found')
      if (!user.subscription) throw new Error('User has no subscription')

      const activeItems = user.subscription.items
      if (activeItems.length === 0) throw new Error('No active subscription to deactivate')

      // Deactivate all active items
      await tx.subscriptionItem.updateMany({
        where: { subscriptionId: user.subscription.id, status: 'ACTIVE' },
        data: { status: 'CANCELED' },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          adminId,
          action: 'DEACTIVATE_SUBSCRIPTION',
          entity: 'Subscription',
          entityId: user.subscription.id,
          changes: { userId: user.id },
        },
      })

      // Notify user
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Subscription Deactivated',
          message: 'Your subscription has been deactivated by an administrator.',
          type: 'SUBSCRIPTION_DEACTIVATED',
        },
      })

      return { userId: user.id }
    })

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to deactivate subscription' }
  }
}

export async function grantManualSubscription(input: z.infer<typeof grantManualSubscriptionSchema>) {
  try {
    const adminId = await requireAdmin()
    const validated = grantManualSubscriptionSchema.parse(input)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: validated.userId, isDeleted: false, isActive: true },
        include: { subscription: true },
      })
      if (!user) throw new Error('User not found or inactive')

      const plan = await tx.plan.findUnique({ where: { id: validated.planId } })
      if (!plan) throw new Error('Plan not found')

      // Ensure user has a subscription container
      let subscription = user.subscription
      if (!subscription) {
        subscription = await tx.subscription.create({
          data: {
            userId: user.id,
            clerkSubscriptionId: `manual-${crypto.randomUUID()}`,
          },
        })
      }

      // Deactivate any existing active items
      await tx.subscriptionItem.updateMany({
        where: { subscriptionId: subscription.id, status: 'ACTIVE' },
        data: { status: 'CANCELED' },
      })

      // Calculate period end
      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setDate(periodEnd.getDate() + validated.durationDays)

      // Create new active item
      const newItem = await tx.subscriptionItem.create({
        data: {
          subscriptionId: subscription.id,
          planId: plan.id,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          adminId,
          action: 'GRANT_MANUAL_SUBSCRIPTION',
          entity: 'SubscriptionItem',
          entityId: newItem.id,
          changes: {
            userId: user.id,
            planId: plan.id,
            durationDays: validated.durationDays,
          },
        },
      })

      // Notify user
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Manual Subscription Granted',
          message: `You have been granted a ${plan.name} subscription for ${validated.durationDays} days.`,
          type: 'SUBSCRIPTION_GRANTED',
        },
      })

      return newItem
    })

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to grant manual subscription' }
  }
}

export async function getSubscriptionAnalytics() {
  try {
    await requireAdmin()

    const now = new Date()
    const sevenDaysLater = new Date(now)
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

    const [activeCount, planDistribution, expiringSoon, totalRevenue] = await prisma.$transaction([
      // Total active subscriptions
      prisma.subscriptionItem.count({
        where: { status: 'ACTIVE' },
      }),

      // Plan distribution among active items
      prisma.subscriptionItem.groupBy({
        by: ['planId'],
        where: { status: 'ACTIVE' },
        _count: true,
      }),

      // Expiring soon (within 7 days)
      prisma.subscriptionItem.findMany({
        where: {
          status: 'ACTIVE',
          currentPeriodEnd: { lte: sevenDaysLater, gt: now },
        },
        include: {
          plan: true,
          subscription: { include: { user: { select: { email: true } } } },
        },
      }),

      // Monthly recurring revenue estimate (sum of plan amounts for active items, assuming monthly)
      prisma.subscriptionItem.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { plan: { amount: true } }, // note: plan amount is Decimal
      }),
    ])

    // Enrich plan distribution with plan names
    const planDetails = await prisma.plan.findMany({
      where: { id: { in: planDistribution.map(p => p.planId).filter(Boolean) } },
    })
    const enrichedDistribution = planDistribution.map(p => ({
      planId: p.planId,
      planName: planDetails.find(pd => pd.id === p.planId)?.name || 'Unknown',
      count: p._count,
    }))

    return {
      success: true,
      data: {
        totalActive: activeCount,
        planDistribution: enrichedDistribution,
        expiringSoon: expiringSoon.map(item => ({
          id: item.id,
          userEmail: item.subscription?.user?.email,
          planName: item.plan?.name,
          expiresAt: item.currentPeriodEnd,
        })),
        estimatedMonthlyRevenue: totalRevenue._sum?.plan?.amount || 0,
      },
    }
  } catch (error) {
    return { success: false, error: 'Failed to fetch analytics' }
  }
}