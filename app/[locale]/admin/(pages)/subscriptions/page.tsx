import { getSubscriptions } from './actions'
import { SubscriptionsTable } from './_components/SubscriptionsTable'
import { SubscriptionsFilter } from './_components/SubscriptionsFilter'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import AdminHeader from '../../_components/Header/AdminHeader'

type PageProps = { searchParams: Promise<{ [key: string]: string | undefined }> }

export default async function SubscriptionsPage({ searchParams }: PageProps) {
  const {
    page = '1',
    pageSize = '10',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    plan,
    status,
    search,
    from,
    to,
  } = await searchParams

  const result = await getSubscriptions({
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
    plan: plan as any,
    status: status as any,
    search,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  })

  return (
    <div className="space-y-6">
      <AdminHeader />
      <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
      <SubscriptionsFilter />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <SubscriptionsTable
          subscriptions={result.subscriptions}
          totalCount={result.totalCount}
          pageCount={result.pageCount}
          currentPage={parseInt(page)}
          pageSize={parseInt(pageSize)}
        />
      </Suspense>
    </div>
  )
}