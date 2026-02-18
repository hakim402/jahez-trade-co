// app/_components/Pricing/actions.ts

'use server'

import { prisma } from '@/lib/prisma'

export async function getPlans() {
  const plans = await prisma.plan.findMany({
    orderBy: { price: 'asc' },
  })
   return plans.map((plan) => ({
    ...plan,
    price: Number(plan.price),
  }));
}