'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Eye, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { BookingStatus } from '@prisma/client'
import { toast } from 'sonner'
import { BookingDetailsDialog } from './BookingDetailsDialog'
import { ScheduleBookingDialog } from './ScheduleBookingDialog'
import { CompleteBookingDialog } from './CompleteBookingDialog'
import { CancelBookingDialog } from './CancelBookingDialog'
import { formatDate, formatTime } from '@/lib/utils'
import type { BookingWithRelations } from './types'

const statusColorMap: Record<BookingStatus, string> = {
  REQUESTED: 'bg-blue-100 text-blue-800',
  PROPOSED: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  RESCHEDULED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELED: 'bg-gray-100 text-gray-800',
  NO_SHOW: 'bg-orange-100 text-orange-800',
}

interface BookingsTableProps {
  bookings: BookingWithRelations[]
  onActionComplete: () => void
}

export function BookingsTable({ bookings, onActionComplete }: BookingsTableProps) {
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [isCompleteOpen, setIsCompleteOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)

  const handleAction = (action: 'schedule' | 'complete' | 'cancel', booking: BookingWithRelations) => {
    setSelectedBooking(booking)
    switch (action) {
      case 'schedule':
        setIsScheduleOpen(true)
        break
      case 'complete':
        setIsCompleteOpen(true)
        break
      case 'cancel':
        setIsCancelOpen(true)
        break
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-mono text-xs">{booking.id.slice(0, 8)}</TableCell>
                <TableCell>
                  <div className="font-medium">{booking.client.fullName}</div>
                  <div className="text-sm text-muted-foreground">{booking.client.email}</div>
                </TableCell>
                <TableCell>{booking.type}</TableCell>
                <TableCell>
                  <Badge className={statusColorMap[booking.status]}>
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {booking.scheduledAt ? (
                    <>
                      {formatDate(booking.scheduledAt)} {formatTime(booking.scheduledAt)}
                    </>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>{formatDate(booking.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedBooking(booking)
                          setIsDetailsOpen(true)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      {booking.status === 'REQUESTED' && (
                        <DropdownMenuItem onClick={() => handleAction('schedule', booking)}>
                          <Calendar className="mr-2 h-4 w-4" /> Schedule
                        </DropdownMenuItem>
                      )}
                      {(booking.status === 'PROPOSED' || booking.status === 'CONFIRMED') && (
                        <DropdownMenuItem onClick={() => handleAction('complete', booking)}>
                          <CheckCircle className="mr-2 h-4 w-4" /> Complete
                        </DropdownMenuItem>
                      )}
                      {booking.status !== 'COMPLETED' && booking.status !== 'CANCELED' && (
                        <DropdownMenuItem
                          onClick={() => handleAction('cancel', booking)}
                          className="text-red-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Cancel
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BookingDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        booking={selectedBooking}
      />

      <ScheduleBookingDialog
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        booking={selectedBooking}
        onSuccess={onActionComplete}
      />

      <CompleteBookingDialog
        open={isCompleteOpen}
        onOpenChange={setIsCompleteOpen}
        booking={selectedBooking}
        onSuccess={onActionComplete}
      />

      <CancelBookingDialog
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        booking={selectedBooking}
        onSuccess={onActionComplete}
      />
    </>
  )
}