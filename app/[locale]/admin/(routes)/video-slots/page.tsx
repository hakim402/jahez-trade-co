// app/[locale]/admin/(routes)/video-slots/page.tsx
import { Suspense } from 'react'
import { getSlots } from './actions'
import { SlotFilters } from './_components/SlotFilters'
import { SlotsTableSkeleton } from './_components/SlotsTableSkeleton'
import { SlotsPageClient } from './_components/SlotsPageClient'
import { AdminHeader } from '../../_components/AdminHeader'

interface PageProps {
  searchParams: {
    page?: string
    pageSize?: string
    startDateFrom?: string
    startDateTo?: string
    isActive?: string
    isBooked?: string
  }
}

export default async function VideoSlotsPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.pageSize || '20')))
  const startDateFrom = searchParams.startDateFrom ? new Date(searchParams.startDateFrom) : undefined
  const startDateTo = searchParams.startDateTo ? new Date(searchParams.startDateTo) : undefined
  const isActive = searchParams.isActive === 'true' ? true : searchParams.isActive === 'false' ? false : undefined
  const isBooked = searchParams.isBooked === 'true' ? true : searchParams.isBooked === 'false' ? false : undefined

  const filters = { page, pageSize, startDateFrom, startDateTo, isActive, isBooked }
  const result = await getSlots(filters)

  if (!result.success) {
    throw new Error(result.error)
  }

  const { slots, pagination } = result.data

  return (
    <div className="py-6 space-y-6 m-3 md:m-7 lg:m-7">
      <AdminHeader />
      <h1 className="text-3xl font-bold">Video Slots</h1>
      <SlotFilters initialFilters={filters} />
      <Suspense fallback={<SlotsTableSkeleton />}>
        <SlotsPageClient
          initialSlots={slots}
          initialPagination={pagination}
          filters={filters}
        />
      </Suspense>
    </div>
  )
}