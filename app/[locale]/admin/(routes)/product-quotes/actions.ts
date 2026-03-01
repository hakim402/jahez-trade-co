// app/[locale]/admin/quotes/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { logAdminAction } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma, QuoteStatus } from '@prisma/client';

// Validation schemas
const getQuotesSchema = z.object({
  take: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  requestId: z.string().optional(),
  supplierId: z.string().optional(),
  status: z.nativeEnum(QuoteStatus).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'price', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GetQuotesParams = z.infer<typeof getQuotesSchema>;

export type GetQuotesReturn = {
  quotes: Array<{
    id: string;
    price: number; // ✅ changed from Decimal to number
    currency: string;
    status: QuoteStatus;
    adminNotes: string | null;
    quoteFileUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    request: {
      id: string;
      productLink: string | null;
      description: string | null;
      user: {
        fullName: string | null;
        email: string;
      };
    };
    supplier: {
      id: string;
      name: string;
    } | null;
  }>;
  nextCursor: string | null;
  total: number;
};

export async function getQuotes(
  rawParams: GetQuotesParams
): Promise<GetQuotesReturn> {
  await requireAdmin();
  const params = getQuotesSchema.parse(rawParams);
  const { take, cursor, requestId, supplierId, status, search, sortBy, sortOrder } = params;

  const where: Prisma.QuoteWhereInput = {};
  if (requestId) where.requestId = requestId;
  if (supplierId) where.supplierId = supplierId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { adminNotes: { contains: search, mode: 'insensitive' } },
      { request: { productLink: { contains: search, mode: 'insensitive' } } },
      { request: { description: { contains: search, mode: 'insensitive' } } },
      { supplier: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const total = await prisma.quote.count({ where });

  const orderBy: Prisma.QuoteOrderByWithRelationInput = { [sortBy]: sortOrder };

  const quotes = await prisma.quote.findMany({
    take: take + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    where,
    orderBy,
    select: {
      id: true,
      price: true,
      currency: true,
      status: true,
      adminNotes: true,
      quoteFileUrl: true,
      createdAt: true,
      updatedAt: true,
      request: {
        select: {
          id: true,
          productLink: true,
          description: true,
          user: { select: { fullName: true, email: true } },
        },
      },
      supplier: { select: { id: true, name: true } },
    },
  });

  let nextCursor: string | null = null;
  if (quotes.length > take) {
    const nextItem = quotes.pop();
    nextCursor = nextItem!.id;
  }

  // Convert Decimal price to number for client
  const quotesWithNumberPrice = quotes.map(q => ({
    ...q,
    price: Number(q.price),
  }));

  return {
    quotes: quotesWithNumberPrice as GetQuotesReturn['quotes'],
    nextCursor,
    total,
  };
}

// ----------------------------------------------------------------------
// Get single quote by ID (with full details)
// ----------------------------------------------------------------------
const getQuoteByIdSchema = z.object({ id: z.string() });

export type GetQuoteByIdReturn = {
  quote: {
    id: string;
    price: number; 
    currency: string;
    status: QuoteStatus;
    adminNotes: string | null;
    quoteFileUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    request: {
      id: string;
      productLink: string | null;
      description: string | null;
      quantity: number;
      shippingCountry: string;
      user: {
        id: string;
        fullName: string | null;
        email: string;
        phone: string | null;
      };
    };
    supplier: {
      id: string;
      name: string;
      contactPerson: string | null;
      contactEmail: string | null;
      contactPhone: string | null;
    } | null;
  };
};

export async function getQuoteById(rawParams: { id: string }): Promise<GetQuoteByIdReturn> {
  await requireAdmin();
  const { id } = getQuoteByIdSchema.parse(rawParams);

  const quote = await prisma.quote.findUnique({
    where: { id },
    select: {
      id: true,
      price: true,
      currency: true,
      status: true,
      adminNotes: true,
      quoteFileUrl: true,
      createdAt: true,
      updatedAt: true,
      request: {
        select: {
          id: true,
          productLink: true,
          description: true,
          quantity: true,
          shippingCountry: true,
          user: { select: { id: true, fullName: true, email: true, phone: true } },
        },
      },
      supplier: {
        select: {
          id: true,
          name: true,
          contactPerson: true,
          contactEmail: true,
          contactPhone: true,
        },
      },
    },
  });

  if (!quote) throw new Error('Quote not found');

  // Convert Decimal price to number
  const quoteWithNumberPrice = {
    ...quote,
    price: Number(quote.price),
  };

  return { quote: quoteWithNumberPrice as GetQuoteByIdReturn['quote'] };
}

// ----------------------------------------------------------------------
// Create a new quote
// ----------------------------------------------------------------------
const createQuoteSchema = z.object({
  requestId: z.string(),
  supplierId: z.string().optional().nullable(),
  price: z.number().positive(),
  currency: z.string().default('USD'),
  status: z.nativeEnum(QuoteStatus).default('DRAFT'),
  adminNotes: z.string().optional(),
  quoteFileUrl: z.string().url().optional(),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

export async function createQuote(input: CreateQuoteInput) {
  await requireAdmin();
  const validated = createQuoteSchema.parse(input);

  const quote = await prisma.quote.create({
    data: {
      requestId: validated.requestId,
      supplierId: validated.supplierId ?? null,
      price: validated.price,
      currency: validated.currency,
      status: validated.status,
      adminNotes: validated.adminNotes,
      quoteFileUrl: validated.quoteFileUrl,
    },
  });

  await logAdminAction({
    action: 'CREATE_QUOTE',
    entity: 'Quote',
    entityId: quote.id,
    changes: { after: quote },
  });

  revalidatePath(`/admin/product-requests/${validated.requestId}`);
  revalidatePath('/admin/quotes');
  revalidatePath('/admin/product-requests');

  return { success: true, quoteId: quote.id };
}

// ----------------------------------------------------------------------
// Update a quote
// ----------------------------------------------------------------------
const updateQuoteSchema = z.object({
  id: z.string(),
  supplierId: z.string().optional().nullable(),
  price: z.number().positive().optional(),
  currency: z.string().optional(),
  status: z.nativeEnum(QuoteStatus).optional(),
  adminNotes: z.string().optional().nullable(),
  quoteFileUrl: z.string().url().optional().nullable(),
});

export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;

export async function updateQuote(input: UpdateQuoteInput) {
  await requireAdmin();
  const { id, ...data } = updateQuoteSchema.parse(input);

  const oldQuote = await prisma.quote.findUnique({
    where: { id },
    select: {
      supplierId: true,
      price: true,
      currency: true,
      status: true,
      adminNotes: true,
      quoteFileUrl: true,
    },
  });
  if (!oldQuote) throw new Error('Quote not found');

  const updated = await prisma.quote.update({
    where: { id },
    data,
  });

  await logAdminAction({
    action: 'UPDATE_QUOTE',
    entity: 'Quote',
    entityId: id,
    changes: { before: oldQuote, after: updated },
  });

  revalidatePath(`/admin/quotes/${id}`);
  revalidatePath(`/admin/product-requests/${updated.requestId}`);
  revalidatePath('/admin/quotes');
  revalidatePath('/admin/product-requests');

  return { success: true };
}

// ----------------------------------------------------------------------
// Accept a quote (sets it as accepted on the product request)
// ----------------------------------------------------------------------
const acceptQuoteSchema = z.object({ quoteId: z.string() });

export async function acceptQuote(input: { quoteId: string }) {
  await requireAdmin();
  const { quoteId } = acceptQuoteSchema.parse(input);

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { requestId: true, status: true },
  });
  if (!quote) throw new Error('Quote not found');
  if (quote.status === 'ACCEPTED') throw new Error('Quote already accepted');

  const [updatedQuote, updatedRequest] = await prisma.$transaction([
    prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED' },
    }),
    prisma.productRequest.update({
      where: { id: quote.requestId },
      data: { acceptedQuoteId: quoteId, status: 'APPROVED' },
    }),
  ]);

  await logAdminAction({
    action: 'ACCEPT_QUOTE',
    entity: 'Quote',
    entityId: quoteId,
    changes: { before: { status: quote.status }, after: { status: 'ACCEPTED' } },
  });

  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath(`/admin/product-requests/${quote.requestId}`);
  revalidatePath('/admin/quotes');
  revalidatePath('/admin/product-requests');

  return { success: true };
}

// Get minimal request data for dropdown
export async function getRequestOptions() {
  await requireAdmin();
  const requests = await prisma.productRequest.findMany({
    take: 100, // limit for performance
    select: {
      id: true,
      productLink: true,
      description: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return requests.map(req => ({
    id: req.id,
    label: req.productLink
      ? req.productLink.slice(0, 30) + (req.productLink.length > 30 ? '...' : '')
      : req.description?.slice(0, 30) || req.id.slice(0, 8),
  }));
}

// Get minimal supplier data for dropdown
export async function getSupplierOptions() {
  await requireAdmin();
  const suppliers = await prisma.supplier.findMany({
    take: 100,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return suppliers;
}

// ----------------------------------------------------------------------
// Delete a quote
// ----------------------------------------------------------------------
const deleteQuoteSchema = z.object({ quoteId: z.string() });

export async function deleteQuote(input: { quoteId: string }) {
  await requireAdmin();
  const { quoteId } = deleteQuoteSchema.parse(input);

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { requestId: true, status: true },
  });
  if (!quote) throw new Error('Quote not found');
  if (quote.status === 'ACCEPTED') {
    throw new Error('Cannot delete an accepted quote');
  }

  await prisma.quote.delete({ where: { id: quoteId } });

  await logAdminAction({
    action: 'DELETE_QUOTE',
    entity: 'Quote',
    entityId: quoteId,
    changes: { deleted: true },
  });

  revalidatePath(`/admin/product-requests/${quote.requestId}`);
  revalidatePath('/admin/quotes');
  revalidatePath('/admin/product-requests');

  return { success: true };
}