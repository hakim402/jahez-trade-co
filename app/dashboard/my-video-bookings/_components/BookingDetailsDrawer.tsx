'use client'

import { useEffect, useState } from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'
import { getBookingDetails } from '../actions'
import { Calendar, MapPin, Clock, Video, CreditCard } from 'lucide-react'

interface BookingDetailsDrawerProps {
  booking: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  CANCELED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

export function BookingDetailsDrawer({ booking, open, onOpenChange }: BookingDetailsDrawerProps) {
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && booking) {
      setLoading(true)
      getBookingDetails(booking.id)
        .then(setDetails)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [open, booking])

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Booking Details</DrawerTitle>
          <DrawerDescription>
            View full information about your video consultation.
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="px-4 py-2 max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex justify-center py-8">Loading...</div>
          ) : details ? (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <Badge className={statusStyles[details.status] || ''}>
                  {details.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Booked on {formatDate(details.createdAt)}
                </span>
              </div>

              {/* Main details */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{formatDate(details.scheduledAt)}</p>
                    <p className="text-sm text-muted-foreground">Date</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{formatTime(details.scheduledAt)}</p>
                    <p className="text-sm text-muted-foreground">Time ({details.durationMinutes} min)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{details.location}</p>
                    <p className="text-sm text-muted-foreground">Location</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Video className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{details.type}</p>
                    <p className="text-sm text-muted-foreground">Type</p>
                  </div>
                </div>
              </div>

              {details.meetingLink && (
                <div>
                  <h3 className="font-semibold mb-2">Meeting Link</h3>
                  <a
                    href={details.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {details.meetingLink}
                  </a>
                </div>
              )}

              {details.adminNotes && (
                <div>
                  <h3 className="font-semibold mb-2">Admin Notes</h3>
                  <p className="text-sm whitespace-pre-wrap">{details.adminNotes}</p>
                </div>
              )}

              {details.payment && (
                <div>
                  <h3 className="font-semibold mb-2">Payment</h3>
                  <div className="border rounded p-3 space-y-2">
                    <div className="flex justify-between">
                      <span>Amount</span>
                      <span className="font-medium">
                        {formatCurrency(details.payment.amount, details.payment.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status</span>
                      <Badge variant="outline">{details.payment.status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Date</span>
                      <span>{formatDate(details.payment.createdAt)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center py-4">Booking not found</p>
          )}
        </ScrollArea>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}