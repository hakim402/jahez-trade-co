import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export function RecentRequests({ requests }: { requests: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Recent Requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {req.productLink ? (
                  <a href={req.productLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {new URL(req.productLink).hostname}
                  </a>
                ) : (
                  'No link'
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {req.user.fullName || req.user.email} • {formatDate(req.createdAt)}
              </p>
            </div>
            <Badge variant="outline">{req.status}</Badge>
          </div>
        ))}
        {requests.length === 0 && (
          <p className="text-sm text-muted-foreground">No recent requests</p>
        )}
        <Link
          href="/admin/client-requests"
          className="text-sm text-primary hover:underline block mt-2"
        >
          View all requests →
        </Link>
      </CardContent>
    </Card>
  )
}