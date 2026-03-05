// app/[locale]/admin/actions.ts

'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import {
  RequestStatus,
  BookingStatus,
  QuoteStatus,
  SubscriptionItemStatus,
  PaymentAttemptStatus,
  UserRole,
  BookingType,
  MeetingProvider,
} from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

function todayStart(): Date {
  return new Date(new Date().setHours(0, 0, 0, 0))
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type DashboardStats = {
  users: {
    total: number
    active: number
    newToday: number
    newThisWeek: number
    byRole: Record<UserRole, number>
  }

  requests: {
    total: number
    byStatus: Partial<Record<RequestStatus, number>>
    newToday: number
    recent: Array<{
      id: string
      productLink: string | null
      status: RequestStatus
      priority: number
      quantity: number
      shippingCountry: string
      createdAt: Date
      client: { fullName: string | null; email: string }
    }>
  }

  bookings: {
    total: number
    byStatus: Partial<Record<BookingStatus, number>>
    byType: Partial<Record<BookingType, number>>
    upcoming: Array<{
      id: string
      status: BookingStatus
      type: BookingType
      scheduledAt: Date | null
      durationMinutes: number
      meetingProvider: MeetingProvider | null
      createdAt: Date
      client: { fullName: string | null; email: string }
      handledBy: { fullName: string | null; email: string } | null
    }>
  }

  quotes: {
    total: number
    byStatus: Partial<Record<QuoteStatus, number>>
    totalValue: number      // sum of accepted quote prices
    pendingValue: number    // sum of SENT/DRAFT quote prices
  }

  subscriptions: {
    total: number
    byStatus: Partial<Record<SubscriptionItemStatus, number>>
    mrr: number             // sum of active monthly plan amounts
  }

  payments: {
    totalAttempts: number
    byStatus: Partial<Record<PaymentAttemptStatus, number>>
    totalRevenue: number    // sum of PAID amounts
    revenueToday: number
    revenueThisWeek: number
  }

  notifications: {
    total: number
    unread: number
    sentToday: number
  }

  chats: {
    totalSessions: number
    activeSessions: number  // no endedAt
    totalMessages: number
  }
}

export type RecentActivity = Array<{
  id: string
  action: string
  entity: string
  entityId: string | null
  changes: unknown
  createdAt: Date
  admin: { fullName: string | null; email: string }
}>

export type NotificationSummary = Array<{
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date
  user: { fullName: string | null; email: string }
  bookingId: string | null
  requestId: string | null
  quoteId: string | null
}>

export type UserOverview = Array<{
  id: string
  email: string
  fullName: string | null
  role: UserRole
  isActive: boolean
  createdAt: Date
  _count: {
    requests: number
    clientBookings: number
  }
  subscription: {
    items: Array<{
      status: SubscriptionItemStatus
      plan: { name: string; amount: unknown } | null
    }>
  } | null
}>

export type PendingWorkload = {
  requestsPendingReview: number
  quotesAwaitingApproval: number
  bookingsPendingConfirmation: number
  bookingsProposed: number
}

export type RevenueBreakdown = Array<{
  date: string          // ISO date string YYYY-MM-DD
  revenue: number
  attempts: number
}>

// ─────────────────────────────────────────────────────────────────────────────
// 1. DASHBOARD STATISTICS
// ─────────────────────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<ActionResult<DashboardStats>> {
  try {
    await requireAdmin()

    const [
      // ── Users ──────────────────────────────────────────────────────────────
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      usersByRole,

      // ── Product Requests ───────────────────────────────────────────────────
      totalRequests,
      requestsByStatus,
      newRequestsToday,
      recentRequests,

      // ── Video Bookings ─────────────────────────────────────────────────────
      totalBookings,
      bookingsByStatus,
      bookingsByType,
      upcomingBookings,

      // ── Quotes ─────────────────────────────────────────────────────────────
      totalQuotes,
      quotesByStatus,
      acceptedQuotesValue,
      pendingQuotesValue,

      // ── Subscriptions ──────────────────────────────────────────────────────
      totalSubscriptions,
      subscriptionItemsByStatus,
      mrrResult,

      // ── Payments ───────────────────────────────────────────────────────────
      totalPaymentAttempts,
      paymentsByStatus,
      totalRevenueResult,
      revenueTodayResult,
      revenueThisWeekResult,

      // ── Notifications ──────────────────────────────────────────────────────
      totalNotifications,
      unreadNotifications,
      notificationsSentToday,

      // ── Chats ──────────────────────────────────────────────────────────────
      totalChatSessions,
      activeChatSessions,
      totalChatMessages,
    ] = await Promise.all([
      // ── Users ──────────────────────────────────────────────────────────────
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { isDeleted: false, isActive: true } }),
      prisma.user.count({ where: { isDeleted: false, createdAt: { gte: todayStart() } } }),
      prisma.user.count({ where: { isDeleted: false, createdAt: { gte: daysAgo(7) } } }),
      prisma.user.groupBy({ by: ['role'], where: { isDeleted: false }, _count: true }),

      // ── Product Requests ───────────────────────────────────────────────────
      prisma.productRequest.count({ where: { isDeleted: false } }),
      prisma.productRequest.groupBy({ by: ['status'], where: { isDeleted: false }, _count: true }),
      prisma.productRequest.count({ where: { isDeleted: false, createdAt: { gte: todayStart() } } }),
      prisma.productRequest.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          productLink: true,
          status: true,
          priority: true,
          quantity: true,
          shippingCountry: true,
          createdAt: true,
          client: { select: { fullName: true, email: true } },
        },
      }),

      // ── Video Bookings ─────────────────────────────────────────────────────
      prisma.videoBooking.count({ where: { isDeleted: false } }),
      prisma.videoBooking.groupBy({ by: ['status'], where: { isDeleted: false }, _count: true }),
      prisma.videoBooking.groupBy({ by: ['type'], where: { isDeleted: false }, _count: true }),
      prisma.videoBooking.findMany({
        where: {
          isDeleted: false,
          scheduledAt: { gte: new Date() },
          status: { notIn: ['CANCELED', 'COMPLETED', 'NO_SHOW', 'REJECTED'] },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
        select: {
          id: true,
          status: true,
          type: true,
          scheduledAt: true,
          durationMinutes: true,
          meetingProvider: true,
          createdAt: true,
          client: { select: { fullName: true, email: true } },
          handledBy: { select: { fullName: true, email: true } },
        },
      }),

      // ── Quotes ─────────────────────────────────────────────────────────────
      prisma.quote.count({ where: { isDeleted: false } }),
      prisma.quote.groupBy({ by: ['status'], where: { isDeleted: false }, _count: true }),
      prisma.quote.aggregate({
        where: { isDeleted: false, status: 'ACCEPTED' },
        _sum: { price: true },
      }),
      prisma.quote.aggregate({
        where: { isDeleted: false, status: { in: ['DRAFT', 'SENT'] } },
        _sum: { price: true },
      }),

      // ── Subscriptions ──────────────────────────────────────────────────────
      prisma.subscription.count(),
      prisma.subscriptionItem.groupBy({ by: ['status'], _count: true }),
      // MRR: sum of active monthly plan amounts
      prisma.subscriptionItem.findMany({
        where: { status: 'ACTIVE' },
        select: { plan: { select: { amount: true, interval: true } } },
      }),

      // ── Payments ───────────────────────────────────────────────────────────
      prisma.paymentAttempt.count(),
      prisma.paymentAttempt.groupBy({ by: ['status'], _count: true }),
      prisma.paymentAttempt.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      prisma.paymentAttempt.aggregate({
        where: { status: 'PAID', occurredAt: { gte: todayStart() } },
        _sum: { amount: true },
      }),
      prisma.paymentAttempt.aggregate({
        where: { status: 'PAID', occurredAt: { gte: daysAgo(7) } },
        _sum: { amount: true },
      }),

      // ── Notifications ──────────────────────────────────────────────────────
      prisma.notification.count(),
      prisma.notification.count({ where: { isRead: false } }),
      prisma.notification.count({ where: { createdAt: { gte: todayStart() } } }),

      // ── Chats ──────────────────────────────────────────────────────────────
      prisma.chatSession.count(),
      prisma.chatSession.count({ where: { endedAt: null } }),
      prisma.chatMessage.count(),
    ])

    // ── Reduce groupBy arrays → maps ────────────────────────────────────────
    const toMap = <K extends string>(arr: Array<{ [key: string]: unknown; _count: number }>, key: string) =>
      arr.reduce((acc, item) => {
        acc[item[key] as K] = item._count
        return acc
      }, {} as Partial<Record<K, number>>)

    // ── MRR calculation (only monthly plans) ────────────────────────────────
    const mrr = mrrResult.reduce((sum, item) => {
      if (!item.plan) return sum
      const amount = Number(item.plan.amount)
      const interval = item.plan.interval
      if (interval === 'month') return sum + amount
      if (interval === 'year') return sum + amount / 12
      return sum
    }, 0)

    return {
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newToday: newUsersToday,
          newThisWeek: newUsersThisWeek,
          byRole: toMap<UserRole>(usersByRole.map(r => ({ role: r.role, _count: r._count })), 'role') as Record<UserRole, number>,
        },
        requests: {
          total: totalRequests,
          byStatus: toMap<RequestStatus>(requestsByStatus.map(r => ({ status: r.status, _count: r._count })), 'status'),
          newToday: newRequestsToday,
          recent: recentRequests,
        },
        bookings: {
          total: totalBookings,
          byStatus: toMap<BookingStatus>(bookingsByStatus.map(r => ({ status: r.status, _count: r._count })), 'status'),
          byType: toMap<BookingType>(bookingsByType.map(r => ({ type: r.type, _count: r._count })), 'type'),
          upcoming: upcomingBookings,
        },
        quotes: {
          total: totalQuotes,
          byStatus: toMap<QuoteStatus>(quotesByStatus.map(r => ({ status: r.status, _count: r._count })), 'status'),
          totalValue: Number(acceptedQuotesValue._sum.price ?? 0),
          pendingValue: Number(pendingQuotesValue._sum.price ?? 0),
        },
        subscriptions: {
          total: totalSubscriptions,
          byStatus: toMap<SubscriptionItemStatus>(
            subscriptionItemsByStatus.map(r => ({ status: r.status, _count: r._count })), 'status'
          ),
          mrr: Math.round(mrr * 100) / 100,
        },
        payments: {
          totalAttempts: totalPaymentAttempts,
          byStatus: toMap<PaymentAttemptStatus>(
            paymentsByStatus.map(r => ({ status: r.status, _count: r._count })), 'status'
          ),
          totalRevenue: Number(totalRevenueResult._sum.amount ?? 0),
          revenueToday: Number(revenueTodayResult._sum.amount ?? 0),
          revenueThisWeek: Number(revenueThisWeekResult._sum.amount ?? 0),
        },
        notifications: {
          total: totalNotifications,
          unread: unreadNotifications,
          sentToday: notificationsSentToday,
        },
        chats: {
          totalSessions: totalChatSessions,
          activeSessions: activeChatSessions,
          totalMessages: totalChatMessages,
        },
      },
    }
  } catch (error) {
    console.error('[getDashboardStats]', error)
    return { success: false, error: 'Failed to fetch dashboard statistics' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PENDING WORKLOAD (action items for the admin)
// ─────────────────────────────────────────────────────────────────────────────

export async function getPendingWorkload(): Promise<ActionResult<PendingWorkload>> {
  try {
    await requireAdmin()

    const [
      requestsPendingReview,
      quotesAwaitingApproval,
      bookingsPendingConfirmation,
      bookingsProposed,
    ] = await Promise.all([
      prisma.productRequest.count({ where: { isDeleted: false, status: 'IN_REVIEW' } }),
      prisma.quote.count({ where: { isDeleted: false, status: 'SENT' } }),
      prisma.videoBooking.count({ where: { isDeleted: false, status: 'REQUESTED' } }),
      prisma.videoBooking.count({ where: { isDeleted: false, status: 'PROPOSED' } }),
    ])

    return {
      success: true,
      data: {
        requestsPendingReview,
        quotesAwaitingApproval,
        bookingsPendingConfirmation,
        bookingsProposed,
      },
    }
  } catch (error) {
    console.error('[getPendingWorkload]', error)
    return { success: false, error: 'Failed to fetch pending workload' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RECENT ACTIVITY (Audit Logs)
// ─────────────────────────────────────────────────────────────────────────────

export async function getRecentActivity(limit = 10): Promise<ActionResult<RecentActivity>> {
  try {
    await requireAdmin()

    const logs = await prisma.auditLog.findMany({
      take: Math.min(limit, 100), // cap at 100 for safety
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        changes: true,
        createdAt: true,
        admin: { select: { fullName: true, email: true } },
      },
    })

    return { success: true, data: logs }
  } catch (error) {
    console.error('[getRecentActivity]', error)
    return { success: false, error: 'Failed to fetch recent activity' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. NOTIFICATIONS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function getNotifications(options?: {
  limit?: number
  unreadOnly?: boolean
  userId?: string
  type?: string
}): Promise<ActionResult<NotificationSummary>> {
  try {
    await requireAdmin()

    const { limit = 20, unreadOnly = false, userId, type } = options ?? {}

    const notifications = await prisma.notification.findMany({
      where: {
        ...(unreadOnly && { isRead: false }),
        ...(userId && { userId }),
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        createdAt: true,
        bookingId: true,
        requestId: true,
        quoteId: true,
        user: { select: { fullName: true, email: true } },
      },
    })

    return { success: true, data: notifications }
  } catch (error) {
    console.error('[getNotifications]', error)
    return { success: false, error: 'Failed to fetch notifications' }
  }
}

export async function markNotificationsRead(
  notificationIds: string[]
): Promise<ActionResult<{ updatedCount: number }>> {
  try {
    await requireAdmin()

    if (!notificationIds.length) {
      return { success: false, error: 'No notification IDs provided' }
    }

    const result = await prisma.notification.updateMany({
      where: { id: { in: notificationIds } },
      data: { isRead: true },
    })

    return { success: true, data: { updatedCount: result.count } }
  } catch (error) {
    console.error('[markNotificationsRead]', error)
    return { success: false, error: 'Failed to mark notifications as read' }
  }
}

export async function broadcastNotification(payload: {
  title: string
  message: string
  type: string
  metadata?: Record<string, unknown>
  userIds?: string[]          // if omitted → send to all active users
}): Promise<ActionResult<{ sentCount: number }>> {
  try {
    await requireAdmin()

    const { title, message, type, metadata, userIds } = payload

    const targets = userIds?.length
      ? userIds
      : (await prisma.user.findMany({
          where: { isDeleted: false, isActive: true },
          select: { id: true },
        })).map(u => u.id)

    if (!targets.length) {
      return { success: false, error: 'No target users found' }
    }

    const result = await prisma.notification.createMany({
      data: targets.map(userId => ({
        userId,
        title,
        message,
        type,
        metadata: metadata ?? {},
      })),
    })

    return { success: true, data: { sentCount: result.count } }
  } catch (error) {
    console.error('[broadcastNotification]', error)
    return { success: false, error: 'Failed to broadcast notification' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. USER OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserOverview(options?: {
  limit?: number
  role?: UserRole
  isActive?: boolean
  search?: string
}): Promise<ActionResult<UserOverview>> {
  try {
    await requireAdmin()

    const { limit = 20, role, isActive, search } = options ?? {}

    const users = await prisma.user.findMany({
      where: {
        isDeleted: false,
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            requests: true,
            clientBookings: true,
          },
        },
        subscription: {
          select: {
            items: {
              select: {
                status: true,
                plan: { select: { name: true, amount: true } },
              },
            },
          },
        },
      },
    })

    return { success: true, data: users }
  } catch (error) {
    console.error('[getUserOverview]', error)
    return { success: false, error: 'Failed to fetch user overview' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. REVENUE BREAKDOWN (last N days, one row per day)
// ─────────────────────────────────────────────────────────────────────────────

export async function getRevenueBreakdown(
  days = 30
): Promise<ActionResult<RevenueBreakdown>> {
  try {
    await requireAdmin()

    const since = daysAgo(days)

    const payments = await prisma.paymentAttempt.findMany({
      where: { status: 'PAID', occurredAt: { gte: since } },
      select: { amount: true, occurredAt: true },
      orderBy: { occurredAt: 'asc' },
    })

    // Aggregate by calendar day
    const byDay = payments.reduce<Record<string, { revenue: number; attempts: number }>>(
      (acc, p) => {
        const day = p.occurredAt.toISOString().slice(0, 10)
        if (!acc[day]) acc[day] = { revenue: 0, attempts: 0 }
        acc[day].revenue += Number(p.amount ?? 0)
        acc[day].attempts += 1
        return acc
      },
      {}
    )

    // Fill missing days with zeros so charts have a continuous series
    const result: RevenueBreakdown = []
    for (let i = days; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      result.push({
        date: key,
        revenue: Math.round((byDay[key]?.revenue ?? 0) * 100) / 100,
        attempts: byDay[key]?.attempts ?? 0,
      })
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('[getRevenueBreakdown]', error)
    return { success: false, error: 'Failed to fetch revenue breakdown' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. AUDIT LOG SEARCH
// ─────────────────────────────────────────────────────────────────────────────

export async function searchAuditLogs(options?: {
  adminId?: string
  entity?: string
  entityId?: string
  action?: string
  from?: Date
  to?: Date
  limit?: number
}): Promise<ActionResult<RecentActivity>> {
  try {
    await requireAdmin()

    const { adminId, entity, entityId, action, from, to, limit = 50 } = options ?? {}

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(adminId && { adminId }),
        ...(entity && { entity }),
        ...(entityId && { entityId }),
        ...(action && { action: { contains: action, mode: 'insensitive' } }),
        ...((from || to) && {
          createdAt: {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        changes: true,
        createdAt: true,
        admin: { select: { fullName: true, email: true } },
      },
    })

    return { success: true, data: logs }
  } catch (error) {
    console.error('[searchAuditLogs]', error)
    return { success: false, error: 'Failed to search audit logs' }
  }
}