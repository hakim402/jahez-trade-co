"use client";

// app/[locale]/admin/(routes)/manage-employees/_components/PromoteUserDialog.tsx

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Loader2,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getEligibleUsers,
  promoteToEmployee,
  type EligibleUser,
} from "../actions";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(name: string | null, email: string) {
  if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return email.slice(0, 2).toUpperCase();
}

function avatarColor(email: string) {
  const palette = [
    "bg-violet-500/20 text-violet-500",
    "bg-blue-500/20 text-blue-500",
    "bg-emerald-500/20 text-emerald-500",
    "bg-amber-500/20 text-amber-500",
    "bg-rose-500/20 text-rose-500",
    "bg-[#7b57fc]/20 text-[#7b57fc]",
  ];
  const idx = email.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return palette[idx];
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface PromoteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function PromoteUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: PromoteUserDialogProps) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<EligibleUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const debRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchUsers = async (q: string) => {
    setIsLoading(true);
    try {
      const result = await getEligibleUsers({ search: q || undefined, take: 30 });
      if (!result.success) { toast.error(result.error); return; }
      setUsers(result.data.users);
      setTotal(result.data.total);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  // Load on open
  useEffect(() => {
    if (open) { setSearch(""); fetchUsers(""); }
  }, [open]);

  const onSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => fetchUsers(val), 350);
  };

  const handlePromote = async (user: EligibleUser) => {
    setPromotingId(user.id);
    try {
      const result = await promoteToEmployee(user.id);
      if (!result.success) { toast.error(result.error); return; }
      toast.success(`${user.fullName ?? user.email} promoted to employee`);
      onSuccess();
      // Remove from list immediately
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setTotal((t) => t - 1);
    } catch {
      toast.error("Failed to promote user");
    } finally {
      setPromotingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[96vw] sm:max-w-md",
          "h-[80vh] overflow-hidden flex flex-col p-0",
          "bg-card border border-border/60 shadow-2xl rounded-2xl",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97]",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.97]",
          "duration-200",
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border/40 shrink-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
            <UserCheck size={16} className="text-blue-500" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-foreground">
              Add Employee
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {total} eligible user{total !== 1 ? "s" : ""} available
            </DialogDescription>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-border/40 shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            {isLoading && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-[#7b57fc] border-t-transparent animate-spin" />
            )}
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name or email…"
              className="pl-8 pr-7 h-8 text-sm bg-muted/40 border-border/50 rounded-lg focus:bg-background focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20 transition-all"
              autoFocus
            />
            {search && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          {isLoading && users.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={18} className="animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
              <UserCheck size={22} className="opacity-30" />
              <p className="text-sm">No eligible users found</p>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-5 py-3 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
              >
                <Avatar className="h-8 w-8 ring-2 ring-border/40 shrink-0">
                  <AvatarImage src={user.avatarUrl ?? undefined} />
                  <AvatarFallback className={cn("text-xs font-bold", avatarColor(user.email))}>
                    {getInitials(user.fullName, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.fullName ?? (
                      <span className="italic text-muted-foreground">No name</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={promotingId === user.id}
                  onClick={() => handlePromote(user)}
                  className="h-7 text-xs rounded-lg border-border/60 hover:border-blue-400/60 hover:bg-blue-500/5 hover:text-blue-600 dark:hover:text-blue-400 transition-all gap-1 shrink-0"
                >
                  {promotingId === user.id ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <UserCheck size={11} />
                  )}
                  Promote
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}