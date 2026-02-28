// app/[locale]/admin/users/_components/UserTable.tsx
'use client';

import { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { UserFilters } from './UserFilters';
import { UserPagination } from './UserPagination';
import { UserDetailsDialog } from './UserDetailsDialog';
import { getUsers, type GetUsersParams, type GetUsersReturn } from '../actions';

interface UserTableProps {
  initialData: GetUsersReturn;
}

export function UserTable({ initialData }: UserTableProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [params, setParams] = useState<GetUsersParams>({
    take: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [isPending, startTransition] = useTransition();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Ref to skip the initial fetch (since we already have initialData)
  const isFirstRender = useRef(true);

  // Fetch data when params change (except on first mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let isMounted = true;
    startTransition(async () => {
      try {
        const result = await getUsers(params);
        if (isMounted) {
          setData(result);
        }
      } catch (error) {
        if (isMounted) {
          toast.error('Failed to fetch users', {
            description: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    });
    return () => { isMounted = false; };
  }, [params]);

  // Stable handlers that only update params
  const handleSearch = useCallback((search: string) => {
    setParams(prev => ({ ...prev, search, cursor: undefined }));
  }, []);

  const handleRoleFilter = useCallback((role: GetUsersParams['role']) => {
    setParams(prev => ({ ...prev, role, cursor: undefined }));
  }, []);

  const handleSort = useCallback((sortBy: GetUsersParams['sortBy']) => {
    setParams(prev => {
      const sortOrder = prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc';
      return { ...prev, sortBy, sortOrder, cursor: undefined };
    });
  }, []);

  const handleNextPage = useCallback(() => {
    if (data.nextCursor) {
      setParams(prev => ({ ...prev, cursor: data.nextCursor ?? undefined,}));
    }
  }, [data.nextCursor]);

  const handlePreviousPage = useCallback(() => {
    setParams(prev => ({ ...prev, cursor: undefined }));
  }, []);

  const handleViewDetails = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setIsDetailsOpen(true);
  }, []);

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getRoleBadgeVariant = (role: 'ADMIN' | 'CLIENT') => {
    return role === 'ADMIN' ? 'destructive' : 'secondary';
  };

  return (
    <div className="space-y-4">
      <UserFilters
        onSearch={handleSearch}
        onRoleFilter={handleRoleFilter}
        isPending={isPending}
      />

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-62.5">User</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => handleSort('email')}
                >
                  Email
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => handleSort('createdAt')}
                >
                  Joined
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Activity</TableHead>
              <TableHead className="w-17.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              data.users.map((user) => (
                <TableRow key={user.id} className="group">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl || ''} />
                        <AvatarFallback className="bg-primary/10 text-xs">
                          {getInitials(user.fullName, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate max-w-37.5">
                        {user.fullName || '—'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="truncate max-w-50">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.phone || '—'}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 text-xs">
                      <Badge variant="outline" className="font-normal">
                        R:{user._count.requests}
                      </Badge>
                      <Badge variant="outline" className="font-normal">
                        B:{user._count.bookings}
                      </Badge>
                      <Badge variant="outline" className="font-normal">
                        S:{user._count.subscriptions}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetails(user.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
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
        currentPage={params.cursor ? 'custom' : 1}
      />

      <UserDetailsDialog
        userId={selectedUserId}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
}