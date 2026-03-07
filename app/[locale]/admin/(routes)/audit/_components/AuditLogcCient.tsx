'use client'

// app/[locale]/admin/(routes)/audit/_components/AuditLogClient.tsx

import {
  useState, useCallback, useTransition, useEffect, useRef,
} from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input }    from '@/components/ui/input'
import { Switch }   from '@/components/ui/switch'
import { toast }    from 'sonner'
import {
  Search, X, RefreshCw, ChevronLeft, ChevronRight, MoreHorizontal,
  Eye, Trash2, ShieldAlert, Activity, Video, Package, FileText,
  Database, Calendar, CheckCircle2, XCircle, UserX, ClipboardCheck,
  Edit, Plus, Loader2, Filter, Clock, ChevronDown,
  Sparkles, Code2, AlertTriangle, CalendarDays, ShieldX,
} from 'lucide-react'
import {
  getAuditLogs, deleteAuditLog, purgeAuditLogsBefore,
  type AuditLogWithAdmin, type AuditFilterOptions, type GetAuditLogsParams,
} from '../actions'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — action & entity colour + icon maps
// ─────────────────────────────────────────────────────────────────────────────

type ActionCfg = { label: string; color: string; dot: string; icon: React.ElementType }

const ACTION_PREFIX_MAP: { prefix: string; cfg: ActionCfg }[] = [
  { prefix: 'SCHEDULE',  cfg: { label: 'Schedule',  color: 'text-blue-600   ring-blue-400/30   bg-blue-500/8',   dot: 'bg-blue-400',   icon: Calendar       } },
  { prefix: 'COMPLETE',  cfg: { label: 'Complete',  color: 'text-emerald-600 ring-emerald-400/30 bg-emerald-500/8', dot: 'bg-emerald-400', icon: ClipboardCheck } },
  { prefix: 'CANCEL',    cfg: { label: 'Cancel',    color: 'text-red-600    ring-red-400/30    bg-red-500/8',    dot: 'bg-red-400',    icon: XCircle        } },
  { prefix: 'NO_SHOW',   cfg: { label: 'No Show',   color: 'text-orange-600 ring-orange-400/30 bg-orange-500/8', dot: 'bg-orange-400', icon: UserX          } },
  { prefix: 'MARK_NO',   cfg: { label: 'No Show',   color: 'text-orange-600 ring-orange-400/30 bg-orange-500/8', dot: 'bg-orange-400', icon: UserX          } },
  { prefix: 'CREATE',    cfg: { label: 'Create',    color: 'text-teal-600   ring-teal-400/30   bg-teal-500/8',   dot: 'bg-teal-400',   icon: Plus           } },
  { prefix: 'UPDATE',    cfg: { label: 'Update',    color: 'text-violet-600 ring-violet-400/30 bg-violet-500/8', dot: 'bg-violet-400', icon: Edit           } },
  { prefix: 'DELETE',    cfg: { label: 'Delete',    color: 'text-red-600    ring-red-400/30    bg-red-500/8',    dot: 'bg-red-400',    icon: Trash2         } },
  { prefix: 'APPROVE',   cfg: { label: 'Approve',   color: 'text-green-600  ring-green-400/30  bg-green-500/8',  dot: 'bg-green-400',  icon: CheckCircle2   } },
  { prefix: 'REJECT',    cfg: { label: 'Reject',    color: 'text-red-600    ring-red-400/30    bg-red-500/8',    dot: 'bg-red-400',    icon: XCircle        } },
  { prefix: 'PURGE',     cfg: { label: 'Purge',     color: 'text-red-700    ring-red-500/30    bg-red-600/8',    dot: 'bg-red-500',    icon: ShieldX        } },
]
const ACTION_DEFAULT: ActionCfg = {
  label: 'Action', color: 'text-muted-foreground ring-border/40 bg-muted/40', dot: 'bg-muted-foreground/40', icon: Activity,
}

function getActionCfg(action: string): ActionCfg {
  const upper = action.toUpperCase()
  for (const { prefix, cfg } of ACTION_PREFIX_MAP) {
    if (upper.startsWith(prefix)) return cfg
  }
  return ACTION_DEFAULT
}

function formatActionLabel(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

type EntityCfg = { icon: React.ElementType; color: string; bg: string }
const ENTITY_MAP: Record<string, EntityCfg> = {
  VideoBooking:   { icon: Video,     color: 'text-blue-500',   bg: 'bg-blue-500/10'   },
  ProductRequest: { icon: Package,   color: 'text-violet-500', bg: 'bg-violet-500/10' },
  Quote:          { icon: FileText,  color: 'text-amber-500',  bg: 'bg-amber-500/10'  },
  AuditLog:       { icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10'   },
}
const ENTITY_DEFAULT: EntityCfg = { icon: Database, color: 'text-muted-foreground', bg: 'bg-muted/60' }
function getEntityCfg(entity: string): EntityCfg {
  return ENTITY_MAP[entity] ?? ENTITY_DEFAULT
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function avatarColor(email: string) {
  const palette = [
    'bg-violet-500/20 text-violet-500', 'bg-blue-500/20 text-blue-500',
    'bg-emerald-500/20 text-emerald-500', 'bg-amber-500/20 text-amber-500',
    'bg-rose-500/20 text-rose-500', 'bg-[#7b57fc]/20 text-[#7b57fc]',
  ]
  return palette[email.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length]
}

function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  return email.slice(0, 2).toUpperCase()
}

function fmtDT(d: Date | string) {
  return format(new Date(d), 'MMM d, yyyy · h:mm a')
}

function fmtRelative(d: Date | string) {
  return formatDistanceToNow(new Date(d), { addSuffix: true })
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION BADGE
// ─────────────────────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const cfg = getActionCfg(action)
  const Icon = cfg.icon
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 leading-none whitespace-nowrap',
      cfg.color,
    )}>
      <Icon size={9} />
      {formatActionLabel(action)}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTITY BADGE
// ─────────────────────────────────────────────────────────────────────────────

function EntityBadge({ entity }: { entity: string }) {
  const cfg = getEntityCfg(entity)
  const Icon = cfg.icon
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-border/40 leading-none whitespace-nowrap',
      cfg.color, cfg.bg,
    )}>
      <Icon size={9} />
      {entity}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANGES JSON VIEWER
// ─────────────────────────────────────────────────────────────────────────────

function ChangesViewer({ changes }: { changes: unknown }) {
  if (!changes) {
    return <p className="text-xs text-muted-foreground italic">No change data recorded.</p>
  }

  // Try to render as a before/after diff if keys contain old/new patterns
  const obj = changes as Record<string, unknown>
  const keys = Object.keys(obj)

  const oldKeys = keys.filter(k => k.startsWith('old') || k.endsWith('Before') || k === 'from')
  const newKeys = keys.filter(k => k.startsWith('new') || k.endsWith('After')  || k === 'to')

  if (oldKeys.length > 0 && newKeys.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-red-500/5 border border-red-400/20 p-3">
          <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider mb-2">Before</p>
          <div className="space-y-1.5">
            {oldKeys.map(k => (
              <div key={k}>
                <p className="text-[9px] text-muted-foreground/70 font-mono">
                  {k.replace(/^old/, '').replace(/Before$/, '')}
                </p>
                <p className="text-xs font-medium text-foreground/80 break-all">
                  {String(obj[k] ?? '—')}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-400/20 p-3">
          <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-2">After</p>
          <div className="space-y-1.5">
            {newKeys.map(k => (
              <div key={k}>
                <p className="text-[9px] text-muted-foreground/70 font-mono">
                  {k.replace(/^new/, '').replace(/After$/, '')}
                </p>
                <p className="text-xs font-medium text-foreground/80 break-all">
                  {String(obj[k] ?? '—')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Generic JSON render
  return (
    <div className="rounded-xl bg-muted/20 border border-border/30 p-3 overflow-x-auto">
      <pre className="text-[10px] text-foreground/70 font-mono leading-relaxed whitespace-pre-wrap break-all">
        {JSON.stringify(changes, null, 2)}
      </pre>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL DIALOG
// ─────────────────────────────────────────────────────────────────────────────

function AuditDetailDialog({
  log, open, onOpenChange,
}: {
  log: AuditLogWithAdmin | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  if (!log) return null

  const actionCfg = getActionCfg(log.action)
  const entityCfg = getEntityCfg(log.entity)
  const ActionIcon = actionCfg.icon
  const EntityIcon = entityCfg.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden flex flex-col max-h-[88vh] rounded-2xl border-border/50 shadow-2xl">

        {/* Header */}
        <div className="flex items-start gap-3.5 px-5 pt-5 pb-4 border-b border-border/40 bg-muted/10 shrink-0">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage src={log.admin.avatarUrl ?? undefined} />
            <AvatarFallback className={cn('text-xs font-semibold', avatarColor(log.admin.email))}>
              {getInitials(log.admin.fullName, log.admin.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <DialogTitle className="text-sm font-semibold text-foreground leading-none">
                {log.admin.fullName ?? log.admin.email}
              </DialogTitle>
              <ActionBadge action={log.action} />
            </div>
            <DialogDescription className="text-[10px] text-muted-foreground mt-1">
              {log.admin.email} · {fmtDT(log.createdAt)}
            </DialogDescription>
          </div>
        </div>

        {/* Meta strip */}
        <div className="grid grid-cols-3 divide-x divide-border/40 border-b border-border/40 shrink-0">
          <div className="px-4 py-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Action</p>
            <div className="flex items-center gap-1.5">
              <span className={cn('h-6 w-6 flex items-center justify-center rounded-md', actionCfg.color.includes('bg-') ? '' : 'bg-muted/60')}>
                <ActionIcon size={12} className={actionCfg.color.split(' ')[0]} />
              </span>
              <span className="text-xs font-semibold text-foreground truncate">
                {formatActionLabel(log.action)}
              </span>
            </div>
          </div>
          <div className="px-4 py-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Entity</p>
            <div className="flex items-center gap-1.5">
              <span className={cn('h-6 w-6 flex items-center justify-center rounded-md', entityCfg.bg)}>
                <EntityIcon size={12} className={entityCfg.color} />
              </span>
              <span className="text-xs font-semibold text-foreground truncate">{log.entity}</span>
            </div>
          </div>
          <div className="px-4 py-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Record ID</p>
            <p className="text-[10px] font-mono text-muted-foreground truncate">
              {log.entityId ? log.entityId.slice(0, 12) + '…' : '—'}
            </p>
          </div>
        </div>

        {/* Changes */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Changes
          </p>
          <ChangesViewer changes={log.changes} />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/40 shrink-0 flex items-center justify-between bg-muted/10">
          <span className="text-[10px] text-muted-foreground font-mono">{log.id.slice(0, 12).toUpperCase()}</span>
          <button type="button" onClick={() => onOpenChange(false)}
            className="h-7 px-3 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE CONFIRM DIALOG
// ─────────────────────────────────────────────────────────────────────────────

function DeleteLogDialog({
  log, open, onOpenChange, onSuccess,
}: {
  log: AuditLogWithAdmin | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!log) return
    setLoading(true)
    try {
      await deleteAuditLog(log.id)
      toast.success('Log entry deleted')
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Failed to delete log entry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[92vw] sm:max-w-sm p-0 rounded-2xl border-border/60 bg-card overflow-hidden shadow-2xl">
        <div className="flex items-start gap-3.5 px-5 pt-5 pb-4 bg-red-500/6 border-b border-red-400/15">
          <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500/15 shrink-0">
            <Trash2 size={18} className="text-red-500" />
          </span>
          <AlertDialogHeader className="space-y-0.5 text-left p-0">
            <AlertDialogTitle className="text-base font-semibold">Delete Log Entry</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This permanently removes the audit record. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        {log && (
          <div className="px-5 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <ActionBadge action={log.action} />
              <span className="text-xs text-muted-foreground">on</span>
              <EntityBadge entity={log.entity} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">{log.id.slice(0, 20)}…</p>
          </div>
        )}
        <AlertDialogFooter className="flex-row justify-end gap-2 px-5 py-4 border-t border-border/40 bg-muted/20">
          <AlertDialogCancel disabled={loading}
            className="h-8 text-xs rounded-lg border-border/60 bg-background hover:bg-muted/60 m-0">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handle} disabled={loading}
            className="h-8 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-white m-0 flex items-center gap-1.5">
            {loading && <Loader2 size={11} className="animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PURGE DIALOG
// ─────────────────────────────────────────────────────────────────────────────

function PurgeDialog({
  open, onOpenChange, onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}) {
  const [days, setDays] = useState('90')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    const d = parseInt(days)
    if (isNaN(d) || d < 1) { toast.error('Enter a valid number of days'); return }
    setLoading(true)
    try {
      const before = new Date()
      before.setDate(before.getDate() - d)
      const count = await purgeAuditLogsBefore(before)
      toast.success(`Purged ${count} log entries older than ${d} days`)
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Failed to purge logs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[92vw] sm:max-w-sm p-0 rounded-2xl border-border/60 bg-card overflow-hidden shadow-2xl">
        <div className="flex items-start gap-3.5 px-5 pt-5 pb-4 bg-amber-500/6 border-b border-amber-400/15">
          <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-500/15 shrink-0">
            <AlertTriangle size={18} className="text-amber-500" />
          </span>
          <AlertDialogHeader className="space-y-0.5 text-left p-0">
            <AlertDialogTitle className="text-base font-semibold">Purge Old Logs</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Permanently delete audit logs older than N days. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <div className="px-5 py-4 space-y-2">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Delete logs older than
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              value={days}
              onChange={e => setDays(e.target.value)}
              className="h-8 w-24 text-xs bg-muted/40 border-border/50 rounded-lg focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20"
            />
            <span className="text-xs text-muted-foreground">days</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Logs before{' '}
            <span className="font-semibold text-foreground">
              {(() => {
                const d = parseInt(days)
                if (isNaN(d) || d < 1) return '—'
                const date = new Date(); date.setDate(date.getDate() - d)
                return format(date, 'MMM d, yyyy')
              })()}
            </span>
            {' '}will be deleted.
          </p>
        </div>
        <AlertDialogFooter className="flex-row justify-end gap-2 px-5 py-4 border-t border-border/40 bg-muted/20">
          <AlertDialogCancel disabled={loading}
            className="h-8 text-xs rounded-lg border-border/60 bg-background hover:bg-muted/60 m-0">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handle} disabled={loading}
            className="h-8 text-xs rounded-lg bg-amber-500 hover:bg-amber-600 text-white m-0 flex items-center gap-1.5">
            {loading && <Loader2 size={11} className="animate-spin" />}
            Purge Logs
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

function AuditPagination({
  page, totalPages, total, pageSize, onGo,
}: {
  page: number; totalPages: number; total: number; pageSize: number
  onGo: (n: number) => void
}) {
  if (totalPages <= 1) return null

  const pages: (number | 'ellipsis')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i)
    else if (pages[pages.length - 1] !== 'ellipsis') pages.push('ellipsis')
  }

  const rangeStart = (page - 1) * pageSize + 1
  const rangeEnd   = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 shrink-0">
      <p className="text-xs text-muted-foreground">
        Showing{' '}
        <span className="font-semibold text-foreground tabular-nums">{rangeStart}–{rangeEnd}</span>
        {' '}of{' '}
        <span className="font-semibold text-foreground tabular-nums">{total.toLocaleString()}</span>
      </p>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onGo(page - 1)} disabled={page <= 1}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground transition-all',
            page > 1
              ? 'border-border/60 hover:border-border hover:text-foreground hover:bg-muted/40'
              : 'border-border/30 opacity-40 cursor-not-allowed',
          )}>
          <ChevronLeft size={14} />
        </button>
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`e${i}`} className="px-2 text-muted-foreground text-xs">…</span>
            ) : (
              <button key={p} type="button" onClick={() => onGo(p as number)}
                className={cn(
                  'flex h-8 min-w-8 px-2 items-center justify-center rounded-lg border text-xs font-medium transition-all tabular-nums',
                  p === page
                    ? 'border-[#7b57fc]/40 bg-[#7b57fc]/10 text-[#7b57fc]'
                    : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted/40',
                )}>
                {p}
              </button>
            )
          )}
        </div>
        <span className="sm:hidden text-xs text-muted-foreground px-2 tabular-nums">{page}/{totalPages}</span>
        <button type="button" onClick={() => onGo(page + 1)} disabled={page >= totalPages}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground transition-all',
            page < totalPages
              ? 'border-border/60 hover:border-border hover:text-foreground hover:bg-muted/40'
              : 'border-border/30 opacity-40 cursor-not-allowed',
          )}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMPLE SELECT
// ─────────────────────────────────────────────────────────────────────────────

function FilterSelect({
  value, onChange, placeholder, options, dot,
}: {
  value: string; onChange: (v: string) => void
  placeholder: string; options: { value: string; label: string }[]
  dot?: boolean
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(
        'h-8 px-2.5 text-xs rounded-lg border bg-muted/40 border-border/50 text-foreground',
        'focus:outline-none focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20',
        'transition-all appearance-none pr-7',
        value ? 'border-[#7b57fc]/40 bg-[#7b57fc]/5 text-[#7b57fc]' : '',
      )}
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CLIENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  initialLogs:       AuditLogWithAdmin[]
  initialTotal:      number
  initialPage:       number
  initialTotalPages: number
  filterOptions:     AuditFilterOptions
  initialFilters:    GetAuditLogsParams
  actionsBreakdown:  { action: string; _count: number }[]
  entitiesBreakdown: { entity: string; _count: number }[]
}

export function AuditLogClient({
  initialLogs,
  initialTotal,
  initialPage,
  initialTotalPages,
  filterOptions,
  initialFilters,
  actionsBreakdown,
  entitiesBreakdown,
}: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

  // ── State ───────────────────────────────────────────────────────────────
  const [logs,       setLogs]       = useState(initialLogs)
  const [total,      setTotal]      = useState(initialTotal)
  const [page,       setPage]       = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [loading,    setLoading]    = useState(false)

  // Filters
  const [search,   setSearch]   = useState(initialFilters.search   ?? '')
  const [entity,   setEntity]   = useState(initialFilters.entity   ?? '')
  const [action,   setAction]   = useState(initialFilters.action   ?? '')
  const [adminId,  setAdminId]  = useState(initialFilters.adminId  ?? '')
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom ?? '')
  const [dateTo,   setDateTo]   = useState(initialFilters.dateTo   ?? '')
  const [showDates, setShowDates] = useState(!!(initialFilters.dateFrom || initialFilters.dateTo))

  // Dialog states
  const [detailLog,    setDetailLog]    = useState<AuditLogWithAdmin | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AuditLogWithAdmin | null>(null)
  const [purgeOpen,    setPurgeOpen]    = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (overrides: Partial<GetAuditLogsParams> = {}) => {
    setLoading(true)
    const r = await getAuditLogs({
      page:     1,
      pageSize: 25,
      search:   search   || undefined,
      entity:   entity   || undefined,
      action:   action   || undefined,
      adminId:  adminId  || undefined,
      dateFrom: dateFrom || undefined,
      dateTo:   dateTo   || undefined,
      ...overrides,
    })
    setLogs(r.logs)
    setTotal(r.total)
    setPage(r.page)
    setTotalPages(r.totalPages)
    setLoading(false)
  }, [search, entity, action, adminId, dateFrom, dateTo])

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { fetchLogs({ page: 1 }) }, 400)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search]) // eslint-disable-line

  // Re-fetch on filter changes (except search, handled above)
  const applyFilters = () => fetchLogs({ page: 1 })

  const goToPage = (n: number) => {
    fetchLogs({ page: n })
    setPage(n)
  }

  const clearFilters = () => {
    setSearch(''); setEntity(''); setAction('')
    setAdminId(''); setDateFrom(''); setDateTo('')
    setShowDates(false)
    fetchLogs({ page: 1, search: undefined, entity: undefined, action: undefined, adminId: undefined, dateFrom: undefined, dateTo: undefined })
  }

  const activeFilterCount = [search, entity, action, adminId, dateFrom, dateTo].filter(Boolean).length

  // ── Entity & Action select options ──────────────────────────────────────
  const entityOptions = filterOptions.entities.map(e => ({ value: e, label: e }))
  const actionOptions = filterOptions.actions.map(a => ({ value: a, label: formatActionLabel(a) }))
  const adminOptions  = filterOptions.admins.map(a => ({
    value: a.id, label: a.fullName ?? a.email,
  }))

  return (
    <div className="h-full rounded-2xl border border-border/50 bg-card overflow-hidden flex flex-col shadow-sm">

      {/* ── FILTER BAR ────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3.5 pb-3 border-b border-border/40 shrink-0 space-y-2.5">

        {/* Row 1 */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Search */}
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            {loading && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-[#7b57fc] border-t-transparent animate-spin" />
            )}
            <input
              placeholder="Search action, entity, admin…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 h-8 text-xs rounded-lg border bg-muted/40 border-border/50 focus:outline-none focus:bg-background focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20 transition-all placeholder:text-muted-foreground/60"
            />
            {search && !loading && (
              <button type="button" onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X size={11} />
              </button>
            )}
          </div>

          {/* Entity */}
          <FilterSelect
            value={entity} onChange={v => { setEntity(v); applyFilters() }}
            placeholder="All entities" options={entityOptions}
          />

          {/* Action */}
          <FilterSelect
            value={action} onChange={v => { setAction(v); applyFilters() }}
            placeholder="All actions" options={actionOptions}
          />

          {/* Admin */}
          <FilterSelect
            value={adminId} onChange={v => { setAdminId(v); applyFilters() }}
            placeholder="All admins" options={adminOptions}
          />

          {/* Date toggle */}
          <button type="button"
            onClick={() => setShowDates(p => !p)}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border transition-all',
              showDates || dateFrom || dateTo
                ? 'bg-[#7b57fc]/10 text-[#7b57fc] border-[#7b57fc]/30 ring-1 ring-[#7b57fc]/20'
                : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border',
            )}>
            <CalendarDays size={12} />
            Dates
            {(dateFrom || dateTo) && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#7b57fc]" />
            )}
          </button>

          {/* Clear */}
          {activeFilterCount > 0 && (
            <button type="button" onClick={clearFilters}
              className="flex items-center gap-1 h-8 px-2.5 text-xs font-medium rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-all">
              <X size={11} /> Clear
            </button>
          )}

          {/* Purge */}
          <button type="button" onClick={() => setPurgeOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-red-400/30 text-red-500 bg-red-500/5 hover:bg-red-500/10 transition-all ml-auto">
            <ShieldX size={12} />
            Purge
          </button>

          {/* Refresh */}
          <button type="button" onClick={() => fetchLogs({ page })} title="Refresh"
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-all">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>

        </div>

        {/* Date range row */}
        <AnimatePresence>
          {showDates && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">From</span>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="h-7 px-2 text-xs rounded-lg border bg-muted/40 border-border/50 focus:outline-none focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20 transition-all" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">To</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="h-7 px-2 text-xs rounded-lg border bg-muted/40 border-border/50 focus:outline-none focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20 transition-all" />
                </div>
                <button type="button" onClick={applyFilters}
                  className="h-7 px-3 text-xs font-medium rounded-lg bg-[#7b57fc] hover:bg-[#6a48e8] text-white transition-colors">
                  Apply
                </button>
                {(dateFrom || dateTo) && (
                  <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); applyFilters() }}
                    className="h-7 px-2 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                    Clear dates
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={11} className="text-muted-foreground shrink-0" />
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#7b57fc]/10 text-[#7b57fc] ring-1 ring-[#7b57fc]/20">
                Search: "{search}"
                <button type="button" onClick={() => setSearch('')}><X size={9} /></button>
              </span>
            )}
            {entity && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#7b57fc]/10 text-[#7b57fc] ring-1 ring-[#7b57fc]/20">
                {entity}
                <button type="button" onClick={() => { setEntity(''); applyFilters() }}><X size={9} /></button>
              </span>
            )}
            {action && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#7b57fc]/10 text-[#7b57fc] ring-1 ring-[#7b57fc]/20">
                {formatActionLabel(action)}
                <button type="button" onClick={() => { setAction(''); applyFilters() }}><X size={9} /></button>
              </span>
            )}
            {adminId && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#7b57fc]/10 text-[#7b57fc] ring-1 ring-[#7b57fc]/20">
                {filterOptions.admins.find(a => a.id === adminId)?.fullName ?? 'Admin'}
                <button type="button" onClick={() => { setAdminId(''); applyFilters() }}><X size={9} /></button>
              </span>
            )}
            {(dateFrom || dateTo) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#7b57fc]/10 text-[#7b57fc] ring-1 ring-[#7b57fc]/20">
                {dateFrom && dateTo ? `${dateFrom} → ${dateTo}` : dateFrom ? `From ${dateFrom}` : `To ${dateTo}`}
                <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); applyFilters() }}><X size={9} /></button>
              </span>
            )}
            <span className="text-xs text-muted-foreground tabular-nums ml-auto">
              {total.toLocaleString()} result{total !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* ── COLUMN HEADERS ─────────────────────────────────────────────────── */}
      <div className="hidden md:flex items-center gap-3 px-4 py-2 border-b border-border/40 bg-muted/20 shrink-0">
        {(['Admin', 'Action', 'Entity', 'Record', 'Changes', 'When'] as const).map(h => (
          <p key={h} className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider"
            style={{ width: h === 'Admin' ? 160 : h === 'Action' ? 150 : h === 'Entity' ? 120 : h === 'Record' ? 100 : h === 'Changes' ? undefined : 120 }}
          >{h}</p>
        ))}
      </div>

      {/* ── LOG ROWS ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 relative [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">

        {/* Loading overlay */}
        <AnimatePresence>
          {loading && logs.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-10 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Empty state */}
        {logs.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 py-16">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/50"
            >
              <ShieldAlert size={26} className="text-muted-foreground/40" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-foreground/70">No audit logs found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeFilterCount > 0 ? 'Try adjusting or clearing your filters.' : 'No admin actions recorded yet.'}
              </p>
            </div>
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearFilters}
                className="text-xs text-[#7b57fc] hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {logs.map((log, i) => {
              const actionCfg = getActionCfg(log.action)
              const entityCfg = getEntityCfg(log.entity)
              const changes   = log.changes as Record<string, unknown> | null

              // One-line changes summary
              const changesSummary = changes
                ? Object.entries(changes).slice(0, 2).map(([k, v]) => `${k}: ${String(v).slice(0, 20)}`).join(' · ')
                : null

              return (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: i * 0.015, type: 'spring', stiffness: 400, damping: 35 }}
                  onClick={() => setDetailLog(log)}
                  className="group flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  {/* Admin avatar + name */}
                  <div className="flex items-center gap-2.5 shrink-0 w-40 min-w-0">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={log.admin.avatarUrl ?? undefined} />
                      <AvatarFallback className={cn('text-[10px] font-bold', avatarColor(log.admin.email))}>
                        {getInitials(log.admin.fullName, log.admin.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {log.admin.fullName ?? log.admin.email}
                      </p>
                      {log.admin.fullName && (
                        <p className="text-[9px] text-muted-foreground truncate">{log.admin.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Action badge */}
                  <div className="shrink-0 w-36">
                    <ActionBadge action={log.action} />
                  </div>

                  {/* Entity badge */}
                  <div className="shrink-0 w-28">
                    <EntityBadge entity={log.entity} />
                  </div>

                  {/* Entity ID */}
                  <div className="hidden md:block w-24 shrink-0">
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      {log.entityId ? log.entityId.slice(0, 10) + '…' : '—'}
                    </p>
                  </div>

                  {/* Changes summary */}
                  <div className="hidden lg:block flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground truncate">
                      {changesSummary ?? <span className="italic">No details</span>}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div className="hidden sm:flex flex-col items-end shrink-0 w-24">
                    <p className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                      {fmtRelative(log.createdAt)}
                    </p>
                    <p className="text-[9px] text-muted-foreground/60 tabular-nums whitespace-nowrap">
                      {format(new Date(log.createdAt), 'MMM d')}
                    </p>
                  </div>

                  {/* Actions menu */}
                  <div onClick={e => e.stopPropagation()} className="shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button"
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-all focus:outline-none">
                          <MoreHorizontal size={14} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl border-border/60 bg-card/95 backdrop-blur-sm shadow-xl p-1">
                        <DropdownMenuItem onClick={() => setDetailLog(log)}
                          className="flex items-center gap-2.5 text-xs px-2 py-2 rounded-lg cursor-pointer focus:bg-muted/60">
                          <span className="h-6 w-6 flex items-center justify-center rounded-md bg-muted/60"><Eye size={12} /></span>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/40 my-1" />
                        <DropdownMenuItem onClick={() => setDeleteTarget(log)}
                          className="flex items-center gap-2.5 text-xs px-2 py-2 rounded-lg cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10">
                          <span className="h-6 w-6 flex items-center justify-center rounded-md bg-red-500/10"><Trash2 size={12} /></span>
                          Delete Entry
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* ── PAGINATION ──────────────────────────────────────────────────────── */}
      <AuditPagination
        page={page} totalPages={totalPages} total={total} pageSize={25}
        onGo={goToPage}
      />

      {/* ── DIALOGS ─────────────────────────────────────────────────────────── */}
      <AuditDetailDialog
        log={detailLog}
        open={!!detailLog}
        onOpenChange={v => { if (!v) setDetailLog(null) }}
      />
      <DeleteLogDialog
        log={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={v => { if (!v) setDeleteTarget(null) }}
        onSuccess={() => fetchLogs({ page })}
      />
      <PurgeDialog
        open={purgeOpen}
        onOpenChange={setPurgeOpen}
        onSuccess={() => fetchLogs({ page: 1 })}
      />
    </div>
  )
}