// ════════════════════════════════════════════════════════════════════════════
// page.tsx
// app/[locale]/admin/(routes)/product-requests/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import { Suspense }            from 'react'
import { getAllProductRequests, getRequestStats } from './actions'
import { RequestFilters }      from './_components/RequestFilters'
import { RequestsTableSkeleton } from './_components/RequestsTableSkeleton'
import { RequestsPageClient }  from './_components/RequestsPageClient'
import { AdminHeader }         from '../../_components/AdminHeader'
import { RequestStatus }       from '@prisma/client'
import { Package, Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    page?:          string
    pageSize?:      string
    status?:        string
    priority?:      string
    clientEmail?:   string
    search?:        string
    createdAtFrom?: string
    createdAtTo?:   string
  }>
}

export default async function ProductRequestsPage({ searchParams }: PageProps) {
  const sp = await searchParams

  const page     = Math.max(1, parseInt(sp.page     || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.pageSize || '20')))
  const status   = sp.status   as RequestStatus | undefined
  const priority = sp.priority ? parseInt(sp.priority) : undefined

  const filters = {
    page, pageSize,
    status:        status,
    priority:      isNaN(priority as number) ? undefined : priority,
    clientEmail:   sp.clientEmail,
    search:        sp.search,
    createdAtFrom: sp.createdAtFrom ? new Date(sp.createdAtFrom) : undefined,
    createdAtTo:   sp.createdAtTo   ? new Date(sp.createdAtTo)   : undefined,
  }

  const [result, statsResult] = await Promise.all([
    getAllProductRequests(filters),
    getRequestStats(),
  ])

  if (!result.success) throw new Error(result.error)

  const { requests, pagination } = result.data as any
  const stats = statsResult.success ? statsResult.data : null

  const KPI_CARDS = stats ? [
    { label: 'Active',        value: stats.totalActive,    icon: Package,      color: 'from-violet-500 to-blue-500' },
    { label: 'Today',         value: stats.submittedToday, icon: Clock,        color: 'from-amber-500 to-orange-500' },
    { label: 'This Week',     value: stats.submittedWeek,  icon: FileText,     color: 'from-emerald-500 to-teal-500' },
    { label: 'Pending Quotes',value: stats.pendingQuotes,  icon: AlertCircle,  color: 'from-pink-500 to-rose-500' },
  ] : []

  return (
    <div className="min-h-screen">
      <AdminHeader />
      <div className="px-6 py-8 max-w-400 mx-auto space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Product Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage client requests, generate AI quotes, and track fulfilment.
          </p>
        </div>

        {/* KPI strip */}
        {KPI_CARDS.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {KPI_CARDS.map(k => (
              <div key={k.label} className="rounded-xl border border-border/5 bg-card/50 p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg bg-linear-to-br ${k.color} flex items-center justify-center shrink-0`}>
                  <k.icon size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="text-xl font-bold text-card-foreground">{k.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <RequestFilters initialFilters={filters} />

        {/* Table */}
        <Suspense fallback={<RequestsTableSkeleton />}>
          <RequestsPageClient
            initialRequests={requests}
            initialPagination={pagination}
            filters={filters}
          />
        </Suspense>
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════════════════════════
// RequestsPageClient.tsx
// app/[locale]/admin/(routes)/product-requests/_components/RequestsPageClient.tsx
// ════════════════════════════════════════════════════════════════════════════
// NOTE: This is exported as a string below so you can split into its own file.
// The content between the dashed lines is the component source.