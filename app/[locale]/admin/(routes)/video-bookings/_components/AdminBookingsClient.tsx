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
  Plus, Loader2, Video, ExternalLink, Eye, CheckSquare, XCircle,
  MoreHorizontal, Calendar, Clock, Search, X, CalendarDays,
  Trash2, ToggleLeft, ToggleRight, UserX, ClipboardCheck,
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Pagination, PaginationContent, PaginationEllipsis,
  PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { BookingStatus, MeetingProvider } from '@prisma/client'
import {
  getAllBookings, getAvailableSlots, getAllSlots,
  scheduleBooking, completeBooking, cancelBookingByAdmin,
  markNoShow, createSlot, deleteSlot, toggleSlotActive,
} from '../actions'
import {
  BOOKING_STATUS_CONFIG,
  type BookingWithRelations,
  type SlotWithBooking,
  type PaginationInfo,
} from './types'

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function fmt(d: Date | string | null | undefined) {
  if (!d) return '—'
  return format(new Date(d), 'MMM d, yyyy')
}
function fmtDT(d: Date | string | null | undefined) {
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
// Status filter tabs
// ------------------------------------------------------------------
const STATUS_TABS: { id: BookingStatus | 'ALL'; label: string }[] = [
  { id: 'ALL',       label: 'All' },
  { id: 'REQUESTED', label: 'Requested' },
  { id: 'PROPOSED',  label: 'Proposed' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELED',  label: 'Cancelled' },
  { id: 'NO_SHOW',   label: 'No Show' },
]

function StatusFilterTabs({ activeStatus }: { activeStatus: BookingStatus | null }) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

  const go = (status: BookingStatus | 'ALL') => {
    const p = new URLSearchParams(params)
    if (status === 'ALL') p.delete('status')
    else p.set('status', status)
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

// ------------------------------------------------------------------
// Booking details dialog — 4 tabs
// ------------------------------------------------------------------
function BookingDetailsDialog({
  booking, open, onOpenChange, onAction,
}: {
  booking:       BookingWithRelations | null
  open:          boolean
  onOpenChange:  (v: boolean) => void
  onAction:      (action: 'schedule' | 'complete' | 'cancel' | 'noshow', b: BookingWithRelations) => void
}) {
  const [tab, setTab] = useState<'overview' | 'scheduling' | 'history' | 'ai'>('overview')
  useEffect(() => { if (open) setTab('overview') }, [open])

  if (!booking) return null

  const cfg = BOOKING_STATUS_CONFIG[booking.status]

  const TABS = [
    { id: 'overview',   label: 'Overview' },
    { id: 'scheduling', label: 'Scheduling' },
    { id: 'history',    label: `History (${booking.statusHistory.length})` },
    ...(booking.aiSummary || booking.transcriptUrl ? [{ id: 'ai', label: 'AI Data' }] : []),
  ] as const

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-base font-semibold">
                {booking.client.fullName ?? booking.client.email}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {booking.type} call · {booking.durationMinutes} min · Requested {fmt(booking.createdAt)}
              </DialogDescription>
            </div>
            <StatusBadge status={booking.status} />
          </div>
        </DialogHeader>

        {/* Status context + quick actions */}
        <div className={`mx-5 rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed ${cfg.borderColor}`}>
          {cfg.description}
          <div className="flex flex-wrap gap-2 mt-2.5">
            {booking.status === 'REQUESTED' && (
              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => onAction('schedule', booking)}>
                <Calendar className="h-3 w-3" /> Schedule
              </Button>
            )}
            {(booking.status === 'PROPOSED' || booking.status === 'CONFIRMED') && (
              <>
                <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => onAction('complete', booking)}>
                  <ClipboardCheck className="h-3 w-3" /> Complete
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-orange-600 border-orange-300 hover:bg-orange-50"
                  onClick={() => onAction('noshow', booking)}>
                  <UserX className="h-3 w-3" /> No Show
                </Button>
              </>
            )}
            {!['COMPLETED', 'CANCELED', 'NO_SHOW'].includes(booking.status) && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => onAction('cancel', booking)}>
                <XCircle className="h-3 w-3" /> Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-5 border-b border-border/10 shrink-0 mt-3">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-sm">
          {tab === 'overview' && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Client</p>
                <p className="font-medium">{booking.client.fullName ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{booking.client.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-medium">{booking.durationMinutes} min</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Request Notes</p>
                <p className="mt-0.5 whitespace-pre-wrap leading-relaxed text-foreground/80">
                  {booking.requestNotes ?? <span className="italic text-muted-foreground">None</span>}
                </p>
              </div>
              {booking.clientConfirmedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Client Confirmed At</p>
                  <p className="font-medium">{fmtDT(booking.clientConfirmedAt)}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'scheduling' && (
            <div className="space-y-4">
              {booking.scheduledAt ? (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{fmtDT(booking.scheduledAt)}</p>
                  </div>
                  {booking.meetingProvider && (
                    <p className="text-xs text-muted-foreground">
                      via {booking.meetingProvider.replace('_', ' ')}
                    </p>
                  )}
                  {booking.meetingLink && (
                    <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-sm">
                      <ExternalLink className="h-3.5 w-3.5" /> Join Meeting
                    </a>
                  )}
                  {booking.meetingPassword && (
                    <p className="text-xs text-muted-foreground">
                      Password: <span className="font-mono">{booking.meetingPassword}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No time scheduled yet.</p>
                  {booking.status === 'REQUESTED' && (
                    <Button size="sm" className="mt-3 gap-1" onClick={() => onAction('schedule', booking)}>
                      <Calendar className="h-3.5 w-3.5" /> Schedule Now
                    </Button>
                  )}
                </div>
              )}
              {booking.slot && (
                <div className="rounded-lg border bg-muted/20 p-3 text-xs">
                  <p className="font-medium text-muted-foreground mb-1">Assigned Slot</p>
                  <p>{fmtDT(booking.slot.startTime)} — {format(new Date(booking.slot.endTime), 'h:mm a')}</p>
                  <p className="text-muted-foreground">{booking.slot.durationMinutes} min</p>
                </div>
              )}
            </div>
          )}

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
                      <p className="text-sm font-medium">
                        {BOOKING_STATUS_CONFIG[entry.oldStatus].label} → {BOOKING_STATUS_CONFIG[entry.newStatus].label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        by {entry.changedBy.fullName ?? entry.changedBy.email} · {fmtDT(entry.changedAt)}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}

          {tab === 'ai' && (
            <div className="space-y-3">
              {booking.aiSummary && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">AI Summary</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{booking.aiSummary}</p>
                </div>
              )}
              {booking.transcriptUrl && (
                <a href={booking.transcriptUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm">
                  <ExternalLink className="h-3.5 w-3.5" /> View Transcript
                </a>
              )}
              {!booking.aiSummary && !booking.transcriptUrl && (
                <p className="text-sm text-muted-foreground">No AI data available yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border/10 shrink-0 flex justify-between items-center">
          <span className="text-xs text-muted-foreground font-mono">{booking.id.slice(0, 8)}</span>
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
// Schedule dialog — assign slot + meeting link
// ------------------------------------------------------------------
const scheduleSchema = z.object({
  slotId:          z.string().min(1, 'Please select a slot'),
  meetingLink:     z.string().url('Must be a valid URL'),
  meetingPassword: z.string().optional(),
  meetingProvider: z.nativeEnum(MeetingProvider).optional(),
})
type ScheduleValues = z.infer<typeof scheduleSchema>

function ScheduleDialog({
  booking, open, onOpenChange, onSuccess,
}: {
  booking:      BookingWithRelations | null
  open:         boolean
  onOpenChange: (v: boolean) => void
  onSuccess:    () => void
}) {
  const [slots, setSlots] = useState<{ id: string; startTime: Date; endTime: Date; durationMinutes: number }[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<ScheduleValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { slotId: '', meetingLink: '', meetingPassword: '', meetingProvider: undefined },
  })

  useEffect(() => {
    if (open) {
      setLoadingSlots(true)
      getAvailableSlots().then((r) => {
        if (r.success) setSlots(r.data as any)
        setLoadingSlots(false)
      })
      form.reset()
    }
  }, [open, form])

  const onSubmit = (data: ScheduleValues) => {
    if (!booking) return
    startTransition(async () => {
      const r = await scheduleBooking({
        bookingId:       booking.id,
        slotId:          data.slotId,
        meetingLink:     data.meetingLink,
        meetingPassword: data.meetingPassword,
        meetingProvider: data.meetingProvider,
      })
      if (r.success) {
        toast.success('Booking scheduled', { description: 'Client has been notified.' })
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error('Failed', { description: r.error })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Schedule Video Call
          </DialogTitle>
          <DialogDescription>
            {booking ? `Scheduling for ${booking.client.fullName ?? booking.client.email}` : ''}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Slot */}
            <FormField control={form.control} name="slotId" render={({ field }) => (
              <FormItem>
                <FormLabel>Availability Slot</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingSlots ? 'Loading slots…' : 'Select a slot'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {slots.length === 0 && !loadingSlots && (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        No available slots. Create one first.
                      </div>
                    )}
                    {slots.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {format(new Date(s.startTime), 'EEE MMM d, h:mm a')} — {format(new Date(s.endTime), 'h:mm a')} ({s.durationMinutes} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Meeting provider */}
            <FormField control={form.control} name="meetingProvider" render={({ field }) => (
              <FormItem>
                <FormLabel>Platform <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(MeetingProvider).map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Meeting link */}
            <FormField control={form.control} name="meetingLink" render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting Link</FormLabel>
                <FormControl>
                  <Input placeholder="https://zoom.us/j/..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Password */}
            <FormField control={form.control} name="meetingPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>Password <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl>
                  <Input placeholder="Meeting password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || loadingSlots} className="gap-2">
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Schedule
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------------
// Complete dialog
// ------------------------------------------------------------------
const completeSchema = z.object({
  transcriptUrl: z.string().url().optional().or(z.literal('')),
  aiSummary:     z.string().optional(),
})
type CompleteValues = z.infer<typeof completeSchema>

function CompleteDialog({
  booking, open, onOpenChange, onSuccess,
}: {
  booking: BookingWithRelations | null; open: boolean
  onOpenChange: (v: boolean) => void; onSuccess: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const form = useForm<CompleteValues>({
    resolver: zodResolver(completeSchema),
    defaultValues: { transcriptUrl: '', aiSummary: '' },
  })

  useEffect(() => { if (open) form.reset() }, [open, form])

  const onSubmit = (data: CompleteValues) => {
    if (!booking) return
    startTransition(async () => {
      const r = await completeBooking({
        bookingId:    booking.id,
        transcriptUrl: data.transcriptUrl || undefined,
        aiSummary:    data.aiSummary || undefined,
      })
      if (r.success) {
        toast.success('Booking completed')
        onOpenChange(false); onSuccess()
      } else {
        toast.error('Failed', { description: r.error })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" /> Mark as Completed
          </DialogTitle>
          <DialogDescription>Optionally add transcript and AI summary.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="transcriptUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>Transcript URL <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="aiSummary" render={({ field }) => (
              <FormItem>
                <FormLabel>AI Summary <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl>
                  <Textarea placeholder="Summary of the call…" rows={4} className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Back</Button>
              <Button type="submit" disabled={isPending} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Mark Completed
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------------
// Cancel dialog
// ------------------------------------------------------------------
function CancelBookingDialog({
  booking, open, onOpenChange, onSuccess,
}: {
  booking: BookingWithRelations | null; open: boolean
  onOpenChange: (v: boolean) => void; onSuccess: () => void
}) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!booking) return
    setLoading(true)
    const r = await cancelBookingByAdmin({ bookingId: booking.id, reason: reason || undefined })
    setLoading(false)
    if (r.success) {
      toast.success('Booking cancelled')
      onOpenChange(false); setReason(''); onSuccess()
    } else {
      toast.error('Failed', { description: r.error })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
          <AlertDialogDescription>
            The client will be notified. Optionally provide a reason.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="resize-none mt-2"
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Back</AlertDialogCancel>
          <AlertDialogAction onClick={handle} disabled={loading}
            className="bg-destructive hover:bg-destructive/90 gap-2">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Cancel Booking
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ------------------------------------------------------------------
// No-show dialog
// ------------------------------------------------------------------
function NoShowDialog({
  booking, open, onOpenChange, onSuccess,
}: {
  booking: BookingWithRelations | null; open: boolean
  onOpenChange: (v: boolean) => void; onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!booking) return
    setLoading(true)
    const r = await markNoShow({ bookingId: booking.id })
    setLoading(false)
    if (r.success) {
      toast.success('Marked as no-show')
      onOpenChange(false); onSuccess()
    } else {
      toast.error('Failed', { description: r.error })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark as No Show</AlertDialogTitle>
          <AlertDialogDescription>
            Mark this booking as a client no-show? The client will be notified.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Back</AlertDialogCancel>
          <AlertDialogAction onClick={handle} disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Mark No Show
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ------------------------------------------------------------------
// Slot manager
// ------------------------------------------------------------------
const slotSchema = z.object({
  startTime:       z.string().min(1, 'Required'),
  endTime:         z.string().min(1, 'Required'),
  durationMinutes: z.coerce.number().int().positive().default(30),
})
type SlotFormValues = { startTime: string; endTime: string; durationMinutes: number }

function SlotManager({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [slots, setSlots] = useState<SlotWithBooking[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isPending, startTransition] = useTransition()

  const form = useForm<SlotFormValues>({
    defaultValues: { startTime: '', endTime: '', durationMinutes: 30 },
  })

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    const r = await getAllSlots(p, 10)
    if (r.success) {
      setSlots(r.data.slots as SlotWithBooking[])
      setTotalPages(r.data.pagination.totalPages)
      setPage(p)
    }
    setLoading(false)
  }, [])

  useEffect(() => { if (open) load(1) }, [open, load])

  const onSubmit = (data: SlotFormValues) => {
    startTransition(async () => {
      const start = new Date(data.startTime)
      const end   = new Date(data.endTime)
      const r = await createSlot({ startTime: start, endTime: end, durationMinutes: data.durationMinutes })
      if (r.success) {
        toast.success('Slot created')
        form.reset()
        load(1)
      } else {
        toast.error('Failed', { description: r.error })
      }
    })
  }

  const handleDelete = (slotId: string) => {
    startTransition(async () => {
      const r = await deleteSlot({ slotId })
      if (r.success) { toast.success('Slot deleted'); load(page) }
      else toast.error('Failed', { description: r.error })
    })
  }

  const handleToggle = (slotId: string, isActive: boolean) => {
    startTransition(async () => {
      const r = await toggleSlotActive({ slotId, isActive })
      if (r.success) load(page)
      else toast.error('Failed', { description: r.error })
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Availability Slots
          </DialogTitle>
          <DialogDescription>Create and manage time slots that can be assigned to bookings.</DialogDescription>
        </DialogHeader>

        {/* Create form */}
        <div className="px-5 pb-4 border-b shrink-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Add New Slot</p>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Time</label>
              <Input type="datetime-local" {...form.register('startTime')} className="text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End Time</label>
              <Input type="datetime-local" {...form.register('endTime')} className="text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Duration (min)</label>
              <div className="flex gap-2">
                <Input type="number" {...form.register('durationMinutes')} className="text-sm" min="5" />
                <Button type="submit" disabled={isPending} className="gap-1 shrink-0">
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Slots list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 relative">
          {loading && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {slots.length === 0 && !loading ? (
            <div className="py-8 text-center text-muted-foreground">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No slots yet. Create one above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => (
                <div key={slot.id}
                  className={`rounded-lg border p-3 flex items-center justify-between gap-3 ${
                    !slot.isActive ? 'opacity-50' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {format(new Date(slot.startTime), 'EEE, MMM d · h:mm a')} — {format(new Date(slot.endTime), 'h:mm a')}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{slot.durationMinutes} min</span>
                      {slot.booking ? (
                        <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                          Booked
                        </span>
                      ) : slot.isActive ? (
                        <span className="text-xs bg-green-100 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
                          Available
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={slot.isActive}
                      disabled={!!slot.booking || isPending}
                      onCheckedChange={(v) => handleToggle(slot.id, v)}
                    />
                    {!slot.booking && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(slot.id)} disabled={isPending}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t shrink-0 flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground self-center">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>
              Next
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------------
// Pagination
// ------------------------------------------------------------------
function BookingPagination({ pagination }: { pagination: PaginationInfo }) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()
  const { page, totalPages } = pagination

  const go = (n: number) => {
    const p = new URLSearchParams(params)
    p.set('page', String(n))
    router.push(`${pathname}?${p.toString()}`)
  }

  if (totalPages <= 1) return null

  const pages: (number | 'ellipsis')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i)
    else if (pages[pages.length - 1] !== 'ellipsis') pages.push('ellipsis')
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
            <PaginationEllipsis key={`e${i}`} />
          ) : (
            <PaginationItem key={p}>
              <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); go(p) }}>{p}</PaginationLink>
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
interface AdminBookingsClientProps {
  initialBookings:   BookingWithRelations[]
  initialPagination: PaginationInfo
  initialStatus:     BookingStatus | null
  initialEmail:      string
  initialPage:       number
}

export function AdminBookingsClient({
  initialBookings,
  initialPagination,
  initialStatus,
  initialEmail,
  initialPage,
}: AdminBookingsClientProps) {
  const searchParams = useSearchParams()
  const activeStatus = searchParams.get('status') as BookingStatus | null
  const activePage   = parseInt(searchParams.get('page') || '1')

  const [bookings,   setBookings]   = useState(initialBookings)
  const [pagination, setPagination] = useState(initialPagination)
  const [loading,    setLoading]    = useState(false)
  const [emailFilter, setEmailFilter] = useState(initialEmail)

  // Dialog states
  const [detailBooking,  setDetailBooking]  = useState<BookingWithRelations | null>(null)
  const [scheduleTarget, setScheduleTarget] = useState<BookingWithRelations | null>(null)
  const [completeTarget, setCompleteTarget] = useState<BookingWithRelations | null>(null)
  const [cancelTarget,   setCancelTarget]   = useState<BookingWithRelations | null>(null)
  const [noshowTarget,   setNoshowTarget]   = useState<BookingWithRelations | null>(null)
  const [slotsOpen,      setSlotsOpen]      = useState(false)

  const fetchPage = useCallback(async () => {
    setLoading(true)
    const r = await getAllBookings({
      page:        activePage,
      pageSize:    20,
      status:      activeStatus ?? undefined,
      clientEmail: emailFilter || undefined,
    })
    if (r.success) {
      setBookings(r.data.bookings as BookingWithRelations[])
      setPagination(r.data.pagination)
    }
    setLoading(false)
  }, [activePage, activeStatus, emailFilter])

  useEffect(() => {
    let cancelled = false
    if (activePage !== initialPage || activeStatus !== initialStatus) {
      setLoading(true)
      getAllBookings({ page: activePage, pageSize: 20, status: activeStatus ?? undefined, clientEmail: emailFilter || undefined })
        .then((r) => {
          if (!cancelled && r.success) {
            setBookings(r.data.bookings as BookingWithRelations[])
            setPagination(r.data.pagination)
          }
          if (!cancelled) setLoading(false)
        })
    }
    return () => { cancelled = true }
  }, [activePage, activeStatus]) // eslint-disable-line

  const handleAction = (action: 'schedule' | 'complete' | 'cancel' | 'noshow', b: BookingWithRelations) => {
    setDetailBooking(null)
    setTimeout(() => {
      if (action === 'schedule') setScheduleTarget(b)
      if (action === 'complete') setCompleteTarget(b)
      if (action === 'cancel')   setCancelTarget(b)
      if (action === 'noshow')   setNoshowTarget(b)
    }, 100)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by client email…"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') fetchPage() }}
            className="pl-9 h-9 w-64 text-sm"
          />
          {emailFilter && (
            <Button onClick={() => { setEmailFilter(''); fetchPage() }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setSlotsOpen(true)}>
            <CalendarDays className="h-3.5 w-3.5" />
            Manage Slots
          </Button>
          <Button size="sm" className="gap-2" onClick={fetchPage}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Refresh
          </Button>
        </div>
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
              {activeStatus ? 'Try a different status filter.' : 'No video bookings yet.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {['Client', 'Type', 'Status', 'Scheduled', 'Duration', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {bookings.map((booking) => (
                <tr key={booking.id}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => setDetailBooking(booking)}>
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-35">
                      {booking.client.fullName ?? booking.client.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-35">
                      {booking.client.fullName ? booking.client.email : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {booking.type.charAt(0) + booking.type.slice(1).toLowerCase()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {booking.scheduledAt ? fmtDT(booking.scheduledAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {booking.durationMinutes}m
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
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
                        {booking.status === 'REQUESTED' && (
                          <DropdownMenuItem onClick={() => handleAction('schedule', booking)}>
                            <Calendar className="mr-2 h-4 w-4 text-blue-600" /> Schedule
                          </DropdownMenuItem>
                        )}
                        {(booking.status === 'PROPOSED' || booking.status === 'CONFIRMED') && (
                          <>
                            <DropdownMenuItem onClick={() => handleAction('complete', booking)}>
                              <ClipboardCheck className="mr-2 h-4 w-4 text-emerald-600" /> Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('noshow', booking)}>
                              <UserX className="mr-2 h-4 w-4 text-orange-600" /> No Show
                            </DropdownMenuItem>
                          </>
                        )}
                        {!['COMPLETED', 'CANCELED', 'NO_SHOW'].includes(booking.status) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleAction('cancel', booking)}
                              className="text-destructive focus:text-destructive">
                              <XCircle className="mr-2 h-4 w-4" /> Cancel
                            </DropdownMenuItem>
                          </>
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
        onAction={handleAction}
      />
      <ScheduleDialog
        booking={scheduleTarget}
        open={!!scheduleTarget}
        onOpenChange={(v) => { if (!v) setScheduleTarget(null) }}
        onSuccess={fetchPage}
      />
      <CompleteDialog
        booking={completeTarget}
        open={!!completeTarget}
        onOpenChange={(v) => { if (!v) setCompleteTarget(null) }}
        onSuccess={fetchPage}
      />
      <CancelBookingDialog
        booking={cancelTarget}
        open={!!cancelTarget}
        onOpenChange={(v) => { if (!v) setCancelTarget(null) }}
        onSuccess={fetchPage}
      />
      <NoShowDialog
        booking={noshowTarget}
        open={!!noshowTarget}
        onOpenChange={(v) => { if (!v) setNoshowTarget(null) }}
        onSuccess={fetchPage}
      />
      <SlotManager open={slotsOpen} onOpenChange={setSlotsOpen} />
    </div>
  )
}