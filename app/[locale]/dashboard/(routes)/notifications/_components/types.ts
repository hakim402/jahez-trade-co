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
// Covers all types emitted by admin actions across the codebase
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationTypeConfig = {
  label:       string
  icon:        string           // emoji for quick rendering
  color:       string           // tailwind classes for the icon wrapper bg
  textColor:   string           // tailwind text class
  description: string
  route:       (n: ClientNotification) => string | null   // click-through URL
}

export const NOTIFICATION_TYPE_CONFIG: Record<string, NotificationTypeConfig> = {
  // ── Video Bookings ────────────────────────────────────────────────────────
  BOOKING_SCHEDULED: {
    label:       'Call Scheduled',
    icon:        '🗓️',
    color:       'bg-blue-100',
    textColor:   'text-blue-700',
    description: 'A time slot has been proposed for your video call.',
    route:       (n) => n.bookingId ? `/dashboard/video-bookings` : null,
  },
  BOOKING_CONFIRMED: {
    label:       'Call Confirmed',
    icon:        '✅',
    color:       'bg-green-100',
    textColor:   'text-green-700',
    description: 'Your video call booking is confirmed.',
    route:       (n) => n.bookingId ? `/dashboard/video-bookings` : null,
  },
  BOOKING_COMPLETED: {
    label:       'Call Completed',
    icon:        '🎉',
    color:       'bg-emerald-100',
    textColor:   'text-emerald-700',
    description: 'Your video call has been marked as completed.',
    route:       (n) => n.bookingId ? `/dashboard/video-bookings` : null,
  },
  BOOKING_CANCELLED: {
    label:       'Call Cancelled',
    icon:        '🚫',
    color:       'bg-red-100',
    textColor:   'text-red-700',
    description: 'Your video call booking has been cancelled.',
    route:       (n) => n.bookingId ? `/dashboard/video-bookings` : null,
  },
  BOOKING_NO_SHOW: {
    label:       'Missed Call',
    icon:        '👻',
    color:       'bg-orange-100',
    textColor:   'text-orange-700',
    description: 'You missed your scheduled video call.',
    route:       (n) => n.bookingId ? `/dashboard/video-bookings` : null,
  },

  // ── Product Requests ──────────────────────────────────────────────────────
  REQUEST_STATUS_UPDATED: {
    label:       'Request Updated',
    icon:        '📦',
    color:       'bg-purple-100',
    textColor:   'text-purple-700',
    description: 'The status of your product request has changed.',
    route:       (n) => n.requestId ? `/dashboard/requests` : null,
  },
  REQUEST_SUBMITTED: {
    label:       'Request Submitted',
    icon:        '📋',
    color:       'bg-violet-100',
    textColor:   'text-violet-700',
    description: 'Your product request has been received.',
    route:       (n) => n.requestId ? `/dashboard/requests` : null,
  },
  REQUEST_APPROVED: {
    label:       'Request Approved',
    icon:        '🟢',
    color:       'bg-green-100',
    textColor:   'text-green-700',
    description: 'Your product request has been approved.',
    route:       (n) => n.requestId ? `/dashboard/requests` : null,
  },
  REQUEST_REJECTED: {
    label:       'Request Rejected',
    icon:        '🔴',
    color:       'bg-red-100',
    textColor:   'text-red-700',
    description: 'Your product request was not approved.',
    route:       (n) => n.requestId ? `/dashboard/requests` : null,
  },

  // ── Quotes ────────────────────────────────────────────────────────────────
  QUOTE_SENT: {
    label:       'Quote Received',
    icon:        '💰',
    color:       'bg-amber-100',
    textColor:   'text-amber-700',
    description: 'A quote has been sent for your request.',
    route:       (n) => n.requestId ? `/dashboard/requests` : null,
  },
  QUOTE_UPDATED: {
    label:       'Quote Updated',
    icon:        '📝',
    color:       'bg-yellow-100',
    textColor:   'text-yellow-700',
    description: 'A quote for your request has been updated.',
    route:       (n) => n.requestId ? `/dashboard/requests` : null,
  },

  // ── Messages ──────────────────────────────────────────────────────────────
  NEW_MESSAGE: {
    label:       'New Message',
    icon:        '💬',
    color:       'bg-sky-100',
    textColor:   'text-sky-700',
    description: 'You have a new message from the team.',
    route:       () => `/dashboard/messages`,
  },

  // ── System ────────────────────────────────────────────────────────────────
  SYSTEM: {
    label:       'System',
    icon:        '⚙️',
    color:       'bg-gray-100',
    textColor:   'text-gray-600',
    description: 'A system notification.',
    route:       () => null,
  },
  ANNOUNCEMENT: {
    label:       'Announcement',
    icon:        '📣',
    color:       'bg-indigo-100',
    textColor:   'text-indigo-700',
    description: 'A platform announcement.',
    route:       () => null,
  },
}

// Fallback for unknown types
export function getNotificationConfig(type: string): NotificationTypeConfig {
  return NOTIFICATION_TYPE_CONFIG[type] ?? {
    label:       type.replace(/_/g, ' '),
    icon:        '🔔',
    color:       'bg-muted',
    textColor:   'text-muted-foreground',
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

// Map filter tab → notification types
export const FILTER_TYPE_MAP: Record<FilterTab, string[] | null> = {
  all:      null,
  unread:   null, // handled via isRead=false
  bookings: ['BOOKING_SCHEDULED', 'BOOKING_CONFIRMED', 'BOOKING_COMPLETED', 'BOOKING_CANCELLED', 'BOOKING_NO_SHOW'],
  requests: ['REQUEST_STATUS_UPDATED', 'REQUEST_SUBMITTED', 'REQUEST_APPROVED', 'REQUEST_REJECTED'],
  quotes:   ['QUOTE_SENT', 'QUOTE_UPDATED'],
  messages: ['NEW_MESSAGE'],
}