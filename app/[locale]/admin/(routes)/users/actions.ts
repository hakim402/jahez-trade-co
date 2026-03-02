'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

/* ============================================================================
   VALIDATION SCHEMAS
   ============================================================================ */

const getUsersSchema = z.object({
  take: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'CLIENT']).optional(),
  sortBy: z.enum(['createdAt', 'email', 'fullName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GetUsersParams = z.infer<typeof getUsersSchema>;

export type GetUsersReturn = {
  users: Array<{
    id: string;
    clerkId: string;
    email: string;
    fullName: string | null;
    role: 'ADMIN' | 'CLIENT';
    phone: string | null;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      requests: number;
      clientBookings: number;      // bookings where user is client
      // subscription is a single relation, so we don't include it in _count
    };
  }>;
  nextCursor: string | null;
  total: number;
};

/* ============================================================================
   GET USERS (Admin Only)
   ============================================================================ */

export async function getUsers(
  rawParams: GetUsersParams
): Promise<GetUsersReturn> {
  await requireAdmin();

  const params = getUsersSchema.parse(rawParams);
  const { take, cursor, search, role, sortBy, sortOrder } = params;

  const where: Prisma.UserWhereInput = { isDeleted: false }; // exclude soft-deleted users

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  const total = await prisma.user.count({ where });

  const orderBy: Prisma.UserOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

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
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          requests: true,
          clientBookings: true,    // renamed from bookings
          // subscription is not a list, so excluded
        },
      },
    },
  });

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
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    subscription: {
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
          amount: number; // serialized
          currency: string;
        } | null;
      }>;
    } | null;
    requests: Array<{
      id: string;
      status: string;
      createdAt: Date;
      productLink: string | null;
      description: string | null;
    }>;
    clientBookings: Array<{
      id: string;
      status: string;
      scheduledAt: Date | null;
      createdAt: Date;
      type: string;
      meetingProvider?: string | null;
    }>;
    // Optionally include handled bookings if needed
    // handledBookings: Array<{ ... }>;
  };
};

export async function getUserById(
  rawParams: { id: string }
): Promise<GetUserByIdReturn> {
  await requireAdmin();

  const { id } = getUserByIdSchema.parse(rawParams);

  const user = await prisma.user.findUnique({
    where: { id, isDeleted: false },
    select: {
      id: true,
      clerkId: true,
      email: true,
      fullName: true,
      role: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      subscription: {
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
      clientBookings: {
        select: {
          id: true,
          status: true,
          scheduledAt: true,
          createdAt: true,
          type: true,
          meetingProvider: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      // If you need bookings handled by this user (as admin):
      // handledBookings: { ... }
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Convert Decimal to number
  const convertedUser = {
    ...user,
    subscription: user.subscription
      ? {
          ...user.subscription,
          items: user.subscription.items.map((item) => ({
            ...item,
            plan: item.plan
              ? {
                  ...item.plan,
                  amount: Number(item.plan.amount),
                }
              : null,
          })),
        }
      : null,
  };

  return { user: convertedUser as GetUserByIdReturn['user'] };
}