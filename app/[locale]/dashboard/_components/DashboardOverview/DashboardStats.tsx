'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'   // <-- added
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
  labelKey:    string          // translation key for the main label
  value:       number
  sublabelKey: string          // translation key for the sublabel
  subvalue:    number | string
  icon:        React.ElementType
  gradient:    string
  href:        string
  urgent?:     boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  const t = useTranslations('DashboardStats')

  const cards: StatCard[] = [
    {
      labelKey:    'activeRequests',
      value:       stats.requests.active,
      sublabelKey: 'total',
      subvalue:    stats.requests.total,
      icon:        PackageSearch,
      gradient:    'from-indigo-500 to-purple-500',
      href:        '/dashboard/requests',
    },
    {
      labelKey:    'upcomingCalls',
      value:       stats.bookings.upcoming,
      sublabelKey: 'completed',
      subvalue:    stats.bookings.completed,
      icon:        Video,
      gradient:    'from-sky-500 to-cyan-500',
      href:        '/dashboard/bookings',
    },
    {
      labelKey:    'pendingQuotes',
      value:       stats.quotes.pending,
      sublabelKey: 'totalQuotes',
      subvalue:    stats.quotes.total,
      icon:        MessageSquareQuote,
      gradient:    'from-amber-500 to-orange-500',
      href:        '/dashboard/consulting',
      urgent:      stats.quotes.pending > 0,
    },
    {
      labelKey:    'notifications',
      value:       stats.notifications.unreadCount,
      sublabelKey: 'requestsDone',
      subvalue:    stats.requests.completed,
      icon:        Bell,
      gradient:    'from-rose-500 to-pink-500',
      href:        '/dashboard/notifications',
      urgent:      stats.notifications.unreadCount > 0,
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.labelKey} card={card} />
      ))}
    </div>
  )
}

function StatCard({ card }: { card: StatCard }) {
  const t = useTranslations('DashboardStats')
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

            {/* Arrow – flipped in RTL */}
            <ArrowRight className={cn(
              'h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-all -translate-x-1 group-hover:translate-x-0 mt-0.5',
              'rtl:rotate-180'   // flip in RTL
            )} />
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
            <p className="text-sm font-medium text-foreground/80 mt-0.5">{t(card.labelKey)}</p>
          </div>

          {/* Sub-stat */}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/70">{card.subvalue}</span>
            <span>{t(card.sublabelKey)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}