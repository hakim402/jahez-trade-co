// app/[locale]/dashboard/_components/RecentRequests.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Package } from 'lucide-react'
import Link from 'next/link'
import { formatDate, truncate } from '@/lib/utils'
import type { ClientDashboardStats } from '../types'

type RecentRequest = ClientDashboardStats['requests']['recent'][0]

interface RecentRequestsProps {
  requests: RecentRequest[]
  total: number
}

const statusColorMap: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  QUOTED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  IN_PRODUCTION: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  SHIPPED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
}

export function RecentRequests({ requests, total }: RecentRequestsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Requests</CardTitle>
        <Button variant="ghost" size="sm" asChild className="gap-1">
          <Link href="/dashboard/my-requests">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">No requests yet</p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center">
                    <Package className="h-4 w-4 text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {request.productLink
                        ? truncate(request.productLink, 30)
                        : 'No link provided'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(request.createdAt)}</span>
                      <span>•</span>
                      <span>{request.quoteCount} quotes</span>
                      <span>•</span>
                      <span>{request.fileCount} files</span>
                    </div>
                  </div>
                </div>
                <Badge className={statusColorMap[request.status]}>
                  {request.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}