// app/[locale]/dashboard/page.tsx
import { Suspense } from 'react'
import { getClientDashboardStats } from './actions'
import { ClientDashboard } from './_components/ClientDashboard'
import { DashboardSkeleton } from './_components/DashboardSkeleton'

export default async function DashboardPage() {
  const result = await getClientDashboardStats()

  if (!result.success) {
    throw new Error(result.error)
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ClientDashboard stats={result.data} />
    </Suspense>
  )
}