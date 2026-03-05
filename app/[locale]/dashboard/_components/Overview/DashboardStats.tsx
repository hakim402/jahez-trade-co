// app/[locale]/dashboard/_components/DashboardStatsCards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Video, FileText, File } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClientDashboardStats } from '../types'

interface StatsCardsProps {
  stats: ClientDashboardStats
}

const cardConfig = [
  {
    title: 'Total Requests',
    value: (s: ClientDashboardStats) => s.requests.total,
    icon: Package,
    gradient: 'gradient-purple-blue',
  },
  {
    title: 'Video Bookings',
    value: (s: ClientDashboardStats) => s.bookings.total,
    icon: Video,
    gradient: 'gradient-purple-pink',
  },
  {
    title: 'Quotes Received',
    value: (s: ClientDashboardStats) => s.quotes.total,
    icon: FileText,
    gradient: 'gradient-blue-cyan',
  },
  {
    title: 'Files Uploaded',
    value: (s: ClientDashboardStats) => s.files.total,
    icon: File,
    gradient: 'gradient-amber-orange',
  },
]

export function DashboardStatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cardConfig.map(({ title, value, icon: Icon, gradient }) => (
        <Card key={title} className="relative overflow-hidden card-hover">
          <div className={cn('absolute inset-0 opacity-10', gradient)} />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <Icon className="h-4 w-4 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value(stats)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total count
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}