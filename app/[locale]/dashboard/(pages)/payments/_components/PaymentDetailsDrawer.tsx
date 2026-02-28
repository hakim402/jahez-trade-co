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
import { getPaymentDetails } from '../actions'
import { Calendar, CreditCard, Hash, Tag } from 'lucide-react'

interface PaymentDetailsDrawerProps {
  payment: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

export function PaymentDetailsDrawer({ payment, open, onOpenChange }: PaymentDetailsDrawerProps) {
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && payment) {
      setLoading(true)
      getPaymentDetails(payment.id)
        .then(setDetails)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [open, payment])

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Payment Details</DrawerTitle>
          <DrawerDescription>
            Full information about this transaction.
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="px-4 py-2 max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex justify-center py-8">Loading...</div>
          ) : details ? (
            <div className="space-y-6">
              {/* Status and ID */}
              <div className="flex items-center justify-between">
                <Badge className={statusStyles[details.status] || ''}>
                  {details.status}
                </Badge>
                <span className="text-sm font-mono text-muted-foreground">
                  ID: {details.clerkPaymentAttemptId}
                </span>
              </div>

              {/* Amount */}
              <div>
                <h3 className="font-semibold mb-2">Amount</h3>
                <p className="text-2xl font-bold">
                  {formatCurrency(details.amount, details.currency)}
                </p>
              </div>

              {/* Type */}
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium capitalize">{details.type.toLowerCase()}</p>
                  <p className="text-sm text-muted-foreground">Payment type</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{formatDate(details.occurredAt)}</p>
                  <p className="text-sm text-muted-foreground">Occurred at</p>
                </div>
              </div>

              {/* Related Subscription */}
              {details.subscription && (
                <div>
                  <h3 className="font-semibold mb-2">Related Subscription</h3>
                  <div className="border rounded p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-xs">{details.subscription.clerkSubscriptionId}</span>
                    </div>
                    {details.subscriptionItem && details.subscriptionItem.plan && (
                      <p className="text-sm">
                        Plan: {details.subscriptionItem.plan.name} (
                        {formatCurrency(details.subscriptionItem.plan.amount, details.subscriptionItem.plan.currency)})
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Subscription Item Details (if recurring) */}
              {details.subscriptionItem && (
                <div>
                  <h3 className="font-semibold mb-2">Subscription Item</h3>
                  <div className="border rounded p-3">
                    <p className="text-sm">
                      Status: <Badge variant="outline">{details.subscriptionItem.status}</Badge>
                    </p>
                    {details.subscriptionItem.currentPeriodStart && (
                      <p className="text-sm mt-1">
                        Period: {formatDate(details.subscriptionItem.currentPeriodStart)} –{' '}
                        {formatDate(details.subscriptionItem.currentPeriodEnd)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Raw payload (optional) – could be shown in development */}
              {/* {process.env.NODE_ENV === 'development' && (
                <details className="text-xs">
                  <summary>Raw payload</summary>
                  <pre>{JSON.stringify(details.payload, null, 2)}</pre>
                </details>
              )} */}
            </div>
          ) : (
            <p className="text-center py-4">Payment not found</p>
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