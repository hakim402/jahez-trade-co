'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cancelBookingByAdmin } from '../actions'
import type { BookingWithRelations } from './types'

interface CancelBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: BookingWithRelations | null
  onSuccess: () => void
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    if (!booking) return
    setLoading(true)
    const result = await cancelBookingByAdmin({
      bookingId: booking.id,
      reason: reason || undefined,
    })
    setLoading(false)
    if (result.success) {
      toast.success('Booking cancelled', { description: 'The booking has been cancelled.' })
      setReason('')
      onOpenChange(false)
      onSuccess()
    } else {
      toast.error('Error', { description: result.error })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this booking? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Why is this booking being cancelled?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={loading}>
            {loading ? 'Cancelling...' : 'Cancel Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}