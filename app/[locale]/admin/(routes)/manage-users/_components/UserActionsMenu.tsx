'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  Eye,
  Bell,
  Shield,
  ShieldOff,
  Trash2,
  LogIn,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { banUser, unbanUser, softDeleteUser, impersonateUser } from '../actions';
import { SendNotificationDialog } from './SendNotificationDialog';
import type { UserListItem } from '../actions';

interface UserActionsMenuProps {
  user: UserListItem;
  onViewDetails: (id: string) => void;
  onRefresh: () => void;
}

export function UserActionsMenu({ user, onViewDetails, onRefresh }: UserActionsMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [banAlertOpen, setBanAlertOpen] = useState(false);

  const handleBanToggle = async () => {
    setIsLoading(true);
    try {
      const result = user.isActive
        ? await banUser({ id: user.id, reason: 'Admin action' })
        : await unbanUser({ id: user.id });

      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(user.isActive ? 'User banned' : 'User unbanned');
      onRefresh();
    } catch {
      toast.error('Action failed');
    } finally {
      setIsLoading(false);
      setBanAlertOpen(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await softDeleteUser({ id: user.id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('User deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setIsLoading(false);
      setDeleteAlertOpen(false);
    }
  };

  const handleImpersonate = async () => {
    setIsLoading(true);
    try {
      const result = await impersonateUser({ id: user.id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      // Open impersonation URL in new tab
      const url = `${window.location.origin}/?__clerk_ticket=${result.data.signInToken}`;
      window.open(url, '_blank');
      toast.success('Impersonation token generated', {
        description: 'Opened in a new tab. Token expires in 60 seconds.',
      });
    } catch {
      toast.error('Failed to generate impersonation token');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => onViewDetails(user.id)}>
            <Eye className="mr-2 h-4 w-4" />
            View details
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setNotifOpen(true)}>
            <Bell className="mr-2 h-4 w-4" />
            Send notification
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleImpersonate}>
            <LogIn className="mr-2 h-4 w-4" />
            Impersonate
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setBanAlertOpen(true)}>
            {user.isActive ? (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Ban user
              </>
            ) : (
              <>
                <ShieldOff className="mr-2 h-4 w-4" />
                Unban user
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteAlertOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Send notification dialog */}
      <SendNotificationDialog
        userId={user.id}
        userName={user.fullName}
        open={notifOpen}
        onOpenChange={setNotifOpen}
      />

      {/* Ban/unban confirmation */}
      <AlertDialog open={banAlertOpen} onOpenChange={setBanAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.isActive ? 'Ban this user?' : 'Unban this user?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.isActive
                ? `${user.fullName || user.email} will be blocked from signing in. You can unban them at any time.`
                : `${user.fullName || user.email} will regain access to their account.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanToggle}
              className={user.isActive ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              {user.isActive ? 'Ban user' : 'Unban user'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{user.fullName || user.email}</span> will be soft-deleted
              and banned from Clerk. This action can be reversed by a developer directly in the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}