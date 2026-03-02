'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BookingsTable } from './BookingsTable'
import { BookingPagination } from './BookingPagination'
import { CreateBookingDialog } from './CreateBookingDialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { ClientBookingWithRelations } from './types'

interface MyBookingsClientProps {
  initialBookings: ClientBookingWithRelations[]
  initialPagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
  filters: any
}

export function MyBookingsClient({
  initialBookings,
  initialPagination,
  filters,
}: MyBookingsClientProps) {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const refresh = () => router.refresh()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Bookings</h2>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Request Video Call
        </Button>
      </div>

      <BookingsTable bookings={initialBookings} onActionComplete={refresh} />

      <BookingPagination pagination={initialPagination} filters={filters} />

      <CreateBookingDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={refresh}
      />
    </div>
  )
}