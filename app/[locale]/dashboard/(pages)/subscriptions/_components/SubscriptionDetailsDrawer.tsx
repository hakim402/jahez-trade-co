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
import { formatDate, formatCurrency } from '@/lib/utils'
import { getSubscriptionItemDetails } from '../actions'
import { Calendar, Clock, Hash, CreditCard } from 'lucide-react'

interface SubscriptionDetailsDrawerProps {
  item: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  CANCELED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  UPCOMING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  ENDED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  ABANDONED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  INCOMPLETE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  PAST_DUE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
}

export function SubscriptionDetailsDrawer({ item, open, onOpenChange }: SubscriptionDetailsDrawerProps) {
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && item) {
      setLoading(true)
      getSubscriptionItemDetails(item.id)
        .then(setDetails)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [open, item])

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
              {/* Status and basic info */}
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
                <p className="text-lg font-medium">{details.plan?.name || 'Unknown Plan'}</p>
                {details.plan && (
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(details.plan.amount, details.plan.currency)} / {details.plan.interval}
                    {details.plan.intervalCount && details.plan.intervalCount > 1 ? ` (every ${details.plan.intervalCount} ${details.plan.interval}s)` : ''}
                  </p>
                )}
              </div>

              {/* Periods */}
              <div className="space-y-3">
                {details.currentPeriodStart && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{formatDate(details.currentPeriodStart)}</p>
                      <p className="text-sm text-muted-foreground">Current period start</p>
                    </div>
                  </div>
                )}
                {details.currentPeriodEnd && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{formatDate(details.currentPeriodEnd)}</p>
                      <p className="text-sm text-muted-foreground">Current period end</p>
                    </div>
                  </div>
                )}
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

              {/* Clerk IDs */}
              <div>
                <h3 className="font-semibold mb-2">Reference IDs</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3">
                    <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-mono text-xs">{details.clerkItemId}</p>
                      <p className="text-xs text-muted-foreground">Subscription Item ID (Clerk)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-mono text-xs">{details.subscription?.clerkSubscriptionId}</p>
                      <p className="text-xs text-muted-foreground">Subscription Container ID (Clerk)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Payment Attempts */}
              {details.subscription?.paymentAttempts?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Recent Payment Attempts</h3>
                  <div className="space-y-2">
                    {details.subscription.paymentAttempts.map((attempt: any) => (
                      <div key={attempt.id} className="border rounded p-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{attempt.type}</span>
                          <Badge variant="outline">{attempt.status}</Badge>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>{formatDate(attempt.occurredAt)}</span>
                          {attempt.amount && (
                            <span>{formatCurrency(attempt.amount, attempt.currency)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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