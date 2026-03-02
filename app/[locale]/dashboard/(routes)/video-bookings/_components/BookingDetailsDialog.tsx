'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatTime } from '@/lib/utils'
import type { ClientBookingWithRelations } from './types'

const statusColorMap: Record<string, string> = {
  REQUESTED: 'bg-blue-100 text-blue-800',
  PROPOSED: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  RESCHEDULED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELED: 'bg-gray-100 text-gray-800',
  NO_SHOW: 'bg-orange-100 text-orange-800',
}

interface BookingDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: ClientBookingWithRelations | null
}

export function BookingDetailsDialog({ open, onOpenChange, booking }: BookingDetailsDialogProps) {
  if (!booking) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <p>{booking.type}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge className={statusColorMap[booking.status]}>
                  {booking.status}
                </Badge>
              </div>
              <div>
                <Label>Duration</Label>
                <p>{booking.durationMinutes} minutes</p>
              </div>
              <div>
                <Label>Request Notes</Label>
                <p>{booking.requestNotes || '—'}</p>
              </div>
              <div>
                <Label>Created At</Label>
                <p>{formatDate(booking.createdAt)}</p>
              </div>
              {booking.scheduledAt && (
                <>
                  <div>
                    <Label>Scheduled Date</Label>
                    <p>{formatDate(booking.scheduledAt)}</p>
                  </div>
                  <div>
                    <Label>Scheduled Time</Label>
                    <p>{formatTime(booking.scheduledAt)}</p>
                  </div>
                </>
              )}
              {booking.meetingLink && (
                <div className="col-span-2">
                  <Label>Meeting Link</Label>
                  <p>
                    <a
                      href={booking.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {booking.meetingLink}
                    </a>
                  </p>
                </div>
              )}
              {booking.clientConfirmedAt && (
                <div>
                  <Label>Confirmed At</Label>
                  <p>{formatDate(booking.clientConfirmedAt)} {formatTime(booking.clientConfirmedAt)}</p>
                </div>
              )}
              {booking.transcriptUrl && (
                <div className="col-span-2">
                  <Label>Transcript URL</Label>
                  <p>
                    <a
                      href={booking.transcriptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {booking.transcriptUrl}
                    </a>
                  </p>
                </div>
              )}
              {booking.aiSummary && (
                <div className="col-span-2">
                  <Label>AI Summary</Label>
                  <p className="whitespace-pre-wrap">{booking.aiSummary}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <ul className="space-y-2">
              {booking.statusHistory.map((entry) => (
                <li key={entry.id} className="text-sm border-l-2 pl-4 py-1">
                  <span className="font-medium">
                    {entry.oldStatus} → {entry.newStatus}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    by {entry.changedBy.fullName} on {formatDate(entry.changedAt)} at{' '}
                    {formatTime(entry.changedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}