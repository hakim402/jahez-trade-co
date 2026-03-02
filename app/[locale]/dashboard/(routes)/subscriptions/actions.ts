// app/[locale]/dashboard/(routes)/subscription/actions.ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { SubscriptionItemStatus } from '@prisma/client'

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

async function getAllAdminIds() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isDeleted: false, isActive: true },
    select: { id: true },
  })
  return admins.map(a => a.id)
}

// ------------------------------------------------------------------
// Schemas
// ------------------------------------------------------------------
const createCheckoutSessionSchema = z.object({
  planId: z.string().cuid(),
})

// ------------------------------------------------------------------
// Actions
// ------------------------------------------------------------------
export async function getMySubscription() {
  try {
    const clientId = await requireClient()

    const user = await prisma.user.findUnique({
      where: { id: clientId },
      include: {
        subscription: {
          include: {
            items: {
              where: { status: 'ACTIVE' },
              include: { plan: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    })

    if (!user?.subscription || user.subscription.items.length === 0) {
      return { success: true, data: null }
    }

    const activeItem = user.subscription.items[0]
    return {
      success: true,
      data: {
        id: activeItem.id,
        plan: activeItem.plan,
        status: activeItem.status,
        currentPeriodStart: activeItem.currentPeriodStart,
        currentPeriodEnd: activeItem.currentPeriodEnd,
        isDefaultPlan: activeItem.isDefaultPlan,
        trialEndsAt: activeItem.trialEndsAt,
        createdAt: activeItem.createdAt,
        updatedAt: activeItem.updatedAt,
      },
    }
  } catch {
    return { success: false, error: 'Failed to fetch subscription' }
  }
}

export async function createCheckoutSession(input: z.infer<typeof createCheckoutSessionSchema>) {
  try {
    const clientId = await requireClient()
    const validated = createCheckoutSessionSchema.parse(input)

    // Verify plan exists
    const plan = await prisma.plan.findUnique({ where: { id: validated.planId } })
    if (!plan) {
      return { success: false, error: 'Plan not found' }
    }

    // In a real implementation, you would call Clerk's billing API to create a checkout session.
    // This is a placeholder; you'd need to use Clerk's SDK with secret key.
    // For security, never expose secret keys in client components, but this is a server action.
    // Here we assume you have a function that calls Clerk.
    // For demonstration, we return a mock URL.
    // Replace with actual Clerk checkout session creation.
    const mockCheckoutUrl = `https://billing.clerk.com/checkout?plan=${validated.planId}&user=${clientId}`

    return { success: true, data: { url: mockCheckoutUrl } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' }
    }
    return { success: false, error: 'Failed to create checkout session' }
  }
}

export async function cancelMySubscription() {
  try {
    const clientId = await requireClient()

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: clientId },
        include: { subscription: { include: { items: { where: { status: 'ACTIVE' } } } } },
      })
      if (!user?.subscription || user.subscription.items.length === 0) {
        throw new Error('No active subscription to cancel')
      }

      const activeItem = user.subscription.items[0]

      // Update status to CANCELED
      const updatedItem = await tx.subscriptionItem.update({
        where: { id: activeItem.id },
        data: { status: 'CANCELED' },
        include: { plan: true },
      })

      // Status history? There's no dedicated history model for subscription items,
      // but we can use notifications/audit if needed.

      // Notify admins
      const adminIds = await getAllAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map(adminId => ({
            userId: adminId,
            title: 'Subscription Cancelled',
            message: `User ${user.email} has cancelled their subscription.`,
            type: 'SUBSCRIPTION_CANCELLED',
          })),
        })
      }

      // Notify user
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Subscription Cancelled',
          message: 'Your subscription has been cancelled.',
          type: 'SUBSCRIPTION_CANCELLED',
        },
      })

      return updatedItem
    })

    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel subscription' }
  }
}

export async function resumeSubscription() {
  try {
    const clientId = await requireClient()

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: clientId },
        include: { subscription: { include: { items: { where: { status: 'CANCELED' } } } } },
      })
      if (!user?.subscription || user.subscription.items.length === 0) {
        throw new Error('No canceled subscription to resume')
      }

      const canceledItem = user.subscription.items[0]

      // Reactivate
      const updatedItem = await tx.subscriptionItem.update({
        where: { id: canceledItem.id },
        data: { status: 'ACTIVE' },
        include: { plan: true },
      })

      // Notify admins
      const adminIds = await getAllAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map(adminId => ({
            userId: adminId,
            title: 'Subscription Resumed',
            message: `User ${user.email} has resumed their subscription.`,
            type: 'SUBSCRIPTION_RESUMED',
          })),
        })
      }

      // Notify user
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Subscription Resumed',
          message: 'Your subscription has been resumed.',
          type: 'SUBSCRIPTION_RESUMED',
        },
      })

      return updatedItem
    })

    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to resume subscription' }
  }
}

export async function validateSubscriptionAccess() {
  try {
    const clientId = await requireClient()

    const user = await prisma.user.findUnique({
      where: { id: clientId },
      include: {
        subscription: {
          include: {
            items: {
              where: { status: 'ACTIVE' },
              include: { plan: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    })

    const now = new Date()
    const activeItem = user?.subscription?.items[0]
    const hasAccess = !!(activeItem && activeItem.currentPeriodEnd && activeItem.currentPeriodEnd > now)

    return {
      success: true,
      data: {
        hasAccess,
        plan: activeItem?.plan?.name || null,
        expiresAt: activeItem?.currentPeriodEnd || null,
      },
    }
  } catch {
    return { success: false, error: 'Failed to validate access' }
  }
}

// ------------------------------------------------------------------
// Internal function for webhook sync (not exposed as action)
// ------------------------------------------------------------------
export async function syncSubscriptionFromClerk(clerkSubscriptionData: any) {
  // This function would be called from a webhook handler.
  // Implementation depends on Clerk's webhook payload structure.
  // Placeholder: upsert subscription and items based on clerk data.
  // For production, you'd map Clerk fields to your schema.
  // We'll assume clerkData contains: id (clerkSubscriptionId), userId (clerkId), items, etc.
  try {
    const { id: clerkSubscriptionId, userId: clerkUserId, items, ...rest } = clerkSubscriptionData

    // Find user by clerkId
    const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } })
    if (!user) throw new Error('User not found')

    // Upsert subscription container
    const subscription = await prisma.subscription.upsert({
      where: { clerkSubscriptionId },
      update: { lastSyncPayload: rest },
      create: {
        clerkSubscriptionId,
        userId: user.id,
        lastSyncPayload: rest,
      },
    })

    // Process each item
    for (const item of items) {
      const { id: clerkItemId, planId: clerkPlanId, status, currentPeriodStart, currentPeriodEnd } = item

      // Find plan by clerkPlanId (assuming you have a mapping)
      const plan = await prisma.plan.findUnique({ where: { clerkPlanId } })
      if (!plan) continue // or create plan? but schema says Plan is separate

      await prisma.subscriptionItem.upsert({
        where: { clerkItemId },
        update: {
          status,
          currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart) : undefined,
          currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : undefined,
        },
        create: {
          clerkItemId,
          subscriptionId: subscription.id,
          planId: plan.id,
          status,
          currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart) : null,
          currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Webhook sync failed', error) // keep minimal logging for debugging, but avoid in actions
    throw error
  }
}