'use client'

import { useEffect, useState } from 'react'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getBookingById } from './actions'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'
import { Calendar, Clock, MapPin, Link as LinkIcon, CreditCard, User } from 'lucide-react'

interface BookingDetailsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string | number | null
}

export function BookingDetailsDrawer({ open, onOpenChange, bookingId }: BookingDetailsDrawerProps) {
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && bookingId) {
      setLoading(true)
      getBookingById(String(bookingId)).then(setBooking).finally(() => setLoading(false))
    }
  }, [open, bookingId])

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Booking Details</DrawerTitle>
          <DrawerDescription>Full booking information.</DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">Loading...</div>
          ) : booking ? (
            <div className="space-y-6 pb-6">
              {/* User info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={booking.user.avatarUrl} />
                    <AvatarFallback>{booking.user.fullName?.charAt(0) || booking.user.email.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{booking.user.fullName || 'No name'}</h3>
                    <p className="text-sm text-muted-foreground">{booking.user.email}</p>
                    {booking.user.phone && <p className="text-sm">{booking.user.phone}</p>}
                  </div>
                </div>
                <Badge>{booking.status}</Badge>
              </div>
              <Separator />
              {/* Booking details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(booking.scheduledAt)}</div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {formatTime(booking.scheduledAt)} ({booking.durationMinutes} min)</div>
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {booking.location} ({booking.type})</div>
                  {booking.meetingLink && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meeting Link</a>
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><User className="h-4 w-4" /> Created: {formatDate(booking.createdAt)}</div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Last updated: {formatDate(booking.updatedAt)}</div>
                </div>
              </div>
              {/* Slot info if booked */}
              {booking.slot && (
                <div>
                  <h4 className="font-medium mb-2">Availability Slot</h4>
                  <div className="rounded-md border p-3 text-sm">
                    <p><span className="font-medium">Slot ID:</span> {booking.slot.id}</p>
                    <p><span className="font-medium">Start:</span> {formatDate(booking.slot.startTime)} {formatTime(booking.slot.startTime)}</p>
                    {booking.slot.endTime && <p><span className="font-medium">End:</span> {formatDate(booking.slot.endTime)} {formatTime(booking.slot.endTime)}</p>}
                  </div>
                </div>
              )}
              {/* Payment info */}
              {booking.payment && (
                <div>
                  <h4 className="font-medium mb-2">Payment</h4>
                  <div className="rounded-md border p-3 text-sm">
                    <div className="flex justify-between">
                      <span><CreditCard className="inline h-4 w-4 mr-1" /> Amount:</span>
                      <span className="font-semibold">{formatCurrency(booking.payment.amount, booking.payment.currency)}</span>
                    </div>
                    <p><span className="font-medium">Status:</span> <Badge variant="outline">{booking.payment.status}</Badge></p>
                    {booking.payment.stripePaymentId && <p><span className="font-medium">Stripe ID:</span> {booking.payment.stripePaymentId}</p>}
                  </div>
                </div>
              )}
              {/* Admin notes */}
              {booking.adminNotes && (
                <div>
                  <h4 className="font-medium">Admin Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{booking.adminNotes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center">Booking not found.</div>
          )}
        </ScrollArea>
        <DrawerFooter>
          <DrawerClose asChild><Button variant="outline">Close</Button></DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}