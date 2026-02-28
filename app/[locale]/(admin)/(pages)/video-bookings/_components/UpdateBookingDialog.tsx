'use client'

import { useState } from 'react'
import { BookingStatus } from '@prisma/client'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateBookingStatus } from '../actions'

interface UpdateBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: {
    id: string
    status: BookingStatus
    meetingLink?: string
    adminNotes?: string
    // add other booking fields if needed
  } | null
  onSuccess: () => void
}

export function UpdateBookingDialog({ open, onOpenChange, booking, onSuccess }: UpdateBookingDialogProps) {
  const [status, setStatus] = useState(booking?.status)
  const [meetingLink, setMeetingLink] = useState(booking?.meetingLink || '')
  const [adminNotes, setAdminNotes] = useState(booking?.adminNotes || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!booking) return
    setLoading(true)
    try {
      await updateBookingStatus(booking.id, status as BookingStatus, meetingLink || undefined, adminNotes || undefined)
      toast.success('Booking updated')
      onSuccess()
    } catch {
      toast.error('Failed to update booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Booking</DialogTitle>
          <DialogDescription>Change status, add meeting link or notes.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(BookingStatus).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Meeting Link (optional)</Label>
            <Input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." />
          </div>
          <div className="space-y-2">
            <Label>Admin Notes</Label>
            <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Updating...' : 'Update'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}