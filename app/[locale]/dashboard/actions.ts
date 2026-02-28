'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const profileUpdateSchema = z.object({
  fullName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
})

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

export async function getUserProfile() {
  const userId = await getCurrentUserId()
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          requests: true,
          bookings: true,
        },
      },
      subscriptions: {
        include: {
          items: {
            include: {
              plan: true,
              paymentAttempts: { select: { id: true } },
            },
          },
        },
      },
    },
  })
  if (!user) throw new Error('User not found')

  const totalPaymentAttempts = user.subscriptions.reduce(
    (acc, sub) => acc + sub.items.reduce((itemAcc, item) => itemAcc + item.paymentAttempts.length, 0),
    0
  )

  const activeSubscription = user.subscriptions
    .flatMap(sub => sub.items)
    .find(item => item.status === 'ACTIVE')

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
    _count: {
      requests: user._count.requests,
      bookings: user._count.bookings,
      payments: totalPaymentAttempts,
    },
    subscription: activeSubscription
      ? {
          planName: activeSubscription.plan?.name || 'Free Plan',
          status: activeSubscription.status,
          currentPeriodStart: activeSubscription.currentPeriodStart,
          currentPeriodEnd: activeSubscription.currentPeriodEnd,
          isDefaultPlan: activeSubscription.isDefaultPlan,
        }
      : null,
  }
}

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