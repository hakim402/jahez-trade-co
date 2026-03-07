import type { LucideIcon } from 'lucide-react'
import {
  CalendarClock, CheckCircle2, Trophy, Ban, UserX,
  RefreshCw, ClipboardList, CircleCheck, XCircle,
  ReceiptText, FilePen, MessageCircle, Settings2, Megaphone,
  Bell,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ClientNotification = {
  id:        string
  title:     string
  message:   string
  type:      string
  isRead:    boolean
  createdAt: Date
  metadata:  unknown
  bookingId: string | null
  requestId: string | null
  quoteId:   string | null
}

export type NotificationSummary = {
  unreadCount: number
}

export type PaginationInfo = {
  page:       number
  pageSize:   number
  totalCount: number
  totalPages: number
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION TYPE CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationTypeConfig = {
  label:       string
  icon:        LucideIcon
  /** bg class for the icon badge wrapper  e.g. "bg-blue-500/10" */
  iconBg:      string
  /** icon color class e.g. "text-blue-400" */
  iconColor:   string
  /** dot color class for unread indicator e.g. "bg-blue-400" */
  dot:         string
  /** chip classes for the label pill */
  chip:        string
  description: string
  route:       (n: ClientNotification) => string | null
}

export const NOTIFICATION_TYPE_CONFIG: Record<string, NotificationTypeConfig> = {
  // ── Video Bookings ────────────────────────────────────────────────────────
  BOOKING_SCHEDULED: {
    label:       'Call Scheduled',
    icon:        CalendarClock,
    iconBg:      'bg-blue-500/10',
    iconColor:   'text-blue-400',
    dot:         'bg-blue-400',
    chip:        'text-blue-400 bg-blue-500/10 border-blue-400/20',
    description: 'A time slot has been proposed for your video call.',
    route:       (n) => n.bookingId ? `/dashboard/video-bookings` : null,
  },
  BOOKING_CONFIRMED: {
    label:       'Call Confirmed',
    icon:        CheckCircle2,
    iconBg:      'bg-green-500/10',
    iconColor:   'text-green-400',
    dot:         'bg-green-400',
    chip:        'text-green-400 bg-green-500/10 border-green-400/20',
    description: 'Your video call booking is confirmed.',
    route:       (n) => n.bookingId ? `/dashboard/video-bookings` : null,
  },
  BOOKING_COMPLETED: {
    label:       'Call Completed',
    icon:        Trophy,
    iconBg:      'bg-teal-500/10',
    iconColor:   'text-teal-400',
    dot:         'bg-teal-400',
    chip:        'text-teal-400 bg-teal-500/10 border-teal-400/20',
    description: 'Your video call has been marked as completed.',
    route:       (n) => n.bookingId ? `/dashboard/video-bookings` : null,
  },
  BOOKING_CANCELLED: {
    label:       'Call Cancelled',
    icon:        Ban,
    iconBg:      'bg-red-500/10',
    iconColor:   'text-red-400',
    dot:         'bg-red-400',
    chip:        'text-red-400 bg-red-500/10 border-red-400/20',
    description: 'Your video call booking has been cancelled.',
    route:       (n) => n.bookingId ? `/dashboard/video-bookings` : null,
  },
  BOOKING_NO_SHOW: {
    label:       'Missed Call',
    icon:        UserX,
    iconBg:      'bg-orange-500/10',
    iconColor:   'text-orange-400',
    dot:         'bg-orange-400',
    chip:        'text-orange-400 bg-orange-500/10 border-orange-400/20',
    description: 'You missed your scheduled video call.',
    route:       (n) => n.bookingId ? `/dashboard/video-bookings` : null,
  },

  // ── Product Requests ──────────────────────────────────────────────────────
  REQUEST_STATUS_UPDATED: {
    label:       'Request Updated',
    icon:        RefreshCw,
    iconBg:      'bg-violet-500/10',
    iconColor:   'text-violet-400',
    dot:         'bg-violet-400',
    chip:        'text-violet-400 bg-violet-500/10 border-violet-400/20',
    description: 'The status of your product request has changed.',
    route:       (n) => n.requestId ? `/dashboard/requests` : null,
  },
  REQUEST_SUBMITTED: {
    label:       'Request Submitted',
    icon:        ClipboardList,
    iconBg:      'bg-indigo-500/10',
    iconColor:   'text-indigo-400',
    dot:         'bg-indigo-400',
    chip:        'text-indigo-400 bg-indigo-500/10 border-indigo-400/20',
    description: 'Your product request has been received.',
    route:       (n) => n.requestId ? `/dashboard/requests` : null,
  },
  REQUEST_APPROVED: {
    label:       'Request Approved',
    icon:        CircleCheck,
    iconBg:      'bg-green-500/10',
    iconColor:   'text-green-400',
    dot:         'bg-green-400',
    chip:        'text-green-400 bg-green-500/10 border-green-400/20',
    description: 'Your product request has been approved.',
    route:       (n) => n.requestId ? `/dashboard/requests` : null,
  },
  REQUEST_REJECTED: {
    label:       'Request Rejected',
    icon:        XCircle,
    iconBg:      'bg-red-500/10',
    iconColor:   'text-red-400',
    dot:         'bg-red-400',
    chip:        'text-red-400 bg-red-500/10 border-red-400/20',
    description: 'Your product request was not approved.',
    route:       (n) => n.requestId ? `/dashboard/requests` : null,
  },

  // ── Quotes ────────────────────────────────────────────────────────────────
  QUOTE_SENT: {
    label:       'Quote Received',
    icon:        ReceiptText,
    iconBg:      'bg-amber-500/10',
    iconColor:   'text-amber-400',
    dot:         'bg-amber-400',
    chip:        'text-amber-400 bg-amber-500/10 border-amber-400/20',
    description: 'A quote has been sent for your request.',
    route:       (n) => n.requestId ? `/dashboard/requests` : null,
  },
  QUOTE_UPDATED: {
    label:       'Quote Updated',
    icon:        FilePen,
    iconBg:      'bg-yellow-500/10',
    iconColor:   'text-yellow-400',
    dot:         'bg-yellow-400',
    chip:        'text-yellow-400 bg-yellow-500/10 border-yellow-400/20',
    description: 'A quote for your request has been updated.',
    route:       (n) => n.requestId ? `/dashboard/requests` : null,
  },

  // ── Messages ──────────────────────────────────────────────────────────────
  NEW_MESSAGE: {
    label:       'New Message',
    icon:        MessageCircle,
    iconBg:      'bg-sky-500/10',
    iconColor:   'text-sky-400',
    dot:         'bg-sky-400',
    chip:        'text-sky-400 bg-sky-500/10 border-sky-400/20',
    description: 'You have a new message from the team.',
    route:       () => `/dashboard/messages`,
  },

  // ── System ────────────────────────────────────────────────────────────────
  SYSTEM: {
    label:       'System',
    icon:        Settings2,
    iconBg:      'bg-muted/40',
    iconColor:   'text-muted-foreground',
    dot:         'bg-muted-foreground',
    chip:        'text-muted-foreground bg-muted/30 border-border/20',
    description: 'A system notification.',
    route:       () => null,
  },
  ANNOUNCEMENT: {
    label:       'Announcement',
    icon:        Megaphone,
    iconBg:      'bg-indigo-500/10',
    iconColor:   'text-indigo-400',
    dot:         'bg-indigo-400',
    chip:        'text-indigo-400 bg-indigo-500/10 border-indigo-400/20',
    description: 'A platform announcement.',
    route:       () => null,
  },
}

// Fallback for unknown types
export function getNotificationConfig(type: string): NotificationTypeConfig {
  return NOTIFICATION_TYPE_CONFIG[type] ?? {
    label:       type.replace(/_/g, ' '),
    icon:        Bell,
    iconBg:      'bg-muted/40',
    iconColor:   'text-muted-foreground',
    dot:         'bg-muted-foreground',
    chip:        'text-muted-foreground bg-muted/30 border-border/20',
    description: '',
    route:       () => null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER TABS
// ─────────────────────────────────────────────────────────────────────────────

export const FILTER_TABS = [
  { id: 'all',       label: 'All' },
  { id: 'unread',    label: 'Unread' },
  { id: 'bookings',  label: 'Bookings' },
  { id: 'requests',  label: 'Requests' },
  { id: 'quotes',    label: 'Quotes' },
  { id: 'messages',  label: 'Messages' },
] as const

export type FilterTab = (typeof FILTER_TABS)[number]['id']

export const FILTER_TYPE_MAP: Record<FilterTab, string[] | null> = {
  all:      null,
  unread:   null,
  bookings: ['BOOKING_SCHEDULED', 'BOOKING_CONFIRMED', 'BOOKING_COMPLETED', 'BOOKING_CANCELLED', 'BOOKING_NO_SHOW'],
  requests: ['REQUEST_STATUS_UPDATED', 'REQUEST_SUBMITTED', 'REQUEST_APPROVED', 'REQUEST_REJECTED'],
  quotes:   ['QUOTE_SENT', 'QUOTE_UPDATED'],
  messages: ['NEW_MESSAGE'],
}