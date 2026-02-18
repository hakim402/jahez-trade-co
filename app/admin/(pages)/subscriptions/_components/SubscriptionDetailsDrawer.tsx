'use client'

import { useEffect, useState } from 'react'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getSubscriptionById } from '../actions'
import { formatDate } from '@/lib/utils'
import { Calendar, CreditCard, User, Hash } from 'lucide-react'

interface SubscriptionDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string | number;
}

export function SubscriptionDetailsDrawer({ open, onOpenChange, subscriptionId }: SubscriptionDetailsDrawerProps) {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && subscriptionId) {
      setLoading(true)
      getSubscriptionById(String(subscriptionId)).then(setSubscription).finally(() => setLoading(false))
    }
  }, [open, subscriptionId])

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Subscription Details</DrawerTitle>
          <DrawerDescription>Full subscription information.</DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">Loading...</div>
          ) : subscription ? (
            <div className="space-y-6 pb-6">
              {/* User info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={subscription.user.avatarUrl} />
                    <AvatarFallback>{subscription.user.fullName?.charAt(0) || subscription.user.email.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{subscription.user.fullName || 'No name'}</h3>
                    <p className="text-sm text-muted-foreground">{subscription.user.email}</p>
                    {subscription.user.phone && <p className="text-sm">{subscription.user.phone}</p>}
                  </div>
                </div>
                <Badge>{subscription.status}</Badge>
              </div>
              <Separator />
              {/* Subscription fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Plan: {subscription.plan}</div>
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Period: {formatDate(subscription.currentPeriodStart)} – {formatDate(subscription.currentPeriodEnd)}</div>
                  <div className="flex items-center gap-2"><Hash className="h-4 w-4" /> Stripe Subscription ID: {subscription.stripeSubscriptionId}</div>
                  {subscription.trialEndsAt && (
                    <div className="flex items-center gap-2">Trial ends: {formatDate(subscription.trialEndsAt)}</div>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><User className="h-4 w-4" /> Created: {formatDate(subscription.createdAt)}</div>
                  <div className="flex items-center gap-2">Cancel at period end: {subscription.cancelAtPeriodEnd ? 'Yes' : 'No'}</div>
                </div>
              </div>
              {/* Stripe customer info */}
              <div className="rounded-md border p-3 text-sm">
                <p><span className="font-medium">Stripe Customer ID:</span> {subscription.stripeCustomerId}</p>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center">Subscription not found.</div>
          )}
        </ScrollArea>
        <DrawerFooter>
          <DrawerClose asChild><Button variant="outline">Close</Button></DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}