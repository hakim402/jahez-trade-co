import { Suspense } from 'react'
import { getMyRequests } from './actions'
import { MyRequestsClient } from './_components/MyRequestsClient'
import { RequestsTableSkeleton } from '@/app/[locale]/admin/(routes)/product-requests/_components/RequestsTableSkeleton' // reuse or create
import type { ClientRequestWithRelations } from './_components/types'
import { ClientHeader } from '../../_components/ClientHeader'

interface PageProps {
  searchParams: {
    page?: string
    pageSize?: string
    status?: string
  }
}

export default async function MyRequestsPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.pageSize || '20')))
  const status = searchParams.status as any

  const filters = { page, pageSize, status }
  const result = await getMyRequests(filters)

  if (!result.success) {
    throw new Error(result.error)
  }

  const { requests, pagination } = result.data as {
    requests: ClientRequestWithRelations[]
    pagination: {
      page: number
      pageSize: number
      totalCount: number
      totalPages: number
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <ClientHeader />
      <h1 className="text-3xl font-bold">My Requests</h1>
      <Suspense fallback={<RequestsTableSkeleton />}>
        <MyRequestsClient
          initialRequests={requests}
          initialPagination={pagination}
          filters={filters}
        />
      </Suspense>
    </div>
  )
}