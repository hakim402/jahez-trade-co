import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatTime } from '@/lib/utils'
import Link from 'next/link'

export function RecentBookings({ bookings }: { bookings: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Recent Bookings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {booking.user.fullName || booking.user.email} • {booking.type}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(booking.scheduledAt)} at {formatTime(booking.scheduledAt)}
              </p>
            </div>
            <Badge variant="outline">{booking.status}</Badge>
          </div>
        ))}
        {bookings.length === 0 && (
          <p className="text-sm text-muted-foreground">No recent bookings</p>
        )}
        <Link
          href="/admin/video-bookings"
          className="text-sm text-primary hover:underline block mt-2"
        >
          View all bookings →
        </Link>
      </CardContent>
    </Card>
  )
}