import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getUserSubscriptionItems } from './actions'
import SubscriptionsTable from './_components/SubscriptionsTable'
import UserDashboardHeader from '../../_components/UserDashboardHeader/UserDashboardHeader'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function MySubscriptionsPage({ searchParams }: PageProps) {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) redirect('/sign-in')

  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 10
  const sortBy = params.sortBy as string
  const sortOrder = params.sortOrder as 'asc' | 'desc' | undefined
  const status = params.status as any

  const subscriptionsData = await getUserSubscriptionItems({
    page,
    pageSize,
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder || 'desc',
    status,
  })

  return (
    <div className="container mx-auto py-6 space-y-6">
      <UserDashboardHeader />
      <h1 className="text-3xl font-bold">My Subscriptions</h1>
      <Suspense fallback={<div>Loading subscriptions...</div>}>
        <SubscriptionsTable initialData={subscriptionsData} />
      </Suspense>
    </div>
  )
}