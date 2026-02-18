'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { UserRole, SubscriptionStatus } from '@prisma/client'
import { requireAdmin } from '@/lib/admin-guard'
import { logAdminAction } from '@/lib/audit'

// ---------- LIST USERS (with pagination, sorting, filtering) ----------
export async function getUsers({
  page = 1,
  pageSize = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  role,
  search,
  subscriptionStatus,
  dateFrom,
  dateTo,
}: {
  page?: number
  pageSize?: number
  sortBy?: 'createdAt' | 'fullName' | 'email' | 'role'
  sortOrder?: 'asc' | 'desc'
  role?: UserRole
  search?: string
  subscriptionStatus?: SubscriptionStatus
  dateFrom?: Date
  dateTo?: Date
}) {
  await requireAdmin()

  const skip = (page - 1) * pageSize
  const where = {
    ...(role && { role }),
    ...(search && {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(subscriptionStatus && {
      subscriptions: {
        some: { status: subscriptionStatus },
      },
    }),
    ...((dateFrom || dateTo) && {
      createdAt: {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo }),
      },
    }),
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            requests: true,
            bookings: true,
            subscriptions: true,
            payments: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1, // latest subscription
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ])

  return {
    users,
    totalCount,
    pageCount: Math.ceil(totalCount / pageSize),
  }
}

// ---------- GET SINGLE USER (for details drawer) ----------
export async function getUserById(userId: string) {
  await requireAdmin()
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        orderBy: { createdAt: 'desc' },
      },
      requests: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      bookings: {
        orderBy: { scheduledAt: 'desc' },
        take: 5,
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      _count: {
        select: {
          requests: true,
          bookings: true,
          subscriptions: true,
          payments: true,
        },
      },
    },
  })
}

// ---------- UPDATE USER ROLE ----------
export async function updateUserRole(userId: string, role: UserRole) {
  const adminId = await requireAdmin()
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  })
  await logAdminAction({
    action: 'UPDATE_USER_ROLE',
    entity: 'User',
    entityId: userId,
    changes: { role },
  })
  revalidatePath('/admin/clients')
  return user
}

// ---------- DELETE USER ----------
export async function deleteUser(userId: string) {
  const adminId = await requireAdmin()
  await prisma.user.delete({ where: { id: userId } })
  await logAdminAction({
    action: 'DELETE_USER',
    entity: 'User',
    entityId: userId,
  })
  revalidatePath('/admin/clients')
}

// ---------- BULK DELETE USERS (optional) ----------
export async function deleteUsers(userIds: string[]) {
  const adminId = await requireAdmin()
  await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  })
  await logAdminAction({
    action: 'BULK_DELETE_USERS',
    entity: 'User',
    changes: { count: userIds.length, ids: userIds },
  })
  revalidatePath('/admin/clients')
}