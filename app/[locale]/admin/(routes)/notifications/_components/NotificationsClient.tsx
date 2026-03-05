'use client'

import {
  useState, useEffect, useCallback, useTransition, useRef,
} from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Bell, Search, Filter, CheckCheck, Trash2, Send,
  Radio, ChevronDown, X, Loader2, Check, ExternalLink,
  BookOpen, FileText, Video, CreditCard, RefreshCw,
} from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Badge }    from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  listNotifications, markNotificationsRead, markNotificationsUnread,
  deleteNotifications, markAllRead,
  type NotificationItem, type NotificationStats, type ListNotificationsParams,
} from '../actions'
import { SendNotificationModal } from './SendNotificationModal'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TAKE = 20

const TYPE_OPTIONS = [
  { value: '',        label: 'All types' },
  { value: 'BOOKING', label: 'Booking',  icon: Video },
  { value: 'QUOTE',   label: 'Quote',    icon: FileText },
  { value: 'REQUEST', label: 'Request',  icon: BookOpen },
  { value: 'PAYMENT', label: 'Payment',  icon: CreditCard },
  { value: 'SYSTEM',  label: 'System',   icon: Bell },
]

const READ_OPTIONS = [
  { value: undefined, label: 'All'    },
  { value: false,     label: 'Unread' },
  { value: true,      label: 'Read'   },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(date: Date | string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return format(new Date(date), 'MMM d, yyyy')
}

function entityHref(n: NotificationItem) {
  if (n.bookingId) return `/admin/video-bookings/${n.bookingId}`
  if (n.requestId) return `/admin/product-requests/${n.requestId}`
  if (n.quoteId)   return `/admin/product-requests?quoteId=${n.quoteId}`
  return null
}

function typeMeta(type: string) {
  const t = type.toUpperCase()
  if (t.includes('BOOKING')) return { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    dot: 'bg-blue-400',    icon: Video }
  if (t.includes('QUOTE'))   return { color: 'bg-violet-500/10 text-violet-400 border-violet-500/20', dot: 'bg-violet-400', icon: FileText }
  if (t.includes('REQUEST')) return { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',  dot: 'bg-amber-400',  icon: BookOpen }
  if (t.includes('PAYMENT')) return { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400', icon: CreditCard }
  return { color: 'bg-muted/50 text-muted-foreground border-border',                                dot: 'bg-muted-foreground', icon: Bell }
}

function initials(name: string | null, email: string) {
  if (name) return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  return email.slice(0, 2).toUpperCase()
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER BAR
// ─────────────────────────────────────────────────────────────────────────────

interface Filters {
  search:   string
  type:     string
  isRead:   boolean | undefined
  dateFrom: string
  dateTo:   string
  userId:   string
}

const DEFAULT_FILTERS: Filters = {
  search: '', type: '', isRead: undefined,
  dateFrom: '', dateTo: '', userId: '',
}

interface FilterBarProps {
  filters: Filters
  onChange: (f: Filters) => void
  activeCount: number
  onReset: () => void
}

function FilterBar({ filters, onChange, activeCount, onReset }: FilterBarProps) {
  const set = (key: keyof Filters, val: unknown) =>
    onChange({ ...filters, [key]: val })

  const readLabel = READ_OPTIONS.find(o => o.value === filters.isRead)?.label ?? 'All'
  const typeLabel = TYPE_OPTIONS.find(o => o.value === filters.type)?.label   ?? 'All types'

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-50">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          placeholder="Search title or message…"
          className="pl-9 bg-card/50 border-border/50 h-9 text-sm"
        />
        {filters.search && (
          <Button onClick={() => set('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={14} />
          </Button>
        )}
      </div>

      {/* Type filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="bg-card/50 border-border/50 h-9 gap-1.5 text-sm">
            <Filter size={14} />
            {typeLabel}
            <ChevronDown size={12} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-popover border-border">
          {TYPE_OPTIONS.map(o => (
            <DropdownMenuItem
              key={o.value}
              onClick={() => set('type', o.value)}
              className={`text-sm cursor-pointer ${filters.type === o.value ? 'text-color' : ''}`}
            >
              {o.label}
              {filters.type === o.value && <Check size={14} className="ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Read filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="bg-card/50 border-border/50 h-9 gap-1.5 text-sm">
            <Bell size={14} />
            {readLabel}
            <ChevronDown size={12} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-popover border-border">
          {READ_OPTIONS.map((o, i) => (
            <DropdownMenuItem
              key={i}
              onClick={() => set('isRead', o.value)}
              className={`text-sm cursor-pointer ${filters.isRead === o.value ? 'text-color' : ''}`}
            >
              {o.label}
              {filters.isRead === o.value && <Check size={14} className="ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Date from */}
      <Input
        type="date"
        value={filters.dateFrom}
        onChange={e => set('dateFrom', e.target.value)}
        className="w-36 bg-card/50 border-border/50 h-9 text-sm"
      />
      <span className="text-muted-foreground text-xs">→</span>
      <Input
        type="date"
        value={filters.dateTo}
        onChange={e => set('dateTo', e.target.value)}
        className="w-36 bg-card/50 border-border/50 h-9 text-sm"
      />

      {/* Reset */}
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={onReset} className="h-9 text-muted-foreground hover:text-foreground gap-1.5">
          <X size={14} />
          Reset ({activeCount})
        </Button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK ACTION BAR
// ─────────────────────────────────────────────────────────────────────────────

interface BulkBarProps {
  selected: Set<string>
  onMarkRead:   () => void
  onMarkUnread: () => void
  onDelete:     () => void
  onClear:      () => void
  isPending:    boolean
}

function BulkBar({ selected, onMarkRead, onMarkUnread, onDelete, onClear, isPending }: BulkBarProps) {
  if (selected.size === 0) return null
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-color/10 border border-color/20">
      <span className="text-sm font-medium text-color">{selected.size} selected</span>
      <div className="flex items-center gap-2 ml-auto">
        <Button size="sm" variant="ghost" onClick={onMarkRead}
          className="h-8 text-xs text-emerald-400 hover:bg-emerald-500/10" disabled={isPending}>
          <Check size={14} className="mr-1" /> Mark read
        </Button>
        <Button size="sm" variant="ghost" onClick={onMarkUnread}
          className="h-8 text-xs text-amber-400 hover:bg-amber-500/10" disabled={isPending}>
          <Bell size={14} className="mr-1" /> Mark unread
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}
          className="h-8 text-xs text-red-400 hover:bg-red-500/10" disabled={isPending}>
          <Trash2 size={14} className="mr-1" /> Delete
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear}
          className="h-8 text-xs text-muted-foreground">
          <X size={14} />
        </Button>
      </div>
      {isPending && <Loader2 size={14} className="animate-spin text-color" />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION ROW
// ─────────────────────────────────────────────────────────────────────────────

interface RowProps {
  n:          NotificationItem
  selected:   boolean
  onSelect:   (id: string, checked: boolean) => void
  onMarkRead: (id: string) => void
}

function NotificationRow({ n, selected, onSelect, onMarkRead }: RowProps) {
  const meta = typeMeta(n.type)
  const Icon = meta.icon
  const href = entityHref(n)

  return (
    <div className={`group flex items-start gap-4 px-5 py-4 border-b border-border/40 last:border-0 transition-colors ${
      selected ? 'bg-color/5' : n.isRead ? '' : 'bg-accent/5'
    } hover:bg-accent/10`}>
      {/* Checkbox */}
      <div className="pt-0.5">
        <Checkbox
          checked={selected}
          onCheckedChange={v => onSelect(n.id, !!v)}
          className="border-border/50 data-[state=checked]:bg-color data-[state=checked]:border-color"
        />
      </div>

      {/* Unread dot */}
      <div className="pt-2 shrink-0">
        <span className={`block w-2 h-2 rounded-full transition-opacity ${
          n.isRead ? 'opacity-0' : meta.dot
        }`} />
      </div>

      {/* User avatar */}
      <Avatar className="w-9 h-9 shrink-0 border border-border/20">
        <AvatarImage src={n.user.avatarUrl ?? undefined} />
        <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
          {initials(n.user.fullName, n.user.email)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-sm font-medium truncate ${n.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
              {n.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`text-xs flex items-center gap-1 ${meta.color}`}>
              <Icon size={10} />
              {n.type}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground truncate">
            {n.user.fullName ?? n.user.email}
          </span>
        </div>
      </div>

      {/* Row actions — visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!n.isRead && (
          <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-emerald-400"
            onClick={() => onMarkRead(n.id)} title="Mark as read">
            <Check size={15} />
          </Button>
        )}
        {href && (
          <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground" asChild>
            <Link href={href} title="View entity"><ExternalLink size={15} /></Link>
          </Button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CLIENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  initialStats: NotificationStats | null
}

export function NotificationsClient({ initialStats }: Props) {
  const [items,       setItems]       = useState<NotificationItem[]>([])
  const [nextCursor,  setNextCursor]  = useState<string | null>(null)
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isPending,   startTransition]= useTransition()

  const [filters,  setFilters]  = useState<Filters>(DEFAULT_FILTERS)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sendModalOpen, setSendModalOpen]           = useState(false)
  const [sendMode, setSendMode]                     = useState<'single' | 'broadcast'>('single')

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Count active filters for reset badge
  const activeFilterCount = [
    filters.search, filters.type,
    filters.isRead !== undefined ? '1' : '',
    filters.dateFrom, filters.dateTo, filters.userId,
  ].filter(Boolean).length

  // ── Build query params from filters ────────────────────────────────────────
  const buildParams = useCallback((cursor?: string): ListNotificationsParams => ({
    take:     TAKE,
    cursor,
    search:   filters.search   || undefined,
    type:     filters.type     || undefined,
    isRead:   filters.isRead,
    userId:   filters.userId   || undefined,
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    dateTo:   filters.dateTo   ? new Date(filters.dateTo)   : undefined,
  }), [filters])

  // ── Initial / filter-change load ───────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setSelected(new Set())
    const result = await listNotifications(buildParams())
    if (result.success) {
      setItems(result.data.items)
      setNextCursor(result.data.nextCursor)
      setTotal(result.data.total)
    }
    setLoading(false)
  }, [buildParams])

  // Debounce filter changes (300 ms)
  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  // ── Load more ──────────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    const result = await listNotifications(buildParams(nextCursor))
    if (result.success) {
      setItems(prev => [...prev, ...result.data.items])
      setNextCursor(result.data.nextCursor)
    }
    setLoadingMore(false)
  }, [nextCursor, loadingMore, buildParams])

  // ── Intersection observer for infinite scroll ──────────────────────────────
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore()
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore])

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleSelect = (id: string, checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev)
      checked ? next.add(id) : next.delete(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map(i => i.id)))
  }

  // ── Bulk actions ───────────────────────────────────────────────────────────
  const bulkMarkRead = () => {
    startTransition(async () => {
      const ids = [...selected]
      await markNotificationsRead(ids)
      setItems(prev => prev.map(n => selected.has(n.id) ? { ...n, isRead: true } : n))
      setSelected(new Set())
    })
  }

  const bulkMarkUnread = () => {
    startTransition(async () => {
      const ids = [...selected]
      await markNotificationsUnread(ids)
      setItems(prev => prev.map(n => selected.has(n.id) ? { ...n, isRead: false } : n))
      setSelected(new Set())
    })
  }

  const bulkDelete = () => {
    startTransition(async () => {
      const ids = [...selected]
      await deleteNotifications(ids)
      setItems(prev => prev.filter(n => !selected.has(n.id)))
      setTotal(t => t - ids.length)
      setSelected(new Set())
    })
  }

  const handleMarkOneRead = (id: string) => {
    startTransition(async () => {
      await markNotificationsRead([id])
      setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    })
  }

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllRead()
      setItems(prev => prev.map(n => ({ ...n, isRead: true })))
    })
  }

  const unreadCount = items.filter(n => !n.isRead).length

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          activeCount={activeFilterCount}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />

        <div className="flex items-center gap-2 shrink-0">
          {/* Refresh */}
          <Button variant="ghost" size="icon" onClick={load}
            className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Refresh">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>

          {/* Mark all read */}
          {unreadCount > 0 && (
            <Button variant="outline" size="sm"
              className="h-9 text-sm border-border/50 bg-card/50 gap-1.5"
              onClick={handleMarkAllRead} disabled={isPending}>
              <CheckCheck size={14} /> Mark all read
            </Button>
          )}

          {/* Send to user */}
          <Button size="sm" className="h-9 bg-color hover:bg-color/90 text-white gap-1.5"
            onClick={() => { setSendMode('single'); setSendModalOpen(true) }}>
            <Send size={14} /> Send
          </Button>

          {/* Broadcast */}
          <Button size="sm" variant="outline"
            className="h-9 border-color/40 text-color hover:bg-color/10 gap-1.5"
            onClick={() => { setSendMode('broadcast'); setSendModalOpen(true) }}>
            <Radio size={14} /> Broadcast
          </Button>
        </div>
      </div>

      {/* Bulk action bar */}
      <BulkBar
        selected={selected}
        onMarkRead={bulkMarkRead}
        onMarkUnread={bulkMarkUnread}
        onDelete={bulkDelete}
        onClear={() => setSelected(new Set())}
        isPending={isPending}
      />

      {/* List */}
      <div className="rounded-xl border border-border/5 bg-card/50 overflow-hidden">
        {/* List header */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border/40 bg-muted/10">
          <Checkbox
            checked={items.length > 0 && selected.size === items.length}
            onCheckedChange={toggleSelectAll}
            className="border-border/50 data-[state=checked]:bg-color data-[state=checked]:border-color"
          />
          <span className="text-xs text-muted-foreground font-medium">
            {loading ? 'Loading…' : `${total.toLocaleString()} notification${total !== 1 ? 's' : ''}`}
          </span>
          {selected.size > 0 && (
            <span className="text-xs text-color ml-auto">{selected.size} selected</span>
          )}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-sm">Loading notifications…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Bell size={40} className="opacity-20" />
            <span className="text-sm">No notifications found</span>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-color hover:text-color/80 text-xs">
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          items.map(n => (
            <NotificationRow
              key={n.id}
              n={n}
              selected={selected.has(n.id)}
              onSelect={toggleSelect}
              onMarkRead={handleMarkOneRead}
            />
          ))
        )}

        {/* Load more sentinel */}
        {!loading && nextCursor && (
          <div ref={sentinelRef} className="flex items-center justify-center py-6">
            {loadingMore
              ? <Loader2 size={20} className="animate-spin text-muted-foreground" />
              : <span className="text-xs text-muted-foreground">Scroll to load more</span>
            }
          </div>
        )}

        {!loading && !nextCursor && items.length > 0 && (
          <div className="flex items-center justify-center py-4 border-t border-border/20">
            <span className="text-xs text-muted-foreground">
              All {total.toLocaleString()} notifications loaded
            </span>
          </div>
        )}
      </div>

      {/* Send / Broadcast modal */}
      <SendNotificationModal
        open={sendModalOpen}
        mode={sendMode}
        onClose={() => setSendModalOpen(false)}
        onSuccess={load}
      />
    </>
  )
}