'use server'
// app/[locale]/admin/(routes)/product-requests/actions.ts

import { prisma }       from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { z }            from 'zod'
import { Prisma, RequestStatus, QuoteStatus } from '@prisma/client'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync }   from 'fs'
import path             from 'path'
import { revalidatePath } from 'next/cache'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'requests')

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true })
}

function serializeRequest(r: any): any {
  return {
    ...r,
    aiEstimatedPrice: r.aiEstimatedPrice ? r.aiEstimatedPrice.toString() : null,
    quotes: r.quotes?.map((q: any) => ({
      ...q,
      price: q.price.toString(),
      files: q.files ?? [],
      statusHistory: q.statusHistory ?? [],
    })) ?? [],
    acceptedQuote: r.acceptedQuote
      ? {
          ...r.acceptedQuote,
          price: r.acceptedQuote.price.toString(),
          files: r.acceptedQuote.files ?? [],
          statusHistory: r.acceptedQuote.statusHistory ?? [],
        }
      : null,
    aiSuggestions: r.aiSuggestions?.map((s: any) => ({
      ...s,
      estimatedPrice: s.estimatedPrice.toString(),
    })) ?? [],
  }
}

const requestSelect = {
  id: true, clientId: true, productLink: true, description: true,
  quantity: true, shippingCountry: true, customNotes: true,
  status: true, priority: true, acceptedQuoteId: true,
  aiParsedData: true, aiEstimatedPrice: true, aiConfidence: true,
  isDeleted: true, createdAt: true, updatedAt: true,
  client: { select: { id: true, email: true, fullName: true, avatarUrl: true, phone: true } },
  files: { select: { id: true, url: true, fileType: true, fileName: true, fileSize: true, requestId: true, quoteId: true, uploadedById: true, createdAt: true } },
  quotes: {
    where: { isDeleted: false },
    orderBy: { revision: 'desc' as const },
    select: {
      id: true, requestId: true, createdById: true, price: true, currency: true,
      status: true, validUntil: true, revision: true, adminNotes: true,
      isDeleted: true, createdAt: true, updatedAt: true,
      createdBy: { select: { id: true, email: true, fullName: true } },
      files: { select: { id: true, url: true, fileType: true, fileName: true, fileSize: true, requestId: true, quoteId: true, uploadedById: true, createdAt: true } },
      statusHistory: {
        orderBy: { changedAt: 'desc' as const },
        select: {
          id: true, quoteId: true, oldStatus: true, newStatus: true, changedAt: true,
          changedBy: { select: { id: true, email: true, fullName: true } },
        },
      },
    },
  },
  statusHistory: {
    orderBy: { changedAt: 'desc' as const },
    select: {
      id: true, requestId: true, oldStatus: true, newStatus: true, changedAt: true,
      changedBy: { select: { id: true, email: true, fullName: true } },
    },
  },
  aiSuggestions: {
    orderBy: { createdAt: 'desc' as const },
    take: 5,
    select: { id: true, requestId: true, estimatedPrice: true, currency: true, confidence: true, suggestedSupplierIds: true, createdAt: true },
  },
  acceptedQuote: {
    select: {
      id: true, requestId: true, createdById: true, price: true, currency: true,
      status: true, validUntil: true, revision: true, adminNotes: true,
      isDeleted: true, createdAt: true, updatedAt: true,
      createdBy: { select: { id: true, email: true, fullName: true } },
      files: { select: { id: true, url: true, fileType: true, fileName: true, fileSize: true, requestId: true, quoteId: true, uploadedById: true, createdAt: true } },
      statusHistory: {
        orderBy: { changedAt: 'desc' as const },
        select: {
          id: true, quoteId: true, oldStatus: true, newStatus: true, changedAt: true,
          changedBy: { select: { id: true, email: true, fullName: true } },
        },
      },
    },
  },
  _count: { select: { quotes: true, files: true } },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// 1. LIST REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

const listSchema = z.object({
  page:          z.number().int().min(1).default(1),
  pageSize:      z.number().int().min(1).max(100).default(20),
  status:        z.nativeEnum(RequestStatus).optional(),
  priority:      z.number().int().min(0).max(5).optional(),
  clientEmail:   z.string().optional(),
  search:        z.string().optional(),
  createdAtFrom: z.coerce.date().optional(),
  createdAtTo:   z.coerce.date().optional(),
})

export async function getAllProductRequests(raw: z.infer<typeof listSchema>) {
  try {
    await requireAdmin()
    const { page, pageSize, status, priority, clientEmail, search, createdAtFrom, createdAtTo } = listSchema.parse(raw)

    const where: Prisma.ProductRequestWhereInput = {
      isDeleted: false,
      ...(status   && { status }),
      ...(priority !== undefined && { priority }),
      ...((createdAtFrom || createdAtTo) && {
        createdAt: {
          ...(createdAtFrom && { gte: createdAtFrom }),
          ...(createdAtTo   && { lte: createdAtTo }),
        },
      }),
      ...((clientEmail || search) && {
        client: {
          ...(clientEmail && { email: { contains: clientEmail, mode: 'insensitive' } }),
          ...(search && {
            OR: [
              { email:    { contains: search, mode: 'insensitive' } },
              { fullName: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
      }),
      ...(search && !clientEmail && {
        OR: [
          { description:   { contains: search, mode: 'insensitive' } },
          { productLink:   { contains: search, mode: 'insensitive' } },
          { customNotes:   { contains: search, mode: 'insensitive' } },
          { client: { OR: [
            { email:    { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
          ]}},
        ],
      }),
    }

    const [totalCount, requests] = await Promise.all([
      prisma.productRequest.count({ where }),
      prisma.productRequest.findMany({
        where,
        select: requestSelect,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return {
      success: true,
      data: {
        requests: requests.map(serializeRequest),
        pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
      },
    }
  } catch (err) {
    console.error('[getAllProductRequests]', err)
    return { success: false, error: 'Failed to fetch requests' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET SINGLE REQUEST
// ─────────────────────────────────────────────────────────────────────────────

export async function getProductRequest(id: string) {
  try {
    await requireAdmin()
    const r = await prisma.productRequest.findUnique({ where: { id }, select: requestSelect })
    if (!r) return { success: false, error: 'Not found' }
    return { success: true, data: serializeRequest(r) }
  } catch (err) {
    console.error('[getProductRequest]', err)
    return { success: false, error: 'Failed to fetch request' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. UPDATE STATUS
// ─────────────────────────────────────────────────────────────────────────────

export async function updateRequestStatus(
  requestId: string,
  newStatus: RequestStatus,
  note?: string,
) {
  try {
    const adminId = await requireAdmin()

    const req = await prisma.productRequest.findUnique({
      where: { id: requestId }, select: { id: true, status: true, clientId: true },
    })
    if (!req) return { success: false, error: 'Request not found' }

    const oldStatus = req.status
    await prisma.$transaction([
      prisma.productRequest.update({ where: { id: requestId }, data: { status: newStatus } }),
      prisma.requestStatusHistory.create({
        data: { requestId, oldStatus, newStatus, changedById: adminId },
      }),
      prisma.auditLog.create({
        data: {
          adminId, action: 'UPDATE_REQUEST_STATUS', entity: 'ProductRequest', entityId: requestId,
          changes: { oldStatus, newStatus, note } satisfies Prisma.InputJsonValue,
        },
      }),
      // Notify client
      prisma.notification.create({
        data: {
          userId:    req.clientId,
          title:     `Request status updated to ${newStatus}`,
          message:   note ?? `Your product request has been moved to ${newStatus}.`,
          type:      'REQUEST',
          requestId,
        },
      }),
    ])

    revalidatePath('/admin/product-requests')
    return { success: true, data: { newStatus } }
  } catch (err) {
    console.error('[updateRequestStatus]', err)
    return { success: false, error: 'Failed to update status' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. UPDATE PRIORITY
// ─────────────────────────────────────────────────────────────────────────────

export async function updateRequestPriority(requestId: string, priority: number) {
  try {
    const adminId = await requireAdmin()
    if (priority < 0 || priority > 5) return { success: false, error: 'Priority must be 0–5' }

    await prisma.$transaction([
      prisma.productRequest.update({ where: { id: requestId }, data: { priority } }),
      prisma.auditLog.create({
        data: {
          adminId, action: 'UPDATE_REQUEST_PRIORITY', entity: 'ProductRequest', entityId: requestId,
          changes: { priority } satisfies Prisma.InputJsonValue,
        },
      }),
    ])

    revalidatePath('/admin/product-requests')
    return { success: true, data: { priority } }
  } catch (err) {
    console.error('[updateRequestPriority]', err)
    return { success: false, error: 'Failed to update priority' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SOFT DELETE REQUEST
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteProductRequest(requestId: string) {
  try {
    const adminId = await requireAdmin()

    await prisma.$transaction([
      prisma.productRequest.update({ where: { id: requestId }, data: { isDeleted: true } }),
      prisma.auditLog.create({
        data: {
          adminId, action: 'DELETE_REQUEST', entity: 'ProductRequest', entityId: requestId,
          changes: Prisma.JsonNull,
        },
      }),
    ])

    revalidatePath('/admin/product-requests')
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error('[deleteProductRequest]', err)
    return { success: false, error: 'Failed to delete request' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CREATE QUOTE (with optional file)
// ─────────────────────────────────────────────────────────────────────────────

const createQuoteSchema = z.object({
  requestId:  z.string().min(1),
  price:      z.number().positive(),
  currency:   z.string().default('USD'),
  validUntil: z.coerce.date().optional(),
  adminNotes: z.string().optional(),
  status:     z.nativeEnum(QuoteStatus).default('DRAFT'),
})

export async function createQuote(raw: z.infer<typeof createQuoteSchema>) {
  try {
    const adminId = await requireAdmin()
    const { requestId, price, currency, validUntil, adminNotes, status } = createQuoteSchema.parse(raw)

    const req = await prisma.productRequest.findUnique({
      where: { id: requestId }, select: { id: true, clientId: true, _count: { select: { quotes: true } } },
    })
    if (!req) return { success: false, error: 'Request not found' }

    const revision = req._count.quotes + 1

    const quote = await prisma.$transaction(async tx => {
      const q = await tx.quote.create({
        data: { requestId, createdById: adminId, price, currency, validUntil, adminNotes, status, revision },
      })
      await tx.quoteStatusHistory.create({
        data: { quoteId: q.id, oldStatus: 'DRAFT', newStatus: status, changedById: adminId },
      })
      await tx.auditLog.create({
        data: {
          adminId, action: 'CREATE_QUOTE', entity: 'Quote', entityId: q.id,
          changes: { requestId, price, currency, status } satisfies Prisma.InputJsonValue,
        },
      })
      if (status === 'SENT') {
        await tx.notification.create({
          data: {
            userId: req.clientId, title: 'New quote received',
            message: `A quote of ${price} ${currency} has been sent for your request.`,
            type: 'QUOTE', requestId, quoteId: q.id,
          },
        })
      }
      return q
    })

    revalidatePath('/admin/product-requests')
    return { success: true, data: { id: quote.id } }
  } catch (err) {
    console.error('[createQuote]', err)
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    return { success: false, error: 'Failed to create quote' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. UPDATE QUOTE STATUS
// ─────────────────────────────────────────────────────────────────────────────

export async function updateQuoteStatus(quoteId: string, newStatus: QuoteStatus) {
  try {
    const adminId = await requireAdmin()

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: { id: true, status: true, requestId: true, request: { select: { clientId: true } } },
    })
    if (!quote) return { success: false, error: 'Quote not found' }

    const oldStatus = quote.status
    await prisma.$transaction([
      prisma.quote.update({ where: { id: quoteId }, data: { status: newStatus } }),
      prisma.quoteStatusHistory.create({
        data: { quoteId, oldStatus, newStatus, changedById: adminId },
      }),
      prisma.auditLog.create({
        data: {
          adminId, action: 'UPDATE_QUOTE_STATUS', entity: 'Quote', entityId: quoteId,
          changes: { oldStatus, newStatus } satisfies Prisma.InputJsonValue,
        },
      }),
    ])

    revalidatePath('/admin/product-requests')
    return { success: true, data: { newStatus } }
  } catch (err) {
    console.error('[updateQuoteStatus]', err)
    return { success: false, error: 'Failed to update quote' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. DELETE QUOTE
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteQuote(quoteId: string) {
  try {
    const adminId = await requireAdmin()

    await prisma.$transaction([
      prisma.quote.update({ where: { id: quoteId }, data: { isDeleted: true } }),
      prisma.auditLog.create({
        data: {
          adminId, action: 'DELETE_QUOTE', entity: 'Quote', entityId: quoteId,
          changes: Prisma.JsonNull,
        },
      }),
    ])

    revalidatePath('/admin/product-requests')
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error('[deleteQuote]', err)
    return { success: false, error: 'Failed to delete quote' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. FILE UPLOAD (local storage → public/uploads/requests/)
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
  'application/zip', 'application/x-zip-compressed',
])
const MAX_BYTES = 20 * 1024 * 1024   // 20 MB

export async function uploadFile(formData: FormData): Promise<ActionResult<{ id: string; url: string; fileName: string }>> {
  try {
    const adminId  = await requireAdmin()
    const file     = formData.get('file') as File | null
    const requestId = formData.get('requestId') as string | null
    const quoteId  = formData.get('quoteId') as string | null

    if (!file)                  return { success: false, error: 'No file provided' }
    if (!requestId && !quoteId) return { success: false, error: 'Must specify requestId or quoteId' }
    if (!ALLOWED_TYPES.has(file.type)) return { success: false, error: `File type ${file.type} not allowed` }
    if (file.size > MAX_BYTES)  return { success: false, error: 'File exceeds 20 MB limit' }

    await ensureUploadDir()

    const ext       = file.name.split('.').pop() ?? 'bin'
    const safeName  = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const fullPath  = path.join(UPLOAD_DIR, safeName)
    const buffer    = Buffer.from(await file.arrayBuffer())

    await writeFile(fullPath, buffer)

    const url = `/uploads/requests/${safeName}`

    const record = await prisma.file.create({
      data: {
        url,
        fileType:    file.type,
        fileName:    file.name,
        fileSize:    file.size,
        requestId:   requestId ?? undefined,
        quoteId:     quoteId   ?? undefined,
        uploadedById: adminId,
      },
    })

    await prisma.auditLog.create({
      data: {
        adminId, action: 'UPLOAD_FILE', entity: 'File', entityId: record.id,
        changes: { fileName: file.name, requestId, quoteId, fileSize: file.size } satisfies Prisma.InputJsonValue,
      },
    })

    revalidatePath('/admin/product-requests')
    return { success: true, data: { id: record.id, url, fileName: file.name } }
  } catch (err) {
    console.error('[uploadFile]', err)
    return { success: false, error: 'Upload failed' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. DELETE FILE
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteFile(fileId: string): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId = await requireAdmin()

    const file = await prisma.file.findUnique({ where: { id: fileId } })
    if (!file) return { success: false, error: 'File not found' }

    // Delete from disk
    if (file.url.startsWith('/uploads/')) {
      const diskPath = path.join(process.cwd(), 'public', file.url)
      try { await unlink(diskPath) } catch { /* already gone */ }
    }

    await prisma.$transaction([
      prisma.file.delete({ where: { id: fileId } }),
      prisma.auditLog.create({
        data: {
          adminId, action: 'DELETE_FILE', entity: 'File', entityId: fileId,
          changes: { fileName: file.fileName, url: file.url } satisfies Prisma.InputJsonValue,
        },
      }),
    ])

    revalidatePath('/admin/product-requests')
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error('[deleteFile]', err)
    return { success: false, error: 'Failed to delete file' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. AI QUOTE GENERATION (Groq)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateAIQuote(requestId: string): Promise<ActionResult<{
  estimatedPrice: string
  currency: string
  confidence: number
  reasoning: string
  suggestedNotes: string
}>> {
  try {
    const adminId = await requireAdmin()

    const req = await prisma.productRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true, productLink: true, description: true, quantity: true,
        shippingCountry: true, customNotes: true,
        client: { select: { fullName: true, email: true } },
      },
    })
    if (!req) return { success: false, error: 'Request not found' }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return { success: false, error: 'GROQ_API_KEY not configured' }

    const prompt = `You are a B2B product sourcing expert. Analyse this product request and generate a pricing estimate.

Product Request:
- Description: ${req.description ?? 'Not provided'}
- Product Link: ${req.productLink ?? 'Not provided'}
- Quantity: ${req.quantity}
- Shipping Country: ${req.shippingCountry}
- Client Notes: ${req.customNotes ?? 'None'}
- Client: ${req.client?.fullName ?? req.client?.email ?? 'Unknown'}

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "estimatedPrice": number,
  "currency": "USD",
  "confidence": number between 0 and 1,
  "reasoning": "2-3 sentence explanation of pricing factors",
  "suggestedNotes": "professional notes for the client quote"
}`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 512,
        temperature: 0.3,
        messages: [
          { role: 'system', content: 'You are a B2B sourcing pricing expert. Always respond with valid JSON only.' },
          { role: 'user',   content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      const e = await response.text()
      throw new Error(`Groq error ${response.status}: ${e}`)
    }

    const groqData  = await response.json()
    const rawText   = groqData.choices?.[0]?.message?.content?.trim() ?? ''
    const cleaned   = rawText.replace(/```json|```/g, '').trim()
    const parsed    = JSON.parse(cleaned)

    const { estimatedPrice, currency, confidence, reasoning, suggestedNotes } = parsed

    if (typeof estimatedPrice !== 'number') throw new Error('Invalid AI response structure')

    // Save to AISuggestion table
    await prisma.$transaction([
      prisma.aISuggestion.create({
        data: {
          requestId, estimatedPrice, currency: currency ?? 'USD',
          confidence: Math.min(1, Math.max(0, confidence ?? 0.5)),
        },
      }),
      prisma.productRequest.update({
        where: { id: requestId },
        data: {
          aiEstimatedPrice: estimatedPrice,
          aiConfidence:     Math.min(1, Math.max(0, confidence ?? 0.5)),
          aiParsedData:     parsed satisfies Prisma.InputJsonValue,
        },
      }),
      prisma.auditLog.create({
        data: {
          adminId, action: 'AI_QUOTE_GENERATED', entity: 'ProductRequest', entityId: requestId,
          changes: { estimatedPrice, confidence } satisfies Prisma.InputJsonValue,
        },
      }),
    ])

    revalidatePath('/admin/product-requests')
    return {
      success: true,
      data: {
        estimatedPrice: estimatedPrice.toString(),
        currency:       currency ?? 'USD',
        confidence:     Math.min(1, Math.max(0, confidence ?? 0.5)),
        reasoning,
        suggestedNotes,
      },
    }
  } catch (err) {
    console.error('[generateAIQuote]', err)
    return { success: false, error: 'AI generation failed. Please try again.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────

export async function getRequestStats() {
  try {
    await requireAdmin()

    const todayStart = new Date(new Date().setHours(0, 0, 0, 0))
    const weekStart  = new Date(Date.now() - 7 * 86400 * 1000)

    const [byStatus, submittedToday, submittedWeek, pendingQuotes, totalActive] = await Promise.all([
      prisma.productRequest.groupBy({
        by:     ['status'],
        where:  { isDeleted: false },
        _count: true,
      }),
      prisma.productRequest.count({ where: { isDeleted: false, createdAt: { gte: todayStart } } }),
      prisma.productRequest.count({ where: { isDeleted: false, createdAt: { gte: weekStart } } }),
      prisma.quote.count({ where: { isDeleted: false, status: 'DRAFT' } }),
      prisma.productRequest.count({ where: { isDeleted: false, status: { in: ['SUBMITTED', 'IN_REVIEW', 'QUOTED'] } } }),
    ])

    const statusMap = byStatus.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = r._count
      return acc
    }, {})

    return {
      success: true,
      data: { byStatus: statusMap, submittedToday, submittedWeek, pendingQuotes, totalActive },
    }
  } catch (err) {
    console.error('[getRequestStats]', err)
    return { success: false, error: 'Failed to fetch stats' }
  }
}