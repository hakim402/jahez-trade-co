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
import { confirmScheduledBooking } from '../actions'
import type { ClientBookingWithRelations } from './types'

interface ConfirmBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: ClientBookingWithRelations | null
  onSuccess: () => void
}

export function ConfirmBookingDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: ConfirmBookingDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!booking) return
    setLoading(true)
    const result = await confirmScheduledBooking({ bookingId: booking.id })
    setLoading(false)
    if (result.success) {
      toast.success('Booking confirmed', { description: 'You have confirmed the video call.' })
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
          <AlertDialogTitle>Confirm Booking</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to confirm this video call? This will finalize the scheduled time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading}>
            {loading ? 'Confirming...' : 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}