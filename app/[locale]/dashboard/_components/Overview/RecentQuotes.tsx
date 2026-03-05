// app/[locale]/dashboard/_components/RecentQuotes.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ClientDashboardStats } from '../types'

type RecentQuote = ClientDashboardStats['quotes']['recent'][0]

const quoteStatusColorMap: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  ACCEPTED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

interface RecentQuotesProps {
  quotes: RecentQuote[]
  total: number
}

export function RecentQuotes({ quotes, total }: RecentQuotesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Quotes</CardTitle>
        <Button variant="ghost" size="sm" asChild className="gap-1">
          <Link href="/dashboard/my-requests">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {quotes.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">No quotes yet</p>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {formatCurrency(quote.price, quote.currency)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(quote.createdAt)}</span>
                      <span>•</span>
                      <span className="truncate">
                        For: {quote.request.productLink ? 'Request' : 'Request'}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge className={quoteStatusColorMap[quote.status]}>
                  {quote.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}