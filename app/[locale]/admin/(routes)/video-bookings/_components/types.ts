// app/[locale]/admin/(routes)/video-bookings/_components/types.ts

import {
  VideoBooking, AvailabilitySlot, User, BookingStatusHistory, BookingStatus,
} from '@prisma/client'
import type { LucideIcon } from 'lucide-react'
import {
  ClipboardList, Calendar, CheckCircle2, XCircle,
  RefreshCw, Trophy, Ban, UserX,
} from 'lucide-react'

// ------------------------------------------------------------------
// Core relation types
// ------------------------------------------------------------------
export type BookingWithRelations = VideoBooking & {
  client: Pick<User, 'id' | 'email' | 'fullName'>
  slot: AvailabilitySlot | null
  statusHistory: (BookingStatusHistory & {
    changedBy: Pick<User, 'id' | 'email' | 'fullName'>
  })[]
}

export type SlotWithBooking = AvailabilitySlot & {
  booking: Pick<VideoBooking, 'id' | 'status'> | null
  createdBy: Pick<User, 'id' | 'email' | 'fullName'>
}

// ------------------------------------------------------------------
// Pagination
// ------------------------------------------------------------------
export type PaginationInfo = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

// ------------------------------------------------------------------
// KPI
// ------------------------------------------------------------------
export type AdminBookingKpi = {
  total: number
  requested: number
  proposed: number
  confirmed: number
  completed: number
  canceled: number
}

// ------------------------------------------------------------------
// Status config  — Lucide icon components, ring-based chip classes
// ------------------------------------------------------------------
export type StatusConfig = {
  label: string
  /** ring-based chip classes (text + ring + bg) for the status badge */
  color: string
  /** dot color class for the status tab pills */
  dot: string
  /** border + bg classes for the inline alert strip in the detail dialog */
  borderColor: string
  /** Lucide icon component */
  icon: LucideIcon
  description: string
}

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, StatusConfig> = {
  REQUESTED: {
    label: 'Requested',
    color: 'text-blue-600 dark:text-blue-400 ring-blue-400/30 bg-blue-500/8',
    dot: 'bg-blue-400',
    borderColor: 'border-blue-400/20 bg-blue-500/5 text-blue-700 dark:text-blue-300',
    icon: ClipboardList,
    description: 'Client has requested a video call. Assign a slot and propose a time.',
  },
  PROPOSED: {
    label: 'Proposed',
    color: 'text-amber-600 dark:text-amber-400 ring-amber-400/30 bg-amber-500/8',
    dot: 'bg-amber-400',
    borderColor: 'border-amber-400/20 bg-amber-500/5 text-amber-700 dark:text-amber-300',
    icon: Calendar,
    description: 'A time has been proposed. Waiting for client confirmation.',
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'text-emerald-600 dark:text-emerald-400 ring-emerald-400/30 bg-emerald-500/8',
    dot: 'bg-emerald-400',
    borderColor: 'border-emerald-400/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
    icon: CheckCircle2,
    description: 'Client confirmed the time. The call is scheduled.',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'text-red-600 dark:text-red-400 ring-red-400/30 bg-red-500/8',
    dot: 'bg-red-400',
    borderColor: 'border-red-400/20 bg-red-500/5 text-red-700 dark:text-red-300',
    icon: XCircle,
    description: 'This booking was rejected.',
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    color: 'text-violet-600 dark:text-violet-400 ring-violet-400/30 bg-violet-500/8',
    dot: 'bg-violet-400',
    borderColor: 'border-violet-400/20 bg-violet-500/5 text-violet-700 dark:text-violet-300',
    icon: RefreshCw,
    description: 'The call has been rescheduled.',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-green-600 dark:text-green-400 ring-green-400/30 bg-green-500/8',
    dot: 'bg-green-400',
    borderColor: 'border-green-400/20 bg-green-500/5 text-green-700 dark:text-green-300',
    icon: Trophy,
    description: 'Call completed successfully.',
  },
  CANCELED: {
    label: 'Cancelled',
    color: 'text-muted-foreground ring-border/40 bg-muted/40',
    dot: 'bg-muted-foreground/50',
    borderColor: 'border-border/40 bg-muted/20 text-muted-foreground',
    icon: Ban,
    description: 'This booking has been cancelled.',
  },
  NO_SHOW: {
    label: 'No Show',
    color: 'text-orange-600 dark:text-orange-400 ring-orange-400/30 bg-orange-500/8',
    dot: 'bg-orange-400',
    borderColor: 'border-orange-400/20 bg-orange-500/5 text-orange-700 dark:text-orange-300',
    icon: UserX,
    description: 'The client did not attend the call.',
  },
}