'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
import { cancelSubscription } from '../actions'

interface CancelSubscriptionDialogProps {
  subscription: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CancelSubscriptionDialog({ subscription, open, onOpenChange }: CancelSubscriptionDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    setLoading(true)
    try {
      const result = await cancelSubscription(subscription.id)
      if (result.success) {
        toast.success('Subscription canceled')
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error('Failed to cancel subscription')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel your {subscription.plan} subscription?
            {subscription.status === 'ACTIVE' && (
              <span className="block mt-2">
                You will lose access to your plan benefits at the end of the current billing period.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>No, keep it</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} disabled={loading}>
            {loading ? 'Canceling...' : 'Yes, cancel'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}