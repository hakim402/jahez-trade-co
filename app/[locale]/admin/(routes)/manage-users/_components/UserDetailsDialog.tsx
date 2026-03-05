'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Mail,
  Phone,
  CreditCard,
  Package,
  Video,
  Bell,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { getUserById, type UserDetail } from '../actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UserDetailsDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function getInitials(fullName: string | null, email: string) {
  if (fullName) {
    return fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }
  return email.substring(0, 2).toUpperCase();
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`}
    />
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground min-w-20">{label}</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function UserDetailsDialog({ userId, open, onOpenChange }: UserDetailsDialogProps) {
  // FIX: use UserDetail (not GetUserByIdReturn which doesn't exist)
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) {
      setUser(null);
      return;
    }
    setLoading(true);
    // FIX: getUserById returns ActionResult<{ user: UserDetail }> — handle success/error
    getUserById({ id: userId })
      .then((result) => {
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        setUser(result.data.user);
      })
      .catch(() => toast.error('Failed to load user details'))
      .finally(() => setLoading(false));
  }, [userId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
                "w-[95vw] sm:max-w-2xl lg:max-w-7xl",
          "max-h-[95vh] overflow-y-auto",
                "bg-background/95 backdrop-blur-xl",
                "border border-border/50 shadow-2xl",
                "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-2",
                "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-2",
                "duration-300",
                // Custom scrollbar styling
                "[&::-webkit-scrollbar]:w-2",
                "[&::-webkit-scrollbar-track]:bg-transparent",
                "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20",
                "[&::-webkit-scrollbar-thumb]:rounded-full",
                "[&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/30",
              )}>
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>Full profile and activity overview.</DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              <Skeleton className="h-48 w-full" />
            </div>
          ) : user ? (
            <ScrollArea className="h-full max-h-[calc(92vh-120px)]">
              <div className="px-6 py-4 space-y-6">

                {/* ── Profile header ─────────────────────────────────────── */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 shrink-0">
                    <AvatarImage src={user.avatarUrl ?? ''} />
                    <AvatarFallback className="text-base font-semibold bg-primary/10">
                      {getInitials(user.fullName, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-semibold truncate">
                        {user.fullName || 'No name'}
                      </h2>
                      <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                        {user.role}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <StatusDot active={user.isActive} />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ID: <span className="font-mono">{user.id}</span>
                    </p>
                  </div>

                  {/* Activity counts */}
                  <div className="hidden sm:flex gap-3 shrink-0">
                    {[
                      { icon: Package, count: user._count.requests, label: 'Requests' },
                      { icon: Video, count: user._count.clientBookings, label: 'Bookings' },
                      { icon: Bell, count: user._count.notifications, label: 'Notifs' },
                    ].map(({ icon: Icon, count, label }) => (
                      <div key={label} className="text-center">
                        <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-0.5" />
                        <p className="text-base font-semibold leading-none">{count}</p>
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Contact & account info ──────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2.5">
                      <InfoRow icon={Mail}     label="Email"   value={user.email} />
                      <InfoRow icon={Phone}    label="Phone"   value={user.phone || '—'} />
                      <InfoRow icon={Calendar} label="Joined"  value={new Date(user.createdAt).toLocaleDateString()} />
                      <InfoRow icon={Calendar} label="Updated" value={new Date(user.updatedAt).toLocaleDateString()} />
                    </CardContent>
                  </Card>

                  {/* Subscription summary */}
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Subscription
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      {/* FIX: user.subscription is a single object, not an array */}
                      {user.subscription ? (
                        <div className="space-y-2">
                          {user.subscription.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium">{item.plan?.name ?? 'Unknown plan'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.plan
                                    ? `${item.plan.currency} ${Number(item.plan.amount).toFixed(2)} / ${item.plan.interval ?? 'one-time'}`
                                    : '—'}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs capitalize shrink-0">
                                {item.status.toLowerCase()}
                              </Badge>
                            </div>
                          ))}
                          {user.subscription.items.length === 0 && (
                            <p className="text-sm text-muted-foreground">No plan items</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No subscription</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* ── Tabs ───────────────────────────────────────────────── */}
                <Tabs defaultValue="requests">
                  <TabsList className="grid w-full grid-cols-4">
                    {/* FIX: use clientBookings not bookings, subscription not subscriptions */}
                    <TabsTrigger value="requests">
                      Requests ({user.requests.length})
                    </TabsTrigger>
                    <TabsTrigger value="bookings">
                      Bookings ({user.clientBookings.length})
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                      Notifs ({user.notifications.length})
                    </TabsTrigger>
                    <TabsTrigger value="payments">
                      Payments ({user.subscription?.paymentAttempts.length ?? 0})
                    </TabsTrigger>
                  </TabsList>

                  {/* Requests */}
                  <TabsContent value="requests" className="mt-4 space-y-3">
                    {user.requests.length === 0 ? (
                      <EmptyState icon={Package} label="No requests yet" />
                    ) : (
                      user.requests.map((req) => (
                        <Card key={req.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {req.status}
                                  </Badge>
                                  {req.priority > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      P{req.priority}
                                    </Badge>
                                  )}
                                </div>
                                {req.productLink && (
                                  <a
                                    href={req.productLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline truncate block max-w-xs"
                                  >
                                    {req.productLink}
                                  </a>
                                )}
                                {req.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {req.description}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Qty: {req.quantity} · {req.shippingCountry} ·{' '}
                                  {req._count.quotes} quote{req._count.quotes !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                {new Date(req.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* Bookings — FIX: user.clientBookings not user.bookings */}
                  <TabsContent value="bookings" className="mt-4 space-y-3">
                    {user.clientBookings.length === 0 ? (
                      <EmptyState icon={Video} label="No bookings yet" />
                    ) : (
                      user.clientBookings.map((booking) => (
                        <Card key={booking.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {booking.status}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {booking.type}
                                  </Badge>
                                </div>
                                {/* FIX: removed booking.supplier (doesn't exist in schema) */}
                                {booking.scheduledAt && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {new Date(booking.scheduledAt).toLocaleString()}
                                  </div>
                                )}
                                {booking.meetingProvider && (
                                  <p className="text-xs text-muted-foreground">
                                    via {booking.meetingProvider}
                                  </p>
                                )}
                                {booking.requestNotes && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {booking.requestNotes}
                                  </p>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                {new Date(booking.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* Notifications */}
                  <TabsContent value="notifications" className="mt-4 space-y-2">
                    {user.notifications.length === 0 ? (
                      <EmptyState icon={Bell} label="No notifications" />
                    ) : (
                      user.notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card text-sm"
                        >
                          {notif.isRead ? (
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{notif.title}</p>
                            <p className="text-xs text-muted-foreground">{notif.type}</p>
                          </div>
                          <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* Payment attempts */}
                  <TabsContent value="payments" className="mt-4 space-y-2">
                    {!user.subscription?.paymentAttempts.length ? (
                      <EmptyState icon={CreditCard} label="No payment history" />
                    ) : (
                      user.subscription.paymentAttempts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card text-sm"
                        >
                          {p.status === 'PAID' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : p.status === 'FAILED' ? (
                            <XCircle className="h-4 w-4 text-destructive shrink-0" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium capitalize">{p.type.toLowerCase()}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {p.status.toLowerCase()}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-medium">
                              {p.amount !== null
                                ? `${p.currency} ${p.amount.toFixed(2)}`
                                : '—'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(p.occurredAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>

                {/* ── Audit log ───────────────────────────────────────────── */}
                {user.auditLogs.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5" />
                      Admin audit log
                    </h3>
                    <div className="space-y-2">
                      {user.auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center gap-3 text-xs p-2 rounded-md bg-muted/40"
                        >
                          <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] shrink-0">
                            {log.action}
                          </span>
                          <span className="text-muted-foreground truncate flex-1">
                            {log.entity} {log.entityId ? `· ${log.entityId.slice(0, 8)}…` : ''}
                          </span>
                          <span className="text-muted-foreground whitespace-nowrap shrink-0">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
      <Icon className="h-8 w-8 opacity-30" />
      <p className="text-sm">{label}</p>
    </div>
  );
}