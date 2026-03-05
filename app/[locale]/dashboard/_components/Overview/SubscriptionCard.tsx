// app/[locale]/dashboard/_components/SubscriptionCard.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Crown, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClientDashboardStats } from '../types'

type SubscriptionInfo = NonNullable<ClientDashboardStats['subscription']>

interface SubscriptionCardProps {
  subscription: SubscriptionInfo | null
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  if (!subscription || !subscription.hasActive) {
    return (
      <Card className="border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            No Active Plan
          </CardTitle>
          <CardDescription>
            You don't have an active subscription. Some features may be limited.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { planName, requestCount, planLimit, remainingRequests } = subscription
  const usagePercent = planLimit === Infinity ? 0 : Math.min(100, (requestCount / planLimit) * 100)
  const isUnlimited = planLimit === Infinity

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-r from-brand/5 to-transparent" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-brand" />
            <CardTitle className="text-base font-semibold">
              {planName} Plan
            </CardTitle>
          </div>
          <Badge variant="secondary" className="bg-brand/10 text-brand border-brand/20">
            {isUnlimited ? 'Unlimited' : `${remainingRequests} remaining`}
          </Badge>
        </div>
        <CardDescription>
          Your current usage and limits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Requests used</span>
            <span className="font-medium">
              {requestCount} {!isUnlimited && `/ ${planLimit}`}
            </span>
          </div>
          {!isUnlimited && (
            <Progress value={usagePercent} className="h-2 [&>div]:bg-brand" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}