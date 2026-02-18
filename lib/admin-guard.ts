// lib/admin-guard.ts

import { auth } from '@clerk/nextjs/server'
import { prisma } from './prisma'

export async function requireAdmin() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const admin = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true },
  })
  if (!admin || admin.role !== 'ADMIN') throw new Error('Forbidden')
  return admin.id
}