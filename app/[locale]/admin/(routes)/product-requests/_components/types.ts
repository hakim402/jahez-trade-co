// app/[locale]/admin/(routes)/product-requests/_components/types.ts

import {
  User,
  Quote,
  File as PrismaFile,
  RequestStatusHistory,
  QuoteStatusHistory,
  AISuggestion,
  RequestStatus,
  QuoteStatus,
} from '@prisma/client'
import type { LucideIcon } from 'lucide-react'
import {
  FileText, FileImage, FileSpreadsheet,
  FileType2, File, Archive,
} from 'lucide-react'

// ─── Serialised Decimal fields ─────────────────────────────────────────────

export type TransformedQuote = Omit<Quote, 'price'> & {
  price: string
  files: TransformedFile[]
  statusHistory: (QuoteStatusHistory & {
    changedBy: Pick<User, 'id' | 'email' | 'fullName'>
  })[]
  createdBy: Pick<User, 'id' | 'email' | 'fullName'>
}

export type TransformedFile = Omit<PrismaFile, 'fileSize'> & {
  fileSize: number | null
}

export type TransformedAISuggestion = Omit<AISuggestion, 'estimatedPrice'> & {
  estimatedPrice: string
}

export type RequestWithRelations = {
  id: string
  clientId: string
  client: Pick<User, 'id' | 'email' | 'fullName' | 'avatarUrl' | 'phone'>
  productLink: string | null
  description: string | null
  quantity: number
  shippingCountry: string
  customNotes: string | null
  status: RequestStatus
  priority: number
  acceptedQuoteId: string | null
  acceptedQuote: TransformedQuote | null
  aiParsedData: Record<string, unknown> | null
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
  aiSuggestions: TransformedAISuggestion[]
  _count?: { quotes: number; files: number }
}

// ─── Filter / pagination ───────────────────────────────────────────────────

export type RequestFiltersType = {
  page: number
  pageSize: number
  status?: RequestStatus
  priority?: number
  clientEmail?: string
  search?: string
  createdAtFrom?: Date
  createdAtTo?: Date
}

export type PaginationInfo = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

// ─── Upload helpers ────────────────────────────────────────────────────────

export const ALLOWED_EXTENSIONS = [
  'pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'csv', 'zip',
] as const

export const MAX_FILE_SIZE_MB = 20

// Lucide icon components — renders with theme color, scales with text, dark-mode safe
export const FILE_TYPE_ICONS: Record<string, LucideIcon> = {
  pdf: FileText,
  doc: FileType2, docx: FileType2,
  xls: FileSpreadsheet, xlsx: FileSpreadsheet,
  ppt: FileSpreadsheet, pptx: FileSpreadsheet,
  png: FileImage, jpg: FileImage, jpeg: FileImage, gif: FileImage, webp: FileImage,
  txt: FileText,
  csv: FileSpreadsheet,
  zip: Archive,
}

/**
 * Returns a Lucide icon component for the given filename extension.
 * Usage: const Icon = getFileIcon(filename); <Icon size={14} className="..." />
 */
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