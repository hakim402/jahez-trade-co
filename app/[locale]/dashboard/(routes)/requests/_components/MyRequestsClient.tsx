'use client'

import {
  useState, useTransition, useRef, useCallback, useEffect,
} from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, isToday } from 'date-fns'
import {
  Plus, X, Loader2, Upload, Trash2, Download, ExternalLink,
  ChevronDown, Check, AlertTriangle, Clock,
  PackageSearch, Star, FileText, Crown,
  CheckCircle2, Send,
} from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge }    from '@/components/ui/badge'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Pagination, PaginationContent, PaginationEllipsis,
  PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'
import { toast } from 'sonner'
import {
  createProductRequest, uploadClientFile, deleteClientFile,
  acceptQuote, rejectQuote, deleteMyRequest,
} from '../actions'
import {
  STATUS_CONFIG, getFileIcon, formatFileSize,
  ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB,
  type ClientRequestWithRelations,
  type TransformedFile,
  type TransformedQuote,
  type PaginationInfo,
  type UserPlanInfo,
  type ClientFiltersType,
} from './types'
import { RequestStatus } from '@prisma/client'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RequestStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={`text-xs ${cfg.color}`}>
      {cfg.label}
    </Badge>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN BANNER
// ─────────────────────────────────────────────────────────────────────────────

function PlanBanner({ plan }: { plan: UserPlanInfo }) {
  if (plan.limit === Infinity) return null
  const pct = Math.round((plan.usedCount / plan.limit) * 100)
  const isWarning = pct >= 80

  return (
    <div className={`rounded-xl border p-4 flex items-center gap-4 ${
      isWarning
        ? 'border-amber-500/30 bg-amber-500/5'
        : 'border-border/20 bg-card/30'
    }`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
        isWarning ? 'bg-amber-500/15' : 'bg-muted/30'
      }`}>
        <Crown size={16} className={isWarning ? 'text-amber-400' : 'text-muted-foreground'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-medium text-foreground">{plan.planName} plan</p>
          <p className="text-xs text-muted-foreground">
            {plan.usedCount} / {plan.limit} requests
          </p>
        </div>
        <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isWarning ? 'bg-amber-400' : 'bg-color'}`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>
      {isWarning && (
        <Button size="sm" className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white gap-1 shrink-0">
          <Crown size={11} /> Upgrade
        </Button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE UPLOAD ZONE
// ─────────────────────────────────────────────────────────────────────────────

function FileUploadZone({
  requestId, onUploaded,
}: { requestId: string; onUploaded: (f: TransformedFile) => void }) {
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const process = useCallback(async (file: File) => {
    setError(null); setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('requestId', requestId)
    const r = await uploadClientFile(fd)
    setUploading(false)
    if (r.success) {
      onUploaded({
        id: r.data.id, url: r.data.url, fileType: file.type,
        fileName: r.data.fileName, fileSize: file.size,
        requestId, quoteId: null, uploadedById: null, createdAt: new Date(),
      })
    } else {
      setError(r.error)
    }
  }, [requestId, onUploaded])

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) process(f) }}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
          dragging ? 'border-color bg-color/5' : 'border-border/40 hover:border-border/70 hover:bg-accent/5'
        }`}
      >
        <Input ref={inputRef} type="file" className="hidden"
          accept={ALLOWED_EXTENSIONS.map(e => `.${e}`).join(',')}
          onChange={e => { const f = e.target.files?.[0]; if (f) process(f); e.target.value = '' }}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 size={14} className="animate-spin" /> Uploading…
          </div>
        ) : (
          <>
            <Upload size={16} className="mx-auto text-muted-foreground/40 mb-1.5" />
            <p className="text-xs text-muted-foreground">
              Drop file or <span className="text-color underline">browse</span>
            </p>
            <p className="text-xs text-muted-foreground/50 mt-0.5">
              PDF, PNG, DOC, XLS, ZIP · Max {MAX_FILE_SIZE_MB}MB
            </p>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertTriangle size={10} />{error}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE LIST
// ─────────────────────────────────────────────────────────────────────────────

function FileList({
  files, canDelete = false, onDelete,
}: { files: TransformedFile[]; canDelete?: boolean; onDelete?: (id: string) => void }) {
  const [isPending, startTransition] = useTransition()

  if (!files.length) return <p className="text-xs text-muted-foreground italic">No files attached</p>

  return (
    <div className="space-y-1.5">
      {files.map(f => (
        <div key={f.id}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20 border border-border/20 group">
          <span className="text-sm shrink-0">{getFileIcon(f.fileName ?? 'file.bin')}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{f.fileName ?? 'File'}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(f.fileSize)}</p>
          </div>
          <Link href={f.url} target="_blank" rel="noopener noreferrer"
            className="text-muted-foreground hover:text-color shrink-0">
            <Download size={12} />
          </Link>
          {canDelete && onDelete && (
            <Button
              disabled={isPending}
              onClick={() => startTransition(async () => {
                const r = await deleteClientFile(f.id)
                if (r.success) onDelete(f.id)
                else toast.error(r.error)
              })}
              className="text-muted-foreground hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100">
              <Trash2 size={12} />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QUOTE CARD (inside detail modal)
// ─────────────────────────────────────────────────────────────────────────────

const QUOTE_COLORS: Record<string, string> = {
  DRAFT:    'bg-muted/30 text-muted-foreground border-border/20',
  SENT:     'bg-violet-500/10 text-violet-400 border-violet-500/20',
  ACCEPTED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
}

interface QuoteCardProps {
  quote:           TransformedQuote
  hasAccepted:     boolean
  onAccept:        (id: string) => void
  onReject:        (id: string) => void
  isPending:       boolean
}

function QuoteCard({ quote, hasAccepted, onAccept, onReject, isPending }: QuoteCardProps) {
  const [expanded, setExpanded] = useState(false)

  const price = parseFloat(quote.price)
  const isSent = quote.status === 'SENT'

  return (
    <div className={`rounded-xl border transition-colors ${
      expanded ? 'border-border/40 bg-card/50' : 'border-border/20 bg-card/20'
    }`}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(p => !p)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold">
              {quote.currency} {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-muted-foreground">Rev. {quote.revision}</span>
            <Badge variant="outline" className={`text-xs ${QUOTE_COLORS[quote.status]}`}>
              {quote.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            From {quote.createdBy?.fullName ?? 'Sourcing team'}
            {quote.validUntil && ` · Valid until ${format(new Date(quote.validUntil), 'MMM d, yyyy')}`}
          </p>
        </div>

        {/* Accept / Reject — only SENT quotes, no accepted quote yet */}
        {isSent && !hasAccepted && (
          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            <Button size="sm" disabled={isPending}
              onClick={() => onAccept(quote.id)}
              className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white gap-1">
              {isPending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
              Accept
            </Button>
            <Button size="sm" variant="ghost" disabled={isPending}
              onClick={() => onReject(quote.id)}
              className="h-7 text-xs text-red-400 hover:bg-red-500/10 gap-1">
              <X size={11} /> Reject
            </Button>
          </div>
        )}

        <ChevronDown size={14}
          className={`text-muted-foreground transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`}
        />
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/10 pt-3 space-y-3">
          {quote.adminNotes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes from sourcing team</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{quote.adminNotes}</p>
            </div>
          )}
          {quote.files?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Attachments</p>
              <FileList files={quote.files} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────

type DetailTab = 'overview' | 'quotes' | 'files' | 'timeline'

function RequestDetailModal({
  request: initialReq,
  onClose,
  onActionComplete,
}: {
  request:          ClientRequestWithRelations
  onClose:          () => void
  onActionComplete: (updated?: Partial<ClientRequestWithRelations>) => void
}) {
  const [req,       setReq]       = useState(initialReq)
  const [tab,       setTab]       = useState<DetailTab>('overview')
  const [isPending, startTransition] = useTransition()

  const handleAccept = (quoteId: string) => {
    startTransition(async () => {
      const r = await acceptQuote(quoteId)
      if (r.success) {
        toast.success('Quote accepted!')
        onActionComplete()
        onClose()
      } else {
        toast.error(r.error)
      }
    })
  }

  const handleReject = (quoteId: string) => {
    startTransition(async () => {
      const r = await rejectQuote(quoteId)
      if (r.success) {
        toast.success('Quote rejected.')
        onActionComplete()
        onClose()
      } else {
        toast.error(r.error)
      }
    })
  }

  const TABS: { id: DetailTab; label: string; count?: number }[] = [
    { id: 'overview',  label: 'Overview' },
    { id: 'quotes',    label: 'Quotes',   count: req.quotes.length },
    { id: 'files',     label: 'Files',    count: req.files.length },
    { id: 'timeline',  label: 'Timeline', count: req.statusHistory.length },
  ]

  const sentQuotes = req.quotes.filter(q => q.status === 'SENT')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-5xl max-h-[90vh] rounded-2xl border border-border/10 bg-card shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/10 shrink-0">
          <div className="flex items-center gap-3">
            <StatusBadge status={req.status} />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {req.description ? req.description.slice(0, 40) + (req.description.length > 40 ? '…' : '') : 'Product Request'}
              </p>
              <p className="text-xs text-muted-foreground">
                #{req.id.slice(-8).toUpperCase()} · {format(new Date(req.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <Button variant={"ghost"} onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X size={20} />
          </Button>
        </div>

        {/* Action alert — pending quotes */}
        {sentQuotes.length > 0 && !req.acceptedQuoteId && (
          <div className="mx-5 mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Send size={13} className="text-violet-400 shrink-0" />
            <p className="text-xs text-violet-300 flex-1">
              You have <strong>{sentQuotes.length}</strong> quote{sentQuotes.length > 1 ? 's' : ''} waiting for your decision.
            </p>
            <button onClick={() => setTab('quotes')}
              className="text-xs text-violet-400 underline shrink-0">Review →</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0 px-5 border-b border-border/10 shrink-0 mt-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                tab === t.id
                  ? 'border-color text-color'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.id ? 'bg-color/15 text-color' : 'bg-muted/50 text-muted-foreground'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <>
              {/* Status context */}
              <div className={`rounded-xl p-3.5 border ${STATUS_CONFIG[req.status].color}`}>
                <p className="text-xs leading-relaxed">{STATUS_CONFIG[req.status].description}</p>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{req.description ?? <span className="italic text-muted-foreground">—</span>}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                  <p className="text-sm font-mono font-bold">{req.quantity.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Shipping Country</p>
                  <p className="text-sm">{req.shippingCountry}</p>
                </div>
                {req.productLink && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Product Link</p>
                    <a href={req.productLink} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-color hover:underline flex items-center gap-1">
                      <ExternalLink size={11} /> View product
                    </a>
                  </div>
                )}
                {req.customNotes && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Your Notes</p>
                    <p className="text-sm text-foreground/80">{req.customNotes}</p>
                  </div>
                )}
              </div>

              {/* Priority from admin */}
              {req.priority > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  Priority: {req.priority}/5
                </div>
              )}
            </>
          )}

          {/* ── QUOTES ── */}
          {tab === 'quotes' && (
            <>
              {req.quotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                  <FileText size={32} className="text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No quotes yet. Our team will get back to you soon.</p>
                </div>
              ) : (
                req.quotes.map(q => (
                  <QuoteCard
                    key={q.id}
                    quote={q}
                    hasAccepted={!!req.acceptedQuoteId}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    isPending={isPending}
                  />
                ))
              )}
            </>
          )}

          {/* ── FILES ── */}
          {tab === 'files' && (
            <>
              <FileList
                files={req.files}
                canDelete={['SUBMITTED', 'IN_REVIEW'].includes(req.status)}
                onDelete={id => setReq(prev => ({ ...prev, files: prev.files.filter(f => f.id !== id) }))}
              />
              {['SUBMITTED', 'IN_REVIEW'].includes(req.status) && (
                <FileUploadZone
                  requestId={req.id}
                  onUploaded={f => setReq(prev => ({ ...prev, files: [...prev.files, f] }))}
                />
              )}
              {!['SUBMITTED', 'IN_REVIEW'].includes(req.status) && (
                <p className="text-xs text-muted-foreground">File uploads are disabled once your request is in progress.</p>
              )}
            </>
          )}

          {/* ── TIMELINE ── */}
          {tab === 'timeline' && (
            <div className="space-y-2">
              {req.statusHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No history yet</p>
              ) : (
                req.statusHistory.map((h, i) => (
                  <div key={h.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-color' : 'bg-border'}`} />
                      {i < req.statusHistory.length - 1 && <div className="w-px h-5 bg-border/30" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={h.oldStatus} />
                        <span className="text-xs text-muted-foreground">→</span>
                        <StatusBadge status={h.newStatus} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(h.changedAt), 'MMM d, yyyy · h:mm a')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/10 shrink-0 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Updated {format(new Date(req.updatedAt), 'MMM d, yyyy')}
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE REQUEST DIALOG
// ─────────────────────────────────────────────────────────────────────────────

// ── Fix: define output shape explicitly so coerce.number() infers as `number`
const formSchema = z.object({
  productLink:     z.string().url('Must be a valid URL').optional().or(z.literal('')),
  description:     z.string().min(1, 'Description is required').max(2000),
  quantity:        z.coerce.number().int().positive('Must be a positive number'),
  shippingCountry: z.string().min(2, 'Shipping country is required'),
  customNotes:     z.string().max(1000).optional(),
})

// Explicit output type — avoids `unknown` from z.coerce in react-hook-form resolver
type FormValues = {
  productLink?:    string
  description:     string
  quantity:        number
  shippingCountry: string
  customNotes?:    string
}

function CreateRequestDialog({
  open, onClose, onSuccess,
}: { open: boolean; onClose: () => void; onSuccess: (id: string) => void }) {
  const [isPending,  startTransition] = useTransition()
  const [createdId,  setCreatedId]    = useState<string | null>(null)
  const [files,      setFiles]        = useState<TransformedFile[]>([])
  const [error,      setError]        = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { productLink: '', description: '', quantity: 1, shippingCountry: '', customNotes: '' },
  })

  const reset = () => {
    form.reset(); setCreatedId(null); setFiles([]); setError(null)
  }

  const onSubmit = (data: FormValues) => {
    setError(null)
    startTransition(async () => {
      const r = await createProductRequest(data)
      if (r.success) {
        setCreatedId(r.data.id)
      } else {
        if (r.error === 'UPGRADE_REQUIRED') {
          setError('You need an active plan to submit requests. Please upgrade.')
        } else {
          setError(r.error)
        }
      }
    })
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) { reset(); onClose() } }}
    >
      <div className="w-full max-w-3xl rounded-2xl border border-border/10 bg-card shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/10">
          <div>
            <h2 className="text-base font-semibold">New Product Request</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Tell us what you need sourced</p>
          </div>
          <Button variant={"ghost"} onClick={() => { reset(); onClose() }}
            className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X size={18} />
          </Button>
        </div>

        {createdId ? (
          /* Post-submit: file upload step */
          <div className="px-6 py-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <Check size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold">Request submitted!</p>
                <p className="text-xs text-muted-foreground">We'll review it and get back to you soon.</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Optional: attach product images, specs, or reference files
              </p>
              <FileUploadZone
                requestId={createdId}
                onUploaded={f => setFiles(prev => [...prev, f])}
              />
              <FileList files={files} canDelete
                onDelete={id => setFiles(prev => prev.filter(f => f.id !== id))} />
            </div>

            <Button onClick={() => { reset(); onSuccess(createdId); onClose() }}
              className="w-full bg-color hover:bg-color/90 text-white">
              Done — view my requests
            </Button>
          </div>
        ) : (
          /* Form */
          <div className="px-6 py-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Description *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="What product do you need? Include brand, specs, colour…"
                          rows={3} className="resize-none text-sm bg-background/50 border-border/50" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />

                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Quantity *</FormLabel>
                        <FormControl>
                          <Input type="number" min="1"
                            className="h-9 text-sm bg-background/50 border-border/50" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />

                  <FormField control={form.control} name="shippingCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Shipping Country *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. France"
                            className="h-9 text-sm bg-background/50 border-border/50" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="productLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Product URL (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://alibaba.com/…"
                          className="h-9 text-sm bg-background/50 border-border/50" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />

                <FormField control={form.control} name="customNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Additional Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Packaging requirements, certifications, deadline…"
                          rows={2} className="resize-none text-sm bg-background/50 border-border/50" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    <AlertTriangle size={12} /> {error}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm"
                    onClick={() => { reset(); onClose() }}
                    className="flex-1 h-9 text-sm text-muted-foreground">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}
                    className="flex-1 h-9 text-sm bg-color hover:bg-color/90 text-white gap-1.5">
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Submit Request
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST CARD (grid view)
// ─────────────────────────────────────────────────────────────────────────────

function RequestCard({
  request, onClick, onDelete,
}: {
  request:  ClientRequestWithRelations
  onClick:  () => void
  onDelete: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  const sentQuotes = request.quotes.filter(q => q.status === 'SENT')
  const hasAction  = sentQuotes.length > 0 && !request.acceptedQuoteId

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border bg-card/50 p-4 cursor-pointer hover:border-border/40 transition-all group ${
        hasAction
          ? 'border-violet-500/30 shadow-sm shadow-violet-500/5'
          : 'border-border/10'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={request.status} />
          {hasAction && (
            <span className="text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Send size={9} /> {sentQuotes.length} quote{sentQuotes.length > 1 ? 's' : ''} waiting
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground shrink-0">
          {isToday(new Date(request.createdAt))
            ? `Today ${format(new Date(request.createdAt), 'h:mm a')}`
            : format(new Date(request.createdAt), 'MMM d')}
        </p>
      </div>

      {/* Description */}
      <p className="mt-2.5 text-sm font-medium text-foreground line-clamp-2">
        {request.description ?? <span className="italic text-muted-foreground">No description</span>}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
        <span className="font-mono font-medium text-foreground">{request.quantity.toLocaleString()} units</span>
        <span>·</span>
        <span>{request.shippingCountry}</span>
        {request.productLink && (
          <>
            <span>·</span>
            <a href={request.productLink} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-color hover:underline flex items-center gap-0.5">
              <ExternalLink size={10} /> Link
            </a>
          </>
        )}
        {request.files.length > 0 && (
          <>
            <span>·</span>
            <span>{request.files.length} file{request.files.length > 1 ? 's' : ''}</span>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/10">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText size={11} />
          {request.quotes.length === 0
            ? 'No quotes yet'
            : `${request.quotes.length} quote${request.quotes.length > 1 ? 's' : ''}`}
          {request.acceptedQuoteId && (
            <span className="text-emerald-400 flex items-center gap-0.5">
              <CheckCircle2 size={10} /> Accepted
            </span>
          )}
        </div>

        {/* Delete — only SUBMITTED */}
        {request.status === 'SUBMITTED' && (
          <Button
            onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
            className="text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </Button>
        )}
      </div>

      {/* Inline delete confirm */}
      {confirmDelete && (
        <div
          className="mt-3 pt-3 border-t border-border/20"
          onClick={e => e.stopPropagation()}
        >
          <p className="text-xs text-muted-foreground mb-2">Delete this request?</p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost"
              onClick={() => setConfirmDelete(false)}
              className="flex-1 h-7 text-xs text-muted-foreground">
              Cancel
            </Button>
            <Button size="sm" disabled={isPending}
              onClick={() => startTransition(async () => {
                const r = await deleteMyRequest(request.id)
                if (r.success) { onDelete(request.id); toast.success('Request deleted') }
                else toast.error(r.error)
                setConfirmDelete(false)
              })}
              className="flex-1 h-7 text-xs bg-red-500 hover:bg-red-600 text-white gap-1">
              {isPending ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS FILTER TABS
// ─────────────────────────────────────────────────────────────────────────────

const FILTER_TABS: { value: RequestStatus | ''; label: string }[] = [
  { value: '',             label: 'All' },
  { value: 'SUBMITTED',   label: 'Submitted' },
  { value: 'IN_REVIEW',   label: 'In Review' },
  { value: 'QUOTED',      label: 'Quoted' },
  { value: 'APPROVED',    label: 'Approved' },
  { value: 'IN_PRODUCTION', label: 'Production' },
  { value: 'SHIPPED',     label: 'Shipped' },
  { value: 'COMPLETED',   label: 'Done' },
]

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

function ClientPagination({ pagination }: { pagination: PaginationInfo }) {
  const router     = useRouter()
  const pathname   = usePathname()
  const params     = useSearchParams()
  const { page, totalPages } = pagination

  const go = (p: number) => {
    const sp = new URLSearchParams(params)
    sp.set('page', p.toString())
    router.push(`${pathname}?${sp.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#"
            onClick={e => { e.preventDefault(); if (page > 1) go(page - 1) }}
            className={page <= 1 ? 'pointer-events-none opacity-40' : ''} />
        </PaginationItem>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i, totalPages))
          return (
            <PaginationItem key={p}>
              <PaginationLink href="#" isActive={p === page}
                onClick={e => { e.preventDefault(); go(p) }}>
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        })}
        <PaginationItem>
          <PaginationNext href="#"
            onClick={e => { e.preventDefault(); if (page < totalPages) go(page + 1) }}
            className={page >= totalPages ? 'pointer-events-none opacity-40' : ''} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT: MyRequestsClient
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  initialRequests:   ClientRequestWithRelations[]
  initialPagination: PaginationInfo
  filters:           ClientFiltersType
  plan:              UserPlanInfo
}

export function MyRequestsClient({ initialRequests, initialPagination, filters, plan }: Props) {
  const router    = useRouter()
  const pathname  = usePathname()
  const params    = useSearchParams()

  const [requests,    setRequests]    = useState<ClientRequestWithRelations[]>(initialRequests)
  const [pagination,  setPagination]  = useState<PaginationInfo>(initialPagination)
  const [loading,     setLoading]     = useState(false)
  const [createOpen,  setCreateOpen]  = useState(false)
  const [selectedReq, setSelectedReq] = useState<ClientRequestWithRelations | null>(null)

  const activeStatus = (params.get('status') ?? '') as RequestStatus | ''
  const activePage   = parseInt(params.get('page') ?? '1')

  // ── Fetch data client-side whenever tab or page changes ──────────────────
  useEffect(() => {
    let cancelled = false

    async function fetchPage() {
      setLoading(true)
      try {
        const { getMyRequests } = await import('../actions')
        const r = await getMyRequests({
          page:     activePage,
          pageSize: filters.pageSize,
          status:   activeStatus as RequestStatus || undefined,
        })
        if (!cancelled && r.success) {
          setRequests(r.data.requests as ClientRequestWithRelations[])
          setPagination(r.data.pagination)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPage()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus, activePage])

  // ── Sync when server re-renders with new props ────────────────────────────
  useEffect(() => {
    setRequests(initialRequests)
    setPagination(initialPagination)
  }, [initialRequests, initialPagination])

  const setStatusFilter = (s: string) => {
    const sp = new URLSearchParams(params)
    s ? sp.set('status', s) : sp.delete('status')
    sp.set('page', '1')
    router.push(`${pathname}?${sp.toString()}`)
  }

  const handleDeleted = (id: string) =>
    setRequests(prev => prev.filter(r => r.id !== id))

  // After creating: re-fetch page 1 with current status, update URL
  const handleCreated = useCallback(async () => {
    setCreateOpen(false)
    setLoading(true)
    try {
      const { getMyRequests } = await import('../actions')
      const r = await getMyRequests({
        page: 1, pageSize: filters.pageSize,
        status: activeStatus as RequestStatus || undefined,
      })
      if (r.success) {
        setRequests(r.data.requests as ClientRequestWithRelations[])
        setPagination(r.data.pagination)
      }
    } finally {
      setLoading(false)
    }
    const sp = new URLSearchParams(params)
    sp.set('page', '1')
    router.replace(`${pathname}?${sp.toString()}`)
  }, [activeStatus, filters.pageSize, params, pathname, router])

  const pendingQuoteCount = requests.reduce((acc, r) =>
    acc + r.quotes.filter(q => q.status === 'SENT').length, 0)

  return (
    <div className="space-y-5">
      {/* Plan banner */}
      <PlanBanner plan={plan} />

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {pagination.totalCount} request{pagination.totalCount !== 1 ? 's' : ''}
            {pendingQuoteCount > 0 && (
              <span className="ml-2 text-violet-400 font-medium">
                · {pendingQuoteCount} quote{pendingQuoteCount > 1 ? 's' : ''} waiting
              </span>
            )}
          </p>
          {loading && <Loader2 size={13} className="animate-spin text-muted-foreground" />}
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={!plan.hasAccess}
          className="h-9 text-sm bg-color hover:bg-color/90 text-white gap-1.5"
        >
          <Plus size={14} /> New Request
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTER_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setStatusFilter(t.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeStatus === t.value
                ? 'bg-color/15 text-color border border-color/25'
                : 'text-muted-foreground hover:text-foreground bg-muted/20 border border-transparent hover:border-border/30'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/5 bg-card/50 h-40 animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <PackageSearch size={40} className="text-muted-foreground/20" />
          <div>
            <p className="text-sm font-medium text-foreground">No requests yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Submit your first product request and our team will source it for you.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} disabled={!plan.hasAccess}
            className="bg-color hover:bg-color/90 text-white gap-2 h-9 text-sm">
            <Plus size={14} /> Submit first request
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map(r => (
            <RequestCard
              key={r.id}
              request={r}
              onClick={() => setSelectedReq(r)}
              onDelete={handleDeleted}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <ClientPagination pagination={pagination} />

      {/* Create dialog */}
      <CreateRequestDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreated}
      />

      {/* Detail modal */}
      {selectedReq && (
        <RequestDetailModal
          request={selectedReq}
          onClose={() => setSelectedReq(null)}
          onActionComplete={handleCreated}
        />
      )}
    </div>
  )
}