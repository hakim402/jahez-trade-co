'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// Get audit logs with pagination, sorting, and filters
export async function getAuditLogs({
  page = 1,
  pageSize = 20,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  adminId,
  entity,
  action,
  search,
  from,
  to,
}: {
  page?: number
  pageSize?: number
  sortBy?: 'createdAt' | 'admin.fullName' | 'entity' | 'action'
  sortOrder?: 'asc' | 'desc'
  adminId?: string
  entity?: string
  action?: string
  search?: string
  from?: Date
  to?: Date
}) {
  await requireAdmin()

  const skip = (page - 1) * pageSize
  const where: any = {}

  if (adminId) where.adminId = adminId
  if (entity) where.entity = entity
  if (action) where.action = { contains: action, mode: 'insensitive' }
  if (search) {
    where.OR = [
      { entity: { contains: search, mode: 'insensitive' } },
      { action: { contains: search, mode: 'insensitive' } },
      { entityId: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = from
    if (to) where.createdAt.lte = to
  }

  // Handle sorting by admin name
  let orderBy: any = {}
  if (sortBy === 'admin.fullName') {
    orderBy = { admin: { fullName: sortOrder } }
  } else {
    orderBy = { [sortBy]: sortOrder }
  }

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        admin: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ])

  return { logs, totalCount, pageCount: Math.ceil(totalCount / pageSize) }
}

// Get single audit log (for details drawer)
export async function getAuditLogById(logId: string) {
  await requireAdmin()
  return prisma.auditLog.findUnique({
    where: { id: logId },
    include: {
      admin: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
    },
  })
}

// Optional: get distinct entities for filter dropdown
export async function getDistinctEntities() {
  await requireAdmin()
  const results = await prisma.auditLog.findMany({
    select: { entity: true },
    distinct: ['entity'],
    orderBy: { entity: 'asc' },
  })
  return results.map(r => r.entity)
}

// Optional: get distinct actions for filter dropdown
export async function getDistinctActions() {
  await requireAdmin()
  const results = await prisma.auditLog.findMany({
    select: { action: true },
    distinct: ['action'],
    orderBy: { action: 'asc' },
  })
  return results.map(r => r.action)
}