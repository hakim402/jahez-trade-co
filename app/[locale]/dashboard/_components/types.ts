// app/[locale]/dashboard/_components/types.ts
import type { ClientDashboardStats } from '../actions'

export type { ClientDashboardStats }

export type Notification = {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date
  metadata: any
}