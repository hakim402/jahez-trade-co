import { getAuditLogs, getDistinctEntities, getDistinctActions } from './actions'
import { AuditTable } from './_components/AuditTable'
import { AuditFilter } from './_components/AuditFilter'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

type PageProps = { searchParams: Promise<{ [key: string]: string | undefined }> }

export default async function AuditPage({ searchParams }: PageProps) {
  const {
    page = '1',
    pageSize = '20',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    adminId,
    entity,
    action,
    search,
    from,
    to,
  } = await searchParams

  const [logsResult, entities, actions] = await Promise.all([
    getAuditLogs({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      adminId,
      entity,
      action,
      search,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    }),
    getDistinctEntities(),
    getDistinctActions(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
      <AuditFilter entities={entities} actions={actions} />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <AuditTable
          logs={logsResult.logs}
          totalCount={logsResult.totalCount}
          pageCount={logsResult.pageCount}
          currentPage={parseInt(page)}
          pageSize={parseInt(pageSize)}
        />
      </Suspense>
    </div>
  )
}