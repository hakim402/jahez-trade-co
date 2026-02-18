// app/dashboard/payments/_components/PaymentDetailsDrawer.tsx

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
import { formatDate, formatCurrency } from '@/lib/utils'
import { getPaymentDetails } from '../actions'
import { Calendar, CreditCard, Hash, FileText, Link2 } from 'lucide-react'
import Link from 'next/link'

interface PaymentDetailsDrawerProps {
  payment: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  REFUNDED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
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
                  ID: {details.id}
                </span>
              </div>

              {/* Amount */}
              <div>
                <h3 className="font-semibold mb-2">Amount</h3>
                <p className="text-2xl font-bold">{formatCurrency(details.amount, details.currency)}</p>
              </div>

              {/* Description */}
              {details.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm">{details.description}</p>
                </div>
              )}

              {/* Dates */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{formatDate(details.createdAt)}</p>
                    <p className="text-sm text-muted-foreground">Payment date</p>
                  </div>
                </div>
                {details.updatedAt && details.updatedAt !== details.createdAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{formatDate(details.updatedAt)}</p>
                      <p className="text-sm text-muted-foreground">Last updated</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stripe Info */}
              <div>
                <h3 className="font-semibold mb-2">Payment Reference</h3>
                <div className="space-y-2 text-sm">
                  {details.stripeSessionId && (
                    <div className="flex items-start gap-3">
                      <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-mono text-xs">{details.stripeSessionId}</p>
                        <p className="text-xs text-muted-foreground">Stripe Session ID</p>
                      </div>
                    </div>
                  )}
                  {details.stripePaymentId && (
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-mono text-xs">{details.stripePaymentId}</p>
                        <p className="text-xs text-muted-foreground">Stripe Payment ID</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Booking */}
              {details.booking && (
                <div>
                  <h3 className="font-semibold mb-2">Related Booking</h3>
                  <div className="border rounded p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <Link
                        href={`/dashboard/my-video-bookings/${details.booking.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {details.booking.type} Booking
                      </Link>
                    </div>
                    <p className="text-sm">
                      {formatDate(details.booking.scheduledAt)} • {details.booking.location}
                    </p>
                    <Badge variant="outline">{details.booking.status}</Badge>
                  </div>
                </div>
              )}
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