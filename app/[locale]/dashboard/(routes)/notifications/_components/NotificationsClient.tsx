// app/[locale]/dashboard/(routes)/notifications/_components/NotificationsClient.tsx

'use client'

import {
  useState, useEffect, useCallback, useTransition, useRef,
} from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow, isToday, isYesterday, isThisWeek, format } from 'date-fns'
import {
  Bell, BellOff, Check, CheckCheck, Trash2, Loader2,
  ChevronRight, X, RefreshCw, Filter,
} from 'lucide-react'
import { Button }  from '@/components/ui/button'
import { Badge }   from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Pagination, PaginationContent, PaginationEllipsis,
  PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'
import { cn }      from '@/lib/utils'
import { toast }   from 'sonner'
import {
  listClientNotifications, markNotificationsRead, markAllNotificationsRead,
  deleteNotification, deleteAllReadNotifications,
} from '../actions'
import {
  FILTER_TABS, FILTER_TYPE_MAP, getNotificationConfig,
  type ClientNotification, type PaginationInfo, type FilterTab,
} from './types'

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(d: Date | string) {
  return formatDistanceToNow(new Date(d), { addSuffix: true })
}

function groupLabel(d: Date | string) {
  const date = new Date(d)
  if (isToday(date))           return 'Today'
  if (isYesterday(date))       return 'Yesterday'
  if (isThisWeek(date))        return 'This Week'
  return format(date, 'MMMM yyyy')
}

function groupNotifications(items: ClientNotification[]) {
  const groups: { label: string; items: ClientNotification[] }[] = []
  const seen = new Map<string, ClientNotification[]>()

  for (const item of items) {
    const label = groupLabel(item.createdAt)
    if (!seen.has(label)) {
      seen.set(label, [])
      groups.push({ label, items: seen.get(label)! })
    }
    seen.get(label)!.push(item)
  }
  return groups
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION ITEM
// ─────────────────────────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onRead,
  onDelete,
}: {
  notification: ClientNotification
  onRead:       (id: string) => void
  onDelete:     (id: string) => void
}) {
  const router = useRouter()
  const cfg    = getNotificationConfig(notification.type)
  const route  = cfg.route(notification)

  const handleClick = () => {
    if (!notification.isRead) onRead(notification.id)
    if (route) router.push(route)
  }

  return (
    <div
      className={cn(
        'group relative rounded-xl border transition-all duration-200',
        notification.isRead
          ? 'bg-card border-border/50 hover:border-border'
          : 'bg-primary/3 border-primary/20 hover:border-primary/40 shadow-sm',
        route && 'cursor-pointer'
      )}
      onClick={route ? handleClick : undefined}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={cn('rounded-lg p-2 text-lg shrink-0 leading-none', cfg.color)}>
          {cfg.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {!notification.isRead && (
                <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
              )}
              <p className={cn(
                'text-sm leading-snug truncate',
                notification.isRead ? 'font-normal text-foreground/80' : 'font-semibold text-foreground'
              )}>
                {notification.title}
              </p>
            </div>

            {/* Actions — visible on hover */}
            <div
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {!notification.isRead && (
                <button
                  title="Mark as read"
                  onClick={() => onRead(notification.id)}
                  className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                title="Delete"
                onClick={() => onDelete(notification.id)}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {route && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 pr-4">
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className={cn('text-xs font-medium', cfg.textColor)}>{cfg.label}</span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-xs text-muted-foreground">{timeAgo(notification.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

function NotificationPagination({
  pagination, onPageChange,
}: {
  pagination:   PaginationInfo
  onPageChange: (p: number) => void
}) {
  const { page, totalPages } = pagination
  if (totalPages <= 1) return null

  const pages: (number | 'e')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i)
    else if (pages[pages.length - 1] !== 'e') pages.push('e')
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => { e.preventDefault(); if (page > 1) onPageChange(page - 1) }}
            className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
        {pages.map((p, i) => p === 'e' ? (
          <PaginationEllipsis key={`e${i}`} />
        ) : (
          <PaginationItem key={p}>
            <PaginationLink
              href="#"
              isActive={p === page}
              onClick={(e) => { e.preventDefault(); onPageChange(p) }}
            >
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => { e.preventDefault(); if (page < totalPages) onPageChange(page + 1) }}
            className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT CLIENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationsClientProps {
  initialItems:      ClientNotification[]
  initialPagination: PaginationInfo
  initialUnread:     number
}

export function NotificationsClient({
  initialItems,
  initialPagination,
  initialUnread,
}: NotificationsClientProps) {
  const [items,      setItems]      = useState(initialItems)
  const [pagination, setPagination] = useState(initialPagination)
  const [unread,     setUnread]     = useState(initialUnread)
  const [activeTab,  setActiveTab]  = useState<FilterTab>('all')
  const [page,       setPage]       = useState(1)
  const [loading,    setLoading]    = useState(false)
  const [isPending,  startTransition] = useTransition()
  const [clearOpen,  setClearOpen]  = useState(false)

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetch = useCallback(async (tab: FilterTab, p: number) => {
    setLoading(true)
    const types  = FILTER_TYPE_MAP[tab] ?? undefined
    const isRead = tab === 'unread' ? false : undefined

    const r = await listClientNotifications({ page: p, pageSize: 20, types, isRead })
    if (r.success) {
      setItems(r.data.items)
      setPagination(r.data.pagination)
      setUnread(r.data.unreadCount)
    }
    setLoading(false)
  }, [])

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab)
    setPage(1)
    fetch(tab, 1)
  }

  const handlePageChange = (p: number) => {
    setPage(p)
    fetch(activeTab, p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Mark read ────────────────────────────────────────────────────────────

  const handleMarkRead = (id: string) => {
    // Optimistic update
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
    setUnread((prev) => Math.max(0, prev - 1))

    startTransition(async () => {
      const r = await markNotificationsRead([id])
      if (!r.success) {
        // Revert
        setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: false } : n))
        setUnread((prev) => prev + 1)
        toast.error('Failed to mark as read')
      }
    })
  }

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const r = await markAllNotificationsRead()
      if (r.success) {
        setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnread(0)
        toast.success(`${r.data.count} notifications marked as read`)
      } else {
        toast.error('Failed to mark all as read')
      }
    })
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = (id: string) => {
    const item = items.find((n) => n.id === id)
    setItems((prev) => prev.filter((n) => n.id !== id))
    if (item && !item.isRead) setUnread((prev) => Math.max(0, prev - 1))

    startTransition(async () => {
      const r = await deleteNotification(id)
      if (!r.success) {
        // Revert
        if (item) {
          setItems((prev) => {
            const copy = [...prev, item]
            copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            return copy
          })
          if (!item.isRead) setUnread((prev) => prev + 1)
        }
        toast.error('Failed to delete notification')
      }
    })
  }

  const handleClearRead = async () => {
    const r = await deleteAllReadNotifications()
    if (r.success) {
      toast.success(`${r.data.count} read notifications cleared`)
      fetch(activeTab, 1)
      setPage(1)
    } else {
      toast.error('Failed to clear notifications')
    }
    setClearOpen(false)
  }

  // ── Groups ───────────────────────────────────────────────────────────────

  const groups = groupNotifications(items)

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-0 border-b border-border/50 overflow-x-auto scrollbar-none">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0',
              activeTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            {tab.id === 'unread' && unread > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {pagination.totalCount > 0
            ? `${pagination.totalCount} notification${pagination.totalCount !== 1 ? 's' : ''}`
            : 'No notifications'}
          {unread > 0 && ` · ${unread} unread`}
        </p>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground"
            onClick={() => fetch(activeTab, page)}
            disabled={loading}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            <span className="sr-only">Refresh</span>
          </Button>

          {/* Bulk actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-sm" disabled={isPending}>
                <Filter className="h-3.5 w-3.5" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleMarkAllRead} disabled={unread === 0 || isPending}>
                <CheckCheck className="mr-2 h-4 w-4 text-green-600" />
                Mark all as read
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setClearOpen(true)}
                className="text-destructive focus:text-destructive"
                disabled={isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear read notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10 rounded-xl">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {items.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-dashed bg-muted/20">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-muted mb-4">
              {activeTab === 'unread'
                ? <BellOff className="h-6 w-6 text-muted-foreground" />
                : <Bell className="h-6 w-6 text-muted-foreground" />}
            </div>
            <p className="font-medium text-foreground/70">
              {activeTab === 'unread' ? 'All caught up!' : 'No notifications'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'unread'
                ? 'You have no unread notifications.'
                : "You'll see updates about your bookings, requests, and more here."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.label}>
                {/* Group header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-xs text-muted-foreground">{group.items.length}</span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {group.items.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onRead={handleMarkRead}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <NotificationPagination pagination={pagination} onPageChange={handlePageChange} />
      )}

      {/* Clear read confirmation */}
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Read Notifications</AlertDialogTitle>
            <AlertDialogDescription>
              All notifications you've already read will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearRead}
              className="bg-destructive hover:bg-destructive/90"
            >
              Clear All Read
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}