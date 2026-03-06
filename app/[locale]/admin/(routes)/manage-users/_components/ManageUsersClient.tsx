"use client";

// app/[locale]/admin/(routes)/manage-users/_components/ManageUsersClient.tsx
//
// Consolidates: UserTable + UserFilters + UserPagination + UserTableSkeleton
// Logic kept 100% identical to the originals.
// UserActionsMenu + UserDetailsDialog + SendNotificationDialog are NOT changed.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Calendar,
  Crown,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ── These components are imported UNCHANGED ──────────────────────────────────
import { UserActionsMenu } from "./UserActionsMenu";
import { UserDetailsDialog } from "./UserDetailsDialog";

// ── Server actions ────────────────────────────────────────────────────────────
import {
  getUsers,
  type GetUsersParams,
  type GetUsersReturn,
  type UserListItem,
} from "../actions";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(name: string | null, email: string) {
  if (name)
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  return email.slice(0, 2).toUpperCase();
}

// Deterministic avatar bg color derived from email
function avatarColor(email: string) {
  const palette = [
    "bg-violet-500/20 text-violet-500",
    "bg-blue-500/20 text-blue-500",
    "bg-emerald-500/20 text-emerald-500",
    "bg-amber-500/20 text-amber-500",
    "bg-rose-500/20 text-rose-500",
    "bg-[#7b57fc]/20 text-[#7b57fc]",
  ];
  const idx =
    email.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return palette[idx];
}

function joinedDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonRow({ i }: { i: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-border/40 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3.5 bg-muted rounded w-36" />
        <div className="h-3 bg-muted rounded w-52" />
      </div>
      <div className="hidden md:flex items-center gap-3">
        <div className="h-5 bg-muted rounded-full w-16" />
        <div className="h-5 bg-muted rounded-full w-16" />
        <div className="h-5 bg-muted rounded-full w-20" />
        <div className="h-3.5 bg-muted rounded w-20" />
      </div>
      <div className="flex justify-end gap-1.5">
        <div className="h-5 bg-muted rounded-full w-9" />
        <div className="h-5 bg-muted rounded-full w-9" />
      </div>
      <div className="h-8 w-8 bg-muted rounded-lg shrink-0" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS / ROLE / PLAN BADGES  (visual only, no logic)
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 leading-none whitespace-nowrap",
        isActive
          ? "text-emerald-600 dark:text-emerald-400 ring-emerald-400/30 bg-emerald-500/8"
          : "text-red-500 ring-red-400/30 bg-red-500/8",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isActive ? "bg-emerald-400" : "bg-red-400",
        )}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge
      variant={role === "ADMIN" ? "destructive" : "secondary"}
      className="text-[10px] h-5 px-1.5"
    >
      {role}
    </Badge>
  );
}

function PlanBadge({ user }: { user: UserListItem }) {
  const activePlan =
    user.subscription?.items.find((i) => i.status === "ACTIVE") ??
    user.subscription?.items[0];
  if (!activePlan?.plan) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
      {activePlan.plan.name}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SORT BUTTON (visual helper)
// ─────────────────────────────────────────────────────────────────────────────

function SortBtn({
  field,
  label,
  current,
  order,
  onClick,
}: {
  field: GetUsersParams["sortBy"];
  label: string;
  current: GetUsersParams["sortBy"];
  order: "asc" | "desc";
  onClick: (f: GetUsersParams["sortBy"]) => void;
}) {
  const active = current === field;
  return (
    <button
      onClick={() => onClick(field)}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium transition-colors",
        active
          ? "text-[#7b57fc]"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      {active ? (
        order === "asc" ? (
          <ChevronUp size={11} />
        ) : (
          <ChevronDown size={11} />
        )
      ) : (
        <ArrowUpDown size={10} className="opacity-40" />
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CLIENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  initialData: GetUsersReturn;
}

export function ManageUsersClient({ initialData }: Props) {
  // ── State — mirrors original UserTable exactly ────────────────────────────
  const [data, setData] = useState<GetUsersReturn>(initialData);
  const [params, setParams] = useState<GetUsersParams>({
    take: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [isPending, startTransition] = useTransition();
  const isFirstRender = useRef(true);

  // Details dialog (lifted from UserTable)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Filter panel visibility
  const [showFilters, setShowFilters] = useState(false);

  // ── Re-fetch on param change — same logic as UserTable ────────────────────
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    let mounted = true;
    startTransition(async () => {
      const result = await getUsers(params);
      if (!mounted) return;
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setData(result.data);
    });
    return () => {
      mounted = false;
    };
  }, [params]);

  // ── Handlers — same logic as UserTable / UserFilters ──────────────────────
  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      const result = await getUsers(params);
      if (!result.success) return;
      setData(result.data);
    });
  }, [params]);

  const handleSearch = useCallback((search: string) => {
    setParams((p) => ({
      ...p,
      search: search || undefined,
      cursor: undefined,
    }));
  }, []);

  const handleRoleFilter = useCallback((role: GetUsersParams["role"]) => {
    setParams((p) => ({ ...p, role, cursor: undefined }));
  }, []);

  const handleStatusFilter = useCallback((isActive: boolean | undefined) => {
    setParams((p) => ({ ...p, isActive, cursor: undefined }));
  }, []);

  const handleSort = useCallback((sortBy: GetUsersParams["sortBy"]) => {
    setParams((p) => {
      const sortOrder =
        p.sortBy === sortBy && p.sortOrder === "asc" ? "desc" : "asc";
      return { ...p, sortBy, sortOrder, cursor: undefined };
    });
  }, []);

  const handleNextPage = useCallback(() => {
    if (data.nextCursor)
      setParams((p) => ({ ...p, cursor: data.nextCursor ?? undefined }));
  }, [data.nextCursor]);

  const handlePreviousPage = useCallback(() => {
    setParams((p) => ({ ...p, cursor: undefined }));
  }, []);

  const handleViewDetails = useCallback((id: string) => {
    setSelectedUserId(id);
    setIsDetailsOpen(true);
  }, []);

  // Derived filter counts for badge
  const [searchVal, setSearchVal] = useState("");
  const [roleVal, setRoleVal] = useState<"ADMIN" | "CLIENT" | "ALL">("ALL");
  const [statusVal, setStatusVal] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL",
  );

  const activeFilterCount = [
    searchVal,
    roleVal !== "ALL" ? "1" : "",
    statusVal !== "ALL" ? "1" : "",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchVal("");
    setRoleVal("ALL");
    setStatusVal("ALL");
    setParams({ take: 20, sortBy: "createdAt", sortOrder: "desc" });
  };

  // ── Debounced search ──────────────────────────────────────────────────────
  const debRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onSearchChange = (val: string) => {
    setSearchVal(val);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => handleSearch(val), 400);
  };

  const onRoleChange = (val: "ADMIN" | "CLIENT" | "ALL") => {
    setRoleVal(val);
    handleRoleFilter(
      val === "ALL" ? undefined : (val as GetUsersParams["role"]),
    );
  };

  const onStatusChange = (val: "ALL" | "ACTIVE" | "INACTIVE") => {
    setStatusVal(val);
    handleStatusFilter(val === "ALL" ? undefined : val === "ACTIVE");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="h-full rounded-2xl border border-border/50 bg-card overflow-hidden flex flex-col shadow-sm">
        {/* ── FILTER BAR ──────────────────────────────────────────────────── */}
        <div className="px-4 pt-3.5 pb-2 border-b border-border/40 shrink-0 space-y-2.5">
          {/* Row 1: search + controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-48 max-w-sm">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              {isPending && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-[#7b57fc] border-t-transparent animate-spin" />
              )}
              <Input
                value={searchVal}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by name, email or phone…"
                className="pl-8 pr-7 h-8 text-sm bg-muted/40 border-border/50 rounded-lg focus:bg-background focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20 transition-all"
              />
              {searchVal && (
                <Button
                  variant={"ghost"}
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={11} />
                </Button>
              )}
            </div>

            {/* Selects */}
            <Select
              value={roleVal}
              onValueChange={(v) => onRoleChange(v as typeof roleVal)}
            >
              <SelectTrigger className="w-32 h-8 text-xs bg-muted/40 border-border/50 rounded-lg">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="CLIENT">Client</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusVal}
              onValueChange={(v) => onStatusChange(v as typeof statusVal)}
            >
              <SelectTrigger className="w-32 h-8 text-xs bg-muted/40 border-border/50 rounded-lg">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-red-500 hover:border-red-400/40 transition-all"
                title="Clear all filters"
              >
                <X size={13} />
              </button>
            )}

            {/* Sort buttons */}
            <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-border/40 ml-auto">
              <SortBtn
                field="fullName"
                label="Name"
                current={params.sortBy!}
                order={params.sortOrder!}
                onClick={handleSort}
              />
              <SortBtn
                field="email"
                label="Email"
                current={params.sortBy!}
                order={params.sortOrder!}
                onClick={handleSort}
              />
              <SortBtn
                field="createdAt"
                label="Joined"
                current={params.sortBy!}
                order={params.sortOrder!}
                onClick={handleSort}
              />
            </div>

            {/* Count + refresh */}
            <div className="flex items-center gap-2 sm:ml-0 ml-auto">
              <span className="text-xs text-muted-foreground tabular-nums hidden md:block">
                {data.total.toLocaleString()} user{data.total !== 1 ? "s" : ""}
              </span>
              <button
                onClick={handleRefresh}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Refresh"
              >
                <RefreshCw
                  size={11}
                  className={isPending ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <SlidersHorizontal size={12} className="text-muted-foreground" />
              {roleVal !== "ALL" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#7b57fc]/10 text-[#7b57fc] ring-1 ring-[#7b57fc]/20">
                  Role: {roleVal}
                  <Button variant={"ghost"} onClick={() => onRoleChange("ALL")}>
                    <X size={9} />
                  </Button>
                </span>
              )}
              {statusVal !== "ALL" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#7b57fc]/10 text-[#7b57fc] ring-1 ring-[#7b57fc]/20">
                  Status: {statusVal}
                  <Button
                    variant={"ghost"}
                    onClick={() => onStatusChange("ALL")}
                  >
                    <X size={9} />
                  </Button>
                </span>
              )}
              {searchVal && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#7b57fc]/10 text-[#7b57fc] ring-1 ring-[#7b57fc]/20">
                  "{searchVal}"
                  <Button variant={"ghost"} onClick={() => onSearchChange("")}>
                    <X size={9} />
                  </Button>
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {data.total} user{data.total !== 1 ? "s" : ""} found
              </span>
            </div>
          )}

          {/* Column headers */}
          <div className="hidden lg:grid grid-cols-[2.25rem_1fr_repeat(3,6rem)_5rem_5rem_2.25rem] items-center gap-3 pt-1">
            {[
              "",
              "User",
              "Role",
              "Status",
              "Plan",
              "Joined",
              "Activity",
              "",
            ].map((h, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center first:text-left last:text-right"
              >
                {h}
              </span>
            ))}
          </div>
        </div>

        {/* ── USER LIST ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0 relative">
          {/* Pending overlay */}
          <AnimatePresence>
            {isPending && data.users.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-10 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Skeleton initial load */}
          {isPending && data.users.length === 0 ? (
            Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} i={i} />
            ))
          ) : data.users.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 py-16">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/50"
              >
                <Users size={26} className="text-muted-foreground/40" />
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-foreground/70">
                  No users found
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search or filters
                </p>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-[#7b57fc] hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            /* User rows */
            <AnimatePresence initial={false}>
              {data.users.map((user, i) => (
                <motion.div
                  key={user.id}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{
                    delay: i * 0.02,
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                  }}
                  onClick={() => handleViewDetails(user.id)}
                  className="group flex items-center gap-3 px-4 py-3.5 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  {/* Avatar with status dot */}
                  <div
                    className="relative shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Avatar className="h-9 w-9 ring-2 ring-border/40">
                      <AvatarImage src={user.avatarUrl ?? undefined} />
                      <AvatarFallback
                        className={cn(
                          "text-xs font-bold",
                          avatarColor(user.email),
                        )}
                      >
                        {getInitials(user.fullName, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                        user.isActive
                          ? "bg-emerald-400"
                          : "bg-muted-foreground",
                      )}
                    />
                  </div>

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user.fullName ?? (
                        <span className="italic text-muted-foreground">
                          No name
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>

                  {/* Role */}
                  <div className="hidden lg:flex justify-center w-24 shrink-0">
                    <RoleBadge role={user.role} />
                  </div>

                  {/* Status */}
                  <div className="hidden lg:flex justify-center w-24 shrink-0">
                    <StatusBadge isActive={user.isActive} />
                  </div>

                  {/* Plan */}
                  <div className="hidden lg:flex justify-center w-24 shrink-0">
                    <PlanBadge user={user} />
                  </div>

                  {/* Joined */}
                  <div className="hidden md:flex items-center gap-1.5 w-20 shrink-0">
                    <Calendar
                      size={10}
                      className="text-muted-foreground/50 shrink-0"
                    />
                    <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {joinedDate(user.createdAt)}
                    </span>
                  </div>

                  {/* Activity — R (requests) + B (bookings) */}
                  <div className="hidden sm:flex justify-end items-center gap-1.5 w-20 shrink-0">
                    <Badge
                      variant="outline"
                      className="font-normal gap-0.5 px-1.5 text-[10px] h-5"
                    >
                      <span className="text-muted-foreground">R</span>
                      {user._count.requests}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="font-normal gap-0.5 px-1.5 text-[10px] h-5"
                    >
                      <span className="text-muted-foreground">B</span>
                      {user._count.clientBookings}
                    </Badge>
                  </div>

                  {/* Actions — stop click from opening the details dialog */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  >
                    <UserActionsMenu
                      user={user}
                      onViewDetails={handleViewDetails}
                      onRefresh={handleRefresh}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* ── PAGINATION ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 shrink-0">
          <p className="text-xs text-muted-foreground">
            Total{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {data.total.toLocaleString()}
            </span>{" "}
            users
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePreviousPage}
              disabled={!params.cursor || isPending}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border transition-all text-muted-foreground",
                params.cursor && !isPending
                  ? "border-border/60 hover:border-border hover:text-foreground hover:bg-muted/40"
                  : "border-border/30 opacity-40 cursor-not-allowed",
              )}
            >
              {isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <ChevronLeft size={14} />
              )}
            </button>
            <button
              onClick={handleNextPage}
              disabled={!data.nextCursor || isPending}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border transition-all text-muted-foreground",
                data.nextCursor && !isPending
                  ? "border-border/60 hover:border-border hover:text-foreground hover:bg-muted/40"
                  : "border-border/30 opacity-40 cursor-not-allowed",
              )}
            >
              {isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── UserDetailsDialog — completely unchanged ──────────────────────── */}
      <UserDetailsDialog
        userId={selectedUserId}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </>
  );
}
