'use server'

// app/[locale]/admin/(routes)/audit/actions.ts

import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type AuditLogWithAdmin = Prisma.AuditLogGetPayload<{
  include: {
    admin: {
      select: {
        id: true
        fullName: true
        email: true
        avatarUrl: true
        role: true
      }
    }
  }
}>

export interface GetAuditLogsParams {
  page?: number
  pageSize?: number
  search?: string          // searches action, entity, entityId
  entity?: string          // filter by entity type e.g. "ProductRequest"
  action?: string          // filter by action e.g. "UPDATE_REQUEST"
  adminId?: string         // filter by admin user id (db id)
  dateFrom?: string        // ISO string
  dateTo?: string          // ISO string
}

export interface GetAuditLogsResult {
  logs: AuditLogWithAdmin[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AuditStatsResult {
  totalLogs: number
  uniqueAdmins: number
  uniqueEntities: string[]
  uniqueActions: string[]
  actionsBreakdown: { action: string; _count: number }[]
  entitiesBreakdown: { entity: string; _count: number }[]
  logsLast7Days: number
  logsLast30Days: number
}

// ─────────────────────────────────────────────────────────────────────────────
// GET AUDIT LOGS (paginated + filtered)
// ─────────────────────────────────────────────────────────────────────────────

export async function getAuditLogs(
  params: GetAuditLogsParams = {}
): Promise<GetAuditLogsResult> {
  await requireAdmin()

  const {
    page = 1,
    pageSize = 20,
    search,
    entity,
    action,
    adminId,
    dateFrom,
    dateTo,
  } = params

  const safePage = Math.max(1, page)
  const safePageSize = Math.min(100, Math.max(1, pageSize))
  const skip = (safePage - 1) * safePageSize

  const where: Prisma.AuditLogWhereInput = {
    ...(entity && { entity }),
    ...(action && { action }),
    ...(adminId && { adminId }),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(dateTo) }),
          },
        }
      : {}),
    ...(search && {
      OR: [
        { action: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
        {
          admin: {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ],
    }),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: safePageSize,
      include: {
        admin: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    logs,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(total / safePageSize),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE AUDIT LOG ENTRY
// ─────────────────────────────────────────────────────────────────────────────

export async function getAuditLogById(
  id: string
): Promise<AuditLogWithAdmin | null> {
  await requireAdmin()

  return prisma.auditLog.findUnique({
    where: { id },
    include: {
      admin: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// GET AUDIT LOGS FOR A SPECIFIC ENTITY RECORD
// ─────────────────────────────────────────────────────────────────────────────

export async function getAuditLogsForEntity(
  entity: string,
  entityId: string
): Promise<AuditLogWithAdmin[]> {
  await requireAdmin()

  return prisma.auditLog.findMany({
    where: { entity, entityId },
    orderBy: { createdAt: 'desc' },
    include: {
      admin: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// GET AUDIT LOGS BY ADMIN
// ─────────────────────────────────────────────────────────────────────────────

export async function getAuditLogsByAdmin(
  adminId: string,
  limit = 50
): Promise<AuditLogWithAdmin[]> {
  await requireAdmin()

  return prisma.auditLog.findMany({
    where: { adminId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      admin: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// GET AUDIT STATS (dashboard summary)
// ─────────────────────────────────────────────────────────────────────────────

export async function getAuditStats(): Promise<AuditStatsResult> {
  await requireAdmin()

  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)

  const [
    totalLogs,
    uniqueAdminsRaw,
    actionsBreakdownRaw,
    entitiesBreakdownRaw,
    logsLast7Days,
    logsLast30Days,
  ] = await Promise.all([
    prisma.auditLog.count(),

    prisma.auditLog.groupBy({
      by: ['adminId'],
    }),

    prisma.auditLog.groupBy({
      by: ['action'],
      _count: true,
      orderBy: { _count: { action: 'desc' } },
    }),

    prisma.auditLog.groupBy({
      by: ['entity'],
      _count: true,
      orderBy: { _count: { entity: 'desc' } },
    }),

    prisma.auditLog.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),

    prisma.auditLog.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
  ])

  return {
    totalLogs,
    uniqueAdmins: uniqueAdminsRaw.length,
    uniqueEntities: entitiesBreakdownRaw.map((e) => e.entity),
    uniqueActions: actionsBreakdownRaw.map((a) => a.action),
    actionsBreakdown: actionsBreakdownRaw.map((a) => ({
      action: a.action,
      _count: a._count,
    })),
    entitiesBreakdown: entitiesBreakdownRaw.map((e) => ({
      entity: e.entity,
      _count: e._count,
    })),
    logsLast7Days,
    logsLast30Days,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET FILTER OPTIONS (for dropdowns in the UI)
// ─────────────────────────────────────────────────────────────────────────────

export interface AuditFilterOptions {
  entities: string[]
  actions: string[]
  admins: { id: string; fullName: string | null; email: string }[]
}

export async function getAuditFilterOptions(): Promise<AuditFilterOptions> {
  await requireAdmin()

  const [entitiesRaw, actionsRaw, adminsRaw] = await Promise.all([
    prisma.auditLog.groupBy({ by: ['entity'], orderBy: { entity: 'asc' } }),
    prisma.auditLog.groupBy({ by: ['action'], orderBy: { action: 'asc' } }),
    prisma.auditLog.findMany({
      distinct: ['adminId'],
      select: {
        admin: {
          select: { id: true, fullName: true, email: true },
        },
      },
    }),
  ])

  return {
    entities: entitiesRaw.map((e) => e.entity),
    actions: actionsRaw.map((a) => a.action),
    admins: adminsRaw
      .map((r) => r.admin)
      .filter((a): a is { id: string; fullName: string | null; email: string } =>
        Boolean(a)
      ),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE AUDIT LOG (hard delete — use sparingly)
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteAuditLog(id: string): Promise<void> {
  await requireAdmin()

  await prisma.auditLog.delete({ where: { id } })
}

// ─────────────────────────────────────────────────────────────────────────────
// PURGE OLD AUDIT LOGS (retention policy helper)
// Returns the number of deleted records.
// ─────────────────────────────────────────────────────────────────────────────

export async function purgeAuditLogsBefore(
  beforeDate: Date
): Promise<number> {
  await requireAdmin()

  const result = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: beforeDate } },
  })

  return result.count
}