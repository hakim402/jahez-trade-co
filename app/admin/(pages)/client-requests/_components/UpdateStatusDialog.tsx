'use client'

import { useState } from 'react'
import { RequestStatus } from '@prisma/client'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { updateRequestStatus } from '../actions'

interface UpdateStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: {
    id: string
    status: RequestStatus
    adminNotes?: string
  } | null
  onSuccess: () => void
}

export function UpdateStatusDialog({ open, onOpenChange, request, onSuccess }: UpdateStatusDialogProps) {
  const [status, setStatus] = useState(request?.status)
  const [adminNotes, setAdminNotes] = useState(request?.adminNotes || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!request || !status) {
      toast.error('Please select a status')
      return
    }
    setLoading(true)
    try {
      await updateRequestStatus(request.id, status, adminNotes)
      toast.success('Status updated')
      onSuccess()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Request Status</DialogTitle>
          <DialogDescription>Change status and add admin notes.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as RequestStatus)}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {Object.values(RequestStatus).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Notes</label>
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