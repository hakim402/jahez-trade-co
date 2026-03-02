// app/[locale]/admin/(routes)/product-requests/_components/RequestsPageClient.tsx
'use client'

import { useRouter } from 'next/navigation'
import { RequestsTable } from './RequestsTable'
import { RequestPagination } from './RequestPagination'
import type { ProductRequest, Quote, User } from '@prisma/client'

type RequestWithRelations = ProductRequest & {
  client: Pick<User, 'id' | 'email' | 'fullName'>
  quotes: (Quote & { createdBy: Pick<User, 'id' | 'email' | 'fullName'> })[]
  acceptedQuote: Quote | null
  files: any[]
  statusHistory: any[]
}

interface RequestsPageClientProps {
  initialRequests: RequestWithRelations[]
  initialPagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
  filters: any
}

export function RequestsPageClient({
  initialRequests,
  initialPagination,
  filters,
}: RequestsPageClientProps) {
  const router = useRouter()

  // Use the props directly – after a mutation we call router.refresh()
  // which will cause the server component to re‑fetch and pass new props.
  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <RequestsTable
        requests={initialRequests}
        onActionComplete={handleRefresh}
      />
      <RequestPagination pagination={initialPagination} filters={filters} />
    </div>
  )
}