'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

export async function getAdminBadgeCounts() {
  try {
    const adminId = await requireAdmin()

    const [
      productRequestsNew,
      videoBookingsNew,
      consultingRequestsNew,
      supportUnread,
      notificationsUnread,
    ] = await Promise.all([
      // 1. Product requests – new (status = SUBMITTED)
      prisma.productRequest.count({
        where: { isDeleted: false, status: 'SUBMITTED' },
      }),

      // 2. Video bookings – new (status = REQUESTED)
      prisma.videoBooking.count({
        where: { isDeleted: false, status: 'REQUESTED' },
      }),

      // 3. Consulting requests – new (status = NEW)
      prisma.consultingRequest.count({
        where: { isDeleted: false, status: 'NEW' },
      }),

      // 4. Support – active sessions where the last message is from the user (unread)
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count
        FROM (
          SELECT DISTINCT ON (s.id) s.id, m.role
          FROM "ChatSession" s
          JOIN "ChatMessage" m ON m."sessionId" = s.id
          WHERE s."endedAt" IS NULL
          ORDER BY s.id, m."createdAt" DESC
        ) last_messages
        WHERE role = 'user'
      `.then(res => Number(res[0]?.count || 0)),

      // 5. Notifications – unread for this admin
      prisma.notification.count({
        where: { userId: adminId, isRead: false },
      }),
    ])

    return {
      productRequests:   productRequestsNew,
      videoBookings:     videoBookingsNew,
      consultingRequests: consultingRequestsNew,
      support:           supportUnread,
      notifications:     notificationsUnread,
      // audit logs – not needed for now
      audit:             0,
    }
  } catch (error) {
    console.error('Failed to fetch badge counts:', error)
    return { productRequests: 0, videoBookings: 0, consultingRequests: 0, support: 0, notifications: 0, audit: 0 }
  }
}