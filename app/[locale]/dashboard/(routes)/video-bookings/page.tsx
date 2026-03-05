import { Suspense } from 'react'
import { getUserBookingContext, getMyBookings } from './actions'
import { MyBookingsClient } from './_components/MyBookingsClient'
import { BookingsTableSkeleton } from './_components/BookingsTableSkeleton'
import { ClientHeader } from '../../_components/ClientHeader'
import type { ClientBookingWithRelations, PaginationInfo } from './_components/types'
import { Video, Clock, CheckCircle2, Trophy } from 'lucide-react'

interface PageProps {
  searchParams: {
    page?: string
    pageSize?: string
    status?: string
  }
}

export default async function MyVideoBookingsPage({ searchParams }: PageProps) {
  const page     = Math.max(1, parseInt(searchParams.page || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.pageSize || '20')))
  const status   = searchParams.status as any

  // Parallel fetch — context + first page of bookings
  const [contextResult, bookingsResult] = await Promise.all([
    getUserBookingContext(),
    getMyBookings({ page, pageSize, status }),
  ])

  if (!contextResult.success) throw new Error(contextResult.error)
  if (!bookingsResult.success) throw new Error(bookingsResult.error)

  const { planInfo, kpi } = contextResult.data
  const { bookings, pagination } = bookingsResult.data as {
    bookings: ClientBookingWithRelations[]
    pagination: PaginationInfo
  }

  const kpiCards = [
    {
      label: 'Total Bookings',
      value: kpi.total,
      icon: Video,
      color: 'text-blue-600',
      bg:    'bg-blue-50',
    },
    {
      label: 'Pending',
      value: kpi.pending,
      icon: Clock,
      color: 'text-amber-600',
      bg:    'bg-amber-50',
    },
    {
      label: 'Confirmed',
      value: kpi.confirmed,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg:    'bg-green-50',
    },
    {
      label: 'Completed',
      value: kpi.completed,
      icon: Trophy,
      color: 'text-emerald-600',
      bg:    'bg-emerald-50',
    },
  ]

  return (
    <div className="container mx-auto py-6 space-y-6">
      <ClientHeader />

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Video Bookings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Schedule and manage your video calls with our team.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="rounded-xl border bg-card p-4 flex items-center gap-3"
            >
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main client component */}
      <Suspense fallback={<BookingsTableSkeleton />}>
        <MyBookingsClient
          initialBookings={bookings}
          initialPagination={pagination}
          initialPlanInfo={planInfo}
          initialStatus={status ?? null}
          initialPage={page}
        />
      </Suspense>
    </div>
  )
}