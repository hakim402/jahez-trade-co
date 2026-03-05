'use client';

import { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { UserFilters } from './UserFilters';
import { UserPagination } from './UserPagination';
import { UserDetailsDialog } from './UserDetailsDialog';
import { UserActionsMenu } from './UserActionsMenu';
import { getUsers, type GetUsersParams, type GetUsersReturn } from '../actions';

interface UserTableProps {
  // FIX: page.tsx passes GetUsersReturn directly (unwrapped from ActionResult)
  initialData: GetUsersReturn;
}

function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return email.substring(0, 2).toUpperCase();
}

export function UserTable({ initialData }: UserTableProps) {
  const [data, setData] = useState<GetUsersReturn>(initialData);
  const [params, setParams] = useState<GetUsersParams>({
    take: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [isPending, startTransition] = useTransition();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const isFirstRender = useRef(true);

  // Re-fetch when params change (skip first mount — we have initialData)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    let mounted = true;
    startTransition(async () => {
      // FIX: getUsers returns ActionResult — handle success/error correctly
      const result = await getUsers(params);
      if (!mounted) return;
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setData(result.data);
    });
    return () => { mounted = false; };
  }, [params]);

  // Trigger a refresh (used after ban/delete actions)
  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      const result = await getUsers(params);
      if (!result.success) return;
      setData(result.data);
    });
  }, [params]);

  const handleSearch = useCallback((search: string) => {
    setParams((p) => ({ ...p, search: search || undefined, cursor: undefined }));
  }, []);

  const handleRoleFilter = useCallback((role: GetUsersParams['role']) => {
    setParams((p) => ({ ...p, role, cursor: undefined }));
  }, []);

  const handleStatusFilter = useCallback((isActive: boolean | undefined) => {
    setParams((p) => ({ ...p, isActive, cursor: undefined }));
  }, []);

  const handleSort = useCallback((sortBy: GetUsersParams['sortBy']) => {
    setParams((p) => {
      const sortOrder = p.sortBy === sortBy && p.sortOrder === 'asc' ? 'desc' : 'asc';
      return { ...p, sortBy, sortOrder, cursor: undefined };
    });
  }, []);

  const handleNextPage = useCallback(() => {
    if (data.nextCursor) {
      setParams((p) => ({ ...p, cursor: data.nextCursor ?? undefined }));
    }
  }, [data.nextCursor]);

  const handlePreviousPage = useCallback(() => {
    setParams((p) => ({ ...p, cursor: undefined }));
  }, []);

  const handleViewDetails = useCallback((id: string) => {
    setSelectedUserId(id);
    setIsDetailsOpen(true);
  }, []);

  return (
    <div className="space-y-4">
      <UserFilters
        onSearch={handleSearch}
        onRoleFilter={handleRoleFilter}
        onStatusFilter={handleStatusFilter}
        isPending={isPending}
        total={data.total}
      />

      <div className="rounded-lg  bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-none hover:bg-muted/40">
              <TableHead className="w-55">User</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2 text-xs font-medium"
                  onClick={() => handleSort('email')}>
                  Email <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2 text-xs font-medium"
                  onClick={() => handleSort('createdAt')}>
                  Joined <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="text-right">Activity</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              data.users.map((user) => {
                // FIX: derive plan from user.subscription.items[0] (not _count.subscriptions)
                const activePlan = user.subscription?.items.find(
                  (i) => i.status === 'ACTIVE'
                ) ?? user.subscription?.items[0];

                return (
                  <TableRow
                    key={user.id}
                    className="group cursor-pointer hover:bg-muted/30"
                    onClick={() => handleViewDetails(user.id)}
                  >
                    {/* User */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={user.avatarUrl ?? ''} />
                            <AvatarFallback className="bg-primary/10 text-xs font-medium">
                              {getInitials(user.fullName, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online indicator */}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                              user.isActive ? 'bg-emerald-500' : 'bg-muted-foreground'
                            }`}
                          />
                        </div>
                        <span className="truncate max-w-32.5 text-sm font-medium">
                          {user.fullName || <span className="text-muted-foreground italic">No name</span>}
                        </span>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-sm text-muted-foreground max-w-45">
                      <span className="truncate block">{user.email}</span>
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      <Badge
                        variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {user.role}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={user.isActive ? 'outline' : 'secondary'}
                        className={`text-xs ${user.isActive ? 'border-emerald-500 text-emerald-600' : 'text-muted-foreground'}`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="text-sm text-muted-foreground">
                      {user.phone || '—'}
                    </TableCell>

                    {/* Joined */}
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>

                    {/* Plan — FIX: from subscription.items, not _count */}
                    <TableCell>
                      {activePlan?.plan ? (
                        <Badge variant="outline" className="text-xs font-normal">
                          {activePlan.plan.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Activity counts — FIX: use clientBookings not bookings */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5 text-xs">
                        <Badge variant="outline" className="font-normal gap-0.5 px-1.5">
                          <span className="text-muted-foreground">R</span>
                          {user._count.requests}
                        </Badge>
                        <Badge variant="outline" className="font-normal gap-0.5 px-1.5">
                          <span className="text-muted-foreground">B</span>
                          {/* FIX: clientBookings not bookings */}
                          {user._count.clientBookings}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Actions — stop row click propagating into dropdown */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <UserActionsMenu
                        user={user}
                        onViewDetails={handleViewDetails}
                        onRefresh={handleRefresh}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <UserPagination
        hasNextPage={!!data.nextCursor}
        hasPreviousPage={!!params.cursor}
        onNext={handleNextPage}
        onPrevious={handlePreviousPage}
        isPending={isPending}
        total={data.total}
      />

      <UserDetailsDialog
        userId={selectedUserId}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
}