// app/[locale]/admin/(routes)/product-requests/page.tsx
import { Suspense } from 'react'
import { getAllProductRequests } from './actions'
import { RequestFilters } from './_components/RequestFilters'
import { RequestsTableSkeleton } from './_components/RequestsTableSkeleton'
import { RequestsPageClient } from './_components/RequestsPageClient'
import { AdminHeader } from '../../_components/AdminHeader'

interface PageProps {
  searchParams: {
    page?: string
    pageSize?: string
    status?: string
    clientEmail?: string
    createdAtFrom?: string
    createdAtTo?: string
  }
}

export default async function ProductRequestsPage({ searchParams }: PageProps) {
  // Parse and validate search params
  const page = Math.max(1, parseInt(searchParams.page || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.pageSize || '20')))
  const status = searchParams.status as any // will be validated by action
  const clientEmail = searchParams.clientEmail
  const createdAtFrom = searchParams.createdAtFrom ? new Date(searchParams.createdAtFrom) : undefined
  const createdAtTo = searchParams.createdAtTo ? new Date(searchParams.createdAtTo) : undefined

  const filters = { page, pageSize, status, clientEmail, createdAtFrom, createdAtTo }
  const result = await getAllProductRequests(filters)

  if (!result.success) {
    throw new Error(result.error) // will be caught by error boundary
  }

   const { requests, pagination } = result.data as {
    requests: any[] 
    pagination: {
      page: number
      pageSize: number
      totalCount: number
      totalPages: number
    }
  }

  return (
    <div className="py-6 space-y-6 m-3 md:m-7 lg:m-7">
      <AdminHeader />
      <h1 className="text-3xl font-bold">Product Requests</h1>
      <RequestFilters initialFilters={filters} />
      <Suspense fallback={<RequestsTableSkeleton />}>
        <RequestsPageClient
          initialRequests={requests}
          initialPagination={pagination}
          filters={filters}
        />
      </Suspense>
    </div>
  )
}