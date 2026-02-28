// app/[locale]/admin/users/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

/* ============================================================================
   VALIDATION SCHEMAS
   ============================================================================ */

/**
 * Schema for validating and normalizing query parameters
 * used when listing users in the admin panel.
 *
 * Supports:
 * - Cursor-based pagination
 * - Search (email / full name)
 * - Role filtering
 * - Sorting configuration
 */
const getUsersSchema = z.object({
  take: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'CLIENT']).optional(),
  sortBy: z.enum(['createdAt', 'email', 'fullName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GetUsersParams = z.infer<typeof getUsersSchema>;

/**
 * Standardized return shape for the paginated users list.
 * Includes:
 * - Users data
 * - Cursor for next page
 * - Total count (for UI pagination controls)
 */
export type GetUsersReturn = {
  users: Array<{
    id: string;
    clerkId: string;
    email: string;
    fullName: string | null;
    role: 'ADMIN' | 'CLIENT';
    phone: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      requests: number;
      bookings: number;
      subscriptions: number;
    };
  }>;
  nextCursor: string | null;
  total: number;
};

/* ============================================================================
   GET USERS (Admin Only)
   Cursor-based pagination with filtering and sorting.
   This action is intentionally uncached.
   ============================================================================ */

export async function getUsers(
  rawParams: GetUsersParams
): Promise<GetUsersReturn> {
  // Ensure only ADMIN users can access this action
  await requireAdmin();

  // Validate and normalize incoming parameters
  const params = getUsersSchema.parse(rawParams);
  const { take, cursor, search, role, sortBy, sortOrder } = params;

  // Build dynamic Prisma where clause
  const where: Prisma.UserWhereInput = {};

  // Search by email or full name (case-insensitive)
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Filter by role if provided
  if (role) {
    where.role = role;
  }

  // Total count for pagination UI
  const total = await prisma.user.count({ where });

  // Dynamic sorting configuration
  const orderBy: Prisma.UserOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  // Fetch one extra record to determine if next page exists
  const users = await prisma.user.findMany({
    take: take + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    where,
    orderBy,
    select: {
      id: true,
      clerkId: true,
      email: true,
      fullName: true,
      role: true,
      phone: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          requests: true,
          bookings: true,
          subscriptions: true,
        },
      },
    },
  });

  // Determine next cursor
  let nextCursor: string | null = null;
  if (users.length > take) {
    const nextItem = users.pop();
    nextCursor = nextItem!.id;
  }

  return {
    users: users as GetUsersReturn['users'],
    nextCursor,
    total,
  };
}

/* ============================================================================
   GET SINGLE USER BY ID (Admin Only)
   Includes related subscriptions, requests, and bookings.
   Decimal fields are converted to plain numbers for safe serialization.
   ============================================================================ */

const getUserByIdSchema = z.object({ id: z.string() });

export type GetUserByIdReturn = {
  user: {
    id: string;
    clerkId: string;
    email: string;
    fullName: string | null;
    role: 'ADMIN' | 'CLIENT';
    phone: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    subscriptions: Array<{
      id: string;
      clerkSubscriptionId: string;
      createdAt: Date;
      items: Array<{
        id: string;
        clerkItemId: string;
        status: string;
        plan?: {
          id: string;
          name: string;
          amount: number; // Serialized as number for client safety
          currency: string;
        } | null;
      }>;
    }>;
    requests: Array<{
      id: string;
      status: string;
      createdAt: Date;
      productLink: string | null;
      description: string | null;
    }>;
    bookings: Array<{
      id: string;
      status: string;
      scheduledAt: Date | null;
      createdAt: Date;
      supplier: {
        id: string;
        name: string;
      } | null;
    }>;
  };
};

export async function getUserById(
  rawParams: { id: string }
): Promise<GetUserByIdReturn> {
  // Ensure only ADMIN users can access this action
  await requireAdmin();

  // Validate input
  const { id } = getUserByIdSchema.parse(rawParams);

  // Fetch user with related data
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      clerkId: true,
      email: true,
      fullName: true,
      role: true,
      phone: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      subscriptions: {
        select: {
          id: true,
          clerkSubscriptionId: true,
          createdAt: true,
          items: {
            select: {
              id: true,
              clerkItemId: true,
              status: true,
              plan: {
                select: {
                  id: true,
                  name: true,
                  amount: true,
                  currency: true,
                },
              },
            },
          },
        },
      },
      requests: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          productLink: true,
          description: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      bookings: {
        select: {
          id: true,
          status: true,
          scheduledAt: true,
          createdAt: true,
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  /**
   * Convert Prisma Decimal fields into plain numbers
   * to prevent serialization issues when sending data
   * from Server Actions to Client Components.
   */
  const convertedUser = {
    ...user,
    subscriptions: user.subscriptions.map(sub => ({
      ...sub,
      items: sub.items.map(item => ({
        ...item,
        plan: item.plan
          ? {
              ...item.plan,
              amount: Number(item.plan.amount), // Decimal → number
            }
          : null,
      })),
    })),
  };

  return { user: convertedUser as GetUserByIdReturn['user'] };
}