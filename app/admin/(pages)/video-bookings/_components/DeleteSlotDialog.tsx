'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { deleteAvailabilitySlot } from './actions'

interface DeleteSlotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slot: { id: string; booking?: any } | null
  onSuccess: () => void
}

export function DeleteSlotDialog({ open, onOpenChange, slot, onSuccess }: DeleteSlotDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!slot) return
    setLoading(true)
    try {
      await deleteAvailabilitySlot(slot.id)
      toast.success('Slot deleted')
      onSuccess()
    } catch {
      toast.error('Failed to delete slot')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Slot</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this slot? This action cannot be undone.
            {slot?.booking && (
              <p className="mt-2 text-destructive">This slot is currently booked. Deleting it will remove the association, but the booking will remain.</p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive text-destructive-foreground">
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}