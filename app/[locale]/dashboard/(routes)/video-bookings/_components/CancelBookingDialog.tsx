'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { cancelMyBooking } from '../actions'
import type { ClientBookingWithRelations } from './types'

interface CancelBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: ClientBookingWithRelations | null
  onSuccess: () => void
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: CancelBookingDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    if (!booking) return
    setLoading(true)
    const result = await cancelMyBooking({ bookingId: booking.id })
    setLoading(false)
    if (result.success) {
      toast.success('Booking cancelled', { description: 'Your booking has been cancelled.' })
      onOpenChange(false)
      onSuccess()
    } else {
      toast.error('Error', { description: result.error })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this booking? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>No, keep it</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Cancelling...' : 'Yes, cancel'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}