import { Suspense } from 'react'
import { getUserBookingContext, getMyBookings } from './actions'
import { MyBookingsClient } from './_components/MyBookingsClient'
import { BookingsTableSkeleton } from './_components/BookingsTableSkeleton'
import { ClientHeader } from '../../_components/ClientHeader'
import { cn } from '@/lib/utils'
import type { ClientBookingWithRelations, PaginationInfo } from './_components/types'
import {
  Video, Clock, CheckCircle2, Trophy, TrendingUp,
} from 'lucide-react'

interface PageProps {
  searchParams: {
    page?:     string
    pageSize?: string
    status?:   string
  }
}

// ─── KPI card ─────────────────────────────────────────────────────────────

interface KpiProps {
  label:    string
  value:    number
  icon:     React.ElementType
  gradient: string
  sub?:     string
}

function KpiCard({ label, value, icon: Icon, gradient, sub }: KpiProps) {
  return (
    <div className="relative rounded-2xl border border-border/10 bg-card/50 p-4 overflow-hidden group hover:border-border/20 hover:bg-card/70 transition-all duration-200">
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-bold text-foreground mt-1 tabular-nums leading-none">
            {value.toLocaleString()}
          </p>
          {sub && (
            <p className="text-[10px] text-muted-foreground mt-1.5">{sub}</p>
          )}
        </div>
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br',
          gradient,
        )}>
          <Icon size={17} className="text-white" />
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function MyVideoBookingsPage({ searchParams }: PageProps) {
  const page     = Math.max(1, parseInt(searchParams.page     || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.pageSize || '20')))
  const status   = searchParams.status as any

  const [contextResult, bookingsResult] = await Promise.all([
    getUserBookingContext(),
    getMyBookings({ page, pageSize, status }),
  ])

  if (!contextResult.success) throw new Error(contextResult.error)
  if (!bookingsResult.success) throw new Error(bookingsResult.error)

  const { planInfo, kpi } = contextResult.data
  const { bookings, pagination } = bookingsResult.data as {
    bookings:   ClientBookingWithRelations[]
    pagination: PaginationInfo
  }

  const KPI_CARDS: KpiProps[] = [
    {
      label:    'Total Bookings',
      value:    kpi.total,
      icon:     Video,
      gradient: 'from-violet-500 to-indigo-600',
      sub:      kpi.total === 0 ? 'No bookings yet' : `${kpi.pending} currently pending`,
    },
    {
      label:    'Pending',
      value:    kpi.pending,
      icon:     Clock,
      gradient: 'from-amber-400 to-orange-500',
      sub:      kpi.pending > 0 ? 'Awaiting confirmation' : 'Nothing pending',
    },
    {
      label:    'Confirmed',
      value:    kpi.confirmed,
      icon:     CheckCircle2,
      gradient: 'from-green-400 to-emerald-500',
      sub:      kpi.confirmed > 0 ? 'Upcoming calls' : 'No confirmed calls',
    },
    {
      label:    'Completed',
      value:    kpi.completed,
      icon:     Trophy,
      gradient: 'from-emerald-400 to-teal-500',
      sub:      kpi.total > 0
        ? `${Math.round((kpi.completed / kpi.total) * 100)}% completion rate`
        : undefined,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />

      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-7">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-color/15">
                <Video size={15} className="text-color" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Video Bookings
              </h1>
            </div>
            <p className="text-sm text-muted-foreground pl-0.5">
              Schedule and manage your video calls with our team.
            </p>
          </div>

          {/* Plan pill */}
          {planInfo.billingEnabled && planInfo.limit !== Infinity && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/10 text-xs text-muted-foreground shrink-0">
              <TrendingUp size={12} className="text-color" />
              <span className="font-semibold text-foreground capitalize">{planInfo.planName}</span>
              <span className="text-border/60">·</span>
              <span className="tabular-nums">{planInfo.usedCount}/{planInfo.limit} used</span>
            </div>
          )}
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {KPI_CARDS.map(k => <KpiCard key={k.label} {...k} />)}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border/10" />
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
            Your Bookings
          </p>
          <div className="flex-1 h-px bg-border/10" />
        </div>

        {/* Main content */}
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
    </div>
  )
}