"use client";

// app/[locale]/admin/(routes)/manage-users/_components/UserActionsMenu.tsx

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Eye,
  Bell,
  Shield,
  ShieldOff,
  Trash2,
  Loader2,
  AlertTriangle,
  UserCheck,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  banUser,
  unbanUser,
  softDeleteUser,
  impersonateUser,
  promoteToEmployee,
  demoteToClient,
} from "../actions";
import { SendNotificationDialog } from "./SendNotificationDialog";
import type { UserListItem } from "../actions";

interface UserActionsMenuProps {
  user: UserListItem;
  onViewDetails: (id: string) => void;
  onRefresh: () => void;
}

export function UserActionsMenu({
  user,
  onViewDetails,
  onRefresh,
}: UserActionsMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [banAlertOpen, setBanAlertOpen] = useState(false);
  const [promoteAlertOpen, setPromoteAlertOpen] = useState(false);
  const [demoteAlertOpen, setDemoteAlertOpen] = useState(false);

  const handleBanToggle = async () => {
    setIsLoading(true);
    try {
      const result = user.isActive
        ? await banUser({ id: user.id, reason: "Admin action" })
        : await unbanUser({ id: user.id });
      if (!result.success) { toast.error(result.error); return; }
      toast.success(user.isActive ? "User banned" : "User unbanned");
      onRefresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setIsLoading(false);
      setBanAlertOpen(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await softDeleteUser({ id: user.id });
      if (!result.success) { toast.error(result.error); return; }
      toast.success("User deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setIsLoading(false);
      setDeleteAlertOpen(false);
    }
  };

  const handleImpersonate = async () => {
    setIsLoading(true);
    try {
      const result = await impersonateUser({ id: user.id });
      if (!result.success) { toast.error(result.error); return; }
      const url = `${window.location.origin}/?__clerk_ticket=${result.data.signInToken}`;
      window.open(url, "_blank");
      toast.success("Impersonation token generated", {
        description: "Opened in a new tab. Token expires in 60 seconds.",
      });
    } catch {
      toast.error("Failed to generate impersonation token");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromote = async () => {
    setIsLoading(true);
    try {
      const result = await promoteToEmployee({ id: user.id });
      if (!result.success) { toast.error(result.error); return; }
      toast.success("User promoted to employee", {
        description: "You can now fill in their profile from Manage Employees.",
      });
      onRefresh();
    } catch {
      toast.error("Failed to promote user");
    } finally {
      setIsLoading(false);
      setPromoteAlertOpen(false);
    }
  };

  const handleDemote = async () => {
    setIsLoading(true);
    try {
      const result = await demoteToClient({ id: user.id, reason: "Admin action" });
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Employee demoted to client");
      onRefresh();
    } catch {
      toast.error("Failed to demote employee");
    } finally {
      setIsLoading(false);
      setDemoteAlertOpen(false);
    }
  };

  const displayName = user.fullName || user.email;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={isLoading}
            className="h-7 w-7 rounded-lg text-muted-foreground"
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <MoreHorizontal size={14} />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-48 rounded-xl border border-border/60 bg-card/95 backdrop-blur-sm shadow-xl p-1"
        >
          <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
            Actions
          </DropdownMenuLabel>

          {/* View details */}
          <DropdownMenuItem
            onClick={() => onViewDetails(user.id)}
            className="flex items-center gap-2.5 text-sm px-2 py-2 rounded-lg cursor-pointer text-foreground focus:bg-muted/60 focus:text-foreground"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/60">
              <Eye size={12} className="text-muted-foreground" />
            </div>
            View details
          </DropdownMenuItem>

          {/* Send notification */}
          <DropdownMenuItem
            onClick={() => setNotifOpen(true)}
            className="flex items-center gap-2.5 text-sm px-2 py-2 rounded-lg cursor-pointer focus:bg-[#7b57fc]/10 focus:text-[#7b57fc]"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#7b57fc]/10">
              <Bell size={12} className="text-[#7b57fc]" />
            </div>
            Send notification
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 bg-border/50" />

          {/* Promote / Demote */}
          {user.isEmployee ? (
            <DropdownMenuItem
              onClick={() => setDemoteAlertOpen(true)}
              className="flex items-center gap-2.5 text-sm px-2 py-2 rounded-lg cursor-pointer focus:bg-orange-500/10 focus:text-orange-600 dark:focus:text-orange-400"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/10">
                <UserMinus size={12} className="text-orange-500" />
              </div>
              Demote to client
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setPromoteAlertOpen(true)}
              className="flex items-center gap-2.5 text-sm px-2 py-2 rounded-lg cursor-pointer focus:bg-blue-500/10 focus:text-blue-600 dark:focus:text-blue-400"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10">
                <UserCheck size={12} className="text-blue-500" />
              </div>
              Make employee
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="my-1 bg-border/50" />

          {/* Ban / Unban */}
          <DropdownMenuItem
            onClick={() => setBanAlertOpen(true)}
            className={cn(
              "flex items-center gap-2.5 text-sm px-2 py-2 rounded-lg cursor-pointer",
              user.isActive
                ? "focus:bg-amber-500/10 focus:text-amber-600 dark:focus:text-amber-400"
                : "focus:bg-emerald-500/10 focus:text-emerald-600 dark:focus:text-emerald-400",
            )}
          >
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md",
              user.isActive ? "bg-amber-500/10" : "bg-emerald-500/10",
            )}>
              {user.isActive ? (
                <Shield size={12} className="text-amber-500" />
              ) : (
                <ShieldOff size={12} className="text-emerald-500" />
              )}
            </div>
            {user.isActive ? "Ban user" : "Unban user"}
          </DropdownMenuItem>

          {/* Delete */}
          <DropdownMenuItem
            onClick={() => setDeleteAlertOpen(true)}
            className="flex items-center gap-2.5 text-sm px-2 py-2 rounded-lg cursor-pointer focus:bg-red-500/10 focus:text-red-500 text-red-500"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/10">
              <Trash2 size={12} className="text-red-500" />
            </div>
            Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SendNotificationDialog
        userId={user.id}
        userName={user.fullName}
        open={notifOpen}
        onOpenChange={setNotifOpen}
      />

      {/* ── Promote confirmation ─────────────────────────────────────────── */}
      <AlertDialog open={promoteAlertOpen} onOpenChange={setPromoteAlertOpen}>
        <AlertDialogContent className="rounded-2xl border border-border/60 bg-card p-0 overflow-hidden w-[92vw] sm:max-w-sm shadow-2xl">
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 bg-blue-500/5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15">
              <UserCheck size={18} className="text-blue-500" />
            </div>
            <AlertDialogHeader className="space-y-0 text-left p-0">
              <AlertDialogTitle className="text-base font-semibold text-foreground">
                Make employee?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{displayName}</span>
                {" "}will be promoted. You can complete their profile in Manage Employees.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="flex-row justify-end gap-2 px-5 py-4 border-t border-border/40 bg-muted/20">
            <AlertDialogCancel className="h-8 text-xs rounded-lg border-border/60 bg-background hover:bg-muted/60 m-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePromote}
              className="h-8 text-xs rounded-lg bg-blue-500 hover:bg-blue-600 text-white m-0 cursor-pointer"
            >
              Promote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Demote confirmation ──────────────────────────────────────────── */}
      <AlertDialog open={demoteAlertOpen} onOpenChange={setDemoteAlertOpen}>
        <AlertDialogContent className="rounded-2xl border border-border/60 bg-card p-0 overflow-hidden w-[92vw] sm:max-w-sm shadow-2xl">
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 bg-orange-500/5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15">
              <UserMinus size={18} className="text-orange-500" />
            </div>
            <AlertDialogHeader className="space-y-0 text-left p-0">
              <AlertDialogTitle className="text-base font-semibold text-foreground">
                Demote to client?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{displayName}</span>
                {" "}will lose employee status and their profile will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="flex-row justify-end gap-2 px-5 py-4 border-t border-border/40 bg-muted/20">
            <AlertDialogCancel className="h-8 text-xs rounded-lg border-border/60 bg-background hover:bg-muted/60 m-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDemote}
              className="h-8 text-xs rounded-lg bg-orange-500 hover:bg-orange-600 text-white m-0 cursor-pointer"
            >
              Demote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Ban / Unban confirmation ─────────────────────────────────────── */}
      <AlertDialog open={banAlertOpen} onOpenChange={setBanAlertOpen}>
        <AlertDialogContent className="rounded-2xl border border-border/60 bg-card p-0 overflow-hidden w-[92vw] sm:max-w-sm shadow-2xl">
          <div className={cn(
            "flex items-center gap-3 px-5 pt-5 pb-4",
            user.isActive ? "bg-amber-500/5" : "bg-emerald-500/5",
          )}>
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              user.isActive ? "bg-amber-500/15" : "bg-emerald-500/15",
            )}>
              {user.isActive ? (
                <Shield size={18} className="text-amber-500" />
              ) : (
                <ShieldOff size={18} className="text-emerald-500" />
              )}
            </div>
            <AlertDialogHeader className="space-y-0 text-left p-0">
              <AlertDialogTitle className="text-base font-semibold text-foreground">
                {user.isActive ? "Ban this user?" : "Unban this user?"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                {user.isActive
                  ? `${displayName} will be blocked from signing in.`
                  : `${displayName} will regain access to their account.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="flex-row justify-end gap-2 px-5 py-4 border-t border-border/40 bg-muted/20">
            <AlertDialogCancel className="h-8 text-xs rounded-lg border-border/60 bg-background hover:bg-muted/60 m-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanToggle}
              className={cn(
                "h-8 text-xs rounded-lg text-white m-0 cursor-pointer",
                user.isActive
                  ? "bg-amber-500! hover:bg-amber-600!"
                  : "bg-emerald-500! hover:bg-emerald-600!",
              )}
            >
              {user.isActive ? "Ban user" : "Unban user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete confirmation ──────────────────────────────────────────── */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent className="rounded-2xl border border-border/60 bg-card p-0 overflow-hidden w-[92vw] sm:max-w-sm shadow-2xl">
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 bg-red-500/5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <AlertDialogHeader className="space-y-0 text-left p-0">
              <AlertDialogTitle className="text-base font-semibold text-foreground">
                Delete this user?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{displayName}</span>
                {" "}will be soft-deleted and banned from Clerk.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="flex-row justify-end gap-2 px-5 py-4 border-t border-border/40 bg-muted/20">
            <AlertDialogCancel className="h-8 text-xs rounded-lg border-border/60 bg-background hover:bg-muted/60 m-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-8 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-white m-0"
            >
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}