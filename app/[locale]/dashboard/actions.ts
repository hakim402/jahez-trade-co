// app/[locale]/dashboard/actions.tsx

'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { RequestStatus, BookingStatus, QuoteStatus } from '@prisma/client'

// ------------------------------------------------------------------
// Helper – get authenticated client ID
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

// ------------------------------------------------------------------
// Types (exported for client components)
// ------------------------------------------------------------------
export type ClientDashboardStats = {
  user: {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
    isActive: boolean
    createdAt: Date
  }
  subscription: {
    hasActive: boolean
    planName: string | null
    planLimit: number // request limit from plan (0 = no active plan)
    requestCount: number // current number of non‑deleted requests
    remainingRequests: number // limit - requestCount (if limit is finite, otherwise Infinity)
  } | null
  requests: {
    total: number
    byStatus: Record<RequestStatus, number>
    recent: Array<{
      id: string
      productLink: string | null
      description: string | null
      status: RequestStatus
      createdAt: Date
      quoteCount: number
      fileCount: number
    }>
  }
  bookings: {
    total: number
    byStatus: Record<BookingStatus, number>
    recent: Array<{
      id: string
      status: BookingStatus
      scheduledAt: Date | null
      createdAt: Date
      type: string
    }>
  }
  quotes: {
    total: number // quotes on client's requests
    byStatus: Record<QuoteStatus, number>
    recent: Array<{
      id: string
      price: number
      currency: string
      status: QuoteStatus
      createdAt: Date
      request: { id: string; productLink: string | null }
    }>
  }
  files: {
    total: number // files uploaded by client
    recent: Array<{
      id: string
      url: string
      fileName: string | null
      fileType: string
      createdAt: Date
      request: { id: string; productLink: string | null } | null
    }>
  }
  notifications: {
    unreadCount: number
    recent: Array<{
      id: string
      title: string
      message: string
      type: string
      isRead: boolean
      createdAt: Date
      metadata: any
    }>
  }
}

// ------------------------------------------------------------------
// Main metrics action
// ------------------------------------------------------------------
export async function getClientDashboardStats(): Promise<
  { success: true; data: ClientDashboardStats } | { success: false; error: string }
> {
  try {
    const clientId = await requireClient()

    // Run all queries in parallel for maximum performance
    const [
      user,
      subscriptionData,
      totalRequests,
      requestsByStatus,
      recentRequests,
      totalBookings,
      bookingsByStatus,
      recentBookings,
      quotesTotal,
      quotesByStatus,
      recentQuotes,
      filesTotal,
      recentFiles,
      unreadNotifications,
      recentNotifications,
    ] = await Promise.all([
      // User profile
      prisma.user.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
        },
      }),

      // Subscription & plan info
      prisma.user.findUnique({
        where: { id: clientId },
        select: {
          subscription: {
            select: {
              items: {
                where: { status: 'ACTIVE' },
                select: {
                  plan: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),

      // Total requests (non‑deleted)
      prisma.productRequest.count({
        where: { clientId, isDeleted: false },
      }),

      // Requests by status
      prisma.productRequest.groupBy({
        by: ['status'],
        where: { clientId, isDeleted: false },
        _count: true,
      }),

      // Recent 5 requests with counts
      prisma.productRequest.findMany({
        where: { clientId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          productLink: true,
          description: true,
          status: true,
          createdAt: true,
          _count: { select: { quotes: true, files: true } },
        },
      }),

      // Total bookings (non‑deleted)
      prisma.videoBooking.count({
        where: { clientId, isDeleted: false },
      }),

      // Bookings by status
      prisma.videoBooking.groupBy({
        by: ['status'],
        where: { clientId, isDeleted: false },
        _count: true,
      }),

      // Recent 5 bookings
      prisma.videoBooking.findMany({
        where: { clientId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          scheduledAt: true,
          createdAt: true,
          type: true,
        },
      }),

      // Total quotes on client's requests
      prisma.quote.count({
        where: {
          request: { clientId, isDeleted: false },
          isDeleted: false,
        },
      }),

      // Quotes by status
      prisma.quote.groupBy({
        by: ['status'],
        where: {
          request: { clientId, isDeleted: false },
          isDeleted: false,
        },
        _count: true,
      }),

      // Recent 5 quotes
      prisma.quote.findMany({
        where: {
          request: { clientId, isDeleted: false },
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          price: true,
          currency: true,
          status: true,
          createdAt: true,
          request: { select: { id: true, productLink: true } },
        },
      }),

      // Total files uploaded by client
      prisma.file.count({
        where: { uploadedById: clientId },
      }),

      // Recent 5 files uploaded by client
      prisma.file.findMany({
        where: { uploadedById: clientId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          url: true,
          fileName: true,
          fileType: true,
          createdAt: true,
          request: { select: { id: true, productLink: true } },
        },
      }),

      // Unread notifications count
      prisma.notification.count({
        where: { userId: clientId, isRead: false },
      }),

      // Recent 5 notifications
      prisma.notification.findMany({
        where: { userId: clientId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          isRead: true,
          createdAt: true,
          metadata: true,
        },
      }),
    ])

    if (!user) throw new Error('User not found')

    // Process subscription
    let subscriptionInfo = null
    if (subscriptionData?.subscription && subscriptionData.subscription.items.length > 0) {
      const plan = subscriptionData.subscription.items[0].plan
      const planName = plan?.name || 'Unknown'
      // Map plan name to request limit – adjust to your plan names
      const limitMap: Record<string, number> = {
        basic: 3,
        pro: 5,
        vip: Infinity,
      }
      const limit = planName ? limitMap[planName.toLowerCase()] ?? 0 : 0
      const remaining = limit === Infinity ? Infinity : Math.max(0, limit - totalRequests)

      subscriptionInfo = {
        hasActive: true,
        planName,
        planLimit: limit,
        requestCount: totalRequests,
        remainingRequests: remaining,
      }
    } else {
      subscriptionInfo = {
        hasActive: false,
        planName: null,
        planLimit: 0,
        requestCount: totalRequests,
        remainingRequests: 0,
      }
    }

    // Convert groupBy arrays to status → count objects
    const requestStatusMap = requestsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<RequestStatus, number>)

    const bookingStatusMap = bookingsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<BookingStatus, number>)

    const quoteStatusMap = quotesByStatus.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<QuoteStatus, number>)

    // Map recent requests with counts
    const mappedRecentRequests = recentRequests.map((r) => ({
      ...r,
      quoteCount: r._count.quotes,
      fileCount: r._count.files,
      _count: undefined, // remove raw _count
    }))

    // Convert Decimal to number for quotes
    const mappedRecentQuotes = recentQuotes.map((q) => ({
      ...q,
      price: Number(q.price),
    }))

    return {
      success: true,
      data: {
        user,
        subscription: subscriptionInfo,
        requests: {
          total: totalRequests,
          byStatus: requestStatusMap,
          recent: mappedRecentRequests,
        },
        bookings: {
          total: totalBookings,
          byStatus: bookingStatusMap,
          recent: recentBookings,
        },
        quotes: {
          total: quotesTotal,
          byStatus: quoteStatusMap,
          recent: mappedRecentQuotes,
        },
        files: {
          total: filesTotal,
          recent: recentFiles,
        },
        notifications: {
          unreadCount: unreadNotifications,
          recent: recentNotifications,
        },
      },
    }
  } catch (error) {
    console.error('Client dashboard stats error:', error)
    return { success: false, error: 'Failed to fetch dashboard data' }
  }
}



export async function markNotificationAsRead(notificationId: string) {
  try {
    const clientId = await requireClient()

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      return { success: false, error: 'Notification not found' }
    }

    if (notification.userId !== clientId) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })

    return { success: true }
  } catch (error) {
    console.error('Mark notification as read error:', error)
    return { success: false, error: 'Failed to mark notification as read' }
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const clientId = await requireClient()

    await prisma.notification.updateMany({
      where: { userId: clientId, isRead: false },
      data: { isRead: true },
    })

    return { success: true }
  } catch (error) {
    console.error('Mark all notifications as read error:', error)
    return { success: false, error: 'Failed to mark all as read' }
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    const clientId = await requireClient()

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      return { success: false, error: 'Notification not found' }
    }

    if (notification.userId !== clientId) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    })

    return { success: true }
  } catch (error) {
    console.error('Delete notification error:', error)
    return { success: false, error: 'Failed to delete notification' }
  }
}

export async function deleteAllNotifications() {
  try {
    const clientId = await requireClient()

    await prisma.notification.deleteMany({
      where: { userId: clientId },
    })

    return { success: true }
  } catch (error) {
    console.error('Delete all notifications error:', error)
    return { success: false, error: 'Failed to delete all notifications' }
  }
}