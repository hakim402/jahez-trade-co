// app/[locale]/dashboard/(routes)/request/_components/types.ts

import {
  RequestStatus, QuoteStatus,
  User, Quote, File as PrismaFile,
  RequestStatusHistory, QuoteStatusHistory,
} from '@prisma/client'
import type { LucideIcon } from 'lucide-react'
import {
  FileText, FileImage, FileSpreadsheet, FileType,
  File, Archive,
  Clock, Eye, FileCheck, CheckCircle2, XCircle,
  Factory, Truck, CheckSquare,
  PenLine, Send, ThumbsUp, ThumbsDown,
} from 'lucide-react'

// ─── Serialised Decimal / BigInt fields ───────────────────────────────────

export type TransformedQuote = Omit<Quote, 'price'> & {
  price: string
  files: TransformedFile[]
  createdBy: Pick<User, 'id' | 'email' | 'fullName'>
}

export type TransformedFile = Omit<PrismaFile, 'fileSize'> & {
  fileSize: number | null
}

export type ClientRequestWithRelations = {
  id: string
  clientId: string
  productLink: string | null
  description: string | null
  quantity: number
  shippingCountry: string
  customNotes: string | null
  status: RequestStatus
  priority: number
  acceptedQuoteId: string | null
  acceptedQuote: TransformedQuote | null
  aiEstimatedPrice: string | null
  aiConfidence: number | null
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
  quotes: TransformedQuote[]
  files: TransformedFile[]
  statusHistory: (RequestStatusHistory & {
    changedBy: Pick<User, 'id' | 'email' | 'fullName'>
  })[]
}

// ─── Plan info ─────────────────────────────────────────────────────────────

export type UserPlanInfo = {
  planName: string
  limit: number        // Infinity = unlimited
  usedCount: number
  hasAccess: boolean
}

// ─── Filter / pagination ──────────────────────────────────────────────────

export type ClientFiltersType = {
  page: number
  pageSize: number
  status?: RequestStatus
}

export type PaginationInfo = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

// ─── File helpers ─────────────────────────────────────────────────────────

export const ALLOWED_EXTENSIONS = [
  'pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'csv', 'zip',
] as const

export const MAX_FILE_SIZE_MB = 20

export const FILE_TYPE_ICONS: Record<string, LucideIcon> = {
  pdf: FileText,
  doc: FileType, docx: FileType,
  xls: FileSpreadsheet, xlsx: FileSpreadsheet,
  ppt: FileSpreadsheet, pptx: FileSpreadsheet,
  png: FileImage, jpg: FileImage, jpeg: FileImage,
  gif: FileImage, webp: FileImage,
  txt: FileText,
  csv: FileSpreadsheet,
  zip: Archive,
}

export function getFileIcon(filename: string): LucideIcon {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return FILE_TYPE_ICONS[ext] ?? File
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Status visual config ─────────────────────────────────────────────────

export type StatusVisual = {
  label: string
  description: string
  icon: LucideIcon
  chip: string   // ring+bg+text tailwind classes
  dot: string   // bg-* class for the indicator dot
  gradient: string   // for KPI cards etc.
}

export const STATUS_CONFIG: Record<RequestStatus, StatusVisual> = {
  SUBMITTED: {
    label: 'Submitted',
    description: 'We received your request and will review it soon.',
    icon: Clock,
    chip: 'bg-blue-500/10 text-blue-400 border-blue-500/20 ring-blue-400/20',
    dot: 'bg-blue-400',
    gradient: 'from-blue-500 to-cyan-500',
  },
  IN_REVIEW: {
    label: 'In Review',
    description: 'Our sourcing team is reviewing your request.',
    icon: Eye,
    chip: 'bg-amber-500/10 text-amber-400 border-amber-500/20 ring-amber-400/20',
    dot: 'bg-amber-400',
    gradient: 'from-amber-400 to-orange-500',
  },
  QUOTED: {
    label: 'Quoted',
    description: 'A quote has been prepared — check the Quotes tab.',
    icon: FileCheck,
    chip: 'bg-violet-500/10 text-violet-400 border-violet-500/20 ring-violet-400/20',
    dot: 'bg-violet-400',
    gradient: 'from-violet-500 to-purple-600',
  },
  APPROVED: {
    label: 'Approved',
    description: 'You have accepted a quote. Production will begin soon.',
    icon: CheckCircle2,
    chip: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ring-emerald-400/20',
    dot: 'bg-emerald-400',
    gradient: 'from-emerald-400 to-teal-500',
  },
  REJECTED: {
    label: 'Rejected',
    description: 'This request was not accepted. Contact support for details.',
    icon: XCircle,
    chip: 'bg-red-500/10 text-red-400 border-red-500/20 ring-red-400/20',
    dot: 'bg-red-400',
    gradient: 'from-red-500 to-rose-500',
  },
  IN_PRODUCTION: {
    label: 'In Production',
    description: 'Your order is being manufactured.',
    icon: Factory,
    chip: 'bg-orange-500/10 text-orange-400 border-orange-500/20 ring-orange-400/20',
    dot: 'bg-orange-400',
    gradient: 'from-orange-400 to-amber-500',
  },
  SHIPPED: {
    label: 'Shipped',
    description: 'Your order has shipped.',
    icon: Truck,
    chip: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 ring-cyan-400/20',
    dot: 'bg-cyan-400',
    gradient: 'from-cyan-400 to-blue-400',
  },
  COMPLETED: {
    label: 'Completed',
    description: 'Order complete. Thank you!',
    icon: CheckSquare,
    chip: 'bg-green-500/10 text-green-400 border-green-500/20 ring-green-400/20',
    dot: 'bg-green-400',
    gradient: 'from-green-400 to-emerald-500',
  },
}

// ─── Quote status visual ──────────────────────────────────────────────────

export const QUOTE_STATUS_CONFIG: Record<string, { label: string; icon: LucideIcon; chip: string }> = {
  DRAFT: { label: 'Draft', icon: PenLine, chip: 'bg-muted/30 text-muted-foreground border-border/20' },
  SENT: { label: 'Sent', icon: Send, chip: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  ACCEPTED: { label: 'Accepted', icon: ThumbsUp, chip: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  REJECTED: { label: 'Rejected', icon: ThumbsDown, chip: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export const ALL_CLIENT_STATUSES = Object.keys(STATUS_CONFIG) as RequestStatus[]