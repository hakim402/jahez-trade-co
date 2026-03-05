'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationItem = {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date
  metadata: unknown
  bookingId: string | null
  requestId: string | null
  quoteId: string | null
  user: { id: string; fullName: string | null; email: string; avatarUrl: string | null }
}

export type NotificationStats = {
  total: number
  unread: number
  byType: Record<string, number>
  sentToday: number
  sentThisWeek: number
}

export type UserOption = { id: string; fullName: string | null; email: string }

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function todayStart() {
  return new Date(new Date().setHours(0, 0, 0, 0))
}
function weekStart() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  d.setHours(0, 0, 0, 0)
  return d
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. STATS (header KPI cards)
// ─────────────────────────────────────────────────────────────────────────────

export async function getNotificationStats(): Promise<ActionResult<NotificationStats>> {
  try {
    await requireAdmin()

    const [total, unread, byTypeRaw, sentToday, sentThisWeek] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { isRead: false } }),
      prisma.notification.groupBy({ by: ['type'], _count: true }),
      prisma.notification.count({ where: { createdAt: { gte: todayStart() } } }),
      prisma.notification.count({ where: { createdAt: { gte: weekStart() } } }),
    ])

    const byType = byTypeRaw.reduce<Record<string, number>>((acc, r) => {
      acc[r.type] = r._count
      return acc
    }, {})

    return { success: true, data: { total, unread, byType, sentToday, sentThisWeek } }
  } catch (err) {
    console.error('[getNotificationStats]', err)
    return { success: false, error: 'Failed to fetch stats' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LIST (cursor-based infinite scroll with all filters)
// ─────────────────────────────────────────────────────────────────────────────

const listSchema = z.object({
  cursor:    z.string().optional(),
  take:      z.number().int().min(1).max(50).default(20),
  search:    z.string().optional(),
  type:      z.string().optional(),           // e.g. "BOOKING", "QUOTE" …
  isRead:    z.boolean().optional(),           // undefined = all
  userId:    z.string().optional(),
  dateFrom:  z.coerce.date().optional(),
  dateTo:    z.coerce.date().optional(),
})

export type ListNotificationsParams = z.infer<typeof listSchema>

export async function listNotifications(
  raw: ListNotificationsParams
): Promise<ActionResult<{ items: NotificationItem[]; nextCursor: string | null; total: number }>> {
  try {
    await requireAdmin()

    const p = listSchema.parse(raw)
    const { cursor, take, search, type, isRead, userId, dateFrom, dateTo } = p

    const where: Prisma.NotificationWhereInput = {
      ...(isRead !== undefined && { isRead }),
      ...(type   && { type }),
      ...(userId && { userId }),
      ...((dateFrom || dateTo) && {
        createdAt: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo   && { lte: dateTo }),
        },
      }),
      ...(search && {
        OR: [
          { title:   { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [total, raw_items] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        take: take + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, title: true, message: true, type: true,
          isRead: true, createdAt: true, metadata: true,
          bookingId: true, requestId: true, quoteId: true,
          user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        },
      }),
    ])

    let nextCursor: string | null = null
    if (raw_items.length > take) nextCursor = raw_items.pop()!.id

    return { success: true, data: { items: raw_items as NotificationItem[], nextCursor, total } }
  } catch (err) {
    console.error('[listNotifications]', err)
    return { success: false, error: 'Failed to fetch notifications' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MARK READ / UNREAD
// ─────────────────────────────────────────────────────────────────────────────

export async function markNotificationsRead(ids: string[]): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAdmin()
    if (!ids.length) return { success: false, error: 'No IDs provided' }
    const r = await prisma.notification.updateMany({
      where: { id: { in: ids } },
      data:  { isRead: true },
    })
    return { success: true, data: { count: r.count } }
  } catch (err) {
    console.error('[markNotificationsRead]', err)
    return { success: false, error: 'Failed' }
  }
}

export async function markNotificationsUnread(ids: string[]): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAdmin()
    if (!ids.length) return { success: false, error: 'No IDs provided' }
    const r = await prisma.notification.updateMany({
      where: { id: { in: ids } },
      data:  { isRead: false },
    })
    return { success: true, data: { count: r.count } }
  } catch (err) {
    console.error('[markNotificationsUnread]', err)
    return { success: false, error: 'Failed' }
  }
}

export async function markAllRead(): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAdmin()
    const r = await prisma.notification.updateMany({
      where: { isRead: false },
      data:  { isRead: true },
    })
    return { success: true, data: { count: r.count } }
  } catch (err) {
    console.error('[markAllRead]', err)
    return { success: false, error: 'Failed' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DELETE
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteNotifications(ids: string[]): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAdmin()
    if (!ids.length) return { success: false, error: 'No IDs provided' }
    const r = await prisma.notification.deleteMany({ where: { id: { in: ids } } })
    return { success: true, data: { count: r.count } }
  } catch (err) {
    console.error('[deleteNotifications]', err)
    return { success: false, error: 'Failed to delete' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SEND — to a single user
// ─────────────────────────────────────────────────────────────────────────────

const sendSchema = z.object({
  userId:   z.string().min(1),
  title:    z.string().min(1).max(200),
  message:  z.string().min(1).max(2000),
  type:     z.string().min(1).max(50),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function sendNotification(
  raw: z.infer<typeof sendSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const adminId = await requireAdmin()
    const { userId, title, message, type, metadata } = sendSchema.parse(raw)

    const target = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      select: { id: true },
    })
    if (!target) return { success: false, error: 'User not found' }

    const n = await prisma.notification.create({
      data: { userId, title, message, type, metadata: (metadata ?? {}) as Prisma.InputJsonValue },
    })

    await prisma.auditLog.create({
      data: {
        adminId, action: 'SEND_NOTIFICATION', entity: 'Notification',
        entityId: n.id, changes: { userId, title, type } satisfies Prisma.InputJsonValue,
      },
    })

    return { success: true, data: { id: n.id } }
  } catch (err) {
    console.error('[sendNotification]', err)
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    return { success: false, error: 'Failed to send notification' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. BROADCAST — to many / all users
// ─────────────────────────────────────────────────────────────────────────────

const broadcastSchema = z.object({
  title:    z.string().min(1).max(200),
  message:  z.string().min(1).max(2000),
  type:     z.string().min(1).max(50),
  userIds:  z.array(z.string()).optional(), // empty = all active users
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function broadcastNotification(
  raw: z.infer<typeof broadcastSchema>
): Promise<ActionResult<{ sentCount: number }>> {
  try {
    const adminId = await requireAdmin()
    const { title, message, type, userIds, metadata } = broadcastSchema.parse(raw)

    const targets = userIds?.length
      ? userIds
      : (await prisma.user.findMany({
          where: { isDeleted: false, isActive: true },
          select: { id: true },
        })).map(u => u.id)

    if (!targets.length) return { success: false, error: 'No target users found' }

    const result = await prisma.notification.createMany({
      data: targets.map(userId => ({
        userId, title, message, type,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      })),
    })

    await prisma.auditLog.create({
      data: {
        adminId, action: 'BROADCAST_NOTIFICATION', entity: 'Notification',
        changes: { title, type, sentCount: result.count } satisfies Prisma.InputJsonValue,
      },
    })

    return { success: true, data: { sentCount: result.count } }
  } catch (err) {
    console.error('[broadcastNotification]', err)
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    return { success: false, error: 'Failed to broadcast' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. USER SEARCH (for send modal autocomplete)
// ─────────────────────────────────────────────────────────────────────────────

export async function searchUsers(query: string): Promise<ActionResult<UserOption[]>> {
  try {
    await requireAdmin()
    if (query.length < 2) return { success: true, data: [] }

    const users = await prisma.user.findMany({
      where: {
        isDeleted: false,
        OR: [
          { email:    { contains: query, mode: 'insensitive' } },
          { fullName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
      select: { id: true, fullName: true, email: true },
    })
    return { success: true, data: users }
  } catch (err) {
    console.error('[searchUsers]', err)
    return { success: false, error: 'Failed to search users' }
  }
}