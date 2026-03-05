import { VideoBooking, AvailabilitySlot, User, BookingStatusHistory, BookingStatus } from '@prisma/client'

// ------------------------------------------------------------------
// Core relation type
// ------------------------------------------------------------------
export type ClientBookingWithRelations = VideoBooking & {
  slot: AvailabilitySlot | null
  statusHistory: (BookingStatusHistory & {
    changedBy: Pick<User, 'id' | 'email' | 'fullName'>
  })[]
}

// ------------------------------------------------------------------
// Plan info
// ------------------------------------------------------------------
export type UserPlanInfo = {
  planName: string
  limit: number
  usedCount: number
  hasAccess: boolean
  billingEnabled: boolean
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
// Status config
// ------------------------------------------------------------------
export type StatusConfig = {
  label: string
  color: string
  borderColor: string
  icon: string
  description: string
}

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, StatusConfig> = {
  REQUESTED: {
    label: 'Requested',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    borderColor: 'border-blue-200 bg-blue-50 text-blue-700',
    icon: '📋',
    description: 'Your request has been submitted. Our team will review it and propose a time.',
  },
  PROPOSED: {
    label: 'Time Proposed',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    borderColor: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: '🗓️',
    description: 'A time has been proposed for your video call. Please confirm or cancel.',
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'bg-green-100 text-green-800 border-green-200',
    borderColor: 'border-green-200 bg-green-50 text-green-700',
    icon: '✅',
    description: 'Your video call is confirmed. Check your meeting link below.',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 border-red-200',
    borderColor: 'border-red-200 bg-red-50 text-red-700',
    icon: '❌',
    description: 'This booking was rejected. Please contact support if you have questions.',
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    borderColor: 'border-purple-200 bg-purple-50 text-purple-700',
    icon: '🔄',
    description: 'Your call has been rescheduled. Please review the new time.',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    borderColor: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: '🎉',
    description: 'Your video call has been completed successfully.',
  },
  CANCELED: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    borderColor: 'border-gray-200 bg-gray-50 text-gray-600',
    icon: '🚫',
    description: 'This booking has been cancelled.',
  },
  NO_SHOW: {
    label: 'No Show',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    borderColor: 'border-orange-200 bg-orange-50 text-orange-700',
    icon: '👻',
    description: 'The client did not attend the scheduled call.',
  },
}

export const PLAN_BOOKING_LIMITS: Record<string, number> = {
  free:       1,
  starter:    2,
  pro:        5,
  business:   10,
  enterprise: Infinity,
  vip:        Infinity,
}