'use server'

import { auth }    from '@clerk/nextjs/server'
import { prisma }  from '@/lib/prisma'
import { z }       from 'zod'
import { Prisma }  from '@prisma/client'
import type { ClientNotification, NotificationSummary, PaginationInfo } from './_components/types'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// AUTH HELPER
// ─────────────────────────────────────────────────────────────────────────────

async function requireClient() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await prisma.user.findUnique({
    where:  { clerkId, isDeleted: false, isActive: true },
    select: { id: true, role: true },
  })
  if (!user)                 throw new Error('User not found')
  if (user.role !== 'CLIENT') throw new Error('Forbidden')
  return user.id
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SUMMARY — unread count for the bell badge
// ─────────────────────────────────────────────────────────────────────────────

export async function getNotificationSummary(): Promise<ActionResult<NotificationSummary>> {
  try {
    const userId = await requireClient()
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    })
    return { success: true, data: { unreadCount } }
  } catch (err) {
    return { success: false, error: 'Failed to fetch summary' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LIST — paginated, with type + read filters
// ─────────────────────────────────────────────────────────────────────────────

const listSchema = z.object({
  page:    z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
  types:   z.array(z.string()).optional(),   // filter by type group
  isRead:  z.boolean().optional(),           // undefined = all
})

export type ListNotificationsParams = z.infer<typeof listSchema>

export async function listClientNotifications(
  raw: ListNotificationsParams
): Promise<ActionResult<{ items: ClientNotification[]; pagination: PaginationInfo; unreadCount: number }>> {
  try {
    const userId = await requireClient()
    const { page, pageSize, types, isRead } = listSchema.parse(raw)
    const skip = (page - 1) * pageSize

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(isRead !== undefined  && { isRead }),
      ...(types?.length         && { type: { in: types } }),
    }

    const [items, totalCount, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true, title: true, message: true, type: true,
          isRead: true, createdAt: true, metadata: true,
          bookingId: true, requestId: true, quoteId: true,
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ])

    return {
      success: true,
      data: {
        items: items as ClientNotification[],
        pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
        unreadCount,
      },
    }
  } catch (err) {
    return { success: false, error: 'Failed to fetch notifications' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MARK READ
// ─────────────────────────────────────────────────────────────────────────────

export async function markNotificationsRead(ids: string[]): Promise<ActionResult<{ count: number }>> {
  try {
    const userId = await requireClient()
    if (!ids.length) return { success: false, error: 'No IDs provided' }

    const r = await prisma.notification.updateMany({
      where: { id: { in: ids }, userId },   // scoped to this user only
      data:  { isRead: true },
    })
    return { success: true, data: { count: r.count } }
  } catch {
    return { success: false, error: 'Failed to update' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. MARK ALL READ
// ─────────────────────────────────────────────────────────────────────────────

export async function markAllNotificationsRead(): Promise<ActionResult<{ count: number }>> {
  try {
    const userId = await requireClient()
    const r = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data:  { isRead: true },
    })
    return { success: true, data: { count: r.count } }
  } catch {
    return { success: false, error: 'Failed to mark all read' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. DELETE ONE
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteNotification(id: string): Promise<ActionResult<null>> {
  try {
    const userId = await requireClient()
    // Verify ownership before deleting
    const notification = await prisma.notification.findUnique({ where: { id }, select: { userId: true } })
    if (!notification || notification.userId !== userId) {
      return { success: false, error: 'Not found' }
    }
    await prisma.notification.delete({ where: { id } })
    return { success: true, data: null }
  } catch {
    return { success: false, error: 'Failed to delete' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. DELETE ALL READ
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteAllReadNotifications(): Promise<ActionResult<{ count: number }>> {
  try {
    const userId = await requireClient()
    const r = await prisma.notification.deleteMany({
      where: { userId, isRead: true },
    })
    return { success: true, data: { count: r.count } }
  } catch {
    return { success: false, error: 'Failed to delete read notifications' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. POLL — lightweight count check for real-time badge updates
//    Returns just the new unread count; client compares with previous.
// ─────────────────────────────────────────────────────────────────────────────

export async function pollUnreadCount(): Promise<ActionResult<{ unreadCount: number }>> {
  try {
    const userId = await requireClient()
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    })
    return { success: true, data: { unreadCount } }
  } catch {
    return { success: false, error: 'Failed' }
  }
}