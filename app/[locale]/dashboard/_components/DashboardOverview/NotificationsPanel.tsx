'use client'

import {
  useState, useEffect, useCallback, useTransition, useRef,
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Bell, BellOff, CheckCheck, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  pollUnreadCount,
  listClientNotifications,
  markNotificationsRead,
  markAllNotificationsRead,
} from '../../(routes)/notifications/actions'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const POLL_MS     = 30_000
const PREVIEW_N   = 6

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION TYPE → ICON EMOJI
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, string> = {
  BOOKING_SCHEDULED: '🗓️',
  BOOKING_CONFIRMED: '✅',
  BOOKING_COMPLETED: '🎉',
  BOOKING_CANCELLED: '🚫',
  BOOKING_NO_SHOW:   '👻',
  REQUEST_SUBMITTED: '📋',
  REQUEST_APPROVED:  '🟢',
  REQUEST_REJECTED:  '🔴',
  REQUEST_STATUS_UPDATED: '📦',
  QUOTE_SENT:        '💰',
  QUOTE_UPDATED:     '📝',
  NEW_MESSAGE:       '💬',
  SYSTEM:            '⚙️',
  ANNOUNCEMENT:      '📣',
}

function getTypeIcon(type: string) {
  return TYPE_ICON[type] ?? '🔔'
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI NOTIFICATION ROW
// ─────────────────────────────────────────────────────────────────────────────

type PreviewItem = {
  id:        string
  title:     string
  message:   string
  type:      string
  isRead:    boolean
  createdAt: Date
  bookingId: string | null
  requestId: string | null
  quoteId:   string | null
}

function NotifRow({
  item, onRead,
}: {
  item:   PreviewItem
  onRead: (id: string) => void
}) {
  const router = useRouter()
  const route  = item.bookingId
    ? '/dashboard/video-bookings'
    : item.requestId
      ? '/dashboard/requests'
      : item.type === 'NEW_MESSAGE'
        ? '/dashboard/messages'
        : '/dashboard/notifications'

  const handleClick = () => {
    if (!item.isRead) onRead(item.id)
    router.push(route)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left rounded-lg px-3 py-2.5 flex items-start gap-2.5 transition-colors hover:bg-muted/60',
        !item.isRead && 'bg-primary/3',
      )}
    >
      {/* Emoji icon */}
      <span className="text-base mt-0.5 shrink-0 leading-none">{getTypeIcon(item.type)}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1">
          {!item.isRead && (
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mt-1" />
          )}
          <p className={cn(
            'text-sm leading-snug line-clamp-1',
            item.isRead ? 'text-foreground/70' : 'font-medium text-foreground',
          )}>
            {item.title}
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 pr-2">
          {item.message}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </p>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BELL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationsPanelProps {
  initialUnread?: number
}

export function NotificationsPanel({ initialUnread = 0 }: NotificationsPanelProps) {
  const [open,      setOpen]      = useState(false)
  const [unread,    setUnread]    = useState(initialUnread)
  const [previews,  setPreviews]  = useState<PreviewItem[]>([])
  const [loading,   setLoading]   = useState(false)
  const [animating, setAnimating] = useState(false)
  const [isPending, startTransition] = useTransition()
  const prevCountRef = useRef(initialUnread)
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Polling ────────────────────────────────────────────────────────────────
  const poll = useCallback(async () => {
    const r = await pollUnreadCount()
    if (r.success) {
      if (r.data.unreadCount > prevCountRef.current) {
        setAnimating(true)
        setTimeout(() => setAnimating(false), 800)
      }
      prevCountRef.current = r.data.unreadCount
      setUnread(r.data.unreadCount)
    }
  }, [])

  useEffect(() => {
    pollRef.current = setInterval(poll, POLL_MS)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [poll])

  // ── Load previews on open ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    setLoading(true)
    listClientNotifications({ page: 1, pageSize: PREVIEW_N }).then((r) => {
      if (r.success) {
        setPreviews(r.data.items as PreviewItem[])
        setUnread(r.data.unreadCount)
        prevCountRef.current = r.data.unreadCount
      }
      setLoading(false)
    })
  }, [open])

  // ── Mark read ──────────────────────────────────────────────────────────────
  const handleMarkRead = (id: string) => {
    setPreviews((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
    setUnread((p) => Math.max(0, p - 1))
    startTransition(() => { markNotificationsRead([id]) })
  }

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const r = await markAllNotificationsRead()
      if (r.success) {
        setPreviews((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnread(0)
        prevCountRef.current = 0
        toast.success('All marked as read')
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
          aria-label={`Notifications${unread > 0 ? ` — ${unread} unread` : ''}`}
        >
          <Bell className={cn(
            'h-4.5 w-4.5 transition-transform',
            animating && 'animate-[wiggle_0.5s_ease-in-out]',
          )} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-500 px-1 text-[10px] font-bold text-white leading-none">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 shadow-xl rounded-xl overflow-hidden border border-border/60"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unread > 0 && (
              <span className="inline-flex items-center justify-center h-4.5 min-w-4.5 px-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                {unread}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground gap-1 px-2"
            onClick={handleMarkAllRead}
            disabled={unread === 0 || isPending}
          >
            <CheckCheck className="h-3 w-3" />
            Mark all read
          </Button>
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto p-1.5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : previews.length === 0 ? (
            <div className="py-10 text-center">
              <BellOff className="h-7 w-7 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            previews.map((n) => (
              <NotifRow key={n.id} item={n} onRead={handleMarkRead} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/50 p-1.5">
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 w-full rounded-lg py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            View all notifications
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}