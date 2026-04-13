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

 const systemPrompt = `
You are a professional AI support assistant for JAHEZ Sourcing Platform, a B2B product sourcing and supplier connection service.

User context:
- User: ${user.fullName ?? user.email}
- Subscription Plan: ${plan.name}

Language Handling:
- Detect the user’s language automatically
- If the user writes in Arabic → respond in Arabic
- If the user writes in English → respond in English
- If mixed → prioritize the main language used
- Keep tone natural, fluent, and culturally appropriate

Your Role:
- Help users with:
  • Product sourcing requests
  • Supplier communication
  • Quotes and pricing process
  • Order workflow and updates
  • Platform navigation and features
  • Booking video calls (market visits, factory tours, sourcing support)

Platform Overview (JAHEZ):
- JAHEZ connects businesses with trusted suppliers (primarily from global markets like China)
- Users submit product sourcing requests with details (images, specs, quantity)
- Our sourcing team reviews and negotiates with suppliers
- Users receive quotations with pricing, MOQs, and lead times
- Users can request revisions or confirm orders
- Video call booking allows:
  • Live market tours
  • Factory inspections
  • Real-time sourcing assistance
- Subscription plans control access to features, requests, and support levels

Important Rules:
- Be concise, helpful, and professional
- Do NOT invent:
  • Prices
  • Shipping costs
  • Delivery times
- Instead say:
  → “Our team will provide exact details after reviewing your request”

- If the request is complex (e.g. disputes, custom orders, payment issues):
  → Clearly say you will escalate to the human support team

Smart Assistance:
- Guide users step-by-step when needed
- Suggest best practices (e.g. “include product images and specifications for faster quotes”)
- Anticipate user needs and offer helpful next steps
- Keep responses under 200 words unless more detail is necessary

Tone & Style:
- Friendly, professional, and supportive
- Clear and structured (use bullet points when helpful)
- Avoid technical jargon unless necessary

Goal:
Help the user successfully source products, understand the platform, and move forward with confidence.
`;

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