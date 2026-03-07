import { Suspense } from 'react'
import { listClientNotifications } from './actions'
import { NotificationsClient } from './_components/NotificationsClient'
import { NotificationsPageSkeleton } from './_components/NotificationsPageSkeleton'
import type { ClientNotification, PaginationInfo } from './_components/types'
import { Bell, Sparkles } from 'lucide-react'
import { ClientHeader } from '../../_components/ClientHeader'

export const metadata = { title: 'Notifications' }

export default async function NotificationsPage() {
  const result = await listClientNotifications({ page: 1, pageSize: 20 })

  const initialItems: ClientNotification[] = result.success
    ? result.data.items : []
  const initialPagination: PaginationInfo = result.success
    ? result.data.pagination
    : { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 }
  const initialUnread: number = result.success ? result.data.unreadCount : 0

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />

      {/* ── Hero header ────────────────────────────────────────────────── */}
      <div className="relative border-b border-border/8 overflow-hidden">
        

        <div className="relative px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
          <div className="flex items-start justify-between gap-6 flex-wrap">

            {/* Title block */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-color/20 blur-md scale-110" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-color/30 to-color/10 border border-color/20 shadow-lg shadow-color/10">
                  <Bell size={24} className="text-color" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-2xl font-bold tracking-tight text-color">
                    Notifications
                  </h1>
                  {initialUnread > 0 && (
                    <span className="inline-flex items-center gap-1 h-5 px-2 text-[10px] font-bold rounded-full bg-color/15 text-color border border-color/20 animate-pulse">
                      {initialUnread} unread
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Stay up to date with your bookings, requests, and messages.
                </p>
              </div>
            </div>

            {/* Total quick-stat */}
            {initialPagination.totalCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/20 border border-border/10 text-xs text-muted-foreground shrink-0">
                <Bell size={12} className="shrink-0" />
                <span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {initialPagination.totalCount}
                  </span>
                  {' '}total
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-8">

        {/* Section divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border/10" />
          <div className="flex items-center gap-2 text-muted-foreground/40">
            <Sparkles size={11} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Your Activity</p>
            <Sparkles size={11} />
          </div>
          <div className="flex-1 h-px bg-border/10" />
        </div>

        <Suspense fallback={<NotificationsPageSkeleton />}>
          <NotificationsClient
            initialItems={initialItems}
            initialPagination={initialPagination}
            initialUnread={initialUnread}
          />
        </Suspense>
      </div>
    </div>
  )
}