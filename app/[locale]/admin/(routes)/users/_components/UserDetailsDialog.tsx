// app/[locale]/admin/users/_components/UserDetailsDialog.tsx
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
import { Calendar, Mail, Phone, User as UserIcon, MapPin } from 'lucide-react';
import { getUserById, type GetUserByIdReturn } from '../actions';
import { toast } from 'sonner';

interface UserDetailsDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({ userId, open, onOpenChange }: UserDetailsDialogProps) {
  const [user, setUser] = useState<GetUserByIdReturn['user'] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      getUserById({ id: userId })
        .then((data) => setUser(data.user))
        .catch((error) => {
          toast.error('Failed to load user details');
          console.error(error);
        })
        .finally(() => setLoading(false));
    } else {
      setUser(null);
    }
  }, [userId, open]);

  const getInitials = () => {
    if (!user) return 'U';
    if (user.fullName) {
      return user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Comprehensive information about the user.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : user ? (
          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="space-y-6 pr-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatarUrl || ''} />
                  <AvatarFallback className="text-lg">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-semibold">
                    {user.fullName || 'No name'}
                  </h2>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                  {user.role}
                </Badge>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{user.phone || 'No phone'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Account Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Last updated: {new Date(user.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs for related data */}
              <Tabs defaultValue="subscriptions" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="subscriptions">
                    Subscriptions ({user.subscriptions.length})
                  </TabsTrigger>
                  <TabsTrigger value="requests">
                    Requests ({user.requests.length})
                  </TabsTrigger>
                  <TabsTrigger value="bookings">
                    Bookings ({user.bookings.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="subscriptions" className="space-y-4">
                  {user.subscriptions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No subscriptions</p>
                  ) : (
                    user.subscriptions.map((sub) => (
                      <Card key={sub.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Subscription ID: {sub.clerkSubscriptionId}</p>
                            <p className="text-xs text-muted-foreground">
                              Created: {new Date(sub.createdAt).toLocaleDateString()}
                            </p>
                            {sub.items.map((item) => (
                              <div key={item.id} className="mt-2 p-2 bg-muted/50 rounded-md">
                                <p className="text-sm">Item: {item.plan?.name || 'Unknown'}</p>
                                <p className="text-xs">
                                  Amount: {item.plan?.amount.toString()} {item.plan?.currency}
                                </p>
                                <Badge variant="outline">{item.status}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="requests" className="space-y-4">
                  {user.requests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No requests</p>
                  ) : (
                    user.requests.map((req) => (
                      <Card key={req.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{req.status}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(req.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {req.productLink && (
                              <p className="text-sm truncate">
                                <span className="font-medium">Product:</span>{' '}
                                <a href={req.productLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  {req.productLink}
                                </a>
                              </p>
                            )}
                            {req.description && (
                              <p className="text-sm text-muted-foreground">{req.description}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="bookings" className="space-y-4">
                  {user.bookings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No bookings</p>
                  ) : (
                    user.bookings.map((booking) => (
                      <Card key={booking.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{booking.status}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(booking.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {booking.supplier && (
                              <p className="text-sm">
                                <span className="font-medium">Supplier:</span> {booking.supplier.name}
                              </p>
                            )}
                            {booking.scheduledAt && (
                              <p className="text-sm">
                                <span className="font-medium">Scheduled:</span>{' '}
                                {new Date(booking.scheduledAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}