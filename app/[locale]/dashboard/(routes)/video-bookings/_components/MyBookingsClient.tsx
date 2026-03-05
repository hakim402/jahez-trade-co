'use client'

import {
  useState, useEffect, useTransition, useCallback,
} from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  Plus, Loader2, Video, ExternalLink, Eye, CheckCircle, XCircle,
  MoreHorizontal, Calendar, Clock, ChevronRight, Crown, AlertTriangle,
} from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Badge }    from '@/components/ui/badge'
import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Pagination, PaginationContent, PaginationEllipsis,
  PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { BookingType, BookingStatus } from '@prisma/client'
import {
  getMyBookings, createBooking, confirmScheduledBooking, cancelMyBooking,
} from '../actions'
import {
  BOOKING_STATUS_CONFIG,
  type ClientBookingWithRelations,
  type PaginationInfo,
  type UserPlanInfo,
} from './types'

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function fmt(d: Date | string | null | undefined) {
  if (!d) return '—'
  return format(new Date(d), 'MMM d, yyyy')
}
function fmtTime(d: Date | string | null | undefined) {
  if (!d) return ''
  return format(new Date(d), 'h:mm a')
}
function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return '—'
  return format(new Date(d), 'MMM d, yyyy · h:mm a')
}

// ------------------------------------------------------------------
// Status badge
// ------------------------------------------------------------------
function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = BOOKING_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}

// ------------------------------------------------------------------
// Plan banner
// ------------------------------------------------------------------
function PlanBanner({ planInfo }: { planInfo: UserPlanInfo }) {
  const { planName, limit, usedCount, billingEnabled } = planInfo

  if (!billingEnabled) return null

  const isUnlimited = limit === Infinity
  const pct         = isUnlimited ? 0 : Math.min(100, (usedCount / limit) * 100)
  const isAtLimit   = !isUnlimited && usedCount >= limit
  const remaining   = isUnlimited ? '∞' : Math.max(0, limit - usedCount)

  return (
    <div className={`rounded-xl border p-4 ${isAtLimit ? 'border-amber-300 bg-amber-50' : 'border-border bg-card'}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Crown className={`h-4 w-4 shrink-0 ${isAtLimit ? 'text-amber-600' : 'text-muted-foreground'}`} />
          <div className="min-w-0">
            <p className={`text-sm font-medium ${isAtLimit ? 'text-amber-800' : ''}`}>
              {isUnlimited
                ? `${planName.charAt(0).toUpperCase() + planName.slice(1)} plan — unlimited bookings`
                : `${usedCount} / ${limit} video booking${limit === 1 ? '' : 's'} used`}
            </p>
            {isAtLimit && (
              <p className="text-xs text-amber-700 mt-0.5">
                You've reached your plan limit. Upgrade to request more calls.
              </p>
            )}
          </div>
        </div>
        {!isUnlimited && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex flex-col items-end">
              <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isAtLimit ? 'bg-amber-500' : 'bg-blue-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {remaining} remaining
              </p>
            </div>
            {isAtLimit && (
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1">
                <ChevronRight className="h-3 w-3" />
                Upgrade
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Status filter tabs
// ------------------------------------------------------------------
const STATUS_TABS: { id: BookingStatus | 'ALL'; label: string }[] = [
  { id: 'ALL',        label: 'All' },
  { id: 'REQUESTED',  label: 'Requested' },
  { id: 'PROPOSED',   label: 'Proposed' },
  { id: 'CONFIRMED',  label: 'Confirmed' },
  { id: 'COMPLETED',  label: 'Completed' },
  { id: 'CANCELED',   label: 'Cancelled' },
]

// ------------------------------------------------------------------
// Booking details drawer/dialog
// ------------------------------------------------------------------
function BookingDetailsDialog({
  booking, open, onOpenChange,
  onConfirm, onCancel,
}: {
  booking: ClientBookingWithRelations | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: (b: ClientBookingWithRelations) => void
  onCancel:  (b: ClientBookingWithRelations) => void
}) {
  const [tab, setTab] = useState<'overview' | 'scheduling' | 'history' | 'ai'>('overview')

  useEffect(() => { if (open) setTab('overview') }, [open])

  if (!booking) return null

  const cfg = BOOKING_STATUS_CONFIG[booking.status]
  const TABS = [
    { id: 'overview',   label: 'Overview' },
    { id: 'scheduling', label: 'Scheduling' },
    { id: 'history',    label: `History (${booking.statusHistory.length})` },
    ...(booking.aiSummary ? [{ id: 'ai', label: 'AI Summary' }] : []),
  ] as const

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-base font-semibold">
                {booking.type.charAt(0) + booking.type.slice(1).toLowerCase()} Video Call
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Requested {fmt(booking.createdAt)}
              </DialogDescription>
            </div>
            <StatusBadge status={booking.status} />
          </div>
        </DialogHeader>

        {/* Status context */}
        <div className={`mx-5 rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed ${cfg.borderColor}`}>
          {cfg.description}
          {booking.status === 'PROPOSED' && (
            <div className="flex gap-2 mt-2.5">
              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => onConfirm(booking)}>
                <CheckCircle className="h-3 w-3" /> Confirm
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => onCancel(booking)}>
                <XCircle className="h-3 w-3" /> Cancel
              </Button>
            </div>
          )}
          {(booking.status === 'REQUESTED') && (
            <div className="flex gap-2 mt-2.5">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => onCancel(booking)}>
                <XCircle className="h-3 w-3" /> Cancel Request
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-5 border-b border-border/10 shrink-0 mt-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-sm">

          {/* --- OVERVIEW --- */}
          {tab === 'overview' && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Call Type</p>
                <p className="font-medium">{booking.type.charAt(0) + booking.type.slice(1).toLowerCase()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-medium">{booking.durationMinutes} min</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="mt-0.5 whitespace-pre-wrap leading-relaxed text-foreground/80">
                  {booking.requestNotes || <span className="italic text-muted-foreground">No notes provided</span>}
                </p>
              </div>
              {booking.clientConfirmedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Confirmed At</p>
                  <p className="font-medium">{fmtDateTime(booking.clientConfirmedAt)}</p>
                </div>
              )}
            </div>
          )}

          {/* --- SCHEDULING --- */}
          {tab === 'scheduling' && (
            <div className="space-y-4">
              {booking.scheduledAt ? (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{fmt(booking.scheduledAt)}</p>
                    <span className="text-muted-foreground">·</span>
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-muted-foreground">{fmtTime(booking.scheduledAt)}</p>
                  </div>
                  {booking.meetingProvider && (
                    <p className="text-xs text-muted-foreground mb-2">
                      via {booking.meetingProvider.charAt(0) + booking.meetingProvider.slice(1).toLowerCase().replace('_', ' ')}
                    </p>
                  )}
                  {booking.meetingLink && (
                    <a
                      href={booking.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-sm"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Join Meeting
                    </a>
                  )}
                  {booking.meetingPassword && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Password: <span className="font-mono">{booking.meetingPassword}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No time scheduled yet.</p>
                  <p className="text-xs mt-1">Our team will propose a time soon.</p>
                </div>
              )}
            </div>
          )}

          {/* --- HISTORY --- */}
          {tab === 'history' && (
            <ul className="space-y-0">
              {booking.statusHistory.length === 0 ? (
                <p className="text-muted-foreground text-sm">No history yet.</p>
              ) : (
                booking.statusHistory.map((entry, i) => (
                  <li key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                      {i < booking.statusHistory.length - 1 && (
                        <div className="w-px flex-1 bg-border/50 my-1" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm">
                        <span className="font-medium">
                          {BOOKING_STATUS_CONFIG[entry.oldStatus].label}
                        </span>
                        {' → '}
                        <span className="font-medium">
                          {BOOKING_STATUS_CONFIG[entry.newStatus].label}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        by {entry.changedBy.fullName ?? entry.changedBy.email} · {fmtDateTime(entry.changedAt)}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}

          {/* --- AI SUMMARY --- */}
          {tab === 'ai' && (
            <div className="space-y-3">
              {booking.aiSummary && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">AI Summary</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{booking.aiSummary}</p>
                </div>
              )}
              {booking.transcriptUrl && (
                <a
                  href={booking.transcriptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Full Transcript
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/10 shrink-0 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            ID: <span className="font-mono">{booking.id.slice(0, 8)}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}
            className="text-sm text-muted-foreground hover:text-foreground">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------------
// Create booking dialog
// ------------------------------------------------------------------
const bookingFormSchema = z.object({
  type:            z.nativeEnum(BookingType).default('CUSTOM'),
  requestNotes:    z.string().max(2000).optional(),
  durationMinutes: z.coerce.number().int().positive().default(30),
  preferredTime:   z.date().optional(),
})

type BookingFormValues = {
  type:            BookingType
  requestNotes?:   string
  durationMinutes: number
  preferredTime?:  Date
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90] as const

function CreateBookingDialog({
  open, onOpenChange, onSuccess, planInfo,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
  planInfo: UserPlanInfo
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      type:            'CUSTOM',
      requestNotes:    '',
      durationMinutes: 30,
      preferredTime:   undefined,
    },
  })

  const handleClose = () => {
    form.reset()
    setError(null)
    onOpenChange(false)
  }

  const onSubmit = (data: BookingFormValues) => {
    setError(null)
    startTransition(async () => {
      const result = await createBooking(data)
      if (result.success) {
        toast.success('Booking requested', {
          description: 'Your video call request has been submitted.',
        })
        handleClose()
        onSuccess()
      } else {
        if (result.error?.startsWith('UPGRADE_REQUIRED')) {
          setError(result.error.replace('UPGRADE_REQUIRED: ', ''))
        } else {
          toast.error('Failed to submit', { description: result.error })
        }
      }
    })
  }

  const isAtLimit = planInfo.billingEnabled && planInfo.limit !== Infinity && planInfo.usedCount >= planInfo.limit

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Request Video Call
          </DialogTitle>
          <DialogDescription>
            Tell us what you'd like to discuss and your preferred time.
          </DialogDescription>
        </DialogHeader>

        {/* Upgrade required gate */}
        {isAtLimit && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 flex gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Plan limit reached</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Your {planInfo.planName} plan allows {planInfo.limit} booking{planInfo.limit === 1 ? '' : 's'}.
                Please upgrade to request more video calls.
              </p>
              <Button size="sm" className="mt-2 h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white">
                Upgrade Plan
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Call type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Call Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(BookingType).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.charAt(0) + t.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Duration */}
            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(parseInt(v))}
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DURATION_OPTIONS.map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {d} minutes
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preferred time */}
            <FormField
              control={form.control}
              name="preferredTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Time <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      onChange={(e) => {
                        field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                      }}
                      value={field.value ? field.value.toISOString().slice(0, 16) : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="requestNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What would you like to discuss? Any specific questions or goals?"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || isAtLimit} className="gap-2">
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Submit Request
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------------
// Confirm / Cancel alert dialogs
// ------------------------------------------------------------------
function ConfirmBookingDialog({
  booking, open, onOpenChange, onSuccess,
}: {
  booking: ClientBookingWithRelations | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!booking) return
    setLoading(true)
    const r = await confirmScheduledBooking({ bookingId: booking.id })
    setLoading(false)
    if (r.success) {
      toast.success('Booking confirmed', { description: 'Your video call is confirmed.' })
      onOpenChange(false)
      onSuccess()
    } else {
      toast.error('Error', { description: r.error })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Video Call</AlertDialogTitle>
          <AlertDialogDescription>
            {booking?.scheduledAt
              ? `Confirm your video call on ${fmtDateTime(booking.scheduledAt)}?`
              : 'Are you sure you want to confirm this video call?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Back</AlertDialogCancel>
          <AlertDialogAction onClick={handle} disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Yes, Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function CancelBookingDialog({
  booking, open, onOpenChange, onSuccess,
}: {
  booking: ClientBookingWithRelations | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!booking) return
    setLoading(true)
    const r = await cancelMyBooking({ bookingId: booking.id })
    setLoading(false)
    if (r.success) {
      toast.success('Booking cancelled')
      onOpenChange(false)
      onSuccess()
    } else {
      toast.error('Error', { description: r.error })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this booking? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>No, keep it</AlertDialogCancel>
          <AlertDialogAction
            onClick={handle}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90 gap-2"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Yes, Cancel
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ------------------------------------------------------------------
// Pagination helper
// ------------------------------------------------------------------
function BookingPagination({ pagination }: { pagination: PaginationInfo }) {
  const router     = useRouter()
  const pathname   = usePathname()
  const params     = useSearchParams()
  const { page, totalPages } = pagination

  const go = (n: number) => {
    const p = new URLSearchParams(params)
    p.set('page', String(n))
    router.push(`${pathname}?${p.toString()}`)
  }

  if (totalPages <= 1) return null

  const pages: (number | 'ellipsis')[] = []
  const delta = 1
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (page > 1) go(page - 1) }}
            className={page <= 1 ? 'pointer-events-none opacity-50' : ''} />
        </PaginationItem>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <PaginationEllipsis key={`e-${i}`} />
          ) : (
            <PaginationItem key={p}>
              <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); go(p) }}>
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        <PaginationItem>
          <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (page < totalPages) go(page + 1) }}
            className={page >= totalPages ? 'pointer-events-none opacity-50' : ''} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

// ------------------------------------------------------------------
// Root client component
// ------------------------------------------------------------------
interface MyBookingsClientProps {
  initialBookings:   ClientBookingWithRelations[]
  initialPagination: PaginationInfo
  initialPlanInfo:   UserPlanInfo
  initialStatus:     BookingStatus | null
  initialPage:       number
}

export function MyBookingsClient({
  initialBookings,
  initialPagination,
  initialPlanInfo,
  initialStatus,
  initialPage,
}: MyBookingsClientProps) {
  const searchParams = useSearchParams()
  const activeStatus = searchParams.get('status') as BookingStatus | null
  const activePage   = parseInt(searchParams.get('page') || '1')

  const [bookings,   setBookings]   = useState(initialBookings)
  const [pagination, setPagination] = useState(initialPagination)
  const [loading,    setLoading]    = useState(false)

  // Dialog states
  const [isCreateOpen,  setIsCreateOpen]  = useState(false)
  const [detailBooking, setDetailBooking] = useState<ClientBookingWithRelations | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<ClientBookingWithRelations | null>(null)
  const [cancelTarget,  setCancelTarget]  = useState<ClientBookingWithRelations | null>(null)

  const fetchPage = useCallback(async () => {
    setLoading(true)
    const result = await getMyBookings({
      page:     activePage,
      pageSize: initialPagination.pageSize,
      status:   activeStatus ?? undefined,
    })
    if (result.success) {
      setBookings(result.data.bookings as ClientBookingWithRelations[])
      setPagination(result.data.pagination)
    }
    setLoading(false)
  }, [activePage, activeStatus, initialPagination.pageSize])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      const result = await getMyBookings({
        page:     activePage,
        pageSize: initialPagination.pageSize,
        status:   activeStatus ?? undefined,
      })
      if (!cancelled && result.success) {
        setBookings(result.data.bookings as ClientBookingWithRelations[])
        setPagination(result.data.pagination)
      }
      if (!cancelled) setLoading(false)
    }
    // Skip on very first render (use SSR data)
    if (activePage !== initialPage || activeStatus !== initialStatus) {
      run()
    }
    return () => { cancelled = true }
  }, [activePage, activeStatus]) // eslint-disable-line

  const handleActionComplete = () => fetchPage()

  // Count pending actions (PROPOSED) for badge
  const pendingCount = bookings.filter((b) => b.status === 'PROPOSED').length

  return (
    <div className="space-y-4">
      {/* Plan banner */}
      <PlanBanner planInfo={initialPlanInfo} />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">
          Your Bookings
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 text-xs font-medium">
              {pendingCount} action required
            </span>
          )}
        </h2>
        <Button
          onClick={() => setIsCreateOpen(true)}
          disabled={initialPlanInfo.billingEnabled && initialPlanInfo.limit !== Infinity && initialPlanInfo.usedCount >= initialPlanInfo.limit}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Request Call
        </Button>
      </div>

      {/* Status tabs */}
      <StatusFilterTabs activeStatus={activeStatus} />

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {bookings.length === 0 ? (
          <div className="py-16 text-center">
            <Video className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">No bookings found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeStatus ? 'Try a different filter.' : 'Request your first video call to get started.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">Scheduled</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Duration</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Created</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => setDetailBooking(booking)}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">
                      {booking.type.charAt(0) + booking.type.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                    {booking.scheduledAt ? fmtDateTime(booking.scheduledAt) : '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {booking.durationMinutes} min
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {fmt(booking.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetailBooking(booking)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        {booking.status === 'PROPOSED' && (
                          <DropdownMenuItem onClick={() => setConfirmTarget(booking)}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Confirm
                          </DropdownMenuItem>
                        )}
                        {(booking.status === 'REQUESTED' || booking.status === 'PROPOSED') && (
                          <DropdownMenuItem
                            onClick={() => setCancelTarget(booking)}
                            className="text-destructive focus:text-destructive"
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Cancel
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <BookingPagination pagination={pagination} />

      {/* Dialogs */}
      <BookingDetailsDialog
        booking={detailBooking}
        open={!!detailBooking}
        onOpenChange={(v) => { if (!v) setDetailBooking(null) }}
        onConfirm={(b) => { setDetailBooking(null); setConfirmTarget(b) }}
        onCancel={(b)  => { setDetailBooking(null); setCancelTarget(b) }}
      />

      <CreateBookingDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleActionComplete}
        planInfo={initialPlanInfo}
      />

      <ConfirmBookingDialog
        booking={confirmTarget}
        open={!!confirmTarget}
        onOpenChange={(v) => { if (!v) setConfirmTarget(null) }}
        onSuccess={handleActionComplete}
      />

      <CancelBookingDialog
        booking={cancelTarget}
        open={!!cancelTarget}
        onOpenChange={(v) => { if (!v) setCancelTarget(null) }}
        onSuccess={handleActionComplete}
      />
    </div>
  )
}

// ------------------------------------------------------------------
// Status filter tabs — separate component to use useSearchParams cleanly
// ------------------------------------------------------------------
function StatusFilterTabs({ activeStatus }: { activeStatus: BookingStatus | null }) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

  const go = (status: BookingStatus | 'ALL') => {
    const p = new URLSearchParams(params)
    if (status === 'ALL') {
      p.delete('status')
    } else {
      p.set('status', status)
    }
    p.delete('page')
    router.push(`${pathname}?${p.toString()}`)
  }

  const active = activeStatus ?? 'ALL'

  return (
    <div className="flex gap-0 border-b border-border/50 overflow-x-auto scrollbar-none">
      {STATUS_TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => go(t.id)}
          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            active === t.id
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}