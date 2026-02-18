// app/admin/(pages)/plans/actions.ts

'use server'

import { prisma } from '@/lib/prisma'
import { Prisma, SubscriptionPlan } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-guard'
import { logAdminAction } from '@/lib/audit'

// Validation schema for create/update
const planSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  displayName: z.string().min(1, { message: 'Display name is required' }),
  description: z.string().optional().nullable(),
  price: z.coerce.number().positive({ message: 'Price must be positive' }),
  currency: z.string().default('USD'),
  features: z.any(), // will be parsed as JSON
  isPopular: z.boolean().default(false),
  stripePriceId: z.string().optional().nullable(),
})

type GetPlansParams = {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

// Get plans with pagination, sorting, search
export async function getPlans(params: GetPlansParams = {}) {
  await requireAdmin()
  const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'desc', search } = params

  const where = search ? {
    OR: [
      { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
      { displayName: { contains: search, mode: Prisma.QueryMode.insensitive } },
      { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
    ],
  } : {}

  const total = await prisma.plan.count({ where })

  const plans = await prisma.plan.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  // Serialize Decimal price to number
  const serializedPlans = plans.map(plan => ({
    ...plan,
    price: plan.price.toNumber(), // Convert Decimal to number
  }))

  return {
    plans: serializedPlans,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// Get single plan by ID
export async function getPlanById(id: string) {
  await requireAdmin()
  return prisma.plan.findUnique({ where: { id } })
}

// Create new plan
export async function createPlan(formData: FormData) {
  await requireAdmin()
  const rawData = {
    name: formData.get('name') as string,
    displayName: formData.get('displayName') as string,
    description: formData.get('description') as string || null,
    price: formData.get('price'),
    currency: formData.get('currency') as string || 'USD',
    features: formData.get('features') as string,
    isPopular: formData.get('isPopular') === 'on',
    stripePriceId: formData.get('stripePriceId') as string || null,
  }

  // Parse features: assume textarea with one feature per line
  const featuresArray = rawData.features
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  const validated = planSchema.parse({
    ...rawData,
    features: featuresArray,
  })

  const plan = await prisma.plan.create({
    data: {
      name: validated.name,
      displayName: validated.displayName,
      description: validated.description,
      price: validated.price,
      currency: validated.currency,
      features: validated.features,
      isPopular: validated.isPopular,
      stripePriceId: validated.stripePriceId,
    },
  })

  await logAdminAction({
    action: 'CREATE_PLAN',
    entity: 'Plan',
    entityId: plan.id,
    changes: validated,
  })

  revalidatePath('/admin/plans')
  return { success: true, planId: plan.id }
}

// Update plan
export async function updatePlan(formData: FormData) {
  await requireAdmin()
  const id = formData.get('id') as string
  if (!id) throw new Error('Plan ID required')

  const rawData = {
    name: formData.get('name') as string,
    displayName: formData.get('displayName') as string,
    description: formData.get('description') as string || null,
    price: formData.get('price'),
    currency: formData.get('currency') as string || 'USD',
    features: formData.get('features') as string,
    isPopular: formData.get('isPopular') === 'on',
    stripePriceId: formData.get('stripePriceId') as string || null,
  }

  const featuresArray = rawData.features
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  const validated = planSchema.parse({
    ...rawData,
    features: featuresArray,
  })

  const plan = await prisma.plan.update({
    where: { id },
    data: {
      name: validated.name,
      displayName: validated.displayName,
      description: validated.description,
      price: validated.price,
      currency: validated.currency,
      features: validated.features,
      isPopular: validated.isPopular,
      stripePriceId: validated.stripePriceId,
    },
  })

  await logAdminAction({
    action: 'UPDATE_PLAN',
    entity: 'Plan',
    entityId: id,
    changes: validated,
  })

  revalidatePath('/admin/plans')
  return { success: true }
}

// Delete plan
export async function deletePlan(id: string) {
  await requireAdmin()
  const plan = await prisma.plan.findUnique({ where: { id } })
  if (!plan) throw new Error('Plan not found')

  // Check if plan.name is a valid SubscriptionPlan enum value
  const validPlans = Object.values(SubscriptionPlan)
  if (validPlans.includes(plan.name as SubscriptionPlan)) {
    const subscriptionsUsing = await prisma.subscription.count({
      where: { plan: plan.name as SubscriptionPlan },
    })
    if (subscriptionsUsing > 0) {
      throw new Error('Cannot delete plan because it has active subscriptions')
    }
  } else {
    // If not a valid enum, no subscriptions can reference it
    console.warn(`Plan name "${plan.name}" is not a valid SubscriptionPlan enum.`)
  }

  await prisma.plan.delete({ where: { id } })

  await logAdminAction({
    action: 'DELETE_PLAN',
    entity: 'Plan',
    entityId: id,
  })

  revalidatePath('/admin/plans')
  return { success: true }
}