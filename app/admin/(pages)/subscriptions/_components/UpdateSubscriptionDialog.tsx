'use client'

import { useState } from 'react'
import { SubscriptionStatus } from '@prisma/client'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { updateSubscription } from '../actions'

interface UpdateSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription: {
    id: string
    status: SubscriptionStatus
    cancelAtPeriodEnd?: boolean
    // add other fields as needed
  }
  onSuccess: () => void
}

export function UpdateSubscriptionDialog({ open, onOpenChange, subscription, onSuccess }: UpdateSubscriptionDialogProps) {
  const [status, setStatus] = useState(subscription?.status)
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(subscription?.cancelAtPeriodEnd || false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!subscription) return
    setLoading(true)
    try {
      await updateSubscription(subscription.id, { status, cancelAtPeriodEnd })
      toast.success('Subscription updated')
      onSuccess()
    } catch {
      toast.error('Failed to update subscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Subscription</DialogTitle>
          <DialogDescription>Change status or cancellation preference.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as SubscriptionStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(SubscriptionStatus).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="cancel">Cancel at period end</Label>
            <Switch id="cancel" checked={cancelAtPeriodEnd} onCheckedChange={setCancelAtPeriodEnd} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Updating...' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}