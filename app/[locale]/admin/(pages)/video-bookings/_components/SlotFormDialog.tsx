'use client'

import { useState } from 'react'
import { BookingType } from '@prisma/client'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { createAvailabilitySlot, updateAvailabilitySlot } from '../actions'

type SlotFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  slot?: {
    id: string
    type: BookingType
    location: string
    startTime: string | Date
    endTime?: string | Date
    durationMinutes?: number
    isAvailable?: boolean
  }
  onSuccess: () => void
}

export function SlotFormDialog({ open, onOpenChange, slot, onSuccess }: SlotFormDialogProps) {
  const isEditing = !!slot
  const [type, setType] = useState<BookingType>(slot?.type || 'MARKET')
  const [location, setLocation] = useState(slot?.location || '')
  const [startTime, setStartTime] = useState(slot?.startTime ? new Date(slot.startTime).toISOString().slice(0, 16) : '')
  const [endTime, setEndTime] = useState(slot?.endTime ? new Date(slot.endTime).toISOString().slice(0, 16) : '')
  const [duration, setDuration] = useState(slot?.durationMinutes?.toString() || '30')
  const [isAvailable, setIsAvailable] = useState(slot?.isAvailable ?? true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!type || !location || !startTime) {
      toast.error('Please fill required fields')
      return
    }
    setLoading(true)
    try {
      const data = {
        type,
        location,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : undefined,
        durationMinutes: parseInt(duration),
        ...(isEditing && { isAvailable }),
      }
      if (isEditing) {
        await updateAvailabilitySlot(slot.id, data)
        toast.success('Slot updated')
      } else {
        await createAvailabilitySlot(data)
        toast.success('Slot created')
      }
      onSuccess()
    } catch {
      toast.error(isEditing ? 'Failed to update slot' : 'Failed to create slot')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Slot' : 'Create Slot'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the availability slot details.' : 'Add a new availability slot.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as BookingType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(BookingType).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Yiwu" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date & Time</Label>
              <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date & Time (optional)</Label>
              <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min={15} step={15} />
            </div>
            {isEditing && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={isAvailable ? 'true' : 'false'} onValueChange={(v) => setIsAvailable(v === 'true')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Available</SelectItem>
                    <SelectItem value="false">Booked (mark unavailable)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}