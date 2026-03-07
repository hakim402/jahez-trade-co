'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'   // <-- added
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns'
import {
  Video, ArrowRight, ExternalLink, CalendarDays,
  Clock, Link2, Lock, ExternalLink as MeetingIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn }     from '@/lib/utils'
import { getBookingStatusConfig, type RecentBookingItem } from '../types'

// ─────────────────────────────────────────────────────────────────────────────

interface RecentBookingsProps {
  bookings: RecentBookingItem[]
  total:    number
}

export function RecentBookings({ bookings, total }: RecentBookingsProps) {
  const t = useTranslations('RecentBookings')

  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Video className="h-4 w-4 text-sky-500" />
            {t('title')}
          </CardTitle>
          {total > 0 && (
            <Badge variant="secondary" className="font-mono text-xs h-5">
              {total}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {bookings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-border/50">
            {bookings.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
        )}
      </CardContent>

      {bookings.length > 0 && (
        <CardFooter className="pt-3 pb-3">
          <Button asChild variant="ghost" size="sm" className="w-full h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5">
            <Link href="/dashboard/video-bookings">
              {t('viewAll')}
              <ArrowRight className="h-3 w-3 rtl:rotate-180" />   {/* flip in RTL */}
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROW
// ─────────────────────────────────────────────────────────────────────────────

function formatScheduledTime(dt: Date | null, t: (key: string) => string): { primary: string; secondary: string; urgent: boolean } {
  if (!dt) return { primary: t('timeTbd'), secondary: t('awaitingSchedule'), urgent: false }

  const now    = new Date()
  const urgent = !isPast(dt) && (dt.getTime() - now.getTime()) < 1000 * 60 * 60 * 24 // < 24h

  if (isToday(dt))    return { primary: format(dt, 'h:mm a'),               secondary: t('today'),    urgent }
  if (isTomorrow(dt)) return { primary: format(dt, 'h:mm a'),               secondary: t('tomorrow'), urgent: false }
  return {
    primary:   format(dt, 'MMM d, h:mm a'),
    secondary: formatDistanceToNow(dt, { addSuffix: true }),
    urgent:    false,
  }
}

function BookingRow({ booking: b }: { booking: RecentBookingItem }) {
  const t = useTranslations('RecentBookings')
  const tStatus = useTranslations('BookingStatus')
  const tType = useTranslations('BookingType')

  const cfg      = getBookingStatusConfig(b.status)
  const time     = formatScheduledTime(b.scheduledAt ? new Date(b.scheduledAt) : null, t)
  const typeLabel = tType(b.type)

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group">
      {/* Status dot */}
      <div className="mt-1.5 shrink-0">
        <span className={cn('block h-2 w-2 rounded-full', cfg.dot)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">
            {typeLabel} Call   {/* "Call" is not translated – it's a generic word; you can also translate if needed */}
            {time.urgent && (
              <span className="ml-2 inline-flex items-center text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-100 dark:bg-amber-950 rounded px-1 py-0.5">
                {t('soon')}
              </span>
            )}
          </p>
          <Badge className={cn('shrink-0 text-[10px] h-5 px-1.5 border-0 font-medium', cfg.color, cfg.textColor)}>
            {tStatus(b.status)}
          </Badge>
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5 mt-1">
          <CalendarDays className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
          <span className={cn(
            'text-[11px] font-medium',
            time.urgent ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
          )}>
            {time.primary}
          </span>
          <span className="text-[11px] text-muted-foreground">·</span>
          <span className="text-[11px] text-muted-foreground">{time.secondary}</span>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <Clock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
          <span className="text-[11px] text-muted-foreground">
            {t('minutes', { count: b.durationMinutes })}
          </span>

          {/* Provider */}
          {b.meetingProvider && (
            <>
              <span className="text-muted-foreground text-[11px]">·</span>
              <span className="text-[11px] text-muted-foreground capitalize">
                {b.meetingProvider.toLowerCase().replace(/_/g, ' ')}
              </span>
            </>
          )}
        </div>

        {/* Meeting link */}
        {b.meetingLink && ['PROPOSED', 'CONFIRMED'].includes(b.status) && (
          <a
            href={b.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            <Link2 className="h-2.5 w-2.5" />
            {t('joinMeeting')}
            <MeetingIcon className="h-2.5 w-2.5" />
          </a>
        )}
        {b.meetingPassword && (
          <span className="inline-flex items-center gap-1 ml-2 text-[11px] text-muted-foreground">
            <Lock className="h-2.5 w-2.5" />
            {t('passwordSet')}
          </span>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  const t = useTranslations('RecentBookings')

  return (
    <div className="py-10 flex flex-col items-center gap-3 text-center px-4">
      <div className="rounded-xl bg-muted p-3">
        <Video className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{t('emptyTitle')}</p>
      <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5">
        <Link href="/dashboard/video-bookings/new">
          {t('emptyAction')}
          <ExternalLink className="h-3 w-3 rtl:rotate-180" />   {/* flip in RTL */}
        </Link>
      </Button>
    </div>
  )
}