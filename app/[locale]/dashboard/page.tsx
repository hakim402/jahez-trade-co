// app/[locale]/dashboard/page.tsx

import { getClientDashboardStats } from './actions'
import { ClientDashboard } from './_components/ClientDashboard'

export default async function DashboardPage() {
  const result = await getClientDashboardStats()

  if (!result.success) {
    throw new Error(result.error || 'Failed to load dashboard stats')
  }

  return <ClientDashboard stats={result.data} />
}