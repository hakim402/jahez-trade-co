// app/[locale]/admin/(routes)/video-slots/_components/SlotsPageClient.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SlotsTable } from './SlotsTable'
import { SlotPagination } from './SlotPagination'
import { CreateSlotDialog } from './CreateSlotDialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Slot } from './types'

interface SlotsPageClientProps {
  initialSlots: Slot[]
  initialPagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
  filters: any
}

export function SlotsPageClient({
  initialSlots,
  initialPagination,
  filters,
}: SlotsPageClientProps) {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const refresh = () => router.refresh()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Manage Availability Slots</h2>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Slot
        </Button>
      </div>

      <SlotsTable slots={initialSlots} onActionComplete={refresh} />

      <SlotPagination pagination={initialPagination} filters={filters} />

      <CreateSlotDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={refresh}
      />
    </div>
  )
}