// app/[locale]/admin/(routes)/messages/page.tsx

import { AdminHeader }    from '../../_components/AdminHeader'
import { MessagesClient } from './_components/MessagesClient'
import { getMessagesStats } from './actions'
import { MessageSquare, Zap, Hash, CalendarDays } from 'lucide-react'

export const metadata = { title: 'Messages — Admin' }

export default async function MessagesPage() {
  const statsResult = await getMessagesStats()
  const stats = statsResult.success ? statsResult.data : null

  const kpis = stats ? [
    { label: 'Total Sessions',   value: stats.totalSessions,   icon: MessageSquare, color: 'from-violet-500 to-blue-500' },
    { label: 'Active Now',       value: stats.activeSessions,  icon: Zap,           color: 'from-emerald-500 to-teal-500' },
    { label: 'Total Messages',   value: stats.totalMessages,   icon: Hash,          color: 'from-amber-500 to-orange-500' },
    { label: 'Started Today',    value: stats.sessionsToday,   icon: CalendarDays,  color: 'from-pink-500 to-rose-500' },
  ] : []

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />

      <div className="flex-1 px-6 py-8 max-w-400 mx-auto w-full space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Messages</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and respond to user chat sessions in real time.
            </p>
          </div>
          {stats && (
            <div className="flex items-center gap-2 text-sm">
              {stats.activeSessions > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {stats.activeSessions} active
                </span>
              )}
            </div>
          )}
        </div>

        {/* KPI strip */}
        {kpis.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {kpis.map(k => (
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

        {/* Two-panel messenger */}
        <MessagesClient />
      </div>
    </div>
  )
}