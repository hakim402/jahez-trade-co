'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow, isPast } from 'date-fns'
import {
  MessageSquareQuote, ArrowRight, ExternalLink,
  Clock, AlertTriangle, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn }     from '@/lib/utils'
import {
  getQuoteStatusConfig, getRequestStatusConfig,
  formatCurrency, type RecentQuoteItem,
} from '../types'

// ─────────────────────────────────────────────────────────────────────────────

interface RecentQuotesProps {
  quotes: RecentQuoteItem[]
  total:  number
}

export function RecentQuotes({ quotes, total }: RecentQuotesProps) {
  const t = useTranslations('RecentQuotes')

  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4 text-amber-500" />
            {t('title')}
          </CardTitle>
          {total > 0 && (
            <Badge variant="secondary" className="font-mono text-xs h-5">{total}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {quotes.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-border/50">
            {quotes.map((q) => (
              <QuoteRow key={q.id} quote={q} />
            ))}
          </div>
        )}
      </CardContent>

      {quotes.length > 0 && (
        <CardFooter className="pt-3 pb-3">
          <Button asChild variant="ghost" size="sm" className="w-full h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5">
            <Link href="/dashboard/requests">
              {t('viewAll')}
              <ArrowRight className="h-3 w-3 rtl:rotate-180" />
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

function QuoteRow({ quote: q }: { quote: RecentQuoteItem }) {
  const t = useTranslations('RecentQuotes')
  const tQuote = useTranslations('QuoteStatus')
  const tRequest = useTranslations('RequestStatus')

  const quoteCfg   = getQuoteStatusConfig(q.status)
  const requestCfg = getRequestStatusConfig(q.request.status)
  const isExpiring = q.validUntil && !isPast(new Date(q.validUntil)) &&
    (new Date(q.validUntil).getTime() - Date.now()) < 1000 * 60 * 60 * 24 * 3  // < 3 days
  const isExpired  = q.validUntil && isPast(new Date(q.validUntil)) && q.status === 'SENT'
  const isPending  = q.status === 'SENT'

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors',
      isPending && !isExpired && 'bg-amber-50/50 dark:bg-amber-950/20',
    )}>
      {/* Status dot */}
      <div className="mt-1.5 shrink-0">
        <span className={cn('block h-2 w-2 rounded-full', quoteCfg.dot)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {formatCurrency(q.price, q.currency)}
            </p>
            {q.revision > 1 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <RefreshCw className="h-2 w-2" />
                {t('revision', { count: q.revision })}
              </span>
            )}
          </div>
          <Badge className={cn('shrink-0 text-[10px] h-5 px-1.5 border-0 font-medium', quoteCfg.color, quoteCfg.textColor)}>
            {tQuote(q.status)}
          </Badge>
        </div>

        {/* Request description */}
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
          {q.request.description?.slice(0, 60) ?? t('productRequest')}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {/* Sent time */}
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
          </span>

          {/* Expiry warning */}
          {isExpiring && (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              <AlertTriangle className="h-2.5 w-2.5" />
              {t('expires', { relative: formatDistanceToNow(new Date(q.validUntil!), { addSuffix: true }) })}
            </span>
          )}
          {isExpired && (
            <span className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400">
              <AlertTriangle className="h-2.5 w-2.5" />
              {t('expired')}
            </span>
          )}
        </div>

        {/* CTA for pending quotes */}
        {isPending && !isExpired && (
          <Button asChild size="sm" variant="default"
            className="h-6 text-[11px] mt-2 bg-linear-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0 px-2.5">
            <Link href="/dashboard/requests">
              {t('review')}
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  const t = useTranslations('RecentQuotes')
  return (
    <div className="py-10 flex flex-col items-center gap-3 text-center px-4">
      <div className="rounded-xl bg-muted p-3">
        <MessageSquareQuote className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{t('emptyTitle')}</p>
      <p className="text-xs text-muted-foreground/70">
        {t('emptyDescription')}
      </p>
    </div>
  )
}