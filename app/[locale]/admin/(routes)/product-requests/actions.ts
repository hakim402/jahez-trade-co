// app/[locale]/admin(routes)/product-requests/actions.ts

// app/[locale]/admin/product-requests/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { logAdminAction } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma, RequestStatus } from '@prisma/client';

// Validation schemas
const getRequestsSchema = z.object({
  take: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  search: z.string().optional(),
  status: z.nativeEnum(RequestStatus).optional(),
  assignedStaffId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GetRequestsParams = z.infer<typeof getRequestsSchema>;

export type GetRequestsReturn = {
  requests: Array<{
    id: string;
    productLink: string | null;
    description: string | null;
    quantity: number;
    shippingCountry: string;
    status: RequestStatus;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      fullName: string | null;
      avatarUrl: string | null,
      email: string;
    };
    assignedStaff: {
      id: string;
      fullName: string | null;
      avatarUrl: string | null,
      email: string;
    } | null;
    _count: {
      quotes: number;
      files: number;
    };
  }>;
  nextCursor: string | null;
  total: number;
};

export async function getProductRequests(
  rawParams: GetRequestsParams
): Promise<GetRequestsReturn> {
  await requireAdmin();

  const params = getRequestsSchema.parse(rawParams);
  const { take, cursor, search, status, assignedStaffId, sortBy, sortOrder } = params;

  const where: Prisma.ProductRequestWhereInput = {};
  if (search) {
    where.OR = [
      { productLink: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { fullName: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (status) where.status = status;
  if (assignedStaffId) where.assignedStaffId = assignedStaffId;

  const total = await prisma.productRequest.count({ where });

  const orderBy: Prisma.ProductRequestOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  const requests = await prisma.productRequest.findMany({
    take: take + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    where,
    orderBy,
    select: {
      id: true,
      productLink: true,
      description: true,
      quantity: true,
      shippingCountry: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, fullName: true, email: true, avatarUrl: true, } },
      assignedStaff: { select: { id: true, fullName: true, email: true } },
      _count: { select: { quotes: true, files: true } },
    },
  });

  let nextCursor: string | null = null;
  if (requests.length > take) {
    const nextItem = requests.pop();
    nextCursor = nextItem!.id;
  }

  return {
    requests: requests as GetRequestsReturn['requests'],
    nextCursor,
    total,
  };
}

// ----------------------------------------------------------------------
// Get single request with full details (Decimal conversion)
// ----------------------------------------------------------------------
const getRequestByIdSchema = z.object({ id: z.string() });

export type GetRequestByIdReturn = {
  request: {
    id: string;
    productLink: string | null;
    description: string | null;
    quantity: number;
    shippingCountry: string;
    customNotes: string | null;
    adminNotes: string | null;
    status: RequestStatus;
    quotedAt: Date | null;
    acceptedQuoteId: string | null;
    parsedLinkData: Prisma.JsonValue;
    aiDetectedCategory: string | null;
    aiDetectedAttributes: Prisma.JsonValue;
    aiEstimatedPrice: number | null; // converted
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      fullName: string | null;
      email: string;
      avatarUrl: string | null,
      phone: string | null;
    };
    assignedStaff: {
      id: string;
      fullName: string | null;
      avatarUrl: string | null,
      email: string;
    } | null;
    quotes: Array<{
      id: string;
      price: number; // converted
      currency: string;
      status: string;
      adminNotes: string | null;
      quoteFileUrl: string | null;
      createdAt: Date;
      supplier: { id: string; name: string } | null;
    }>;
    files: Array<{
      id: string;
      url: string;
      fileType: string;
      fileName: string | null;
      fileSize: number | null;
      uploadedAt: Date;
    }>;
    aiSuggestions: Array<{
      id: string;
      estimatedPrice: number; // converted
      currency: string;
      confidence: number | null;
      suggestedSupplierIds: Prisma.JsonValue;
      createdAt: Date;
    }>;
  };
};

export async function getProductRequestById(rawParams: { id: string }): Promise<GetRequestByIdReturn> {
  await requireAdmin();

  const { id } = getRequestByIdSchema.parse(rawParams);

  const request = await prisma.productRequest.findUnique({
    where: { id },
    select: {
      id: true,
      productLink: true,
      description: true,
      quantity: true,
      shippingCountry: true,
      customNotes: true,
      adminNotes: true,
      status: true,
      quotedAt: true,
      acceptedQuoteId: true,
      parsedLinkData: true,
      aiDetectedCategory: true,
      aiDetectedAttributes: true,
      aiEstimatedPrice: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, fullName: true, email: true, phone: true } },
      assignedStaff: { select: { id: true, fullName: true, email: true } },
      quotes: {
        select: {
          id: true,
          price: true,
          currency: true,
          status: true,
          adminNotes: true,
          quoteFileUrl: true,
          createdAt: true,
          supplier: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      files: {
        select: {
          id: true,
          url: true,
          fileType: true,
          fileName: true,
          fileSize: true,
          uploadedAt: true,
        },
        orderBy: { uploadedAt: 'desc' },
      },
      aiSuggestions: {
        select: {
          id: true,
          estimatedPrice: true,
          currency: true,
          confidence: true,
          suggestedSupplierIds: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!request) throw new Error('Product request not found');

  // Convert Decimal fields to numbers
  const converted = {
    ...request,
    aiEstimatedPrice: request.aiEstimatedPrice ? Number(request.aiEstimatedPrice) : null,
    quotes: request.quotes.map(q => ({
      ...q,
      price: Number(q.price),
    })),
    aiSuggestions: request.aiSuggestions.map(s => ({
      ...s,
      estimatedPrice: Number(s.estimatedPrice),
    })),
  };

  return { request: converted as GetRequestByIdReturn['request'] };
}

// ----------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------
const updateStatusSchema = z.object({
  requestId: z.string(),
  status: z.nativeEnum(RequestStatus),
  adminNotes: z.string().optional(),
});

export async function updateRequestStatus(input: {
  requestId: string;
  status: RequestStatus;
  adminNotes?: string;
}) {
  await requireAdmin();

  const { requestId, status, adminNotes } = updateStatusSchema.parse(input);

  const oldRequest = await prisma.productRequest.findUnique({
    where: { id: requestId },
    select: { status: true, adminNotes: true, quotedAt: true },
  });

  const updated = await prisma.productRequest.update({
    where: { id: requestId },
    data: {
      status,
      ...(adminNotes !== undefined && { adminNotes }),
      ...(status === 'QUOTED' && !oldRequest?.quotedAt && { quotedAt: new Date() }),
    },
  });

  await logAdminAction({
    action: 'UPDATE_REQUEST_STATUS',
    entity: 'ProductRequest',
    entityId: requestId,
    changes: { before: oldRequest, after: updated },
  });

  revalidatePath(`/admin/product-requests/${requestId}`);
  revalidatePath('/admin/product-requests');

  return { success: true };
}

const assignStaffSchema = z.object({
  requestId: z.string(),
  staffId: z.string().nullable(),
});

export async function assignStaff(input: {
  requestId: string;
  staffId: string | null;
}) {
  await requireAdmin();

  const { requestId, staffId } = assignStaffSchema.parse(input);

  const oldRequest = await prisma.productRequest.findUnique({
    where: { id: requestId },
    select: { assignedStaffId: true },
  });

  const updated = await prisma.productRequest.update({
    where: { id: requestId },
    data: { assignedStaffId: staffId },
  });

  await logAdminAction({
    action: 'ASSIGN_STAFF',
    entity: 'ProductRequest',
    entityId: requestId,
    changes: { before: oldRequest, after: updated },
  });

  revalidatePath(`/admin/product-requests/${requestId}`);
  revalidatePath('/admin/product-requests');

  return { success: true };
}

const addAdminNotesSchema = z.object({
  requestId: z.string(),
  adminNotes: z.string(),
});

export async function addAdminNotes(input: {
  requestId: string;
  adminNotes: string;
}) {
  await requireAdmin();

  const { requestId, adminNotes } = addAdminNotesSchema.parse(input);

  const oldRequest = await prisma.productRequest.findUnique({
    where: { id: requestId },
    select: { adminNotes: true },
  });

  const updated = await prisma.productRequest.update({
    where: { id: requestId },
    data: { adminNotes },
  });

  await logAdminAction({
    action: 'UPDATE_ADMIN_NOTES',
    entity: 'ProductRequest',
    entityId: requestId,
    changes: { before: oldRequest, after: updated },
  });

  revalidatePath(`/admin/product-requests/${requestId}`);
  revalidatePath('/admin/product-requests');

  return { success: true };
}

// Placeholder for AI-related actions (to be implemented later by another developer)
// export async function runAIAnalysis(requestId: string) { ... }
// export async function acceptAISuggestion(suggestionId: string) { ... }