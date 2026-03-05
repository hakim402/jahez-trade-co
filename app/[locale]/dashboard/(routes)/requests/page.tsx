// app/[locale]/dashboard/(routes)/request/page.tsx

import { Suspense }         from 'react'
import { getMyRequests, getUserPlanInfo, getClientContext } from './actions'
import { MyRequestsClient } from './_components/MyRequestsClient'
import { ClientHeader }     from '../../_components/ClientHeader'
import { auth }             from '@clerk/nextjs/server'
import { prisma }           from '@/lib/prisma'
import { RequestStatus }    from '@prisma/client'
import { PackageSearch, FileText, CheckCircle2, Clock } from 'lucide-react'
import type { ClientRequestWithRelations, PaginationInfo } from './_components/types'

interface PageProps {
  searchParams: Promise<{
    page?:    string
    pageSize?: string
    status?:  string
  }>
}

// ─── KPI strip skeleton ────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/5 bg-card/50 p-4 h-20 animate-pulse" />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function MyRequestsPage({ searchParams }: PageProps) {
  const sp = await searchParams

  const page     = Math.max(1, parseInt(sp.page     || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.pageSize || '20')))
  const status   = sp.status as RequestStatus | undefined

  const filters = { page, pageSize, status }

  // Resolve user in parallel with data
  const contextResult = await getClientContext()
  if (!contextResult.success) throw new Error(contextResult.error)

  const { user, plan } = contextResult.data

  // Page data
  const result = await getMyRequests(filters)
  if (!result.success) throw new Error(result.error)

  const { requests, pagination } = result.data as {
    requests:   ClientRequestWithRelations[]
    pagination: PaginationInfo
  }

  // ── Status-based stats ──────────────────────────────────────────────────
  const allRequests = await prisma.productRequest.findMany({
    where:  { clientId: user.id, isDeleted: false },
    select: { status: true, quotes: { where: { status: 'SENT', isDeleted: false }, select: { id: true } } },
  })

  const total      = allRequests.length
  const active     = allRequests.filter(r => ['SUBMITTED', 'IN_REVIEW', 'QUOTED'].includes(r.status)).length
  const completed  = allRequests.filter(r => r.status === 'COMPLETED').length
  const awaitingMe = allRequests.filter(r => r.quotes.length > 0).length

  const KPI_CARDS = [
    { label: 'Total Requests', value: total,      icon: PackageSearch,  color: 'from-violet-500 to-blue-500' },
    { label: 'In Progress',    value: active,      icon: Clock,          color: 'from-amber-500 to-orange-500' },
    { label: 'Awaiting Action',value: awaitingMe,  icon: FileText,       color: 'from-pink-500 to-rose-500' },
    { label: 'Completed',      value: completed,   icon: CheckCircle2,   color: 'from-emerald-500 to-teal-500' },
  ]

  return (
    <div className="min-h-screen">
      <ClientHeader />
      <div className="px-4 sm:px-6 py-8 max-w-full space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Requests</h1>
          <p className="text-muted-foreground mt-1">
            Submit product requests, review quotes, and track your orders.
          </p>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {KPI_CARDS.map(k => (
            <div key={k.label}
              className="rounded-xl border border-border/5 bg-card/50 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-linear-to-br ${k.color} flex items-center justify-center shrink-0`}>
                <k.icon size={16} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-xl font-bold text-card-foreground">{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/5 bg-card/50 h-40 animate-pulse" />
            ))}
          </div>
        }>
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