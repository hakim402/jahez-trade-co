'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

// ── Notification types ────────────────────────────────────────────────────────

export type HeaderNotification = {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date
  bookingId: string | null
  requestId: string | null
  quoteId:   string | null
  user: { fullName: string | null; email: string }
}

export type HeaderChatSession = {
  id: string
  startedAt: Date
  endedAt: Date | null
  user: { fullName: string | null; email: string; avatarUrl: string | null } | null
  lastMessage: { content: string; role: string; createdAt: Date } | null
  messageCount: number
}

// ── Fetch unread count only (used for polling badge) ─────────────────────────

export async function getUnreadNotificationCount(): Promise<ActionResult<{ unread: number }>> {
  try {
    await requireAdmin()
    const unread = await prisma.notification.count({ where: { isRead: false } })
    return { success: true, data: { unread } }
  } catch (error) {
    console.error('[getUnreadNotificationCount]', error)
    return { success: false, error: 'Failed' }
  }
}

// ── Fetch latest notifications for dropdown ──────────────────────────────────

export async function getHeaderNotifications(
  limit = 8
): Promise<ActionResult<{ notifications: HeaderNotification[]; unread: number }>> {
  try {
    await requireAdmin()

    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 20),
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          isRead: true,
          createdAt: true,
          bookingId: true,
          requestId: true,
          quoteId:   true,
          user: { select: { fullName: true, email: true } },
        },
      }),
      prisma.notification.count({ where: { isRead: false } }),
    ])

    return { success: true, data: { notifications, unread } }
  } catch (error) {
    console.error('[getHeaderNotifications]', error)
    return { success: false, error: 'Failed to fetch notifications' }
  }
}

// ── Mark one or all notifications as read ────────────────────────────────────

export async function markNotificationRead(
  id: string
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await requireAdmin()
    await prisma.notification.update({ where: { id }, data: { isRead: true } })
    return { success: true, data: { ok: true } }
  } catch (error) {
    console.error('[markNotificationRead]', error)
    return { success: false, error: 'Failed' }
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAdmin()
    const result = await prisma.notification.updateMany({
      where: { isRead: false },
      data:  { isRead: true },
    })
    return { success: true, data: { count: result.count } }
  } catch (error) {
    console.error('[markAllNotificationsRead]', error)
    return { success: false, error: 'Failed' }
  }
}

// ── Fetch recent chat sessions for messages dropdown ─────────────────────────

export async function getHeaderChatSessions(
  limit = 6
): Promise<ActionResult<{ sessions: HeaderChatSession[]; activeSessions: number }>> {
  try {
    await requireAdmin()

    const [sessions, activeSessions] = await Promise.all([
      prisma.chatSession.findMany({
        orderBy: { startedAt: 'desc' },
        take: Math.min(limit, 20),
        select: {
          id: true,
          startedAt: true,
          endedAt: true,
          user: { select: { fullName: true, email: true, avatarUrl: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, role: true, createdAt: true },
          },
          _count: { select: { messages: true } },
        },
      }),
      prisma.chatSession.count({ where: { endedAt: null } }),
    ])

    return {
      success: true,
      data: {
        activeSessions,
        sessions: sessions.map((s) => ({
          id:           s.id,
          startedAt:    s.startedAt,
          endedAt:      s.endedAt,
          user:         s.user,
          lastMessage:  s.messages[0] ?? null,
          messageCount: s._count.messages,
        })),
      },
    }
  } catch (error) {
    console.error('[getHeaderChatSessions]', error)
    return { success: false, error: 'Failed to fetch chat sessions' }
  }
}