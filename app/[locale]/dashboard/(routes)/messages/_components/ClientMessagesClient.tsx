'use client'

import {
  useState, useEffect, useCallback, useRef,
  useTransition, useLayoutEffect,
} from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import {
  MessageSquare, Plus, Send, Loader2, Bot, User2,
  StopCircle, Clock, Zap, Sparkles, Lock,
  AlertTriangle, X, Check, ChevronRight, Crown,
} from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge }    from '@/components/ui/badge'
import {
  startSession, getClientSessionDetail, sendUserMessage,
  pollClientMessages, endClientSession,
  type PlanInfo, type ClientSession,
  type ClientSessionDetail, type ClientMessage,
} from '../actions'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const POLL_MS = 5_000

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

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

function groupByDay(messages: ClientMessage[]) {
  const groups: { date: string; messages: ClientMessage[] }[] = []
  for (const msg of messages) {
    const day = format(new Date(msg.createdAt), 'yyyy-MM-dd')
    const last = groups[groups.length - 1]
    if (last?.date === day) last.messages.push(msg)
    else groups.push({ date: day, messages: [msg] })
  }
  return groups
}

function initials(name: string | null | undefined, email: string) {
  if (name) return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  return email.slice(0, 2).toUpperCase()
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN BADGE
// ─────────────────────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: PlanInfo }) {
  if (plan.isDefault || plan.amount === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-border/30">
        <MessageSquare size={11} />
        Free Plan
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
      <Crown size={11} />
      {plan.name}
      {plan.interval && <span className="opacity-70">/ {plan.interval}</span>}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// UPGRADE WALL
// ─────────────────────────────────────────────────────────────────────────────

function UpgradeWall() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <Lock size={28} className="text-amber-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">Upgrade to chat</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
          Messaging is available on paid plans. Upgrade to get direct access to our sourcing team and AI assistant.
        </p>
      </div>
      <Button className="bg-color hover:bg-color/90 text-white gap-2">
        <Crown size={15} /> View plans
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION ROW
// ─────────────────────────────────────────────────────────────────────────────

interface SessionRowProps {
  session:    ClientSession
  isSelected: boolean
  onClick:    () => void
}

function SessionRow({ session, isSelected, onClick }: SessionRowProps) {
  const lastMsg = session.lastMessage

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-border/20 last:border-0 text-left transition-all ${
        isSelected
          ? 'bg-color/10 border-l-2 border-l-color'
          : 'hover:bg-accent/10 border-l-2 border-l-transparent'
      }`}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
        session.isActive
          ? 'bg-color/15 border border-color/20'
          : 'bg-muted/30 border border-border/20'
      }`}>
        <MessageSquare size={15} className={session.isActive ? 'text-color' : 'text-muted-foreground'} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-medium ${isSelected ? 'text-color' : 'text-foreground'}`}>
            {isToday(new Date(session.startedAt))
              ? `Today, ${format(new Date(session.startedAt), 'h:mm a')}`
              : format(new Date(session.startedAt), 'MMM d, yyyy')}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatSessionTime(session.startedAt)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {lastMsg
            ? `${lastMsg.role === 'assistant' ? '🤖 ' : ''}${truncate(lastMsg.content, 45)}`
            : 'No messages yet'}
        </p>

        <div className="flex items-center gap-2 mt-1.5">
          {session.isActive ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
              <Zap size={9} /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/20 border border-border/20 px-1.5 py-0.5 rounded-full">
              <Clock size={9} /> Ended
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {session.messageCount} msg{session.messageCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPING INDICATOR
// ─────────────────────────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-color/15 border border-color/20 flex items-center justify-center shrink-0">
        <Bot size={13} className="text-color" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-muted/40 border border-border/20">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATION VIEW
// ─────────────────────────────────────────────────────────────────────────────

interface ConversationProps {
  sessionId:  string
  user:       { id: string; email: string; fullName: string | null; avatarUrl: string | null }
  plan:       PlanInfo
  onEnded:    (sessionId: string, endedAt: Date) => void
}

function ConversationView({ sessionId, user, plan, onEnded }: ConversationProps) {
  const [detail,     setDetail]     = useState<ClientSessionDetail | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [replyText,  setReplyText]  = useState('')
  const [isPending,  startTransition] = useTransition()
  const [aiTyping,   setAiTyping]   = useState(false)
  const [endConfirm, setEndConfirm] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const lastMsgId      = useRef<string | null>(null)
  const pollRef        = useRef<ReturnType<typeof setInterval>>()

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
    setAiTyping(false)

    getClientSessionDetail(sessionId).then(r => {
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

  useLayoutEffect(() => {
    if (!loading && detail) scrollToBottom(false)
  }, [loading, detail, scrollToBottom])

  // 5-second polling for admin/AI replies
  useEffect(() => {
    if (!detail?.isActive) return

    pollRef.current = setInterval(async () => {
      const r = await pollClientMessages(sessionId, lastMsgId.current)
      if (!r.success) return

      if (r.data.messages.length > 0) {
        setDetail(prev => {
          if (!prev) return prev
          const newMsgs = r.data.messages
          lastMsgId.current = newMsgs[newMsgs.length - 1].id
          return { ...prev, messages: [...prev.messages, ...newMsgs] }
        })
        setAiTyping(false)
        scrollToBottom()
      }

      if (r.data.sessionEndedAt) {
        setDetail(prev => prev ? { ...prev, isActive: false, endedAt: r.data.sessionEndedAt } : prev)
        clearInterval(pollRef.current)
      }
    }, POLL_MS)

    return () => clearInterval(pollRef.current)
  }, [sessionId, detail?.isActive, scrollToBottom])

  const handleSend = () => {
    if (!replyText.trim() || !detail?.isActive || isPending) return
    const content = replyText.trim()
    setReplyText('')
    setError(null)

    // Optimistic user message
    const optimisticUser: ClientMessage = {
      id:        `opt-user-${Date.now()}`,
      role:      'user',
      content,
      createdAt: new Date(),
    }
    setDetail(prev => prev ? { ...prev, messages: [...prev.messages, optimisticUser] } : prev)
    scrollToBottom()
    setAiTyping(true)

    startTransition(async () => {
      const r = await sendUserMessage({ sessionId, content })

      if (r.success) {
        setDetail(prev => {
          if (!prev) return prev
          // Replace optimistic user message with real one, then append AI reply
          const msgs = prev.messages
            .map(m => m.id === optimisticUser.id ? r.data.userMessage : m)
          const withAi = r.data.aiMessage ? [...msgs, r.data.aiMessage] : msgs
          lastMsgId.current = r.data.aiMessage
            ? r.data.aiMessage.id
            : r.data.userMessage.id
          return { ...prev, messages: withAi }
        })
        setAiTyping(false)
        scrollToBottom()
      } else {
        // Rollback
        setDetail(prev => prev ? {
          ...prev,
          messages: prev.messages.filter(m => m.id !== optimisticUser.id),
        } : prev)
        setAiTyping(false)
        setReplyText(content)
        setError(r.error === 'UPGRADE_REQUIRED' ? 'Upgrade your plan to send messages.' : r.error)
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleEnd = () => {
    startTransition(async () => {
      const r = await endClientSession(sessionId)
      if (r.success) {
        setDetail(prev => prev ? { ...prev, isActive: false, endedAt: r.data.endedAt } : prev)
        setEndConfirm(false)
        clearInterval(pollRef.current)
        onEnded(sessionId, r.data.endedAt)
      } else {
        setError(r.error)
        setEndConfirm(false)
      }
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={24} className="animate-spin text-muted-foreground" />
    </div>
  )

  if (error && !detail) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
      <AlertTriangle size={28} className="text-red-400 opacity-60" />
      <p className="text-sm">{error}</p>
    </div>
  )

  if (!detail) return null

  const groups = groupByDay(detail.messages)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${detail.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'}`} />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isToday(new Date(detail.startedAt))
                ? `Session started at ${format(new Date(detail.startedAt), 'h:mm a')}`
                : format(new Date(detail.startedAt), 'MMM d, yyyy · h:mm a')}
            </p>
            <p className="text-xs text-muted-foreground">
              {detail.isActive
                ? <span className="text-emerald-400">Active · replies in seconds</span>
                : `Ended ${format(new Date(detail.endedAt!), 'MMM d · h:mm a')}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-muted-foreground border-border/30 hidden sm:flex">
            {detail.messageCount} messages
          </Badge>
          {detail.isActive && (
            <Button variant="ghost" size="sm"
              onClick={() => setEndConfirm(true)}
              className="h-8 text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 gap-1.5">
              <StopCircle size={13} /> End
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertTriangle size={13} />
          {error}
          <Button onClick={() => setError(null)} className="ml-auto"><X size={12} /></Button>
        </div>
      )}

      {/* End confirm */}
      {endConfirm && (
        <div className="mx-4 mt-2 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle size={14} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-400 flex-1">End this conversation? You won't be able to send more messages.</p>
          <Button size="sm" variant="ghost" onClick={() => setEndConfirm(false)}
            className="h-7 text-xs text-muted-foreground">Cancel</Button>
          <Button size="sm" onClick={handleEnd} disabled={isPending}
            className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white">
            {isPending ? <Loader2 size={12} className="animate-spin" /> : 'End session'}
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-1">
        {detail.messages.length === 0 && !aiTyping ? (
          /* Welcome state */
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-color/10 border border-color/20 flex items-center justify-center">
              <Sparkles size={24} className="text-color" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">How can we help?</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Ask about product sourcing, quotes, bookings, or anything about the platform.
              </p>
            </div>
            {/* Suggestion chips */}
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {[
                'How do I submit a product request?',
                'What sourcing services do you offer?',
                'How long does a quote take?',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => { setReplyText(q); textareaRef.current?.focus() }}
                  className="text-xs px-3 py-1.5 rounded-full border border-color/20 bg-color/5 text-color hover:bg-color/10 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border/20" />
                <span className="text-xs text-muted-foreground px-2 shrink-0">
                  {formatMsgDate(group.messages[0].createdAt)}
                </span>
                <div className="flex-1 h-px bg-border/20" />
              </div>

              <div className="space-y-3">
                {group.messages.map(msg => {
                  const isAssistant  = msg.role === 'assistant'
                  const isOptimistic = msg.id.startsWith('opt-')

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2.5 ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}
                    >
                      {/* Avatar */}
                      {isAssistant ? (
                        <div className="w-7 h-7 rounded-full bg-color/15 border border-color/20 flex items-center justify-center shrink-0 mb-1">
                          <Bot size={13} className="text-color" />
                        </div>
                      ) : (
                        <Avatar className="w-7 h-7 shrink-0 mb-1 border border-border/20">
                          <AvatarImage src={user.avatarUrl ?? undefined} />
                          <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                            {initials(user.fullName, user.email)}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={`flex flex-col gap-1 max-w-[75%] ${isAssistant ? 'items-start' : 'items-end'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isAssistant
                            ? 'bg-muted/40 text-foreground rounded-bl-sm border border-border/20'
                            : `bg-color text-white rounded-br-sm ${isOptimistic ? 'opacity-60' : ''}`
                        }`}>
                          {msg.content}
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs text-muted-foreground px-1 ${isAssistant ? '' : 'flex-row-reverse'}`}>
                          <span>{formatMsgTime(msg.createdAt)}</span>
                          {!isAssistant && (
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

        {/* AI typing indicator */}
        {aiTyping && (
          <div className="pt-2">
            <TypingIndicator />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`shrink-0 px-5 py-4 border-t border-border/20 ${!detail.isActive ? 'opacity-50 pointer-events-none' : ''}`}>
        {!detail.isActive && (
          <p className="text-xs text-center text-muted-foreground mb-3">
            This session has ended.
          </p>
        )}
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={detail.isActive ? 'Ask anything… (Enter to send)' : 'Session ended'}
              rows={1}
              disabled={!detail.isActive || isPending}
              className="resize-none min-h-11 max-h-32 bg-background/60 border-border/40 text-sm pr-4 focus:border-color/50 focus:ring-1 focus:ring-color/20 rounded-xl"
            />
            <p className="absolute right-3 bottom-2 text-xs text-muted-foreground/50">
              {replyText.length > 3500 ? `${replyText.length}/4000` : ''}
            </p>
          </div>
          <Button
            onClick={handleSend}
            disabled={!replyText.trim() || !detail.isActive || isPending}
            className="h-11 w-11 rounded-xl bg-color hover:bg-color/90 text-white shrink-0 p-0"
          >
            {isPending
              ? <Loader2 size={16} className="animate-spin" />
              : <Send size={16} />
            }
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          <Bot size={11} className="inline mr-1" />
          AI assistant replies instantly · Our team may follow up for complex requests
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE (no session selected)
// ─────────────────────────────────────────────────────────────────────────────

function EmptyConversation({ onNew, plan }: { onNew: () => void; plan: PlanInfo }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-color/10 border border-color/20 flex items-center justify-center">
        <MessageSquare size={28} className="text-color opacity-60" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">Your conversations</p>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
          Select a session on the left or start a new conversation with our sourcing team.
        </p>
      </div>
      <Button onClick={onNew} className="bg-color hover:bg-color/90 text-white gap-2">
        <Plus size={15} /> New conversation
      </Button>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <PlanBadge plan={plan} />
        <span>·</span>
        <span>Full platform access</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT CLIENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  initialUser:     { id: string; email: string; fullName: string | null; avatarUrl: string | null }
  initialPlan:     PlanInfo
  initialSessions: ClientSession[]
}

export function ClientMessagesClient({ initialUser, initialPlan, initialSessions }: Props) {
  const [sessions,    setSessions]    = useState<ClientSession[]>(initialSessions)
  const [selectedId,  setSelectedId]  = useState<string | null>(
    // Auto-select the most recent active session, if any
    initialSessions.find(s => s.isActive)?.id ?? initialSessions[0]?.id ?? null
  )
  const [isPending,   startTransition] = useTransition()
  const [startError,  setStartError]   = useState<string | null>(null)

  const plan    = initialPlan
  const user    = initialUser

  const handleNewSession = () => {
    if (!plan.hasAccess) return
    setStartError(null)
    startTransition(async () => {
      const r = await startSession()
      if (r.success) {
        setSessions(prev => [r.data, ...prev])
        setSelectedId(r.data.id)
      } else {
        setStartError(r.error === 'UPGRADE_REQUIRED'
          ? 'Upgrade your plan to start a conversation.'
          : r.error)
      }
    })
  }

  const handleSessionEnded = (sessionId: string, endedAt: Date) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, isActive: false, endedAt } : s
    ))
  }

  return (
    <div
      className="rounded-2xl border border-border/5 bg-card/50 overflow-hidden flex"
      style={{ height: 'calc(100vh - 12rem)', minHeight: '520px' }}
    >
      {/* ── LEFT PANEL — session list ──────────────────────────────────────── */}
      <div className="w-72 shrink-0 border-r border-border/20 flex flex-col h-full">

        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-border/20 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Messages</h2>
            <PlanBadge plan={plan} />
          </div>

          {/* New session button */}
          {plan.hasAccess ? (
            <Button
              onClick={handleNewSession}
              disabled={isPending}
              size="sm"
              className="w-full h-8 text-xs bg-color hover:bg-color/90 text-white gap-1.5"
            >
              {isPending
                ? <><Loader2 size={12} className="animate-spin" /> Starting…</>
                : <><Plus size={13} /> New conversation</>
              }
            </Button>
          ) : (
            <Button size="sm" variant="outline"
              className="w-full h-8 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-1.5">
              <Crown size={12} /> Upgrade to chat
            </Button>
          )}

          {startError && (
            <p className="text-xs text-red-400">{startError}</p>
          )}
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground px-4 text-center">
              <MessageSquare size={24} className="opacity-20" />
              <p className="text-xs">No conversations yet</p>
            </div>
          ) : (
            sessions.map(s => (
              <SessionRow
                key={s.id}
                session={s}
                isSelected={s.id === selectedId}
                onClick={() => setSelectedId(s.id)}
              />
            ))
          )}
        </div>

        {/* Sidebar footer — user info */}
        <div className="px-4 py-3 border-t border-border/20 flex items-center gap-2.5">
          <Avatar className="w-7 h-7 border border-border/20 shrink-0">
            <AvatarImage src={user.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
              {initials(user.fullName, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">
              {user.fullName ?? user.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
        </div>
      </div>

      {/* ── RIGHT PANEL — conversation ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {!plan.hasAccess ? (
          <UpgradeWall />
        ) : selectedId ? (
          <ConversationView
            key={selectedId}
            sessionId={selectedId}
            user={user}
            plan={plan}
            onEnded={handleSessionEnded}
          />
        ) : (
          <EmptyConversation onNew={handleNewSession} plan={plan} />
        )}
      </div>
    </div>
  )
}