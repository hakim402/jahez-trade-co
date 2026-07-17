"use client";

// app/[locale]/admin/(routes)/manage-employees/_components/EmployeeActionsMenu.tsx

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
  Globe,
  EyeOff,
  UserMinus,
  Trash2,
  Loader2,
  AlertTriangle,
  UserX,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  publishEmployeeProfile,
  unpublishEmployeeProfile,
  demoteFromEmployee,
  deleteEmployeeProfile,
  getEmployeeById,
  type EmployeeListItem,
  type EmployeeDetail,
} from "../actions";
import { EmployeeFormDialog } from "./EmployeeFormDialog";

interface EmployeeActionsMenuProps {
  employee: EmployeeListItem;
  onViewDetails: (id: string) => void;
  onRefresh: () => void;
}

export function EmployeeActionsMenu({
  employee,
  onViewDetails,
  onRefresh,
}: EmployeeActionsMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [demoteAlertOpen, setDemoteAlertOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<EmployeeDetail | null>(null);

  const isPublished = employee.status === "PUBLISHED";
  const displayName = employee.user.fullName || employee.user.email;

  const handlePublishToggle = async () => {
    setIsLoading(true);
    try {
      const result = isPublished
        ? await unpublishEmployeeProfile(employee.id)
        : await publishEmployeeProfile(employee.id);
      if (!result.success) { toast.error(result.error); return; }
      toast.success(isPublished ? "Profile unpublished" : "Profile published");
      onRefresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEdit = async () => {
    setIsLoading(true);
    try {
      const result = await getEmployeeById(employee.id);
      if (!result.success) { toast.error(result.error); return; }
      setEditEmployee(result.data.employee);
      setEditOpen(true);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemote = async () => {
    setIsLoading(true);
    try {
      const result = await demoteFromEmployee(employee.userId, "Admin action");
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Employee demoted to user");
      onRefresh();
    } catch {
      toast.error("Failed to demote employee");
    } finally {
      setIsLoading(false);
      setDemoteAlertOpen(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteEmployeeProfile(employee.id);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Employee profile deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete profile");
    } finally {
      setIsLoading(false);
      setDeleteAlertOpen(false);
    }
  };

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
            {isLoading
              ? <Loader2 size={14} className="animate-spin" />
              : <MoreHorizontal size={14} />}
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
            onClick={() => onViewDetails(employee.id)}
            className="flex items-center gap-2.5 text-sm px-2 py-2 rounded-lg cursor-pointer text-foreground focus:bg-muted/60 focus:text-foreground"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/60">
              <Eye size={12} className="text-muted-foreground" />
            </div>
            View details
          </DropdownMenuItem>

          {/* Edit profile */}
          <DropdownMenuItem
            onClick={handleOpenEdit}
            className="flex items-center gap-2.5 text-sm px-2 py-2 rounded-lg cursor-pointer focus:bg-[#7b57fc]/10 focus:text-[#7b57fc]"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#7b57fc]/10">
              <Pencil size={12} className="text-[#7b57fc]" />
            </div>
            Edit profile
          </DropdownMenuItem>

          {/* Publish / Unpublish */}
          <DropdownMenuItem
            onClick={handlePublishToggle}
            className={cn(
              "flex items-center gap-2.5 text-sm px-2 py-2 rounded-lg cursor-pointer",
              isPublished
                ? "focus:bg-amber-500/10 focus:text-amber-600 dark:focus:text-amber-400"
                : "focus:bg-emerald-500/10 focus:text-emerald-600 dark:focus:text-emerald-400",
            )}
          >
            <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", isPublished ? "bg-amber-500/10" : "bg-emerald-500/10")}>
              {isPublished
                ? <EyeOff size={12} className="text-amber-500" />
                : <Globe size={12} className="text-emerald-500" />}
            </div>
            {isPublished ? "Unpublish" : "Publish"}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 bg-border/50" />

          {/* Demote */}
          <DropdownMenuItem
            onClick={() => setDemoteAlertOpen(true)}
            className="flex items-center gap-2.5 text-sm px-2 py-2 rounded-lg cursor-pointer focus:bg-orange-500/10 focus:text-orange-600 dark:focus:text-orange-400"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/10">
              <UserMinus size={12} className="text-orange-500" />
            </div>
            Demote to user
          </DropdownMenuItem>

          {/* Delete */}
          <DropdownMenuItem
            onClick={() => setDeleteAlertOpen(true)}
            className="flex items-center gap-2.5 text-sm px-2 py-2 rounded-lg cursor-pointer focus:bg-red-500/10 focus:text-red-500 text-red-500"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/10">
              <Trash2 size={12} className="text-red-500" />
            </div>
            Delete profile
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit dialog */}
      <EmployeeFormDialog
        employee={editEmployee}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onRefresh}
      />

      {/* Demote confirmation */}
      <AlertDialog open={demoteAlertOpen} onOpenChange={setDemoteAlertOpen}>
        <AlertDialogContent className="rounded-2xl border border-border/60 bg-card p-0 overflow-hidden w-[92vw] sm:max-w-sm shadow-2xl">
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 bg-orange-500/5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15">
              <UserX size={18} className="text-orange-500" />
            </div>
            <AlertDialogHeader className="space-y-0 text-left p-0">
              <AlertDialogTitle className="text-base font-semibold text-foreground">
                Demote this employee?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{displayName}</span> will lose employee status. Their profile will be set to Draft but not deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="flex-row justify-end gap-2 px-5 py-4 border-t border-border/40 bg-muted/20">
            <AlertDialogCancel className="h-8 text-xs rounded-lg border-border/60 bg-background hover:bg-muted/60 m-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDemote}
              className="h-8 text-xs rounded-lg bg-orange-500 hover:bg-orange-600 text-white m-0"
            >
              Demote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent className="rounded-2xl border border-border/60 bg-card p-0 overflow-hidden w-[92vw] sm:max-w-sm shadow-2xl">
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 bg-red-500/5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <AlertDialogHeader className="space-y-0 text-left p-0">
              <AlertDialogTitle className="text-base font-semibold text-foreground">
                Delete profile?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{displayName}</span>'s employee profile will be permanently deleted and they will be set back to a regular user.
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
              Delete profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}