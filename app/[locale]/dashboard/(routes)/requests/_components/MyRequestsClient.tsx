'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { RequestsTable } from './RequestsTable'
import { RequestPagination } from './RequestPagination'
import { CreateRequestDialog } from './CreateRequestDialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { ClientRequestWithRelations } from './types'

interface MyRequestsClientProps {
  initialRequests: ClientRequestWithRelations[]
  initialPagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
  filters: any
}

export function MyRequestsClient({
  initialRequests,
  initialPagination,
  filters,
}: MyRequestsClientProps) {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const refresh = () => router.refresh()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Requests</h2>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Request
        </Button>
      </div>

      <RequestsTable
        requests={initialRequests}
        onActionComplete={refresh}
      />

      <RequestPagination
        pagination={initialPagination}
        filters={filters}
      />

      <CreateRequestDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={refresh}
      />
    </div>
  )
}