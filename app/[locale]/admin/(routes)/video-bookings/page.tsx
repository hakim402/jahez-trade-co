import { Suspense } from 'react'
import { getAllBookings } from './actions'
import { BookingFilters } from './_components/BookingFilters'
import { BookingsTableSkeleton } from './_components/BookingsTableSkeleton'
import { BookingsPageClient } from './_components/BookingsPageClient'
import { AdminHeader } from '../../_components/AdminHeader'
import type { BookingWithRelations } from './_components/types'

interface PageProps {
  searchParams: {
    page?: string
    pageSize?: string
    status?: string
    clientEmail?: string
    dateFrom?: string
    dateTo?: string
  }
}

export default async function VideoBookingsPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.pageSize || '20')))
  const status = searchParams.status as any
  const clientEmail = searchParams.clientEmail
  const dateFrom = searchParams.dateFrom ? new Date(searchParams.dateFrom) : undefined
  const dateTo = searchParams.dateTo ? new Date(searchParams.dateTo) : undefined

  const filters = { page, pageSize, status, clientEmail, dateFrom, dateTo }
  const result = await getAllBookings(filters)

  if (!result.success) {
    throw new Error(result.error)
  }

  const { bookings, pagination } = result.data as {
    bookings: BookingWithRelations[]
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
      <h1 className="text-3xl font-bold">Video Bookings</h1>
      <BookingFilters initialFilters={filters} />
      <Suspense fallback={<BookingsTableSkeleton />}>
        <BookingsPageClient
          initialBookings={bookings}
          initialPagination={pagination}
          filters={filters}
        />
      </Suspense>
    </div>
  )
}