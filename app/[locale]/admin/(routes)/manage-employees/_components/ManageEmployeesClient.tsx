"use client";

// app/[locale]/admin/(routes)/manage-employees/_components/ManageEmployeesClient.tsx

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
  RefreshCw,
  SlidersHorizontal,
  Users2,
  GripVertical,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

import { EmployeeActionsMenu } from "./EmployeeActionsMenu";
import { EmployeeDetailsDialog } from "./EmployeeDetailsDialog";
import { PromoteUserDialog } from "./PromoteUserDialog";

import {
  getEmployees,
  type GetEmployeesParams,
  type EmployeeListItem,
} from "../actions";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS  (unchanged)
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
// SKELETON  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-border/40 animate-pulse">
      <div className="h-4 w-4 bg-muted rounded shrink-0" />
      <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3.5 bg-muted rounded w-36" />
        <div className="h-3 bg-muted rounded w-52" />
      </div>
      <div className="hidden md:flex items-center gap-3">
        <div className="h-5 bg-muted rounded-full w-20" />
        <div className="h-5 bg-muted rounded-full w-16" />
        <div className="h-3.5 bg-muted rounded w-20" />
        <div className="h-3.5 bg-muted rounded w-16" />
      </div>
      <div className="h-8 w-8 bg-muted rounded-lg shrink-0" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGES  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function PublishBadge({ status }: { status: string }) {
  const published = status === "PUBLISHED";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 leading-none whitespace-nowrap",
      published
        ? "text-emerald-600 dark:text-emerald-400 ring-emerald-400/30 bg-emerald-500/8"
        : "text-amber-600 dark:text-amber-400 ring-amber-400/30 bg-amber-500/8",
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", published ? "bg-emerald-400" : "bg-amber-400")} />
      {published ? "Published" : "Draft"}
    </span>
  );
}

function UserActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 leading-none whitespace-nowrap",
      isActive
        ? "text-blue-600 dark:text-blue-400 ring-blue-400/30 bg-blue-500/8"
        : "text-red-500 ring-red-400/30 bg-red-500/8",
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-blue-400" : "bg-red-400")} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SORT BUTTON  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function SortBtn({
  field, label, current, order, onClick,
}: {
  field: GetEmployeesParams["sortBy"];
  label: string;
  current: GetEmployeesParams["sortBy"];
  order: "asc" | "desc";
  onClick: (f: GetEmployeesParams["sortBy"]) => void;
}) {
  const active = current === field;
  return (
    <button
      onClick={() => onClick(field)}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium transition-colors",
        active ? "text-[#7b57fc]" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      {active
        ? order === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
        : <ArrowUpDown size={10} className="opacity-40" />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

type GetEmployeesReturn = {
  employees: EmployeeListItem[];
  nextCursor: string | null;
  total: number;
};

interface Props {
  initialData: GetEmployeesReturn;
}

export function ManageEmployeesClient({ initialData }: Props) {
  const [data, setData] = useState<GetEmployeesReturn>(initialData);
  const [params, setParams] = useState<GetEmployeesParams>({
    take: 20,
    sortBy: "displayOrder",
    sortOrder: "asc",
  });
  const [isPending, startTransition] = useTransition();
  const isFirstRender = useRef(true);

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);

  const [searchVal, setSearchVal] = useState("");
  const [statusVal, setStatusVal] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [activeVal, setActiveVal] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Re-fetch on param change
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    let mounted = true;
    startTransition(async () => {
      const result = await getEmployees(params);
      if (!mounted) return;
      if (!result.success) { toast.error(result.error); return; }
      setData(result.data);
    });
    return () => { mounted = false; };
  }, [params]);

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      const result = await getEmployees(params);
      if (!result.success) return;
      setData(result.data);
    });
  }, [params]);

  const handleSearch = useCallback((search: string) => {
    setParams((p) => ({ ...p, search: search || undefined, cursor: undefined }));
  }, []);

  const handleStatusFilter = useCallback((status: "ALL" | "PUBLISHED" | "DRAFT") => {
    setStatusVal(status);
    setParams((p) => ({ ...p, status: status === "ALL" ? undefined : status, cursor: undefined }));
  }, []);

  const handleActiveFilter = useCallback((val: "ALL" | "ACTIVE" | "INACTIVE") => {
    setActiveVal(val);
    setParams((p) => ({ ...p, isActive: val === "ALL" ? undefined : val === "ACTIVE", cursor: undefined }));
  }, []);

  const handleSort = useCallback((sortBy: GetEmployeesParams["sortBy"]) => {
    setParams((p) => {
      const sortOrder = p.sortBy === sortBy && p.sortOrder === "asc" ? "desc" : "asc";
      return { ...p, sortBy, sortOrder, cursor: undefined };
    });
  }, []);

  const handleNextPage = useCallback(() => {
    if (data.nextCursor) setParams((p) => ({ ...p, cursor: data.nextCursor ?? undefined }));
  }, [data.nextCursor]);

  const handlePreviousPage = useCallback(() => {
    setParams((p) => ({ ...p, cursor: undefined }));
  }, []);

  const handleViewDetails = useCallback((id: string) => {
    setSelectedProfileId(id);
    setIsDetailsOpen(true);
  }, []);

  const debRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onSearchChange = (val: string) => {
    setSearchVal(val);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => handleSearch(val), 400);
  };

  const activeFilterCount = [
    searchVal,
    statusVal !== "ALL" ? "1" : "",
    activeVal !== "ALL" ? "1" : "",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchVal("");
    setStatusVal("ALL");
    setActiveVal("ALL");
    setParams({ take: 20, sortBy: "displayOrder", sortOrder: "asc" });
  };

  return (
    <>
      <div className="h-full rounded-2xl border border-border/50 bg-card overflow-hidden flex flex-col shadow-sm">

        {/* ── FILTER BAR ──────────────────────────────────────────────────── */}
        <div className="px-4 pt-3.5 pb-2 border-b border-border/40 shrink-0 space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-48 max-w-sm">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              {isPending && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-[#7b57fc] border-t-transparent animate-spin" />
              )}
              <Input
                value={searchVal}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by name, email or position…"
                className="pl-8 pr-7 h-8 text-sm bg-muted/40 border-border/50 rounded-lg focus:bg-background focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20 transition-all"
              />
              {searchVal && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Status filter */}
            <Select value={statusVal} onValueChange={(v) => handleStatusFilter(v as typeof statusVal)}>
              <SelectTrigger className="w-32 h-8 text-xs bg-muted/40 border-border/50 rounded-lg">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>

            {/* Active filter */}
            <Select value={activeVal} onValueChange={(v) => handleActiveFilter(v as typeof activeVal)}>
              <SelectTrigger className="w-32 h-8 text-xs bg-muted/40 border-border/50 rounded-lg">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All users</SelectItem>
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
            <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-border/40">
              <SortBtn field="fullName" label="Name" current={params.sortBy!} order={params.sortOrder!} onClick={handleSort} />
              <SortBtn field="displayOrder" label="Order" current={params.sortBy!} order={params.sortOrder!} onClick={handleSort} />
              <SortBtn field="createdAt" label="Created" current={params.sortBy!} order={params.sortOrder!} onClick={handleSort} />
            </div>

            {/* Count + refresh + add */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground tabular-nums hidden md:block">
                {data.total.toLocaleString()} employee{data.total !== 1 ? "s" : ""}
              </span>
              <button
                onClick={handleRefresh}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Refresh"
              >
                <RefreshCw size={11} className={isPending ? "animate-spin" : ""} />
              </button>
              {/* ── ADD EMPLOYEE BUTTON ── */}
              <Button
                size="sm"
                onClick={() => setIsPromoteOpen(true)}
                className="h-8 text-xs rounded-lg bg-[#7b57fc] hover:bg-[#6a48eb] text-white gap-1.5 px-3"
              >
                <UserPlus size={12} />
                Add employee
              </Button>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <SlidersHorizontal size={12} className="text-muted-foreground" />
              {statusVal !== "ALL" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#7b57fc]/10 text-[#7b57fc] ring-1 ring-[#7b57fc]/20">
                  Status: {statusVal}
                  <button onClick={() => handleStatusFilter("ALL")}><X size={9} /></button>
                </span>
              )}
              {activeVal !== "ALL" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#7b57fc]/10 text-[#7b57fc] ring-1 ring-[#7b57fc]/20">
                  User: {activeVal}
                  <button onClick={() => handleActiveFilter("ALL")}><X size={9} /></button>
                </span>
              )}
              {searchVal && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#7b57fc]/10 text-[#7b57fc] ring-1 ring-[#7b57fc]/20">
                  "{searchVal}"
                  <button onClick={() => onSearchChange("")}><X size={9} /></button>
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {data.total} employee{data.total !== 1 ? "s" : ""} found
              </span>
            </div>
          )}

          {/* Column headers */}
          <div className="hidden lg:grid grid-cols-[1.5rem_2.25rem_1fr_7rem_6rem_6rem_4rem_2.25rem] items-center gap-3 pt-1">
            {["", "", "Employee", "Position", "Status", "User", "Order", ""].map((h, i) => (
              <span key={i} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center first:text-left last:text-right">
                {h}
              </span>
            ))}
          </div>
        </div>

        {/* ── EMPLOYEE LIST ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0 relative">
          <AnimatePresence>
            {isPending && data.employees.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-10 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {isPending && data.employees.length === 0 ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : data.employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 py-16">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/50"
              >
                <Users2 size={26} className="text-muted-foreground/40" />
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-foreground/70">No employees found</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
              </div>
              {activeFilterCount > 0 ? (
                <button onClick={clearFilters} className="text-xs text-[#7b57fc] hover:underline">
                  Clear all filters
                </button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsPromoteOpen(true)}
                  className="h-8 text-xs rounded-lg bg-[#7b57fc] hover:bg-[#6a48eb] text-white gap-1.5 mt-1"
                >
                  <UserPlus size={12} />
                  Add first employee
                </Button>
              )}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {data.employees.map((emp, i) => (
                <motion.div
                  key={emp.id}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: i * 0.02, type: "spring", stiffness: 400, damping: 35 }}
                  onClick={() => handleViewDetails(emp.id)}
                  className="group flex items-center gap-3 px-4 py-3.5 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  {/* Drag handle */}
                  <div className="hidden lg:flex shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" onClick={(e) => e.stopPropagation()}>
                    <GripVertical size={14} />
                  </div>

                  {/* Avatar */}
                  <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Avatar className="h-9 w-9 ring-2 ring-border/40">
                      <AvatarImage src={emp.photoUrl ?? emp.user.avatarUrl ?? undefined} />
                      <AvatarFallback className={cn("text-xs font-bold", avatarColor(emp.user.email))}>
                        {getInitials(emp.user.fullName, emp.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                      emp.status === "PUBLISHED" ? "bg-emerald-400" : "bg-amber-400",
                    )} />
                  </div>

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {emp.user.fullName ?? (
                        <span className="italic text-muted-foreground">No name</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{emp.user.email}</p>
                  </div>

                  {/* Position */}
                  <div className="hidden lg:block w-28 shrink-0">
                    <p className="text-xs text-foreground/80 truncate text-center">
                      {emp.positionEn ?? <span className="text-muted-foreground/50 italic">—</span>}
                    </p>
                    {emp.positionAr && (
                      <p className="text-[10px] text-muted-foreground/60 truncate text-center mt-0.5" dir="rtl">
                        {emp.positionAr}
                      </p>
                    )}
                  </div>

                  {/* Publish status */}
                  <div className="hidden lg:flex justify-center w-24 shrink-0">
                    <PublishBadge status={emp.status} />
                  </div>

                  {/* User active status */}
                  <div className="hidden lg:flex justify-center w-24 shrink-0">
                    <UserActiveBadge isActive={emp.user.isActive} />
                  </div>

                  {/* Display order */}
                  <div className="hidden lg:flex justify-center w-16 shrink-0">
                    <span className="text-xs text-muted-foreground tabular-nums font-mono">
                      #{emp.displayOrder}
                    </span>
                  </div>

                  {/* Actions */}
                  <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <EmployeeActionsMenu
                      employee={emp}
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
            employees
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
              {isPending ? <Loader2 size={13} className="animate-spin" /> : <ChevronLeft size={14} />}
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
              {isPending ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Details dialog ─────────────────────────────────────────────────── */}
      <EmployeeDetailsDialog
        profileId={selectedProfileId}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onRefresh={handleRefresh}
      />

      {/* ── Promote user dialog ────────────────────────────────────────────── */}
      <PromoteUserDialog
        open={isPromoteOpen}
        onOpenChange={setIsPromoteOpen}
        onSuccess={handleRefresh}
      />
    </>
  );
}