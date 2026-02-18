"use client";

import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getUserById } from "./actions";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Calendar,
  Mail,
  Phone,
  CreditCard,
  ShoppingBag,
  Video,
} from "lucide-react";

export function ClientDetailsDrawer({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      getUserById(userId)
        .then(setUser)
        .finally(() => setLoading(false));
    }
  }, [open, userId]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Client Details</DrawerTitle>
          <DrawerDescription>
            View complete information and activity.
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              Loading...
            </div>
          ) : user ? (
            <div className="space-y-6 pb-6">
              {/* Header with avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatarUrl || ""} />
                  <AvatarFallback>
                    {user.fullName?.charAt(0) || user.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">
                    {user.fullName || "No name"}
                  </h2>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {user.phone}
                    </div>
                  )}
                </div>
                <Badge
                  className="ml-auto"
                  variant={user.role === "ADMIN" ? "destructive" : "default"}
                >
                  {user.role}
                </Badge>
              </div>

              <Separator />

              {/* Stats cards */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard
                  icon={ShoppingBag}
                  label="Requests"
                  value={user._count.requests}
                />
                <StatCard
                  icon={Video}
                  label="Bookings"
                  value={user._count.bookings}
                />
                <StatCard
                  icon={CreditCard}
                  label="Subscriptions"
                  value={user._count.subscriptions}
                />
                <StatCard
                  icon={CreditCard}
                  label="Payments"
                  value={user._count.payments}
                />
              </div>

              {/* Subscription info */}
              {user.subscriptions.length > 0 && (
                <>
                  <h3 className="font-semibold">Current Subscription</h3>
                  <div className="rounded-lg border p-4">
                    {user.subscriptions.map((sub: any) => (
                      <div key={sub.id} className="flex justify-between">
                        <div>
                          <Badge>{sub.plan}</Badge>
                          <Badge variant="outline" className="ml-2">
                            {sub.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            Period: {formatDate(sub.currentPeriodStart)} –{" "}
                            {formatDate(sub.currentPeriodEnd)}
                          </p>
                        </div>
                        {sub.cancelAtPeriodEnd && (
                          <Badge variant="destructive">
                            Cancels at period end
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Recent activity */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Recent Requests</h3>
                  {user.requests.length > 0 ? (
                    <div className="space-y-2">
                      {user.requests.map((req: any) => (
                        <div
                          key={req.id}
                          className="rounded-md border p-3 text-sm"
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">
                              {req.productLink || "No link"}
                            </span>
                            <Badge variant="outline">{req.status}</Badge>
                          </div>
                          <p className="text-muted-foreground mt-1">
                            Qty: {req.quantity} • {formatDate(req.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No requests yet.
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Recent Bookings</h3>
                  {user.bookings.length > 0 ? (
                    <div className="space-y-2">
                      {user.bookings.map((booking: any) => (
                        <div
                          key={booking.id}
                          className="rounded-md border p-3 text-sm"
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">{booking.type}</span>
                            <Badge variant="outline">{booking.status}</Badge>
                          </div>
                          <p className="text-muted-foreground mt-1">
                            {formatDate(booking.scheduledAt)} •{" "}
                            {booking.location}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No bookings yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-muted-foreground">
                <p>Client since: {formatDate(user.createdAt)}</p>
                <p>Last updated: {formatDate(user.updatedAt)}</p>
                {user.stripeCustomerId && (
                  <p>Stripe Customer ID: {user.stripeCustomerId}</p>
                )}
              </div>
            </div>
          ) : (
            <div>User not found</div>
          )}
        </ScrollArea>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-3">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
