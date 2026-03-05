'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { Search, Bell, MessageSquare, Menu, Check, CheckCheck, ExternalLink, Loader2 } from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge }    from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebar }   from '@/context/sidebar-context'
import { ThemeToggle }  from '@/app/[locale]/_components/Theme/theme-toggle'
import dynamic          from 'next/dynamic'
import {
  getHeaderNotifications,
  getHeaderChatSessions,
  markNotificationRead,
  markAllNotificationsRead,
  type HeaderNotification,
  type HeaderChatSession,
} from '../_actions/header-actions'

const UserButton = dynamic(
  () => import('@clerk/nextjs').then((m) => m.UserButton),
  { ssr: false },
)

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(date: Date | string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60)   return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return new Date(date).toLocaleDateString()
}

function initials(name: string | null | undefined, email: string) {
  if (name) return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
  return email.slice(0, 2).toUpperCase()
}

// Derive a link from a notification's related entity
function notificationHref(n: HeaderNotification) {
  if (n.bookingId) return `/admin/video-bookings/${n.bookingId}`
  if (n.requestId) return `/admin/product-requests/${n.requestId}`
  if (n.quoteId)   return `/admin/product-requests?quoteId=${n.quoteId}`
  return '/admin/notifications'
}

// Map notification type → accent colour dot
function typeDot(type: string) {
  const t = type.toLowerCase()
  if (t.includes('booking')) return 'bg-blue-400'
  if (t.includes('quote'))   return 'bg-violet-400'
  if (t.includes('request')) return 'bg-amber-400'
  if (t.includes('payment')) return 'bg-emerald-400'
  return 'bg-muted-foreground'
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────

const POLL_INTERVAL = 30_000 // 30 seconds

function NotificationsDropdown() {
  const [open,          setOpen]          = useState(false)
  const [notifications, setNotifications] = useState<HeaderNotification[]>([])
  const [unread,        setUnread]        = useState(0)
  const [loading,       setLoading]       = useState(false)
  const [isPending,     startTransition]  = useTransition()

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const result = await getHeaderNotifications(8)
    if (result.success) {
      setNotifications(result.data.notifications)
      setUnread(result.data.unread)
    }
    if (!silent) setLoading(false)
  }, [])

  // Initial load + polling
  useEffect(() => {
    fetchData()
    const id = setInterval(() => fetchData(true), POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchData])

  // Reload when dropdown opens
  useEffect(() => {
    if (open) fetchData()
  }, [open, fetchData])

  const handleMarkOne = (id: string) => {
    startTransition(async () => {
      await markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnread((u) => Math.max(0, u - 1))
    })
  }

  const handleMarkAll = () => {
    startTransition(async () => {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnread(0)
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground hover:bg-accent/10 cursor-pointer"
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-color rounded-full text-xs flex items-center justify-center text-white font-medium">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 bg-popover border-border p-0">
        {/* Header row */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <DropdownMenuLabel className="p-0 text-popover-foreground font-semibold">
              Notifications
            </DropdownMenuLabel>
            {unread > 0 && (
              <Badge variant="outline" className="text-xs bg-color/10 text-color border-color/30">
                {unread} unread
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isPending && <Loader2 size={14} className="text-muted-foreground animate-spin" />}
            {unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAll}
                className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
              >
                <CheckCheck size={14} className="mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="max-h-95 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors ${
                  n.isRead ? 'opacity-60' : 'bg-accent/5'
                }`}
              >
                {/* Type dot */}
                <div className="mt-1.5 shrink-0">
                  <span className={`block w-2 h-2 rounded-full ${typeDot(n.type)}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-popover-foreground truncate">
                    {n.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {n.user.fullName ?? n.user.email}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground hover:text-emerald-400"
                      onClick={() => handleMarkOne(n.id)}
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <Link href={notificationHref(n)} onClick={() => setOpen(false)}>
                      <ExternalLink size={14} />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-color hover:bg-color/10 justify-center"
            asChild
          >
            <Link href="/admin/notifications" onClick={() => setOpen(false)}>
              View all notifications
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES (CHAT SESSIONS) DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────

function MessagesDropdown() {
  const [open,     setOpen]     = useState(false)
  const [sessions, setSessions] = useState<HeaderChatSession[]>([])
  const [active,   setActive]   = useState(0)
  const [loading,  setLoading]  = useState(false)

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const result = await getHeaderChatSessions(6)
    if (result.success) {
      setSessions(result.data.sessions)
      setActive(result.data.activeSessions)
    }
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(() => fetchData(true), POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchData])

  useEffect(() => {
    if (open) fetchData()
  }, [open, fetchData])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground hover:bg-accent/10 cursor-pointer"
        >
          <MessageSquare size={20} />
          {active > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full text-xs flex items-center justify-center text-white font-medium">
              {active > 99 ? '99+' : active}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 bg-popover border-border p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <DropdownMenuLabel className="p-0 text-popover-foreground font-semibold">
            Chat Sessions
          </DropdownMenuLabel>
          {active > 0 && (
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              {active} active
            </Badge>
          )}
        </div>

        {/* List */}
        <div className="max-h-85 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <MessageSquare size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No chat sessions</p>
            </div>
          ) : (
            sessions.map((s) => (
              <DropdownMenuItem key={s.id} asChild>
                <Link
                  href={`/admin/messages/${s.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-accent/10 border-b border-border/50 last:border-0"
                >
                  <div className="relative shrink-0">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={s.user?.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                        {s.user
                          ? initials(s.user.fullName, s.user.email)
                          : '??'}
                      </AvatarFallback>
                    </Avatar>
                    {/* Green dot = active (no endedAt) */}
                    {!s.endedAt && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-popover rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-popover-foreground truncate">
                        {s.user?.fullName ?? s.user?.email ?? 'Anonymous'}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {timeAgo(s.startedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {s.lastMessage
                        ? `${s.lastMessage.role === 'user' ? '👤' : '🤖'} ${s.lastMessage.content}`
                        : 'No messages yet'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.messageCount} message{s.messageCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </div>

        {/* Footer */}
        <DropdownMenuSeparator className="bg-border" />
        <div className="px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-color hover:bg-color/10 justify-center"
            asChild
          >
            <Link href="/admin/messages" onClick={() => setOpen(false)}>
              View all sessions
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HEADER
// ─────────────────────────────────────────────────────────────────────────────

export function AdminHeader() {
  const { toggleMobile } = useSidebar()

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-sm border-b border-border px-4 lg:px-6">
      <div className="flex items-center justify-between h-full max-w-480 mx-auto">
        {/* Left */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobile}
            className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-accent/10"
          >
            <Menu size={20} />
          </Button>

          <div className="relative hidden sm:block">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              type="search"
              placeholder="Search anything..."
              className="w-64 lg:w-80 pl-10 bg-background/10 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="-mr-1">
            <ThemeToggle />
          </div>

          {/* Real messages dropdown */}
          <MessagesDropdown />

          {/* Real notifications dropdown */}
          <NotificationsDropdown />

          {/* Clerk user button */}
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: { avatarBox: 'w-8 h-8 border-2 border-indigo-500 -mt-1' },
            }}
          />
        </div>
      </div>
    </header>
  )
}