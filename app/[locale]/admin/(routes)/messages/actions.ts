'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SessionUser = {
  id: string
  fullName: string | null
  email: string
  avatarUrl: string | null
}

export type SessionListItem = {
  id: string
  startedAt: Date
  endedAt: Date | null
  user: SessionUser | null
  lastMessage: { content: string; role: string; createdAt: Date } | null
  messageCount: number
  isActive: boolean
}

export type MessageItem = {
  id: string
  role: string   // "user" | "assistant"
  content: string
  createdAt: Date
}

export type SessionDetail = {
  id: string
  startedAt: Date
  endedAt: Date | null
  user: SessionUser | null
  messages: MessageItem[]
  messageCount: number
  isActive: boolean
}

export type MessagesStats = {
  totalSessions: number
  activeSessions: number
  totalMessages: number
  sessionsToday: number
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. STATS
// ─────────────────────────────────────────────────────────────────────────────

export async function getMessagesStats(): Promise<ActionResult<MessagesStats>> {
  try {
    await requireAdmin()
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0))

    const [totalSessions, activeSessions, totalMessages, sessionsToday] = await Promise.all([
      prisma.chatSession.count(),
      prisma.chatSession.count({ where: { endedAt: null } }),
      prisma.chatMessage.count(),
      prisma.chatSession.count({ where: { startedAt: { gte: todayStart } } }),
    ])

    return { success: true, data: { totalSessions, activeSessions, totalMessages, sessionsToday } }
  } catch (err) {
    console.error('[getMessagesStats]', err)
    return { success: false, error: 'Failed to fetch stats' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LIST SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

const listSessionsSchema = z.object({
  cursor:   z.string().optional(),
  take:     z.number().int().min(1).max(50).default(20),
  search:   z.string().optional(),
  isActive: z.boolean().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo:   z.coerce.date().optional(),
})

export type ListSessionsParams = z.infer<typeof listSessionsSchema>

export async function listSessions(
  raw: ListSessionsParams
): Promise<ActionResult<{ items: SessionListItem[]; nextCursor: string | null; total: number }>> {
  try {
    await requireAdmin()
    const { cursor, take, search, isActive, dateFrom, dateTo } = listSessionsSchema.parse(raw)

    const userFilter: Prisma.UserWhereInput | undefined = search ? {
      OR: [
        { email:    { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ],
    } : undefined

    const where: Prisma.ChatSessionWhereInput = {
      ...(isActive === true  && { endedAt: null }),
      ...(isActive === false && { endedAt: { not: null } }),
      ...((dateFrom || dateTo) && {
        startedAt: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo   && { lte: dateTo }),
        },
      }),
      ...(userFilter && { user: userFilter }),
    }

    const [total, rawItems] = await Promise.all([
      prisma.chatSession.count({ where }),
      prisma.chatSession.findMany({
        where,
        take: take + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { startedAt: 'desc' },
        select: {
          id: true, startedAt: true, endedAt: true,
          user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, role: true, createdAt: true },
          },
          _count: { select: { messages: true } },
        },
      }),
    ])

    let nextCursor: string | null = null
    if (rawItems.length > take) nextCursor = rawItems.pop()!.id

    return {
      success: true,
      data: {
        total,
        nextCursor,
        items: rawItems.map(s => ({
          id:           s.id,
          startedAt:    s.startedAt,
          endedAt:      s.endedAt,
          user:         s.user,
          lastMessage:  s.messages[0] ?? null,
          messageCount: s._count.messages,
          isActive:     s.endedAt === null,
        })),
      },
    }
  } catch (err) {
    console.error('[listSessions]', err)
    return { success: false, error: 'Failed to list sessions' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SESSION DETAIL + FULL HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export async function getSessionDetail(
  sessionId: string
): Promise<ActionResult<SessionDetail>> {
  try {
    await requireAdmin()

    const s = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true, startedAt: true, endedAt: true,
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, role: true, content: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
    })

    if (!s) return { success: false, error: 'Session not found' }

    return {
      success: true,
      data: {
        id: s.id, startedAt: s.startedAt, endedAt: s.endedAt,
        user: s.user, messages: s.messages,
        messageCount: s._count.messages,
        isActive: s.endedAt === null,
      },
    }
  } catch (err) {
    console.error('[getSessionDetail]', err)
    return { success: false, error: 'Failed to fetch session' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. POLL NEW MESSAGES (for live updates)
// ─────────────────────────────────────────────────────────────────────────────

export async function pollNewMessages(
  sessionId: string,
  afterMessageId: string | null
): Promise<ActionResult<{ messages: MessageItem[]; sessionEndedAt: Date | null }>> {
  try {
    await requireAdmin()

    let afterDate: Date | undefined
    if (afterMessageId) {
      const last = await prisma.chatMessage.findUnique({
        where: { id: afterMessageId },
        select: { createdAt: true },
      })
      if (last) afterDate = last.createdAt
    }

    const [messages, session] = await Promise.all([
      prisma.chatMessage.findMany({
        where: {
          sessionId,
          ...(afterDate && { createdAt: { gt: afterDate } }),
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true, role: true, content: true, createdAt: true },
      }),
      prisma.chatSession.findUnique({
        where:  { id: sessionId },
        select: { endedAt: true },
      }),
    ])

    return {
      success: true,
      data: { messages, sessionEndedAt: session?.endedAt ?? null },
    }
  } catch (err) {
    console.error('[pollNewMessages]', err)
    return { success: false, error: 'Failed to poll messages' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ADMIN REPLY
// ─────────────────────────────────────────────────────────────────────────────

const replySchema = z.object({
  sessionId: z.string().min(1),
  content:   z.string().min(1).max(4000),
})

export async function adminReply(
  raw: z.infer<typeof replySchema>
): Promise<ActionResult<MessageItem>> {
  try {
    const adminId = await requireAdmin()
    const { sessionId, content } = replySchema.parse(raw)

    const session = await prisma.chatSession.findUnique({
      where:  { id: sessionId },
      select: { id: true, endedAt: true },
    })
    if (!session)        return { success: false, error: 'Session not found' }
    if (session.endedAt) return { success: false, error: 'Session has ended — reopen it first' }

    const message = await prisma.chatMessage.create({
      data:   { sessionId, role: 'assistant', content },
      select: { id: true, role: true, content: true, createdAt: true },
    })

    await prisma.auditLog.create({
      data: {
        adminId, action: 'ADMIN_REPLY', entity: 'ChatSession', entityId: sessionId,
        changes: { contentLength: content.length } satisfies Prisma.InputJsonValue,
      },
    })

    return { success: true, data: message }
  } catch (err) {
    console.error('[adminReply]', err)
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    return { success: false, error: 'Failed to send reply' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. END SESSION
// ─────────────────────────────────────────────────────────────────────────────

export async function endSession(
  sessionId: string
): Promise<ActionResult<{ endedAt: Date }>> {
  try {
    const adminId = await requireAdmin()

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId }, select: { id: true, endedAt: true },
    })
    if (!session)        return { success: false, error: 'Session not found' }
    if (session.endedAt) return { success: false, error: 'Session already ended' }

    const endedAt = new Date()
    await prisma.chatSession.update({ where: { id: sessionId }, data: { endedAt } })

    await prisma.auditLog.create({
      data: {
        adminId, action: 'END_CHAT_SESSION', entity: 'ChatSession', entityId: sessionId,
        changes: { endedAt: endedAt.toISOString() } satisfies Prisma.InputJsonValue,
      },
    })

    return { success: true, data: { endedAt } }
  } catch (err) {
    console.error('[endSession]', err)
    return { success: false, error: 'Failed to end session' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. DELETE SESSION
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteSession(
  sessionId: string
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId = await requireAdmin()

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId }, select: { id: true },
    })
    if (!session) return { success: false, error: 'Session not found' }

    await prisma.chatSession.delete({ where: { id: sessionId } })

    await prisma.auditLog.create({
      data: {
        adminId, action: 'DELETE_CHAT_SESSION', entity: 'ChatSession', entityId: sessionId,
        changes: Prisma.JsonNull,
      },
    })

    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error('[deleteSession]', err)
    return { success: false, error: 'Failed to delete session' }
  }
}