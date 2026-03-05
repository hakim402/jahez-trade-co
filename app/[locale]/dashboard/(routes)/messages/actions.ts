'use server'

import { auth }   from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z }      from 'zod'
import { Prisma } from '@prisma/client'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type PlanInfo = {
  name:        string
  isDefault:   boolean   // true = free plan
  status:      string    // ACTIVE | CANCELED | etc.
  interval:    string | null
  amount:      number
  currency:    string
  hasAccess:   boolean   // billing gate result
}

export type ClientSession = {
  id:           string
  startedAt:    Date
  endedAt:      Date | null
  isActive:     boolean
  messageCount: number
  lastMessage:  { content: string; role: string; createdAt: Date } | null
}

export type ClientMessage = {
  id:        string
  role:      string   // "user" | "assistant"
  content:   string
  createdAt: Date
}

export type ClientSessionDetail = {
  id:           string
  startedAt:    Date
  endedAt:      Date | null
  isActive:     boolean
  messageCount: number
  messages:     ClientMessage[]
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH HELPER — resolves Clerk → Prisma user, throws if not found
// ─────────────────────────────────────────────────────────────────────────────

async function requireUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await prisma.user.findUnique({
    where:  { clerkId, isDeleted: false },
    select: { id: true, email: true, fullName: true, avatarUrl: true },
  })
  if (!user) throw new Error('User not found')
  return user
}

// ─────────────────────────────────────────────────────────────────────────────
// BILLING GATE
// ─────────────────────────────────────────────────────────────────────────────
//
// Strategy (future-proof for when billing goes live):
//
//   1. If BILLING_ENABLED env is NOT "true"  → grant full access to everyone.
//      This is the current state while Stripe account is unverified.
//
//   2. If BILLING_ENABLED is "true":
//      - User has an ACTIVE SubscriptionItem (any plan, including free) → grant access.
//      - User has no subscription / all items CANCELED/ENDED              → deny access.
//
// To activate billing in the future: set BILLING_ENABLED=true in your env.
// Everything else (Clerk webhooks already syncing plans) is already wired up.
//
async function checkAccess(userId: string): Promise<PlanInfo> {
  const billingEnabled = process.env.BILLING_ENABLED === 'true'

  // Fetch the user's subscription + active item + plan
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      items: {
        where:   { status: 'ACTIVE' },
        orderBy: { isDefaultPlan: 'asc' }, // paid plan first if multiple
        take: 1,
        select: {
          status:      true,
          isDefaultPlan: true,
          plan: {
            select: {
              name:      true,
              amount:    true,
              currency:  true,
              interval:  true,
              isDefault: true,
            },
          },
        },
      },
    },
  })

  const activeItem = subscription?.items[0] ?? null
  const plan       = activeItem?.plan

  // Build PlanInfo
  const planInfo: PlanInfo = {
    name:      plan?.name      ?? 'Free',
    isDefault: plan?.isDefault ?? true,
    status:    activeItem?.status ?? 'NONE',
    interval:  plan?.interval  ?? null,
    amount:    plan ? Number(plan.amount) : 0,
    currency:  plan?.currency  ?? 'USD',
    // hasAccess logic:
    // - billing disabled → always true
    // - billing enabled  → true only if there is an ACTIVE item
    hasAccess: !billingEnabled || activeItem !== null,
  }

  return planInfo
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET USER CONTEXT  (plan + sessions list)
// ─────────────────────────────────────────────────────────────────────────────

export type UserContext = {
  user:     { id: string; email: string; fullName: string | null; avatarUrl: string | null }
  plan:     PlanInfo
  sessions: ClientSession[]
}

export async function getUserContext(): Promise<ActionResult<UserContext>> {
  try {
    const user = await requireUser()
    const [plan, sessions] = await Promise.all([
      checkAccess(user.id),
      prisma.chatSession.findMany({
        where:   { userId: user.id },
        orderBy: { startedAt: 'desc' },
        take:    30,
        select: {
          id: true, startedAt: true, endedAt: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, role: true, createdAt: true },
          },
          _count: { select: { messages: true } },
        },
      }),
    ])

    return {
      success: true,
      data: {
        user,
        plan,
        sessions: sessions.map(s => ({
          id:           s.id,
          startedAt:    s.startedAt,
          endedAt:      s.endedAt,
          isActive:     s.endedAt === null,
          messageCount: s._count.messages,
          lastMessage:  s.messages[0] ?? null,
        })),
      },
    }
  } catch (err) {
    console.error('[getUserContext]', err)
    return { success: false, error: 'Failed to load messages' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. START NEW SESSION
// ─────────────────────────────────────────────────────────────────────────────

export async function startSession(): Promise<ActionResult<ClientSession>> {
  try {
    const user = await requireUser()
    const plan = await checkAccess(user.id)

    if (!plan.hasAccess) {
      return { success: false, error: 'UPGRADE_REQUIRED' }
    }

    const session = await prisma.chatSession.create({
      data:   { userId: user.id },
      select: { id: true, startedAt: true, endedAt: true },
    })

    return {
      success: true,
      data: {
        id:           session.id,
        startedAt:    session.startedAt,
        endedAt:      null,
        isActive:     true,
        messageCount: 0,
        lastMessage:  null,
      },
    }
  } catch (err) {
    console.error('[startSession]', err)
    return { success: false, error: 'Failed to start session' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET SESSION DETAIL
// ─────────────────────────────────────────────────────────────────────────────

export async function getClientSessionDetail(
  sessionId: string
): Promise<ActionResult<ClientSessionDetail>> {
  try {
    const user = await requireUser()

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true, startedAt: true, endedAt: true, userId: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          select:  { id: true, role: true, content: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
    })

    if (!session)                  return { success: false, error: 'Session not found' }
    if (session.userId !== user.id) return { success: false, error: 'Access denied' }

    return {
      success: true,
      data: {
        id:           session.id,
        startedAt:    session.startedAt,
        endedAt:      session.endedAt,
        isActive:     session.endedAt === null,
        messageCount: session._count.messages,
        messages:     session.messages,
      },
    }
  } catch (err) {
    console.error('[getClientSessionDetail]', err)
    return { success: false, error: 'Failed to fetch session' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SEND USER MESSAGE + TRIGGER AI REPLY
// ─────────────────────────────────────────────────────────────────────────────

const sendMessageSchema = z.object({
  sessionId: z.string().min(1),
  content:   z.string().min(1).max(4000),
})

export type SendMessageResult = {
  userMessage: ClientMessage
  aiMessage:   ClientMessage | null   // null if admin-only mode or AI failed gracefully
}

export async function sendUserMessage(
  raw: z.infer<typeof sendMessageSchema>
): Promise<ActionResult<SendMessageResult>> {
  try {
    const user = await requireUser()
    const plan = await checkAccess(user.id)

    if (!plan.hasAccess) return { success: false, error: 'UPGRADE_REQUIRED' }

    const { sessionId, content } = sendMessageSchema.parse(raw)

    // Verify session ownership + active state
    const session = await prisma.chatSession.findUnique({
      where:  { id: sessionId },
      select: { id: true, endedAt: true, userId: true },
    })
    if (!session)                   return { success: false, error: 'Session not found' }
    if (session.userId !== user.id) return { success: false, error: 'Access denied' }
    if (session.endedAt)            return { success: false, error: 'Session has ended' }

    // Persist user message
    const userMessage = await prisma.chatMessage.create({
      data:   { sessionId, role: 'user', content },
      select: { id: true, role: true, content: true, createdAt: true },
    })

    // ── AI Reply ─────────────────────────────────────────────────────────────
    // Fetch recent history for context (last 20 messages)
    const history = await prisma.chatMessage.findMany({
      where:   { sessionId },
      orderBy: { createdAt: 'asc' },
      take:    20,
      select:  { role: true, content: true },
    })

    let aiMessage: ClientMessage | null = null

    try {
      const aiContent = await callGroqAPI(history, user, plan)

      if (aiContent) {
        aiMessage = await prisma.chatMessage.create({
          data:   { sessionId, role: 'assistant', content: aiContent },
          select: { id: true, role: true, content: true, createdAt: true },
        })
      }
    } catch (aiErr) {
      // Groq failure is non-fatal — user message is saved, admin can reply manually
      console.error('[sendUserMessage] Groq reply failed (non-fatal):', aiErr)
    }

    return { success: true, data: { userMessage, aiMessage } }
  } catch (err) {
    console.error('[sendUserMessage]', err)
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    return { success: false, error: 'Failed to send message' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GROQ API HELPER
// ─────────────────────────────────────────────────────────────────────────────
//
// Uses the Groq Chat Completions API (OpenAI-compatible format).
// Model: llama-3.3-70b-versatile — fast, high quality, generous free tier.
// Swap to "mixtral-8x7b-32768" or "gemma2-9b-it" if you prefer.
//
// Groq docs: https://console.groq.com/docs/openai
//
async function callGroqAPI(
  history: { role: string; content: string }[],
  user: { fullName: string | null; email: string },
  plan: PlanInfo,
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.warn('[callGroqAPI] GROQ_API_KEY not set — skipping AI reply')
    return null
  }

  const systemPrompt = `You are a helpful support assistant for Mewan Sourcing Platform, a B2B product sourcing service.

You are chatting with ${user.fullName ?? user.email}, who is on the ${plan.name} plan.

Your role:
- Help users with questions about product sourcing, bookings, quotes, and platform usage
- Be concise, friendly, and professional
- If a question requires human review (complex orders, pricing disputes, account issues), say you will escalate to the team
- Do NOT make up specific prices or delivery times — say the team will follow up with exact details
- Keep responses under 200 words unless the question genuinely requires more detail

Platform context:
- Users can submit product requests (items they want sourced from suppliers)
- Admins review requests and send quotes
- Users can book video calls with the sourcing team (market visits, factory tours, custom sourcing)
- Subscription plans control platform access`

  // Groq uses the OpenAI chat format: system message first, then history
  const messages = [
    { role: 'system', content: systemPrompt },
    // Map DB roles — Groq only accepts "user" | "assistant" | "system"
    ...history.map(m => ({
      role:    m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  ]

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       'llama-3.3-70b-versatile',
      max_tokens:  512,
      temperature: 0.7,
      messages,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content?.trim()

  return text || null
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. POLL NEW MESSAGES (user side — checks for admin replies)
// ─────────────────────────────────────────────────────────────────────────────

export async function pollClientMessages(
  sessionId:      string,
  afterMessageId: string | null,
): Promise<ActionResult<{ messages: ClientMessage[]; sessionEndedAt: Date | null }>> {
  try {
    const user = await requireUser()

    // Verify ownership
    const session = await prisma.chatSession.findUnique({
      where:  { id: sessionId },
      select: { userId: true, endedAt: true },
    })
    if (!session || session.userId !== user.id) {
      return { success: false, error: 'Access denied' }
    }

    let afterDate: Date | undefined
    if (afterMessageId) {
      const last = await prisma.chatMessage.findUnique({
        where:  { id: afterMessageId },
        select: { createdAt: true },
      })
      if (last) afterDate = last.createdAt
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId,
        ...(afterDate && { createdAt: { gt: afterDate } }),
      },
      orderBy: { createdAt: 'asc' },
      select:  { id: true, role: true, content: true, createdAt: true },
    })

    return {
      success: true,
      data: { messages, sessionEndedAt: session.endedAt },
    }
  } catch (err) {
    console.error('[pollClientMessages]', err)
    return { success: false, error: 'Failed to poll' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. END SESSION (user-initiated)
// ─────────────────────────────────────────────────────────────────────────────

export async function endClientSession(
  sessionId: string,
): Promise<ActionResult<{ endedAt: Date }>> {
  try {
    const user = await requireUser()

    const session = await prisma.chatSession.findUnique({
      where:  { id: sessionId },
      select: { id: true, endedAt: true, userId: true },
    })
    if (!session)                   return { success: false, error: 'Session not found' }
    if (session.userId !== user.id) return { success: false, error: 'Access denied' }
    if (session.endedAt)            return { success: false, error: 'Session already ended' }

    const endedAt = new Date()
    await prisma.chatSession.update({ where: { id: sessionId }, data: { endedAt } })

    return { success: true, data: { endedAt } }
  } catch (err) {
    console.error('[endClientSession]', err)
    return { success: false, error: 'Failed to end session' }
  }
}