// app/[locale]/dashboard/(routes)/request/_components/types.ts

import {
  RequestStatus, QuoteStatus,
  User, Quote, File as PrismaFile,
  RequestStatusHistory, QuoteStatusHistory,
} from '@prisma/client'

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
  id:               string
  clientId:         string
  productLink:      string | null
  description:      string | null
  quantity:         number
  shippingCountry:  string
  customNotes:      string | null
  status:           RequestStatus
  priority:         number
  acceptedQuoteId:  string | null
  acceptedQuote:    TransformedQuote | null
  aiEstimatedPrice: string | null
  aiConfidence:     number | null
  isDeleted:        boolean
  createdAt:        Date
  updatedAt:        Date
  quotes:           TransformedQuote[]
  files:            TransformedFile[]
  statusHistory:    (RequestStatusHistory & {
    changedBy: Pick<User, 'id' | 'email' | 'fullName'>
  })[]
}

// ─── Plan info ─────────────────────────────────────────────────────────────

export type UserPlanInfo = {
  planName:   string
  limit:      number        // Infinity = unlimited
  usedCount:  number
  hasAccess:  boolean
}

// ─── Filter / pagination ──────────────────────────────────────────────────

export type ClientFiltersType = {
  page:     number
  pageSize: number
  status?:  RequestStatus
}

export type PaginationInfo = {
  page:       number
  pageSize:   number
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

export const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
  ppt: '📊', pptx: '📊', png: '🖼️', jpg: '🖼️', jpeg: '🖼️',
  gif: '🖼️', webp: '🖼️', txt: '📃', csv: '📊', zip: '🗜️',
}

export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return FILE_TYPE_ICONS[ext] ?? '📎'
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Status display ────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; description: string }> = {
  SUBMITTED:     { label: 'Submitted',     color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',          description: 'We received your request and will review it soon.' },
  IN_REVIEW:     { label: 'In Review',     color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       description: 'Our sourcing team is reviewing your request.' },
  QUOTED:        { label: 'Quoted',        color: 'bg-violet-500/10 text-violet-400 border-violet-500/20',    description: 'A quote has been prepared — check the Quotes tab.' },
  APPROVED:      { label: 'Approved',      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', description: 'You have accepted a quote. Production will begin soon.' },
  REJECTED:      { label: 'Rejected',      color: 'bg-red-500/10 text-red-400 border-red-500/20',             description: 'This request was not accepted. Contact support for details.' },
  IN_PRODUCTION: { label: 'In Production', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',   description: 'Your order is being manufactured.' },
  SHIPPED:       { label: 'Shipped',       color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',          description: 'Your order has shipped.' },
  COMPLETED:     { label: 'Completed',     color: 'bg-green-500/10 text-green-400 border-green-500/20',       description: 'Order complete. Thank you!' },
}