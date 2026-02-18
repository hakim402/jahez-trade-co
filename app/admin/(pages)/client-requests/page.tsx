import { getRequests } from './actions'
import { RequestsTable } from './_components/RequestsTable'
import { RequestsFilter } from './_components/RequestsFilter'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import AdminHeader from '../../_components/Header/AdminHeader'

type PageProps = { searchParams: Promise<{ [key: string]: string | undefined }> }

export default async function ClientRequestsPage({ searchParams }: PageProps) {
  const {
    page = '1',
    pageSize = '10',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
    userId,
    search,
    from,
    to,
  } = await searchParams

  const result = await getRequests({
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
    status: status as any,
    userId,
    search,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  })

  return (
    <div className="space-y-6">
      <AdminHeader />
      <h1 className="text-3xl font-bold tracking-tight">Client Requests</h1>
      <RequestsFilter />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <RequestsTable
          requests={result.requests}
          totalCount={result.totalCount}
          pageCount={result.pageCount}
          currentPage={parseInt(page)}
          pageSize={parseInt(pageSize)}
        />
      </Suspense>
    </div>
  )
}