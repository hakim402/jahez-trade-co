'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schema
const profileUpdateSchema = z.object({
  fullName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
})

// Helper to get current user ID
async function getCurrentUserId() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) throw new Error('User not found')
  return user.id
}

// Get full profile with counts
export async function getUserProfile() {
  const userId = await getCurrentUserId()
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      stripeCustomerId: true,
      _count: {
        select: {
          requests: true,
          bookings: true,
          payments: true,
        },
      },
    },
  })
  if (!user) throw new Error('User not found')
  return user
}

// Update profile (name and phone only)
export async function updateUserProfile(formData: FormData) {
  const userId = await getCurrentUserId()
  const rawData = {
    fullName: formData.get('fullName') as string | null,
    phone: formData.get('phone') as string | null,
  }
  const validated = profileUpdateSchema.parse(rawData)

  await prisma.user.update({
    where: { id: userId },
    data: validated,
  })

  revalidatePath('/dashboard')
  return { success: true }
}