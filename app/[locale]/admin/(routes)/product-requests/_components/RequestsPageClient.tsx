'use client'

import { useRouter } from 'next/navigation'
import { RequestsTable }     from './RequestsTable'
import { RequestPagination } from './RequestPagination'
import type { RequestWithRelations, PaginationInfo, RequestFiltersType } from './types'

interface Props {
  initialRequests:   RequestWithRelations[]
  initialPagination: PaginationInfo
  filters:           RequestFiltersType
}

export function RequestsPageClient({ initialRequests, initialPagination, filters }: Props) {
  const router      = useRouter()
  const handleRefresh = () => router.refresh()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{initialRequests.length}</span> of{' '}
          <span className="font-medium text-foreground">{initialPagination.totalCount}</span> requests
        </p>
      </div>
      <RequestsTable requests={initialRequests} onActionComplete={handleRefresh} />
      {initialPagination.totalPages > 1 && (
        <RequestPagination pagination={initialPagination} filters={filters} />
      )}
    </div>
  )
}