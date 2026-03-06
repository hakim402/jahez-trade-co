import { Suspense } from 'react'
import { getAllBookings, getAdminBookingContext } from './actions'
import { AdminBookingsClient } from './_components/AdminBookingsClient'
import { BookingsTableSkeleton } from './_components/BookingsTableSkeleton'
import { AdminHeader } from '../../_components/AdminHeader'
import type { BookingWithRelations, PaginationInfo } from './_components/types'
import { Video, Clock, CheckCircle2, Trophy, XCircle, CalendarDays } from 'lucide-react'

interface PageProps {
  searchParams: {
    page?:        string
    status?:      string
    clientEmail?: string
  }
}

export default async function VideoBookingsPage({ searchParams }: PageProps) {
  const page   = Math.max(1, parseInt(searchParams.page || '1'))
  const status = searchParams.status as any
  const email  = searchParams.clientEmail

  const [contextResult, bookingsResult] = await Promise.all([
    getAdminBookingContext(),
    getAllBookings({ page, pageSize: 20, status, clientEmail: email }),
  ])

  if (!contextResult.success) throw new Error(contextResult.error)
  if (!bookingsResult.success) throw new Error(bookingsResult.error)

  const { kpi, availableSlotCount } = contextResult.data
  const { bookings, pagination } = bookingsResult.data as {
    bookings:   BookingWithRelations[]
    pagination: PaginationInfo
  }

  const kpiCards = [
    { label: 'Total',     value: kpi.total,     icon: Video,        color: 'text-blue-600',    bg: 'bg-blue-50' },
    { label: 'Requested', value: kpi.requested,  icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50' },
    { label: 'Confirmed', value: kpi.confirmed,  icon: CheckCircle2, color: 'text-green-600',   bg: 'bg-green-50' },
    { label: 'Completed', value: kpi.completed,  icon: Trophy,       color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Cancelled', value: kpi.canceled,   icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-50' },
    { label: 'Free Slots',value: availableSlotCount, icon: CalendarDays, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="py-6 space-y-6 m-3 md:m-7">
      <AdminHeader />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Video Bookings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage client video call requests, schedule meetings, and track availability.
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-xl border bg-card p-3 flex items-center gap-2.5">
              <div className={`rounded-lg p-1.5 ${card.bg} shrink-0`}>
                <Icon className={`h-3.5 w-3.5 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{card.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main client component */}
      <Suspense fallback={<BookingsTableSkeleton />}>
        <AdminBookingsClient
          initialBookings={bookings}
          initialPagination={pagination}
          initialStatus={status ?? null}
          initialEmail={email ?? ''}
          initialPage={page}
        />
      </Suspense>
    </div>
  )
}