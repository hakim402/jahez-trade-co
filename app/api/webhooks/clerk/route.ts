// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Prisma, SubscriptionItemStatus } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const VALID_ITEM_STATUSES = new Set<SubscriptionItemStatus>([
  'ACTIVE', 'CANCELED', 'UPCOMING', 'ENDED', 'ABANDONED', 'INCOMPLETE', 'PAST_DUE',
])

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function ensureUser(clerkUserId: string) {
  const existing = await prisma.user.findUnique({ where: { clerkId: clerkUserId } })
  if (existing) return existing

  return prisma.user.create({
    data: {
      clerkId: clerkUserId,
      email:   `pending-${clerkUserId}@placeholder.local`,
      role:    'CLIENT',
    },
  })
}

async function ensureSubscription(
  clerkSubscriptionId: string,
  payerClerkUserId?: string | null,
) {
  let sub = await prisma.subscription.findUnique({ where: { clerkSubscriptionId } })

  if (!sub) {
    const data: Prisma.SubscriptionCreateInput = {
      clerkSubscriptionId,
      lastSyncPayload: { stub: true, source: 'webhook' } as Prisma.InputJsonValue,
    }
    if (payerClerkUserId) {
      const user = await ensureUser(payerClerkUserId).catch(() => null)
      if (user) data.user = { connect: { id: user.id } }
    }
    sub = await prisma.subscription.create({ data })
    console.log(`[webhook] Created stub subscription ${clerkSubscriptionId}`)
    return sub
  }

  // Link user if still missing
  if (payerClerkUserId && !sub.userId) {
    const user = await ensureUser(payerClerkUserId).catch(() => null)
    if (user) {
      sub = await prisma.subscription.update({
        where: { id: sub.id },
        data:  { userId: user.id },
      })
      console.log(`[webhook] Linked subscription ${clerkSubscriptionId} → user ${payerClerkUserId}`)
    }
  }

  return sub
}

/**
 * FIX (Bug 3): Accept an optional `itemInterval` parameter.
 * Clerk puts `interval` on the subscription item, NOT on the plan object.
 * Also normalise empty-string currency to "USD".
 */
async function ensurePlan(
  planData: Record<string, any> | null | undefined,
  itemInterval?: string | null,   // ← comes from the item, not the plan
) {
  if (!planData?.id) return null

  // FIX: prefer itemInterval when planData.interval is missing/empty
  const interval  = planData.interval   || itemInterval   || null
  // FIX: Clerk sends "" for free plans — default to "USD"
  const currency  = planData.currency   || 'USD'
  const amount    = (planData.amount ?? 0) / 100

  const data = {
    name:            planData.name              ?? 'Unknown Plan',
    amount,
    currency,
    interval,
    intervalCount:   planData.interval_count    ?? null,
    trialPeriodDays: planData.trial_period_days ?? null,
    isDefault:
      planData.is_default ??
      planData.name?.toLowerCase().includes('free') ??
      false,
  }

  const plan = await prisma.plan.upsert({
    where:  { clerkPlanId: planData.id },
    update: data,
    create: { clerkPlanId: planData.id, ...data },
  })
  return plan.id
}

function normaliseItemStatus(raw: string | null | undefined): SubscriptionItemStatus {
  const upper = (raw ?? '').toUpperCase() as SubscriptionItemStatus
  return VALID_ITEM_STATUSES.has(upper) ? upper : 'INCOMPLETE'
}

// ─────────────────────────────────────────────────────────────────────────────
// USER HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

async function handleUserCreatedOrUpdated(data: any) {
  const {
    id,
    email_addresses,
    first_name,
    last_name,
    image_url,
    phone_numbers,
    public_metadata,
  } = data

  const email    = email_addresses?.[0]?.email_address ?? `pending-${id}@placeholder.local`
  const fullName = [first_name, last_name].filter(Boolean).join(' ') || null
  const phone    = phone_numbers?.[0]?.phone_number ?? null
  const role     = public_metadata?.role === 'ADMIN' ? 'ADMIN' : 'CLIENT'

  await prisma.user.upsert({
    where:  { clerkId: id },
    update: { email, fullName, avatarUrl: image_url ?? null, phone, role },
    create: { clerkId: id, email, fullName, avatarUrl: image_url ?? null, phone, role },
  })
  console.log(`[webhook] User upserted: ${id}`)
}

async function handleUserDeleted(data: any) {
  const { id: clerkId } = data
  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) {
    console.log(`[webhook] user.deleted – user ${clerkId} not found, skipping`)
    return
  }

  await prisma.$transaction([
    prisma.paymentAttempt.deleteMany({
      where: { subscription: { userId: user.id } },
    }),
    prisma.paymentAttempt.deleteMany({
      where: { subscriptionItem: { subscription: { userId: user.id } } },
    }),
    prisma.subscriptionItem.deleteMany({
      where: { subscription: { userId: user.id } },
    }),
    prisma.subscription.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ])
  console.log(`[webhook] Deleted user ${clerkId} and all related data`)
}

// ─────────────────────────────────────────────────────────────────────────────
// BILLING HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FIX (Bug 1 + Bug 2):
 *
 * Bug 1 — user_id is nested under `payer.user_id`, not at the root level.
 *   Old: const { user_id: clerkUserId } = data          // always undefined
 *   New: const clerkUserId = data.payer?.user_id        // correctly resolved
 *
 * Bug 2 — subscription.created payload includes items[] but the old handler
 *   never processed them, leaving SubscriptionItem empty for new users.
 *   New: after upserting the Subscription we iterate data.items and call
 *   upsertSubscriptionItem() for each one.
 */
async function handleSubscriptionEvent(data: any) {
  const clerkSubscriptionId = data.id
  // FIX (Bug 1): user_id is inside payer, not at the root
  const clerkUserId: string | null = data.payer?.user_id ?? null

  if (!clerkSubscriptionId) {
    console.warn('[webhook] Subscription event missing id – skipping')
    return
  }

  const user = clerkUserId ? await ensureUser(clerkUserId).catch(() => null) : null

  await prisma.subscription.upsert({
    where:  { clerkSubscriptionId },
    update: {
      ...(user && { userId: user.id }),
      lastSyncPayload: data as Prisma.InputJsonValue,
    },
    create: {
      clerkSubscriptionId,
      ...(user && { userId: user.id }),
      lastSyncPayload: data as Prisma.InputJsonValue,
    },
  })
  console.log(`[webhook] Subscription synced: ${clerkSubscriptionId}`)

  // FIX (Bug 2): Process embedded items[] so SubscriptionItem rows are created
  // immediately on subscription.created — no need to wait for a separate
  // subscriptionItem.* event that may arrive later or not at all for free plans.
  const items: any[] = Array.isArray(data.items) ? data.items : []
  for (const item of items) {
    await upsertSubscriptionItem({
      clerkItemId:        item.id,
      clerkSubscriptionId,
      clerkUserId,
      planData:           item.plan   ?? null,
      rawStatus:          item.status ?? null,
      itemInterval:       item.interval ?? null,   // FIX (Bug 3): interval is on the item
      period_start:       item.period_start ?? null,
      period_end:         item.period_end   ?? null,
      trial_ends_at:      item.trial_ends_at ?? null,
      rawPayload:         item,
    })
  }
}

/**
 * Shared upsert logic for a single SubscriptionItem.
 * Used by both handleSubscriptionEvent (items embedded in subscription payload)
 * and handleSubscriptionItemEvent (dedicated subscriptionItem.* events).
 */
async function upsertSubscriptionItem(params: {
  clerkItemId:        string
  clerkSubscriptionId: string
  clerkUserId:        string | null
  planData:           Record<string, any> | null
  rawStatus:          string | null
  itemInterval:       string | null   // FIX (Bug 3): from the item, not the plan
  period_start:       number | string | null
  period_end:         number | string | null
  trial_ends_at:      number | string | null
  rawPayload:         any
}) {
  const {
    clerkItemId,
    clerkSubscriptionId,
    clerkUserId,
    planData,
    rawStatus,
    itemInterval,
    period_start,
    period_end,
    trial_ends_at,
    rawPayload,
  } = params

  if (!clerkItemId) {
    console.warn('[webhook] upsertSubscriptionItem called without clerkItemId – skipping')
    return
  }

  const status = normaliseItemStatus(rawStatus)

  const [subscription, planId] = await Promise.all([
    ensureSubscription(clerkSubscriptionId, clerkUserId),
    // FIX (Bug 3): pass itemInterval so ensurePlan can store it correctly
    ensurePlan(planData, itemInterval),
  ])

  const isDefaultPlan =
    planData?.is_default ??
    planData?.name?.toLowerCase().includes('free') ??
    false

  // Clerk timestamps can be epoch-ms numbers or ISO strings
  const toDate = (v: number | string | null): Date | null => {
    if (!v) return null
    return typeof v === 'number' ? new Date(v) : new Date(v)
  }

  const shared = {
    status,
    currentPeriodStart: toDate(period_start),
    currentPeriodEnd:   toDate(period_end),
    trialEndsAt:        toDate(trial_ends_at),
    isDefaultPlan,
    lastSyncPayload:    rawPayload as Prisma.InputJsonValue,
    subscription:       { connect: { id: subscription.id } },
    ...(planId && { plan: { connect: { id: planId } } }),
  }

  await prisma.subscriptionItem.upsert({
    where:  { clerkItemId },
    update: shared,
    create: { clerkItemId, ...shared },
  })
  console.log(`[webhook] SubscriptionItem synced: ${clerkItemId} → ${status}`)
}

/**
 * Handles dedicated subscriptionItem.* events.
 * Delegates to the shared upsertSubscriptionItem() helper.
 */
async function handleSubscriptionItemEvent(eventType: string, data: any) {
  const {
    id:              clerkItemId,
    subscription_id: clerkSubscriptionId,
    plan:            planData,
    status:          rawStatus,
    period_start,
    period_end,
    trial_ends_at,
    payer,
    // FIX (Bug 3): interval is on the item object, not inside plan
    interval:        itemInterval,
  } = data

  if (!clerkItemId) {
    console.warn('[webhook] SubscriptionItem event missing id – skipping')
    return
  }

  const payerClerkUserId = payer?.user_id ?? null

  // Infer status from event type suffix when not present in payload
  const inferredStatus = eventType.split('.')[1]?.toUpperCase()
  const effectiveStatus = rawStatus ?? inferredStatus

  await upsertSubscriptionItem({
    clerkItemId,
    clerkSubscriptionId,
    clerkUserId:  payerClerkUserId,
    planData,
    rawStatus:    effectiveStatus,
    itemInterval,   // FIX (Bug 3)
    period_start,
    period_end,
    trial_ends_at,
    rawPayload:   data,
  })
}

/**
 * paymentAttempt.created | paymentAttempt.updated
 */
async function handlePaymentAttemptEvent(data: any) {
  const {
    id:                    clerkPaymentAttemptId,
    charge_type,
    status:                rawStatus,
    currency,
    created_at,
    subscription_id:       clerkSubscriptionId,
    subscription_item_id,
    subscription_items,
    totals,
    payer,
  } = data

  if (!clerkPaymentAttemptId) {
    console.warn('[webhook] PaymentAttempt event missing id – skipping')
    return
  }

  const type: 'CHECKOUT' | 'RECURRING' =
    charge_type?.toUpperCase() === 'RECURRING' ? 'RECURRING' : 'CHECKOUT'

  const upperStatus = (rawStatus ?? '').toUpperCase()
  const status: 'PENDING' | 'PAID' | 'FAILED' =
    upperStatus === 'PAID'   ? 'PAID'
    : upperStatus === 'FAILED' ? 'FAILED'
    : 'PENDING'

  const amount: number | null =
    typeof totals?.grand_total?.amount === 'number'
      ? totals.grand_total.amount / 100
      : null

  // FIX (Bug 1 consistency): payer.user_id, not root user_id
  const payerClerkUserId = payer?.user_id ?? null

  const effectiveClerkSubId =
    clerkSubscriptionId ?? subscription_items?.[0]?.subscription_id ?? null

  let subscriptionDbId: string | null = null
  if (effectiveClerkSubId) {
    const sub = await ensureSubscription(effectiveClerkSubId, payerClerkUserId)
    subscriptionDbId = sub.id
  }

  const targetClerkItemId: string | null =
    subscription_item_id ?? subscription_items?.[0]?.id ?? null

  let subscriptionItemDbId: string | null = null
  if (targetClerkItemId) {
    const existing = await prisma.subscriptionItem.findUnique({
      where:  { clerkItemId: targetClerkItemId },
      select: { id: true },
    })

    if (existing) {
      subscriptionItemDbId = existing.id
    } else if (subscriptionDbId) {
      const firstItem  = subscription_items?.[0]
      const stubPlanId = firstItem?.plan
        ? await ensurePlan(firstItem.plan, firstItem.interval)  // FIX (Bug 3)
        : null
      const stubStatus = normaliseItemStatus(firstItem?.status)

      const stub = await prisma.subscriptionItem.create({
        data: {
          clerkItemId:        targetClerkItemId,
          subscriptionId:     subscriptionDbId,
          status:             stubStatus,
          isDefaultPlan:      false,
          currentPeriodStart: firstItem?.period_start ? new Date(firstItem.period_start) : null,
          currentPeriodEnd:   firstItem?.period_end   ? new Date(firstItem.period_end)   : null,
          lastSyncPayload:    firstItem ?? ({} as Prisma.InputJsonValue),
          ...(stubPlanId && { planId: stubPlanId }),
        },
      })
      subscriptionItemDbId = stub.id
      console.log(`[webhook] Created stub SubscriptionItem ${targetClerkItemId}`)
    }
  }

  await prisma.paymentAttempt.upsert({
    where:  { clerkPaymentAttemptId },
    update: {
      type,
      status,
      amount,
      currency:           currency || 'USD',  // FIX (Bug 3): empty string fallback
      occurredAt:         new Date(created_at),
      payload:            data as Prisma.InputJsonValue,
      subscriptionId:     subscriptionDbId,
      subscriptionItemId: subscriptionItemDbId,
    },
    create: {
      clerkPaymentAttemptId,
      type,
      status,
      amount,
      currency:           currency || 'USD',  // FIX (Bug 3): empty string fallback
      occurredAt:         new Date(created_at),
      payload:            data as Prisma.InputJsonValue,
      subscriptionId:     subscriptionDbId,
      subscriptionItemId: subscriptionItemDbId,
    },
  })
  console.log(`[webhook] PaymentAttempt synced: ${clerkPaymentAttemptId} → ${status}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    console.error('[webhook] CLERK_WEBHOOK_SECRET is not set')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const headerPayload = await headers()
  const svixId        = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body    = JSON.stringify(payload)
  const wh      = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id':        svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  const { type: eventType, data } = evt
  console.log(`[webhook] Received: ${eventType}`)

  try {
    if (eventType === 'user.created' || eventType === 'user.updated') {
      await handleUserCreatedOrUpdated(data as any)
    }

    else if (eventType === 'user.deleted') {
      await handleUserDeleted(data)
    }

    else if (
      eventType === 'subscription.created' ||
      eventType === 'subscription.updated' ||
      eventType === 'subscription.active'  ||
      eventType === 'subscription.pastDue'
    ) {
      await handleSubscriptionEvent(data)
    }

    else if (eventType.startsWith('subscriptionItem.')) {
      await handleSubscriptionItemEvent(eventType, data)
    }

    else if (eventType.startsWith('paymentAttempt.')) {
      await handlePaymentAttemptEvent(data)
    }

    else {
      console.log(`[webhook] Unhandled event type: ${eventType}`)
    }
  } catch (err) {
    console.error(`[webhook] Error processing ${eventType}:`, err)
  }

  return new Response('Webhook processed', { status: 200 })
}