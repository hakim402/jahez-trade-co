import { getBookings } from './actions'
import { BookingsTable } from './_components/BookingsTable'
import { BookingsFilter } from './_components/BookingsFilter'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import AdminHeader from '../../_components/Header/AdminHeader'

type PageProps = { searchParams: Promise<{ [key: string]: string | undefined }> }

export default async function VideoBookingsPage({ searchParams }: PageProps) {
  const {
    page = '1',
    pageSize = '10',
    sortBy = 'scheduledAt',
    sortOrder = 'desc',
    status,
    type,
    search,
    from,
    to,
  } = await searchParams

  const result = await getBookings({
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
    status: status as any,
    type: type as any,
    search,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  })

  return (
    <div className="space-y-6">
      <AdminHeader />
      <h1 className="text-3xl font-bold tracking-tight">Video Bookings</h1>
      <BookingsFilter />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <BookingsTable
          bookings={result.bookings}
          totalCount={result.totalCount}
          pageCount={result.pageCount}
          currentPage={parseInt(page)}
          pageSize={parseInt(pageSize)}
        />
      </Suspense>
    </div>
  )
}