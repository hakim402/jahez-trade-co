'use client'

import { useState, useTransition, useCallback, useRef, useEffect } from 'react'
import { Send, Radio, X, Loader2, User, Users, Check, ChevronDown } from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  sendNotification, broadcastNotification, searchUsers,
  type UserOption,
} from '../actions'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TYPES = ['BOOKING', 'QUOTE', 'REQUEST', 'PAYMENT', 'SYSTEM', 'GENERAL']

// ─────────────────────────────────────────────────────────────────────────────
// USER SEARCH INPUT (for single-send mode)
// ─────────────────────────────────────────────────────────────────────────────

interface UserSearchProps {
  value:    UserOption | null
  onChange: (u: UserOption | null) => void
  error?:   string
}

function UserSearch({ value, onChange, error }: UserSearchProps) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<UserOption[]>([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const debounce   = useRef<ReturnType<typeof setTimeout>>()

  const search = useCallback((q: string) => {
    setQuery(q)
    if (value) onChange(null)
    clearTimeout(debounce.current)
    if (q.length < 2) { setResults([]); setOpen(false); return }
    debounce.current = setTimeout(async () => {
      setLoading(true)
      const r = await searchUsers(q)
      if (r.success) { setResults(r.data); setOpen(r.data.length > 0) }
      setLoading(false)
    }, 300)
  }, [value, onChange])

  // Close on outside click
  const wrapRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function initials(name: string | null, email: string) {
    if (name) return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <div ref={wrapRef} className="relative">
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-color/30 bg-color/5">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
              {initials(value.fullName, value.email)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-foreground flex-1">
            {value.fullName ?? value.email}
          </span>
          <Button onClick={() => { onChange(null); setQuery('') }}
            className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <Input
            value={query}
            onChange={e => search(e.target.value)}
            placeholder="Search by name or email…"
            className={`pl-9 bg-background/50 border-border/50 ${error ? 'border-red-500/50' : ''}`}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" size={14} />
          )}
        </div>
      )}

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
          {results.map(u => (
            <button
              key={u.id}
              onClick={() => { onChange(u); setQuery(''); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-accent/10 text-left transition-colors"
            >
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                  {initials(u.fullName, u.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-popover-foreground font-medium">{u.fullName ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  open:      boolean
  mode:      'single' | 'broadcast'
  onClose:   () => void
  onSuccess: () => void
}

interface FormState {
  user:    UserOption | null
  title:   string
  message: string
  type:    string
}

const DEFAULT_FORM: FormState = { user: null, title: '', message: '', type: 'SYSTEM' }

export function SendNotificationModal({ open, mode, onClose, onSuccess }: Props) {
  const [form,       setForm]       = useState<FormState>(DEFAULT_FORM)
  const [errors,     setErrors]     = useState<Partial<Record<keyof FormState, string>>>({})
  const [result,     setResult]     = useState<{ ok: boolean; msg: string } | null>(null)
  const [isPending,  startTransition] = useTransition()

  // Reset when modal opens
  useEffect(() => {
    if (open) { setForm(DEFAULT_FORM); setErrors({}); setResult(null) }
  }, [open])

  const set = (key: keyof FormState, val: unknown) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const validate = () => {
    const e: typeof errors = {}
    if (mode === 'single' && !form.user) e.user = 'Please select a user'
    if (!form.title.trim())   e.title   = 'Title is required'
    if (!form.message.trim()) e.message = 'Message is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    startTransition(async () => {
      setResult(null)
      if (mode === 'single') {
        const r = await sendNotification({
          userId:  form.user!.id,
          title:   form.title,
          message: form.message,
          type:    form.type,
        })
        if (r.success) {
          setResult({ ok: true, msg: 'Notification sent successfully.' })
          onSuccess()
          setTimeout(onClose, 1500)
        } else {
          setResult({ ok: false, msg: r.error })
        }
      } else {
        const r = await broadcastNotification({
          title:   form.title,
          message: form.message,
          type:    form.type,
        })
        if (r.success) {
          setResult({ ok: true, msg: `Broadcast sent to ${r.data.sentCount} users.` })
          onSuccess()
          setTimeout(onClose, 1800)
        } else {
          setResult({ ok: false, msg: r.error })
        }
      }
    })
  }

  if (!open) return null

  const isBroadcast = mode === 'broadcast'

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border/10 bg-card shadow-2xl overflow-hidden">

        {/* Modal header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-border/10 ${
          isBroadcast ? 'bg-violet-500/5' : 'bg-color/5'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isBroadcast ? 'bg-violet-500/20' : 'bg-color/20'
            }`}>
              {isBroadcast
                ? <Radio size={18} className="text-violet-400" />
                : <Send size={18} className="text-color" />
              }
            </div>
            <div>
              <h2 className="text-base font-semibold text-card-foreground">
                {isBroadcast ? 'Broadcast Notification' : 'Send Notification'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isBroadcast
                  ? 'Send to all active users on the platform'
                  : 'Send to a specific user'}
              </p>
            </div>
          </div>
          <Button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </Button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* User selector (single mode only) */}
          {!isBroadcast && (
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
                <User size={13} /> Recipient
              </Label>
              <UserSearch
                value={form.user}
                onChange={u => set('user', u)}
                error={errors.user}
              />
            </div>
          )}

          {/* Broadcast target notice */}
          {isBroadcast && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-violet-500/20 bg-violet-500/5">
              <Users size={14} className="text-violet-400 shrink-0" />
              <p className="text-xs text-violet-400">
                This will be sent to <strong>all active users</strong>. Use with care.
              </p>
            </div>
          )}

          {/* Type */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Type</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"
                  className="w-full justify-between bg-background/50 border-border/50 text-foreground h-10">
                  {form.type}
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full bg-popover border-border">
                {TYPES.map(t => (
                  <DropdownMenuItem key={t} onClick={() => set('type', t)}
                    className="cursor-pointer text-sm">
                    {t}
                    {form.type === t && <Check size={13} className="ml-auto text-color" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Title</Label>
            <Input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Notification title…"
              maxLength={200}
              className={`bg-background/50 border-border/50 ${errors.title ? 'border-red-500/50' : ''}`}
            />
            {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
            <p className="text-xs text-muted-foreground text-right">{form.title.length}/200</p>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Message</Label>
            <Textarea
              value={form.message}
              onChange={e => set('message', e.target.value)}
              placeholder="Write your notification message…"
              maxLength={2000}
              rows={4}
              className={`bg-background/50 border-border/50 resize-none ${errors.message ? 'border-red-500/50' : ''}`}
            />
            {errors.message && <p className="text-xs text-red-400">{errors.message}</p>}
            <p className="text-xs text-muted-foreground text-right">{form.message.length}/2000</p>
          </div>

          {/* Result feedback */}
          {result && (
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${
              result.ok
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {result.ok ? <Check size={15} /> : <X size={15} />}
              {result.msg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/10">
          <Button variant="ghost" onClick={onClose} disabled={isPending}
            className="text-muted-foreground hover:text-foreground">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className={`gap-2 ${
              isBroadcast
                ? 'bg-violet-600 hover:bg-violet-700 text-white'
                : 'bg-color hover:bg-color/90 text-white'
            }`}
          >
            {isPending
              ? <><Loader2 size={15} className="animate-spin" /> Sending…</>
              : isBroadcast
                ? <><Radio size={15} /> Broadcast</>
                : <><Send size={15} /> Send</>
            }
          </Button>
        </div>
      </div>
    </div>
  )
}