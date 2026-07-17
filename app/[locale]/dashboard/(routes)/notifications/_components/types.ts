// app/[locale]/dashboard/(routes)/notifications/_components/types.ts

import type { LucideIcon } from "lucide-react"
import {
  CalendarClock, CheckCircle2, Trophy, Ban, UserX,
  RefreshCw, ClipboardList, CircleCheck, XCircle,
  ReceiptText, FilePen, MessageCircle, Settings2, Megaphone,
  Bell,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ClientNotification = {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date
  metadata: unknown
  bookingId: string | null
  requestId: string | null
  quoteId: string | null
}

export type NotificationSummary = {
  unreadCount: number
}

export type PaginationInfo = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION TYPE CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationTypeConfig = {
  label: string
  labelAr: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  dot: string
  chip: string
  description: string
  descriptionAr: string
  route: (n: ClientNotification) => string | null
}

export const NOTIFICATION_TYPE_CONFIG: Record<string, NotificationTypeConfig> = {
  // ── Video Bookings ────────────────────────────────────────────────────────
  BOOKING_SCHEDULED: {
    label: "Call Scheduled",
    labelAr: "مكالمة مجدولة",
    icon: CalendarClock,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    dot: "bg-blue-400",
    chip: "text-blue-400 bg-blue-500/10 border-blue-400/20",
    description: "A time slot has been proposed for your video call.",
    descriptionAr: "تم اقتراح موعد لمكالمتك المرئية.",
    route: (n) => n.bookingId ? "/dashboard/bookings" : null,
  },
  BOOKING_CONFIRMED: {
    label: "Call Confirmed",
    labelAr: "مكالمة مؤكدة",
    icon: CheckCircle2,
    iconBg: "bg-green-500/10",
    iconColor: "text-green-400",
    dot: "bg-green-400",
    chip: "text-green-400 bg-green-500/10 border-green-400/20",
    description: "Your video call booking is confirmed.",
    descriptionAr: "تم تأكيد حجز مكالمتك المرئية.",
    route: (n) => n.bookingId ? "/dashboard/bookings" : null,
  },
  BOOKING_RESCHEDULED: {
    label: "Call Rescheduled",
    labelAr: "إعادة جدولة المكالمة",
    icon: RefreshCw,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    dot: "bg-amber-400",
    chip: "text-amber-400 bg-amber-500/10 border-amber-400/20",
    description: "Your video call has been rescheduled.",
    descriptionAr: "تمت إعادة جدولة مكالمتك المرئية.",
    route: (n) => n.bookingId ? "/dashboard/bookings" : null,
  },
  BOOKING_COMPLETED: {
    label: "Call Completed",
    labelAr: "مكالمة مكتملة",
    icon: Trophy,
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-400",
    dot: "bg-teal-400",
    chip: "text-teal-400 bg-teal-500/10 border-teal-400/20",
    description: "Your video call has been marked as completed.",
    descriptionAr: "تم تعليم مكالمتك المرئية كمكتملة.",
    route: (n) => n.bookingId ? "/dashboard/bookings" : null,
  },
  BOOKING_CANCELLED: {
    label: "Call Cancelled",
    labelAr: "مكالمة ملغاة",
    icon: Ban,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    dot: "bg-red-400",
    chip: "text-red-400 bg-red-500/10 border-red-400/20",
    description: "Your video call booking has been cancelled.",
    descriptionAr: "تم إلغاء حجز مكالمتك المرئية.",
    route: (n) => n.bookingId ? "/dashboard/bookings" : null,
  },
  BOOKING_NO_SHOW: {
    label: "Missed Call",
    labelAr: "مكالمة فائتة",
    icon: UserX,
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-400",
    dot: "bg-orange-400",
    chip: "text-orange-400 bg-orange-500/10 border-orange-400/20",
    description: "You missed your scheduled video call.",
    descriptionAr: "لم تحضر مكالمتك المرئية المجدولة.",
    route: (n) => n.bookingId ? "/dashboard/bookings" : null,
  },

  // ── Product Requests ──────────────────────────────────────────────────────
  REQUEST_STATUS_UPDATED: {
    label: "Request Updated",
    labelAr: "طلب محدَّث",
    icon: RefreshCw,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    dot: "bg-violet-400",
    chip: "text-violet-400 bg-violet-500/10 border-violet-400/20",
    description: "The status of your product request has changed.",
    descriptionAr: "تغيّرت حالة طلب منتجك.",
    route: (n) => n.requestId ? "/dashboard/requests" : null,
  },
  REQUEST:
  {
    label: "Request Submitted",
    labelAr: "طلب مُرسَل",
    icon: ClipboardList,
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-400",
    dot: "bg-indigo-400",
    chip: "text-indigo-400 bg-indigo-500/10 border-indigo-400/20",
    description: "Your product request has been received.",
    descriptionAr: "تم استلام طلب منتجك.",
    route: (n) => n.requestId ? "/dashboard/requests" : null,
  },
  REQUEST_SUBMITTED: {
    label: "Request Submitted",
    labelAr: "طلب مُرسَل",
    icon: ClipboardList,
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-400",
    dot: "bg-indigo-400",
    chip: "text-indigo-400 bg-indigo-500/10 border-indigo-400/20",
    description: "Your product request has been received.",
    descriptionAr: "تم استلام طلب منتجك.",
    route: (n) => n.requestId ? "/dashboard/requests" : null,
  },
  REQUEST_APPROVED: {
    label: "Request Approved",
    labelAr: "طلب مقبول",
    icon: CircleCheck,
    iconBg: "bg-green-500/10",
    iconColor: "text-green-400",
    dot: "bg-green-400",
    chip: "text-green-400 bg-green-500/10 border-green-400/20",
    description: "Your product request has been approved.",
    descriptionAr: "تمت الموافقة على طلب منتجك.",
    route: (n) => n.requestId ? "/dashboard/requests" : null,
  },
  REQUEST_REJECTED: {
    label: "Request Rejected",
    labelAr: "طلب مرفوض",
    icon: XCircle,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    dot: "bg-red-400",
    chip: "text-red-400 bg-red-500/10 border-red-400/20",
    description: "Your product request was not approved.",
    descriptionAr: "لم تتم الموافقة على طلب منتجك.",
    route: (n) => n.requestId ? "/dashboard/requests" : null,
  },

  // ── Quotes ────────────────────────────────────────────────────────────────
  QUOTE: {
    label: "Quote Received",
    labelAr: "عرض سعر مستلم",
    icon: ReceiptText,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    dot: "bg-amber-400",
    chip: "text-amber-400 bg-amber-500/10 border-amber-400/20",
    description: "A quote has been sent for your request.",
    descriptionAr: "تم إرسال عرض سعر لطلبك.",
    route: (n) => n.requestId ? "/dashboard/requests" : null,
  },
  QUOTE_SENT: {
    label: "Quote Received",
    labelAr: "عرض سعر مستلم",
    icon: ReceiptText,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    dot: "bg-amber-400",
    chip: "text-amber-400 bg-amber-500/10 border-amber-400/20",
    description: "A quote has been sent for your request.",
    descriptionAr: "تم إرسال عرض سعر لطلبك.",
    route: (n) => n.requestId ? "/dashboard/requests" : null,
  },
  QUOTE_UPDATED: {
    label: "Quote Updated",
    labelAr: "عرض سعر محدَّث",
    icon: FilePen,
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-400",
    dot: "bg-yellow-400",
    chip: "text-yellow-400 bg-yellow-500/10 border-yellow-400/20",
    description: "A quote for your request has been updated.",
    descriptionAr: "تم تحديث عرض السعر لطلبك.",
    route: (n) => n.requestId ? "/dashboard/requests" : null,
  },

  // ── Consulting ────────────────────────────────────────────────────────────
  CONSULTING: {
    label: "Consulting",
    labelAr: "استشارة",
    icon: MessageCircle,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    dot: "bg-violet-400",
    chip: "text-violet-400 bg-violet-500/10 border-violet-400/20",
    description: "Update regarding your consulting request.",
    descriptionAr: "تحديث بخصوص طلب استشارتك.",
    route: () => "/dashboard/consulting",
  },

  // ── Messages ──────────────────────────────────────────────────────────────
  NEW_MESSAGE: {
    label: "New Message",
    labelAr: "رسالة جديدة",
    icon: MessageCircle,
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-400",
    dot: "bg-sky-400",
    chip: "text-sky-400 bg-sky-500/10 border-sky-400/20",
    description: "You have a new message from the team.",
    descriptionAr: "لديك رسالة جديدة من الفريق.",
    route: () => "/dashboard/messages",
  },

  // ── System ────────────────────────────────────────────────────────────────
  SYSTEM: {
    label: "System",
    labelAr: "النظام",
    icon: Settings2,
    iconBg: "bg-muted/40",
    iconColor: "text-muted-foreground",
    dot: "bg-muted-foreground",
    chip: "text-muted-foreground bg-muted/30 border-border/20",
    description: "A system notification.",
    descriptionAr: "إشعار من النظام.",
    route: () => null,
  },
  ANNOUNCEMENT: {
    label: "Announcement",
    labelAr: "إعلان",
    icon: Megaphone,
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-400",
    dot: "bg-indigo-400",
    chip: "text-indigo-400 bg-indigo-500/10 border-indigo-400/20",
    description: "A platform announcement.",
    descriptionAr: "إعلان من المنصة.",
    route: () => null,
  },
}

export function getNotificationConfig(type: string): NotificationTypeConfig {
  return NOTIFICATION_TYPE_CONFIG[type] ?? {
    label: type.replace(/_/g, " "),
    labelAr: type.replace(/_/g, " "),
    icon: Bell,
    iconBg: "bg-muted/40",
    iconColor: "text-muted-foreground",
    dot: "bg-muted-foreground",
    chip: "text-muted-foreground bg-muted/30 border-border/20",
    description: "",
    descriptionAr: "",
    route: () => null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER TABS
// ─────────────────────────────────────────────────────────────────────────────

export const FILTER_TABS = [
  { id: "all", label: "All", labelAr: "الكل" },
  { id: "unread", label: "Unread", labelAr: "غير مقروء" },
  { id: "bookings", label: "Bookings", labelAr: "الحجوزات" },
  { id: "requests", label: "Requests", labelAr: "الطلبات" },
  { id: "quotes", label: "Quotes", labelAr: "عروض الأسعار" },
  { id: "messages", label: "Messages", labelAr: "الرسائل" },
] as const

export type FilterTab = (typeof FILTER_TABS)[number]["id"]

export const FILTER_TYPE_MAP: Record<FilterTab, string[] | null> = {
  all: null,
  unread: null,
  bookings: ["BOOKING_SCHEDULED", "BOOKING_CONFIRMED", "BOOKING_RESCHEDULED", "BOOKING_COMPLETED", "BOOKING_CANCELLED", "BOOKING_NO_SHOW"],
  requests: ["REQUEST", "REQUEST_STATUS_UPDATED", "REQUEST_SUBMITTED", "REQUEST_APPROVED", "REQUEST_REJECTED"],
  quotes: ["QUOTE", "QUOTE_SENT", "QUOTE_UPDATED"],
  messages: ["NEW_MESSAGE"],
}