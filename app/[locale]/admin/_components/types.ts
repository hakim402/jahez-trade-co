// app/[locale]/admin/_components/types.ts
// Shared types for all admin dashboard components

import type {
  DashboardStats,
  PendingWorkload,
  RecentActivity,
  RevenueBreakdown,
  UserOverview,
} from '../actions/actions'

export type { DashboardStats, PendingWorkload, RecentActivity, RevenueBreakdown, UserOverview }

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export type StatCardConfig = {
  label:     string
  value:     number | string
  sub:       string
  subValue:  number | string
  gradient:  string   // tailwind from-X to-Y
  icon:      string   // emoji
  href:      string
  urgent?:   boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIGS
// ─────────────────────────────────────────────────────────────────────────────

export type StatusConfig = {
  label:     string
  color:     string
  textColor: string
  dot:       string
}

export const REQUEST_STATUS_CONFIG: Record<string, StatusConfig> = {
  SUBMITTED:     { label: 'Submitted',     color: 'bg-blue-100 dark:bg-blue-950',     textColor: 'text-blue-700 dark:text-blue-300',     dot: 'bg-blue-500'    },
  IN_REVIEW:     { label: 'In Review',     color: 'bg-amber-100 dark:bg-amber-950',   textColor: 'text-amber-700 dark:text-amber-300',   dot: 'bg-amber-500'   },
  QUOTED:        { label: 'Quoted',        color: 'bg-purple-100 dark:bg-purple-950', textColor: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500'  },
  APPROVED:      { label: 'Approved',      color: 'bg-indigo-100 dark:bg-indigo-950', textColor: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500'  },
  IN_PRODUCTION: { label: 'In Production', color: 'bg-cyan-100 dark:bg-cyan-950',     textColor: 'text-cyan-700 dark:text-cyan-300',     dot: 'bg-cyan-500'    },
  COMPLETED:     { label: 'Completed',     color: 'bg-green-100 dark:bg-green-950',   textColor: 'text-green-700 dark:text-green-300',   dot: 'bg-green-500'   },
  REJECTED:      { label: 'Rejected',      color: 'bg-red-100 dark:bg-red-950',       textColor: 'text-red-700 dark:text-red-300',       dot: 'bg-red-500'     },
  SHIPPED:       { label: 'Shipped',       color: 'bg-teal-100 dark:bg-teal-950',     textColor: 'text-teal-700 dark:text-teal-300',     dot: 'bg-teal-500'    },
}

export const BOOKING_STATUS_CONFIG: Record<string, StatusConfig> = {
  REQUESTED:   { label: 'Requested',   color: 'bg-sky-100 dark:bg-sky-950',       textColor: 'text-sky-700 dark:text-sky-300',       dot: 'bg-sky-500'     },
  PROPOSED:    { label: 'Proposed',    color: 'bg-amber-100 dark:bg-amber-950',   textColor: 'text-amber-700 dark:text-amber-300',   dot: 'bg-amber-500'   },
  CONFIRMED:   { label: 'Confirmed',   color: 'bg-indigo-100 dark:bg-indigo-950', textColor: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500'  },
  COMPLETED:   { label: 'Completed',   color: 'bg-green-100 dark:bg-green-950',   textColor: 'text-green-700 dark:text-green-300',   dot: 'bg-green-500'   },
  CANCELED:    { label: 'Cancelled',   color: 'bg-gray-100 dark:bg-gray-800',     textColor: 'text-gray-500 dark:text-gray-400',     dot: 'bg-gray-400'    },
  REJECTED:    { label: 'Rejected',    color: 'bg-red-100 dark:bg-red-950',       textColor: 'text-red-700 dark:text-red-300',       dot: 'bg-red-500'     },
  NO_SHOW:     { label: 'No Show',     color: 'bg-orange-100 dark:bg-orange-950', textColor: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500'  },
  RESCHEDULED: { label: 'Rescheduled', color: 'bg-violet-100 dark:bg-violet-950', textColor: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500'  },
}

export function getRequestStatus(s: string): StatusConfig {
  return REQUEST_STATUS_CONFIG[s] ?? { label: s, color: 'bg-muted', textColor: 'text-muted-foreground', dot: 'bg-gray-400' }
}
export function getBookingStatus(s: string): StatusConfig {
  return BOOKING_STATUS_CONFIG[s] ?? { label: s, color: 'bg-muted', textColor: 'text-muted-foreground', dot: 'bg-gray-400' }
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTING
// ─────────────────────────────────────────────────────────────────────────────

export function formatCurrency(value: number, currency = 'USD'): string {
  return value.toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 0 })
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}