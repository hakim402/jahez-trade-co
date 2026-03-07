import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { getMyRequests, getUserPlanInfo, getClientContext } from './actions'
import { MyRequestsClient } from './_components/MyRequestsClient'
import { ClientHeader } from '../../_components/ClientHeader'
import { prisma } from '@/lib/prisma'
import { RequestStatus } from '@prisma/client'
import {
  PackageSearch, FileText, CheckCircle2, Clock,
  Send, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClientRequestWithRelations, PaginationInfo } from './_components/types'

interface PageProps {
  searchParams: Promise<{
    page?:     string
    pageSize?: string
    status?:   string
  }>
}

// ─── Skeleton (Suspense fallback) ─────────────────────────────────────────

function RequestsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/8 bg-card/40 h-44 animate-pulse"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  )
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
      {/* Faint gradient bleed */}
      <div className={cn(
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
        'bg-linear-to-br from-transparent to-transparent',
      )} />

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
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br',
          gradient,
        )}>
          <Icon size={17} className="text-white" />
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function MyRequestsPage({ searchParams }: PageProps) {
  const t  = await getTranslations('MyRequestsPage')
  const sp = await searchParams

  const page     = Math.max(1, parseInt(sp.page     || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.pageSize || '20')))
  const status   = sp.status as RequestStatus | undefined

  const filters = { page, pageSize, status }

  // ── Resolve user + data in parallel ────────────────────────────────────
  const contextResult = await getClientContext()
  if (!contextResult.success) throw new Error(contextResult.error)
  const { user, plan } = contextResult.data

  const result = await getMyRequests(filters)
  if (!result.success) throw new Error(result.error)

  const { requests, pagination } = result.data as {
    requests:   ClientRequestWithRelations[]
    pagination: PaginationInfo
  }

  // ── Stats ───────────────────────────────────────────────────────────────
  const allRequests = await prisma.productRequest.findMany({
    where:  { clientId: user.id, isDeleted: false },
    select: {
      status: true,
      quotes: { where: { status: 'SENT', isDeleted: false }, select: { id: true } },
    },
  })

  const total      = allRequests.length
  const active     = allRequests.filter(r => ['SUBMITTED', 'IN_REVIEW', 'QUOTED'].includes(r.status)).length
  const completed  = allRequests.filter(r => r.status === 'COMPLETED').length
  const awaitingMe = allRequests.filter(r => r.quotes.length > 0).length

  const KPI_CARDS: KpiProps[] = [
    {
      label:    t('totalRequests'),
      value:    total,
      icon:     PackageSearch,
      gradient: 'from-violet-500 to-indigo-600',
      sub:      total === 0 ? 'No requests yet' : `${active} currently active`,
    },
    {
      label:    t('inProgress'),
      value:    active,
      icon:     Clock,
      gradient: 'from-amber-400 to-orange-500',
      sub:      active > 0 ? 'Being reviewed or quoted' : 'Nothing in progress',
    },
    {
      label:    t('awaitingAction'),
      value:    awaitingMe,
      icon:     Send,
      gradient: 'from-pink-500 to-rose-500',
      sub:      awaitingMe > 0 ? 'Quotes ready for review' : 'No action needed',
    },
    {
      label:    t('completed'),
      value:    completed,
      icon:     CheckCircle2,
      gradient: 'from-emerald-400 to-teal-500',
      sub:      total > 0 ? `${Math.round((completed / total) * 100)}% completion rate` : undefined,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />

      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-7">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-color/15">
                <PackageSearch size={15} className="text-color" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t('title')}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground pl-0.5">{t('subtitle')}</p>
          </div>

          {/* Plan pill */}
          {plan.limit !== Infinity && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/10 text-xs text-muted-foreground shrink-0">
              <TrendingUp size={12} className="text-color" />
              <span className="font-semibold text-foreground">{plan.planName}</span>
              <span className="text-border/60">·</span>
              <span className="tabular-nums">{plan.usedCount}/{plan.limit} used</span>
            </div>
          )}
        </div>

        {/* ── KPI strip ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {KPI_CARDS.map(k => <KpiCard key={k.label} {...k} />)}
        </div>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border/10" />
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
            Your Requests
          </p>
          <div className="flex-1 h-px bg-border/10" />
        </div>

        {/* ── Main client content ───────────────────────────────────────── */}
        <Suspense fallback={<RequestsGridSkeleton />}>
          <MyRequestsClient
            initialRequests={requests}
            initialPagination={pagination}
            filters={filters}
            plan={plan}
          />
        </Suspense>
      </div>
    </div>
  )
}