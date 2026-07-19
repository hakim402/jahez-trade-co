'use server'

import { auth }          from '@clerk/nextjs/server'
import { prisma }        from '@/lib/prisma'
import { z }             from 'zod'
import { revalidatePath } from 'next/cache'
import {
  type RequestStatus,
  type BookingStatus,
  type QuoteStatus,
} from '@prisma/client'
import type {
  ClientDashboardStats,
  SubscriptionInfo,
  RecentRequestItem,
  RecentBookingItem,
  RecentQuoteItem,
  UnifiedTask,
} from './_components/types'

// ─────────────────────────────────────────────────────────────────────────────
// RESULT WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// PLAN LIMIT MAPS
// Keep in sync with video-bookings and requests plan maps.
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_REQUEST_LIMITS: Record<string, number> = {
  free:       2,
  starter:    5,
  pro:        15,
  business:   50,
  enterprise: Infinity,
  vip:        Infinity,
}

const PLAN_BOOKING_LIMITS: Record<string, number> = {
  free:       1,
  starter:    2,
  pro:        5,
  business:   10,
  enterprise: Infinity,
  vip:        Infinity,
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH HELPER
// Fetches user + subscription in one query so every action is one round-trip.
// ─────────────────────────────────────────────────────────────────────────────

async function requireClient() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await prisma.user.findUnique({
    where:  { clerkId, isDeleted: false, isActive: true },
    select: {
      id:        true,
      email:     true,
      fullName:  true,
      avatarUrl: true,
      phone:     true,
      role:      true,
      createdAt: true,
      subscription: {
        select: {
          items: {
            where:   { status: 'ACTIVE' },
            orderBy: { isDefaultPlan: 'asc' },
            take:    1,
            select: {
              status:            true,
              currentPeriodEnd:  true,
              trialEndsAt:       true,
              isDefaultPlan:     true,
              plan: {
                select: {
                  name:          true,
                  amount:        true,
                  currency:      true,
                  interval:      true,
                  intervalCount: true,
                  isDefault:     true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user)                  throw new Error('User not found or inactive')
  if (user.role !== 'CLIENT') throw new Error('Forbidden')
  return user
}

type ClientUser = Awaited<ReturnType<typeof requireClient>>

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: build SubscriptionInfo from user + usage counts
// ─────────────────────────────────────────────────────────────────────────────

function buildSubscriptionInfo(
  user:           ClientUser,
  billingEnabled: boolean,
  requestsUsed:   number,
  bookingsUsed:   number,
): SubscriptionInfo {
  const item = user.subscription?.items[0]
  const plan = item?.plan

  if (!billingEnabled) {
    return {
      planName:       'Platform Access',
      planAmount:     0,
      currency:       'USD',
      interval:       null,
      intervalCount:  null,
      isDefaultPlan:  true,
      isTrial:        false,
      trialEndsAt:    null,
      periodEndsAt:   null,
      billingEnabled: false,
      hasAccess:      true,
      requestLimit:   Infinity,
      bookingLimit:   Infinity,
      requestsUsed,
      bookingsUsed,
    }
  }

  if (!plan || !item) {
    return {
      planName:       'No Plan',
      planAmount:     0,
      currency:       'USD',
      interval:       null,
      intervalCount:  null,
      isDefaultPlan:  true,
      isTrial:        false,
      trialEndsAt:    null,
      periodEndsAt:   null,
      billingEnabled: true,
      hasAccess:      false,
      requestLimit:   0,
      bookingLimit:   0,
      requestsUsed,
      bookingsUsed,
    }
  }

  const key    = plan.name.toLowerCase()
  const isTrial = !!(item.trialEndsAt && new Date(item.trialEndsAt) > new Date())

  return {
    planName:       plan.name,
    planAmount:     Number(plan.amount),
    currency:       plan.currency,
    interval:       plan.interval,
    intervalCount:  plan.intervalCount,
    isDefaultPlan:  plan.isDefault,
    isTrial,
    trialEndsAt:    item.trialEndsAt     ?? null,
    periodEndsAt:   item.currentPeriodEnd ?? null,
    billingEnabled: true,
    hasAccess:      item.status === 'ACTIVE',
    requestLimit:   PLAN_REQUEST_LIMITS[key]  ?? (plan.isDefault ? 2 : 0),
    bookingLimit:   PLAN_BOOKING_LIMITS[key]  ?? (plan.isDefault ? 1 : 0),
    requestsUsed,
    bookingsUsed,
  }
}

// Active request statuses (not terminal)
const ACTIVE_REQUEST_STATUSES: RequestStatus[] = [
  'SUBMITTED', 'IN_REVIEW', 'QUOTED', 'APPROVED', 'IN_PRODUCTION',
]

// ─────────────────────────────────────────────────────────────────────────────
// ── 1. getClientDashboardStats ────────────────────────────────────────────────
//    Called by page.tsx — single parallel round-trip for all dashboard data.
// ─────────────────────────────────────────────────────────────────────────────

export async function getClientDashboardStats(): Promise<ActionResult<ClientDashboardStats>> {
  try {
    const user           = await requireClient()
    const billingEnabled = process.env.BILLING_ENABLED === 'true'

    // ── Single parallel batch ──────────────────────────────────────────────
    const [
      requestsByStatus,
      bookingsByStatus,
      quotesByStatus,
      requestsUsed,
      bookingsUsed,
      recentRequestsRaw,
      recentBookingsRaw,
      recentQuotesRaw,
      unreadNotifications,
    ] = await Promise.all([

      // ① Requests grouped by status
      prisma.productRequest.groupBy({
        by:    ['status'],
        where: { clientId: user.id, isDeleted: false },
        _count: { _all: true },
      }),

      // ② Bookings grouped by status
      prisma.videoBooking.groupBy({
        by:    ['status'],
        where: { clientId: user.id, isDeleted: false },
        _count: { _all: true },
      }),

      // ③ Quotes grouped by status
      prisma.quote.groupBy({
        by:    ['status'],
        where: {
          request:   { clientId: user.id, isDeleted: false },
          isDeleted: false,
        },
        _count: { _all: true },
      }),

      // ④ Total request count (for subscription usage bar)
      prisma.productRequest.count({ where: { clientId: user.id, isDeleted: false } }),

      // ⑤ Total booking count (for subscription usage bar)
      prisma.videoBooking.count({ where: { clientId: user.id, isDeleted: false } }),

      // ⑥ Recent requests with latest quote
      prisma.productRequest.findMany({
        where:   { clientId: user.id, isDeleted: false },
        orderBy: { updatedAt: 'desc' },
        take:    5,
        select: {
          id:              true,
          status:          true,
          description:     true,
          productLink:     true,
          quantity:        true,
          shippingCountry: true,
          createdAt:       true,
          updatedAt:       true,
          acceptedQuoteId: true,
          _count: { select: { quotes: { where: { isDeleted: false } } } },
          quotes: {
            where:   { isDeleted: false },
            orderBy: { createdAt: 'desc' },
            take:    1,
            select: { id: true, price: true, currency: true, status: true },
          },
        },
      }),

      // ⑦ Recent bookings
      prisma.videoBooking.findMany({
        where:   { clientId: user.id, isDeleted: false },
        orderBy: { updatedAt: 'desc' },
        take:    5,
        select: {
          id:               true,
          type:             true,
          status:           true,
          scheduledAt:      true,
          durationMinutes:  true,
          meetingLink:      true,
          meetingProvider:  true,
          meetingPassword:  true,
          requestNotes:     true,
          clientConfirmedAt: true,
          createdAt:        true,
        },
      }),

      // ⑧ Recent quotes with parent request
      prisma.quote.findMany({
        where: {
          request:   { clientId: user.id, isDeleted: false },
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
        take:    5,
        select: {
          id:         true,
          status:     true,
          price:      true,
          currency:   true,
          revision:   true,
          validUntil: true,
          adminNotes: true,
          createdAt:  true,
          request: { select: { id: true, description: true, status: true } },
        },
      }),

      // ⑨ Unread notification count
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ])

    // ── Crunch request stats ───────────────────────────────────────────────
    const requestByStatusMap: Record<string, number> = {}
    let totalRequests    = 0
    let activeRequests   = 0
    let completedRequests = 0

    for (const row of requestsByStatus) {
      const label               = row.status.charAt(0) + row.status.slice(1).toLowerCase().replace(/_/g, ' ')
      requestByStatusMap[label] = row._count._all
      totalRequests            += row._count._all
      if (ACTIVE_REQUEST_STATUSES.includes(row.status)) activeRequests    += row._count._all
      if (row.status === 'COMPLETED')                   completedRequests += row._count._all
    }

    // ── Crunch booking stats ───────────────────────────────────────────────
    const bookingByStatusMap: Record<string, number> = {}
    let totalBookings    = 0
    let upcomingBookings = 0
    let completedBookings = 0

    for (const row of bookingsByStatus) {
      const label               = row.status.charAt(0) + row.status.slice(1).toLowerCase().replace(/_/g, ' ')
      bookingByStatusMap[label] = row._count._all
      totalBookings            += row._count._all
      if (['PROPOSED', 'CONFIRMED'].includes(row.status)) upcomingBookings  += row._count._all
      if (row.status === 'COMPLETED')                     completedBookings += row._count._all
    }

    // ── Crunch quote stats ─────────────────────────────────────────────────
    const quoteByStatusMap: Record<string, number> = {}
    let totalQuotes  = 0
    let pendingQuotes = 0

    for (const row of quotesByStatus) {
      const label             = row.status.charAt(0) + row.status.slice(1).toLowerCase()
      quoteByStatusMap[label] = row._count._all
      totalQuotes            += row._count._all
      if (row.status === 'SENT') pendingQuotes += row._count._all
    }

    return {
      success: true,
      data: {
        user: {
          id:          user.id,
          email:       user.email,
          fullName:    user.fullName,
          avatarUrl:   user.avatarUrl,
          phone:       user.phone,
          memberSince: user.createdAt,
        },

        subscription: buildSubscriptionInfo(user, billingEnabled, requestsUsed, bookingsUsed),

        requests: {
          total:     totalRequests,
          active:    activeRequests,
          completed: completedRequests,
          byStatus:  requestByStatusMap,
          recent:    recentRequestsRaw.map((r): RecentRequestItem => ({
            id:               r.id,
            status:           r.status,
            description:      r.description,
            productLink:      r.productLink,
            quantity:         r.quantity,
            shippingCountry:  r.shippingCountry,
            createdAt:        r.createdAt,
            updatedAt:        r.updatedAt,
            quotesCount:      r._count.quotes,
            hasAcceptedQuote: !!r.acceptedQuoteId,
            latestQuote: r.quotes[0]
              ? { id: r.quotes[0].id, price: r.quotes[0].price.toString(), currency: r.quotes[0].currency, status: r.quotes[0].status }
              : null,
          })),
        },

        bookings: {
          total:     totalBookings,
          upcoming:  upcomingBookings,
          completed: completedBookings,
          byStatus:  bookingByStatusMap,
          recent:    recentBookingsRaw.map((b): RecentBookingItem => ({
            id:               b.id,
            type:             b.type,
            status:           b.status,
            scheduledAt:      b.scheduledAt,
            durationMinutes:  b.durationMinutes,
            meetingLink:      b.meetingLink,
            meetingProvider:  b.meetingProvider,
            meetingPassword:  b.meetingPassword,
            requestNotes:     b.requestNotes,
            clientConfirmedAt: b.clientConfirmedAt,
            createdAt:        b.createdAt,
          })),
        },

        quotes: {
          total:    totalQuotes,
          pending:  pendingQuotes,
          byStatus: quoteByStatusMap,
          recent:   recentQuotesRaw.map((q): RecentQuoteItem => ({
            id:         q.id,
            status:     q.status,
            price:      q.price.toString(),
            currency:   q.currency,
            revision:   q.revision,
            validUntil: q.validUntil,
            adminNotes: q.adminNotes,
            createdAt:  q.createdAt,
            request: {
              id:          q.request.id,
              description: q.request.description,
              status:      q.request.status,
            },
          })),
        },

        notifications: {
          unreadCount: unreadNotifications,
        },
      },
    }
  } catch (err) {
    console.error('[getClientDashboardStats]', err)
    return { success: false, error: 'Failed to load dashboard' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ── 2. refreshDashboardKpi ────────────────────────────────────────────────────
//    Lightweight poll — 4 queries. Call from useEffect interval in ClientDashboard.
// ─────────────────────────────────────────────────────────────────────────────

export type DashboardKpiSnapshot = {
  activeRequests:      number
  pendingQuotes:       number
  upcomingBookings:    number
  unreadNotifications: number
}

export async function refreshDashboardKpi(): Promise<ActionResult<DashboardKpiSnapshot>> {
  try {
    const user = await requireClient()

    const [requestKpi, bookingKpi, pendingQuotes, unreadNotifications] = await Promise.all([
      prisma.productRequest.groupBy({
        by:    ['status'],
        where: { clientId: user.id, isDeleted: false },
        _count: { _all: true },
      }),
      prisma.videoBooking.groupBy({
        by:    ['status'],
        where: { clientId: user.id, isDeleted: false },
        _count: { _all: true },
      }),
      prisma.quote.count({
        where: { request: { clientId: user.id, isDeleted: false }, status: 'SENT', isDeleted: false },
      }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ])

    let activeRequests  = 0
    let upcomingBookings = 0
    for (const r of requestKpi) {
      if (ACTIVE_REQUEST_STATUSES.includes(r.status)) activeRequests += r._count._all
    }
    for (const b of bookingKpi) {
      if (['PROPOSED', 'CONFIRMED'].includes(b.status)) upcomingBookings += b._count._all
    }

    return {
      success: true,
      data: { activeRequests, pendingQuotes, upcomingBookings, unreadNotifications },
    }
  } catch (err) {
    console.error('[refreshDashboardKpi]', err)
    return { success: false, error: 'Failed to refresh' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ── 3. updateUserProfile ──────────────────────────────────────────────────────
//    Editable fields: fullName, phone, avatarUrl. Revalidates dashboard.
// ─────────────────────────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  fullName:  z.string().min(1, 'Name is required').max(100).optional(),
  phone:     z.string().max(30).optional().or(z.literal('')),
  avatarUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export async function updateUserProfile(
  input: UpdateProfileInput,
): Promise<ActionResult<{ fullName: string | null; phone: string | null; avatarUrl: string | null }>> {
  try {
    const user      = await requireClient()
    const validated = updateProfileSchema.parse(input)

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(validated.fullName  !== undefined && { fullName:  validated.fullName  || null }),
        ...(validated.phone     !== undefined && { phone:     validated.phone     || null }),
        ...(validated.avatarUrl !== undefined && { avatarUrl: validated.avatarUrl || null }),
      },
      select: { fullName: true, phone: true, avatarUrl: true },
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard/settings')

    return { success: true, data: updated }
  } catch (err) {
    console.error('[updateUserProfile]', err)
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    return { success: false, error: 'Failed to update profile' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ── 4. getPendingActions ──────────────────────────────────────────────────────
//    Items requiring client action now. For the urgent banner.
// ─────────────────────────────────────────────────────────────────────────────

export type PendingAction = {
  type:     'CONFIRM_BOOKING' | 'REVIEW_QUOTE' | 'EXPIRING_QUOTE'
  title:    string
  body:     string
  urgency:  'high' | 'medium' | 'low'
  // Routing
  bookingId: string | null
  requestId: string | null
  quoteId:   string | null
}

export async function getPendingActions(): Promise<ActionResult<PendingAction[]>> {
  try {
    const user = await requireClient()
    const now  = new Date()

    const [proposedBookings, sentQuotes] = await Promise.all([
      prisma.videoBooking.findMany({
        where:  { clientId: user.id, isDeleted: false, status: 'PROPOSED' },
        select: { id: true, type: true, scheduledAt: true, durationMinutes: true },
      }),
      prisma.quote.findMany({
        where: {
          request:   { clientId: user.id, isDeleted: false },
          status:    'SENT',
          isDeleted: false,
        },
        orderBy: { validUntil: 'asc' },
        select: {
          id: true, price: true, currency: true, validUntil: true,
          request: { select: { id: true, description: true } },
        },
      }),
    ])

    const actions: PendingAction[] = []

    for (const b of proposedBookings) {
      const hoursUntil = b.scheduledAt
        ? (new Date(b.scheduledAt).getTime() - now.getTime()) / 3_600_000
        : null

      actions.push({
        type:      'CONFIRM_BOOKING',
        title:     `Confirm your ${b.type.toLowerCase().replace(/_/g, ' ')} call`,
        body:      b.scheduledAt
          ? `Scheduled for ${new Date(b.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
          : 'Time to be confirmed — please respond to accept.',
        urgency:   hoursUntil !== null && hoursUntil < 24 ? 'high' : 'medium',
        bookingId: b.id,
        requestId: null,
        quoteId:   null,
      })
    }

    for (const q of sentQuotes) {
      const daysLeft = q.validUntil
        ? (new Date(q.validUntil).getTime() - now.getTime()) / 86_400_000
        : null

      if (daysLeft !== null && daysLeft < 0) continue  // already expired

      const isExpiring = daysLeft !== null && daysLeft <= 3

      actions.push({
        type:      isExpiring ? 'EXPIRING_QUOTE' : 'REVIEW_QUOTE',
        title:     `Quote for "${q.request.description?.slice(0, 40) ?? 'your request'}"`,
        body:      isExpiring
          ? `Expires in ${Math.ceil(daysLeft!)} day${Math.ceil(daysLeft!) !== 1 ? 's' : ''} — ${Number(q.price).toLocaleString('en-US', { style: 'currency', currency: q.currency })}`
          : `${Number(q.price).toLocaleString('en-US', { style: 'currency', currency: q.currency })} — waiting for your response`,
        urgency:   isExpiring ? 'high' : 'low',
        bookingId: null,
        requestId: q.request.id,
        quoteId:   q.id,
      })
    }

    const urgencyRank = { high: 0, medium: 1, low: 2 }
    actions.sort((a, b) => urgencyRank[a.urgency] - urgencyRank[b.urgency])

    return { success: true, data: actions }
  } catch (err) {
    console.error('[getPendingActions]', err)
    return { success: false, error: 'Failed to load pending actions' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ── 5. searchDashboard ────────────────────────────────────────────────────────
//    Global search: requests + bookings + notifications in parallel.
// ─────────────────────────────────────────────────────────────────────────────

const searchSchema = z.object({
  query: z.string().min(1).max(200).trim(),
  take:  z.number().int().min(1).max(20).default(8),
})

export type SearchResultItem = {
  type:        'REQUEST' | 'BOOKING' | 'NOTIFICATION'
  id:          string
  title:       string
  description: string
  status:      string
  createdAt:   Date
  route:       string
}

export async function searchDashboard(
  raw: z.infer<typeof searchSchema>,
): Promise<ActionResult<SearchResultItem[]>> {
  try {
    const user = await requireClient()
    const { query, take } = searchSchema.parse(raw)

    const [requests, bookings, notifications] = await Promise.all([
      prisma.productRequest.findMany({
        where: {
          clientId:  user.id,
          isDeleted: false,
          OR: [
            { description:     { contains: query, mode: 'insensitive' } },
            { productLink:     { contains: query, mode: 'insensitive' } },
            { customNotes:     { contains: query, mode: 'insensitive' } },
            { shippingCountry: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take,
        select: { id: true, description: true, status: true, createdAt: true },
      }),

      prisma.videoBooking.findMany({
        where: {
          clientId:     user.id,
          isDeleted:    false,
          requestNotes: { contains: query, mode: 'insensitive' },
        },
        orderBy: { updatedAt: 'desc' },
        take,
        select: { id: true, type: true, status: true, createdAt: true, requestNotes: true },
      }),

      prisma.notification.findMany({
        where: {
          userId: user.id,
          OR: [
            { title:   { contains: query, mode: 'insensitive' } },
            { message: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take,
        select: { id: true, title: true, message: true, type: true, createdAt: true },
      }),
    ])

    const results: SearchResultItem[] = [
      ...requests.map((r): SearchResultItem => ({
        type:        'REQUEST',
        id:          r.id,
        title:       r.description?.slice(0, 60) ?? 'Product Request',
        description: `Status: ${r.status.toLowerCase().replace(/_/g, ' ')}`,
        status:      r.status,
        createdAt:   r.createdAt,
        route:       '/dashboard/requests',
      })),
      ...bookings.map((b): SearchResultItem => ({
        type:        'BOOKING',
        id:          b.id,
        title:       `${b.type.charAt(0) + b.type.slice(1).toLowerCase()} Video Call`,
        description: b.requestNotes?.slice(0, 80) ?? `Status: ${b.status.toLowerCase()}`,
        status:      b.status,
        createdAt:   b.createdAt,
        route:       '/dashboard/video-bookings',
      })),
      ...notifications.map((n): SearchResultItem => ({
        type:        'NOTIFICATION',
        id:          n.id,
        title:       n.title,
        description: n.message.slice(0, 80),
        status:      n.type,
        createdAt:   n.createdAt,
        route:       '/dashboard/notifications',
      })),
    ]

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return { success: true, data: results.slice(0, take) }
  } catch (err) {
    console.error('[searchDashboard]', err)
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    return { success: false, error: 'Search failed' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ── 6. getUnifiedClientTasks ──────────────────────────────────────────────────
//    Merges recent items from ALL categories into a single sorted feed.
// ─────────────────────────────────────────────────────────────────────────────

export async function getUnifiedClientTasks(): Promise<ActionResult<UnifiedTask[]>> {
  try {
    const user = await requireClient()

    const [requests, bookings, consulting, shipments] = await Promise.all([
      prisma.productRequest.findMany({
        where:   { clientId: user.id, isDeleted: false },
        orderBy: { updatedAt: 'desc' },
        take:    5,
        select: {
          id: true, status: true, description: true, quantity: true,
          shippingCountry: true, createdAt: true, updatedAt: true,
          quotes: { where: { isDeleted: false }, orderBy: { createdAt: 'desc' }, take: 1,
            select: { price: true, currency: true, status: true } },
        },
      }),

      prisma.videoBooking.findMany({
        where:   { clientId: user.id, isDeleted: false },
        orderBy: { updatedAt: 'desc' },
        take:    5,
        select: {
          id: true, type: true, status: true, scheduledAt: true,
          requestNotes: true, meetingLink: true, createdAt: true, updatedAt: true,
        },
      }),

      prisma.consultingRequest.findMany({
        where:   { userId: user.id, isDeleted: false },
        orderBy: { updatedAt: 'desc' },
        take:    5,
        select: {
          id: true, topic: true, status: true, description: true,
          createdAt: true, updatedAt: true,
        },
      }),

      prisma.shipment.findMany({
        where:   { clientId: user.id, isDeleted: false },
        orderBy: { updatedAt: 'desc' },
        take:    5,
        select: {
          id: true, trackingCode: true, status: true,
          productDescription: true, destinationCountry: true,
          createdAt: true, updatedAt: true,
        },
      }),
    ])

    const unified: UnifiedTask[] = [
      ...requests.map((r): UnifiedTask => ({
        id:          r.id,
        type:        'REQUEST',
        title:       r.description?.slice(0, 60) ?? 'Product Request',
        description: `Quantity: ${r.quantity ?? 1} | ${r.shippingCountry || 'N/A'}`,
        status:      r.status,
        createdAt:   r.createdAt,
        updatedAt:   r.updatedAt,
        route:       '/dashboard/requests',
        meta: {
          price: r.quotes[0]?.price?.toString(),
          currency: r.quotes[0]?.currency,
          quantity: r.quantity,
          shippingCountry: r.shippingCountry,
        },
      })),

      ...bookings.map((b): UnifiedTask => ({
        id:          b.id,
        type:        'BOOKING',
        title:       `${b.type.charAt(0) + b.type.slice(1).toLowerCase().replace(/_/g, ' ')} Video Call`,
        description: b.requestNotes?.slice(0, 60) ?? (b.scheduledAt ? `Scheduled: ${new Date(b.scheduledAt).toLocaleDateString()}` : 'Pending schedule'),
        status:      b.status,
        createdAt:   b.createdAt,
        updatedAt:   b.updatedAt,
        route:       '/dashboard/video-bookings',
        meta: {
          scheduledAt: b.scheduledAt,
          meetingLink: b.meetingLink,
        },
      })),

      ...consulting.map((c): UnifiedTask => ({
        id:          c.id,
        type:        'CONSULTING',
        title:       c.topic,
        description: c.description?.slice(0, 60) ?? '',
        status:      c.status,
        createdAt:   c.createdAt,
        updatedAt:   c.updatedAt,
        route:       '/dashboard/consulting',
      })),

      ...shipments.map((s): UnifiedTask => ({
        id:          s.id,
        type:        'SHIPMENT',
        title:       s.productDescription.slice(0, 60),
        description: `Tracking: ${s.trackingCode} | ${s.destinationCountry}`,
        status:      s.status,
        createdAt:   s.createdAt,
        updatedAt:   s.updatedAt,
        route:       '/dashboard/shipments',
        meta: {
          trackingCode: s.trackingCode,
          shippingCountry: s.destinationCountry,
        },
      })),
    ]

    // Sort by updatedAt desc, limit to 15
    unified.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

    return { success: true, data: unified.slice(0, 15) }
  } catch (err) {
    console.error('[getUnifiedClientTasks]', err)
    return { success: false, error: 'Failed to load unified tasks' }
  }
}