'use client'

import {
  useState, useTransition, useRef, useCallback, useEffect,
} from 'react'
import { format } from 'date-fns'
import {
  X, Sparkles, Plus, Trash2, Upload, FileText, ExternalLink,
  Loader2, Check, AlertTriangle, ChevronDown, Send, Clock,
  DollarSign, Bot, Star, Eye, RefreshCw, Download,
  Edit3,
} from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge }    from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { QuoteStatus } from '@prisma/client'
import {
  getProductRequest, createQuote, updateQuoteStatus, deleteQuote,
  uploadFile, deleteFile, generateAIQuote, updateRequestStatus,
} from '../actions'
import { StatusBadge } from './RequestsTable'
import { ConfirmDialog } from './ConfirmDialog'
import { getFileIcon, formatFileSize, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB } from './types'
import type { RequestWithRelations, TransformedQuote, TransformedFile } from './types'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────────────────
// QUOTE STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const QUOTE_STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string }> = {
  DRAFT:    { label: 'Draft',    color: 'bg-muted/50 text-muted-foreground border-border/30' },
  SENT:     { label: 'Sent',     color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  ACCEPTED: { label: 'Accepted', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  REJECTED: { label: 'Rejected', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE UPLOAD ZONE
// ─────────────────────────────────────────────────────────────────────────────

interface FileUploadZoneProps {
  requestId?: string
  quoteId?:   string
  onUploaded: (file: TransformedFile) => void
}

function FileUploadZone({ requestId, quoteId, onUploaded }: FileUploadZoneProps) {
  const [isDragging, setIsDragging]   = useState(false)
  const [uploading,  setUploading]    = useState(false)
  const [error,      setError]        = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    setError(null)
    setUploading(true)

    const fd = new FormData()
    fd.append('file', file)
    if (requestId) fd.append('requestId', requestId)
    if (quoteId)   fd.append('quoteId',   quoteId)

    const r = await uploadFile(fd)
    setUploading(false)

    if (r.success) {
      // Build a TransformedFile stub so we can show it immediately
      onUploaded({
        id: r.data.id, url: r.data.url, fileType: file.type,
        fileName: r.data.fileName, fileSize: file.size,
        requestId: requestId ?? null, quoteId: quoteId ?? null,
        uploadedById: null, createdAt: new Date(),
      })
    } else {
      setError(r.error)
    }
  }, [requestId, quoteId, onUploaded])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-color bg-color/5'
            : 'border-border/40 hover:border-border/80 hover:bg-accent/5'
        }`}
      >
        <Input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_EXTENSIONS.map(e => `.${e}`).join(',')}
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = '' }}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Uploading…</span>
          </div>
        ) : (
          <>
            <Upload size={20} className="mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">
              Drop a file here or <span className="text-color underline">browse</span>
            </p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              PDF, PNG, JPG, DOC, XLS, ZIP · Max {MAX_FILE_SIZE_MB}MB
            </p>
          </>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
          <AlertTriangle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE LIST
// ─────────────────────────────────────────────────────────────────────────────

function FileList({
  files, onDelete, canDelete = true,
}: { files: TransformedFile[]; onDelete?: (id: string) => void; canDelete?: boolean }) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending,  startTransition] = useTransition()

  if (!files.length) return (
    <p className="text-xs text-muted-foreground italic">No files attached</p>
  )

  return (
    <div className="space-y-1.5">
      {files.map(f => (
        <div key={f.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20 border border-border/20 group">
          <span className="text-base shrink-0">{getFileIcon(f.fileName ?? 'file.bin')}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{f.fileName ?? 'Unknown file'}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(f.fileSize)}</p>
          </div>
          <Link href={f.url} target="_blank" rel="noopener noreferrer"
            className="text-muted-foreground hover:text-color transition-colors shrink-0">
            <Download size={13} />
          </Link>
          {canDelete && onDelete && (
            <Button
              onClick={() => setDeletingId(f.id)}
              className="text-muted-foreground hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100">
              <Trash2 size={13} />
            </Button>
          )}
          <ConfirmDialog
            open={deletingId === f.id}
            onOpenChange={open => !open && setDeletingId(null)}
            title="Delete file?"
            description={`Remove "${f.fileName}" permanently?`}
            onConfirm={() => {
              startTransition(async () => {
                await deleteFile(f.id)
                setDeletingId(null)
                onDelete?.(f.id)
              })
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE QUOTE FORM
// ─────────────────────────────────────────────────────────────────────────────

interface QuoteFormProps {
  requestId:   string
  aiEstimate?: string
  onCreated:   (id: string) => void
  onCancel:    () => void
}

function CreateQuoteForm({ requestId, aiEstimate, onCreated, onCancel }: QuoteFormProps) {
  const [price,      setPrice]      = useState(aiEstimate ?? '')
  const [currency,   setCurrency]   = useState('USD')
  const [notes,      setNotes]      = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [status,     setStatus]     = useState<QuoteStatus>('DRAFT')
  const [error,      setError]      = useState<string | null>(null)
  const [isPending,  startTransition] = useTransition()
  const [createdId,  setCreatedId]  = useState<string | null>(null)
  const [uploadFor,  setUploadFor]  = useState<string | null>(null)
  const [files,      setFiles]      = useState<TransformedFile[]>([])

  const handleSubmit = () => {
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum <= 0) { setError('Enter a valid price'); return }
    setError(null)

    startTransition(async () => {
      const r = await createQuote({
        requestId, price: priceNum, currency, adminNotes: notes || undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined, status,
      })
      if (r.success) {
        setCreatedId(r.data.id)
        setUploadFor(r.data.id)
      } else {
        setError(r.error)
      }
    })
  }

  if (createdId) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400">
          <Check size={16} />
          <span className="text-sm font-medium">Quote created (Rev. 1)</span>
        </div>
        <p className="text-xs text-muted-foreground">Optionally attach files to this quote:</p>
        <FileUploadZone
          quoteId={createdId}
          onUploaded={f => setFiles(prev => [...prev, f])}
        />
        <FileList files={files} onDelete={id => setFiles(prev => prev.filter(f => f.id !== id))} />
        <Button size="sm" onClick={() => onCreated(createdId)}
          className="w-full h-8 text-xs bg-color hover:bg-color/90 text-white">
          Done
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/20 bg-card/30 p-4 space-y-3">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Plus size={14} /> New Quote
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Price *</label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
            <Input value={price} onChange={e => setPrice(e.target.value)}
              placeholder="0.00" className="pl-7 h-8 text-sm bg-background/50 border-border/50" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Currency</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"
                className="w-full h-8 text-sm justify-between border-border/50 bg-background/50">
                {currency} <ChevronDown size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover border-border">
              {['USD', 'EUR', 'GBP', 'CNY'].map(c => (
                <DropdownMenuItem key={c} onClick={() => setCurrency(c)}
                  className={`text-sm cursor-pointer ${currency === c ? 'text-color' : ''}`}>
                  {c}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Valid Until</label>
        <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
          className="h-8 text-sm bg-background/50 border-border/50" />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Admin Notes (visible to client)</label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Pricing breakdown, lead time, MOQ details…"
          rows={3}
          className="text-sm resize-none bg-background/50 border-border/50" />
      </div>

      {/* Status */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Save as:</span>
        {(['DRAFT', 'SENT'] as QuoteStatus[]).map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              status === s
                ? QUOTE_STATUS_CONFIG[s].color
                : 'border-border/30 text-muted-foreground hover:border-border/60'
            }`}>
            {QUOTE_STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertTriangle size={11} /> {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}
          className="flex-1 h-8 text-xs text-muted-foreground">
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={isPending}
          className="flex-1 h-8 text-xs bg-color hover:bg-color/90 text-white gap-1.5">
          {isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Create Quote
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AI QUOTE PANEL
// ─────────────────────────────────────────────────────────────────────────────

interface AIQuotePanelProps {
  requestId:     string
  hasEstimate:   boolean
  onGenerated:   (estimate: string, notes: string) => void
}

function AIQuotePanel({ requestId, hasEstimate, onGenerated }: AIQuotePanelProps) {
  const [open,      setOpen]      = useState(false)
  const [isPending, startTransition] = useTransition()
  const [result,    setResult]    = useState<{
    estimatedPrice: string; confidence: number; reasoning: string; suggestedNotes: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = () => {
    setError(null)
    startTransition(async () => {
      const r = await generateAIQuote(requestId)
      if (r.success) {
        setResult(r.data)
        setOpen(true)
        onGenerated(r.data.estimatedPrice, r.data.suggestedNotes)
      } else {
        setError(r.error)
      }
    })
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-amber-400" />
          <span className="text-sm font-semibold text-foreground">AI Quote Generator</span>
        </div>
        <Button size="sm" onClick={handleGenerate} disabled={isPending}
          className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white gap-1.5">
          {isPending
            ? <><Loader2 size={11} className="animate-spin" /> Analysing…</>
            : <><Bot size={11} /> {hasEstimate ? 'Regenerate' : 'Generate'}</>}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Uses Groq AI to analyse the request and suggest a competitive price, confidence score, and client-ready notes.
      </p>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertTriangle size={11} /> {error}
        </p>
      )}

      {result && open && (
        <div className="space-y-2.5 pt-1 border-t border-amber-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">
                ${parseFloat(result.estimatedPrice).toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">USD</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-20 bg-border/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${Math.round(result.confidence * 100)}%` }}
                />
              </div>
              <span className="text-xs text-amber-400 font-medium">
                {Math.round(result.confidence * 100)}% confidence
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Reasoning</p>
            <p className="text-xs text-foreground/80 leading-relaxed">{result.reasoning}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Suggested client notes</p>
            <p className="text-xs text-foreground/80 leading-relaxed italic">"{result.suggestedNotes}"</p>
          </div>

          <button onClick={() => setOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X size={10} /> Collapse
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QUOTES LIST
// ─────────────────────────────────────────────────────────────────────────────

interface QuotesListProps {
  quotes:     TransformedQuote[]
  onRefresh:  () => void
}

function QuotesList({ quotes, onRefresh }: QuotesListProps) {
  const [expandedId, setExpandedId]   = useState<string | null>(null)
  const [deleteId,   setDeleteId]     = useState<string | null>(null)
  const [isPending,  startTransition] = useTransition()

  const handleStatusChange = (quoteId: string, newStatus: QuoteStatus) => {
    startTransition(async () => {
      await updateQuoteStatus(quoteId, newStatus)
      onRefresh()
    })
  }

  if (!quotes.length) return (
    <p className="text-xs text-muted-foreground italic">No quotes yet</p>
  )

  return (
    <div className="space-y-2">
      {quotes.map(q => {
        const cfg = QUOTE_STATUS_CONFIG[q.status]
        const isExpanded = expandedId === q.id
        return (
          <div key={q.id}
            className={`rounded-xl border transition-colors ${isExpanded ? 'border-border/40 bg-card/50' : 'border-border/20 bg-card/20'}`}>
            {/* Quote header */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : q.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">${parseFloat(q.price).toLocaleString()} {q.currency}</span>
                  <span className="text-xs text-muted-foreground">Rev. {q.revision}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                  <span className="text-xs text-muted-foreground">
                    by {q.createdBy.fullName ?? q.createdBy.email}
                  </span>
                  {q.validUntil && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Clock size={9} /> Until {format(new Date(q.validUntil), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                {q.status === 'DRAFT' && (
                  <Button size="sm" variant="ghost"
                    onClick={() => handleStatusChange(q.id, 'SENT')}
                    className="h-7 text-xs text-violet-400 hover:bg-violet-500/10 gap-1 px-2">
                    <Send size={11} /> Send
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                      <ChevronDown size={13} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-border">
                    {q.status !== 'SENT' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(q.id, 'SENT')}
                        className="text-sm cursor-pointer gap-2">
                        <Send size={13} /> Mark Sent
                      </DropdownMenuItem>
                    )}
                    {q.status !== 'DRAFT' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(q.id, 'DRAFT')}
                        className="text-sm cursor-pointer gap-2">
                        <Edit3 size={13} /> Revert to Draft
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => setDeleteId(q.id)}
                      className="text-sm cursor-pointer gap-2 text-red-400 focus:text-red-400 focus:bg-red-500/10">
                      <Trash2 size={13} /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-border/20 pt-3 space-y-3">
                {q.adminNotes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                    <p className="text-xs text-foreground/80 leading-relaxed">{q.adminNotes}</p>
                  </div>
                )}

                {/* Files */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <FileText size={11} /> Attachments
                  </p>
                  <FileList files={q.files} canDelete />
                  <div className="mt-2">
                    <FileUploadZone quoteId={q.id}
                      onUploaded={() => onRefresh()} />
                  </div>
                </div>

                {/* Status history */}
                {q.statusHistory.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">History</p>
                    <div className="space-y-1">
                      {q.statusHistory.slice(0, 3).map(h => (
                        <div key={h.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock size={10} />
                          <span>{h.oldStatus} → {h.newStatus}</span>
                          <span>by {h.changedBy.fullName ?? h.changedBy.email}</span>
                          <span className="ml-auto">{format(new Date(h.changedAt), 'MMM d, h:mm a')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <ConfirmDialog
              open={deleteId === q.id}
              onOpenChange={open => !open && setDeleteId(null)}
              title="Delete quote?"
              description="This will permanently soft-delete this quote revision."
              onConfirm={() => {
                startTransition(async () => {
                  await deleteQuote(q.id)
                  setDeleteId(null)
                  onRefresh()
                })
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'quotes' | 'files' | 'history'

interface Props {
  requestId:        string
  onClose:          () => void
  onActionComplete: () => void
}

export function RequestDetailModal({ requestId, onClose, onActionComplete }: Props) {
  const [req,          setReq]          = useState<RequestWithRelations | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [tab,          setTab]          = useState<Tab>('overview')
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [aiEstimate,   setAiEstimate]   = useState<string | null>(null)
  const [aiNotes,      setAiNotes]      = useState<string | null>(null)

  const loadRequest = useCallback(async () => {
    const r = await getProductRequest(requestId)
    if (r.success) setReq(r.data as RequestWithRelations)
    setLoading(false)
  }, [requestId])

  useEffect(() => { loadRequest() }, [loadRequest])

  const handleRefresh = () => {
    loadRequest()
    onActionComplete()
  }

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <Loader2 size={24} className="animate-spin text-muted-foreground" />
    </div>
  )

  if (!req) return null

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'quotes',   label: 'Quotes',  count: req.quotes.length },
    { id: 'files',    label: 'Files',   count: req.files.length },
    { id: 'history',  label: 'History', count: req.statusHistory.length },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-6xl max-h-[90vh] rounded-2xl border border-border/10 bg-card shadow-2xl flex flex-col overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/10 shrink-0">
          <div className="flex items-center gap-3">
            <StatusBadge status={req.status} />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {req.client.fullName ?? req.client.email}
              </p>
              <p className="text-xs text-muted-foreground">
                #{req.id.slice(-8).toUpperCase()} · {format(new Date(req.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleRefresh}
              className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <RefreshCw size={15} />
            </Button>
            <Button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-6 border-b border-border/10 shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                tab === t.id
                  ? 'border-color text-color'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.id ? 'bg-color/15 text-color' : 'bg-muted/50 text-muted-foreground'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <>
              {/* Client info */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/10 border border-border/20">
                <Avatar className="w-10 h-10 border border-border/20">
                  <AvatarImage src={req.client.avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                    {req.client.fullName?.slice(0, 2).toUpperCase() ?? req.client.email.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{req.client.fullName ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{req.client.email}</p>
                  {req.client.phone && <p className="text-xs text-muted-foreground">{req.client.phone}</p>}
                </div>
              </div>

              {/* Request fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {req.description ?? <span className="italic text-muted-foreground">Not provided</span>}
                    </p>
                  </div>
                  {req.productLink && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Product Link</p>
                      <a href={req.productLink} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-color hover:underline flex items-center gap-1">
                        <ExternalLink size={12} />
                        {req.productLink.length > 40 ? req.productLink.slice(0, 40) + '…' : req.productLink}
                      </a>
                    </div>
                  )}
                  {req.customNotes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Client Notes</p>
                      <p className="text-sm text-foreground/80 leading-relaxed">{req.customNotes}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                    <p className="text-sm font-bold font-mono">{req.quantity.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Shipping Country</p>
                    <p className="text-sm">{req.shippingCountry}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Priority</p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12}
                          className={i < req.priority ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">{req.priority}/5</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Quote Generator */}
              <AIQuotePanel
                requestId={req.id}
                hasEstimate={!!req.aiEstimatedPrice}
                onGenerated={(estimate, notes) => {
                  setAiEstimate(estimate)
                  setAiNotes(notes)
                  setTab('quotes')
                  setShowQuoteForm(true)
                }}
              />
            </>
          )}

          {/* ── QUOTES ── */}
          {tab === 'quotes' && (
            <>
              <QuotesList quotes={req.quotes} onRefresh={handleRefresh} />

              {showQuoteForm ? (
                <CreateQuoteForm
                  requestId={req.id}
                  aiEstimate={aiEstimate ?? undefined}
                  onCreated={() => { setShowQuoteForm(false); handleRefresh() }}
                  onCancel={() => setShowQuoteForm(false)}
                />
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowQuoteForm(true)}
                  className="w-full h-9 text-sm border-dashed border-2 border-border/40 bg-transparent hover:bg-accent/5 text-muted-foreground hover:text-foreground gap-2"
                  variant="outline"
                >
                  <Plus size={14} /> Add Quote
                  {aiEstimate && (
                    <span className="flex items-center gap-1 text-amber-400 text-xs">
                      <Sparkles size={10} /> AI suggested ${parseFloat(aiEstimate).toLocaleString()}
                    </span>
                  )}
                </Button>
              )}
            </>
          )}

          {/* ── FILES ── */}
          {tab === 'files' && (
            <>
              <FileList
                files={req.files}
                canDelete
                onDelete={() => handleRefresh()}
              />
              <FileUploadZone
                requestId={req.id}
                onUploaded={() => handleRefresh()}
              />
            </>
          )}

          {/* ── HISTORY ── */}
          {tab === 'history' && (
            <div className="space-y-2">
              {req.statusHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No status changes yet</p>
              ) : (
                req.statusHistory.map((h, i) => (
                  <div key={h.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-2 h-2 rounded-full mt-0.5 ${i === 0 ? 'bg-color' : 'bg-border'}`} />
                      {i < req.statusHistory.length - 1 && <div className="w-px h-6 bg-border/30" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={h.oldStatus} />
                        <span className="text-xs text-muted-foreground">→</span>
                        <StatusBadge status={h.newStatus} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        by {h.changedBy.fullName ?? h.changedBy.email} · {format(new Date(h.changedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/10 shrink-0 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Updated {format(new Date(req.updatedAt), 'MMM d, yyyy h:mm a')}
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