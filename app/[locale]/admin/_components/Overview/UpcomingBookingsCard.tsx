'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { format, isToday, isTomorrow } from 'date-fns'
import { Video, ArrowRight, CalendarDays, User2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { containerVariants, cardVariants } from '@/lib/motion'
import { getBookingStatus, type DashboardStats } from '../types'

type Booking = DashboardStats['bookings']['upcoming'][number]

interface UpcomingBookingsCardProps {
  bookings: Booking[]
}

function formatTime(dt: Date | null): string {
  if (!dt) return 'TBD'
  if (isToday(dt)) return `Today ${format(dt, 'h:mm a')}`
  if (isTomorrow(dt)) return `Tomorrow ${format(dt, 'h:mm a')}`
  return format(dt, 'MMM d, h:mm a')
}

const PROVIDER_LABELS: Record<string, string> = {
  ZOOM: 'Zoom',
  GOOGLE_MEET: 'Google Meet',
  WHATSAPP: 'WhatsApp',
  MICROSOFT_TEAMS: 'Teams',
  CUSTOM: 'Custom',
}

export function UpcomingBookingsCard({ bookings }: UpcomingBookingsCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className="border border-border/50 h-full overflow-hidden transition-all duration-200 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Video className="h-4 w-4 text-color" />
              Upcoming Calls
            </CardTitle>
            <Badge variant="secondary" className="font-mono text-xs h-5">
              {bookings.length}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {bookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-10 text-center text-sm text-muted-foreground"
            >
              No upcoming bookings
            </motion.div>
          ) : (
            <motion.div
              className="divide-y divide-border/40"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {bookings.map((b) => {
                const cfg = getBookingStatus(b.status)
                const typeLabel = b.type.charAt(0) + b.type.slice(1).toLowerCase()
                const initials = b.client ? (b.client.fullName ?? b.client.email).slice(0, 2).toUpperCase() : 'GU'
                const isNear =
                  b.scheduledAt &&
                  new Date(b.scheduledAt).getTime() - Date.now() < 1000 * 60 * 60 * 24

                return (
                  <motion.div
                    key={b.id}
                    variants={cardVariants}
                    whileHover={{ backgroundColor: 'rgba(123, 87, 252, 0.05)' }}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition-colors',
                      isNear && 'bg-sky-50/40 dark:bg-sky-950/20'
                    )}
                  >
                    <Avatar className="h-8 w-8 shrink-0 mt-0.5 ring-2 ring-background">
                      <AvatarFallback className="text-[11px] font-semibold bg-muted">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium leading-snug truncate">
                            {b.client ? (b.client.fullName ?? b.client.email) : 'Guest'}
                            {isNear && (
                              <Badge
                                variant="outline"
                                className="ml-1.5 text-[9px] h-4 px-1 border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50"
                              >
                                <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                                Soon
                              </Badge>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {typeLabel} Call · {b.durationMinutes} min
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            'shrink-0 text-[10px] h-5 px-1.5 border-0',
                            cfg.color,
                            cfg.textColor
                          )}
                        >
                          {cfg.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CalendarDays className="h-2.5 w-2.5" />
                          {formatTime(b.scheduledAt ? new Date(b.scheduledAt) : null)}
                        </span>
                        {b.meetingProvider && (
                          <span className="text-[11px] text-muted-foreground">
                            {PROVIDER_LABELS[b.meetingProvider] ?? b.meetingProvider}
                          </span>
                        )}
                        {b.handledBy && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <User2 className="h-2.5 w-2.5" />
                            {b.handledBy.fullName ?? b.handledBy.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </CardContent>

        <CardFooter className="pt-3 pb-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs text-muted-foreground gap-1.5 transition-all hover:gap-2.5"
          >
            <Link href="/admin/video-bookings">
              View all bookings <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}