// app/[locale]/dashboard/_components/RecentBookings.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Video } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'
import type { ClientDashboardStats } from '../types'

type RecentBooking = ClientDashboardStats['bookings']['recent'][0]

const bookingStatusColorMap: Record<string, string> = {
  REQUESTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  PROPOSED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  RESCHEDULED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  CANCELED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  NO_SHOW: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
}

interface RecentBookingsProps {
  bookings: RecentBooking[]
  total: number
}

export function RecentBookings({ bookings, total }: RecentBookingsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Video Calls</CardTitle>
        <Button variant="ghost" size="sm" asChild className="gap-1">
          <Link href="/dashboard/video-bookings">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">No bookings yet</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center">
                    <Video className="h-4 w-4 text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {booking.type} Call
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(booking.createdAt)}</span>
                      {booking.scheduledAt && (
                        <>
                          <span>•</span>
                          <span>Scheduled: {formatDate(booking.scheduledAt)} {formatTime(booking.scheduledAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Badge className={bookingStatusColorMap[booking.status]}>
                  {booking.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}