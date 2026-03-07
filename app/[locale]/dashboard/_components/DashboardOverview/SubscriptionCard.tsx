'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Crown, Zap, Clock, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge }    from '@/components/ui/badge'
import { Button }   from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn }       from '@/lib/utils'
import { format }   from 'date-fns'
import { formatCurrency, formatLimit } from '../types'
import type { SubscriptionInfo } from '../types'

// ─────────────────────────────────────────────────────────────────────────────

interface SubscriptionCardProps {
  subscription: SubscriptionInfo
}

export function SubscriptionCard({ subscription: s }: SubscriptionCardProps) {
  const t = useTranslations('SubscriptionCard')
  const tInterval = useTranslations('Interval')

  const requestPct  = s.requestLimit === Infinity ? 0 : Math.min((s.requestsUsed / s.requestLimit) * 100, 100)
  const bookingPct  = s.bookingLimit === Infinity ? 0 : Math.min((s.bookingsUsed / s.bookingLimit) * 100, 100)
  const isLow       = (pct: number) => pct >= 80
  const isUnlimited = (limit: number) => limit === Infinity || limit > 999

  return (
    <Card className="border border-border/50 overflow-hidden">
      {/* Top linear strip */}
      <div className={cn(
        'h-1 w-full',
        s.hasAccess
          ? s.isDefaultPlan
            ? 'bg-linear-to-r from-slate-400 to-slate-500'
            : 'bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500'
          : 'bg-linear-to-r from-red-400 to-rose-500',
      )} />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Plan icon */}
            <div className={cn(
              'rounded-xl p-2 shadow-sm',
              s.isDefaultPlan
                ? 'bg-slate-100 dark:bg-slate-800'
                : 'bg-linear-to-br from-indigo-500 to-purple-500',
            )}>
              {s.isDefaultPlan
                ? <Zap className="h-4 w-4 text-slate-500" />
                : <Crown className="h-4 w-4 text-white" />}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">{s.planName}</CardTitle>
                {s.isTrial && (
                  <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600 dark:text-amber-400 h-4 px-1.5">
                    {t('trial')}
                  </Badge>
                )}
                {!s.hasAccess && (
                  <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                    {t('inactive')}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {s.billingEnabled
                  ? s.hasAccess
                    ? s.isDefaultPlan
                      ? t('freePlan')
                      : t('price', { 
                          price: formatCurrency(s.planAmount, s.currency), 
                          interval: tInterval(s.interval ?? 'month')
                        })
                    : t('noActive')
                  : t('allUnlocked')}
              </p>
            </div>
          </div>

          {/* Billing badge / dates */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {s.isTrial && s.trialEndsAt && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Clock className="h-3 w-3" />
                {t('trialEnds', { date: format(new Date(s.trialEndsAt), 'MMM d') })}
              </span>
            )}
            {!s.isTrial && s.periodEndsAt && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {t('renews', { date: format(new Date(s.periodEndsAt), 'MMM d, yyyy') })}
              </span>
            )}
            {s.billingEnabled && s.isDefaultPlan && (
              <Button asChild size="sm" variant="default" className="h-7 text-xs bg-linear-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0">
                <Link href="/dashboard/billing">
                  {t('upgrade')}
                  <ExternalLink className="ms-1 h-3 w-3 rtl:rotate-180" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Requests usage */}
          <UsageBar
            label={t('productRequests')}
            used={s.requestsUsed}
            limit={s.requestLimit}
            pct={requestPct}
            isUnlimited={isUnlimited(s.requestLimit)}
            isLow={isLow(requestPct)}
          />
          {/* Bookings usage */}
          <UsageBar
            label={t('videoBookings')}
            used={s.bookingsUsed}
            limit={s.bookingLimit}
            pct={bookingPct}
            isUnlimited={isUnlimited(s.bookingLimit)}
            isLow={isLow(bookingPct)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// USAGE BAR
// ─────────────────────────────────────────────────────────────────────────────

function UsageBar({
  label, used, limit, pct, isUnlimited, isLow,
}: {
  label: string; used: number; limit: number; pct: number
  isUnlimited: boolean; isLow: boolean
}) {
  const t = useTranslations('SubscriptionCard')

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className={cn(
          'font-semibold tabular-nums',
          isLow && !isUnlimited ? 'text-amber-600 dark:text-amber-400' : 'text-foreground/80',
        )}>
          {used}
          {!isUnlimited && (
            <span className="text-muted-foreground font-normal"> / {limit}</span>
          )}
          {isUnlimited && (
            <span className="text-muted-foreground font-normal"> / {t('unlimited')}</span>
          )}
        </span>
      </div>

      {isUnlimited ? (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-full bg-linear-to-r from-indigo-400 to-purple-400 rounded-full opacity-40" />
        </div>
      ) : (
        <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              pct >= 100
                ? 'bg-red-500'
                : pct >= 80
                  ? 'bg-amber-500'
                  : 'bg-linear-to-r from-indigo-500 to-purple-500',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {isLow && !isUnlimited && pct < 100 && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <AlertTriangle className="h-2.5 w-2.5" />
          {t('approachingLimit')}
        </p>
      )}
      {pct >= 100 && (
        <p className="text-[10px] text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertTriangle className="h-2.5 w-2.5" />
          {t('limitReached')}
        </p>
      )}
    </div>
  )
}