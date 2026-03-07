import {
  VideoBooking, AvailabilitySlot, User,
  BookingStatusHistory, BookingStatus,
} from '@prisma/client'
import type { LucideIcon } from 'lucide-react'
import {
  ClipboardList, CalendarClock, CheckCircle2, XCircle,
  RefreshCw, Trophy, Ban, UserX,
} from 'lucide-react'

// ─── Core relation type ────────────────────────────────────────────────────

export type ClientBookingWithRelations = VideoBooking & {
  slot: AvailabilitySlot | null
  statusHistory: (BookingStatusHistory & {
    changedBy: Pick<User, 'id' | 'email' | 'fullName'>
  })[]
}

// ─── Plan info ─────────────────────────────────────────────────────────────

export type UserPlanInfo = {
  planName: string
  limit: number
  usedCount: number
  hasAccess: boolean
  billingEnabled: boolean
}

// ─── Pagination ────────────────────────────────────────────────────────────

export type PaginationInfo = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

// ─── Status visual config ─────────────────────────────────────────────────

export type StatusConfig = {
  label: string
  icon: LucideIcon
  chip: string   // pill bg+text+border+ring
  dot: string   // solid bg-* for timeline dots
  gradient: string   // for icon badges
  description: string
}

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, StatusConfig> = {
  REQUESTED: {
    label: 'Requested',
    icon: ClipboardList,
    chip: 'bg-blue-500/10 text-blue-400 border-blue-400/20 ring-blue-400/20',
    dot: 'bg-blue-400',
    gradient: 'from-blue-500 to-cyan-500',
    description: 'Your request has been submitted. Our team will review it and propose a time.',
  },
  PROPOSED: {
    label: 'Time Proposed',
    icon: CalendarClock,
    chip: 'bg-amber-500/10 text-amber-400 border-amber-400/20 ring-amber-400/20',
    dot: 'bg-amber-400',
    gradient: 'from-amber-400 to-orange-500',
    description: 'A time has been proposed for your video call. Please confirm or cancel.',
  },
  CONFIRMED: {
    label: 'Confirmed',
    icon: CheckCircle2,
    chip: 'bg-green-500/10 text-green-400 border-green-400/20 ring-green-400/20',
    dot: 'bg-green-400',
    gradient: 'from-green-400 to-emerald-500',
    description: 'Your video call is confirmed. Check your meeting link below.',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    chip: 'bg-red-500/10 text-red-400 border-red-400/20 ring-red-400/20',
    dot: 'bg-red-400',
    gradient: 'from-red-500 to-rose-500',
    description: 'This booking was rejected. Please contact support if you have questions.',
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    icon: RefreshCw,
    chip: 'bg-violet-500/10 text-violet-400 border-violet-400/20 ring-violet-400/20',
    dot: 'bg-violet-400',
    gradient: 'from-violet-500 to-purple-600',
    description: 'Your call has been rescheduled. Please review the new time.',
  },
  COMPLETED: {
    label: 'Completed',
    icon: Trophy,
    chip: 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20 ring-emerald-400/20',
    dot: 'bg-emerald-400',
    gradient: 'from-emerald-400 to-teal-500',
    description: 'Your video call has been completed successfully.',
  },
  CANCELED: {
    label: 'Cancelled',
    icon: Ban,
    chip: 'bg-muted/40 text-muted-foreground border-border/30 ring-border/20',
    dot: 'bg-muted-foreground/40',
    gradient: 'from-slate-400 to-gray-500',
    description: 'This booking has been cancelled.',
  },
  NO_SHOW: {
    label: 'No Show',
    icon: UserX,
    chip: 'bg-orange-500/10 text-orange-400 border-orange-400/20 ring-orange-400/20',
    dot: 'bg-orange-400',
    gradient: 'from-orange-400 to-amber-500',
    description: 'The client did not attend the scheduled call.',
  },
}

export const PLAN_BOOKING_LIMITS: Record<string, number> = {
  free: 1,
  starter: 2,
  pro: 5,
  business: 10,
  enterprise: Infinity,
  vip: Infinity,
}