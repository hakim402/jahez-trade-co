import {
  VideoBooking, AvailabilitySlot, User, BookingStatusHistory, BookingStatus,
} from '@prisma/client'

// ------------------------------------------------------------------
// Core relation types
// ------------------------------------------------------------------
export type BookingWithRelations = VideoBooking & {
  client:   Pick<User, 'id' | 'email' | 'fullName'>
  slot:     AvailabilitySlot | null
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
  page:       number
  pageSize:   number
  totalCount: number
  totalPages: number
}

// ------------------------------------------------------------------
// KPI
// ------------------------------------------------------------------
export type AdminBookingKpi = {
  total:     number
  requested: number
  proposed:  number
  confirmed: number
  completed: number
  canceled:  number
}

// ------------------------------------------------------------------
// Status config
// ------------------------------------------------------------------
export type StatusConfig = {
  label:       string
  color:       string   // badge classes
  borderColor: string   // alert banner classes
  icon:        string
  description: string
}

import { BookingStatus as BS } from '@prisma/client'

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, StatusConfig> = {
  REQUESTED: {
    label:       'Requested',
    color:       'bg-blue-100 text-blue-800 border-blue-200',
    borderColor: 'border-blue-200 bg-blue-50 text-blue-700',
    icon:        '📋',
    description: 'Client has requested a video call. Assign a slot and propose a time.',
  },
  PROPOSED: {
    label:       'Proposed',
    color:       'bg-amber-100 text-amber-800 border-amber-200',
    borderColor: 'border-amber-200 bg-amber-50 text-amber-700',
    icon:        '🗓️',
    description: 'A time has been proposed. Waiting for client confirmation.',
  },
  CONFIRMED: {
    label:       'Confirmed',
    color:       'bg-green-100 text-green-800 border-green-200',
    borderColor: 'border-green-200 bg-green-50 text-green-700',
    icon:        '✅',
    description: 'Client confirmed the time. The call is scheduled.',
  },
  REJECTED: {
    label:       'Rejected',
    color:       'bg-red-100 text-red-800 border-red-200',
    borderColor: 'border-red-200 bg-red-50 text-red-700',
    icon:        '❌',
    description: 'This booking was rejected.',
  },
  RESCHEDULED: {
    label:       'Rescheduled',
    color:       'bg-purple-100 text-purple-800 border-purple-200',
    borderColor: 'border-purple-200 bg-purple-50 text-purple-700',
    icon:        '🔄',
    description: 'The call has been rescheduled.',
  },
  COMPLETED: {
    label:       'Completed',
    color:       'bg-emerald-100 text-emerald-800 border-emerald-200',
    borderColor: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon:        '🎉',
    description: 'Call completed successfully.',
  },
  CANCELED: {
    label:       'Cancelled',
    color:       'bg-gray-100 text-gray-600 border-gray-200',
    borderColor: 'border-gray-200 bg-gray-50 text-gray-600',
    icon:        '🚫',
    description: 'This booking has been cancelled.',
  },
  NO_SHOW: {
    label:       'No Show',
    color:       'bg-orange-100 text-orange-800 border-orange-200',
    borderColor: 'border-orange-200 bg-orange-50 text-orange-700',
    icon:        '👻',
    description: 'The client did not attend the call.',
  },
}