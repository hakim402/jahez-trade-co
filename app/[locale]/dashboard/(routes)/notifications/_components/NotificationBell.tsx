'use client'

import {
  useState, useEffect, useCallback, useTransition, useRef,
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Bell, BellOff, CheckCheck, Loader2, ArrowRight } from 'lucide-react'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { cn }    from '@/lib/utils'
import { toast } from 'sonner'
import {
  pollUnreadCount, listClientNotifications,
  markNotificationsRead, markAllNotificationsRead,
} from '../actions'
import { getNotificationConfig, type ClientNotification } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 30_000
const PREVIEW_COUNT    = 6

// ─────────────────────────────────────────────────────────────────────────────
// MINI NOTIFICATION ROW
// ─────────────────────────────────────────────────────────────────────────────

function NotificationRow({
  notification, onMarkRead,
}: {
  notification: ClientNotification
  onMarkRead:   (id: string) => void
}) {
  const router = useRouter()
  const cfg    = getNotificationConfig(notification.type)
  const Icon   = cfg.icon
  const route  = cfg.route(notification)

  const handleClick = () => {
    if (!notification.isRead) onMarkRead(notification.id)
    if (route) router.push(route)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left rounded-xl px-3 py-2.5 flex items-start gap-2.5 transition-colors',
        notification.isRead
          ? 'hover:bg-muted/30'
          : 'bg-color/5 hover:bg-color/10',
      )}
    >
      {/* Icon badge */}
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5',
        cfg.iconBg,
      )}>
        <Icon size={14} className={cfg.iconColor} strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1.5">
          {!notification.isRead && (
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0 mt-1.5', cfg.dot)} />
          )}
          <p className={cn(
            'text-xs leading-tight',
            notification.isRead
              ? 'text-foreground/70 font-normal'
              : 'text-foreground font-semibold',
          )}>
            {notification.title}
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate pr-2">
          {notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
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
  initialUnread?:     number
  notificationsPath?: string
}

export function NotificationBell({
  initialUnread     = 0,
  notificationsPath = '/dashboard/notifications',
}: NotificationBellProps) {
  const [open,      setOpen]      = useState(false)
  const [unread,    setUnread]    = useState(initialUnread)
  const [previews,  setPreviews]  = useState<ClientNotification[]>([])
  const [loading,   setLoading]   = useState(false)
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

  // ── Load previews ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return
    setLoading(true)
    listClientNotifications({ page: 1, pageSize: PREVIEW_COUNT }).then(r => {
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
    setPreviews(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
    startTransition(async () => {
      await markNotificationsRead([id])
    })
  }

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const r = await markAllNotificationsRead()
      if (r.success) {
        setPreviews(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnread(0)
        prevUnreadRef.current = 0
        toast.success('All notifications marked as read')
      }
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        >
          <Bell
            size={18}
            className={cn('transition-transform', animating && 'animate-[wiggle_0.5s_ease-in-out]')}
          />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-color px-1 text-[10px] font-bold text-white leading-none">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 rounded-2xl border border-border/15 bg-card/95 backdrop-blur-sm shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
            {unread > 0 && (
              <span className="inline-flex items-center justify-center h-4.5 min-w-4.5 px-1.5 rounded-full bg-color/15 text-color text-[10px] font-bold">
                {unread}
              </span>
            )}
          </div>
          <button
            onClick={handleMarkAllRead}
            disabled={unread === 0 || isPending}
            className="flex items-center gap-1 h-7 px-2.5 text-[11px] font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCheck size={12} />
            Mark all read
          </button>
        </div>

        {/* Preview list */}
        <div className="max-h-80 overflow-y-auto p-1.5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={18} className="animate-spin text-muted-foreground" />
            </div>
          ) : previews.length === 0 ? (
            <div className="py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 mx-auto mb-2">
                <BellOff size={20} className="text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            previews.map(n => (
              <NotificationRow key={n.id} notification={n} onMarkRead={handleMarkRead} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/10 p-2">
          <Link
            href={notificationsPath}
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
          >
            View all notifications
            <ArrowRight size={12} />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}