// app/[locale]/dashboard/_components/Overview/SubscriptionCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface SubscriptionCardProps {
  subscription: {
    planName: string;
    status: string;
    currentPeriodEnd: Date | null;
    isDefaultPlan: boolean;
  };
}

export default function SubscriptionCard({
  subscription,
}: SubscriptionCardProps) {
  const isActive = subscription.status === "ACTIVE";

  return (
    <Card className="group bg-linear-to-br from-brand/5 to-transparent border border-brand/20 hover:shadow-xl transition-all duration-300 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Crown className="h-5 w-5 text-brand" />
          Subscription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{subscription.planName}</span>
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={isActive ? "bg-brand" : ""}
          >
            {subscription.status}
          </Badge>
        </div>
        {subscription.currentPeriodEnd && (
          <p className="text-xs text-muted-foreground">
            Renews {formatDate(subscription.currentPeriodEnd)}
          </p>
        )}
        {subscription.isDefaultPlan && (
          <p className="text-xs text-muted-foreground">
            You are on the free plan.
          </p>
        )}
        <Button
          asChild
          size="sm"
          className="w-full bg-brand hover:bg-brand/90 text-white"
        >
          <Link href="/dashboard/subscriptions">Manage Plan</Link>
        </Button>
      </CardContent>
      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand group-hover:w-full transition-all duration-300" />
    </Card>
  );
}
