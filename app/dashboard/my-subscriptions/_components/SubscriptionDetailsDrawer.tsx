'use client'

import { useEffect, useState } from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/utils'
import { getSubscriptionDetails } from '../actions'
import { Calendar, CreditCard, Hash, Clock } from 'lucide-react'

interface SubscriptionDetailsDrawerProps {
  subscription: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  PAST_DUE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  CANCELED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  INCOMPLETE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  TRIALING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
}

export function SubscriptionDetailsDrawer({ subscription, open, onOpenChange }: SubscriptionDetailsDrawerProps) {
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && subscription) {
      setLoading(true)
      getSubscriptionDetails(subscription.id)
        .then(setDetails)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [open, subscription])

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Subscription Details</DrawerTitle>
          <DrawerDescription>
            Full information about your subscription.
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="px-4 py-2 max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex justify-center py-8">Loading...</div>
          ) : details ? (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <Badge className={statusStyles[details.status] || ''}>
                  {details.status.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Created {formatDate(details.createdAt)}
                </span>
              </div>

              {/* Plan */}
              <div>
                <h3 className="font-semibold mb-2">Plan</h3>
                <p className="text-lg font-medium">{details.plan}</p>
              </div>

              {/* Period */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{formatDate(details.currentPeriodStart)}</p>
                    <p className="text-sm text-muted-foreground">Current period start</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{formatDate(details.currentPeriodEnd)}</p>
                    <p className="text-sm text-muted-foreground">Current period end</p>
                  </div>
                </div>
                {details.trialEndsAt && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{formatDate(details.trialEndsAt)}</p>
                      <p className="text-sm text-muted-foreground">Trial ends</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Cancellation info */}
              {details.cancelAtPeriodEnd && (
                <div className="bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm">
                    This subscription is set to cancel at the end of the current period.
                  </p>
                </div>
              )}

              {/* Stripe Info */}
              <div>
                <h3 className="font-semibold mb-2">Payment Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3">
                    <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-mono text-xs">{details.stripeSubscriptionId}</p>
                      <p className="text-xs text-muted-foreground">Stripe Subscription ID</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-mono text-xs">{details.stripeCustomerId}</p>
                      <p className="text-xs text-muted-foreground">Stripe Customer ID</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-4">Subscription not found</p>
          )}
        </ScrollArea>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}