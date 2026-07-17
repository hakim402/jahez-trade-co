'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { containerVariants, cardVariants } from '@/lib/motion'
import type { PendingWorkload } from '../types'

interface PendingWorkloadCardProps {
  workload: PendingWorkload
}

export function PendingWorkloadCard({ workload }: PendingWorkloadCardProps) {
  const total =
    workload.requestsPendingReview +
    workload.quotesAwaitingApproval +
    workload.bookingsPendingConfirmation +
    workload.bookingsProposed

  const items = [
    {
      label: 'Requests pending review',
      count: workload.requestsPendingReview,
      href: '/admin/product-requests?status=IN_REVIEW',
      urgency: workload.requestsPendingReview > 5 ? 'high' : workload.requestsPendingReview > 0 ? 'medium' : 'none',
      cta: 'Review',
    },
    {
      label: 'Quotes awaiting approval',
      count: workload.quotesAwaitingApproval,
      href: '/admin/product-requests',
      urgency: workload.quotesAwaitingApproval > 0 ? 'medium' : 'none',
      cta: 'View',
    },
    {
      label: 'Bookings to schedule',
      count: workload.bookingsPendingConfirmation,
      href: '/admin/video-bookings?status=REQUESTED',
      urgency: workload.bookingsPendingConfirmation > 0 ? 'high' : 'none',
      cta: 'Schedule',
    },
    {
      label: 'Bookings proposed',
      count: workload.bookingsProposed,
      href: '/admin/video-bookings?status=PROPOSED',
      urgency: 'none' as const,
      cta: 'View',
    },
  ] as const

  if (total === 0) return null

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className="border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-950/20 overflow-hidden">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Action Required
            <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold px-1">
              {total}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <motion.div
            className="space-y-2"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {items.filter(i => i.count > 0).map((item) => (
              <motion.div
                key={item.label}
                variants={cardVariants} // reuse cardVariants for each item
                className={cn(
                  'flex items-center justify-between gap-3 rounded-lg px-3 py-2 border',
                  item.urgency === 'high'
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200/60 dark:border-red-800/40'
                    : 'bg-background/60 border-border/40',
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    'h-2 w-2 rounded-full shrink-0',
                    item.urgency === 'high' ? 'bg-red-500' : 'bg-amber-500',
                  )} />
                  <span className="text-xs text-foreground/80 leading-tight">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    'text-sm font-bold tabular-nums',
                    item.urgency === 'high' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400',
                  )}>
                    {item.count}
                  </span>
                  <Button
                    asChild size="sm" variant="outline"
                    className={cn(
                      'h-6 text-[11px] px-2 border transition-all hover:scale-105',
                      item.urgency === 'high'
                        ? 'border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400'
                        : 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400',
                    )}
                  >
                    <Link href={item.href}>
                      {item.cta} <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}