// app/[locale]/admin/(routes)/notifications/page.tsx

import { AdminHeader }        from '../../_components/AdminHeader'
import { NotificationsClient } from './_components/NotificationsClient'
import { getNotificationStats } from './actions'

export const metadata = { title: 'Notifications — Admin' }

export default async function NotificationsPage() {
  const statsResult = await getNotificationStats()
  const stats = statsResult.success ? statsResult.data : null

  return (
    <div className="min-h-screen">
      <AdminHeader />
      <div className="px-6 py-8 max-w-400 mx-auto space-y-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Manage, send and broadcast notifications across the platform.
            </p>
          </div>
          {stats && (
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1.5 rounded-full bg-color/10 text-color border border-color/20 font-medium">
                {stats.unread} unread
              </span>
              <span className="text-muted-foreground">of {stats.total} total</span>
            </div>
          )}
        </div>

        {/* KPI strip */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total',       value: stats.total,         color: 'from-violet-500 to-blue-500' },
              { label: 'Unread',      value: stats.unread,        color: 'from-amber-500 to-orange-500' },
              { label: 'Today',       value: stats.sentToday,     color: 'from-emerald-500 to-teal-500' },
              { label: 'This Week',   value: stats.sentThisWeek,  color: 'from-pink-500 to-rose-500' },
            ].map(k => (
              <div key={k.label} className="rounded-xl border border-border/5 bg-card/50 p-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium">{k.label}</span>
                <span className={`text-2xl font-bold bg-linear-to-r ${k.color} bg-clip-text text-transparent`}>
                  {k.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Main client component */}
        <NotificationsClient initialStats={stats} />
      </div>
    </div>
  )
}