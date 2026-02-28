// app/api/webhooks/clerk/route.ts

import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// ------------------------
// Helpers
// ------------------------

async function ensureUser(clerkUserId: string) {
  let user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } })
  if (user) return user

  return prisma.user.create({
    data: {
      clerkId: clerkUserId,
      email: `pending-${clerkUserId}@placeholder.local`,
      role: 'CLIENT',
    },
  })
}

// Ensure a subscription exists, optionally update its userId from payer info
async function ensureSubscription(clerkSubscriptionId: string, payerUserId?: string | null) {
  let subscription = await prisma.subscription.findUnique({
    where: { clerkSubscriptionId }
  })

  if (!subscription) {
    // Create stub subscription, possibly with userId if we have it
    const data: any = {
      clerkSubscriptionId,
      lastSyncPayload: { stub: true, source: 'webhook' }
    }
    if (payerUserId) {
      const user = await ensureUser(payerUserId).catch(() => null)
      if (user) data.userId = user.id
    }
    subscription = await prisma.subscription.create({ data })
    console.log(`[ensureSubscription] Created stub for ${clerkSubscriptionId} ${payerUserId ? 'with user' : 'without user'}`)
  } else if (payerUserId && !subscription.userId) {
    // Subscription exists but has no user – try to link it
    const user = await ensureUser(payerUserId).catch(() => null)
    if (user) {
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: { userId: user.id }
      })
      console.log(`[ensureSubscription] Linked subscription ${clerkSubscriptionId} to user ${payerUserId}`)
    }
  }

  return subscription
}

// Ensure a plan exists, mapping all possible fields
async function ensurePlan(planData: any) {
  if (!planData) return null

  // Map Clerk field names to Prisma fields
  const data = {
    name: planData.name,
    amount: planData.amount / 100,
    currency: planData.currency || 'USD',
    interval: planData.interval || null,
    intervalCount: planData.interval_count ?? null,
    trialPeriodDays: planData.trial_period_days ?? null,
  }

  const plan = await prisma.plan.upsert({
    where: { clerkPlanId: planData.id },
    update: data,
    create: {
      clerkPlanId: planData.id,
      ...data,
    },
  })
  return plan.id
}

// ------------------------
// Event Handlers
// ------------------------

async function handleSubscription(data: any) {
  try {
    const { id: clerkSubscriptionId, user_id: clerkUserId } = data

    if (!clerkUserId) {
      console.warn('Subscription event without user_id – skipping')
      return
    }

    const user = await ensureUser(clerkUserId)

    await prisma.subscription.upsert({
      where: { clerkSubscriptionId },
      update: { userId: user.id, lastSyncPayload: data },
      create: { clerkSubscriptionId, userId: user.id, lastSyncPayload: data },
    })
    console.log(`Subscription ${clerkSubscriptionId} synced for user ${clerkUserId}`)
  } catch (error) {
    console.error('Error in handleSubscription:', error)
  }
}

async function handleSubscriptionItem(data: any) {
  try {
    const {
      id: clerkItemId,
      subscription_id: clerkSubscriptionId,
      plan: planData,
      status,
      period_start,
      period_end,
      trial_ends_at,
      payer, // may contain user_id
    } = data

    // Extract user ID from payer if available
    const payerUserId = payer?.user_id

    // Ensure parent subscription exists, possibly linking it to the user
    const subscription = await ensureSubscription(clerkSubscriptionId, payerUserId)

    // Upsert Plan
    const planId = await ensurePlan(planData)

    const isDefaultPlan = planData?.name?.toLowerCase().includes('free') || false
    const normalizedStatus = status?.toUpperCase()

    await prisma.subscriptionItem.upsert({
      where: { clerkItemId },
      update: {
        subscriptionId: subscription.id,
        planId,
        status: normalizedStatus,
        currentPeriodStart: period_start ? new Date(period_start) : null,
        currentPeriodEnd: period_end ? new Date(period_end) : null,
        trialEndsAt: trial_ends_at ? new Date(trial_ends_at) : null,
        isDefaultPlan,
        lastSyncPayload: data,
      },
      create: {
        clerkItemId,
        subscriptionId: subscription.id,
        planId,
        status: normalizedStatus,
        currentPeriodStart: period_start ? new Date(period_start) : null,
        currentPeriodEnd: period_end ? new Date(period_end) : null,
        trialEndsAt: trial_ends_at ? new Date(trial_ends_at) : null,
        isDefaultPlan,
        lastSyncPayload: data,
      },
    })
    console.log(`SubscriptionItem ${clerkItemId} synced`)
  } catch (error) {
    console.error('Error in handleSubscriptionItem:', error)
  }
}

async function handlePaymentAttempt(data: any) {
  try {
    const {
      id: clerkPaymentAttemptId,
      charge_type,
      status,
      currency,
      created_at,
      subscription_id: clerkSubscriptionId,
      subscription_item_id,
      subscription_items,
      totals,
      payer, // may contain user_id
    } = data

    // Determine type
    let type: 'CHECKOUT' | 'RECURRING' = 'CHECKOUT'
    if (charge_type) {
      const upper = charge_type.toUpperCase()
      if (upper === 'CHECKOUT' || upper === 'RECURRING') {
        type = upper
      } else {
        console.warn(`Unknown charge_type: ${charge_type}, defaulting to CHECKOUT`)
      }
    }

    const normalizedStatus = status?.toUpperCase()

    // Extract amount from totals.grand_total.amount (cents → dollars)
    let amount: number | null = null
    if (totals?.grand_total?.amount) {
      amount = totals.grand_total.amount / 100
    }

    // Extract user ID from payer if available
    const payerUserId = payer?.user_id

    // Determine the subscription ID to link – try root first, then from first item
    let targetClerkSubscriptionId = clerkSubscriptionId
    if (!targetClerkSubscriptionId && subscription_items?.length > 0) {
      targetClerkSubscriptionId = subscription_items[0]?.subscription_id
    }

    // Ensure the top-level subscription exists, possibly linking it to the user
    let subscriptionDbId: string | null = null
    if (targetClerkSubscriptionId) {
      const sub = await ensureSubscription(targetClerkSubscriptionId, payerUserId)
      subscriptionDbId = sub.id
    }

    // Determine the related subscription item
    let subscriptionItemDbId: string | null = null
    let targetClerkItemId: string | null = subscription_item_id || subscription_items?.[0]?.id || null

    if (targetClerkItemId) {
      const existingItem = await prisma.subscriptionItem.findUnique({
        where: { clerkItemId: targetClerkItemId },
        select: { id: true }
      })
      if (existingItem) {
        subscriptionItemDbId = existingItem.id
      } else {
        // Create stub item using data from the first item in array
        const firstItem = subscription_items?.[0]
        if (firstItem && subscriptionDbId) {
          const planId = firstItem.plan ? await ensurePlan(firstItem.plan) : null
          const itemStatus = firstItem.status?.toUpperCase() || 'PENDING'
          const validStatus = ['ACTIVE', 'CANCELED', 'UPCOMING', 'ENDED', 'ABANDONED', 'INCOMPLETE', 'PAST_DUE'].includes(itemStatus) ? itemStatus : 'PENDING'

          const newItem = await prisma.subscriptionItem.create({
            data: {
              clerkItemId: targetClerkItemId,
              subscriptionId: subscriptionDbId,
              planId,
              status: validStatus,
              currentPeriodStart: firstItem.period_start ? new Date(firstItem.period_start) : null,
              currentPeriodEnd: firstItem.period_end ? new Date(firstItem.period_end) : null,
              isDefaultPlan: false,
              lastSyncPayload: firstItem,
            }
          })
          subscriptionItemDbId = newItem.id
          console.log(`[paymentAttempt] Created stub subscriptionItem for ${targetClerkItemId}`)
        }
      }
    }

    await prisma.paymentAttempt.upsert({
      where: { clerkPaymentAttemptId },
      update: {
        type,
        status: normalizedStatus,
        amount,
        currency: currency || 'USD',
        occurredAt: new Date(created_at),
        payload: data,
        subscriptionItemId: subscriptionItemDbId,
        subscriptionId: subscriptionDbId,
      },
      create: {
        clerkPaymentAttemptId,
        type,
        status: normalizedStatus,
        amount,
        currency: currency || 'USD',
        occurredAt: new Date(created_at),
        payload: data,
        subscriptionItemId: subscriptionItemDbId,
        subscriptionId: subscriptionDbId,
      },
    })
    console.log(`PaymentAttempt ${clerkPaymentAttemptId} synced`)
  } catch (error) {
    console.error('Error in handlePaymentAttempt:', error)
  }
}

// ------------------------
// Main Webhook Handler
// ------------------------
export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET missing')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  const { type: eventType, data } = evt

  try {
    // ---------------- User Events ----------------
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url, phone_numbers } = data
      const email = email_addresses?.[0]?.email_address ?? `pending-${id}@placeholder.local`
      const fullName = [first_name, last_name].filter(Boolean).join(' ')
      const phone = phone_numbers?.[0]?.phone_number

      await prisma.user.upsert({
        where: { clerkId: id },
        update: { email, fullName, avatarUrl: image_url, phone },
        create: { clerkId: id, email, fullName, avatarUrl: image_url, phone, role: 'CLIENT' },
      })
      console.log(`Processed user event: ${eventType} for ${id}`)
    }

    if (eventType === 'user.deleted') {
      const { id } = data
      const user = await prisma.user.findUnique({ where: { clerkId: id } })
      if (user) {
        await prisma.$transaction([
          // Delete PaymentAttempts linked directly via subscription
          prisma.paymentAttempt.deleteMany({ where: { subscription: { userId: user.id } } }),
          // Delete PaymentAttempts linked via subscriptionItem (which belongs to the user's subscription)
          prisma.paymentAttempt.deleteMany({ where: { subscriptionItem: { subscription: { userId: user.id } } } }),
          // Now delete subscriptionItems (cascade not set, so manual)
          prisma.subscriptionItem.deleteMany({ where: { subscription: { userId: user.id } } }),
          // Delete subscriptions
          prisma.subscription.deleteMany({ where: { userId: user.id } }),
          // Finally delete the user
          prisma.user.delete({ where: { id: user.id } }),
        ])
        console.log(`Deleted user ${id} and all related data (including payment attempts)`)
      } else {
        console.log(`User ${id} already deleted or not found`)
      }
    }

    // ---------------- Billing Events ----------------
    if (eventType.startsWith('subscription.')) {
      await handleSubscription(data)
    }
    if (eventType.startsWith('subscriptionItem.')) {
      await handleSubscriptionItem(data)
    }
    if (eventType.startsWith('paymentAttempt.')) {
      await handlePaymentAttempt(data)
    }
  } catch (err) {
    console.error(`Error processing ${eventType}:`, err)
    // Always return 200 to acknowledge receipt
  }

  return new Response('Webhook processed', { status: 200 })
}