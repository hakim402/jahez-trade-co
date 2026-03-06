'use client'

import {
  useState, useEffect, useCallback, useTransition, useRef,
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Bell, BellOff, Check, CheckCheck, Loader2, ArrowRight } from 'lucide-react'
import { Button }  from '@/components/ui/button'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { cn }      from '@/lib/utils'
import { toast }   from 'sonner'
import {
  pollUnreadCount, listClientNotifications, markNotificationsRead, markAllNotificationsRead,
} from '../actions'
import { getNotificationConfig, type ClientNotification } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 30_000   // 30 seconds
const PREVIEW_COUNT    = 6

// ─────────────────────────────────────────────────────────────────────────────
// MINI NOTIFICATION ROW (inside popover)
// ─────────────────────────────────────────────────────────────────────────────

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: ClientNotification
  onMarkRead:   (id: string) => void
}) {
  const router = useRouter()
  const cfg    = getNotificationConfig(notification.type)
  const route  = cfg.route(notification)

  const handleClick = () => {
    if (!notification.isRead) onMarkRead(notification.id)
    if (route) router.push(route)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left rounded-lg px-3 py-2.5 flex items-start gap-2.5 transition-colors hover:bg-muted/60',
        !notification.isRead && 'bg-primary/3'
      )}
    >
      {/* Icon */}
      <div className={cn('rounded-md p-1.5 text-sm leading-none shrink-0 mt-0.5', cfg.color)}>
        {cfg.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1.5">
          {!notification.isRead && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
          <p className={cn(
            'text-sm leading-tight',
            notification.isRead ? 'text-foreground/70 font-normal' : 'text-foreground font-medium'
          )}>
            {notification.title}
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate pr-2">
          {notification.message}
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BELL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationBellProps {
  /** Initial unread count from SSR */
  initialUnread?: number
  /** Notifications page path (defaults to /dashboard/notifications) */
  notificationsPath?: string
}

export function NotificationBell({
  initialUnread     = 0,
  notificationsPath = '/dashboard/notifications',
}: NotificationBellProps) {
  const [open,     setOpen]     = useState(false)
  const [unread,   setUnread]   = useState(initialUnread)
  const [previews, setPreviews] = useState<ClientNotification[]>([])
  const [loading,  setLoading]  = useState(false)
  const [animating, setAnimating] = useState(false)
  const [isPending, startTransition] = useTransition()
  const prevUnreadRef = useRef(initialUnread)
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Polling ──────────────────────────────────────────────────────────────

  const poll = useCallback(async () => {
    const r = await pollUnreadCount()
    if (r.success) {
      const newCount = r.data.unreadCount
      if (newCount > prevUnreadRef.current) {
        // New notifications arrived — animate bell
        setAnimating(true)
        setTimeout(() => setAnimating(false), 1000)
      }
      prevUnreadRef.current = newCount
      setUnread(newCount)
    }
  }, [])

  useEffect(() => {
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [poll])

  // ── Load previews when popover opens ─────────────────────────────────────

  useEffect(() => {
    if (!open) return
    setLoading(true)
    listClientNotifications({ page: 1, pageSize: PREVIEW_COUNT }).then((r) => {
      if (r.success) {
        setPreviews(r.data.items)
        setUnread(r.data.unreadCount)
        prevUnreadRef.current = r.data.unreadCount
      }
      setLoading(false)
    })
  }, [open])

  // ── Mark read ─────────────────────────────────────────────────────────────

  const handleMarkRead = (id: string) => {
    setPreviews((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
    setUnread((prev) => Math.max(0, prev - 1))

    startTransition(async () => {
      await markNotificationsRead([id])
    })
  }

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const r = await markAllNotificationsRead()
      if (r.success) {
        setPreviews((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnread(0)
        prevUnreadRef.current = 0
        toast.success('All notifications marked as read')
      }
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        >
          <Bell
            className={cn(
              'h-4.5 w-4.5 transition-transform',
              animating && 'animate-[wiggle_0.5s_ease-in-out]'
            )}
          />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground leading-none">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 shadow-lg rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unread > 0 && (
              <span className="inline-flex items-center justify-center h-4.5 min-w-4.5 px-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                {unread}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
            onClick={handleMarkAllRead}
            disabled={unread === 0 || isPending}
          >
            <CheckCheck className="h-3 w-3" />
            Mark all read
          </Button>
        </div>

        {/* Preview list */}
        <div className="max-h-80 overflow-y-auto p-1.5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : previews.length === 0 ? (
            <div className="py-10 text-center">
              <BellOff className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            previews.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onMarkRead={handleMarkRead}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-2">
          <Link
            href={notificationsPath}
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 w-full rounded-lg py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            View all notifications
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}