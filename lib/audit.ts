// lib/audit.ts

import { prisma } from './prisma'
import { auth } from '@clerk/nextjs/server'

export async function logAdminAction({
  action,
  entity,
  entityId,
  changes,
}: {
  action: string
  entity: string
  entityId?: string
  changes?: any
}) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const admin = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true },
  })
  if (!admin || admin.role !== 'ADMIN') throw new Error('Forbidden')

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      action,
      entity,
      entityId,
      changes: changes ? JSON.parse(JSON.stringify(changes)) : undefined,
    },
  })
}