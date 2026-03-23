// ─────────────────────────────────────────────────────────────────────────────
// CLIENT DASHBOARD TYPES
// Consumed by ClientDashboard and all Overview sub-components.
// ─────────────────────────────────────────────────────────────────────────────

import type { BookingStatus, RequestStatus, QuoteStatus, BookingType, MeetingProvider } from '@prisma/client'

// Re-export Prisma enums for use in components
export type { BookingStatus, RequestStatus, QuoteStatus, BookingType, MeetingProvider }

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION
// ─────────────────────────────────────────────────────────────────────────────

export type SubscriptionInfo = {
  planName: string
  planAmount: number
  currency: string
  interval: string | null
  intervalCount: number | null
  isDefaultPlan: boolean
  isTrial: boolean
  trialEndsAt: Date | null
  periodEndsAt: Date | null
  billingEnabled: boolean
  hasAccess: boolean
  requestLimit: number
  bookingLimit: number
  requestsUsed: number
  bookingsUsed: number
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

export type RecentRequestItem = {
  id: string
  status: RequestStatus
  description: string | null
  productLink: string | null
  quantity: number
  shippingCountry: string
  createdAt: Date
  updatedAt: Date
  quotesCount: number
  hasAcceptedQuote: boolean
  latestQuote: {
    id: string
    price: string
    currency: string
    status: QuoteStatus
  } | null
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────────────────────────────────────

export type RecentBookingItem = {
  id: string
  type: BookingType
  status: BookingStatus
  scheduledAt: Date | null
  durationMinutes: number
  meetingLink: string | null
  meetingProvider: MeetingProvider | null
  meetingPassword: string | null
  requestNotes: string | null
  clientConfirmedAt: Date | null
  createdAt: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// QUOTES
// ─────────────────────────────────────────────────────────────────────────────

export type RecentQuoteItem = {
  id: string
  status: QuoteStatus
  price: string
  currency: string
  revision: number
  validUntil: Date | null
  adminNotes: string | null
  createdAt: Date
  request: {
    id: string
    description: string | null
    status: RequestStatus
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT STATS SHAPE — consumed by ClientDashboard
// ─────────────────────────────────────────────────────────────────────────────

export type ClientDashboardStats = {
  user: {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
    phone: string | null
    memberSince: Date
  }
  subscription: SubscriptionInfo
  requests: {
    total: number
    recent: RecentRequestItem[]
    byStatus: Record<string, number>
    active: number
    completed: number
  }
  bookings: {
    total: number
    recent: RecentBookingItem[]
    byStatus: Record<string, number>
    upcoming: number
    completed: number
  }
  quotes: {
    total: number
    recent: RecentQuoteItem[]
    byStatus: Record<string, number>
    pending: number
  }
  notifications: {
    unreadCount: number
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export type StatusConfig = {
  label: string
  color: string        // tailwind bg class
  textColor: string        // tailwind text class
  dot: string        // tailwind bg class for dot indicator
}

export const REQUEST_STATUS_CONFIG: Record<string, StatusConfig> = {
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-100 dark:bg-blue-950', textColor: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  IN_REVIEW: { label: 'In Review', color: 'bg-amber-100 dark:bg-amber-950', textColor: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  QUOTED: { label: 'Quoted', color: 'bg-purple-100 dark:bg-purple-950', textColor: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  APPROVED: { label: 'Approved', color: 'bg-indigo-100 dark:bg-indigo-950', textColor: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
  IN_PRODUCTION: { label: 'In Production', color: 'bg-cyan-100 dark:bg-cyan-950', textColor: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 dark:bg-green-950', textColor: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 dark:bg-red-950', textColor: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 dark:bg-gray-800', textColor: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
}

export const BOOKING_STATUS_CONFIG: Record<string, StatusConfig> = {
  REQUESTED: { label: 'Requested', color: 'bg-sky-100 dark:bg-sky-950', textColor: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
  PROPOSED: { label: 'Proposed', color: 'bg-amber-100 dark:bg-amber-950', textColor: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-indigo-100 dark:bg-indigo-950', textColor: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 dark:bg-green-950', textColor: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 dark:bg-gray-800', textColor: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
  CANCELED: { label: 'Cancelled', color: 'bg-gray-100 dark:bg-gray-800', textColor: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 dark:bg-red-950', textColor: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  NO_SHOW: { label: 'No Show', color: 'bg-orange-100 dark:bg-orange-950', textColor: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  RESCHEDULED: { label: 'Rescheduled', color: 'bg-violet-100 dark:bg-violet-950', textColor: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
}

export const QUOTE_STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 dark:bg-gray-800', textColor: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
  SENT: { label: 'Pending', color: 'bg-amber-100 dark:bg-amber-950', textColor: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-100 dark:bg-green-950', textColor: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 dark:bg-red-950', textColor: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  EXPIRED: { label: 'Expired', color: 'bg-rose-100 dark:bg-rose-950', textColor: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
  REVISED: { label: 'Revised', color: 'bg-purple-100 dark:bg-purple-950', textColor: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
}

export function getRequestStatusConfig(status: string): StatusConfig {
  return REQUEST_STATUS_CONFIG[status] ?? { label: status, color: 'bg-muted', textColor: 'text-muted-foreground', dot: 'bg-muted-foreground' }
}

export function getBookingStatusConfig(status: string): StatusConfig {
  return BOOKING_STATUS_CONFIG[status] ?? { label: status, color: 'bg-muted', textColor: 'text-muted-foreground', dot: 'bg-muted-foreground' }
}

export function getQuoteStatusConfig(status: string): StatusConfig {
  return QUOTE_STATUS_CONFIG[status] ?? { label: status, color: 'bg-muted', textColor: 'text-muted-foreground', dot: 'bg-muted-foreground' }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────

export function formatCurrency(amount: string | number, currency = 'USD'): string {
  return Number(amount).toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 2 })
}

export function formatLimit(value: number): string {
  return value === Infinity ? '∞' : value.toString()
}