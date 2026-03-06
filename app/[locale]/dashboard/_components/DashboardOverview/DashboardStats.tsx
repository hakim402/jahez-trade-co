'use client'

import Link from 'next/link'
import {
  PackageSearch, Video, MessageSquareQuote, Bell,
  TrendingUp, CheckCircle2, Clock, ArrowRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn }                from '@/lib/utils'
import type { ClientDashboardStats } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardStatsCardsProps {
  stats: ClientDashboardStats
}

type StatCard = {
  label:       string
  value:       number
  sublabel:    string
  subvalue:    number | string
  icon:        React.ElementType
  gradient:    string          // from-X to-Y tailwind gradient
  href:        string
  urgent?:     boolean         // highlight if > 0
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  const cards: StatCard[] = [
    {
      label:    'Active Requests',
      value:    stats.requests.active,
      sublabel: 'Total',
      subvalue: stats.requests.total,
      icon:     PackageSearch,
      gradient: 'from-indigo-500 to-purple-500',
      href:     '/dashboard/requests',
    },
    {
      label:    'Upcoming Calls',
      value:    stats.bookings.upcoming,
      sublabel: 'Completed',
      subvalue: stats.bookings.completed,
      icon:     Video,
      gradient: 'from-sky-500 to-cyan-500',
      href:     '/dashboard/video-bookings',
    },
    {
      label:    'Pending Quotes',
      value:    stats.quotes.pending,
      sublabel: 'Total quotes',
      subvalue: stats.quotes.total,
      icon:     MessageSquareQuote,
      gradient: 'from-amber-500 to-orange-500',
      href:     '/dashboard/requests',
      urgent:   stats.quotes.pending > 0,
    },
    {
      label:    'Notifications',
      value:    stats.notifications.unreadCount,
      sublabel: 'Requests done',
      subvalue: stats.requests.completed,
      icon:     Bell,
      gradient: 'from-rose-500 to-pink-500',
      href:     '/dashboard/notifications',
      urgent:   stats.notifications.unreadCount > 0,
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.label} card={card} />
      ))}
    </div>
  )
}

function StatCard({ card }: { card: StatCard }) {
  const Icon = card.icon

  return (
    <Link href={card.href} className="group block">
      <Card className={cn(
        'relative overflow-hidden border border-border/50 transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-0.5',
        card.urgent && card.value > 0 && 'ring-1 ring-amber-400/40 dark:ring-amber-500/30',
      )}>
        {/* Gradient background glow */}
        <div className={cn(
          'absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-10 blur-xl',
          `bg-linear-to-br ${card.gradient}`,
        )} />

        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            {/* Icon */}
            <div className={cn(
              'rounded-xl p-2 bg-linear-to-br text-white shadow-sm',
              card.gradient,
            )}>
              <Icon className="h-4 w-4" />
            </div>

            {/* Arrow on hover */}
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-all -translate-x-1 group-hover:translate-x-0 mt-0.5" />
          </div>

          {/* Main value */}
          <div className="mt-3">
            <p className={cn(
              'text-3xl font-bold tabular-nums tracking-tight',
              card.urgent && card.value > 0
                ? `bg-linear-to-br ${card.gradient} bg-clip-text text-transparent`
                : 'text-foreground',
            )}>
              {card.value}
            </p>
            <p className="text-sm font-medium text-foreground/80 mt-0.5">{card.label}</p>
          </div>

          {/* Sub-stat */}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/70">{card.subvalue}</span>
            <span>{card.sublabel}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}