import { getUsers } from './_components/actions'
import { ClientsTable } from './_components/ClientsTable'
import { ClientsFilter } from './_components/ClientsFilter'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import AdminHeader from '../../_components/Header/AdminHeader'

type PageProps = {
  searchParams: Promise<{
    page?: string
    pageSize?: string
    sortBy?: string
    sortOrder?: string
    role?: string
    search?: string
    subscriptionStatus?: string
    dateFrom?: string
    dateTo?: string
  }>
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const {
    page = '1',
    pageSize = '10',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    role,
    search,
    subscriptionStatus,
    dateFrom,
    dateTo,
  } = await searchParams

  const result = await getUsers({
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
    role: role as any,
    search,
    subscriptionStatus: subscriptionStatus as any,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
  })

  return (
    <div className="space-y-6">
      <AdminHeader />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
      </div>

      <ClientsFilter />

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ClientsTable
          users={result.users}
          totalCount={result.totalCount}
          pageCount={result.pageCount}
          currentPage={parseInt(page)}
          pageSize={parseInt(pageSize)}
        />
      </Suspense>
    </div>
  )
}