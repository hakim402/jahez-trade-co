'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BookingsTable } from './BookingsTable'
import { BookingPagination } from './BookingPagination'
import type { BookingWithRelations } from './types'

interface BookingsPageClientProps {
  initialBookings: BookingWithRelations[]
  initialPagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
  filters: any
}

export function BookingsPageClient({
  initialBookings,
  initialPagination,
  filters,
}: BookingsPageClientProps) {
  const router = useRouter()
  const refresh = () => router.refresh()

  return (
    <div className="space-y-4">
      <BookingsTable bookings={initialBookings} onActionComplete={refresh} />
      <BookingPagination pagination={initialPagination} filters={filters} />
    </div>
  )
}