'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  PackageSearch, ArrowRight, ExternalLink, CheckCircle2,
  Clock, Tag, Globe, Hash,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn }     from '@/lib/utils'
import {
  getRequestStatusConfig, getQuoteStatusConfig,
  formatCurrency,
  type RecentRequestItem,
} from '../types'

// ─────────────────────────────────────────────────────────────────────────────

interface RecentRequestsProps {
  requests: RecentRequestItem[]
  total:    number
}

export function RecentRequests({ requests, total }: RecentRequestsProps) {
  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <PackageSearch className="h-4 w-4 text-indigo-500" />
            Recent Requests
          </CardTitle>
          {total > 0 && (
            <Badge variant="secondary" className="font-mono text-xs h-5">
              {total}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {requests.length === 0 ? (
          <EmptyState
            message="No requests yet"
            cta="Submit your first request"
            href="/dashboard/requests/new"
          />
        ) : (
          <div className="divide-y divide-border/50">
            {requests.map((r) => (
              <RequestRow key={r.id} request={r} />
            ))}
          </div>
        )}
      </CardContent>

      {requests.length > 0 && (
        <CardFooter className="pt-3 pb-3">
          <Button asChild variant="ghost" size="sm" className="w-full h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5">
            <Link href="/dashboard/requests">
              View all requests
              <ArrowRight className="h-3 w-3" />
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

function RequestRow({ request: r }: { request: RecentRequestItem }) {
  const statusCfg = getRequestStatusConfig(r.status)
  const quoteCfg  = r.latestQuote ? getQuoteStatusConfig(r.latestQuote.status) : null

  return (
    <Link
      href="/dashboard/requests"
      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group"
    >
      {/* Status dot */}
      <div className="mt-1.5 shrink-0">
        <span className={cn('block h-2 w-2 rounded-full', statusCfg.dot)} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          {/* Description */}
          <p className="text-sm font-medium leading-snug line-clamp-1 text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {r.description?.slice(0, 60) ?? 'Product Request'}
          </p>

          {/* Status badge */}
          <Badge
            className={cn('shrink-0 text-[10px] h-5 px-1.5 border-0 font-medium', statusCfg.color, statusCfg.textColor)}
          >
            {statusCfg.label}
          </Badge>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Hash className="h-2.5 w-2.5" />
            Qty {r.quantity}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Globe className="h-2.5 w-2.5" />
            {r.shippingCountry}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {formatDistanceToNow(new Date(r.updatedAt), { addSuffix: true })}
          </span>
        </div>

        {/* Quote pill */}
        {r.latestQuote && quoteCfg && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Tag className="h-2.5 w-2.5 text-muted-foreground" />
            <span className={cn('text-[11px] font-semibold', quoteCfg.textColor)}>
              {formatCurrency(r.latestQuote.price, r.latestQuote.currency)}
            </span>
            <Badge className={cn('text-[9px] h-4 px-1 border-0', quoteCfg.color, quoteCfg.textColor)}>
              {quoteCfg.label}
            </Badge>
            {r.hasAcceptedQuote && (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            )}
          </div>
        )}
        {r.quotesCount > 0 && !r.latestQuote && (
          <p className="text-[11px] text-muted-foreground mt-1">
            {r.quotesCount} quote{r.quotesCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ message, cta, href }: { message: string; cta: string; href: string }) {
  return (
    <div className="py-10 flex flex-col items-center gap-3 text-center px-4">
      <div className="rounded-xl bg-muted p-3">
        <PackageSearch className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5">
        <Link href={href}>
          {cta}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  )
}