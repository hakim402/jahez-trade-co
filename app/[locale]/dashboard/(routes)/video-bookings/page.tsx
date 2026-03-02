import { Suspense } from 'react'
import { getMyBookings } from './actions'
import { MyBookingsClient } from './_components/MyBookingsClient'
import { BookingsTableSkeleton } from './_components/BookingsTableSkeleton'
import type { ClientBookingWithRelations } from './_components/types'
import { ClientHeader } from '../../_components/ClientHeader'

interface PageProps {
  searchParams: {
    page?: string
    pageSize?: string
    status?: string
  }
}

export default async function MyVideoBookingsPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.pageSize || '20')))
  const status = searchParams.status as any

  const filters = { page, pageSize, status }
  const result = await getMyBookings(filters)

  if (!result.success) {
    throw new Error(result.error)
  }

  const { bookings, pagination } = result.data as {
    bookings: ClientBookingWithRelations[]
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
      <h1 className="text-3xl font-bold">My Video Bookings</h1>
      <Suspense fallback={<BookingsTableSkeleton />}>
        <MyBookingsClient
          initialBookings={bookings}
          initialPagination={pagination}
          filters={filters}
        />
      </Suspense>
    </div>
  )
}