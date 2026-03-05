'use client'

import {
  useState, useEffect, useCallback, useRef, useTransition, useLayoutEffect,
} from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import {
  Search, MessageSquare, Zap, Clock, Trash2,
  StopCircle, Send, Loader2, RefreshCw, ChevronDown,
  X, Check, Filter, Bot, User2, AlertTriangle,
} from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge }    from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  listSessions, getSessionDetail, pollNewMessages,
  adminReply, endSession, deleteSession,
  type SessionListItem, type SessionDetail, type MessageItem,
  type ListSessionsParams,
} from '../actions'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TAKE         = 20
const POLL_MS      = 5_000   // 5-second polling for live messages

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatSessionTime(date: Date | string) {
  const d = new Date(date)
  if (isToday(d))     return format(d, 'h:mm a')
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d')
}

function formatMsgTime(date: Date | string) {
  return format(new Date(date), 'h:mm a')
}

function formatMsgDate(date: Date | string) {
  const d = new Date(date)
  if (isToday(d))     return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMMM d, yyyy')
}

function initials(name: string | null | undefined, email: string) {
  if (name) return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  return email.slice(0, 2).toUpperCase()
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

// Group messages by calendar day for date separators
function groupByDay(messages: MessageItem[]) {
  const groups: { date: string; messages: MessageItem[] }[] = []
  for (const msg of messages) {
    const day = format(new Date(msg.createdAt), 'yyyy-MM-dd')
    const last = groups[groups.length - 1]
    if (last?.date === day) last.messages.push(msg)
    else groups.push({ date: day, messages: [msg] })
  }
  return groups
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION LIST ITEM ROW
// ─────────────────────────────────────────────────────────────────────────────

interface SessionRowProps {
  session:    SessionListItem
  isSelected: boolean
  onClick:    () => void
}

function SessionRow({ session, isSelected, onClick }: SessionRowProps) {
  const user = session.user
  const name = user?.fullName ?? user?.email ?? 'Anonymous'

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-border/30 last:border-0 text-left transition-colors ${
        isSelected
          ? 'bg-color/10 border-l-2 border-l-color'
          : 'hover:bg-accent/10 border-l-2 border-l-transparent'
      }`}
    >
      {/* Avatar with active dot */}
      <div className="relative shrink-0">
        <Avatar className="w-10 h-10 border border-border/20">
          <AvatarImage src={user?.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs font-medium">
            {user ? initials(user.fullName, user.email) : '??'}
          </AvatarFallback>
        </Avatar>
        {session.isActive && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-medium truncate ${isSelected ? 'text-color' : 'text-foreground'}`}>
            {truncate(name, 22)}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatSessionTime(session.startedAt)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {session.lastMessage
            ? `${session.lastMessage.role === 'assistant' ? '🤖 ' : ''}${session.lastMessage.content}`
            : 'No messages yet'}
        </p>

        <div className="flex items-center gap-2 mt-1.5">
          <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border ${
            session.isActive
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-muted/30 text-muted-foreground border-border/30'
          }`}>
            {session.isActive ? <><Zap size={9} /> Active</> : <><Clock size={9} /> Ended</>}
          </span>
          <span className="text-xs text-muted-foreground">
            {session.messageCount} msg{session.messageCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION LIST PANEL
// ─────────────────────────────────────────────────────────────────────────────

interface Filters {
  search:   string
  isActive: boolean | undefined
  dateFrom: string
  dateTo:   string
}
const DEFAULT_FILTERS: Filters = { search: '', isActive: undefined, dateFrom: '', dateTo: '' }

interface SessionListPanelProps {
  selectedId: string | null
  onSelect:   (id: string) => void
}

function SessionListPanel({ selectedId, onSelect }: SessionListPanelProps) {
  const [items,       setItems]       = useState<SessionListItem[]>([])
  const [nextCursor,  setNextCursor]  = useState<string | null>(null)
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filters,     setFilters]     = useState<Filters>(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const buildParams = useCallback((cursor?: string): ListSessionsParams => ({
    take:     TAKE,
    cursor,
    search:   filters.search   || undefined,
    isActive: filters.isActive,
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    dateTo:   filters.dateTo   ? new Date(filters.dateTo)   : undefined,
  }), [filters])

  const load = useCallback(async () => {
    setLoading(true)
    const r = await listSessions(buildParams())
    if (r.success) { setItems(r.data.items); setNextCursor(r.data.nextCursor); setTotal(r.data.total) }
    setLoading(false)
  }, [buildParams])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    const r = await listSessions(buildParams(nextCursor))
    if (r.success) {
      setItems(prev => [...prev, ...r.data.items])
      setNextCursor(r.data.nextCursor)
    }
    setLoadingMore(false)
  }, [nextCursor, loadingMore, buildParams])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(e => { if (e[0].isIntersecting) loadMore() }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore])

  const setFilter = (key: keyof Filters, val: unknown) =>
    setFilters(prev => ({ ...prev, [key]: val }))

  const activeFilterCount = [
    filters.search,
    filters.isActive !== undefined ? '1' : '',
    filters.dateFrom, filters.dateTo,
  ].filter(Boolean).length

  return (
    <div className="flex flex-col h-full">
      {/* List header */}
      <div className="px-4 py-3 border-b border-border/30 space-y-2">
        {/* Search + filter toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <Input
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              placeholder="Search users…"
              className="pl-8 h-8 text-xs bg-background/50 border-border/40"
            />
            {filters.search && (
              <Button onClick={() => setFilter('search', '')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={12} />
              </Button>
            )}
          </div>
          <Button variant="ghost" size="icon"
            onClick={() => setShowFilters(p => !p)}
            className={`h-8 w-8 shrink-0 ${showFilters || activeFilterCount > 0 ? 'text-color' : 'text-muted-foreground'}`}>
            <Filter size={14} />
          </Button>
          <Button variant="ghost" size="icon" onClick={load}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div className="space-y-2 pt-1">
            {/* Active filter */}
            <div className="flex gap-1.5">
              {[
                { label: 'All',    value: undefined },
                { label: 'Active', value: true },
                { label: 'Ended',  value: false },
              ].map(o => (
                <button
                  key={String(o.value)}
                  onClick={() => setFilter('isActive', o.value)}
                  className={`flex-1 text-xs px-2 py-1 rounded-md border transition-colors ${
                    filters.isActive === o.value
                      ? 'bg-color/20 text-color border-color/30'
                      : 'border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {/* Date range */}
            <div className="flex items-center gap-1.5">
              <Input type="date" value={filters.dateFrom}
                onChange={e => setFilter('dateFrom', e.target.value)}
                className="h-7 text-xs bg-background/50 border-border/40 flex-1" />
              <span className="text-muted-foreground text-xs">–</span>
              <Input type="date" value={filters.dateTo}
                onChange={e => setFilter('dateTo', e.target.value)}
                className="h-7 text-xs bg-background/50 border-border/40 flex-1" />
            </div>
            {activeFilterCount > 0 && (
              <button onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-xs text-muted-foreground hover:text-color transition-colors flex items-center gap-1">
                <X size={11} /> Reset filters
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {loading ? 'Loading…' : `${total.toLocaleString()} session${total !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* List body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <MessageSquare size={32} className="opacity-20" />
            <p className="text-sm">No sessions found</p>
          </div>
        ) : (
          <>
            {items.map(s => (
              <SessionRow
                key={s.id}
                session={s}
                isSelected={s.id === selectedId}
                onClick={() => onSelect(s.id)}
              />
            ))}
            <div ref={sentinelRef} className="flex items-center justify-center py-4">
              {loadingMore && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATION PANEL
// ─────────────────────────────────────────────────────────────────────────────

interface ConversationPanelProps {
  sessionId: string
  onDeleted: () => void
}

function ConversationPanel({ sessionId, onDeleted }: ConversationPanelProps) {
  const [detail,      setDetail]      = useState<SessionDetail | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [replyText,   setReplyText]   = useState('')
  const [isPending,   startTransition]= useTransition()
  const [endConfirm,  setEndConfirm]  = useState(false)
  const [delConfirm,  setDelConfirm]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const lastMsgId      = useRef<string | null>(null)
  const pollRef        = useRef<ReturnType<typeof setInterval>>()

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  // Initial load
  useEffect(() => {
    setLoading(true)
    setDetail(null)
    setError(null)
    setReplyText('')
    setEndConfirm(false)
    setDelConfirm(false)

    getSessionDetail(sessionId).then(r => {
      if (r.success) {
        setDetail(r.data)
        const msgs = r.data.messages
        lastMsgId.current = msgs.length > 0 ? msgs[msgs.length - 1].id : null
      } else {
        setError(r.error)
      }
      setLoading(false)
    })
  }, [sessionId])

  // Scroll after initial load
  useLayoutEffect(() => {
    if (!loading && detail) scrollToBottom(false)
  }, [loading, detail, scrollToBottom])

  // Polling for live updates
  useEffect(() => {
    if (!detail?.isActive) return

    pollRef.current = setInterval(async () => {
      const r = await pollNewMessages(sessionId, lastMsgId.current)
      if (!r.success) return

      if (r.data.messages.length > 0) {
        setDetail(prev => {
          if (!prev) return prev
          const newMsgs = r.data.messages
          lastMsgId.current = newMsgs[newMsgs.length - 1].id
          return { ...prev, messages: [...prev.messages, ...newMsgs] }
        })
        scrollToBottom()
      }

      if (r.data.sessionEndedAt) {
        setDetail(prev => prev ? { ...prev, isActive: false, endedAt: r.data.sessionEndedAt } : prev)
        clearInterval(pollRef.current)
      }
    }, POLL_MS)

    return () => clearInterval(pollRef.current)
  }, [sessionId, detail?.isActive, scrollToBottom])

  // Send reply
  const handleReply = () => {
    if (!replyText.trim() || !detail?.isActive) return
    const content = replyText.trim()
    setReplyText('')

    // Optimistic message
    const optimistic: MessageItem = {
      id:        `opt-${Date.now()}`,
      role:      'assistant',
      content,
      createdAt: new Date(),
    }
    setDetail(prev => prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev)
    scrollToBottom()

    startTransition(async () => {
      const r = await adminReply({ sessionId, content })
      if (r.success) {
        // Replace optimistic with real message
        setDetail(prev => {
          if (!prev) return prev
          const msgs = prev.messages.map(m => m.id === optimistic.id ? r.data : m)
          lastMsgId.current = r.data.id
          return { ...prev, messages: msgs }
        })
      } else {
        // Rollback + show error
        setDetail(prev => prev ? { ...prev, messages: prev.messages.filter(m => m.id !== optimistic.id) } : prev)
        setError(r.error)
        setReplyText(content)
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleReply()
    }
  }

  const handleEnd = () => {
    startTransition(async () => {
      const r = await endSession(sessionId)
      if (r.success) {
        setDetail(prev => prev ? { ...prev, isActive: false, endedAt: r.data.endedAt } : prev)
        setEndConfirm(false)
        clearInterval(pollRef.current)
      } else {
        setError(r.error)
        setEndConfirm(false)
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const r = await deleteSession(sessionId)
      if (r.success) onDeleted()
      else { setError(r.error); setDelConfirm(false) }
    })
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={24} className="animate-spin text-muted-foreground" />
    </div>
  )

  if (error && !detail) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
      <AlertTriangle size={32} className="text-red-400 opacity-60" />
      <p className="text-sm">{error}</p>
    </div>
  )

  if (!detail) return null

  const user    = detail.user
  const name    = user?.fullName ?? user?.email ?? 'Anonymous'
  const groups  = groupByDay(detail.messages)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Conversation header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/30 shrink-0">
        <div className="relative">
          <Avatar className="w-9 h-9 border border-border/20">
            <AvatarImage src={user?.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs font-medium">
              {user ? initials(user.fullName, user.email) : '??'}
            </AvatarFallback>
          </Avatar>
          {detail.isActive && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground">
            {user?.email ?? 'Unknown email'} ·{' '}
            {detail.isActive
              ? <span className="text-emerald-400">Active</span>
              : `Ended ${format(new Date(detail.endedAt!), 'MMM d, h:mm a')}`}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Session meta */}
          <Badge variant="outline" className="text-xs border-border/30 text-muted-foreground hidden sm:flex">
            {detail.messageCount} messages
          </Badge>

          {/* Poll indicator */}
          {detail.isActive && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm"
                className="h-8 text-muted-foreground hover:text-foreground gap-1 text-xs">
                Actions <ChevronDown size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              {detail.isActive && (
                <DropdownMenuItem
                  onClick={() => setEndConfirm(true)}
                  className="text-sm cursor-pointer text-amber-400 focus:text-amber-400 focus:bg-amber-500/10">
                  <StopCircle size={14} className="mr-2" /> End session
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setDelConfirm(true)}
                className="text-sm cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10">
                <Trash2 size={14} className="mr-2" /> Delete session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertTriangle size={13} />
          {error}
          <Button onClick={() => setError(null)} className="ml-auto"><X size={12} /></Button>
        </div>
      )}

      {/* End confirm banner */}
      {endConfirm && (
        <div className="mx-4 mt-2 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle size={15} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-400 flex-1">End this session? The user won't be able to send more messages.</p>
          <Button size="sm" variant="ghost" onClick={() => setEndConfirm(false)}
            className="h-7 text-xs text-muted-foreground">Cancel</Button>
          <Button size="sm" onClick={handleEnd} disabled={isPending}
            className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white">
            {isPending ? <Loader2 size={12} className="animate-spin" /> : 'End'}
          </Button>
        </div>
      )}

      {/* Delete confirm banner */}
      {delConfirm && (
        <div className="mx-4 mt-2 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle size={15} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-400 flex-1">Delete this session and all its messages? This cannot be undone.</p>
          <Button size="sm" variant="ghost" onClick={() => setDelConfirm(false)}
            className="h-7 text-xs text-muted-foreground">Cancel</Button>
          <Button size="sm" onClick={handleDelete} disabled={isPending}
            className="h-7 text-xs bg-red-500 hover:bg-red-600 text-white">
            {isPending ? <Loader2 size={12} className="animate-spin" /> : 'Delete'}
          </Button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {detail.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <MessageSquare size={32} className="opacity-20" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border/30" />
                <span className="text-xs text-muted-foreground px-2">
                  {formatMsgDate(group.messages[0].createdAt)}
                </span>
                <div className="flex-1 h-px bg-border/30" />
              </div>

              <div className="space-y-2">
                {group.messages.map(msg => {
                  const isAdmin = msg.role === 'assistant'
                  const isOptimistic = msg.id.startsWith('opt-')
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-0.5 ${
                        isAdmin ? 'bg-color/20' : 'bg-muted/50'
                      }`}>
                        {isAdmin
                          ? <Bot size={14} className="text-color" />
                          : <User2 size={14} className="text-muted-foreground" />
                        }
                      </div>

                      {/* Bubble */}
                      <div className={`group max-w-[72%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isAdmin
                            ? `bg-color text-white rounded-br-sm ${isOptimistic ? 'opacity-60' : ''}`
                            : 'bg-muted/40 text-foreground rounded-bl-sm border border-border/20'
                        }`}>
                          {msg.content}
                        </div>
                        <div className={`flex items-center gap-1 text-xs text-muted-foreground px-1 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                          <span>{formatMsgTime(msg.createdAt)}</span>
                          {isAdmin && (
                            isOptimistic
                              ? <Loader2 size={10} className="animate-spin" />
                              : <Check size={10} className="text-color/60" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply box */}
      <div className={`shrink-0 border-t border-border/30 px-4 py-3 ${!detail.isActive ? 'opacity-50 pointer-events-none' : ''}`}>
        {!detail.isActive && (
          <p className="text-xs text-center text-muted-foreground mb-2">
            This session has ended — replies are disabled.
          </p>
        )}
        <div className="flex items-end gap-2">
          <div className="w-7 h-7 rounded-full bg-color/20 flex items-center justify-center shrink-0 mb-0.5">
            <Bot size={14} className="text-color" />
          </div>
          <Textarea
            ref={textareaRef}
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={detail.isActive ? 'Reply as admin… (Enter to send, Shift+Enter for new line)' : 'Session ended'}
            rows={1}
            disabled={!detail.isActive || isPending}
            className="flex-1 min-h-10 max-h-32 resize-none bg-background/50 border-border/40 text-sm focus:border-color/50 focus:ring-1 focus:ring-color/20"
          />
          <Button
            onClick={handleReply}
            disabled={!replyText.trim() || !detail.isActive || isPending}
            size="icon"
            className="h-10 w-10 shrink-0 bg-color hover:bg-color/90 text-white"
          >
            {isPending
              ? <Loader2 size={16} className="animate-spin" />
              : <Send size={16} />
            }
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 text-right">
          {replyText.length}/4000
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
      <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
        <MessageSquare size={28} className="opacity-30" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">Select a conversation</p>
        <p className="text-xs mt-1">Choose a session from the list to view messages</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT CLIENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function MessagesClient() {
  const [selectedId,    setSelectedId]    = useState<string | null>(null)
  const [listKey,       setListKey]       = useState(0)   // bump to re-mount list after delete

  const handleDeleted = () => {
    setSelectedId(null)
    setListKey(k => k + 1)
  }

  return (
    <div className="rounded-2xl border border-border/5 bg-card/50 overflow-hidden"
      style={{ height: 'calc(100vh - 20rem)', minHeight: '500px' }}>
      <div className="flex h-full">

        {/* Left panel — session list */}
        <div className="w-80 shrink-0 border-r border-border/30 flex flex-col h-full">
          <SessionListPanel
            key={listKey}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {/* Right panel — conversation */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          {selectedId
            ? <ConversationPanel key={selectedId} sessionId={selectedId} onDeleted={handleDeleted} />
            : <EmptyState />
          }
        </div>

      </div>
    </div>
  )
}