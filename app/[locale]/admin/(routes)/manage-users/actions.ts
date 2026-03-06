// app/[locale]/admin/(routes)/manage-users/actions.ts

'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';
import { Prisma, UserRole } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

const getUsersSchema = z.object({
  take: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['createdAt', 'email', 'fullName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const getUserByIdSchema = z.object({
  id: z.string().min(1),
});

const updateUserSchema = z.object({
  id: z.string().min(1),
  fullName: z.string().min(1).max(200).optional(),
  phone: z.string().max(30).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

const softDeleteUserSchema = z.object({
  id: z.string().min(1),
});

const banUserSchema = z.object({
  id: z.string().min(1),
  reason: z.string().max(500).optional(),
});

const sendNotificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.string().min(1).max(50),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// RETURN TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type GetUsersParams = z.infer<typeof getUsersSchema>;

export type UserListItem = {
  id: string;
  clerkId: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    requests: number;
    clientBookings: number;
    uploadedFiles: number;
    notifications: number;
  };
  subscription: {
    id: string;
    items: Array<{
      status: string;
      plan: { name: string; amount: number; currency: string; interval: string | null } | null;
    }>;
  } | null;
};

export type GetUsersReturn = {
  users: UserListItem[];
  nextCursor: string | null;
  total: number;
};

export type UserDetail = {
  id: string;
  clerkId: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isDeleted: boolean;
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
      isDefaultPlan: boolean;
      currentPeriodStart: Date | null;
      currentPeriodEnd: Date | null;
      trialEndsAt: Date | null;
      plan: {
        id: string;
        name: string;
        amount: number;
        currency: string;
        interval: string | null;
        intervalCount: number | null;
        trialPeriodDays: number | null;
        isDefault: boolean;
      } | null;
    }>;
    paymentAttempts: Array<{
      id: string;
      type: string;
      status: string;
      amount: number | null;
      currency: string;
      occurredAt: Date;
    }>;
  } | null;
  requests: Array<{
    id: string;
    status: string;
    priority: number;
    quantity: number;
    productLink: string | null;
    description: string | null;
    shippingCountry: string;
    createdAt: Date;
    _count: { quotes: number; files: number };
  }>;
  clientBookings: Array<{
    id: string;
    type: string;
    status: string;
    scheduledAt: Date | null;
    durationMinutes: number;
    meetingProvider: string | null;
    requestNotes: string | null;
    createdAt: Date;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    createdAt: Date;
  }>;
  _count: {
    requests: number;
    clientBookings: number;
    uploadedFiles: number;
    notifications: number;
    chatSessions: number;
    adminAuditLogs: number;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. LIST USERS
// ─────────────────────────────────────────────────────────────────────────────

export async function getUsers(
  rawParams: GetUsersParams
): Promise<ActionResult<GetUsersReturn>> {
  try {
    await requireAdmin(); // just gate — we don't need the id here

    const params = getUsersSchema.parse(rawParams);
    const { take, cursor, search, role, isActive, sortBy, sortOrder } = params;

    const where: Prisma.UserWhereInput = { isDeleted: false };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const [total, rawUsers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        take: take + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { [sortBy]: sortOrder } as Prisma.UserOrderByWithRelationInput,
        select: {
          id: true,
          clerkId: true,
          email: true,
          fullName: true,
          role: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              requests: true,
              clientBookings: true,
              uploadedFiles: true,
              notifications: true,
            },
          },
          subscription: {
            select: {
              id: true,
              items: {
                select: {
                  status: true,
                  plan: {
                    select: { name: true, amount: true, currency: true, interval: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    let nextCursor: string | null = null;
    if (rawUsers.length > take) nextCursor = rawUsers.pop()!.id;

    const users: UserListItem[] = rawUsers.map((u) => ({
      ...u,
      subscription: u.subscription
        ? {
          ...u.subscription,
          items: u.subscription.items.map((item) => ({
            ...item,
            plan: item.plan ? { ...item.plan, amount: Number(item.plan.amount) } : null,
          })),
        }
        : null,
    }));

    return { success: true, data: { users, nextCursor, total } };
  } catch (error) {
    console.error('[getUsers]', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET SINGLE USER
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserById(
  rawParams: { id: string }
): Promise<ActionResult<{ user: UserDetail }>> {
  try {
    await requireAdmin();

    const { id } = getUserByIdSchema.parse(rawParams);

    const user = await prisma.user.findUnique({
      where: { id, isDeleted: false },
      select: {
        id: true, clerkId: true, email: true, fullName: true, role: true,
        phone: true, avatarUrl: true, isActive: true, isDeleted: true,
        createdAt: true, updatedAt: true,
        _count: {
          select: {
            requests: true, clientBookings: true, uploadedFiles: true,
            notifications: true, chatSessions: true, adminAuditLogs: true,
          },
        },
        subscription: {
          select: {
            id: true, clerkSubscriptionId: true, createdAt: true,
            items: {
              select: {
                id: true, clerkItemId: true, status: true, isDefaultPlan: true,
                currentPeriodStart: true, currentPeriodEnd: true, trialEndsAt: true,
                plan: {
                  select: {
                    id: true, name: true, amount: true, currency: true,
                    interval: true, intervalCount: true, trialPeriodDays: true, isDefault: true,
                  },
                },
              },
            },
            paymentAttempts: {
              orderBy: { occurredAt: 'desc' },
              take: 10,
              select: { id: true, type: true, status: true, amount: true, currency: true, occurredAt: true },
            },
          },
        },
        requests: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true, status: true, priority: true, quantity: true,
            productLink: true, description: true, shippingCountry: true, createdAt: true,
            _count: { select: { quotes: true, files: true } },
          },
        },
        clientBookings: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true, type: true, status: true, scheduledAt: true,
            durationMinutes: true, meetingProvider: true, requestNotes: true, createdAt: true,
          },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, title: true, type: true, isRead: true, createdAt: true },
        },
        adminAuditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, action: true, entity: true, entityId: true, createdAt: true },
        },
      },
    });

    if (!user) return { success: false, error: 'User not found' };

    const serialised: UserDetail = {
      ...user,
      auditLogs: user.adminAuditLogs,
      subscription: user.subscription
        ? {
          ...user.subscription,
          items: user.subscription.items.map((item) => ({
            ...item,
            plan: item.plan ? { ...item.plan, amount: Number(item.plan.amount) } : null,
          })),
          paymentAttempts: user.subscription.paymentAttempts.map((p) => ({
            ...p,
            amount: p.amount !== null ? Number(p.amount) : null,
          })),
        }
        : null,
    };

    return { success: true, data: { user: serialised } };
  } catch (error) {
    console.error('[getUserById]', error);
    return { success: false, error: 'Failed to fetch user' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. UPDATE USER
// ─────────────────────────────────────────────────────────────────────────────

export async function updateUser(
  rawParams: z.infer<typeof updateUserSchema>
): Promise<ActionResult<{ userId: string }>> {
  try {
    // FIX: requireAdmin() returns the Prisma user.id directly — use it as adminId
    const adminId = await requireAdmin();

    const { id, fullName, phone, avatarUrl, role, isActive } =
      updateUserSchema.parse(rawParams);

    const target = await prisma.user.findUnique({
      where: { id, isDeleted: false },
      select: { id: true, clerkId: true },
    });
    if (!target) return { success: false, error: 'User not found' };

    const data: Prisma.UserUpdateInput = {
      ...(fullName !== undefined && { fullName }),
      ...(phone !== undefined && { phone }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(role !== undefined && { role }),
      ...(isActive !== undefined && { isActive }),
    };

    const clerk = await clerkClient();

    const [updatedUser] = await Promise.all([
      prisma.user.update({ where: { id }, data }),
      role !== undefined
        ? clerk.users.updateUserMetadata(target.clerkId, { publicMetadata: { role } })
        : Promise.resolve(),
    ]);

    await prisma.auditLog.create({
      data: {
        adminId,   // ← Prisma UUID directly from requireAdmin()
        action: 'UPDATE_USER',
        entity: 'User',
        entityId: id,
        changes: data as Prisma.InputJsonValue,
      },
    });

    return { success: true, data: { userId: updatedUser.id } };
  } catch (error) {
    console.error('[updateUser]', error);
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message };
    return { success: false, error: 'Failed to update user' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SOFT DELETE USER
// ─────────────────────────────────────────────────────────────────────────────

export async function softDeleteUser(
  rawParams: { id: string }
): Promise<ActionResult<{ userId: string }>> {
  try {
    const adminId = await requireAdmin(); // FIX: Prisma UUID directly

    const { id } = softDeleteUserSchema.parse(rawParams);

    const target = await prisma.user.findUnique({
      where: { id, isDeleted: false },
      select: { id: true, clerkId: true },
    });
    if (!target) return { success: false, error: 'User not found' };

    const clerk = await clerkClient();

    await Promise.all([
      prisma.user.update({ where: { id }, data: { isDeleted: true, isActive: false } }),
      clerk.users.banUser(target.clerkId),
    ]);

    await prisma.auditLog.create({
      data: {
        adminId,   // ← Prisma UUID directly
        action: 'DELETE_USER',
        entity: 'User',
        entityId: id,
        changes: { reason: 'Admin soft delete + Clerk ban' } satisfies Prisma.InputJsonValue,
      },
    });

    return { success: true, data: { userId: id } };
  } catch (error) {
    console.error('[softDeleteUser]', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. BAN USER
// ─────────────────────────────────────────────────────────────────────────────

export async function banUser(
  rawParams: { id: string; reason?: string }
): Promise<ActionResult<{ userId: string }>> {
  try {
    const adminId = await requireAdmin(); // FIX: Prisma UUID directly

    const { id, reason } = banUserSchema.parse(rawParams);

    const target = await prisma.user.findUnique({
      where: { id, isDeleted: false },
      select: { id: true, clerkId: true },
    });
    if (!target) return { success: false, error: 'User not found' };

    const clerk = await clerkClient();

    await Promise.all([
      clerk.users.banUser(target.clerkId),
      prisma.user.update({ where: { id }, data: { isActive: false } }),
    ]);

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'BAN_USER',
        entity: 'User',
        entityId: id,
        changes: { reason: reason ?? 'No reason provided' } satisfies Prisma.InputJsonValue,
      },
    });

    return { success: true, data: { userId: id } };
  } catch (error) {
    console.error('[banUser]', error);
    return { success: false, error: 'Failed to ban user' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. UNBAN USER
// ─────────────────────────────────────────────────────────────────────────────

export async function unbanUser(
  rawParams: { id: string }
): Promise<ActionResult<{ userId: string }>> {
  try {
    const adminId = await requireAdmin(); // FIX: Prisma UUID directly

    const { id } = getUserByIdSchema.parse(rawParams);

    const target = await prisma.user.findUnique({
      where: { id, isDeleted: false },
      select: { id: true, clerkId: true },
    });
    if (!target) return { success: false, error: 'User not found' };

    const clerk = await clerkClient();

    await Promise.all([
      clerk.users.unbanUser(target.clerkId),
      prisma.user.update({ where: { id }, data: { isActive: true } }),
    ]);

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'UNBAN_USER',
        entity: 'User',
        entityId: id,
        changes: Prisma.JsonNull,
      },
    });

    return { success: true, data: { userId: id } };
  } catch (error) {
    console.error('[unbanUser]', error);
    return { success: false, error: 'Failed to unban user' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. IMPERSONATE USER
// ─────────────────────────────────────────────────────────────────────────────

export async function impersonateUser(
  rawParams: { id: string }
): Promise<ActionResult<{ signInToken: string; expiresAt: number }>> {
  try {
    const adminId = await requireAdmin(); // FIX: Prisma UUID directly

    const { id } = getUserByIdSchema.parse(rawParams);

    const target = await prisma.user.findUnique({
      where: { id, isDeleted: false },
      select: { id: true, clerkId: true, email: true },
    });
    if (!target) return { success: false, error: 'User not found' };

    const clerk = await clerkClient();
    const token = await clerk.signInTokens.createSignInToken({
      userId: target.clerkId,
      expiresInSeconds: 60,
    });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'IMPERSONATE_USER',
        entity: 'User',
        entityId: id,
        changes: { targetEmail: target.email } satisfies Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      data: { signInToken: token.token, expiresAt: token.createdAt + 60_000 },
    };
  } catch (error) {
    console.error('[impersonateUser]', error);
    return { success: false, error: 'Failed to generate impersonation token' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. SEND NOTIFICATION TO USER
// ─────────────────────────────────────────────────────────────────────────────

export async function sendNotificationToUser(
  rawParams: z.infer<typeof sendNotificationSchema>
): Promise<ActionResult<{ notificationId: string }>> {
  try {
    const adminId = await requireAdmin(); // FIX: Prisma UUID directly

    const { userId, title, message, type, metadata } =
      sendNotificationSchema.parse(rawParams);

    const target = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      select: { id: true },
    });
    if (!target) return { success: false, error: 'User not found' };

    const notification = await prisma.notification.create({
      data: { userId, title, message, type, metadata: (metadata ?? {}) as Prisma.InputJsonValue },
    });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'SEND_NOTIFICATION',
        entity: 'User',
        entityId: userId,
        changes: { title, type } satisfies Prisma.InputJsonValue,
      },
    });

    return { success: true, data: { notificationId: notification.id } };
  } catch (error) {
    console.error('[sendNotificationToUser]', error);
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message };
    return { success: false, error: 'Failed to send notification' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. USER ACTIVITY SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

export type UserActivitySummary = {
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    changes: unknown;
    createdAt: Date;
  }>;
  unreadNotifications: number;
  totalNotifications: number;
  totalChatSessions: number;
  totalChatMessages: number;
};

export async function getUserActivitySummary(
  rawParams: { id: string }
): Promise<ActionResult<UserActivitySummary>> {
  try {
    await requireAdmin();

    const { id } = getUserByIdSchema.parse(rawParams);

    const [
      recentAuditLogs,
      unreadNotifications,
      totalNotifications,
      totalChatSessions,
      totalChatMessages,
    ] = await Promise.all([
      prisma.auditLog.findMany({
        where: { adminId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, action: true, entity: true, entityId: true, changes: true, createdAt: true },
      }),
      prisma.notification.count({ where: { userId: id, isRead: false } }),
      prisma.notification.count({ where: { userId: id } }),
      prisma.chatSession.count({ where: { userId: id } }),
      prisma.chatMessage.count({ where: { session: { userId: id } } }),
    ]);

    return {
      success: true,
      data: { recentAuditLogs, unreadNotifications, totalNotifications, totalChatSessions, totalChatMessages },
    };
  } catch (error) {
    console.error('[getUserActivitySummary]', error);
    return { success: false, error: 'Failed to fetch user activity' };
  }
}