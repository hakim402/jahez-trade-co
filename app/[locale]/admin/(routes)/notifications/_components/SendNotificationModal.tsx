'use client'

// app/[locale]/admin/(routes)/notifications/_components/SendNotificationModal.tsx

import { useState, useTransition, useCallback, useRef, useEffect } from 'react'
import { Send, Radio, X, Loader2, User, Users, Check, ChevronDown } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  sendNotification, broadcastNotification, searchUsers,
  type UserOption,
} from '../actions'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TYPES = ['BOOKING', 'QUOTE', 'REQUEST', 'PAYMENT', 'SYSTEM', 'GENERAL']

// ─────────────────────────────────────────────────────────────────────────────
// USER SEARCH INPUT
// ─────────────────────────────────────────────────────────────────────────────

interface UserSearchProps {
  value:    UserOption | null
  onChange: (u: UserOption | null) => void
  error?:   string
}

function UserSearch({ value, onChange, error }: UserSearchProps) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<UserOption[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)

  // ✅ Fixed: useRef requires an initial value in strict TypeScript
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const wrapRef  = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function getInitials(name: string | null, email: string) {
    if (name) return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <div ref={wrapRef} className="relative">
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#7b57fc]/30 bg-[#7b57fc]/5">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="bg-[#7b57fc]/20 text-[#7b57fc] text-xs font-bold">
              {getInitials(value.fullName, value.email)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-foreground flex-1 truncate">
            {value.fullName ?? value.email}
          </span>
          <Button
            type="button"
            onClick={() => { onChange(null); setQuery('') }}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5 bg-color"
          >
            <X size={14} />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={15} />
          <Input
            value={query}
            onChange={e => search(e.target.value)}
            placeholder="Search by name or email…"
            className={cn(
              'pl-9 bg-background/50 border-border/50',
              error && 'border-red-500/50 focus-visible:ring-red-500/30',
            )}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin pointer-events-none" size={14} />
          )}
        </div>
      )}

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-200 rounded-xl border border-border bg-popover shadow-2xl overflow-hidden">
          {results.map(u => (
            <button
              key={u.id}
              type="button"
              onClick={() => { onChange(u); setQuery(''); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 text-left transition-colors"
            >
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarFallback className="bg-[#7b57fc]/15 text-[#7b57fc] text-xs font-bold">
                  {getInitials(u.fullName, u.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm text-foreground font-medium truncate">{u.fullName ?? '—'}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
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
  const [form,      setForm]      = useState<FormState>(DEFAULT_FORM)
  const [errors,    setErrors]    = useState<Partial<Record<keyof FormState, string>>>({})
  const [result,    setResult]    = useState<{ ok: boolean; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const isBroadcast = mode === 'broadcast'

  // Reset on open
  useEffect(() => {
    if (open) { setForm(DEFAULT_FORM); setErrors({}); setResult(null) }
  }, [open])

  const set = (key: keyof FormState, val: unknown) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const validate = () => {
    const e: typeof errors = {}
    if (!isBroadcast && !form.user) e.user = 'Please select a user'
    if (!form.title.trim())         e.title   = 'Title is required'
    if (!form.message.trim())       e.message = 'Message is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    startTransition(async () => {
      setResult(null)
      if (!isBroadcast) {
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

  return (
    // ✅ Dialog uses a Radix portal — renders outside DOM tree, no z-index/stacking issues
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border border-border/50">

        {/* Header */}
        <DialogHeader className={cn(
          'flex-row items-center gap-3 px-6 py-4 border-b border-border/40 space-y-0',
          isBroadcast ? 'bg-indigo-500/5' : 'bg-[#7b57fc]/5',
        )}>
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
            isBroadcast ? 'bg-indigo-500/15' : 'bg-[#7b57fc]/15',
          )}>
            {isBroadcast
              ? <Radio size={18} className="text-indigo-500" />
              : <Send size={18} className="text-[#7b57fc]" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-base font-semibold leading-tight">
              {isBroadcast ? 'Broadcast Notification' : 'Send Notification'}
            </DialogTitle>
            <DialogDescription className="text-xs mt-0.5">
              {isBroadcast
                ? 'Send to all active users on the platform'
                : 'Send a notification to a specific user'}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Recipient (single mode) */}
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

          {/* Broadcast warning */}
          {isBroadcast && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <Users size={14} className="text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-500 leading-relaxed">
                This will be delivered to <strong>all active users</strong> on the platform. Please use with care.
              </p>
            </div>
          )}

          {/* Type selector */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Notification type</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-background/50 border-border/50 text-foreground h-10 font-normal"
                >
                  {form.type}
                  <ChevronDown size={14} className="text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                {TYPES.map(t => (
                  <DropdownMenuItem
                    key={t}
                    onSelect={() => set('type', t)}
                    className="cursor-pointer text-sm flex justify-between"
                  >
                    {t}
                    {form.type === t && <Check size={13} className="text-[#7b57fc]" />}
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
              className={cn(
                'bg-background/50 border-border/50',
                errors.title && 'border-red-500/50 focus-visible:ring-red-500/30',
              )}
            />
            <div className="flex items-center justify-between">
              {errors.title
                ? <p className="text-xs text-red-400">{errors.title}</p>
                : <span />}
              <p className="text-xs text-muted-foreground/60 tabular-nums">{form.title.length}/200</p>
            </div>
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
              className={cn(
                'bg-background/50 border-border/50 resize-none',
                errors.message && 'border-red-500/50 focus-visible:ring-red-500/30',
              )}
            />
            <div className="flex items-center justify-between">
              {errors.message
                ? <p className="text-xs text-red-400">{errors.message}</p>
                : <span />}
              <p className="text-xs text-muted-foreground/60 tabular-nums">{form.message.length}/2000</p>
            </div>
          </div>

          {/* Result feedback */}
          {result && (
            <div className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border',
              result.ok
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
            )}>
              {result.ok ? <Check size={15} /> : <X size={15} />}
              {result.msg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border/40 bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className={cn(
              'gap-2 min-w-27.5',
              isBroadcast
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-[#7b57fc] hover:bg-[#6a48e8] text-white',
            )}
          >
            {isPending ? (
              <><Loader2 size={14} className="animate-spin" /> Sending…</>
            ) : isBroadcast ? (
              <><Radio size={14} /> Broadcast</>
            ) : (
              <><Send size={14} /> Send</>
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}